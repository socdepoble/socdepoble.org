import { Especimen } from '../Especimen.jsx';
import { VistaBotiguesSistema } from '../../../botigues/VistaBotiguesSistema.jsx';

/** Fixture explícita de contracte visual; no és una font operativa. */
export const MOSTRA_BOTIGUES = Object.freeze({
  play: { font: 'Mostra de catàleg; dades de demostració, sense connexió a botigues.', comptador: '2/12', lector: 'Dos de dotze; mostra', web: '14', explicacio: 'Dos participants en Play i catorze usos web són mesures diferents en esta mostra.', optInUrl: null },
  versions: 'Mostra de versions: configuració d’iOS 1.1.0, build 2; cap publicació acreditada.',
  canals: [{ id: 'testflight', nom: 'TestFlight', url: null, descripcio: 'Mostra de canal sense enllaç públic.' }],
  flota: { font: 'Dos noms de mostra; no és el cens complet ni salut en viu.', membres: [{ id: 'claude', nom: 'Claude', url: 'https://claude.ai/' }, { id: 'chatgpt', nom: 'ChatGPT Codex', url: 'https://chatgpt.com/' }] },
});

export default function EspecimenBotiguesSistema() {
  return (
    <Especimen id="botigues-sistema" nom="Botigues, verificadors i flota" fitxer="sections/botigues/VistaBotiguesSistema.jsx"
      descripcio="Cos compartit del perfil i la Consola; mostra visual explícita sense botigues o comptes connectats."
      contracte={[
        ['model', 'objecte sanejat', 'obligatori', 'Dades amb procedència, canals validats i cens separat de salut.'],
        ['onCopia', 'funció', 'absent', 'Acció local; absent desactiva el botó.'],
        ['avis', 'text', 'null', 'Resultat anunciat només després de l’acció.'],
      ]}
      a11y={['Encapçalaments per a l’índex, estats en text i noms d’enllaç complets.']}
      fes={['Separar dada comunicada, configuració i comprovació en viu.']}
      noFacis={['Donar per operatives les IAs del cens o confondre ús web amb proves Play.']}>
      <VistaBotiguesSistema model={MOSTRA_BOTIGUES} />
    </Especimen>
  );
}
