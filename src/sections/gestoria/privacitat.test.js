// @vitest-environment node
/* Gestoria i Tractors · privacitat. Res ix d'este ordinador: ni xarxa ni
   backend. L'emmagatzematge del navegador només es permet als magatzems de la
   llista blanca (IndexedDB): les aprovacions dels tractors, el progrés
   d'Aprendre i, des del 261004, el llibre Veri*Factu de només afegir, on sí
   que es desen les factures emeses. Es llig el text de TOTS els fitxers de
   producció dels dos carrils (import.meta.glob amb ?raw, sense les proves ni el suport de proves de
   __fixtures__) i es comprova també la frontera: App.jsx no té cap ruta
   /gestoria ni /tractors (D3). Ordre del Mestre, 261004 («contaminació
   crítica de rutes/estats entre Gestoria i Wiki»): la frontera s'ha mogut amb
   la Gestoria. Ara només el pont de la seua app (src/apps/gestoria/
   AppGestoria.jsx), i només en desenvolupament, carrega la Gestoria; el seu
   únic importador és el manifest de l'app, darrere del literal de DEV; i la
   Wiki ja no la importa (només els Tractors, també només en desenvolupament).
   Cap guarda s'afebleix: es mouen al pont. Els patrons es componen a trossos
   perquè les portes que llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import fontWiki from '../wiki-de-poble/WikiDePobleSection.jsx?raw';
import fontRutaWiki from '../wiki-de-poble/RutaWikiDePoble.jsx?raw';
import fontPont from '../../apps/gestoria/AppGestoria.jsx?raw';
import fontManifest from '../../apps/gestoria/manifest.js?raw';
import { ITEM_PORTA_TRACTORS, RUTA_PORTA_TRACTORS } from '../../apps/gestoria/rutes.js';
import { TRACTORS_GESTORIA } from './tractors.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const TRACTORS = 'src/sections/tractors';
const WIKI = 'src/sections/wiki-de-poble/WikiDePobleSection.jsx';
/* El pont de l'app i el seu manifest (ordre del Mestre, 261004). */
const PONT = 'src/apps/gestoria/AppGestoria.jsx';
const MANIFEST = 'src/apps/gestoria/manifest.js';
/* Els especificadors del pont: la closca, Aprendre i, des del 261007, la
   Facturació. Cap altre. Motiu de la tercera (ordre del Mestre, 261007:
   «tindre la facturació operativa inclús sense xarxa»): la pantalla de
   Facturació s'endolla pel pont i no per ShellGestoria, que és font del
   tractor gestoria.tauler; tocar-la en tornaria l'aprovació a «pendent». La
   pantalla viu al carril de la Gestoria i passa per esta mateixa guarda. */
/* Onada 6, ordre del Mestre (261009): «importar tot l'històric», «calcular les
   despeses massives en IA», «fer simulacions» i «descarregar-se un full de
   càlcul per a la gestora». La quarta, «Històric i IA», entra pel pont com la
   Facturació, pel mateix motiu (ShellGestoria no es toca), i passa per esta
   mateixa guarda. */
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la cinquena,
   «Identitat i Finestreta» (la fitxa d'identitat privada, darrere del cofre,
   i els tràmits preparats per a copiar, amb el seu tractor propi
   'gestoria.identitat'), entra pel pont com l'Històric i passa per esta
   mateixa guarda: cap xarxa, cap emmagatzematge fora del cofre. */
const DEL_PONT = Object.freeze([
  '../../sections/gestoria/tauler/ShellGestoria.jsx',
  '../../sections/gestoria/aprendre/Aprendre.jsx',
  '../../sections/gestoria/facturar/Facturacio.jsx',
  '../../sections/gestoria/historic/Historic.jsx',
  '../../sections/gestoria/finestreta/Finestreta.jsx'
]);

/* Ruta des de l'arrel del repositori: les claus del glob són relatives a este fitxer. */
const desDeArrel = (clau) => path.posix.normalize(path.posix.join(GESTORIA, clau));
const FONTS = Object.fromEntries(Object.entries({
  ...import.meta.glob(['./**/*.{js,jsx,md}', '!**/*.test.*', '!**/__fixtures__/**'], { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob(['../tractors/**/*.{js,jsx,md}', '!**/*.test.*', '!**/__fixtures__/**'], { query: '?raw', import: 'default', eager: true })
}).map(([clau, text]) => [desDeArrel(clau), text]));
const CODI = Object.entries(FONTS).filter(([ruta]) => /\.jsx?$/.test(ruta));

/* Els especificadors d'importació (estàtica, dinàmica, reexportació i require) d'un codi. */
function especificadors(codi) {
  const patro = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;
  return [...codi.matchAll(patro)].map((m) => m[2]);
}
/* Un especificador relatiu, resolt des de l'arrel; els paquets, tal qual. */
const resol = (ruta, especificador) => (especificador.startsWith('.')
  ? path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador))
  : especificador);

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers;
}
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

