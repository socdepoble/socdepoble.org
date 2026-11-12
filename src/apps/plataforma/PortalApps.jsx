/**
 * Plataforma d'Apps Enxufables · el portal /app.
 *
 * La llista de les apps que coneix el registre, amb el seu estat dit en text
 * (mai només en color), el motiu quan no es pot obrir i l'interruptor de la
 * persona. L'interruptor només APAGA: si una altra capa (build, entorn,
 * amfitrió) l'apaga, la persona el veu desactivat i llig per què.
 * P0-113 (ordre del Mestre, 261111) · Tot el sistema és 100% gratuït i lliure:
 * cap estat, cap motiu ni cap cartell diu que una eina es cobre. Les apps que
 * el registre de plugins marca en proves (`estat` 'proves') porten la
 * insígnia «En proves · Beta oberta», la mateixa del Panell de Control.
 */
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { PaginaApp } from '../../components/PedraSeca/index.js';
import { EstatBuit } from '../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Interruptor } from '../../components/PedraSeca/organismes/formulari.jsx';
import { MODEL_BOTIGUES } from '../../sections/botigues/botiguesSistemaModel.js';
import { ESTAT_PROVES, PLUGINS, TEXTOS_BETA_OBERTA, appDelPlugin } from '../../sections/plugins/registrePlugins.js';
import { iconaDe } from './iconesApp.js';
import { rutaDeApp, titolDe } from './manifestApp.js';
import { useApagaApp, useApps } from './PlataformaContext.jsx';

export const ETIQUETA_ESTAT = Object.freeze({
  available: 'Disponible',
  disabled: 'Apagada',
  unavailable: 'No disponible'
});

const TO_ESTAT = Object.freeze({ available: 'exit', disabled: 'neutre', unavailable: 'avis' });

/**
 * P0-113 (ordre del Mestre, 261111) · Els ids de les apps internes on porta
 * («Obrir», appDelPlugin) un plugin en proves (`estat` 'proves', R18 · T2):
 * el registre de plugins és l'única font de la insígnia. Llista congelada.
 */
export function appsEnProves(plugins = PLUGINS) {
  return Object.freeze([...new Set(plugins.filter((p) => p?.estat === ESTAT_PROVES).map(appDelPlugin).filter(Boolean))]);
}

const APPS_EN_PROVES = appsEnProves();

/** El text de la insígnia en la llengua de la interfície ('es-ES' → 'es'); sense textos per a ella, el valencià. */
export function textBetaOberta(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_BETA_OBERTA, codi) ? TEXTOS_BETA_OBERTA[codi] : TEXTOS_BETA_OBERTA.ca;
}

/* Gauntlet 261022_0225 (troballa F7 i auditoria didàctica de /plugin/gestoria
   i /plugin/rss) · El motiu, en paraules del poble i traduïble: [clau,
   reserva], i el valencià és la reserva. Abans, literals fixos amb «node»,
   «app», «amfitrió», «desenvolupament» i «codi», que el canvi d'idioma no
   traduïa. El mateix parell de verbs que el botó de la pàgina del plugin:
   «desactivar» i «tornar a activar». P0-113 (ordre del Mestre, 261111) · Cap
   motiu de pagament: tot és gratuït i lliure. */
const TEXT_MOTIU = Object.freeze({
  'no-compilada': Object.freeze(['plataforma.motiu.noCompilada', 'Esta web encara no té esta eina.']),
  'entorn-desenvolupament': Object.freeze(['plataforma.motiu.entornDesenvolupament', 'Esta eina encara està en proves i no està a punt per a tothom.']),
  'amfitrio-no-la-declara': Object.freeze(['plataforma.motiu.amfitrioNoLaDeclara', 'Qui porta esta web no l’ha encesa.']),
  'apagada-per-defecte': Object.freeze(['plataforma.motiu.apagadaPerDefecte', 'Esta web la té apagada, de moment.']),
  'persona-apagada': Object.freeze(['plataforma.motiu.personaApagada', 'L’has desactivada tu. La pots tornar a activar quan vulgues.']),
  'sense-capacitat': Object.freeze(['plataforma.motiu.senseCapacitat', 'Esta web encara no té tot el que esta eina necessita per a funcionar.']),
  /* R19 · Arbitratge del carril Genealogia + Perfil (P1) · El motiu el porten Salut i l'Arbre Genealògic
     (dadesPersonals 'salut': genealogia/manifest.js, «l'únic valor que activa la guarda d'ama del document»).
     L'Arbre no guarda dades de salut: el text diu el que és cert per a totes dues. Abans: «Guarda dades de salut». */
  'document-no-propi': Object.freeze(['plataforma.motiu.documentNoPropi', 'Guarda dades personals delicades: només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web.']),
  'document-no-propi-financeres': Object.freeze(['plataforma.motiu.documentNoPropiFinanceres', 'Guarda dades financeres: només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web.'])
});

/* Onada R17 (AH-R17-09; arbitratge R18) · Les adreces del panell de verificadors.
   Les de les botigues, de les seues fonts canòniques: la de proves de Google Play,
   validada a botiguesSistemaModel.js (urlOptInDePlay), i la de l'App Store, de
   canalsDeBotiga.js passada per urlDeCanal (MODEL_BOTIGUES.canals). Sense una
   adreça vàlida, el seu botó no es pinta. El grup obert de verificadors no té
   constant canònica: és l'adreça pública del grup. */
const URL_GRUP_VERIFICADORS = 'https://groups.google.com/g/socdepoble-testers';
const URL_PROVES_PLAY = MODEL_BOTIGUES.play.optInUrl;
const URL_APP_STORE = MODEL_BOTIGUES.canals.find((canal) => canal.id === 'app-store')?.url ?? null;

