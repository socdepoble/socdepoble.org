/**
 * VisorAnatomiaRural3D.jsx — Anatomia d'Enginyeria Tradicional Rural (IDEA-109,
 * onada R7). Un esquema isomètric paramètric en SVG, sense dependències, de
 * tres estructures (pou de neu, almàssera, forn de calç) que es desmunten
 * peça a peça amb un control lliscant.
 *
 *  · Dades: src/data/patrimoni/anatomiaRural.js (termes del Mestre; allò que
 *    no és segur, `pendent`). Geometria: anatomiaRuralGeometria.js.
 *  · Accessibilitat: el control és un <input type="range"> amb etiqueta; la
 *    llista de peces és la via del teclat i del lector (botons natius). Els punts calents de l'esquema són cercles
 *    SVG aria-hidden dins de cada peça (només ratolí i tacte; la posició va
 *    per l'atribut transform, mai per estil en línia). El terme i la definició són una regió viva
 *    (aria-live només ací, no als botons). Amb prefers-reduced-motion no hi
 *    ha cap transició (bloc final de src/css/components.css).
 *  · Veu: el botó compartit BotoVeuIaia (privat=false: el contingut és
 *    públic) fa dir el terme i la definició; tornar-lo a prémer l'atura. El
 *    visor només crida atura() en desmuntar-se.
 *  · Documental: amb un videoId real, VideoEditorial (youtube-nocookie); sense,
 *    un enllaç al canal d'Eugenio Monesma amb la seua autoria. Mai un id
 *    inventat.
 *  · Contingut etnogràfic en valencià; en una altra llengua es manté i s'avisa.
 *    Els termes no es tradueixen.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../config/i18n.js';
import { BotoVeuIaia } from '../PedraSeca/molecules/BotoVeuIaia.jsx';
import { PillToggle } from '../PedraSeca/molecules/PillToggle.jsx';
import { VideoEditorial, esIdVideoEditorial } from '../universal/VideoEditorial.jsx';
import { ESTRUCTURES, FONT_PENDENT, estructuraPerId } from '../../data/patrimoni/anatomiaRural.js';
import { atura } from '../../services/veuIaiaService.js';
import { ALTARIA, AMPLARIA, construeixPeca, separacions } from './anatomiaRuralGeometria.js';

const T_PER_DEFECTE = createTranslator('ca');
const VALOR_INICIAL = 40;
const ICONES = { 'pou-de-neu': '❄️', almassera: '🫒', 'forn-de-calc': '🔥' };
/* Noms de classe complets i estàtics (mai plantilles): el que no té regla
   pròpia al CSS no du classe. */
const CLASSE_PECA = {
  pedra: 'anatomia__peca--pedra',
  neu: 'anatomia__peca--neu',
  palla: 'anatomia__peca--palla',
  fusta: 'anatomia__peca--fusta',
  calc: 'anatomia__peca--calc'
};
const CLASSE_CARA = { filera: 'anatomia__cara--filera' };
const CLASSE_OMBRA = { 1: 'anatomia__ombra--1', 2: 'anatomia__ombra--2' };

