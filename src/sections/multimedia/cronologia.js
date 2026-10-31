/**
 * cronologia.js — els grups de la vista Cronologia de /multimedia.
 *
 * Onada 0.3 (Gauntlet 261016, I35; MCR 261016, b03_multimedia.2: «la vista
 * Cronologia és sempre buida») · MultimediaContext llegia
 * payload.mediaTimelineGroups, que cap adaptador no torna, i la Cronologia no
 * pintava res (les proves ho amagaven amb un mock). Ara es calcula ací, una
 * funció pura sobre els mitjans carregats:
 *   · un grup per mes, de la data de captura (dataCaptura) o, sense, la de
 *     l'article (created_at), del més nou al més vell; dins de cada mes, també
 *     del més nou al més vell, i a igual data, l'ordre d'arribada;
 *   · POLÍTICA PER A LES DATES ABSENTS: un mitjà sense data, o amb una data
 *     que no es pot llegir, no es perd ni s'inventa cap mes: va a l'últim grup,
 *     «Sense data» (clau SENSE_DATA), en l'ordre d'arribada;
 *   · cap mitjà es repetix ni s'omet: la suma dels grups és la llista.
 * El mes es llig del text ISO tal qual (els primers «AAAA-MM»), sense passar
 * per la zona horària: una foto feta el 31 a les 23:30 no canvia de mes segons
 * on s'òbriga. L'etiqueta és el mes en lletra en `locale` (ca-ES per defecte,
 * com la capçalera de la secció); la de «Sense data» la posa qui pinta (i18n).
 * Pura i sense imports: es prova en Node.
 */

export const SENSE_DATA = 'sense-data';

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/** La data d'un mitjà en text ISO vàlid, o null. */
export function dataDelMitja(item) {
  for (const valor of [item?.dataCaptura, item?.created_at]) {
    if (typeof valor !== 'string') continue;
    const m = ISO.exec(valor.trim());
    if (!m) continue;
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) continue;
    return valor.trim();
  }
  return null;
}

const primeraMajuscula = (text) => (text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text);

/** Si el motor d'Intl porta les dades de dates de `locale` (un locale invàlid, no). */
function motorParla(locale) {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length > 0;
  } catch {
    return false;
  }
}

/** L'etiqueta d'un grup ('AAAA-MM') en la llengua `locale`: «Setembre de 2026»,
 *  «Septiembre de 2026»…; null si la clau no és d'un mes (SENSE_DATA).
 *  Revisió adversarial del 261016 · Qui pinta la Cronologia la crida amb el
 *  locale actiu (UIContext): abans els mesos eixien sempre en ca-ES.
 *  Gauntlet 261029 (cicle 1, i18n) · `calendari` ({ mesos: [12 noms],
 *  plantilla amb {mes} i {any} }, textosEspaiMultimedia.calendariDe) és la
 *  reserva per a un motor sense les dades de la llengua: el Chrome
 *  d'escriptori no en porta d'eu ni de gl, i toLocaleDateString hi posava el
 *  castellà sense cap error («Agosto de 2026» en basc). Si el motor la porta,
 *  mana el motor (cap canvi en ca, es ni en). */
export function etiquetaDelMes(clau, locale = 'ca-ES', calendari = null) {
  const trossos = /^(\d{4})-(\d{2})$/.exec(typeof clau === 'string' ? clau : '');
  if (!trossos) return null;
  const any = Number(trossos[1]);
  const mes = Number(trossos[2]);
  const nom = calendari?.mesos?.[mes - 1];
  if (typeof nom === 'string' && nom && typeof calendari.plantilla === 'string' && !motorParla(locale)) {
    return primeraMajuscula(calendari.plantilla.replace('{mes}', () => nom).replace('{any}', () => String(any)));
  }
  try {
    const data = new Date(Date.UTC(any, mes - 1, 15));
    return primeraMajuscula(data.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }));
  } catch {
    return `${String(mes).padStart(2, '0')}/${any}`;
  }
}

/** Els grups de la Cronologia: [{ key: 'AAAA-MM' | SENSE_DATA, label, items }]. */
export function agrupaPerMes(items, { locale = 'ca-ES' } = {}) {
  const perMes = new Map();
  const senseData = [];
  (items || []).forEach((item, ordre) => {
    if (!item) return;
    const data = dataDelMitja(item);
    if (!data) {
      senseData.push(item);
      return;
    }
    const clau = data.slice(0, 7);
    if (!perMes.has(clau)) perMes.set(clau, []);
    perMes.get(clau).push({ item, data, ordre });
  });
  const grups = [...perMes.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)).map((clau) => {
    const files = perMes.get(clau).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : a.ordre - b.ordre));
    return { key: clau, label: etiquetaDelMes(clau, locale), items: files.map((fila) => fila.item) };
  });
  if (senseData.length) grups.push({ key: SENSE_DATA, label: null, items: senseData });
  return grups;
}
