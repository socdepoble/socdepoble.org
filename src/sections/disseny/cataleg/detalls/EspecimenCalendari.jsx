import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { CalendariEsdeveniments, GraellaMes, Insignia, NavegacioMes, SelectorDataHora } from '../../../../components/PedraSeca/index.js';
import { cursorDe } from '../../../../utils/calendari.js';
import { clauDia, creaEsdeveniment } from '../../../../utils/esdeveniment.js';
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
    </>
  );
}
