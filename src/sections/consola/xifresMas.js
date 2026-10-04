/**
 * xifresMas.js — «El Mas en xifres» i el registre de totes les targetes amb
 * pàgina pròpia de la Consola (/consola/xifres/<slug>).
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · «TOT han de ser
 * targetes pures (UniversalCard). […] Per a tindre pàgina pròpia has de ser
 * una targeta (i viceversa).» Cap xifra solta: cada una és una UniversalCard
 * sencera, amb la boina de Sóc de Poble, títol (la xifra amb el que compta),
 * subtítol, entradeta i peu, i porta a la seua pàgina, on la mateixa xifra
 * s'explica i es desplega la dada viva. Derogat per l'ordre del Mestre del
 * 261004 (xat: cap xifra solta): l'excepció que deixava les xifres de dins
 * dels panells i de les vistes del Mapa en targetes compactes del Panell de
 * Control, sense boina ni pàgina.
 *
 * Ací només hi ha el que no depén de React. El registre té tres famílies:
 *  · les deu xifres del tauler (este fitxer);
 *  · les xifres de dins de les pàgines i del pols (xifresVistes.js);
 *  · les peces del Mapa (i els proveïdors de crèdits del pols) que es pinten
 *    una a una (pecesMapa.js).
 * Totes tenen la mateixa forma (vista) i el mateix detall. Una mesura
 * absent diu «sense mesura», mai 0; el que la font no sap, la pàgina ho diu.
 *
 * Correcció 261004 (verificador de la segona passada, punt 1) · El viceversa
 * és estricte i té una sola font, VISTES_XIFRES: quines targetes pinta cada
 * vista de la Consola. Una xifra té pàgina si i només si alguna vista en
 * pinta la targeta amb les fonts d'ara (xifraDelMas la busca entre totes);
 * qualsevol altre slug és «Xifra no trobada». Sense la seua font, una xifra
 * condicional (`existeix`) o una peça d'una família no es pot saber si
 * existix: ni targeta ni pàgina. Derogat per l'ordre del Mestre del 261004
 * (xat: cap xifra solta): «sense Mapa, una peça porta el nom de la família i
 * la pàgina diu per què no hi ha dada» (qualsevol slug amb el prefix d'una
 * família obria una pàgina sense targeta).
 */
import {
  dataUltimaOperacio, fontLlegible, liniesDescartades, operacionsImmunitaries, paginaConsola, recompteArtefactes,
  registresDelDiari, ultimRebut
} from './consolaPagines.js';
import { dataLocal, resumConsums, resumSkills } from './consolaContent.js';
import { panellPols } from './polsConsola.js';
import { anomaliesDelMas, capesActors, pecesAgents, xifresDelMas } from './mapa/actorsMapa.js';
import { resumCalendari } from './mapa/calendariMapa.js';
import { PROVA_MAPA } from './mapa/construeixMapa.js';
import { fluxosDelMapa } from './mapa/fluxosMapa.js';
import { etiquetaNode, relacionsDe } from './mapa/grafMapa.js';
import { resumInventari } from './mapa/inventariMapa.js';
import { evidenciesDe, resumMapa, textCadencia } from './mapa/mapaContent.js';
import {
  COLUMNES_AVIS, COLUMNES_METRICA, FONT_MAPA, GENERADOR_CONSOLA, GENERADOR_MAPA, RUTA_XIFRES, ambCodi,
  compteOMesura, concorda, de, entradetaPlana, filaMetrica, filesAvisos, mesura, mesurada, mono, perId, plural,
  rutaXifra, senseMesura, text
} from './xifresComu.js';
import { GRUPS_VISTES, XIFRES_VISTES } from './xifresVistes.js';
import { FAMILIES, pecesDeFamilia } from './pecesMapa.js';

export { GENERADOR_CONSOLA, GENERADOR_MAPA, RUTA_XIFRES, rutaXifra };

/* La primera evidència de 'torns-caducats' és el recompte («166 de 189 torns
   caducats sense tancar», o «1 d’1 torn caducat…»: verificador de la tercera
   passada, punt 3); les altres, un torn cada una (construeixMapa.js). */
const RECOMPTE_TORNS = /^\d+ (?:de |d’)\d+ torns? caducats? /;

/**
 * Els codis d'avís de severitat alta que escriu el compilador
 * (construeixMapa.js), amb el nom que en diu l'entradeta de «avisos-alts».
 * Una prova contrasta esta llista amb el compilador: un codi alt nou que no
 * siga ací fa roja la prova, i l'entradeta no pot quedar-se curta.
 */
