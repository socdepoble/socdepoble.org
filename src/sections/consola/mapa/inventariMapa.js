/**
 * inventariMapa.js — l'inventari de skills (03_inventari_skills.md), pur.
 *
 * És la pestanya «Skills» d'Emowe amb el semàfor de la Consola: un avís alt,
 * roig; només mitjans o baixos, ambre (el taronja del semàfor); cap, verd. La
 * pàgina (InventariMapa.jsx) i la coberta de la seua targeta al tauler
 * (consolaPagines.js) compten amb estes mateixes peces: el semàfor que pinta
 * la taula és el que alça «Cal reparar».
 * Onada 6 (requisit 8: «segons la seua gravetat») · El semàfor mira la
 * gravetat, no el recompte. Derogat per l'Onada 6: «3 avisos o més, roig; 1
 * o 2, ambre» (LLINDAR_ROIG), que pintava ambre una skill amb un sol avís alt
 * i roja una amb tres de mitjans.
 *
 * Sense React, sense disc i sense xarxa. Només llig el que el compilador ja
 * produïx (sdp.mapa.v1).
 */
import { etiquetaNode } from './grafMapa.js';
import { colorDAvisos } from '../semafor.js';

/** Codis del compilador que diuen que una skill falta en alguna llista derivada del cens. */
export const CODIS_CENS = Object.freeze(['fora-index', 'fora-cataleg-claude', 'fora-segell', 'skill-fantasma']);

/* El color del semàfor (semafor.js) amb el nom que li dona l'Inventari. */
const NOM_COLOR = Object.freeze({ roig: 'roig', taronja: 'ambre', verd: 'verd' });

/** 'roig', 'ambre' o 'verd' segons la gravetat dels avisos d'una skill (una llista d'avisos del Mapa). */
export function semaforDe(avisos) {
  return NOM_COLOR[colorDAvisos(avisos)];
}

const teCodi = (skill, prova) => skill.avisos.some((a) => prova(a.codi));

/** Cap relació declarada o derivada hi arriba: ningú la crida ni la carrega. */
export const esOrfena = (skill) => teCodi(skill, (codi) => codi === 'orfe');
/** Falta a l'índex, al catàleg de Claude o al segell, o algú la nomena i no és al disc. */
export const esForaDeCens = (skill) => teCodi(skill, (codi) => CODIS_CENS.includes(codi));
/** Els seus disparadors no poden saltar sols: el router no la triarà mai. */
export const esSenseDisparador = (skill) => teCodi(skill, (codi) => codi === 'disparador-decoratiu');
/** El seu frontmatter no passa l'esquema de la Wiki (Onada 6, filtre de l'Inventari). */
export const esFrontmatterInvalid = (skill) => teCodi(skill, (codi) => codi === 'frontmatter-invalid');

/**
 * Les skills del cens, cadascuna amb el seu nom curt, els seus avisos i el
 * seu semàfor: primer les roges, després les ambre i les verdes; dins de cada
 * color, les que tenen més avisos; a igualtat, per nom.
 */
const PES_SEMAFOR = Object.freeze({ roig: 0, ambre: 1, verd: 2 });
export function skillsDelInventari(mapa) {
  return mapa.nodes
    .filter((n) => n.tipus === 'skill')
    .map((n) => {
      const avisos = mapa.avisos.filter((a) => a.node === n.id);
      return { ...n, nom: etiquetaNode(n), avisos, semafor: semaforDe(avisos) };
    })
    .sort((a, b) => PES_SEMAFOR[a.semafor] - PES_SEMAFOR[b.semafor]
      || b.avisos.length - a.avisos.length || a.nom.localeCompare(b.nom));
}

/**
 * Les skills i les xifres de l'inventari. Les categories (òrfenes, fora del
 * cens, sense disparador, frontmatter) se solapen: no sumen el total.
 */
export function resumInventari(mapa) {
  const skills = skillsDelInventari(mapa);
  const compta = (prova) => skills.filter(prova).length;
  const ambSemafor = (color) => compta((s) => s.semafor === color);
  return {
    skills,
    total: skills.length,
    netes: ambSemafor('verd'),
    roges: ambSemafor('roig'),
    ambres: ambSemafor('ambre'),
    orfenes: compta(esOrfena),
    foraDeCens: compta(esForaDeCens),
    senseDisparador: compta(esSenseDisparador),
    frontmatterInvalid: compta(esFrontmatterInvalid)
  };
}

