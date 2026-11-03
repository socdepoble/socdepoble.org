/**
 * jarvis.js — IDEA-60 (T1, prompt 261102_1532) · El «Mode Jarvis Omnicanal
 * d'1 Clic» de /consola/empaquetats, sense React.
 *
 * Ordre del Mestre (Llibre Mestre, fila IDEA-60, 2026-11-02 14:46): superar
 * el model de «copiar ordres al terminal» amb un sol botó que actualitza la
 * web, el connector de WordPress, Google Play i l'App Store, per a
 * administradors sense coneixements informàtics. En local (Sóc de Poble) el botó
 * crida l'endpoint del corredor (POST RUTA_PUBLICA_TOT, només des de
 * localhost i només en DEV: tooling/vite/consola-iaia.mjs); des de la web
 * pública, en el futur, un webhook, que hui no existix i el panell ho diu.
 *
 * Ací viu tot el que es pot provar sense DOM: els canals i el seu estat
 * (derivat de plataformesEmpaquetades, empaquetats.js), la petició i la
 * seua validació, els passos inicials, la lectura de la resposta i del
 * progrés (sdp.jarvis.publica.v1) i l'ordre del terminal que es mostra quan
 * el servidor no porta el corredor. El script scripts/botigues/publica-tot.mjs
 * i l'àlies npm «jarvis:publica-tot» són del carril de MarIA: la Consola
 * només diu l'ordre.
 *
 * Regla 2.3.10 de l'App Store (ordre del Mestre 261027; perAppNativa.js):
 * dins de l'app nativa cap canal ni cap text nomena una altra plataforma
 * mòbil; fora, tot tal qual.
 */
import { SEMAFOR } from './empaquetats.js';
import { nomenaPlataformaAliena, textPerAppNativa } from '../text/perAppNativa.js';

/** L'endpoint local del corredor (POST) i el seu progrés (GET RUTA_PROGRES). */
export const RUTA_PUBLICA_TOT = '/__iaia/botigues/publica-tot';
export const RUTA_PROGRES = `${RUTA_PUBLICA_TOT}.json`;
export const ESQUEMA_JARVIS = 'sdp.jarvis.publica.v1';
export const MAX_NOTES = 500;
/** El panell demana el progrés cada dos segons, com a molt durant deu minuts. */
export const INTERVAL_PROGRES_MS = 2000;
export const MAX_ESPERA_MS = 10 * 60 * 1000;

export const TITOL_JARVIS = 'Mode Jarvis Omnicanal d’1 Clic';
export const ENTRADETA_JARVIS = 'Un sol botó actualitza la web, el connector de WordPress, Google Play i l’App Store. Escriu què hem millorat i publica.';
export const ETIQUETA_NOTES = 'Què hem millorat en esta versió';
export const TEXT_BOTO_JARVIS = 'Publicar nova versió a totes les botigues';
export const ETIQUETA_CANALS = 'Estat de cada canal';
export const ETIQUETA_PASSOS = 'Passos de la publicació';

/** Els quatre canals, en l'ordre de publicació; `plataforma` és l'id de PLATAFORMES (empaquetats.js). */
export const CANALS_JARVIS = Object.freeze([
  Object.freeze({ id: 'web', nom: 'Web socdepoble.org', plataforma: 'pwa' }),
  Object.freeze({ id: 'wordpress', nom: 'Connector de WordPress (WordPress.org)', plataforma: 'wordpress' }),
  Object.freeze({ id: 'android', nom: 'Android · Google Play i APK directe', plataforma: 'android' }),
  Object.freeze({ id: 'ios', nom: 'Apple · App Store i TestFlight', plataforma: 'ios' })
]);
const IDS_CANALS = Object.freeze(CANALS_JARVIS.map((c) => c.id));

/** Els canals que es pinten: dins de l'app nativa, cap que nomene una altra plataforma mòbil. */
export function canalsJarvis({ nativa = false } = {}) {
  return nativa ? CANALS_JARVIS.filter((c) => !nomenaPlataformaAliena(c.nom)) : CANALS_JARVIS;
}

/* Dins de l'app nativa, la frase es queda i només perd la menció; textPerAppNativa
   és la xarxa final (la frase sencera fora si encara en nomena alguna). */
