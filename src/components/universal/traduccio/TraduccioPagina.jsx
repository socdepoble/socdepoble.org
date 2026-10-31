/**
 * TraduccioPagina.jsx — Les dues peces que PageFrame pinta quan una pàgina es
 * traduïx (Traductor Sobirà, ordre del Mestre, 260930 · via B).
 *
 *  · AvisTraduccio: l'avís en línia (Alerta «info», role=status). Mentre
 *    arriba la resposta, «Traduint al castellà…»; amb la traducció, «Traduït
 *    automàticament del valencià» i el botó «Veure l'original». No diu mai
 *    quin proveïdor hi ha darrere.
 *  · CosTraduit: els blocs traduïts (blocsTraduibles.js) com a elements de
 *    React. Cada text del servidor és TEXT: React l'escapa i un <script> que
 *    arribara en una resposta es pinta com a lletres, no s'executa. Els
 *    elements d'una mateixa llista tornen a fer eixa llista, <ol> (amb el
 *    seu `start`) o <ul> (C4, Codex 261030), i una llista niuada torna dins
 *    del seu element (C5, Codex 261030). Les peces d'un bloc tornen amb
 *    les seues marques: enllaços amb el href de l'arbre ORIGINAL (i, si
 *    obrien una finestra nova, target=_blank), negretes, cursives i codi.
 *    Cap atribut ve del proveïdor.
 *    Gauntlet 261030 (cicle 4) · Cada enllaç porta el rel que el sanejador
 *    posa a tots els de l'original (noopener noreferrer nofollow: cap fuita
 *    de referent); un bloc que no es pot reconstruir (`arbre`, C5) es pinta
 *    tal qual; i un element traduït dins d'un <li> que ha tornat en
 *    l'original porta la llengua de la traducció (`llengua`), no hereta el
 *    «ca» del pare (WCAG 3.1.2).
 */
import { Fragment } from 'react';
import { Alerta } from '../../PedraSeca/molecules/Alerta.jsx';
import { Boto } from '../../PedraSeca/atoms/Boto.jsx';
import { llenguaDeTraduccio } from '../../../data/traductor.js';
import { hrefSegur } from './blocsTraduibles.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';

export const AVIS_TRADUIT = 'Traduït automàticament del valencià';
export const VEURE_ORIGINAL = 'Veure l’original';
/* Gauntlet 261030 (cicle 2, menu-traduir-noms-sense-i18n) · L'avís en la
   llengua de la interfície. «{llengua}» és el `cap` de la llengua («al
   gallec»), en valencià: les altres llengües no el fan servir. */
const PARELL_TRADUINT = Object.freeze(['section.traduir.traduint', 'Traduint {llengua}…']);
export function avisTraduint(codi, t = null) {
  const cap = llenguaDeTraduccio(codi)?.cap;
  if (!cap) return 'Traduint…';
  return tradueix(t, PARELL_TRADUINT).split('{llengua}').join(cap);
}

export function AvisTraduccio({ llengua = null, carregant = null, onOriginal = null, className = '' }) {
  const t = useTraductorOpcional();
  if (!llengua && !carregant) return null;
  const classes = ['sdp-avis-traduccio', className].filter(Boolean).join(' ');
  if (carregant) {
    return <Alerta to="info" className={classes}>{avisTraduint(carregant, t)}</Alerta>;
  }
  return (
    <Alerta to="info" className={classes}
      accions={onOriginal ? <Boto varietat="secundari" onClick={onOriginal}>{tradueix(t, ['section.traduir.veureOriginal', VEURE_ORIGINAL])}</Boto> : null}>
      {tradueix(t, ['section.traduir.traduit', AVIS_TRADUIT])}
    </Alerta>
  );
}

/* `div`: només el bloc no fidel d'una cel·la o d'una definició amb una
   llista dins (blocsTraduibles), que no pot anar dins d'un <p>. */
