#!/usr/bin/env node
/**
 * Sentinella JARVIS R32: diagnòstic de disc de només lectura, neteja bloquejada i contracte del servei de salut de l’emmagatzematge.
 *
 * Sentinella JARVIS R32 · diagnòstic i fronteres de purga
 *
 * El diagnòstic de disc del motor és portable. L'inventari POSIX llig exclusivament `.npm/_cacache`, `.cache/puppeteer` i `.cache/uv`, amb `dir_fd`, `O_NOFOLLOW`, límits de profunditat/entrades/temps i refús de symlinks, hardlinks, noms no portables i dades sagrades recognoscibles. Windows retorna el diagnòstic de disc i un avís d'inventari no disponible. No s'instal·la ni es programa cap tasca.
 *
 * **La neteja del sistema operatiu queda bloquejada amb `NETEJA_ATOMICA_NO_DISPONIBLE`.** L'àrbitre ha demostrat que un escriptor amb el mateix UID pot moure un subdirectori després d'obrir-ne el descriptor i abans de la recursió: `O_NOFOLLOW` evita seguir un symlink, però no impedix esborrar el subarbre després que haja eixit de la llista blanca. Tant `--neteja-segura` com `run({neteja: True})` i el helper Python `purge()` bloquegen qualsevol supressió. No es promet un compare-and-unlink atòmic que POSIX no aporta ací.
 *
 * ```sh
 * node tooling/gates/sentinella-jarvis-espai.mjs --json
 * node tooling/gates/sentinella-jarvis-espai.mjs --neteja-segura --json
 * ```
 *
 * La segona ordre lliura el pla mesurat i la raó del bloqueig amb zero bytes eliminats. Cap prova s'ha executat sobre les memòries reals del Mestre.
 *
 * El motor i el helper POSIX viuen junts a `tooling/gates/` per la decisió D-R32.3-SENTINELLA (17-11-2026), i esta capçalera és el seu document; a R32.2 tenien una carpeta pròpia a l'arrel de `tooling/`. El motor localitza el helper pel seu propi directori, així que el comportament no depén de la ubicació.
 *
 * ## Contracte del servei del navegador
 *
 * `src/data/salutEmmagatzematgeDispositiu.js` és independent d'UI i backend. Exporta `creaServeiSalutEmmagatzematgeDispositiu`, `lligSalutEmmagatzematgeDispositiu`, `purgaMemoriaCauRegenerable`, `historialNetegesLocals` i `BLOQUEIG_PURGA_MEMORIA_CAU`.
 *
 * - Lectura: retorna `usage`, `quota`, `persistent`, `categories` i `avisos`. Valors no mesurables són `null`.
 * - Categories sagrades (E2EE, esborranys, backups i notes locals) sempre són intocables; el servei no obri els seus magatzems.
 * - Purga: només considera dues caches retirades exactes (`sdp-pwa-recursos-v0`, `sdp-pwa-closca-v0`) i entrades públiques d'assets amb nom hash. Mai elimina una cache sencera.
 * - **No hi ha cap productor confirmat connectat en esta entrega. Per defecte, `purgaMemoriaCauRegenerable()` torna `estat: 'bloquejat'`, `CAP_PRODUCTOR_REGENERABLE_CONFIRMAT` i zero supressions.** La UI ha d'explicar eixe estat i no prometre neteja activa.
 * - Només un productor de recursos públics regenerables pot subministrar un `manifestRegenerable` a la factoria. No es pot fabricar el manifest a partir del contingut actual de CacheStorage: això convertiria una dada desconeguda en «confirmada» sense prova.
 *
 * Esquema de manifest (contracte de productor futur, ara només provat amb fixtures):
 *
 * ```js
 * {
 *   esquema: 'sdp.cache-regenerable.v1',
 *   bloqueig: BLOQUEIG_PURGA_MEMORIA_CAU,
 *   recursos: [
 *     { url: 'https://socdepoble.org/assets/entrada-abcdefgh.js',
 *       bytes: 1234,
 *       sha256: '64 dígits hexadecimals minúsculs del cos públic verificat' }
 *   ]
 * }
 * ```
 *
 * Cada productor de les caches retirades ha d'adquirir el mateix Web Lock exclusiu per a **totes** les escriptures i retirades. Cache API no oferix un CAS atòmic entre `match()` i `delete()` davant d'un escriptor que ignore eixe bloqueig. La confiança en el productor i el protocol de bloqueig és una precondició d'esta API, i no s'acredita cap productor real per passar un objecte de prova.
 *
 * La factoria valida origen/ruta/mida/hash/duplicats i copia les entrades per evitar canvis del manifest en curs. Cada resposta requerix MIME JS/CSS/WOFF2 coherent, `200`, absència d'auth/cookies/`private`/`no-store`, bytes i SHA-256 exactes. Es revalida el cos immediatament abans d'eliminar. Un canvi de la mateixa mida queda rebutjat pel hash. Una sola entrada desconeguda bloqueja tota la cache.
 *
 * Els rebuts desen `bytesEliminats` dels cossos realment suprimits i `bytesAlliberats: null`: no s'inventa espai físic, temps guanyat ni categories privades. `historialDesat` i `historialPersistent` expliquen si el rebut ha pogut persistir. Quota o errors posteriors a una supressió conserven el recompte parcial. Abort abans de mutar rebutja; abort després de començar preserva el rebut parcial. La cancel·lació d'un flux no espera indefinidament un productor que no resol `cancel()`.
 *
 * Proves: `tests/sentinella-jarvis-r32.test.mjs` i `src/data/salutEmmagatzematgeDispositiu.test.js`. L'evidència d'abans/després de les dues contraproves és al kit R32, `evidencies/261116_t4_*`.
 *
 * Este bloc és el document de la sentinella fusionat com a capçalera: a R32.2 era un README amb frontmatter (type: document, status: canonic).
 */