export const CODIS_ALTS = Object.freeze({
  'script-absent': 'scripts absents',
  'font-absent': 'fonts absents',
  'skill-fantasma': 'skills fantasma',
  'frontmatter-invalid': 'frontmatters invàlids',
  'fora-segell': 'skills fora del segell',
  'segell-divergent': 'skills divergents del segell',
  'segell-trencat': 'el segell trencat',
  'contracte-absent': 'contractes que lligen fitxers absents',
  'fitxer-absent': 'fitxers declarats i absents',
  'tasca-morta': 'tasques mortes',
  'ledger-invalid': 'el LEDGER invàlid'
});
const nomsAlts = Object.values(CODIS_ALTS);
const LLISTA_ALTS = `${nomsAlts.slice(0, -1).join(', ')} i ${nomsAlts.at(-1)}`;

/**
 * Les deu xifres del tauler, en l'ordre de la graella (les cinc d'Emowe i
 * les anomalies). Cada una: slug (el segment de ruta, estable i sense la
 * xifra), la pàgina de la Consola que la tracta (i el filtre, si en porta),
 * el nom per a quan no hi ha Mapa, el títol i el subtítol amb el Mapa,
 * l'entradeta en tres frases (què compta, d'on ix, per què importa; els noms
 * de fitxer entre accents greus), la font, la mètrica del Mapa si en té, i
 * el detall de la seua pàgina.
 */
