import { useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Especimen } from './Especimen.jsx';
import { Alerta, Insignia, EstatBuit, Carregant, Esquelet, Progres } from '../../../components/PedraSeca/index.js';
import { Boto } from '../../../components/PedraSeca/index.js';

export default function PaginaRetroalimentacio() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <h2>Estats i avisos</h2>
      <p>La interfície sempre diu què està passant: què falta, què carrega, què ha anat bé i què ha fallat. Cap estat es comunica només amb color.</p>

      <Especimen id="alerta" nom="Alerta" fitxer="src/components/PedraSeca/Alerta.jsx"
        descripcio="Missatge en línia que es queda fins que es resol. Emet el canon sdp-alerta--* de @layer sdp."
        contracte={[
          ['to', "'info'|'exit'|'avis'|'error'", "'info'", 'error → role=alert; la resta → role=status.'],
          ['titol', 'node', 'null', 'Una frase que resumix.'],
          ['accions', 'node', 'null', 'Botons de resolució.'],
          ['onTanca', '() => void', 'null', 'Si hi és, apareix la creu (44px).'],
        ]}
        a11y={['Només error interromp el lector (role=alert).', 'Icona + text + vora: llegible sense color.', '«ok» és àlies obsolet d’«exit».']}
        fes={['Dir el següent pas: «Torna-ho a provar en uns minuts».']} noFacis={['role="alert" per a una informació neutra.', 'Codis tècnics («Error 403») sense traducció.']}>
        <Alerta to="info" titol="Informació">Les notes privades només les veus tu.</Alerta>
        <Alerta to="exit" titol="Fet">La publicació ja és al Mur.</Alerta>
        <Alerta to="avis" titol="Revisa-ho">Aquesta foto pesa 12 MB; al camp tardarà a pujar.</Alerta>
        {visible ? (
          <Alerta to="error" titol="No s’ha pogut desar" onTanca={() => setVisible(false)}
            accions={<Boto varietat="secundari">Tornar-ho a provar</Boto>}>
            No hi ha connexió amb el servidor. El text continua ací; no l’has perdut.
          </Alerta>
        ) : <Boto onClick={() => setVisible(true)}>Tornar a mostrar l’error</Boto>}
      </Especimen>

      <Especimen id="insignia" nom="Insignia" fitxer="src/components/PedraSeca/Insignia.jsx"
        descripcio="Dues famílies en una peça. Taxonomia (tipus) per a classificar; estat (to) per a informar."
        contracte={[
          ['tipus', "'sistema'|'categoria'|'etiqueta'", 'null', 'Emet sdp-badge-system|category|tag.'],
          ['to', "'neutre'|'info'|'exit'|'avis'|'error'", "'neutre'", 'Emet sdp-insignia--*.'],
        ]}
        a11y={['El text és obligatori; el color només reforça.']}
        fes={['Una paraula o dos.']} noFacis={['Repetir en insígnia el que ja diu la carpeta.', 'Les maquetes .badge-* de Fonaments (obsoletes).']}>
        <div className="sdp-especimen__fila">
          <Insignia tipus="sistema">Mur</Insignia>
          <Insignia tipus="categoria">Productivitat</Insignia>
          <Insignia tipus="etiqueta">Tutorial</Insignia>
        </div>
        <div className="sdp-especimen__fila">
          <Insignia>Esborrany</Insignia>
          <Insignia to="info">Pendent</Insignia>
          <Insignia to="exit">Conciliada</Insignia>
          <Insignia to="avis">Per revisar</Insignia>
          <Insignia to="error">Rebutjada</Insignia>
        </div>
      </Especimen>

      <Especimen id="buit" nom="EstatBuit" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Llista o secció sense contingut. Explica per què i oferix l’acció que ho arregla."
        contracte={[['icona', 'Component lucide', 'Inbox', 'Decorativa.'], ['titol', 'node', '—', 'Què passa.'], ['children', 'node', 'null', 'Per què.'], ['accio', 'node', 'null', 'La porta d’eixida.']]}
        fes={['Distingir «encara no hi ha res» de «la cerca no troba res».']} noFacis={['Una pantalla en blanc.']}>
        <div className="sdp-especimen__regles">
          <EstatBuit titol="Encara no tens notes" accio={<Boto varietat="primari" icona={Plus}>Crear la primera nota</Boto>}>
            Les notes són privades fins que decidixes publicar-les.
          </EstatBuit>
          <EstatBuit icona={SearchX} titol="Cap resultat per «almàssera»">Prova amb menys paraules o revisa l’accent.</EstatBuit>
        </div>
      </Especimen>

      <Especimen id="carrega" nom="Carregant · Esquelet" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Carregant per a esperes curtes o accions; Esquelet quan se sap la forma del que ve (targetes, llistes)."
        contracte={[['Carregant.etiqueta', 'string', "'Carregant…'", 'Text visible i anunciat.'], ['Esquelet.linies', 'number', '3', 'Línies de text.'], ['Esquelet.ambMedia', 'boolean', 'false', 'Bloc d’imatge a dalt.']]}
        a11y={['role=status amb un sol text per al lector; les formes són aria-hidden.', 'Sense animació amb prefers-reduced-motion.']}
        fes={['Esquelet amb la mateixa forma que el contingut final.']} noFacis={['Spinners sense text.', 'Esquelets de més de 3 segons sense missatge.']}>
        <Carregant etiqueta="Carregant el Mur…" />
        <Esquelet ambMedia linies={2} />
      </Especimen>

      <Especimen id="progres" nom="Progres" fitxer="src/components/PedraSeca/estats.jsx"
        descripcio="Progrés d’una tasca llarga amb <progress> natiu. Sense valor, és indeterminat: no inventem percentatges."
        contracte={[['etiqueta', 'string', '—', 'Què progressa.'], ['valor', 'number|null', 'null', 'null = indeterminat.'], ['max', 'number', '100', '—']]}
        a11y={['<progress> natiu amb aria-label; el % visible és redundant per al lector.']}
        fes={['Pujades, importacions.']} noFacis={['Barres decoratives sense valor real (Consola Termodinàmica: cap % inventat).']}>
        <Progres etiqueta="Pujada d’imatges" valor={45} />
        <Progres etiqueta="Indexació de documents" valor={78} />
        <Progres etiqueta="Connectant amb el servidor" />
      </Especimen>
    </>
  );
}
