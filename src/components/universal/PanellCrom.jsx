/**
 * PanellCrom.jsx — tauler de crom per a superadministradors.
 *
 * Escriu NOMÉS la capa de primitius (--sdp-primary-*, --sdp-secondary-*),
 * que és la feina que tokens.css li assigna. Els components continuen
 * pintant amb semàntics: cap hex arriba mai a un component (Pedra Seca §2).
 *
 * L'escriptura va sobre la .sdp-root de la instància, no sobre el document:
 * l'app viu dins d'un shadow root tancat i la pàgina amfitriona no és nostra.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { Dialeg, Camp, CampText, Boto } from '../PedraSeca';
import { useSession } from '../../app/contexts/SessionContext';
import { aplica, restaura, base, deltaDe, previsualitza, CANON_BLAU } from '../../config/crom.js';

export function PanellCrom({ arrel, obert, onTanca }) {
  const [color, setColor] = useState('');
  const aplicatRef = useRef(false);

  useEffect(() => {
    if (!arrel || !obert || color) return;
    setColor(base(arrel).canons[CANON_BLAU]);
  }, [arrel, obert, color]);

  const delta = useMemo(
    () => (arrel && color ? deltaDe(arrel, color) : 0),
    [arrel, color]
  );

  const mostres = useMemo(
    () => (arrel && obert ? previsualitza(arrel, delta) : []),
    [arrel, obert, delta]
  );

  const desa = useCallback(() => {
    if (!arrel) return;
    aplica(arrel, delta);
    aplicatRef.current = delta !== 0;
    onTanca?.();
  }, [arrel, delta, onTanca]);

  const torna = useCallback(() => {
    if (!arrel) return;
    restaura(arrel);
    aplicatRef.current = false;
    setColor(base(arrel).canons[CANON_BLAU]);
  }, [arrel]);

  return (
    <Dialeg obert={obert} onTanca={onTanca} titol="Crom del sistema" costat="dreta">
      <div className="sdp-crom-panell">
        <Camp
          etiqueta="Color principal"
          ajuda="Es pren només el to. La lluminositat i el croma de cada esglaó es conserven: és el que manté els contrastos mesurats de tokens.css. El taronja complementari gira amb el mateix delta."
        >
          <CampText tipus="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Camp>
        <p className="sdp-camp__ajuda">
          Gir aplicat: {delta.toFixed(1)}°{delta === 0 ? ' — paleta canònica intacta' : ''}
        </p>

        {mostres.map(({ rampa, passos }) => (
          <div key={rampa} className="sdp-crom-rampa">
            <span className="sdp-camp__etiqueta">{rampa === 'secondary' ? 'Acció' : 'Accent'}</span>
            <ul className="sdp-crom-mostres">
              {passos.map(({ pas, hex }) => (
                <li key={pas} className="sdp-crom-mostra" style={{ '--sdp-crom-mostra': typeof hex === 'string' && hex.length === 7 && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null }}>
                  <span className="sr-only">{`${rampa} ${pas}: ${hex}`}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="sdp-alerta__accions">
          <Boto onClick={desa}>Aplicar</Boto>
          <Boto variant="secundari" onClick={torna}>Tornar al cànon</Boto>
        </div>
      </div>
    </Dialeg>
  );
}

/** Disparador. Captura l'arrel de la instància des del seu propi node. */
export function BotoCrom() {
  const { rol } = useSession();
  const [obert, setObert] = useState(false);
  const [arrel, setArrel] = useState(null);

  const setNode = useCallback((node) => {
    if (node) setArrel(node.closest('.sdp-root') || null);
  }, []);

  if (rol !== 'superadmin' && import.meta.env.MODE !== 'development') return null;

  return (
    <>
      <button
        ref={setNode}
        type="button"
        className="icon sdp-top-bar-btn"
        onClick={() => setObert(true)}
        aria-label="Crom del sistema"
        title="Crom del sistema"
      >
        <Settings aria-hidden="true" focusable="false" />
      </button>
      <PanellCrom arrel={arrel} obert={obert} onTanca={() => setObert(false)} />
    </>
  );
}
