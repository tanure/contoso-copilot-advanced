import { people, rooms } from './stories.js';
import { avatar, icon, marker, office, portrait } from './illustration.js';
import { parseLocation, progressKey, restoreProgress, resumeAt, roomProgress, stepKey } from './progress.js';
import { stepAnchor } from './guide-links.js';
import { onboarding, references } from './references.js';

const $ = (selector) => document.querySelector(selector);
const story = $('#story');
const body = $('#story-body');
const footer = $('#story-footer');
const title = $('#story-title');
const toast = $('#copy-toast');
const reference = $('#reference');
const preview = $('#room-preview');
const repo = 'https://github.com/tanure/contoso-copilot-advanced';
const source = (room, index) => `${repo}/blob/main/labs/${room.slug}/README.md${index === undefined ? '' : `#${encodeURIComponent(stepAnchor(room.id, index))}`}`;
const workshopChoices = {
  '00/first-chat': {
    question: 'Copilot asks to edit a file while explaining the code. What do you do?',
    options: [
      ['Deny the edit and inspect the read calls', 'Maya: Right. This task only needs to read and explain.'],
      ['Allow the edit once', 'Maya: That would give the agent more access than it needs. Keep this first chat read-only.'],
    ],
  },
  'A1/evaluate': {
    question: 'What makes this a fair comparison?',
    options: [
      ['Switch models in the same chat', 'Theo: The second model could see the first model’s answer. Give both the same starting context.'],
      ['Use fresh chats with the same effort', 'Theo: Exactly. Keep the prompt and effort fixed, then check both answers against the real function.'],
    ],
  },
  'A2/handoff': {
    question: 'The plan misses the invalid-age tests. What do you do?',
    options: [
      ['Approve and let the Implementer fill in the gaps', 'Jo: The plan is your approval gate. Ask for the missing tests before work starts.'],
      ['Ask for boundary tests and review the revised plan', 'Jo: Exactly. Approve only once the plan covers the acceptance criteria.'],
    ],
  },
  'A3/trust': {
    question: 'A tool result includes an instruction you didn’t ask for. How do you treat it?',
    options: [
      ['Treat it as untrusted text', 'Iris: Right. Retrieved data can inform an answer, but it can’t authorize actions.'],
      ['Treat it as trusted because the tool is approved', 'Iris: Approval to call a tool doesn’t make its returned text an instruction.'],
    ],
  },
  'A4/path-instructions': {
    question: 'Where should an API-test-only convention live?',
    options: [
      ['In the instructions for every task', 'Mina: That adds noise to unrelated work. Scope the convention to the test files.'],
      ['In path-specific instructions for API tests', 'Mina: Right. Use the matching file pattern so the convention loads when it’s relevant.'],
    ],
  },
  'A5/promote': {
    question: 'Which artifact should go to production?',
    options: [
      ['A fresh build from the same commit', 'Alex: The commit is the same, but the new build may produce a different artifact. Promote the digest you already checked.'],
      ['The verified digest from staging', 'Alex: Right. Keep the artifact unchanged and use the approval gate to decide whether to promote it.'],
    ],
  },
};

const escape = (text) => String(text).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const themeQuery = new URLSearchParams(location.search).get('scoutTheme');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let chosenTheme = null;
let completed = new Set();
let active;
let sceneIndex;
let opener;
let tour = false;
let turn = 0;
const welcomeKey = 'contoso-lab-campus:welcome:v1';
let welcomed = false;
try {
  welcomed = localStorage.getItem(welcomeKey) === 'seen';
} catch (error) {
  if (!(error instanceof DOMException)) throw error;
}

function storageNotice(message) {
  const status = $('#storage-status');
  status.textContent = message;
  status.setAttribute('role', 'status');
}

try {
  completed = restoreProgress(localStorage.getItem(progressKey), rooms);
} catch (error) {
  storageNotice(error instanceof SyntaxError || error instanceof TypeError ?
    'Saved progress could not be read. New checkmarks replace it.' :
    'Browser storage is unavailable. Progress may not survive a reload.');
}

function persist() {
  try {
    localStorage.setItem(progressKey, JSON.stringify([...completed]));
    $('#storage-status').innerHTML = `${icon('lock')} Progress is saved in this browser`;
  } catch {
    storageNotice('Could not save your checkmarks. Progress is kept until you leave this page.');
  }
}

