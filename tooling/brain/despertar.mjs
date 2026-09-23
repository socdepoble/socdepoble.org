#!/usr/bin/env node
/** Despertar · fotografia d'arrencada de sessió.
 *
 *  Dos canals, i la diferència entre ells és tota la reparació de T6/T7:
 *
 *  1. STDOUT (canal fresc). El hook `SessionStart` executa aquest script i
 *     l'eixida entra al context DESPRÉS de generar-se. Ací sí que hi va la
 *     llista real de l'Escriptori: per construcció no pot ser d'ahir.
 *
 *  2. `.agents/ON_ESTIC.md` (canal ranci). `CLAUDE.md` l'`@`-importa, i eixa
 *     importació es resol ABANS que aquest script escriga. Qui llig el fitxer
 *     sempre llig la sessió anterior. Per tant el fitxer ja NO conté cap nom
 *     de fitxer de l'Escriptori: un avís no repara res, i la llista d'ahir
 *     apuntava a documents que hui són a `90_arxiu_historic/`, que AGENTS §5
 *     prohibix llegir en procediments automàtics. El fitxer dona l'ordre de
 *     llistar; el contingut viu al canal fresc.
 *
 *  L'ESTAT es llig per la PRIMERA capçalera `## ESTAT_ACTUAL · …` del fitxer,
 *  que és on els agents escriuen de veres (el fitxer creix pel principi). El
 *  bloc delimitat `<!-- SDP:ESTAT_ACTUAL -->` queda com a reserva.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const ACTES = '_wiki_de_poble/10_actes';
const OMESOS = new Set(['00_bandeja_d_entrada', '01_produccio']);

function runGitCommand(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf-8' }).trim();
  } catch {
    return 'Desconegut';
  }
}

/** Llista viva de l'Escriptori. Només per al canal fresc. */
export function escriptori() {
  const desktopPath = path.join(rootDir, ESCRIPTORI);
  try {
    const files = fs.readdirSync(desktopPath)
      .filter((f) => !OMESOS.has(f.toLowerCase()) && !f.startsWith('.'));
    if (files.length === 0) return { files: [], text: "L'escriptori està net." };
    return { files, text: files.map((f) => `- ${f}`).join('\n') };
  } catch {
    return { files: [], text: "Error llegint l'escriptori." };
  }
}

/**
 * Data `AAMMDD_HHMM` → Date. El segell és hora local de paret (és el que
 * escriuen els agents i el que porten els noms de fitxer), i les `mtime` amb
 * què es compara també ho són: construïm la data en local, mai en UTC, o el
 * desfasament de fus amaga rancieses de fins a dues hores.
 */
function segellATemps(segell) {
  const m = /^(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})$/.exec(segell || '');
  if (!m) return null;
  const [, aa, mm, dd, hh, mi] = m;
  return new Date(2000 + Number(aa), Number(mm) - 1, Number(dd), Number(hh), Number(mi));
}

/**
 * Primera capçalera `## ESTAT_ACTUAL · …` del fitxer (la de dalt, la que
 * s'escriu de veres). Reserva: el bloc delimitat del final.
 */
export function estatActual(content) {
  const capcalera = /^##[ \t]+ESTAT_ACTUAL(.*)\r?\n([\s\S]*?)(?=^##[ \t]|$(?![\s\S]))/m.exec(content);
  if (capcalera) {
    const titol = capcalera[1].trim();
    return {
      origen: 'capcalera',
      titol,
      segell: (/·\s*(\d{6}_\d{4})/.exec(titol) || [])[1] || null,
      text: `## ESTAT_ACTUAL${capcalera[1]}\n${capcalera[2]}`.trim()
    };
  }
  const bloc = /<!-- SDP:ESTAT_ACTUAL -->([\s\S]*?)<!-- \/SDP:ESTAT_ACTUAL -->/.exec(content);
  if (bloc) {
    return { origen: 'bloc', titol: '', segell: null, text: bloc[1].trim() };
  }
  throw new Error('ESTAT no disponible: ni capçalera ESTAT_ACTUAL ni bloc delimitat');
}

