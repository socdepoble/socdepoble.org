---
type: informe
status: esborrany
description: 'Informe d''implementació de T1-T4 del torn 261024_1800: anti-SSRF a tots els salts, registre d''altes de seguiments, textos sense «MAS» i suite test:precommit, amb evidència.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_483710d4-afff-4198-a204-755bfbff1db1:bea9de2d-2125-4fe1-b3d4-38501ef98aba
---
# Auditoria Claude · Fortificació total: anti-SSRF, quota de seguiments, purga de «MAS» i pre-commit ràpid

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_483710d4-afff-4198-a204-755bfbff1db1:bea9de2d-2125-4fe1-b3d4-38501ef98aba |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T16:36:41.534Z |
| Modificació | 2026-10-24T19:19:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code; workflow de verificació de 6 subagents |
| Tokens consumits | Torn principal no mesurat per l'eina; workflow de verificació: 966.876 tokens de subagents |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-24T16:36:41.534Z: esborrany creat.

2026-10-24T16:40:00.000Z: **Relleu provisional per a Codex (T6) i Gemini.** T1–T4 implementats a l'arbre (sense commit). T1: `HOSTS_DEL_SISTEMA` natiu a `validaCataleg`; cada salt de cada baixada, també el primer i el de les fonts del sistema, passa `regleDelSalt`; els hosts aprovats (catàleg i `CDN_IMATGES`) es resolen amb resoledor i una resposta no pública els veta; les redireccions del sistema no poden canviar el port (C6-02, C6-03). T2: registre `private.seguiments_altes` (una fila per alta o represa acceptada, dins del pany) i el mateix al model local (C6-01). T3: «Privada (només visible per a tu)», «Privat (només visible per a tu)», «Deixar-lo privat», «Categoria al Lector». T4: `npm run test:precommit` (20,6 s) i `git-staged.mjs` el crida, escrit per l'executor amb lease Reflex `284a95f8` (consumit). En curs: suite sencera en còpia congelada i verificació adversarial de tres revisors.

2026-10-24T16:55:00.000Z: Llegida la reauditoria de Codex (C6-02 restant: una família DNS privada i l'altra amb error passava; tres precisions de T2) i l'informe de Gemini (T5a, T5b i el contrast de T1–T4). Corregit en codi i provat: `allSettled`, cap adreça és rebuig per als aprovats, `clock_timestamp()` després del pany, purga cada 10 minuts, retenció descrita fidelment i baixa a la branca d'entitat.

2026-10-24T17:05:00.000Z: Arribada la revisió adversarial pròpia (tres revisors i tres verificadors). Corregides les troballes confirmades T1-01, T1-02 i B1–B4 (segona lease Reflex `94d149d1`), i dos retocs dels residus de T2. Suite sencera en còpia congelada i bateries dirigides sobre l'estat final.

2026-10-24T17:13:06.000Z: informe complet; Llibre Mestre (P1-07, P1-10, P2-10, P2-11) actualitzat sense tocar el que hi havien escrit Codex i Gemini.

2026-10-24T18:45:00.000Z: **Gauntlet Loop 261024_1945** ([[261024_1945_auditoria_codex]], [[261024_1945_auditoria_gemini]]). Sobre el commit `472f704d`, el Mestre ordena tres correccions:
1. Quota de 30 altes o represes per hora (Codex G-01, Gemini G1945-02).
2. Espera de represa de 10 minuts comptada també des de l'alta, amb `v_ara` en lloc de `now()` (Gemini G1945-03).
3. Un host aprovat amb una família DNS fallada no passa (Gemini G1945-01).

Fetes al SQL, al model local i al servei, amb les proves que fixaven el comportament vell actualitzades a posta. `test:precommit`: 2.930 + 259 proves, 0 fallades, 23,6 s.

Queden obertes, perquè no són de les tres correccions:
- G-02 de Codex: sense resoledor al runtime els aprovats no es resolen. És decisió del Mestre.
- G-03 de Codex: el parser quadràtic de `senseNiats`, heretat.
- G1945-04 de Gemini: el lèxic de Connectar i el plànol T5b.

2026-10-24T19:19:00.000Z: **G-03 de Codex (parser quadràtic), per ordre del Mestre.** El servei no era quadràtic només a `senseNiats`. Totes les cerques de terminador que es repetien des de cada «<» també ho eren:
- les obertures `[^>]*` d'`elementsDe`, `continguts`, `etiquetes`, `enllacAtomDe` i `primerElement`;
- les seccions CDATA sense «]]>»;
- l'eliminació d'etiquetes;
- `FORA_DE_LHTML`;
- la cerca de `<img … src`.