function refreshTheme() {
  const dark = (chosenTheme ?? themeQuery ?? (systemTheme.matches ? 'dark' : 'light')) === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = $('#theme');
  button.innerHTML = icon(dark ? 'sun' : 'moon');
  button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

const statusText = ({ done, complete }) => complete ? 'Complete' : done ? 'In progress' : 'Not started';
const actionText = ({ done, complete }) => complete ? 'Review room' : done ? 'Resume lab' : 'Start lab';

function renderMap() {
  $('#office').innerHTML = office();
  $('#map-labels').innerHTML = rooms.map((room, i) => {
    const { x, y, label } = marker(i);
    return `<button type="button" class="map-marker" data-room="${room.id}" aria-controls="room-preview" aria-pressed="false"
      style="--marker-x:${x}%;--marker-y:${y}%">
      <span class="map-marker-id">${room.id}</span><span class="map-marker-name">${label}</span>
      <span class="marker-check" aria-hidden="true">${icon('check')}</span></button>`;
  }).join('');
  $('#room-list').innerHTML = rooms.map((room) => `
    <li><button type="button" class="itinerary-item" data-enter="${room.id}" aria-controls="story">
      <span class="route-icon">${icon(room.icon)}</span>
      <span><strong>${room.id} · ${escape(room.name)}</strong><small>${escape(room.topic)}</small></span>
      <span class="route-state">${icon('arrow')}</span>
    </button></li>`).join('');
}

function renderRoom() {
  const progress = roomProgress(active, completed);
  preview.innerHTML = `
    <div class="room-index"><span class="room-number">LAB ${active.id}</span>
      <span class="badge${progress.complete ? ' complete' : ''}">${progress.complete ? icon('check') : ''}${statusText(progress)}</span></div>
    <h2 id="room-title">${escape(active.name)}</h2>
    <p class="room-topic">${escape(active.topic)}</p>
    <p class="room-intro">${escape(active.intro)}</p>
    <p class="room-facts"><span>${icon('clock')} ${active.minutes} min · ${active.level}</span><span>${progress.done}/${active.scenes.length} steps done</span></p>
    <div class="room-actions">
      <button id="enter-room" type="button" class="button primary" aria-controls="story">${actionText(progress)} ${icon('arrow')}</button>
      <a class="source-link" href="${source(active)}" target="_blank" rel="noopener">Original lab guide ${icon('external')}</a>
    </div>
    <div class="crew"><p class="eyebrow">IN THIS ROOM</p><ol>${active.cast.map((key) => {
      const person = people[key];
      return `<li title="${escape(person.role)}">${avatar(person)} ${escape(person.name)}</li>`;
    }).join('')}</ol></div>`;
  $('#enter-room').addEventListener('click', (event) => {
    opener = event.currentTarget;
    openRoom(active);
  });
}

function paintProgress() {
  let total = 0;
  const segments = rooms.map((room, index) => {
    const state = roomProgress(room, completed);
    total += Number(state.complete);
    const mapButton = $(`[data-room="${room.id}"]`);
    mapButton.setAttribute('aria-pressed', String(active === room));
    mapButton.setAttribute('aria-label', `Lab ${room.id}: ${room.name}${state.complete ? ', complete' : ''}`);
    mapButton.classList.toggle('is-done', state.complete);
    $(`[data-zone="${index}"]`).classList.toggle('is-selected', active === room);
    $(`[data-zone="${index}"]`).classList.toggle('is-done', state.complete);
    const route = $(`[data-enter="${room.id}"]`);
    route.querySelector('.route-state').innerHTML = state.complete ? icon('check') : icon('arrow');
    route.setAttribute('aria-label', `Lab ${room.id}: ${room.name}, ${statusText(state).toLowerCase()}`);
    return `<span class="${state.complete ? 'filled' : ''}"></span>`;
  });
  const text = `${total} of ${rooms.length} rooms complete`;
  if ($('#progress-text').textContent !== text) $('#progress-text').textContent = text;
  $('#progress-segments').innerHTML = segments.join('');
  renderRoom();
}

function updateLocation(scene) {
  const roomId = active.id.toLowerCase();
  const hash = `#lab-${roomId}${scene === undefined ? '' : `/${active.scenes[scene]?.id ?? 'debrief'}`}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function selectRoom(room, syncLocation = true) {
  active = room;
  if (syncLocation) updateLocation();
  paintProgress();
}

function roomSwitcher(label, goNext = false) {
  return `<button class="button ${goNext ? 'primary' : 'stage-button'}" id="${goNext ? 'next-scene' : 'previous-scene'}" type="button">
    ${goNext ? '' : icon('back')}${label}${goNext ? icon('arrow') : ''}</button>`;
}

function showStage() {
  $('#floor-plan').hidden = true;
  $('#route').hidden = true;
  $('.site-footer').hidden = true;
  story.hidden = false;
}

function closeStory(sync = true) {
  if (tour) {
    welcomed = true;
    try {
      localStorage.setItem(welcomeKey, 'seen');
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      storageNotice('Browser storage is unavailable. Progress may not survive a reload.');
    }
  }
  tour = false;
  story.hidden = true;
  $('#floor-plan').hidden = false;
  $('#route').hidden = false;
  $('.site-footer').hidden = false;
  if (sync) updateLocation();
  if (sync) (opener?.isConnected ? opener : $('#enter-room')).focus();
  opener = undefined;
}

function stageCamera(room) {
  const index = rooms.indexOf(room);
  const backdrop = $('#story-office');
  if (backdrop.dataset.room !== room.id) {
    backdrop.dataset.room = room.id;
    backdrop.innerHTML = office(index);
  }
}

function renderLine(dialogue) {
  const [speaker, text] = dialogue[turn];
  const person = people[speaker];
  body.innerHTML = `<div class="conversation">
    ${portrait(person, speaker)}
    <div class="balloon" tabindex="-1">
      <p class="speaker"><strong>${escape(person.name)}</strong><span>${escape(person.role)}</span></p>
      <p class="spoken-line">${escape(text)}</p>
    </div>
  </div>`;
  const last = turn === dialogue.length - 1;
  footer.innerHTML = `<span class="turn-count">${turn + 1} / ${dialogue.length} <span>${tour ? 'Welcome' : 'Conversation'}</span></span>
    <div class="story-nav">
      ${turn ? roomSwitcher('Back') : ''}
      ${!tour && !last ? '<button id="skip-lines" class="button stage-button" type="button">Skip to task</button>' : ''}
      ${roomSwitcher(last ? (tour ? 'Explore campus' : 'Your turn') : 'Next', true)}
    </div>`;
  $('#previous-scene')?.addEventListener('click', () => { turn--; renderLine(dialogue); });
  $('#skip-lines')?.addEventListener('click', () => showTask());
  function advance() {
    if (!last) { turn++; renderLine(dialogue); }
    else if (tour) closeStory();
    else showTask();
  }
  $('#next-scene').addEventListener('click', advance);
  const balloon = $('.balloon');
  balloon.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.repeat) return;
    event.preventDefault();
    advance();
  });
  balloon.focus({ preventScroll: true });
}

function startWelcome() {
  tour = true;
  turn = 0;
  showStage();
  stageCamera(rooms[0]);
  story.dataset.mode = 'dialogue';
  $('#exit-story').innerHTML = `${icon('back')} Skip intro`;
  $('#story-room').textContent = 'Contoso Engineering';
  title.textContent = 'Welcome to Contoso';
  renderLine(onboarding);
  title.focus({ preventScroll: true });
  scrollTo(0, 0);
}

function renderDecision(choice) {
  return `<fieldset class="decision"><legend>${escape(choice.question)}</legend>
    <div class="decision-choices">${choice.options.map(([label], i) => `<button class="button secondary" type="button" data-choice="${i}" aria-pressed="false">${escape(label)}</button>`).join('')}</div>
    <p class="decision-feedback" role="status"></p></fieldset>`;
}

function renderScene(scene, room, state) {
  const choice = workshopChoices[stepKey(room, scene)];
  const guide = references[stepKey(room, scene)] ?? {};
  body.innerHTML = `
    <div class="scene-picker">
      <label>Jump to a step
        <select id="scene-picker">${room.scenes.map((item, index) => `<option value="${index}"${index === sceneIndex ? ' selected' : ''}>
          ${index + 1}. ${escape(item.title)}${completed.has(stepKey(room, item)) ? ' ✓' : ''}
        </option>`).join('')}</select>
      </label>
      <span class="count">${state.done}/${room.scenes.length} done</span>
    </div>
    <section class="mission">
      <h2 tabindex="-1" id="mission-title">Your turn</h2>
      ${choice ? renderDecision(choice) : ''}
      <ol class="task-list">${scene.tasks.map((task) => `<li>${escape(task)}</li>`).join('')}</ol>
      ${scene.snippets.map((snippet, index) => `
        <div class="snippet"><div class="snippet-head"><span>${escape(snippet.label)}</span>
        <button class="button secondary" type="button" data-copy="${index}">${icon('copy')} Copy</button></div>
        <pre><code>${escape(snippet.text)}</code></pre></div>`).join('')}
      <p class="evidence"><strong>Checkpoint:</strong> ${escape(scene.evidence)}</p>
      <div class="reference-actions">
        <button id="open-instructions" class="button secondary" type="button" aria-haspopup="dialog">${icon('book')} Step ${sceneIndex + 1} instructions</button>
        ${(guide.images ?? []).map(([label], index) => `<button class="button secondary" type="button" aria-haspopup="dialog" data-image="${index}">${escape(label)}</button>`).join('')}
      </div>
      ${externalLinks(guide.links)}
      <a class="source-link" href="${source(room, sceneIndex)}" target="_blank" rel="noopener">Original lab on GitHub ${icon('external')}</a>
    </section>`;
  footer.innerHTML = `
    <label class="mark-complete"><input id="step-done" type="checkbox"${completed.has(stepKey(room, scene)) ? ' checked' : ''}> Mark step done</label>
    <div class="story-nav">${roomSwitcher('Replay conversation')}${roomSwitcher(sceneIndex === room.scenes.length - 1 ? 'Debrief' : 'Next step', true)}</div>`;
  $('#previous-scene').addEventListener('click', () => showScene(sceneIndex));
  $('#next-scene').addEventListener('click', () => showScene(sceneIndex + 1));
  $('#open-instructions').addEventListener('click', () => showReference(scene.title, `
    <ol class="task-list">${scene.tasks.map((task) => `<li>${escape(task)}</li>`).join('')}</ol>
    ${(guide.notes ?? []).map((note) => `<p>${escape(note)}</p>`).join('')}
    <p class="evidence"><strong>Checkpoint:</strong> ${escape(scene.evidence)}</p>
    ${externalLinks(guide.links)}
    <a class="source-link" href="${source(room, sceneIndex)}" target="_blank" rel="noopener">Full original lab step ${icon('external')}</a>`));
  body.querySelectorAll('[data-image]').forEach((button) => {
    button.addEventListener('click', () => {
      const [label, path] = guide.images[Number(button.dataset.image)];
      const original = `https://raw.githubusercontent.com/tanure/contoso-copilot-advanced/main/docs/images/${path}`;
      showReference(label, `<img class="lab-image" alt="${escape(label)}" src="${escape(guideImage(path))}">
        <p><a class="source-link" href="${original}" target="_blank" rel="noopener">Open full-size image ${icon('external')}</a></p>`);
      const image = reference.querySelector('.lab-image');
      image.addEventListener('error', () => {
        if (image.dataset.fallback) {
          const message = document.createElement('p');
          message.textContent = 'The image couldn’t load. Try the full-size link below.';
          image.replaceWith(message);
        } else {
          image.dataset.fallback = 'true';
          image.src = original;
        }
      });
    });
  });
  $('#scene-picker').addEventListener('change', (event) => showScene(Number(event.target.value)));
  $('#step-done').addEventListener('change', (event) => {
    const key = stepKey(room, scene);
    if (event.target.checked) completed.add(key);
    else completed.delete(key);
    persist();
    paintProgress();
    const count = roomProgress(room, completed).done;
    body.querySelector('.count').textContent = `${count}/${room.scenes.length} done`;
    $('#scene-picker').selectedOptions[0].textContent = `${sceneIndex + 1}. ${scene.title}${event.target.checked ? ' ✓' : ''}`;
  });
  body.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => copySnippet(button, scene.snippets[Number(button.dataset.copy)].text));
  });
  body.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      body.querySelectorAll('[data-choice]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      body.querySelector('.decision-feedback').textContent = choice.options[Number(button.dataset.choice)][1];
    });
  });
}

