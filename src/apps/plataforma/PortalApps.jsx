/**
 * Plataforma d'Apps Enxufables · el portal /app.
 *
 * La llista de les apps que coneix el registre, amb el seu estat dit en text
 * (mai només en color), el motiu quan no es pot obrir i l'interruptor de la
 * persona. L'interruptor només APAGA: si una altra capa (build, entorn,
 * amfitrió) l'apaga, la persona el veu desactivat i llig per què. Una app
 * premium sense dret ho diu tal qual: res de patrons foscos.
 */
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { PaginaApp } from '../../components/PedraSeca/index.js';
import { EstatBuit } from '../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Interruptor } from '../../components/PedraSeca/organismes/formulari.jsx';
import { iconaDe } from './iconesApp.js';
import { rutaDeApp, titolDe } from './manifestApp.js';
import { useApagaApp, useApps } from './PlataformaContext.jsx';

export const ETIQUETA_ESTAT = Object.freeze({
  available: 'Disponible',
  disabled: 'Apagada',
  unavailable: 'No disponible',
  unsubscribed: 'Premium'
});

const TO_ESTAT = Object.freeze({ available: 'exit', disabled: 'neutre', unavailable: 'avis', unsubscribed: 'info' });

/* Gauntlet 261022_0225 (troballa F7 i auditoria didàctica de /plugin/gestoria
   i /plugin/rss) · El motiu, en paraules del poble i traduïble: [clau,
   reserva], i el valencià és la reserva. Abans, literals fixos amb «node»,
   «app», «amfitrió», «desenvolupament», «premium» i «codi», que el canvi
   d'idioma no traduïa. El mateix parell de verbs que el botó de la pàgina
   del plugin: «desactivar» i «tornar a activar». */
const TEXT_MOTIU = Object.freeze({
  'no-compilada': Object.freeze(['plataforma.motiu.noCompilada', 'Esta web encara no té esta eina.']),
  'entorn-desenvolupament': Object.freeze(['plataforma.motiu.entornDesenvolupament', 'Esta eina encara està en proves i no està a punt per a tothom.']),
  'amfitrio-no-la-declara': Object.freeze(['plataforma.motiu.amfitrioNoLaDeclara', 'Qui porta esta web no l’ha encesa.']),
  'apagada-per-defecte': Object.freeze(['plataforma.motiu.apagadaPerDefecte', 'Esta web la té apagada, de moment.']),
  'persona-apagada': Object.freeze(['plataforma.motiu.personaApagada', 'L’has desactivada tu. La pots tornar a activar quan vulgues.']),
  'sense-capacitat': Object.freeze(['plataforma.motiu.senseCapacitat', 'Esta web encara no té tot el que esta eina necessita per a funcionar.']),
  'document-no-propi': Object.freeze(['plataforma.motiu.documentNoPropi', 'Guarda dades de salut: només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web.']),
  'document-no-propi-financeres': Object.freeze(['plataforma.motiu.documentNoPropiFinanceres', 'Guarda dades financeres: només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web.']),
  'sense-dret': Object.freeze(['plataforma.motiu.senseDret', 'És una eina de pagament i esta web encara no l’ha contractada. El programa és lliure: el que es paga és el servei.'])
});

/* Sense traductor (qui no en té cap a mà), el valencià de reserva. */
const RESERVA = (_clau, reserva) => reserva;

/** El text que explica un motiu d'estat (interruptors.js). `t(clau, reserva)`, el traductor de la UI. */
export function textDelMotiu(motiu, t = RESERVA) {
  if (typeof motiu !== 'string' || !Object.hasOwn(TEXT_MOTIU, motiu)) return '';
  return t(...TEXT_MOTIU[motiu]);
}

function FitxaApp({ app, idioma, onApaga }) {
  const { t } = useUIActions();
  const { manifest, estat, motiu, personaPotApagar } = app;
  const Icona = iconaDe(manifest.icona);
  const titol = titolDe(manifest.titol, idioma);
  const encesa = personaPotApagar && motiu !== 'persona-apagada';
  return (
    <li className="sdp-app-fitxa" data-sdp-app={manifest.id}>
      <span className="sdp-app-fitxa__icona" aria-hidden="true">
        <Icona size={28} strokeWidth={2.1} focusable="false" />
      </span>
      <div className="sdp-app-fitxa__cos">
        <h2 className="sdp-app-fitxa__titol">{titol}</h2>
        <p className="sdp-app-fitxa__estat">
          <Insignia to={TO_ESTAT[estat]}>{ETIQUETA_ESTAT[estat]}</Insignia>
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
   a la resta de pàgines de sistema (UniversalPage). */
export function PortalApps() {
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
        {apps.length === 0 ? (
          <EstatBuit titol="Encara no hi ha cap app">Quan este node en porte alguna, la voràs ací.</EstatBuit>
        ) : (
          <ul className="sdp-app-portal__llista">
            {apps.map((app) => <FitxaApp key={app.manifest.id} app={app} idioma={llenguaDelText} onApaga={apaga} />)}
          </ul>
        )}
      </div>
    </PaginaApp>
  );
}
