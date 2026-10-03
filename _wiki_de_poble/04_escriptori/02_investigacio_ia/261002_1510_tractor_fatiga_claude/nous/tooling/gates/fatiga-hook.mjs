#!/usr/bin/env node
/** fatiga-hook.mjs — el cas 4 de core-context-panic, dit en el dialecte d'Antigravity.
 *
 *  El problema, dit sense adornar-lo: la saturació d'una conversa llarga només
 *  la podia detectar MarIA mateixa, «intuint-la», i el termòmetre que comptava
 *  artefactes penjava d'un hook que cap host executa. Este hook és el sensor: a
 *  cada PreInvocation mesura la conversa (passos, pujades del Mestre i MB) amb
 *  `../brain/termometre_context.mjs` i, quan toca, injecta l'efímer
 *  [FATIGA·N1..3] amb les xifres reals.
 *
 *  Contracte (documentació local de l'IDE 2.5.5, llegida el 261002):
 *    ~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md
 *    · `.agents/hooks.json`: hook amb nom «sdp-fatiga», germà de «sdp-olivera».
 *      Diversos hooks amb nom del mateix esdeveniment es fusionen i s'executen
 *      un darrere de l'altre: este no toca ni depén d'antigravity-hook.mjs.
 *    · L'ordre corre amb `sh -c` des de `.agents/`: per això fa `cd ..`.
 *    · Entrada per stdin, JSON en camelCase: conversationId, workspacePaths,
 *      transcriptPath, artifactDirectoryPath, modelName, invocationNum i
 *      initialNumSteps.
 *    · Eixida per stdout: `{injectSteps: [{ephemeralMessage}]}` o `{}`.
 *
 *  Seguretat de funcionament:
 *    · Mai llança i mai decidix res més que un efímer: davant de qualsevol error
 *      escriu `{}`, i només a la primera invocació del torn (invocationNum 1)
 *      injecta «[FATIGA·ERR] sensor no operatiu (motiu)».
 *    · Sense conversa resoluble al payload, `{}` i traça «sense-identitat»: no
 *      tria mai «la conversa més recent».
 *    · Interruptor d'apagada: si existix `.agents/runtime/fatiga-hook.off`, torna
 *      `{}` sense mesurar ni traçar. És del Mestre.
 *    · Fase 0: si existix `.agents/runtime/fatiga-hook.fase0`, mesura i traça
 *      però no injecta res (tampoc l'ERR). Servix per a acreditar, amb una sessió
 *      real, quines claus envia l'IDE i quin nivell hauria eixit.
 *    · Traça d'una línia JSON per invocació a `.agents/runtime/fatiga-hook.log`
 *      (fora de git per `*.log`): conversa (8 caràcters), invocació, passos del
 *      payload, nivell, noms de les claus del payload (mai els valors) i ms.
 *    · stdin només es llig si no és un terminal: executat a mà no es penja.
 *
 *  Nucli pur: `decidixFatiga` rep l'avaluador per paràmetre i es prova amb un de
 *  fals. El termòmetre real s'importa amb `import()` dins de `main()`: si no
 *  carrega, el hook continua responent `{}`.
 *
 *  Ús (des de l'arrel; l'IDE ho fa amb `cd ..` des de `.agents/`):
 *    node tooling/gates/fatiga-hook.mjs < payload.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const INTERRUPTOR = '.agents/runtime/fatiga-hook.off';
export const FASE0 = '.agents/runtime/fatiga-hook.fase0';
export const TRACA = '.agents/runtime/fatiga-hook.log';
/* Còpia de SENSE_IDENTITAT del termòmetre: el nucli no l'importa per a no dependre'n si falla. */
export const SENSE_IDENTITAT = 'sense-identitat';

