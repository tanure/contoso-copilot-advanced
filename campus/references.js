export const onboarding = [
  ['maya', 'Welcome to Contoso Engineering. We’re a fictional team building a pension platform, and we’re bringing GitHub Copilot into our day-to-day work. You’re joining us for the rollout.'],
  ['leo', 'We’ll start by setting up a private workshop repo. Then we’ll compare models, delegate work to agents, control what tools they can use, give them the right context, and review a release.'],
  ['maya', 'Pick a room and follow the conversation one turn at a time. When it’s your turn, do the work in GitHub or VS Code, then check it off here. Use synthetic data only, and review what agents do before approving it.'],
];

export const crewReview = {
  '00': ['maya', 'Congratulations, teammate! You went from a new workspace to your first Copilot session. Keep manual approvals on when you want to see exactly what an agent is asking to do.'],
  A1: ['theo', 'You compared models against a real result. Next time someone asks for the biggest model, try the smallest one that can meet the bar, and verify it on the task.'],
  A2: ['nora', 'You gave each agent a clear job and kept a person in charge of the handoff. Keep that approval gate when a plan turns into real changes.'],
  A3: ['iris', 'You saw why permission to call a tool isn’t permission to follow what it returns. Keep tool access narrow and check that your guardrails deny the right actions.'],
  A4: ['mina', 'You tested whether better context actually improved the answer. Keep instructions short, scoped to where they apply, and backed by a check.'],
  A5: ['alex', 'You followed the same verified artifact from build to promotion. Build once, check the digest, and leave the final release decision with a person. See you on the next release!'],
};

export const references = {
  '00/repo': {
    notes: [
      'Use the template your coach shared. If they didn’t supply another link, use the public workshop template below.',
      'After creating the repository, open Actions and look for the first CI run. It usually turns green within about a minute. You need repository owner or admin access for later labs.',
    ],
    links: [['Open the workshop template', 'https://github.com/tanure/contoso-copilot-advanced']],
  },
  '00/codespace': {
    notes: [
      'Open Codespaces from your own private repo, not from the upstream template. The first build can take a couple of minutes.',
      'If Desktop is blocked, continue in the browser. If Codespaces is disabled, use the dev container locally or ask your coach which repository owner to use.',
    ],
    links: [['Create a Codespace: GitHub Docs', 'https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository']],
  },
  '00/verify': {
    notes: [
      'The environment check should find Node.js 24+, node:sqlite, Git, and passing unit tests. Warnings for optional tools are fine.',
      'If port 3000 doesn’t open automatically, go to Ports and select Open in Browser beside port 3000. You should see eight synthetic members.',
    ],
  },
  '00/controls': {
    notes: ['The harness and mode pickers are in the Chat bottom bar. The model picker is inside the chat box. Permissions are in the mode menu. Leave terminal sandboxing unchanged.'],
    images: [
      ['Choose the Copilot harness', 'screenshots/00-harness-picker.png'],
      ['Choose Interactive mode', 'screenshots/00-mode-picker.png'],
      ['Choose Manual permissions', 'screenshots/00-permissions-picker.png'],
      ['Check the Chat bottom bar and model picker', 'screenshots/00-chat-input.png'],
    ],
    links: [['Chat in VS Code', 'https://code.visualstudio.com/docs/chat/chat-overview']],
  },
  '00/first-chat': { notes: ['Expand the read and search tool calls while Copilot answers. Choose Skip or Deny if it asks to edit files or run commands. Compare its file names with the tool-call evidence.'] },
  'A1/picker': {
    images: [['Find the model picker in the chat input', 'screenshots/00-chat-input.png']],
    links: [['GitHub’s supported models', 'https://docs.github.com/en/copilot/reference/ai-models/supported-models']],
  },
  'A1/evaluate': { notes: ['Use fresh chats to keep the second model from seeing the first result. Score each edge-case return value against the pension function, then record hallucinations, latency, and relative AI credits.'] },
  'A2/agents': { notes: ['Copy each template into its own .agent.md file. Keep the names exactly as written: Feature Lead, Implementer, Pension Analyst, and Reviewer. The lead pauses before handing off changes.'] },
  'A3/baseline': { images: [['Six gates for tool governance', 'governance-layers.svg']] },
  'A4/repo-instructions': { images: [['Which Copilot customization should I use?', 'customization-map.svg']] },
  'A5/promote': { notes: ['Check that each promotion points to the exact digest from the build. If attestations or required reviewers are blocked on your personal repository, follow the instructor demo rather than weakening the gate.'] },
};
