/** termometre_context.mjs — el termòmetre de fatiga d'una conversa d'Antigravity, únic i pur.
 *
 *  El problema, dit sense adornar-lo: el cas 4 de core-context-panic demanava a
 *  MarIA que «intuïra» la saturació, i la versió anterior d'este fitxer només
 *  comptava artefactes per a un hook (preflight_matrix_wrapper.mjs) que cap host
 *  executa. Les conversacions llargues arriben a 2890 passos, 43 resums
 *  automàtics i 213 pujades sense que ningú avise. El Mestre parla per veu: la
 *  majoria dels seus torns porten la petició buida, i un reconeixement per
 *  paraula escrita quasi mai arribaria per casualitat.
 *
 *  Què mesura (només llig, no escriu res):
 *    · passos      · el pas més alt de la transcripció (`step_index`), o el que
 *                    diga l'IDE al payload (`initialNumSteps`) si és més gran;
 *    · pujades     · fitxers de `.user_uploaded/` (captures `media_*.png` i notes
 *                    de veu `uploaded_media_*.img`), sense dotfiles ni `*.tmp`;
 *    · MB          · bytes de les pujades més els de la transcripció, en MiB;
 *    · resums      · registres CHECKPOINT (informatius: van amb els passos);
 *    · avisos      · efímers [FATIGA·N1..3] ja injectats, reconeixements
 *                    `#fatiga-vista` escrits pel Mestre (o «fatiga vista» dictat,
 *                    261007) i disparaments d'un `/schedule` de la mateixa conversa.
 *
 *  Contracte de l'IDE (2.5.5, llegit el 261002):
 *    ~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md
 *    · payload comú: conversationId, workspacePaths, transcriptPath,
 *      artifactDirectoryPath, modelName; PreInvocation hi afig invocationNum i
 *      initialNumSteps.
 *    · transcripció real: ~/.gemini/antigravity-ide/brain/<id>/.system_generated/logs/transcript.jsonl,
 *      una línia JSON per registre amb `step_index`, `source`, `type` i `content`.
 *      Les línies no van sempre en ordre de pas: el pas es compara, no la línia.
 *    · un missatge del Mestre (o un disparament del planificador) que arriba mentre
 *      el model treballa queda registrat DESPRÉS de l'efímer del hook de la crida que
 *      el consumix (23b0cc39: pas 2771 SYSTEM_SDK, 2772 USER_INPUT amb created_at
 *      anterior). Eixe avís pertany al torn nou: el model els veu junts.
 *
 *  La conversa es resol pel payload i mai per «la més recent» del directori:
 *  eixa tria falla amb `tempmediaStorage` i amb dues converses alhora.
 *
 *  Nucli pur: `llegixTranscript`, `nivellFatiga`, `decidixAvis` i
 *  `missatgeFatiga` no toquen el disc; `resolConversa`, `comptaPujades`,
 *  `mesuraFatiga` i `avaluaFatiga` només lligen. Cap mòdul fora de `node:`.
 *
 *  Compatibilitat: `comptaArtefactes`, `avis` i `MISSATGE` es conserven per a
 *  `.agents/hooks/preflight_matrix_wrapper.mjs` i `tests/backend_consolidacio.test.mjs`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Directori de converses de l'IDE. */
export const BRAIN = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');

