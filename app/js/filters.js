// Filter state and the rules that decide which trophies a list shows.
// Spoiler rule: with spoilers hidden, a story trophy that is not earned yet shows
// as "Hidden story trophy" — its name and description stay masked until earned.
export function blankFilters() {
  return {
    search: '',
    kind: 'all',
    grade: 'all',
    earned: 'all',
    hiddenOnly: false,
    spoiler: true,
  };
}

export function isSpoiled(trophy, filters, state) {
  return filters.spoiler && trophy.kind === 'story' && !state.earned.includes(trophy.id);
}

export function trophyMatches(trophy, filters, state) {
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.earned === 'earned' && !state.earned.includes(trophy.id)) return false;
  if (filters.earned === 'remaining' && state.earned.includes(trophy.id)) return false;
  if (filters.hiddenOnly && !trophy.hidden) return false;
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

// What the checklist shows for a trophy whose story is still hidden.
export function maskedName() {
  return 'Hidden story trophy';
}

export function maskedDescription() {
  return 'Finish the story to reveal this trophy. Spoilers are hidden until it is earned.';
}
