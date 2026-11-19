// Boots Platinum Road: loads the data, restores saved progress, wires the
// controls, and renders every view. Deep links the screenshots use:
//   ?view=roadmap|missables|planner|checklist  — open a section directly
//   ?open=<trophy id>                          — open a trophy's guide pane
//   ?spoiler=on|off                           — set the spoiler switch
//   ?seed=13                                  — demo progress for screenshots
import { loadGuideData } from './data.js';
import { blankFilters } from './filters.js';
import { exportFile, importFile, loadState, saveState, seedDemo } from './store.js';
import {
  renderAboutSources,
  renderChecklist,
  renderDetail,
  renderKindChips,
  renderMissables,
  renderPlanner,
  renderProgress,
  renderRoadmap,
} from './views.js';

const VIEWS = ['checklist', 'roadmap', 'missables', 'planner', 'about'];

const data = await loadGuideData();
const state = loadState();
const filters = blankFilters();
filters.spoiler = state.settings.spoiler;
let selectedId = null;

const params = new URLSearchParams(location.search);
if (params.get('seed')) seedDemo(state);
if (params.get('spoiler') === 'on') filters.spoiler = true;
if (params.get('spoiler') === 'off') filters.spoiler = false;
if (params.get('open')) {
  const id = Number(params.get('open'));
  if (data.byId.has(id)) selectedId = id;
}

const callbacks = {
  onStateChange() {
    saveState(state);
    renderAll();
  },
  onSelect(id) {
    selectedId = id;
    renderChecklist(data, state, filters, selectedId, callbacks);
    renderDetail(data, state, selectedId, callbacks);
  },
  onOpenTrophy(id) {
    selectedId = id;
    showView('checklist');
    renderChecklist(data, state, filters, selectedId, callbacks);
    renderDetail(data, state, selectedId, callbacks);
    document.getElementById('detailPane').scrollIntoView({ block: 'nearest' });
  },
};

function renderAll() {
  renderProgress(data, state);
  renderKindChips(data, filters, (kind) => {
    filters.kind = kind;
    renderAll();
  });
  renderChecklist(data, state, filters, selectedId, callbacks);
  renderDetail(data, state, selectedId, callbacks);
  renderRoadmap(data, state, callbacks);
  renderMissables(data, state, callbacks);
  renderPlanner(data, state, callbacks);
  renderAboutSources(data);
}

function showView(view) {
  for (const name of VIEWS) {
    document.getElementById(`view-${name}`).classList.toggle('active', name === view);
  }
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.view === view;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}

const search = document.getElementById('search');
search.addEventListener('input', () => {
  filters.search = search.value.trim();
  renderChecklist(data, state, filters, selectedId, callbacks);
});
document.getElementById('gradeFilter').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  renderChecklist(data, state, filters, selectedId, callbacks);
});
document.getElementById('earnedFilter').addEventListener('change', (event) => {
  filters.earned = event.target.value;
  renderChecklist(data, state, filters, selectedId, callbacks);
});
const spoilerToggle = document.getElementById('spoilerToggle');
spoilerToggle.checked = filters.spoiler;
spoilerToggle.addEventListener('change', () => {
  filters.spoiler = spoilerToggle.checked;
  state.settings.spoiler = spoilerToggle.checked;
  saveState(state);
  renderAll();
});
document.getElementById('hiddenToggle').addEventListener('change', (event) => {
  filters.hiddenOnly = event.target.checked;
  renderChecklist(data, state, filters, selectedId, callbacks);
});

document.getElementById('exportBtn').addEventListener('click', () => exportFile(state));
document.getElementById('importInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = await importFile(file, new Set(data.trophies.map((trophy) => trophy.id)));
    Object.assign(state, imported);
    filters.spoiler = state.settings.spoiler;
    spoilerToggle.checked = filters.spoiler;
    saveState(state);
    renderAll();
  } catch {
    alert('That file is not a Platinum Road progress export.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies, counters and notes?')) return;
  state.earned = [];
  state.counters = {};
  state.notes = {};
  selectedId = null;
  saveState(state);
  renderAll();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== search) {
    event.preventDefault();
    showView('checklist');
    search.focus();
  }
  if (event.key === 'Escape' && selectedId !== null) {
    selectedId = null;
    renderChecklist(data, state, filters, selectedId, callbacks);
    renderDetail(data, state, selectedId, callbacks);
  }
  const index = ['1', '2', '3', '4', '5'].indexOf(event.key);
  if (index !== -1 && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    showView(VIEWS[index]);
  }
});

const startView = params.get('view');
if (startView && VIEWS.includes(startView)) showView(startView);
renderAll();
