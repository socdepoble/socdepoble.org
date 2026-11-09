/* Server-only acknowledgement capabilities. Never pass these to a push
   provider or return them to an application. */
export const PROTOCOL_PUSH = 'lease-v2';
export const MAXIM_LLIURAMENTS = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function formaDelsLliuraments(value) {
  if (!Array.isArray(value) || !value.length || value.length > MAXIM_LLIURAMENTS) return null;
  const ids = new Set();
  const result = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)
      || Object.keys(row).length !== 2 || !Object.hasOwn(row, 'id') || !Object.hasOwn(row, 'lease')
      || typeof row.id !== 'string' || typeof row.lease !== 'string'
      || !UUID.test(row.id) || !UUID.test(row.lease)
      || ids.has(row.id)) return null;
    ids.add(row.id);
    result.push({ id: row.id, lease: row.lease });
  }
  return result;
}
export function resultatPerConfirmar(resultat) {
  if (resultat === 'enviat') return 'acceptat';
  if (resultat === 'expulsa') return 'expulsa';
  if (resultat === 'invalid') return 'descarta';
  return 'reintenta';
}
