import { median, lowerQuartile, recentN } from '../../core/stats.js';

// Recency-capped distribution summary of a sample set (spread or price).
export function forecast(samples, n = 24) {
  const s = recentN(samples || [], n);
  return { median: median(s), lowerQuartile: lowerQuartile(s), n: s.length };
}
