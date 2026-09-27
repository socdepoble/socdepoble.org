/**
 * ClosCaXat.jsx — la closca compartida del Xat i del Control del xat
 * (pla 260927_0055 §4.D, DEC-02): un AppGridShell amb el rail esquerre
 * («Xat»: Converses i la roda del Control), plegat per defecte com la barra
 * estreta de WhatsApp Web i recordat amb getVal/setVal('sdp-xat-rail').
 *
 * Les dos seccions munten exactament el mateix rail: canvia només l'entrada
 * activa i el que va a les columnes central i dreta. AppGridShell ja porta
 * els separadors redimensionables en mode ample (requisit del Mestre per a
 * l'iPad, acta 260927_0230).
 */
import { useCallback, useState } from 'react';
import { MessageCircle, Settings } from 'lucide-react';
import AppGridShell from '../../../components/layout/AppGridShell.jsx';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useUIActions } from '../../../app/contexts/UIContext';
import { getVal, setVal } from '../../../config/storage.js';

export const CLAU_RAIL = 'sdp-xat-rail';

function railPlegatInicial() {
  return getVal(CLAU_RAIL, 'plegat') !== 'obert';
}

export default function ClosCaXat({
  activa = 'converses',
  middleTitle,
  middleIcon = null,
  middleColumn,
  rightColumn
}) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  const [plegat, setPlegat] = useState(railPlegatInicial);

  const alterna = useCallback(() => {
    const seguent = !plegat;
    setVal(CLAU_RAIL, seguent ? 'plegat' : 'obert');
    setPlegat(seguent);
  }, [plegat]);

  const titolRail = t('section.xat.rail.titol', 'Xat');
  const etiquetaConverses = t('section.xat.rail.converses', 'Converses');
  const etiquetaControl = t('section.xat.rail.control', 'Control del xat');

  /* La roda és l'entrada «Control del xat»: a la fila 2 (com la del Bloc de
     Notes) i, plegada, just davall del botó d'expandir. */
  const accioControl = {
    id: 'control',
    etiqueta: etiquetaControl,
    icona: Settings,
    pressed: activa === 'control',
    onAcciona: () => navigate('/control-xat')
  };

  const railConverses = (
    <nav className="sdp-workspace-rail" aria-label={titolRail}>
      <ul className="sdp-workspace-rail__grup">
        <li>
          <button
            type="button"
            className="sdp-workspace-rail__boto"
            aria-label={etiquetaConverses}
            title={etiquetaConverses}
            aria-current={activa === 'converses' ? 'page' : undefined}
            onClick={() => navigate('/xat')}
          >
            <MessageCircle size={20} aria-hidden="true" focusable="false" />
          </button>
        </li>
      </ul>
    </nav>
  );

  const leftColumn = plegat ? (
    <aside className="sdp-workspace-column" aria-label={titolRail}>
      <AppGridColumn
        variant="collapsed"
        esDark={true}
        titol={titolRail}
        icona={MessageCircle}
        endActions={[accioControl]}
        onReplega={alterna}
      >
        {railConverses}
      </AppGridColumn>
    </aside>
  ) : (
    <aside className="sdp-workspace-column" aria-label={titolRail}>
      <AppGridColumn esDark={true} titol={titolRail} icona={MessageCircle} onReplega={alterna} />
      <AppGridColumn esDark="intens" endActions={[accioControl]} />
      <nav className="sdp-workspace-column__body" aria-label={titolRail}>
        <ul className="sdp-xat-rail-llista">
          <li>
            <button
              type="button"
              className="sdp-workspace-nav-item"
              aria-current={activa === 'converses' ? 'page' : undefined}
              onClick={() => navigate('/xat')}
            >
              <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
                <MessageCircle size={18} aria-hidden="true" focusable="false" />
              </span>
              <span className="sdp-workspace-nav-item__label">{etiquetaConverses}</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );

  return (
    <AppGridShell
      aria-label={t('section.xat.closca', 'Espai del xat')}
      className="sdp-workspace sdp-xat"
      leftTitle={titolRail}
      middleTitle={middleTitle}
      leftIcon={MessageCircle}
      middleIcon={middleIcon}
      leftCollapsed={plegat}
      leftColumn={leftColumn}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}