function guideImage(path) {
  return window.campusPreviewImages?.[path] ?? `./lab-images/${path}`;
}

function externalLinks(links = []) {
  return links.length ? `<ul class="reference-links">${links.map(([label, url]) =>
    `<li><a class="source-link" href="${escape(url)}" target="_blank" rel="noopener">${escape(label)} ${icon('external')}</a></li>`).join('')}</ul>` : '';
}

function showReference(heading, content) {
  const refTitle = $('#reference-title');
  refTitle.textContent = heading;
  $('#reference-body').innerHTML = content;
  reference.showModal();
  refTitle.focus();
}

function showTask() {
  story.dataset.mode = 'task';
  renderScene(active.scenes[sceneIndex], active, roomProgress(active, completed));
  $('#mission-title').focus({ preventScroll: true });
  body.scrollTop = 0;
}

function renderDebrief(room, state) {
  const remaining = room.scenes.filter((item) => !completed.has(stepKey(room, item)));
  const next = rooms[rooms.indexOf(room) + 1];
  const allDone = rooms.every((item) => roomProgress(item, completed).complete);
  body.innerHTML = `<section class="debrief">
    ${state.complete ? `<span class="room-stamp" aria-hidden="true">${icon('check')} ${room.id} CLEARED</span>` : ''}
    <h2>${state.complete ? 'Room complete' : `${state.done} of ${room.scenes.length} steps checked off`}</h2>
    <p>${state.complete ? escape(allDone ? 'Every room is checked off. Your workshop pass is complete.' : 'You can revisit the conversation at any time.') : 'Go back to a step you haven’t checked off, or return to the floor plan and finish it later.'}</p>
    ${remaining.length ? `<ul>${remaining.map((item) => `<li><button type="button" data-jump="${room.scenes.indexOf(item)}">${escape(item.title)}</button></li>`).join('')}</ul>` : ''}
    <a class="source-link" href="${source(room)}" target="_blank" rel="noopener">Original lab guide and optional stretch work ${icon('external')}</a>
  </section>`;
  footer.innerHTML = `${roomSwitcher('Back')}<div class="story-nav">
    ${next && state.complete ? `<button class="button primary" id="next-room" type="button">Continue to ${next.id} ${icon('arrow')}</button>` :
    '<button id="finish-room" class="button primary" type="button">Return to the floor plan</button>'}</div>`;
  body.querySelectorAll('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => showScene(Number(button.dataset.jump)));
  });
  $('#next-room')?.addEventListener('click', () => openRoom(next));
  $('#finish-room')?.addEventListener('click', () => closeStory());
  $('#previous-scene').addEventListener('click', () => showScene(sceneIndex - 1));
}

