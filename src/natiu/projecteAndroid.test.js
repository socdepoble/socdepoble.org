// @vitest-environment node
/* 261026 (ordre del Mestre, prompt 261026_1615) · El projecte natiu d'Android
   (android/), retocat a mà per al menú «Compartir», els avisos del xat i les
   barres del sistema. Com projecteIos.test.js: res d'açò ho regenera
   Capacitor, i si algú torna a crear el projecte esta prova diu què s'ha
   perdut. Mira els fitxers tal com són (sense gradle ni aapt):
     · AndroidManifest.xml: SEND i SEND_MULTIPLE (imatges i text) a .MainActivity,
       i fora els tres permisos d'avisos programats que porta el paquet;
     · MainActivity.java: el connector propi es registra abans del pont, i una
       activitat restaurada no torna a atendre l'intent amb què va nàixer;
     · CompartirNatiuPlugin.java: només content:// d'altres apps (també amb
       l'usuari davant de l'autoritat), la llista blanca d'imatges, els sostres
       (els mateixos que l'adaptador de JS), cap excepció d'un proveïdor aliè
       que tombe l'App, el text amb estil i l'esdeveniment retingut, avisat al
       fil dels connectors;
     · styles.xml: barres negres amb icones blanques des de l'arrencada, i el
       fons de la finestra negre;
     · capacitor.config.json i package.json: SystemBars (també el viewport-fit
       cover), la icona dels avisos i la versió exacta del paquet d'avisos.
   Gauntlet 261026_1615 (Codex C1615-03/04/05 / Gemini G1615-03): els fils es
   tanquen en destruir el connector, el copiador és fitat i rebutja en lloc
   d'encuar, cada lectura té termini i interrupció, els sostres d'URIs, de temps
   i de text, Locale.ROOT, les restes que tornen en arrencar (una setmana) i
   l'intent sanejat abans que cap connector en llija els extres.
   Pla 261028_1526 (Bloc D, P1-31/P1-33): l'hora de l'intent (rebutMs), el
   sostre de bytes per compartició, la compartició que plega en destruir-se i
   l'època de la sessió a la banda nativa (tallaSessio), desada i al nom de cada còpia.
   Sense android/app/src/main (un arbre sense el projecte), se salta dient per què. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { MAX_FITXERS_COMPARTITS } from '../config/compartirNatiu.js';
import { CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT } from './compartirNatiu.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAIN = path.join(ARREL, 'android', 'app', 'src', 'main');
const JAVA = path.join(MAIN, 'java', 'org', 'socdepoble', 'app');
const HI_HA_PROJECTE = fs.existsSync(path.join(MAIN, 'AndroidManifest.xml'));
const llig = (...trossos) => fs.readFileSync(path.join(...trossos), 'utf8');
/* Els noms dels paquets es componen a trossos, com a projecteIos.test.js. */
const AVISOS_LOCALS = ['@capa', 'citor/local-notifications'].join('');
/* Pla 261028_1526 · copia rep el que queda del sostre de la compartició (P1-33) i l'època de l'intent (P1-31). */
const COPIA = 'private JSObject copia(Uri uri, String mime, String extensio, long restant, long sessioAlRebre)';
/* P1-31 · La comprovació de l'època dins de processa: si ha canviat, fora les còpies fetes i plega. */
const TALLADA = /\bif \(sessio\.get\(\) != sessioAlRebre\) \{\s*esborra\(fitxers\);\s*return;\s*\}/;

const senseComentarisXml = (xml) => xml.replace(/<!--[\s\S]*?-->/g, '');
/* Els comentaris de Java fora; «content://» dins d'una cadena no és cap comentari. */
const senseComentarisJava = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"])\/\/[^\n]*/g, '');
const atributs = (etiqueta) => Object.fromEntries([...etiqueta.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)].map(([, nom, valor]) => [nom, valor]));

/** Els intent-filter d'una activitat: { accions, categories, mimes }. */
function filtresDe(activitat) {
  return [...activitat.matchAll(/<intent-filter[^>]*>([\s\S]*?)<\/intent-filter>/g)].map(([, cos]) => {
    const de = (etiqueta, atribut) => [...cos.matchAll(new RegExp(`<${etiqueta}\\b[^>]*/>`, 'g'))]
      .map(([tros]) => atributs(tros)[atribut]).filter(Boolean);
    return { accions: de('action', 'android:name'), categories: de('category', 'android:name'), mimes: de('data', 'android:mimeType').sort() };
  });
}

