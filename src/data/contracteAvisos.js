/** R32.25 · Fulla pura del contracte; reexportada pel camí públic de sempre. */
/* ── B8C-2 (marató 261101_2143; Bloc B8) · Avisos push i silenci del Xat ──
   Les plataformes d'un aparell d'avisos (capacitat 'avisosPush') i les
   durades del silenci (capacitat 'silenciXat'): les mateixes que B8-SERVIDOR
   §2.9 (xat_push_desa passa 'ios' a APNs i 'android' a FCM; xat_silencia
   només admet estes quatre durades). */
export const PLATAFORMES_AVISOS = Object.freeze(['web', 'ios', 'android']);
export const DURADES_SILENCI = Object.freeze(['8h', '1setmana', 'sempre', 'cap']);
/* «Sempre»: 9999-12-31 00:00:00 UTC, el mateix instant que torna el servidor.
   Una data finita a posta: new Date('infinity') és NaN i esSilenciat
   (src/sections/xat/missatges.js) la llegiria com a «no silenciada»; i les
   23:59:59 UTC ja serien l'any 10000 en una sessió de Europe/Madrid. */
export const SILENCI_SEMPRE = '9999-12-31T00:00:00.000Z';
const MS_DEL_SILENCI = Object.freeze({ '8h': 8 * 3600000, '1setmana': 7 * 24 * 3600000 });
const errorDeSilenci = (missatge) => Object.assign(new TypeError(missatge), { code: 'SILENCI_INVALID', codi: 'SILENCI_INVALID', retriable: false });

/**
 * La data de fi (ISO) d'un silenci que comença `ara` (ms o Date): '8h' i
 * '1setmana' sumen al rellotge de l'aparell, 'sempre' és SILENCI_SEMPRE i
 * 'cap' és null. Una durada desconeguda, o un rellotge que no dona una data
 * entre la del rellotge i SILENCI_SEMPRE: TypeError amb code
 * 'SILENCI_INVALID'. Pura. En remot no es desa: la data la posa el servidor
 * (xat_silencia); la usen la llavor, el node local i el silenci en memòria.
 */
export function finsAlDelSilenci(durada, ara = Date.now()) {
  if (typeof durada !== 'string' || !DURADES_SILENCI.includes(durada)) throw errorDeSilenci('La durada del silenci no és vàlida.');
  if (durada === 'cap') return null;
  if (durada === 'sempre') return SILENCI_SEMPRE;
  const inici = ara instanceof Date ? ara.getTime() : ara;
  const fi = typeof inici === 'number' ? inici + MS_DEL_SILENCI[durada] : Number.NaN;
  if (!Number.isFinite(fi) || fi < -8.64e15 || fi > Date.parse(SILENCI_SEMPRE)) throw errorDeSilenci('El rellotge de l’aparell no dona una data de fi vàlida.');
  return new Date(fi).toISOString();
}