export default function VisorAnatomiaRural3D({ estructuraInicial = ESTRUCTURES[0].id }) {
  const ui = useUIActionsOpcional();
  const t = ui?.t || T_PER_DEFECTE;
  const llengua = ui?.language || 'ca';
  const idControl = useId();
  const [idEstructura, setIdEstructura] = useState(estructuraPerId(estructuraInicial).id);
  const [valor, setValor] = useState(VALOR_INICIAL);
  const [idPeca, setIdPeca] = useState(null);

  const estructura = estructuraPerId(idEstructura);
  const peces = estructura.peces;
  const peca = peces.find((candidata) => candidata.id === idPeca) || null;
  const formes = useMemo(() => peces.map((candidata) => construeixPeca(candidata.forma)), [peces]);
  const moviments = separacions(peces, valor);

  /* La veu només es talla en desmuntar-se el visor: canviar de peça ho fa el
     mateix botó (BotoVeuIaia atura si canvia el text). */
  useEffect(() => () => { atura(); }, []);

  const canviaEstructura = (id) => {
    setIdEstructura(id);
    setIdPeca(null);
  };

  const opcions = ESTRUCTURES.map((candidata) => ({
    valor: candidata.id,
    icona: ICONES[candidata.id],
    text: t(`patrimoni.anatomia.estructura.${candidata.id}`, candidata.nom)
  }));
  const documental = estructura.documental;
  const hiHaVideo = esIdVideoEditorial(documental.videoId);
  const fontPendent = estructura.font === FONT_PENDENT;

  return (
    <section className="anatomia" aria-labelledby={`${idControl}-titol`} data-estructura={estructura.id}>
      <h3 id={`${idControl}-titol`} className="anatomia__titol">{t('patrimoni.anatomia.titol', 'Anatomia de l’enginyeria rural')}</h3>
      <PillToggle
        etiqueta={t('patrimoni.anatomia.selector', 'Estructura')}
        opcions={opcions}
        valor={idEstructura}
        onCanvi={canviaEstructura}
        className="anatomia__selector"
      />
      <p className="anatomia__resum" lang="ca">{estructura.resum}</p>
      <p className="anatomia__font">
        {t('patrimoni.anatomia.font', 'Font:')}{' '}
        {fontPendent
          ? t('patrimoni.anatomia.fontPendent', 'font pendent')
          : <em lang="ca">{estructura.font}</em>}
      </p>
      {llengua !== 'ca' ? (
        <p className="anatomia__avis" role="note">{t('patrimoni.anatomia.avisLlengua', 'El contingut etnogràfic només està en valencià; els termes no es tradueixen.')}</p>
      ) : null}

      <div className="anatomia__control">
        <label htmlFor={`${idControl}-separacio`} className="anatomia__etiqueta">
          {t('patrimoni.anatomia.control', '🔧 Muntar ↔ Desmuntar peça a peça')}
        </label>
        <input
          id={`${idControl}-separacio`}
          className="anatomia__lliscant"
          type="range"
          min="0"
          max="100"
          step="1"
          value={valor}
          onChange={(esdeveniment) => setValor(Number(esdeveniment.target.value))}
          aria-valuetext={`${valor} %`}
        />
      </div>

      <div className="anatomia__escenari">
        <svg
          className="anatomia__svg"
          viewBox={`0 0 ${AMPLARIA} ${ALTARIA}`}
          role="img"
          aria-label={t('patrimoni.anatomia.esquemaAria', 'Esquema isomètric de {nom}').replace('{nom}', () => estructura.nom)}
          focusable="false"
        >
          {peces.map((candidata, index) => {
            const { dz, dx, dy, t: grau } = moviments[index];
            const forma = formes[index];
            const activa = candidata.id === idPeca;
            return (
              <g
                key={candidata.id}
                className={['anatomia__peca', CLASSE_PECA[candidata.classe], activa ? 'is-seleccionada' : ''].filter(Boolean).join(' ')}
                data-peca={candidata.id}
                data-separacio={dz || dx || dy ? 'si' : 'no'}
                data-grau={grau}
                transform={`translate(${dx} ${dy - dz})`}
                onClick={() => setIdPeca(candidata.id)}
              >
                {candidata.forma.tipus === 'marcador' ? (
                  <MarcadorSvg x={forma.ancora[0]} y={forma.ancora[1]} glif={candidata.forma.glif} />
                ) : forma.traços.map((traç, k) => (
                  <g key={k}>
                    <path className={['anatomia__cara', CLASSE_CARA[traç.cara]].filter(Boolean).join(' ')} d={traç.d} />
                    {traç.ombra ? <path className={['anatomia__ombra', CLASSE_OMBRA[traç.ombra]].filter(Boolean).join(' ')} d={traç.d} /> : null}
                  </g>
                ))}
                <circle className="anatomia__punt" cx={forma.ancora[0]} cy={forma.ancora[1]} r="22" aria-hidden="true" />
                <circle className="anatomia__punt-marca" cx={forma.ancora[0]} cy={forma.ancora[1]} r="6" aria-hidden="true" />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="anatomia__nota">{t('patrimoni.anatomia.avisEsquema', 'Esquema il·lustratiu, no a escala: la posició i la forma de les peces són orientatives.')}</p>

      <div className="anatomia__peces" role="group" aria-label={t('patrimoni.anatomia.llista', 'Peces de l’estructura, en l’ordre de l’esquema (no és l’ordre constructiu)')}>
        {peces.map((candidata) => (
          <button
            key={candidata.id}
            type="button"
            lang="ca"
            className="anatomia__peca-boto"
            aria-pressed={candidata.id === idPeca ? 'true' : 'false'}
            onClick={() => setIdPeca(candidata.id)}
          >
            {candidata.terme}
          </button>
        ))}
      </div>

      <div className="anatomia__detall" role="region" aria-label={t('patrimoni.anatomia.detall', 'Detall de la peça')}>
        <div className="anatomia__viva" aria-live="polite">
          {peca ? (
            <>
              <h4 className="anatomia__terme" lang="ca">{peca.terme}</h4>
              <p className="anatomia__definicio" lang="ca">{peca.definicio}</p>
              {peca.pendent ? (
                <p className="anatomia__pendent">
                  {fontPendent
                    ? t('patrimoni.anatomia.pendentSenseFont', 'Pendent de contrastar: encara no hi ha cap font.')
                    : <>{t('patrimoni.anatomia.pendent', 'Pendent de contrastar amb')} <em lang="ca">{estructura.font}</em></>}
                </p>
              ) : null}
            </>
          ) : (
            <p className="anatomia__buit">{t('patrimoni.anatomia.buit', 'Tria una peça de l’esquema o de la llista per veure’n el terme i la definició.')}</p>
          )}
        </div>
        {peca ? (
          <div className="anatomia__veu">
            <BotoVeuIaia text={`${peca.terme}. ${peca.definicio}`} idioma="ca" privat={false} />
          </div>
        ) : null}
      </div>

      <div className="anatomia__documental">
        <h4 className="anatomia__documental-titol">{t('patrimoni.anatomia.documental', 'Documental etnogràfic')}</h4>
        <p className="anatomia__autoria">
          {t('patrimoni.anatomia.autoria', 'Autoria:')} <span translate="no">{documental.autor}</span>
        </p>
        {hiHaVideo ? (
          <VideoEditorial id={documental.videoId} title={t('patrimoni.anatomia.documentalDe', 'Documental de {nom}').replace('{nom}', () => documental.autor)} />
        ) : (
          <p>
            <a className="anatomia__canal" href={documental.canal} target="_blank" rel="noopener noreferrer">
              {t('patrimoni.anatomia.canal', 'Els documentals, al canal d’Eugenio Monesma a YouTube')}
            </a>
            {' '}
            <span className="anatomia__sensevideo">{t('patrimoni.anatomia.senseVideo', 'Encara no hi ha cap vídeo concret enllaçat a esta estructura.')}</span>
          </p>
        )}
      </div>
    </section>
  );
}

function MarcadorSvg({ x, y, glif }) {
  return (
    <g>
      <circle className="anatomia__marcador-cercle" cx={x} cy={y} r="16" />
      <text className="anatomia__marcador-glif" x={x} y={y} textAnchor="middle" dominantBaseline="central">{glif}</text>
    </g>
  );
}