const XIFRES_MAS = Object.freeze([
  {
    slug: 'skills', origen: 'mapa', pagina: 'inventari', icona: 'puzzle', nom: 'Skills del cens',
    titol: ({ x }) => plural(x.skills, 'skill', 'skills'),
    subtitol: () => 'Al cens del Mapa del Mas',
    entradeta: [
      'Compta les skills del cens del Mapa del Mas: els procediments de `.agents/skills/` que un agent carrega quan la tasca els demana, també els que algú nomena i no són al disc.',
      'Ix dels nodes de tipus skill de `mapa.json`, que compila `tooling/brain/mapa-consola.mjs`.',
      'És la base de totes les altres xifres: el que no és al cens no ho vigila ningú.'
    ],
    font: `${FONT_MAPA} · nodes de tipus skill`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Skills del cens',
        columnes: ['Skill', 'Avisos'],
        files: mapa.nodes.filter((n) => n.tipus === 'skill').sort(perId).map((n) => ({
          clau: n.id, celes: [text(etiquetaNode(n)), text(relacionsDe(mapa, n.id).avisos.length)]
        })),
        buit: 'El Mapa no té cap skill al cens.'
      }]
    })
  },
  {
    // Els arnesos es tracten a Actors («Els que conversen»), i allí es pinta (correcció 261004).
    slug: 'agents', origen: 'mapa', pagina: 'actors', icona: 'bot', nom: 'Agents',
    titol: ({ x }) => plural(x.agents, 'agent', 'agents'),
    subtitol: () => 'Arnesos que conversen amb el Mestre',
    entradeta: [
      'Compta els arnesos d’IA que treballen al Mas i conversen amb el Mestre: els nodes de tipus agent del Mapa.',
      'Ix de `mapa.json`, on `tooling/brain/mapa-consola.mjs` els deriva dels fitxers d’arrencada de cada arnés.',
      'Cada arnés carrega la seua memòria i dispara els seus candats: un que no hi és no està vigilat.'
    ],
    font: `${FONT_MAPA} · nodes de tipus agent`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Arnesos del Mas',
        columnes: ['Agent', 'Arnés', 'Font'],
        files: mapa.nodes.filter((n) => n.tipus === 'agent').sort(perId).map((n) => ({
          clau: n.id, celes: [text(etiquetaNode(n)), text(n.atributs?.arnes ?? '—'), mono(n.font)]
        })),
        buit: 'El Mapa no té cap arnés.'
      }]
    })
  },
  {
    slug: 'skills-opaques', origen: 'mapa', pagina: 'entrades', icona: 'box', nom: 'Skills opaques',
    titol: ({ x }) => plural(x.opaques, 'skill opaca', 'skills opaques'),
    subtitol: () => 'Sense entrades ni eixides declarades',
    entradeta: [
      'Compta les skills que no diuen què lligen ni què escriuen: caixes opaques.',
      'Ix de les relacions «llig» i «escriu» que `mapa.json` té de cada skill.',
      'Una skill opaca no es pot encadenar en cap flux de treball i ningú no sap què toca quan corre.'
    ],
    font: `${FONT_MAPA} · arestes llig i escriu`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Skills opaques',
        columnes: ['Skill', 'Relacions que hi arriben'],
        files: mapa.nodes.filter((n) => n.tipus === 'skill').sort(perId)
          .map((n) => ({ node: n, rel: relacionsDe(mapa, n.id) }))
          .filter(({ rel }) => rel.opaca)
          .map(({ node, rel }) => ({ clau: node.id, celes: [text(etiquetaNode(node)), text(rel.elCriden.length)] })),
        buit: 'Cap skill opaca: totes diuen què lligen o què escriuen.'
      }]
    })
  },
  {
    slug: 'coses-que-corren-soles', origen: 'mapa', pagina: 'calendari', icona: 'timer', nom: 'Coses que corren soles',
    titol: ({ x }) => plural(x.programades, 'cosa que corre sola', 'coses que corren soles'),
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · i les
       mortes, si n'hi ha: la coberta d'Actors les destaca i ara tenen targeta. */
    subtitol: ({ x, capes }) => {
      const mortes = capes.programades.filter((t) => t.estat === 'mort').length;
      return `Tasques que llança launchd · ${plural(x.vives, 'viva', 'vives')}${mortes ? ` · ${plural(mortes, 'morta', 'mortes')}` : ''}`;
    },
    subtitolSenseFont: 'Tasques que llança launchd',
    entradeta: [
      'Compta les tasques que launchd executa soles, sense ningú davant, i quantes continuen vives.',
      'Ix de `mapa.json`, que creua el registre de tasques (`.agents/cron/registre_tasques.json`) amb els llançadors de `~/Library/LaunchAgents`.',
      'Una tasca morta no avisa ningú: sense esta xifra, la vigilància automàtica podria estar parada sense que ningú ho sàpia.'
    ],
    font: `${FONT_MAPA} · tasques`,
    detall: (mapa, { capes }) => ({
      taules: [{
        titol: 'Tasques que llança launchd',
        columnes: ['Tasca', 'Estat', 'Cadència', 'Script'],
        files: capes.programades.map((t) => ({
          clau: t.id, celes: [text(t.id), { estat: t.estat }, text(textCadencia(t.cadencia)), mono(t.script)]
        })),
        buit: 'Cap tasca corre sola.'
      }]
    })
  },
  {
    slug: 'skills-amb-avisos', origen: 'mapa', pagina: 'inventari', consulta: '?filtre=avisos', icona: 'triangleAlert', nom: 'Skills amb avisos',
    titol: ({ x }) => plural(x.ambAvisos, 'skill amb avisos', 'skills amb avisos'),
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · el
       subtítol diu quantes en roig i quantes en ambre: són els estats que la
       coberta de l'Inventari destaca, i ara tenen targeta. */
    subtitol: ({ inv }) => `${inv.roges} en roig · ${inv.ambres} en ambre a l’Inventari`,
    subtitolSenseFont: 'Semàfor ambre o roig a l’Inventari',
    entradeta: [
      'Compta les skills que tenen almenys un avís del Mapa, de qualsevol severitat: les que l’Inventari pinta en ambre o en roig.',
      'Ix dels avisos de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'Cada una és un procediment que, tal com està, pot fallar o no carregar-se quan toca.'
    ],
    font: `${FONT_MAPA} · avisos de les skills`,
    detall: (mapa) => {
      const skills = new Set(mapa.nodes.filter((n) => n.tipus === 'skill').map((n) => n.id));
      return {
        taules: [{
          titol: 'Avisos de les skills',
          columnes: COLUMNES_AVIS,
          files: filesAvisos(mapa.avisos.filter((a) => skills.has(a.node))),
          buit: 'Cap skill té avisos.'
        }]
      };
    }
  },
  {
    slug: 'avisos-alts', origen: 'mapa', pagina: 'salut', icona: 'octagonAlert', nom: 'Avisos alts',
    titol: ({ an }) => plural(an.alts, 'avís alt', 'avisos alts'),
    subtitol: () => 'Severitat alta: cal actuar',
    // Correcció 261004 (verificador, punt 6) · tots els codis d'alta, no només quatre.
    entradeta: [
      `Compta els avisos del Mapa de severitat alta: ${LLISTA_ALTS}.`,
      'Ix dels avisos de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'Són les fallades que trenquen la cadena o la confiança, i es reparen abans que cap altra cosa.'
    ],
    font: `${FONT_MAPA} · avisos de severitat alta`,
    detall: (mapa) => ({
      taules: [{
        titol: 'Avisos alts',
        columnes: COLUMNES_AVIS,
        files: filesAvisos(mapa.avisos.filter((a) => a.severitat === 'alta')),
        buit: 'Cap avís alt.'
      }]
    })
  },
  {
    slug: 'linies-ledger', origen: 'mapa', pagina: 'salut', icona: 'scrollText', nom: 'Línies del LEDGER',
    /* Correcció 261004 (verificador, punt 5) · una mesura absent no es compta
       com a 0: amb les dues, la suma; amb una sola, només eixa, i ho diu. */
    titol: ({ an }) => {
      if (an.fossils === null && an.malFormades === null) return 'LEDGER sense mesura';
      if (an.malFormades === null) return `${plural(an.fossils, 'segell fòssil', 'segells fòssils')} al LEDGER per revisar`;
      if (an.fossils === null) return `${plural(an.malFormades, 'línia mal formada', 'línies mal formades')} al LEDGER per revisar`;
      return plural(an.fossils + an.malFormades, 'línia del LEDGER per revisar', 'línies del LEDGER per revisar');
    },
    // Correcció 261004 (verificador de la segona passada, punt 3) · concorda, i el que no té mesura ho diu.
    subtitol: ({ an }) => (an.fossils === null && an.malFormades === null
      ? 'Segells fòssils i línies mal formades'
      : `${compteOMesura(an.fossils, 'segell fòssil', 'segells fòssils')} · ${compteOMesura(an.malFormades, 'línia mal formada', 'línies mal formades')}`),
    subtitolSenseFont: 'Segells fòssils i línies mal formades',
    entradeta: [
      'Suma els segells fòssils i les línies mal formades del Llibre d’Obra (`.agents/LEDGER.md`).',
      'Ix de les mètriques ledger-fossils i ledger-mal-formades de `mapa.json`, que `tooling/brain/mapa-consola.mjs` compta en llegir el LEDGER.',
      'Un LEDGER amb línies que no quadren no pot acreditar què s’ha fet ni quan, i la seua signatura deixa de valdre.'
    ],
    font: '.agents/LEDGER.md',
    metrica: 'ledger-fossils',
    detall: (mapa, { an }) => ({
      senseMesura: an.fossils === null && an.malFormades === null
        ? 'El Mapa no porta cap recompte del LEDGER (ledger-fossils ni ledger-mal-formades): la closca no l’ha llegit.'
        : null,
      mesura: (an.fossils === null) === (an.malFormades === null) ? null
        : an.fossils === null ? 'Els segells fòssils no tenen mesura: el número només compta les línies mal formades.'
          : 'Les línies mal formades no tenen mesura: el número només compta els segells fòssils.',
      taules: [
        {
          titol: 'Mètriques del LEDGER',
          columnes: COLUMNES_METRICA,
          files: ['ledger-fossils', 'ledger-mal-formades', 'integritat-ledger', 'recaigudes-ledger']
            .map((nom) => mesura(mapa, nom)).filter(Boolean).map(filaMetrica),
          buit: 'El Mapa no porta cap mètrica del LEDGER.'
        },
        {
          titol: 'Avisos del LEDGER',
          columnes: COLUMNES_AVIS,
          files: filesAvisos(ambCodi(mapa, 'ledger-invalid')),
          buit: 'Cap avís de signatura: el LEDGER no consta com a invàlid.'
        }
      ],
      nota: 'Quines línies són, una a una, encara no ho diu el Mapa: la closca les compta però no en guarda els números.'
    })
  },
  {
    slug: 'torns-caducats', origen: 'mapa', pagina: 'salut', icona: 'timerOff', nom: 'Torns caducats',
    titol: ({ an }) => senseMesura(an.tornsCaducats, 'torn caducat', 'torns caducats', 'Torns sense mesura'),
    subtitol: () => 'Oberts i sense tancar',
    entradeta: [
      'Compta els torns de treball que es van obrir i han caducat sense tancar-se: la caducitat ja ha passat o no es pot llegir.',
      'Ix de la mètrica torns-caducats-oberts de `mapa.json`, que `tooling/brain/mapa-consola.mjs` calcula amb els torns de `.agents/runtime/turns/`.',
      'Un torn que no es tanca deixa canvis sense rebut ni relleu, i cap altre agent sap si la faena es va acabar.'
    ],
    font: '.agents/runtime/turns',
    metrica: 'torns-caducats-oberts',
    detall: (mapa, { an }) => {
      const m = mesura(mapa, 'torns-caducats-oberts');
      const torns = ambCodi(mapa, 'torns-caducats').flatMap(evidenciesDe).filter((e) => !RECOMPTE_TORNS.test(e));
      return {
        senseMesura: an.tornsCaducats === null
          ? 'El Mapa no porta la mètrica torns-caducats-oberts: la closca no ha llegit cap torn de .agents/runtime/turns.'
          : null,
        // Correcció 261004 (verificador, punt 7) · el denominador és el total de torns, no els oberts.
        mesura: mesurada(m)
          ? `${plural(m.numerador, 'torn obert i caducat', 'torns oberts i caducats')} d’un total ${de(m.denominador, plural(m.denominador, 'torn', 'torns'))}`
          : null,
        taules: [{
          titol: 'Torns caducats, un a un',
          columnes: ['Torn · actor · estat · caducitat'],
          files: torns.map((e, i) => ({ clau: `${i}-${e}`, celes: [mono(e)] })),
          buit: 'Cap torn caducat.'
        }]
      };
    }
  },
  {
    slug: 'skills-fora-del-segell', origen: 'mapa', pagina: 'salut', icona: 'shieldAlert', nom: 'Skills fora del segell',
    titol: ({ an }) => senseMesura(an.foraDelSegell, 'skill fora del segell', 'skills fora del segell', 'Segell sense mesura'),
    subtitol: () => 'O divergents (només els SKILL.md)',
    entradeta: [
      'Compta els `SKILL.md` que no són al segell de skills o que han canviat des de l’últim segellat.',
      'Ix de la mètrica segell-skills-coherent de `mapa.json`, que compara l’empremta de cada `SKILL.md` del disc amb `.agents/SKILLS_SEAL.json`; només jutja els `SKILL.md`, no el segell sencer.',
      'Una skill fora del segell té un contingut que ningú no ha acreditat.'
    ],
    font: '.agents/SKILLS_SEAL.json (només SKILL.md) · disc',
    metrica: 'segell-skills-coherent',
    detall: (mapa, { an }) => {
      const m = mesura(mapa, 'segell-skills-coherent');
      return {
        senseMesura: an.foraDelSegell === null
          ? 'El Mapa no porta la mètrica segell-skills-coherent: la closca no ha pogut comparar el disc amb el segell.'
          : null,
        /* Correcció 261004 (verificador de la tercera passada, punts 2 i 3) ·
           concorda amb el que compta i apostrofa: derogat «1 de 30 SKILL.md fora
           del segell o divergents». */
        mesura: mesurada(m)
          ? `${plural(m.denominador - m.numerador, 'SKILL.md fora del segell o divergent', 'SKILL.md fora del segell o divergents')} d’un total ${de(m.denominador, `${m.denominador} SKILL.md`)}`
          : null,
        /* Correcció 261004 (verificador, punt 8) · la taula de la xifra només
           porta skills (el títol en compta les files); el segell trencat
           penja del segell, no de cap skill, i va a part. */
        taules: [
          {
            titol: 'Skills fora del segell o divergents',
            columnes: COLUMNES_AVIS,
            files: filesAvisos(ambCodi(mapa, 'fora-segell', 'segell-divergent')),
            buit: 'Cap skill fora del segell.'
          },
          {
            titol: 'Estat del segell sencer',
            columnes: COLUMNES_AVIS,
            files: filesAvisos(ambCodi(mapa, 'segell-trencat')),
            buit: 'El segell no consta com a trencat.'
          }
        ]
      };
    }
  },
  {
    slug: 'skills-orfenes', origen: 'mapa', pagina: 'inventari', consulta: '?filtre=orfes', icona: 'unlink', nom: 'Skills òrfenes',
    titol: ({ an }) => plural(an.orfes, 'skill òrfena', 'skills òrfenes'),
    // Correcció 261004 (verificador de la tercera passada, punt 2) · «1 skill fantasma: nomenada…».
    subtitol: ({ an }) => `${plural(an.fantasmes, 'skill fantasma', 'skills fantasma')}: ${concorda(an.fantasmes, 'nomenada', 'nomenades')} i sense carpeta al disc`,
    subtitolSenseFont: 'I les fantasmes: nomenades i sense carpeta al disc',
    entradeta: [
      'Compta les skills a les quals no arriba cap relació declarada o derivada (òrfenes: ningú no les crida ni les carrega) i, a part, les que algú nomena però no tenen carpeta al disc (fantasmes).',
      'Ix dels avisos orfe i skill-fantasma de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'Una òrfena no s’executarà mai, i una fantasma fa fallar qui la crida.'
    ],
    font: `${FONT_MAPA} · avisos orfe i skill-fantasma`,
    detall: (mapa) => ({
      taules: [
        { titol: 'Skills òrfenes', columnes: COLUMNES_AVIS, files: filesAvisos(ambCodi(mapa, 'orfe')), buit: 'Cap skill òrfena.' },
        { titol: 'Skills fantasma', columnes: COLUMNES_AVIS, files: filesAvisos(ambCodi(mapa, 'skill-fantasma')), buit: 'Cap skill fantasma.' }
      ]
    })
  }
]);

