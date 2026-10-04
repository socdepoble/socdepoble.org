/**
 * actorsMapa.js — els actors del Mas (05_actors_i_salut.md) i les xifres de
 * la capçalera d'Emowe, pur.
 *
 * La pestanya «Actores» d'Emowe pinta per capes el que envolta els agents:
 * qui conversa, quins candats hi ha, què es carrega en arrencar, què corre sol
 * i sobre quin sòl treballen. Ací cada capa ix de nodes i arestes del Mapa;
 * el que el compilador no llig no apareix, i la vista ho diu.
 */
import { etiquetaNode, relacionsDe } from './grafMapa.js';
import { camiDe, fluxosDelMapa, puntsDeTrobada } from './fluxosMapa.js';

const perIdDe = (mapa) => new Map(mapa.nodes.map((n) => [n.id, n]));
const perId = (x, y) => x.id.localeCompare(y.id);

/* Corre sola la tasca que llança launchd de veres. Si el registre li posa
   launchd però cap plist la llança, és «declarat-sense-llancador»: falta. */
const correSola = (t) => t.llancador?.tipus === 'launchd' && t.estat !== 'declarat-sense-llancador';

/** Tot el que un node carrega, directament o a través del que carrega (sense cicles). */
function carregaTransitiva(mapa, id, nodes) {
  const vistos = new Set();
  const pendents = [id];
  while (pendents.length) {
    const actual = pendents.shift();
    for (const a of mapa.arestes) {
      if (a.de !== actual || a.tipus !== 'carrega' || vistos.has(a.a)) continue;
      vistos.add(a.a);
      pendents.push(a.a);
    }
  }
  const carregats = [...vistos].map((x) => nodes.get(x)).filter(Boolean).sort(perId);
  return {
    documents: carregats.filter((n) => n.tipus === 'document'),
    skills: carregats.filter((n) => n.tipus === 'skill')
  };
}

export function capesActors(mapa) {
  const nodes = perIdDe(mapa);
  const surten = (id, tipus) => mapa.arestes.filter((a) => a.de === id && a.tipus === tipus);

  const arnesos = mapa.nodes.filter((n) => n.tipus === 'agent').sort(perId).map((node) => {
    const hooks = surten(node.id, 'dispara').map((a) => nodes.get(a.a)).filter((h) => h?.tipus === 'hook');
    return {
      node,
      nom: node.atributs?.arnes ?? etiquetaNode(node),
      candats: hooks.length,
      acreditats: hooks.filter((h) => h.atributs?.consumidor_acreditat === true).length,
      // Ni acreditat ni desmentit: el client el pot consumir, però el Mas no en té
      // evidència (Codex). T10 (ordre del Mestre, 260930).
      desconeguts: hooks.filter((h) => typeof h.atributs?.consumidor_acreditat !== 'boolean').length,
      arrencada: carregaTransitiva(mapa, node.id, nodes)
    };
  });

  const carregadors = mapa.nodes
    .filter((n) => n.tipus !== 'agent' && mapa.arestes.some((a) => a.de === n.id && a.tipus === 'carrega'))
    .sort(perId)
    .map((node) => ({
      node,
      carrega: surten(node.id, 'carrega').map((a) => nodes.get(a.a)).filter(Boolean).sort(perId),
      perQui: mapa.arestes.filter((a) => a.a === node.id && a.tipus === 'carrega')
        .map((a) => nodes.get(a.de)).filter((n) => n?.tipus === 'agent').sort(perId)
    }));

  // Candats: els hooks dels arnesos i els hooks de git que declara el registre
  // de tasques. D'un hook de git el Mapa no sap si està instal·lat (no llig .husky/).
  const mapCandats = new Map();
  
  // 1. Hooks existents (nodes 'hook')
  for (const h of mapa.nodes.filter((n) => n.tipus === 'hook')) {
    const arnes = h.atributs?.arnes ?? '—';
    const esdeveniment = h.atributs?.esdeveniment ?? etiquetaNode(h);
    const key = `${arnes}:${esdeveniment}`;
    mapCandats.set(key, {
      id: h.id,
      arnes,
      esdeveniment,
      acreditat: typeof h.atributs?.consumidor_acreditat === 'boolean' ? h.atributs.consumidor_acreditat : null,
      scripts: surten(h.id, 'dispara').map((a) => nodes.get(a.a)).filter((n) => n?.tipus === 'script').map(camiDe).sort(),
      tasques: []
    });
  }

  // 2. Tasques git-hook que potser no tenen node creat
  for (const t of mapa.tasques.filter((t) => t.llancador?.tipus === 'git-hook')) {
    const esdeveniment = t.llancador.esdeveniment ?? t.id;
    const key = `git:${esdeveniment}`;
    if (!mapCandats.has(key)) {
      mapCandats.set(key, {
        id: `hook:git:${esdeveniment}`,
        arnes: 'git',
        esdeveniment,
        acreditat: null,
        scripts: [],
        tasques: []
      });
    }
    const c = mapCandats.get(key);
    c.tasques.push(t.id);
    if (t.script && !c.scripts.includes(t.script)) c.scripts.push(t.script);
  }
  
  const candats = [...mapCandats.values()].sort((x, y) => x.arnes.localeCompare(y.arnes) || x.esdeveniment.localeCompare(y.esdeveniment) || x.id.localeCompare(y.id));

  return {
    arnesos,
    carregadors,
    candats,
    programades: mapa.tasques.filter(correSola).sort(perId),
    senseLlancador: mapa.tasques.filter((t) => t.estat === 'declarat-sense-llancador').sort(perId),
    sol: puntsDeTrobada(mapa).filter((p) => p.node.tipus === 'document' || p.node.tipus === 'plantilla')
  };
}

