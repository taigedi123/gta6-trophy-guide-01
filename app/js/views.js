// Renders every view of the guide from the data and the saved state.
// All text goes through textContent, so a trophy name can never run as markup.
import { counterValue, isEarned, noteValue, setCounter, setEarned, setNote } from './store.js';
import { isSpoiled, maskedDescription, maskedName, trophyMatches } from './filters.js';
import { gradeCounts, roadmapOrder } from './data.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind;
}

// --- Progress hero ---------------------------------------------------------

export function renderProgress(data, state) {
  const earned = state.earned.length;
  const total = data.trophies.length;
  document.getElementById('earnedCount').textContent = earned;
  const bar = document.getElementById('progressBar');
  bar.style.width = `${Math.round((earned / total) * 100)}%`;
  document.getElementById('progressBarWrap').setAttribute('aria-valuenow', String(earned));
  const counts = gradeCounts(data.trophies);
  const earnedByGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of data.trophies) {
    if (isEarned(state, trophy.id)) earnedByGrade[trophy.grade] += 1;
  }
  const wrap = document.getElementById('gradeCounts');
  wrap.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const span = el('span');
    const bold = el('b', null, `${earnedByGrade[grade]}/${counts[grade]}`);
    span.append(bold, ` ${gradeLabel(grade)}`);
    wrap.append(span);
  }
  const next = [...data.trophies].sort((a, b) => roadmapOrder(a) - roadmapOrder(b))
    .find((trophy) => !isEarned(state, trophy.id));
  const line = document.getElementById('nextUpLine');
  line.replaceChildren();
  if (next) {
    const stage = data.stages[next.roadmap_stage - 1];
    line.append('Next up: ');
    line.append(el('b', null, next.name));
    line.append(` — ${stage ? stage.title.replace(/^\d+ · /, '') : 'roadmap'} (stage ${next.roadmap_stage} of ${data.stages.length}).`);
  } else {
    line.append(el('b', null, 'Platinum earned — every trophy is done.'));
  }
}

// --- Kind filter chips ------------------------------------------------------

export function renderKindChips(data, filters, onPick) {
  const wrap = document.getElementById('kindChips');
  wrap.replaceChildren();
  const kinds = [{ key: 'all', label: 'All kinds' }, ...data.kinds.map((kind) => ({ key: kind, label: kindLabel(kind) }))];
  for (const { key, label } of kinds) {
    const count = key === 'all'
      ? data.trophies.length
      : data.trophies.filter((trophy) => trophy.kind === key).length;
    const chip = el('button', `chip${filters.kind === key ? ' active' : ''}`, label);
    chip.type = 'button';
    chip.append(el('span', 'n', String(count)));
    chip.addEventListener('click', () => onPick(key));
    wrap.append(chip);
  }
}

// --- Checklist --------------------------------------------------------------

function counterBar(state, trophy) {
  const row = el('span', 'mini-progress');
  const value = counterValue(state, trophy.id);
  const bar = el('span', 'bar');
  const fill = el('span', 'bar-fill');
  fill.style.width = `${Math.round((value / trophy.target) * 100)}%`;
  bar.append(fill);
  row.append(bar, el('span', null, `${value.toLocaleString()} / ${trophy.target.toLocaleString()} ${trophy.target_unit}`));
  return row;
}

