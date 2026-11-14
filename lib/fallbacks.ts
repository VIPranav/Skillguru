import type { InterviewTurn, Milestone, SkillMapItem } from "@/lib/types";

export function isDemoScenario(
  profile: { name?: string; education?: string; claimedSkills?: string[]; certifications?: string[]; projects?: string[] },
  goalRoleId?: string,
) {
  const goalMatches = !goalRoleId || goalRoleId === "full-stack-developer";
  const nameMatches = profile.name?.toLowerCase().includes("demo") ?? false;
  return nameMatches && goalMatches;
}

export function getDemoSkillMap(): SkillMapItem[] {
  return [
    { name: "Python", level: 4, evidence: "Explained Flask routing, password hashing, and validation in the interview.", confidence: "high" },
    { name: "SQL", level: 3, evidence: "Described basic filtering and joins for the blog data.", confidence: "medium" },
    { name: "HTML", level: 1, evidence: "Recognized HTML as page structure but could not explain semantic markup.", confidence: "low" },
    { name: "CSS", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "JavaScript", level: 0, evidence: "Said they have not used JavaScript.", confidence: "low" },
    { name: "React", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "Node.js", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "Git", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "REST APIs", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "TypeScript", level: 0, evidence: "Not assessed", confidence: "low" },
    { name: "System Design", level: 0, evidence: "Not assessed", confidence: "low" },
  ];
}

export const demoInterviewAnswers = [
  "In my Flask blog I used route functions to receive a post request, validate the fields, then save the post through the database model. I kept the route thin and put the query in a helper. I would hash passwords with Werkzeug and compare against the stored hash at login.",
  "I used SQL to filter posts by author and joined users to posts so the page could show the author's name. I haven't done much query tuning yet.",
  "HTML gives the page its structure. I know headings and links, but I'm not sure when to use the different semantic elements.",
  "I don't know JavaScript yet.",
  "I haven't used React yet, so I can't describe its rendering flow.",
  "I haven't used Node.js yet.",
];

export function getDemoInterviewQuestion(questionIndex: number, goalTitle: string) {
  const questions = [
    `Welcome! We'll have a short conversation about your path toward ${goalTitle}. In your Flask blog, how did a request to create a post move through your app?`,
    "How would you query posts with their authors' names, and what would you do if the page became slow?",
    "How would you structure a blog post page in HTML so its content is clear and accessible?",
    "If you wanted a button to save a draft without reloading the page, what would you use in the browser?",
    "How would you split a blog page into reusable pieces if you were building it with React?",
    "What would you check if a Flask endpoint worked locally but failed after deployment?",
    "Thanks for walking me through your experience. I’m starting the analysis now.",
  ];
  return questions[Math.min(questionIndex, questions.length - 1)];
}

export function getDemoInterviewTurns(): InterviewTurn[] {
  const targets = ["Python", "SQL", "HTML", "JavaScript", "React", "Node.js"];
  const now = Date.now();
  return targets.flatMap((targetSkill, index) => [
    { id: `demo-q-${index}`, role: "mentor" as const, targetSkill, text: getDemoInterviewQuestion(index + 1, "Full Stack Developer"), at: new Date(now + index * 2).toISOString() },
    { id: `demo-a-${index}`, role: "learner" as const, text: demoInterviewAnswers[index], at: new Date(now + index * 2 + 1).toISOString() },
  ]);
}

export function getDemoPriorityOrder(): string[] {
  return ["JavaScript", "React", "Node.js", "REST APIs", "CSS", "Git", "SQL", "HTML"];
}

export function getDemoRoadmap(): Milestone[] {
  return [
    {
      id: "js-foundations",
      title: "JavaScript Foundations",
      skill: "JavaScript",
      targetLevel: 3,
      resourceIds: ["js-guide", "freecodecamp-js"],
      exercise: "Build a small DOM-based task manager in vanilla JavaScript.",
      estHours: 8,
      status: "todo",
    },
    {
      id: "react-core",
      title: "React Core Concepts",
      skill: "React",
      targetLevel: 3,
      resourceIds: ["react-docs", "react-tutorial"],
      exercise: "Create a React dashboard with state and reusable components.",
      estHours: 10,
      status: "todo",
    },
    {
      id: "node-api",
      title: "Node.js and REST APIs",
      skill: "Node.js",
      targetLevel: 3,
      resourceIds: ["node-docs", "node-guide", "rest-apis"],
      exercise: "Build a minimal API server with CRUD routes and JSON responses.",
      estHours: 10,
      status: "todo",
    },
  ];
}

export function getDemoRemediationRoadmap(): Milestone[] {
  return [
    {
      id: "js-remediation",
      title: "JavaScript Remediation",
      skill: "JavaScript",
      targetLevel: 3,
      resourceIds: ["js-guide"],
      exercise: "Review arrays, async logic, and DOM event handling.",
      estHours: 5,
      status: "remediation",
    },
    {
      id: "react-remediation",
      title: "React Remediation",
      skill: "React",
      targetLevel: 3,
      resourceIds: ["react-docs"],
      exercise: "Practice component state and props through a step-by-step app.",
      estHours: 5,
      status: "remediation",
    },
  ];
}

export function getDemoQuiz() {
  return [
    {
      id: "js-q1",
      question: "Which method is commonly used to add a new DOM element to the page?",
      options: ["createElement()", "render()", "map()", "fetch()"],
      answerIndex: 0,
      explanation: "document.createElement() creates DOM nodes that can then be appended to the page.",
    },
    {
      id: "js-q2",
      question: "What does React state represent?",
      options: ["A constant value", "Data that changes over time in a component", "A CSS class", "An HTML tag"],
      answerIndex: 1,
      explanation: "State stores data that can change in response to user actions or effects.",
    },
    {
      id: "js-q3",
      question: "Which Node.js core module is used to create a web server?",
      options: ["http", "fs", "path", "url"],
      answerIndex: 0,
      explanation: "The http module provides HTTP server and client functionality in Node.js.",
    },
    {
      id: "js-q4",
      question: "Which of these is a valid React hook?",
      options: ["useEffect", "useModel", "useRoute", "useView"],
      answerIndex: 0,
      explanation: "useEffect is a built-in hook for side effects in React components.",
    },
    {
      id: "js-q5",
      question: "What does a REST API typically return?",
      options: ["A CSS file", "JSON or other structured data", "A static image", "A binary executable"],
      answerIndex: 1,
      explanation: "REST APIs commonly exchange JSON payloads between clients and servers.",
    },
  ];
}

export function getDemoMentorFeedback(): { message: string; action: "continue" | "remediate" | "advance"; weakTopics: string[] } {
  return {
    message: "You are close to the target role. Focus on JavaScript fundamentals and React component patterns before tackling more advanced full-stack work.",
    action: "remediate",
    weakTopics: ["JavaScript", "React", "Node.js"],
  };
}
