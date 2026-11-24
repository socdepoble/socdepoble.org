/**
 * QuadreEstatCanalsVersions.jsx — Onada v1.2.23 · IDEA-332 (Opció A, Nivell 1)
 *
 * Caixa d'Estat en Viu dels Canals al capdamunt de /versions, construïda amb el
 * motlle canònic Pedra Seca (QuadreDeComandament, zero style= inline):
 *   · Alimentada per les constants de compilació (VERSIO_SISTEMA, VERSIO_CLIENT_NATIU),
 *     el manifest públic (/.well-known/ard.json quan l'origen el servix) i la
 *     configuració de botigues (canalsDeBotiga.js, respectant D-V1223-BOTO-BETA-OCULT
 *     mentre TestFlight no tinga adreça pública revisada per Apple).
 *   · Sense falsa alarma en localhost ni al connector de WordPress: quan
 *     urlManifestPublic torna null, mostra la versió activa instal·lada sense
 *     «Última publicada: no s'ha pogut comprovar».
 *   · Dins de l'app nativa (esAppNativa), compleix la regla 2.3.10 d'Apple:
 *     cap menció a altres plataformes mòbils ni botigues alienes.
 *   · Botons grans centrats (.sdp-accions) amb icona viva dins de l'enllaç.
 */
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { QuadreDeComandament } from '../../components/PedraSeca/organismes/QuadreDeComandament.jsx';
import {
  SENSE_CONSULTA_MANIFEST,
  publicadaDelManifest,
  textLiniaVersio,
  urlManifestPublic,
} from '../../components/universal/LiniaVersioInstallada.jsx';
import { CANALS_DE_BOTIGA, canalsOberts, urlDeCanal } from '../../config/canalsDeBotiga.js';
import { plataformaNativa } from '../../config/entradaNativa.js';
import { consultaJsonPublic, llegixCanalsManifest } from '../../config/manifestVersio.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { VERSIO_CLIENT_NATIU } from '../../data/contracte.js';
import { LogotipApple } from '../onboarding/LogotipsDeMarca.jsx';

const RESERVA_CONNECTOR_WP = '1.1.29';

