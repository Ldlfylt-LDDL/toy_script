export const PER_MWH_LOCK = 300; // worst-case buyback collateral per MWh

// Trim candidate hedges so their total locked reserve stays under
// capFraction × availableReserve. Keeps the highest-price (best) candidates,
// drops the lowest first. candidates: [{ price, qty, ... }].
export function applyReserveCap(candidates, availableReserve, capFraction = 0.6, perMwhLock = PER_MWH_LOCK) {
  const budget = capFraction * (availableReserve || 0);
  const ranked = [...candidates].sort((a, b) => b.price - a.price);
  const kept = [];
  let used = 0;
  for (const c of ranked) {
    const lock = perMwhLock * c.qty;
    if (used + lock > budget) continue;
    used += lock;
    kept.push({ ...c, reserveLock: lock });
  }
  return { kept, used, budget };
}