const ETIQUETES = new Set(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'div']);
const EN_LINIA = new Set(['strong', 'b', 'em', 'i', 'code']);
/* El rel de sanitize.js per a tot <a href> del contingut (cicle 4,
   traduccio-enllacos-sense-rel-noreferrer). */
const REL_ENLLAC = 'noopener noreferrer nofollow';
/* Les etiquetes de l'arbre d'un bloc no fidel (blocsTraduibles · arbreDe). */
const ARBRE = new Set(['p', 'ul', 'ol', 'li', 'blockquote', 'div', 'strong', 'b', 'em', 'i', 'code']);

/* Les peces com a arbre: les veïnes que comparteixen una marca (el mateix
   objecte, el mateix element de l'original) van dins del mateix element. */
function arbreDePeces(peces) {
  const arrel = [];
  let obertes = [];
  for (const { text, marques } of peces) {
    let comu = 0;
    while (comu < obertes.length && comu < marques.length && obertes[comu].marca === marques[comu]) comu += 1;
    obertes = obertes.slice(0, comu);
    for (const marca of marques.slice(comu)) {
      const node = { marca, fills: [] };
      (obertes.length ? obertes[obertes.length - 1].fills : arrel).push(node);
      obertes.push(node);
    }
    (obertes.length ? obertes[obertes.length - 1].fills : arrel).push(text);
  }
  return arrel;
}

function pintaEnllac(href, novaFinestra, fills, clau) {
  // Segona porta: només un href segur (blocsTraduibles ja l'ha triat de l'original).
  const segur = hrefSegur(href);
  if (!segur) return <Fragment key={clau}>{fills}</Fragment>;
  return (
    <a key={clau} href={segur} {...(novaFinestra ? { target: '_blank' } : {})} rel={REL_ENLLAC}>{fills}</a>
  );
}

function pintaNode(node, clau) {
  if (typeof node === 'string') return node;
  const fills = node.fills.map(pintaNode);
  const { etiqueta, href, novaFinestra } = node.marca;
  if (etiqueta === 'a') return pintaEnllac(href, novaFinestra, fills, clau);
  const Etiqueta = EN_LINIA.has(etiqueta) ? etiqueta : 'span';
  return <Etiqueta key={clau}>{fills}</Etiqueta>;
}

/* Un node de l'arbre d'un bloc no fidel: text, <br>, un enllaç (segona
   porta) o una etiqueta coneguda; qualsevol altra, només el seu contingut. */
function pintaArbre(node, clau) {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return null;
  if (node.etiqueta === 'br') return <br key={clau} />;
  const fills = Array.isArray(node.fills) ? node.fills.map(pintaArbre) : [];
  if (node.etiqueta === 'a') return pintaEnllac(node.href, node.novaFinestra, fills, clau);
  if (!ARBRE.has(node.etiqueta)) return <Fragment key={clau}>{fills}</Fragment>;
  const Etiqueta = node.etiqueta;
  const inici = Etiqueta === 'ol' && Number.isInteger(node.inici) ? node.inici : undefined;
  return <Etiqueta key={clau} start={inici}>{fills}</Etiqueta>;
}

const contingutDe = (bloc) => {
  if (Array.isArray(bloc.arbre)) return bloc.arbre.map(pintaArbre);
  return Array.isArray(bloc.peces) && bloc.peces.length ? arbreDePeces(bloc.peces).map(pintaNode) : bloc.text;
};

const mateixaLlista = (a, b) => (a && b ? a.id === b.id : !a && !b);

/* Gauntlet 261030 (cicle 2) · Un bloc que ha tornat en l'original
   (`original`, blocsTraduibles · muntaBloc) es llig en valencià: porta el
   lang de l'original dins de l'article traduït (WCAG 3.1.2). Cap píxel. */
export const LANG_ORIGINAL = 'ca';
const langDe = (bloc) => (bloc.original ? LANG_ORIGINAL : undefined);