describe('el cens', () => {
  test('el glob porta el codi de producció dels dos carrils, sense proves ni suport de proves', () => {
    const rutes = Object.keys(FONTS);
    for (const esperada of [
      `${GESTORIA}/ContenidorGestoria.jsx`, `${GESTORIA}/PanellGestoria.jsx`, `${GESTORIA}/useGestoria.js`,
      `${GESTORIA}/nucli/tractor.js`, `${GESTORIA}/font/fontNavegador.js`, `${GESTORIA}/enviament/EnviamentGestoria.jsx`,
      `${GESTORIA}/enviament/correuGestoria.js`, `${GESTORIA}/aprendre/Aprendre.jsx`, `${GESTORIA}/fitxes/gestoria_factures.md`,
      `${TRACTORS}/useTractors.js`, `${TRACTORS}/nucli/aprovacio.js`, `${TRACTORS}/nucli/magatzem.js`,
      // Onada 2, pas 1 (261004): la closca i el Tauler, i les estimacions d'impostos, també hi són.
      `${GESTORIA}/tauler/ShellGestoria.jsx`, `${GESTORIA}/tauler/nucli/tractorTauler.js`, `${GESTORIA}/impostos/nucli/impostos.js`,
      `${GESTORIA}/fitxes/gestoria_tauler.md`,
      // 261007 (ordre del Mestre: facturació operativa sense xarxa): la pantalla i el perfil fiscal també.
      `${GESTORIA}/facturar/Facturacio.jsx`, `${GESTORIA}/facturar/useFacturacio.js`, `${GESTORIA}/facturacio/magatzemPerfil.js`,
      // Onada 6, ordre del Mestre (261009): l'Històric, el seu tractor, les categories i la simulació també.
      `${GESTORIA}/historic/Historic.jsx`, `${GESTORIA}/historic/nucli/tractorHistoric.js`, `${GESTORIA}/despeses/nucli/categories.js`,
      `${GESTORIA}/impostos/nucli/simulacio.js`, `${GESTORIA}/fitxes/gestoria_historic.md`,
      // Ordre del Mestre, 13-10-2026 (pla 261013_1405): l'Escàner Local (front D), la Fitxa d'identitat i la Finestreta (front H) i la Cabina d'Avió (front E).
      `${GESTORIA}/escaner/PanellEscaner.jsx`, `${GESTORIA}/escaner/useEscaner.js`, `${GESTORIA}/escaner/nucli/escaner.js`,
      `${GESTORIA}/escaner/nucli/tractorEscaner.js`, `${GESTORIA}/fitxes/gestoria_escaner.md`,
      `${GESTORIA}/finestreta/Finestreta.jsx`, `${GESTORIA}/finestreta/useFinestreta.js`, `${GESTORIA}/finestreta/nucli/tractorIdentitat.js`,
      `${GESTORIA}/finestreta/nucli/fitxaIdentitat.js`, `${GESTORIA}/finestreta/nucli/formularisFinestreta.js`, `${GESTORIA}/fitxes/gestoria_identitat.md`,
      `${GESTORIA}/tauler/CabinaAvio.jsx`, `${GESTORIA}/tauler/nucli/cabinaAvio.js`
    ]) expect(rutes, esperada).toContain(esperada);
    expect(rutes.filter(esProva)).toEqual([]);
    expect(CODI.length).toBeGreaterThan(40);
  });
});

