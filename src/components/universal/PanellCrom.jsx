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
import { Dialeg, Camp, CampText, Boto, Alerta } from '../PedraSeca';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { adminDesaPersonalitzacio, teCapacitat } from '../../data/backendPort.js';
import { MISSATGE_PERSONALITZACIO } from '../../data/errorsBackend.js';
import { ambCrom } from '../../config/estil.js';
import { aplica, restaura, base, deltaDe, previsualitza, CANON_BLAU } from '../../config/crom.js';

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Com AdminSection: un port que
   no és a punt i llança també val com a «sense la capacitat». */
function ambCapacitatPersonalitzacio() {
  try { return teCapacitat('personalitzacio') === true; } catch { return false; }
}

export function PanellCrom({ arrel, obert, onTanca }) {
  const [color, setColor] = useState('');
  const aplicatRef = useRef(false);

  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · «Desar»: el gir aplicat
     passa a l'estil del poble (clau 'estil' de la personalització, estil.js),
     fusionat amb els tokens que ja hi ha desats i amb la versió que s'editava;
     l'error es diu pel codi ('cal-segon-factor', 'conflicte-versio'…). Només
     amb la capacitat 'personalitzacio': sense ella, el DOM d'abans, byte a byte. */
  const { personalitzacio, refresh } = useCoreContent();
  const estilDesat = personalitzacio?.estil ?? null;
  const [potDesar] = useState(ambCapacitatPersonalitzacio);
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState(null);
  const viu = useRef(true);
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);

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

  /* Promise.resolve().then: el port llança de manera síncrona si el mètode no hi és, i això també acaba a l'avís. */
  const desaAlPoble = useCallback(() => {
    if (!arrel) return;
    aplica(arrel, delta);
    aplicatRef.current = delta !== 0;
    setDesant(true);
    setAvis(null);
    Promise.resolve()
      .then(() => adminDesaPersonalitzacio({ clau: 'estil', payload: ambCrom(estilDesat?.payload, delta), versio: estilDesat?.versio ?? null }))
      .then((resultat) => {
        if (!viu.current) return;
        setAvis({ to: 'exit', text: `Crom desat per a tot el poble (versió ${resultat?.versio ?? '?'}).` });
        refresh?.();
      })
      .catch((err) => { if (viu.current) setAvis({ to: 'error', text: MISSATGE_PERSONALITZACIO[err?.code] || MISSATGE_PERSONALITZACIO.desconegut }); })
      .finally(() => { if (viu.current) setDesant(false); });
  }, [arrel, delta, estilDesat, refresh]);

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
          {potDesar ? <Boto varietat="primari" onClick={desaAlPoble} carregant={desant}>Desar</Boto> : null}
          <Boto varietat="secundari" onClick={torna}>Tornar al cànon</Boto>
        </div>
        {avis ? <Alerta to={avis.to} onTanca={() => setAvis(null)}>{avis.text}</Alerta> : null}
      </div>
    </Dialeg>
  );
}

/** Disparador. Captura l'arrel de la instància des del seu propi node.
 *
 * Prompt 261014_0400 (ordre del Mestre) · És fill de la TopBar (App.jsx): sense
 * SessionProvider no hi ha rol i no pinta res, en lloc de llançar. Guarda
 * defensiva, com la de useIdentitatDeLaBarra.js (el HMR de desenvolupament
 * deixa la barra lligada a un SessionContext vell; en producció no passa). */
export function BotoCrom() {
  const rol = useSessioOpcional()?.rol ?? null;
  const [obert, setObert] = useState(false);
  const [arrel, setArrel] = useState(null);

  const setNode = useCallback((node) => {
    if (node) setArrel(node.closest('.sdp-root') || null);
  }, []);

  // Només el superadmin veu la roda, també en desenvolupament (ordre del
  // Mestre, 260924): en local cal una sessió superadmin. Neteja 261007 (prompt
  // 261007_1628, peça D) · /consola ja no és el model: a `vite serve` s'obri
  // sense sessió (consolaDemanaSessio, src/app/guards/guardaConsola.js), i
  // només els builds la tanquen darrere del rol superadmin.
  if (rol !== 'superadmin') return null;

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
