import { Especimen } from '../Especimen.jsx';
import { Alerta, Boto, DateTimeControl } from '../../../../components/PedraSeca/index.js';
import { EstatDesament } from '../../../../components/universal/EstatDesament.jsx';

const res = () => {};

/* T47 (ordre del Mestre, 260928) · La ploma de l'autodesament i l'avís en
   línia d'un camp que el servidor no accepta. Els estats es pinten dins d'una
   barra taronja de mostra, com a UniversalEditorShell (prop estatDesament). */
const ESTATS = [
  ['pendent', 'Canvis pendents: la ploma es veu mentre el servidor no els té.'],
  ['error', 'Alguna cosa no s’ha pogut desar: la ploma es canvia per un avís.'],
  ['net', 'Tot desat: la ploma desapareix (la regió d’estat continua per al lector).'],
];

export default function EspecimenEstatDesament() {
  return (
    <Especimen id="estat-desament" nom="EstatDesament · la ploma de l’autodesament" fitxer="src/components/universal/EstatDesament.jsx"
      descripcio="L’editor no té botó «Guardar»: tot es desa sol, com Google Docs. La ploma diu que hi ha canvis que el servidor encara no té; es canvia per un avís si alguna cosa falla i desapareix quan el servidor ho confirma. Els errors de desat d’un camp van en línia, davall del camp, i el text es conserva en el dispositiu."
      contracte={[
        ['estat', "'net' | 'pendent' | 'enviant' | 'sessio' | 'error'", "'net'", "D’on ve: la cua d’autodesament (useAutodesament). Un estat desconegut es tracta com a 'pendent'."],
        ['detall', 'string', "''", 'Text per al lector i per al títol; si és buit, el de cada estat.'],
        ['accions', '[{ text, onClick }]', 'null', 'Les eixides del detall en «error» i «sessio» (p. ex. tornar a provar). Sense, només «Entesos».'],
        ['UniversalEditorShell.estatDesament', '{ estat, detall, accions? }', 'null', 'Pinta la icona com a primer element de la barra taronja i la regió viva a l’arrel de la closca. Sense la prop, el DOM és el de sempre.'],
        ['UniversalEditorShell.avisosCamps', '{ [camp]: { error?, comptador? } }', 'null', 'Errors en línia (role=alert) i comptador a partir del 80 % del límit, davall de l’entradilla.'],
      ]}
      a11y={['La regió role="status" (aria-live="polite") és sempre al DOM, invisible: els canvis s’anuncien sense moure la barra. La closca la munta a la seua arrel, fora de la barra taronja, que en mòbil s’amaga.', 'En «pendent» i «enviant» la icona és decorativa (aria-hidden). En «error» i «sessio» és un botó amb nom que obri el detall (Dialeg de la barra): què no s’ha desat i què cal fer.', 'Un error de camp és role="alert" i porta les seues eixides com a botons; en usar-les, el focus torna al camp.', 'El text de l’alerta és estable mentre s’escriu (s’anuncia una vegada); la llargària viva va al comptador, una línia fora de la regió viva.']}
      fes={['Un sol lloc per a l’estat del desament: la barra taronja.', 'Dir on es guarda el text de veres: «en este dispositiu» (IndexedDB) o «en esta pestanya».']}
      noFacis={['Avisar amb un toast efímer d’un error de desat: el text es perdria en eixir.', 'Retallar un text en silenci perquè càpiga: la persona ha de decidir.', 'Dir «desat» abans que el servidor ho haja confirmat.']}>

      {ESTATS.map(([estat, text]) => (
        <div key={estat}>
          <h4>{estat}</h4>
          <p>{text}</p>
          <div className="sdp-especimen__barres">
            <section className="bar-orange" aria-label={`Autoria i data (espècimen, ${estat})`}>
              <div className="sp-card-author">
                <div className="sp-card-author-info">
                  <div className="sp-card-author-name">Sóc de Poble</div>
                  <div className="sp-card-author-location">La Torre de les Maçanes</div>
                </div>
              </div>
              <div className="bar-actions">
                <EstatDesament estat={estat} />
                <DateTimeControl time="11:00" date="25/04/26" dateTime="2026-04-25T11:00:00" onClick={res} />
              </div>
            </section>
          </div>
        </div>
      ))}

      <h4>Error en línia d’un camp</h4>
      <p className="sdp-avis-camp__comptador">Entradilla: 183 de 120 caràcters</p>
      <Alerta to="error" titol="Entradilla" accions={(
        <>
          <Boto varietat="secundari" onClick={res}>Retallar a 120</Boto>
          <Boto varietat="secundari" onClick={res}>Tornar al que hi ha desat</Boto>
        </>
      )}>
        <p>Com a màxim 120 caràcters. El text es guarda en este dispositiu fins que l’escurces.</p>
      </Alerta>

      <h4>Comptador a partir del 80 % del límit</h4>
      <p className="sdp-avis-camp__comptador">Entradilla: 98 de 120 caràcters</p>
    </Especimen>
  );
}
