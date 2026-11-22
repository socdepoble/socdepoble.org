/**
 * FitxaRevisioImportacioWp.jsx — IDEA-125 · La «🔍 Fitxa de Revisió d’Importació» dins de
 * l'«Edició avançada» del Bloc de notes (ranura `revisioEdicioAvancada` de la closca), per a
 * la nota en revisió d'una pàgina importada de WordPress (ImportacioPaginaWpNotes, camp
 * `importacioWp`).
 *
 * Llig i escriu el mateix registre que el Banc d'Importació (revisioImportacioWpStore.js):
 * un canvi fet ací es veu al Banc, i un canvi fet al Banc es veu ací. El desament és el de
 * sempre: primer en este navegador i, si el backend té la capacitat, al servidor amb CAS, amb
 * l'autoria i el destí de l'article que hi posa el Banc (desaRevisio els completa).
 * L'avís diu el que ha passat de veres (Llei 0): confirmat pel servidor, desat només en este
 * navegador o en conflicte amb una altra revisió.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { rutaFitxaOrganitzacio } from '../../config/navigation.js';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { avisDeRevisioEditorial } from '../../data/importacio/textosRevisioEditorialWp.js';
import { capturaSessio } from '../../data/identitat.js';
import {
  ETIQUETES_ESTAT_REVISIO_WP,
  desaRevisio,
  useRevisioImportacioWp
} from '../../data/importacio/revisioImportacioWpStore.js';

/* La mateixa ruta que la fitxa del detall del Mur (detailSectionMeta.jsx): «📥 Importació i
   Revisió Editorial» dins d'«🛡️ Administració del sistema». */
export const RUTA_BANC_IMPORTACIO = `${rutaFitxaOrganitzacio('administracio-sistema')}&apartat=admin-importacio`;

export const TITOL_FITXA_REVISIO_IMPORTACIO = '🔍 Fitxa de Revisió d’Importació';

function FitxaRevisioImportacioWpInterna({ wpId, disabled = false }) {
  const ui = useUIActionsOpcional();
  const validaSessio = capturaSessio();
  const revisio = useRevisioImportacioWp(wpId);
  const idNota = useId();
  /* null: la nota segueix el registre (i, per tant, el Banc). Amb text: l'esborrany d'ací. */
  const [esborrany, setEsborrany] = useState(null);
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState('');
  const base = useRef(undefined);
  const desamentEnVol = useRef(false);
  const muntat = useRef(true);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; }; }, []);

  const insignia = ETIQUETES_ESTAT_REVISIO_WP[revisio.estat] || ETIQUETES_ESTAT_REVISIO_WP.pendent_admin;
  const nota = esborrany ?? revisio.nota;
  const inactiu = disabled || desant;

  const escriuNota = (text) => {
    /* La base del CAS és la versió que hi havia quan s'ha començat a escriure, com al Banc. */
    if (esborrany === null) base.current = revisio.versio;
    setEsborrany(text);
  };

  const canviaEstat = async (estat) => {
    if (inactiu || desamentEnVol.current) return;
    try { validaSessio(); } catch { return; }
    desamentEnVol.current = true;
    setDesant(true);
    setAvis('');
    try {
      const resultat = await desaRevisio(wpId, { estat, nota }, { actualitzatEsperat: base.current });
      validaSessio();
      if (!muntat.current) return;
      setAvis(avisDeRevisioEditorial(resultat, { language: ui?.language, t: ui?.t }));
      if (resultat?.conflicte) return;
      if (resultat?.remot === true) base.current = resultat.fila?.actualitzatA;
      if (resultat?.desatLocal === true) {
        base.current = undefined;
        setEsborrany(null);
      }
    } catch (error) {
      if (muntat.current && error?.name !== 'AbortError') {
        setAvis(avisDeRevisioEditorial(null, { language: ui?.language, t: ui?.t }));
      }
    } finally {
      desamentEnVol.current = false;
      if (muntat.current) setDesant(false);
    }
  };

  return (
    <section className="sdp-admin-importacio__card" aria-label={TITOL_FITXA_REVISIO_IMPORTACIO} data-sdp-fitxa-revisio-importacio="true">
      <div className="sdp-admin-importacio__card-cap">
        <strong>{TITOL_FITXA_REVISIO_IMPORTACIO} · #{wpId}</strong>
        <Insignia to={insignia.to}>{insignia.label}</Insignia>
      </div>
      <label htmlFor={idNota}>Anotacions per a la transformació Pedra Seca</label>
      <textarea id={idNota} rows={3} value={nota} disabled={inactiu} onChange={(e) => escriuNota(e.target.value)} />
      <div className="sdp-admin-importacio__accions">
        <Boto varietat="primari" disabled={inactiu} onClick={() => canviaEstat('aprovat')}>
          ✅ Aprovar i desar nota
        </Boto>
        <Boto varietat="secundari" disabled={inactiu} onClick={() => canviaEstat('amb_observacions')}>
          📝 Marcar amb observacions
        </Boto>
        <Boto varietat="fantasma" disabled={inactiu} onClick={() => canviaEstat('pendent_admin')}>
          ⏳ Tornar a pendent
        </Boto>
        <Link className="sdp-boto sdp-boto--secundari" to={RUTA_BANC_IMPORTACIO}>
          ← Tornar a Importació i Revisió Editorial
        </Link>
      </div>
      {avis && <p role="status">{avis}</p>}
    </section>
  );
}

/* Cada document conserva la seua base i esborrany; una resposta d'A no pot netejar el de B. */
export default function FitxaRevisioImportacioWp(props) {
  return <FitxaRevisioImportacioWpInterna key={String(props.wpId)} {...props} />;
}
