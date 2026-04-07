import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runPrompt } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";

const LEVEL_LABELS = {
  "0": "Fresher (no experience)",
  "1": "Junior (1–2 years)",
  "3": "Mid-level (3–5 years)",
  "5": "Senior (5+ years)",
};

const LEVEL_DIFFICULTY = {
  "0": "simple requirements, 3-5 rules, straightforward calculations",
  "1": "moderate complexity, 6-8 rules, some edge cases, basic OOP",
  "3": "complex business rules, 8-12 rules, multiple edge cases, state management",
  "5": "highly complex, 12+ rules, tricky edge cases, design pattern awareness, scalability considerations",
};

export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { category, level } = await req.json();
  if (!category || !level) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const levelLabel = LEVEL_LABELS[level] || LEVEL_LABELS["3"];
  const difficulty = LEVEL_DIFFICULTY[level] || LEVEL_DIFFICULTY["3"];

  const prompt = `You are creating a practical coding challenge for software engineering interview prep.

Category: ${category}
Candidate level: ${levelLabel}
Complexity: ${difficulty}

The challenge should be a real-world programming problem — NOT a data structure or algorithm puzzle.
Think: price calculators, booking systems, inventory management, OOP design, state machines, etc.
The problem should have clear rules, multiple scenarios, and test edge cases.

CRITICAL RULES:
1. The main function MUST be named exactly "solution"
2. Test case "args" is an array of arguments passed directly to solution(...args)
3. Expected values MUST be mathematically correct — double-check your arithmetic
4. For prices/money: round to 2 decimal places
5. Provide 5–7 test cases covering normal cases AND edge cases

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "title": "Problem title",
  "category": "${category}",
  "difficulty": "Easy|Medium|Hard",
  "description": "2-3 sentence overview of the problem",
  "requirements": [
    "Specific rule 1",
    "Specific rule 2"
  ],
  "functionSignature": "solution(param1, param2, ...)",
  "paramDescriptions": {
    "param1": "what this represents",
    "param2": "what this represents"
  },
  "starterCode": {
    "javascript": "function solution(param1, param2) {\\n  // Your code here\\n}",
    "python": "def solution(param1, param2):\\n    # Your code here\\n    pass"
  },
  "testCases": [
    {
      "label": "Descriptive scenario label",
      "args": [...],
      "expected": value,
      "explanation": "Step-by-step why this is the expected result"
    }
  ],
  "hints": [
    "Hint 1 — approach suggestion",
    "Hint 2 — edge case to watch",
    "Hint 3 — implementation tip"
  ]
}`;

  try {
    const raw = await runPrompt(prompt);
    const parsed = JSON.parse(cleanJson(raw));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Challenge generation error:", err);
    return NextResponse.json({ error: "Failed to generate challenge. Please try again." }, { status: 500 });
  }
}