Mesura amb la versió vella: 1 MB de la reproducció de Codex, 7 s; obertures sense «>», 57 s.

Reescrit amb un recorregut que no torna enrere: el «>» memoritzat, els tancaments llistats una vegada i els terminadors absents que no es tornen a buscar. Ara totes les famílies, de 0,5 a 1,5 MB, tarden de 5 a 54 ms. El nucli del Lector (el seu tokenitzador) ja era lineal.

Verificació:
- contrast diferencial vell contra nou: 270.000 feeds aleatoris amb sis llavors i 1,2 milions de trossos per a cada peça interna, cap diferència, a part de la fita nova (com a molt 32 noms de contingut distints sense tancar per tros);
- regressió de 12 famílies d'~1 MB més el servei sencer, que la versió vella no passa (contraprova: 7,0 s, 57,2 s, 8,7 s i 7,1 s contra el límit d'1 s);
- `test:precommit`: 2.945 + 259 proves, 22,8 s.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Claude implementa T1–T4 del prompt [[261024_1800_prompt_claude_gemini_codex_fortificacio_total_i_blindatge_sistema]] i del pla [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]. Res no està commitejat ni desplegat; cap migració no s'ha aplicat. La segona passada de Codex ([[261024_1800_auditoria_codex]]) s'ha integrat sencera: el defecte que hi quedava a T1 (C6-02, una família DNS privada i l'altra amb error) i les tres precisions de T2 estan corregits i provats.

### T1 · Anti-SSRF a tots els salts del servei `noticies` (P1-07; Codex C6-02, C6-03)

**Estat: fet en codi; queda una porta oberta documentada i el risc residual del DNS rebinding.**

- **Llista blanca nativa.** `HOSTS_DEL_SISTEMA` a `supabase/functions/noticies/gestor.js` porta exactament `ayudawp.com`, `emowe.com`, `iaenaccion.com`, `www.jonhernandez.education` i `www.youtube.com`. `validaCataleg` hi exigix el feed i el lloc de cada font de `fonts.json`: `https:` net, sense port ni credencials ni fragment, un nom DNS públic del mateix host. Un host nou, una IP literal (`127.0.0.1`, `[::1]`, `2130706433`, `169.254.169.254`), un subdomini per extensió o `youtu.be` fan que el gestor no es cree. És la mateixa llista que `HOSTS_DEL_CATALEG` de `cataleg.test.js`.
- **Desviació del prompt, conscient.** El prompt enumera `youtube.com` i `youtu.be` i omet Jon Hernández. He conservat els sis referents del §23 (Jon inclòs: sense ell la funció no arrencaria). He posat els noms exactes que serveixen feeds (`www.youtube.com`) i no `youtu.be`, que no porta cap feed ni cap imatge del catàleg; Codex ho va demanar igual. Afegir-lo és una línia i és decisió del Mestre.
- **Cada salt passa les regles.** El primer salt també, i també el de les fonts del sistema: abans, `baixa()` sense regles no en validava cap.
  - Les redireccions d'una font del sistema no poden canviar de host, d'esquema ni de port. Abans, `https://ayudawp.com:8443/…` passava (C6-03).
  - Amb resoledor, els hosts aprovats (el catàleg i `CDN_IMATGES`) també es resolen. Una sola resposta privada, de bucle, d'enllaç local, de metadades o ULA els veta amb 422 `adreca_vetada`, sense baixar res (C6-02).
- **Segona passada de Codex (C6-02 restant), corregida.** `Promise.all` perdia la resposta privada si l'altra família fallava, i el host aprovat passava (PoC: A→127.0.0.1 + AAAA→SERVFAIL = 200). Ara `resolNom` usa `allSettled`:
  - una resposta privada veta sempre;
  - sense cap adreça, tampoc no es baixa res (502 `origen_caigut`, i el Lector rep la còpia de reserva);
  - passa amb una adreça pública com a mínim, cap de privada i cap família fallada. Gauntlet 261024_1945, Gemini G1945-01: abans, una adreça pública i l'altra família amb error passaven. Un host sense IPv6 no cau, perquè el `NotFound` de l'AAAA és cap resposta i no una fallada.

  Les adreces de fora (personals, imatges de fora) continuen igual d'estrictes: qualsevol fallada les tanca.
- **Porta oberta (`requires_human_decision: true`).** Si el runtime no té `Deno.resolveDns`, els hosts aprovats es servixen sense resoldre: és l'única excepció que queda. Tancar-la deixaria el Lector sense catàleg en eixe runtime. La comprovació del README després del desplegament (`curl … ?font=ayudawp` ha de donar 200) diu en un minut si el resoledor hi és i respon.
- **G-03 (Codex, Gauntlet 261024_1945): el parser és lineal.** `imatgesDelFeed` ja no torna a buscar un terminador absent des de cada «<». Abans, 1 MB trencat a posta costava 7 s de CPU, i fins a 57 s amb obertures sense «>»; ara, mil·lisegons. El resultat és el mateix (contrast diferencial), amb una sola fita nova: com a molt 32 noms de contingut distints sense tancar per tros.
- **Risc residual, no tancat pel codi.** El DNS rebinding entre la comprovació i el `fetch` (Deno torna a resoldre i la IP no es pot fixar sense trencar el TLS). Per als hosts aprovats, caldria controlar el DNS d'un nom aprovat. El tanca un egrés aïllat a la plataforma, que és del Mestre (README).
- **Revisió adversarial pròpia (T1-01, T1-02, totes dues P3, confirmades i corregides):**
  - *T1-01.* Cap prova no fixava que una redirecció del sistema no pot anar a un altre host aprovat (`www.youtube.com`, `i3.ytimg.com`), ni que un CDN aprovat no pot ser host de feed. Hi he afegit els dos casos, i la mutació que relaxava la regla ja no sobreviu.
  - *T1-02.* El README deia «502 sempre» per a un resoledor que no respon. Un resoledor penjat dona 504, perquè la resolució compartix els 6 s del salt amb la baixada. El text ara diu «502 o 504». Donar-li un temps propi és millora opcional, no feta.
  - Totes les mutacions demanades moren: `aprovatVetat` sempre null (44 fallades), sense el port (1), sense validar el primer salt (26) i sense `HOSTS_DEL_SISTEMA` (1). També moren onze mutacions més.
  - Els trucs de parser del `Location` acaben rebutjats o en `https://ayudawp.com`: `//host`, `https:host`, contrabarres, `@`, IDNA, punt final, `%2e`, CRLF i `:443`. Cap cau ni registre no desa res baixat contra les regles.

### T2 · Quota de seguiments que cap baixa no reinicia (P2-10; Codex C6-01)

**Estat: fet en codi i en el model local; sense execució en PostgreSQL real (no n'hi ha a l'equip).**

- **El forat.** El límit comptava files de `public.seguiments`. Una parella represa tres vegades en una hora hi pesava una sola: amb 59 parelles vives, re-seguir-les cada 10 minuts donava uns 354 seguiments per hora (la PoC de Codex: 59 parelles + 2 represes = 61).
- **El registre.** `private.seguiments_altes` (`id`, `seguidor`, `al`) té una fila per cada alta o represa acceptada. Cap columna diu a qui. És a l'esquema `private` (PostgREST no l'exposa), amb la RLS activa, `revoke all` a `public`, `anon`, `authenticated` i `service_role` i cap `grant`: només `segueix` (SECURITY DEFINER, `search_path` buit) hi entra.
- **Dins de `segueix`, sota `pg_advisory_xact_lock` del seguidor**, en este ordre:
  1. l'instant d'admissió és `clock_timestamp()`, pres una vegada després del pany;
  2. poda de les files de més d'una hora;
  3. compte de les de l'hora (si n'hi ha 30 o més, `SDP-SEG-006`; era 60 fins al Gauntlet 261024_1945, Codex G-01 i Gemini G1945-02);
  4. compte dels 1.000 vius;
  5. anotació de l'alta;
  6. represa o alta del seguiment.

  Tornar a seguir el que ja seguixes torna abans de comptar: no és cap alta ni avisa. Una excepció desfà també l'anotació. La represa de la mateixa parella està limitada a una cada 10 minuts, comptats des de l'última represa o, si no n'hi ha cap, des de l'alta. Gauntlet 261024_1945, Gemini G1945-03: la primera represa ja no és lliure. L'espera, `creat_al` i `reactivat_al` fan servir el mateix instant d'admissió, i `segueix` ja no usa `now()` enlloc.
