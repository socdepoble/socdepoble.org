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
  const avis = (nodeId, codi, severitat, evidencia) => {
    const clau = `${nodeId}|${codi}`;
    if (!avisos.has(clau)) avisos.set(clau, { node: nodeId, codi, severitat, evidencia });
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

  /* ── Hooks de Claude Code (settings.json): l'ordre és text, l'script es deriva ── */
  const hooksClaude = fonts.settings?.hooks;
  if (hooksClaude && typeof hooksClaude === 'object') {
    node('agent:claude-code', 'agent', '.claude/settings.json', { arnes: 'Claude Code' });
    for (const [esdeveniment, grups] of Object.entries(hooksClaude)) {
      const idHook = `hook:claude:${esdeveniment}`;
      node(idHook, 'hook', '.claude/settings.json', { arnes: 'Claude Code', esdeveniment, consumidor_acreditat: true });
      aresta('agent:claude-code', idHook, 'dispara', 'declarat', '.claude/settings.json');
      for (const grup of Array.isArray(grups) ? grups : []) {
        for (const h of grup?.hooks || []) {
          for (const script of scriptsDeOrdre(h?.command)) {
            nodeRuta(script);
            aresta(idHook, `script:${script}`, 'dispara', 'derivat', '.claude/settings.json');
            comprovaScript(script, '.claude/settings.json');
          }
        }
      }
    }
  }

  /* ── Hooks d'Antigravity: declarats, sense consumidor acreditat ── */
  const hooksAg = fonts.hooksAntigravity;
  if (hooksAg && Array.isArray(hooksAg.hooks)) {
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
      if (cataleg && !cataleg.has(nom)) avis(id, 'fora-cataleg-claude', 'mitjana', '.claude/skills/');
      if (manifestSegell && !alSegell) avis(id, 'fora-segell', 'alta', '.agents/SKILLS_SEAL.json');
      if (manifestSegell && alSegell && s.sha256 && manifestSegell[ruta] !== s.sha256) avis(id, 'segell-divergent', 'alta', '.agents/SKILLS_SEAL.json');
      const tokens = Number.isInteger(s.paraules) ? Math.round(s.paraules * TOKENS_PER_PARAULA) : null;
      if (tokens !== null && (s.paraules > MAX_PARAULES || tokens > MAX_TOKENS)) avis(id, 'pes', 'baixa', `${s.paraules} paraules · ~${tokens} tokens`);
      // Mencions de prosa: aresta inferida si la skill citada existix; si no,
      // només l'avís. Una menció no crea nodes (seria inventar una skill).
      for (const citada of s.mencions || []) {
        if (citada === nom) continue;
        if (perNom.has(citada)) aresta(id, `skill:${citada}`, 'crida', 'inferit', ruta);
        else avis(id, 'crida-inexistent', 'mitjana', `${ruta} → ${citada}`);
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
  for (const t of declarades) {
    const etiqueta = t.llancador?.etiqueta ?? null;
    const l = etiqueta ? llancadors.find((x) => x.etiqueta === etiqueta) : null;
    // Hooks i ordres manuals no tenen horari: no es poden jutjar per activitat.
    const senseHorari = ['hook', 'git-hook', 'manual'].includes(t.llancador?.tipus);
    let estat;
    if (l) { usats.add(l.etiqueta); estat = estatDeLlancador({ ...l, script: t.script ?? l.script }); }
    else if (senseHorari) estat = t.script && existeix && !existeix(t.script) ? 'mort' : 'desconegut';
    else estat = 'declarat-sense-llancador';
    const id = `tasca:${t.id}`;
    node(id, 'tasca', '.agents/cron/registre_tasques.json', { nivell: t.nivell ?? null });
    if (t.script) {
      nodeRuta(t.script);
      aresta(id, nodeDeRuta(t.script).id, 'crida', 'declarat', '.agents/cron/registre_tasques.json');
    }
    if (estat === 'declarat-sense-llancador') avis(id, 'tasca-sense-llancador', 'mitjana', '.agents/cron/registre_tasques.json');
    if (estat === 'mort') avis(id, 'tasca-morta', 'alta', l?.fitxer || t.script || '.agents/cron/registre_tasques.json');
    tasques.push({
      id: t.id,
      estat,
      llancador: t.llancador ?? null,
      cadencia: t.cadencia ?? null,
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

  const instantania = fonts.timeMachine?.ultima ? Date.parse(fonts.timeMachine.ultima) : NaN;
  salut.push(metrica('frescor-instantania', Number.isFinite(instantania) && Number.isFinite(ara) ? {
    valor: Math.max(0, Math.round((ara - instantania) / 60000)),
    unitat: 'minuts',
    font: 'refs/time-machine/*',
    prova: 'node tooling/brain/time-machine.mjs --llista'
  } : { unitat: 'minuts', font: 'refs/time-machine/*' }));

  salut.push(metrica('conformitat-documental', { font: 'tooling/gates/porta-documents.mjs' }));
  salut.push(metrica('cadena-portes', { font: 'tooling/gates/run-portes.mjs' }));

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
