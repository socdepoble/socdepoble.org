/**
 * EspecimenBarraReproductorVeu.jsx — IDEA-255 (Onada R23 · 14-11-2026) +
 * IDEA-268 (Onada R27 · 15-11-2026) · Reproductor Flotant Universal de So
 * (`BarraReproductorVeu.jsx`) de PageFrame, centrat geomètricament sobre el
 * panell de lectura actiu tant en mòbil com en escriptori i preparat amb
 * `fontSo` desacoplada per a la futura Ràdio de Poble.
 */
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { BarraReproductorVeu } from '../../../../components/universal/veu/BarraReproductorVeu.jsx';
import { VEUS_TERRITORIALS } from '../../../../services/veusTerritorials.js';

const BLOCS_MOSTRA = Object.freeze([
  Object.freeze({
    index: 0,
    id: 'mostra-0',
    etiqueta: 'h1',
    esTitol: true,
    seccioTitol: 'Node 0 · El servidor de l’habitació',
    resumCurt: 'Node 0 · El servidor de l’habitació',
    text: 'Node 0 · El servidor de l’habitació.',
    element: null,
  }),
  Object.freeze({
    index: 1,
    id: 'mostra-1',
    etiqueta: 'lead',
    esTitol: false,
    seccioTitol: 'Node 0 · El servidor de l’habitació',
    resumCurt: 'Un Mac mini M4 al racó de casa fa sonar les set veus obertes i revisa el codi…',
    text: 'Un Mac mini M4 al racó de casa fa sonar les set veus obertes i revisa el codi amb les huit escoles locals.',
    element: null,
  }),
  Object.freeze({
    index: 2,
    id: 'mostra-2',
    etiqueta: 'h3',
    esTitol: true,
    seccioTitol: 'La veu oberta i la memòria oral',
    resumCurt: 'La veu oberta i la memòria oral',
    text: 'La veu oberta i la memòria oral.',
    element: null,
  }),
  Object.freeze({
    index: 3,
    id: 'mostra-3',
    etiqueta: 'p',
    esTitol: false,
    seccioTitol: 'La veu oberta i la memòria oral',
    resumCurt: 'Pots pausar i continuar al mateix paràgraf, saltar d’apartat o copiar el fragment.',
    text: 'Pots pausar i continuar al mateix paràgraf, saltar d’apartat o copiar el fragment.',
    element: null,
  }),
]);

/* Les pistes de mostra són les gravacions reals del Banc de Veus
   (public/assets/audio/veus_node0/), preses del catàleg tancat de veus
   perquè la ruta no es puga desfasar del fitxer que existix. */
const mostraDeLaVeu = (id) => VEUS_TERRITORIALS.find((veu) => veu.id === id)?.mostraAsset || null;

export const FONT_SO_RADIO_MOSTRA = Object.freeze({
  tipus: 'audio',
  titolEmissio: 'Ràdio de Poble · Mostra de contracte sonor',
  enDirecte: false,
  pistes: Object.freeze([
    Object.freeze({
      id: 'radio-mostra-1',
      titol: 'Veu valenciana d’estudi · Arnau (Matxa-TTS v2)',
      subtitol: 'Mostra sonora · Ràdio de Poble (en preparació)',
      src: mostraDeLaVeu('arnau_valencia'),
      text: 'Arnau · Mostra oberta per al futur canal de Ràdio de Poble.',
    }),
    Object.freeze({
      id: 'radio-mostra-2',
      titol: 'Veu valenciana d’estudi · Gina (Matxa-TTS v2)',
      subtitol: 'Mostra sonora · Ràdio de Poble (en preparació)',
      src: mostraDeLaVeu('gina_valencia'),
      text: 'Gina · Mostra oberta per al futur canal de Ràdio de Poble.',
    }),
  ]),
});

