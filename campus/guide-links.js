// GitHub strips the clock glyph but retains its variation selector in these anchors.
const clock = '\ufe0f';
const headings = {
  '00': [
    ['create-your-own-repository', 2],
    ['start-a-codespace-and-open-it-in-vs-code-desktop', 4],
    ['verify-the-environment-and-run-the-app', 3],
    ['learn-the-4-controls-of-every-chat', 3],
    ['your-first-question-to-an-agent', 3],
  ],
  A1: [
    ['explore-the-model-picker', 3],
    ['evaluate-two-models-with-evidence', 10],
    ['tour-the-enterprise-configuration', 6],
    ['build-engineering-control-1-a-guardrail-hook', 15],
    ['build-engineering-control-2-a-branch-ruleset', 6],
  ],
  A2: [
    ['read-bl-02-and-create-a-branch', 3],
    ['try-the-built-in-plan-agent', 5],
    ['create-your-4-custom-agents', 8],
    ['verify-discovery', 2],
    ['let-the-feature-lead-ship-bl-02', 15],
    ['multi-perspective-review-in-parallel', 5],
    ['observe-count-calls-and-credits', 3],
    ['commit-and-open-a-pull-request', 4],
  ],
  A3: [
    ['check-your-starting-point', 2],
    ['add-the-microsoft-learn-mcp-server-remote', 5],
    ['look-inside-the-protocol', 5],
    ['register-pensionrules-with-an-allow-list', 5],
    ['verify-the-tools-really-run', 4],
    ['gate-drill-allow-list-2-and-hook-5', 8],
    ['prompt-injection-drill', 5],
    ['gate-3-a-least-privilege-pension-advisor', 5],
    ['observability-your-audit-report', 4],
    ['enterprise-governance-gate-6', 2, '---look--discuss'],
  ],
  A4: [
    ['run-the-baseline-experiment', 10],
    ['write-the-repo-wide-instructions', 5],
    ['add-path-specific-instructions', 4],
    ['prove-the-instructions-load', 3],
    ['package-the-workflow-as-an-agent-skill', 8],
    ['re-run-bl-03-with-context-and-score-again', 10],
    ['keep-the-context-clean-memory--hygiene', 3],
    ['pull-in-external-knowledge-on-demand', 2],
  ],
  A5: [
    ['create-the-backlog-issues-and-reproduce-the-bug', 5],
    ['read-the-cloud-agents-setup-file', 3],
    ['delegate-bl-01-to-the-copilot-cloud-agent', 5],
    ['write-the-ci-doctor-agentic-workflow', 12],
    ['break-ci-on-purpose-and-let-the-doctor-diagnose-it', 7],
    ['review-and-merge-the-cloud-agents-pr', 8],
    ['release-pipeline-build-once-attest-human-gate', 10],
  ],
};

export function stepAnchor(roomId, index) {
  const [heading, minutes, suffix = ''] = headings[roomId][index];
  return `step-${index + 1}--${heading}-${clock}-${minutes}-min${suffix}`;
}
