import { useEffect, useId, useRef, useState } from 'react';
import { Interruptor } from '../../components/PedraSeca/index.js';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { entradaSessio } from '../../data/identitat.js';
import * as port from '../../data/backendPort.js';
import { abastDe } from '../pobles/useEntitatsDelPoble.js';

const reserva = (_clau, text) => text;
const disponible = () => { try { return port.teCapacitat('connexionsPubliques') === true; } catch { return false; } };
const tipusValid = tipus => ['persona', 'entitat', 'poble'].includes(tipus);
const clauDe = fila => `${fila.tipus}:${fila.id}`;
export function rutaDeConnexio(fila) {
  if (!tipusValid(fila?.tipus) || typeof fila.id !== 'string' || !fila.id.trim()) return null;
  return `/${fila.tipus === 'persona' ? 'gent' : fila.tipus === 'entitat' ? 'entitats' : 'pobles'}/${encodeURIComponent(fila.id)}`;
}

/* El canvi de sessió, subjecte o backend buida la vista en el mateix render.
 * La resposta pública mai reutilitza una lectura de preferències privades. */
function useAbast({ tipus, id, config, visor }) {
  const sessio = useSessioOpcional();
  return disponible() && tipusValid(tipus) && id != null && String(id).trim()
    ? JSON.stringify([tipus, String(id), abastDe(config), sessio?.currentUser?.id ?? null, entradaSessio(), visor]) : null;
}

export function ConnexionsPubliques({ tipus, id, config = {}, visor = null, revisio = 0, t = reserva }) {
  const titol = useId();
  const clau = useAbast({ tipus, id, config, visor: JSON.stringify([visor, revisio]) });
  const configRef = useRef(config); configRef.current = config;
  const [resultat, setResultat] = useState({ clau: null, estat: 'carregant', files: [] });
  useEffect(() => {
    if (!clau) return undefined;
    const controller = new AbortController();
    const opcio = { ...configRef.current, signal: controller.signal };
    Promise.resolve().then(() => tipus === 'persona'
      ? port.connexionsPubliquesDe({ tipus, id: String(id) }, opcio)
      : port.membresIEntitatsConnectadesDe({ tipus, id: String(id) }, opcio))
      .then(files => { if (!controller.signal.aborted) setResultat({ clau, estat: 'llest', files: Array.isArray(files) ? files : [] }); })
      .catch(() => { if (!controller.signal.aborted) setResultat({ clau, estat: 'error', files: [] }); });
    return () => controller.abort();
  }, [clau, tipus, id]);
  if (!clau) return null;
  const actual = resultat.clau === clau ? resultat : { estat: 'carregant', files: [] };
  const files = [...new Map(actual.files.filter(fila => rutaDeConnexio(fila)).map(fila => [clauDe(fila), fila])).values()];
  return (
    <section aria-labelledby={titol}>
      <h3 id={titol}>{tipus === 'poble'
        ? t('section.perfil.connexions.poble', 'Veïnat, empreses i entitats connectades al poble')
        : t('section.perfil.connexions.publiques', 'Connexions públiques')}</h3>
      {actual.estat === 'carregant' ? <p>{t('section.perfil.connexions.carregant', 'Carregant les connexions…')}</p>
        : actual.estat === 'error' ? <p className="sdp-camp__error">{t('section.perfil.connexions.error', 'No s’han pogut llegir les connexions. Torna-ho a provar.')}</p>
          : files.length ? <ul>{files.map(fila => (
            <li key={clauDe(fila)}><a href={rutaDeConnexio(fila)}>{fila.nom || t('section.perfil.connexions.senseNom', 'Sense nom')}</a>
              {fila.rol ? ` · ${textDeRol(fila.rol, t)}` : null}</li>
          ))}</ul>
            : <p className="sdp-buit">{t('section.perfil.connexions.buit', 'No hi ha connexions públiques per a mostrar.')}</p>}
    </section>
  );
}

export function textDeRol(rol, t = reserva) {
  if (rol === 'administrador') return t('section.perfil.connexions.administrador', 'Administrador');
  if (rol === 'treballador') return t('section.perfil.connexions.treballador', 'Treballador / Soci');
  return t('section.perfil.connexions.usuari', 'Usuari / Membre');
}

/** Només les preferències autoritzades es consulten ací. El servidor valida
 * de nou qui les pot modificar; l'estat no anticipa una escriptura reeixida. */
