/** Test-only · Sanejament R15 (B2). Fulla sense imports (la carrega un vi.mock de
 * src/data/supabase/config.js: no pot tornar a importar l'adaptador). El doble del client
 * de supabase-js per a Functions: com el SDK, fa POST a <url>/functions/v1/<nom> amb fetch. */
export const URL_SUPABASE = 'https://abc.supabase.co';
export function clientDeFunctions() {
  return {
    functions: {
      invoke: async (nom, { body, signal } = {}) => {
        const r = await fetch(`${URL_SUPABASE}/functions/v1/${nom}`, { method: 'POST', body: JSON.stringify(body ?? null), ...(signal ? { signal } : {}) });
        return r.ok ? { data: await r.json(), error: null } : { data: null, error: { status: r.status } };
      }
    }
  };
}
