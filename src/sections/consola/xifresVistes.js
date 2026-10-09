/**
 * xifresVistes.js — les xifres de dins de les pàgines de la Consola (les
 * vistes del Mapa i els panells del pols), sense React.
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · «No vull xifres soltes
 * ni excepcions inventades.» Les xifres que abans eren targetes compactes del
 * Panell de Control (TargetaResum, sense boina ni pàgina) són ara targetes
 * senceres amb la boina de Sóc de Poble i porten a la seua pàgina pròpia,
 * /consola/xifres/<slug>. Cada definició diu el mateix que xifresMas.js:
 * slug estable, la pàgina de la Consola que la tracta, el nom per a quan no
 * hi ha font, el títol i el subtítol amb la mesura, l'entradeta en tres
 * frases (què compta, d'on ix, per què importa; els noms de fitxer entre
 * accents greus) i el detall que desplega la seua pàgina.
 *
 * `origen` diu de quina font viu: 'mapa' (mapa.json) o 'consola'
 * (consola.json, el pols). `existeix`, si hi és, diu si la targeta es pinta
 * amb la font d'avui: una targeta que no es pinta no té pàgina, i sense la
 * seua font no es pot saber si existix, així que tampoc no en té.
 * `pagina` (i `panell`, si és del pols) és la pàgina que la tracta i on es
 * pinta: «On es tracta» no pot portar a una pàgina sense la seua targeta
 * (correcció 261004, verificador de la segona passada).
 *
 * Correcció 261004 (verificador de la segona passada, punt 2) · Les mesures
 * que quedaven soltes també són targetes: les tasques del Mapa i els llocs
 * sense lector; i al pols, les operacions immunitàries, les línies
 * descartades, els artefactes actius, els rebuts, l'últim rebut i el segell.
 */
import { NOMS_TIPUS, etiquetaNode } from './mapa/grafMapa.js';
import { CONFIANCES } from './mapa/contracteMapa.js';
import { CODIS_CENS } from './mapa/inventariMapa.js';
import { GRUPS_CADENCIA, quanDe } from './mapa/calendariMapa.js';
import { camiDe, esSenseLector } from './mapa/fluxosMapa.js';
import { TITOLS_PECES_AGENTS, agentsAtomics } from './mapa/actorsMapa.js';
import { recomptePer, textLlancador, valorMetrica } from './mapa/mapaContent.js';
import { curt } from './consolaContent.js';
import {
  CODIS_TRENCATS, LLINDAR_REBUTS_RANCIS_DIES, LLINDAR_SATURACIO, diesDes, faDies, rebutsRancis, saturat
} from './consolaPagines.js';
import {
  COLUMNES_AVIS, COLUMNES_METRICA, FONT_CONSOLA, FONT_MAPA, ambCodi, ambMajuscula, colorDe, concorda, de,
  etiquetaDAvisos, etiquetaDEstat, etiquetaDeColor, etiquetaPendent, filaMetrica, filesAvisos, mesurada, mono, plural,
  senseMesura, siNo, taulaDades, text
} from './xifresComu.js';
import {
  problemaDeSkill, problemaLloc, problemaRuta, problemaTasca, problemaText, problemesDAvisos, problemesDeCandats,
  problemesDeTasques
} from './problemesConsola.js';
import { colorDeTasques, toDeColor } from './semafor.js';

const nomDe = (id) => etiquetaNode({ id });
const llistaDeNoms = (ids) => (ids.length ? ids.map(nomDe).join(' · ') : 'ningú');

/* ── El semàfor i els problemes de les xifres de les pàgines ─────────────
   Correcció de l'Onada 6 (revisió adversarial: els requisits 8 i 9 només
   s'havien aplicat a les deu xifres del tauler) · Cada xifra que compta
   coses que fallen o falten du l'etiqueta del semàfor segons el seu valor
   (xifresComu.js · etiquetaDeColor) i diu a la vista quines són
   (problemesConsola.js), amb la marca del seu color. Les que compten avisos
   prenen el color del més greu; les que compten tasques, el del pitjor estat;
   sense mesura, cap etiqueta (mai un verd sense base). Les que només diuen una
   mida (nodes, arestes, rutes documentals, cadenes, suggeriments, punts de
   trobada, agents atòmics, registres de consum, skills del manifest i del
   nucli, rebuts de lectura, operacions immunitàries) informen: cap etiqueta. */
const ROIG = toDeColor('roig');
/* Els avisos del cens d'una skill (CODIS_CENS). */
const avisosDelCens = (s) => s.avisos.filter((a) => CODIS_CENS.includes(a.codi));
/* Un lloc sense lector, amb la seua ruta (el mode privacitat l'amaga). */
const llocSenseLector = (p) => problemaLloc(p.node.id, camiDe(p.node));

/* L'estat de cada peça dels agents (pecesAgents, actorsMapa.js) amb el color
   del semàfor (Onada 6): EN MARXA verd; PARCIAL, FALTA i SENSE LECTOR
   taronja; SENSE MESURA, neutre (semafor.js · COLOR_D_ESTAT). */
export const etiquetaDePeca = (estat) => etiquetaDEstat(estat);

/* ── Les taules que comparteixen diverses xifres ──────────────────────── */

const taulaCadenes = (cadenes) => ({
  titol: 'Cadenes declarades o derivades',
  columnes: ['Cadena', 'Passos', 'Confiança'],
  files: cadenes.map((c) => ({
    clau: c.id,
    celes: [text(c.passos.map((p) => nomDe(p.id)).join(' → ')), text(c.passos.length), { confianca: c.confianca }]
  })),
  buit: 'Cap cadena declarada: cap peça declara que llig el que una altra deixa.'
});

const taulaSuggeriments = (suggeriments) => ({
  titol: 'Suggeriments de la prosa',
  columnes: ['Qui en parla', 'De qui parla', 'Relació', 'On ho diu'],
  files: suggeriments.map((s) => ({
    clau: `${s.de}|${s.a}|${s.tipus}`,
    celes: [text(nomDe(s.de)), text(nomDe(s.a)), text(s.tipus), mono(s.evidencia)]
  })),
  buit: 'Cap: la prosa no suggerix cap relació entre skills o rutes.'
});

const taulaPunts = (titol, punts, buit = 'Cap peça declara on escriu ni què llig.') => ({
  titol,
  columnes: ['Lloc', 'Hi escriuen', 'El lligen'],
  files: punts.map((p) => ({
    clau: p.node.id,
    celes: [mono(camiDe(p.node)), text(llistaDeNoms(p.escriuen)), text(llistaDeNoms(p.lligen))]
  })),
  buit
});

const taulaTasques = (titol, tasques, buit) => ({
  titol,
  columnes: ['Tasca', 'Estat', 'Quan', 'Llançador', 'Script'],
  files: tasques.map((t) => ({
    clau: t.id,
    celes: [text(t.id), { estat: t.estat }, text(quanDe(t)), text(textLlancador(t.llancador)), mono(t.script)]
  })),
  buit
});

const ORIGEN_TASQUES = 'Ix de `mapa.json`, que creua el registre `.agents/cron/registre_tasques.json` amb els llançadors de `~/Library/LaunchAgents`.';

/* L'estat d'una tasca dit amb el seu recompte, concordat: «1 viva», «2 mortes». */
const ESTATS_TASCA = Object.freeze({
  viu: ['viva', 'vives'],
  mort: ['morta', 'mortes'],
  'declarat-sense-llancador': ['sense llançador', 'sense llançador'],
  'llancador-sense-declaracio': ['sense declaració', 'sense declaració'],
  desconegut: ['d’estat desconegut', 'd’estat desconegut']
});
const textEstatTasca = ([estat, n]) => plural(n, ...(ESTATS_TASCA[estat] ?? [estat, estat]));
/* Els estats de les tasques que hi ha, en un ordre fix (el que treballa primer); un estat nou, al final.
   Correcció 261004 (verificador de la tercera passada, punt 5) · les vives i
   les mortes, sempre, també a zero: la coberta del Calendari les destaca
   («0 mortes») i el seu número ha de ser a la targeta. */
const SEMPRE = Object.freeze(['viu', 'mort']);
function estatsDeTasques(perEstat) {
  const per = new Map(perEstat);
  const coneguts = Object.keys(ESTATS_TASCA).filter((e) => per.has(e) || SEMPRE.includes(e));
  for (const e of SEMPRE) if (!per.has(e)) per.set(e, 0);
  const nous = [...per.keys()].filter((e) => !(e in ESTATS_TASCA));
  return [...coneguts, ...nous].map((e) => textEstatTasca([e, per.get(e)])).join(' · ');
}

/* ── Inventari de skills ─────────────────────────────────────────────── */