/** Els slugs de les deu xifres del tauler, en l'ordre de la graella. */
export const SLUGS_XIFRES = Object.freeze(XIFRES_MAS.map((x) => x.slug));

/* Totes les xifres de slug fix: les del tauler i les de dins de les pàgines. */
const FIXES = new Map([...XIFRES_MAS, ...XIFRES_VISTES].map((def) => [def.slug, def]));
/** Els slugs de totes les xifres de slug fix (les peces del Mapa en tenen de derivats). */
export const SLUGS_FIXOS = Object.freeze([...FIXES.keys()]);
/** Quines xifres pinta cada graella: el tauler i cada pàgina o panell. */
export const GRUPS_XIFRES = Object.freeze({ mas: SLUGS_XIFRES, ...GRUPS_VISTES });
/** Els ids de les famílies de peces (del Mapa i dels crèdits del pols). */
export const IDS_FAMILIES = Object.freeze(FAMILIES.map((f) => f.id));

/**
 * La font única del viceversa (correcció 261004, verificador de la segona
 * passada, punt 1): quines targetes pinta cada vista de la Consola, en
 * l'ordre de la pàgina. Una vista és el tauler, una pàgina (/consola/<id>)
 * o un panell del pols (/consola/pols/<id>); cada tros és un grup de xifres
 * de slug fix (GRUPS_XIFRES) o una família de peces (FAMILIES). Les vistes
 * pinten exactament açò (ConsolaSection.viceversa.test.jsx ho comprova al
 * DOM), i una xifra té pàgina si i només si alguna vista la pinta.
 */
