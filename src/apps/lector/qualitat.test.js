// @vitest-environment node
/* Notícies del Poble · qualitat: les portes del repo sobre TOTS els fitxers
   de l'app (proves incloses) i sobre els dos fitxers de la plataforma que
   este lot toca (registreApps.js i la seua prova).
   · ESLint amb la configuració del projecte i zero missatges.
   · Ordre del Mestre (261003): estil visual 100% Pedra Seca. Cap fitxer CSS a
     l'app, cap style=, cap className que no siga un literal d'una classe
     global que ja existix (src/css), cap h1, cap import de CSS ni :has().
   · Cap AppGridShell a mà: una sola ClosaAplicacio, a AppLector.
   · Bloc 0 del Gauntlet (ordre del Mestre, 261016): les notícies, sobre
     l'espai de treball del Bloc de notes (un sol UniversalWorkspace, a
     vistes/Noticies.jsx, per la façana); cap UniversalCard ni GraellaTargetes
     al seu flux, i cap imatge a les seues files.
   · Cap HTML cru: l'article es pinta des de l'arbre net (Contingut.jsx).
   · Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100).
   · El literal de compilació del manifest i el registre.
   · Dades sintètiques: cap correu, telèfon, DNI/NIE ni IBAN; cap invisible.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const APP = 'src/apps/lector';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.jsx?$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const DE_LAPP = fitxersDe(APP);
const TOCATS = ['src/apps/plataforma/registreApps.js', 'src/apps/plataforma/registreApps.test.js'];
const TOTS = [...DE_LAPP, ...TOCATS];
const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = DE_LAPP.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/* Les úniques classes que l'app escriu: globals de src/css, cap de nova.
   Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · .sdp-centre
   i .lead eren el títol propi del lector (h2 + entradilla), retirat: el detall
   és la Pàgina Universal (PaginaApp). La igualtat de davall continua exacta.
   Bloc 0 del Gauntlet (ordre del Mestre, 261016) · .sdp-boto--secundari se'n
   va amb els enllaços «Ves a Hui» i «Fonts» de la graella de notícies retirada
   (els Link amb pell de botó): ja no la escriu cap fitxer.
   Actualitzada a posta (261024 T5): .sdp-boto--secundari torna amb les quatre portes a la resta del
   poble (el Mur, l'Agenda, el Mercat i els Pobles) de vistes/FontsSenseResposta.jsx, Link amb pell
   de botó secundari quan cap font no respon. La igualtat de davall continua exacta.
   Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, «la targeta de notícia de la
   columna del mig ha de tindre el mateix patró visual que el Bloc de notes»: la fila de
   vistes/FilaNoticia.jsx escriu les classes de la fitxa del Bloc (sections/notes/NotaFitxa.jsx:
   .sdp-gestor-fitxa i els seus elements de media, imatge, text, títol i subtítol); i el vídeo de la
   lectura (vistes/Lector.jsx) va dins de la caixa 16:9 global (.embed-container, modules.css). Totes
   existixen a src/css, cap és nova. La igualtat de davall continua exacta. La variant de la llista
   del Bloc (listClassName, una prop de l'espai i no un className) la comprova «no inventar
   targetes», més avall. */
const CLASSES_GLOBALS = Object.freeze([
  'sdp-boto', 'sdp-boto--primari', 'sdp-boto--secundari', 'sdp-boto--gran', 'sdp-nomes-lector',
  'sdp-gestor-fitxa', 'sdp-gestor-fitxa__media', 'sdp-gestor-fitxa__imatge', 'sdp-gestor-fitxa__text', 'sdp-gestor-fitxa__titol',
  'sdp-gestor-fitxa__subtitol', 'embed-container'
]);

/* Bloc 0 (261016) · Les columnes de les carpetes i de les fonts (261004) s'han retirat, però l'entorn
   de l'executor no pot esborrar fitxers: queden com a làpides sense codi fins que es trauen del
   repositori (git rm). Mentre hi siguen, la porta de davall vigila que no tornen a la vida. */
const LAPIDES = Object.freeze(['vistes/Carpetes.jsx', 'vistes/Fonts.jsx']);

