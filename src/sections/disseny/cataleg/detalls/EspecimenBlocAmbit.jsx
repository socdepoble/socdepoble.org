import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { BlocAmbit } from '../../../../components/universal/ambits/BlocAmbit.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121; correcció A1-06 de
   l'àrbitre, Pedra Seca §9) · El bloc «On es publica?» REAL, en línia, com el
   munta NotesEditor dins de l'«Edició avançada» (la ranura
   ambitEdicioAvancada de la closca): sense finestra modal ni botó de desar.
   Cada canvi torna la fitxa normalitzada (onCanvia) i l'espècimen la guarda
   en un estat local, com la nota. Dos casos: una nota del Mur (sense fitxa) i
   una fitxa de Compartir cotxe incompleta després que PUBLICAR s'haja aturat
   (mostraErrors). Dades inventades; cap context ni xarxa. */

const DOCUMENT = Object.freeze({
  title: 'Viatge a Alcoi', subtitle: 'Dissabte de matí', lead: 'Isc de la Torre a les huit.',
  authorName: 'Pep del Mas', authorLocation: 'La Torre'
});
const FITXA_INCOMPLETA = Object.freeze({ ambit: 'vehicle', estat: 'disponible', dades: Object.freeze({ modalitat: 'oferisc_places' }) });

/* Un cas viu: la fitxa que el bloc escriu torna a entrar-hi, com a la nota. */
function Cas({ inicial, mostraErrors = false }) {
  const [fitxa, setFitxa] = useState(inicial);
  /* Com desaAmbit: triar «Mur» és la publicació de sempre, cap fitxa. */
  const onCanvia = (nova) => setFitxa(nova?.ambit === 'mur' ? null : nova);
  return <BlocAmbit valor={fitxa} document={DOCUMENT} onCanvia={onCanvia} mostraErrors={mostraErrors} />;
}

export default function EspecimenBlocAmbit() {
  return (
    <>
      <Llinatge id="bloc-ambit" />
      <Especimen id="bloc-ambit" nom="BlocAmbit · On es publica?" fitxer="src/components/universal/ambits/BlocAmbit.jsx"
        descripcio="On viurà la publicació, dit en línia dins de l’«Edició avançada» del Bloc de Notes, entre el logotip i la classificació: Mur, Mercat, Compartir cotxe, Treball o Habitatge com a targetes de ràdio; davall de l’àmbit triat, els camps de la seua fitxa (generats del contracte, utils/publicacioUniversal.js · CAMPS) i l’Estat (només als àmbits verticals); al final, la previsualització de la targeta pública. Sense finestra modal ni botó de desar: cada canvi escriu la fitxa a la nota. El botó «Àmbit» de la botonera de classificació i l’entrada ?ambit= del Bloc no obrin cap diàleg: obrin l’«Edició avançada» i hi porten la vista."
        contracte={[
          ['valor', '{ ambit, estat, dades } | null', 'null', 'La fitxa de la nota. null és el Mur. Si l’àmbit canvia des de fora (moure la nota a la carpeta del Mercat, l’entrada ?ambit=), el bloc el pren amb les seues dades.'],
          ['document', '{ title, subtitle, lead, heroImage?, authorName?, … } | null', 'null', 'El que llig la previsualització (targetaDeLaPagina.js). Sense títol, la targeta es titula com l’àmbit.'],
          ['onCanvia', "(fitxa, 'ambit' | 'dades') => void", '—', 'La fitxa normalitzada a cada canvi, la mateixa forma que es desa. «ambit» en triar un àmbit (qui el munta hi sincronitza la carpeta); «dades» en editar un camp o l’Estat.'],
          ['mostraErrors', 'boolean', 'false', 'PUBLICAR s’ha aturat per esta fitxa: els errors es veuen sense esperar cap tecla, amb un avís curt no viu.'],
          ['t', '(clau, reserva) => string', 'la reserva', 'El traductor. Els textos són els d’editor.ambit.* i ambit.* dels cinc diccionaris.'],
          ['ambitEdicioAvancada (UniversalEditorShell)', 'node | null', 'null', 'La ranura de la closca on es munta, entre el logotip i la classificació. Sense ella, el DOM de sempre (el Perfil).'],
          ['peticioAmbit (UniversalEditorShell)', '{ enfoca } | null', 'null', 'Cada objecte nou obri l’«Edició avançada», porta la ranura a la vista amb el salt de l’Índex (desplacaASeccio) i, amb enfoca, posa el focus al ràdio triat. Una vegada per objecte.'],
        ]}
        a11y={[
          'El bloc és un grup amb nom (el títol visible) i descripció (l’ajuda); els àmbits, un fieldset de ràdios amb llegenda.',
          'La targeta triada porta la insígnia «Triat» en text, mai només color.',
          'Els errors van a cada camp (aria-invalid i el missatge lligat) després del primer canvi, o de colp quan PUBLICAR s’ha aturat.',
          'Triar «Mur» no desmunta el bloc mentre la nota continua oberta: el focus no cau a la pàgina.'
        ]}
        fes={[
          'Muntar-lo amb una key per nota, i passar-li sempre la fitxa viva de la nota.',
          'Escriure la fitxa als manejadors, mai dins d’un updater d’estat (StrictMode la repetiria).',
          'Portar-hi la vista amb desplacaASeccio: dins de WordPress no mou la pàgina de l’amfitrió.'
        ]}
        noFacis={[
          'Tornar-lo a posar dins d’una finestra modal o afegir-li un botó de desar.',
          'Oferir-lo a la còpia de prova del Foraster ni sobre una obra d’altri sense fitxa: no ixen mai amb fitxa pròpia.',
          'Fer scrollIntoView directe: encastat, mouria també la pàgina de l’amfitrió.'
        ]}>
        <h4>Una nota del Mur (sense fitxa)</h4>
        <Cas inicial={null} />
        <h4>Compartir cotxe incompleta, després de PUBLICAR</h4>
        <Cas inicial={FITXA_INCOMPLETA} mostraErrors />
      </Especimen>
    </>
  );
}
