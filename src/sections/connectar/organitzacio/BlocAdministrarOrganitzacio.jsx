/**
 * BlocAdministrarOrganitzacio.jsx — Contenidor de «Administrar
 * l'organització» a la vista Connectar (T43, ordre del Mestre, 260928).
 *
 * ConnectarSection el munta amb UNA línia quan la ruta porta
 * ?organitzacio=ID (la fitxa pública d'una entitat o d'un grup). És l'únic
 * punt de la vista que demana administrar: guardar la connexió al MAS i
 * administrar l'organització són dues accions separades.
 */
import { useId, useRef } from 'react';
import { TargetaAdministrar } from './TargetaAdministrar.jsx';
import { useAdministrarOrganitzacio } from './useAdministrarOrganitzacio.js';

const MODES_SENSE_REVISIO = new Set(['seed', 'local']);

export function BlocAdministrarOrganitzacio({ orgId, config = {} }) {
  const id = useId();
  /* En seed i local no hi ha revisió: l'alta és immediata i no es demana justificació. */
  const ambRevisio = !MODES_SENSE_REVISIO.has(config?.dataMode);
  const admin = useAdministrarOrganitzacio(orgId, { config, ambRevisio });

  /* Correcció C17 (260928) · Enviar i «Actua com a» desmunten el botó premut
     (el formulari o el botó se'n van): el focus va al títol del bloc, no al
     <body>. Només després d'una transició que provoca la persona. */
  const titolRef = useRef(null);
  const enfocaTitol = () => { if (titolRef.current?.isConnected) titolRef.current.focus(); };
  const connecta = async (justificacio) => {
    const resultat = await admin.connecta(justificacio);
    enfocaTitol();
    return resultat;
  };
  const actua = () => {
    const fet = admin.actua();
    if (fet) enfocaTitol();
    return fet;
  };

  return (
    <section className="sdp-connectar__seccio" aria-labelledby={`${id}-administrar`}>
      <h3 ref={titolRef} tabIndex={-1} id={`${id}-administrar`} className="sdp-connectar__titol-seccio">Administrar l’organització</h3>
      <TargetaAdministrar
        estat={admin.estat}
        nom={admin.nom /* T43b-3 · només de confiança (pertinença o directori); si no, «esta organització» */}
        rol={admin.rol}
        data={admin.data}
        carregant={admin.carregant}
        error={admin.error}
        errorLectura={admin.errorLectura}
        actiu={admin.actiu}
        ambRevisio={ambRevisio}
        onConnecta={connecta}
        onActua={actua}
        onEditaFitxa={admin.editaFitxa}
        onEntra={admin.entra}
      />
    </section>
  );
}

export default BlocAdministrarOrganitzacio;