export const TEXTOS_QUADRE_CANALS_VERSIONS = Object.freeze({
  ca: Object.freeze({
    titol: 'Estat en viu dels canals oficials',
    estatActiu: 'Versió activa · v{versio}',
    canalWeb: 'Web oficial',
    canalWordpress: 'Connector WordPress',
    canalAppStore: 'App Store (iPhone i iPad)',
    canalGooglePlay: 'Google Play (Android)',
    canalDispositiu: 'Aplicació instal·lada',
    oberta: 'Publicada',
    obertaBuild: 'Publicada · build {build}',
    provesTancades: 'En proves tancades',
    grupCanals: 'Canals oficials de descàrrega',
    botoAppStore: "Disponible a l'App Store",
    botoGooglePlay: 'Disponible a Google Play',
    botoWordpress: 'Connector oficial a WordPress.org',
    botoTestflight: 'Provar amb TestFlight',
  }),
  es: Object.freeze({
    titol: 'Estado en vivo de los canales oficiales',
    estatActiu: 'Versión activa · v{versio}',
    canalWeb: 'Web oficial',
    canalWordpress: 'Conector WordPress',
    canalAppStore: 'App Store (iPhone e iPad)',
    canalGooglePlay: 'Google Play (Android)',
    canalDispositiu: 'Aplicación instalada',
    oberta: 'Publicada',
    obertaBuild: 'Publicada · build {build}',
    provesTancades: 'En pruebas cerradas',
    grupCanals: 'Canales oficiales de descarga',
    botoAppStore: 'Disponible en el App Store',
    botoGooglePlay: 'Disponible en Google Play',
    botoWordpress: 'Conector oficial en WordPress.org',
    botoTestflight: 'Probar con TestFlight',
  }),
  en: Object.freeze({
    titol: 'Live status of official channels',
    estatActiu: 'Active release · v{versio}',
    canalWeb: 'Official web',
    canalWordpress: 'WordPress plugin',
    canalAppStore: 'App Store (iPhone & iPad)',
    canalGooglePlay: 'Google Play (Android)',
    canalDispositiu: 'Installed app',
    oberta: 'Published',
    obertaBuild: 'Published · build {build}',
    provesTancades: 'Closed testing',
    grupCanals: 'Official download channels',
    botoAppStore: 'Available on the App Store',
    botoGooglePlay: 'Available on Google Play',
    botoWordpress: 'Official plugin on WordPress.org',
    botoTestflight: 'Test with TestFlight',
  }),
  eu: Object.freeze({
    titol: 'Kanal ofizialen zuzeneko egoera',
    estatActiu: 'Bertsio aktiboa · v{versio}',
    canalWeb: 'Webgune ofiziala',
    canalWordpress: 'WordPress konektorea',
    canalAppStore: 'App Store (iPhone eta iPad)',
    canalGooglePlay: 'Google Play (Android)',
    canalDispositiu: 'Instalatutako aplikazioa',
    oberta: 'Argitaratua',
    obertaBuild: 'Argitaratua · {build}. builda',
    provesTancades: 'Proba itxietan',
    grupCanals: 'Deskarga-kanal ofizialak',
    botoAppStore: 'App Storen eskuragarri',
    botoGooglePlay: 'Google Playn eskuragarri',
    botoWordpress: 'WordPress.org-eko konektore ofiziala',
    botoTestflight: 'TestFlightekin probatu',
  }),
  gl: Object.freeze({
    titol: 'Estado en vivo das canles oficiais',
    estatActiu: 'Versión activa · v{versio}',
    canalWeb: 'Web oficial',
    canalWordpress: 'Conector WordPress',
    canalAppStore: 'App Store (iPhone e iPad)',
    canalGooglePlay: 'Google Play (Android)',
    canalDispositiu: 'Aplicación instalada',
    oberta: 'Publicada',
    obertaBuild: 'Publicada · build {build}',
    provesTancades: 'En probas pechadas',
    grupCanals: 'Canles oficiais de descarga',
    botoAppStore: 'Dispoñible na App Store',
    botoGooglePlay: 'Dispoñible en Google Play',
    botoWordpress: 'Conector oficial en WordPress.org',
    botoTestflight: 'Probar con TestFlight',
  }),
});

const fetchDelNavegador = (url, opcions) => fetch(url, opcions);

function origenDeLaPagina() {
  try {
    return typeof window === 'undefined' ? null : window.location.origin;
  } catch {
    return null;
  }
}

export function extreuVersioConnectorWp(etiquetes) {
  if (Array.isArray(etiquetes)) {
    for (const item of etiquetes) {
      const text = typeof item === 'string' ? item : item?.text;
      const m = /\bWP\s+v(\d+\.\d+\.\d+)\b/.exec(String(text || ''));
      if (m) return m[1];
    }
  }
  return RESERVA_CONNECTOR_WP;
}

function etiquetaDelCanal(canal, textos) {
  if (canal?.id === 'app-store') return textos.botoAppStore;
  if (canal?.id === 'google-play') return textos.botoGooglePlay;
  if (canal?.id === 'wordpress-org') return textos.botoWordpress;
  if (canal?.id === 'testflight') return textos.botoTestflight;
  return canal?.nom ?? '';
}

