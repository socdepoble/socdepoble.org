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
import { useUIState } from '../../app/contexts/UIContext';
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

const TEXT_MOTIU = Object.freeze({
  'no-compilada': 'Este node no porta esta app.',
  'entorn-desenvolupament': 'Encara està en obres: només es pot provar en desenvolupament.',
  'amfitrio-no-la-declara': 'L’amfitrió d’este node no l’ha activada.',
  'apagada-per-defecte': 'Este node no l’activa per defecte.',
  'persona-apagada': 'L’has apagada tu. La pots tornar a encendre quan vulgues.',
  'sense-capacitat': 'El servidor d’este node encara no té el que esta app necessita.',
  'document-no-propi': 'Guarda dades de salut: només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web.',
  'sense-dret': 'És una app premium i este node encara no en té el dret. Sóc de Poble és un projecte lliure: el premium paga el servei, no el codi.'
});

/** El text que explica un motiu d'estat (interruptors.js). */
export function textDelMotiu(motiu) {
  return TEXT_MOTIU[motiu] || '';
}

function FitxaApp({ app, idioma, onApaga }) {
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
        {motiu ? <p className="sdp-app-fitxa__motiu">{textDelMotiu(motiu)}</p> : null}
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
   barra, la boina de Sóc de Poble (sense autor, signa el projecte i enllaça a
   /projecte) i el seu logotip dalt de l'H1. El contingut i l'ordre, els de
   sempre: l'H1, l'entradeta i la llista. Tornar va a la pàgina d'abans, com
   a la resta de pàgines de sistema (UniversalPage). */
export function PortalApps() {
  const apps = useApps();
  const apaga = useApagaApp();
  const navigate = useNavigate();
  const { language } = useUIState();
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
            {apps.map((app) => <FitxaApp key={app.manifest.id} app={app} idioma={language} onApaga={apaga} />)}
          </ul>
        )}
      </div>
    </PaginaApp>
  );
}