export function VisibilitatConnexions({ tipus = 'persona', id, config = {}, visor = null, onCanvi, t = reserva }) {
  const titol = useId();
  const clau = useAbast({ tipus, id, config, visor });
  const vigent = useRef({ clau, generacio: 0 });
  if (vigent.current.clau !== clau) vigent.current = { clau, generacio: vigent.current.generacio + 1 };
  const configRef = useRef(config); configRef.current = config;
  const onCanviRef = useRef(onCanvi); onCanviRef.current = onCanvi;
  const ocupat = useRef(null);
  const [resultat, setResultat] = useState({ clau: null, estat: 'carregant', preferencies: null, ocupat: false, error: false });
  useEffect(() => {
    ocupat.current = null;
    if (!clau) return undefined;
    const controller = new AbortController();
    Promise.resolve().then(() => port.preferenciesConnexions({ tipus, id: String(id) }, { ...configRef.current, signal: controller.signal }))
      .then(preferencies => { if (!controller.signal.aborted) setResultat({ clau, estat: 'llest', preferencies, ocupat: false, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setResultat({ clau, estat: 'error', preferencies: null, ocupat: false, error: true }); });
    return () => controller.abort();
  }, [clau, tipus, id]);
  useEffect(() => {
    vigent.current.clau = clau;
    return () => { vigent.current = { clau: null, generacio: vigent.current.generacio + 1 }; };
  }, [clau]);
  if (!clau) return null;
  const actual = resultat.clau === clau ? resultat : { estat: 'carregant', preferencies: null, ocupat: false, error: false };
  const canvia = async (actiu, connexio) => {
    if (ocupat.current || actual.estat !== 'llest') return;
    const generacio = vigent.current.generacio;
    const encara = () => vigent.current.clau === clau && vigent.current.generacio === generacio;
    const opcio = configRef.current;
    const operacio = {};
    ocupat.current = operacio;
    setResultat(antic => ({ ...antic, ocupat: true, error: false }));
    try {
      await port.desaVisibilitatConnexions({ tipus, id: String(id), visibilitatConnexions: actiu ? 'publica' : 'privada', ...(connexio ? { connexio: { tipus: connexio.tipus, id: connexio.id } } : {}) }, opcio);
      if (!encara()) return;
      onCanviRef.current?.();
      const preferencies = await port.preferenciesConnexions({ tipus, id: String(id) }, opcio);
      if (encara()) setResultat({ clau, estat: 'llest', preferencies, ocupat: false, error: false });
    } catch { if (encara()) setResultat(antic => ({ ...antic, ocupat: false, error: true })); }
    finally { if (ocupat.current === operacio) ocupat.current = null; }
  };
  const connexions = Array.isArray(actual.preferencies?.connexions) ? actual.preferencies.connexions.filter(fila => rutaDeConnexio(fila)) : [];
  return (
    <section aria-labelledby={titol} translate="no">
      <h3 id={titol}>{t('section.perfil.connexions.visibilitat', 'Visibilitat de les connexions')}</h3>
      {actual.estat === 'carregant' ? <p>{t('section.perfil.connexions.carregant', 'Carregant les connexions…')}</p> : null}
      {actual.estat === 'llest' ? <>
        <Interruptor etiqueta={t('section.perfil.connexions.mostra', 'Mostrar les meues connexions públicament')}
          actiu={actual.preferencies?.visibilitatConnexions === 'publica'} onCanvi={actiu => canvia(actiu)} desactivat={actual.ocupat}
          textosEstat={{ si: t('section.perfil.connexions.publica', 'Públiques'), no: t('section.perfil.connexions.privada', 'Privades') }} />
        <p className="sdp-camp__ajuda">{t('section.perfil.connexions.ajuda', 'En privat, cap connexió apareix a la fitxa pública. En públic, pots ocultar-ne una a una; les connexions entrants respecten també la privacitat de l’altra part.')}</p>
        {connexions.length ? <ul>{connexions.map(fila => <li key={clauDe(fila)}>
          <a href={rutaDeConnexio(fila)}>{fila.nom || t('section.perfil.connexions.senseNom', 'Sense nom')}</a>
          <Interruptor etiqueta={`${t('section.perfil.connexions.mostraConnexio', 'Mostrar esta connexió')}: ${fila.nom || fila.id}`}
            actiu={fila.visibilitatConnexions === 'publica'} onCanvi={actiu => canvia(actiu, fila)} desactivat={actual.ocupat}
            textosEstat={{ si: t('section.perfil.connexions.publica', 'Públiques'), no: t('section.perfil.connexions.privada', 'Privades') }} />
        </li>)}</ul> : null}
      </> : null}
      {actual.error ? <p role={actual.estat === 'llest' ? 'status' : undefined} className="sdp-camp__error">{actual.estat === 'llest'
        ? t('section.perfil.connexions.errorDesa', 'No s’ha pogut completar el canvi de visibilitat. Revisa el resultat abans de tornar-ho a provar.')
        : t('section.perfil.connexions.error', 'No s’han pogut llegir les connexions. Torna-ho a provar.')}</p> : null}
      {actual.ocupat ? <p aria-live="polite" role="status">{t('section.perfil.connexions.desant', 'Desant la visibilitat…')}</p> : null}
    </section>
  );
}