/* Un <li> a la seua llista: amb l'element d'abans si és de la mateixa. */
function afigElement(grups, bloc, index) {
  const darrer = grups[grups.length - 1];
  const llista = bloc.llista ?? null;
  if (darrer?.items && mateixaLlista(darrer.llista, llista)) darrer.items.push({ bloc, index });
  else grups.push({ llista, items: [{ bloc, index }] });
}

/* `llengua`: el lang de la traducció (el de l'<article> que la porta,
   PageFrame · traduida.lang). Només el pren l'element traduït d'una llista
   niuada dins d'un <li> que ha tornat en l'original. */
export function CosTraduit({ blocs = [], llengua = undefined }) {
  const grups = [];
  /* C5 (Codex 261030) · Una llista niuada (`llista.dins`: l'índex del bloc
     del <li> pare, sempre abans) es pinta dins d'eixe <li>, com a l'original. */
  const niuades = new Map();
  blocs.forEach((bloc, index) => {
    if (bloc.etiqueta !== 'li') {
      grups.push(bloc);
      return;
    }
    const dins = bloc.llista?.dins;
    if (Number.isInteger(dins) && dins >= 0 && dins < index && blocs[dins]?.etiqueta === 'li') {
      if (!niuades.has(dins)) niuades.set(dins, []);
      afigElement(niuades.get(dins), bloc, index);
    } else {
      afigElement(grups, bloc, index);
    }
  });
  /* Cicle 4 (traduccio-llista-niuada-hereta-lang-ca) · `dinsDOriginal`: la
     llista penja d'un <li> que ha tornat en l'original (lang="ca"); els seus
     elements traduïts porten la llengua de la traducció. */
  const pintaLlista = (grup, clau, dinsDOriginal = false) => {
    const ordenada = grup.llista?.tipus === 'ol';
    const Llista = ordenada ? 'ol' : 'ul';
    const inici = ordenada && Number.isInteger(grup.llista.inici) ? grup.llista.inici : undefined;
    return (
      <Llista key={clau} start={inici}>
        {grup.items.map(({ bloc, index }, j) => (
          <li key={j} lang={langDe(bloc) ?? (dinsDOriginal ? llengua : undefined)}>
            {contingutDe(bloc)}
            {(niuades.get(index) || []).map((niuada, k) => pintaLlista(niuada, k, Boolean(bloc.original)))}
          </li>
        ))}
      </Llista>
    );
  };
  const pintats = grups.map((grup, i) => {
    if (grup.items) {
      return { entrada: grup.items.some(({ bloc }) => bloc.entrada), node: pintaLlista(grup, i) };
    }
    const Etiqueta = ETIQUETES.has(grup.etiqueta) ? grup.etiqueta : 'p';
    /* TC3.3 · L'entradilla torna amb la seua classe (.lead, base.css). */
    const classe = Etiqueta === 'p' && grup.entradilla ? 'lead' : undefined;
    return { entrada: Boolean(grup.entrada), node: <Etiqueta key={i} className={classe} lang={langDe(grup)}>{contingutDe(grup)}</Etiqueta> };
  });
  /* Gauntlet 261030 (Fase 3, TC3.3; vista-traduida-perd-entradilla) · Els
     blocs seguits de la capçalera de l'original (.page-intro: el subtítol i
     l'entradilla) tornen dins del seu div.page-intro: la vista traduïda
     conserva l'anatomia H1 → H2 → lead (ordre del Mestre de la Fase 3, TC3). */
  const eixida = [];
  for (let i = 0; i < pintats.length; i += 1) {
    if (!pintats[i].entrada) {
      eixida.push(pintats[i].node);
      continue;
    }
    const inici = i;
    const fills = [];
    while (i < pintats.length && pintats[i].entrada) {
      fills.push(pintats[i].node);
      i += 1;
    }
    i -= 1;
    eixida.push(<div key={`entrada-${inici}`} className="page-intro">{fills}</div>);
  }
  return eixida;
}
