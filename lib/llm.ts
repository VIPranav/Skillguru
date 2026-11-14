import { AsyncLocalStorage } from "node:async_hooks";
import type { ZodTypeAny } from "zod";

export type LlmCallArgs = {
  system: string;
  user: string;
  schema: ZodTypeAny;
};

export type ProviderName = "gemini" | "groq";
type LlmMode = "live" | "mock";

type ProviderConfig = {
  apiKey: string | undefined;
  model: string | undefined;
  baseUrl: string;
  keyEnv: string;
  modelEnv: string;
};

type ProviderCallArgs = {
  system: string;
  user: string;
  apiKey: string;
  model: string;
  baseUrl: string;
};

type ProviderContext = {
  provider: string | null;
};

export type LlmHealth = {
  mode: LlmMode;
  providers: {
    name: ProviderName;
    configured: boolean;
    cooldownUntil: number | null;
  }[];
};

const REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_COOLDOWN_SECONDS = 60;
const MAX_COOLDOWN_SECONDS = 120;

const providerContext = new AsyncLocalStorage<ProviderContext>();
const cooldowns = new Map<ProviderName, number>();
const disabledProviders = new Set<ProviderName>();
let roundRobinCounter = 0;

export class LLMUnavailableError extends Error {
  readonly failures: string[];

  constructor(message: string, failures: string[] = []) {
    super(message);
    this.name = "LLMUnavailableError";
    this.failures = failures;
  }
}

class LlmHttpError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(status: number, retryAfterSeconds?: number) {
    super(`LLM provider responded with HTTP ${status}`);
    this.name = "LlmHttpError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

class LlmTimeoutError extends Error {
  constructor() {
    super(`LLM provider did not respond within ${REQUEST_TIMEOUT_MS / 1000}s`);
    this.name = "LlmTimeoutError";
  }
}

export function isMockMode(): boolean {
  return (process.env.LLM_MODE ?? "live").trim().toLowerCase() === "mock";
}

function getMode(): LlmMode {
  return isMockMode() ? "mock" : "live";
}

function getProviderConfig(name: ProviderName): ProviderConfig {
  if (name === "gemini") {
    return {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      baseUrl: "",
      keyEnv: "GEMINI_API_KEY",
      modelEnv: "GEMINI_MODEL",
    };
  }

  return {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
  };
}

function getProviderOrder(): ProviderName[] {
  const raw = process.env.LLM_PROVIDER_ORDER ?? "gemini,groq";
  const providers = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is ProviderName => value === "gemini" || value === "groq");

  const unique = Array.from(new Set(providers));
  return unique.length > 0 ? unique : ["gemini", "groq"];
}

function getOrderedProviders(): ProviderName[] {
  const order = getProviderOrder();
  const strategy = (process.env.LLM_STRATEGY ?? "roundrobin").toLowerCase();

  if (strategy === "failover" || order.length <= 1) {
    return order;
  }

  const start = roundRobinCounter % order.length;
  roundRobinCounter += 1;
  return [...order.slice(start), ...order.slice(0, start)];
}

function stripMarkdownJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

function extractFirstJsonObject(text: string) {
  const reduced = stripMarkdownJson(text);
  const start = reduced.indexOf("{");
  if (start === -1) {
    throw new Error("LLM response had no JSON object");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < reduced.length; index += 1) {
    const char = reduced[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return reduced.slice(start, index + 1);
      }
    }
  }

  throw new Error("LLM response had incomplete JSON object");
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }

  return undefined;
}

function resolveCooldownMs(retryAfterSeconds?: number) {
  const seconds = retryAfterSeconds === undefined ? DEFAULT_COOLDOWN_SECONDS : retryAfterSeconds;
  const capped = Math.min(Math.max(seconds, 0), MAX_COOLDOWN_SECONDS);
  return capped * 1000;
}

function markProviderUsed(provider: ProviderName) {
  const store = providerContext.getStore();
  if (store) {
    store.provider = provider;
  }
}

