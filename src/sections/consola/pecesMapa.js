/**
 * pecesMapa.js — les peces del Mapa que la Consola pinta una a una (els
 * arnesos, els carregadors, els candats, les tasques, els llocs del sòl i
 * els agents atòmics), sense React.
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada peça que una pàgina
 * de la Consola pinta en targeta és una UniversalCard sencera, amb la boina
 * de Sóc de Poble, i porta a la seua pàgina pròpia, /consola/xifres/<slug>.
 * Una família diu com es diuen les seues peces (prefix del slug, nom, la
 * pàgina de la Consola que les tracta i l'entradeta, en tres frases, amb els
 * noms de fitxer entre accents greus) i quines n'hi ha al Mapa d'avui. El
 * slug ix de l'identificador de la peça (normalitzaSlug): és estable mentre
 * la peça no canvie de nom. Una peça que el Mapa no porta no té targeta, i
 * la seua adreça diu que no existix.
 *
 * Correcció 261004 (verificador de la segona passada) · `origen` diu de quina
 * font viu la família: el Mapa (per defecte) o consola.json. Sense la seua
 * font no es pot saber quines peces hi ha: cap targeta i cap pàgina.
 * `pagina` (i `panell`) és on es pinten de veres: les tasques i els llocs
 * del sòl, a Actors.
 */
import { etiquetaNode } from './mapa/grafMapa.js';
import { agentsAtomics } from './mapa/actorsMapa.js';
import { quanDe } from './mapa/calendariMapa.js';
import { camiDe, esSenseLector } from './mapa/fluxosMapa.js';
import { textCadencia, textLlancador } from './mapa/mapaContent.js';
import {
  FONT_MAPA, concorda, darrer, etiquetaDEstat, mono, normalitzaSlug, plural, taulaAvisosDe, taulaDades,
  text
} from './xifresComu.js';
import { problemesDAvisos } from './problemesConsola.js';

/* Correcció de l'Onada 6 (revisió adversarial: requisit 9, «cada targeta») ·
   Cada peça diu a la vista els avisos que el Mapa en fa, el més greu primer i
   amb la marca de la seua severitat: els mateixos de la taula «Avisos de la
   peça» de la seua pàgina. */
const problemesDe = (mapa, id) => problemesDAvisos(mapa.avisos.filter((a) => a.node === id));

const cosDe = (id) => {
  const tall = String(id).indexOf(':');
  return tall >= 0 ? String(id).slice(tall + 1) : String(id);
};
const noms = (nodes) => nodes.map((n) => n.atributs?.arnes ?? etiquetaNode(n)).join(', ');
const peca = (id) => ({ node: id });

/* ── Els estats, amb els colors del semàfor ──────────────────────────────
   Onada 6 (requisit 8) · VIU i ACTIU, verd; MORT i SENSE CONSUMIDOR, roig;
   la resta (SENSE LLANÇADOR, PARCIAL, DESCONEGUT…), taronja: semafor.js ·
   COLOR_D_ESTAT, l'única taula. Derogat per l'Onada 6: les classes del Panell
   de Control (ACTIU en blau i MORT en el mateix to pàl·lid que DESCONEGUT). */

export const ESTAT_TASCA = Object.freeze({
  viu: etiquetaDEstat('VIU'),
  mort: etiquetaDEstat('MORT'),
  'declarat-sense-llancador': etiquetaDEstat('SENSE LLANÇADOR'),
  'llancador-sense-declaracio': etiquetaDEstat('SENSE DECLARACIÓ'),
  desconegut: etiquetaDEstat('DESCONEGUT')
});

/** El text de l'estat d'un arnés: ACTIU, PARCIAL, DESCONEGUT, SENSE CONSUMIDOR o SENSE CANDATS. */
export function textEstatArnes(a) {
  if (!a.candats) return 'SENSE CANDATS';
  if (a.acreditats === a.candats) return 'ACTIU';
  if (a.acreditats) return 'PARCIAL';
  // T10 (ordre del Mestre, 260930): candats per acreditar, com els de Codex.
  return a.desconeguts === a.candats ? 'DESCONEGUT' : 'SENSE CONSUMIDOR';
}

export const estatArnes = (a) => etiquetaDEstat(textEstatArnes(a));

/** El text de l'estat d'un candat: ACTIU, SENSE CONSUMIDOR o DESCONEGUT. */
export function textEstatCandat(c) {
  if (c.acreditat === true) return 'ACTIU';
  return c.acreditat === false ? 'SENSE CONSUMIDOR' : 'DESCONEGUT';
}