/**
 * Agents atòmics: agents amb contracte, és a dir, que declaren (o un
 * analitzador deriva) què lligen o què escriuen. La prosa no fa contracte.
 */
export function agentsAtomics(mapa) {
  return mapa.nodes.filter((n) => n.tipus === 'agent').sort(perId).map((node) => {
    const surten = mapa.arestes.filter((a) => a.de === node.id && a.confianca !== 'inferit');
    return {
      node,
      llig: surten.filter((a) => a.tipus === 'llig'),
      escriu: surten.filter((a) => a.tipus === 'escriu')
    };
  }).filter((a) => a.llig.length || a.escriu.length);
}

/** Les cinc xifres de la capçalera d'Emowe, comptades sobre el Mapa. */
export function xifresDelMas(mapa) {
  const skills = mapa.nodes.filter((n) => n.tipus === 'skill');
  const programades = mapa.tasques.filter(correSola);
  const ambAvis = new Set(mapa.avisos.map((a) => a.node));
  return {
    skills: skills.length,
    agents: mapa.nodes.filter((n) => n.tipus === 'agent').length,
    opaques: skills.filter((s) => relacionsDe(mapa, s.id).opaca).length,
    programades: programades.length,
    vives: programades.filter((t) => t.estat === 'viu').length,
    ambAvisos: skills.filter((s) => ambAvis.has(s.id)).length
  };
}

/**
 * Ordre del Mestre, 261004 (prompt 261004_0515, §6: cap anomalia del cervell
 * sense mostrar) · Les anomalies que «El Mas en xifres» diu al tauler,
 * comptades sobre el Mapa. Una mètrica N/A és null (sense mesura), mai zero.
 *  · alts: avisos de severitat alta.
 *  · fossils, malFormades: les mètriques ledger-fossils i ledger-mal-formades.
 *  · tornsCaducats: torns oberts que han caducat sense tancar.
 *  · foraDelSegell: SKILL.md fora del segell o divergents (només SKILL.md).
 *  · orfes: peces sense cap relació declarada o derivada que hi arribe
 *    (codi 'orfe'); fantasmes: skills que algú nomena i no són al disc
 *    ('skill-fantasma'). El mateix vocabulari que l'Inventari.
 */
export function anomaliesDelMas(mapa) {
  const mesura = (nom) => mapa.salut.find((m) => m.metrica === nom && m.valor !== 'N/A') ?? null;
  const ambCodi = (codi) => mapa.avisos.filter((a) => a.codi === codi).length;
  const fossils = mesura('ledger-fossils');
  const malFormades = mesura('ledger-mal-formades');
  const torns = mesura('torns-caducats-oberts');
  const segell = mesura('segell-skills-coherent');
  return {
    alts: mapa.avisos.filter((a) => a.severitat === 'alta').length,
    fossils: fossils ? fossils.valor : null,
    malFormades: malFormades ? malFormades.valor : null,
    tornsCaducats: torns ? torns.numerador : null,
    foraDelSegell: segell ? segell.denominador - segell.numerador : null,
    orfes: ambCodi('orfe'),
    fantasmes: ambCodi('skill-fantasma')
  };
}

/* ── Les quatre peces que fan possible un agent atòmic ────────────────────
   T3 (ordre del Mestre, 260930): la pàgina Agents atòmics les pinta i la
   coberta de la seua targeta al tauler en diu l'estat; les dues compten amb
   estes funcions. L'estat és el text de l'etiqueta de la pàgina. */

/** Títol de cada peça, en l'ordre de les targetes. */
export const TITOLS_PECES_AGENTS = Object.freeze({
  fluxos: 'Fluxos de treball',
  tauler: 'Tauler',
  sols: 'Agents que treballen sols',
  vigilants: 'Qui avisa quan algo es trenca'
});

/** EN MARXA si tot compta, PARCIAL si una part, FALTA si res; sense denominador, SENSE MESURA. */
export function estatFraccio(fets, total) {
  if (!Number.isInteger(total) || total <= 0) return 'SENSE MESURA';
  if (fets >= total) return 'EN MARXA';
  return fets > 0 ? 'PARCIAL' : 'FALTA';
}

/**
 * Les quatre peces amb el seu estat i el que en pinta la targeta: els fluxos
 * declarats, el tauler on més peces deixen la faena (l'Escriptori, si el Mapa
 * ho diu), les tasques que llança launchd i els vigilants vius.
 */
export function pecesAgents(mapa) {
  const { cadenes, suggeriments, punts } = fluxosDelMapa(mapa);
  const { programades, vives } = xifresDelMas(mapa);
  const desti = punts.filter((p) => p.escriuen.length)
    .sort((x, y) => y.escriuen.length - x.escriuen.length || x.node.id.localeCompare(y.node.id))[0] ?? null;
  const vigilants = mapa.salut.find((m) => m.metrica === 'vigilants-vius') ?? null;
  return {
    fluxos: { estat: cadenes.length ? 'EN MARXA' : 'FALTA', cadenes: cadenes.length, suggeriments: suggeriments.length },
    tauler: { estat: !desti ? 'FALTA' : desti.lligen.length ? 'EN MARXA' : 'SENSE LECTOR', desti },
    sols: { estat: programades ? estatFraccio(vives, programades) : 'FALTA', programades, vives },
    vigilants: {
      estat: vigilants && vigilants.valor !== 'N/A' ? estatFraccio(vigilants.numerador, vigilants.denominador) : 'SENSE MESURA',
      metrica: vigilants
    }
  };
}
