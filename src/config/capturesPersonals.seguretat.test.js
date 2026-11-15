// @vitest-environment node
/* Sanejament R15 (P0, 261109) · Cap captura amb dades personals de tercers no
   es versiona. Les 11 captures de 261106 (taules de Supabase amb noms, usuaris
   i correus, membres de Google Groups, correus en LanguageTool i la llista de
   xats de WhatsApp dels verificadors) van entrar a HEAD amb 6a444026a; ixen de
   l'índex amb `git rm --cached` i es queden al disc del Mestre. Purgar-les de
   l'historial publicat és decisió seua.
     · .gitignore les cobrix (git check-ignore --no-index): les 11 i qualsevol
       captura futura amb eixos noms;
     · cap fitxer d'eixes regles no és alhora a l'índex i al disc: si encara hi
       és, cal `git rm --cached` abans del commit.
   Sense git (còpies congelades sense .git), només es comprova el text de
   .gitignore: les cinc regles personals i, des d'Onada R28, també les dues
   regles de directori de D-R27-4 (01_produccio/ i 90_arxiu_historic/). */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const DIR = '_wiki_de_poble/04_escriptori/01_produccio';
/* Les 11 captures, per l'hora i el tipus: la resta del nom d'alguna porta noms de persones, i
   este fitxer no els torna a publicar. Qualsevol nom amb eixe tipus queda ignorat. */
const CAPTURES_261106 = Object.freeze([
  '261106_1533_captura_supabase', '261106_1941_captura_whatsapp', '261106_2007_captura_google_groups',
  '261106_2015_captura_google_groups', '261106_2016_captura_google_groups', '261106_2021_captura_google_groups',
  '261106_2021_captura_languagetool', '261106_2025_captura_google_groups', '261106_2043_captura_google_groups',
  '261106_2147_captura_supabase', '261106_2221_captura_google_groups',
].map((prefix) => `${DIR}/${prefix}_qualsevol_nom.png`));
const REGLES = Object.freeze([
  '/_wiki_de_poble/**/*captura_supabase*',
  '/_wiki_de_poble/**/*captura_google_groups*',
  '/_wiki_de_poble/**/*captura_languagetool*',
  '/_wiki_de_poble/**/*captura_whatsapp*',
  '/_wiki_de_poble/**/*usuaris_reals*',
]);
/* Onada R28 · D-R27-4 · Les dues regles de directori que, des del 15-11-2026, també ignoren qualsevol fitxer
   nou de la zona humana i de l'arxiu local. Es comproven com a text abans de saber si hi ha git. */
const REGLES_DIRECTORI = Object.freeze([
  '/_wiki_de_poble/04_escriptori/01_produccio/',
  '/_wiki_de_poble/90_arxiu_historic/',
]);
/* Onada R28 · sql-node0-integritat-03 · Un positiu per regla personal FORA dels dos directoris ignorats: dins
   d'ells, la regla de directori ja els ignora i la prova no veuria si una regla personal es perd o es nega. */
const PERSONALS_FORA = Object.freeze([
  ['/_wiki_de_poble/**/*captura_supabase*', '_wiki_de_poble/04_escriptori/261201_0903_captura_supabase_usuaris.png'],
  ['/_wiki_de_poble/**/*captura_google_groups*', '_wiki_de_poble/02_saber/captura_google_groups_membres.jpg'],
  ['/_wiki_de_poble/**/*captura_languagetool*', '_wiki_de_poble/10_actes/captura_languagetool_text.png'],
  ['/_wiki_de_poble/**/*captura_whatsapp*', '_wiki_de_poble/02_saber/captura_whatsapp_grup.jpeg'],
  ['/_wiki_de_poble/**/*usuaris_reals*', '_wiki_de_poble/04_escriptori/llistat_usuaris_reals.png'],
]);
const PERSONAL = /captura_(?:supabase|google_groups|languagetool|whatsapp)|usuaris_reals/;
const ambGit = () => spawnSync('git', ['rev-parse', '--git-dir']).status === 0;
/** Patró de l'última regla que casa el camí (`check-ignore -v -z`, que només va amb --stdin: font, línia,
    patró i camí), o null si cap. */
const reglaQueCasa = (cami) => {
  const r = spawnSync('git', ['check-ignore', '--no-index', '--stdin', '-v', '-z'], { encoding: 'utf8', input: `${cami}\0` });
  return r.status === 0 ? r.stdout.split('\0')[2] : null;
};

