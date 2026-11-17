import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { dataDeFila } from '../../components/universal/editorial.js';
import { datesDAdministracio, datesDAplicacio } from './datesDelPerfil.js';
import { LlistaNodes } from '../../components/universal/connexio/LlistaNodes.jsx';
import { Alerta, Boto, GrupOpcions } from '../../components/PedraSeca/index.js';
import { textPendentsEixida, textosAvisEixida } from '../../components/universal/EixidaSegura.jsx';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import * as uiContextModul from '../../app/contexts/UIContext';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { TEXTOS_EIXIR_PER_LLENGUA, llenguaDelTraductor } from './perfilModel.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { RUTA_PERFIL_PROJECTE, rutaDePerfil } from '../../config/navigation.js';
import { pobleDeFitxa } from './fitxaDePerfil.js';

/* ═══════════════════════════════════════════════════════════════════
   PÀGINES DE LECTURA DE L'ESPAI DE TREBALL DEL PERFIL

   La tercera columna quan l'element triat no és una identitat: una
   utilitat d'APLICACIONS, l'avís de «GRUPS I EMPRESES» buit o «Els
   nodes» de la persona. Només llegir: cap botó que no faça res. Una
   utilitat sense secció en este node ho diu; amb secció, l'enllaça.
   ═══════════════════════════════════════════════════════════════════ */

/* La utilitat és del node, no de cap persona: la barra taronja ho diu.
   T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) + IDEA-118 (P0-29, 261106) ·
   Signa Sóc de Poble (La Torre de les Maçanes, amb el seu avatar oficial verd
   256x256) i la boina porta al seu perfil (/socdepoble). */