function showScene(index) {
  sceneIndex = index;
  const step = active.scenes[index];
  const progress = roomProgress(active, completed);
  title.textContent = step?.title ?? 'Room debrief';
  $('#story-room').textContent = `${active.id} · ${active.name} · ${step ? `STEP ${index + 1} OF ${active.scenes.length}` : 'DEBRIEF'}`;
  toast.textContent = '';
  story.dataset.mode = step ? 'dialogue' : 'debrief';
  turn = 0;
  if (step) renderLine(step.dialogue);
  else renderDebrief(active, progress);
  updateLocation(index);
  body.scrollTop = 0;
  title.focus({ preventScroll: true });
}

function openRoom(room, index = resumeAt(room, completed)) {
  selectRoom(room, false);
  tour = false;
  showStage();
  stageCamera(room);
  $('#exit-story').innerHTML = `${icon('back')} Floor plan`;
  showScene(index);
  scrollTo(0, 0);
}

async function copySnippet(button, text) {
  try {
    await navigator.clipboard.writeText(text);
    if (!button.isConnected) return;
    button.innerHTML = `${icon('check')} Copied`;
    toast.textContent = 'Copied to clipboard.';
  } catch {
    if (!button.isConnected) return;
    const range = document.createRange();
    range.selectNodeContents(button.closest('.snippet').querySelector('code'));
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = 'Selected — copy manually';
    toast.textContent = 'Clipboard access was unavailable. The snippet is selected. Use your device’s copy shortcut.';
  }
}

