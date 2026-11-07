/**
 * ReproductorExplicatiuPouNeu3D.jsx — IDEA-116 + IDEA-119 (Onada R9, carril
 * C2; ordre del Mestre del 261106) · El reproductor didàctic del Pou de Neu
 * del Rentonar: l'esquema isomètric del visor d'anatomia (IDEA-109) explicat
 * pas a pas, com un vídeo curt que es pot reproduir, pausar i avançar.
 *
 *  · Dades: les de l'estructura POU d'anatomiaRural.js (peces, definicions i
 *    cotes amb font i estat) i MESURES_POU (les mateixes xifres, en números,
 *    per a les cotes del dibuix i el càlcul de comprovació). Cap dada pròpia:
 *    els passos només diuen quines peces i quines cotes es mostren.
 *    Geometria: anatomiaRuralGeometria.js, la del visor.
 *  · Format: text davall del dibuix de partida en pantalles estretes
 *    (matchMedia) i al costat en les amples; el commutador el canvia.
 *    El text sempre creix amb el contingut, sense desplaçament interior.
 *  · Tres propostes d'estil (A, B i C) perquè el Mestre en trie una: només
 *    canvien tokens de Pedra Seca (src/css/components.css), cap color literal.
 *  · Accessibilitat: tots els controls són botons natius; a la pantalla, les
 *    fletxes, Inici i Fi canvien de pas; el títol i el text del pas són una
 *    regió viva (aria-live). L'SVG és una imatge amb nom (role="img"): no hi
 *    ha cap control dins. Amb prefers-reduced-motion, cap transició.
 *  · Veu: BotoVeuIaia (privat=false, contingut públic) diu el pas en valencià.
 *  · El contingut etnogràfic és en valencià (lang="ca"); en una altra llengua
 *    es manté i s'avisa, com al visor. Els rètols de la interfície són als
 *    cinc diccionaris.
 *  · Es carrega en diferit (React.lazy des de l'article del Mur): 0 B a
 *    l'entrada.
 */
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../config/i18n.js';
import { useElementFullscreen } from '../../hooks/useElementFullscreen.js';
import { BotoVeuIaia } from '../PedraSeca/molecules/BotoVeuIaia.jsx';
import { PillToggle } from '../PedraSeca/molecules/PillToggle.jsx';
import { Boto } from '../PedraSeca/atoms/Boto.jsx';
import { MESURES_POU, estructuraPerId } from '../../data/patrimoni/anatomiaRural.js';
import { ALTARIA, AMPLARIA, CENTRE_X, BASE_Y, construeixPeca, separacions } from './anatomiaRuralGeometria.js';
import { POU_NEU_TEXT } from './iso/pouNeuTextos.js';

const T_PER_DEFECTE = createTranslator('ca');
export const POU = estructuraPerId('pou-de-neu');
/** Temps de cada pas quan es reproduix. */
export const DURADA_PAS_MS = 7000;
/** El punt de tall entre mòbil i escriptori (el mateix que fan servir els fulls: 48rem). */
export const CONSULTA_MOBIL = '(max-width: 47.99rem)';

/* Els passos: quines peces de POU s'il·luminen, si el pou es desmunta i quines
   cotes (per l'etiqueta exacta d'anatomiaRural.js) es mostren. El títol en
   valencià és la reserva del diccionari i el text de la veu. */
export const PASSOS = Object.freeze([
  { id: 'sencer', titol: 'El pou sencer', peces: [], desmuntat: false, cotes: ['Cota del pou', 'Alçada total'] },
  { id: 'cupula', titol: 'La cúpula: 3 m de falsa volta', peces: ['cupula', 'boca'], desmuntat: true, cotes: ['Alçada total'] },
  { id: 'finestres', titol: 'Les finestres de dalt', peces: ['finestres'], desmuntat: true, cotes: ['Finestres superiors'] },
  { id: 'estreps', titol: 'Els estreps dels arcs', peces: ['estreps'], desmuntat: true, cotes: ['Estreps d’arcs'] },
  { id: 'pou', titol: 'El pou: 15 m de magatzem de neu', peces: ['neu-piconada', 'palla'], desmuntat: true,
    cotes: ['Fondària des de les finestres superiors', 'Diàmetre interior', 'Capacitat estimada', 'Capacitat històrica'], calcul: true },
  { id: 'tunel', titol: 'El túnel d’accés sud', peces: ['tunel-sud'], desmuntat: true, cotes: ['Túnel d’accés sud'] },
  { id: 'galeria', titol: 'La galeria de desguàs: 29 m', peces: ['galeria'], desmuntat: true, cotes: ['Galeria d’escorredor, a l’est'] },
  { id: 'muntat', titol: 'Tornem a muntar-lo', peces: [], desmuntat: false, cotes: ['Època'] }
].map((pas) => Object.freeze({ ...pas, peces: Object.freeze(pas.peces), cotes: Object.freeze(pas.cotes) })));

