import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link } from '../../app/contexts/RouterContext';
import { dataDeFila } from '../../components/universal/editorial.js';
import { LlistaNodes } from '../../components/universal/connexio/LlistaNodes.jsx';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';

/* ═══════════════════════════════════════════════════════════════════
   PÀGINES DE LECTURA DE L'ESPAI DE TREBALL DEL PERFIL

   La tercera columna quan l'element triat no és una identitat: una
   utilitat d'APLICACIONS, l'avís de «GRUPS I EMPRESES» buit o «Els
   nodes» de la persona. Només llegir: cap botó que no faça res. Una
   utilitat sense secció en este node ho diu; amb secció, l'enllaça.
   ═══════════════════════════════════════════════════════════════════ */

/* La utilitat és del node, no de cap persona: la barra taronja ho diu. */
const AUTORIA_NODE = Object.freeze({
  authorName: 'Sóc de Poble',
  authorLocation: 'Utilitat d’este node',
  authorAvatar: '',
});

/* T51 · Pendent: una utilitat encara no té cap data real. La seua
   declaració (aplicacions.js, aplicacionsValides) no porta cap camp de data
   i esta pàgina no se n'inventa cap: cal que la configuració en porte una. */
export function DetallAplicacio({ aplicacio }) {
  if (!aplicacio) return null;
  const connectada = aplicacio.estat === 'connectada' && Boolean(aplicacio.ruta);
  const estat = connectada ? ESTATS_APLICACIO.connectada : ESTATS_APLICACIO.pendent;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={aplicacio.nom}
      lead={aplicacio.descripcio}
      labels={[{ text: 'Aplicació' }]}
      topBarData={AUTORIA_NODE}
    >
      <div className="perfil-compte">
        <Bloc titol="Estat">
          <p className="perfil-ajust__valor">{estat}</p>
          {connectada ? (
            <p className="perfil-compte__text">
              <Link to={aplicacio.ruta}>{`Obrir ${aplicacio.nom}`}</Link>
            </p>
          ) : (
            <p className="perfil-compte__text">
              Esta utilitat encara no té secció en este node. Quan s’hi connecte, s’obrirà des d’ací mateix.
            </p>
          )}
        </Bloc>
      </div>
    </UniversalPage>
  );
}

/** «GRUPS I EMPRESES» sense cap organització: com se'n crea una. */
export function DetallSenseOrganitzacions({ persona }) {
  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="Grups i empreses"
      lead="Encara no formes part de cap grup ni de cap empresa."
      /* T51 · la pàgina parla del compte de la persona: la seua data real. */
      {...dataDeFila(persona?.dades)}
      topBarData={{
        authorName: persona?.nom || 'El meu compte',
        authorAvatar: persona?.avatar || '',
        authorLocation: persona?.dades?.town_name || '',
      }}
    >
      <div className="perfil-compte">
        <Bloc titol="Com se’n crea una">
          <p className="perfil-compte__text">
            Una empresa o un grup té la seua pròpia fitxa i el seu compte, al costat dels teus.
            Crea-la amb el botó NOVA ORG, dalt de la llista d’apartats: quan existisca, apareixerà en este grup.
          </p>
        </Bloc>
      </div>
    </UniversalPage>
  );
}

/**
 * T9 (ordre del Mestre, 261001) · «Els nodes»: on està connectada la
 * persona (nodes.js) i què vol dir el pilot. Encara no es gestiona res:
 * cap botó. `etiquetaEstat` és l'estat dit amb paraules, per al lector.
 */
export function DetallNodes({ persona, nodes = [], estat, etiquetaEstat }) {
  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="Els nodes"
      lead="On estàs connectat ara i qui guarda les teues dades."
      labels={[{ text: 'Connexió' }]}
      /* T51 · la pàgina parla del compte de la persona: la seua data real. */
      {...dataDeFila(persona?.dades)}
      topBarData={{
        authorName: persona?.nom || 'El meu compte',
        authorAvatar: persona?.avatar || '',
        authorLocation: persona?.dades?.town_name || '',
      }}
    >
      <div className="perfil-compte">
        <Bloc titol="Connexió d’ara">
          <LlistaNodes nodes={nodes} estat={estat} etiquetaEstat={etiquetaEstat} />
          <p className="perfil-compte__text">
            El punt del node on estàs és verd i ple quan l’App ha carregat el contingut del servidor, i groc en anell mentre es connecta o si no hi ha connexió.
          </p>
        </Bloc>
        <Bloc titol="Què és un node">
          <p className="perfil-compte__text">
            Un node és la web d’un poble, d’una associació o d’un col·lectiu que obri l’App als seus veïns. Les dades compartides les guarda Sóc de Poble.
          </p>
          <p className="perfil-compte__text">
            <Link to="/fedivers">Com funcionen els nodes i el Fedivers</Link>
          </p>
        </Bloc>
        <Bloc titol="Gestió">
          <p className="perfil-compte__text">
            Encara no pots afegir ni canviar de node des d’ací. Quan es puga, serà en esta pàgina.
          </p>
        </Bloc>
      </div>
    </UniversalPage>
  );
}