- **Precisions de la segona passada de Codex, totes aplicades:**
  1. *L'instant.* `now()` és l'inici de la transacció, potser abans d'esperar el pany. Una alta anotada amb eixe instant eixia de la finestra uns segons abans d'hora. Ara és `clock_timestamp()` després del pany.
  2. *La retenció, descrita fidelment.* La purga de pg_cron passa a cada 10 minuts (`sdp-purga-altes-seguiments`), de manera que cap fila no dura més d'1 h 10 min. Sense pg_cron, una fila vella es queda fins a la pròxima alta de la mateixa persona o la baixa del compte, i la quota no la compta igualment.
  3. *La branca d'entitat.* Ara exigix, com `seguiment_viu`, que qui seguix no haja demanat la baixa.
- **Revisió adversarial pròpia.** La troballa principal (T2-01) és refutada pel verificador. Diverses crides en una sola transacció (via pg_graphql, que el repositori no activa) estampen les altes en l'instant d'admissió i es fan visibles en el commit. En temps d'admissió, cap hora lliscant no en té més de 60: un fuzz del model local de 400 llavors × 3.000 passos no n'ha vist mai més. Aplicats dos retocs dels residus:
  - la purga salta les files bloquejades (`for update skip locked`): no espera mai la poda d'una alta, i no s'interbloquegen;
  - la capçalera i el README diuen que el pany depén del nivell READ COMMITTED de PostgREST.