export default function QuadreEstatCanalsVersions({
  llengua = 'ca',
  etiquetes = null,
  plataforma = plataformaNativa(),
  nativa = esAppNativa(),
  origen = origenDeLaPagina(),
  fetchImpl = typeof fetch === 'function' ? fetchDelNavegador : null,
  canals = CANALS_DE_BOTIGA,
}) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  const textos = Object.hasOwn(TEXTOS_QUADRE_CANALS_VERSIONS, codi)
    ? TEXTOS_QUADRE_CANALS_VERSIONS[codi]
    : TEXTOS_QUADRE_CANALS_VERSIONS.ca;
  const enAppNativa = Boolean(nativa) || plataforma === 'android' || plataforma === 'ios';
  const url = urlManifestPublic({ plataforma, origen });

  const [estatRemot, setEstatRemot] = useState(() => ({
    publicada: url ? null : SENSE_CONSULTA_MANIFEST,
    canalsManifest: null,
  }));

  useEffect(() => {
    if (!url) {
      setEstatRemot({ publicada: SENSE_CONSULTA_MANIFEST, canalsManifest: null });
      return undefined;
    }
    let viu = true;
    setEstatRemot({ publicada: null, canalsManifest: null });
    consultaJsonPublic({ fetchImpl, url }).then((manifest) => {
      if (!viu) return;
      setEstatRemot({
        publicada: publicadaDelManifest(manifest, { plataforma }),
        canalsManifest: llegixCanalsManifest(manifest),
      });
    });
    return () => {
      viu = false;
    };
  }, [url, fetchImpl, plataforma]);

  const { publicada, canalsManifest } = estatRemot;
  const versioWeb = canalsManifest?.versio || VERSIO_SISTEMA;
  const versioWp = extreuVersioConnectorWp(etiquetes);

  const canalAppStore = canals.find((c) => c.id === 'app-store');
  const canalGooglePlay = canals.find((c) => c.id === 'google-play');
  const appStoreOberta = Boolean(urlDeCanal(canalAppStore));
  const googlePlayOberta = Boolean(urlDeCanal(canalGooglePlay));

  const valorAppStore = appStoreOberta
    ? (canalsManifest?.iosBuild
      ? textos.obertaBuild.replace('{build}', String(canalsManifest.iosBuild))
      : textos.oberta)
    : textos.provesTancades;

  const valorGooglePlay = googlePlayOberta
    ? (canalsManifest?.androidBuild
      ? textos.obertaBuild.replace('{build}', String(canalsManifest.androidBuild))
      : textos.oberta)
    : textos.provesTancades;

  const xifres = enAppNativa
    ? [
        { clau: 'dispositiu', nom: textos.canalDispositiu, valor: `v${VERSIO_SISTEMA} · #${VERSIO_CLIENT_NATIU}` },
        { clau: 'web', nom: textos.canalWeb, valor: `v${versioWeb}` },
      ]
    : [
        { clau: 'web', nom: textos.canalWeb, valor: `v${versioWeb}` },
        { clau: 'wordpress', nom: textos.canalWordpress, valor: `v${versioWp}` },
        { clau: 'app-store', nom: textos.canalAppStore, valor: valorAppStore },
        { clau: 'google-play', nom: textos.canalGooglePlay, valor: valorGooglePlay },
      ];

  const oberts = enAppNativa ? [] : canalsOberts(canals);

  const peu = oberts.length > 0 ? (
    <div className="sdp-accions" role="group" aria-label={textos.grupCanals}>
      {oberts.map((canal) => {
        const rotul = etiquetaDelCanal(canal, textos);
        const esApple = canal.id === 'app-store';
        return (
          <a
            key={canal.id}
            className={esApple
              ? 'sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran'
              : 'sdp-boto sdp-boto--secundari sdp-boto--gran'}
            href={canal.url}
            title={rotul}
            target="_blank"
            rel="noopener noreferrer"
          >
            {esApple ? <LogotipApple /> : <ExternalLink size={18} aria-hidden="true" focusable="false" />}
            <span>{rotul}</span>
          </a>
        );
      })}
    </div>
  ) : null;

  return (
    <section className="cms-preview" lang={codi} data-testid="versions-quadre-canals">
      <h3>{textos.titol}</h3>
      <QuadreDeComandament
        estat={{ text: textos.estatActiu.replace('{versio}', VERSIO_SISTEMA), viu: true }}
        periode={(
          <span data-testid="linia-versio-installada">
            {textLiniaVersio({ llengua: codi, plataforma, publicada })}
          </span>
        )}
        xifres={xifres}
        peu={peu}
        nivell={4}
      />
    </section>
  );
}