const deGrup = (id) => Object.freeze({ grup: id });
const deFamilia = (id) => Object.freeze({ familia: id });
/* Correcció 261004 (verificador de la tercera passada, punt 5) · Els
   recomptes que la coberta destacava sense targeta (els agents atòmics, els
   candats, els llocs del sòl i els proveïdors de crèdits) en tenen una,
   davant de les peces de la seua família. */
export const VISTES_XIFRES = Object.freeze({
  tauler: Object.freeze([deGrup('mas')]),
  pols: Object.freeze([deGrup('pols')]),
  'pols/carrega': Object.freeze([deGrup('carrega')]),
  'pols/consums': Object.freeze([deGrup('consums')]),
  'pols/credits': Object.freeze([deGrup('credits-pols'), deFamilia('credit')]),
  'pols/rebuts': Object.freeze([deGrup('rebuts')]),
  'pols/skills': Object.freeze([deGrup('skills-pols')]),
  explorador: Object.freeze([deGrup('explorador')]),
  fluxos: Object.freeze([deGrup('fluxos')]),
  calendari: Object.freeze([deGrup('calendari')]),
  inventari: Object.freeze([deGrup('inventari')]),
  entrades: Object.freeze([deGrup('entrades')]),
  agents: Object.freeze([deGrup('agents-atomics'), deFamilia('agent-atomic'), deGrup('agents')]),
  actors: Object.freeze([deGrup('actors'), deFamilia('arnes'), deFamilia('carregador'), deGrup('candats'), deFamilia('candat'),
    deFamilia('tasca'), deGrup('sense-llancador'), deGrup('sol'), deFamilia('lloc')]),
  salut: Object.freeze([deGrup('salut')])
});
/** Els ids de les vistes, en l'ordre del registre. */
export const IDS_VISTES = Object.freeze(Object.keys(VISTES_XIFRES));

