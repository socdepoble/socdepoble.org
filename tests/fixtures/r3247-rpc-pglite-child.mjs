// Vitest/jsdom transforma import.meta.url. El motor SQL viu en un procés
// Node natiu amb el mateix catàleg real que les proves R32.46.
import { creaBaseR3246, asClient } from './r3246-catalogue-pglite.mjs';
const pg = await creaBaseR3246();
process.send({ ready: true, engine: pg.r3246.engine });
process.on('message', async ({ id, method, args }) => {
  try {
    if (method === 'close') { await pg.close(); process.send({ id, value: true }); process.disconnect(); return; }
    const value = method === 'asClient' ? await asClient(pg, ...args) : await pg.query(...args);
    process.send({ id, value });
  } catch (cause) { process.send({ id, error: { message: cause.message, code: cause.code } }); }
});
process.on('disconnect', () => process.exit(0));
