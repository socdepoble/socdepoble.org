import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import {
  CalendariEsdeveniments, GraellaMes, Insignia, NavegacioMes, NavegacioPeriode, SelectorDataHora, VistaAgenda, VistaAny, VistaMes, VistaSetmana
} from '../../../../components/PedraSeca/index.js';
import { cursorDe, dosDigits, mouMes } from '../../../../utils/calendari.js';
import { clauDia, creaEsdeveniment } from '../../../../utils/esdeveniment.js';
import { clauDeData, dillunsDe, mouSetmana, sumaDies } from '../../../../utils/periodes.js';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T40 (ordre del Mestre, 260928) · Un sol mes per a la Consola i per a
   l'editor. T6-T8 (260930) · CalendariEsdeveniments hi posa esdeveniments
   del model únic (utils/esdeveniment.js): l'Agenda del Mur, amb els dies
   triables, i la Consola (CalendariMapa), amb la píndola d'estat de cada
   tasca. Després, la peça de base (NavegacioMes i GraellaMes) i, baix, la
   pastilla de data de la barra taronja, que obri el mateix mes en xicotet
   dins de la finestra de la barra (Dialeg lloc="barra"). */
const DIES_AMB_TASCA = new Set([1, 8, 15, 22, 29]);
const res = () => {};
const recompteActes = (n) => (n === 1 ? '1 acte' : `${n} actes`);
const xipDeTasca = (esd) => <div><Insignia to="exit" className="sdp-calendari__pindola">{esd.titol} · viu</Insignia></div>;

/* Esdeveniments de mostra del mes d'avui: de tot el dia (un de dos dies i
   amb un títol llarg), amb hora i setmanal amb RRULE. */
function mostresDelMes({ any, mes }) {
  const dia = (d) => clauDia(any, mes, d);
  return {
    agenda: [
      creaEsdeveniment({ id: 'mercat', titol: 'Mercat de la plaça', inici: { data: dia(1) }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }),
      creaEsdeveniment({ id: 'aplec', titol: 'Aplec pel Territori', inici: { data: dia(12) } }),
      creaEsdeveniment({ id: 'fira', titol: 'Fira de tardor i mostra de productes de l’horta', inici: { data: dia(16) }, fi: { data: dia(18) } }),
      creaEsdeveniment({ id: 'concert', titol: 'Concert de la banda', inici: { dataHora: `${dia(20)}T19:00` } })
    ],
    tasques: [creaEsdeveniment({ id: 'copia', titol: 'copia', inici: { data: dia(1) }, recurrencia: ['RRULE:FREQ=WEEKLY'] })]
  };
}

/* T10 (ordre del Mestre, 261001) · Les mostres de les vistes Setmana i Mes, a
   la setmana de hui perquè es vegen sense navegar: la cadena de solapaments
   (dilluns), dos sense fi a deu minuts (dimarts: publicacions i productes no
   porten fi), un que creua la mitjanit (de dimecres a dijous), un de diversos
   dies que travessa dues setmanes (de divendres a dimarts) i cinc actes el
   mateix dia per al «+N» del mes (dissabte). */
function mostresDeLaSetmana(dilluns) {
  const dia = (n) => clauDeData(sumaDies(dilluns, n));
  const ambHora = (id, titol, n, inici, fi = null, nFi = n) => creaEsdeveniment({
    id, titol, inici: { dataHora: `${dia(n)}T${inici}` }, fi: fi ? { dataHora: `${dia(nFi)}T${fi}` } : null
  });
  return [
    ambHora('cadena-a', 'Assaig de la banda', 0, '09:00', '10:00'),
    ambHora('cadena-b', 'Reunió de la cooperativa', 0, '09:30', '10:30'),
    ambHora('cadena-c', 'Classe de valencià', 0, '10:15', '11:00'),
    ambHora('zero-a', 'El forn obri', 1, '10:00'),
    ambHora('zero-b', 'Mel de romer', 1, '10:10'),
    ambHora('nit', 'Ball de festes', 2, '22:00', '02:00', 3),
    creaEsdeveniment({ id: 'fira-llarga', titol: 'Fira de tardor', inici: { data: dia(4) }, fi: { data: dia(9) } }),
    ...['Mercat', 'Missa', 'Partida de truc', 'Concert', 'Sopar popular'].map((titol, i) => (
      ambHora(`dissabte-${i}`, titol, 5, `${dosDigits(10 + 2 * i)}:00`, `${dosDigits(11 + 2 * i)}:00`)
    ))
  ];
}

/* Fase visual (prompt 261001_0445) · Front Setmana: un acte de cada font per
   al color (classeDeFont) el dijous, dos seguits per a la separació entre
   blocs, una barra de tot el dia de l'agenda (contorn) i una publicació sense
   fi a les 23:56, que es pinta pujada fins a fer l'alçada mínima
   (encaixaFinalDelDia). Llavor neutra. */
