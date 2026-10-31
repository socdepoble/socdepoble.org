/**
 * empaquetats.js — l'estat dels empaquetats de cada plataforma, sense React
 * (P1-35; pla 261028_1526 §3.5.2: «consolidar el panell d'estat i llançament
 * dels empaquetats multiplataforma»).
 *
 * La font és /__iaia/empaquetats.json (sdp.empaquetats.v1), que només servix
 * el middleware de desenvolupament (tooling/vite/consola-iaia.mjs, apply:
 * 'serve', només des de localhost): la versió que DECLARA cada plataforma
 * (build.gradle, project.pbxproj, la capçalera del connector i el seu canal
 * builds/stable.json, package.json) i els NOMS dels artefactes de
 * ../_builds_de_poble. Mai el contingut d'un artefacte ni cap valor de
 * l'entorn: la carpeta viu al costat de les claus de pujada. Fora de DEV
 * l'estat és 'absent' des del principi (useFontDev) i el panell ho diu.
 *
 * Ací: normalitzar la resposta, llegir el nom d'un artefacte, el semàfor de
 * cada plataforma contra la Versió Canònica del Sistema (config/versio.js) i
 * l'ordre exacta per a publicar-la. La Consola no publica res: l'ordre es
 * copia al terminal, i les botigues només pugen amb --confirma=VERSIO+BUILD,
 * el «sí» del Mestre per a eixa pujada (scripts/botigues, RUNBOOK §4). Les
 * versions i els builds que entren en una ordre passen per una regla tancada
 * (xifres, punts i un sufix alfanumèric) i, a més, per la del script que la
 * rep (REGLES_ORDRE): cap text de la font arriba al terminal sense passar-les,
 * i cap ordre que el script rebutjaria no es mostra.
 *
 * El copy és provisional (el patró de govern/governConsola.js): quan el
 * Mestre aprove la clau PAGE_COPY.consola.empaquetats, mana eixa.
 */
import { ETIQUETES, RUTA_CONSOLA, copyConsola } from './consolaPagines.js';
import { plural } from './concordanca.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { nomenaPlataformaAliena, textPerAppNativa } from '../text/perAppNativa.js';
import { errorDeLaInstantania, fontsLlegibles, opcionsDeLectura } from './fontsConsola.js';

export const FONT_EMPAQUETATS = '/__iaia/empaquetats.json';
export const ESQUEMA_EMPAQUETATS = 'sdp.empaquetats.v1';
export const RUTA_EMPAQUETATS = `${RUTA_CONSOLA}/empaquetats`;

/** L'H2 de la secció del tauler i el nom de la seua navegació. */
export const TITOL_EMPAQUETATS = 'Empaquetats i llançament';
export const ETIQUETA_NAV_EMPAQUETATS = 'Pàgina dels empaquetats';
export const ENTRADETA_EMPAQUETATS = 'Quina versió declara cada plataforma, si va al pas de la Versió Canònica del Sistema i quins artefactes ja estan fets. La Consola no publica res: diu l’ordre exacta, i la pujada la confirma el Mestre al terminal.';