/**
 * La xifra que compta el que diu cada codi de vigilància (CODIS_VIGILANCIA,
 * consolaPagines.js): l'alerta del tauler hi enllaça (correcció 261004,
 * verificador de la segona passada, punt 2).
 */
export const XIFRA_DE_CODI = Object.freeze({
  'segell-trencat': 'skills-fora-del-segell',
  'ledger-invalid': 'linies-ledger'
});

/**
 * El slug d'una xifra a partir del comodí de la ruta (/consola/*):
 * 'xifres/torns-caducats' (o amb barres a les vores) → 'torns-caducats'. Un
 * slug que no existix també es torna: la seua pàgina diu que no existix.
 * Qualsevol altra forma (el tauler, una pàgina, 'xifres' sol), null.
 */
export function segmentXifra(comodi) {
  const net = String(comodi ?? '').replace(/^\/+|\/+$/g, '');
  const trobat = /^xifres\/([^/]+)$/.exec(net);
  return trobat ? trobat[1] : null;
}

/* ── Les mesures, una sola vegada per font ───────────────────────────────
   Cada mesura es calcula la primera vegada que una xifra la demana (els
   fluxos i les capes dels actors recorren el graf), i es guarda per a la
   resta de xifres del mateix Mapa. */
const memoria = new WeakMap();
function peresos(calculs) {
  const m = {};
  for (const [clau, calcula] of Object.entries(calculs)) {
    let fet = false;
    let valor;
    Object.defineProperty(m, clau, {
      enumerable: true,
      get: () => {
        if (!fet) { valor = calcula(); fet = true; }
        return valor;
      }
    });
  }
  return m;
}

function mesuresDelMapa(mapa) {
  if (!mapa) return null;
  if (!memoria.has(mapa)) {
    memoria.set(mapa, peresos({
      mapa: () => mapa,
      x: () => xifresDelMas(mapa),
      an: () => anomaliesDelMas(mapa),
      inv: () => resumInventari(mapa),
      resum: () => resumMapa(mapa),
      fl: () => fluxosDelMapa(mapa),
      peces: () => pecesAgents(mapa),
      capes: () => capesActors(mapa),
      cad: () => resumCalendari(mapa.tasques)
    }));
  }
  return memoria.get(mapa);
}