describe('Captures amb dades personals de tercers fora del repositori (P0 R15)', () => {
  test('.gitignore porta les cinc regles i cobrix les 11 captures de 261106 i les futures', (context) => {
    const gitignore = readFileSync('.gitignore', 'utf8').split('\n');
    for (const regla of REGLES) expect(gitignore, regla).toContain(regla);
    for (const regla of REGLES_DIRECTORI) expect(gitignore, regla).toContain(regla);
    if (!ambGit()) { context.skip(); return; }
    const futures = [`${DIR}/261201_0900_captura_supabase_auth_users.png`, '_wiki_de_poble/90_arxiu_historic/captura_google_groups_membres.jpg',
      `${DIR}/261201_0901_captura_whatsapp_grup.jpeg`, `${DIR}/261201_0902_captura_languagetool_text.png`, `${DIR}/llistat_usuaris_reals.png`];
    for (const cami of [...CAPTURES_261106, ...futures]) {
      expect(spawnSync('git', ['check-ignore', '--no-index', '-q', cami]).status, cami).toBe(0);
    }
    // Onada R28 · Fora dels dos directoris, cada captura l'ha d'ignorar la seua regla personal i cap altra (ni una negació).
    for (const [regla, cami] of PERSONALS_FORA) expect(reglaQueCasa(cami), cami).toBe(regla);
    /* Control anterior: les cinc regles no s'enduien captures de treball sense dades personals.
       Onada R28 · D-R27-4 (aprovat pel Mestre el 15-11-2026 a les 01:37) · Ara tota la zona humana 01_produccio/
       queda fora de Git: també una captura de treball nova hi és ignorada. Les cinc regles personals es mantenen
       per a la resta de la Wiki: ho proven els positius de PERSONALS_FORA, i el control és que una captura de
       treball fora de 01_produccio/ no s'ignora. */
    expect(spawnSync('git', ['check-ignore', '--no-index', '-q', `${DIR}/261106_1559_captura_pagina_versions_v110_pendent_sincronitzar_v120.png`]).status).toBe(0);
    expect(spawnSync('git', ['check-ignore', '--no-index', '-q', '_wiki_de_poble/04_escriptori/261201_0900_captura_pagina_versions.png']).status).toBe(1);
  });

  test('cap captura personal no és alhora a l’índex i al disc: si hi és, git rm --cached abans del commit', (context) => {
    if (!ambGit()) { context.skip(); return; }
    const versionats = spawnSync('git', ['ls-files', '-z', '--', '_wiki_de_poble']);
    expect(versionats.status).toBe(0);
    const personals = versionats.stdout.toString().split('\0').filter((cami) => cami && PERSONAL.test(cami));
    expect(personals.filter((cami) => existsSync(cami))).toEqual([]);
  });

  /* Sanejament R15b (privadesa, 261109) · WhatsApp-Clon-01 i -02: 63 captures amb xats, contactes,
     telèfons i grups privats de terceres persones ixen de l'índex. Només en queden 11, revisades com a
     aptes o dubtoses (decisió del Mestre); la resta de la carpeta queda ignorada.
     Onada R28 · Des de la regla de directori `/_wiki_de_poble/04_escriptori/01_produccio/` (D-R27-4), les
     negacions `!/…/WhatsApp-Clon-0x/…` del .gitignore ja no tornen a incloure res: Git no reinclou un fitxer
     dins d'un directori exclòs. Les 11 continuen versionades només perquè ja eren a l'índex, i el text de les
     negacions es comprova com a registre de la decisió del Mestre, no perquè tinga efecte. */
  test('WhatsApp-Clon: només les 11 captures revisades són a l’índex i la resta de la carpeta s’ignora', (context) => {
    const gitignore = readFileSync('.gitignore', 'utf8').split('\n');
    const CLON = ['WhatsApp-Clon-01', 'WhatsApp-Clon-02'].map((nom) => `${DIR}/${nom}`);
    for (const carpeta of CLON) expect(gitignore, carpeta).toContain(`/${carpeta}/*`);
    if (!ambGit()) { context.skip(); return; }
    const versionats = spawnSync('git', ['ls-files', '-z', '--', ...CLON]).stdout.toString().split('\0').filter(Boolean);
    expect(versionats).toHaveLength(11);
    for (const cami of versionats) expect(gitignore, cami).toContain(`!/${cami}`);
    for (const carpeta of CLON) {
      expect(spawnSync('git', ['check-ignore', '--no-index', '-q', `${carpeta}/Captura de pantalla 2026-12-01 a las 09.00.00.png`]).status, carpeta).toBe(0);
    }
  });
});