- **Model local.** `src/data/localSeguiments.js` (seed i local) porta el mateix registre per persona i la mateixa finestra (`al > ara − 1 h`). Proves noves: la PoC de Codex (la 61a és `SDP-SEG-006`), una parella represa cinc vegades, la frontera exacta de l'hora i el registre per persona.
- **Residual (`requires_human_decision: true`).** L'avís al xat d'un seguiment nou l'envia el client quan `primer` és cert: com a molt un per parella i per sempre, i com a molt 30 parelles noves per hora. Però és un missatge ordinari del xat (límit 15 cada 5 s, `2609080200`), i un client maliciós pot enviar missatges sense seguir ningú. Una notificació de servidor, idempotent i comptada, és una decisió de producte pendent del Mestre («El servidor no envia cap notificació», QUÈ NO FA de la migració).

### T3 · Cap «MAS» als textos de les Notes (P2-11)

**Estat: fet.**

- `src/sections/notes/visibilitatNota.js`:
  - la nota diu «Privada (només visible per a tu)»;
  - el contingut connectat diu «Privat (només visible per a tu)» i «Deixar-lo privat»;
  - la descripció de la connexió diu «a les teues notes el llegixes»;
  - l'avís irreversible diu «no tornar a fer privat».
- `src/sections/notes/SnippetCurador.jsx`: «Categoria del poble» passa a «Categoria al Lector». Les categories del Lector ja no són del poble: són coneixement obert i vídeos per a aprendre. L'ajuda és «Les categories del Lector de notícies».
- Proves actualitzades a posta i una de nova que recorre tots els textos del selector (nota i connexió, amb drets reservats) i no hi accepta «MAS».
- Els textos no passen per cap diccionari de traducció (`src/config/idiomes` no els conté): no se'n trenca cap.
- Escombrada sense comentaris de tot `src`: l'únic «MAS» visible que queda és fora de les Notes, a l'exportació de diagnòstic de la Consola («DIAGNÒSTIC DEL MAS», «EL MAS EN XIFRES», `src/sections/consola/diagnosiConsola.js:123,132`). És una eina d'administració fora de l'abast de T3. Purgar-lo és una ordre del Mestre (`requires_human_decision: true`).
- La revisió adversarial ho confirma: cap «MAS» visible a les Notes ni als components que pinten, cap prova ni fixture amb els textos vells, cap diccionari afectat i concordança de gènere correcta. Nota prèvia aliena al canvi: el gestor de fonts del Lector anomena «Carpeta» el mateix camp (`GestioFonts.jsx:200`).
- `connexions.js:113` conserva a posta l'expressió que neteja el paràgraf antic «Guardat al teu MAS» del contingut ja desat.

