function randomIndex(length, rng = Math.random) {
  if (length <= 0) return -1;
  return Math.min(length - 1, Math.floor(Math.max(0, Math.min(0.999999, rng())) * length));
}

export function uniqueNamePool(parts = []) {
  const counts = new Map();
  for (const part of parts) counts.set(part.name, (counts.get(part.name) || 0) + 1);
  return parts.filter(part => part?.selectable !== false && counts.get(part.name) === 1);
}

export function chooseQuizTarget(parts, previousId = null, rng = Math.random) {
  const pool = uniqueNamePool(parts);
  if (!pool.length) return null;
  const alternatives = pool.filter(part => part.id !== previousId);
  const source = alternatives.length ? alternatives : pool;
  return source[randomIndex(source.length, rng)] || null;
}

export function buildQuizChoices(parts, target, count = 4, rng = Math.random) {
  if (!target) return [];
  const pool = uniqueNamePool(parts).filter(part => part.id !== target.id);
  const sameLayer = pool.filter(part => part.layer === target.layer);
  const other = pool.filter(part => part.layer !== target.layer);
  const shuffle = values => {
    const a=[...values];
    for (let i=a.length-1;i>0;i--) {
      const j=randomIndex(i+1,rng); [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  };
  const distractors=[];
  for (const part of [...shuffle(sameLayer), ...shuffle(other)]) {
    if (distractors.length >= count-1) break;
    if (!distractors.some(x => x.name === part.name)) distractors.push(part);
  }
  return shuffle([target, ...distractors]).slice(0,count);
}
