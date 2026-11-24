/**
 * LiniaVersioInstallada.jsx — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Una
 * línia clara a /versions i a /control:
 *   «Instal·lada al dispositiu: X (build N) · Última publicada: Y (build M)».
 *
 *   · Instal·lada · la versió del codi carregat (VERSIO_SISTEMA, de package.json) i, dins de l'App
 *     nativa, el seu build (VERSIO_CLIENT_NATIU). A la web, «(web)»: la web no té build.
 *   · Última publicada · la del manifest públic (/.well-known/ard.json): `version` i, dins de l'App,
 *     el build més alt de la SEUA plataforma (P0123-06: androidBuild i apkDirectBuild a Android;
 *     iosBuild i testflightIosBuild a iOS; mai el latestBuild, que barreja plataformes). Un build més
 *     baix que l'instal·lat amb una versió que no és més vella és un manifest endarrerit: llavors només
 *     la versió. A la web, només la versió (la web no té build). Dins de l'App, el de socdepoble.org (la CSP de la closca ho permet:
 *     tests/agentic-browsing-ard-llms.test.mjs); a la web, el del mateix origen, només a socdepoble.org
 *     i al seu mirall socdepoble.cat. Fora (el connector de WordPress, desenvolupament), cap consulta
 *     (cap 404 a la consola de l'amfitrió) i la línia diu només la instal·lada (SENSE_CONSULTA_MANIFEST,
 *     sense mostrar l'alarma «Última publicada: no s'ha pogut comprovar»; IDEA-332).
 *   · Cinc llengües, en una taula d'este tros (no als diccionaris: el valencià va a l'arrencada del
 *     connector); la llengua la passa qui la pinta (`llengua`, la de useUIActions). No és contingut de
 *     PAGE_COPY: la Frontissa de /versions no canvia.
 * Mai llança: quan consulta el manifest i falla, «no s'ha pogut comprovar»; quan no s'ha de consultar, només la instal·lada.
 */
import { useEffect, useState } from 'react';
import { Alerta } from '../PedraSeca/molecules/Alerta.jsx';
import { plataformaNativa } from '../../config/entradaNativa.js';
import { comparaSemver, consultaJsonPublic, llegixCanalsManifest } from '../../config/manifestVersio.js';
import { ORIGEN_PUBLIC_PER_DEFECTE } from '../../config/origenPublic.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { VERSIO_CLIENT_NATIU } from '../../data/contracte.js';

export const CAMI_MANIFEST_PUBLIC = '/.well-known/ard.json';
/** Els orígens web que servixen el manifest (Firebase i el mirall del Node 0). */
export const ORIGENS_AMB_MANIFEST = Object.freeze([ORIGEN_PUBLIC_PER_DEFECTE, 'https://socdepoble.cat']);
/** Estat quan l'origen no servix manifest públic (localhost, connector de WordPress): cap consulta i cap falsa alarma. */
export const SENSE_CONSULTA_MANIFEST = 'sense-consulta';

export const TEXTOS_LINIA_VERSIO = Object.freeze({
  ca: Object.freeze({
    installada: 'Instal·lada al dispositiu: {versio} (build {build})',
    installadaWeb: 'Instal·lada al dispositiu: {versio} (web)',
    publicada: 'Última publicada: {versio} (build {build})',
    publicadaSenseBuild: 'Última publicada: {versio}',
    comprovant: 'Última publicada: s’està comprovant…',
    senseDades: 'Última publicada: no s’ha pogut comprovar'
  }),
  es: Object.freeze({
    installada: 'Instalada en el dispositivo: {versio} (build {build})',
    installadaWeb: 'Instalada en el dispositivo: {versio} (web)',
    publicada: 'Última publicada: {versio} (build {build})',
    publicadaSenseBuild: 'Última publicada: {versio}',
    comprovant: 'Última publicada: comprobando…',
    senseDades: 'Última publicada: no se ha podido comprobar'
  }),
  en: Object.freeze({
    installada: 'Installed on this device: {versio} (build {build})',
    installadaWeb: 'Installed on this device: {versio} (web)',
    publicada: 'Latest published: {versio} (build {build})',
    publicadaSenseBuild: 'Latest published: {versio}',
    comprovant: 'Latest published: checking…',
    senseDades: 'Latest published: could not be checked'
  }),
  eu: Object.freeze({
    installada: 'Gailuan instalatua: {versio} (build {build})',
    installadaWeb: 'Gailuan instalatua: {versio} (web)',
    publicada: 'Argitaratutako azkena: {versio} (build {build})',
    publicadaSenseBuild: 'Argitaratutako azkena: {versio}',
    comprovant: 'Argitaratutako azkena: egiaztatzen…',
    senseDades: 'Argitaratutako azkena: ezin izan da egiaztatu'
  }),
  gl: Object.freeze({
    installada: 'Instalada no dispositivo: {versio} (build {build})',
    installadaWeb: 'Instalada no dispositivo: {versio} (web)',
    publicada: 'Última publicada: {versio} (build {build})',
    publicadaSenseBuild: 'Última publicada: {versio}',
    comprovant: 'Última publicada: comprobando…',
    senseDades: 'Última publicada: non se puido comprobar'
  })
});