/** Els estils de styles.xml com a { nom: { item: valor } }. */
function estils(xml) {
  return Object.fromEntries([...senseComentarisXml(xml).matchAll(/<style\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/style>/g)].map(([, nom, cos]) => [
    nom,
    Object.fromEntries([...cos.matchAll(/<item\s+name="([^"]+)"[^>]*>([^<]*)<\/item>/g)].map(([, clau, valor]) => [clau, valor.trim()]))
  ]));
}

/** El cos d'un mètode de Java (claus aparellades), o ''. */
function cosDelMetode(codi, signatura) {
  const inici = codi.indexOf(signatura);
  if (inici < 0) return '';
  const obri = codi.indexOf('{', inici);
  let fondaria = 1;
  let i = obri + 1;
  for (; i < codi.length && fondaria; i += 1) {
    if (codi[i] === '{') fondaria += 1;
    else if (codi[i] === '}') fondaria -= 1;
  }
  return codi.slice(obri + 1, i - 1);
}

/* Gauntlet 261026_1615 (Codex C1615-04 / Gemini G1615-03) · Lectors de Java que
   salten les cadenes i els caràcters («"[\\p{Cntrl}]"», «'@'»): el parell d'un
   signe d'obrir, els arguments d'una crida i els blocs try amb les seues clàusules. */
const PARELLS_JAVA = Object.freeze({ '{': '}', '(': ')' });

/** La posició del parell del signe d'obrir de `obri`, o -1. */
function parellJava(codi, obri) {
  const obertura = codi[obri];
  const parell = PARELLS_JAVA[obertura];
  if (!parell) return -1;
  let fondaria = 0;
  for (let i = obri; i < codi.length; i += 1) {
    const signe = codi[i];
    if (signe === '"' || signe === "'") {
      for (i += 1; i < codi.length && codi[i] !== signe; i += 1) {
        if (codi[i] === '\\') i += 1;
      }
    } else if (signe === obertura) {
      fondaria += 1;
    } else if (signe === parell) {
      fondaria -= 1;
      if (fondaria === 0) return i;
    }
  }
  return -1;
}

/** Els arguments (retallats) de la primera crida que comença per `crida` (acabada en «(»), o null. */
function argumentsDe(codi, crida) {
  const inici = codi.indexOf(crida);
  if (inici < 0) return null;
  const obri = inici + crida.length - 1;
  const fi = parellJava(codi, obri);
  if (fi < 0) return null;
  const dins = codi.slice(obri + 1, fi);
  const trossos = [];
  let tros = '';
  let fondaria = 0;
  for (let i = 0; i < dins.length; i += 1) {
    const signe = dins[i];
    if (signe === '-' && dins[i + 1] === '>') { tros += '->'; i += 1; continue; }
    if ('(<{['.includes(signe)) fondaria += 1;
    else if (')>}]'.includes(signe)) fondaria -= 1;
    if (signe === ',' && fondaria === 0) { trossos.push(tros.trim()); tros = ''; } else tros += signe;
  }
  trossos.push(tros.trim());
  return trossos;
}

/** Cada `try` (també amb recursos): { inici, obri, fi, recursos, cos, clausules: [{ tipus, excepcions, cos }] }. */
function blocsTry(codi) {
  const blocs = [];
  for (const trobat of codi.matchAll(/\btry\s*(?=[({])/g)) {
    let i = trobat.index + trobat[0].length;
    let recursos = '';
    if (codi[i] === '(') {
      const fi = parellJava(codi, i);
      if (fi < 0) continue;
      recursos = codi.slice(i + 1, fi);
      for (i = fi + 1; /\s/.test(codi[i] ?? ''); i += 1);
    }
    if (codi[i] !== '{') continue;
    const fi = parellJava(codi, i);
    if (fi < 0) continue;
    const clausules = [];
    for (let j = fi + 1; ;) {
      const seguent = /^\s*(?:catch\s*\(([^)]*)\)|(finally))\s*\{/.exec(codi.slice(j));
      if (!seguent) break;
      const obri = j + seguent[0].length - 1;
      const tanca = parellJava(codi, obri);
      if (tanca < 0) break;
      clausules.push({ tipus: seguent[2] ? 'finally' : 'catch', excepcions: seguent[1] ?? '', cos: codi.slice(obri + 1, tanca) });
      j = tanca + 1;
    }
    blocs.push({ inici: trobat.index, obri: i, fi, recursos, cos: codi.slice(i + 1, fi), clausules });
  }
  return blocs;
}

/** Una constant `private static final int|long NOM = …;` (amb «_», «L» i productes): { tipus, valor }. */
function constantJava(codi, nom) {
  const trobada = new RegExp(`private static final (int|long) ${nom} = ([^;]+);`).exec(codi);
  if (!trobada) return { tipus: null, valor: Number.NaN };
  const factors = trobada[2].split('*').map((factor) => factor.trim().replace(/_/g, '').replace(/L$/, ''));
  const valor = factors.every((factor) => /^\d+$/.test(factor)) ? factors.reduce((producte, factor) => producte * Number(factor), 1) : Number.NaN;
  return { tipus: trobada[1], valor };
}

describe.skipIf(!HI_HA_PROJECTE)('el projecte d’Android (android/)', () => {
  test('els lectors de manifest, d’estils i de Java llegixen el que diuen', () => {
    expect(filtresDe('<intent-filter><action android:name="A" /><category android:name="C"/><data android:mimeType="z/*" /><data android:mimeType="a/b" /></intent-filter>'))
      .toEqual([{ accions: ['A'], categories: ['C'], mimes: ['a/b', 'z/*'] }]);
    expect(estils('<resources><!-- <style name="X"></style> --><style name="Y" parent="P"><item name="a">1</item><item name="b" tools:targetApi="27"> 2 </item></style></resources>'))
      .toEqual({ Y: { a: '1', b: '2' } });
    expect(senseComentarisJava('a("content://x"); // fora\n/* fora */b();')).toBe('a("content://x"); \nb();');
    expect(cosDelMetode('void f() { if (x) { y(); } } void g() {}', 'void f()')).toBe(' if (x) { y(); } ');
  });

  test('els lectors de parells, d’arguments, de blocs try i de constants llegixen el que diuen (Gauntlet 261026_1615)', () => {
    expect(parellJava('a("}", \'{\', (b)) c', 1)).toBe(15);
    expect(parellJava('(()', 0)).toBe(-1);
    expect(argumentsDe('x = new T(0, M, new Q<>(), (a) -> f(a, b), C::g);', 'new T(')).toEqual(['0', 'M', 'new Q<>()', '(a) -> f(a, b)', 'C::g']);
    expect(argumentsDe('res', 'new T(')).toBeNull();
    const codi = 'try { a(); } catch (X | Y e) { b("}"); } finally { c(); } try (R r = r()) { d(); } catch (Z e) { }';
    const blocs = blocsTry(codi);
    expect(blocs.map(({ recursos, cos, clausules }) => ({ recursos, cos, clausules }))).toEqual([
      { recursos: '', cos: ' a(); ', clausules: [{ tipus: 'catch', excepcions: 'X | Y e', cos: ' b("}"); ' }, { tipus: 'finally', excepcions: '', cos: ' c(); ' }] },
      { recursos: 'R r = r()', cos: ' d(); ', clausules: [{ tipus: 'catch', excepcions: 'Z e', cos: ' ' }] }
    ]);
    expect(codi.slice(blocs[0].obri, blocs[0].fi + 1)).toBe('{ a(); }');
    expect(constantJava('private static final long A = 7L * 24 * 1_000;', 'A')).toEqual({ tipus: 'long', valor: 168000 });
    expect(constantJava('private static final int B = 32;', 'B')).toEqual({ tipus: 'int', valor: 32 });
    expect(constantJava('private static final int C = D + 1;', 'C').valor).toBeNaN();
    expect(constantJava('', 'E').tipus).toBeNull();
  });

  test('AndroidManifest: .MainActivity rep SEND i SEND_MULTIPLE d’imatges i de text, amb la categoria DEFAULT', () => {
    const manifest = senseComentarisXml(llig(MAIN, 'AndroidManifest.xml'));
    const activitats = [...manifest.matchAll(/<activity\b([^>]*)>([\s\S]*?)<\/activity>/g)];
    const principal = activitats.find(([, obertura]) => atributs(obertura)['android:name'] === '.MainActivity');
    expect(principal, 'falta .MainActivity').toBeTruthy();
    /* Sense exported, Android 12+ no deixa que el menú del sistema hi arribe. */
    expect(atributs(principal[1])['android:exported']).toBe('true');
    expect(atributs(principal[1])['android:launchMode']).toBe('singleTask');
    const filtres = filtresDe(principal[2]);
    for (const accio of ['android.intent.action.SEND', 'android.intent.action.SEND_MULTIPLE']) {
      const amb = filtres.filter((f) => f.accions.includes(accio));
      expect(amb, accio).toHaveLength(1);
      expect(amb[0].accions, accio).toEqual([accio]);
      expect(amb[0].categories, accio).toEqual(['android.intent.category.DEFAULT']);
      expect(amb[0].mimes, accio).toEqual(['image/*', 'text/plain']);
    }
    /* Cap altra activitat no rep el que es compartix. */
    for (const [, obertura, cos] of activitats.filter((a) => a !== principal)) {
      expect(cos, atributs(obertura)['android:name']).not.toMatch(/action\.SEND/);
    }
  });

  test('AndroidManifest: l’espai de noms tools i fora l’alarma exacta, l’arrencada i el wake lock', () => {
    const manifest = senseComentarisXml(llig(MAIN, 'AndroidManifest.xml'));
    const arrel = /<manifest\b([^>]*)>/.exec(manifest)?.[1] ?? '';
    expect(atributs(arrel)['xmlns:tools']).toBe('http://schemas.android.com/tools');
    const permisos = [...manifest.matchAll(/<uses-permission\b[^>]*\/>/g)].map(([tros]) => atributs(tros));
    for (const nom of ['SCHEDULE_EXACT_ALARM', 'RECEIVE_BOOT_COMPLETED', 'WAKE_LOCK']) {
      const declarats = permisos.filter((p) => p['android:name'] === `android.permission.${nom}`);
      /* Una sola declaració, i és la que el lleva del manifest fusionat. */
      expect(declarats, nom).toHaveLength(1);
      expect(declarats[0]['tools:node'], nom).toBe('remove');
    }
    /* El permís de veres dels avisos no es lleva. */
    expect(permisos.some((p) => p['android:name'] === 'android.permission.POST_NOTIFICATIONS' && p['tools:node'] === 'remove')).toBe(false);
  });

  test('MainActivity: registra CompartirNatiuPlugin abans de super.onCreate', () => {
    const codi = senseComentarisJava(llig(JAVA, 'MainActivity.java'));
    const onCreate = cosDelMetode(codi, 'protected void onCreate(Bundle savedInstanceState)');
    const registre = onCreate.indexOf('registerPlugin(CompartirNatiuPlugin.class);');
    const pont = onCreate.indexOf('super.onCreate(savedInstanceState);');
    expect(registre).toBeGreaterThanOrEqual(0);
    expect(pont).toBeGreaterThan(registre);
    expect(codi.match(/registerPlugin\(/g)).toHaveLength(1);
  });

  /* 261026 (prompt 261026_1615, revisió) · Si Android mata el procés, la tasca
     restaurada torna a lliurar l'intent d'origen (el SEND, o el toc d'un avís)
     al final de BridgeActivity.onCreate: la marca i l'extra de l'avís s'han de
     llevar ABANS, o el lot o l'avís s'obririen dues vegades. */
  test('MainActivity: restaurada (savedInstanceState != null), marca l’intent consumit i lleva LocalNotificationId abans de super.onCreate', () => {
    const codi = senseComentarisJava(llig(JAVA, 'MainActivity.java'));
    const onCreate = cosDelMetode(codi, 'protected void onCreate(Bundle savedInstanceState)');
    const restaurada = onCreate.indexOf('if (savedInstanceState != null');
    expect(restaurada, 'falta el cas de l’activitat restaurada').toBeGreaterThanOrEqual(0);
    const bloc = cosDelMetode(onCreate.slice(restaurada), 'if (savedInstanceState != null');
    expect(bloc).toMatch(/getIntent\(\)\.putExtra\(CompartirNatiuPlugin\.MARCA_CONSUMIT, true\);/);
    const extraDelAvis = /getIntent\(\)\.removeExtra\("([^"]+)"\);/.exec(bloc)?.[1];
    expect(extraDelAvis).toBe('LocalNotificationId');
    const fiDelBloc = onCreate.indexOf(bloc, restaurada) + bloc.length;
    expect(codi.match(/super\.onCreate\(/g)).toHaveLength(1);
    expect(onCreate.indexOf('super.onCreate(savedInstanceState);')).toBeGreaterThan(fiDelBloc);

    // El connector respecta la marca abans de recollir res.
    const connector = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(connector).toMatch(/static final String MARCA_CONSUMIT = "[^"]+";/);
    const nouIntent = cosDelMetode(connector, 'protected void handleOnNewIntent(Intent intent)');
    const marca = nouIntent.indexOf('if (intent.getBooleanExtra(MARCA_CONSUMIT, false)) return;');
    expect(marca).toBeGreaterThanOrEqual(0);
    expect(marca).toBeLessThan(nouIntent.indexOf('recullUris(intent)'));

    // L'extra és el que llig el paquet d'avisos (NOTIFICATION_INTENT_KEY), si està instal·lat.
    const fontsAvisos = path.join(ARREL, 'node_modules', ...AVISOS_LOCALS.split('/'), 'android', 'src');
    if (fs.existsSync(fontsAvisos)) {
      const claus = fs.readdirSync(fontsAvisos, { recursive: true }).filter((rel) => /\.(?:kt|java)$/.test(rel))
        .flatMap((rel) => [...fs.readFileSync(path.join(fontsAvisos, rel), 'utf8').matchAll(/NOTIFICATION_INTENT_KEY\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
      expect(claus).toEqual([extraDelAvis]);
    }
  });

  test('CompartirNatiuPlugin: el nom del connector i l’esdeveniment, els mateixos que escolta l’adaptador de JS, retingut', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(codi).toMatch(/@CapacitorPlugin\(name = "CompartirNatiu"\)\s*public class CompartirNatiuPlugin extends Plugin\b/);
    expect(CONNECTOR_COMPARTIR).toBe('CompartirNatiu');
    expect(/static final String ESDEVENIMENT = "([^"]+)";/.exec(codi)?.[1]).toBe(ESDEVENIMENT_COMPARTIT);
    /* El tercer argument reté l'avís fins que el web s'hi subscriu (arrencada en fred).
       Gauntlet 261026_1615 (Codex C1615-03) · Ara n'hi ha dos (la compartició nova i
       les restes d'abans), i tots dos, retinguts i al fil dels connectors. */
    const avisos = codi.match(/notifyListeners\([^)]*\)/g) ?? [];
    expect(avisos).toHaveLength(2);
    for (const avis of avisos) expect(avis).toBe('notifyListeners(ESDEVENIMENT, dades, true)');
    expect(codi.match(/getBridge\(\)\.execute\(\(\) -> notifyListeners\(ESDEVENIMENT, dades, true\)\);/g)).toHaveLength(avisos.length);
  });

  test('CompartirNatiuPlugin: només content:// d’altres apps; mai file:// ni el proveïdor propi', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const accepta = cosDelMetode(codi, 'private boolean esUriAcceptable(Uri uri)');
    expect(accepta).toMatch(/if \(uri == null \|\| !ContentResolver\.SCHEME_CONTENT\.equals\(uri\.getScheme\(\)\)\) return false;/);
    expect(accepta).toMatch(/String propi = getContext\(\)\.getPackageName\(\)\.toLowerCase\(Locale\.ROOT\);/);
    expect(accepta).toMatch(/return !autoritat\.equals\(propi\) && !autoritat\.startsWith\(propi \+ "\."\);/);
    /* Cap camí que llija fitxers per ruta. */
    expect(codi).not.toMatch(/SCHEME_FILE|"file"|Uri\.fromFile/);
    /* I tota URI hi passa abans de llegir-la. */
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa).toMatch(/if \(!esUriAcceptable\(uri\)\) \{\s*rebutjats\+\+;\s*continue;\s*\}/);
    expect(processa.indexOf('esUriAcceptable(uri)')).toBeLessThan(processa.indexOf('mimeDe(uri'));
  });

  /* 261026 (prompt 261026_1615, revisió) · Amb diversos usuaris (perfil de
     treball), l'autoritat porta l'usuari davant: «0@org.socdepoble.app.fileprovider»
     també és el proveïdor propi. Es lleva abans de comparar. */
  test('CompartirNatiuPlugin: esUriAcceptable lleva el prefix d’usuari («@») de l’autoritat abans de comparar-la', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const accepta = cosDelMetode(codi, 'private boolean esUriAcceptable(Uri uri)');
    const nul = accepta.indexOf('if (autoritat == null) return false;');
    const lleva = accepta.search(/autoritat = autoritat\.substring\(autoritat\.lastIndexOf\('@'\) \+ 1\)\.toLowerCase\(Locale\.ROOT\);/);
    const compara = accepta.indexOf('return !autoritat.equals(propi)');
    expect(nul).toBeGreaterThanOrEqual(0);
    expect(lleva).toBeGreaterThan(nul);
    expect(compara).toBeGreaterThan(lleva);
  });

  /* 261026 (prompt 261026_1615, revisió) · El proveïdor d'una altra app pot
     llançar qualsevol RuntimeException (SecurityException, IllegalArgument…):
     en el fil del copiador, una sense capturar tomba l'App sencera. */
  test('CompartirNatiuPlugin: copia i llegixText capturen RuntimeException, i processa va dins d’un try al fil del copiador', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    for (const signatura of [COPIA, 'private String llegixText(Uri uri)']) {
      const cos = cosDelMetode(codi, signatura);
      expect(cos, signatura).not.toBe('');
      expect(cos, signatura).toMatch(/\bcatch \((?:[\w.]+ \| )*RuntimeException(?: \| [\w.]+)* \w+\)/);
    }
    const nouIntent = cosDelMetode(codi, 'protected void handleOnNewIntent(Intent intent)');
    expect(nouIntent).toMatch(/copiador\.execute\(\(\) -> \{\s*try \{\s*processa\(uris, text, assumpte, tipus, rebutMs, sessioAlRebre\);\s*\} catch \(RuntimeException \w+\) \{/);
    // Cap altra crida a processa fora d'eixe try.
    expect(codi.match(/(?<!void )\bprocessa\(/g)).toHaveLength(1);
  });

  /* 261026 (prompt 261026_1615, revisió) · Un text amb estil (enllaços,
     negretes) és un CharSequence: getStringExtra el torna null i es perd. I els
     mapes d'oients de Plugin no estan sincronitzats: l'avís va al fil dels
     connectors, el mateix d'addListener. */
  test('CompartirNatiuPlugin: EXTRA_TEXT i EXTRA_SUBJECT amb getCharSequenceExtra; notifyListeners per getBridge().execute', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const nouIntent = cosDelMetode(codi, 'protected void handleOnNewIntent(Intent intent)');
    expect(nouIntent).toMatch(/\bgetCharSequenceExtra\(Intent\.EXTRA_TEXT\)/);
    expect(nouIntent).toMatch(/\bgetCharSequenceExtra\(Intent\.EXTRA_SUBJECT\)/);
    expect(codi).not.toMatch(/\bgetStringExtra\(Intent\.EXTRA_(?:TEXT|SUBJECT)\)/);
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa).toMatch(/getBridge\(\)\.execute\(\(\) -> notifyListeners\(ESDEVENIMENT, dades, true\)\);/);
  });

  test('CompartirNatiuPlugin: llista blanca jpeg, png, webp i gif; 10 fitxers i 20 MB, com l’adaptador de JS', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const extensio = cosDelMetode(codi, 'private static String extensioImatge(String mime)');
    expect([...extensio.matchAll(/case "([^"]+)":/g)].map((m) => m[1]).sort())
      .toEqual(['image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    expect(extensio).toMatch(/default:\s*return null;/);
    /* L'àlies image/jpg ix com a image/jpeg: el JS només coneix els quatre. */
    expect(codi).toContain('"image/jpg".equals(mime) ? "image/jpeg" : mime');

    const maxFitxers = Number(/private static final int MAX_FITXERS = (\d+);/.exec(codi)?.[1]);
    expect(maxFitxers).toBe(10);
    expect(maxFitxers).toBe(MAX_FITXERS_COMPARTITS);
    /* Gauntlet 261026_1615 · El sostre de fitxers ara va amb els d'URIs i de temps (vegeu més avall). */
    expect(cosDelMetode(codi, 'private void processa(')).toMatch(/if \([^)]*\bacceptats >= MAX_FITXERS\b/);

    const megues = (font, patro) => Number(patro.exec(font)?.[1]);
    const javaMb = megues(codi, /private static final long MAX_BYTES_FITXER = (\d+)L \* 1024 \* 1024;/);
    const jsMb = megues(llig(ARREL, 'src', 'natiu', 'compartirNatiu.js'), /const MAX_BYTES = (\d+) \* 1024 \* 1024;/);
    expect(javaMb, 'MAX_BYTES_FITXER (Java), en MB').toBe(20);
    expect(jsMb, 'MAX_BYTES (compartirNatiu.js), en MB').toBe(20);
    // Pla 261028_1526 (P1-33) · El sostre de cada fitxer passa per min(MAX_BYTES_FITXER, restant): vegeu més avall.
    expect(cosDelMetode(codi, COPIA)).toMatch(/\blong (\w+) = Math\.min\(MAX_BYTES_FITXER, restant\);[\s\S]*if \(total > \1\) throw new IOException/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-04 / Gemini G1615-03) · Sense handleOnDestroy,
     els fils del connector sobreviuen a l'activitat (i a la lectura encallada que
     la reté). Han de ser camps de la instància: un executor estàtic tancat en
     destruir-se una activitat ja no serviria la següent. */
  test('CompartirNatiuPlugin: handleOnDestroy tanca el copiador i el vigilant amb shutdownNow; executors propis de la instància i fils dimonis', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(codi).toMatch(/@Override\s+protected void handleOnDestroy\(\)\s*\{/);
    const destrueix = cosDelMetode(codi, 'protected void handleOnDestroy()');
    expect(destrueix).toMatch(/\bsuper\.handleOnDestroy\(\);/);
    for (const executor of ['copiador', 'vigilant']) {
      expect(destrueix, executor).toMatch(new RegExp(`\\b${executor}\\.shutdownNow\\(\\);`));
    }
    expect(codi).toMatch(/private final ExecutorService copiador = new ThreadPoolExecutor\(/);
    expect(codi).toMatch(/private final ScheduledExecutorService vigilant = Executors\.newSingleThreadScheduledExecutor\(CompartirNatiuPlugin::filDeFons\);/);
    expect(codi).not.toMatch(/\bstatic\s+(?:final\s+)?(?:Scheduled)?ExecutorService\b/);
    expect(cosDelMetode(codi, 'private static Thread filDeFons(Runnable tasca)')).toMatch(/\.setDaemon\(true\);/);
  });

  /* Gauntlet 261026_1615 (Gemini G1615-03) · Android resol les autoritats sense
     distingir majúscules: «ORG.SOCDEPOBLE.APP.fileprovider» també és el nostre. I
     amb Locale.ROOT: amb el turc, «I».toLowerCase() no fa «i». */
  test('CompartirNatiuPlugin: esUriAcceptable passa a minúscules amb Locale.ROOT l’autoritat (ja sense «@») i el nom del paquet, abans de comparar', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const accepta = cosDelMetode(codi, 'private boolean esUriAcceptable(Uri uri)');
    const autoritat = accepta.search(/\bautoritat = autoritat\.substring\(autoritat\.lastIndexOf\('@'\) \+ 1\)\.toLowerCase\(Locale\.ROOT\);/);
    const propi = accepta.search(/\bString propi = getContext\(\)\.getPackageName\(\)\.toLowerCase\(Locale\.ROOT\);/);
    const compara = accepta.indexOf('return !autoritat.equals(propi) && !autoritat.startsWith(propi + ".");');
    expect(autoritat, 'l’autoritat, sense «@» i en minúscules').toBeGreaterThanOrEqual(0);
    expect(propi, 'el paquet propi, en minúscules').toBeGreaterThanOrEqual(0);
    expect(compara).toBeGreaterThan(Math.max(autoritat, propi));
    // Res no torna a escriure l'autoritat entre la normalització i la comparació.
    expect(accepta.slice(autoritat + 1, compara)).not.toMatch(/\bautoritat\s*=(?!=)/);
    // Cap canvi de caixa sense Locale en tot el connector.
    expect(codi).not.toMatch(/\.to(?:Lower|Upper)Case\(\s*\)/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-04) · Un intent amb milers d'URIs, o un
     proveïdor lent, no pot allargar sense fi una compartició: 32 URIs examinades
     com a molt, 60 s per compartició i 20 s per lectura. */
  test('CompartirNatiuPlugin: MAX_URIS_EXAMINADES 32, MAX_COMPARTICIONS_ALHORA 3, LECTURA_MS 20 s i COMPARTICIO_MS 60 s, usats a processa, al copiador i a ambTermini', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(constantJava(codi, 'MAX_URIS_EXAMINADES')).toEqual({ tipus: 'int', valor: 32 });
    expect(constantJava(codi, 'MAX_COMPARTICIONS_ALHORA')).toEqual({ tipus: 'int', valor: 3 });
    expect(constantJava(codi, 'LECTURA_MS')).toEqual({ tipus: 'long', valor: 20_000 });
    expect(constantJava(codi, 'COMPARTICIO_MS')).toEqual({ tipus: 'long', valor: 60_000 });

    const processa = cosDelMetode(codi, 'private void processa(');
    const finestra = /\blong (\w+) = System\.currentTimeMillis\(\) \+ COMPARTICIO_MS;/.exec(processa);
    expect(finestra, 'la finestra de la compartició').toBeTruthy();
    const capBucle = processa.indexOf('for (Uri uri : uris) {');
    expect(capBucle).toBeGreaterThan(finestra.index);
    const bucle = cosDelMetode(processa.slice(capBucle), 'for (Uri uri : uris)');
    /* El primer que fa el bucle: plegar si el connector ja és destruït (pla
       261028_1526, P1-33) o si la sessió ha canviat (P1-31); després, els
       sostres, i qui en passa es compta com a rebutjat. */
    const tancat = /^\s*if \(copiador\.isShutdown\(\)\) return;/.exec(bucle);
    expect(tancat, 'el connector tancat, al principi del bucle').toBeTruthy();
    const tallada = new RegExp(`^\\s*${TALLADA.source}`).exec(bucle.slice(tancat[0].length));
    expect(tallada, 'la sessió tallada, just després').toBeTruthy();
    const despres = bucle.slice(tancat[0].length + tallada[0].length);
    const sostre = /^\s*if \(([^{]*)\) \{\s*rebutjats\+\+;\s*continue;\s*\}/.exec(despres);
    expect(sostre, 'els sostres, al principi del bucle').toBeTruthy();
    expect(sostre[1].split('||').map((condicio) => condicio.trim()).sort()).toEqual([
      'System.currentTimeMillis() > ' + finestra[1],
      'acceptats >= MAX_FITXERS',
      'bytesCopiats >= MAX_BYTES_COMPARTICIO',
      'examinades >= MAX_URIS_EXAMINADES'
    ].sort());
    // Cada URI que passa els sostres compta com a examinada, abans de mirar-la.
    expect(despres.match(/\bexaminades\+\+;/g)).toHaveLength(1);
    expect(despres.indexOf('examinades++;')).toBeGreaterThan(sostre[0].length - 1);
    expect(despres.indexOf('examinades++;')).toBeLessThan(despres.indexOf('esUriAcceptable(uri)'));

    expect(argumentsDe(codi, 'copiador = new ThreadPoolExecutor(')?.[1]).toBe('MAX_COMPARTICIONS_ALHORA');

    const termini = cosDelMetode(codi, 'private ScheduledFuture<?> ambTermini()');
    const fil = /\bThread (\w+) = Thread\.currentThread\(\);/.exec(termini)?.[1];
    expect(fil, 'el fil que llig').toBeTruthy();
    expect(termini).toContain(`vigilant.schedule(${fil}::interrupt, LECTURA_MS, TimeUnit.MILLISECONDS)`);
    // Cada constant només es declara i s'usa on toca.
    for (const [nom, usos] of [['MAX_URIS_EXAMINADES', 1], ['MAX_COMPARTICIONS_ALHORA', 1], ['LECTURA_MS', 1], ['COMPARTICIO_MS', 1]]) {
      expect(codi.match(new RegExp(`\\b${nom}\\b`, 'g')), nom).toHaveLength(usos + 1);
    }
  });

  /* Gauntlet 261026_1615 (Codex C1615-04 / Gemini G1615-03) · Un sol fil per a
     totes les comparticions vol dir que un proveïdor encallat les para totes.
     Ara cada compartició té el seu fil, com a molt tres, i la quarta es rebutja
     (SynchronousQueue, AbortPolicy) en lloc d'esperar en una cua sense fons. Un
     rebuig no capturat al fil principal tombaria l'App. */
  test('CompartirNatiuPlugin: el copiador és un ThreadPoolExecutor fitat amb SynchronousQueue, i cada encàrrec captura RejectedExecutionException', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const args = argumentsDe(codi, 'copiador = new ThreadPoolExecutor(');
    expect(args, 'el copiador').toBeTruthy();
    // Sis arguments: cap RejectedExecutionHandler, és a dir AbortPolicy (llança).
    expect(args).toHaveLength(6);
    const [nucli, maxim, , unitat, cua, fabrica] = args;
    expect(maxim).toBe('MAX_COMPARTICIONS_ALHORA');
    expect(Number(nucli)).toBeGreaterThanOrEqual(0);
    expect(Number(nucli)).toBeLessThanOrEqual(constantJava(codi, 'MAX_COMPARTICIONS_ALHORA').valor);
    expect(unitat).toMatch(/^TimeUnit\.\w+$/);
    expect(cua).toMatch(/^new SynchronousQueue<\w*>\(\)$/);
    expect(fabrica).toBe('CompartirNatiuPlugin::filDeFons');
    expect(codi).not.toMatch(/\bnewSingleThreadExecutor\(|\bnewFixedThreadPool\(|\bnewCachedThreadPool\(|\b(?:LinkedBlocking|ArrayBlocking|PriorityBlocking)(?:Queue|Deque)\b/);
    expect(codi).not.toMatch(/\b(?:CallerRuns|Discard|DiscardOldest)Policy\b/);

    const encarrecs = [...codi.matchAll(/\b(copiador|vigilant)\.(?:execute|submit|schedule\w*|invokeA(?:ll|ny))\(/g)];
    expect(encarrecs.map(([crida]) => crida)).toEqual(expect.arrayContaining(['copiador.execute(', 'vigilant.schedule(']));
    const trys = blocsTry(codi);
    for (const encarrec of encarrecs) {
      const protegit = trys.some((bloc) => bloc.obri < encarrec.index && encarrec.index < bloc.fi
        && bloc.clausules.some((clausula) => clausula.tipus === 'catch' && /\bRejectedExecutionException\b/.test(clausula.excepcions)));
      expect(protegit, `${encarrec[0]} sense catch (RejectedExecutionException)`).toBe(true);
    }
    /* Sense vigilant (connector ja tancat), ambTermini torna null, mai una excepció;
       i qui llig, amb null, ja no llig (pla 261028_1526, P1-33: vegeu més avall). */
    expect(cosDelMetode(codi, 'private ScheduledFuture<?> ambTermini()')).toMatch(/catch \(RejectedExecutionException \w+\) \{\s*return null;\s*\}/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-04) · Un proveïdor pot tornar un tub que no
     acaba mai. La lectura passa pel canal del descriptor (interrompible), i el
     vigilant interromp el fil passat LECTURA_MS. El termini es cancel·la al
     finally, i la interrupció pendent s'esborra: no ha de passar a la lectura següent.
     Pla 261028_1526 (P1-33) · Sense termini (el vigilant ja és tancat) no
     s'obri cap flux: entre el termini i el try, només `if (termini == null) return null;`. */
  test('CompartirNatiuPlugin: copia i llegixText llegixen per interrompible(...) amb el termini programat abans i cancel·lat al finally', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    for (const signatura of [COPIA, 'private String llegixText(Uri uri)']) {
      const cos = cosDelMetode(codi, signatura);
      const termini = /\bScheduledFuture<\?> (\w+) = ambTermini\(\);/.exec(cos);
      expect(termini, `${signatura}: el termini`).toBeTruthy();
      const lectures = blocsTry(cos).filter((bloc) => /\bopenInputStream\(/.test(bloc.recursos));
      expect(lectures, `${signatura}: un sol try amb el flux`).toHaveLength(1);
      const [lectura] = lectures;
      expect(lectura.recursos, signatura).toMatch(/^InputStream (\w+) = interrompible\(getContext\(\)\.getContentResolver\(\)\.openInputStream\(uri\)\)/);
      // Programat abans d'obrir el flux (openInputStream ja hi queda dins).
      expect(termini.index, signatura).toBeLessThan(lectura.inici);
      expect(cos.slice(termini.index + termini[0].length, lectura.inici).trim(), signatura).toBe(`if (${termini[1]} == null) return null;`);
      const finals = lectura.clausules.filter((clausula) => clausula.tipus === 'finally');
      expect(finals, `${signatura}: el finally`).toHaveLength(1);
      expect(finals[0].cos.trim(), signatura).toBe(`senseTermini(${termini[1]});`);
      // La lectura interrompuda arriba com a IOException (ClosedByInterruptException).
      expect(lectura.clausules.some((clausula) => clausula.tipus === 'catch' && /\bIOException\b/.test(clausula.excepcions)), signatura).toBe(true);
    }
    // Cap flux obert fora d'interrompible(...).
    const oberts = codi.match(/\bopenInputStream\(/g) ?? [];
    expect(oberts.length).toBeGreaterThanOrEqual(2);
    expect(codi.match(/\binterrompible\(getContext\(\)\.getContentResolver\(\)\.openInputStream\(/g)).toHaveLength(oberts.length);
    expect(cosDelMetode(codi, 'private static InputStream interrompible(InputStream entrada)').trim())
      .toBe('return entrada instanceof FileInputStream ? Channels.newInputStream(((FileInputStream) entrada).getChannel()) : entrada;');
    const senseTermini = cosDelMetode(codi, 'private static void senseTermini(ScheduledFuture<?> termini)');
    const cancela = senseTermini.indexOf('if (termini != null) termini.cancel(false);');
    expect(cancela).toBeGreaterThanOrEqual(0);
    expect(senseTermini.indexOf('Thread.interrupted();')).toBeGreaterThan(cancela);
  });

  /* Pla 261028_1526 (Bloc D, P1-33) · Deu fitxers de 20 MB eren 200 MB per
     compartició, i tres alhora, 600 MB a la memòria cau, per a un xat que en
     puja 20. Ara hi ha un sostre per compartició (60 MiB, decisió pendent del
     Mestre): copia rep el que en queda i talla a min(MAX_BYTES_FITXER, restant). */
  test('CompartirNatiuPlugin: MAX_BYTES_COMPARTICIO (long, 60 MiB) fita processa i passa a copia el que en queda', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const sostreTotal = constantJava(codi, 'MAX_BYTES_COMPARTICIO');
    expect(sostreTotal).toEqual({ tipus: 'long', valor: 60 * 1024 * 1024 });
    expect(sostreTotal.valor).toBeGreaterThanOrEqual(constantJava(codi, 'MAX_BYTES_FITXER').valor);
    // Declarada, al sostre del bucle i al pressupost que rep copia: res més.
    expect(codi.match(/\bMAX_BYTES_COMPARTICIO\b/g)).toHaveLength(3);

    const processa = cosDelMetode(codi, 'private void processa(');
    const compte = /\blong (\w+) = 0;/.exec(processa)?.[1];
    expect(compte, 'el compte de bytes copiats').toBe('bytesCopiats');
    expect(processa).toMatch(/if \([^{]*\bbytesCopiats >= MAX_BYTES_COMPARTICIO\b[^{]*\) \{\s*rebutjats\+\+;\s*continue;\s*\}/);
    const crida = argumentsDe(processa, 'copia(');
    expect(crida).toEqual(['uri', 'mime', 'extensio', 'MAX_BYTES_COMPARTICIO - bytesCopiats', 'sessioAlRebre']);
    // Només el que s'ha acceptat suma, després de comprovar-lo.
    const accepta = processa.search(/\bfitxers\.put\(fitxer\);\s*acceptats\+\+;\s*bytesCopiats \+= fitxer\.optLong\("mida"\);/);
    expect(accepta, 'la suma, després d’acceptar el fitxer').toBeGreaterThan(processa.indexOf('if (fitxer == null)'));
    expect(processa.match(/\bbytesCopiats \+=/g)).toHaveLength(1);

    const copia = cosDelMetode(codi, COPIA);
    expect(copia, COPIA).not.toBe('');
    const sostre = /\blong (\w+) = Math\.min\(MAX_BYTES_FITXER, restant\);/.exec(copia);
    expect(sostre, 'el sostre del fitxer').toBeTruthy();
    expect(copia).toMatch(new RegExp(`if \\(total > ${sostre[1]}\\) throw new IOException\\("massa gran"\\);`));
    // Ningú no compara amb MAX_BYTES_FITXER a soles: sempre passa per min(…, restant).
    expect(codi.match(/\bMAX_BYTES_FITXER\b/g)).toHaveLength(2);
  });

  /* Pla 261028_1526 (Bloc D, P1-33) · handleOnDestroy tanca els executors, però
     el processa que corria continuava: la interrupció la neteja senseTermini, i
     amb el vigilant tancat les lectures següents anaven sense termini, fins a
     avisar un pont destruït. Ara plega a cada volta i abans d'avisar; les
     còpies ja fetes es queden a compartits/ i tornen en arrencar. */
  test('CompartirNatiuPlugin: processa comprova copiador.isShutdown() a cada volta i just abans de notifyListeners', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa.match(/\bif \(copiador\.isShutdown\(\)\) return;/g)).toHaveLength(2);
    const bucle = cosDelMetode(processa.slice(processa.indexOf('for (Uri uri : uris) {')), 'for (Uri uri : uris)');
    expect(bucle).toMatch(/^\s*if \(copiador\.isShutdown\(\)\) return;/);
    const avis = processa.indexOf('getBridge().execute(() -> notifyListeners(ESDEVENIMENT, dades, true));');
    const ultim = processa.lastIndexOf('if (copiador.isShutdown()) return;');
    expect(avis).toBeGreaterThan(ultim);
    expect(ultim).toBeGreaterThan(processa.indexOf(bucle) + bucle.length);
    // Entre la comprovació i l'avís, res que tarde (cap lectura ni còpia).
    expect(processa.slice(ultim, avis)).not.toMatch(/\b(?:copia|llegixText|openInputStream|nomVisible)\(/);
  });

  /* Pla 261028_1526 (Bloc D, P1-31) · Una còpia nativa pot tardar fins a un
     minut: si la persona ix mentrestant, el lot no pot arribar a la sessió
     següent. L'hora de l'intent es pren al fil principal, abans de l'encàrrec,
     i viatja a l'esdeveniment; el web (lliuraCompartit) la compara amb l'últim
     canvi de sessió. Les restes de load() no la porten (llavors no hi ha cap tall). */
  test('CompartirNatiuPlugin: handleOnNewIntent pren rebutMs abans del copiador i processa l’envia com a «rebutMs»; anunciaPendents no', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const nouIntent = cosDelMetode(codi, 'protected void handleOnNewIntent(Intent intent)');
    const hora = nouIntent.search(/\bfinal long rebutMs = System\.currentTimeMillis\(\);/);
    expect(hora, 'l’hora de l’intent').toBeGreaterThanOrEqual(0);
    expect(hora).toBeLessThan(nouIntent.indexOf('copiador.execute('));
    expect(hora).toBeGreaterThan(nouIntent.indexOf('recullUris(intent)'));
    expect(codi).toMatch(/private void processa\(List<Uri> uris, String text, String assumpte, String tipus, long rebutMs, long sessioAlRebre\)/);
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa.match(/\bdades\.put\("rebutMs", rebutMs\);/g)).toHaveLength(1);
    expect(processa.indexOf('dades.put("rebutMs", rebutMs);')).toBeLessThan(processa.indexOf('notifyListeners('));
    expect(cosDelMetode(codi, 'private void anunciaPendents()')).not.toMatch(/rebutMs/);
  });

  /* Pla 261028_1526 (Bloc D, P1-31) · El tall de sessió del web vivia només a
     la memòria del JS: una còpia que el procés deixava a mitges (o que ningú no
     havia enviat) tornava en arrencar sense cap marca, i la prenia qui entrara.
     Ara l'època també és ací, desada (sobreviu al procés): tallaSessio la puja
     i esborra el que no és d'ella, cada còpia la porta al nom, la compartició
     que la veu canviar esborra les seues i plega (també just abans d'avisar), i
     load() la llig abans d'anunciar res. */
  test('CompartirNatiuPlugin: tallaSessio puja i desa l’època, esborra la resta; processa, copia i anunciaPendents la respecten', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(codi).toMatch(/private final AtomicLong sessio = new AtomicLong\(\);/);
    // Només la puja tallaSessio, i només la fixa load().
    expect(codi.match(/\bsessio\.incrementAndGet\(\)/g)).toHaveLength(1);
    expect(codi.match(/\bsessio\.set\(/g)).toHaveLength(1);
    expect(codi).toMatch(/private static final String PREFERENCIES = "CompartirNatiu";/);
    expect(codi).toMatch(/private static final String CLAU_SESSIO = "sessio";/);
    expect(cosDelMetode(codi, 'private SharedPreferences preferencies()').trim())
      .toBe('return getContext().getSharedPreferences(PREFERENCIES, Context.MODE_PRIVATE);');

    expect(codi).toMatch(/@PluginMethod\s+public void tallaSessio\(PluginCall call\)\s*\{/);
    const talla = cosDelMetode(codi, 'public void tallaSessio(PluginCall call)');
    const puja = /\blong (\w+) = sessio\.incrementAndGet\(\);/.exec(talla);
    expect(puja, 'l’època nova').toBeTruthy();
    const nova = puja[1];
    // commit (al disc ara mateix), mai apply: un procés que mor just després no la perd.
    const desa = talla.indexOf(`preferencies().edit().putLong(CLAU_SESSIO, ${nova}).commit();`);
    expect(desa).toBeGreaterThan(puja.index);
    expect(talla).not.toMatch(/\.apply\(\)/);
    const prefix = talla.indexOf(`String prefix = prefixDe(${nova});`);
    expect(prefix).toBeGreaterThan(desa);
    const esborra = talla.search(/if \((\w+)\.isFile\(\) && !\1\.getName\(\)\.startsWith\(prefix\) && \1\.delete\(\)\) esborrats\+\+;/);
    expect(esborra, 'esborra el que no és de l’època nova').toBeGreaterThan(prefix);
    expect(talla.indexOf('carpeta().listFiles()')).toBeGreaterThan(desa);
    expect(talla.indexOf('call.resolve(')).toBeGreaterThan(esborra);
    expect(cosDelMetode(codi, 'private static String prefixDe(long sessio)').trim()).toBe('return sessio + "-";');

    // load(): l'època desada, abans de netejar i d'anunciar res.
    const carrega = cosDelMetode(codi, 'public void load()');
    const desada = carrega.indexOf('sessio.set(preferencies().getLong(CLAU_SESSIO, 0));');
    expect(desada, 'load llig l’època').toBeGreaterThan(carrega.indexOf('super.load();'));
    expect(desada).toBeLessThan(carrega.indexOf('anunciaPendents();'));

    // L'època de l'intent, al fil principal i abans de l'encàrrec, com rebutMs.
    const nouIntent = cosDelMetode(codi, 'protected void handleOnNewIntent(Intent intent)');
    const epoca = nouIntent.search(/\bfinal long sessioAlRebre = sessio\.get\(\);/);
    expect(epoca, 'l’època de l’intent').toBeGreaterThan(nouIntent.indexOf('recullUris(intent)'));
    expect(epoca).toBeLessThan(nouIntent.indexOf('copiador.execute('));

    // processa: a cada volta i just abans d'avisar, després de mirar si el connector és tancat.
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa.match(new RegExp(TALLADA.source, 'g'))).toHaveLength(2);
    const avis = processa.indexOf('getBridge().execute(() -> notifyListeners(ESDEVENIMENT, dades, true));');
    const ultima = processa.search(new RegExp(`${TALLADA.source}(?![\\s\\S]*${TALLADA.source})`));
    expect(ultima).toBeGreaterThan(processa.lastIndexOf('if (copiador.isShutdown()) return;'));
    expect(ultima).toBeLessThan(avis);
    expect(processa.slice(ultima, avis)).not.toMatch(/\b(?:copia|llegixText|openInputStream|nomVisible)\(/);

    // Cada còpia porta l'època al principi del nom.
    expect(cosDelMetode(codi, COPIA)).toMatch(/new File\(carpeta, prefixDe\(sessioAlRebre\) \+ UUID\.randomUUID\(\)\.toString\(\) \+ "\." \+ extensio\)/);
    expect(codi.match(/\bUUID\.randomUUID\(\)/g)).toHaveLength(1);
    // esborra: la ruta de cada fitxer del lot, que copia ha fet dins de compartits/.
    expect(cosDelMetode(codi, 'private static void esborra(JSArray fitxers)'))
      .toMatch(/JSONObject (\w+) = fitxers\.optJSONObject\(i\);[\s\S]*if \(\1 != null\) new File\(\1\.optString\("ruta", ""\)\)\.delete\(\);/);
    // El web el demana pel mateix nom (natiu/compartirNatiu.js).
    expect(llig(ARREL, 'src', 'natiu', 'compartirNatiu.js')).toMatch(/\bdemana\('tallaSessio', \{\}\)/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-04) · Cada URI text/plain podia sumar 10.000
     caràcters al StringBuilder fins al retall final. Ple l'acumulat, la resta de
     fluxos de text ni s'obrin. */
  test('CompartirNatiuPlugin: processa salta els fluxos text/plain quan el text acumulat ja arriba a MAX_CARACTERS_TEXT, abans de llegir-los', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(constantJava(codi, 'MAX_CARACTERS_TEXT')).toEqual({ tipus: 'int', valor: 10000 });
    const processa = cosDelMetode(codi, 'private void processa(');
    expect(processa.match(/\bllegixText\(/g)).toHaveLength(1);
    const text = cosDelMetode(processa, 'if (mime.startsWith("text/plain"))');
    expect(text).toContain('llegixText(uri)');
    const ple = text.search(/\bif \(textDeFitxers\.length\(\) >= MAX_CARACTERS_TEXT\) continue;/);
    expect(ple, 'el sostre del text acumulat').toBeGreaterThanOrEqual(0);
    expect(ple).toBeLessThan(text.indexOf('llegixText(uri)'));
    // I cada flux es llig com a molt fins a quatre bytes per caràcter.
    expect(cosDelMetode(codi, 'private String llegixText(Uri uri)')).toMatch(/\bint (\w+) = MAX_CARACTERS_TEXT \* 4;[\s\S]*bytes\.size\(\) < \1\)/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-03) · La còpia només s'esborra quan el web
     l'allibera. En arrencar, les caducades (una setmana) se'n van i la resta torna
     a «Envia a…», al mateix fil del load: abans que BridgeActivity passe l'intent
     de l'arrencada, de manera que les restes arriben primer. */
  test('CompartirNatiuPlugin: load() crida netejaCaducats i després anunciaPendents, sense cap executor; CADUCITAT_MS és una setmana', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    expect(codi).toMatch(/@Override\s+public void load\(\)\s*\{/);
    const carrega = cosDelMetode(codi, 'public void load()');
    const passos = ['super.load();', 'netejaCaducats();', 'anunciaPendents();'].map((pas) => carrega.indexOf(pas));
    expect(passos.every((pas) => pas >= 0), carrega).toBe(true);
    expect([...passos].sort((a, b) => a - b)).toEqual(passos);
    expect(carrega).not.toMatch(/\b(?:copiador|vigilant)\b|->|::|\bnew Thread\b|\.(?:execute|submit|post|schedule)\(/);
    expect(codi.match(/\banunciaPendents\(\)/g)).toHaveLength(2);
    expect(codi.match(/\bnetejaCaducats\(\)/g)).toHaveLength(2);

    expect(constantJava(codi, 'CADUCITAT_MS')).toEqual({ tipus: 'long', valor: 7 * 24 * 60 * 60 * 1000 });
    const neteja = cosDelMetode(codi, 'private void netejaCaducats()');
    expect(neteja).toContain('carpeta().listFiles()');
    const limit = /\blong (\w+) = System\.currentTimeMillis\(\) - CADUCITAT_MS;/.exec(neteja)?.[1];
    expect(limit).toBeTruthy();
    expect(neteja).toMatch(new RegExp(`if \\((\\w+)\\.isFile\\(\\) && \\1\\.lastModified\\(\\) < ${limit}\\) \\1\\.delete\\(\\);`));
  });

  test('CompartirNatiuPlugin: anunciaPendents envia les restes de compartits/ per getBridge().execute, retingudes, com a molt MAX_FITXERS i només imatges conegudes', () => {
    const codi = senseComentarisJava(llig(JAVA, 'CompartirNatiuPlugin.java'));
    const anuncia = cosDelMetode(codi, 'private void anunciaPendents()');
    expect(anuncia).toContain('carpeta().listFiles()');
    expect(anuncia).toMatch(/getBridge\(\)\.execute\(\(\) -> notifyListeners\(ESDEVENIMENT, dades, true\)\);/);
    expect(anuncia.match(/\bnotifyListeners\(/g)).toHaveLength(1);
    // El que no és un fitxer d'imatge coneguda, o passa del sostre, s'esborra en lloc d'anunciar-se.
    // P1-31 · I la que no porta l'època d'ara al nom (d'una altra sessió, o d'abans de les èpoques).
    expect(anuncia).toMatch(/if \(!(\w+)\.isFile\(\) \|\| mime == null \|\| !nom\.startsWith\(prefix\) \|\| fitxers\.length\(\) >= MAX_FITXERS\) \{\s*\1\.delete\(\);\s*continue;\s*\}/);
    const prefix = anuncia.search(/\bString prefix = prefixDe\(sessio\.get\(\)\);/);
    expect(prefix, 'el prefix de l’època d’ara').toBeGreaterThanOrEqual(0);
    expect(prefix).toBeLessThan(anuncia.indexOf('for (File resta : restes)'));
    expect(anuncia).toMatch(/String mime = mimeDeLExtensio\(extensio\);/);
    const mimes = cosDelMetode(codi, 'private static String mimeDeLExtensio(String extensio)');
    expect([...mimes.matchAll(/return "([^"]+)";/g)].map((m) => m[1]).sort()).toEqual(['image/gif', 'image/jpeg', 'image/png', 'image/webp']);
    expect(mimes).toMatch(/default:\s*return null;/);
  });

  /* Gauntlet 261026_1615 (Codex C1615-05) · L'activitat és exportada: un extra
     Parcelable desconegut fa petar el primer connector que en llig cap (també el
     d'avisos, amb un ACTION_MAIN). L'intent es saneja abans de super.onCreate,
     que és on es carreguen els connectors, i a cada onNewIntent. */
  test('MainActivity: senseExtresIllegibles s’aplica abans de super.onCreate (setIntent) i en un onNewIntent propi', () => {
    const codi = senseComentarisJava(llig(JAVA, 'MainActivity.java'));
    const onCreate = cosDelMetode(codi, 'protected void onCreate(Bundle savedInstanceState)');
    const sanejat = onCreate.indexOf('setIntent(senseExtresIllegibles(getIntent()));');
    expect(sanejat, 'falta setIntent(senseExtresIllegibles(getIntent()))').toBeGreaterThanOrEqual(0);
    expect(onCreate.slice(0, sanejat)).not.toMatch(/getIntent\(\)/);
    expect(sanejat).toBeLessThan(onCreate.indexOf('if (savedInstanceState != null'));
    expect(sanejat).toBeLessThan(onCreate.indexOf('super.onCreate(savedInstanceState);'));

    expect(codi).toMatch(/@Override\s+protected void onNewIntent\(Intent intent\)\s*\{/);
    expect(cosDelMetode(codi, 'protected void onNewIntent(Intent intent)').trim()).toBe('super.onNewIntent(senseExtresIllegibles(intent));');
    expect(codi.match(/\bsuper\.onNewIntent\(/g)).toHaveLength(1);

    // El sanejador desempaqueta una còpia i, si peta, torna l'intent sense cap extra.
    const saneja = cosDelMetode(codi, 'static Intent senseExtresIllegibles(Intent intent)');
    expect(saneja).toMatch(/^\s*if \(intent == null\) return null;/);
    const [bloc] = blocsTry(saneja);
    expect(bloc, 'el try del sanejador').toBeTruthy();
    expect(bloc.cos).toMatch(/Bundle (\w+) = intent\.getExtras\(\);\s*if \(\1 != null\) \1\.size\(\);\s*return intent;/);
    const captures = bloc.clausules.filter((clausula) => clausula.tipus === 'catch');
    expect(captures).toHaveLength(1);
    expect(captures[0].excepcions).toMatch(/\bRuntimeException\b/);
    expect(captures[0].cos).toMatch(/Intent (\w+) = new Intent\(intent\);\s*\1\.replaceExtras\(\(Bundle\) null\);\s*return \1;/);
  });

  test('styles.xml: barres negres i icones blanques al tema de l’App i al de l’arrencada', () => {
    const tots = estils(llig(MAIN, 'res', 'values', 'styles.xml'));
    expect(tots['AppTheme.NoActionBar']).toMatchObject({
      'android:windowLightStatusBar': 'false',
      'android:statusBarColor': '#000000',
      'android:windowLightNavigationBar': 'false',
      'android:navigationBarColor': '#000000'
    });
    expect(tots['AppTheme.NoActionBarLaunch']).toMatchObject({
      'android:windowLightStatusBar': 'false',
      'android:statusBarColor': '#000000'
    });
    /* L'arrencada és de veres el tema que porta .MainActivity. */
    expect(senseComentarisXml(llig(MAIN, 'AndroidManifest.xml'))).toMatch(/android:theme="@style\/AppTheme\.NoActionBarLaunch"/);
  });

  /* 261026 (prompt 261026_1615, revisió) · SystemBars s'apodera dels insets: els
     colors de barra del tema ja no pinten, i on el WebView no arriba (versions
     < 140, els primers fotogrames) es veu windowBackground. Negre: icones
     blanques sobre negre sempre. */
  test('styles.xml: el fons de la finestra de l’App és negre', () => {
    const tots = estils(llig(MAIN, 'res', 'values', 'styles.xml'));
    expect(tots['AppTheme.NoActionBar']['android:windowBackground']).toBe('@android:color/black');
  });

  test('capacitor.config.json: SystemBars demana viewport-fit=cover des del primer fotograma', () => {
    const { plugins } = JSON.parse(llig(ARREL, 'capacitor.config.json'));
    expect(plugins.SystemBars.initialViewportFitValueHint).toBe('cover');
  });

  test('capacitor.config.json: SystemBars fosc, i la icona dels avisos existix amb el verd de la icona de l’App', () => {
    const { plugins } = JSON.parse(llig(ARREL, 'capacitor.config.json'));
    expect(plugins.SystemBars.style).toBe('DARK');
    const { smallIcon, iconColor } = plugins.LocalNotifications;
    expect(smallIcon).toMatch(/^[a-z][a-z0-9_]*$/);
    const icona = path.join(MAIN, 'res', 'drawable', `${smallIcon}.xml`);
    expect(fs.existsSync(icona), `falta res/drawable/${smallIcon}.xml`).toBe(true);
    expect(fs.readFileSync(icona, 'utf8')).toMatch(/<vector\b/);
    /* El mateix verd que el fons de la icona de l'App (sense cap hex al test: design_guard). */
    const verd = /<color name="ic_launcher_background">([^<]+)<\/color>/.exec(llig(MAIN, 'res', 'values', 'ic_launcher_background.xml'))?.[1];
    expect(verd).toBeTruthy();
    expect(iconColor.toLowerCase()).toBe(verd.toLowerCase());
  });

  test('package.json: el paquet d’avisos locals, fixat a la versió exacta', () => {
    const deps = JSON.parse(llig(ARREL, 'package.json')).dependencies || {};
    expect(deps[AVISOS_LOCALS]).toBe('8.3.1');
    expect(deps[AVISOS_LOCALS]).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

test.skipIf(HI_HA_PROJECTE)('sense android/app/src/main en este arbre, les proves del projecte d’Android se salten', () => {
  expect(HI_HA_PROJECTE).toBe(false);
});
