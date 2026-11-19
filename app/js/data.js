// Loads the guide's data files and hands the app one tidy object to render from.
// Both files live under app/data/ and are fetched from the same server as the page,
// so the guide works with the network off.
export async function loadGuideData() {
  const [trophiesResponse, roadmapResponse] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/roadmap.json'),
  ]);
  const trophiesDoc = await trophiesResponse.json();
  const roadmapDoc = await roadmapResponse.json();
  const trophies = trophiesDoc.trophies;
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  const sources = trophiesDoc.sources;
  const kinds = [...new Set(trophies.map((trophy) => trophy.kind))].sort();
  return {
    game: trophiesDoc.game,
    note: trophiesDoc.note,
    platform: trophiesDoc.platform,
    trophies,
    byId,
    sources,
    kinds,
    stages: roadmapDoc.stages,
    roadmapNote: roadmapDoc.note,
  };
}

// The official make-up of the list, used by the header and the progress hero.
export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) counts[trophy.grade] += 1;
  return counts;
}

// Roadmap order: the stage number each trophy belongs to, then its id.
export function roadmapOrder(trophy) {
  return (trophy.roadmap_stage ?? 9) * 100 + trophy.id;
}
