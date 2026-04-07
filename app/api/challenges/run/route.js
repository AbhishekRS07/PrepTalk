import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const COMPILERS = {
  javascript: "nodejs-20.17.0",
  python:     "cpython-3.12.7",
};

function buildJSHarness(userCode, testCases) {
  return `
${userCode}

(function() {
  const __cases = ${JSON.stringify(testCases)};
  const __results = __cases.map(tc => {
    try {
      const __got = solution(...tc.args);
      const __exp = tc.expected;
      let __passed;
      if (typeof __exp === "number" && typeof __got === "number") {
        __passed = Math.abs(__got - __exp) < 0.01;
      } else if (Array.isArray(__exp) && Array.isArray(__got)) {
        __passed = JSON.stringify(__got) === JSON.stringify(__exp);
      } else if (typeof __exp === "object" && __exp !== null) {
        __passed = JSON.stringify(__got) === JSON.stringify(__exp);
      } else {
        __passed = __got === __exp;
      }
      return { label: tc.label, passed: __passed, got: __got, expected: __exp, explanation: tc.explanation || "" };
    } catch (e) {
      return { label: tc.label, passed: false, got: "Error: " + e.message, expected: tc.expected, explanation: tc.explanation || "" };
    }
  });
  console.log(JSON.stringify(__results));
})();
`.trim();
}

function buildPythonHarness(userCode, testCases) {
  return `
${userCode}

import json as __json

__cases = ${JSON.stringify(testCases)}
__results = []
for __tc in __cases:
    try:
        __got = solution(*__tc['args'])
        __exp = __tc['expected']
        if isinstance(__exp, (int, float)) and isinstance(__got, (int, float)):
            __passed = abs(__got - __exp) < 0.01
        elif isinstance(__exp, list) and isinstance(__got, list):
            __passed = __got == __exp
        else:
            __passed = __got == __exp
        __results.append({
            'label': __tc['label'],
            'passed': bool(__passed),
            'got': __got,
            'expected': __exp,
            'explanation': __tc.get('explanation', '')
        })
    except Exception as __e:
        __results.append({
            'label': __tc['label'],
            'passed': False,
            'got': 'Error: ' + str(__e),
            'expected': __tc['expected'],
            'explanation': __tc.get('explanation', '')
        })
print(__json.dumps(__results))
`.trim();
}

export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { code, language, testCases } = await req.json();
  if (!code || !language || !testCases?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const compiler = COMPILERS[language];
  if (!compiler) return NextResponse.json({ error: "Unsupported language" }, { status: 400 });

  const harness = language === "python"
    ? buildPythonHarness(code, testCases)
    : buildJSHarness(code, testCases);

  try {
    const res = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compiler, code: harness }),
    });

    const wandbox = await res.json();
    const stdout = wandbox.program_output || "";
    const stderr = wandbox.compiler_error || wandbox.program_error || "";

    if (stderr && !stdout) {
      // Compilation or runtime error before any output
      return NextResponse.json({
        results: testCases.map(tc => ({
          label: tc.label,
          passed: false,
          got: "Compile/runtime error",
          expected: tc.expected,
          explanation: tc.explanation || "",
        })),
        compileError: stderr,
      });
    }

    // Parse the JSON results from stdout
    const jsonLine = stdout.trim().split("\n").find(l => l.startsWith("["));
    if (!jsonLine) {
      return NextResponse.json({
        results: testCases.map(tc => ({
          label: tc.label, passed: false,
          got: stdout || stderr || "No output",
          expected: tc.expected, explanation: tc.explanation || "",
        })),
        compileError: stderr || undefined,
      });
    }

    const results = JSON.parse(jsonLine);
    return NextResponse.json({ results, compileError: stderr || undefined });
  } catch (err) {
    console.error("Challenge run error:", err);
    return NextResponse.json({ error: "Failed to run tests" }, { status: 500 });
  }
}