describe('el cens', () => {
  test('hi són el manifest, el nucli, el port, la llavor, el magatzem, les vistes i les proves', () => {
    for (const fitxer of [
      'manifest.js', 'AppLector.jsx', 'rutes.js', 'magatzem.js', 'fontNoticies.js', 'useLector.js', 'useNoticies.js',
      'llavor/cataleg.js', 'llavor/fontLlavor.js', 'nucli/index.js', 'nucli/analitzador.js', 'nucli/html.js', 'nucli/xml.js',
      'vistes/context.js', 'vistes/navegacio.js', 'vistes/icones.js', 'vistes/comunes.jsx',
      'vistes/Noticies.jsx', 'vistes/Lector.jsx', 'vistes/Contingut.jsx', 'vistes/GestioFonts.jsx',
      'nucli/xml.test.js', 'nucli/html.test.js', 'nucli/dates.test.js', 'nucli/analitzador.test.js', 'nucli/estat.test.js',
      'fontNoticies.test.js', 'magatzem.test.js', 'AppLector.test.jsx', 'privacitat.test.jsx', 'frontera.test.js', 'qualitat.test.js',
      /* SN (261003) · Les fonts personals: el nucli, l'API pública, el hook i les proves. */
      'nucli/personals.js', 'fontsPersonals.js', 'useFontsPersonals.js',
      'nucli/personals.test.js', 'fontsPersonals.test.js', 'fontsPersonals.vista.test.jsx',
      /* Bloc 0 (261016) · Les notícies sobre l'espai de treball. */
      'espaiNoticies.test.jsx',
      /* T5 (261024) · Les fonts territorials: l'adaptador remot i el que es veu quan no responen. */
      'fontRemota.js', 'fontRemota.test.js', 'vistes/FontsSenseResposta.jsx',
      /* 261024 (Lector) · Ordre del Mestre de les 15:05: la fila del Bloc, les fonts a l'arbre, els
         mitjans del servei (miniatura i vídeo) i les seues proves. */
      'vistes/FilaNoticia.jsx', 'vistes/fontsDelLector.js', 'mitjans.js', 'lector261024.test.jsx'
    ]) expect(existsSync(path.join(ARREL, APP, fitxer)), fitxer).toBe(true);
  });

  test('Bloc 0 · les làpides de les columnes retirades no tenen codi ni cap fitxer les importa', () => {
    for (const lapida of LAPIDES.filter((f) => existsSync(path.join(ARREL, APP, f)))) {
      expect(senseComentaris(llig(`${APP}/${lapida}`)).trim(), lapida).toBe('');
      const nom = path.basename(lapida);
      const importadors = DE_LAPP.filter((f) => especificadors(llig(f)).some((e) => e.endsWith(`/${nom}`)));
      expect(importadors, lapida).toEqual([]);
    }
  });

  test('cap fitxer CSS a l’app: tot el visual és de Pedra Seca', () => {
    expect(fitxersDe(APP, /\.(?:css|scss|less)$/)).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, APP, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('estil visual 100% Pedra Seca (ordre del Mestre, 261003)', () => {
  test('cap style=, cap h1, cap import de CSS ni :has(); cap h2 literal acabat en punt', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '1[\\s>]'].join('')), 'h1'],
      [/^\s*import\s+[^;]*\.css['"]/m, 'import de CSS'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
    for (const f of JSX) {
      for (const [, text] of llig(f).matchAll(/<h2[^>]*>([^<{]*)<\/h2>/g)) expect(text.trim().endsWith('.'), `${f}: «${text}»`).toBe(false);
    }
  });

  test('cada className és un literal de la llista de classes globals, i totes existixen a src/css', () => {
    const usades = new Set();
    for (const f of JSX) {
      const codi = llig(f);
      expect(/className=\{/.test(codi), `${f}: className amb expressió`).toBe(false);
      for (const [, valor] of codi.matchAll(/className="([^"]*)"/g)) {
        for (const classe of valor.split(/\s+/).filter(Boolean)) {
          expect(CLASSES_GLOBALS, `${f}: .${classe}`).toContain(classe);
          usades.add(classe);
        }
      }
    }
    expect([...usades].sort()).toEqual([...CLASSES_GLOBALS].sort());
    const canoniques = fitxersDe('src/css', /\.css$/).map((f) => senseComentaris(llig(f))).join('\n');
    for (const classe of CLASSES_GLOBALS) expect(new RegExp(`\\.${classe}(?![\\w-])`).test(canoniques), classe).toBe(true);
  });

  test('cap element de llista, graella ni taula escrit a mà: els de l’article ixen de la llista tancada de Contingut.jsx', () => {
    const estructura = new RegExp(['<(?:ul|ol|li|dl|table|tr|td|th)[\\s>]|role=["\']', '(?:list|listitem|grid|gridcell|row|listbox|option)["\']'].join(''));
    for (const f of JSX) expect(llig(f).match(estructura), f).toBeNull();
    for (const sonda of ['<ul>', '<li key="x">', 'role="grid"']) expect(estructura.test(sonda), sonda).toBe(true);
  });

  /* Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Actualitzada a posta: a més de l'única
     ClosaAplicacio (la gestió de fonts), un sol UniversalWorkspace, el de les notícies, per la
     façana de l'espai (la porta 'workspace' del nucli 1.2.0) i amb un sol nom.
     Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, «el Lector ha de ser
     exclusivament un UniversalWorkspace pur i fluid de tres columnes»: la pàgina de fonts (l'única
     ClosaAplicacio) se'n va i cap fitxer de l'app munta cap closca de columnes. */
  test('cap AppGridShell a mà: cap ClosaAplicacio i un sol UniversalWorkspace (les notícies), per la façana', () => {
    const closca = /components\/layout\/AppGridShell/;
    expect(PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => closca.test(e)))).toEqual([]);
    expect(PRODUCCIO.filter((f) => /<ClosaAplicacio\b|\bClosaAplicacio\s*[,}]/.test(senseComentaris(llig(f))))).toEqual([]);
    expect(PRODUCCIO.filter((f) => /<UniversalWorkspace\b/.test(llig(f)))).toEqual([`${APP}/vistes/Noticies.jsx`]);
    const delEspai = PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => e.includes('components/universal/workspace')).map((e) => [f, e]));
    expect(delEspai).toEqual([[`${APP}/vistes/Noticies.jsx`, '../../../components/universal/workspace/index.js']]);
    expect(llig(`${APP}/vistes/Noticies.jsx`)).toContain("import { UniversalWorkspace } from '../../../components/universal/workspace/index.js';");
  });

  /* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes»; D-A) · El detall és la
     Pàgina Universal de les apps (PaginaApp) i el catàleg de fonts va en targetes de l'esquelet.
     Cap peça pròpia de files o rajoles.
     Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Reescrita a posta: «Prohibit crear noves
     targetes inventades o jerarquies caòtiques a /app/lector/noticies». Les notícies ja no són
     UniversalCard dins de GraellaTargetes: són l'espai de treball.
     Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, «la targeta de notícia ha
     de tindre el mateix patró visual elegant, net i matemàtic que el Bloc de notes, sense targetes
     deformades ni jerarquies estranyes», i «adeu a la pàgina inflada de /app/lector/fonts». La fila
     ja no és la per defecte de l'espai: és la del Bloc (renderItem → vistes/FilaNoticia.jsx, una
     sola), sense targeta, boina ni pastilla. La pàgina de fonts se'n va amb les seues targetes
     (ColumnaCataleg forma="targetes", NavTargetes, UniversalCard): cap al Lector. La miniatura de la
     fila no és `image` (ItemMedia la demanaria sense política de referent): és `miniatura`, la del
     servei (privacitat.test.jsx). */
  test('no inventar targetes: l’espai de treball a les notícies amb la fila del Bloc, PaginaApp al detall i cap targeta ni graella', () => {
    const importats = (f) => [...llig(f).matchAll(/import\s*\{([^}]+)\}\s*from/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
    const vetades = /^(?:GraellaArticles|LlistaArticles|Rajola|Avatar|UniversalCard|GraellaTargetes|PillToggle|SeccionsCategoria|DefaultItemCard|useVistaCataleg|ColumnaCataleg|TargetesColleccions)$/;
    expect(PRODUCCIO.flatMap((f) => importats(f).filter((nom) => vetades.test(nom)).map((nom) => `${f}: ${nom}`))).toEqual([]);
    for (const nom of ['UniversalCard', 'GraellaTargetes', 'NavTargetes', 'ColumnaCataleg', 'TargetesColleccions']) {
      expect(PRODUCCIO.filter((f) => new RegExp(`<${nom}\\b`).test(llig(f))), nom).toEqual([]);
    }
    /* El flux de notícies: l'espai, amb una sola fila pròpia, la del Bloc. */
    const delFlux = importats(`${APP}/vistes/Noticies.jsx`);
    const noticies = senseComentaris(llig(`${APP}/vistes/Noticies.jsx`));
    expect(delFlux).toContain('UniversalWorkspace');
    expect(delFlux).toContain('FilaNoticia');
    expect(noticies).not.toMatch(/\bimage\s*:/);
    expect(noticies.match(/\brenderItem=\{/g)).toHaveLength(1);
    expect(noticies).toContain('renderItem={filaDeNoticia}');
    expect(noticies).toContain('listClassName="sdp-bloc-list--notes"');
    expect(fitxersDe('src/css', /\.css$/).some((f) => /\.sdp-bloc-list--notes\s+\.sdp-gestor-fitxa\b/.test(senseComentaris(llig(f))))).toBe(true);
    const fila = senseComentaris(llig(`${APP}/vistes/FilaNoticia.jsx`));
    expect(fila).not.toMatch(/sp-card|sdp-card|<(?:article|header|footer|h[1-6]|p)[\s>]/);
    expect(fila.match(/<img\b/g)).toHaveLength(1);
    expect(fila).toContain('referrerPolicy="no-referrer"');
    /* El detall: la Pàgina Universal, una, i sense xat comú (la notícia és de fora). */
    expect(importats(`${APP}/vistes/Lector.jsx`)).toContain('PaginaApp');
    expect(llig(`${APP}/vistes/Lector.jsx`).match(/<PaginaApp\b/g)).toHaveLength(1);
    expect(llig(`${APP}/vistes/Lector.jsx`)).toContain('objecte={null}');
  });

  /* 261024 (Lector) · El vídeo: un sol iframe, darrere de la façana, amb l'adreça que dona el servei
     (cap literal), sandbox i els permisos i el referent fixats. */
  test('el vídeo: un sol iframe a Lector.jsx, amb l’adreça del servei, sandbox, permisos i referent fixats', () => {
    expect(PRODUCCIO.filter((f) => /<iframe\b/.test(llig(f)))).toEqual([`${APP}/vistes/Lector.jsx`]);
    const lector = llig(`${APP}/vistes/Lector.jsx`);
    expect(lector.match(/<iframe\b/g)).toHaveLength(1);
    expect(lector).toContain('<iframe src={video.incrustacio}');
    expect(lector).toContain("const SANDBOX_VIDEO = 'allow-scripts allow-same-origin allow-presentation';");
    expect(lector).toContain("const PERMISOS_VIDEO = 'encrypted-media; picture-in-picture; fullscreen';");
    expect(lector).toContain('referrerPolicy="strict-origin-when-cross-origin"');
    expect(PRODUCCIO.filter((f) => new RegExp(['you', 'tube-no', 'cookie'].join('')).test(llig(f)))).toEqual([]);
  });

  test('cap HTML cru, tampoc a les proves', () => {
    const cru = new RegExp(['\\binner', 'HTML\\b|\\bouter', 'HTML\\b|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join(''));
    for (const f of DE_LAPP) expect(cru.test(llig(f)), f).toBe(false);
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('cap API més nova ni lookbehind al codi de producció', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of PRODUCCIO) expect(vetat.test(llig(f)), f).toBe(false);
  });
});

describe('el manifest i el registre', () => {
  test('la càrrega va darrere del literal de compilació EXACTE, amb una sola importació dinàmica', () => {
    const manifest = llig(`${APP}/manifest.js`);
    expect(manifest).toContain("import.meta.env.DEV || import.meta.env.VITE_SDP_APP_LECTOR === '1' ? () => import('./AppLector.jsx') : null");
    expect(manifest.split('import(').length - 1).toBe(1);
  });

  /* Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0, «Purga de Mocks») · Actualitzada a
     posta: abans el literal era «DEV || VITE_SDP_LECTOR_LLAVOR», i el servidor de desenvolupament
     ensenyava les notícies inventades. Ara només el literal explícit, i cap DEV al codi de l'app
     (els comentaris en poden parlar). */
  test('la llavor sintètica va darrere del seu literal EXACTE, sense DEV, i només AppLector la crea (Model B)', () => {
    const app = llig(`${APP}/AppLector.jsx`);
    expect(app).toContain("const LLAVOR_ACTIVA = import.meta.env.VITE_SDP_LECTOR_LLAVOR === '1';");
    expect(senseComentaris(app)).not.toMatch(/import\.meta\.env\.DEV\b/);
    expect(app).toContain('(LLAVOR_ACTIVA ? creaFontNoticies(creaAdaptadorLlavor({ ara: rellotge() })) : null)');
    const creen = PRODUCCIO.filter((f) => /(?<!function )creaAdaptadorLlavor\(/.test(senseComentaris(llig(f))));
    expect(creen).toEqual([`${APP}/AppLector.jsx`]);
  });

  /* Ordre del Mestre, 261004 · La Gestoria entra a la plataforma darrere del
     Lector: el Lector continua just darrere de la Nevera. */
  test('registreApps.js la registra com a app interna, darrere de la Nevera', () => {
    const registre = llig('src/apps/plataforma/registreApps.js');
    expect(registre).toContain("import manifestLector from '../lector/manifest.js';");
    expect(registre).toMatch(/MANIFESTS_INTERNS = Object\.freeze\(\[[^\]]*manifestNevera, manifestLector[\],]/);
  });
});

describe('dades sintètiques', () => {
  const ambLlavor = [...TOTS, ...fitxersDe(`${APP}/llavor`, /\.xml$/)];

  test('cap correu, telèfon, DNI/NIE ni IBAN (codi, proves i llavor)', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = ambLlavor.filter((f) => !f.endsWith('registreApps.js') && !f.endsWith('registreApps.test.js'))
      .flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00AD, 0x00AD], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF], [0xFFFE, 0xFFFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...ambLlavor, ...fitxersDe(`${APP}/nucli/__fixtures__`, /\.xml$/)]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