/** Fitxer viu més recent de les carpetes de treball, per detectar un ESTAT ranci. */
function darreraActivitat() {
  let max = null;
  for (const dir of [ESCRIPTORI, ACTES]) {
    const full = path.join(rootDir, dir);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      if (name.startsWith('.')) continue;
      const stat = fs.statSync(path.join(full, name));
      if (!stat.isFile()) continue;
      if (!max || stat.mtime > max.mtime) max = { mtime: stat.mtime, name: `${dir}/${name}` };
    }
  }
  return max;
}

function avisRanci(estat, activitat) {
  if (!activitat) return null;
  const quan = segellATemps(estat.segell);
  if (!quan) {
    return `L'ESTAT s'ha llegit del ${estat.origen === 'bloc' ? 'bloc delimitat de reserva' : 'capçalera sense segell horari'}: no es pot datar. El fitxer viu més recent és \`${activitat.name}\`.`;
  }
  const retard = activitat.mtime.getTime() - quan.getTime();
  if (retard <= 0) return null;
  const minuts = Math.round(retard / 6e4);
  const quant = minuts < 120 ? `${minuts} min` : `${Math.round(minuts / 60)} h`;
  return `ESTAT RANCI: l'últim relleu és de ${estat.segell} i \`${activitat.name}\` s'ha tocat ${quant} després. Hi ha faena feta que ningú ha anotat a \`.agents/ESTAT.md\`.`;
}

export function fotografia() {
  const branch = runGitCommand('git rev-parse --abbrev-ref HEAD');
  const hash = runGitCommand('git rev-parse --short HEAD');
  const ara = new Date().toISOString();
  const estat = estatActual(fs.readFileSync(path.join(rootDir, '.agents/ESTAT.md'), 'utf-8'));
  const taula = escriptori();
  const avis = avisRanci(estat, darreraActivitat());
  return { branch, hash, ara, estat, taula, avis };
}

/** Canal fresc: entra al context després de generar-se. Ací sí que hi ha noms. */
function textFresc({ branch, hash, ara, estat, taula, avis }) {
  return `# ON_ESTIC · fotografia viva (${ara})

**Branca Git:** ${branch}
**Commit:** ${hash}
${avis ? `\n> [!WARNING]\n> ${avis}\n` : ''}
## 1. Contingut de l'Escriptori (\`${ESCRIPTORI}/\`)

Aquesta llista s'ha llegit del disc fa un instant, en aquesta mateixa arrencada. És la bona.

${taula.text}

## 2. Últim relleu de \`.agents/ESTAT.md\`

${estat.text}

## 3. Ordre d'arrencada

1. Llig els documents de l'Escriptori d'ací dalt que tinguen a vore amb la faena.
2. Contrasta el relleu amb l'última Acta Marmota de \`${ACTES}/\`.
3. Espera les ordres del Mestre.
`;
}

/**
 * Canal ranci: el que `CLAUDE.md` `@`-importa. Sense cap nom de fitxer de
 * l'Escriptori, perquè qui el llig el llig una sessió tard.
 */
function textFitxer({ branch, hash, ara, estat, avis }) {
  return `---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** ${ara}
> Aquest document l'\`@\`-importa \`CLAUDE.md\`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a \`90_arxiu_historic/\`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** ${branch}
**Commit:** ${hash}

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook \`SessionStart\` d'aquesta sessió (canal fresc), o
- \`node tooling/brain/despertar.mjs\` (\`npm run despertar\`), que l'imprimix.

Si no tens cap de les dues, llista \`${ESCRIPTORI}/\` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent
${avis ? `\n> [!WARNING]\n> ${avis}\n` : ''}
Últim relleu anotat a \`.agents/ESTAT.md\` (primera capçalera del fitxer):

${estat.text}

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de \`${ACTES}/\`.
3. Espera les ordres del Mestre.
`;
}

function main() {
  const foto = fotografia();
  fs.writeFileSync(path.join(rootDir, '.agents/ON_ESTIC.md'), textFitxer(foto), 'utf-8');
  process.stdout.write(textFresc(foto));
  if (foto.avis) console.error(`[despertar.mjs] ⚠️ ${foto.avis}`);
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main();
