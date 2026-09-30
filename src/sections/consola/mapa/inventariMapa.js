/**
 * inventariMapa.js — l'inventari de skills (03_inventari_skills.md), pur.
 *
 * És la pestanya «Skills» d'Emowe amb el semàfor adaptat: 3 avisos o més,
 * roig; 1 o 2, ambre; cap, verd. La pàgina (InventariMapa.jsx) i la coberta
 * de la seua targeta al tauler (consolaPagines.js) compten amb estes mateixes
 * peces: el semàfor que pinta la taula és el que alça «Cal reparar».
 *
 * Sense React, sense disc i sense xarxa. Només llig el que el compilador ja
 * produïx (sdp.mapa.v1).
 */
import { etiquetaNode } from './grafMapa.js';

/** Avisos d'una skill a partir dels quals el semàfor és roig. */
export const LLINDAR_ROIG = 3;

/** Codis del compilador que diuen que una skill falta en alguna llista derivada del cens. */
export const CODIS_CENS = Object.freeze(['fora-index', 'fora-cataleg-claude', 'fora-segell', 'skill-fantasma']);

/** 'roig', 'ambre' o 'verd' segons el nombre d'avisos d'una skill. */
export function semaforDe(n) {
  if (n >= LLINDAR_ROIG) return 'roig';
  return n > 0 ? 'ambre' : 'verd';
}

const teCodi = (skill, prova) => skill.avisos.some((a) => prova(a.codi));

/** Cap relació declarada o derivada hi arriba: ningú la crida ni la carrega. */
export const esOrfena = (skill) => teCodi(skill, (codi) => codi === 'orfe');
/** Falta a l'índex, al catàleg de Claude o al segell, o algú la nomena i no és al disc. */
export const esForaDeCens = (skill) => teCodi(skill, (codi) => CODIS_CENS.includes(codi));
/** Els seus disparadors no poden saltar sols: el router no la triarà mai. */
export const esSenseDisparador = (skill) => teCodi(skill, (codi) => codi === 'disparador-decoratiu');

/**
 * Les skills del cens, cadascuna amb el seu nom curt i els seus avisos: les
 * que en tenen més, primer; a igualtat, per nom.
 */
export function skillsDelInventari(mapa) {
  return mapa.nodes
    .filter((n) => n.tipus === 'skill')
    .map((n) => ({ ...n, nom: etiquetaNode(n), avisos: mapa.avisos.filter((a) => a.node === n.id) }))
    .sort((a, b) => b.avisos.length - a.avisos.length || a.nom.localeCompare(b.nom));
}

/**
 * Les skills i les xifres de l'inventari. Les categories (òrfenes, fora del
 * cens, sense disparador) se solapen: no sumen el total.
 */
export function resumInventari(mapa) {
  const skills = skillsDelInventari(mapa);
  const compta = (prova) => skills.filter(prova).length;
  const ambSemafor = (color) => compta((s) => semaforDe(s.avisos.length) === color);
  return {
    skills,
    total: skills.length,
    netes: ambSemafor('verd'),
    roges: ambSemafor('roig'),
    ambres: ambSemafor('ambre'),
    orfenes: compta(esOrfena),
    foraDeCens: compta(esForaDeCens),
    senseDisparador: compta(esSenseDisparador)
  };
}
