/**
 * construeixMapa.js — compilador pur del Mapa de la Consola (sdp.mapa.v1).
 *
 * No llig el disc, ni git, ni la xarxa: rep les fonts ja llegides (o `null`
 * si falten) i torna el JSON que pinta la Consola. La closca que llig el disc
 * és tooling/brain/mapa-consola.mjs; el contracte, a
 * _wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md.
 *
 * Regla d'or, la mateixa que Emowe: el que falta es pinta, no s'inventa.
 * Una font absent dóna un avís i una mètrica N/A, mai un verd.
 *
 * Confiança de cada aresta:
 *   declarat → camp estructurat (JSON, frontmatter, configuració)
 *   derivat  → analitzador determinista sobre codi o ordres
 *   inferit  → prosa; es pinta discontinu i no compta per a decidir orfes
 */

import { ESQUEMA_MAPA } from './contracteMapa.js';
// Ordre del Mestre, 261004 (xat: cap xifra solta) · les evidències també concorden («1 segell fòssil»),
// i «de» davant d'una xifra s'apostrofa quan toca («1 d’1 torn», verificador de la tercera passada, punt 3).
import { concorda, de, plural } from '../concordanca.js';

/** Ordre que reproduïx el mapa: tota mètrica calculada ací cita esta prova. */
export const PROVA_MAPA = 'node tooling/brain/mapa-consola.mjs --json';