const AUTORIA_NODE = Object.freeze({
  authorName: 'Sóc de Poble',
  authorLocation: 'La Torre de les Maçanes',
  authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  authorHref: RUTA_PERFIL_PROJECTE,
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». Les pàgines que parlen del compte
   de la persona porten a la seua fitxa pública, per l'id de la seua fila
   (dades.id; l'id de la identitat és 'jo'). Sense fila, cap enllaç. */
const autoriaDeLaPersona = (persona) => ({
  authorName: persona?.nom || 'El meu compte',
  authorAvatar: persona?.avatar || '',
  authorLocation: pobleDeFitxa(persona),
  authorHref: rutaDePerfil('persona', persona?.dades?.id),
});

import { textDelMotiu } from '../../apps/plataforma/PortalApps.jsx';
import { useDestiDelPlugin } from '../plugins/useDestiDelPlugin.js';
import { pluginPerId } from '../plugins/registrePlugins.js';
import { desaUtilitatActiva, estaAlPanell, subscriuUtilitatsActives } from './utilitatsActives.js';

function useNavegaOpcional() {
  try {
    return useNavigate();
  } catch {
    return null;
  }
}

function useSessioSegura() {
  try {
    return useSessioOpcional();
  } catch {
    return null;
  }
}

function useEstatUISegur() {
  try {
    if (typeof uiContextModul.useUIStateOpcional === 'function') return uiContextModul.useUIStateOpcional();
    if (typeof uiContextModul.useUIState === 'function') return uiContextModul.useUIState();
    return null;
  } catch {
    return null;
  }
}

function useAccionsUISegures() {
  try {
    if (typeof uiContextModul.useUIActionsOpcional === 'function') return uiContextModul.useUIActionsOpcional();
    if (typeof uiContextModul.useUIActions === 'function') return uiContextModul.useUIActions();
    return null;
  } catch {
    return null;
  }
}

/* R19 · Arbitratge del carril Genealogia + Perfil (P1) · Una utilitat que este
   build porta ('connectada', aplicacions.js) passa, ARA i ACÍ, per la mateixa
   porta que la pàgina del seu plugin: useDestiDelPlugin, amb els interruptors
   de la plataforma (build, entorn, amfitrió, persona i document propi).
   Només si s'obri pinta «Connectada en este node» i el seu «Obrir …». Si no,
   «No disponible ací» i el motiu amb el text de la plataforma (textDelMotiu),
   el mateix de /plugin/<id>, del portal /app i de RutaApps: cap enllaç que
   acabe en un avís, i cap promesa de connexió que no arribarà. Abans, només
   el build: el Perfil deia «Connectada» i enllaçava una app que la persona
   havia desactivada o que l'amfitrió no havia encesa. La ruta és la de la
   fitxa (la de la targeta del Panell): una ruta que no és d'una app
   (/page/avisador, /control?fitxa=snippet) s'obri sempre. */
/* R19 · Loop 1 · El text de l'enllaç és el botó del seu plugin (registrePlugins.js,
   etiquetaObrir: «Obrir l’Avisador», «Obrir l’Arbre Genealògic»), el mateix de
   /plugin/<id>. Una utilitat sense plugin (el Snippet o la d'un node federat)
   conserva «Obrir <nom>». */
function EstatDeLaConnectada({ aplicacio }) {
  const { t } = useAccionsUISegures() || {};
  const desti = useDestiDelPlugin({ obrir: aplicacio.ruta });
  if (desti.ruta) {
    return (
      <>
        <p className="perfil-ajust__valor">{ESTATS_APLICACIO.connectada}</p>
        <p className="perfil-compte__text">
          <Link to={desti.ruta}>{pluginPerId(aplicacio.panell)?.etiquetaObrir || `Obrir ${aplicacio.nom}`}</Link>
        </p>
      </>
    );
  }
  const motiu = textDelMotiu(desti.motiu, t);
  return (
    <>
      <p className="perfil-ajust__valor">{ESTATS_APLICACIO.noDisponible}</p>
      {motiu ? <p className="perfil-compte__text">{motiu}</p> : null}
    </>
  );
}

/* T51 / P0-54 · La configuració local reutilitza les dates canòniques de
   plugins, Snippet i PAGE_COPY. Les fitxes federades aporten les seues;
   datesDAplicacio no hi assigna una data local pel mateix ID. */
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

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={aplicacio.nom}
      lead={aplicacio.descripcio}
      labels={[{ text: 'Aplicació' }]}
      {...datesDAplicacio(aplicacio)}
      topBarData={AUTORIA_NODE}
    >
      <div className="perfil-compte">
        <Bloc titol="Estat">
          {connectada ? <EstatDeLaConnectada aplicacio={aplicacio} /> : (
            <>
              <p className="perfil-ajust__valor">{ESTATS_APLICACIO.pendent}</p>
              <p className="perfil-compte__text">
                Esta utilitat encara no té secció en este node. Quan s’hi connecte, s’obrirà des d’ací mateix.
              </p>
            </>
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

/**
 * IDEA-94 + IDEA-103 · Contenidor canònic per als 7 apartats d'Administració del sistema
 * (incloent «👥 Usuaris registrats», vista 'admin-usuaris')
 * dins de la Columna 3 del Perfil: proporciona el marc UniversalPage amb
 * barra blava de context, barra taronja d'autoria del node i el contenidor
 * .sdp-universal-page-container--contained amb desplaçament vertical natiu.
 */
export function DetallAdministracio({ item, children }) {
  const datesBarra = datesDAdministracio(item);
  const ambEntradilla = typeof item?.entradilla === 'string' && item.entradilla.trim() !== '';
  /* P0-74 (R16-I) · Cada apartat és una pàgina nova. Sense clau, React reaprofitava el contenidor
     que fa scroll i el nou apartat s'obria a l'altura on s'havia deixat l'anterior; amb la clau
     el contenidor es torna a muntar i comença a dalt, sense cap cerca global al document. */
  const clauApartat = item?.id || item?.title || 'admin';
  return (
    <UniversalPage
      key={clauApartat}
      chrome="context"
      layout="contained"
      title={item?.title || 'Administració del sistema'}
      {...(item?.image ? { heroImage: item.image } : null)}
      {...(item?.imageAlt ? { heroAlt: item.imageAlt } : null)}
      {...(ambEntradilla ? { subtitle: item?.subtitle || '' } : null)}
      lead={ambEntradilla ? item.entradilla : item?.subtitle || ''}
      labels={[{ text: 'Administració del sistema' }]}
      {...datesBarra}
      topBarData={AUTORIA_NODE}
    >
      {children}
    </UniversalPage>
  );
}

const LLENGUA_PROPIA = 'ca';
const LLENGUES_PERFIL = Object.freeze([
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code === LLENGUA_PROPIA),
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code !== LLENGUA_PROPIA),
]);

/* Gauntlet R32.6 · PERFIL-03: el cos diu que es tanca la SESSIÓ, no el compte
   (la baixa és una altra cosa: «Privacitat i dades»). PERFIL-01 i I18N-02: el
   títol, els botons, el cos i l'error de l'avís són els de textosAvisEixida
   (EixidaSegura.jsx), els mateixos del calaix «Amb qui actues?». */
const TEXTOS_DETALL_EIXIR = Object.freeze({
  ca: Object.freeze({
    etiqueta: 'Sessió',
    bloc: 'Tancar la sessió en este dispositiu',
    cos: 'Es tancarà la sessió del teu compte en este navegador o aplicació i tornaràs a la pantalla d’entrada. Les teues dades al poble continuen guardades.',
    boto: 'Eixir de Sóc de Poble',
  }),
  es: Object.freeze({
    etiqueta: 'Sesión',
    bloc: 'Cerrar la sesión en este dispositivo',
    cos: 'Se cerrará la sesión de tu cuenta en este navegador o aplicación y volverás a la pantalla de entrada. Tus datos en el pueblo siguen guardados.',
    boto: 'Salir de Sóc de Poble',
  }),
  en: Object.freeze({
    etiqueta: 'Session',
    bloc: 'Sign out on this device',
    cos: 'Your account will be signed out in this browser or app and you will return to the sign-in screen. Your village data stays saved.',
    boto: 'Sign out of Sóc de Poble',
  }),
  eu: Object.freeze({
    etiqueta: 'Saioa',
    bloc: 'Itxi saioa gailu honetan',
    cos: 'Zure kontuaren saioa itxiko da nabigatzaile edo aplikazio honetan eta sarrera-pantailara itzuliko zara. Zure herriko datuak gordeta jarraituko dute.',
    boto: 'Irten Sóc de Pobletik',
  }),
  gl: Object.freeze({
    etiqueta: 'Sesión',
    bloc: 'Pechar a sesión neste dispositivo',
    cos: 'Pecharase a sesión da túa conta neste navegador ou aplicación e volverás á pantalla de entrada. Os teus datos no pobo seguen gardados.',
    boto: 'Saír de Sóc de Poble',
  }),
});

/**
 * Onada R32.4 (ordre del Mestre, 261116) · «Idioma del Sistema» dins dels apartats
 * personals d'/el-meu-perfil: canvi d'idioma en un sol clic i enllaç a /traduccions.
 */
export function DetallIdioma({ persona }) {
  const t = useTraductorOpcional();
  const estatUI = useEstatUISegur();
  const accionsUI = useAccionsUISegures();
  const codiActiu = estatUI?.language || accionsUI?.language || llenguaDelTraductor(t);
  const setLanguage = accionsUI?.setLanguage;

  const opcions = LLENGUES_PERFIL.map((llengua) => ({
    valor: llengua.code,
    etiqueta: llengua.name,
    detall: tradueix(t, [`section.translations.option.${llengua.code}`, llengua.code === LLENGUA_PROPIA ? 'Idioma per defecte de l’aplicació' : llengua.name]),
  }));

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={tradueix(t, ['section.translations.system.title', 'Idioma del Sistema'])}
      lead={tradueix(t, ['section.translations.system.lead', 'Aquest ajust canvia l’idioma de tots els menús, botons i interfícies de l’aplicació. La preferència es guarda en aquest navegador.'])}
      labels={[{ text: tradueix(t, ['nav.idioma', 'Idioma']) }]}
      {...dataDeFila(persona?.dades)}
      topBarData={autoriaDeLaPersona(persona)}
    >
      <div className="perfil-compte">
        <Bloc titol={tradueix(t, ['nav.idiomaTitle', 'Tria un idioma'])}>
          <GrupOpcions
            llegenda={tradueix(t, ['section.translations.pick', 'Selecciona un idioma'])}
            aspecte="targetes"
            opcions={opcions}
            valor={codiActiu}
            textTriada={tradueix(t, ['section.translations.status.active', 'Actiu'])}
            onCanvi={(codi) => setLanguage?.(codi)}
          />
          <p className="perfil-compte__text">
            <Link to="/traduccions">{tradueix(t, ['section.translations.pages.title', 'Traductor de Poble per a Pàgines'])}</Link>
          </p>
        </Bloc>
      </div>
    </UniversalPage>
  );
}

/**
 * Onada R32.4 (ordre del Mestre, 261116) · Últim apartat personal d'/el-meu-perfil:
 * «🚪 Eixir de Sóc de Poble», amb comprovació prèvia d'esborranys pendents.
 */
export function DetallEixir({ persona }) {
  const t = useTraductorOpcional();
  const estatUI = useEstatUISegur();
  const codiLlengua = estatUI?.language || llenguaDelTraductor(t);
  const textosLlista = TEXTOS_EIXIR_PER_LLENGUA[codiLlengua] || TEXTOS_EIXIR_PER_LLENGUA.ca;
  const textos = TEXTOS_DETALL_EIXIR[codiLlengua] || TEXTOS_DETALL_EIXIR.ca;
  const textosAvis = textosAvisEixida(codiLlengua);
  const sessio = useSessioSegura();
  const navigate = useNavegaOpcional();
  const [pendents, setPendents] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  /* Cert quan el logout ha fallat: el text es tria en pintar, en la llengua d'ara. */
  const [error, setError] = useState(null);
  /* Gauntlet R32.6 (PERFIL-02) · Boto no passa cap ref: la porta el seu contenidor. */
  const accionsRef = useRef(null);

  const confirmaEixida = useCallback(async () => {
    setError(null);
    setOcupat(true);
    try {
      await sessio?.logout?.();
    } catch {
      setOcupat(false);
      setError(true);
      return;
    }
    setPendents(null);
    setOcupat(false);
    navigate?.('/registre', { replace: true });
  }, [sessio, navigate]);

  const demanaEixida = useCallback(async () => {
    if (ocupat) return;
    setError(null);
    setOcupat(true);
    let queden = [];
    if (typeof sessio?.preparaEixida === 'function') {
      try { queden = await sessio.preparaEixida(); } catch { queden = []; }
    }
    if (Array.isArray(queden) && queden.length) {
      setPendents(queden);
      setOcupat(false);
      return;
    }
    await confirmaEixida();
  }, [ocupat, sessio, confirmaEixida]);

  /* Gauntlet R32.6 (PERFIL-02) · «No eixir encara» desmunta l'Alerta amb el
     botó enfocat a dins: el focus queia a <body> i la persona perdia el lloc.
     Torna a «Eixir de Sóc de Poble», com FilaEixidaAmbSessio a FullAjustos. */
  const noEixirEncara = useCallback(() => {
    setPendents(null);
    accionsRef.current?.querySelector('button')?.focus();
  }, []);

  return (
    <UniversalPage
      traduccio={false}
      chrome="context"
      layout="contained"
      title={textosLlista.titol}
      lead={textosLlista.subtitol}
      labels={[{ text: textos.etiqueta }]}
      {...dataDeFila(persona?.dades)}
      topBarData={autoriaDeLaPersona(persona)}
    >
      <div className="perfil-compte">
        <Bloc titol={textos.bloc}>
          <p className="perfil-compte__text">{textos.cos}</p>
          {pendents ? (
            <Alerta
              to="avis"
              titol={textosAvis.titol}
              accions={(
                <>
                  <Boto varietat="secundari" onClick={noEixirEncara} autoFocus>{textosAvis.noEixir}</Boto>
                  <Boto varietat="perill" onClick={confirmaEixida} carregant={ocupat}>{textosAvis.eixirIgualment}</Boto>
                </>
              )}
            >
              <p>{textPendentsEixida(pendents, codiLlengua)}</p>
            </Alerta>
          ) : null}
          {error ? <Alerta to="error">{textosAvis.error}</Alerta> : null}
          <div className="perfil-compte__accions" ref={accionsRef}>
            <Boto varietat="perill" icona={LogOut} onClick={demanaEixida} carregant={ocupat}>
              {textos.boto}
            </Boto>
          </div>
        </Bloc>
      </div>
    </UniversalPage>
  );
}
