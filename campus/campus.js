import { people, rooms } from './stories.js';
import { avatar, icon, marker, office } from './illustration.js';
import { parseLocation, progressKey, restoreProgress, resumeAt, roomProgress, stepKey } from './progress.js';
import { stepAnchor } from './guide-links.js';

const $ = (selector) => document.querySelector(selector);
const story = $('#story');
const body = $('#story-body');
const footer = $('#story-footer');
const title = $('#story-title');
const toast = $('#copy-toast');
const preview = $('#room-preview');
const repo = 'https://github.com/tanure/contoso-copilot-advanced';
const source = (room, index) => `${repo}/blob/main/labs/${room.slug}/README.md${index === undefined ? '' : `#${encodeURIComponent(stepAnchor(room.id, index))}`}`;
const workshopChoices = {
  'A1/evaluate': {
    question: 'What makes this a fair comparison?',
    options: [
      ['Switch models in the same chat', 'Theo: The second model could see the first model’s answer. Give both the same starting context.'],
      ['Use fresh chats with the same effort', 'Theo: Exactly. Keep the prompt and effort fixed, then check both answers against the real function.'],
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
    <li><button type="button" class="itinerary-item" data-enter="${room.id}" aria-haspopup="dialog">
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
      <button id="enter-room" type="button" class="button primary" aria-haspopup="dialog">${actionText(progress)} ${icon('arrow')}</button>
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
  return `<button class="button ${goNext ? 'primary' : 'secondary'}" id="${goNext ? 'next-scene' : 'previous-scene'}" type="button"
    ${!goNext && sceneIndex === 0 ? 'disabled' : ''}>
    ${goNext ? '' : icon('back')}${label}${goNext ? icon('arrow') : ''}</button>`;
}

function renderDecision(choice) {
  return `<fieldset class="decision"><legend>${escape(choice.question)}</legend>
    <div class="decision-choices">${choice.options.map(([label], i) => `<button class="button secondary" type="button" data-choice="${i}" aria-pressed="false">${escape(label)}</button>`).join('')}</div>
    <p class="decision-feedback" role="status"></p></fieldset>`;
}

function renderScene(scene, room, state) {
  const choice = workshopChoices[stepKey(room, scene)];
  body.innerHTML = `
    <div class="scene-picker">
      <label>Jump to a step
        <select id="scene-picker">${room.scenes.map((item, index) => `<option value="${index}"${index === sceneIndex ? ' selected' : ''}>
          ${index + 1}. ${escape(item.title)}${completed.has(stepKey(room, item)) ? ' ✓' : ''}
        </option>`).join('')}</select>
      </label>
      <span class="count">${state.done}/${room.scenes.length} done</span>
    </div>
    <div class="dialogue" aria-label="Conversation">${scene.dialogue.map(([id, line]) => {
      const person = people[id];
      return `<div class="speech">${avatar(person)}<div><p><strong>${escape(person.name)}</strong><small>${escape(person.role)}</small></p><p>${escape(line)}</p></div></div>`;
    }).join('')}</div>
    <section class="mission">
      <h3>Your turn</h3>
      ${choice ? renderDecision(choice) : ''}
      <ol class="task-list">${scene.tasks.map((task) => `<li>${escape(task)}</li>`).join('')}</ol>
      ${scene.snippets.map((snippet, index) => `
        <div class="snippet"><div class="snippet-head"><span>${escape(snippet.label)}</span>
        <button class="button secondary" type="button" data-copy="${index}">${icon('copy')} Copy</button></div>
        <pre><code>${escape(snippet.text)}</code></pre></div>`).join('')}
      <p class="evidence"><strong>Checkpoint:</strong> ${escape(scene.evidence)}</p>
      <a class="source-link" href="${source(room, sceneIndex)}" target="_blank" rel="noopener">Full instructions for Step ${sceneIndex + 1} ${icon('external')}</a>
    </section>`;
  footer.innerHTML = `
    <label class="mark-complete"><input id="step-done" type="checkbox"${completed.has(stepKey(room, scene)) ? ' checked' : ''}> Mark step done</label>
    <div class="story-nav">${roomSwitcher('Back')}${roomSwitcher(sceneIndex === room.scenes.length - 1 ? 'Debrief' : 'Next step', true)}</div>`;
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

function renderDebrief(room, state) {
  const remaining = room.scenes.filter((item) => !completed.has(stepKey(room, item)));
  const next = rooms[rooms.indexOf(room) + 1];
  const allDone = rooms.every((item) => roomProgress(item, completed).complete);
  body.innerHTML = `<section class="debrief">
    <h3>${state.complete ? 'Room complete' : `${state.done} of ${room.scenes.length} steps checked off`}</h3>
    <p>${state.complete ? escape(allDone ? 'Every room is checked off. Your workshop pass is complete.' : 'You can revisit the conversation at any time.') : 'Go back to a step you haven’t checked off, or return to the floor plan and finish it later.'}</p>
    ${remaining.length ? `<ul>${remaining.map((item) => `<li><button type="button" data-jump="${room.scenes.indexOf(item)}">${escape(item.title)}</button></li>`).join('')}</ul>` : ''}
    <a class="source-link" href="${source(room)}" target="_blank" rel="noopener">Original lab guide and optional stretch work ${icon('external')}</a>
  </section>`;
  footer.innerHTML = `${roomSwitcher('Back')}<div class="story-nav">
    ${next && state.complete ? `<button class="button primary" id="next-room" type="button">Continue to ${next.id} ${icon('arrow')}</button>` :
    '<form method="dialog"><button class="button primary" type="submit">Return to the floor plan</button></form>'}</div>`;
  body.querySelectorAll('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => showScene(Number(button.dataset.jump)));
  });
  $('#next-room')?.addEventListener('click', () => openRoom(next));
}

function showScene(index) {
  sceneIndex = index;
  const step = active.scenes[index];
  const progress = roomProgress(active, completed);
  title.textContent = step?.title ?? 'Room debrief';
  $('#story-room').textContent = `${active.id} · ${active.name} · ${step ? `STEP ${index + 1} OF ${active.scenes.length}` : 'DEBRIEF'}`;
  toast.textContent = '';
  if (step) renderScene(step, active, progress);
  else renderDebrief(active, progress);
  $('#previous-scene').addEventListener('click', () => showScene(index - 1));
  $('#next-scene')?.addEventListener('click', () => showScene(index + 1));
  updateLocation(index);
  body.scrollTop = 0;
  if (story.open) title.focus({ preventScroll: true });
}

function openRoom(room, index = resumeAt(room, completed)) {
  selectRoom(room, false);
  showScene(index);
  if (!story.open) story.showModal();
  title.focus({ preventScroll: true });
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
story.addEventListener('close', () => {
  if (parseLocation(location.hash, rooms)?.scene != null) updateLocation();
  (opener?.isConnected ? opener : $('#enter-room')).focus({ preventScroll: true });
  opener = undefined;
});

function followLocation() {
  const target = parseLocation(location.hash, rooms);
  if (target?.scene != null) {
    openRoom(target.room, target.scene);
  } else {
    if (story.open) story.close();
    selectRoom(target?.room ?? active ?? rooms.find((room) => !roomProgress(room, completed).complete) ?? rooms[0], false);
  }
}

window.addEventListener('hashchange', followLocation);
followLocation();