const COPY_PROVISIONAL = Object.freeze({
  title: 'Versions i empaquetats',
  subtitle: 'Per a saber quina versió porta cada plataforma i com publicar-la',
  lead: 'Android, iOS, la web i el connector de WordPress: la versió que declara cadascun, comparada amb la Versió Canònica del Sistema, els artefactes que ja hi ha a la carpeta de builds i l’ordre que la publica. Cap botó puja res: l’ordre es copia i s’executa al terminal.'
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · La Consola és pública i
   s'obri també dins de l'app nativa, on la regla 2.3.10 de l'App Store no
   deixa nomenar cap altra plataforma mòbil (ordre del Mestre 261027;
   perAppNativa.js). Allí el copy perd «Android» de la llista de plataformes
   (la frase es queda) i, si encara en nomena alguna, textPerAppNativa en
   lleva la frase. Fora de l'app nativa, el copy tal qual. */
const ANDROID_A_LA_LLISTA = /\bAndroid\s*,\s*/g;
const copyPerAppNativa = (text) => (typeof text === 'string' ? textPerAppNativa(text.replace(ANDROID_A_LA_LLISTA, '')) : text);

/** La pàgina dels empaquetats, amb la seua ruta i el seu copy (dins de l'app nativa, sense cap altra plataforma). */
export function paginaEmpaquetats({ nativa = esAppNativa() } = {}) {
  const copy = copyConsola().empaquetats ?? COPY_PROVISIONAL;
  const text = nativa ? copyPerAppNativa : (x) => x;
  return { id: 'empaquetats', ruta: RUTA_EMPAQUETATS, title: text(copy.title), subtitle: text(copy.subtitle), lead: text(copy.lead) };
}

/** Cert si el comodí de /consola/* és la pàgina dels empaquetats (amb barres a les vores o sense). */
export function esRutaEmpaquetats(comodi) {
  return String(comodi ?? '').replace(/^\/+|\/+$/g, '') === 'empaquetats';
}

/**
 * Les plataformes, en l'ordre del panell. `pista: 'sistema'` es compara amb
 * la Versió Canònica del Sistema; el connector de WordPress porta numeració
 * pròpia (1.1.x) i es compara amb el seu canal estable (builds/stable.json).
 * La web és `pista: 'font'`: declara la de package.json, que és la mateixa
 * font de la canònica, i la versió desplegada a socdepoble.org no es mesura.
 * No pot desfasar-se de si mateixa: no compta al recompte de la targeta.
 */
export const PLATAFORMES = Object.freeze([
  Object.freeze({ id: 'android', nom: 'Android', pista: 'sistema' }),
  Object.freeze({ id: 'ios', nom: 'iOS', pista: 'sistema' }),
  Object.freeze({ id: 'pwa', nom: 'Web (socdepoble.org)', pista: 'font' }),
  Object.freeze({ id: 'wordpress', nom: 'Connector de WordPress', pista: 'propia' })
]);

/**
 * Les plataformes que es pinten (la pàgina, el recompte de la targeta i
 * l'Índex). Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Dins de l'app
 * nativa, cap que en nomene una altra (regla 2.3.10; la d'Android no es
 * pinta); fora, totes. La lectura (normalitzaEmpaquetats) no canvia.
 */
export function plataformesPerPintar({ nativa = esAppNativa() } = {}) {
  return nativa ? PLATAFORMES.filter((p) => !nomenaPlataformaAliena(p.nom)) : PLATAFORMES;
}

/** El semàfor d'una plataforma, amb el vocabulari d'Insignia. */
export const SEMAFOR = Object.freeze({
  alineat: Object.freeze({ text: 'Alineat', to: 'exit' }),
  desfasat: Object.freeze({ text: 'Desfasat', to: 'avis' }),
  desconegut: Object.freeze({ text: 'Sense dades', to: 'neutre' }),
  font: Object.freeze({ text: 'Font canònica', to: 'neutre' })
});

/* Una versió (x.y.z amb sufix opcional) i un build: les úniques formes que
   admet la resposta. */
const VERSIO = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;
const BUILD = /^\d{1,9}$/;
/* Les regles dels scripts que reben cada ordre: una ordre que el seu script
   rebutjaria no es mostra. Les botigues, VERSIO i BUILD de
   scripts/botigues/entorn.mjs (sense sufix, build sense zeros davant); el
   connector, el SEMVER de vite.standalone.config.js sense -dev
   (errorsDeRelease). empaquetats.test.js les compara amb les originals. */
export const REGLES_ORDRE = Object.freeze({
  versioBotiga: /^\d+\.\d+\.\d+$/,
  buildBotiga: /^[1-9]\d{0,8}$/,
  versioConnector: /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/,
  desenvolupament: /-dev(?:\.|$)/
});
const MAX_NOM = 200;
const EXTENSIO = /\.(aab|apk|ipa|xcarchive|zip)$/;
/* aammdd[_hhmm[ss]]_producte_vX.Y.Z[-sufix][+build][_nota].ext:
   261023_socdepoble_1.0.0+1.aab, 261021_2015_wordpress_directori_v1.1.9.zip,
   261022_030917_wordpress_enxufe_v1.1.10-beta.1_pre_gauntlet.zip. */
const NOM_ARTEFACTE = /^(\d{6})(?:_(\d{4,6}))?_([a-z]+(?:_[a-z]+)*?)_v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)(?:\+(\d+))?(?:_([0-9a-z_]+))?\.(?:aab|apk|ipa|xcarchive|zip)$/;

/**
 * El nom d'un artefacte llegit: { nom, tipus, data, hora, producte, versio,
 * build, nota }. Un nom amb extensió d'artefacte i sense la forma del
 * calendari (socdepoble-beta.apk) es conserva amb els camps a null; un nom
 * sense extensió d'artefacte (un informe .json, un .log), null.
 */
export function llegixArtefacte(nom) {
  if (typeof nom !== 'string' || nom.length > MAX_NOM) return null;
  const tipus = EXTENSIO.exec(nom)?.[1];
  if (!tipus) return null;
  const m = NOM_ARTEFACTE.exec(nom);
  return {
    nom,
    tipus,
    data: m?.[1] ?? null,
    hora: m?.[2] ?? null,
    producte: m?.[3] ?? null,
    versio: m?.[4] ?? null,
    build: m?.[5] ?? null,
    nota: m?.[6] ?? null
  };
}

/* El més recent primer (data i hora del nom); els que no en porten, al final. */
const clauDOrdre = (a) => (a.data ? `${a.data}${(a.hora ?? '').padEnd(6, '0')}` : '');
const ordena = (artefactes) => [...artefactes].sort((a, b) => clauDOrdre(b).localeCompare(clauDOrdre(a)) || a.nom.localeCompare(b.nom));

/**
 * La resposta del middleware validada. Una forma inesperada és un error (la
 * pàgina el pinta com a error, no com a buit): la Consola no endevina.
 */
export function normalitzaEmpaquetats(brut) {
  const falla = (camp) => { throw new Error(`Resposta d’empaquetats invàlida: ${camp}.`); };
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) falla('arrel');
  if (brut.schema !== ESQUEMA_EMPAQUETATS) falla('schema');
  if (typeof brut.generat !== 'string' || Number.isNaN(Date.parse(brut.generat))) falla('generat');
  if (typeof brut.canonica !== 'string' || !VERSIO.test(brut.canonica)) falla('canonica');
  const totes = brut.plataformes;
  if (!totes || typeof totes !== 'object' || Array.isArray(totes)) falla('plataformes');
  const llista = (v, camp, regla) => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || (regla && !regla.test(x)))) falla(camp);
    return [...new Set(v)];
  };
  const plataformes = {};
  for (const { id } of PLATAFORMES) {
    const p = totes[id] ?? {};
    if (typeof p !== 'object' || Array.isArray(p)) falla(id);
    if (p.estable != null && (typeof p.estable !== 'string' || !VERSIO.test(p.estable))) falla(`${id}.estable`);
    if (p.font != null && typeof p.font !== 'string') falla(`${id}.font`);
    plataformes[id] = {
      versions: llista(p.versions, `${id}.versions`, VERSIO),
      builds: llista(p.builds, `${id}.builds`, BUILD),
      estable: p.estable ?? null,
      font: p.font ?? null,
      artefactes: ordena(llista(p.artefactes, `${id}.artefactes`).map(llegixArtefacte).filter(Boolean))
    };
  }
  return { generat: brut.generat, canonica: brut.canonica, carpeta: brut.carpeta === true, plataformes };
}