export function retalla(text, max = 200) {
  const t = String(text ?? '');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

const esObjecte = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
/** Noms de les claus del payload, ordenats. Mai els valors: hi ha rutes i identificadors. */
export const clausDe = (payload) => (esObjecte(payload) ? Object.keys(payload).sort() : []);

/** Resposta davant d'un error: només la primera invocació del torn sap que el sensor no va. */
export function perError(invocationNum, motiu, { fase0 = false } = {}) {
  if (fase0 || invocationNum !== 1) return {};
  return { injectSteps: [{ ephemeralMessage: `[FATIGA·ERR] sensor no operatiu (${retalla(motiu, 160)})` }] };
}

/**
 * Nucli: decidix l'eixida i la traça d'una invocació.
 * @param {object|null} payload  el JSON de l'IDE (null si no s'ha pogut llegir)
 * @param {object} deps
 * @param {(payload: object) => object} [deps.avalua]  avaluaFatiga del termòmetre
 * @param {boolean} [deps.fase0]  mesura i traça, però no injecta
 * @param {string|null} [deps.error]  error previ (stdin il·legible, termòmetre absent)
 */
export function decidixFatiga(payload, { avalua = null, fase0 = false, error = null } = {}) {
  const inv = Number.isInteger(payload?.invocationNum) ? payload.invocationNum : null;
  const passosPayload = Number.isInteger(payload?.initialNumSteps) ? payload.initialNumSteps : null;
  const idPayload = typeof payload?.conversationId === 'string' && payload.conversationId ? payload.conversationId : null;
  const base = (id) => ({ conv: id ? id.slice(0, 8) : null, inv, passosPayload, claus: clausDe(payload), ...(fase0 ? { fase0: true } : {}) });
  const fallada = (motiu, id = idPayload) => ({
    eixida: perError(inv, motiu, { fase0 }),
    traca: { ...base(id), nivell: 'error', motiu: retalla(motiu) },
  });

  if (error) return fallada(error);
  if (!esObjecte(payload)) return fallada('payload que no és un objecte JSON');
  if (typeof avalua !== 'function') return fallada('termòmetre no carregat');

  let r;
  try { r = avalua(payload); } catch (e) { r = { error: String(e?.message ?? e) }; }
  if (!esObjecte(r)) r = { error: 'el termòmetre ha tornat un resultat il·legible' };
  if (r.error === SENSE_IDENTITAT) return { eixida: {}, traca: { ...base(idPayload), nivell: SENSE_IDENTITAT } };
  const id = idPayload ?? (typeof r.mesura?.id === 'string' ? r.mesura.id : null);
  if (r.error) return fallada(r.error, id);
  if (!Number.isInteger(r.nivell)) return fallada('el termòmetre no ha tornat cap nivell', id);

  const missatge = typeof r.missatge === 'string' && r.missatge ? r.missatge : null;
  return {
    eixida: missatge && !fase0 ? { injectSteps: [{ ephemeralMessage: missatge }] } : {},
    traca: { ...base(id), nivell: r.nivell, avis: Boolean(missatge) },
  };
}

/* ── Procés ───────────────────────────────────────────────────────────────── */

function llegeixPayload() {
  if (process.stdin.isTTY) return { payload: null, error: 'stdin és un terminal: cap payload' };
  let raw;
  try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { return { payload: null, error: `stdin il·legible (${e.message})` }; }
  if (!raw.trim()) return { payload: null, error: 'payload buit' };
  try { return { payload: JSON.parse(raw), error: null }; } catch (e) { return { payload: null, error: `payload il·legible (${e.message})` }; }
}

function traca(root, entrada) {
  try {
    const fitxer = path.join(root, TRACA);
    fs.mkdirSync(path.dirname(fitxer), { recursive: true });
    fs.appendFileSync(fitxer, `${JSON.stringify({ t: new Date().toISOString(), ...entrada })}\n`);
  } catch { /* la traça no decidix mai */ }
}

const escriu = (eixida) => process.stdout.write(`${JSON.stringify(eixida)}\n`);

async function main() {
  const t0 = Date.now();
  const root = path.resolve(process.env.SDP_ARREL || process.cwd());
  // stdin es buida sempre: l'IDE hi escriu el payload sencer i no ha de trobar la canonada tancada.
  const { payload, error } = llegeixPayload();
  if (fs.existsSync(path.join(root, INTERRUPTOR))) { escriu({}); return; }
  const fase0 = fs.existsSync(path.join(root, FASE0));

  let decisio;
  try {
    let avalua = null;
    let errorCarrega = error;
    if (!errorCarrega) {
      try {
        const termometre = await import('../brain/termometre_context.mjs');
        avalua = (p) => termometre.avaluaFatiga(p);
      } catch (e) { errorCarrega = `termòmetre no carregat (${e.message})`; }
    }
    decisio = decidixFatiga(payload, { avalua, fase0, error: errorCarrega });
  } catch (e) {
    const inv = Number.isInteger(payload?.invocationNum) ? payload.invocationNum : null;
    decisio = { eixida: perError(inv, e?.message ?? e, { fase0 }), traca: { nivell: 'error', inv, motiu: retalla(e?.message ?? e) } };
  }
  traca(root, { ...decisio.traca, ms: Date.now() - t0 });
  escriu(decisio.eixida);
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais, i sota un
// symlink (/var → /private/var a macOS) cal el camí real per a coincidir.
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main().catch(() => escriu({}));
}
