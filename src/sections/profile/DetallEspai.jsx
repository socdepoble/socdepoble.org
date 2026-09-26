import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link } from '../../app/contexts/RouterContext';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';

/* ═══════════════════════════════════════════════════════════════════
   PÀGINES DE LECTURA DE L'ESPAI DE TREBALL DEL PERFIL

   La tercera columna quan l'element triat no és una identitat: una
   utilitat d'APLICACIONS o l'avís de «GRUPS I EMPRESES» buit. Només
   llegir: cap botó que no faça res. Una utilitat sense secció en este
   node ho diu; amb secció, l'enllaça.
   ═══════════════════════════════════════════════════════════════════ */

/* La utilitat és del node, no de cap persona: la barra taronja ho diu. */
const AUTORIA_NODE = Object.freeze({
  authorName: 'Sóc de Poble',
  authorLocation: 'Utilitat d’este node',
  authorAvatar: '',
});

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