const INVENTARI = [
  {
    slug: 'skills-sense-avisos', origen: 'mapa', pagina: 'inventari', icona: 'shieldCheck', nom: 'Skills sense cap avís',
    titol: ({ inv }) => plural(inv.netes, 'skill sense cap avís', 'skills sense cap avís'),
    // Correcció 261004 (verificador de la tercera passada, punt 3) · «D’1 skill», mai «De 1 skill».
    subtitol: ({ inv }) => `${ambMajuscula(de(inv.total, plural(inv.total, 'skill', 'skills')))} al cens: semàfor verd a l’Inventari`,
    subtitolSenseFont: 'Semàfor verd a l’Inventari',
    entradeta: [
      'Compta les skills del cens que no tenen cap avís del Mapa: les que l’Inventari pinta en verd.',
      'Ix dels nodes de tipus skill i dels avisos de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'És la xifra de salut de l’Inventari: skills sense cap avís entre les skills del cens, no un percentatge d’ànim.'
    ],
    font: `${FONT_MAPA} · nodes de tipus skill i avisos`,
    // El color del cens sencer (el de la skill més greu) i, a la vista, les que no són verdes.
    etiquetes: ({ inv }) => (inv.total ? etiquetaDAvisos(inv.skills.flatMap((s) => s.avisos)) : null),
    problemes: ({ inv }) => inv.skills.filter((s) => s.semafor !== 'verd').map((s) => problemaDeSkill(s)),
    detall: (_mapa, { inv }) => ({
      taules: [{
        titol: 'Skills sense cap avís',
        columnes: ['Skill', 'Estat', 'Nucli'],
        files: inv.skills.filter((s) => !s.avisos.length).map((s) => ({
          clau: s.id, celes: [text(s.nom), text(s.atributs.status ?? 'sense estat'), siNo(s.atributs.core)]
        })),
        buit: 'Cap skill del cens està sense avisos.'
      }]
    })
  },
  {
    slug: 'skills-fora-d-algun-cens', origen: 'mapa', pagina: 'inventari', consulta: '?filtre=cens', icona: 'triangleAlert',
    nom: 'Skills fora d’algun cens',
    titol: ({ inv }) => plural(inv.foraDeCens, 'skill fora d’algun cens', 'skills fora d’algun cens'),
    subtitol: () => 'Índex, catàleg de Claude, segell o disc',
    entradeta: [
      'Compta les skills que falten en alguna de les llistes derivades del cens: l’índex de skills, el catàleg de Claude, el segell o el mateix disc.',
      'Ix dels avisos fora-index, fora-cataleg-claude, fora-segell i skill-fantasma de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'Una skill que falta en una llista no la pot disparar el router, carregar Claude o acreditar el segell.'
    ],
    font: `${FONT_MAPA} · avisos ${CODIS_CENS.join(', ')}`,
    // La gravetat dels avisos del cens: una fantasma o una fora del segell (altes), roig; la resta, taronja.
    etiquetes: ({ inv }) => etiquetaDAvisos(inv.skills.flatMap(avisosDelCens)),
    problemes: ({ inv }) => inv.skills.filter((s) => avisosDelCens(s).length).map((s) => problemaDeSkill(s, avisosDelCens(s))),
    // Una fila per skill (el títol compta skills), amb els codis del cens que en falten.
    detall: (_mapa, { inv }) => ({
      taules: [{
        titol: 'Skills fora d’algun cens',
        columnes: ['Skill', 'On falta'],
        files: inv.skills
          .map((s) => ({ s, codis: s.avisos.filter((a) => CODIS_CENS.includes(a.codi)).map((a) => a.codi) }))
          .filter(({ codis }) => codis.length)
          .map(({ s, codis }) => ({ clau: s.id, celes: [text(s.nom), text(codis.join(' · '))] })),
        buit: 'Cap skill falta en cap llista del cens.'
      }]
    })
  },
  /* Correcció 261004 (verificador de la tercera passada, punt 5) · La
     coberta de l'Inventari destacava «N skills sense disparador útil» sense
     cap targeta que les comptara. */
  {
    // Onada 6 (requisit 11) · la targeta porta a l'Inventari amb el seu filtre.
    slug: 'skills-sense-disparador', origen: 'mapa', pagina: 'inventari', consulta: '?filtre=sense-disparador', icona: 'zapOff',
    nom: 'Skills sense disparador útil',
    titol: ({ inv }) => plural(inv.senseDisparador, 'skill sense disparador útil', 'skills sense disparador útil'),
    subtitol: () => 'El router no les pot triar soles',
    entradeta: [
      'Compta les skills del cens els disparadors de les quals no poden saltar sols: no en tenen cap, o només el nom de la skill.',
      'Ix dels avisos disparador-decoratiu de `mapa.json`, que `tooling/brain/mapa-consola.mjs` escriu llegint `.agents/skills_index.json`.',
      'Una skill que el router no pot disparar només s’executa si algú la demana pel seu nom.'
    ],
    font: `${FONT_MAPA} · avisos disparador-decoratiu`,
    etiquetes: ({ mapa }) => etiquetaDAvisos(ambCodi(mapa, 'disparador-decoratiu')),
    problemes: ({ mapa }) => problemesDAvisos(ambCodi(mapa, 'disparador-decoratiu')),
    detall: (mapa) => ({
      taules: [{
        titol: 'Skills sense disparador útil',
        columnes: COLUMNES_AVIS,
        files: filesAvisos(ambCodi(mapa, 'disparador-decoratiu')),
        buit: 'Totes les skills del cens tenen algun disparador útil.'
      }]
    })
  }
];

/* ── Avisos i salut ──────────────────────────────────────────────────── */

const perSeveritat = (resum, sev) => resum.perSeveritat.find(([s]) => s === sev)?.[1] ?? 0;

