import React, { useState } from 'react';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { esBackendInabastable } from '../../data/errorsBackend.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { eleccioRemotaActiva, exitRemoteMode } from '../../config/dataMode.js';

/* T2 (ordre del Mestre, 260930) · L'estat d'error de les dades del Mur i del
   Mercat, un sol contracte per a les dues seccions. El text el tria el codi
   neutral, mai el missatge de l'adaptador, que només es veu en
   desenvolupament. «Torna-ho a provar» torna a carregar; si este navegador ha
   passat d'una demostració al servidor (eleccioRemotaActiva), també pot tornar
   al mode de proves. Només es munta en error: els estats normals no canvien.
   És una composició d'Alerta i Boto, sense pell pròpia.
   Tres textos (correcció de la revisió, 260930): el servidor no s'abasta;
   el servidor ha respost amb un error seu (estat 400 o més: RLS, esquema,
   500), on la connexió de la persona va bé; i la resta (un temps esgotat),
   on sí que té sentit revisar la connexió. */
function textDError(error, t) {
  if (esBackendInabastable(error)) {
    return t('error.backendInabastable', 'El servidor del poble no respon ara mateix. El contingut no s’ha pogut carregar.');
  }
  if (Number(error?.status) >= 400) {
    return t('error.servidor', 'El servidor del poble ha tornat un error. Torna-ho a provar més tard.');
  }
  return t('error.xarxa', 'Revisa la connexió i torna-ho a provar.');
}

export function EstatErrorDades({ titol, error, onReintenta }) {
  const { t } = useUIActions();
  const { externalConfig } = useUIState();
  const [errorEixida, setErrorEixida] = useState('');
  const config = normalizeBackendConfig(externalConfig);
  const tornaAlModeDeProves = () => {
    try { exitRemoteMode(config); }
    catch (err) { setErrorEixida(err?.message || String(err)); }
  };
  return (
    <Alerta to="error" titol={titol} accions={(
      <>
        <Boto onClick={onReintenta}>{t('common.reintenta', 'Torna-ho a provar')}</Boto>
        {eleccioRemotaActiva(config)
          ? <Boto onClick={tornaAlModeDeProves}>{t('error.tornaDemostracio', 'Tornar al mode de proves')}</Boto>
          : null}
      </>
    )}>
      {textDError(error, t)}
      {errorEixida ? <p>{errorEixida}</p> : null}
      {import.meta.env?.DEV && error?.message ? <pre className="sdp-error-pre">{error.message}</pre> : null}
    </Alerta>
  );
}