const RUTA_SKILL = /^\.agents\/skills\/([^/]+)\/SKILL\.md$/;
const RUTA_PLANTILLA = /^_wiki_de_poble\/03_actuar\/plantilles\//;
const RUTA_SCRIPT = /\.(?:mjs|cjs|js|sh|py)$/;
/** Scripts del repositori citats dins d'una ordre de shell o de npm. */
const SCRIPT_EN_ORDRE = /(?:^|[\s"'/(=])((?:tooling|scripts)\/[\w./-]+?\.(?:mjs|cjs|js|sh|py))(?![\w.])/g;
const NPM_RUN = /\bnpm run ([\w:.-]+)/g;
/** Llindars del semàfor adaptat (03_inventari_skills.md). */
const MAX_PARAULES = 3000;
const MAX_TOKENS = 4000;
const TOKENS_PER_PARAULA = 1.3;
const LLETRES_MINIMES_DISPARADOR = 4;
/** Paraules comunes documentades com a disparadors massa amples. */
const DISPARADORS_COMUNS = new Set(['error']);
const DOS_CICLES = 2;
/* Vigilància constant: T12 (ordre del Mestre, 260930). */
const HORA_MS = 3600000;
const DIA_MS = 24 * HORA_MS;
/** Recaigudes «recents»: els set dies naturals fins avui. */
const FINESTRA_RECAIGUDES_DIES = 7;
const CARPETA_ESCRIPTORI = '_wiki_de_poble/04_escriptori';

/** Identificador de node a partir d'una ruta del repositori. */
export function nodeDeRuta(ruta) {
  const skill = RUTA_SKILL.exec(ruta);
  if (skill) return { id: `skill:${skill[1]}`, tipus: 'skill' };
  if (RUTA_PLANTILLA.test(ruta)) return { id: `plantilla:${ruta}`, tipus: 'plantilla' };
  if (RUTA_SCRIPT.test(ruta)) return { id: `script:${ruta}`, tipus: 'script' };
  return { id: `document:${ruta}`, tipus: 'document' };
}

/** Scripts del repositori que una ordre executa, sense duplicats i en ordre. */
export function scriptsDeOrdre(ordre) {
  if (typeof ordre !== 'string') return [];
  const vistos = new Set();
  for (const m of ordre.matchAll(SCRIPT_EN_ORDRE)) vistos.add(m[1]);
  return [...vistos];
}

/** Ordres `npm run X` citades dins d'una altra ordre. */
export function npmDeOrdre(ordre) {
  if (typeof ordre !== 'string') return [];
  return [...new Set([...ordre.matchAll(NPM_RUN)].map((m) => m[1]))];
}

/**
 * Un disparador és decoratiu quan no pot saltar per si sol: llista buida, o
 * tots els disparadors són «skill …» (el nom de la skill posat de disparador).
 */
export function disparadorsDecoratius(triggers) {
  if (!Array.isArray(triggers) || triggers.length === 0) return true;
  return triggers.every((t) => typeof t !== 'string' || /^skill\s/i.test(t.trim()) || !t.trim());
}

/** Data `AAMMDD` d'una línia del LEDGER → epoch ms (00:00 UTC); NaN si no és una data. */
export function dataLedger(aammdd) {
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(String(aammdd ?? '').trim());
  if (!m) return NaN;
  const [any, mes, dia] = [2000 + Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(any, mes - 1, dia);
  const d = new Date(t);
  return d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia ? t : NaN;
}

/** Disparadors que casen dins de paraules corrents (el router compara per subcadena). */
export function disparadorsAmples(triggers) {
  if (!Array.isArray(triggers)) return [];
  return triggers.filter((t) => typeof t === 'string'
    && (t.trim().length < LLETRES_MINIMES_DISPARADOR || DISPARADORS_COMUNS.has(t.trim().toLowerCase())));
}

function metrica(nom, { numerador = null, denominador = null, valor, unitat = 'fraccio', font, prova = null }) {
  const calculable = Number.isInteger(numerador) && Number.isInteger(denominador) && denominador > 0;
  const v = valor !== undefined ? valor
    : calculable ? Number((numerador / denominador).toFixed(3)) : 'N/A';
  return {
    metrica: nom,
    valor: v,
    unitat,
    numerador: calculable || valor !== undefined ? numerador : null,
    denominador: calculable || valor !== undefined ? denominador : null,
    font,
    prova: v === 'N/A' ? null : prova
  };
}

/* El document d'un error de la porta de documents (porta-documents.mjs ·
   checkDocuments): «RUTA.md: motiu» o «Sense àncora: RUTA.md»; null si
   l'error no és d'un document (el contracte de l'índex, per exemple). */
const documentDeLError = (e) => {
  if (typeof e !== 'string') return null;
  const ancora = /^Sense àncora: (.+\.md)$/.exec(e);
  if (ancora) return ancora[1];
  const propi = /^(.+?\.md): /.exec(e);
  return propi ? propi[1] : null;
};

/**
 * La mètrica d'una porta a partir del seu resultat (Onada 6). Sense
 * resultat, o amb un de mal format, N/A: mai un verd.
 *  · Amb `total` i `failures` (la cadena de portes): passos verds sobre el total.
 *  · Amb `checked` i `errors` (la porta de documents): documents sense cap
 *    error sobre els comprovats. Cada document amb errors compta una vegada;
 *    un error que no és de cap document compta com un document més que falla
 *    (cota pessimista); una porta que diu `valid: false` sense cap error en
 *    resta almenys un. Correcció de l'Onada 6 (revisió adversarial: «una porta
 *    verda que no ha comprovat res») · `checked: 0` és N/A: per defecte la
 *    porta només comprova els documents canviats, i amb l'arbre net no en
 *    comprova cap. Derogat: { valid: true, checked: 0 } → 1/1.
 *  · Només amb `valid`: 1/1 (verda) o 0/1 (roja).
 */
export function metricaDePorta(nom, porta, font, prova) {
  const p = porta && typeof porta === 'object' && !Array.isArray(porta) ? porta : null;
  if (p && Number.isInteger(p.total) && p.total > 0 && Number.isInteger(p.failures) && p.failures >= 0 && p.failures <= p.total) {
    return metrica(nom, { numerador: p.total - p.failures, denominador: p.total, font, prova });
  }
  if (p && Number.isInteger(p.checked) && p.checked >= 0 && typeof p.valid === 'boolean') {
    if (p.checked === 0) return metrica(nom, { font });
    const documents = new Set();
    let solts = 0;
    for (const e of Array.isArray(p.errors) ? p.errors : []) {
      const doc = documentDeLError(e);
      if (doc) documents.add(doc); else solts += 1;
    }
    const fallits = Math.min(p.checked, Math.max(documents.size + solts, p.valid === false ? 1 : 0));
    return metrica(nom, { numerador: p.checked - fallits, denominador: p.checked, font, prova });
  }
  if (p && typeof p.valid === 'boolean') return metrica(nom, { numerador: p.valid ? 1 : 0, denominador: 1, font, prova });
  return metrica(nom, { font });
}

/**
 * @param {object} fonts   fonts ja llegides; qualsevol pot ser null (absent)
 * @param {object} [opcions]
 * @param {(ruta: string) => boolean} [opcions.existeix] comprova rutes del repositori
 * @param {number} [opcions.ara] epoch ms per a calcular edats (determinisme en proves)
 */
export function construeixMapa(fonts = {}, { existeix = null, ara = null } = {}) {
  const nodes = new Map();
  const arestes = new Map();
  const avisos = new Map();
  const tasques = [];
  const salut = [];

  const node = (id, tipus, font = null, atributs = {}) => {
    const previ = nodes.get(id);
    if (previ) {
      Object.assign(previ.atributs, atributs);
      if (!previ.font && font) previ.font = font;
      return previ;
    }
    const nou = { id, tipus, font, atributs: { ...atributs } };
    nodes.set(id, nou);
    return nou;
  };
  const nodeRuta = (ruta, atributs = {}) => {
    const { id, tipus } = nodeDeRuta(ruta);
    return node(id, tipus, ruta, atributs);
  };
  const aresta = (de, a, tipus, confianca, evidencia) => {
    const clau = `${de}|${a}|${tipus}|${confianca}`;
    if (!arestes.has(clau)) arestes.set(clau, { de, a, tipus, confianca, evidencia });
  };
  /* Ordre del Mestre, 261004 (cap anomalia sense mostrar) · Un avís per node
     i codi, com sempre, però sense perdre el detall: si el mateix node i codi
     torna amb una altra evidència (tres recaigudes de la mateixa skill, dues
     crides a skills que no existixen, els torns caducats un a un),
     `evidencies` les porta totes, en ordre i sense repetir, i `evidencia`
     continua sent la primera. El recompte d'avisos no canvia: ni les cobertes
     del tauler ni les signatures de «Canvis nous». */
  const avis = (nodeId, codi, severitat, evidencia) => {
    const clau = `${nodeId}|${codi}`;
    const previ = avisos.get(clau);
    if (!previ) {
      avisos.set(clau, { node: nodeId, codi, severitat, evidencia });
      return;
    }
    if (typeof evidencia !== 'string' || !evidencia) return;
    if (!previ.evidencia) {
      previ.evidencia = evidencia;
      return;
    }
    const totes = previ.evidencies ?? [previ.evidencia];
    if (!totes.includes(evidencia)) previ.evidencies = [...totes, evidencia];
  };
  const comprovaScript = (ruta, evidencia) => {
    if (existeix && !existeix(ruta)) avis(`script:${ruta}`, 'script-absent', 'alta', evidencia);
  };

  for (const absent of fonts.absents || []) {
    avis(nodeDeRuta(absent.ruta).id, 'font-absent', 'alta', absent.motiu || absent.ruta);
    node(nodeDeRuta(absent.ruta).id, nodeDeRuta(absent.ruta).tipus, absent.ruta, { absent: true });
  }

  /* ── Rutes documentals: ruta → plantilla, ruta → skill, lectures i destins ── */
  const protocol = fonts.protocolledge;
  if (protocol && Array.isArray(protocol.rutes)) {
    for (const r of protocol.rutes) {
      if (!r?.id) continue;
      const idRuta = `ruta:${r.id}`;
      node(idRuta, 'ruta', '.agents/protocolledge.json', { tipus_document: r.tipus ?? null, versio: r.version ?? null });
      if (r.plantilla) {
        // La plantilla d'una ruta ho és per declaració, visca on visca
        // (la d'auditoria és a 02_saber/protocols_tecnics/).
        node(`plantilla:${r.plantilla}`, 'plantilla', r.plantilla);
        aresta(idRuta, `plantilla:${r.plantilla}`, 'encamina', 'declarat', '.agents/protocolledge.json');
      }
      if (r.skill) {
        nodeRuta(r.skill);
        aresta(idRuta, nodeDeRuta(r.skill).id, 'governa', 'declarat', '.agents/protocolledge.json');
      }
      for (const lectura of r.lectures || []) {
        nodeRuta(lectura);
        aresta(idRuta, nodeDeRuta(lectura).id, 'llig', 'declarat', '.agents/protocolledge.json');
      }
      for (const desti of r.destins || []) {
        nodeRuta(desti);
        aresta(idRuta, nodeDeRuta(desti).id, 'escriu', 'declarat', '.agents/protocolledge.json');
      }
    }
  }

  /* ── Arrencada: CLAUDE.md i .agents/cervell.json ── */
  if (Array.isArray(fonts.claudeImports)) {
    node('agent:claude-code', 'agent', 'CLAUDE.md', { arnes: 'Claude Code' });
    node('document:CLAUDE.md', 'document', 'CLAUDE.md');
    aresta('agent:claude-code', 'document:CLAUDE.md', 'carrega', 'declarat', 'CLAUDE.md');
    for (const ruta of fonts.claudeImports) {
      nodeRuta(ruta);
      aresta('document:CLAUDE.md', nodeDeRuta(ruta).id, 'carrega', 'declarat', 'CLAUDE.md');
    }
  }
  if (fonts.cervell && Array.isArray(fonts.cervell.entrada)) {
    node('document:.agents/cervell.json', 'document', '.agents/cervell.json');
    for (const ruta of fonts.cervell.entrada) {
      nodeRuta(ruta);
      aresta('document:.agents/cervell.json', nodeDeRuta(ruta).id, 'carrega', 'declarat', '.agents/cervell.json');
    }
  }

  /* ── Càrrega d'arrencada per hook: un script de SessionStart que exporta les
       fonts que injecta (context-local.mjs → SOURCES) és un carregador, com
       CLAUDE.md. Derivat: ix del codi, no de la prosa.
       T10 (ordre del Mestre, 260930). ── */
  const arrencada = fonts.contextArrencada;
  const carregaEnArrencar = (idAgent, script, evidencia) => {
    if (!arrencada || arrencada.script !== script || !Array.isArray(arrencada.fonts)) return;
    aresta(idAgent, `script:${script}`, 'carrega', 'derivat', evidencia);
    for (const ruta of arrencada.fonts) {
      if (typeof ruta !== 'string' || !ruta) continue;
      nodeRuta(ruta);
      aresta(`script:${script}`, nodeDeRuta(ruta).id, 'carrega', 'derivat', script);
    }
  };

  /* Hooks amb el format de Claude Code ({ Esdeveniment: [{ hooks: [{ command }] }] });
     .codex/hooks.json fa servir el mateix. L'ordre és text; l'script es deriva. */
  const hooksPerEsdeveniment = ({ idAgent, prefix, arnes, font, hooks, acreditat, ambArrencada }) => {
    for (const [esdeveniment, grups] of Object.entries(hooks)) {
      const idHook = `hook:${prefix}:${esdeveniment}`;
      node(idHook, 'hook', font, { arnes, esdeveniment, consumidor_acreditat: acreditat });
      aresta(idAgent, idHook, 'dispara', 'declarat', font);
      for (const grup of Array.isArray(grups) ? grups : []) {
        // Un .codex/hooks.json mal format no pot tombar el Mapa sencer.
        for (const h of Array.isArray(grup?.hooks) ? grup.hooks : []) {
          for (const script of scriptsDeOrdre(h?.command)) {
            nodeRuta(script);
            aresta(idHook, `script:${script}`, 'dispara', 'derivat', font);
            comprovaScript(script, font);
            if (ambArrencada && esdeveniment === 'SessionStart') carregaEnArrencar(idAgent, script, font);
          }
        }
      }
    }
  };

  /* ── Hooks de Claude Code (settings.json): l'ordre és text, l'script es deriva ── */
  const hooksClaude = fonts.settings?.hooks;
  if (hooksClaude && typeof hooksClaude === 'object') {
    node('agent:claude-code', 'agent', '.claude/settings.json', { arnes: 'Claude Code' });
    // ambArrencada: false conserva idèntica la targeta de Claude (decisió del pla, T10).
    hooksPerEsdeveniment({ idAgent: 'agent:claude-code', prefix: 'claude', arnes: 'Claude Code',
      font: '.claude/settings.json', hooks: hooksClaude, acreditat: true, ambArrencada: false });
  }

  /* ── Hooks d'Antigravity: declarats, sense consumidor acreditat ──
       Format antic ({description, hooks:[{event, command}]}): l'IDE no el llig,
       i per això el consumidor és fals i hi ha avís. */
  const hooksAg = fonts.hooksAntigravity;
  const hooksAgNomenats = hooksAg && typeof hooksAg === 'object' && !Array.isArray(hooksAg) && !Array.isArray(hooksAg.hooks)
    ? Object.entries(hooksAg).filter(([, esdeveniments]) => esdeveniments && typeof esdeveniments === 'object' && !Array.isArray(esdeveniments))
    : [];
  /* Onada 6 (honestedat dels avisos) · Els noms dels hooks declarats
     (sdp-olivera, sdp-fatiga): una skill que en cita un parla d'un hook, no
     crida cap skill inexistent. */
  const nomsHooks = new Set(hooksAgNomenats.map(([nom]) => nom));
  if (hooksAgNomenats.length) {
    /* T13-T14 (ordre del Mestre, 260930) · Format que documenta Antigravity
       IDE: cada clau de primer nivell és el nom d'un hook, i dins, cada
       esdeveniment porta entrades directes ({command}) o grups ({matcher,
       hooks:[{command}]}). Ara el format és el que llig l'IDE, però cap
       evidència del Mas acredita encara que el dispare: per acreditar (null),
       com Codex, i sense l'avís del format antic. */
    node('agent:antigravity', 'agent', '.agents/hooks.json', { arnes: 'Antigravity' });
    for (const [nom, esdeveniments] of hooksAgNomenats) {
      for (const [esdeveniment, entrades] of Object.entries(esdeveniments)) {
        if (!Array.isArray(entrades)) continue;
        const idHook = `hook:antigravity:${esdeveniment}`;
        node(idHook, 'hook', '.agents/hooks.json', { arnes: 'Antigravity', esdeveniment, hook: nom, consumidor_acreditat: null });
        aresta('agent:antigravity', idHook, 'dispara', 'declarat', '.agents/hooks.json');
        const ordres = entrades.flatMap((e) => (Array.isArray(e?.hooks) ? e.hooks : [e])).map((h) => h?.command);
        for (const script of ordres.flatMap((ordre) => scriptsDeOrdre(ordre))) {
          nodeRuta(script);
          aresta(idHook, `script:${script}`, 'dispara', 'derivat', '.agents/hooks.json');
          comprovaScript(script, '.agents/hooks.json');
        }
      }
    }
  } else if (hooksAg && Array.isArray(hooksAg.hooks)) {
    node('agent:antigravity', 'agent', '.agents/hooks.json', { arnes: 'Antigravity' });
    for (const h of hooksAg.hooks) {
      if (!h?.event) continue;
      const idHook = `hook:antigravity:${h.event}`;
      node(idHook, 'hook', '.agents/hooks.json', { arnes: 'Antigravity', esdeveniment: h.event, consumidor_acreditat: false });
      aresta('agent:antigravity', idHook, 'dispara', 'declarat', '.agents/hooks.json');
      avis(idHook, 'hook-sense-consumidor', 'mitjana', '.agents/hooks.json');
      for (const script of scriptsDeOrdre(h.command)) {
        nodeRuta(script);
        aresta(idHook, `script:${script}`, 'dispara', 'derivat', '.agents/hooks.json');
        comprovaScript(script, '.agents/hooks.json');
      }
    }
  }

  /* ── Codex (.codex/hooks.json): mateix format que Claude Code. El hook local
       sap llegir el dialecte de Codex, però cap evidència del Mas acredita que
       el client els dispare: consumidor per acreditar (null), ni true com Claude
       ni false com Antigravity. Codex llig AGENTS.md de l'arrel per convenció
       del client, com Claude Code llig CLAUDE.md. T10 (ordre del Mestre, 260930). ── */
  const hooksCodex = fonts.hooksCodex?.hooks;
  if (hooksCodex && typeof hooksCodex === 'object' && !Array.isArray(hooksCodex)) {
    node('agent:codex', 'agent', '.codex/hooks.json', { arnes: 'Codex' });
    if (fonts.agentsMd === true) {
      nodeRuta('AGENTS.md');
      aresta('agent:codex', 'document:AGENTS.md', 'carrega', 'declarat', 'AGENTS.md');
    }
    hooksPerEsdeveniment({ idAgent: 'agent:codex', prefix: 'codex', arnes: 'Codex',
      font: '.codex/hooks.json', hooks: hooksCodex, acreditat: null, ambArrencada: true });
  }

  /* ── Ordres npm → scripts ── */
  const scriptsNpm = fonts.packageJson?.scripts;
  if (scriptsNpm && typeof scriptsNpm === 'object') {
    for (const [nom, ordre] of Object.entries(scriptsNpm)) {
      const idNpm = `script:npm:${nom}`;
      node(idNpm, 'script', 'package.json', { ordre });
      for (const script of scriptsDeOrdre(ordre)) {
        nodeRuta(script);
        aresta(idNpm, `script:${script}`, 'crida', 'declarat', 'package.json');
        comprovaScript(script, 'package.json');
      }
      for (const altra of npmDeOrdre(ordre)) {
        if (altra === nom) continue;
        node(`script:npm:${altra}`, 'script', 'package.json');
        aresta(idNpm, `script:npm:${altra}`, 'crida', 'declarat', 'package.json');
        if (!Object.hasOwn(scriptsNpm, altra)) avis(`script:npm:${altra}`, 'script-absent', 'alta', 'package.json');
      }
    }
  }

  /* ── Cens de skills: disc, índex, catàleg de Claude i segell ── */
  const disc = Array.isArray(fonts.skillsDisc) ? fonts.skillsDisc : null;
  const index = fonts.skillsIndex;
  const entradesIndex = new Map();
  if (index) {
    for (const s of index.core || []) if (s?.name) entradesIndex.set(s.name, { ...s, core: true });
    for (const s of Object.values(index.plugins || {})) if (s?.name) entradesIndex.set(s.name, { ...s, core: false });
  }
  const cataleg = Array.isArray(fonts.skillsClaude) ? new Set(fonts.skillsClaude) : null;
  const manifestSegell = fonts.segell?.manifest && typeof fonts.segell.manifest === 'object' ? fonts.segell.manifest : null;
  const noms = new Set([
    ...(disc || []).map((s) => s.nom),
    ...entradesIndex.keys(),
    ...(cataleg ? cataleg : []),
    ...(manifestSegell ? Object.keys(manifestSegell).map((r) => RUTA_SKILL.exec(r)?.[1]).filter(Boolean) : [])
  ]);
  const perNom = new Map((disc || []).map((s) => [s.nom, s]));
  /* Les skills que CLAUDE.md importa amb @ (claudeImports): Claude Code les llig senceres en arrencar. */
  const importadesClaude = new Set((Array.isArray(fonts.claudeImports) ? fonts.claudeImports : [])
    .map((ruta) => RUTA_SKILL.exec(String(ruta))?.[1]).filter(Boolean));

  if (index) node('script:tooling/session/persona_router.mjs', 'script', '.agents/skills_index.json', { rol: 'router cognitiu' });

  for (const nom of [...noms].sort()) {
    const s = perNom.get(nom);
    const entrada = entradesIndex.get(nom);
    const ruta = `.agents/skills/${nom}/SKILL.md`;
    const id = `skill:${nom}`;
    const alSegell = manifestSegell ? Object.hasOwn(manifestSegell, ruta) : null;
    node(id, 'skill', ruta, {
      core: entrada ? entrada.core : Boolean(s?.frontmatter?.core),
      al_disc: disc ? Boolean(s) : null,
      al_index: index ? Boolean(entrada) : null,
      al_cataleg_claude: cataleg ? cataleg.has(nom) : null,
      al_segell: alSegell,
      status: s?.frontmatter?.status ?? null,
      paraules: Number.isInteger(s?.paraules) ? s.paraules : null,
      llicons: Number.isInteger(s?.llicons) ? s.llicons : null
    });

    if (disc && !s) avis(id, 'skill-fantasma', 'alta', 'disc');
    if (s) {
      if (s.errorsFrontmatter?.length) avis(id, 'frontmatter-invalid', 'alta', `tooling/wiki/schema.json: ${s.errorsFrontmatter.join('; ')}`);
      if (s.frontmatter?.name && s.frontmatter.name !== nom) avis(id, 'nom-diferent-carpeta', 'mitjana', ruta);
      if (index && !entrada) avis(id, 'fora-index', 'mitjana', '.agents/skills_index.json');
      /* Onada 6 · Una skill que CLAUDE.md importa amb @ també és fora del
         catàleg, però Claude Code la carrega sencera a cada sessió: l'avís ho
         diu i baixa de severitat. No es calla: el catàleg continua sense ella. */
      if (cataleg && !cataleg.has(nom)) {
        if (importadesClaude.has(nom)) {
          avis(id, 'fora-cataleg-claude', 'baixa', '.claude/skills/ · CLAUDE.md la importa amb @: Claude Code la carrega sencera a cada sessió, però no la pot triar a demanda');
        } else avis(id, 'fora-cataleg-claude', 'mitjana', '.claude/skills/');
      }
      if (manifestSegell && !alSegell) avis(id, 'fora-segell', 'alta', '.agents/SKILLS_SEAL.json');
      if (manifestSegell && alSegell && s.sha256 && manifestSegell[ruta] !== s.sha256) avis(id, 'segell-divergent', 'alta', '.agents/SKILLS_SEAL.json');
      const tokens = Number.isInteger(s.paraules) ? Math.round(s.paraules * TOKENS_PER_PARAULA) : null;
      if (tokens !== null && (s.paraules > MAX_PARAULES || tokens > MAX_TOKENS)) avis(id, 'pes', 'baixa', `${s.paraules} paraules · ~${tokens} tokens`);
      // Contracte declarat al frontmatter (clau plana `contracte.llig`, llista de
      // rutes del repositori): aresta `llig` declarada. Una ruta que no existix
      // és un contracte trencat, no una lectura. T1 (ordre del Mestre, 260930).
      const llegides = new Set();
      const lectures = s.frontmatter?.['contracte.llig'];
      for (const lectura of Array.isArray(lectures) ? lectures : []) {
        if (typeof lectura !== 'string' || !lectura.trim()) continue;
        const cami = lectura.trim();
        // Una skill no es llig a si mateixa: seria una entrant falsa que li
        // amagaria l'orfe i l'opacitat (el mateix tall que les mencions).
        if (nodeDeRuta(cami).id === id) continue;
        const desti = nodeRuta(cami);
        aresta(id, desti.id, 'llig', 'declarat', ruta);
        llegides.add(desti.id);
        if (existeix && !existeix(cami)) {
          avis(id, 'contracte-absent', 'alta', `${ruta} → ${cami}`);
          // I el fitxer que falta, al seu node: sense avís, el detall el diria
          // net i l'oferiria a l'editor. Una skill absent ja és 'skill-fantasma'.
          if (desti.tipus !== 'skill') avis(desti.id, 'fitxer-absent', 'alta', `${ruta} → ${cami}`);
        }
      }
      
      const escrites = new Set();
      const escriptures = s.frontmatter?.['contracte.escriu'];
      for (const escriptura of Array.isArray(escriptures) ? escriptures : []) {
        if (typeof escriptura !== 'string' || !escriptura.trim()) continue;
        const cami = escriptura.trim();
        if (nodeDeRuta(cami).id === id) continue;
        const desti = nodeRuta(cami);
        aresta(id, desti.id, 'escriu', 'declarat', ruta);
        escrites.add(desti.id);
        if (existeix && !existeix(cami)) {
          avis(id, 'contracte-absent', 'alta', `${ruta} → ${cami}`);
          if (desti.tipus !== 'skill') avis(desti.id, 'fitxer-absent', 'alta', `${ruta} → ${cami}`);
        }
      }
      // Mencions de prosa: aresta inferida si la skill citada existix; si no,
      // només l'avís. Una menció no crea nodes (seria inventar una skill), i
      // no es duplica en suggeriment el que el contracte ja declara.
      for (const citada of s.mencions || []) {
        if (citada === nom) continue;
        if (!perNom.has(citada)) {
          // El nom d'un hook declarat no és cap skill que falte (Onada 6).
          if (!nomsHooks.has(citada)) avis(id, 'crida-inexistent', 'mitjana', `${ruta} → ${citada}`);
        } else if (!llegides.has(`skill:${citada}`)) aresta(id, `skill:${citada}`, 'crida', 'inferit', ruta);
      }
    }
    if (entrada) {
      const triggers = entrada.triggers_on;
      if (disparadorsDecoratius(triggers)) {
        avis(id, 'disparador-decoratiu', 'mitjana', '.agents/skills_index.json');
      } else {
        aresta('script:tooling/session/persona_router.mjs', id, 'dispara', 'declarat', '.agents/skills_index.json');
      }
      const amples = disparadorsAmples(triggers);
      if (amples.length) avis(id, 'disparador-ample', 'baixa', `.agents/skills_index.json: ${amples.join(', ')}`);
    }
  }

  /* ── Tasques: registre declaratiu contra llançadors reals ── */
  const registre = fonts.registreTasques;
  const idsDeclarats = new Set();
  const declarades = [
    ...(Array.isArray(registre?.tasques) ? registre.tasques : []),
    ...(Array.isArray(registre?.plaquetes) ? registre.plaquetes : [])
  ].filter((t) => t?.id && !idsDeclarats.has(t.id) && idsDeclarats.add(t.id));
  const llancadors = Array.isArray(fonts.llancadors) ? fonts.llancadors : [];
  const usats = new Set();
  /* Text de cada hook de git instal·lat (`.husky/<esdeveniment>`), si la closca
     l'ha llegit. Amb ell, una tasca `git-hook` es pot jutjar: viva si el hook
     cita el seu script, morta si el hook existix i no el cita. Sense font,
     continua sent desconeguda (un hook no té horari). */
  const hooksGit = fonts.hooksGit && typeof fonts.hooksGit === 'object' && !Array.isArray(fonts.hooksGit) ? fonts.hooksGit : null;
  /* Ordres de `.agents/hooks.json` que poden llançar una tasca `antigravity-hook`
     (la closca el passa ja llegit a `hooksAntigravity`; el text cru també val).
     Amb format nomenat, només les del hook i l'esdeveniment declarats, i un hook
     amb `enabled: false` no llança res. Sense font, null: no es jutja. Mateix
     criteri que els hooks de git. Tractor de fatiga (torn torn_ffcc22bb, 261002). */
  const ordresAntigravity = (l) => {
    if (typeof hooksAg === 'string') return [hooksAg];
    if (!hooksAg || typeof hooksAg !== 'object') return null;
    if (Array.isArray(hooksAg.hooks)) {
      return hooksAg.hooks.filter((h) => !l?.esdeveniment || h?.event === l.esdeveniment).map((h) => h?.command);
    }
    return Object.entries(hooksAg)
      .filter(([nom, spec]) => (!l?.hook || nom === l.hook) && spec && typeof spec === 'object' && !Array.isArray(spec) && spec.enabled !== false)
      .flatMap(([, spec]) => Object.entries(spec)
        .filter(([ev, entrades]) => Array.isArray(entrades) && (!l?.esdeveniment || ev === l.esdeveniment))
        .flatMap(([, entrades]) => entrades))
      .flatMap((e) => (Array.isArray(e?.hooks) ? e.hooks : [e]))
      .map((h) => h?.command);
  };
  const estatDeLlancador = (l) => {
    if (l.script && existeix && !existeix(l.script)) return 'mort';
    if (l.ultimaLiniaError) return 'mort';
    const interval = Number.isFinite(l.interval) && l.interval > 0 ? l.interval : null;
    if (interval && Number.isFinite(ara) && l.activitat) {
      const edat = (ara - Date.parse(l.activitat)) / 1000;
      if (Number.isFinite(edat)) return edat <= interval * DOS_CICLES ? 'viu' : 'mort';
    }
    return 'desconegut';
  };
  const perIdDeclarada = new Map(declarades.map((t) => [t.id, t]));
  const llancadorDe = new Map();   // id de tasca → plist de launchd que la llança (si n'hi ha)
  const mareDe = (t) => (t.llancador?.tipus === 'tasca' && t.llancador.tasca ? perIdDeclarada.get(t.llancador.tasca) ?? null : null);
  const estats = new Map();
  /* L'estat d'una tasca. `pila` talla els cicles (una tasca que es llança a
     si mateixa, o dos que es llancen l'una a l'altra, no tenen llançador). */
  const resol = (t, pila = new Set()) => {
    if (estats.has(t.id)) return estats.get(t.id);
    pila.add(t.id);
    const tipus = t.llancador?.tipus ?? null;
    let estat;
    if (tipus === 'tasca') {
      // Subtasca: la llança una altra tasca declarada (Plaquetes en declara
      // cinc dins del seu diagnòstic horari). Hereta l'estat de la mare.
      /* Onada 6 (honestedat dels avisos) · Llevat d'un cas: una subtasca sense
         script propi amb la mare viva. Que la mare corra no diu que execute
         esta subtasca (Plaquetes «diagnostica i no aplica mai», i dues de les
         cinc no les implementa cap script): desconegut, mai viu. Si la mare
         és morta, desconeguda o sense llançador, la subtasca ho és igual. */
      const mare = mareDe(t);
      if (!mare || pila.has(mare.id)) estat = 'declarat-sense-llancador';
      else if (t.script && existeix && !existeix(t.script)) estat = 'mort';
      else {
        const deMare = resol(mare, pila);
        estat = deMare === 'viu' && !t.script ? 'desconegut' : deMare;
      }
    } else if (tipus === 'git-hook' || tipus === 'hook') {
      const text = hooksGit?.[t.llancador?.esdeveniment];
      if (t.script && existeix && !existeix(t.script)) estat = 'mort';
      else if (typeof text !== 'string') estat = 'desconegut';   // sense font, no es jutja
      else estat = t.script && text.includes(t.script) ? 'viu' : 'mort';
    } else if (tipus === 'antigravity-hook') {
      // El llançador és declarat encara que falte la font: desconegut, mai «sense llançador».
      const ordres = ordresAntigravity(t.llancador);
      if (t.script && existeix && !existeix(t.script)) estat = 'mort';
      else if (ordres === null) estat = 'desconegut';
      else estat = t.script && ordres.some((o) => scriptsDeOrdre(o).includes(t.script)) ? 'viu' : 'mort';
    } else if (tipus === 'manual') {
      estat = t.script && existeix && !existeix(t.script) ? 'mort' : 'desconegut';
    } else {
      const etiqueta = t.llancador?.etiqueta ?? null;
      const l = etiqueta ? llancadors.find((x) => x.etiqueta === etiqueta) : null;
      if (l) { usats.add(l.etiqueta); llancadorDe.set(t.id, l); estat = estatDeLlancador({ ...l, script: t.script ?? l.script }); }
      else estat = 'declarat-sense-llancador';
    }
    estats.set(t.id, estat);
    return estat;
  };
  for (const t of declarades) {
    const estat = resol(t);
    const l = llancadorDe.get(t.id) ?? null;
    const mare = mareDe(t);
    const id = `tasca:${t.id}`;
    node(id, 'tasca', '.agents/cron/registre_tasques.json', { nivell: t.nivell ?? null });
    if (t.script) {
      const script = nodeRuta(t.script);
      aresta(id, script.id, 'crida', 'declarat', '.agents/cron/registre_tasques.json');
      // Com els scripts dels hooks i de package.json: el que falta porta el seu avís.
      if (script.tipus === 'script') comprovaScript(t.script, '.agents/cron/registre_tasques.json');
    }
    if (mare && estat !== 'declarat-sense-llancador') {
      node(`tasca:${mare.id}`, 'tasca', '.agents/cron/registre_tasques.json', { nivell: mare.nivell ?? null });
      aresta(`tasca:${mare.id}`, id, 'dispara', 'declarat', '.agents/cron/registre_tasques.json');
    }
    const esdeveniment = t.llancador?.esdeveniment;
    if (t.llancador?.tipus === 'git-hook' && typeof hooksGit?.[esdeveniment] === 'string') {
      const idHook = `hook:git:${esdeveniment}`;
      node(idHook, 'hook', `.husky/${esdeveniment}`, { arnes: 'git', esdeveniment, consumidor_acreditat: true });
      if (estat === 'viu') aresta(idHook, id, 'dispara', 'derivat', `.husky/${esdeveniment}`);
    }
    const deAntigravity = t.llancador?.tipus === 'antigravity-hook';
    // El node del hook ja l'ha creat la secció de hooks d'Antigravity: ací no se n'inventa cap.
    if (deAntigravity && estat === 'viu' && nodes.has(`hook:antigravity:${esdeveniment}`)) {
      aresta(`hook:antigravity:${esdeveniment}`, id, 'dispara', 'derivat', '.agents/hooks.json');
    }
    if (estat === 'declarat-sense-llancador') avis(id, 'tasca-sense-llancador', 'mitjana', '.agents/cron/registre_tasques.json');
    if (estat === 'mort') avis(id, 'tasca-morta', 'alta', l?.fitxer || (deAntigravity ? '.agents/hooks.json' : null)
      || (esdeveniment ? `.husky/${esdeveniment}` : null) || t.script || '.agents/cron/registre_tasques.json');
    tasques.push({
      id: t.id,
      estat,
      llancador: t.llancador ?? null,
      // Una subtasca sense cadència pròpia hereta la de la tasca que la llança.
      cadencia: t.cadencia ?? (mare && estat !== 'declarat-sense-llancador' ? mare.cadencia ?? null : null),
      script: t.script ?? l?.script ?? null,
      font: '.agents/cron/registre_tasques.json'
    });
  }
  for (const l of llancadors) {
    if (!l?.etiqueta || usats.has(l.etiqueta)) continue;
    const estat = estatDeLlancador(l);
    const id = `tasca:launchd:${l.etiqueta}`;
    node(id, 'tasca', l.fitxer || null, { llancador: 'launchd' });
    if (l.script) {
      nodeRuta(l.script);
      aresta(id, nodeDeRuta(l.script).id, 'crida', 'derivat', l.fitxer || 'launchd');
    }
    avis(id, 'llancador-sense-declaracio', 'mitjana', l.fitxer || 'launchd');
    if (estat === 'mort') avis(id, 'tasca-morta', 'alta', l.script || l.fitxer || 'launchd');
    tasques.push({
      id: `launchd:${l.etiqueta}`,
      estat,
      llancador: { tipus: 'launchd', etiqueta: l.etiqueta },
      cadencia: { cada_segons: l.interval ?? null, en_arrencar: Boolean(l.enArrencar), permanent: Boolean(l.keepAlive) },
      script: l.script ?? null,
      font: l.fitxer ?? null
    });
  }

  /* ── Orfes: skills sense cap aresta entrant declarada o derivada ── */
  // Una skill que algú governa o carrega però que no és al disc és un fantasma,
  // encara que cap cens la nomene (p. ex. una ruta de protocolledge.json).
  const entrants = new Set();
  for (const a of arestes.values()) if (a.confianca !== 'inferit') entrants.add(a.a);
  for (const n of nodes.values()) {
    if (n.tipus !== 'skill') continue;
    if (disc && !perNom.has(n.id.slice('skill:'.length))) {
      n.atributs.al_disc = false;
      avis(n.id, 'skill-fantasma', 'alta', 'disc');
      continue;
    }
    if (!entrants.has(n.id)) avis(n.id, 'orfe', 'mitjana', 'mapa');
  }

  /* ── Salut: fracció amb numerador i denominador, o N/A ── */
  const skillsIndex = [...entradesIndex.values()];
  salut.push(metrica('disparadors-utils', index ? {
    numerador: skillsIndex.filter((s) => !disparadorsDecoratius(s.triggers_on)).length,
    denominador: skillsIndex.length,
    font: '.agents/skills_index.json',
    prova: PROVA_MAPA
  } : { font: '.agents/skills_index.json' }));

  const censComplet = disc && index && cataleg && manifestSegell;
  salut.push(metrica('cens-skills-coherent', censComplet ? {
    numerador: [...noms].filter((nom) => perNom.has(nom) && entradesIndex.has(nom) && cataleg.has(nom)
      && Object.hasOwn(manifestSegell, `.agents/skills/${nom}/SKILL.md`)).length,
    denominador: noms.size,
    font: 'disc · .agents/skills_index.json · .claude/skills/ · .agents/SKILLS_SEAL.json',
    prova: PROVA_MAPA
  } : { font: 'disc · .agents/skills_index.json · .claude/skills/ · .agents/SKILLS_SEAL.json' }));

  const estatsLlancadors = tasques.filter((t) => t.llancador?.tipus === 'launchd').map((t) => t.estat);
  salut.push(metrica('vigilants-vius', estatsLlancadors.length && !estatsLlancadors.includes('desconegut') ? {
    numerador: estatsLlancadors.filter((e) => e === 'viu').length,
    denominador: estatsLlancadors.length,
    font: '~/Library/LaunchAgents · .agents/cron/registre_tasques.json',
    prova: PROVA_MAPA
  } : { font: '~/Library/LaunchAgents · .agents/cron/registre_tasques.json' }));

  const frontissa = fonts.frontissa;
  salut.push(metrica('integritat-contingut', frontissa && Number.isInteger(frontissa.correctes) && Number.isInteger(frontissa.requerides) ? {
    numerador: frontissa.correctes,
    denominador: frontissa.requerides,
    font: 'tooling/gates/frontissa-contingut.mjs',
    prova: 'node tooling/gates/frontissa-contingut.mjs --json'
  } : { font: 'tooling/gates/frontissa-contingut.mjs' }));
  /* Onada 6 (portes verdes sense comprovar) · Una frontissa roja (12/13)
     només era una fracció de la salut, sense cap avís, i para el pre-commit.
     Correcció de l'Onada 6 (revisió adversarial: «un avís per cada error de
     la frontissa», l'abast literal) · Cada error és un avís alt
     'frontissa-roja' propi, sobre la seua clau dins del registre d'empremtes,
     que és on es repara (--aprova CLAU --per NOM, una decisió humana): el
     node és `document:.agents/contingut_estructural.json#CLAU` (sense clau,
     el número de l'error). Dos errors de la mateixa clau són dos avisos
     (#CLAU i #CLAU-2). Així el recompte d'avisos alts diu quants errors hi ha.
     Derogat: un sol avís sobre el registre amb una evidència per error. */
  const errorsFrontissa = Array.isArray(frontissa?.errors) ? frontissa.errors.filter((e) => e && typeof e === 'object') : [];
  const clausVistes = new Map();
  errorsFrontissa.forEach((e, i) => {
    const base = typeof e.clau === 'string' && e.clau.trim() ? e.clau.trim() : `error-${i + 1}`;
    const n = (clausVistes.get(base) ?? 0) + 1;
    clausVistes.set(base, n);
    const clau = n === 1 ? base : `${base}-${n}`;
    const doc = nodeRuta(`.agents/contingut_estructural.json#${clau}`);
    const evidencia = [typeof e.codi === 'string' ? e.codi : null,
      typeof e.missatge === 'string' && e.missatge ? e.missatge : (typeof e.clau === 'string' ? `«${e.clau}»` : null)]
      .filter(Boolean).join(' · ');
    avis(doc.id, 'frontissa-roja', 'alta', evidencia || 'node tooling/gates/frontissa-contingut.mjs --json');
  });

  const instantania = fonts.timeMachine?.ultima ? Date.parse(fonts.timeMachine.ultima) : NaN;
  salut.push(metrica('frescor-instantania', Number.isFinite(instantania) && Number.isFinite(ara) ? {
    valor: Math.max(0, Math.round((ara - instantania) / 60000)),
    unitat: 'minuts',
    font: 'refs/time-machine/*',
    prova: 'node tooling/brain/time-machine.mjs --llista'
  } : { unitat: 'minuts', font: 'refs/time-machine/*' }));

  const horesDes = (t) => Math.max(0, Math.round((ara - t) / HORA_MS));

  /* ── Segell i frontmatter de les skills, amb les fonts que ja arriben (disc
       i SKILLS_SEAL.json). El segell cobrix també 00_INDEX_SKILLS.md, que la
       closca no passa: la mètrica i l'avís només jutgen els SKILL.md, i ho
       diuen, perquè un 1/1 no es llija com el segell sencer. La comprovació
       sencera és `node tooling/gates/segella.mjs`. T12 (ordre del Mestre, 260930). ── */
  const FONT_SEGELL = '.agents/SKILLS_SEAL.json (només SKILL.md) · disc';
  if (disc && manifestSegell) {
    const rutaSkill = (nomSkill) => `.agents/skills/${nomSkill}/SKILL.md`;
    const rutes = new Set([...disc.map((s) => rutaSkill(s.nom)), ...Object.keys(manifestSegell).filter((r) => RUTA_SKILL.test(r))]);
    const coherents = disc.filter((s) => s.sha256 && manifestSegell[rutaSkill(s.nom)] === s.sha256).length;
    salut.push(metrica('segell-skills-coherent', { numerador: coherents, denominador: rutes.size, font: FONT_SEGELL, prova: PROVA_MAPA }));
    if (coherents < rutes.size) {
      const segell = nodeRuta('.agents/SKILLS_SEAL.json');
      // L'evidència porta només dades: la frase de l'avís és TEXTOS_AVIS
      // (grafMapa.js), i l'alerta del tauler les pinta juntes.
      avis(segell.id, 'segell-trencat', 'alta', `${rutes.size - coherents} ${de(rutes.size, plural(rutes.size, 'skill', 'skills'))} fora del segell o ${concorda(rutes.size - coherents, 'divergent', 'divergents')} · mesura de només SKILL.md; el segell sencer, amb 00_INDEX_SKILLS.md: node tooling/gates/segella.mjs`);
    }
  } else salut.push(metrica('segell-skills-coherent', { font: FONT_SEGELL }));

  const segellat = typeof fonts.segell?.timestamp === 'string' ? Date.parse(fonts.segell.timestamp) : NaN;
  salut.push(metrica('antiguitat-segell', Number.isFinite(segellat) && Number.isFinite(ara) ? {
    valor: horesDes(segellat), unitat: 'hores', font: '.agents/SKILLS_SEAL.json', prova: PROVA_MAPA
  } : { unitat: 'hores', font: '.agents/SKILLS_SEAL.json' }));

  // Sense esquema, la closca no valida res i tornaria un verd fals.
  const senseEsquema = (fonts.absents || []).some((x) => x?.ruta === 'tooling/wiki/schema.json');
  salut.push(metrica('frontmatter-skills-valid', disc && !senseEsquema ? {
    numerador: disc.filter((s) => !s.errorsFrontmatter?.length).length,
    denominador: disc.length,
    font: 'tooling/wiki/schema.json · disc',
    prova: PROVA_MAPA
  } : { font: 'tooling/wiki/schema.json · disc' }));

  /* ── Vigilància: torns, Escriptori, LEDGER i relleu d'ESTAT. Són fonts noves
       de la closca (tooling/brain/mapa-consola.mjs); mentre no arriben (null),
       tot és N/A i cap avís. Tot avís crea abans el seu node: sense node,
       mapaContent.js rebutjaria el Mapa sencer. T12 (ordre del Mestre, 260930). ── */
  const torns = Array.isArray(fonts.torns) ? fonts.torns : null;
  const FONT_TORNS = '.agents/runtime/turns';
  // Mateix criteri que readTurn (tooling/documental/turns.mjs): un torn obert
  // sense caducitat llegible ja no es pot tancar, així que també és caducat.
  const caducat = (t) => {
    const expira = Date.parse(t?.expiresAt);
    return t?.state !== 'closed' && (!Number.isFinite(expira) || expira <= ara);
  };
  const caducats = torns && Number.isFinite(ara) ? torns.filter(caducat).length : null;
  salut.push(metrica('torns-caducats-oberts', caducats !== null
    ? { numerador: caducats, denominador: torns.length, font: FONT_TORNS, prova: PROVA_MAPA }
    : { font: FONT_TORNS }));
  salut.push(metrica('torns-tancats', torns
    ? { numerador: torns.filter((t) => t?.state === 'closed').length, denominador: torns.length, font: FONT_TORNS, prova: PROVA_MAPA }
    : { font: FONT_TORNS }));
  if (caducats) {
    const carpeta = nodeRuta(FONT_TORNS);
    avis(carpeta.id, 'torns-caducats', 'mitjana', `${caducats} ${de(torns.length, plural(torns.length, 'torn caducat', 'torns caducats'))} sense tancar`);
    /* Ordre del Mestre, 261004 · I quins són, un per evidència: el que va
       caducar abans, primer; els que no porten caducitat llegible, al final. */
    const expira = (t) => { const x = Date.parse(t?.expiresAt); return Number.isFinite(x) ? x : Infinity; };
    const llista = torns.filter(caducat)
      .sort((x, y) => expira(x) - expira(y) || String(x?.id ?? '').localeCompare(String(y?.id ?? '')));
    for (const t of llista) {
      const quan = Number.isFinite(expira(t)) ? `caducat el ${t.expiresAt}` : 'sense caducitat llegible';
      avis(carpeta.id, 'torns-caducats', 'mitjana',
        [t?.id ?? 'torn sense id', t?.actor, t?.state ?? 'sense estat', quan].filter(Boolean).join(' · '));
    }
  }

  const escriptori = fonts.escriptori && typeof fonts.escriptori === 'object' ? fonts.escriptori : null;
  const documentsEscriptori = Array.isArray(escriptori?.documents)
    ? escriptori.documents.filter((d) => typeof d?.nom === 'string' && d.nom.trim())
    : null;
  salut.push(metrica('escriptori-ancorat', documentsEscriptori ? {
    numerador: documentsEscriptori.filter((d) => d.ancorat === true).length,
    denominador: documentsEscriptori.length,
    font: `${CARPETA_ESCRIPTORI} · 00_index_escriptori.md`,
    prova: PROVA_MAPA
  } : { font: `${CARPETA_ESCRIPTORI} · 00_index_escriptori.md` }));
  salut.push(metrica('escriptori-amb-rebut', documentsEscriptori ? {
    numerador: documentsEscriptori.filter((d) => d.ambRebut === true).length,
    denominador: documentsEscriptori.length,
    font: `${CARPETA_ESCRIPTORI} · ${FONT_TORNS}`,
    prova: PROVA_MAPA
  } : { font: `${CARPETA_ESCRIPTORI} · ${FONT_TORNS}` }));
  salut.push(metrica('safata-entrada', escriptori && Number.isInteger(escriptori.safata) && escriptori.safata >= 0
    && Number.isInteger(escriptori.limitSafata) ? {
      numerador: escriptori.safata,
      denominador: escriptori.limitSafata,
      font: `${CARPETA_ESCRIPTORI} · safata d’entrada (AGENTS.md §12)`,
      prova: PROVA_MAPA
    } : { font: `${CARPETA_ESCRIPTORI} · safata d’entrada (AGENTS.md §12)` }));
  /* Ordre del Mestre, 261004 · El document ancorat però sense rebut tampoc
     s'escapa: abans només en quedava la fracció (escriptori-amb-rebut). */
  for (const d of documentsEscriptori || []) {
    if (d.ancorat !== false && d.ambRebut !== false) continue;
    const nomDoc = d.nom.trim();
    const ruta = nomDoc.startsWith(`${CARPETA_ESCRIPTORI}/`) ? nomDoc : `${CARPETA_ESCRIPTORI}/${nomDoc}`;
    const doc = nodeRuta(ruta);
    if (d.ancorat === false) {
      avis(doc.id, 'escriptori-sense-ancora', 'baixa',
        `sense enllaç a 00_index_escriptori.md${d.ambRebut === false ? ' ni rebut de cap torn' : ''}`);
    } else {
      avis(doc.id, 'escriptori-sense-rebut', 'baixa', `cap torn de ${FONT_TORNS} en porta el rebut`);
    }
  }

  const ledger = fonts.ledger && typeof fonts.ledger === 'object' ? fonts.ledger : null;
  // La data AAMMDD no porta hora ni zona: s'admet un dia per davant (UTC).
  const recent = (aammdd) => {
    const dies = (ara - dataLedger(aammdd)) / DIA_MS;
    return dies > -1 && dies < FINESTRA_RECAIGUDES_DIES;
  };
  const recaigudes = Array.isArray(ledger?.entrades) && Number.isFinite(ara)
    ? ledger.entrades
      .filter((e) => String(e?.tipus ?? '').trim().toLowerCase() === 'recaiguda' && recent(e?.data))
      .sort((x, y) => dataLedger(y.data) - dataLedger(x.data))
    : null;
  salut.push(metrica('recaigudes-ledger', recaigudes ? {
    valor: recaigudes.length, unitat: 'recaigudes', font: '.agents/LEDGER.md', prova: PROVA_MAPA
  } : { unitat: 'recaigudes', font: '.agents/LEDGER.md' }));
  // La signatura té comprovació pròpia, la porta del pas 0 (només llig sense --sign).
  const PROVA_LEDGER = 'node tooling/verify-ledger.mjs';
  salut.push(metrica('integritat-ledger', typeof ledger?.valid === 'boolean' ? {
    numerador: ledger.valid ? 1 : 0, denominador: 1, font: '.agents/LEDGER.md', prova: PROVA_LEDGER
  } : { font: '.agents/LEDGER.md' }));
  /* Ordre del Mestre, 261004 · Els fòssils i les línies mal formades tenen
     mètrica pròpia, amb valor també quan la signatura és vàlida: abans només
     eixien dins de l'evidència de 'ledger-invalid'. Quines línies són ho sap
     només la closca (petició a tooling/: analitzaLedger no en guarda els
     números). */
  const recompteLedger = (nom, camp, unitat) => salut.push(metrica(nom,
    Number.isInteger(ledger?.[camp]) && ledger[camp] >= 0
      ? { valor: ledger[camp], unitat, font: '.agents/LEDGER.md', prova: PROVA_MAPA }
      : { unitat, font: '.agents/LEDGER.md' }));
  recompteLedger('ledger-fossils', 'fossils', 'segells fòssils');
  recompteLedger('ledger-mal-formades', 'malformades', 'línies mal formades');
  if (ledger?.valid === false) {
    const doc = nodeRuta('.agents/LEDGER.md');
    /* Onada 6 · La signatura és l'empremta del cos (analitzaLedger): si no
       quadra, el cos s'ha editat sense tornar-lo a segellar, o el segell
       falta. L'evidència ho diu, i els fòssils i les línies mal formades van
       a part, també quan són zero (no en són la causa). */
    const detall = [
      'signatura del LEDGER no vàlida',
      'el cos no quadra amb el seu segell: editat sense tornar-lo a segellar, o sense segell',
      Number.isInteger(ledger.fossils) ? plural(ledger.fossils, 'segell fòssil', 'segells fòssils') : null,
      Number.isInteger(ledger.malformades) ? plural(ledger.malformades, 'línia mal formada', 'línies mal formades') : null
    ].filter(Boolean);
    avis(doc.id, 'ledger-invalid', 'alta', [...detall, PROVA_LEDGER].join(' · '));
  }
  // Una recaiguda només avisa sobre una skill que el Mapa coneix: mai crea el node.
  for (const e of recaigudes || []) {
    const idSkill = `skill:${String(e?.skill ?? '').trim()}`;
    if (nodes.get(idSkill)?.tipus !== 'skill') continue;
    avis(idSkill, 'recaiguda-recent', 'mitjana', `.agents/LEDGER.md · ${e.data}${e.resum ? ` · ${e.resum}` : ''}`);
  }

  const relleu = typeof fonts.estat?.data === 'string' ? Date.parse(fonts.estat.data) : NaN;
  salut.push(metrica('frescor-relleu-estat', Number.isFinite(relleu) && Number.isFinite(ara) ? {
    valor: horesDes(relleu), unitat: 'hores', font: '.agents/ESTAT.md', prova: PROVA_MAPA
  } : { unitat: 'hores', font: '.agents/ESTAT.md' }));

  /* Onada 6 (portes verdes sense comprovar) · Abans eren N/A fixos encara que
     les dues portes existixen. Ara es mesuren quan la closca passa el seu
     resultat; mentre no arriba, continuen N/A (el que falta es pinta):
     · fonts.portaDocuments: l'eixida de checkDocuments (porta-documents.mjs),
       { valid, checked, errors }.
     · fonts.cadenaPortes: l'eixida de run-portes.mjs --diagnostic,
       { valid, failures }, i `total` (passos) si la closca el sap.
     Amb `total` i `failures`, passos verds sobre el total; si no, 1/1 o 0/1. */
  salut.push(metricaDePorta('conformitat-documental', fonts.portaDocuments,
    'tooling/gates/porta-documents.mjs', 'node tooling/gates/porta-documents.mjs'));
  salut.push(metricaDePorta('cadena-portes', fonts.cadenaPortes,
    'tooling/gates/run-portes.mjs', 'node tooling/gates/run-portes.mjs --diagnostic'));

  const perId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const perAresta = (a, b) => `${a.de}|${a.a}|${a.tipus}`.localeCompare(`${b.de}|${b.a}|${b.tipus}`);
  const perAvis = (a, b) => `${a.node}|${a.codi}`.localeCompare(`${b.node}|${b.codi}`);
  return {
    schema: ESQUEMA_MAPA,
    generat: fonts.generat ?? null,
    tall: fonts.tall ?? null,
    nodes: [...nodes.values()].sort(perId),
    arestes: [...arestes.values()].sort(perAresta),
    tasques: tasques.sort(perId),
    avisos: [...avisos.values()].sort(perAvis),
    salut
  };
}