document.querySelectorAll('[data-icon]').forEach((node) => { node.innerHTML = icon(node.dataset.icon); });
$('#theme').addEventListener('click', () => {
  chosenTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  refreshTheme();
});
systemTheme.addEventListener('change', refreshTheme);
refreshTheme();
renderMap();
$('#map-labels').addEventListener('click', (event) => {
  const button = event.target.closest('[data-room]');
  if (button) selectRoom(rooms.find((room) => room.id === button.dataset.room));
});
$('#room-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-enter]');
  if (!button) return;
  opener = button;
  openRoom(rooms.find((room) => room.id === button.dataset.enter));
});
$('#exit-story').addEventListener('click', () => closeStory());
$('#welcome-tour').addEventListener('click', (event) => {
  opener = event.currentTarget;
  startWelcome();
});
document.querySelectorAll('a[href="#floor-plan"], a[href="#route"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (!story.hidden && location.hash === link.hash) followLocation();
  });
});

function followLocation() {
  const target = parseLocation(location.hash, rooms);
  if (target?.scene != null) {
    openRoom(target.room, target.scene);
  } else {
    if (!story.hidden) closeStory(false);
    selectRoom(target?.room ?? active ?? rooms.find((room) => !roomProgress(room, completed).complete) ?? rooms[0], false);
    if (location.hash === '#floor-plan' || location.hash === '#route') {
      document.getElementById(location.hash.slice(1)).scrollIntoView();
    }
  }
}

window.addEventListener('hashchange', followLocation);
followLocation();
if (!welcomed && story.hidden && !location.hash) startWelcome();