function mostresDeFonts(dilluns) {
  const dia = clauDeData(sumaDies(dilluns, 3));
  const acte = (id, titol, tipus, inici, fi = null) => creaEsdeveniment({
    id, titol, font: { tipus }, inici: { dataHora: `${dia}T${inici}` }, fi: fi ? { dataHora: `${dia}T${fi}` } : null
  });
  return [
    acte('font-a', 'Acte A', 'esdeveniment', '09:00', '10:00'),
    acte('font-e', 'Acte E (seguit)', 'esdeveniment', '10:00', '11:00'),
    acte('font-b', 'Producte B', 'producte', '11:30'),
    acte('font-c', 'Pàgina C', 'pagina', '12:30', '14:00'),
    acte('font-d', 'Agenda D', 'agenda', '16:00', '17:30'),
    acte('font-g', 'Publicació G (tard)', 'publicacio', '23:56'),
    creaEsdeveniment({ id: 'font-f', titol: 'Jornada de portes obertes', font: { tipus: 'agenda' }, inici: { data: dia } })
  ];
}

const ETIQUETES_SETMANA = Object.freeze({ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' });
const triaOLleva = (setDia) => (clau) => setDia((ara) => (ara === clau ? null : clau));

/* Fase visual (prompt 261001_0445) · Les mostres de la vista Mes i de la vista
   2 setmanes, a octubre de 2026 (cinc files), amb llavor neutra: un acte de
   cada font (els cinc colors), una barra que ve del mes d'abans, una que
   travessa dues setmanes, cinc actes el dimecres 21 per al «+N» i un acte l'1
   de novembre, que diu «1 de nov.». */
const OCTUBRE_2026 = Object.freeze({ any: 2026, mes: 9 });
const moment = (valor) => (valor.includes('T') ? { dataHora: valor } : { data: valor });
const acteDeMostra = (id, titol, tipus, inici, fi = null, extra = {}) => creaEsdeveniment({
  id, titol, font: { tipus }, inici: moment(inici), fi: fi ? moment(fi) : null, ...extra
});
const MOSTRES_DEL_MES = Object.freeze([
  acteDeMostra('festes', 'Festes del poble', 'esdeveniment', '2026-09-30', '2026-10-04'),
  acteDeMostra('mercat', 'Mercat dels dissabtes', 'publicacio', '2026-10-03T09:00', null, { recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }),
  acteDeMostra('producte', 'Producte B', 'producte', '2026-10-06T10:00'),
  acteDeMostra('fira', 'Fira de tardor', 'esdeveniment', '2026-10-09', '2026-10-14'),
  acteDeMostra('pagina', 'Pàgina C', 'pagina', '2026-10-15'),
  acteDeMostra('agenda', 'Acte de l’agenda', 'agenda', '2026-10-16T18:30', '2026-10-16T20:00'),
  ...['A', 'B', 'C', 'D', 'E'].map((lletra, i) => (
    acteDeMostra(`acte-${lletra}`, `Acte ${lletra}`, i % 2 ? 'publicacio' : 'esdeveniment', `2026-10-21T${dosDigits(9 + 2 * i)}:00`)
  )),
  acteDeMostra('novembre', 'Acte de novembre', 'pagina', '2026-11-01')
]);
const ETIQUETES_DUES_SETMANES = Object.freeze({ anterior: 'Dues setmanes abans', hui: 'Hui', seguent: 'Dues setmanes després' });
const dataCurta = (data) => data.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' });

function MostraVistaMes() {
  const avui = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(OCTUBRE_2026);
  const [dilluns, setDilluns] = useState(() => new Date(2026, 8, 28));
  const [diaAmple, setDiaAmple] = useState(null);
  const [diaEstret, setDiaEstret] = useState(null);
  const [diaSetmanes, setDiaSetmanes] = useState(null);
  const nomMes = new Date(cursor.any, cursor.mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  return (
    <>
      <h4>Vista mes (octubre de 2026: cinc files)</h4>
      <p>{diaAmple ? `Dia triat: ${diaAmple}. El «+N més» és el mateix botó del dia.` : 'Cap dia triat: el «+N més» és el botó del dia.'}</p>
      <NavegacioPeriode titol={nomMes} onAnterior={() => setCursor((c) => mouMes(c, -1))} onHui={() => setCursor(cursorDe(avui))}
        onSeguent={() => setCursor((c) => mouMes(c, 1))} />
      <VistaMes esdeveniments={MOSTRES_DEL_MES} cursor={cursor} avui={avui} locale="ca-ES" titol="Mes del poble (espècimen)"
        diaTriat={diaAmple} onTriaDia={triaOLleva(setDiaAmple)} />

      <h4>Vista mes en un contenidor estret (mode compacte)</h4>
      <p>Per davall de 41,5em del contenidor: tires i punts sense text i «+N». La cel·la sencera continua sent el botó del dia.</p>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <VistaMes esdeveniments={MOSTRES_DEL_MES} cursor={OCTUBRE_2026} avui={avui} locale="ca-ES" titol="Mes del poble en estret (espècimen)"
          diaTriat={diaEstret} onTriaDia={triaOLleva(setDiaEstret)} />
      </div>

      <h4>Vista 2 setmanes</h4>
      <NavegacioPeriode etiquetes={ETIQUETES_DUES_SETMANES} titol={`${dataCurta(dilluns)} – ${dataCurta(sumaDies(dilluns, 13))}`}
        onAnterior={() => setDilluns((d) => mouSetmana(d, -2))} onHui={() => setDilluns(dillunsDe(avui))}
        onSeguent={() => setDilluns((d) => mouSetmana(d, 2))} />
      <VistaMes esdeveniments={MOSTRES_DEL_MES} dilluns={dilluns} setmanes={2} avui={avui} locale="ca-ES" titol="Dues setmanes del poble (espècimen)"
        diaTriat={diaSetmanes} onTriaDia={triaOLleva(setDiaSetmanes)} />

      <h4>«+N» amb dos carrils, densitat compacta i dies quiets</h4>
      <p>Sense onTriaDia els dies no són botons i el lector llig el recompte i els títols de cada dia. La densitat compacta només abaixa les cel·les amb ratolí.</p>
      <VistaMes esdeveniments={MOSTRES_DEL_MES} cursor={OCTUBRE_2026} avui={avui} locale="ca-ES" titol="Mes del poble amb dos carrils (espècimen)"
        maxCarrils={2} densitat="compacta" />
    </>
  );
}

function MostraVistes() {
  const avui = useMemo(() => new Date(), []);
  const mostres = useMemo(() => mostresDeLaSetmana(dillunsDe(avui)), [avui]);
  const ambFonts = useMemo(() => [...mostres, ...mostresDeFonts(dillunsDe(avui))], [mostres, avui]);
  const senseNit = useMemo(() => ambFonts.filter((esd) => esd.id !== 'nit' && esd.id !== 'font-g'), [ambFonts]);
  const [dilluns, setDilluns] = useState(() => dillunsDe(avui));
  const [diaSetmana, setDiaSetmana] = useState(null);
  const [diaTira, setDiaTira] = useState(() => clauDeData(sumaDies(dillunsDe(avui), 5)));
  const [diaCompacta, setDiaCompacta] = useState(null);
  const [vista, setVista] = useState('setmana');
  return (
    <>
      <h4>Vista setmana · ampla</h4>
      <p>{diaSetmana ? `Dia triat: ${diaSetmana}. Torna’l a clicar per a llevar-lo.` : 'Cap dia triat.'} La cadena de solapaments és el dilluns; els actes sense fi, el dimarts; el que creua la mitjanit, de dimecres a dijous (per això la graella va de 0 a 24); els colors de cada font, el dijous, que acaba amb una publicació sense fi a les 23:56, pintada des de les 23:30 perquè faça l’alçada mínima (el text diu l’hora real); el de diversos dies, a la franja des del divendres.</p>
      <NavegacioPeriode etiquetes={ETIQUETES_SETMANA} titol={`Setmana del ${dilluns.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        onAnterior={() => setDilluns((d) => mouSetmana(d, -1))} onHui={() => setDilluns(dillunsDe(avui))}
        onSeguent={() => setDilluns((d) => mouSetmana(d, 1))} />
      <VistaSetmana esdeveniments={ambFonts} dilluns={dilluns} avui={avui} locale="ca-ES" titol="Setmana del poble (espècimen)"
        diaTriat={diaSetmana} onTriaDia={triaOLleva(setDiaSetmana)} />

      <h4>Vista setmana · tira estreta (mòbil)</h4>
      <p>La mateixa setmana en un contenidor estret: el component mesura la seua amplada i, per davall de 41,5em, pinta la tira (set botons de dia enganxosos, un punt als dies amb actes i la graella d’un sol dia). Ix el dissabte, amb la barra de diversos dies oberta pels dos costats; tocar el dia mostrat no el lleva.</p>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <VistaSetmana esdeveniments={ambFonts} dilluns={dillunsDe(avui)} avui={avui} locale="ca-ES" titol="Setmana del poble en tira (espècimen)"
          diaTriat={diaTira} onTriaDia={triaOLleva(setDiaTira)} />
      </div>

      <h4>Vista setmana · densitat compacta</h4>
      <p>Sense l’acte de nit ni el de les 23:56, el rang és el de per defecte, de 7 a 22; només s’estén per a fer cabre la línia d’«ara» si el mires de matinada o de nit. La densitat compacta abaixa l’hora i els carrils només amb ratolí (en una pantalla tàctil es veu com la normal), i els blocs canvien de forma amb els seus llindars: el d’una hora i mitja, títol de dues línies i interval.</p>
      <VistaSetmana esdeveniments={senseNit} dilluns={dillunsDe(avui)} avui={avui} locale="ca-ES" titol="Setmana del poble compacta (espècimen)"
        densitat="compacta" diaTriat={diaCompacta} onTriaDia={triaOLleva(setDiaCompacta)} />

      <MostraVistaMes />

      <MostraAgendaIAny />

      <h4>NavegacioPeriode · «Hui», fletxes, títol i selector de vista</h4>
      <p>L’ordre de les captures: «Hui» (secundari), les fletxes (fantasma, 44×44, amb el nom del pas de la vista triada), el títol del període i el selector de les cinc vistes. En un contenidor estret la barra s’apila sola.</p>
      <NavegacioPeriode etiquetes={ETIQUETES_PER_VISTA[vista]} titol={`Vista ${NOMS_DE_VISTA[vista].toLowerCase()} (espècimen)`}
        onAnterior={res} onHui={res} onSeguent={res} vista={vista} onCanviaVista={setVista} />
      <p>Vista triada: {NOMS_DE_VISTA[vista]}. Fletxa enrere: «{ETIQUETES_PER_VISTA[vista].anterior}».</p>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <NavegacioPeriode etiquetes={ETIQUETES_PER_VISTA[vista]} titol="En un contenidor estret" onAnterior={res} onHui={res} onSeguent={res}
          vista={vista} onCanviaVista={setVista} />
      </div>
    </>
  );
}

/* Fase visual (prompt 261001_0445) · Front Agenda, Any i navegació. Llavor
   neutra a partir de hui, perquè es vegen hui en cercle, la línia d'«ara» i
   els cinc colors sense navegar: un acte de cada font, un de tot el dia, un
   que passa de mitjanit, un de diversos dies i el mercat de cada dissabte. */
const NOMS_DE_VISTA = Object.freeze({ setmana: 'Setmana', 'dues-setmanes': 'Dues setmanes', mes: 'Mes', any: 'Any', agenda: 'Agenda' });
const ETIQUETES_PER_VISTA = Object.freeze({
  setmana: ETIQUETES_SETMANA,
  'dues-setmanes': Object.freeze({ anterior: 'Dues setmanes anteriors', hui: 'Hui', seguent: 'Dues setmanes següents' }),
  mes: Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' }),
  any: Object.freeze({ anterior: 'Any anterior', hui: 'Hui', seguent: 'Any següent' }),
  agenda: Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' })
});
function mostresDeLAgenda(avui) {
  const dia = (n) => clauDeData(sumaDies(avui, n));
  const acte = (id, titol, tipus, inici, fi = null, extra = {}) => creaEsdeveniment({
    id, titol, font: tipus ? { tipus } : null, inici: inici.includes('T') ? { dataHora: inici } : { data: inici },
    fi: fi ? (fi.includes('T') ? { dataHora: fi } : { data: fi }) : null, ...extra
  });
  return [
    acte('agenda-a', 'Acte A', 'esdeveniment', `${dia(0)}T09:00`, `${dia(0)}T10:00`),
    acte('agenda-b', 'Producte B', 'producte', `${dia(0)}T18:30`),
    acte('agenda-c', 'Pàgina C', 'pagina', dia(0)),
    acte('agenda-d', 'Acte de l’agenda', 'agenda', `${dia(2)}T19:00`, `${dia(2)}T21:00`),
    acte('agenda-ball', 'Ball de festes', 'esdeveniment', `${dia(3)}T22:00`, `${dia(4)}T02:00`),
    acte('agenda-fira', 'Fira de tardor', 'esdeveniment', dia(5), dia(8)),
    acte('agenda-mercat', 'Mercat dels dissabtes', null, dia(0), null, { recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] })
  ];
}

function MostraAgendaIAny() {
  const avui = useMemo(() => new Date(), []);
  const mostres = useMemo(() => mostresDeLAgenda(avui), [avui]);
  const desde = useMemo(() => sumaDies(avui, 0), [avui]);
  const fins = useMemo(() => sumaDies(avui, 21), [avui]);
  const [any, setAny] = useState(() => avui.getFullYear());
  const [diaObert, setDiaObert] = useState(null);
  return (
    <>
      <h4>Vista agenda</h4>
      <p>Tres setmanes des de hui (a /calendari, el mes, des de hui si és el mes en curs). Només els dies amb actes; hui en cercle invers i, dins del seu grup, la línia d’«ara»; el punt de cada fila porta el color de la seua font (l’agenda de Sollutia, en anell).</p>
      <VistaAgenda esdeveniments={mostres} desde={desde} fins={fins} avui={avui} locale="ca-ES" titol="Agenda del poble (espècimen)" />

      <h4>Vista agenda en un contenidor estret</h4>
      <p>La mateixa llista. Quan no hi caben la data (7rem) i les files (16rem), la data passa damunt sense cap media query: en un mòbil de 375px passa sempre; en esta mostra de 28rem encara hi caben.</p>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <VistaAgenda esdeveniments={mostres} desde={desde} fins={fins} avui={avui} locale="ca-ES" titol="Agenda del poble en estret (espècimen)" />
      </div>
      <VistaAgenda esdeveniments={[]} desde={desde} fins={fins} avui={avui} locale="ca-ES" titol="Agenda buida (espècimen)"
        buit="Cap acte en estes tres setmanes." />

      <h4>Vista any</h4>
      <p>{diaObert ? `Dia obert: ${diaObert}. A /calendari, el dia obri la seua setmana.` : 'Cap dia obert: a /calendari, el dia obri la seua setmana.'} Tot l’any és un sol punt de tabulació; les fletxes es mouen pels dies.</p>
      <NavegacioPeriode etiquetes={ETIQUETES_PER_VISTA.any} titol={String(any)}
        onAnterior={() => setAny((a) => a - 1)} onHui={() => setAny(avui.getFullYear())} onSeguent={() => setAny((a) => a + 1)} />
      <VistaAny esdeveniments={mostres} any={any} avui={avui} locale="ca-ES" titol={`Any ${any} del poble (espècimen)`}
        diaTriat={diaObert} onTriaDia={setDiaObert} />

      <h4>Vista any en un contenidor estret</h4>
      <p>La graella auto-fill posa un mes per fila: cap dia baixa dels 44px. Sense onTriaDia, els dies són quiets.</p>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <VistaAny esdeveniments={mostres} any={avui.getFullYear()} avui={avui} locale="ca-ES" titol="Any del poble en estret (espècimen)" />
      </div>
    </>
  );
}

export default function EspecimenCalendari() {
  const [cursor, setCursor] = useState(() => cursorDe());
  const [diaTriat, setDiaTriat] = useState(null);
  const [data, setData] = useState(null);
  const mostres = useMemo(() => mostresDelMes(cursorDe()), []);
  return (
    <>
    <Llinatge id="calendari" />
    <Especimen id="calendari" nom="Calendari · CalendariEsdeveniments, NavegacioMes, GraellaMes i SelectorDataHora"
      fitxer="src/components/PedraSeca/organismes/CalendariEsdeveniments.jsx · CalendariMes.jsx · SelectorDataHora.jsx"
      descripcio="El mes de calendari de Pedra Seca. CalendariEsdeveniments el pinta gran amb esdeveniments del model únic (compatible amb iCalendar i Google Calendar): l’Agenda del Mur, amb els dies triables, i la Consola, amb les tasques de cada dia. L’editor el pinta en xicotet dins de la finestra flotant de la barra taronja per a triar el dia i l’hora de publicació. El marcatge és el mateix: una taula amb nom, caption i dies de la setmana abreujats (abbr amb el nom llarg)."
      contracte={[
        ['CalendariEsdeveniments.esdeveniments', 'Esdeveniment[] (creaEsdeveniment)', '—','Qualsevol font (el Mur, el Mapa, Google, un .ics) passa pel mateix model; l’organisme no sap d’on ve.'],
        ['CalendariEsdeveniments.cursor / onCanviaCursor / cursorInicial', '{ any, mes } / (cursor) => void / { any, mes }', 'el mes d’avui', 'Controlat o no: sense cursor, porta el mes sol.'],
        ['CalendariEsdeveniments.diaTriat / onTriaDia', '\'AAAA-MM-DD\' | null / (clau) => void', 'null', 'Amb onTriaDia, cada dia és un botó (l’Agenda del Mur el porta a ?date=); sense, la cel·la és quieta (la Consola).'],
        ['CalendariEsdeveniments.renderEsdeveniment', '(esd) => node', 'la píndola amb el títol', 'La Consola hi posa la seua Insignia d’estat amb la classe sdp-calendari__pindola.'],
        ['CalendariEsdeveniments.navegacioClassName / children', 'string / node', '—', 'La barra «‹ Hui ›» i la ranura entre la barra i la graella (l’avís de mes buit).'],
        ['NavegacioMes.cursor / onCanvia', '{ any, mes } / (cursor) => void', '—', '«‹ Hui ›»: mes anterior, el de hui i el següent.'],
        ['NavegacioMes.className', 'string', '—', 'La barra que la conté (sdp-consola__capcal a la Consola).'],
        ['GraellaMes.any / mes / locale', 'number / 0–11 / string', '—', 'El mes que es pinta i la llengua del caption.'],
        ['GraellaMes.renderDia', '(dia, { esAvui, numero }) => node', 'el número', 'El contingut de cada cel·la. `numero` porta <strong> i « (hui)» per al lector.'],
        ['GraellaMes.compacta', 'boolean', 'false', 'El mes en xicotet (sense ratlles ni fons de fila).'],
        ['SelectorDataHora.valor / onTria', 'ISO | null / (iso | null) => void', 'null', 'Triar un dia desa ja i la finestra continua oberta per a l’hora.'],
        ['SelectorDataHora.reserva', '{ time, date }', 'null', 'El que diu la pastilla sense data triada. Sense reserva, la data i l’hora d’ara (T51): mai buida. En edició (decisió del Mestre, 260928) la pastilla diu la data triada al calendari o, si no n’hi ha, la d’ara; mai la de l’última edició.'],
        ['SelectorDataHora.avisFutur', 'string | null', 'avís honest', 'Una data futura no programa res: es diu.'],
        ['SelectorDataHora.avisDesament', 'string | null', 'null', 'Quan la data no es desa com la resta (columna en quarantena): la descripció deixa de prometre-ho i l’avís ho explica.'],
      ]}
      a11y={[
        'La graella és una taula de veres: regió amb nom, caption i capçaleres amb abbr.',
        'A l’Agenda, cada dia és un botó que ocupa la cel·la (almenys 44px), amb aria-pressed i un nom amb la data llarga, el recompte i els títols; les píndoles no són interactives.',
        'En pantalla estreta les píndoles es fan punts: el text s’amaga a la vista però el lector de pantalla el continua llegint.',
        'Al selector, cada dia és un botó de 44px amb el nom llarg (dilluns, 28 de setembre de 2026); el triat porta aria-pressed i hui, aria-current="date".',
        'La pastilla és un <button aria-haspopup="dialog"> amb nom complet; Escape tanca i el focus torna a la pastilla.',
        'Si la barra que conté la pastilla s’amaga amb la finestra oberta (mòbil, columna estreta), la finestra es tanca: cap modal sense caixa deixa la pàgina inert.',
        'El camp d’hora té etiqueta visible i és un input type="time" natiu (roda nativa en iOS).',
      ]}
      fes={['Un sol mes per a tota l’app: la Consola, l’Agenda i l’editor fan servir les mateixes peces.', 'Passar cada font pel model d’esdeveniment abans de pintar-la.', 'Dir que una data futura no programa la publicació.']}
      noFacis={['Portar les tasques del Mapa (dades de la màquina del Mestre) a l’Agenda del Mur: es reaprofita l’organisme, mai les dades.', 'Un popover que es tanca en clicar dins (el Dropdown ho fa): per a contingut interactiu, la finestra de la barra.', 'Prometre que la publicació ixirà sola a l’hora triada.']}>

      <h4>Agenda del Mur (dies triables)</h4>
      <p>{diaTriat ? `Dia triat: ${diaTriat}. Torna’l a clicar per a llevar-lo.` : 'Cap dia triat: les targetes de davall serien totes les de l’agenda.'}</p>
      <CalendariEsdeveniments esdeveniments={mostres.agenda} locale="ca-ES" titol="Agenda del poble (espècimen)"
        navegacioClassName="sdp-calendari__barra" recompte={recompteActes}
        diaTriat={diaTriat} onTriaDia={(clau) => setDiaTriat((ara) => (ara === clau ? null : clau))} />

      <h4>Consola (la píndola d’estat de cada tasca)</h4>
      <CalendariEsdeveniments esdeveniments={mostres.tasques} locale="ca-ES"
        navegacioClassName="sdp-consola__capcal" renderEsdeveniment={xipDeTasca} />

      <h4>La peça de base (NavegacioMes i GraellaMes, sense variant)</h4>
      <NavegacioMes className="sdp-consola__capcal" cursor={cursor} onCanvia={setCursor} />
      <GraellaMes any={cursor.any} mes={cursor.mes} locale="ca-ES"
        renderDia={(dia, { numero }) => (
          <>
            {numero}
            {DIES_AMB_TASCA.has(dia) ? <div><Insignia to="exit">copia · viu</Insignia></div> : null}
          </>
        )} />

      <h4>Editor (la pastilla de la barra taronja obri el mes en xicotet)</h4>
      <p>Sense data triada, la pastilla diu la data i l’hora d’ara; en triar un dia, diu el triat.</p>
      {/* T51 · La barra taronja de veres (BarraTaronja), no una còpia a mà. És
          d'edició: al centre, el botó d'emoticona (la ploma blanca). */}
      <div className="sdp-especimen__barres">
        <BarraTaronja authorName="Sóc de Poble" authorLocation="La Torre de les Maçanes"
          authorAvatar="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg" etiqueta="Autoria i data (espècimen)"
          onObriEmoticona={res}
          barActions={<SelectorDataHora valor={data} onTria={setData} />} />
      </div>
    </Especimen>

    {/* T10 (ordre del Mestre, 261001) · Pedra Seca §9: l'esquelet de les
        vistes Setmana i Mes existix ací abans que /calendari el munte (només
        amb ?vista=setmana o ?vista=mes). Maqueta: estructura i posicionament,
        sense colors definitius fins a les captures del Mestre. */}
    <Especimen id="calendari-vistes" nom="Vistes del calendari · VistaSetmana, VistaMes, VistaAgenda, VistaAny i NavegacioPeriode"
      fitxer="src/components/PedraSeca/organismes/VistaSetmana.jsx · VistaMes.jsx · VistaAgenda.jsx · VistaAny.jsx · NavegacioPeriode.jsx"
      descripcio="L’esquelet de les vistes de Google Calendar. La setmana: set dies, la franja de tot el dia i la graella de 24 h amb cada acte al seu minut, en columnes quan se solapen i amb una alçada mínima quan no té fi. El mes: les setmanes justes (de 4 a 6) o N setmanes des d’un dilluns (la vista 2 setmanes), una barra per setmana per als actes de diversos dies, «● HH:MM Títol» per als actes amb hora i «+N més» quan un dia no hi cap; en un contenidor estret, tires i punts sense text. Les ocurrències surten de la mateixa regla que el calendari del Mur (ocurrenciesEnRang), i el posicionament, de propietats CSS escrites des d’una ref: cap style en JSX."
      contracte={[
        ['VistaSetmana.esdeveniments / dilluns', 'Esdeveniment[] / Date', '—', 'Els actes del model i qualsevol dia de la setmana que es pinta.'],
        ['VistaSetmana.diaTriat / onTriaDia', '\'AAAA-MM-DD\' | null / (clau) => void', 'null', 'Amb onTriaDia, cada capçalera de dia és un botó (a /calendari, el ?date=); sense, és quieta. En la tira, el dia triat de la setmana és el que es mostra, i tornar-lo a tocar no el lleva.'],
        ['VistaSetmana.densitat', '\'responsiva\' | \'normal\' | \'compacta\'', '\'responsiva\'', 'Responsiva i normal: hora de 3rem. Compacta: hora de 2,5rem i blocs sense farciment, només amb ratolí (@media (pointer: fine)); la forma dels blocs seguix els seus llindars (formaDelBloc: 54, 78 i 102 minuts en lloc de 50, 70 i 90).'],
        ['VistaSetmana (mode)', 'l’amplada del contenidor', 'set columnes', 'Per davall de 41,5em del contenidor (useAmpladaContenidor), la tira: set botons de dia enganxosos i la graella d’un sol dia (el triat, hui o el dilluns). Cap media query de viewport.'],
        ['VistaSetmana.minimMinuts', 'number', '30', 'L’alçada mínima d’un acte sense fi (publicacions i productes); el solapament es calcula amb ella. Un acte massa tardà per a fer-la abans de mitjanit es pinta pujat (encaixaFinalDelDia), amb l’hora real.'],
        ['VistaSetmana.ara', 'Date | null', 'el rellotge', 'La línia d’«ara», només la setmana de hui; sense, baixa cada minut (useAra). El rang d’hores (de 7 a 22, estés fins als actes) la fa cabre sempre.'],
        ['VistaMes.esdeveniments / cursor', 'Esdeveniment[] / { any, mes }', '—', 'Els actes i el mes (amb dilluns, opcional).'],
        ['VistaMes.setmanes', '\'justes\' | number', '\'justes\'', 'Les setmanes que toquen el mes (de 4 a 6 files, totes de la mateixa alçada) o un nombre fix (6, la graella de sempre).'],
        ['VistaMes.dilluns', 'Date | null', 'null', 'La vista 2 setmanes: `setmanes` setmanes (2 per defecte) des del dilluns de la seua setmana, sense cap dia atenuat; cada dia 1 hi diu el mes («1 d’oct.»).'],
        ['VistaMes.diaTriat / onTriaDia', '\'AAAA-MM-DD\' | null / (clau) => void', 'null', 'Cada dia és un botó; el «+N més» és dins del mateix botó.'],
        ['VistaMes.maxCarrils', 'number', '3 (6 amb dilluns)', 'Els carrils que caben en un dia; si no hi cap, l’últim diu «+N més».'],
        ['VistaMes.densitat', '\'responsiva\' | \'normal\' | \'compacta\'', '\'responsiva\'', 'Responsiva: compacte en un contenidor de menys de 41,5em (tires i punts sense text, «+N»). Normal: mai compacte. Compacta: com la responsiva i, amb ratolí, cel·les més baixes.'],
        ['VistaAgenda.esdeveniments / desde / fins', 'Esdeveniment[] / Date / Date', '—', 'L’agenda del rang [desde, fins): només els dies amb actes. A /calendari, el mes, des de hui si és el mes en curs (o des del dia triat, si és anterior). Un acte de 24 h o més diu «Tot el dia» a cada dia, com la franja de VistaSetmana.'],
        ['VistaAgenda.avui / ara', 'Date / Date | null', 'hui / el rellotge', 'Hui en cercle invers; la línia d’«ara», davant del primer acte del dia que encara no ha començat (useAra si no se’n passa cap).'],
        ['VistaAgenda.buit / nivellTitol', 'string / 2–6', 'avís honest / 3', 'El text sense cap acte i el nivell de l’encapçalament de cada dia.'],
        ['VistaAny.esdeveniments / any', 'Esdeveniment[] / number', '—', 'Dotze mesos de sis setmanes; un punt als dies amb actes (ocurrenciesDeLaLlista de tot l’any).'],
        ['VistaAny.onTriaDia / diaTriat', '(clau) => void / \'AAAA-MM-DD\' | null', '—', 'Amb onTriaDia, cada dia és un botó (a /calendari obri la setmana del dia: ?vista=setmana&date=…); el triat es marca. Sense, quiets.'],
        ['VistaAny (columnes)', 'l’amplada del contenidor', 'auto-fill', 'Un mes fa almenys set dies de 44px en tàctil i de 2rem amb ratolí: 4, 3, 2 o 1 mesos per fila sense cap media query de viewport.'],
        ['NavegacioPeriode.onAnterior / onHui / onSeguent / etiquetes', '() => void / { anterior, hui, seguent }', 'les del mes', 'Les fletxes no saben què és un període: ho diu qui la munta. L’ordre és el de les captures: «Hui», ‹, ›, títol i vista.'],
        ['NavegacioPeriode.vista / onCanviaVista / vistes / etiquetaVistes', 'string / (valor) => void / [{ valor, text }] / string', 'les cinc vistes / «Vista»', 'El selector (PillToggle): Setmana, Dues setmanes, Mes, Any i Agenda; sense onCanviaVista no n’hi ha.'],
      ]}
      a11y={[
        'La setmana: cada dia és una llista ordenada amb el nom del dia, i cada acte diu l’hora i el títol (en este ordre per al lector, encara que a la vista vaja primer el títol; un bloc curt només mostra l’inici i la fi queda per al lector); la franja és la llista «Tot el dia».',
        'A la tira de la setmana, el dia mostrat és el botó premut (aria-pressed) i la llista de la graella porta el seu nom; el punt de «té actes» és aria-hidden, perquè el nom del botó ja diu el recompte.',
        'Les capçaleres de dia (setmana) i els dies (mes) són botons d’almenys 44px amb aria-pressed, aria-current="date" per a hui i un nom amb la data llarga, el recompte i els títols; al mes, també el «+N més» que es veu (el nom conté el text visible, WCAG 2.5.3).',
        'Les barres del mes són aria-hidden: ho diu el nom del dia o, sense onTriaDia, el text per al lector de cada dia. Els blocs i les barres no són interactius; els enllaços viuen a les targetes.',
        'La línia d’«ara» és aria-hidden; el títol del període de la navegació és aria-live="polite".',
        'L’agenda: cada dia és un encapçalament amb la data llarga (la curta, «oct., dj.», és aria-hidden) i una llista ordenada que s’hi referix; hui porta aria-current="date" i « (hui)» per al lector. Les files no són interactives.',
        'L’any: cada mes és una taula amb el seu nom; els dies dels mesos veïns són aria-hidden i no són botons. Tot l’any és un sol punt de tabulació i les fletxes es mouen pels dies (el lector ho sap per la descripció de la regió); el nom de cada dia diu la data llarga, el recompte i, si escau, «dia triat».',
        'La navegació: les fletxes són botons d’icona de 44×44 amb el nom del pas («Any anterior»); al selector, la vista premuda porta aria-pressed i, a més del color, el subratllat.',
      ]}
      fes={['Passar cada font pel model d’esdeveniment i per ocurrenciesEnRang: la graella i la llista no poden discrepar.', 'Posicionar amb propietats CSS des d’una ref (usePropietatsCss).', 'Deixar que la graella de 24 h cresca dins del visor.']}
      noFacis={['Tocar GraellaMes, NavegacioMes o CalendariEsdeveniments per a fer estes vistes: el Mur, la Consola i l’editor no han de canviar ni un píxel.', 'Un scroll propi a la graella de 24 h.', 'Sumar 86400000 per a passar de dia: el canvi d’hora en fa de 23 i de 25 hores.']}>
      <MostraVistes />
    </Especimen>
    </>
  );
}