const GOOGLE_PLAY_A_LA_LLISTA = /,\s*Google Play i\b/;
/** L'entradeta del panell; dins de l'app nativa, sense la menció. */
export function entradetaJarvis({ nativa = false } = {}) {
  return nativa ? textPerAppNativa(ENTRADETA_JARVIS.replace(GOOGLE_PLAY_A_LA_LLISTA, ' i')) : ENTRADETA_JARVIS;
}

/**
 * L'estat de cada canal, derivat de plataformesEmpaquetades: { id, nom,
 * plataforma, semafor, to, text, versio, ultim }. El semàfor és el de la
 * plataforma (la web, 'font' → «Font canònica»); sense lectura, 'desconegut'.
 * `versio` és la declarada (amb build si en porta) i `ultim`, el nom de
 * l'artefacte més recent amb versió de la carpeta de builds.
 */
export function estatDelsCanals(plataformes, { nativa = false } = {}) {
  const llista = Array.isArray(plataformes) ? plataformes : [];
  return canalsJarvis({ nativa }).map((canal) => {
    const p = llista.find((x) => x && x.id === canal.plataforma) ?? null;
    const semafor = p && SEMAFOR[p.semafor] ? p.semafor : 'desconegut';
    return {
      id: canal.id,
      nom: canal.nom,
      plataforma: canal.plataforma,
      semafor,
      to: SEMAFOR[semafor].to,
      text: SEMAFOR[semafor].text,
      versio: typeof p?.versio === 'string' ? (p.build ? `${p.versio}+${p.build}` : p.versio) : null,
      ultim: typeof p?.ultim?.nom === 'string' ? p.ultim.nom : null
    };
  });
}

export const ERROR_NOTES_BUIDES = 'Escriu què hem millorat en esta versió abans de publicar.';

/* Les notes tal com viatgen: salts de línia d'Unix, sense caràcters de
   control (fora del salt), sense espais al final de línia, sense salts
   dobles, retallades a MAX_NOTES.
   Àrbitre T1a-ARB-05 (zero ReDoS, core-seguretat-audit) · Tot lineal:
   primer el trim natiu i una cota (COTA_NOTES) sobre l'entrada, i els
   espais finals de cada línia cauen amb un bucle, no amb una expressió que
   retrocedisca (`[ \t]+\n` sobre 200.000 espais seguits tardava 57 s). El
   que queda darrere de la cota no arriba: la Consola limita el camp a
   MAX_NOTES i este mòdul no treballa mai sobre més de COTA_NOTES. */
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
export const COTA_NOTES = MAX_NOTES * 4;
const senseEspaisFinals = (linia) => {
  let fi = linia.length;
  while (fi > 0 && (linia[fi - 1] === ' ' || linia[fi - 1] === '\t')) fi -= 1;
  return fi === linia.length ? linia : linia.slice(0, fi);
};
/** Les notes normalitzades (pot ser ''). */
export function normalitzaNotes(notes) {
  return String(notes ?? '')
    .trim()
    .slice(0, COTA_NOTES)
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, '')
    .split('\n')
    .map(senseEspaisFinals)
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, MAX_NOTES)
    .trim();
}

/** El subconjunt vàlid de canals, en l'ordre de CANALS_JARVIS; els desconeguts, fora. */
export function canalsValids(canals) {
  const demanats = new Set(Array.isArray(canals) ? canals : []);
  return IDS_CANALS.filter((id) => demanats.has(id));
}

/**
 * El cos del POST: { schema, notes, canals, sec }. `canals` buit vol dir
 * tots. Llança (text en valencià) si les notes queden buides.
 */
export function peticioPublicaTot({ notes, canals = [], sec = false } = {}) {
  const text = normalitzaNotes(notes);
  if (!text) throw new Error(ERROR_NOTES_BUIDES);
  return { schema: ESQUEMA_JARVIS, notes: text, canals: canalsValids(canals), sec: sec === true };
}

/** El títol humà de cada pas, per canal. */
export const TITOL_PAS = Object.freeze({
  web: 'Web al dia',
  wordpress: 'WordPress al dia',
  android: 'Google Play i APK enviats',
  ios: 'Apple enviat'
});

/**
 * Els passos abans que el corredor diga res: [{ id, canal, titol, estat:
 * 'pendent' }], numerats («1/4 Web al dia»). `id` és la clau que el corredor
 * reporta i `canal`, a quin canal pertany: hui coincidixen, i un corredor
 * futur pot partir un canal en més d'un pas. Sense canals (o cap de vàlid),
 * els quatre.
 */
