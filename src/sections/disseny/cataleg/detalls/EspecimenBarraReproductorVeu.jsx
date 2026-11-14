/**
 * EspecimenBarraReproductorVeu.jsx — IDEA-255 (Onada R23 · 14-11-2026) · El
 * Mini-Reproductor Flotant Universal de Veu (`BarraReproductorVeu.jsx`) que
 * PageFrame munta quan la persona lectora prem «🔊 Escolta la IAIA» sota
 * l'entradilla (.page-intro). Pedra Seca §9: l'espècimen és el component real
 * en mode de mostra inline (`mostraEspecimen`), sense portal al viewport.
 */
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { BarraReproductorVeu } from '../../../../components/universal/veu/BarraReproductorVeu.jsx';

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

export default function EspecimenBarraReproductorVeu() {
  return (
    <>
      <Llinatge id="barra-veu" />
      <Especimen
        id="barra-reproductor-veu"
        nom="BarraReproductorVeu"
        fitxer="src/components/universal/veu/BarraReproductorVeu.jsx"
        descripcio="El mini-reproductor flotant universal que apareix a la part inferior de la pantalla quan es prem «🔊 Escolta la IAIA» sota l’entradilla de qualsevol pàgina de lectura de PageFrame. Indexa la pàgina en blocs navegables [0..N-1], conserva sempre el paràgraf exacte en fer Pausa / Continua, permet saltar o buscar ràpidament per apartats i text, ressalta suaument el paràgraf actiu sense desplaçar la maqueta (zero CLS), copia el fragment i es tanca amb l’aspa."
        contracte={[
          ['oberta', 'boolean', 'false', 'Si el reproductor està actiu. Tancat, no pinta cap node.'],
          ['capcaleraRef', 'RefObject<HTMLElement>', 'null', 'Referència a header.page-title per incloure l’H1 com a bloc 0.'],
          ['cosRef', 'RefObject<HTMLElement>', 'null', 'Referència a l’article visible (original o traduït) d’on s’extrauen els blocs.'],
          ['idioma', 'string', "'ca'", 'Codi de llengua de lectura (original o llengua traduïda).'],
          ['privat', 'boolean', 'false', 'Amb true (notes privades o pàgines sense traducció externa) la veu no ix mai del dispositiu.'],
          ['onTanca', 'function', 'null', 'Atura la locució, neteja el ressaltat i tanca la barra, tornant el focus al disparador si cal.'],
        ]}
        a11y={[
          'Tots els controls (Anterior, Pausa/Continua, Següent, Apartats i cerca, Copiar fragment i Tancar) són <button type="button"> natius amb objectiu tàctil mínim --sdp-touch (48px) i nom accessible explícit.',
          'Pausa i Continua operen sobre l’índex de bloc exacte en memòria, evitant els bloquejos de speechSynthesis.pause() en navegadors mòbils.',
          'En tancar amb ✕ mentre el focus és dins de la barra, el focus torna netament al botó «Escolta la IAIA» de PageFrame.',
        ]}
        fes={[
          'Muntar-la en diferit des de PageFrame a la capa superior (capaDeDalt) perquè funcione igual a l’SPA i dins de <soc-de-poble> (LLEI_06).',
          'Marcar amb data-sdp-no-locutar="" els jocs interactius, formularis o bancs de mostres que no formen part de la lectura lineal.',
        ]}
        noFacis={[
          'Posar-la en mode edició (TipTap / ProseMirror) ni deixar privat={false} en pàgines privades.',
          'Reiniciar la lectura al bloc 0 quan la persona només vol fer una pausa i continuar.',
        ]}
      >
        <BarraReproductorVeu oberta mostraEspecimen blocsMostra={BLOCS_MOSTRA} />
      </Especimen>
    </>
  );
}
