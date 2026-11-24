import { useRef, useState } from 'react';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { esBackendInabastable } from '../../data/errorsBackend.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { eleccioRemotaActiva, exitRemoteMode } from '../../config/dataMode.js';
import { resolOffline, sanejaErrorEixidaRemota } from './i18nEstatErrorHumana.js';

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
function textDError(error, t, idioma) {
  if (esBackendInabastable(error)) {
    return resolOffline(
      t('error.backendInabastable', 'El servidor de Sóc de Poble no respon ara mateix. El contingut no s’ha pogut carregar.'),
      'error.backendInabastable',
      idioma
    );
  }
  if (Number(error?.status) >= 400) {
    return resolOffline(
      t('error.servidor', 'El servidor de Sóc de Poble ha tornat un error. Torna-ho a provar més tard.'),
      'error.servidor',
      idioma
    );
  }
  return resolOffline(
    t('error.xarxa', 'Revisa la connexió i torna-ho a provar.'),
    'error.xarxa',
    idioma
  );
}

export function EstatErrorDades({ titol, error, onReintenta }) {
  const { t, language: idiomaAccions } = useUIActions();
  const estatUI = useUIState();
  const externalConfig = estatUI?.externalConfig;
  const idioma = estatUI?.language || idiomaAccions || externalConfig?.language || 'ca';
  const [errorEixida, setErrorEixida] = useState('');
  const reintentantRef = useRef(false);
  const config = normalizeBackendConfig(externalConfig);
  const reintentaSegur = () => {
    if (reintentantRef.current) return;
    reintentantRef.current = true;
    try {
      const resultat = onReintenta?.();
      if (resultat && typeof resultat.then === 'function') {
        resultat.then(() => { reintentantRef.current = false; }, () => { reintentantRef.current = false; });
      } else {
        reintentantRef.current = false;
      }
    } catch (err) {
      reintentantRef.current = false;
      throw err;
    }
  };
  const tornaAlModeDeProves = () => {
    try { exitRemoteMode(config); }
    catch (err) { setErrorEixida(sanejaErrorEixidaRemota(err, idioma)); }
  };
  return (
    <Alerta to="error" titol={titol} accions={(
      <>
        <Boto onClick={reintentaSegur}>
          {resolOffline(t('common.reintenta', 'Torna-ho a provar'), 'common.reintenta', idioma)}
        </Boto>
        {eleccioRemotaActiva(config)
          ? (
            <Boto onClick={tornaAlModeDeProves}>
              {resolOffline(t('error.tornaDemostracio', 'Tornar al mode de proves'), 'error.tornaDemostracio', idioma)}
            </Boto>
          )
          : null}
      </>
    )}>
      {textDError(error, t, idioma)}
      {errorEixida ? <p>{errorEixida}</p> : null}
      {import.meta.env?.DEV && error?.message ? <pre className="sdp-error-pre">{error.message}</pre> : null}
    </Alerta>
  );
}