/* ── L'ordre de reparació (Onada 6, requisit 11) ───────────────────────────
   Per a cada codi que té una reparació mecànica coneguda, l'ordre exacta, des
   de l'arrel del repositori. La Consola només la COPIA: no l'executa mai. Les
   tres toquen governança (.claude/ o .agents/): les aplica el Mestre, amb la
   lease que calga. Un codi sense ordre (frontmatter, disparadors, contracte,
   òrfena…) es repara editant la SKILL.md: no hi ha botó.
   Correcció de l'Onada 6 (revisió adversarial: «pot enganyar») · Cada línia
   diu, en un comentari de shell, quin avís repara: una skill roja per un
   frontmatter invàlid i fora del catàleg només en copia la reparació del
   catàleg, i ara ho diu. El segell no es torna a segellar a cegues: es copia
   el diagnòstic (segella.mjs sense --update, que només llig) i el comentari
   remet al flux amb lease (el segell nou el calcula l'executor-mutacio).
   Derogat: `npm run porta:segella:update` per a fora-segell i segell-divergent. */
const DIAGNOSTIC_SEGELL = 'node tooling/gates/segella.mjs';
const ORDRES_REPARACIO = Object.freeze({
  // Mateixa forma que els enllaços que ja hi ha (`.claude/skills/<nom> -> ../../.agents/skills/<nom>`).
  'fora-cataleg-claude': (nom) => `ln -s ../../.agents/skills/${nom} .claude/skills/${nom}`,
  // Només el diagnòstic del segell: el resegellat passa per l'executor amb lease.
  'fora-segell': () => DIAGNOSTIC_SEGELL,
  'segell-divergent': () => DIAGNOSTIC_SEGELL,
  // Refà l'índex derivat del router (package.json · skills:index).
  'fora-index': () => 'npm run skills:index'
});
/* El que diu el comentari de cada ordre, per codi. */
const QUE_REPARA = Object.freeze({
  'fora-cataleg-claude': 'repara fora-cataleg-claude',
  'fora-segell': 'diagnòstic de fora-segell; el segell nou, amb executor-mutacio i lease',
  'segell-divergent': 'diagnòstic de segell-divergent; el segell nou, amb executor-mutacio i lease',
  'fora-index': 'repara fora-index'
});

/** Els codis amb ordre de reparació coneguda. */
export const CODIS_AMB_REPARACIO = Object.freeze(Object.keys(ORDRES_REPARACIO));

/**
 * L'ordre (o les ordres, una per línia i sense repetir) per als avisos d'una
 * skill que en tenen, cada una amb el comentari de quin avís repara; null si
 * cap dels seus avisos no en té. Dos codis amb la mateixa ordre (el segell)
 * comparteixen una sola línia, amb els dos codis al comentari.
 */
export function ordreReparacio(skill) {
  const nom = skill?.nom ?? etiquetaNode(skill);
  const perOrdre = new Map();
  for (const a of skill?.avisos ?? []) {
    const fes = ORDRES_REPARACIO[a.codi];
    if (!fes) continue;
    const ordre = fes(nom);
    if (!perOrdre.has(ordre)) perOrdre.set(ordre, []);
    if (!perOrdre.get(ordre).includes(a.codi)) perOrdre.get(ordre).push(a.codi);
  }
  if (!perOrdre.size) return null;
  return [...perOrdre].map(([ordre, codis]) => (codis.length === 1
    ? `${ordre}  # ${QUE_REPARA[codis[0]]}`
    : `${ordre}  # diagnòstic de ${codis.join(' i ')}; el segell nou, amb executor-mutacio i lease`)).join('\n');
}

/** Els codis que l'ordre de reparació d'una skill tracta (per al nom accessible del botó); [] si cap. */
export function codisReparats(skill) {
  return [...new Set((skill?.avisos ?? []).map((a) => a.codi).filter((codi) => Object.hasOwn(ORDRES_REPARACIO, codi)))];
}