/** JARVIS 2: només lectura per defecte. Diagnòstic POSIX amb descriptors i O_NOFOLLOW.
 * Neteja bloquejada: falta exclusió atòmica d’escriptors amb el mateix UID.
 * Windows: diagnòstic de disc, neteja bloquejada fins adaptador natiu segur.
 * No toca mai snapshots, clons, repositoris, DerivedData, Gradle ni documents.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

export function validaComponentPortable(value) {
  if (typeof value !== 'string' || !value || value === '.' || value === '..'
    || /[\\/<>:"|?*\p{Cc}]/u.test(value) || /[ .]$/.test(value)
    || /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu.test(value)) throw new TypeError('COMPONENT_NO_PORTABLE');
  return value;
}
export function diagnosticar({ home = os.homedir(), plataforma = process.platform, neteja = false } = {}) {
  let disc = { totalBytes: null, lliureBytes: null }; const avisos = [];
  try {
    // statfs és natiu de Node: no depén de df ni de l'idioma de Windows.
    const s = fs.statfsSync(home, { bigint: true });
    const total = s.blocks * s.bsize; const lliure = s.bavail * s.bsize;
    if (total <= BigInt(Number.MAX_SAFE_INTEGER) && lliure <= BigInt(Number.MAX_SAFE_INTEGER))
      disc = { totalBytes: Number(total), lliureBytes: Number(lliure) };
    else avisos.push('DISC_FORA_DE_RANG_SEGUR');
  } catch (error) { avisos.push(`DISC_NO_MESURAT:${error.code ?? error.name}`); }
  if (neteja) avisos.push('NETEJA_ATOMICA_NO_DISPONIBLE');
  let bosses = [];
  if (!['darwin', 'linux'].includes(plataforma)) avisos.push('NETEJA_NO_DISPONIBLE_EN_AQUESTA_PLATAFORMA');
  else {
    try {
      const raw = execFileSync('python3', [path.join(HERE, 'sentinella-posix.py')], {
        input: JSON.stringify({ home, neteja }), encoding: 'utf8', timeout: 55000,
        maxBuffer: 65536, stdio: ['pipe', 'pipe', 'pipe']
      });
      const r = JSON.parse(raw);
      if (!Array.isArray(r.bosses)) throw new Error('RESPOSTA_INVALIDA');
      bosses = r.bosses;
    } catch (error) {
      // R32.3 · El helper escriu {"error":"CODI"} a stdout i ix amb 1: es conserva el codi, no un «Error» mut.
      let codi = error.code ?? error.name;
      try {
        const motiu = JSON.parse(error.stdout ?? '')?.error;
        if (typeof motiu === 'string' && /^[A-Za-z_]{1,64}$/.test(motiu)) codi = motiu;
      } catch { /* stdout sense JSON: es conserva el codi del procés */ }
      avisos.push(`INVENTARI_NO_DISPONIBLE:${codi}`);
    }
  }
  const bytesEliminats = bosses.reduce((s, b) => s + b.bytesEliminats, 0);
  return { versio: 2, plataforma, mode: neteja ? 'neteja-segura' : 'lectura', disc, bosses, bytesEliminats,
    bytesAlliberats: null, avisos,
    resum: avisos.length || bosses.some((b) => ['bloquejat', 'parcial'].includes(b.estat))
      ? 'Diagnòstic parcial: revisa els avisos abans de continuar.'
      : 'Lectura local completada. Les dades personals es conserven.' };
}
export function main(args = process.argv.slice(2)) {
  if (args.some((arg) => !['--json', '--neteja-segura'].includes(arg)) || new Set(args).size !== args.length) {
    throw new TypeError('Ús: sentinella-jarvis-espai.mjs [--json] [--neteja-segura]');
  }
  const r = diagnosticar({ neteja: args.includes('--neteja-segura') });
  console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : [r.resum,
    `Disc lliure: ${r.disc.lliureBytes === null ? 'desconegut' : `${r.disc.lliureBytes} B`}`,
    ...r.bosses.map((b) => `${b.id}: ${b.estat}; ${b.bytes ?? 'desconegut'} B; eliminats ${b.bytesEliminats} B${b.error ? `; ${b.error}` : ''}`),
    ...r.avisos].join('\n'));
  return r;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