export function PASSOS_INICIALS(canals = []) {
  const ids = canalsValids(canals);
  const llista = ids.length ? ids : IDS_CANALS;
  return llista.map((canal, i) => ({ id: canal, canal, titol: `${i + 1}/${llista.length} ${TITOL_PAS[canal]}`, estat: 'pendent' }));
}

/**
 * Els passos que es pinten: dins de l'app nativa, cap que nomene una altra
 * plataforma mòbil al títol o al detall (el corredor no sap des d'on es
 * mira); fora, tots tal qual.
 */
export function passosPerPintar(passos, { nativa = false } = {}) {
  const llista = Array.isArray(passos) ? passos : [];
  return nativa ? llista.filter((p) => !nomenaPlataformaAliena(`${p?.titol ?? ''} ${p?.detall ?? ''}`)) : llista;
}

export const ESTATS_PAS = Object.freeze(['pendent', 'en_curs', 'fet', 'error']);
export const ESTATS_PROGRES = Object.freeze(['en_curs', 'fet', 'error']);
/** L'estat d'un pas amb el vocabulari d'Insignia: l'estat mai no va només en color. */
export const INSIGNIA_PAS = Object.freeze({
  pendent: Object.freeze({ text: 'Pendent', to: 'neutre' }),
  en_curs: Object.freeze({ text: 'En curs', to: 'info' }),
  fet: Object.freeze({ text: 'Fet', to: 'exit' }),
  error: Object.freeze({ text: 'Error', to: 'error' })
});

const ID_PAS = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const MAX_PASSOS = 16;
const MAX_TITOL = 120;
const MAX_DETALL = 300;

/**
 * El progrés del corredor validat: { estat: 'en_curs'|'fet'|'error',
 * passos: [{ id, canal, titol, estat, detall? }] }. Una forma que no és la
 * de l'esquema és un Error: la Consola no endevina.
 */
export function llegixProgres(cos) {
  const falla = (camp) => { throw new Error(`Progrés del corredor Jarvis invàlid: ${camp}.`); };
  if (!cos || typeof cos !== 'object' || Array.isArray(cos)) falla('arrel');
  if (cos.schema !== ESQUEMA_JARVIS) falla('schema');
  if (!ESTATS_PROGRES.includes(cos.estat)) falla('estat');
  if (!Array.isArray(cos.passos) || cos.passos.length > MAX_PASSOS) falla('passos');
  const passos = cos.passos.map((p, i) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) falla(`passos[${i}]`);
    if (typeof p.id !== 'string' || !ID_PAS.test(p.id)) falla(`passos[${i}].id`);
    if (!IDS_CANALS.includes(p.canal)) falla(`passos[${i}].canal`);
    if (typeof p.titol !== 'string' || !p.titol.trim() || p.titol.length > MAX_TITOL) falla(`passos[${i}].titol`);
    if (!ESTATS_PAS.includes(p.estat)) falla(`passos[${i}].estat`);
    if (p.detall != null && (typeof p.detall !== 'string' || p.detall.length > MAX_DETALL)) falla(`passos[${i}].detall`);
    const detall = typeof p.detall === 'string' ? p.detall.trim() : '';
    return { id: p.id, canal: p.canal, titol: p.titol.trim(), estat: p.estat, ...(detall ? { detall } : {}) };
  });
  if (new Set(passos.map((p) => p.id)).size !== passos.length) falla('passos.id');
  return { estat: cos.estat, passos };
}

/** Els textos fixos del panell: cap text del servidor ni cap camí arriba a la pantalla. */
export const MISSATGES_JARVIS = Object.freeze({
  'sense-corredor': 'Este servidor no porta el corredor Jarvis. Executa-ho al terminal:',
  'no-local': 'El corredor Jarvis només accepta ordres des d’este ordinador (localhost).',
  ocupat: 'Ja hi ha una publicació en marxa en este servidor. Espera que acabe.',
  error: 'El corredor Jarvis no ha pogut arrancar la publicació. Mira el terminal del servidor local.',
  xarxa: 'No s’ha pogut enviar l’ordre al servidor local.',
  iniciat: 'Publicació en marxa. Este panell s’actualitza sol cada dos segons.',
  fet: 'Publicació acabada. Cada pas diu com ha quedat.',
  aturada: 'La publicació s’ha aturat amb un error. Mira els passos i el terminal del servidor local.',
  contacte: 'S’ha perdut el contacte amb el corredor Jarvis. Mira el terminal del servidor local.',
  temps: 'El corredor Jarvis porta més de deu minuts sense acabar. Mira el terminal del servidor local.'
});

