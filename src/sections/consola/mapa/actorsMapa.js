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
import { camiDe, puntsDeTrobada } from './fluxosMapa.js';

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
  const candats = [
    ...mapa.nodes.filter((n) => n.tipus === 'hook').map((h) => ({
      id: h.id,
      arnes: h.atributs?.arnes ?? '—',
      esdeveniment: h.atributs?.esdeveniment ?? etiquetaNode(h),
      acreditat: typeof h.atributs?.consumidor_acreditat === 'boolean' ? h.atributs.consumidor_acreditat : null,
      scripts: surten(h.id, 'dispara').map((a) => nodes.get(a.a)).filter((n) => n?.tipus === 'script').map(camiDe).sort()
    })),
    ...mapa.tasques.filter((t) => t.llancador?.tipus === 'git-hook').map((t) => ({
      id: `tasca:${t.id}`,
      arnes: 'git',
      esdeveniment: t.llancador.esdeveniment ?? t.id,
      acreditat: null,
      scripts: t.script ? [t.script] : []
    }))
  ].sort((x, y) => x.arnes.localeCompare(y.arnes) || x.esdeveniment.localeCompare(y.esdeveniment) || x.id.localeCompare(y.id));

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
