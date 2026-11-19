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
import {
  ETIQUETES_ESTAT_REVISIO_WP,
  desaRevisio,
  useRevisioImportacioWp
} from '../../data/importacio/revisioImportacioWpStore.js';

/* La mateixa ruta que la fitxa del detall del Mur (detailSectionMeta.jsx): «📥 Importació i
   Revisió Editorial» dins d'«🛡️ Administració del sistema». */
export const RUTA_BANC_IMPORTACIO = `${rutaFitxaOrganitzacio('administracio-sistema')}&apartat=admin-importacio`;

export const TITOL_FITXA_REVISIO_IMPORTACIO = '🔍 Fitxa de Revisió d’Importació';

export default function FitxaRevisioImportacioWp({ wpId, disabled = false }) {
  const revisio = useRevisioImportacioWp(wpId);
  const idNota = useId();
  /* null: la nota segueix el registre (i, per tant, el Banc). Amb text: l'esborrany d'ací. */
  const [esborrany, setEsborrany] = useState(null);
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState('');
  const base = useRef(undefined);
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
    if (inactiu) return;
    setDesant(true);
    setAvis('');
    const resultat = await desaRevisio(wpId, { estat, nota }, { actualitzatEsperat: base.current });
    if (!muntat.current) return;
    setDesant(false);
    if (resultat?.conflicte) {
      setAvis('Una altra revisió ha canviat al servidor. La teua nota continua desada en este navegador.');
      return;
    }
    base.current = undefined;
    setEsborrany(null);
    setAvis(resultat?.remot ? 'Revisió confirmada pel servidor.' : 'Revisió desada només en este navegador.');
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
