// Decide the connection direction from forecasts of both orientations.
// forward/reverse: { median, lowerQuartile, n }. current: 'forward' | 'reverse'.
// Flip only when the better direction is safely positive (median>0 AND lowerQuartile>0)
// and beats the current direction's median by more than `threshold`. Cold-start
// (too few samples) keeps the current direction.
export function decideDirection({ current, forward, reverse, threshold = 0, minSamples = 6 }) {
  if ((forward.n || 0) < minSamples || (reverse.n || 0) < minSamples) return current;
  const fm = forward.median ?? -Infinity, rm = reverse.median ?? -Infinity;
  const best = fm >= rm ? 'forward' : 'reverse';
  if (best === current) return current;
  const bestStat = best === 'forward' ? forward : reverse;
  const curStat = current === 'forward' ? forward : reverse;
  if (bestStat.median > 0 && bestStat.lowerQuartile > 0 && bestStat.median - (curStat.median ?? 0) > threshold) return best;
  return current;
}

// Hysteresis: track how many consecutive evaluations have pointed to `desired`
// (relative to the current committed direction). Resets when the target changes
// or matches the current direction.
export function bumpStreak(prev, desired, current) {
  if (desired === current) return { dir: current, streak: 0 };
  if (prev && prev.dir === desired) return { dir: desired, streak: prev.streak + 1 };
  return { dir: desired, streak: 1 };
}

export const shouldFlip = (streak, needed = 2) => streak >= needed;
