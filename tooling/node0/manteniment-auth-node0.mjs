/** Local auth retention worker. Starts only with the explicit AUTH daemon gate.
 * Every RPC is a separate bounded transaction; ticks never overlap. No email,
 * token, SQL diagnostic or per-person result is returned or logged here.
 */
export const NODE0_AUTH_MAINTENANCE = Object.freeze({ intervalMs: 60000, batchSize: 100, maxBatches: 10 });

export function iniciaMantenimentAuthNodeZero({ db } = {}) {
  if (!db || typeof db.query !== 'function') throw new TypeError('auth_maintenance_configuration_invalid');
  let running = false, stopped = false;
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try {
      for (let batch = 0; batch < NODE0_AUTH_MAINTENANCE.maxBatches && !stopped; batch++) {
        const result = await db.query("SELECT to_jsonb(private.node0_auth_sweep_pending()) AS result;", { privateValues: true });
        const count = result?.rows ? result.rows[0]?.result : result;
        if (!Number.isInteger(count) || count < 0 || count > NODE0_AUTH_MAINTENANCE.batchSize) throw new Error('auth_maintenance_result_invalid');
        if (count < NODE0_AUTH_MAINTENANCE.batchSize) break;
      }
    } catch { /* Retry next tick; never emit private database diagnostics. */ }
    finally { running = false; }
  };
  const timer = setInterval(() => { void tick(); }, NODE0_AUTH_MAINTENANCE.intervalMs);
  timer.unref();
  void tick();
  return Object.freeze({ tick, stop() { stopped = true; clearInterval(timer); } });
}
