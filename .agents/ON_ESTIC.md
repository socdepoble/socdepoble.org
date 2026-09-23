---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-09-23T16:20:18.794Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** d2f07d65

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 260923_1810 i `_wiki_de_poble/04_escriptori/260923_1815_pla_implementacio.md` s'ha tocat 6 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 260923_1810 · Claude · Auditoria forense del Brain: sis P0, cinc inèdits

- **Torn:** `torn_63de82b8-a259-4b4a-a8c4-590c723a80f8` (abast **code**), **obert a propòsit**. Entrega: [[260923_1810_auditoria_claude]], rebut `sdp:torn_63de82b8…:07282a8c`, `document.mjs check` → `valid: true`. **Zero fitxers de codi tocats:** Mode AFK del prompt de les 17:35.
- **Dictamen:** el Mas no té peces dolentes, té **peces sense endollar i portes que declaren verd sense mirar**. La frase «cadena de portes inviolable» no se sosté: el commit `d2f07d65`, el darrer del repositori, **està a l'arbre amb el segell trencat** (pany `6e288332`/18 fitxers, arbre real `354afc9e`/19).
- **C1 · P0 — Quatre hooks de git són cadàvers validats en verd.** `reflex_petorreta.mjs:83-86` valida `post-commit`, `pre-merge-commit`, `pre-applypatch` i `post-applypatch` amb regex que **casen amb els seus propis comentaris**. Els quatre fitxers: 59-61 bytes, **0 línies executables**.
- **C2 · P0 — `hash: null` desactiva la Llei Z i la porta diu «intacte».** `segella.mjs:66`. Provat i revertit en el mateix procés. `.agents/SKILLS_SEAL.json` tampoc és a `CRITICAL_SEED_PATHS`.
- **C3 · P0 — El segell està committejat trencat.** Les skills `core-automillora` i `core-estrategia-ia` es van escriure a les 17:31 **per `Bash`**, i el matcher de `segell-auto` només cobrix `Write|Edit|NotebookEdit`: cap traça a `segell.log`. El commit es va fer igualment tot i que el Segell és el pas 3 de la cadena. **Falta determinar si va ser `--no-verify` o fallada del hook**; la reparació difereix. Apunt: `HUSKY=0` no serviria, perquè `core.hooksPath` val `.husky` (no `.husky/_`) i el llançador `h` no s'executa mai — efecte lateral: **`commit-msg` no es valida en absolut**.
- **C4 · P0 — La Porta SCC s'apaga sola a la CI per una divergència de caixa.** La doctrina (AGENTS §2) va passar a minúscules, el disc va obeir, **el codi no**, i macOS ho ha amagat sempre. La CI és `ubuntu-latest`. Provat component a component: `00_INDEX_ESCRIPTORI.md`, `00_Bandeja_d_Entrada` i `04_ESCRIPTORI/01_Produccio` **manquen** a ext4. Amb `catch { return; }` al mig (`verificador-scc.mjs:133`, amb el comentari confessant-ho): **l'ancoratge de l'Escriptori i el límit de 20 de la safata no es comproven mai a la CI**. La porta és hui més estricta al Mac que a la CI.
- **C5 · P0 — El canal de consentiment de la zona humana és inabastable per construcció.** `openTurn` escriu `humanInventoryVersion: 1` i `startHumanWatch` llança precisament quan val 1. Provat amb execució: les dos funcions llancen sempre. **Quan el Mestre toca `01_produccio`, el torn no es pot tancar mai i no hi ha manera legítima de registrar-ho.**
- **C6 · P1 — 47 de 56 portes no s'executen mai.** La cadena mor al **pas 3** (53 sense notícies); reparat el segell, moriria al 9 (Linter, 64 avisos). `--diagnostic` corre **5 de 56** i imprimix `valid: true`.
- **C7 · P1 — El cens de skills viu en sis llocs i cap dos coincidixen.** Disc **18**, directoris **18**, pany `filesCount` **18** (compta `.md`, que són 19), `skills_index.json` **17**, symlinks `.claude/skills/` **16**, i el test `backend_consolidacio.test.mjs:51` porta el **16 cablejat**, també al títol. **Actualització en viu:** MarIA ha afegit `triggers_on` a les 17:58 mentre jo auditava i **les 9 proves roges ara són 1** — esmene la xifra per a Codex i per a mi. La que queda és `18 !== 16`. Però la classe continua: **cap script nomena `.claude/skills`** i les dues skills noves segueixen sense symlink, fora de l'índex i amb el manifest divergent. Corregir `triggers_on` calia; no tanca res.
- **Altres:** C8 el Somiador mou fora del repo amb el reancoratge degradat a avís (arma carregada sense gallet: només el crida una prova en `--dry-run`); C9 31 torns, 2,7 MB, **10 làpides caducades** que no es poden tancar mai; C10 quatre funcions mortes i 14 scripts orfes al Brain; C11 els 64 avisos mapejats.
- **Olivera:** llegida sencera l'auditoria de Codex de les 17:52. **M'esmena B1 i li done la raó:** `turns.mjs:109` no és un bypass d'acceptació —el document ja és rebutjat—, és pèrdua de diagnòstic; i no basta llevar el `return` perquè el codi següent usa `m[1]`. **B5 també:** `Instrucció del torn` ja està a la plantilla, la meua proposta de les 16:30 està aplicada. Verificada la seua troballa nova: plantilla v2.3.0 al cos vs ruta v2.2.0 al contracte. Els meus C1-C5 i C7 són fora del seu tall.
- **Higiene feta:** els **6 documents d'esta reunió estaven sense àncora** (la secció 0 del prompt els donava per ancorats amb un `[x]`). Ancorats a `00_index_escriptori.md`: `ESCRIPTORI_UNANCHORED` de 4 a **0**. Queden 2 actes marmota òrfenes, heretades i fora d'abast.
- **Següent acció:** el Mestre decidix. El `triggers_on` ja està fet. Propose un torn curt: la guarda del pany (C2), els literals de caixa (C4) i el cens únic de skills (C7, que tanca la prova que queda). **Set** motors cognitius dissenyats a l'auditoria, cap escrit. Pendent de determinar, abans de reparar C3: si el commit va passar per `--no-verify` o si el hook va fallar.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
