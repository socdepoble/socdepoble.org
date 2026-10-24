import { useEffect, useId, useRef, useState } from 'react';
import { Taula } from '../../components/PedraSeca';
import { backendScope } from '../../config/backendConfig.js';
import { quiEmSegueix, teCapacitat } from '../../data/backendPort.js';

/* ═══════════════════════════════════════════════════════════════════
   T6b (IDEA-14; decisió del Mestre, 261024) · EL VEÏNAT CONNECTAT

   «Connectar amb {nom}» és d'un sol sentit, i l'altra banda ho sap: la
   constància és la llista del veïnat que s'hi ha connectat, sense cap
   algoritme (el port la torna per data, la més nova primer). Dos llocs:
   · GentQueEtSegueix: a la fitxa pròpia d'una persona (FitxaPublica),
     «Veïnat connectat amb tu», amb el traductor com la resta de la fitxa.
   · QuiSegueixOrganitzacio: a la gestió dels membres d'una organització
     (GestioMembres), «Veïnat connectat amb {nom}», en literal com la resta
     de la gestió; només per a qui l'administra (el servidor ho torna a dir:
     SDP-SEG-005).
   P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · «A Sóc de
   Poble no se seguix, es connecta»: només canvien els textos. El model és el
   de sempre (quiEmSegueix, un seguiment d'un sol sentit), i els noms de les
   peces i les claus section.perfil.seguidors.* es queden.
   Sense la capacitat 'seguiments' (un node sense seguiments és vàlid),
   cap dels dos pinta res ni crida el port. Cap regió viva: és una llista que
   es llig en obrir-se, no la resposta a cap acció.
   Cap context: el traductor, la llengua i la configuració arriben per
   props (FitxaPublica ja els té). Sense configuració, {}: el port la
   completa amb la de l'amfitrió i el mode triat (normalizeBackendConfig),
   la mateixa que pren el Perfil fora del Mercat i del Calendari.
   ═══════════════════════════════════════════════════════════════════ */

/* teCapacitat sense llançar, com useAdministrarOrganitzacio.js. */
const teSeguiments = () => {
  try { return teCapacitat('seguiments') === true; } catch { return false; }
};
/* L'abast del backend (endpoint, poble i mode): una configuració nova amb el
   mateix abast no torna a llegir la llista. */
const abastDe = (config) => {
  try { return backendScope(config || {}); } catch { return 'sense-abast'; }
};
const esCancel = (error) => error?.name === 'AbortError';

/** Una data ISO en format llarg de la llengua (per defecte, valencià), o ''. Pura. */
export function dataDelSeguiment(iso, locale = 'ca-ES') {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const forma = { day: 'numeric', month: 'long', year: 'numeric' };
  try { return data.toLocaleDateString(locale, forma); } catch { return data.toLocaleDateString('ca-ES', forma); }
}

/**
 * La llista del veïnat connectat amb la persona que mira (sense orgId) o amb l'entitat
 * orgId: { estat: 'inactiu' | 'carregant' | 'llest' | 'error', seguidors,
 * error }. 'inactiu' sense la capacitat. `config` (opcional): la de la vista;
 * sense ella, {}.
 */
export function useSeguidors({ orgId = null, config = null } = {}) {
  const configActual = config || {};
  /* La configuració canvia d'identitat a cada render del pare: es llig d'un ref. */
  const configRef = useRef(configActual);
  configRef.current = configActual;
  const entitat = orgId === null || orgId === undefined || orgId === '' ? null : String(orgId);
  const clau = teSeguiments() ? JSON.stringify([entitat, abastDe(configActual)]) : null;
  const [estat, setEstat] = useState({ clau: null, estat: 'carregant', seguidors: [], error: null });

  useEffect(() => {
    if (!clau) return undefined;
    const control = new AbortController();
    /* Dins del then: un port sense el mètode llança de manera síncrona. */
    Promise.resolve()
      .then(() => quiEmSegueix(entitat ? { orgId: entitat } : {}, { ...configRef.current, signal: control.signal }))
      .then((llista) => {
        if (!control.signal.aborted) setEstat({ clau, estat: 'llest', seguidors: Array.isArray(llista) ? llista : [], error: null });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat({ clau, estat: 'error', seguidors: [], error });
      });
    return () => control.abort();
  }, [clau, entitat]);

  if (!clau) return { estat: 'inactiu', seguidors: [], error: null };
  return estat.clau === clau ? estat : { estat: 'carregant', seguidors: [], error: null };
}

/* Sense traductor (una peça muntada sola), el valencià de reserva. */
const senseTraductor = (_clau, reserva) => reserva;