/** Marca de l'efímer que injecta el hook: el nivell va en el grup 1. */
export const MARCA = /\[FATIGA·N([1-3])\b/;
/** El que escriu el Mestre per a reconéixer un avís. Només compta dins d'un USER_INPUT. */
export const RECONEIX = '#fatiga-vista';
/** La mateixa paraula dictada: el Mestre parla quasi sempre per veu (261007). */
export const RECONEIX_VEU = 'fatiga vista';
/** Torns del Mestre entre dos avisos de N2 sense reconeixement (cadència apta per a veu). */
export const CADENCIA_VEU = 10;
/** Per damunt d'esta mida la transcripció es compta per regex, sense parse complet. */
export const LIMIT_PARSE_BYTES = 20 * 1024 * 1024;
/** Pressupost d'una avaluació: el hook té 5 s de timeout i n'ha de sobrar. */
export const PRESSUPOST_MS = 2000;
/** Frase literal del cas 4 de .agents/skills/core-context-panic/SKILL.md (una prova la contrasta). */
export const FRASE_CAS4 = "¡Uy cuidado, Mestre, que estic saturada! He superat els 150-180 artefactes a la motxilla. Tranquil·la, anem a relaxar-nos i decidir. Què fem? Ens quedem ací tancant l'últim serrell o fem un Acta Marmota i ens n'anem a un altre xat fresc?";
/** Resultat d'`avaluaFatiga` quan el payload no porta cap conversa resoluble: no és un error del sensor. */
export const SENSE_IDENTITAT = 'sense-identitat';

const METRIQUES = Object.freeze(['passos', 'pujades', 'mb']);
const NIVELLS = Object.freeze([1, 2, 3]);
const MIB = 1024 * 1024;
const RUTA_TRANSCRIPT = path.join('.system_generated', 'logs', 'transcript.jsonl');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* Directori de mitjans temporals de l'IDE, germà de les converses: mai és una conversa. */
const NO_CONVERSA = 'tempmediaStorage';

/* Calibratge (sessions reals del 261001-261002): 23b0cc39 · 2890/177/85,6 → N3;
   ab2072b5 · 2456/213/98,3 → N3; 1bcedaed · 120/19/9,4 → N0. */
export const LLINDARS_DEFECTE = congela({
  1: { passos: 1200, pujades: 100, mb: 50 },
  2: { passos: 2000, pujades: 150, mb: 80 },
  3: { passos: 2800, pujades: 210, mb: 110 },
});

function congela(ll) {
  return Object.freeze(Object.fromEntries(NIVELLS.map((n) => [n, Object.freeze({ ...ll[n] })])));
}

/** Tres nivells amb les tres mètriques positives i que no baixen d'un nivell al següent. */
export function validaLlindars(ll) {
  if (!ll || typeof ll !== 'object') return false;
  for (const n of NIVELLS) {
    const x = ll[n];
    if (!x || typeof x !== 'object' || Object.keys(x).some((k) => !METRIQUES.includes(k))) return false;
    if (!METRIQUES.every((k) => Number.isFinite(x[k]) && x[k] > 0)) return false;
  }
  return METRIQUES.every((k) => ll[1][k] <= ll[2][k] && ll[2][k] <= ll[3][k]);
}

/**
 * Llindars efectius. `SDP_LIMIT_ARTEFACTES` és l'àlies antic de N2.pujades: el
 * fixa i, si cal per a conservar l'ordre, arrossega N1.pujades cap avall o
 * N3.pujades cap amunt. `SDP_FATIGA_LLINDARS` és un JSON parcial
 * ({"2":{"pujades":120}}) que es fusiona damunt. Cada capa que no passa
 * `validaLlindars` es descarta sencera: un JSON il·legible o desordenat deixa
 * els valors per defecte, mai un forat.
 */
export function llindarsDe(env = {}) {
  let ll = LLINDARS_DEFECTE;
  const alies = env.SDP_LIMIT_ARTEFACTES;
  if (alies !== undefined && String(alies).trim() !== '') {
    const a = Number(alies);
    const amb = {
      1: { ...ll[1], pujades: Math.min(ll[1].pujades, a) },
      2: { ...ll[2], pujades: a },
      3: { ...ll[3], pujades: Math.max(ll[3].pujades, a) },
    };
    if (validaLlindars(amb)) ll = amb;
  }
  const json = env.SDP_FATIGA_LLINDARS;
  if (typeof json === 'string' && json.trim()) {
    let o = null;
    try { o = JSON.parse(json); } catch { o = null; }
    const pla = (v) => v && typeof v === 'object' && !Array.isArray(v);
    if (pla(o) && Object.keys(o).every((k) => ['1', '2', '3'].includes(k)) && Object.values(o).every(pla)) {
      const amb = Object.fromEntries(NIVELLS.map((n) => [n, { ...ll[n], ...(o[n] ?? {}) }]));
      if (validaLlindars(amb)) ll = amb;
    }
  }
  return congela(ll);
}

export const LLINDARS = llindarsDe(process.env);

/* ── Conversa ─────────────────────────────────────────────────────────────── */

const text = (v) => (typeof v === 'string' && v.trim() ? v : null);
const dins = (pare, fill) => {
  const r = path.relative(pare, fill);
  return Boolean(r) && !r.startsWith('..') && !path.isAbsolute(r);
};
const esFitxer = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

/**
 * Directori i transcripció de la conversa del payload, o null. Ordre:
 * artifactDirectoryPath → dos nivells per damunt de transcriptPath →
 * brain/conversationId. Amb conversationId, el directori s'ha de dir igual;
 * sense, el nom ha de ser un UUID. La transcripció ha d'existir.
 */
export function resolConversa(payload, { brain = BRAIN } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const id = text(payload.conversationId);
  if (id !== null && (id !== path.basename(id) || id === '.' || id === '..' || id === NO_CONVERSA)) return null;
  const transcriptPayload = text(payload.transcriptPath) ? path.resolve(payload.transcriptPath) : null;
  const candidats = [];
  if (text(payload.artifactDirectoryPath)) candidats.push(path.resolve(payload.artifactDirectoryPath));
  if (transcriptPayload) candidats.push(path.resolve(path.dirname(transcriptPayload), '..', '..'));
  if (id && text(brain)) candidats.push(path.join(brain, id));
  for (const dir of candidats) {
    const nom = path.basename(dir);
    if (nom === NO_CONVERSA || (id ? nom !== id : !UUID.test(nom))) continue;
    const transcript = transcriptPayload && dins(dir, transcriptPayload) ? transcriptPayload : path.join(dir, RUTA_TRANSCRIPT);
    if (esFitxer(transcript)) return { id: id ?? nom, dir, transcript };
  }
  return null;
}

/* ── Transcripció ─────────────────────────────────────────────────────────── */

/* Capçalera de cada línia, tal com l'escriu l'IDE: basta per al recompte lleuger. */
const CAPCALERA = /^\{"step_index":(\d+),"source":"([A-Z_]+)","type":"([A-Z_]+)"/;
/* Tipus dels quals cal mirar el contingut; la resta només compten el pas. */
const AMB_CONTINGUT = new Set(['USER_INPUT', 'EPHEMERAL_MESSAGE', 'SYSTEM_MESSAGE', 'GENERIC']);
/* Un /schedule es registra com a tasca de fons «Cron: …» i cada disparament és un
   SYSTEM_MESSAGE amb sender=<conversa>/task-N i «(iteration K)». En mode lleuger el
   contingut és la línia crua: els salts de línia hi són «\n» escapats. */
const CRON_PARSE = /^(?:Created At:[^\n]*\n)?Tool is running as a background task with task id: (\S+)\nTask Description: Cron:/;
const CRON_CRU = /"content":"(?:Created At:(?:[^"\\]|\\.)*?\\n)?Tool is running as a background task with task id: ([^\s"\\]+)\\nTask Description: Cron:/;
const REMITENT = /sender=([^\s"\\]+)/;
const ITERACIO = /\(iteration \d+\)(?:\s|\\n)*<\/SYSTEM_MESSAGE>/;
const PETICIO = /<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/;
/* Reconeixement escrit o dictat. Ordre del Mestre (261007): el Mestre parla quasi
   sempre per veu, i el dictat no escriu el coixinet. A més de `#fatiga-vista`, compta
   la forma transcrita «fatiga vista»: sense coixinet, en qualsevol caixa i amb
   espai(s) o guionet entre les dues paraules, mai enganxada a una altra paraula.
   Continua comptant només dins de la petició d'un USER_INPUT, i un salt de línia
   entre les dues paraules no compta. En mode lleuger el text cru porta els salts
   escapats («\n» com a dos caràcters): una lletra precedida de «\» no enganxa. */
const RECONEIX_RE = /(?<!(?<!\\)[\p{L}\p{N}_-])#?fatiga[ \t\xa0-]+vista(?![\p{L}\p{N}_-])/iu;

/**
 * Recompte d'una transcripció JSONL. Una línia que no es pot llegir es compta a
 * `corruptes` i no amaga les vàlides. Amb `lleuger`, cada línia es classifica per
 * la capçalera i només es mira el text cru dels tipus amb contingut.
 * `ultimAvis.pas` és el pas del torn on el model va vore l'avís: el del registre,
 * o el del USER_INPUT o disparament que el seguix sense cap registre del model
 * entremig (vegeu la capçalera del fitxer).
 */
export function llegixTranscript(textTranscript, { lleuger = false } = {}) {
  const humansPas = [];
  const registrats = [];
  const modelPas = [];
  const disparaments = [];
  const cronIds = new Set();
  let resums = 0;
  let corruptes = 0;
  let maxPas = -1;
  let programats = 0;
  let ultimHuma = null;
  let ultimReconeix = null;

  for (const cru of String(textTranscript ?? '').split('\n')) {
    const linia = cru.endsWith('\r') ? cru.slice(0, -1) : cru;
    if (!linia.trim()) continue;
    let pas = null;
    let font = null;
    let tipus = null;
    let contingut = '';
    const cap = lleuger ? CAPCALERA.exec(linia) : null;
    if (cap) {
      pas = Number(cap[1]);
      font = cap[2];
      tipus = cap[3];
      if (AMB_CONTINGUT.has(tipus)) contingut = linia;
    } else {
      let r;
      try { r = JSON.parse(linia); } catch { corruptes++; continue; }
      if (!r || typeof r !== 'object' || Array.isArray(r)) { corruptes++; continue; }
      pas = Number.isInteger(r.step_index) && r.step_index >= 0 ? r.step_index : null;
      font = typeof r.source === 'string' ? r.source : null;
      tipus = typeof r.type === 'string' ? r.type : null;
      contingut = typeof r.content === 'string' ? r.content : '';
    }
    if (pas === null) pas = maxPas + 1;
    if (pas > maxPas) maxPas = pas;
    if (font === 'MODEL') modelPas.push(pas);

    if (tipus === 'CHECKPOINT') resums++;
    else if (tipus === 'USER_INPUT') {
      humansPas.push(pas);
      if (ultimHuma === null || pas > ultimHuma) ultimHuma = pas;
      const peticio = PETICIO.exec(contingut);
      if (RECONEIX_RE.test(peticio ? peticio[1] : contingut) && (ultimReconeix === null || pas > ultimReconeix)) ultimReconeix = pas;
    } else if (tipus === 'EPHEMERAL_MESSAGE') {
      const m = MARCA.exec(contingut);
      if (m) registrats.push({ pas, nivell: Number(m[1]) });
    } else if (tipus === 'SYSTEM_MESSAGE') {
      const remitent = REMITENT.exec(contingut);
      disparaments.push({ pas, remitent: remitent ? remitent[1] : null, iteracio: ITERACIO.test(contingut) });
    } else if (tipus === 'GENERIC') {
      const m = (cap ? CRON_CRU : CRON_PARSE).exec(contingut);
      if (m) { cronIds.add(m[1]); programats++; }
    }
  }

  const perPas = (a, b) => a.pas - b.pas;
  const crons = disparaments.filter((d) => (d.remitent && cronIds.has(d.remitent)) || d.iteracio);
  // Cada avís passa al darrer torn (USER_INPUT o disparament) que el seguix abans del
  // primer registre del model: el model els va vore en la mateixa crida.
  const torns = [...humansPas, ...crons.map((d) => d.pas)];
  modelPas.sort((a, b) => a - b);
  const avisos = registrats.map((a) => {
    const resposta = modelPas.find((p) => p > a.pas) ?? Infinity;
    const torn = torns.reduce((max, p) => (p > max && p < resposta ? p : max), a.pas);
    return { pas: torn, nivell: a.nivell };
  }).sort(perPas);
  const ultimAvis = avisos.length ? { ...avisos[avisos.length - 1] } : null;
  // El nivell reconegut és el de l'últim avís anterior a l'escrit del Mestre (0 si no n'hi havia cap).
  const reconegut = ultimReconeix === null ? null : avisos.filter((a) => a.pas < ultimReconeix).pop() ?? null;
  return {
    passos: maxPas + 1,
    resums,
    humans: humansPas.length,
    ultimHuma,
    humansDesDeAvis: ultimAvis ? humansPas.filter((p) => p > ultimAvis.pas).length : humansPas.length,
    avisos: avisos.length,
    ultimAvis,
    reconeixement: ultimReconeix === null ? null : { pas: ultimReconeix, nivell: reconegut ? reconegut.nivell : 0 },
    crons: crons.length,
    ultimCron: crons.reduce((max, d) => (max === null || d.pas > max ? d.pas : max), null),
    programats,
    corruptes,
  };
}

/* ── Pujades ──────────────────────────────────────────────────────────────── */

const IMATGE = /\.(?:png|jpe?g|gif|webp|heic|heif|bmp|tiff?)$/i;
/* Les notes de veu arriben com a `uploaded_media_*.img` (WebM/Opus dins). */
const VEU = /\.(?:img|webm|ogg|opus|oga|m4a|mp3|wav|aac)$/i;

/** Pujades del Mestre a `<conversa>/.user_uploaded/`. Sense dotfiles (.DS_Store) ni `*.tmp`. */
export function comptaPujades(dir) {
  const out = { n: 0, bytes: 0, imatges: 0, veu: 0, altres: 0 };
  const carpeta = path.join(dir, '.user_uploaded');
  let entrades;
  try { entrades = fs.readdirSync(carpeta, { withFileTypes: true }); } catch { return out; }
  for (const e of entrades) {
    if (e.name.startsWith('.') || /\.tmp$/i.test(e.name)) continue;
    let st;
    try { st = fs.statSync(path.join(carpeta, e.name)); } catch { continue; }
    if (!st.isFile()) continue;
    out.n++;
    out.bytes += st.size;
    if (IMATGE.test(e.name)) out.imatges++;
    else if (VEU.test(e.name)) out.veu++;
    else out.altres++;
  }
  return out;
}

/* ── Mesura, nivell i política ────────────────────────────────────────────── */

/** Mesura d'una conversa resolta. `passosPayload` és l'`initialNumSteps` de l'IDE, si n'hi ha. */
export function mesuraFatiga(conversa, { passosPayload = null } = {}) {
  const bytesTranscript = fs.statSync(conversa.transcript).size;
  const lleuger = bytesTranscript > LIMIT_PARSE_BYTES;
  const t = llegixTranscript(fs.readFileSync(conversa.transcript, 'utf8'), { lleuger });
  const p = comptaPujades(conversa.dir);
  const delPayload = Number.isInteger(passosPayload) && passosPayload > 0 ? passosPayload : 0;
  return {
    ...t,
    id: conversa.id,
    passos: Math.max(t.passos, delPayload),
    passosTranscript: t.passos,
    pujades: p.n,
    imatges: p.imatges,
    veu: p.veu,
    altres: p.altres,
    bytes: p.bytes + bytesTranscript,
    mb: (p.bytes + bytesTranscript) / MIB,
    mode: lleuger ? 'regex' : 'parse',
  };
}

const ETIQUETA = Object.freeze({ passos: 'passos', pujades: 'pujades', mb: 'MB' });
/** 85.6 → «85,6»; 80 → «80». */
export function xifra(v) {
  if (!Number.isFinite(v)) return '—';
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
}

/** Nivell 0..3: el màxim que assoleix qualsevol de passos, pujades o MB. */
export function nivellFatiga(m, llindars = LLINDARS) {
  let nivell = 0;
  const motius = [];
  for (const k of METRIQUES) {
    const v = m?.[k];
    if (!Number.isFinite(v)) continue;
    const n = [3, 2, 1].find((x) => v >= llindars[x][k]) ?? 0;
    if (!n) continue;
    motius.push(`${ETIQUETA[k]} ${xifra(k === 'mb' ? Math.round(v * 10) / 10 : v)} ≥ ${xifra(llindars[n][k])} (N${n})`);
    if (n > nivell) nivell = n;
  }
  return { nivell, motius };
}

/**
 * Cal injectar l'avís d'este nivell? Mai dues vegades dins del mateix torn (un
 * torn comença amb un USER_INPUT o amb un disparament del planificador).
 *   N0 · mai.
 *   N1 · una sola vegada per conversa.
 *   N2 · si l'últim avís era de nivell inferior, o si des d'ell hi ha hagut
 *        CADENCIA_VEU torns del Mestre, excepte si el Mestre ha escrit
 *        #fatiga-vista després d'un avís de nivell 2 o més.
 *   N3 · a cada torn nou, del Mestre o del planificador. No es pot silenciar.
 * Un avís atribuït al torn que el seguix (llegixTranscript) porta el pas d'eixe
 * torn: per això el mateix pas ja compta com a «dins del torn».
 * Límit de PreInvocation: si el missatge del Mestre arriba mentre el model treballa,
 * la crida que el consumix encara no el veu a la transcripció; l'avís d'eixe torn
 * arriba a la crida següent, o al torn següent si el model tanca el bucle ací.
 */
export function decidixAvis(estat, nivell) {
  if (!(nivell >= 1)) return false;
  const avis = estat?.ultimAvis ?? null;
  if (!avis) return true;
  const tornActual = Math.max(estat?.ultimHuma ?? -1, estat?.ultimCron ?? -1);
  if (avis.pas >= tornActual) return false;
  if (nivell === 1) return false;
  if (nivell >= 3) return avis.pas < tornActual;
  if (avis.nivell < 2) return true;
  const rec = estat?.reconeixement ?? null;
  if (rec && rec.nivell >= 2 && rec.pas > avis.pas) return false;
  return (estat?.humansDesDeAvis ?? 0) >= CADENCIA_VEU;
}

const plural = (n, u, p) => `${n} ${n === 1 ? u : p}`;

/** Línia de xifres reals: sense cap llindar fix, només el que diuen la mesura i els motius. */
export function liniaXifres(m, motius = []) {
  const detall = [
    plural(m.imatges ?? 0, 'captura', 'captures'),
    plural(m.veu ?? 0, 'nota de veu', 'notes de veu'),
    ...(m.altres ? [plural(m.altres, 'altra', 'altres')] : []),
  ].join(', ');
  const parts = [
    plural(m.passos ?? 0, 'pas', 'passos'),
    `${plural(m.pujades ?? 0, 'pujada', 'pujades')} (${detall})`,
    `${xifra(Math.round((m.mb ?? 0) * 10) / 10)} MB`,
    plural(m.resums ?? 0, 'resum automàtic', 'resums automàtics'),
    ...(m.crons ? [plural(m.crons, 'disparament del planificador', 'disparaments del planificador')] : []),
  ];
  return `Xifres: ${parts.join(' · ')}.${motius.length ? ` Llindars superats: ${motius.join('; ')}.` : ''}`;
}

/** Efímer de l'avís. Comença sempre per «[FATIGA·N<n> · conv <8 primers>]». */
export function missatgeFatiga(nivell, m, motius, id) {
  const cap = `[FATIGA·N${nivell} · conv ${String(id ?? m?.id ?? '????????').slice(0, 8)}]`;
  const xifres = liniaXifres(m, motius);
  if (nivell <= 1) {
    return `${cap} Primer llindar de fatiga de context (cas 4 de core-context-panic). ${xifres} Quan acabes la tasca en curs, avisa el Mestre en una línia amb estes xifres; no cal aturar-se. Este avís només ix una vegada per conversa.`;
  }
  const frase = `Digues al Mestre, literalment, la frase del cas 4, «${FRASE_CAS4}», i, en la línia següent, les xifres reals d'este avís. ${xifres}`;
  const vista = `Només el Mestre pot reconéixer este avís, escrivint ${RECONEIX} en el xat o dictant «${RECONEIX_VEU}»; tu no el pots escriure ni donar per reconegut.`;
  if (nivell === 2) {
    return `${cap} Saturació de context (cas 4 de core-context-panic). Acaba el pas en curs i no n'encetes cap altre. ${frase} ${vista} Sense reconeixement, l'avís tornarà cada ${CADENCIA_VEU} torns del Mestre.`;
  }
  const planificador = m?.crons || m?.programats
    ? ` En esta conversa hi ha un /schedule (${plural(m.crons ?? 0, 'disparament', 'disparaments')}${m.ultimCron !== null && m.ultimCron !== undefined ? `; l'últim, al pas ${m.ultimCron}` : ''}): si encara és actiu, proposa al Mestre cancel·lar-lo.`
    : '';
  return `${cap} Saturació greu de context (cas 4 de core-context-panic). No comences cap tasca nova. ${frase} Proposa-li l'Acta Marmota i continuar en un xat fresc.${planificador} Este avís no es pot silenciar: tornarà a cada torn del Mestre i a cada disparament del planificador.`;
}

/**
 * Avaluació sencera per al hook: {nivell, motius, missatge|null, mesura, ms},
 * {error: SENSE_IDENTITAT} si el payload no porta cap conversa resoluble, o
 * {error} si el sensor falla. No llança mai.
 */
export function avaluaFatiga(payload, { brain = BRAIN, llindars = LLINDARS, ara = () => Date.now() } = {}) {
  const t0 = ara();
  try {
    const conversa = resolConversa(payload, { brain });
    if (!conversa) return { error: SENSE_IDENTITAT };
    const mesura = mesuraFatiga(conversa, { passosPayload: payload?.initialNumSteps ?? null });
    const { nivell, motius } = nivellFatiga(mesura, llindars);
    const missatge = decidixAvis(mesura, nivell) ? missatgeFatiga(nivell, mesura, motius, conversa.id) : null;
    return { nivell, motius, missatge, mesura, ms: ara() - t0 };
  } catch (e) {
    return { error: String(e?.message ?? e), ms: ara() - t0 };
  }
}

/* ── Compatibilitat (preflight_matrix_wrapper.mjs) ────────────────────────── */

/** Documents `.md` a l'arrel de la conversa més les pujades del Mestre. */
export function comptaArtefactes(transcriptPath) {
  if (typeof transcriptPath !== 'string' || !transcriptPath) throw new TypeError('transcriptPath absent');
  const brainDir = transcriptPath.split('/.system_generated')[0];
  let md = 0;
  try {
    md = fs.readdirSync(brainDir, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.endsWith('.md')).length;
  } catch { md = 0; }
  return md + comptaPujades(brainDir).n;
}

export const MISSATGE = `Mestre, la memòria tèrmica està al límit (${LLINDARS[2].pujades} artefactes o més). ` +
  'És millor tancar el xat i obrir-ne un de nou.';

export function avis(transcriptPath) {
  const n = comptaArtefactes(transcriptPath);
  return n >= LLINDARS[2].pujades ? { n, missatge: MISSATGE } : null;
}
