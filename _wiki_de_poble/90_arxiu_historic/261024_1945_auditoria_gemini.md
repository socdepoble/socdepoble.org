---
type: informe
status: esborrany
description: Auditoria adversarial post-commit 472f704d0 de Gemini 4 Argon amb Matriu MCR, puresa lèxica, quota de 30 altes/h i Llei del Connectar.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:f52c8113-251f-41f9-a6d8-e09682582d63
---
# Gauntlet Loop Post-Commit 472f704d0 · Auditoria Gemini 4 Argon i Matriu MCR

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:f52c8113-251f-41f9-a6d8-e09682582d63 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T17:48:56.001Z |
| Modificació | 2026-10-24T17:52:00.000Z |
| Propietari | Gemini 4 Argon (Garant de Coherència i Disseny · Gauntlet Loop) |
| Aprovació humana | Convocatòria formal del Mestre Javi Llinares (àudios 18:21, 18:49 i 19:38) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High |
| Tokens consumits | ~42.800 tokens (inspecció de commit 472f704d0, execució de test:precommit i contrast adversarial) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-24T17:48:56.001Z`: Esborrany creat amb ancoratge criptogràfic al torn `torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf`.
- `2026-10-24T17:52:00.000Z`: Completada l'auditoria adversarial post-commit sobre `472f704d0` sota el protocol `core-gauntlet-loop` (Zero Complaença), executada la suite `npm run test:precommit`, revalidat el Plànol Atòmic `P1-11` sota la **Llei Suprema del Connectar** (àudio 18:21) i emesa la **Matriu de Conformitat de Requeriments (MCR)**.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte del Gauntlet Loop (Zero Complaença): REBUIG PARCIAL DE CONFORMITAT SOBRE T2 (QUOTA I REACTIVACIÓ) I T1 (FALLADA DNS PARCIAL EN HOSTS APROVATS)

El commit `472f704d0` suposa un salt de qualitat enorme (T3 i T4 estan resolts amb excel·lència i `npm run test:precommit` passa 2.927 + 259 proves en 27 segons), però aplicant la regla d'or del **Gauntlet Loop** (*«si trobes una sola escletxa o drecera, rebutja la conformitat per a obligar a refer el codi»*), documentem **quatre troballes objectives en codi** (`G1945-01` a `G1945-04`) que impedixen donar el segell 100% `[FET]` sense un últim retoc quirúrgic:

### 1. Matriu de Conformitat de Requeriments (MCR · Commit `472f704d0`)

| Requeriment de Fortificació | Estat (`[FET]` / `[PARCIAL]` / `[NO FET]`) | Evidència Codi (`fitxer:línia`) | Motiu / Risc Detectat |
| :--- | :---: | :--- | :--- |
| **T1.1 · Anti-SSRF: Bloqueig de ports no estàndard (`seguent.port === ''`) i redireccions 30x** | `[FET]` | `supabase/functions/noticies/gestor.js:245,295,984,989,1010,1023-1039` | Tant el primer salt com fins a `MAXIM_REDIRECCIONS = 2` passen per `regleDelSalt`. Qualsevol port explícit (`:8443`, `:8080`, `:444`), credencials, esquema no `https:` o canvi de host en una font del sistema es rebutja abans del `fetch`. |
| **T1.2 · Anti-SSRF: Llista blanca nativa de la Secció 23 (`HOSTS_DEL_SISTEMA`)** | `[FET]` | `supabase/functions/noticies/gestor.js:192,238-264` | `validaCataleg` exigeix que `feed` i `lloc` pertanyen exactament als 5 hosts dels 6 canals de la §23 (`ayudawp.com`, `emowe.com`, `iaenaccion.com`, `www.jonhernandez.education`, `www.youtube.com`). |
| **T1.3 · Anti-SSRF: Rebuig d'IPs privades amb `Promise.allSettled` (IPv4 vs IPv6)** | `[PARCIAL]` | `supabase/functions/noticies/gestor.js:937-955,971-976`, `supabase/functions/noticies/index.ts:53-62` | **Troballa `G1945-01` (P2):** Per a hosts externs (`xarxaDe`, `:954`), qualsevol família amb error (`fallades > 0`) bloqueja la baixada. Però en hosts aprovats i CDNs (`aprovatVetat`, `:971-976`), s'ignora `nom.fallades > 0`: si `A` respon públic i `AAAA` falla amb `SERVFAIL`/timeout (quan `AAAA` apuntava a IP privada), `aprovatVetat` deixa passar el `fetch`. Atés que `index.ts:58` ja traduïx `Deno.errors.NotFound` (absència de registre IPv6) a `[]` (`fallades === 0`), qualsevol `fallades > 0` és un error real de DNS i hauria de tancar també en `aprovatVetat`. A més, persisteix l'excepció sense `Deno.resolveDns` (`:973`) i el TOCTOU de DNS rebinding que requerix aïllament d'egrés. |
| **T1.4 · Anti-SSRF: Timeouts (`6 s`) i límit de lectura de `ReadableStream`** | `[FET]` | `supabase/functions/noticies/gestor.js:138-141,504-533,1005-1006,1044-1048` | `AbortController` de `6000 ms` per a tot l'intercanvi i lectura tros a tros a `llegixFitat` que cancel·la el stream (`lector.cancel()`) de seguida que supera `2 MiB` (sistema), `512 KiB` (personal) o `1 MiB` (imatge). *(Millora defensiva opcional: embolcallar `lector.read()` amb `finsQueSAvorte(senyal)`).* |
| **T2.1 · Quota d'Altes: Tall estricte a 30 altes/hora a `private.seguiments_altes`** | `[PARCIAL]` | `supabase/migrations/2610241430_seguiments.sql:363-376,382`, `src/data/localSeguiments.js:44,128-131` | **Troballa `G1945-02` (P1):** El registre `private.seguiments_altes` ja compta cada alta i cada represa dins del pany `pg_advisory_xact_lock`, però **el sostre codificat és de 60 altes/hora (`if v_hora >= 60`, `LIMIT_PER_HORA = 60`), NO de 30 altes/hora** com exigeixen el prompt del Gauntlet (`261024_1945:95-96`) i l'Acta Marmota (`261024_1945:53`). |
| **T2.2 · Reactivacions: Cooldown de 10 minuts i marca temporal post-pany (`clock_timestamp()`)** | `[PARCIAL]` | `supabase/migrations/2610241430_seguiments.sql:345,355,385,390`, `src/data/localSeguiments.js:126` | **Troballa `G1945-03` (P1):** 1) Quan es crea una fila per primera vegada (`:390`), `reactivat_al` és `NULL`. Si l'usuari fa `deixa_de_seguir` i torna a cridar `segueix` 1 segon després, la guarda `:355` (`v_represa > now() - interval '10 minutes'`) avalua sobre `NULL` i **permet la primera reactivació immediata sense esperar els 10 minuts** (tant en SQL com a `localSeguiments.js:126`). 2) Les línies `:355` i `:385` usen encara `now()` (inici de transacció abans del pany) en lloc de `v_ara` (`clock_timestamp()`). |
| **T2.3 · RLS i Aïllament: Protecció de `private.seguiments_altes` i bloqueig de clau `anon`** | `[FET]` | `supabase/migrations/2610241430_seguiments.sql:181-203,307-309,398-400,537-538` | `private.seguiments_altes` viu a l'esquema `private` (inaccessible des de PostgREST), té RLS activa i `revoke all` per a `public, anon, authenticated, service_role`. Les 5 RPCs revoquen execució a `anon` i filtren estrictament per `(select auth.uid())`. |
| **T3 · Puresa Lèxica: Extirpació absoluta de «MAS» a Notes (`visibilitatNota.js` i `SnippetCurador.jsx`)** | `[FET]` | `src/sections/notes/visibilitatNota.js:126-160`, `src/sections/notes/SnippetCurador.jsx:120,369`, `src/sections/notes/visibilitatNota.test.js:140-154` | Extirpat al 100% de tots els textos visibles de les Notes (`«Privada (només visible per a tu)»`, `«Privat (només visible per a tu)»`, `«Deixar-lo privat»`, `«a les teues notes»`, `«Categoria al Lector»`) i blindat amb test específic anti-regressió. |
| **T4 · Rendiment de Proves: Suite `npm run test:precommit` (< 60 s)** | `[FET]` | `vitest.precommit.config.js:1-66`, `package.json:110`, `tooling/gates/git-staged.mjs:29-48`, `tooling/gates/tractor-build-previ.mjs:74,82` | Verificat empíricament en este torn: **151 fitxers Vitest (2.927 proves) + 259 proves Node superades amb 0 fallades en 27,6 s** (ben per sota del tall de 60 s). |
| **T5b / Doctrina del Connectar (Àudio 18:21): «A Sóc de Poble no se seguix, es connecta»** | `[PARCIAL]` | `src/sections/profile/PerfilPublicSection.jsx:671-720`, `src/sections/connectar/BlocRelacio.jsx:45,113-139`, `src/sections/profile/Seguidors.jsx:125,154` | **Troballa `G1945-04` (P2):** Cap targeta ni fitxa pública no té botons solts de «Seguir» (totes passen per `/connectar`). S'ha actualitzat el Plànol `P1-11` retirant qualsevol proposta de botó solt de seguiment a `FitxaPublica`. Tanmateix, **dins de `/connectar` (`BlocRelacio.jsx:138`) i a `Seguidors.jsx:125,154` el verb visible a la UI continua sent «Seguir {nom}» / «Gent que et seguix»** en lloc del verb canònic «Connectar». |

### 2. Detall Tècnic de les 4 Troballes i Propostes Quirúrgiques

#### `G1945-01` · P2 · `aprovatVetat` (`gestor.js:971-976`) ignora `nom.fallades > 0` quan una família DNS falla amb error

- **Fitxers afectats:** `supabase/functions/noticies/gestor.js:971-976` i `supabase/functions/noticies/index.ts:53-62`.
- **Explicació i evidència:** En `index.ts:58`, quan un domini no té registres d'una família (per exemple, un host sense `AAAA`), `Deno.resolveDns` llança `Deno.errors.NotFound` i el wrapper retorna `[]` sense llançar excepció (`status: 'fulfilled', value: []`, per tant `fallades === 0`). En conseqüència, a `resolNom` (`gestor.js:937-945`), `fallades > 0` només ocorre quan el resoledor DNS pateix una fallada real (`SERVFAIL`, timeout, refusat). Però `aprovatVetat` (`gestor.js:971-976`) no comprova `if (nom.fallades > 0) return 'origen_caigut';`. Si un host aprovat té una adreça `AAAA` privada però l'intent de resolució `AAAA` falla amb error de xarxa mentre `A` resol públic, `aprovatVetat` retorna `null` i autoritza el `fetch`.
- **Correcció proposada (`requires_human_decision: false`):**
  A `supabase/functions/noticies/gestor.js:975`, substituir:
  `return nom.adreces.length === 0 ? 'origen_caigut' : null;`
  per:
  `return nom.fallades > 0 || nom.adreces.length === 0 ? 'origen_caigut' : null;`
  (I ajustar la prova de `gestor.test.js` on es modela un host sense IPv6 perquè el mock de `resolDns` retorne `[]` per a `AAAA` com fa `index.ts:58` amb `NotFound`, reservant el `throw` per a fallades reals del servidor DNS).

#### `G1945-02` · P1 · Sostre de quota en 60 altes/hora (`v_hora >= 60`) en lloc de 30 altes/hora

- **Fitxers afectats:** `supabase/migrations/2610241430_seguiments.sql:59,99,128,374` i `src/data/localSeguiments.js:44`.
- **Explicació i evidència:** El prompt del Gauntlet (`261024_1945_prompt_codex_gemini_gauntlet_loop_revisio_adversarial_postcommit.md:95-96`) i l'Acta Marmota (`261024_1945_acta_marmota...:53`) estableixen una quota estricta de **30 altes/hora** a `private.seguiments_altes`. El codi entregat a `472f704d0` manté el valor del prompt anterior (`60`):
  - `2610241430_seguiments.sql:374`: `if v_hora >= 60 then`
  - `localSeguiments.js:44`: `export const LIMIT_PER_HORA = 60;`
- **Correcció proposada (`requires_human_decision: false` si el Mestre confirma el tall de 30/h de l'Acta 19:45):** Rebaixar `60` a `30` a `2610241430_seguiments.sql:374`, `localSeguiments.js:44` i tests associats (`seguiments.migracio.test.js`, `localSeguiments.test.js`).

#### `G1945-03` · P1 · La primera reactivació d'un seguiment salta l'espera de 10 minuts (`v_represa` és `NULL`) i usa `now()` en lloc de `v_ara`

- **Fitxers afectats:** `supabase/migrations/2610241430_seguiments.sql:355,385` i `src/data/localSeguiments.js:126`.
- **Explicació i evidència:**
  1. En l'alta inicial (`insert into public.seguiments`, línia `390`), `creat_al` rep el timestamp però `reactivat_al` queda `NULL`.
  2. Si l'usuari deixa de seguir (`deixat_al = now()`) i **1 segon després** torna a cridar `segueix`, la línia `355` comprova:
     `if v_fila is not null and v_represa > now() - interval '10 minutes' then`
     Com que `v_represa` (`s.reactivat_al`) és `NULL`, la condició no salta i permet reactivar al cap d'1 segon de l'alta inicial! Exactament el mateix ocorre a `src/data/localSeguiments.js:126` (`if (ja && despresDe(ja.reactivatAl, ms - ESPERA_DE_REPRESA))`), on `ja.reactivatAl` és `null`.
  3. A més, les línies `355` i `385` de `2610241430_seguiments.sql` usen `now()` (instant d'inici de la transacció, abans d'esperar el `pg_advisory_xact_lock`) en compte de `v_ara` (`clock_timestamp()`, pres a la línia `345` després d'adquirir el pany).
- **Correcció proposada (`requires_human_decision: false`):**
  - A `supabase/migrations/2610241430_seguiments.sql:355`, comprovar `if v_fila is not null and coalesce(v_represa, v_al) > v_ara - interval '10 minutes' then`, i a `:385` i `:390` estampar `v_ara` com a marca temporal.
  - A `src/data/localSeguiments.js:126`, comprovar `if (ja && despresDe(ja.reactivatAl || ja.creatAl, ms - ESPERA_DE_REPRESA)) throw errorDeSeguiment('SDP-SEG-006');`.

#### `G1945-04` · P2 · Aliniament del Plànol Atòmic (`P1-11`) i del lèxic de `/connectar` amb la Llei Suprema del Connectar (Àudio 18:21)

- **Evidència en codi i en el Plànol Atòmic:**
  1. **Targetes i Fitxes Públiques (`[FET]`):** Hem verificat `src/sections/profile/ProfileSection.jsx`, `src/sections/pobles/PoblesSection.jsx`, `src/sections/profile/PerfilPublicSection.jsx` i `src/sections/detail/ItemDetailSection.jsx`. Cap targeta ni fitxa pública no té botons solts de «Seguir»; tota vinculació passa pel botó `+ Connectar` cap a `/connectar`.
  2. **Rectificació immediata del Plànol `T5B-02` / `P1-11` (`[FET]`):** En la nostra auditoria de les 18:00 (`261024_1800_auditoria_gemini.md`) havíem suggerit afegir un botó directe de seguiment a `FitxaPublica`. Sota la directiva canònica de les 18:21 (**«A Sóc de Poble no se seguix, es connecta. Cap botó solt de seguir a targetes ni fitxes; tota connexió passa per `/connectar`»**), retirem eixe punt del plànol `P1-11`: `FitxaPublica` incorporarà exclusivament l'aparador atòmic `<Pestanyes>` + `<VistaPublicacionsDeLActor>` (Mur, Agenda i Mercat de l'actor) i mantindrà `/connectar` com a única porta de vinculació.
  3. **Verb «Seguir» encara visible dins de `/connectar` i `Seguidors.jsx` (`requires_human_decision: true`):** Dins de `/connectar`, `src/sections/connectar/BlocRelacio.jsx:45,80-85,100-139` mostra el botó `«Seguir {nom}»` / `«Deixar de seguir {nom}»`, `src/sections/profile/Seguidors.jsx:125,154` mostra `«Gent que et seguix»` / `«Qui seguix {nom}»`, i `src/sections/notes/SnippetCurador.jsx:112` diu `«Una font de notícies (RSS) per a seguir-la al Lector»`. Cal que el Mestre confirme si en la fase `P1-11` també substituïm eixes etiquetes internes de `/connectar` i `Seguidors.jsx` pel verb pur **«Connectar amb {nom}» / «Gent connectada amb tu»**.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades directament sobre l'arbre `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` en el commit `472f704d0` (`backup-notes-publish`):

| Comanda executada | Codi d'eixida | Resultat observat |
| --- | --- | --- |
| `git show --stat 472f704d0` | `0` | Verificades les 18 rutes modificades per Claude Opus 5.5 (`696 insertions, 97 deletions`). |
| `npm run test:precommit` | `0` | **151 fitxers Vitest (2.927 proves) + 259 proves Node superades amb 0 fallades en ~27,6 s** (dins del límit < 60 s). |
| `grep -rn "MAS" src/sections/notes/ src/sections/connectar/ src/sections/profile/` | `0` | Cap ocurrència visible de «MAS» als components ni selectors de Notes, Connectar ni Perfils. |
| `node tooling/gates/porta-olivera.mjs` | `0` | Porta Olivera en verd (`codi 0`), tots els documents d'escriptori ancorats a `00_index_escriptori.md`. |
| `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261024_1945_auditoria_gemini.md` | `0` | Document d'auditoria i Matriu MCR validats estructuralment sense errors. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La verificació de `supabase/migrations/2610241430_seguiments.sql` i `supabase/functions/noticies/` s'ha realitzat per inspecció estricte de codi i execució de la bateria local (`npm run test:precommit`), sense instància PostgreSQL ni runtime Deno remots.
- El Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) s'actualitza en aquest mateix acte per reflectir la Llei del Connectar a `P1-11` i les troballes `G1945-01..04` a `P1-07` i `P2-10`.
- Cap cron ni tasca recurrent de fons no ha sigut creada ni queda activa en tancar aquest torn (`manage_task list` buit).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1945_prompt_codex_gemini_gauntlet_loop_revisio_adversarial_postcommit]]
- [[261024_1945_acta_marmota_triomf_commit_472f704d0_fortificacio_i_obertura_gauntlet]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_auditoria_claude]]
- [[261024_1800_auditoria_codex]]
- [[261024_1800_auditoria_gemini]]