/* Sense traductor (qui no en té cap a mà), el valencià de reserva. */
const RESERVA = (_clau, reserva) => reserva;

/** El text que explica un motiu d'estat (interruptors.js). `t(clau, reserva)`, el traductor de la UI. */
export function textDelMotiu(motiu, t = RESERVA) {
  if (typeof motiu !== 'string' || !Object.hasOwn(TEXT_MOTIU, motiu)) return '';
  return t(...TEXT_MOTIU[motiu]);
}

function FitxaApp({ app, idioma, llenguaInterficie, onApaga }) {
  const { t } = useUIActions();
  const { manifest, estat, motiu, personaPotApagar } = app;
  const Icona = iconaDe(manifest.icona);
  const titol = titolDe(manifest.titol, idioma);
  const encesa = personaPotApagar && motiu !== 'persona-apagada';
  /* P0-113 · Només una app interna: una de l'amfitrió no és cap eina del registre. */
  const enProves = manifest.origen === 'interna' && APPS_EN_PROVES.includes(manifest.id);
  return (
    <li className="sdp-app-fitxa" data-sdp-app={manifest.id}>
      <span className="sdp-app-fitxa__icona" aria-hidden="true">
        <Icona size={28} strokeWidth={2.1} focusable="false" />
      </span>
      <div className="sdp-app-fitxa__cos">
        <h2 className="sdp-app-fitxa__titol">{titol}</h2>
        <p className="sdp-app-fitxa__estat">
          <Insignia to={TO_ESTAT[estat]}>{ETIQUETA_ESTAT[estat]}</Insignia>
          {enProves ? <>{' '}<span className="sdp-insignia-beta-oberta">{textBetaOberta(llenguaInterficie)}</span></> : null}
        </p>
        {motiu ? <p className="sdp-app-fitxa__motiu">{textDelMotiu(motiu, t)}</p> : null}
      </div>
      <div className="sdp-app-fitxa__accions">
        <Interruptor
          etiqueta={`Vull vore ${titol}`}
          actiu={encesa}
          desactivat={!personaPotApagar}
          onCanvi={(actiu) => onApaga(manifest.id, !actiu)}
        />
        {estat === 'available'
          ? <Link to={rutaDeApp(manifest.id, manifest.entradaPerDefecte)} className="sdp-boto sdp-boto--primari">Obri</Link>
          : null}
      </div>
    </li>
  );
}

/* Norma del Mestre, 261004 (logotips; «SÍ A TOT») · El portal és una pàgina
   de sistema i porta l'anatomia de totes: abans pintava el bloc del títol a
   mà, fora de la Pàgina Universal, sense barres ni logotip. Ara és la Pàgina
   Universal de les apps (PaginaApp, la porta permesa des de src/apps): doble
   barra, la boina de Sóc de Poble (sense autor, signa el projecte i enllaça al
   seu perfil; Onada 8, 261009: abans, a /projecte) i el seu logotip dalt de
   l'H1. El contingut i l'ordre, els de
   sempre: l'H1, l'entradeta i la llista. Tornar va a la pàgina d'abans, com
   a la resta de pàgines de sistema (UniversalPage).
   Onada R17 (AH-R17-09) · Per a la superadministració, i només per a ella
   (`esSuperadmin`, el booleà de la sessió que passa RutaApps), l'accés directe
   al grup de verificadors i a les botigues oficials, davant de la llista. */
export function PortalApps({ esSuperadmin = false }) {
  const apps = useApps();
  const apaga = useApagaApp();
  const navigate = useNavigate();
  /* Fase D (261020, tasca 4.1) · L1 · Els títols seguixen la llengua del text, no la demanada. */
  const { language, llenguaDelText = language } = useUIState();
  return (
    <PaginaApp
      title="Apps"
      lead="Eines del poble que s’enxufen i es desenxufen. El node decidix quines porta; tu, quines vols vore."
      onBack={() => navigate(-1)}
    >
      <div className="sdp-app-portal">
        {esSuperadmin ? (
          <section className="sdp-app-portal__testers" aria-labelledby="sdp-app-portal-testers-titol">
            <h2 id="sdp-app-portal-testers-titol" className="sdp-app-portal__testers-titol">Gestió de verificadors i botigues</h2>
            <p className="sdp-app-portal__testers-text">
              Accés directe per a l’administració del grup obert de Google Groups, el programa de proves d’Android i les botigues oficials.
            </p>
            <div className="sdp-app-portal__testers-accions">
              <a
                href={URL_GRUP_VERIFICADORS}
                target="_blank"
                rel="noopener noreferrer"
                className="sdp-boto sdp-boto--primari"
              >
                Grup Google Groups (socdepoble-testers)
              </a>
              {URL_PROVES_PLAY ? (
                <a
                  href={URL_PROVES_PLAY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdp-boto sdp-boto--secundari"
                >
                  Proves a Google Play
                </a>
              ) : null}
              {URL_APP_STORE ? (
                <a
                  href={URL_APP_STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdp-boto sdp-boto--secundari"
                >
                  App Store (iOS)
                </a>
              ) : null}
              <Link to="/admin" className="sdp-boto sdp-boto--secundari">
                Tauler de botigues (/admin)
              </Link>
            </div>
          </section>
        ) : null}
        {apps.length === 0 ? (
          <EstatBuit titol="Encara no hi ha cap app">Quan este node en porte alguna, la voràs ací.</EstatBuit>
        ) : (
          <ul className="sdp-app-portal__llista">
            {apps.map((app) => (
              <FitxaApp key={app.manifest.id} app={app} idioma={llenguaDelText} llenguaInterficie={language} onApaga={apaga} />
            ))}
          </ul>
        )}
      </div>
    </PaginaApp>
  );
}