/** «Veïnat connectat amb tu», a la fitxa pròpia d'una persona. `t` i `locale`, els de la fitxa. */
export function GentQueEtSegueix({ config = null, t: traductor = null, locale: llengua = null }) {
  const id = useId();
  const t = typeof traductor === 'function' ? traductor : senseTraductor;
  const { estat, seguidors, error } = useSeguidors({ config });
  if (estat === 'inactiu') return null;
  const locale = typeof llengua === 'string' && llengua ? llengua : 'ca-ES';
  const titolId = `${id}-titol`;
  let cos;
  if (estat === 'carregant') {
    cos = <p className="sdp-buit">{t('section.perfil.seguidors.carregant', 'Carregant el veïnat connectat amb tu…')}</p>;
  } else if (estat === 'error') {
    cos = (
      <p className="sdp-camp__error">
        {error?.code === 'NO-DISPONIBLE'
          ? t('section.perfil.seguidors.noDisponible', 'Este servidor encara no guarda el veïnat connectat amb tu.')
          : t('section.perfil.seguidors.error', 'No s’ha pogut llegir el veïnat connectat amb tu. Torna-ho a provar més tard.')}
      </p>
    );
  } else if (seguidors.length) {
    cos = (
      <ul aria-labelledby={titolId}>
        {seguidors.map((seguidor) => (
          <li key={seguidor.id}>
            {seguidor.nom || t('section.perfil.seguidors.senseNom', 'Sense nom')}
            {seguidor.creatAl ? (
              <>
                {' · '}
                <time dateTime={seguidor.creatAl}>{dataDelSeguiment(seguidor.creatAl, locale)}</time>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    );
  } else {
    cos = <p className="sdp-buit">{t('section.perfil.seguidors.buit', 'Encara no s’ha connectat ningú amb tu.')}</p>;
  }
  return (
    <section aria-labelledby={titolId}>
      <h3 id={titolId}>{t('section.perfil.seguidors.titol', 'Veïnat connectat amb tu')}</h3>
      <p className="sdp-camp__ajuda">
        {t('section.perfil.seguidors.ajuda', 'Cada persona d’esta llista ha triat connectar amb tu: cap algoritme no hi decidix res. Esta llista només la veus tu.')}
      </p>
      {cos}
    </section>
  );
}

/**
 * Correcció 261024 (R3-12) · El text d'un error de «Veïnat connectat amb
 * {nom}», pel `code` i mai pel `message`: el de NO-DISPONIBLE («Cal aplicar
 * la migració pendent») i el d'un error sense codi són per a qui desplega, no
 * per a qui administra. En literal, com la resta de la gestió dels membres.
 * P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · amb el
 * vocabulari de connectar. Pura.
 */
export function textDErrorDeSeguidors(error, nomOrg) {
  switch (error?.code) {
    case 'SDP-SEG-005': return `Només qui administra ${nomOrg} pot vore esta llista.`;
    case 'SDP-SEG-000': return `Cal entrar al compte per a vore el veïnat connectat amb ${nomOrg}.`;
    case 'NO-DISPONIBLE': return `Este servidor encara no guarda el veïnat connectat amb ${nomOrg}.`;
    default: return `No s’ha pogut llegir el veïnat connectat amb ${nomOrg}.`;
  }
}

/** «Veïnat connectat amb {nom}», a la gestió dels membres, per a qui administra l'organització. */
export function QuiSegueixOrganitzacio({ orgId, nom = '', config = null }) {
  const { estat, seguidors, error } = useSeguidors({ orgId, config });
  if (estat === 'inactiu' || orgId === null || orgId === undefined || orgId === '') return null;
  const nomOrg = nom || 'esta organització';
  const titol = `Veïnat connectat amb ${nomOrg}`;
  let cos;
  if (estat === 'carregant') {
    cos = <p className="sdp-buit">{`Carregant el veïnat connectat amb ${nomOrg}…`}</p>;
  } else if (estat === 'error') {
    cos = <p className="sdp-camp__error">{textDErrorDeSeguidors(error, nomOrg)}</p>;
  } else if (seguidors.length) {
    cos = (
      <Taula titol={titol}>
        <thead>
          <tr>
            <th scope="col">Persona</th>
            <th scope="col">Des de</th>
          </tr>
        </thead>
        <tbody>
          {seguidors.map((seguidor) => (
            <tr key={seguidor.id}>
              <td>{seguidor.nom || 'Sense nom'}</td>
              <td>{seguidor.creatAl ? <time dateTime={seguidor.creatAl}>{dataDelSeguiment(seguidor.creatAl)}</time> : ''}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    );
  } else {
    cos = <p className="sdp-buit">{`Encara no s’ha connectat ningú amb ${nomOrg}.`}</p>;
  }
  /* Un div i no una regió: la regió amb nom és la Taula, com «Membres de {nom}». */
  return (
    <div>
      <h3>{titol}</h3>
      <p className="sdp-camp__ajuda">{`Cada persona d’esta llista ha triat connectar amb ${nomOrg}. Esta llista només la veu qui l’administra.`}</p>
      {cos}
    </div>
  );
}

export default GentQueEtSegueix;