### T4 · Suite ràpida del pre-commit (P1-10)

**Estat: fet; el hook continua sense poder passar per altres portes heretades.**

- `vitest.precommit.config.js`, a l'arrel com els altres `vite.*.config.js`, hereta `vite.config.js` i només tria:
  - `supabase/**` (Edge Functions);
  - `src/data/**` (port, adaptadors i proves estàtiques de les migracions);
  - les proves de seguretat de la resta de `src`: sanejadors, fronteres, `*.seguretat.test.*`, la guarda d'auth, l'enllaç segur del xat i webauthn.

  Usa 4 workers com a molt i 15 s per prova, alineat amb el pressupost intern de 10 s de la prova de rendiment de `gestor.test.js`, que amb 6 workers va passar dels 5 s de Vitest per contenció. Cap assertió no s'ha relaxat.
- `npm run test:precommit` executa esta suite i després `node --test tests/fortificacio.test.mjs tests/dist-secrets.test.mjs`. Mesura de la primera passada: 140 fitxers, 2.703 proves, més 24 de node, en 20,6 s. Després de la segona passada (B2–B4): 151 fitxers, 2.927 proves de Vitest i 259 de node, en **23,3 s**.
- `tooling/gates/git-staged.mjs` crida ara `npm run test:precommit` en lloc del Vitest sencer, que tarda uns 9 minuts i no cabia mai en els 120 s del pas. La suite sencera continua sent la de cada Onada.
- **Via de governança.** `package.json` i `tooling/` només s'escriuen amb lease. He obert la lease Reflex `284a95f8-6dea-4fa9-bd46-81becea49e90` (risc alt, abast exacte de les dues rutes, Petorreta i manifest al bootstrap). El pla té el `Plan-SHA256` `2ec84bf8…`. L'executor l'ha acceptat (transacció `21d5fea8-4241-4a7d-8d34-a04e4826f5de`, segell de skills recalculat) i el rebut està consumit.
- **Segona passada (revisió adversarial B1–B4, confirmades i corregides):**
  - *B1, P1.* El hook encara cridava `run-portes.mjs` sense bandera. Eixe mode torna a executar el lint, les proves documentals, `test:node` i el Vitest sencer dins d'un sol pas de 120 s. A més, la Porta Build hi feia un `npm run build` (l'arbre preparat no porta mai `dist/`) que reescriu fonts versionades. Ara:
    - `git-staged.mjs` crida `run-portes.mjs --nomes-portes` (el mode que ja usa la CI), sense lint duplicat, i posa `SDP_PRE_COMMIT=1`;
    - amb eixa variable, `tractor-build-previ.mjs` només avisa d'un artefacte absent (⚪, codi 0, sense construir). Un artefacte present però invàlid continua sent error, i fora del hook res no canvia.
  - *B2.* La guarda d'auth de la Consola (`guardaConsola.test.js`) en quedava fora.
  - *B3.* En quedaven fora la detecció d'enllaços sospitosos del xat i els interns, l'HTML del Lector, l'entrada nativa i el social login, els orígens permesos i la cripto del cofre. B2 i B3 ja són a `PRECOMMIT_INCLUDE`.
  - *B4.* `test:precommit` afig ara les proves de node de migracions, d'RLS en temps real, de la fase F0 del xat i del contracte documental. Gemini proposava el mateix per a `test:documental`.
  - Escrit per l'executor amb una segona lease Reflex, `94d149d1-642f-49ef-a41e-aefafadbd5eb`: transacció `014a9f4f-91c6-4cfa-96f4-50d62fff09f4`, `Plan-SHA256` `bf60db80…`, rebut consumit.