const SALUT = [
  {
    slug: 'avisos', origen: 'mapa', pagina: 'salut', icona: 'triangleAlert', nom: 'Avisos del Mapa',
    titol: ({ resum }) => plural(resum.avisos, 'avís del Mapa', 'avisos del Mapa'),
    subtitol: ({ resum }) => [
      plural(perSeveritat(resum, 'alta'), 'alt', 'alts'),
      plural(perSeveritat(resum, 'mitjana'), 'mitjà', 'mitjans'),
      plural(perSeveritat(resum, 'baixa'), 'baix', 'baixos')
    ].join(' · '),
    subtitolSenseFont: 'Alts, mitjans i baixos',
    entradeta: [
      'Compta tots els avisos que el Mapa fa de les peces del Mas, de qualsevol severitat.',
      'Ix dels avisos de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs` en compilar el Mapa.',
      'Cada avís és una peça que, tal com està, pot fallar, no carregar-se o no deixar rastre.'
    ],
    font: `${FONT_MAPA} · avisos`,
    // El color del més greu: un sol avís alt ja és roig.
    etiquetes: ({ mapa }) => etiquetaDAvisos(mapa.avisos),
    problemes: ({ mapa }) => problemesDAvisos(mapa.avisos),
    detall: (_mapa, { resum }) => ({
      taules: [{ titol: 'Avisos del Mapa, el més greu primer', columnes: COLUMNES_AVIS, files: filesAvisos(resum.avisosOrdenats), buit: 'El Mapa no fa cap avís.' }]
    })
  },
  {
    slug: 'metriques-amb-mesura', origen: 'mapa', pagina: 'salut', icona: 'heartPulse', nom: 'Mètriques de salut amb mesura',
    titol: ({ resum }) => plural(resum.mesurades, 'mètrica de salut amb mesura', 'mètriques de salut amb mesura'),
    /* Correcció 261004 (verificador de la tercera passada, punts 3 i 5) · el
       total apostrofat («D’1 mètrica») i quantes no tenen mesura: la coberta
       d'Avisos i salut les destaca. Derogat «De N mètriques: la resta, N/A». */
    subtitol: ({ mapa, resum }) => `${ambMajuscula(de(mapa.salut.length, plural(mapa.salut.length, 'mètrica', 'mètriques')))}: ${plural(mapa.salut.length - resum.mesurades, 'sense mesura (N/A)', 'sense mesura (N/A)')}`,
    subtitolSenseFont: 'La resta, N/A',
    entradeta: [
      'Compta les mètriques de la funció de salut que tenen una mesura reproduïble; la resta es pinten N/A.',
      'Ix de la llista salut de `mapa.json`, on cada mètrica porta la seua font i la seua prova.',
      'Una mètrica sense mesura no diu que tot vaja bé: diu que ningú no ho ha mirat.'
    ],
    font: `${FONT_MAPA} · salut`,
    /* Una mètrica N/A no és cap gravetat (neutre), però tampoc deixa dir que
       tot vaja bé: el verd només quan totes tenen mesura; si no, cap etiqueta,
       i a la vista quines no en tenen. */
    etiquetes: ({ mapa }) => (mapa.salut.length && mapa.salut.every(mesurada) ? etiquetaDeColor('verd') : null),
    problemes: ({ mapa }) => mapa.salut.filter((m) => !mesurada(m)).map((m) => problemaText(m.metrica, m.metrica, 'N/A')),
    detall: (mapa) => ({
      taules: [{ titol: 'Funció de salut', columnes: COLUMNES_METRICA, files: mapa.salut.map(filaMetrica), buit: 'El Mapa no porta cap mètrica de salut.' }]
    })
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · «Veure les
     12 tasques» d'Avisos i salut comptava totes les tasques sense cap
     targeta: «Coses que corren soles» només compta les que llança launchd. */
  {
    slug: 'tasques-del-mapa', origen: 'mapa', pagina: 'salut', icona: 'listChecks', nom: 'Tasques del Mapa',
    titol: ({ resum }) => plural(resum.tasques, 'tasca al Mapa', 'tasques al Mapa'),
    subtitol: ({ resum }) => (resum.tasques ? estatsDeTasques(resum.perEstat) : 'Cap tasca declarada ni llançada'),
    subtitolSenseFont: 'Declarades o llançades, amb el seu estat',
    entradeta: [
      'Compta totes les tasques del Mapa, les que el registre declara i les que algun llançador executa, amb l’estat de cada una.',
      ORIGEN_TASQUES,
      'Una tasca morta, sense llançador o sense declaració és una vigilància que no fa el que promet.'
    ],
    font: `${FONT_MAPA} · tasques`,
    // El pitjor estat: una morta, roig; una que no consta que corra, taronja; cap tasca, cap etiqueta.
    etiquetes: ({ mapa }) => etiquetaDeColor(colorDeTasques(mapa.tasques)),
    problemes: ({ mapa }) => problemesDeTasques(mapa.tasques),
    detall: (mapa) => ({ taules: [taulaTasques('Tasques i llançadors', mapa.tasques, 'El Mapa no porta cap tasca.')] })
  }
];

/* ── Explorador del cervell: la mida del graf ────────────────────────── */

/* Correcció 261004 (verificador de la segona passada, punt 2) · Els nodes i
   les arestes diuen que es tracten a l'Explorador: hi tenen la targeta. Abans
   només es pintaven a Avisos i salut, i «On es tracta» portava a una pàgina
   sense la seua targeta. */
const EXPLORADOR = [
  {
    slug: 'nodes', origen: 'mapa', pagina: 'explorador', icona: 'network', nom: 'Nodes del Mapa',
    titol: ({ resum }) => plural(resum.nodes, 'node', 'nodes'),
    subtitol: () => 'Peces del Mapa, de tots els tipus',
    entradeta: [
      'Compta les peces del Mapa del Mas: skills, rutes, plantilles, scripts, hooks, tasques, agents, documents i portes.',
      'Ix dels nodes de `mapa.json`, que `tooling/brain/mapa-consola.mjs` llig del disc i dels contractes.',
      'És la mida del cervell que la Consola vigila: el que no és node no té ni avisos ni relacions.'
    ],
    font: `${FONT_MAPA} · nodes`,
    detall: (_mapa, { resum }) => ({
      taules: [{
        titol: 'Nodes per tipus',
        columnes: ['Tipus', 'Nombre'],
        files: resum.perTipus.map(([t, n]) => ({ clau: t, celes: [text(NOMS_TIPUS[t] ?? t), text(n)] })),
        buit: 'El Mapa no té cap node.'
      }]
    })
  },
  {
    slug: 'arestes', origen: 'mapa', pagina: 'explorador', icona: 'link2', nom: 'Arestes del Mapa',
    titol: ({ resum }) => plural(resum.arestes, 'aresta', 'arestes'),
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · quantes de
       cada confiança: la coberta de l'Explorador destaca les inferides. */
    subtitol: ({ resum }) => {
      const per = new Map(resum.perConfianca);
      const noms = { declarat: ['declarada', 'declarades'], derivat: ['derivada', 'derivades'], inferit: ['inferida de la prosa', 'inferides de la prosa'] };
      return CONFIANCES.map((c) => plural(per.get(c) ?? 0, ...noms[c])).join(' · ');
    },
    subtitolSenseFont: 'Relacions entre peces, amb la seua confiança',
    entradeta: [
      'Compta les relacions entre peces del Mapa: qui crida, llig, escriu, dispara, encamina, carrega o governa qui.',
      'Ix de les arestes de `mapa.json`, cada una amb la seua confiança: declarada, derivada o inferida de la prosa.',
      'Una relació inferida no val igual que una declarada: és una pista, no un contracte.'
    ],
    font: `${FONT_MAPA} · arestes`,
    detall: (mapa, { resum }) => ({
      taules: [
        {
          titol: 'Arestes per confiança',
          columnes: ['Confiança', 'Nombre'],
          files: resum.perConfianca.map(([c, n]) => ({ clau: c, celes: [{ confianca: c }, text(n)] })),
          buit: 'El Mapa no té cap aresta.'
        },
        {
          titol: 'Arestes per relació',
          columnes: ['Relació', 'Nombre'],
          files: recomptePer(mapa.arestes, 'tipus').map(([t, n]) => ({ clau: t, celes: [text(t), text(n)] })),
          buit: 'El Mapa no té cap aresta.'
        }
      ]
    })
  },
  /* Correcció 261004 (verificador de la tercera passada, punt 5) · La coberta
     de l'Explorador destacava els enllaços trencats i les peces òrfenes
     («N scripts absents», «N peces òrfenes»…) sense cap targeta: ara els
     compta esta, amb el mateix desglossament al subtítol. */
  {
    slug: 'enllacos-trencats', origen: 'mapa', pagina: 'explorador', icona: 'link2Off', nom: 'Enllaços trencats i peces òrfenes',
    titol: ({ mapa }) => plural(ambCodi(mapa, ...CODIS_TRENCATS.map(([codi]) => codi)).length,
      'enllaç trencat o peça òrfena', 'enllaços trencats o peces òrfenes'),
    subtitol: ({ mapa }) => {
      const per = new Map(recomptePer(mapa.avisos, 'codi'));
      const parts = CODIS_TRENCATS.filter(([codi]) => per.get(codi)).map(([codi, un, molts]) => plural(per.get(codi), un, molts));
      return parts.length ? parts.join(' · ') : 'Cap relació apunta a una peça que no hi és';
    },
    subtitolSenseFont: 'Scripts, fonts, fitxers i skills que falten, i peces òrfenes',
    entradeta: [
      'Compta els avisos del Mapa que diuen que una relació apunta a una peça que no hi és (un script, una font, un fitxer o una skill) i les peces a les quals no arriba cap relació.',
      `Ix dels avisos ${CODIS_TRENCATS.map(([codi]) => codi).join(', ')} de \`mapa.json\`, que escriu \`tooling/brain/mapa-consola.mjs\`.`,
      'Al graf són fils que no porten enlloc: qui els seguix falla o no troba res.'
    ],
    font: `${FONT_MAPA} · avisos ${CODIS_TRENCATS.map(([codi]) => codi).join(', ')}`,
    /* La gravetat dels seus avisos, com la coberta de l'Explorador: un script o
       una skill que falten (alts), roig; una òrfena (mitjana), taronja. */
    etiquetes: ({ mapa }) => etiquetaDAvisos(ambCodi(mapa, ...CODIS_TRENCATS.map(([codi]) => codi))),
    problemes: ({ mapa }) => problemesDAvisos(ambCodi(mapa, ...CODIS_TRENCATS.map(([codi]) => codi))),
    detall: (mapa) => ({
      taules: [{
        titol: 'Enllaços trencats i peces òrfenes',
        columnes: COLUMNES_AVIS,
        files: filesAvisos(ambCodi(mapa, ...CODIS_TRENCATS.map(([codi]) => codi))),
        buit: 'Cap enllaç trencat ni cap peça òrfena.'
      }]
    })
  }
];

/* ── Entrades i eixides: les rutes documentals ──────────────────────── */

/* Correcció 261004 (verificador de la tercera passada, punt 5) · La coberta
   d'Entrades i eixides destacava «N rutes documentals» sense cap targeta. */
const rutesDe = (mapa) => mapa.nodes.filter((n) => n.tipus === 'ruta').sort((x, y) => x.id.localeCompare(y.id));
const surtenDe = (mapa, id, tipus) => mapa.arestes.filter((a) => a.de === id && a.tipus === tipus);

const ENTRADES = [
  {
    slug: 'rutes-documentals', origen: 'mapa', pagina: 'entrades', icona: 'route', nom: 'Rutes documentals',
    titol: ({ mapa }) => plural(rutesDe(mapa).length, 'ruta documental', 'rutes documentals'),
    subtitol: () => 'Cada tipus de document, amb la seua plantilla',
    entradeta: [
      'Compta les rutes documentals: cada tipus de document que el Mas sap fer (un prompt, un pla, una auditoria, una acta…) amb la plantilla que l’encamina, la skill que el governa, què llig i on el deixa.',
      'Ix dels nodes de tipus ruta de `mapa.json`, que `tooling/brain/mapa-consola.mjs` llig de `.agents/protocolledge.json`.',
      'Un document sense ruta naix sense plantilla i sense contracte: ningú no sap on va ni qui el llig.'
    ],
    font: `${FONT_MAPA} · nodes de tipus ruta`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Rutes documentals',
        columnes: ['Ruta', 'Tipus de document', 'Plantilla', 'Llig', 'Escriu'],
        files: rutesDe(mapa).map((r) => ({
          clau: r.id,
          celes: [
            text(nomDe(r.id)), text(r.atributs?.tipus_document ?? '—'),
            mono(surtenDe(mapa, r.id, 'encamina').map((a) => camiDe({ id: a.a, tipus: 'plantilla' })).join(', ')),
            text(surtenDe(mapa, r.id, 'llig').length), text(surtenDe(mapa, r.id, 'escriu').length)
          ]
        })),
        buit: 'El Mapa no porta cap ruta documental.'
      }]
    })
  }
];