export function renderChecklist(data, state, filters, selectedId, callbacks) {
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  const shown = data.trophies.filter((trophy) => trophyMatches(trophy, filters, state));
  document.getElementById('listCount').textContent =
    `${shown.length} of ${data.trophies.length} trophies shown · ${state.earned.length} earned`;
  for (const trophy of shown) {
    const spoiled = isSpoiled(trophy, filters, state);
    const item = el('li', `trophy${isEarned(state, trophy.id) ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, trophy.id);
    box.setAttribute('aria-label', `Earned: ${spoiled ? maskedName() : trophy.name}`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      setEarned(state, trophy.id, box.checked);
      callbacks.onStateChange();
    });
    box.addEventListener('click', (event) => event.stopPropagation());
    const medal = el('span', `medal ${trophy.grade}`);
    medal.setAttribute('aria-hidden', 'true');
    const body = el('div');
    const name = el('div', 'trophy-name', spoiled ? maskedName() : trophy.name);
    if (trophy.missable) name.append(el('span', 'badge missable', 'Possibly missable'));
    if (trophy.hidden) name.append(el('span', 'badge hidden-badge', 'Hidden'));
    const desc = el('div', 'trophy-desc', spoiled ? maskedDescription() : trophy.description);
    if (spoiled) desc.classList.add('spoiled');
    const meta = el('div', 'trophy-meta');
    meta.append(el('span', 'kind', kindLabel(trophy.kind)));
    if (trophy.target) meta.append(counterBar(state, trophy));
    if (trophy.psn_rarity_pct !== undefined) {
      meta.append(el('span', null, `${trophy.psn_rarity_pct}% of PSN players`));
    }
    body.append(name, desc, meta);
    const grade = el('div', 'trophy-grade');
    grade.append(el('span', 'medal-label', gradeLabel(trophy.grade)));
    item.append(box, medal, body, grade);
    item.addEventListener('click', () => callbacks.onSelect(trophy.id));
    list.append(item);
  }
  if (shown.length === 0) {
    const empty = el('li', null, 'No trophies match these filters. Clear the search or pick another kind.');
    list.append(empty);
  }
}

// --- Detail pane ------------------------------------------------------------

export function renderDetail(data, state, trophyId, callbacks) {
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  if (trophyId === null) {
    pane.classList.add('empty');
    pane.append(el('p', null, 'Pick a trophy from the list to read its guide, sources and progress counter.'));
    return;
  }
  pane.classList.remove('empty');
  const trophy = data.byId.get(trophyId);
  if (!trophy) return;
  const spoiled = isSpoiled(trophy, { spoiler: state.settings.spoiler }, state);
  const close = el('button', 'close-detail', 'Close');
  close.type = 'button';
  close.addEventListener('click', () => callbacks.onSelect(null));
  pane.append(close);
  const facts = el('div', 'facts');
  facts.append(el('span', 'fact', gradeLabel(trophy.grade)));
  facts.append(el('span', 'fact', kindLabel(trophy.kind)));
  if (trophy.hidden) facts.append(el('span', 'fact', 'Hidden on PlayStation'));
  if (trophy.missable) facts.append(el('span', 'fact warn', 'Possibly missable'));
  if (trophy.psn_rarity_pct !== undefined) {
    const rarity = el('span', 'fact');
    rarity.append(el('b', null, `${trophy.psn_rarity_pct}%`), ' of PSN players');
    facts.append(rarity);
  }
  pane.append(el('h2', null, spoiled ? maskedName() : trophy.name));
  pane.append(el('p', 'official', spoiled ? maskedDescription() : trophy.description));
  pane.append(facts);
  if (trophy.missable && trophy.missable_note) {
    const callout = el('p', 'missable-callout');
    callout.append(el('strong', null, 'Missable warning: '), trophy.missable_note);
    pane.append(callout);
  }
  if (spoiled) {
    pane.append(el('p', null, 'This is a story trophy and spoilers are hidden. Earn it in the game — or turn spoilers off — to read its guide.'));
  } else {
    if (trophy.target) {
      const row = el('div', 'counter-row');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(trophy.target);
      input.value = String(counterValue(state, trophy.id));
      input.setAttribute('aria-label', `Progress toward ${trophy.name}`);
      const bar = el('span', 'bar');
      const fill = el('span', 'bar-fill');
      const paint = () => {
        fill.style.width = `${Math.round((counterValue(state, trophy.id) / trophy.target) * 100)}%`;
      };
      paint();
      bar.append(fill);
      input.addEventListener('change', () => {
        setCounter(state, trophy.id, Number(input.value), trophy.target);
        input.value = String(counterValue(state, trophy.id));
        paint();
        callbacks.onStateChange();
      });
      row.append(input, bar, el('span', null, `/ ${trophy.target.toLocaleString()} ${trophy.target_unit}`));
      pane.append(row);
    }
    pane.append(el('h3', null, 'Guide'));
    pane.append(el('p', 'guide-text', trophy.guide));
    pane.append(el('h3', null, 'Sources'));
    const sources = el('ul', 'sources');
    for (const key of trophy.sources) {
      const source = data.sources[key];
      if (!source) continue;
      const item = el('li');
      if (source.url) {
        const link = document.createElement('a');
        link.href = source.url;
        link.textContent = source.label;
        link.target = '_blank';
        link.rel = 'noopener';
        item.append(link);
      } else {
        item.append(el('span', 'no-link', source.label));
      }
      sources.append(item);
    }
    pane.append(sources);
    pane.append(el('h3', null, 'Your notes'));
    const note = document.createElement('textarea');
    note.value = noteValue(state, trophy.id);
    note.placeholder = 'Where you found it, what worked, what to try next…';
    note.setAttribute('aria-label', `Notes for ${trophy.name}`);
    note.addEventListener('change', () => {
      setNote(state, trophy.id, note.value);
      callbacks.onStateChange();
    });
    pane.append(note);
  }
  const toggle = el('label', 'earned-toggle');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(state, trophy.id);
  box.addEventListener('change', () => {
    setEarned(state, trophy.id, box.checked);
    callbacks.onStateChange();
  });
  toggle.append(box, 'Earned');
  pane.append(toggle);
}

// --- Roadmap ------------------------------------------------------------------

export function renderRoadmap(data, state, callbacks) {
  const wrap = document.getElementById('roadmapList');
  wrap.replaceChildren();
  data.stages.forEach((stage, index) => {
    const card = el('article', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, stage.title));
    const earned = stage.ids.filter((id) => isEarned(state, id)).length;
    head.append(el('span', 'stage-count', `${earned} / ${stage.ids.length} earned`));
    card.append(head);
    const bar = el('div', 'bar');
    const fill = el('span', 'bar-fill');
    fill.style.width = `${Math.round((earned / stage.ids.length) * 100)}%`;
    bar.append(fill);
    card.append(el('p', null, stage.blurb), bar);
    const chips = el('div', 'stage-trophies');
    for (const id of stage.ids) {
      const trophy = data.byId.get(id);
      if (!trophy) continue;
      const chip = el('button', `stage-trophy${isEarned(state, id) ? ' earned' : ''}`);
      chip.type = 'button';
      chip.append(document.createTextNode(trophy.name));
      chip.append(el('span', 'g', gradeLabel(trophy.grade)));
      chip.addEventListener('click', () => callbacks.onOpenTrophy(id));
      chips.append(chip);
    }
    card.append(chips);
    wrap.append(card);
  });
  const note = el('p', 'view-intro', `Roadmap progress: ${state.earned.length} of ${data.trophies.length} trophies earned. Stages are built from the official descriptions — chapter and mission names, collectible counts and character strands all come from the list itself.`);
  wrap.append(note);
}

// --- Missables ------------------------------------------------------------------

export function renderMissables(data, state, callbacks) {
  const wrap = document.getElementById('missablesList');
  wrap.replaceChildren();
  const missable = data.trophies.find((trophy) => trophy.missable);
  if (missable) {
    const card = el('article', 'missable-card');
    card.append(el('h3', null, `⚠ ${missable.name} — possibly missable`));
    card.append(el('p', 'official', missable.description));
    card.append(el('p', 'guide-text', missable.guide));
    if (missable.missable_note) {
      const callout = el('p', 'missable-callout');
      callout.append(el('strong', null, 'Do this first: '), missable.missable_note);
      card.append(callout);
    }
    const open = el('button', null, 'Open the full guide');
    open.type = 'button';
    open.addEventListener('click', () => callbacks.onOpenTrophy(missable.id));
    card.append(open);
    wrap.append(card);
  }
  const safe = el('article', 'safe-card');
  safe.append(el('h3', null, 'Everything else is safe'));
  const list = el('ul');
  const points = [
    'The 12 story trophies (chapters 1–4, the final mission and the named story missions) are unmissable: they pop as you play the campaign.',
    'The character finales — Andy, Kenton, Billy, Randy, Tyrone and Bret — stay available after their strands unlock. Finish them whenever you like.',
    'Every activity, collectible, robbery and money trophy can be earned in free roam after the story ends. No second playthrough is needed.',
    'Two hidden trophies, Bad Luck, I Guess and The Truth Is Out There, have triggers nobody has verified yet. That makes them unknown, not missable — they are not tied to a chapter that can pass you by.',
    'Outside guides agree on one playthrough and one possibly missable trophy. If that changes as players map the game, this page will say so.',
  ];
  for (const point of points) list.append(el('li', null, point));
  safe.append(list);
  wrap.append(safe);
}

// --- Planner --------------------------------------------------------------------

export function renderPlanner(data, state, callbacks) {
  const wrap = document.getElementById('plannerList');
  wrap.replaceChildren();
  const ordered = [...data.trophies].sort((a, b) => roadmapOrder(a) - roadmapOrder(b));
  const remaining = ordered.filter((trophy) => !isEarned(state, trophy.id));

  const upNext = el('div', 'plan-group');
  upNext.append(el('h3', null, 'Up next — in roadmap order'));
  remaining.slice(0, 6).forEach((trophy, index) => {
    const stage = data.stages[trophy.roadmap_stage - 1];
    const item = el('div', 'plan-item');
    item.append(el('span', 'rank', String(index + 1)));
    const body = el('div');
    body.append(el('div', null, trophy.name));
    body.append(el('div', 'why', trophy.description));
    item.append(body);
    item.append(el('span', 'stage-tag', stage ? `Stage ${trophy.roadmap_stage}` : ''));
    item.addEventListener('click', () => callbacks.onOpenTrophy(trophy.id));
    upNext.append(item);
  });
  wrap.append(upNext);

  const closest = data.trophies
    .filter((trophy) => trophy.target && counterValue(state, trophy.id) > 0 && counterValue(state, trophy.id) < trophy.target && !isEarned(state, trophy.id))
    .sort((a, b) => (counterValue(state, b.id) / b.target) - (counterValue(state, a.id) / a.target));
  if (closest.length > 0) {
    const group = el('div', 'plan-group');
    group.append(el('h3', null, 'Closest to done'));
    for (const trophy of closest) {
      const value = counterValue(state, trophy.id);
      const item = el('div', 'plan-item');
      item.append(el('span', 'rank', `${Math.round((value / trophy.target) * 100)}%`));
      const body = el('div');
      body.append(el('div', null, trophy.name));
      body.append(el('div', 'why', `${value.toLocaleString()} of ${trophy.target.toLocaleString()} ${trophy.target_unit} — ${trophy.target - value} to go.`));
      item.append(body);
      item.addEventListener('click', () => callbacks.onOpenTrophy(trophy.id));
      group.append(item);
    }
    wrap.append(group);
  }

  const quick = [44, 45, 46, 21, 20].map((id) => data.byId.get(id)).filter(Boolean)
    .filter((trophy) => !isEarned(state, trophy.id));
  if (quick.length > 0) {
    const group = el('div', 'plan-group');
    group.append(el('h3', null, 'Quick wins — one visit each'));
    for (const trophy of quick) {
      const item = el('div', 'plan-item');
      item.append(el('span', 'rank', '★'));
      const body = el('div');
      body.append(el('div', null, trophy.name));
      body.append(el('div', 'why', trophy.description));
      item.append(body);
      item.addEventListener('click', () => callbacks.onOpenTrophy(trophy.id));
      group.append(item);
    }
    wrap.append(group);
  }
}

// --- About sources ---------------------------------------------------------------

export function renderAboutSources(data) {
  const list = document.getElementById('aboutSources');
  list.replaceChildren();
  for (const source of Object.values(data.sources)) {
    const item = el('li');
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.label;
      link.target = '_blank';
      link.rel = 'noopener';
      item.append(link);
    } else {
      item.append(el('span', 'no-link', source.label));
    }
    list.append(item);
  }
}