- **Què continua bloquejant el hook** (no ho relaxe per fabricar verd): sense lease de commit, `reflex_petorreta verify --operation=git-commit` falla. Després venen:
  - `porta-documents --staged`, amb 7 errors (rebuts documentals dels informes del torn i etiquetes del Llibre Mestre);
  - `tancament --check`, amb 1.301 registres heretats: signatura del LEDGER, 1.026 `LINK_INVALID`, 242 `ESCRIPTORI_UNANCHORED` i 22 `ORPHAN_OPERATIVE`;
  - `run-portes --nomes-portes`, que sobre l'arbre preparat para a la integritat del LEDGER. Executades una per una, 29 de les 53 portes que no són proves fallen per deute heretat (mesura del revisor adversarial).

  Les portes que no són proves sumen 24,2 s i el lint de 14 a 30 s: el pas cap dins dels 120 s quan estiguen netes.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comandes, des de `socdepoble.org`. Cap prova contra Supabase real, cap PostgreSQL (no n'hi ha a l'equip, ni Docker), cap desplegament.

| Superfície | Comanda | Resultat |
| --- | --- | --- |
| Suite sencera, còpia congelada de l'arbre exacte (`84a6525c`, 18:37, amb T1–T4 de la primera passada) | `npx vitest run` | 1.274 fitxers: **21.797 passen, 1 falla, 109 omeses**, 839 s. La fallada és `src/natiu/projecteIos.test.js` (`.gitignore`), que només falla en una còpia sense repositori git (memòria del torn 261022) |
| Proves de node, mateixa còpia | `npm run test:node` | 1.031: **1.018 passen, 3 fallen, 7 omeses, 3 TODO**. Les 3 fallades (`botigues` i dos hooks de Codex) són les que només fallen fora d'un repositori git; els TODO són diagnòstics heretats |
| Lint, mateixa còpia i arbre viu final | `npm run lint` | codi 0 |
| Servei `noticies`, estat final | `npx vitest run supabase/functions/noticies` | **175/175** |
| Lector i client, estat final (abans dels retocs de T1-01) | `npx vitest run supabase/functions/noticies src/data/adaptadors/noticies src/apps/lector` | 22 fitxers, **575/575** |
| SQL estàtic de seguiments, exportació, baixa i model local | `npx vitest run src/data/supabase/seguiments.migracio.test.js src/data/localSeguiments.test.js src/data/supabase/exportacio.migracio.test.js` | **57/57**; porta RLS: 57 fitxers SQL, zero forats |
| Seguiments, client i Connectar | `npx vitest run src/data/localSeguiments.test.js src/data/supabase/seguiments.test.js src/sections/connectar` | 16 fitxers, **264/264** |
| Notes i components (T3) | `npx vitest run src/sections/notes src/components/universal` | 205 fitxers, **2.765/2.765** |
| Suite ràpida, estat final | `npm run test:precommit` | 151 fitxers, **2.927** proves de Vitest i **259** de node, 0 fallades, **23,3 s** (amb la màquina en repòs; amb una altra suite alhora, el revisor en va mesurar 47 s) |
| Porta Build dins del pre-commit, arbre preparat sense `dist/` | `SDP_ARREL=<còpia> SDP_PRE_COMMIT=1 node tooling/gates/tractor-build-previ.mjs` | ⚪ un artefacte no construït, codi 0, cap build |
| Proves de node del hook i del build | `node --test tests/git-hooks.test.mjs tests/standalone-build.test.mjs tests/node-suite-policy.test.mjs tests/mapa-consola.test.mjs` | 0 fallades. `tests/plantilla-viva-installacio.test.mjs` (suite `laboratory`) en té 2, iguals a la còpia congelada d'abans de la segona lease i alienes a este torn (blocs Context de plantilles antigues) |
| Porta d'arrel | `node tooling/gates/tractor-arrel.mjs` | A1, A2 (scripts vius), A3 i A5 en verd; A4 roja per `tooling/gates/guarda-nocturna.test.mjs`, prèvia i aliena |
| Tancament del torn de Claude | `node tooling/gates/tancament.mjs --check --turn-id torn_483710d4-afff-4198-a204-755bfbff1db1` | codi 1, estat `planned`. Passada final: 1.292 registres, **cap de propi**, tots heretats: signatura del LEDGER, enllaços trencats de la Wiki, 1.026 `LINK_INVALID`, 242 `ESCRIPTORI_UNANCHORED` i 22 `ORPHAN_OPERATIVE`. Olivera, plantilles, autoritat, segell, skills i proves documentals, codi 0. Els propis de la primera passada (seccions pendents, pla sense vincular i relleu d'ESTAT i LEDGER) ja estan resolts |

La suite sencera es va executar abans de la correcció `allSettled`, dels retocs de T2 i de la segona passada de T4. Tots els fitxers tocats després (servei `noticies`, SQL i proves de seguiments, README, configuració i scripts del pre-commit) els cobrixen les bateries dirigides i `test:precommit`, executades sobre l'estat final.

**Revisió adversarial** (workflow `wf_44f3aa0c-25f`): tres revisors independents (T1 xarxa, T2 quota i RLS, T3 i T4) i un verificador que intentava refutar cada troballa.
- T1: 2 troballes, totes dues confirmades i corregides.
- T2: 1 troballa, refutada; dos residus retocats.
- T3: cap troballa.
- T4: 4 troballes, totes confirmades i corregides.

Cap agent no va escriure a l'arbre compartit: còpies i PoC al scratchpad.

**Hashes de l'estat lliurat (SHA-256):**
- `gestor.js` `6e60984e…` abans dels retocs de comentari i proves de T1-01;
- `2610241430_seguiments.sql` i `package.json` `96541d96…`;
- `git-staged.mjs` `cbcf8b85…`;
- `tractor-build-previ.mjs` `0b4cd0f3…`.

L'arbre continua movent-se amb altres mans: abans d'un commit cal tornar a hashejar i tornar a passar la suite sobre l'arbre exacte.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res commitejat ni desplegat.** El commit, el seu abast i si es fa amb `--no-verify` els decidix el Mestre: el hook encara no pot passar pel deute heretat (Troballes, T4).
- **Migració NO aplicada.** `2610241430` continua sense aplicar a cap base de dades i va a l'ordre de desplegament de P0-21. Si una versió anterior ja s'hagués aplicat i constara a `schema_migrations`, `supabase db push` no la tornaria a executar: caldria aplicar-la a mà, i el registre naixeria buit (una hora de quota de més com a molt).
- **Sense PostgreSQL ni Deno reals.** La concurrència real de `segueix`, el nivell d'aïllament efectiu i el comportament de `Deno.resolveDns` al runtime de Supabase no estan acreditats. La comprovació posterior al desplegament és al README.
- **Decisions del Mestre** (`requires_human_decision: true`):
  1. tancar també la porta «sense resoledor al runtime» per als hosts aprovats (el catàleg deixaria de funcionar en eixe runtime);
  2. afegir `youtu.be` a `HOSTS_DEL_SISTEMA` (no hi porta cap feed);
  3. l'egrés aïllat contra el DNS rebinding;
  4. una notificació de seguiment de servidor, comptada i idempotent;
  5. purgar «MAS» de l'exportació de la Consola;
  6. el sanejament del deute que bloqueja el hook.
- **Governança.** `package.json`, `tooling/gates/git-staged.mjs` i `tooling/gates/tractor-build-previ.mjs` s'han escrit només per l'executor amb dues leases Reflex de risc alt, totes dues consumides (`284a95f8`, `94d149d1`). `vitest.precommit.config.js` és un fitxer nou de l'arrel, fora de les rutes de governança. El relleu d'ESTAT i LEDGER ha anat per una tercera lease (`f7eeadc8`, transacció `fd136140`, consumida). L'entrada del LEDGER va abans de la línia `HASH`, sense resegellar-lo. El torn no es tanca mecànicament (`--close`): el deute heretat el manté roig, i fabricar-ne el verd és el que no s'ha de fer.
- **Cap cron ni tasca de fons pròpia.** Cap cron creat; el workflow i la suite en còpia congelada han acabat. Les còpies i PoC del scratchpad no són al repositori. Un revisor va reescriure, a través de l'enllaç de `node_modules`, la memòria cau de resultats de Vitest (`node_modules/.vite/vitest/…/results.json`), com fa el hook en cada commit; cap font versionada no s'ha tocat.
- **Retroalimentació de la plantilla.** El prompt deia «6 canals» però en llistava 5 dominis i ometia Jon Hernández. Una llista blanca s'hauria de donar per hosts exactes, copiats de `fonts.json`, no per dominis escrits a mà.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1800_prompt_claude_gemini_codex_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_auditoria_codex]]
- [[261024_1800_auditoria_gemini]]