export const estatCandat = (c) => etiquetaDEstat(textEstatCandat(c));

/** La icona d'un candat: acreditat, desmentit, de git o per acreditar. */
export const iconaCandat = (c) => (c.acreditat === true ? 'lock' : c.acreditat === false ? 'lockOpen' : c.arnes === 'git' ? 'gitBranch' : 'circleDashed');

const textAcreditat = (v) => (v === true ? 'sí' : v === false ? 'no' : 'desconegut');

function arrencada({ documents, skills }) {
  if (!documents.length && !skills.length) return 'no declara què carrega en arrencar';
  return `en arrencar carrega ${plural(documents.length, 'document', 'documents')} i ${plural(skills.length, 'skill', 'skills')}`;
}

/* Els candats que dispara un arnés i els scripts que dispara cada candat. */
function candatsDe(mapa, id) {
  const perId = new Map(mapa.nodes.map((n) => [n.id, n]));
  const dispara = (de) => mapa.arestes.filter((a) => a.de === de && a.tipus === 'dispara').map((a) => perId.get(a.a)).filter(Boolean);
  return dispara(id).filter((h) => h.tipus === 'hook').map((h) => ({
    id: h.id,
    esdeveniment: h.atributs?.esdeveniment ?? etiquetaNode(h),
    acreditat: typeof h.atributs?.consumidor_acreditat === 'boolean' ? h.atributs.consumidor_acreditat : null,
    scripts: dispara(h.id).filter((s) => s.tipus === 'script').map(camiDe).sort()
  }));
}

/* ── Les famílies ─────────────────────────────────────────────────────
   `elements(mapa, capes)` torna les peces del Mapa d'avui, en l'ordre de la
   seua pàgina: { clau (l'id que fa el slug), titol, subtitol, titolPrivat?,
   subtitolPrivat?, etiquetes?, icona?, detall(mapa) }. `titolPrivat` i
   `subtitolPrivat` són el que es diu amb el mode privacitat quan el títol o
   el subtítol porten una ruta. */
