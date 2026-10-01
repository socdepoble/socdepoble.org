import { Especimen } from '../Especimen.jsx';
import { PilotConnexio } from '../../../../components/universal/connexio/PilotConnexio.jsx';
import { LlistaNodes } from '../../../../components/universal/connexio/LlistaNodes.jsx';
import { ESTATS_CONNEXIO, etiquetaDeConnexio } from '../../../../components/universal/connexio/estatConnexio.js';
import { nodesDelPerfil } from '../../../profile/nodes.js';
import { createTranslator } from '../../../../config/i18n';

/* T7-T9 (ordre del Mestre, 261001) · Pedra Seca §9: el pilot de connexió i
   la llista de nodes, en viu. Dades fixes: cap context ni xarxa. El text de
   l'estat passa pel diccionari real. */
const T_CA = createTranslator('ca');
const NODES_DE_MOSTRA = nodesDelPerfil({ nomPoble: 'Gent de la Torre' });

export default function EspecimenConnexio() {
  return (
    <Especimen id="connexio" nom="Connexió i nodes" fitxer="src/components/universal/connexio/ (PilotConnexio · LlistaNodes · estatConnexio)"
      descripcio="El pilot diu l’estat de la connexió amb el node amb dades que l’App ja té: el mode remot, l’última càrrega del contingut del servidor i el que diu el dispositiu. Verd i ple: connectat. Groc i en anell: connectant o sense connexió (també en un mode de proves sense servidor). El fan servir la franja de l’amfitrió, sobre el crom, i «Els nodes» del Perfil, on la llista diu on estàs i qui guarda les dades."
      contracte={[
        ['PilotConnexio.estat', "'connectat' | 'connectant' | 'desconnectat'", '—', 'Un valor desconegut es pinta com a sense connexió: mai un verd per error.'],
        ['PilotConnexio.etiqueta', 'string', '—', 'L’estat dit amb paraules, només per al lector (etiquetaDeConnexio). Sense, qui el munta el diu en text visible.'],
        ['LlistaNodes.nodes', '[{ id, nom, descripcio, actiu }]', '[]', 'La llista de nodesDelPerfil (sections/profile/nodes.js). Només un node és actiu: on estàs.'],
        ['LlistaNodes.estat', 'string', '—', 'L’estat del pilot del node actiu.'],
        ['LlistaNodes.etiquetaEstat', 'string', '—', 'L’etiqueta del pilot del node actiu.'],
        ['estatDeConnexio({ modeRemot, status, enLinia })', 'funció pura', '—', 'Sense mode remot o fora de línia, desconnectat; amb status ready, connectat; amb error, desconnectat; la resta, connectant.']
      ]}
      a11y={[
        'El punt és aria-hidden: l’estat es llig en text, a la franja o a l’etiqueta del lector.',
        'La forma també diu l’estat (ple o anell), no només el color (WCAG 1.4.1); tots dos colors passen el 3:1 de 1.4.11.',
        'El node on estàs porta aria-current a la llista.'
      ]}
      fes={[
        'Calcular l’estat amb estatDeConnexio, amb les dades que l’App ja té.',
        'Dir que el verd parla de l’última càrrega del contingut, no de la connexió d’ara mateix.'
      ]}
      noFacis={[
        'Sondejar el servidor per temporitzador per a encendre el verd.',
        'Declarar actiu un node que ve de configuració: actiu vol dir on estàs.',
        'Posar l’estat en una classe plantilla: va en data-estat.'
      ]}>
      <h4>Pilot · els tres estats</h4>
      <ul className="sdp-llista-nodes">
        {ESTATS_CONNEXIO.map((estat) => (
          <li key={estat} className="sdp-llista-nodes__node">
            <p className="sdp-llista-nodes__nom">
              <PilotConnexio estat={estat} />
              <strong>{etiquetaDeConnexio(T_CA, estat)}</strong>
            </p>
          </li>
        ))}
      </ul>
      <h4>Llista de nodes · dins de la web d’un amfitrió</h4>
      <LlistaNodes nodes={NODES_DE_MOSTRA} estat="connectat" etiquetaEstat={etiquetaDeConnexio(T_CA, 'connectat')} />
    </Especimen>
  );
}