function mesuresDeConsola(dades, locale = 'ca-ES') {
  if (!dades) return null;
  return peresos({
    n: () => (x) => Number(x).toLocaleString(locale),
    data: () => (iso) => dataLocal(iso, locale),
    // Un sol rellotge per a totes les xifres d'una mateixa lectura (l'últim rebut).
    ara: () => Date.now(),
    /* Correcció 261004 (verificador de la tercera passada, punt 4) · Sense el
       diari de sessió (fonts.diari.estat 'absent'), els registres i els rebuts
       no tenen mesura: null, mai 0. Sense el journal, les operacions tampoc. */
    diari: () => fontLlegible(dades, 'diari'),
    consums: () => ({ ...resumConsums(dades.consums), registres: registresDelDiari(dades, 'consums') }),
    skills: () => ({ ...resumSkills(dades.skills), totes: dades.skills }),
    rebuts: () => dades.rebuts ?? [],
    ultim: () => ultimRebut(dades.rebuts),
    recompte: () => recompteArtefactes(dades),
    desc: () => liniesDescartades(dades),
    imm: () => ({
      operacions: operacionsImmunitaries(dades),
      ultima: dataUltimaOperacio(dades),
      op: dades.immunitari?.ultima ?? null
    }),
    segell: () => dades.segell ?? null,
    credits: () => dades.credits ?? []
  });
}

const mesuresDe = (origen, mapa, dades, locale) => (origen === 'consola' ? mesuresDeConsola(dades, locale) : mesuresDelMapa(mapa));

/* On es tracta: la pàgina de la Consola (amb el filtre, si en porta) o el panell del pols. */
function tractaDe({ pagina, panell, consulta = '' }) {
  if (panell) {
    const p = panellPols(panell);
    return { ruta: p.ruta, titol: p.titol };
  }
  const p = paginaConsola(pagina);
  return { ruta: `${p.ruta}${consulta}`, titol: p.title };
}

/* El que es comparteix entre la targeta i la pàgina de qualsevol xifra o peça. */
const comu = (def, slug, origen) => {
  const marcada = def.entradeta.join(' ');
  return {
    slug,
    ruta: rutaXifra(slug),
    origen,
    icona: def.icona,
    pagina: def.pagina,
    panell: def.panell ?? null,
    consulta: def.consulta ?? '',
    tracta: tractaDe(def),
    font: def.font,
    metrica: def.metrica ?? null,
    entradeta: entradetaPlana(marcada),
    entradetaMarcada: marcada,
    // Cap xifra no porta imatge encara: la targeta pinta la seua icona.
    imatge: def.imatge ?? null,
    imatgeAlt: def.imatgeAlt ?? ''
  };
};

/** Una xifra de slug fix amb les seues mesures (o, sense font, amb el seu nom). */
function vista(def, m) {
  const base = comu(def, def.slug, def.origen);
  if (!m) {
    return { ...base, titol: def.nom, subtitol: def.subtitolSenseFont ?? def.subtitol({}), titolPrivat: null, subtitolPrivat: null, etiquetes: null };
  }
  return {
    ...base,
    titol: def.titol(m),
    subtitol: def.subtitol(m),
    titolPrivat: def.titolPrivat?.(m) ?? null,
    subtitolPrivat: def.subtitolPrivat?.(m) ?? null,
    etiquetes: def.etiquetes?.(m) ?? null
  };
}

/** Una peça (pecesMapa.js) amb la forma de qualsevol xifra. */
const vistaPeca = (familia, el) => ({
  ...comu(familia, el.slug, familia.origen ?? 'mapa'),
  icona: el.icona ?? familia.icona,
  titol: el.titol,
  subtitol: el.subtitol,
  titolPrivat: el.titolPrivat ?? null,
  subtitolPrivat: el.subtitolPrivat ?? null,
  etiquetes: el.etiquetes ?? null
});

const deConsola = (def) => def.origen === 'consola';
const familiaDe = (slug) => FAMILIES.find((f) => slug.startsWith(f.prefix)) ?? null;
/* Les peces d'una família amb la seua font d'ara; sense font, cap: no es pot
   saber quines n'hi ha. */
function pecesDe(familia, mapa, dades) {
  if (deConsola(familia)) return dades ? pecesDeFamilia(familia, dades, null) : [];
  return mapa ? pecesDeFamilia(familia, mapa, mesuresDelMapa(mapa).capes) : [];
}

/* Una xifra de slug fix amb les fonts d'ara. Sense font, la que es pinta
   sempre porta el seu nom; la condicional (`existeix`) no es pot saber si
   existix i no es pinta. */
function xifraFixa(slug, mapa, dades, locale) {
  const def = FIXES.get(slug);
  if (!def) return null;
  const m = mesuresDe(def.origen, mapa, dades, locale);
  if (def.existeix && (!m || !def.existeix(m))) return null;
  return vista(def, m);
}

