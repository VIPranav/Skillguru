# SkillPath AI

SkillPath AI is a demo-ready learning platform for personalized career roadmaps. It analyzes a learner profile, compares it to a target role, generates a roadmap with curated resources, administers knowledge checks, and adjusts the plan when performance or goals change.

## Features

- Profile-based skill analysis
- Role gap comparison against curated canonical skill data
- Personalized learning roadmap with real resource links
- Automated quiz generation and scoring
- Mentor guidance and remediation flows
- Goal switching with non-reload dashboard updates
- Agent activity log to visualize collaboration
- LocalStorage persistence in the browser

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Add the provider keys and models you want to use (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`). Set `LLM_PROVIDER_ORDER` and `LLM_STRATEGY` to control failover.
3. Install dependencies:

```bash
npm install
```

4. Run the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Demo flow

- Click "Load demo learner".
- Review the dashboard and skill gap view.
- Open the Roadmap tab and launch a milestone assessment.
- Use "Simulate low score (demo)" to trigger remediation.
- Switch the target role to "Data Analyst" to validate adaptive planning.

## Notes

- The app intentionally avoids auth, databases, and PDF parsing as requested.
- All LLM calls happen server-side and key material stays in `.env.local`.
- The UI stores state in localStorage under `skillpath_learner_v1`.