/* Claus estàtiques: 'ok' no du cap marca (les del visor). */
const CLAU_ESTAT = {
  unica: 'patrimoni.anatomia.estat.unica',
  discrepant: 'patrimoni.anatomia.estat.discrepant',
  pendent: 'patrimoni.anatomia.estat.pendent'
};
/* Noms de classe complets i estàtics (mai plantilles). */
const CLASSE_FORMAT = { vertical: 'reproductor-pou--vertical', horitzontal: 'reproductor-pou--horitzontal' };
const CLASSE_ESTIL = { a: 'reproductor-pou--estil-a', b: 'reproductor-pou--estil-b', c: 'reproductor-pou--estil-c' };
const CLASSE_OMBRA = { 1: 'reproductor-pou__ombra--1', 2: 'reproductor-pou__ombra--2' };
const CLASSE_MATERIAL = {
  pedra: 'reproductor-pou__peca--pedra',
  neu: 'reproductor-pou__peca--neu',
  palla: 'reproductor-pou__peca--palla',
  fusta: 'reproductor-pou__peca--fusta'
};
export const ESTILS = Object.freeze([
  ['a', '🖋️', 'A · Còmic Tinta Viva i Pedra Seca'],
  ['b', '📐', 'B · Plànol etnogràfic del Rentonar'],
  ['c', '🧊', 'C · Plànol blau (blueprint)']
]);

/** El format de partida: vertical en pantalla estreta, horitzontal si no (o si no hi ha matchMedia). */
export function formatDePartida(finestra = typeof window === 'undefined' ? undefined : window) {
  try {
    return typeof finestra?.matchMedia === 'function' && finestra.matchMedia(CONSULTA_MOBIL).matches ? 'vertical' : 'horitzontal';
  } catch {
    return 'horitzontal';
  }
}

/** Les cotes d'un pas, en l'ordre del pas: les d'anatomiaRural.js, tal qual. */
export function cotesDelPas(pas, estructura = POU) {
  return pas.cotes.map((etiqueta) => estructura.cotes.find((cota) => cota.etiqueta === etiqueta)).filter(Boolean);
}

/** R9V-C2-10 · El nom accessible d'un botó de veu: el rètol visible del botó
 *  (sense l'emoji, que és decoració) i què llig, perquè els dos botons de la
 *  publicació (tota la publicació i el pas) no es diguen igual. Comença pel
 *  rètol visible (WCAG 2.5.3, el nom conté l'etiqueta). */
export function nomDeLaVeu(t, abast) {
  const escolta = String(t('common.veuIaiaEscolta', '🔊 Escolta la IAIA')).replace(/^\p{Extended_Pictographic}️?\s*/u, '');
  const que = abast === 'pas'
    ? t('patrimoni.reproductorPou.veuPas', 'este pas')
    : t('patrimoni.reproductorPou.veuPublicacio', 'tota la publicació');
  return `${escolta}: ${que}`;
}

/** El volum d'un cilindre (m³) de diàmetre i alçada en metres. */
export const volumCilindre = (diametre, alcada) => Math.PI * (diametre / 2) ** 2 * alcada;

/** El text que diu la veu i que llig la regió viva: terme i definició de cada peça (o el resum), amb
 *  la nota de procedència quan la peça en porta («Només el corpus ho conta…»), com al visor. */