/* ── Fluxos de treball ───────────────────────────────────────────────── */

const FLUXOS = [
  {
    slug: 'cadenes-declarades', origen: 'mapa', pagina: 'fluxos', icona: 'workflow', nom: 'Cadenes declarades',
    titol: ({ fl }) => plural(fl.cadenes.length, 'cadena declarada', 'cadenes declarades'),
    subtitol: () => 'O derivades: fluxos que encadenen de veres',
    entradeta: [
      'Compta les cadenes de faena on el que deixa una peça és el que llig la següent, o on una crida l’altra de veres.',
      'Ix de les relacions declarades o derivades de `mapa.json`; la prosa no encadena.',
      'Sense cadenes declarades, cap peça passa la faena a una altra sense el Mestre.'
    ],
    font: `${FONT_MAPA} · arestes llig, escriu i crida`,
    detall: (_mapa, { fl }) => ({ taules: [taulaCadenes(fl.cadenes)] })
  },
  {
    slug: 'suggeriments-de-la-prosa', origen: 'mapa', pagina: 'fluxos', icona: 'waypoints', nom: 'Suggeriments de la prosa',
    titol: ({ fl }) => plural(fl.suggeriments.length, 'suggeriment de la prosa', 'suggeriments de la prosa'),
    subtitol: () => 'Relacions inferides que caldria declarar',
    entradeta: [
      'Compta les relacions entre skills o rutes que només es lligen al text d’una skill.',
      'Ix de les arestes inferides de `mapa.json`, que el compilador treu de la prosa.',
      'Si una és un pas de veres, el remei és declarar-la al contracte de la skill.'
    ],
    font: `${FONT_MAPA} · arestes inferides`,
    detall: (_mapa, { fl }) => ({ taules: [taulaSuggeriments(fl.suggeriments)] })
  },
  {
    slug: 'punts-de-trobada', origen: 'mapa', pagina: 'fluxos', icona: 'folderOpen', nom: 'Punts de trobada',
    titol: ({ fl }) => plural(fl.punts.length, 'punt de trobada', 'punts de trobada'),
    subtitol: () => 'Llocs on una peça escriu o llig',
    entradeta: [
      'Compta els llocs on una peça deixa la faena o la replega.',
      'Ix de les relacions «escriu» i «llig» declarades o derivades de `mapa.json`.',
      'Una cadena es tanca on algú llig el que un altre ha deixat: un lloc amb escriptors i cap lector és una cadena a mitges.'
    ],
    font: `${FONT_MAPA} · arestes escriu i llig`,
    detall: (_mapa, { fl }) => ({ taules: [taulaPunts('Punts de trobada', fl.punts)] })
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · L'estat
     buit de les cadenes deia «2 llocs reben faena…» sense cap targeta: ara
     la frase enllaça amb esta. */
  {
    slug: 'llocs-sense-lector', origen: 'mapa', pagina: 'fluxos', icona: 'inbox', nom: 'Llocs sense lector',
    titol: ({ fl }) => plural(fl.punts.filter(esSenseLector).length, 'lloc amb faena i cap lector', 'llocs amb faena i cap lector'),
    subtitol: () => 'Hi escriuen, i ningú no declara que el llig',
    entradeta: [
      'Compta els llocs on alguna peça deixa la faena i cap altra no declara que la replega.',
      'Ix de les relacions «escriu» i «llig» declarades o derivades de `mapa.json`.',
      'Un lloc sense lector és una cadena a mitges: la faena hi queda i ningú no la continua.'
    ],
    font: `${FONT_MAPA} · arestes escriu i llig`,
    // Una cadena a mitges no trenca res: taronja; cap, verd (com la coberta de Fluxos).
    etiquetes: ({ fl }) => etiquetaDeColor(colorDe(true, false, fl.punts.some(esSenseLector))),
    problemes: ({ fl }) => fl.punts.filter(esSenseLector).map(llocSenseLector),
    detall: (_mapa, { fl }) => ({
      taules: [taulaPunts('Llocs sense lector', fl.punts.filter(esSenseLector), 'Cap lloc rep faena sense que algú declare que la llig.')]
    })
  }
];

/* ── Agents atòmics: les quatre peces que ho fan possible ────────────── */

/* Correcció 261004 (verificador de la segona passada) · Les quatre peces es
   pinten a Agents atòmics, i «On es tracta» hi porta: abans nomenava
   Fluxos, Entrades, Calendari i Salut, on la targeta no era. El detall de fons
   d'eixes pàgines el diu el text d'Agents atòmics. Els recomptes concorden. */
const segonsLectors = (n) => (n ? `${concorda(n, 'la llig', 'la lligen')} ${n}` : 'ningú no declara que la llig');
// Correcció 261004 (verificador de la tercera passada, punt 3) · «d’1 peça», mai «de 1 peça».
const dePeces = (n) => de(n, plural(n, 'peça', 'peces'));

const PECES = [
  {
    slug: 'peca-fluxos-de-treball', origen: 'mapa', pagina: 'agents', icona: 'workflow', nom: TITOLS_PECES_AGENTS.fluxos,
    titol: () => TITOLS_PECES_AGENTS.fluxos,
    subtitol: ({ peces }) => `${plural(peces.fluxos.cadenes, 'cadena declarada', 'cadenes declarades')} · ${plural(peces.fluxos.suggeriments, 'suggeriment de la prosa', 'suggeriments de la prosa')}`,
    subtitolSenseFont: 'Cadenes declarades i suggeriments de la prosa',
    etiquetes: ({ peces }) => etiquetaDePeca(peces.fluxos.estat),
    entradeta: [
      'Diu si hi ha fluxos de treball declarats: cadenes on el que deixa una peça és el que llig la següent.',
      'Ix de les relacions «llig», «escriu» i «crida» declarades o derivades de `mapa.json`.',
      'Sense cadenes declarades, cap agent pot passar la faena a un altre sense el Mestre.'
    ],
    font: `${FONT_MAPA} · arestes llig, escriu i crida`,
    detall: (_mapa, { fl }) => ({ taules: [taulaCadenes(fl.cadenes), taulaSuggeriments(fl.suggeriments)] })
  },
  {
    slug: 'peca-tauler', origen: 'mapa', pagina: 'agents', icona: 'clipboardList', nom: TITOLS_PECES_AGENTS.tauler,
    titol: () => TITOLS_PECES_AGENTS.tauler,
    subtitol: ({ peces }) => {
      const { desti } = peces.tauler;
      if (!desti) return 'Cap peça declara on deixa la faena';
      return `${etiquetaNode(desti.node)} rep la faena ${dePeces(desti.escriuen.length)} · ${segonsLectors(desti.lligen.length)}`;
    },
    // El nom del lloc és una ruta: el mode privacitat el lleva i deixa el recompte.
    subtitolPrivat: ({ peces }) => {
      const { desti } = peces.tauler;
      if (!desti) return null;
      return `Un lloc rep la faena ${dePeces(desti.escriuen.length)} · ${segonsLectors(desti.lligen.length)}`;
    },
    subtitolSenseFont: 'On deixen la faena les peces',
    etiquetes: ({ peces }) => etiquetaDePeca(peces.tauler.estat),
    // Un tauler sense lector diu quin és, a la vista.
    problemes: ({ peces }) => (peces.tauler.desti && esSenseLector(peces.tauler.desti) ? [llocSenseLector(peces.tauler.desti)] : []),
    entradeta: [
      'Diu on deixen la faena les peces i si algú la replega: el lloc on més peces escriuen.',
      'Ix dels punts de trobada de `mapa.json`: les relacions «escriu» i «llig» declarades o derivades.',
      'Un tauler sense lector és una safata que ningú no buida.'
    ],
    font: `${FONT_MAPA} · arestes escriu i llig`,
    detall: (_mapa, { peces }) => ({
      taules: [taulaPunts('El tauler', peces.tauler.desti ? [peces.tauler.desti] : [])]
    })
  },
  {
    slug: 'peca-agents-sols', origen: 'mapa', pagina: 'agents', icona: 'timer', nom: TITOLS_PECES_AGENTS.sols,
    titol: () => TITOLS_PECES_AGENTS.sols,
    subtitol: ({ peces }) => (peces.sols.programades
      ? `${peces.sols.vives} ${de(peces.sols.programades, plural(peces.sols.programades, 'tasca que llança launchd', 'tasques que llança launchd'))} ${concorda(peces.sols.vives, 'és viva', 'són vives')}`
      : 'Cap tasca programada: res no arranca sol'),
    subtitolSenseFont: 'Tasques que llança launchd',
    etiquetes: ({ peces }) => etiquetaDePeca(peces.sols.estat),
    problemes: ({ capes }) => problemesDeTasques(capes.programades),
    entradeta: [
      'Diu quantes de les tasques que llança launchd són vives.',
      ORIGEN_TASQUES,
      'Un agent només treballa sol si alguna cosa l’arranca sense el Mestre davant.'
    ],
    font: `${FONT_MAPA} · tasques`,
    detall: (_mapa, { capes }) => ({
      taules: [taulaTasques('Tasques que llança launchd', capes.programades, 'Cap tasca programada: res no arranca sol.')]
    })
  },
  {
    slug: 'peca-vigilants', origen: 'mapa', pagina: 'agents', icona: 'siren', nom: TITOLS_PECES_AGENTS.vigilants,
    titol: () => TITOLS_PECES_AGENTS.vigilants,
    subtitol: ({ peces, an }) => `Vigilants vius: ${peces.vigilants.metrica ? valorMetrica(peces.vigilants.metrica) : 'N/A'} · ${plural(an.alts, 'avís alt', 'avisos alts')} al Mapa`,
    subtitolSenseFont: 'Vigilants vius i avisos alts',
    etiquetes: ({ peces }) => etiquetaDePeca(peces.vigilants.estat),
    problemes: ({ mapa }) => problemesDAvisos(mapa.avisos.filter((a) => a.severitat === 'alta')),
    entradeta: [
      'Diu si els vigilants del Mas són vius i quants avisos alts hi ha.',
      'Ix de la mètrica vigilants-vius i dels avisos de severitat alta de `mapa.json`.',
      'Sense vigilants vius, una fallada no avisa ningú.'
    ],
    font: `${FONT_MAPA} · mètrica vigilants-vius i avisos alts`,
    metrica: 'vigilants-vius',
    detall: (mapa, { peces }) => ({
      taules: [
        {
          titol: 'Vigilants vius',
          columnes: COLUMNES_METRICA,
          files: peces.vigilants.metrica ? [filaMetrica(peces.vigilants.metrica)] : [],
          buit: 'El Mapa no porta la mètrica vigilants-vius.'
        },
        {
          titol: 'Avisos alts',
          columnes: COLUMNES_AVIS,
          files: filesAvisos(mapa.avisos.filter((a) => a.severitat === 'alta')),
          buit: 'Cap avís alt.'
        }
      ]
    })
  }
];

/* ── Calendari de processos: les tasques per cadència ────────────────── */

/* [un, molts, nom (sense Mapa), què les fa d'este grup, icona] */
const PARAULES_CADENCIA = Object.freeze({
  dia: ['tasca diària', 'tasques diàries', 'Tasques diàries', 'corren cada dia o més sovint', 'sun'],
  setmana: ['tasca setmanal', 'tasques setmanals', 'Tasques setmanals', 'corren cada setmana', 'calendarDays'],
  mes: ['tasca mensual', 'tasques mensuals', 'Tasques mensuals', 'corren cada mes o més espaiat', 'calendarRange'],
  altra: ['tasca d’altra cadència', 'tasques d’altres cadències', 'Tasques d’altres cadències', 'tenen un cron que no és diari, setmanal ni mensual', 'shuffle'],
  permanent: ['tasca resident', 'tasques residents', 'Tasques residents', 'viuen sempre (residents)', 'infinity'],
  arrencada: ['tasca en arrencar', 'tasques en arrencar', 'Tasques en arrencar', 'només corren en arrencar el sistema', 'power'],
  esdeveniment: ['tasca per esdeveniment', 'tasques per esdeveniment', 'Tasques per esdeveniment', 'salten amb un esdeveniment (un hook)', 'zap'],
  sense: ['tasca sense cadència declarada', 'tasques sense cadència declarada', 'Tasques sense cadència declarada', 'no declaren cap cadència', 'circleHelp']
});

const CADENCIES = GRUPS_CADENCIA.map(([k, etiqueta]) => {
  const [un, molts, nom, frase, icona] = PARAULES_CADENCIA[k];
  return {
    slug: `cadencia-${k}`, origen: 'mapa', pagina: 'calendari', icona, nom,
    existeix: ({ cad }) => cad[k].length > 0,
    titol: ({ cad }) => plural(cad[k].length, un, molts),
    subtitol: ({ cad }) => cad[k].map((t) => t.id).join(' · '),
    subtitolSenseFont: etiqueta,
    // El pitjor estat de les seues tasques, i quines no consten vives.
    etiquetes: ({ cad }) => etiquetaDeColor(colorDeTasques(cad[k])),
    problemes: ({ cad }) => problemesDeTasques(cad[k]),
    entradeta: [
      `Compta les tasques del Mapa que ${frase}.`,
      ORIGEN_TASQUES,
      'Saber quan corre cada cosa és saber quan ha de deixar rastre: una tasca que no en deixa està morta.'
    ],
    font: `${FONT_MAPA} · tasques`,
    detall: (_mapa, { cad }) => ({ taules: [taulaTasques(nom, cad[k], 'Cap tasca d’esta cadència.')] })
  };
});

const SENSE_LLANCADOR = [
  {
    // Es pinta a Actors, a «El que corre sol»: és la pàgina que la tracta (correcció 261004).
    slug: 'tasques-sense-llancador', origen: 'mapa', pagina: 'actors', icona: 'circleDashed', nom: 'Tasques sense llançador',
    existeix: ({ capes }) => capes.senseLlancador.length > 0,
    titol: ({ capes }) => plural(capes.senseLlancador.length, 'tasca sense llançador', 'tasques sense llançador'),
    subtitol: ({ capes }) => capes.senseLlancador.map((t) => t.id).join(' · '),
    subtitolSenseFont: 'Declarades al registre i ningú no les llança',
    etiquetes: () => etiquetaPendent('FALTA'),
    problemes: ({ capes }) => capes.senseLlancador.map((t) => problemaTasca(t)),
    entradeta: [
      'Compta les tasques que el registre de tasques declara i cap llançador executa.',
      ORIGEN_TASQUES,
      'Una tasca declarada que ningú no llança fa creure que hi ha una vigilància que no hi és.'
    ],
    font: `${FONT_MAPA} · tasques declarades sense llançador`,
    detall: (_mapa, { capes }) => ({
      taules: [{
        titol: 'Tasques sense llançador',
        columnes: ['Tasca', 'Estat', 'Script', 'Font'],
        files: capes.senseLlancador.map((t) => ({ clau: t.id, celes: [text(t.id), { estat: t.estat }, mono(t.script), mono(t.font)] })),
        buit: 'Totes les tasques declarades tenen llançador.'
      }]
    })
  }
];

/* ── Els recomptes de les famílies: agents atòmics, candats i sòl ────── */

/* Correcció 261004 (verificador de la tercera passada, punt 5) · Les cobertes
   d'Agents atòmics i d'Actors destacaven «N agents atòmics» i «N candats»,
   i els estats dels candats i dels llocs del sòl, sense cap targeta que els
   comptara: cada recompte té ara la seua, davant de les peces de la família. */
const textAcreditat = (v) => (v === true ? 'sí' : v === false ? 'no' : 'desconegut');

const RECOMPTES = [
  {
    slug: 'agents-atomics', origen: 'mapa', pagina: 'agents', icona: 'cpu', nom: 'Agents atòmics',
    titol: ({ mapa }) => plural(agentsAtomics(mapa).length, 'agent atòmic', 'agents atòmics'),
    subtitol: () => 'Agents que declaren què lligen o què deixen',
    entradeta: [
      'Compta els agents del Mapa que tenen contracte: declaren (o un analitzador deriva) què lligen o què deixen.',
      'Ix de les relacions «llig» i «escriu» declarades o derivades dels nodes de tipus agent de `mapa.json`; la prosa no fa contracte.',
      'Només un agent amb contracte pot treballar sense el Mestre davant i deixar una faena que un altre revise.'
    ],
    font: `${FONT_MAPA} · arestes llig i escriu dels agents`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Agents atòmics',
        columnes: ['Agent', 'Llig', 'Deixa'],
        files: agentsAtomics(mapa).map((a) => ({
          clau: a.node.id, celes: [text(a.node.atributs?.arnes ?? etiquetaNode(a.node)), text(a.llig.length), text(a.escriu.length)]
        })),
        buit: 'Cap agent declara què llig ni què deixa.'
      }]
    })
  },
  {
    slug: 'candats', origen: 'mapa', pagina: 'actors', icona: 'lock', nom: 'Candats',
    titol: ({ capes }) => plural(capes.candats.length, 'candat', 'candats'),
    subtitol: ({ capes }) => {
      const quants = (v) => capes.candats.filter((c) => c.acreditat === v).length;
      return [
        plural(quants(true), 'acreditat', 'acreditats'),
        plural(quants(false), 'sense consumidor', 'sense consumidor'),
        plural(quants(null), 'per acreditar', 'per acreditar')
      ].join(' · ');
    },
    subtitolSenseFont: 'Acreditats, sense consumidor o per acreditar',
    // Sense consumidor, roig (com SENSE CONSUMIDOR); per acreditar, taronja; tots acreditats, verd; cap candat, cap etiqueta.
    etiquetes: ({ capes }) => etiquetaDeColor(colorDe(capes.candats.length > 0,
      capes.candats.some((c) => c.acreditat === false), capes.candats.some((c) => c.acreditat === null))),
    problemes: ({ capes }) => problemesDeCandats(capes.candats),
    entradeta: [
      'Compta els candats (hooks) del Mas, els que disparen els arnesos i els hooks de git del registre de tasques, i diu quants tenen el consumidor acreditat.',
      'Ix dels nodes de tipus hook de `mapa.json` i dels hooks de git de `.agents/cron/registre_tasques.json`.',
      'Un candat sense consumidor acreditat és una promesa: està declarat, però ningú no demostra que salte.'
    ],
    font: `${FONT_MAPA} · nodes de tipus hook`,
    detall: (_mapa, { capes }) => ({
      taules: [{
        titol: 'Candats del Mas',
        columnes: ['Candat', 'Arnés', 'Consumidor acreditat', 'Scripts que dispara'],
        files: capes.candats.map((c) => ({
          clau: c.id, celes: [text(c.esdeveniment), text(c.arnes), text(textAcreditat(c.acreditat)), mono(c.scripts.join(', '))]
        })),
        buit: 'Cap candat al Mapa.'
      }]
    })
  },
  {
    slug: 'llocs-del-sol', origen: 'mapa', pagina: 'actors', icona: 'layers', nom: 'Llocs del sòl',
    titol: ({ capes }) => plural(capes.sol.length, 'lloc del sòl', 'llocs del sòl'),
    subtitol: ({ capes }) => `Documents i plantilles on treballen · ${plural(capes.sol.filter(esSenseLector).length, 'sense lector', 'sense lector')}`,
    subtitolSenseFont: 'Documents i plantilles on treballen',
    etiquetes: ({ capes }) => etiquetaDeColor(colorDe(capes.sol.length > 0, false, capes.sol.some(esSenseLector))),
    problemes: ({ capes }) => capes.sol.filter(esSenseLector).map(llocSenseLector),
    entradeta: [
      'Compta els documents i les plantilles on les peces deixen la faena o la lligen: el sòl sobre el qual treballen els agents.',
      'Ix de les relacions «escriu» i «llig» declarades o derivades de `mapa.json`.',
      'Un lloc on algú escriu i ningú no llig és una cadena a mitges.'
    ],
    font: `${FONT_MAPA} · arestes escriu i llig`,
    detall: (_mapa, { capes }) => ({ taules: [taulaPunts('Llocs del sòl', capes.sol, 'Cap lloc declarat.')] })
  }
];

