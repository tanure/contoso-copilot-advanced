export const progressKey = 'contoso-lab-campus:progress:v1';

export function stepKey(room, scene) {
  return `${room.id}/${scene.id}`;
}

export function restoreProgress(raw, rooms) {
  if (raw === null) return new Set();
  const saved = JSON.parse(raw);
  if (!Array.isArray(saved)) throw new TypeError('Expected a list of completed steps.');
  const valid = new Set(rooms.flatMap((room) => room.scenes.map((scene) => stepKey(room, scene))));
  return new Set(saved.filter((key) => valid.has(key)));
}

export function roomProgress(room, completed) {
  const done = room.scenes.filter((scene) => completed.has(stepKey(room, scene))).length;
  return { done, complete: done === room.scenes.length };
}

export function campusProgress(rooms, completed) {
  const progress = { steps: 0, totalSteps: 0, roomsCleared: 0, complete: false };
  for (const room of rooms) {
    const state = roomProgress(room, completed);
    progress.steps += state.done;
    progress.totalSteps += room.scenes.length;
    progress.roomsCleared += Number(state.complete);
  }
  progress.complete = progress.totalSteps > 0 && progress.steps === progress.totalSteps;
  return progress;
}

export function resumeAt(room, completed) {
  const first = room.scenes.findIndex((scene) => !completed.has(stepKey(room, scene)));
  return first === -1 ? room.scenes.length : first;
}

export function parseLocation(hash, rooms) {
  const match = /^#lab-(00|a[1-5])(?:\/([a-z0-9-]+))?$/.exec(hash);
  if (!match) return null;
  const room = rooms.find((item) => item.id.toLowerCase() === match[1]);
  if (!room) return null;
  const scene = match[2] === 'debrief' ? room.scenes.length : room.scenes.findIndex((item) => item.id === match[2]);
  return { room, scene: scene < 0 ? null : scene };
}