describe('res ix d’este ordinador', () => {
  test('cap API de xarxa', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch('],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['\\bWebSo', 'cket\\b'].join('')), 'WebSocket'],
      [new RegExp(['\\bEventSo', 'urce\\b'].join('')), 'EventSource'],
      [new RegExp(['sendBea', 'con'].join('')), 'sendBeacon'],
      [new RegExp(['navigator\\.service', 'Worker'].join('')), 'navigator.serviceWorker'],
      [new RegExp(['RTCPeer', 'Connection'].join('')), 'WebRTC'],
      [new RegExp(['\\bWeb', 'Transport\\b'].join('')), 'WebTransport'],
      [new RegExp(['\\bimport', 'Scripts\\s*\\('].join('')), 'importScripts']
    ];
    const trobats = CODI.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap emmagatzematge del navegador; IndexedDB només als magatzems declarats', () => {
    const vetats = [
      [new RegExp(['\\blocal', 'Storage\\b'].join('')), 'localStorage'],
      [new RegExp(['\\bsession', 'Storage\\b'].join('')), 'sessionStorage'],
      [new RegExp(['document\\.coo', 'kie'].join('')), 'document.cookie'],
      [new RegExp(['\\bcaches\\.', 'open\\b'].join('')), 'Cache API']
    ];
    const trobats = CODI.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
    /* Llista blanca: les aprovacions dels tractors (registres i claus públiques),
       el progrés d'Aprendre (caixes de Leitner) i, des del 261004 per aprovació
       del Mestre al xat, el llibre legal Veri*Factu: un magatzem de NOMÉS AFEGIR
       (add, mai put ni delete) amb un sol escriptor.
       261007 (ordre del Mestre: «tindre la facturació operativa inclús sense
       xarxa»; pas 1 del mapa de la Gestoria): el perfil fiscal de l'empresa
       (la configuració, el llegat i la marca de l'última còpia del llibre),
       base pròpia 'sdp-gestoria-perfil', separada del llibre legal i també de
       NOMÉS AFEGIR (versions amb add). Sense IndexedDB falla (SENSE_INDEXEDDB),
       mai passa a memòria. Res no ix d'este ordinador.
       Onada 6, ordre del Mestre (261009): cofre xifrat. Base pròpia
       'sdp-gestoria-cofre' (cofre/magatzemCofre.js), que només rep bytes
       xifrats amb AES-GCM-256 (cofre/nucli/cripto.js): la DEK embolcallada
       i els registres. Desar hi reescriu i esborrar hi esborra: d'un cofre de
       dades personals, el que es lleva no s'ha de quedar. Tampoc passa mai a
       memòria (SENSE_INDEXEDDB). */
    const idb = new RegExp(['\\bindexed', 'DB\\b'].join(''));
    expect(CODI.filter(([, codi]) => idb.test(codi)).map(([ruta]) => ruta).sort())
      .toEqual([
        `${GESTORIA}/aprendre/magatzemProgres.js`,
        `${GESTORIA}/cofre/magatzemCofre.js`,
        `${GESTORIA}/facturacio/magatzemPerfil.js`,
        `${GESTORIA}/facturacio/registre/portIndexedDB.js`,
        `${TRACTORS}/nucli/magatzem.js`
      ]);
  });

  test('cap importació del backend; fora dels dos carrils, només els components i utilitats declarats', () => {
    const backend = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i');
    const permesos = [
      (r) => r.startsWith(`${GESTORIA}/`) || r.startsWith(`${TRACTORS}/`),
      (r) => r.startsWith('src/components/PedraSeca/'),
      (r) => r === 'src/app/contexts/RouterContext',
      (r) => r === 'src/utils/sanitize.js',
      (r) => r === 'src/sections/wiki-de-poble/parseMarkdown.js',
      (r) => r === 'react' || r === 'lucide-react',
      /* 261006 (MarIA, PanellAgents.jsx de les 01:52; prompt 261006_0224, T6):
         Agents (BIOS) llig AGENTS.md, el BIOS que ja és públic al repositori,
         com a text i només en desenvolupament (EINES_LOCALS de la Wiki). El
         permís val només per a eixe fitxer i des d'eixe component, i res no
         ix d'este ordinador. */
      (r, origen) => origen === `${TRACTORS}/PanellAgents.jsx` && r === 'AGENTS.md?raw',
      /* Onada 6, ordre del Mestre (261009): «si src/utils/fulls/xlsx.js (creaXlsx)
         és pur i sense xarxa, amplia la llista blanca d'imports per a usar-lo».
         Ho és: JS pur, sense xarxa ni emmagatzematge, i les seues úniques
         adreces són els espais de noms d'OOXML. El permís val només per a
         l'escriptor (no el lector) i només des del llibre de l'Històric, que
         rep les xifres ja reduïdes, sense cap text del banc. L'escriptor porta
         tres fitxers més (model.js, zip.js i inflate.js): la prova de la
         clausura, més avall, els llig i hi aplica les mateixes guardes. */
      (r, origen) => origen === `${GESTORIA}/historic/nucli/llibreGestora.js` && r === 'src/utils/fulls/xlsx.js'
    ];
    const ambBackend = [];
    const fora = [];
    for (const [ruta, codi] of CODI) {
      for (const especificador of especificadors(codi)) {
        if (backend.test(especificador)) ambBackend.push(`${ruta}: ${especificador}`);
        const desti = resol(ruta, especificador);
        if (!permesos.some((permes) => permes(desti, ruta))) fora.push(`${ruta}: ${especificador}`);
      }
    }
    expect(ambBackend).toEqual([]);
    expect(fora).toEqual([]);
  });

  /* Onada 6, ordre del Mestre (261009): «si src/utils/fulls/xlsx.js (creaXlsx) és
     pur i sense xarxa, amplia la llista blanca d'imports per a usar-lo». El permís
     de llibreGestora.js porta, de fet, la clausura de l'escriptor (xlsx.js,
     model.js, zip.js i inflate.js), que el glob dels carrils no llig ni l'empremta
     del tractor cobrix. Es llig ací, seguint les importacions relatives, amb les
     mateixes guardes: cap xarxa, cap emmagatzematge, cap importació de fora de
     src/utils/fulls i cap URL que no siga un espai de noms d'OOXML. */
  test('la clausura de l’escriptor XLSX del llibre de l’Històric: quatre fitxers purs, sense xarxa ni emmagatzematge', () => {
    const clausura = new Map();
    const pendents = ['src/utils/fulls/xlsx.js'];
    const deFora = [];
    while (pendents.length) {
      const ruta = pendents.pop();
      if (clausura.has(ruta)) continue;
      const codi = readFileSync(path.join(ARREL, ruta), 'utf8');
      clausura.set(ruta, codi);
      for (const especificador of especificadors(codi)) {
        const desti = resol(ruta, especificador);
        if (!desti.startsWith('src/utils/fulls/')) deFora.push(`${ruta}: ${especificador}`);
        else pendents.push(desti.endsWith('.js') ? desti : `${desti}.js`);
      }
    }
    expect(deFora).toEqual([]);
    expect([...clausura.keys()].sort()).toEqual(['src/utils/fulls/inflate.js', 'src/utils/fulls/model.js', 'src/utils/fulls/xlsx.js', 'src/utils/fulls/zip.js']);
    const vetats = [
      new RegExp(['\\bfet', 'ch\\s*\\('].join('')), new RegExp(['XMLHttp', 'Request'].join('')), new RegExp(['\\bWebSo', 'cket\\b'].join('')),
      new RegExp(['\\bEventSo', 'urce\\b'].join('')), new RegExp(['sendBea', 'con'].join('')), new RegExp(['\\bimport', 'Scripts\\s*\\('].join('')),
      new RegExp(['\\blocal', 'Storage\\b'].join('')), new RegExp(['\\bsession', 'Storage\\b'].join('')), new RegExp(['\\bindexed', 'DB\\b'].join('')),
      new RegExp(['document\\.coo', 'kie'].join('')), new RegExp(['\\bcaches\\.', 'open\\b'].join('')), /\bimport\s*\(/
    ];
    const trobats = [...clausura].flatMap(([ruta, codi]) => vetats.filter((patro) => patro.test(codi)).map((patro) => `${ruta}: ${patro}`));
    expect(trobats).toEqual([]);
    const hosts = new Set([...clausura.values()].flatMap((codi) => [...codi.matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)].map((m) => m[1])));
    expect([...hosts]).toEqual(['schemas.openxmlformats.org']);
  });

  test('cap URL de fora: només la redacció de Gmail i els espais de noms de l’XLSX', () => {
    /* Llista blanca EXPLÍCITA i mínima, amb el perquè:
       · correuGestoria.js compon l'adreça de redacció de Gmail, que obri la
         persona al pas 5; només porta destinatari, assumpte i text.
       · xlsx.js escriu els espais de noms XML de l'estàndard OOXML: són
         identificadors dins del fitxer i el navegador no s'hi connecta mai.
       · qr.js compon el TEXT de l'URL de cotejo de l'AEAT que va dins del QR
         de cada factura (Orde HAC/1177/2024). Ningú s'hi connecta des d'ací.
         Aprovat pel Mestre al xat el 261004.
       · xmlAeat.js (Onada 6, 261009, decisió per defecte de la nit, a revisar
         pel Mestre) escriu els dos espais de noms XML de l'esquema de l'AEAT
         (SuministroLR i SuministroInformacion) a l'XML de PROVA dels
         registres: són identificadors dins del fitxer, com els de l'XLSX, i
         no s'envia res. */
    const PERMESES = {
      [`${GESTORIA}/enviament/correuGestoria.js`]: ['mail.google.com'],
      [`${GESTORIA}/facturacio/registre/qr.js`]: ['prewww2.aeat.es', 'www2.agenciatributaria.gob.es'],
      [`${GESTORIA}/facturacio/registre/xmlAeat.js`]: ['www2.agenciatributaria.gob.es'],
      [`${GESTORIA}/nucli/xlsx.js`]: ['purl.org', 'schemas.openxmlformats.org']
    };
    const hosts = Object.fromEntries(CODI.map(([ruta, codi]) => [
      ruta, [...new Set([...codi.matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)].map((m) => m[1]))].sort()
    ]).filter(([, llista]) => llista.length > 0));
    expect(hosts).toEqual(PERMESES);
  });

  test('obrir finestres o el menú de compartir: només el pas 5, que fa sempre la persona', () => {
    /* Llista blanca EXPLÍCITA i mínima, amb el perquè:
       · EnviamentGestoria.jsx obri la redacció de Gmail en una pestanya nova
         (window.open) i el menú de compartir del sistema (Web Share) amb el
         full que la persona ja ha revisat. Enviar ho fa ella.
       · correuGestoria.js només pregunta si el sistema pot compartir fitxers
         (canShare): no comparteix res.
       Ningú navega fora de l'app amb location. */
    const sortides = [
      { que: 'window.open', patro: /\bwindow\.open\s*\(/, permesos: [`${GESTORIA}/enviament/EnviamentGestoria.jsx`] },
      { que: 'Web Share', patro: /\.(?:share|canShare)\s*\(/, permesos: [`${GESTORIA}/enviament/EnviamentGestoria.jsx`, `${GESTORIA}/enviament/correuGestoria.js`] },
      { que: 'navigator.share', patro: /\bnavigator\.share\b/, permesos: [] },
      { que: 'location', patro: /\blocation\.(?:href\s*=[^=]|assign\s*\(|replace\s*\()/, permesos: [] }
    ];
    for (const { que, patro, permesos } of sortides) {
      const usen = CODI.filter(([, codi]) => patro.test(codi)).map(([ruta]) => ruta).sort();
      expect(usen.filter((ruta) => !permesos.includes(ruta)), que).toEqual([]);
    }
    // La llista blanca no és decorativa: els dos fitxers fan servir el que s'hi permet.
    expect(FONTS[`${GESTORIA}/enviament/EnviamentGestoria.jsx`]).toMatch(/\bwindow\.open\s*\(/);
    expect(FONTS[`${GESTORIA}/enviament/correuGestoria.js`]).toMatch(/mail\.google\.com/);
  });

  test('cap literal amb forma de DNI, NIE o IBAN al codi ni a les fitxes', () => {
    const vetats = [
      [/\b\d{8}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'DNI'],
      [/\b[XYZ][-\s]?\d{7}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'NIE'],
      [/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){4,7}(?: ?[A-Z0-9]{1,3})?\b/, 'IBAN']
    ];
    const trobats = Object.entries(FONTS).flatMap(([ruta, text]) => vetats
      .map(([patro, que]) => [patro.exec(text), que]).filter(([m]) => m).map(([m, que]) => `${ruta}: ${que} «${m[0]}»`));
    expect(trobats).toEqual([]);
    // Les sondes: els patrons sí que troben les formes que vetem (fetes ací, no escrites senceres).
    const sonda = (...trossos) => trossos.join('');
    expect(vetats[0][0].test(sonda('1234', '5678', 'Z'))).toBe(true);
    expect(vetats[1][0].test(sonda('X', '1234567', 'L'))).toBe(true);
    expect(vetats[2][0].test(sonda('ES91 ', '2100 0418 ', '4502 0005 1332'))).toBe(true);
  });

  test('les dades personals exigixen signatura: cap tractor que les toque s’aprova amb una confirmació escrita', () => {
    /* Tercer manifest, 'gestoria.tauler': llegir els bancs des del Tauler és
       una lectura nova de dades personals, amb tractor propi (MAPA §4, pas 1,
       decisió A2). Aprovat pel Mestre al xat el 261004. Els dos d'abans no
       canvien ni tornen a «pendent».
       Onada 6, ordre del Mestre (261009): quart manifest, 'gestoria.historic'
       (l'històric del banc i la despesa en IA), també de signatura i sense
       xarxa; els tres d'abans no canvien.
       Ordre del Mestre, 13-10-2026 (pla 261013_1405): cinqué, 'gestoria.escaner'
       (l'Escàner Local de la carpeta, front D), i sisé, 'gestoria.identitat'
       (la Fitxa d'identitat i la Finestreta, front H). Tots dos llegixen dades
       personals: també de signatura i sense xarxa. Els quatre d'abans no
       canvien de nivell. */
    expect(TRACTORS_GESTORIA.map((m) => m.id)).toEqual([
      'gestoria.factures', 'gestoria.correus', 'gestoria.tauler', 'gestoria.historic', 'gestoria.escaner', 'gestoria.identitat'
    ]);
    for (const manifest of TRACTORS_GESTORIA) {
      expect(manifest, manifest.id).toMatchObject({ dadesPersonals: true, nivellMinim: 'signatura', xarxa: 'cap' });
    }
  });
});

/* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la frontera es mou amb la Gestoria. Abans: «només la
   Wiki, i només en desenvolupament». Ara: la Gestoria, només pel pont de la
   seua app i només en desenvolupament; els Tractors, només per la Wiki i
   només en desenvolupament. Cap guarda s'afebleix. */
describe('la frontera: la Gestoria només pel pont de la seua app, els Tractors només per la Wiki, i només en desenvolupament', () => {
  const esDelsCarrils = (ruta) => ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
  /* Els especificadors d'un text que entren als carrils, des de qualsevol fitxer de src. */
  const delsCarrils = (text) => especificadors(text).filter((e) => /(?:^|\/)(?:sections\/)?(?:gestoria|tractors)\//.test(e) && !e.startsWith('./'));

  test('D3 · App.jsx no té cap ruta /gestoria ni /tractors, ni importa els dos carrils', () => {
    const rutes = [...fontApp.matchAll(/<Route\b[^>]*?\bpath=["']([^"']+)["']/g)].map((m) => m[1]);
    expect(rutes.length).toBeGreaterThan(5);
    expect(rutes.filter((r) => /gestoria|tractors/i.test(r))).toEqual([]);
    expect(especificadors(fontApp).filter((e) => /sections\/(?:gestoria|tractors)\//.test(e))).toEqual([]);
    /* La Gestoria s'obri per la plataforma d'apps (/app/*), mai per una ruta pròpia. */
    expect(rutes).toContain('/app/*');
  });

  test('cap fitxer de src fora dels carrils els importa, excepte el pont (la Gestoria) i la Wiki (els Tractors); ningú importa el suport de proves', () => {
    const fora = [];
    const suport = [];
    const importadorsGestoria = [];
    for (const ruta of fitxersDe('src')) {
      if (esProva(ruta)) continue;
      const codi = readFileSync(path.join(ARREL, ruta), 'utf8');
      for (const especificador of especificadors(codi)) {
        const desti = resol(ruta, especificador);
        if (desti.includes('/__fixtures__/')) suport.push(`${ruta}: ${especificador}`);
        if (esDelsCarrils(ruta)) continue;
        if (desti.startsWith(`${GESTORIA}/`)) {
          importadorsGestoria.push(`${ruta}: ${especificador}`);
          if (!(ruta === PONT && DEL_PONT.includes(especificador))) fora.push(`${ruta}: ${especificador}`);
        } else if (desti.startsWith(`${TRACTORS}/`) && ruta !== WIKI) {
          fora.push(`${ruta}: ${especificador}`);
        }
      }
    }
    expect(fora).toEqual([]);
    expect(suport).toEqual([]);
    // El pont no és decoratiu: porta els seus especificadors, i és l'únic importador de la Gestoria.
    expect(importadorsGestoria).toEqual(DEL_PONT.map((e) => `${PONT}: ${e}`));
  });

  test('la Wiki ja no importa la Gestoria: només els Tractors, amb lazy() dins d’una constant nul·la fora de DEV', () => {
    expect(fontWiki).toContain('modulsLocalsActius({ DEV: import.meta.env.DEV })');
    const inici = fontWiki.indexOf('const EINES_LOCALS = import.meta.env.DEV ? {');
    expect(inici).toBeGreaterThan(-1);
    const fi = fontWiki.indexOf('} : null;', inici);
    expect(fi).toBeGreaterThan(inici);
    const bloc = fontWiki.slice(inici, fi);
    // 261006: el tercer, Agents (BIOS), també del carril dels Tractors (PanellAgents.jsx).
    expect(delsCarrils(bloc)).toEqual(['../tractors/PanellTractors.jsx', '../tractors/PanellSentinelles.jsx', '../tractors/PanellAgents.jsx']);
    // Fora del bloc, cap importació dels dos carrils (tampoc estàtica).
    expect(delsCarrils(fontWiki.slice(0, inici) + fontWiki.slice(fi))).toEqual([]);
    expect([...bloc.matchAll(/lazyRoute\(\(\) => import\(/g)]).toHaveLength(3);
    // Cap carpeta ni ítem de la Gestoria al model.
    expect(especificadors(fontWiki).filter((e) => /gestoria/.test(e))).toEqual([]);
    const iniciModel = fontWiki.indexOf('export function modulsLocalsActius(');
    const fiModel = fontWiki.indexOf('const MODULS_LOCALS =', iniciModel);
    expect(iniciModel).toBeGreaterThan(-1);
    expect(fiModel).toBeGreaterThan(iniciModel);
    expect(fontWiki.slice(iniciModel, fiModel)).not.toMatch(/gestoria_(?:cat|panell|aprendre)/);
    expect(fontWiki).not.toMatch(/ShellGestoria|Aprendre\.jsx/);
  });

  /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
     Gestoria i Wiki»): la Wiki tampoc ENCAMINA cap a la Gestoria. Ni el
     component ni la seua ruta coneixen els ids vells ni cap destí de l'app, i
     no redirigixen: una URL vella /wikidepoble?categoria=gestoria_cat&item=…
     cau com qualsevol ítem desconegut. Ningú importa l'antic mapa de
     redireccions (rutesWiki.js), perquè la redirecció no torne d'amagat. */
  test('la Wiki i la seua ruta no encaminen a la Gestoria: cap id vell, cap destí de l’app, cap redirecció', () => {
    const coneixGestoria = /gestoria_(?:cat|panell|aprendre)|destiGestoria|rutesWiki|['"`]\/app\/gestoria/;
    for (const [nom, font] of [['WikiDePobleSection.jsx', fontWiki], ['RutaWikiDePoble.jsx', fontRutaWiki]]) {
      expect(coneixGestoria.test(font), `${nom} coneix la Gestoria`).toBe(false);
      expect(/\bNavigate\b/.test(font), `${nom} redirigix`).toBe(false);
    }
    const mapaVell = 'src/sections/wiki-de-poble/rutesWiki';
    const importadors = fitxersDe('src').filter((ruta) => !esProva(ruta)).filter((ruta) => especificadors(readFileSync(path.join(ARREL, ruta), 'utf8'))
      .some((e) => [mapaVell, `${mapaVell}.js`].includes(resol(ruta, e))));
    expect(importadors).toEqual([]);
    // Sonda: el patró sí que troba les formes vetades.
    expect(coneixGestoria.test(['?item=gestoria', '_panell'].join(''))).toBe(true);
    expect(coneixGestoria.test(["'/app/", "gestoria/tauler'"].join(''))).toBe(true);
  });

  /* 261007: un lazy() per especificador del pont (ara tres, amb la Facturació). */
  test('el pont decidix amb import.meta.env.DEV: un lazy() per especificador dins d’una constant nul·la fora de DEV, i cap altra importació dels carrils', () => {
    const inici = fontPont.indexOf('const VISTES = import.meta.env.DEV ? Object.freeze({');
    expect(inici).toBeGreaterThan(-1);
    const fi = fontPont.indexOf('}) : null;', inici);
    expect(fi).toBeGreaterThan(inici);
    const bloc = fontPont.slice(inici, fi);
    expect(delsCarrils(bloc)).toEqual([...DEL_PONT]);
    expect(delsCarrils(fontPont.slice(0, inici) + fontPont.slice(fi))).toEqual([]);
    expect([...bloc.matchAll(/lazyRoute\(\(\) => import\(/g)]).toHaveLength(DEL_PONT.length);
    // Onada 6, ordre del Mestre (261009): quatre, amb «Històric i IA».
    // Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): cinc, amb «Identitat i Finestreta».
    expect(DEL_PONT).toHaveLength(5);
    // Els Tractors no hi entren mai, ni ContenidorGestoria directament (arriba per la closca, com abans).
    expect(fontPont).not.toMatch(/sections\/tractors\/|ContenidorGestoria\.jsx'/);
  });

  test('l’únic importador del pont és el manifest de l’app, darrere del literal de DEV, amb entorn de desenvolupament i apagada per defecte', () => {
    expect(fontManifest).toContain("carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_GESTORIA === '1' ? () => import('./AppGestoria.jsx') : null");
    expect(fontManifest.split('import(').length - 1).toBe(1);
    expect(fontManifest).toContain("entorn: 'desenvolupament',");
    expect(fontManifest).toContain('actiuPerDefecte: false,');
    const importadors = fitxersDe('src').filter((ruta) => !esProva(ruta)).filter((ruta) => especificadors(readFileSync(path.join(ARREL, ruta), 'utf8'))
      .some((e) => [PONT, PONT.replace(/\.jsx$/, '')].includes(resol(ruta, e))));
    expect(importadors).toEqual([MANIFEST]);
  });

  test('la porta dels Tractors: la consulta de la closca (CONSULTA_TRACTORS, font signada) i el desviament de l’app a la Wiki coincidixen', () => {
    const consulta = /export const CONSULTA_TRACTORS = '([^']+)';/.exec(FONTS[`${GESTORIA}/ContenidorGestoria.jsx`])?.[1];
    expect(consulta).toBe('?categoria=tractors_cat&item=tractors_aprovacio');
    expect(RUTA_PORTA_TRACTORS).toBe(`/wikidepoble${consulta}`);
    expect(new URLSearchParams(consulta).get('item')).toBe(ITEM_PORTA_TRACTORS);
  });

  /* Vite compila un fitxer sol (tota importació, externa) en mode producció
     i en mode desenvolupament: el literal es reemplaça i, en producció, les
     importacions dinàmiques dels carrils desapareixen. */
  async function compila(entrada, produccio) {
    const abans = process.env.NODE_ENV;
    process.env.NODE_ENV = produccio ? 'production' : 'development';
    try {
      const resultat = await build({
        configFile: false,
        logLevel: 'silent',
        root: ARREL,
        mode: produccio ? 'production' : 'development',
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(ARREL, entrada), formats: ['es'], fileName: 'sonda' },
          rollupOptions: { external: (_id, importador) => Boolean(importador) }
        }
      });
      return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
    } finally {
      if (abans === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = abans;
    }
  }

  test('al build de producció de la Wiki no queda cap importació dels Tractors, i ni en desenvolupament cap de la Gestoria', async () => {
    const carrils = /import\(\s*["'][^"']*(?:ShellGestoria|PanellTractors|PanellSentinelles|PanellAgents|aprendre\/Aprendre)/g;
    const desenvolupament = await compila(WIKI, false);
    expect(desenvolupament.match(carrils)).toHaveLength(3);
    expect(desenvolupament).not.toMatch(/ShellGestoria|ContenidorGestoria|Aprendre\.jsx/);
    const produccio = await compila(WIKI, true);
    expect(produccio.match(carrils)).toBeNull();
    expect(produccio).not.toMatch(/ShellGestoria|ContenidorGestoria|PanellTractors|PanellSentinelles|PanellAgents|Aprendre\.jsx/);
  }, 60000);

  /* La closca (ShellGestoria) porta ContenidorGestoria a dins: vetada al
     paquet de producció, com abans a la Wiki. Encara que algú compilara
     l'app en producció (VITE_SDP_APP_GESTORIA), el pont no hi porta res. */
  test('al build de producció del pont no queda cap importació de la Gestoria', async () => {
    // 261007: també la Facturació, que en desenvolupament és la tercera importació.
    // Onada 6, ordre del Mestre (261009): i «Històric i IA», la quarta.
    // Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): i «Identitat i Finestreta», la cinquena.
    const gestoria = /import\(\s*["'][^"']*(?:ShellGestoria|aprendre\/Aprendre|facturar\/Facturacio|historic\/Historic|finestreta\/Finestreta)/g;
    const desenvolupament = await compila(PONT, false);
    expect(desenvolupament.match(gestoria)).toHaveLength(5);
    const produccio = await compila(PONT, true);
    expect(produccio.match(gestoria)).toBeNull();
    expect(produccio).not.toMatch(/ShellGestoria|ContenidorGestoria|Aprendre\.jsx|Facturacio\.jsx|Historic\.jsx|Finestreta\.jsx|sections\/gestoria/);
  }, 60000);
});