/* ── El pols: les xifres de consola.json ─────────────────────────────── */

const ORIGEN_DIARI = 'Ix de les entrades consum.tokens de `.agents/.diari_sessio.jsonl`, que el middleware `tooling/vite/consola-iaia.mjs` servix a `/__iaia/consola.json`.';
const ORIGEN_INVENTARI = 'Ix de la llista skills de `/__iaia/consola.json`, que el middleware `tooling/vite/consola-iaia.mjs` compon llegint el disc i `manifest.yaml`.';
const ORIGEN_REBUTS = 'Ix de les entrades matrix.rebut de `.agents/.diari_sessio.jsonl`, que el middleware `tooling/vite/consola-iaia.mjs` servix a `/__iaia/consola.json`.';
/* Un recompte de línies descartades: el número o, si la font no el porta, «sense mesura». */
const liniesDe = (n) => (n === null ? 'sense mesura' : String(n));
/* Correcció 261004 (verificador de la tercera passada, punts 3 i 4) · «d’1
   agent», mai «de 1 agent»; i sense el diari de sessió, ho diu: no és cap zero. */
const dAgents = (consums) => de(consums.perAgent.length, plural(consums.perAgent.length, 'agent', 'agents'));
const DIARI_ILLEGIBLE = 'El diari de sessió no es pot llegir';
// «de 7 dies»: el llindar dels rebuts rancis, apostrofat si cal.
const MES_DE_DIES = de(LLINDAR_REBUTS_RANCIS_DIES, plural(LLINDAR_REBUTS_RANCIS_DIES, 'dia', 'dies'));

