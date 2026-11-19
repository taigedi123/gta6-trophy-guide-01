// Progress, counters, notes and settings, saved in localStorage under one key.
// Nothing leaves the browser: export writes a file, import reads one back.
const KEY = 'gta6-platinum-road-v1';

function blankState() {
  return {
    version: 1,
    earned: [],
    counters: {},
    notes: {},
    settings: { spoiler: true, theme: 'night' },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankState();
    return {
      ...blankState(),
      ...parsed,
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counters: parsed.counters ?? {},
      notes: parsed.notes ?? {},
      settings: { ...blankState().settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function setEarned(state, trophyId, earned) {
  state.earned = earned
    ? [...new Set([...state.earned, trophyId])]
    : state.earned.filter((id) => id !== trophyId);
  saveState(state);
}

export function counterValue(state, trophyId) {
  return state.counters[trophyId] ?? 0;
}

export function setCounter(state, trophyId, value, max) {
  const clamped = Math.max(0, Math.min(max, Math.floor(value) || 0));
  state.counters[trophyId] = clamped;
  saveState(state);
  return clamped;
}

export function noteValue(state, trophyId) {
  return state.notes[trophyId] ?? '';
}

export function setNote(state, trophyId, text) {
  if (text.trim() === '') delete state.notes[trophyId];
  else state.notes[trophyId] = text;
  saveState(state);
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'gta6-platinum-road-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

// Reads an exported file back and returns a clean state, or throws on bad input.
export async function importFile(file, validIds) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a progress file.');
  const earned = (Array.isArray(parsed.earned) ? parsed.earned : []).filter((id) => validIds.has(id));
  const counters = {};
  for (const [id, value] of Object.entries(parsed.counters ?? {})) {
    if (validIds.has(Number(id))) counters[id] = Math.max(0, Math.floor(value) || 0);
  }
  const notes = {};
  for (const [id, text] of Object.entries(parsed.notes ?? {})) {
    if (validIds.has(Number(id)) && typeof text === 'string') notes[id] = text;
  }
  return { ...blankState(), earned, counters, notes, settings: parsed.settings ?? blankState().settings };
}

// Seeds a demo run for screenshots: 13 trophies earned, a few counters part-way.
// Only used when the page is opened with ?seed=13, never on a normal visit.
export function seedDemo(state) {
  const demoEarned = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 20, 21];
  state.earned = [...new Set([...state.earned, ...demoEarned])];
  state.counters = {
    ...state.counters,
    15: 87,
    31: 23,
    32: 17,
    35: 41,
  };
  saveState(state);
}
