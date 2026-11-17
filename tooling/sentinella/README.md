---
type: document
status: canonic
description: "Sentinella JARVIS R32: diagnòstic de disc de només lectura, neteja bloquejada i contracte del servei de salut de l’emmagatzematge."
---
# Sentinella JARVIS R32 · diagnòstic i fronteres de purga

El diagnòstic de disc del motor és portable. L'inventari POSIX llig exclusivament `.npm/_cacache`, `.cache/puppeteer` i `.cache/uv`, amb `dir_fd`, `O_NOFOLLOW`, límits de profunditat/entrades/temps i refús de symlinks, hardlinks, noms no portables i dades sagrades recognoscibles. Windows retorna el diagnòstic de disc i un avís d'inventari no disponible. No s'instal·la ni es programa cap tasca.

**La neteja del sistema operatiu queda bloquejada amb `NETEJA_ATOMICA_NO_DISPONIBLE`.** L'àrbitre ha demostrat que un escriptor amb el mateix UID pot moure un subdirectori després d'obrir-ne el descriptor i abans de la recursió: `O_NOFOLLOW` evita seguir un symlink, però no impedix esborrar el subarbre després que haja eixit de la llista blanca. Tant `--neteja-segura` com `run({neteja: True})` i el helper Python `purge()` bloquegen qualsevol supressió. No es promet un compare-and-unlink atòmic que POSIX no aporta ací.

```sh
node tooling/sentinella/sentinella-jarvis-espai.mjs --json
node tooling/sentinella/sentinella-jarvis-espai.mjs --neteja-segura --json
```

La segona ordre lliura el pla mesurat i la raó del bloqueig amb zero bytes eliminats. Cap prova s'ha executat sobre les memòries reals del Mestre.

## Contracte del servei del navegador

`src/data/salutEmmagatzematgeDispositiu.js` és independent d'UI i backend. Exporta `creaServeiSalutEmmagatzematgeDispositiu`, `lligSalutEmmagatzematgeDispositiu`, `purgaMemoriaCauRegenerable`, `historialNetegesLocals` i `BLOQUEIG_PURGA_MEMORIA_CAU`.

- Lectura: retorna `usage`, `quota`, `persistent`, `categories` i `avisos`. Valors no mesurables són `null`.
- Categories sagrades (E2EE, esborranys, backups i notes locals) sempre són intocables; el servei no obri els seus magatzems.
- Purga: només considera dues caches retirades exactes (`sdp-pwa-recursos-v0`, `sdp-pwa-closca-v0`) i entrades públiques d'assets amb nom hash. Mai elimina una cache sencera.
- **No hi ha cap productor confirmat connectat en esta entrega. Per defecte, `purgaMemoriaCauRegenerable()` torna `estat: 'bloquejat'`, `CAP_PRODUCTOR_REGENERABLE_CONFIRMAT` i zero supressions.** La UI ha d'explicar eixe estat i no prometre neteja activa.
- Només un productor de recursos públics regenerables pot subministrar un `manifestRegenerable` a la factoria. No es pot fabricar el manifest a partir del contingut actual de CacheStorage: això convertiria una dada desconeguda en «confirmada» sense prova.

Esquema de manifest (contracte de productor futur, ara només provat amb fixtures):

```js
{
  esquema: 'sdp.cache-regenerable.v1',
  bloqueig: BLOQUEIG_PURGA_MEMORIA_CAU,
  recursos: [
    { url: 'https://socdepoble.org/assets/entrada-abcdefgh.js',
      bytes: 1234,
      sha256: '64 dígits hexadecimals minúsculs del cos públic verificat' }
  ]
}
```

Cada productor de les caches retirades ha d'adquirir el mateix Web Lock exclusiu per a **totes** les escriptures i retirades. Cache API no oferix un CAS atòmic entre `match()` i `delete()` davant d'un escriptor que ignore eixe bloqueig. La confiança en el productor i el protocol de bloqueig és una precondició d'esta API, i no s'acredita cap productor real per passar un objecte de prova.

La factoria valida origen/ruta/mida/hash/duplicats i copia les entrades per evitar canvis del manifest en curs. Cada resposta requerix MIME JS/CSS/WOFF2 coherent, `200`, absència d'auth/cookies/`private`/`no-store`, bytes i SHA-256 exactes. Es revalida el cos immediatament abans d'eliminar. Un canvi de la mateixa mida queda rebutjat pel hash. Una sola entrada desconeguda bloqueja tota la cache.

Els rebuts desen `bytesEliminats` dels cossos realment suprimits i `bytesAlliberats: null`: no s'inventa espai físic, temps guanyat ni categories privades. `historialDesat` i `historialPersistent` expliquen si el rebut ha pogut persistir. Quota o errors posteriors a una supressió conserven el recompte parcial. Abort abans de mutar rebutja; abort després de començar preserva el rebut parcial. La cancel·lació d'un flux no espera indefinidament un productor que no resol `cancel()`.

Proves: `tests/sentinella-jarvis-r32.test.mjs` i `src/data/salutEmmagatzematgeDispositiu.test.js`. L'evidència d'abans/després de les dues contraproves és al kit R32, `evidencies/261116_t4_*`.

## Vincles

- [[00_index]]
