import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link } from '../../app/contexts/RouterContext';
import { dataDeFila } from '../../components/universal/editorial.js';
import { LlistaNodes } from '../../components/universal/connexio/LlistaNodes.jsx';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { RUTA_PERFIL_PROJECTE, rutaDePerfil } from '../../config/navigation.js';

/* ═══════════════════════════════════════════════════════════════════
   PÀGINES DE LECTURA DE L'ESPAI DE TREBALL DEL PERFIL

   La tercera columna quan l'element triat no és una identitat: una
   utilitat d'APLICACIONS, l'avís de «GRUPS I EMPRESES» buit o «Els
   nodes» de la persona. Només llegir: cap botó que no faça res. Una
   utilitat sense secció en este node ho diu; amb secció, l'enllaça.
   ═══════════════════════════════════════════════════════════════════ */

/* La utilitat és del node, no de cap persona: la barra taronja ho diu.
   T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · Signa Sóc de Poble,
   el sistema, i la boina porta al seu perfil (Onada 8, 261009: abans, a la
   pàgina del projecte). */
const AUTORIA_NODE = Object.freeze({
  authorName: 'Sóc de Poble',
  authorLocation: 'Utilitat d’este node',
  authorAvatar: '',
  authorHref: RUTA_PERFIL_PROJECTE,
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». Les pàgines que parlen del compte
   de la persona porten a la seua fitxa pública, per l'id de la seua fila
   (dades.id; l'id de la identitat és 'jo'). Sense fila, cap enllaç. */
const autoriaDeLaPersona = (persona) => ({
  authorName: persona?.nom || 'El meu compte',
  authorAvatar: persona?.avatar || '',
  authorLocation: persona?.dades?.town_name || '',
  authorHref: rutaDePerfil('persona', persona?.dades?.id),
});

import { useState, useEffect } from 'react';
import { desaUtilitatActiva, estaAlPanell, subscriuUtilitatsActives } from './utilitatsActives.js';

/* T51 · Pendent: la declaració d'una utilitat del Perfil (aplicacions.js,
   aplicacionsValides) no porta cap camp de data i esta pàgina no se n'inventa
   cap: cal que la configuració en porte una.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   Ja no és cert que «una utilitat encara no té cap data real»: la targeta
   del Panell de la Gestoria i del Lector RSS porta la data del registre de
   plugins (registrePlugins.js, camp `data`), i la del Snippet, la seua
   (destiSnippet.js, DATA_DEL_SNIPPET). Esta fitxa del Perfil encara no les
   llig: la seua barra taronja continua sense pastilla. Pintar-la ací és un
   canvi de pantalla que l'ordre no nomena; queda pendent del Mestre. */
export function DetallAplicacio({ aplicacio }) {
  /* Ordre del Mestre (261007, prompt 261007_1628, peça C) · La preferència
     es llig i s'escriu amb l'id del Panell (aplicacions.js, camp `panell`):
     'rss' per al Lector, el que amaga ControlSection. I amb la regla del
     Panell (estaAlPanell): sense preferència, la utilitat ja hi és i el botó
     diu «Ocultar». Derogat: l'id de l'aplicació com a clau i el Boolean()
     que la llegia al revés.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
     targetes de la Consola i del Cervell ixen del Panell de Control: la
     Consola de Mètriques i el Cervell porten `panell: null` (DEROGAT
     «'consola' per a la Consola de Mètriques»). Una utilitat sense targeta
     al Panell no pinta el bloc de la preferència: «Ocultar del Panell» no
     tindria res a ocultar, i ací no hi ha cap botó que no faça res. Els
     hooks es queden incondicionals; sense bloc, ningú escriu res. */
  const alPanell = aplicacio?.panell !== null;
  const id = aplicacio?.panell || aplicacio?.id;
  const [activa, setActiva] = useState(() => estaAlPanell(id));

  /* Higiene d'amfitrió (ordre del Mestre, 261004) · La preferència passa per
     storage.js (utilitatsActives.js), amb el llegat llegit; el Panell se
     n'assabenta per l'estat compartit d'eixe mòdul. Derogat per l'ordre del
     Mestre del 261004: l'accés directe a localStorage i el 'storage' fals a
     window, que arribava a la pàgina de l'amfitrió. */
  useEffect(() => {
    const llig = () => setActiva(estaAlPanell(id));
    llig();
    return subscriuUtilitatsActives(llig);
  }, [id]);

  /* Si no queda escrit (quota, sense emmagatzematge), el botó no canvia: cap estat que menteix. */
  const toggleActiva = () => {
    desaUtilitatActiva(id, !activa);
  };

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

        {/* Onada 10 (261010) · Només per a les utilitats amb targeta al Panell. */}
        {alPanell ? (
          <Bloc titol="Ajustos de l'Usuari">
            <p className="perfil-compte__text">
              Pots fixar aquesta utilitat al teu Panell de Control perquè siga de ràpid accés.
            </p>
            {/* Design Guard (marató del 261007, Llei del Píxel) · Fora l'estil en
                línia: el token --sdp-gap-md no existix a cap full, el marge no
                s'aplicava mai (0) i el bloc ja separa els fills amb el seu gap. */}
            {/* Encàrrec d'harmonització (261018) · El botó, centrat (PerfilShell.css). */}
            <div className="perfil-compte__accions">
              <button
                type="button"
                className={`sdp-boto ${activa ? 'sdp-boto--perill' : 'sdp-boto--primari'}`}
                onClick={toggleActiva}
              >
                {activa ? 'Ocultar del Panell de Control' : 'Mostrar al Panell de Control'}
              </button>
            </div>
          </Bloc>
        ) : null}
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
      topBarData={autoriaDeLaPersona(persona)}
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
      topBarData={autoriaDeLaPersona(persona)}
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
