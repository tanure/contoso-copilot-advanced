import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { stepAnchor } from '../campus/guide-links.js';
import { parseLocation, restoreProgress, resumeAt, roomProgress, stepKey } from '../campus/progress.js';
import { people, rooms } from '../campus/stories.js';
import { onboarding, references } from '../campus/references.js';
import { buildRoomGuide } from './campus/build.mjs';

test('every story step maps to an original lab step, with a speaker and actionable content', async () => {
  for (const room of rooms) {
    const markdown = await readFile(new URL(`../labs/${room.slug}/README.md`, import.meta.url), 'utf8');
    const headings = [...markdown.matchAll(/^## (Step \d+ — .+)$/gm)].map((match) => match[1]);
    assert.equal(room.scenes.length, headings.length, room.slug);
    assert.equal(new Set(room.scenes.map(({ id }) => id)).size, room.scenes.length, room.slug);
    for (const [index, scene] of room.scenes.entries()) {
      const expected = headings[index].toLowerCase().replace(/[^a-z0-9\uFE0F -]/g, '').replaceAll(' ', '-');
      assert.equal(stepAnchor(room.id, index), expected, `${room.id}/${scene.id}`);
      assert.ok(scene.tasks.length && scene.evidence, `${room.id}/${scene.id} needs a task and checkpoint`);
      assert.ok(scene.dialogue.every(([speaker, line]) => Object.hasOwn(people, speaker) && room.cast.includes(speaker) && line),
        `${room.id}/${scene.id} has an unknown speaker or missing dialogue`);
    }
  }
});

test('resume finds the earliest unchecked step, with a debrief only once a room is complete', () => {
  const room = rooms[0];
  const completed = new Set([stepKey(room, room.scenes[0]), stepKey(room, room.scenes[2])]);
  assert.deepEqual(roomProgress(room, completed), { done: 2, complete: false });
  assert.equal(resumeAt(room, completed), 1);
  room.scenes.forEach((scene) => completed.add(stepKey(room, scene)));
  assert.equal(resumeAt(room, completed), room.scenes.length);
  assert.equal(roomProgress(room, completed).complete, true);
  completed.delete(stepKey(room, room.scenes[0]));
  assert.equal(resumeAt(room, completed), 0);
});

test('restoring progress ignores stale and duplicate keys and rejects corrupt data', () => {
  assert.deepEqual([...restoreProgress('["00/repo","00/repo","00/removed",null]', rooms)], ['00/repo']);
  assert.throws(() => restoreProgress('{', rooms), SyntaxError);
  assert.throws(() => restoreProgress('{"done":[]}', rooms), TypeError);
});

test('deep links distinguish a room, a known scene, and a debrief', () => {
  assert.deepEqual(parseLocation('#lab-a1/evaluate', rooms), { room: rooms[1], scene: 1 });
  assert.deepEqual(parseLocation('#lab-a1/debrief', rooms), { room: rooms[1], scene: rooms[1].scenes.length });
  assert.deepEqual(parseLocation('#lab-a1/removed', rooms), { room: rooms[1], scene: null });
  assert.equal(parseLocation('#floor-plan', rooms), null);
});

test('scene reference assets exist in the source copied by the Pages workflow', async () => {
  const sceneKeys = new Set(rooms.flatMap((room) => room.scenes.map((scene) => stepKey(room, scene))));
  for (const [key, guide] of Object.entries(references)) {
    assert.ok(sceneKeys.has(key), `Reference has no matching scene: ${key}`);
    for (const [, path] of guide.images ?? []) {
      assert.match(path, /^[\w/-]+\.(png|svg)$/);
      assert.ok((await readFile(new URL(`../docs/images/${path}`, import.meta.url))).length, path);
    }
    for (const [, url] of guide.links ?? []) assert.equal(new URL(url).protocol, 'https:');
  }
  assert.ok(onboarding.every(([speaker, line]) => Object.hasOwn(people, speaker) && line));
});

test('workbench guides retain exact fences, headings, links and screenshots in their own steps', async () => {
  const guides = {};
  for (const room of rooms) {
    const markdown = await readFile(new URL(`../labs/${room.slug}/README.md`, import.meta.url), 'utf8');
    guides[room.id] = await buildRoomGuide(room, markdown);
    assert.deepEqual(Object.keys(guides[room.id]), room.scenes.map(({ id }) => id));
    assert.ok(Object.values(guides[room.id]).every((html) => html.trim()));
  }
  assert.match(guides['00'].repo, /<strong>Visibility:<\/strong> <strong>Private<\/strong>/);
  assert.doesNotMatch(guides['00'].repo, /Open in VS Code Desktop/);
  assert.match(guides['00'].codespace, /Open in VS Code Desktop/);
  assert.match(guides['00'].controls, /data-guide-image="screenshots\/00-harness-picker\.png"/);
  assert.match(guides['00'].controls, /<table>/);
  assert.match(guides['00'].verify, /data-copy>Copy<\/button><\/div><pre><code>npm run verify<\/code>/);
  assert.match(guides.A1.evaluate, /<pre><code>## Model selection scorecard|<pre><code># Model (?:selection )?(?:evaluation|comparison|scorecard)/i);
  assert.match(guides.A2.branch, /href="https:\/\/github\.com\/tanure\/contoso-copilot-advanced\/blob\/main\/docs\/backlog\/BL-02-early-retirement\.md" target="_blank" rel="noopener"/);
});

test('workbench guide renderer treats raw HTML and non-web links as text', async () => {
  const room = { ...rooms[0], scenes: [rooms[0].scenes[0]] };
  const markdown = await readFile(new URL('../labs/00-setup/README.md', import.meta.url), 'utf8');
  const heading = markdown.match(/^## Step 1 — .+$/m)[0];
  const { repo } = await buildRoomGuide(room, `${heading}

<img src="local.png">

[unsafe](data:text/html,Hello)

\`\`\`\`markdown
## Step 2 — This is inside a template
\`\`\`bash
  echo "&"
\`\`\`
\`\`\`\`
`);
  assert.match(repo, /&lt;img src=&quot;local.png&quot;&gt;/);
  assert.doesNotMatch(repo, /<img|href=/);
  assert.match(repo, /<pre><code>## Step 2 — This is inside a template\n```bash\n  echo &quot;&amp;&quot;\n```<\/code>/);
});
