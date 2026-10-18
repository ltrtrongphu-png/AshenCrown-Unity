// Story pacing rules for the 10-chapter browser campaign.
// Kept pure so chapter gates are unit-testable without starting WebGL.
export function getChapterRequirements(chapter) {
  const parsed = Number(chapter);
  const current = Number.isFinite(parsed)
    ? Math.max(1, Math.min(10, Math.floor(parsed)))
    : 1;

  if (current === 1) return { embers: 2, echoes: 2, record: true };
  if (current <= 3) return { embers: 3, echoes: 3, record: true };
  if (current <= 5) return { embers: 4, echoes: 3, record: true };
  if (current <= 7) return { embers: 4, echoes: 4, record: true };
  if (current <= 9) return { embers: 5, echoes: 4, record: true };
  return { embers: 5, echoes: 5, record: true };
}

export function chapterRecordKey(chapter) {
  const parsed = Number(chapter);
  const current = Number.isFinite(parsed)
    ? Math.max(1, Math.min(10, Math.floor(parsed)))
    : 1;
  return `chapter${current}Record`;
}

export function hasChapterRecord(flags, chapter) {
  return Boolean(flags && flags[chapterRecordKey(chapter)] === true);
}

export function isChapterWardenReady(state) {
  if (!state || Number(state.quest) !== 3 || state.flags?.bellWardenDefeated === true) return false;
  const requirements = getChapterRequirements(state.chapter);
  return hasChapterRecord(state.flags, state.chapter)
    && Number(state.echoes) >= requirements.echoes;
}

export function canAdvanceChapter(state, activeMapId) {
  return Boolean(state
    && Number(state.quest) === 5
    && Number(state.chapter) >= 1
    && Number(state.chapter) < 10
    && activeMapId === 'sanctuary');
}