/* El cos com a JSON: un objecte ja ho és; una cadena es llig només si el
   tipus diu JSON (o no diu res). L'HTML de l'SPA, o qualsevol cosa que no
   es puga llegir, és null. */
function cosJson(contentType, cos) {
  if (cos && typeof cos === 'object') return Array.isArray(cos) ? null : cos;
  if (typeof cos !== 'string') return null;
  const tipus = String(contentType ?? '').toLowerCase();
  if (tipus && !tipus.includes('json')) return null;
  try {
    const json = JSON.parse(cos);
    return json && typeof json === 'object' && !Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

/**
 * Què vol dir la resposta del POST: { estat: 'iniciat'|'sense-corredor'|
 * 'no-local'|'error', passos?, missatge }. 202 JSON amb l'esquema → iniciat
 * (amb els passos si el cos els porta ben formats); 404, 405 o un cos que no
 * és JSON (l'HTML de l'SPA, un servidor sense corredor) → sense-corredor;
 * 403 → no-local; la resta → error, amb un text fix (409, el del corredor
 * ocupat).
 */
export function interpretaResposta({ status, contentType = '', cos } = {}) {
  if (status === 403) return { estat: 'no-local', missatge: MISSATGES_JARVIS['no-local'] };
  if (status === 404 || status === 405) return { estat: 'sense-corredor', missatge: MISSATGES_JARVIS['sense-corredor'] };
  const json = cosJson(contentType, cos);
  if (json === null) return { estat: 'sense-corredor', missatge: MISSATGES_JARVIS['sense-corredor'] };
  if (status === 202 && json.schema === ESQUEMA_JARVIS) {
    try {
      return { estat: 'iniciat', passos: llegixProgres(json).passos, missatge: MISSATGES_JARVIS.iniciat };
    } catch {
      return { estat: 'iniciat', missatge: MISSATGES_JARVIS.iniciat };
    }
  }
  return { estat: 'error', missatge: status === 409 ? MISSATGES_JARVIS.ocupat : MISSATGES_JARVIS.error };
}

/* Dins de cometes dobles l'intèrpret encara expandix $, ` i \: fora, amb les
   cometes dobles; els salts de línia, un espai (l'ordre és d'una línia). */
const PERILLOS_AL_TERMINAL = /["`$\\]/g;
/** L'ordre per a copiar al terminal quan el servidor no porta el corredor. */
export function ordreTerminal({ notes } = {}) {
  const text = normalitzaNotes(notes).replace(PERILLOS_AL_TERMINAL, '').replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim();
  return `npm run jarvis:publica-tot -- --notes "${text}"`;
}

/** Només en desenvolupament i amb una lectura viva dels empaquetats; fora de DEV, mai. */
export function potPublicarDesDAci({ dev, fontViva } = {}) {
  return dev === true && fontViva === true;
}

export const MOTIU_FORA_DE_DEV = 'Des de la web pública la publicació automàtica encara no està connectada (webhook pendent): es fa des del servidor local de Sóc de Poble.';
export const MOTIU_SENSE_FONT = 'Cal una lectura viva dels empaquetats (el servidor local de desenvolupament) per a publicar des d’ací.';
export const MOTIU_LLEST = 'Publica a tots els canals alhora des d’este ordinador.';

/**
 * Per què el botó va desactivat (text per a aria-describedby), o null si es
 * pot publicar. La guarda és potPublicarDesDAci (àrbitre T1a-ARB-04: una
 * sola guarda, la de l'encàrrec); ací només es tria el motiu.
 */
export function motiuDesactivat({ dev, fontViva, notes } = {}) {
  if (!potPublicarDesDAci({ dev, fontViva })) return dev !== true ? MOTIU_FORA_DE_DEV : MOTIU_SENSE_FONT;
  if (!normalitzaNotes(notes)) return ERROR_NOTES_BUIDES;
  return null;
}
