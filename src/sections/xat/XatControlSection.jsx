/**
 * XatControlSection.jsx — «Control del xat» (/control-xat) sobre la MATEIXA
 * closca que el Xat (ClosCaXat): rail esquerre amb la roda activa, la llista
 * d'opcions al centre i el contingut de l'opció triada a la dreta. AppGridShell
 * ja porta els separadors redimensionables en mode ample: així el panell
 * aprofita l'espai de l'iPad (requisit del Mestre, acta 260927_0230).
 *
 * L'opció «Amplària de les columnes» fa exactament el que fa la roda del Bloc
 * de Notes (WorkspaceSettingsDialog): els tres valors predefinits d'AppGridShell.
 * La resta d'opcions diuen honestament que encara no fan res (UX-D03).
 */
import { useState } from 'react';
import { Image as ImageIcon, PanelLeft, Settings, ShieldCheck, Timer } from 'lucide-react';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import { Boto } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import ClosCaXat from './components/ClosCaXat.jsx';
import PanellInicialMobil from './components/PanellInicialMobil.jsx';

const OPCIONS = [
  { id: 'multimedia', icona: ImageIcon, titol: ['section.xat.control.multimedia.titol', 'Multimèdia, enllaços i documents'], text: ['section.xat.control.multimedia.text', "Revisa tot el que s'ha enviat al xat."], pendent: true },
  { id: 'temporals', icona: Timer, titol: ['section.xat.control.temporals.titol', 'Missatges temporals'], text: ['section.xat.control.temporals.text', "Activa l'autodestrucció de missatges per a converses sensibles."], pendent: true },
  { id: 'privacitat', icona: ShieldCheck, titol: ['section.xat.control.privacitat.titol', 'Privacitat i seguretat'], text: ['section.xat.control.privacitat.text', 'Silenciar notificacions, bloquejar, xifratge extrem a extrem.'], pendent: true },
  { id: 'espai', icona: PanelLeft, titol: ['section.xat.control.espai.titol', 'Amplària de les columnes'], text: ['section.xat.control.espai.text', 'Tria com d\'amples són les columnes de navegació i de llista.'], pendent: false }
];

const PRESETS_AMPLARIA = [
  ['compacta', 'section.xat.control.espai.compacta', 'Compacta'],
  ['defecte', 'section.xat.control.espai.defecte', 'Per defecte'],
  ['ampla', 'section.xat.control.espai.ampla', 'Ampla']
];

export default function XatControlSection() {
  const { t } = useUIActions();
  const [opcioId, setOpcioId] = useState(null);
  const opcio = OPCIONS.find((o) => o.id === opcioId) || null;
  const titol = t('section.xat.control.titol', 'Control del xat');

  useSEO({
    title: titol,
    description: t('section.xatcontrol.subtitle', 'Ajustos, missatges temporals i organització de converses.'),
    image: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
  });

  const middleColumn = (
    <aside className="sdp-workspace-column" aria-label={titol}>
      <AppGridColumn esDark={true} titol={titol} icona={Settings} />
      <AppGridColumn esDark="intens" />
      <div className="sdp-workspace-column__body">
        <ul className="sdp-xat-llista" aria-label={t('section.xat.control.opcions', 'Opcions')}>
          {OPCIONS.map((o) => {
            const Icona = o.icona;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className="sdp-xat-opcio"
                  aria-current={opcioId === o.id ? 'true' : undefined}
                  onClick={() => setOpcioId(o.id)}
                >
                  <span className="sdp-xat-opcio__icona" aria-hidden="true">
                    <Icona size={22} aria-hidden="true" focusable="false" />
                  </span>
                  <span className="sdp-xat-opcio__cos">
                    <span className="sdp-xat-opcio__titol">{t(o.titol[0], o.titol[1])}</span>
                    <span className="sdp-xat-opcio__text">{t(o.text[0], o.text[1])}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );

  const rightColumn = (
    <>
      <PanellInicialMobil llistaPrimer={!opcio} />
      <div className="sdp-xat-control">
        {opcio ? (
          <DetallOpcio opcio={opcio} t={t} />
        ) : (
          <p className="sdp-workspace-state" role="status">{t('section.xat.control.tria', 'Tria una opció de la llista.')}</p>
        )}
      </div>
    </>
  );

  return (
    <ClosCaXat
      activa="control"
      middleTitle={titol}
      middleIcon={Settings}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}

function DetallOpcio({ opcio, t }) {
  return (
    <article className="sdp-xat-control__panell" aria-labelledby={`xat-control-${opcio.id}`}>
      <h2 id={`xat-control-${opcio.id}`}>{t(opcio.titol[0], opcio.titol[1])}</h2>
      <p>{t(opcio.text[0], opcio.text[1])}</p>
      {opcio.id === 'espai' ? <AmplariaColumnes t={t} /> : null}
      {opcio.pendent ? (
        <p className="sdp-xat-control__avis" role="status">
          {t('section.xat.control.pendent', 'Esta opció encara no està disponible: es construirà en la fase següent del xat.')}
        </p>
      ) : null}
    </article>
  );
}

/* La mateixa lògica que WorkspaceSettingsDialog del Bloc de Notes. */
function AmplariaColumnes({ t }) {
  const { applyPreset, columnWidths } = useAppGrid();
  return (
    <>
      <p className="sdp-xat-control__estat">
        {t('section.xat.control.espai.ara', 'Ara: navegació {left} px · llista {middle} px')
          .replace('{left}', String(columnWidths.left))
          .replace('{middle}', String(columnWidths.middle))}
      </p>
      <div className="sdp-xat-control__opcions" role="group" aria-label={t('section.xat.control.espai.titol', 'Amplària de les columnes')}>
        {PRESETS_AMPLARIA.map(([id, clau, alternativa]) => (
          <Boto key={id} varietat="secundari" onClick={() => applyPreset(id)}>{t(clau, alternativa)}</Boto>
        ))}
      </div>
    </>
  );
}