export const FAMILIES = Object.freeze([
  {
    id: 'arnes', prefix: 'arnes-', pagina: 'actors', icona: 'bot', nom: 'Arnés del Mas',
    subtitolSenseFont: 'Candats i memòria d’arrencada',
    entradeta: [
      'Un arnés és l’eina amb què el Mestre parla amb un agent: dispara els seus candats (hooks) i carrega la memòria d’arrencada.',
      'Ix dels nodes de tipus agent de `mapa.json`, que `tooling/brain/mapa-consola.mjs` deriva dels fitxers d’arrencada de cada arnés.',
      'Un arnés amb candats sense consumidor acreditat treballa sense una vigilància demostrada.'
    ],
    font: `${FONT_MAPA} · nodes de tipus agent`,
    elements: (mapa, capes) => capes.arnesos.map((a) => ({
      clau: a.node.id,
      titol: a.nom,
      subtitol: `${plural(a.candats, 'candat', 'candats')} · ${arrencada(a.arrencada)}`,
      etiquetes: estatArnes(a),
      problemes: problemesDe(mapa, a.node.id),
      detall: () => ({
        taules: [
          {
            titol: 'Candats que dispara',
            columnes: ['Esdeveniment', 'Consumidor acreditat', 'Scripts'],
            files: candatsDe(mapa, a.node.id).map((c) => ({
              clau: c.id, celes: [text(c.esdeveniment), text(textAcreditat(c.acreditat)), mono(c.scripts.join(', '))]
            })),
            buit: 'No dispara cap candat.'
          },
          {
            titol: 'Memòria d’arrencada',
            columnes: ['Peça', 'Tipus'],
            files: [...a.arrencada.documents, ...a.arrencada.skills].map((n) => ({ clau: n.id, celes: [peca(n.id), text(n.tipus)] })),
            buit: 'No declara què carrega en arrencar.'
          },
          taulaAvisosDe(mapa, a.node.id)
        ]
      })
    }))
  },
  {
    id: 'carregador', prefix: 'carregador-', pagina: 'actors', icona: 'fileStack', nom: 'Carregador d’arrencada',
    subtitolSenseFont: 'Què carrega i qui el carrega',
    entradeta: [
      'Un carregador és un document o un script que, en arrencar, fa carregar altres peces a l’agent: documents i skills.',
      'Ix de les relacions «carrega» de `mapa.json`, que escriu `tooling/brain/mapa-consola.mjs`.',
      'Un carregador que cap arnés no declara carregar només compta si algú el llig a mà.'
    ],
    font: `${FONT_MAPA} · arestes carrega`,
    elements: (mapa, capes) => capes.carregadors.map((c) => {
      const docs = c.carrega.filter((n) => n.tipus === 'document').length;
      const skills = c.carrega.filter((n) => n.tipus === 'skill').length;
      return {
        clau: c.node.id,
        titol: etiquetaNode(c.node),
        titolPrivat: 'Carregador d’arrencada',
        subtitol: `carrega ${plural(docs, 'document', 'documents')} i ${plural(skills, 'skill', 'skills')} · ${c.perQui.length ? `el carrega ${noms(c.perQui)}` : 'cap arnés declara que el carrega'}`,
        problemes: problemesDe(mapa, c.node.id),
        detall: () => ({
          taules: [
            taulaDades('El carregador', [['Ruta', mono(camiDe(c.node))]]),
            {
              titol: 'Què carrega',
              columnes: ['Peça', 'Tipus'],
              files: c.carrega.map((n) => ({ clau: n.id, celes: [peca(n.id), text(n.tipus)] })),
              buit: 'No carrega cap peça.'
            },
            {
              titol: 'Qui el carrega',
              columnes: ['Arnés'],
              files: c.perQui.map((n) => ({ clau: n.id, celes: [text(n.atributs?.arnes ?? etiquetaNode(n))] })),
              buit: 'Cap arnés declara que el carrega.'
            },
            taulaAvisosDe(mapa, c.node.id)
          ]
        })
      };
    })
  },
  {
    id: 'candat', prefix: 'candat-', pagina: 'actors', icona: 'circleDashed', nom: 'Candat',
    subtitolSenseFont: 'Arnés i scripts que dispara',
    entradeta: [
      'Un candat (hook) és una ordre que l’arnés executa sola abans o després de cada eina de l’agent.',
      'Ix dels nodes de tipus hook de `mapa.json` i dels hooks de git del registre `.agents/cron/registre_tasques.json`.',
      'Un candat sense consumidor acreditat és una promesa: està declarat, però ningú no demostra que salte.'
    ],
    font: `${FONT_MAPA} · nodes de tipus hook`,
    elements: (mapa, capes) => capes.candats.map((c) => ({
      clau: c.id,
      icona: iconaCandat(c),
      titol: c.esdeveniment,
      subtitol: c.scripts.length ? `${c.arnes} · dispara ${c.scripts.map(darrer).join(', ')}` : `${c.arnes} · sense script declarat`,
      subtitolPrivat: c.scripts.length ? `${c.arnes} · dispara ${plural(c.scripts.length, 'script', 'scripts')}` : null,
      etiquetes: estatCandat(c),
      problemes: problemesDe(mapa, c.id),
      detall: () => ({
        taules: [
          taulaDades('El candat', [
            ['Arnés', text(c.arnes)],
            ['Esdeveniment', text(c.esdeveniment)],
            ['Consumidor acreditat', text(textAcreditat(c.acreditat))],
            ['Scripts que dispara', mono(c.scripts.join(', '))],
            ['Tasques del registre', text(c.tasques.join(' · ') || '—')]
          ]),
          taulaAvisosDe(mapa, c.id)
        ]
      })
    }))
  },
  {
    id: 'tasca', prefix: 'tasca-', pagina: 'actors', icona: 'timer', nom: 'Tasca que corre sola',
    subtitolSenseFont: 'Quan corre i què executa',
    entradeta: [
      'Una tasca programada és una faena que launchd llança sola, sense ningú davant.',
      'Ix de `mapa.json`, que creua el registre `.agents/cron/registre_tasques.json` amb els llançadors de `~/Library/LaunchAgents`.',
      'Si està morta, la vigilància que fa no avisa ningú.'
    ],
    font: `${FONT_MAPA} · tasques`,
    elements: (mapa, capes) => capes.programades.map((t) => ({
      clau: t.id,
      titol: t.id,
      subtitol: t.script ? `${quanDe(t)} · ${darrer(t.script)}` : quanDe(t),
      subtitolPrivat: t.script ? quanDe(t) : null,
      etiquetes: ESTAT_TASCA[t.estat],
      problemes: problemesDe(mapa, `tasca:${t.id}`),
      detall: () => ({
        taules: [
          taulaDades('La tasca', [
            ['Estat', { estat: t.estat }],
            ['Quan', text(quanDe(t))],
            ['Cadència', text(textCadencia(t.cadencia))],
            ['Llançador', text(textLlancador(t.llancador))],
            ['Script', mono(t.script)],
            ['Font', mono(t.font)]
          ]),
          taulaAvisosDe(mapa, `tasca:${t.id}`)
        ]
      })
    }))
  },
  {
    id: 'lloc', prefix: 'lloc-', pagina: 'actors', icona: 'folderOpen', nom: 'Lloc del sòl',
    subtitolSenseFont: 'Qui hi escriu i qui el llig',
    entradeta: [
      'Un lloc del sòl és un document o una carpeta on les peces deixen la faena o la lligen.',
      'Ix de les relacions «escriu» i «llig» declarades o derivades de `mapa.json`.',
      'Un lloc on algú escriu i ningú no llig és una cadena a mitges.'
    ],
    font: `${FONT_MAPA} · arestes escriu i llig`,
    elements: (mapa, capes) => capes.sol.map((p) => ({
      clau: p.node.id,
      titol: etiquetaNode(p.node),
      titolPrivat: 'Lloc del sòl',
      subtitol: `hi ${concorda(p.escriuen.length, 'escriu', 'escriuen')} ${p.escriuen.length} · el ${concorda(p.lligen.length, 'llig', 'lligen')} ${p.lligen.length}`,
      etiquetes: esSenseLector(p) ? etiquetaDEstat('SENSE LECTOR') : null,
      problemes: problemesDe(mapa, p.node.id),
      detall: () => ({
        taules: [
          taulaDades('El lloc', [['Ruta', mono(camiDe(p.node))]]),
          { titol: 'Hi escriuen', columnes: ['Peça'], files: p.escriuen.map((id) => ({ clau: id, celes: [peca(id)] })), buit: 'Ningú no hi escriu.' },
          { titol: 'El lligen', columnes: ['Peça'], files: p.lligen.map((id) => ({ clau: id, celes: [peca(id)] })), buit: 'Ningú no declara que el llig.' },
          taulaAvisosDe(mapa, p.node.id)
        ]
      })
    }))
  },
  {
    id: 'agent-atomic', prefix: 'agent-atomic-', pagina: 'agents', icona: 'bot', nom: 'Agent atòmic',
    subtitolSenseFont: 'Què llig i què deixa',
    entradeta: [
      'Un agent atòmic és un perfil amb contracte: diu què llig, què deixa i a qui servix.',
      'Ix de les relacions «llig» i «escriu» declarades o derivades de l’agent a `mapa.json`.',
      'Amb contracte, pot treballar sense el Mestre davant i un altre pot revisar el que ha deixat.'
    ],
    font: `${FONT_MAPA} · arestes llig i escriu dels agents`,
    elements: (mapa) => agentsAtomics(mapa).map((a) => ({
      clau: a.node.id,
      titol: a.node.atributs?.arnes ?? etiquetaNode(a.node),
      subtitol: `llig ${a.llig.length} · deixa ${a.escriu.length}`,
      problemes: problemesDe(mapa, a.node.id),
      detall: () => ({
        taules: [
          { titol: 'Què llig', columnes: ['Peça', 'Confiança'], files: a.llig.map((r, i) => ({ clau: `${r.a}|${r.confianca}|${i}`, celes: [peca(r.a), { confianca: r.confianca }] })), buit: 'No declara què llig.' },
          { titol: 'Què deixa', columnes: ['Peça', 'Confiança'], files: a.escriu.map((r, i) => ({ clau: `${r.a}|${r.confianca}|${i}`, celes: [peca(r.a), { confianca: r.confianca }] })), buit: 'No declara què deixa.' }
        ]
      })
    }))
  }
]);

/**
 * Les peces d'una família amb el seu slug: el prefix i l'id normalitzat. Dos
 * ids que es normalitzen igual porten -2, -3… en l'ordre de la pàgina.
 * `font` és el Mapa o, per a una família de consola.json, les seues dades.
 */
export function pecesDeFamilia(familia, font, capes) {
  const vistos = new Map();
  return familia.elements(font, capes).map((el) => {
    const base = `${familia.prefix}${normalitzaSlug(cosDe(el.clau))}`;
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    return { ...el, slug: n === 1 ? base : `${base}-${n}` };
  });
}