export function textDelPas(pas, estructura = POU) {
  const peces = pas.peces.map((id) => estructura.peces.find((peca) => peca.id === id)).filter(Boolean);
  if (!peces.length) return estructura.resum;
  return peces.map((peca) => `${peca.terme}: ${peca.definicio}${peca.nota ? ` (${peca.nota})` : ''}`).join(' ');
}

export default function ReproductorExplicatiuPouNeu3D({ formatInicial = null, estilInicial = 'a', pantallaPlena = false }) {
  const ui = useUIActionsOpcional();
  const t = ui?.t || T_PER_DEFECTE;
  const llengua = ui?.language || 'ca';
  const { elementRef, isFullscreen, toggleFullscreen } = useElementFullscreen();
  const fullscreenText = POU_NEU_TEXT[llengua] || POU_NEU_TEXT.ca;
  const id = useId();
  const [index, setIndex] = useState(0);
  const [reproduint, setReproduint] = useState(false);
  const [format, setFormat] = useState(() => (formatInicial === 'vertical' || formatInicial === 'horitzontal' ? formatInicial : formatDePartida()));
  const [estil, setEstil] = useState(CLASSE_ESTIL[estilInicial] ? estilInicial : 'a');

  const pas = PASSOS[index];
  const ultim = PASSOS.length - 1;
  const peces = POU.peces;
  const formes = useMemo(() => peces.map((peca) => construeixPeca(peca.forma)), [peces]);
  const moviments = separacions(peces, pas.desmuntat ? 100 : 0);
  const numero = useMemo(() => new Intl.NumberFormat(llengua, { maximumFractionDigits: 2 }), [llengua]);
  /* Cada xifra amb la precisió de la seua font i la puntuació de la llengua. */
  const xifra = (clau) => new Intl.NumberFormat(llengua, { minimumFractionDigits: MESURES_POU[clau].decimals, maximumFractionDigits: MESURES_POU[clau].decimals }).format(MESURES_POU[clau].valor);
  const m = (clau) => `${xifra(clau)} ${MESURES_POU[clau].unitat}`;
  const titolDe = (candidat) => t(`patrimoni.reproductorPou.pas.${candidat.id}`, candidat.titol);

  const ves = useCallback((nou) => setIndex(Math.max(0, Math.min(ultim, nou))), [ultim]);

  /* Reproduir: un pas cada DURADA_PAS_MS fins a l'últim, on s'atura sol. */
  useEffect(() => {
    if (!reproduint) return undefined;
    if (index >= ultim) {
      setReproduint(false);
      return undefined;
    }
    const rellotge = setTimeout(() => setIndex((actual) => Math.min(ultim, actual + 1)), DURADA_PAS_MS);
    return () => clearTimeout(rellotge);
  }, [reproduint, index, ultim]);

  const alternaReproduccio = () => {
    if (reproduint) { setReproduint(false); return; }
    if (index >= ultim) setIndex(0);
    setReproduint(true);
  };

  /* Només a la pantalla mateixa: llegir el text del pas amb les fletxes
     no canvia el pas. */
  const tecla = (esdeveniment) => {
    if (esdeveniment.target !== esdeveniment.currentTarget) return;
    const accions = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: ultim };
    if (!(esdeveniment.key in accions)) return;
    esdeveniment.preventDefault();
    setReproduint(false);
    ves(accions[esdeveniment.key]);
  };

  const cotes = cotesDelPas(pas);
  const text = textDelPas(pas);
  const actives = new Set(pas.peces);
  const peca = (idPeca) => peces.findIndex((candidata) => candidata.id === idPeca);
  const ancoraDe = (idPeca) => {
    const i = peca(idPeca);
    if (i < 0) return null;
    const { dx, dy, dz } = moviments[i];
    return [formes[i].ancora[0] + dx, formes[i].ancora[1] + dy - dz];
  };
  const etiquetaDelPas = {
    cupula: m('alcadaCupula'),
    pou: `${m('alcadaPou')} · Ø ${m('diametrePla')} – ${m('diametreArticle')}`,
    tunel: m('tunel'),
    galeria: `${m('galeria')} (${xifra('galeriaTram1')} + ${xifra('galeriaTram2')}) · ${m('entradaGaleria')}`
  }[pas.id];
  const ancoraEtiqueta = etiquetaDelPas ? ancoraDe(pas.peces[0]) : null;

  /* Les cotes del pou muntat: l'alçada (18 m = 15 + 3) a l'esquerra i a la
     dreta, i el diàmetre davall. Unitats de l'esquema, no a escala. */
  const cupula = peces[peca('cupula')]?.forma;
  const finestres = peces[peca('finestres')]?.forma;
  const yDe = (z) => BASE_Y - z;
  const radiPantalla = (finestres?.r || 78) * Math.SQRT2 * Math.cos(Math.PI / 6);
  const cotesMuntat = !pas.desmuntat && cupula ? {
    xEsq: Math.round(CENTRE_X - radiPantalla - 32),
    xDre: Math.round(CENTRE_X + radiPantalla + 32),
    yBase: yDe(0),
    yCupula: yDe(cupula.z),
    yDalt: yDe(cupula.z + cupula.h),
    yDiametre: Math.min(ALTARIA - 16, BASE_Y + 48),
    x1: Math.round(CENTRE_X - radiPantalla),
    x2: Math.round(CENTRE_X + radiPantalla)
  } : null;

  const calcul = pas.calcul ? t('patrimoni.reproductorPou.calcul',
    'Càlcul de comprovació, no és cap font: π × ({d1} ÷ 2)² × {h1} ≈ {v1} m³ (l’article en dona {c1} m³); π × ({d2} ÷ 2)² × {h2} ≈ {v2} m³ (el corpus diu més de {c2} m³). Una explicació possible és l’alçada que es pren.')
    .replace('{d1}', () => xifra('diametreArticle'))
    .replace('{h1}', () => xifra('fondariaFinestres'))
    .replace('{v1}', () => numero.format(Math.round(volumCilindre(MESURES_POU.diametreArticle.valor, MESURES_POU.fondariaFinestres.valor))))
    .replace('{c1}', () => xifra('capacitatArticle'))
    .replace('{d2}', () => xifra('diametrePla'))
    .replace('{h2}', () => xifra('alcadaPou'))
    .replace('{v2}', () => numero.format(Math.round(volumCilindre(MESURES_POU.diametrePla.valor, MESURES_POU.alcadaPou.valor))))
    .replace('{c2}', () => xifra('capacitatCorpus')) : null;

  const classes = ['reproductor-pou', CLASSE_FORMAT[format], CLASSE_ESTIL[estil], isFullscreen && 'is-fullscreen'].filter(Boolean).join(' ');
  const titolPas = titolDe(pas);
  const comptador = t('patrimoni.reproductorPou.comptador', 'Pas {n} de {total}')
    .replace('{n}', () => String(index + 1)).replace('{total}', () => String(PASSOS.length));

  return (
    <section ref={elementRef} data-element-fullscreen="" className={classes} aria-labelledby={`${id}-titol`} data-format={format} data-estil={estil} data-pas={pas.id}>
      <h3 id={`${id}-titol`} className="reproductor-pou__titol">{t('patrimoni.reproductorPou.titol', 'El Pou de Neu del Rentonar, pas a pas')}</h3>
      {llengua !== 'ca' ? (
        <p className="reproductor-pou__avis" role="note">{t('patrimoni.anatomia.avisLlengua', 'El contingut etnogràfic només està en valencià; els termes no es tradueixen.')}</p>
      ) : null}

      <div className="reproductor-pou__opcions">
        <PillToggle
          etiqueta={t('patrimoni.reproductorPou.format', 'Format de la pantalla')}
          opcions={[
            { valor: 'vertical', icona: '📱', text: t('patrimoni.reproductorPou.formatVertical', 'Vertical').replace(/\s+\d+:\d+$/, '') },
            { valor: 'horitzontal', icona: '🖥️', text: t('patrimoni.reproductorPou.formatHoritzontal', 'Horitzontal').replace(/\s+\d+:\d+$/, '') }
          ]}
          valor={format}
          onCanvi={setFormat}
          className="reproductor-pou__commutador"
        />
        <PillToggle
          etiqueta={t('patrimoni.reproductorPou.estil', 'Proposta d’estil')}
          opcions={ESTILS.map(([valor, icona, text]) => ({ valor, icona, text: t(`patrimoni.reproductorPou.estil.${valor}`, text) }))}
          valor={estil}
          onCanvi={setEstil}
          className="reproductor-pou__commutador"
        />
        <Boto varietat="secundari" aria-pressed={isFullscreen} onClick={toggleFullscreen}>
          <span aria-hidden="true">⛶</span> {isFullscreen ? fullscreenText.exitFullscreen : fullscreenText.fullscreen}
        </Boto>
      </div>

      <div
        className={['reproductor-pou__pantalla', 'sdp-diapositiva-plena', pantallaPlena ? 'is-fullscreen' : ''].filter(Boolean).join(' ')}
        role="group"
        tabIndex={0}
        aria-label={t('patrimoni.reproductorPou.pantalla', 'Reproductor: les fletxes canvien de pas')}
        onKeyDown={tecla}
      >
        <svg
          className="reproductor-pou__svg"
          viewBox={`0 0 ${AMPLARIA} ${ALTARIA}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={t('patrimoni.reproductorPou.esquemaAria', 'Esquema isomètric del Pou de Neu del Rentonar. {pas}: {titol}')
            .replace('{pas}', () => comptador).replace('{titol}', () => titolPas)}
          focusable="false"
        >
          {peces.map((candidata, i) => {
            const { dz, dx, dy } = moviments[i];
            const activa = actives.has(candidata.id);
            const estat = actives.size ? (activa ? 'is-activa' : 'is-apagada') : '';
            const classe = ['reproductor-pou__peca', CLASSE_MATERIAL[candidata.classe], estat].filter(Boolean).join(' ');
            return (
              <g key={candidata.id} className={classe} data-peca={candidata.id} transform={`translate(${dx} ${dy - dz})`}>
                {candidata.forma.tipus === 'marcador' ? (
                  <circle className="reproductor-pou__marcador" cx={formes[i].ancora[0]} cy={formes[i].ancora[1]} r="12" />
                ) : formes[i].traços.map((traç, k) => (
                  <g key={k}>
                    <path className={traç.cara === 'filera' ? 'reproductor-pou__cara reproductor-pou__cara--filera' : 'reproductor-pou__cara'} d={traç.d} />
                    {traç.ombra ? <path className={`reproductor-pou__ombra ${CLASSE_OMBRA[traç.ombra]}`} d={traç.d} /> : null}
                  </g>
                ))}
              </g>
            );
          })}
          {cotesMuntat ? (
            <g className="reproductor-pou__cotes-dibuix" data-cotes="muntat">
              <line className="reproductor-pou__cota-linia" x1={cotesMuntat.xEsq} y1={cotesMuntat.yBase} x2={cotesMuntat.xEsq} y2={cotesMuntat.yDalt} />
              <text className="reproductor-pou__cota-text" x={cotesMuntat.xEsq - 8} y={(cotesMuntat.yBase + cotesMuntat.yDalt) / 2} textAnchor="end">{m('alcadaTotal')}</text>
              <line className="reproductor-pou__cota-linia" x1={cotesMuntat.xDre} y1={cotesMuntat.yBase} x2={cotesMuntat.xDre} y2={cotesMuntat.yCupula} />
              <text className="reproductor-pou__cota-text" x={cotesMuntat.xDre + 8} y={(cotesMuntat.yBase + cotesMuntat.yCupula) / 2}>{m('alcadaPou')}</text>
              <line className="reproductor-pou__cota-linia reproductor-pou__cota-linia--clara" x1={cotesMuntat.xDre} y1={cotesMuntat.yCupula} x2={cotesMuntat.xDre} y2={cotesMuntat.yDalt} />
              <text className="reproductor-pou__cota-text" x={cotesMuntat.xDre + 8} y={(cotesMuntat.yCupula + cotesMuntat.yDalt) / 2}>{m('alcadaCupula')}</text>
              <line className="reproductor-pou__cota-linia" x1={cotesMuntat.x1} y1={cotesMuntat.yDiametre} x2={cotesMuntat.x2} y2={cotesMuntat.yDiametre} />
              <text className="reproductor-pou__cota-text" x={CENTRE_X} y={cotesMuntat.yDiametre - 8} textAnchor="middle">{`Ø ${m('diametrePla')} – ${m('diametreArticle')}`}</text>
            </g>
          ) : null}
          {ancoraEtiqueta ? (
            <text className="reproductor-pou__cota-text reproductor-pou__cota-text--pas" x={ancoraEtiqueta[0]} y={ancoraEtiqueta[1] - 28} textAnchor="middle" data-cota-pas={pas.id}>
              {etiquetaDelPas}
            </text>
          ) : null}
        </svg>

        {/* La regió conserva el focus i el nom accessible; el text complet
            ocupa l'alçada que necessita, sense retall ni scroll interior. */}
        <div
          className="reproductor-pou__subtitol sdp-diapositiva-plena__prosa"
          role="region"
          tabIndex={0}
          aria-label={t('patrimoni.reproductorPou.textPas', 'Text del pas')}
          aria-live="polite"
        >
          <p className="reproductor-pou__comptador">{comptador}</p>
          <h4 className="reproductor-pou__pas-titol">{titolPas}</h4>
          <p className="reproductor-pou__pas-text" lang="ca">{text}</p>
        </div>
      </div>
      <p className="reproductor-pou__nota">{t('patrimoni.anatomia.avisEsquema', 'Esquema il·lustratiu, no a escala: la posició i la forma de les peces són orientatives.')}</p>

      <div className="reproductor-pou__controls" role="group" aria-label={t('patrimoni.reproductorPou.controls', 'Controls del reproductor')}>
        <Boto varietat="secundari" onClick={() => { setReproduint(false); ves(index - 1); }} disabled={index === 0}>
          <span aria-hidden="true">⏮</span> {t('patrimoni.reproductorPou.anterior', 'Anterior')}
        </Boto>
        <Boto varietat="primari" onClick={alternaReproduccio} data-estat={reproduint ? 'reproduint' : 'aturat'}>
          <span aria-hidden="true">{reproduint ? '⏸' : '▶'}</span> {reproduint ? t('patrimoni.reproductorPou.pausa', 'Pausa') : t('patrimoni.reproductorPou.reproduir', 'Reproduir')}
        </Boto>
        <Boto varietat="secundari" onClick={() => { setReproduint(false); ves(index + 1); }} disabled={index === ultim}>
          {t('patrimoni.reproductorPou.seguent', 'Següent')} <span aria-hidden="true">⏭</span>
        </Boto>
      </div>

      <div className="reproductor-pou__detall">
        {cotes.length ? (
          <dl className="reproductor-pou__cotes sdp-graella-cotes" lang="ca">
            {cotes.map((dada) => (
              <div key={dada.etiqueta} className="reproductor-pou__cota" data-estat={dada.estat}>
                <dt className="reproductor-pou__cota-etiqueta">{dada.etiqueta}</dt>
                <dd className="reproductor-pou__cota-valor">
                  {dada.valor}
                  {dada.estat !== 'ok' ? <> <span className="reproductor-pou__estat">{t(CLAU_ESTAT[dada.estat], dada.estat)}</span></> : null}
                  <span className="reproductor-pou__cota-font"> · {dada.font}</span>
                  {dada.nota ? <span className="reproductor-pou__cota-font"> {dada.nota}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {calcul ? <p className="reproductor-pou__calcul">{calcul}</p> : null}
        <div className="reproductor-pou__veu">
          <BotoVeuIaia text={`${pas.titol}. ${text}`} idioma="ca" privat={false} aria-label={nomDeLaVeu(t, 'pas')} />
        </div>
      </div>

      <ol className="reproductor-pou__passos" aria-label={t('patrimoni.reproductorPou.passos', 'Tots els passos')}>
        {PASSOS.map((candidat, i) => (
          <li key={candidat.id}>
            <button
              type="button"
              className="reproductor-pou__boto-pas"
              aria-current={i === index ? 'step' : undefined}
              onClick={() => { setReproduint(false); ves(i); }}
            >
              {`${i + 1} · ${titolDe(candidat)}`}
            </button>
          </li>
        ))}
      </ol>
      <p className="reproductor-pou__font">
        {t('patrimoni.anatomia.font', 'Font:')} <em lang="ca">{POU.font}</em>
      </p>
    </section>
  );
}