/** Les deu xifres del tauler: amb el Mapa d'avui o, sense, amb el seu nom. */
export function xifresDeLaGraella(mapa = null) {
  return xifresDeGrup('mas', mapa);
}

/**
 * Les xifres d'una graella (GRUPS_XIFRES: 'mas', una pàgina, un tros d'una
 * pàgina o un panell del pols), en ordre. Una xifra condicional que no es
 * pinta amb la font d'ara, o sense la seua font, no hi és. Sense font, el nom
 * de cada xifra.
 */
export function xifresDeGrup(grup, mapa = null, dades = null, locale = 'ca-ES') {
  return (GRUPS_XIFRES[grup] ?? []).map((slug) => xifraFixa(slug, mapa, dades, locale)).filter(Boolean);
}

/**
 * Les peces d'una família ('arnes', 'candat', 'credit'…), en ordre, amb la
 * seua font: el Mapa o, per als crèdits, consola.json. Sense font, cap.
 */
export function xifresDeFamilia(id, mapa = null, dades = null) {
  const fam = FAMILIES.find((f) => f.id === id);
  if (!fam) return [];
  return pecesDe(fam, mapa, dades).map((el) => vistaPeca(fam, el));
}

/** Les targetes que pinta una vista (VISTES_XIFRES), en l'ordre de la pàgina. */
export function xifresDeVista(vista, mapa = null, dades = null, locale = 'ca-ES') {
  return (VISTES_XIFRES[vista] ?? []).flatMap((tros) => (tros.grup
    ? xifresDeGrup(tros.grup, mapa, dades, locale)
    : xifresDeFamilia(tros.familia, mapa, dades)));
}

/** La vista que tracta una xifra, on es pinta i on porta «On es tracta»: el seu panell del pols o la seua pàgina. */
export const vistaDe = (xifra) => (xifra.panell ? `pols/${xifra.panell}` : xifra.pagina);

/**
 * Totes les targetes de la Consola amb les fonts d'ara, pel seu slug: el
 * conjunt exacte de les pàgines que existixen. Una xifra que es pinta en
 * més d'una vista (les del tauler) hi és una sola vegada.
 */
export function targetesDeLaConsola(mapa = null, dades = null, locale = 'ca-ES') {
  const totes = new Map();
  for (const vista of IDS_VISTES) {
    for (const x of xifresDeVista(vista, mapa, dades, locale)) if (!totes.has(x.slug)) totes.set(x.slug, x);
  }
  return totes;
}

/**
 * Una xifra o una peça pel seu slug: el que en pinta la targeta i la seua
 * pàgina. Només si alguna vista de la Consola en pinta la targeta amb les
 * fonts d'ara (cap pàgina sense targeta, i viceversa); si no, null i la
 * pàgina diu «Xifra no trobada». Sense font, les xifres que es pinten sempre
 * porten el seu nom i els textos fixos (cap xifra inventada).
 */
export function xifraDelMas(slug, mapa = null, dades = null, locale = 'ca-ES') {
  return targetesDeLaConsola(mapa, dades, locale).get(String(slug ?? '')) ?? null;
}

/**
 * El detall que desplega la pàgina d'una xifra o d'una peça: { senseMesura,
 * mesura, taules: [{ titol, columnes, files: [{ clau, celes }], buit }], nota,
 * font, prova, generador }. Sense la seua font, o per a un slug sense pàgina,
 * null.
 */
export function detallXifra(slug, mapa = null, dades = null, locale = 'ca-ES') {
  if (!xifraDelMas(slug, mapa, dades, locale)) return null;
  const def = FIXES.get(slug);
  if (def) {
    const font = deConsola(def) ? dades : mapa;
    if (!font) return null;
    const m = mesuresDe(def.origen, mapa, dades, locale);
    const detall = def.detall(font, m);
    const metrica = !deConsola(def) && def.metrica ? mesura(mapa, def.metrica) : null;
    return {
      senseMesura: detall.senseMesura ?? null,
      mesura: detall.mesura ?? null,
      taules: detall.taules,
      nota: detall.nota ?? null,
      // La font i la prova de la mètrica que la mesura, si en té; si no, la de la xifra.
      font: metrica?.font || def.font,
      prova: deConsola(def) ? null : (metrica?.prova || PROVA_MAPA),
      generador: deConsola(def) ? GENERADOR_CONSOLA : GENERADOR_MAPA
    };
  }
  const fam = familiaDe(String(slug));
  const el = pecesDe(fam, mapa, dades).find((p) => p.slug === slug);
  return {
    senseMesura: null, mesura: null, taules: el.detall().taules, nota: null,
    font: fam.font,
    prova: deConsola(fam) ? null : PROVA_MAPA,
    generador: deConsola(fam) ? GENERADOR_CONSOLA : GENERADOR_MAPA
  };
}