/** Una lectura de /__iaia/empaquetats.json; null si no hi és (producció, o cap middleware). */
export async function carregaEmpaquetats(signal) {
  /* Higiene d'amfitrió (ordre del Mestre, 261004) · Sense font en este paquet
     (WordPress, natiu), absència i cap petició a /__iaia/*.
     Decisió del Mestre (31-10-2026) · En viu a DEV i, al build web, la
     instantània sanejada (fontsConsola.js). */
  if (!fontsLlegibles()) return null;
  const r = await fetch(FONT_EMPAQUETATS, opcionsDeLectura(signal));
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Empaquetats ${r.status} ${r.statusText}`);
  // Sense middleware, el servidor pot tornar l'HTML de l'aplicació (200): és absència, no un error.
  if (!(r.headers?.get?.('content-type') || '').includes('application/json')) return null;
  const cos = await r.json();
  const fallada = errorDeLaInstantania(cos);
  if (fallada) throw fallada;
  return normalitzaEmpaquetats(cos);
}

/**
 * L'ordre exacta que publica la versió declarada, o null si no n'hi ha cap
 * de segura. Android i iOS: la pujada amb --confirma (sense, la mateixa ordre
 * només comprova i mostra el pla). WordPress: les dues variants (autònom i
 * directori, que empaqueta.mjs exigix amb la mateixa versió) i el canal
 * signat, els passos 1 i 2 del seu --ajuda. La web no té cap script de
 * desplegament al repositori.
 */
export function ordrePublicacio(id, { versio, build } = {}) {
  if (typeof versio !== 'string' || !VERSIO.test(versio)) return null;
  switch (id) {
    case 'android':
    case 'ios': {
      const valida = REGLES_ORDRE.versioBotiga.test(versio) && typeof build === 'string' && REGLES_ORDRE.buildBotiga.test(build);
      return valida ? `node scripts/botigues/puja-${id}.mjs --versio ${versio} --build ${build} --confirma=${versio}+${build}` : null;
    }
    case 'wordpress': {
      if (!REGLES_ORDRE.versioConnector.test(versio) || REGLES_ORDRE.desenvolupament.test(versio)) return null;
      const release = `SDP_RELEASE=1 SDP_VERSIO=${versio}`;
      return `${release} npm run build:wp && ${release} npm run build:wp:directori && node wordpress-plugin/eines/empaqueta.mjs --url-base https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/ --clau ~/.sdp/enxufe-ed25519.pem`;
    }
    default:
      return null;
  }
}

/* El fitxer que llig l'ordre per a pujar-lo: el dels scripts (AAB de
   puja-android.mjs, carpeta d'exportació de planIos), no cap artefacte de
   ../_builds_de_poble. El de iOS penja de la variable SDP_BUILDS_DIR, que es
   diu pel nom: la Consola no llig l'entorn. */
export function fitxerDeLOrdre(id, { versio, build } = {}) {
  if (!ordrePublicacio(id, { versio, build })) return null;
  if (id === 'android') return 'android/app/build/outputs/bundle/release/app-release.aab';
  if (id === 'ios') return `<SDP_BUILDS_DIR>/sdp-ios-${versio}-${build}/export/*.ipa`;
  return null;
}

/* Què fa l'ordre i què queda a mà, per plataforma. */
const NOTA_ORDRE = Object.freeze({
  android: 'L’AAB el signa el Mestre (Android Studio, o la mateixa ordre amb --compila en lloc de --confirma) i puja a la prova interna de Google Play com a esborrany; promoure’l és del Mestre. Sense --confirma, només comprova i mostra el pla.',
  ios: 'Primer, la mateixa ordre amb --compila en lloc de --confirma arxiva i exporta l’IPA, sense pujar res; després, esta el valida i el puja a App Store Connect. Sense --confirma, només comprova i mostra el pla.',
  wordpress: 'Compila les dues variants i empaqueta el canal signat; pujar els ZIP a la release i desplegar el canal es fa a mà (node wordpress-plugin/eines/empaqueta.mjs --ajuda).',
  pwa: 'El desplegament de socdepoble.org no té cap script al repositori: la Consola no n’inventa l’ordre.'
});

/* El semàfor i el per què d'una plataforma. */
function semaforDe(plataforma, { versions, builds, estable }, canonica) {
  if (!versions.length) return { semafor: 'desconegut', motiu: 'No s’ha trobat cap versió declarada.' };
  if (versions.length > 1 || builds.length > 1) {
    return { semafor: 'desfasat', motiu: `Declara més d’una versió a la vegada: ${[...versions, ...builds.map((b) => `build ${b}`)].join(', ')}.` };
  }
  const [versio] = versions;
  if (plataforma.pista === 'font') {
    return { semafor: 'font', motiu: `Declara ${versio}, la de package.json, que és la font de la Versió Canònica del Sistema. La versió desplegada a socdepoble.org no es mesura, i no compta al recompte.` };
  }
  if (plataforma.pista === 'propia') {
    if (!estable) return { semafor: 'desconegut', motiu: `Declara ${versio}, però no s’ha trobat el canal estable.` };
    return estable === versio
      ? { semafor: 'alineat', motiu: `La capçalera i el canal estable diuen ${versio}. El connector porta numeració pròpia.` }
      : { semafor: 'desfasat', motiu: `La capçalera diu ${versio} i el canal estable, ${estable}.` };
  }
  return versio === canonica
    ? { semafor: 'alineat', motiu: `Declara ${versio}, la Versió Canònica del Sistema.` }
    : { semafor: 'desfasat', motiu: `Declara ${versio} i la Versió Canònica del Sistema és ${canonica}.` };
}

/**
 * Les plataformes amb el seu estat: { id, nom, pista, versio, build, font,
 * semafor, motiu, artefactes, ultim, alDia, ordre, fitxer, nota }. `ultim`
 * és l'artefacte més recent amb versió al nom de la carpeta de builds;
 * `alDia`, si és el de la versió (i el build) que es declara. `fitxer`, el
 * que puja l'ordre, que no és cap d'eixos. Sense valor, cap plataforma.
 * Dins de l'app nativa (`nativa`, per defecte esAppNativa), només les de
 * plataformesPerPintar, i cap camp que en nomene una altra: el motiu i la
 * nota perden la frase (textPerAppNativa); la font, l'ordre, el fitxer i
 * els artefactes que en porten el nom, fora.
 */
export function plataformesEmpaquetades(valor, canonica = VERSIO_SISTEMA, { nativa = esAppNativa() } = {}) {
  if (!valor) return [];
  const fora = (v) => (nativa && typeof v === 'string' && nomenaPlataformaAliena(v) ? null : v);
  const text = (v) => (nativa ? textPerAppNativa(v) : v);
  return plataformesPerPintar({ nativa }).map((p) => {
    const dades = valor.plataformes[p.id];
    const versio = dades.versions.length === 1 ? dades.versions[0] : null;
    const build = dades.builds.length === 1 ? dades.builds[0] : null;
    const artefactes = nativa ? dades.artefactes.filter((a) => !nomenaPlataformaAliena(a.nom)) : dades.artefactes;
    const ultim = artefactes.find((a) => a.versio) ?? null;
    const alDia = Boolean(ultim && versio && ultim.versio === versio && (!build || !ultim.build || ultim.build === build));
    const semafor = semaforDe(p, dades, canonica);
    return {
      ...p,
      versio,
      build,
      font: fora(dades.font),
      ...semafor,
      motiu: text(semafor.motiu),
      artefactes,
      ultim,
      alDia,
      ordre: fora(ordrePublicacio(p.id, { versio, build })),
      fitxer: fora(fitxerDeLOrdre(p.id, { versio, build })),
      nota: text(NOTA_ORDRE[p.id])
    };
  });
}

/** Si la versió de package.json que llig el middleware no és la que porta esta pàgina (cal recarregar). */
export const canonicaDesfasada = (valor, canonica = VERSIO_SISTEMA) => Boolean(valor && valor.canonica !== canonica);

const TEXT_SENSE = Object.freeze({
  loading: 'Llegint els empaquetats…',
  absent: 'Empaquetats no disponibles en este entorn',
  error: 'No s’han pogut llegir els empaquetats'
});

/**
 * La coberta de la targeta del tauler: { dada, etiquetes }. Sense font, per
 * què (com les altres targetes de la Consola); amb font, quantes de les
 * plataformes que es poden desfasar van al pas (la web, que és la font, no
 * hi compta), i l'etiqueta del semàfor de la Consola (Important si en
 * desfasa o en falta alguna, En ordre si van totes al pas).
 */
export function cobertaEmpaquetats(valor, estat, canonica = VERSIO_SISTEMA) {
  if (!valor) {
    return { dada: TEXT_SENSE[estat] ?? TEXT_SENSE.absent, etiquetes: [estat === 'error' ? ETIQUETES.reparar : ETIQUETES.senseFont] };
  }
  const comparables = plataformesEmpaquetades(valor, canonica).filter((p) => p.pista !== 'font');
  const alineades = comparables.filter((p) => p.semafor === 'alineat').length;
  const desfasades = comparables.filter((p) => p.semafor === 'desfasat').length;
  const parts = [`v${canonica}`, `${alineades} de ${comparables.length} al pas`];
  if (desfasades) parts.push(plural(desfasades, 'desfasada', 'desfasades'));
  return {
    dada: parts.join(' · '),
    etiquetes: [alineades === comparables.length && !canonicaDesfasada(valor, canonica) ? ETIQUETES.enOrdre : ETIQUETES.important]
  };
}