function attachProvider<T>(value: T, provider: ProviderName): T {
  if (value !== null && typeof value === "object") {
    try {
      Object.defineProperty(value, "provider", {
        value: provider,
        enumerable: false,
        configurable: true,
      });
    } catch {
      return value;
    }
  }
  return value;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new LlmTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new LlmHttpError(response.status, parseRetryAfter(response.headers.get("retry-after")));
  }

  return response.json();
}

async function callGemini({ system, user, apiKey, model }: ProviderCallArgs): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = await postJson(
    url,
    { "x-goog-api-key": apiKey },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    },
  );

  const text = (payload as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text) {
    throw new Error("Gemini response did not contain text");
  }

  return text;
}

async function callGroq({ system, user, apiKey, model, baseUrl }: ProviderCallArgs): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const payload = await postJson(
    url,
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    },
  );

  const text = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text) {
    throw new Error("Groq response did not contain text");
  }

  return text;
}

function callProvider(name: ProviderName, args: ProviderCallArgs): Promise<string> {
  return name === "gemini" ? callGemini(args) : callGroq(args);
}

function parseAndValidate(text: string, schema: ZodTypeAny) {
  const jsonText = extractFirstJsonObject(text);
  const parsed = JSON.parse(jsonText);
  return schema.parse(parsed) as unknown;
}

export async function trackLlmProvider<T>(run: () => Promise<T>): Promise<{ result: T; provider: string | null }> {
  const store: ProviderContext = { provider: null };
  const result = await providerContext.run(store, run);
  return { result, provider: store.provider };
}

export async function callLLM({ system, user, schema }: LlmCallArgs): Promise<unknown> {
  if (getMode() !== "live") {
    throw new LLMUnavailableError('LLM_MODE is not "live"; live LLM calls are disabled.');
  }

  const providerOrder = getOrderedProviders();
  const failures: string[] = [];

  for (const name of providerOrder) {
    const config = getProviderConfig(name);

    if (!config.apiKey || !config.model) {
      failures.push(`${name}: not configured`);
      continue;
    }

    if (disabledProviders.has(name)) {
      failures.push(`${name}: disabled`);
      continue;
    }

    const cooldownUntil = cooldowns.get(name) ?? 0;
    if (cooldownUntil > Date.now()) {
      failures.push(`${name}: cooldown`);
      continue;
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const attemptUser = attempt === 0
        ? user
        : `${user}\n\nReturn ONLY valid JSON matching the schema, no prose`;

      let text: string;
      try {
        text = await callProvider(name, {
          system,
          user: attemptUser,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
        });
      } catch (error) {
        if (error instanceof LlmHttpError) {
          if (error.status === 429) {
            cooldowns.set(name, Date.now() + resolveCooldownMs(error.retryAfterSeconds));
            failures.push(`${name}: HTTP 429`);
          } else if (error.status === 400 || error.status === 401 || error.status === 403) {
            disabledProviders.add(name);
            console.warn(
              `[llm] Disabling provider "${name}" for this process after HTTP ${error.status}. Check ${config.keyEnv} and ${config.modelEnv}.`,
            );
            failures.push(`${name}: HTTP ${error.status}`);
          } else {
            failures.push(`${name}: HTTP ${error.status}`);
          }
        } else if (error instanceof LlmTimeoutError) {
          failures.push(`${name}: timeout`);
        } else {
          failures.push(`${name}: request failed`);
        }
        break;
      }

      try {
        const parsed = parseAndValidate(text, schema);
        markProviderUsed(name);
        return attachProvider(parsed, name);
      } catch {
        if (attempt === 0) {
          continue;
        }
        failures.push(`${name}: invalid JSON`);
      }
    }
  }

  throw new LLMUnavailableError(
    failures.length > 0
      ? `All LLM providers are unavailable (${failures.join(", ")}).`
      : "No LLM provider is configured or available.",
    failures,
  );
}

export function getLlmHealth(): LlmHealth {
  const now = Date.now();

  return {
    mode: getMode(),
    providers: getProviderOrder().map((name) => {
      const config = getProviderConfig(name);
      const cooldownUntil = cooldowns.get(name);

      return {
        name,
        configured: Boolean(config.apiKey && config.model),
        cooldownUntil: typeof cooldownUntil === "number" && cooldownUntil > now ? cooldownUntil : null,
      };
    }),
  };
}