/* Una fila per agent amb els seus registres. Fase A (pas 2.2 del pla,
   261006) · sense les xifres de tòkens, ja no hi ha cap columna al costat. */
const taulaPerAgent = (titol) => (_dades, { consums, n }) => ({
  senseMesura: consums.registres ? null
    : consums.registres === null
      ? 'El diari de sessió no existix o no es pot llegir: no hi ha cap mesura del consum, i això no és cap zero.'
      : 'El diari de sessió no té cap entrada consum.tokens: ningú no ha mesurat el consum, i això no és cap zero.',
  taules: [{
    titol,
    columnes: ['Agent', 'Registres'],
    files: consums.perAgent.map((a) => ({ clau: a.agent, celes: [text(a.agent), text(n(a.sessions))] })),
    buit: 'Cap agent ha anotat consum.'
  }]
});

const taulaSkillsPols = (titol, quines, buit) => (_dades, { skills }) => ({
  taules: [{
    titol,
    columnes: ['Skill', 'Estat', 'Manifest', 'Disc'],
    files: quines(skills).map((s) => ({
      clau: s.nom, celes: [text(s.nom), text(s.estat ?? 'sense estat'), siNo(s.alManifest), siNo(s.alDisc)]
    })),
    buit
  }]
});

const POLS = [
  {
    slug: 'registres-de-consum', origen: 'consola', pagina: 'pols', icona: 'activity', nom: 'Registres de consum',
    titol: ({ consums }) => senseMesura(consums.registres, 'registre de consum', 'registres de consum', 'Registres de consum sense mesura'),
    subtitol: ({ consums }) => (consums.registres === null ? DIARI_ILLEGIBLE : ambMajuscula(dAgents(consums))),
    subtitolSenseFont: 'Al diari de sessió',
    entradeta: [
      'Compta les entrades de consum que els agents han anotat al diari de sessió.',
      ORIGEN_DIARI,
      'Un agent que no anota el seu consum no compta, encara que gaste: sense registres, la Consola no en sap res.'
    ],
    font: `${FONT_CONSOLA} · consums`,
    detall: taulaPerAgent('Registres de consum per agent')
  },
  {
    slug: 'skills-del-manifest', origen: 'consola', pagina: 'pols', panell: 'skills', icona: 'puzzle', nom: 'Skills al disc o al manifest',
    titol: ({ skills }) => plural(skills.total, 'skill al disc o al manifest', 'skills al disc o al manifest'),
    subtitol: () => 'L’inventari del pols',
    entradeta: [
      'Compta les skills de l’inventari del pols: les que són al disc, al manifest o a tots dos llocs.',
      ORIGEN_INVENTARI,
      'És la base de les altres xifres del pols: el que no és a l’inventari no ho compara ningú.'
    ],
    font: `${FONT_CONSOLA} · skills`,
    detall: taulaSkillsPols('Inventari del pols', (s) => s.totes, 'L’inventari no porta cap skill.')
  },
  {
    slug: 'skills-del-nucli', origen: 'consola', pagina: 'pols', panell: 'skills', icona: 'anchor', nom: 'Skills del nucli',
    titol: ({ skills }) => plural(skills.nucli.length, 'skill del nucli', 'skills del nucli'),
    subtitol: () => 'Marcades com a core',
    entradeta: [
      'Compta les skills que el manifest marca com a nucli (core): les que cap agent no pot deixar de carregar.',
      ORIGEN_INVENTARI,
      'Una skill del nucli trencada trenca tots els agents alhora.'
    ],
    font: `${FONT_CONSOLA} · skills`,
    detall: taulaSkillsPols('Skills del nucli', (s) => s.nucli, 'Cap skill marcada com a nucli.')
  },
  {
    slug: 'skills-fora-del-manifest', origen: 'consola', pagina: 'pols', panell: 'skills', icona: 'unlink', nom: 'Skills fora del manifest',
    titol: ({ skills }) => plural(skills.orfes.length, 'skill fora del manifest', 'skills fora del manifest'),
    subtitol: () => 'Al disc, però no al manifest',
    entradeta: [
      'Compta les skills que tenen carpeta al disc però no són a `manifest.yaml`.',
      ORIGEN_INVENTARI,
      'Una skill fora del manifest existix però el sistema no la declara: ningú no sap que l’ha de cuidar.'
    ],
    font: `${FONT_CONSOLA} · skills`,
    // Roig, com la coberta del pols i el panell Skills; cap, verd.
    etiquetes: ({ skills }) => etiquetaDeColor(colorDe(true, skills.orfes.length > 0)),
    problemes: ({ skills }) => skills.orfes.map((s) => problemaText(s.nom, s.nom, 'fora del manifest', ROIG)),
    detall: taulaSkillsPols('Skills fora del manifest', (s) => s.orfes, 'Totes les skills del disc són al manifest.')
  },
  {
    slug: 'skills-sense-disc', origen: 'consola', pagina: 'pols', panell: 'skills', icona: 'ghost', nom: 'Skills sense disc',
    titol: ({ skills }) => plural(skills.fantasmes.length, 'skill sense disc', 'skills sense disc'),
    subtitol: () => 'Al manifest, però no al disc',
    entradeta: [
      'Compta les skills que `manifest.yaml` declara i que no tenen carpeta al disc.',
      ORIGEN_INVENTARI,
      'Qui la carregue no la trobarà: el manifest promet un procediment que no hi és.'
    ],
    font: `${FONT_CONSOLA} · skills`,
    etiquetes: ({ skills }) => etiquetaDeColor(colorDe(true, skills.fantasmes.length > 0)),
    problemes: ({ skills }) => skills.fantasmes.map((s) => problemaText(s.nom, s.nom, 'sense disc', ROIG)),
    detall: taulaSkillsPols('Skills sense disc', (s) => s.fantasmes, 'Totes les skills del manifest són al disc.')
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · La línia
     «Segell … · 30 fitxers · data» del panell de Skills era una xifra solta. */
  {
    slug: 'segell-de-skills', origen: 'consola', pagina: 'pols', panell: 'skills', icona: 'stamp', nom: 'Segell de skills',
    titol: ({ segell }) => (segell ? plural(segell.filesCount, 'fitxer al segell de skills', 'fitxers al segell de skills') : 'Segell de skills absent'),
    subtitol: ({ segell, data }) => (segell ? `Empremta ${curt(segell.hash)} · ${data(segell.timestamp)}` : 'consola.json no porta cap segell'),
    // L'empremta és una dada de màquina: el mode privacitat la lleva i deixa la data.
    subtitolPrivat: ({ segell, data }) => (segell ? `Segellat el ${data(segell.timestamp)}` : null),
    subtitolSenseFont: 'Empremta i data del segell',
    // Sense segell, FALTA (taronja). Amb segell, només informa: la coherència amb el disc la jutja Avisos i salut.
    etiquetes: ({ segell }) => (segell ? null : etiquetaDEstat('FALTA')),
    entradeta: [
      'Compta els fitxers que acredita el segell de skills i en diu l’empremta i la data.',
      'Ix de `.agents/SKILLS_SEAL.json`, que el middleware `tooling/vite/consola-iaia.mjs` llig i servix a `/__iaia/consola.json`.',
      'Un fitxer fora del segell té un contingut que ningú no ha acreditat; la comparació amb el disc és a Avisos i salut.'
    ],
    font: `${FONT_CONSOLA} · segell`,
    detall: (_dades, { segell, data }) => ({
      senseMesura: segell ? null : 'consola.json no porta cap segell: el fitxer del segell de skills no existix o no es pot llegir.',
      taules: [
        taulaDades('El segell', segell
          ? [['Empremta', mono(segell.hash)], ['Fitxers', text(segell.filesCount)], ['Data', text(data(segell.timestamp))]]
          : []),
        {
          titol: 'Fitxers segellats',
          columnes: ['Fitxer', 'Empremta'],
          files: Object.entries(segell?.manifest ?? {}).sort(([x], [y]) => x.localeCompare(y))
            .map(([ruta, sha]) => ({ clau: ruta, celes: [mono(ruta), mono(curt(sha))] })),
          buit: 'consola.json no porta la llista de fitxers del segell.'
        }
      ]
    })
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · Càrrega
     documental: la barra de progrés i el recompte de l'avís eren xifres
     soltes. */
  {
    slug: 'artefactes-actius', origen: 'consola', pagina: 'pols', panell: 'carrega', icona: 'gauge', nom: 'Artefactes actius',
    titol: ({ recompte }) => senseMesura(recompte, 'artefacte actiu', 'artefactes actius', 'Artefactes actius sense mesura'),
    subtitol: ({ recompte }) => {
      if (recompte === null) return 'Les skills i els rebuts no en són cap mesura';
      return saturat(recompte)
        ? `${plural(recompte - LLINDAR_SATURACIO, 'artefacte', 'artefactes')} per damunt del llindar ${de(LLINDAR_SATURACIO)}`
        : `Dins del llindar d’avís, ${LLINDAR_SATURACIO}`;
    },
    subtitolSenseFont: `Llindar d’avís: ${LLINDAR_SATURACIO}`,
    // Dins del llindar, verd (com el panell Càrrega documental); sense termometria, cap etiqueta.
    etiquetes: ({ recompte }) => (saturat(recompte) ? etiquetaPendent('SATURAT') : recompte === null ? null : etiquetaDeColor('verd')),
    entradeta: [
      'Compta els artefactes actius del cervell i els compara amb el llindar de saturació, on el context s’embossa.',
      'Ix del camp termometria de `/__iaia/consola.json`, que servix el middleware `tooling/vite/consola-iaia.mjs`; mentre no el publique, no hi ha mesura.',
      'Per damunt del llindar cal revisar rellevància i context: la Consola no arxiva res sola.'
    ],
    font: `${FONT_CONSOLA} · termometria`,
    detall: (dades, { recompte }) => ({
      senseMesura: recompte === null
        ? 'consola.json no porta la termometria: ningú no compta encara els artefactes actius, i les skills i els rebuts no en són cap mesura.'
        : null,
      taules: [taulaDades('La càrrega documental', [
        ['Artefactes actius', text(recompte ?? '—')],
        ['Llindar d’avís', text(LLINDAR_SATURACIO)],
        ['Per damunt del llindar', text(recompte === null ? '—' : Math.max(0, recompte - LLINDAR_SATURACIO))],
        ['Abast', text(dades.termometria?.abast || '—')]
      ])]
    })
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · Rebuts: el
     nombre de rebuts i «Últim rebut … (fa N dies)» eren xifres soltes. */
  {
    slug: 'rebuts-de-lectura', origen: 'consola', pagina: 'pols', panell: 'rebuts', icona: 'receipt', nom: 'Rebuts de lectura',
    // Correcció 261004 (verificador de la tercera passada, punt 4) · sense el diari, cap «0 rebuts».
    titol: ({ rebuts, diari }) => senseMesura(diari ? rebuts.length : null, 'rebut de lectura', 'rebuts de lectura', 'Rebuts de lectura sense mesura'),
    subtitol: ({ diari }) => (diari ? 'Entrades matrix.rebut del diari de sessió' : DIARI_ILLEGIBLE),
    subtitolSenseFont: 'Entrades matrix.rebut del diari de sessió',
    entradeta: [
      'Compta els rebuts de lectura Matrix: cada vegada que un agent llig senceres les fonts d’un protocol, en queda un amb l’empremta de cada fitxer.',
      ORIGEN_REBUTS,
      'Sense rebut no hi ha cap prova que l’eixam haja llegit el que diu que ha llegit.'
    ],
    font: `${FONT_CONSOLA} · rebuts`,
    detall: (_dades, { rebuts, data, diari }) => ({
      senseMesura: diari ? null
        : 'El diari de sessió no existix o no es pot llegir: no hi ha cap mesura dels rebuts, i això no és cap zero.',
      taules: [{
        titol: 'Rebuts de lectura Matrix',
        columnes: ['Data', 'Petició', 'Protocols', 'Fonts'],
        files: rebuts.map((r, i) => ({
          clau: `${r.t}-${r.peticio}-${i}`,
          celes: [text(data(r.t)), mono(r.peticio ? curt(r.peticio) : null),
            mono(r.protocols.map((p) => p.split('/').pop()).join(', ')), text(r.fonts.length)]
        })),
        buit: 'El diari de sessió no té cap entrada matrix.rebut.'
      }]
    })
  },
  {
    slug: 'ultim-rebut', origen: 'consola', pagina: 'pols', panell: 'rebuts', icona: 'clock', nom: 'Últim rebut',
    titol: ({ ultim, ara }) => (ultim ? `Últim rebut ${faDies(diesDes(ultim, ara))}` : 'Últim rebut sense data'),
    subtitol: ({ ultim, rebuts, data, diari }) => {
      if (ultim) return data(ultim);
      if (!diari) return DIARI_ILLEGIBLE;
      return rebuts.length ? 'Cap rebut porta una data llegible' : 'El diari de sessió no té cap rebut';
    },
    subtitolSenseFont: 'Quan va entrar l’últim rebut de lectura',
    // Amb un rebut datat i recent, verd (com el panell Rebuts); sense cap rebut datat, cap etiqueta.
    etiquetes: ({ rebuts, ultim, ara }) => (rebutsRancis(rebuts, ara)
      ? etiquetaPendent(`FA MÉS ${MES_DE_DIES}`.toLocaleUpperCase('ca')) : ultim ? etiquetaDeColor('verd') : null),
    entradeta: [
      'Diu quan va entrar l’últim rebut de lectura Matrix al diari de sessió.',
      ORIGEN_REBUTS,
      `Un diari que fa més ${MES_DE_DIES} que no rep cap rebut ja no diu què llig l’eixam hui.`
    ],
    font: `${FONT_CONSOLA} · rebuts`,
    detall: (_dades, { rebuts, ultim, ara, data, diari }) => ({
      senseMesura: ultim ? null
        : !diari ? 'El diari de sessió no existix o no es pot llegir: no hi ha cap data que dir.'
          : rebuts.length ? 'Cap rebut del diari porta una data llegible: no es pot dir quan va entrar l’últim.'
            : 'El diari de sessió no té cap rebut de lectura: no hi ha cap data que dir.',
      taules: [taulaDades('L’últim rebut', ultim ? [
        ['Data', text(data(ultim))],
        ['Quan', text(faDies(diesDes(ultim, ara)))],
        ['Llindar d’avís', text(`més ${MES_DE_DIES}`)]
      ] : [])]
    })
  },
  /* Correcció 261004 (verificador de la segona passada, punt 2) · El peu de
     les pàgines del pols deia «N operacions immunitàries» i el pols, «Línies
     descartades: …»: dues xifres soltes. Ara són targetes del pols. */
  {
    slug: 'operacions-immunitaries', origen: 'consola', pagina: 'pols', icona: 'syringe', nom: 'Operacions immunitàries',
    /* Correcció 261004 (verificador de la tercera passada, punt 4) · el
       middleware publica `operacions: 0` també sense journal: sense mesura,
       mai «0 operacions» (operacionsImmunitaries, consolaPagines.js). */
    titol: ({ imm }) => senseMesura(imm.operacions, 'operació immunitària', 'operacions immunitàries', 'Operacions immunitàries sense mesura'),
    subtitol: ({ imm, data }) => {
      if (imm.operacions === null) return 'El journal immunitari no es pot llegir';
      return imm.ultima ? `L’última, el ${data(imm.ultima)}` : 'Sense data de l’última';
    },
    subtitolSenseFont: 'Al journal immunitari',
    entradeta: [
      'Compta les línies vàlides del journal immunitari: cada una és una operació del sistema immunitari sobre un fitxer.',
      'Ix de `.immunitari/journal.ndjson`, que el middleware `tooling/vite/consola-iaia.mjs` llig i servix a `/__iaia/consola.json`.',
      'Un recompte sense data no diu si el sistema és viu: per això la targeta diu quan va ser l’última.'
    ],
    font: `${FONT_CONSOLA} · immunitari`,
    detall: (_dades, { imm, data }) => ({
      senseMesura: imm.operacions === null
        ? 'El journal immunitari no existix o no es pot llegir: no hi ha cap recompte d’operacions, i això no és cap zero.'
        : null,
      taules: [{
        ...taulaDades('L’última operació', imm.op ? [
          ['Operació', text(imm.op.op ?? '—')],
          ['Tipus', text(imm.op.tipus ?? '—')],
          ['Fitxer', mono(imm.op.fitxer)],
          ['Data', text(imm.ultima ? data(imm.ultima) : '—')]
        ] : []),
        buit: 'consola.json no porta l’última operació: el journal és buit o no es pot llegir.'
      }]
    })
  },
  {
    slug: 'linies-descartades', origen: 'consola', pagina: 'pols', icona: 'fileX', nom: 'Línies descartades',
    /* Com el LEDGER: una mesura absent no es compta com a 0. Amb les dues, la
       suma; amb una sola, només eixa, i ho diu. */
    titol: ({ desc }) => {
      if (!desc) return 'Línies descartades sense mesura';
      if (desc.diari === null) return `${plural(desc.immunitari, 'línia descartada', 'línies descartades')} al journal immunitari`;
      if (desc.immunitari === null) return `${plural(desc.diari, 'línia descartada', 'línies descartades')} al diari de sessió`;
      return plural(desc.diari + desc.immunitari, 'línia descartada', 'línies descartades');
    },
    subtitol: ({ desc }) => (desc
      ? `Diari de sessió: ${liniesDe(desc.diari)} · journal immunitari: ${liniesDe(desc.immunitari)}`
      : 'consola.json no porta el recompte'),
    subtitolSenseFont: 'Del diari de sessió i del journal immunitari',
    // Amb les dues fonts mesurades i cap línia perduda, verd; amb una sola mesura, cap etiqueta (no hi ha base).
    etiquetes: ({ desc }) => ((desc?.diari ?? 0) + (desc?.immunitari ?? 0) > 0 ? etiquetaPendent('JSON NO VÀLID')
      : desc && desc.diari !== null && desc.immunitari !== null ? etiquetaDeColor('verd') : null),
    problemes: ({ desc }) => [
      ['diari', '.agents/.diari_sessio.jsonl', desc?.diari], ['immunitari', '.immunitari/journal.ndjson', desc?.immunitari]
    ].filter(([, , n]) => n > 0)
      .map(([clau, ruta, n]) => problemaRuta(clau, plural(n, 'línia descartada', 'línies descartades'), ruta, 'JSON no vàlid', toDeColor('taronja'))),
    entradeta: [
      'Compta les línies del diari de sessió i del journal immunitari que no són JSON vàlid i que el middleware descarta.',
      'Ix del camp fonts de `/__iaia/consola.json`: `tooling/vite/consola-iaia.mjs` compta les que no pot llegir de `.agents/.diari_sessio.jsonl` i de `.immunitari/journal.ndjson`.',
      'Una línia descartada no compta en cap rebut, consum ni operació: el pols diu menys del que ha passat.'
    ],
    font: `${FONT_CONSOLA} · fonts`,
    detall: (_dades, { desc }) => ({
      senseMesura: desc ? null : 'consola.json no porta el recompte de línies descartades: el middleware no l’ha publicat.',
      taules: [{
        titol: 'Línies descartades per font',
        columnes: ['Font', 'Fitxer', 'Línies descartades'],
        files: desc ? [
          { clau: 'diari', celes: [text('Diari de sessió'), mono('.agents/.diari_sessio.jsonl'), text(liniesDe(desc.diari))] },
          { clau: 'immunitari', celes: [text('Journal immunitari'), mono('.immunitari/journal.ndjson'), text(liniesDe(desc.immunitari))] }
        ] : [],
        buit: 'consola.json no porta el recompte.'
      }]
    })
  }
];

/** Les xifres de dins de les pàgines, cada una amb el seu slug estable. */
export const XIFRES_VISTES = Object.freeze([
  ...INVENTARI, ...SALUT, ...EXPLORADOR, ...ENTRADES, ...FLUXOS, ...PECES, ...RECOMPTES, ...CADENCIES, ...SENSE_LLANCADOR, ...POLS
]);

/**
 * Quines xifres pinta cada graella, en ordre: la de cada pàgina, la d'un
 * tros d'una pàgina (actors, sense-llancador) o la d'un panell del pols.
 * Correcció 261004 (verificador de la segona passada) · cada xifra es pinta
 * a la pàgina que la tracta (la seua `pagina` o el seu `panell`): les del
 * tauler, també. Correcció 261004 (verificador de la tercera passada, punt
 * 5) · i els recomptes que la coberta destaca: cada un amb la seua targeta.
 */
export const GRUPS_VISTES = Object.freeze({
  inventari: Object.freeze(['skills', 'skills-sense-avisos', 'skills-amb-avisos', 'skills-orfenes', 'skills-fora-d-algun-cens',
    'skills-sense-disparador']),
  salut: Object.freeze(['avisos', 'avisos-alts', 'metriques-amb-mesura', 'linies-ledger', 'torns-caducats', 'skills-fora-del-segell', 'tasques-del-mapa']),
  explorador: Object.freeze(['nodes', 'arestes', 'enllacos-trencats']),
  fluxos: Object.freeze(['cadenes-declarades', 'suggeriments-de-la-prosa', 'punts-de-trobada', 'llocs-sense-lector']),
  entrades: Object.freeze(['skills', 'skills-opaques', 'rutes-documentals']),
  'agents-atomics': Object.freeze(['agents-atomics']),
  agents: Object.freeze(['peca-fluxos-de-treball', 'peca-tauler', 'peca-agents-sols', 'peca-vigilants']),
  actors: Object.freeze(['agents']),
  candats: Object.freeze(['candats']),
  sol: Object.freeze(['llocs-del-sol']),
  calendari: Object.freeze(['coses-que-corren-soles', ...CADENCIES.map((d) => d.slug)]),
  'sense-llancador': Object.freeze(['tasques-sense-llancador']),
  pols: Object.freeze(['operacions-immunitaries', 'linies-descartades', 'registres-de-consum']),
  carrega: Object.freeze(['artefactes-actius']),
  rebuts: Object.freeze(['rebuts-de-lectura', 'ultim-rebut']),
  'skills-pols': Object.freeze(['skills-del-manifest', 'skills-del-nucli', 'skills-fora-del-manifest', 'skills-sense-disc', 'segell-de-skills'])
});
