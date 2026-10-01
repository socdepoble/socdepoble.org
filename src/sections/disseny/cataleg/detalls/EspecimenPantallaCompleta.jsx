import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import {
  BotoPantallaCompleta, NavegacioMes, NavegacioPeriode, PantallaCompleta, usePantallaCompleta
} from '../../../../components/PedraSeca/index.js';
import { cursorDe } from '../../../../utils/calendari.js';

/* Ordre del Mestre, 261001 · «Botó de Pantalla Completa al Calendari». Pedra
   Seca §9: l'organisme existix ací abans que /calendari el munte. El botó
   d'entrar amb les dues pells de /calendari (fantasma a la navegació de les
   vistes, secundari a la barra «‹ Hui ›» del calendari d'ara) i, darrere de
   cada un, una pantalla completa viva amb contingut de mostra. */
const res = () => {};
const TITOL = 'Mostra a pantalla completa';

function ContingutDeMostra() {
  return (
    <>
      <h4>Contingut de mostra</h4>
      <p>A pantalla completa, la barra lateral i les barres de dalt de Sóc de Poble queden tapades i inerts. Només fa scroll esta zona; la franja amb «Eixir» es queda a dalt.</p>
      <ul>
        <li>Escape també ix.</li>
        <li>En eixir, el focus torna al botó que l’ha obert.</li>
        <li>Un clic fora del contingut no tanca res.</li>
      </ul>
    </>
  );
}

/* La pell fantasma, dins d'una NavegacioPeriode (les vistes noves): entre el
   títol i el selector. */
function MostraFantasma() {
  const pantalla = usePantallaCompleta();
  const [vista, setVista] = useState('setmana');
  const boto = pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} />;
  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL}>
      <NavegacioPeriode titol="Vista de mostra" onAnterior={res} onHui={res} onSeguent={res}
        vista={vista} onCanviaVista={setVista} accions={boto} />
      <ContingutDeMostra />
    </PantallaCompleta>
  );
}

/* La pell secundària, la dels veïns «‹ Hui ›» (sdp-calendari__barra, el
   calendari d'ara), al final de la fila. */
function MostraSecundaria() {
  const pantalla = usePantallaCompleta();
  const [cursor, setCursor] = useState(() => cursorDe());
  const boto = pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} varietat="secundari" />;
  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL}>
      <NavegacioMes className="sdp-calendari__barra" cursor={cursor} onCanvia={setCursor} accions={boto} />
      <ContingutDeMostra />
    </PantallaCompleta>
  );
}

export default function EspecimenPantallaCompleta() {
  return (
    <Especimen id="pantalla-completa" nom="PantallaCompleta · BotoPantallaCompleta"
      fitxer="src/components/PedraSeca/organismes/PantallaCompleta.jsx · hooks/usePantallaCompleta.js"
      descripcio="Un bloc de la pàgina a tota la caixa de l’App. És el Dialeg de mida completa i sense marc: a la SPA viu a la capa superior i tapa la barra lateral, la negra, la blava i la navegació mòbil; dins d’un amfitrió (WordPress) ocupa només la caixa que l’amfitrió reserva a l’App. Tancada no afig cap node: els fills es pinten com sempre. L’estat és efímer (no va a la URL) i viu a qui munta la pàgina."
      contracte={[
        ['PantallaCompleta.oberta / onTanca', "boolean / (motiu: 'esc'|'boto') => void", '—', 'Controlat pel pare (usePantallaCompleta). Un clic al fons no tanca; el doble Escape del navegador també avisa amb «esc».'],
        ['PantallaCompleta.titol', 'string', '—', 'Obligatori: és el nom accessible del diàleg («Calendari a pantalla completa»).'],
        ['PantallaCompleta.etiquetaEixir', 'string', "'Eixir'", 'El text visible del botó de la franja; el lector hi afig « de la pantalla completa».'],
        ['PantallaCompleta.children', 'node', '—', 'Tancada, en línia i sense embolcall. Oberta, dins del visor, muntats quan el diàleg ja és obert (les vistes mesuren l’amplada real).'],
        ['BotoPantallaCompleta.id / onClick', 'string / (event) => void', '—', 'El id és el de usePantallaCompleta (idObridor): el focus hi torna en eixir.'],
        ['BotoPantallaCompleta.varietat / className', "'fantasma'|'secundari' / string", "'fantasma'", 'La pell dels veïns: fantasma a la navegació de les vistes, secundari a la barra «‹ Hui ›».'],
        ['usePantallaCompleta()', '{ oberta, obri, tanca, idObridor }', '—', 'obri guarda l’arrel del clic (Document o ShadowRoot) per a tornar-hi el focus.'],
      ]}
      a11y={[
        'El botó d’entrar és un botó d’icona de 44×44 amb el nom «Pantalla completa» i aria-haspopup="dialog".',
        'A la SPA, showModal(): la resta de la pàgina queda inert. Dins d’un amfitrió, la capa local posa inert i aria-hidden als germans i el Tab no ix del diàleg.',
        'El focus comença a «Eixir» (aria-keyshortcuts="Escape"), el primer control del diàleg; el seu nom és «Eixir de la pantalla completa».',
        'En eixir, el focus torna al botó d’entrar.',
      ]}
      fes={['Posar el botó d’entrar a la barra de navegació del bloc, amb la pell dels seus veïns.', 'Deixar l’estat a qui munta la pàgina, per damunt del que es refresca.']}
      noFacis={['Amagar la closca amb CSS que conega la seua estructura: el Dialeg ja la tapa.', 'Guardar el mode a la URL: recarregar o compartir l’enllaç obri en mode normal.', 'La Fullscreen API: a l’iPhone no existix per a elements.']}>
      <h4>Pell fantasma (navegació de les vistes)</h4>
      <MostraFantasma />
      <h4>Pell secundària (barra «‹ Hui ›»)</h4>
      <MostraSecundaria />
    </Especimen>
  );
}
