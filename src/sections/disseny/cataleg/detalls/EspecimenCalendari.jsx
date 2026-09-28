import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { GraellaMes, Insignia, NavegacioMes, SelectorDataHora } from '../../../../components/PedraSeca/index.js';
import { cursorDe } from '../../../../utils/calendari.js';

/* T40 (ordre del Mestre, 260928) · Un sol mes per a la Consola i per a
   l'editor. Dalt, la variant de la Consola (CalendariMapa): navegació «‹ Hui ›»
   i la graella amb el que passa cada dia. Baix, la pastilla de data de la
   barra taronja, que obri el mateix mes en xicotet dins de la finestra de
   la barra (Dialeg lloc="barra"). */
const DIES_AMB_TASCA = new Set([1, 8, 15, 22, 29]);

export default function EspecimenCalendari() {
  const [cursor, setCursor] = useState(() => cursorDe());
  const [data, setData] = useState(null);
  return (
    <Especimen id="calendari" nom="Calendari · NavegacioMes, GraellaMes i SelectorDataHora"
      fitxer="src/components/PedraSeca/organismes/CalendariMes.jsx · SelectorDataHora.jsx"
      descripcio="El mes de calendari de Pedra Seca. La Consola el pinta gran, amb les tasques de cada dia; l’editor el pinta en xicotet dins de la finestra flotant de la barra taronja per a triar el dia i l’hora de publicació. El marcatge és el mateix: una taula amb nom, caption i dies de la setmana abreujats (abbr amb el nom llarg)."
      contracte={[
        ['NavegacioMes.cursor / onCanvia', '{ any, mes } / (cursor) => void', '—', '«‹ Hui ›»: mes anterior, el de hui i el següent.'],
        ['NavegacioMes.className', 'string', '—', 'La barra que la conté (sdp-consola__capcal a la Consola).'],
        ['GraellaMes.any / mes / locale', 'number / 0–11 / string', '—', 'El mes que es pinta i la llengua del caption.'],
        ['GraellaMes.renderDia', '(dia, { esAvui, numero }) => node', 'el número', 'El contingut de cada cel·la. `numero` porta <strong> i « (hui)» per al lector.'],
        ['GraellaMes.compacta', 'boolean', 'false', 'El mes en xicotet (sense ratlles ni fons de fila).'],
        ['SelectorDataHora.valor / onTria', 'ISO | null / (iso | null) => void', 'null', 'Triar un dia desa ja i la finestra continua oberta per a l’hora.'],
        ['SelectorDataHora.reserva', '{ time, date }', 'null', 'El que diu la pastilla sense data triada (a l’editor, l’última edició).'],
        ['SelectorDataHora.avisFutur', 'string | null', 'avís honest', 'Una data futura no programa res: es diu.'],
        ['SelectorDataHora.avisDesament', 'string | null', 'null', 'Quan la data no es desa com la resta (columna en quarantena): la descripció deixa de prometre-ho i l’avís ho explica.'],
      ]}
      a11y={[
        'La graella és una taula de veres: regió amb nom, caption i capçaleres amb abbr.',
        'Cada dia és un botó de 44px amb el nom llarg (dilluns, 28 de setembre de 2026); el triat porta aria-pressed i hui, aria-current="date".',
        'La pastilla és un <button aria-haspopup="dialog"> amb nom complet; Escape tanca i el focus torna a la pastilla.',
        'Si la barra que conté la pastilla s’amaga amb la finestra oberta (mòbil, columna estreta), la finestra es tanca: cap modal sense caixa deixa la pàgina inert.',
        'El camp d’hora té etiqueta visible i és un input type="time" natiu (roda nativa en iOS).',
      ]}
      fes={['Un sol mes per a tota l’app: la Consola i l’editor fan servir la mateixa peça.', 'Dir que una data futura no programa la publicació.']}
      noFacis={['Un popover que es tanca en clicar dins (el Dropdown ho fa): per a contingut interactiu, la finestra de la barra.', 'Prometre que la publicació ixirà sola a l’hora triada.']}>

      <h4>Consola (gran, amb el que passa cada dia)</h4>
      <NavegacioMes className="sdp-consola__capcal" cursor={cursor} onCanvia={setCursor} />
      <GraellaMes any={cursor.any} mes={cursor.mes} locale="ca-ES"
        renderDia={(dia, { numero }) => (
          <>
            {numero}
            {DIES_AMB_TASCA.has(dia) ? <div><Insignia to="exit">copia · viu</Insignia></div> : null}
          </>
        )} />

      <h4>Editor (la pastilla de la barra taronja obri el mes en xicotet)</h4>
      <div className="sdp-especimen__barres">
        <section className="bar-orange" aria-label="Autoria i data (espècimen)">
          <div className="sp-card-author">
            <div className="sp-card-author-info">
              <div className="sp-card-author-name">Sóc de Poble</div>
              <div className="sp-card-author-location">La Torre de les Maçanes</div>
            </div>
          </div>
          <div className="bar-actions">
            <SelectorDataHora valor={data} onTria={setData} reserva={{ time: '10:00', date: '28/09/26' }} />
          </div>
        </section>
      </div>
    </Especimen>
  );
}