export default function EspecimenBarraReproductorVeu() {
  return (
    <>
      <Llinatge id="barra-veu" />
      <Especimen
        id="barra-reproductor-veu"
        nom="BarraReproductorVeu · Reproductor universal de so"
        fitxer="src/components/universal/veu/BarraReproductorVeu.jsx"
        descripcio="El reproductor flotant universal de so que apareix centrat a la part inferior del panell de lectura actiu (tant en mòbil com en escriptori amb barra lateral o espais multicolumna) quan es prem «🔊 Escolta la IAIA» o es tria una veu al Banc de Veus. En mode lectura indexa la pàgina en blocs navegables [0..N-1], conserva el paràgraf exacte en fer Pausa / Continua, ressalta el paràgraf actiu sense CLS i copia el fragment; amb la prop opcional fontSo reprodueix pistes o emissions d’àudio, deixant preparada la peça per a la futura Ràdio de Poble."
        contracte={[
          ['oberta', 'boolean', 'false', 'Si el reproductor està actiu. Tancat, no pinta cap node.'],
          ['capcaleraRef', 'RefObject<HTMLElement>', 'null', 'Referència a header.page-title per incloure l’H1 com a bloc 0 en lectura.'],
          ['cosRef', 'RefObject<HTMLElement>', 'null', 'Referència a l’article visible d’on s’extrauen els blocs i es mesura el centre del panell.'],
          ['idioma', 'string', "'ca'", 'Codi de llengua de lectura (original o llengua traduïda).'],
          ['privat', 'boolean', 'false', 'Amb true (notes privades o pàgines sense traducció externa) la veu no ix mai del dispositiu.'],
          ['fontSo', '{ tipus, titolEmissio?, enDirecte?, pistes } | null', 'null', 'Contracte desacoplat de so: null per a lectura de pàgina per blocs; objecte amb tipus="audio" i pistes [{ id, titol, subtitol?, src }] per a àudio o futura Ràdio de Poble.'],
          ['invocadorRef', 'RefObject<HTMLElement>', 'null', 'Control que ha obert la barra des de dins de l’article (p. ex. «Tria esta veu»): en tancar, el focus hi torna; sense invocador, torna al disparador de dalt sense desplaçar la pàgina.'],
          ['seguixLectura', 'boolean', 'true', 'Amb false (obertura des del Banc de Veus), l’avanç automàtic de bloc no desplaça la pàgina i la persona es queda on és.'],
          ['onTanca', 'function', 'null', 'Atura el so, neteja el ressaltat i tanca la barra, tornant el focus al disparador si cal.'],
        ]}
        a11y={[
          'Tots els controls (Anterior, Pausa/Continua, Següent, Apartats i cerca, Copiar fragment i Tancar) són <button type="button"> natius centrats amb objectiu tàctil mínim --sdp-touch (48px) i nom accessible explícit.',
          'En mòbil (.sdp-root.is-compact), el portal es munta dins de .sdp-root damunt de nav.mobile-nav i marca data-sdp-veu-oberta="true" per alçar el botó flotant «Tornar a dalt» (↑) sense solapaments.',
          'En escriptori i vistes multicolumna, ResizeObserver alinea les propietats locals --barra-veu-inici i --barra-veu-fi al panell de lectura actiu perquè la barra quede centrada al mil·límetre.',
        ]}
        fes={[
          'Muntar-la des de PageFrame dins de .sdp-root perquè funcione igual a l’SPA mòbil/escriptori i dins de <soc-de-poble> (LLEI_06).',
          'Reutilitzar la mateixa peça amb fontSo={ tipus: "audio", pistes } quan es connecten emissions de Ràdio de Poble o pòdcasts rurals, sense crear un segon reproductor divergent.',
        ]}
        noFacis={[
          'Posar-la en mode edició (TipTap / ProseMirror) ni deixar privat={false} en pàgines privades.',
          'Ancorar-la a 100vw ignorant la barra lateral d’escriptori o deixar que tape nav.mobile-nav o el botó ↑ en mòbil.',
        ]}
      >
        <h4>Mode 1 · Lectura per blocs d’articles i pàgines (Matxa-TTS v2 / IAIA)</h4>
        <BarraReproductorVeu oberta mostraEspecimen blocsMostra={BLOCS_MOSTRA} />
        <h4>Mode 2 · Contracte d’àudio preparat per a Ràdio de Poble (fontSo)</h4>
        <BarraReproductorVeu oberta mostraEspecimen fontSo={FONT_SO_RADIO_MOSTRA} />
      </Especimen>
    </>
  );
}