const omple = (plantilla, valors) => plantilla.replace(/\{(versio|build)\}/g, (_, clau) => String(valors[clau]));

/** L'adreça del manifest per a esta plataforma i este origen, o null si no s'ha de preguntar. Pur. */
export function urlManifestPublic({ plataforma, origen }) {
  if (plataforma === 'android' || plataforma === 'ios') return `${ORIGEN_PUBLIC_PER_DEFECTE}${CAMI_MANIFEST_PUBLIC}`;
  return ORIGENS_AMB_MANIFEST.includes(origen) ? `${origen}${CAMI_MANIFEST_PUBLIC}` : null;
}

/* P0123-06 · Els canals de build de cada plataforma: mai els de l'altra ni latestBuild, que els barreja. */
const CANALS_DE_LA_PLATAFORMA = Object.freeze({ android: ['androidBuild', 'apkDirectBuild'], ios: ['iosBuild', 'testflightIosBuild'] });

/**
 * La publicada que diu la línia, del manifest: false (sense dades), { versio } (la web; o un build que no es
 * pot dir) o { versio, build } (dins de l'App: el build més alt de la seua plataforma). Un build més baix que
 * l'instal·lat amb una versió igual o més nova és un manifest endarrerit: només la versió. Pur.
 */
export function publicadaDelManifest(manifest, { plataforma, versio = VERSIO_SISTEMA, build = VERSIO_CLIENT_NATIU } = {}) {
  const canals = llegixCanalsManifest(manifest);
  if (!canals?.versio) return false;
  if (!Object.hasOwn(CANALS_DE_LA_PLATAFORMA, plataforma)) return { versio: canals.versio };
  const builds = CANALS_DE_LA_PLATAFORMA[plataforma].map((camp) => canals[camp]).filter((valor) => valor !== null);
  if (!builds.length) return false;
  const maxim = Math.max(...builds);
  const endarrerit = Number.isSafeInteger(build) && maxim < build && (comparaSemver(canals.versio, versio) ?? -1) >= 0;
  return endarrerit ? { versio: canals.versio } : { versio: canals.versio, build: maxim };
}

/** El text de la línia. `publicada`: 'sense-consulta' (només instal·lada), null (s'està comprovant), false (sense dades), { versio } o { versio, build }. Pur. */
export function textLiniaVersio({ llengua, plataforma, versio = VERSIO_SISTEMA, build = VERSIO_CLIENT_NATIU, publicada }) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  const textos = Object.hasOwn(TEXTOS_LINIA_VERSIO, codi) ? TEXTOS_LINIA_VERSIO[codi] : TEXTOS_LINIA_VERSIO.ca;
  const nativa = plataforma === 'android' || plataforma === 'ios';
  const installada = nativa ? omple(textos.installada, { versio, build }) : omple(textos.installadaWeb, { versio });
  if (publicada === SENSE_CONSULTA_MANIFEST) return installada;
  let darrera = textos.comprovant;
  if (publicada === false) darrera = textos.senseDades;
  else if (publicada) darrera = omple(Number.isSafeInteger(publicada.build) ? textos.publicada : textos.publicadaSenseBuild, publicada);
  return `${installada} · ${darrera}`;
}

/* Estable entre pintats: l'efecte depén de la funció i no ha de tornar a preguntar per cada pintat. */
const fetchDelNavegador = (url, opcions) => fetch(url, opcions);

function origenDeLaPagina() {
  try { return typeof window === 'undefined' ? null : window.location.origin; } catch { return null; }
}

export default function LiniaVersioInstallada({
  plataforma = plataformaNativa(),
  origen = origenDeLaPagina(),
  fetchImpl = typeof fetch === 'function' ? fetchDelNavegador : null,
  llengua = 'ca'
}) {
  const url = urlManifestPublic({ plataforma, origen });
  const [publicada, setPublicada] = useState(() => (url ? null : SENSE_CONSULTA_MANIFEST));
  useEffect(() => {
    if (!url) { setPublicada(SENSE_CONSULTA_MANIFEST); return undefined; }
    let viu = true;
    setPublicada(null);
    consultaJsonPublic({ fetchImpl, url }).then((manifest) => {
      if (viu) setPublicada(publicadaDelManifest(manifest, { plataforma }));
    });
    return () => { viu = false; };
  }, [url, fetchImpl, plataforma]);
  return (
    <Alerta to="info" viva={false}>
      <p data-testid="linia-versio-installada">{textLiniaVersio({ llengua, plataforma, publicada })}</p>
    </Alerta>
  );
}
