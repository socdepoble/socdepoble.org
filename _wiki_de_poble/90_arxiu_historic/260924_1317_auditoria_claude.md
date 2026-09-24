---
type: informe
status: esborrany
description: Estudi de mapa_agentes.py d'Emowe i trasllat a la Consola Termodinàmica, diagnosi de la incidència de plantilles de MarIA i restauració de PAGE_COPY.wikidepoble.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b1464e9d-c958-43f3-89b2-40bcd8c2269f:cd47acb3-933c-4d4c-9209-9f2878bf49d6
---
# Auditoria Claude 260924: Emowe, Consola Termodinàmica, incidència de MarIA i restauració de la Wiki

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b1464e9d-c958-43f3-89b2-40bcd8c2269f:cd47acb3-933c-4d4c-9209-9f2878bf49d6 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T11:19:03.244Z |
| Modificació | 2026-09-24T12:10:00.000Z |
| Propietari | Claude (Claude Code, agent local) |
| Aprovació humana | pendent (la restauració de la Wiki i l'esborrat de `skills` sí que tenen aprovació explícita del Mestre al xat) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) |
| Tokens consumits | estimats: ~1 M de context processat i ~70 k d'eixida en cinc torns de xat; mesurats: no disponibles |
| Respon a | `260924_1245_prompt_estudi_claude.md`, `260924_1245_incidencia_protocol.md`, pla `260924_1245_pla_implementacio_claude.md` (v1.1.0) |
| Tall d'evidència | branca `backup-notes-publish`, HEAD `e6a2f68d`, arbre brut heretat; 2026-09-24 entre les 12:50 i les 14:10 (hora local) |
| requires_human_decision | true (T4, T6, T9, T11, T12 i T13) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Abans de redactar he llegit íntegrament, per aquest ordre:

1. la plantilla retornada per `document.mjs context`;
2. `.agents/protocolledge.json` (13 rutes);
3. `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` i `pla_implementacio.md`;
4. el prompt, el pla i la incidència de les 12:45.

He seguit el cicle `obrir_torn → context → create → omplir → check`. En aquest torn el hook del projecte només deixa passar `Read` i una llista curta d'ordres. Workflow, subagents, navegador, Glob, Grep, `git show` i les proves no s'han pogut executar: tot és lectura directa (vegeu Límits).

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T11:19:03Z: esborrany creat amb rebut i ancorat a l'índex de l'Escriptori.
- 2026-09-24, 12:50 aprox.: lectura de l'Escriptori, de `mapa_agentes.py` sencer i de les fonts de govern.
- 2026-09-24, 13:00 aprox.: el Mestre interromp per una incidència urgent (la targeta «Wiki de Poble» del Mur i la portada `__intro` de la Wiki han desaparegut). Diagnosi i aturada per la skill `core-restauracio-segellada`.
- 2026-09-24, 13:15–13:40: empelt de `PAGE_COPY.wikidepoble` amb el text nou de MarIA; el Mestre verifica visualment que el Mur i la Wiki es veuen bé.
- 2026-09-24, 13:50–14:10: esborrat de la clau òrfena `skills` per ordre del Mestre, redacció dels documents de `03_consola_termodinamica/` i d'aquesta auditoria.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Format de cada troballa: abast, evidència reproduïble, severitat, font de veritat en conflicte, proposta conservadora i `requires_human_decision` quan cal.

### Resum per al Mestre

- **Incident de la Wiki: tancat.**
  - Causa: la clau `wikidepoble` es va reanomenar a `skills` en el commit `a555b1ed`.
  - Agreujant: el Mur descarta en silenci les pàgines que no troba.
  - Restaurat amb el text nou de MarIA; la clau òrfena `skills` s'ha esborrat.
  - Pendent: *commit* humà (T1).
- **Frontissa de contingut, Time Machine, Format Zero Fricció i Mode AFK: dissenyats** (T2–T5). No s'han implementat: cal escriure dins de `tooling/`, i l'executor refusa mentre el segell de skills estiga divergent (T11).
- **Incidència de MarIA: la causa no és de voluntat.**
  - Les seues escriptures no passen per cap porta.
  - La plantilla del pla induïx la mutilació.
  - La doctrina es cita de memòria.
  - Llig les dates `AAMMDD` com si foren `DDMMAA`.

  El prompt de les 12:45 **no està mutilat**: el mutilat era el de les 08:45 (T6–T8).
- **Emowe → Consola: documentat en cinc peces** a `_wiki_de_poble/02_saber/03_consola_termodinamica/` (T9).

### T1 · Incident: la targeta «Wiki de Poble» del Mur i la portada de la Wiki, buides

- **Abast:** `src/sections/text/pageContent.js`, `src/sections/mur/MurSection.jsx`, `src/sections/wiki-de-poble/WikiDePobleSection.jsx`.
- **Causa:**
  - `git log -S wikidepoble -- src/sections/text/pageContent.js` dóna dos commits: `be16f668` (22-09) introduïx la clau i `a555b1ed` (24-09, 00:50, «restauració de pageContent.js») la fa desaparéixer.
  - Comparant `a555b1ed^` amb HEAD, la clau `wikidepoble` i el títol «Wiki de Poble» van passar a `skills` i «Skills». El Mestre confirma que va ser un canvi de nom en un refactor nocturn.
  - A més, MarIA havia reescrit el text de la pàgina aquella nit sense fer-ne *commit*. Aquell treball es va perdre i l'ha hagut de refer.
- **Per què no ho va vore ningú:**
  - [MurSection.jsx:42-43](../../src/sections/mur/MurSection.jsx) fa `if (!data) return null` i `.filter(Boolean)`: la targeta desapareix sense cap avís.
  - [WikiDePobleSection.jsx:35-51](../../src/sections/wiki-de-poble/WikiDePobleSection.jsx) pinta un títol per defecte, sense imatge ni text.
  - Cap porta vigila les claus de `PAGE_COPY`.
- **Una sola font per als dos símptomes:** `pageContent.js` → `src/data/sectionContent.js` → `src/data/appSeed.js` → `loadCoreContent`, que retorna `pages: seed.pages` tant en mode llavor com amb Supabase ([content.js:72](../../src/data/supabase/content.js) i :76) → `pageCopy` del Mur.
- **Reparació aplicada, amb aprovació explícita del Mestre:**
  1. S'afig `wikidepoble` com a última clau de `PAGE_COPY`, amb el text nou literal que ha passat MarIA.
  2. S'esborra la clau òrfena `skills`. Cap consumidor la llegia: cap `pageKey: 'skills'` a `src/config/sections.js`, i `PAGE_DETAIL_LOOKUP` només indexa `FEED_POSTS`.

  Resultat: `git diff --stat` = 9 línies afegides i 9 llevades a `pageContent.js`. La resta de HEAD queda intacta, inclosos els textos de `disseny` i `notes_shared`, que el Mestre confirma com a bons.
- **Severitat:** alta (contingut estructural perdut en producció local), resolta.
- **Pendent:** el *commit*. El hook d'aquesta sessió no deixa executar `git commit`. Ho fa el Mestre (ordre al final d'aquesta auditoria).

### T2 · La frontissa de contingut (revisió de la proposta de MarIA i versió consolidada)

La proposta `260924_1305_proposta_tractor_amnesia.md` (ja retirada per MarIA) tenia sis defectes:

1. **Claus equivocades.** `CRITICAL_KEYS` incloïa `mur`, `explorador` i `consola_termodinamica`, que no són claus de `PAGE_COPY` (les dos últimes són identificadors de `WikiDePobleSection.jsx`).
2. **Busca text, no l'objecte.** `content.includes(clau)` passa per casualitat de prosa: `mur` passa perquè el text nou diu «aquest mur», i qualsevol comentari amb el nom de la clau faria passar la porta.
3. **Recomana `git checkout HEAD -- …`**, que la skill `core-restauracio-segellada` prohibix expressament. En aquest incident, a més, el dany ja estava a HEAD: eixa ordre l'haguera restaurat.
4. **La col·locava al final de `run-portes.mjs`**, una cadena que no arriba mai al final (vegeu T11).
5. **La skill proposada no tenia `type` ni `status`:** no passaria l'esquema.
6. **Detecta supressions, però no canvis de nom si la paraula sobreviu, ni regressions de text.**

**Versió consolidada** (el disseny públic és a `05_actors_i_salut.md`):

- `tooling/gates/frontissa-contingut.mjs`, de només lectura, sense dependències:
  1. **Importa l'objecte real**: `import(pathToFileURL('src/sections/text/pageContent.js'))`. És ESM pur; `legalContent.js` també.
  2. **Deriva les claus obligatòries dels consumidors:**
     - els `pageKey` de `src/config/sections.js`;
     - la llista `systemPages` del Mur, que abans s'ha de moure de `MurSection.jsx` a `src/config/systemPages.js` perquè node la puga importar sense JSX;
     - la clau `wikidepoble` de la portada de la Wiki, que es mou al mateix mòdul.

     Una clau demanada per un consumidor i absent fa fallar la porta.
  3. **Empremta per clau:** `sha256(JSON.stringify(valor))` i longitud de `html`. Es guarda a `.agents/contingut_estructural.json` (zona de govern: només s'escriu amb l'executor i una llicència).
  4. **Regles:**
     - clau absent: falla sempre;
     - HTML un 30% més curt, o més: falla;
     - empremta diferent de la registrada: falla, llevat que hi haja una aprovació `{clau, sha256_nou, aprovat_per, data}` que coincidisca **exactament** amb l'empremta nova. Una aprovació no val per a un altre canvi.
  5. **Missatge de recuperació:** «no restaures fitxers sencers; recupera la clau des de `refs/time-machine/…` o des del commit anterior amb la skill de restauració segellada».
- **On s'executa:**
  - com a **primera línia** de `.husky/pre-commit`, abans i fora de `run-portes.mjs`;
  - al CI;
  - dins de `plaquetes.mjs diagnostic`, que deixa el resultat a `.immunitari/contingut.json` perquè la Consola el llija.
- **En temps d'execució** (és codi de producte, necessita pla aprovat): en desenvolupament, `MurSection` i `WikiDetail` avisen per consola quan falta una pàgina declarada, en lloc de callar.
- **Límit honest:** cap control local distingix el Mestre de MarIA quan tots dos escriuen sense arnés. La garantia forta és humana: el diff de `.agents/contingut_estructural.json` es revisa abans de fusionar.
- `requires_human_decision: true` per a moure `systemPages` a configuració i per a la ubicació del registre.

### T3 · Time Machine: instantànies automàtiques del treball

- **Problema:** el text nocturn de MarIA no estava *committejat*, i git no pot tornar el que mai ha guardat. «Restaurar» va voler dir tornar a una versió d'un mes abans.
- **Disseny:** instantànies amb l'engranatge intern de git, sense tocar la branca, l'índex ni HEAD de ningú i sense disparar cap hook. Cada 30 minuts, i només si l'arbre ha canviat:

```bash
GIT_INDEX_FILE=.git/time-machine.index git add -A
```

```bash
GIT_INDEX_FILE=.git/time-machine.index git write-tree
```

```bash
git commit-tree ARBRE -p PARE_ANTERIOR -m "tm AAAA-MM-DDTHH:MM"
```

```bash
git update-ref refs/time-machine/backup-notes-publish COMMIT_NOU
```

- **Propietats:**
  - `git add -A` amb un índex propi inclou també els fitxers nous encara no seguits (com el text de MarIA) i respecta el `.gitignore`;
  - `commit-tree` no executa hooks;
  - la referència és privada i local: ni es puja ni altera la història de la branca.
  - Si l'arbre és idèntic a l'última instantània, no escriu res.
- **Salvaguardes:**
  - llista de denegació abans d'afegir: `.env*`, `*.pem`, `*.key`, `credentials*`, `.wwebjs_auth/`;
  - avorta si en troba cap sense ignorar;
  - retenció: totes les de 48 h, una per hora durant 14 dies i una per dia després.
- **Restauració quirúrgica, fitxer a fitxer:**
  - `git log refs/time-machine/backup-notes-publish -- RUTA` per a vore les versions;
  - `git show refs/time-machine/backup-notes-publish~N:RUTA` per a llegir-ne una.
  - Mai `checkout` d'arbre sencer.
- **Llançador:** un plist germà del de Plaquetes (`StartInterval` 1800), **declarat** a `.agents/cron/registre_tasques.json` amb el format de `02_calendari.md`.
- **Mètrica de la Consola:** «minuts des de l'última instantània».
- **Límit:** una còpia local no sobreviu a una fallada del disc. `requires_human_decision: true` per a activar també el Time Machine de macOS, o una còpia externa, com a segona capa.

### T4 · Format Zero Fricció (punt 5 del pla de MarIA)

- **Límit mecànic:** la resposta al xat no és una crida d'eina. Cap hook, ni de Claude Code ni d'Antigravity, la pot interceptar ni reformatar. Un «motor» que force el format del xat no es pot construir des del repositori.
- **El que sí es pot fer:**
  1. **Canal:** tot el que passe de 4 o 5 paràgrafs va a un fitxer (AGENTS §9). Això sí que es comprova, perquè el fitxer existix o no.
  2. **La causa mecànica del «trossejat»:** quan el contingut porta blocs de codi, el primer bloc intern tanca el bloc exterior abans d'hora. Segons CommonMark, la tanca exterior ha de ser més llarga que qualsevol tira de cometes inversos de dins.

     Proposta: `tooling/brain/bloc-zero-friccio.mjs FITXER`, que imprimix el contingut dins d'una sola tanca de longitud `màxim + 1`, amb etiqueta `markdown`. L'agent enganxa l'eixida literal, sense entradetes.
- `requires_human_decision: true` per a l'script (va dins de `tooling/`).

### T5 · Mode AFK amb motor (punt 4 del pla de MarIA)

- **Estat:** el Mode AFK viu en prosa. No hi ha cap pany.
- **Disseny:**
  - `obrir_torn.mjs` escriu `.agents/runtime/afk.json` amb `{actor, turn_id, abast, caduca, rutes_propies}`;
  - `hooks-local.mjs` denega l'escriptura a qualsevol altre actor fora de les seues rutes mentre el pany estiga viu;
  - el tancament del torn el retira.

  Per a Claude i Codex això funciona hui, perquè els seus hooks s'executen.
- **Per a MarIA, l'experiment decisiu:** un hook canari a `.agents/hooks.json` que només escriga una marca de temps a `.agents/runtime/antigravity_canari.log` en cada `PreToolUse`.
  - Si la marca apareix, Antigravity executa hooks: es cablegen el pany i el Reflex.
  - Si no apareix, cap pany preventiu és possible per a MarIA, i queda la **detecció**. `checkTurn` ja compara l'inventari del torn; la Consola pintaria «escriptures fora de torn» (rutes canviades que no són de l'actor del torn).

### T6 · Incidència de MarIA: què està mutilat de veres

- **El prompt de les 12:45 no està mutilat.** Comparat secció per secció amb `prompt_local.md`:
  - hi són les 10 seccions de la ruta;
  - els blocs fixos «Context» i «Protocol de la Reunió a l'Olivera» són literals, amb els 4 punts.

  Li falten tres coses:
  - el **rebut**: la tercera casella està sense marcar i el frontmatter no porta `reflex:`;
  - el **Tall d'evidència**, que ha quedat com `[HEAD + hora]`;
  - la validació: `porta-documents` el rebutja.

  L'arrel d'aquesta millora: el 23-09 es va afegir la secció editable «Instrucció del torn», i la instrucció de cada torn ja no envaïx els blocs fixos.
- **El mutilat és el prompt de les 08:45** (`git diff` sobre l'Escriptori; ara a `90_arxiu_historic/260924_Sessio_Matinal/`):
  - dos caselles en compte de tres;
  - sense Historial i sense Riscos;
  - el bloc «Context» substituït per un d'inventat («El Context Mestre Obligatori (Llei de l'Olivera - Regla 6)»);
  - el Protocol de l'Olivera reduït a tres vinyetes.
- **El pla de les 12:45 no és vàlid** per a la ruta `pla.implementacio`: no té `## Verificació` ni `## Riscos`. La plantilla hi induïx: la «Guia editorial» posa dins de «Canvis proposats» subseccions `### 4. Pla de Verificació` i `### Vincles`, que competixen amb les seccions obligatòries homònimes. MarIA omplí la guia i s'enduu per davant les seccions reals.
- **Nom del pla.** La plantilla diu `aammdd_hhmm_pla_titol.md`; la Porta Olivera exigix el prefix `pla_implementacio`; la lliçó del 22-09 exigix el cognom de la petorreta (`pla_implementacio_estudi_claude`). Són tres regles per al mateix nom.
- **La incidència mateixa:**
  - porta `type: document` i `status: canonic`, quan una confessió en curs no és canònica;
  - la categoria «incidencia» no correspon a cap ruta;
  - no té rebut ni àncora.
- `requires_human_decision: true` per a unificar la regla del nom del pla.

### T7 · Incidència de MarIA: per què passa (causes, no culpes)

1. **Cap porta veu les seues escriptures.** `.agents/hooks.json` ho diu literalment: «Configuració declarativa; consumidor Antigravity no acreditat. Cap garantia d'activació.» Si el passara, `hooks-local.mjs` retornaria exit 2 per a qualsevol dialecte ([hooks-local.mjs:101](../../tooling/gates/hooks-local.mjs)).
   - Els tres documents de les 12:45 no porten `reflex:`, i per a Claude eixa mateixa escriptura seria un bloqueig segur.
   - Que existisquen al disc és coherent amb que el hook no s'executa per a MarIA.
   - Per als altres actors, el candat és real; per a qui escriu més petorretes, no existix.
2. **Doctrina citada de memòria.** La incidència diu que AGENTS §14 obliga a posar el context històric dins dels prompts. El §14 realment diu que, en començar la jornada, cal llegir l'última Acta Marmota i contrastar-la amb l'ESTAT; no parla dels prompts. MarIA no mutila per descuit: parafraseja una regla recordada i la paraula acaba valent més que el text.
3. **Lectura de dates `AAMMDD` com a `DDMMAA`** (troballa nova). Tres proves del 24-09:
   - el prompt de les 08:45 diu `Creació | 26-09-24 08:45`;
   - l'Acta Marmota de les 08:45 es titula «26 de setembre de 2024, 08:45»;
   - el pla de les 08:45 parla de «la sessió de refinament matinal del 26 de setembre de 2024».

   Quan el nom del fitxer és l'única font de la data, el model la gira.
4. **El cens de skills no quadra i ningú ho veu.** `core-edicio-segura` i `core-taxonomia-estricta` existixen a `.agents/skills/`, però no són a `.agents/skills_index.json` (17) ni a `.claude/skills/` (16), i la segona no té `type` ni `status`. El router mai les dispara. **Refutació pròpia:** en una primera lectura les vaig donar per inexistents; les he trobades al disc abans de tancar aquesta auditoria.
5. **Moment d'ús.** Com ja estava diagnosticat el 22 i el 23-09, la regla arriba al context al minut 0 i el document s'escriu al minut 40. Sense una porta que s'execute en el moment d'escriure, la lliçó no dispara.

### T8 · Instruccions per a refer el protocol de MarIA

1. **Una petorreta o un pla no s'entreguen sense `valid: true`.** Com que a Antigravity cap porta no s'executa sola, l'últim pas és manual i obligatori:

```bash
node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/NOM.md
```

   Si no dóna `valid: true`, el document no ix del Mas.
2. **El circuit sencer, sempre:** `obrir_torn → context → create → omplir → check`. Mai escriure el fitxer des de zero amb l'eina d'escriptura: `create` ja porta les seccions, els blocs fixos i el rebut.
3. **Dates:** dins dels documents, sempre `AAAA-MM-DD`. `AAMMDD` només al nom del fitxer, i mai es transcriu.
4. **Cita, no parafrasejes:** qualsevol regla de doctrina, amb ruta i línia, i el text literal entre cometes.
5. **Skills citades:** només les que tenen carpeta a `.agents/skills/`. Si una és al disc però no a l'índex, cal dir-ho.
6. **Fitxers estructurals** (`pageContent.js` i companyia): mai reescriure el fitxer sencer per canviar una part. Mai «restaurar» un fitxer sencer des d'una versió antiga. Si calguera, clau a clau i amb la frontissa (T2).

**Millores proposades per a `prompt_local.md` i `pla_implementacio.md`** (Olivera §4):

- Afegir a la secció 0 una quarta casella: «`document.mjs check` → `valid: true`».
- Registre:
  - «Creació: AAAA-MM-DD HH:MM», amb el format escrit a la plantilla;
  - «Tall d'evidència: branca + commit curt + hora local», demanat des del 22-09.
- Secció nova «Fonts citades»: ruta i línia de cada regla invocada.
- `pla_implementacio.md`:
  - moure la «Guia editorial» a un comentari HTML;
  - llevar-ne `### 4. Pla de Verificació` i `### Vincles`, que dupliquen seccions obligatòries;
  - unificar el nom a `AAMMDD_HHMM_pla_implementacio_COGNOM-DE-LA-PETORRETA.md`.

### T9 · Emowe → Consola Termodinàmica (resum; el detall és a la Wiki)

- **Estudiat sencer:** `mapa_agentes.py` v0.1, 1.341 línies.
  - descobriment i frontmatter;
  - cron i launchd;
  - crides i mencions;
  - entrades i eixides amb tres nivells de confiança;
  - semàfor;
  - cadenes inferides;
  - `flujos.yml`;
  - actors;
  - esquema `--json`;
  - HTML autocontingut amb 6 pestanyes, tema clar i fosc i mode privacitat.
- **Documents escrits** a `_wiki_de_poble/02_saber/03_consola_termodinamica/`, tots `status: esborrany` i amb Vincles i ancoratge, i enllaçats des d'una secció nova de `00_portada.md` sense tocar el contracte de mesura:
  - `01_fluxos_skills`
  - `02_calendari`
  - `03_inventari_skills`
  - `04_contracte_de_dades` (nou)
  - `05_actors_i_salut` (nou)
- **Delegació del pla, punt 1:** els tres fitxers de la carpeta portaven `status: draft`, que és fora de l'enum de `schema.json`. Ara porten `esborrany`.
- **Conclusions principals:**
  1. **Les heurístiques d'Emowe no servixen sobre un corpus en valencià.** Els verbs són castellans i anglesos, `V_ESC` casa la síl·laba «en» sense frontera de paraula, i la regla d'orfes marcaria orfes les skills nucli.
  2. **Ja tenim la majoria d'arestes declarades:** `protocolledge`, `CLAUDE.md`, `skills_index`, `settings.json`, `package.json`, launchd.
  3. **La Consola ha de llegir un JSON generat per node** (`sdp.mapa.v1`), no prosa.
  4. **Les skills necessiten un camp `contracte` (`llig`, `escriu`, `crida`, `programacio`)**, que exigix ampliar `tooling/wiki/schema.json` (`additionalProperties: false`).
- **Emowe i la Consola es complementen:** Emowe aporta el **Mapa**, que la nostra Consola no tenia. La nostra portada aporta el **contracte de mesura**, que Emowe no té. Les dues comparteixen la regla d'or: el que falta es pinta, no s'inventa.
- `requires_human_decision: true` per a ampliar l'esquema i per a on se servix la Consola.

### T10 · Vigilant mort: `com.socdepoble.reflex_daemon`

- **Evidència:** el plist `~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist` (`KeepAlive`) llança `tooling/wiki/core/reflex_daemon.mjs`, que no existix. El registre `/tmp/reflex_daemon.log` repetix `MODULE_NOT_FOUND`: launchd el reinicia en bucle.
- **Severitat:** mitjana. Consumix recursos i dóna una falsa sensació de vigilància.
- **Proposta:** descarregar-lo amb `launchctl bootout` (acció del Mestre, fora del repositori) o declarar-lo i reconstruir-lo dins del registre de tasques. És exactament la caixa «qui avisa quan alguna cosa es trenca» d'Emowe.

### T11 · Segell de skills divergent: bloqueja tota escriptura de govern

- **Evidència:** `node tooling/gates/segella.mjs` retorna «Ruptura de segell … hash actual 455a0fad no coincideix amb el segellat 88f0ec03», i `segell-auto` rebutja després de cada eina («Origen no acreditat»). `executor-mutacio.mjs` exigix un segell previ vàlid, així que ni la frontissa, ni el Time Machine, ni els canvis de `schema.json`, ESTAT o LEDGER es poden escriure pel circuit autoritzat.
- **Proposta:**
  1. el Mestre revisa quines skills han canviat (probablement `core-edicio-segura` i `core-taxonomia-estricta`, escrites fora de l'executor);
  2. si els canvis són bons, resegella amb `npm run porta:segella:update`;
  3. després, l'executor torna a funcionar.

  `requires_human_decision: true`.

### T12 · Higiene de l'Escriptori i de l'arrel

- **Sense àncora a l'índex.** `porta-olivera --informe` marca sense àncora `260924_1245_incidencia_protocol.md`, `260924_1245_pla_implementacio_claude.md` i `260924_1245_prompt_estudi_claude.md`. No els he ancorat: són documents de MarIA i el seu pla no es pot editar sense rebut.
- **Falsos positius del laboratori.** `porta-documents` examina `02_investigacio_ia/001 NEXUS/`: 13 fitxers d'Emowe (skills i agents d'exemple amb el seu frontmatter) apareixen com a errors de contracte. El laboratori és zona protegida (AGENTS §12), però el material de tercers enterbolix la porta. Proposta: excloure `02_investigacio_ia/` del contracte documental, o guardar el material de tercers en un format no `.md`.
- **HTML d'Emowe a l'arrel.** `Mapa de mis agentes v0.1.html` està a l'arrel del repositori, sense seguir (AGENTS §3). Conté:
  - l'inventari de la màquina (skills de `~/.claude`, crons i LaunchAgents);
  - un enllaç comercial d'Emowe i del club CD+IA, perquè el repositori no té `flujos.yml`.

  Proposta: moure'l a `02_investigacio_ia/` o esborrar-lo, i no *committejar-lo* mai.
- `requires_human_decision: true`.

### T13 · Riscos de la carpeta de la Consola

- **Slug canviat.** Moure `03_consola_termodinamica.md` a `03_consola_termodinamica/00_portada.md` canvia el slug de `03_consola_termodinamica` a `00_portada`: qualsevol enllaç wiki antic cap a la Consola queda trencat. No ho he pogut comprovar (sense Grep).
- **Nom genèric.** `00_portada` pot col·lidir amb una altra portada de la Wiki. Proposta: reanomenar-la a `00_consola_termodinamica`.
- `requires_human_decision: true`.

### T14 · El router cognitiu dispara skills per subcadena

- **Evidència:** en aquesta sessió, `sdp-pedra-seca` ha saltat en totes les peticions del Mestre (el prompt d'estudi, la incidència del Mur, l'empelt), cap de disseny. `persona_router.mjs` compara amb `includes`, i el disparador «ui» casa dins de paraules corrents («quin», «guió», «seguir»).
- **Proposta:** comparar per paraula sencera i refusar disparadors de menys de 4 lletres. És el disparador ample de `03_inventari_skills.md`.

### Resposta al Diàleg a l'Olivera del pla (MarIA → Claude)

1. `status: draft` → `esborrany`: fet (T9).
2. Incidència del Mur: resolta (T1).
3. Tractor per a les eixides de MarIA: frontissa (T2), circuit i quarta casella (T8), canari (T5).
4. Motor del Mode AFK: T5.
5. Motor de Format Zero Fricció: T4 (amb el seu límit).
6. Time Machine: T3.

No he pogut escriure aquestes respostes dins del pla: no té rebut, i la Porta Reflex bloquejaria qualsevol edició meua. Van ací. Hui no hi ha auditoria de Codex a l'Escriptori per contrastar.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Ordres executades en aquest torn, totes de només lectura, i el seu resultat:

- `node tooling/gates/porta-olivera.mjs --informe`: exit 1. 3 documents solts; pla de hui present; 3 sense àncora (els de les 12:45); 3 àncores a documents absents.
- `node tooling/gates/porta-documents.mjs`: exit 1. 16 documents examinats. Els errors són els 13 fitxers d'Emowe de `001 NEXUS/` i els tres documents de les 12:45 (sense rebut ni àncora). Aquesta auditoria encara no existia.
- `node tooling/gates/porta-plantilles.mjs`: «✅ 13 rutes: la plantilla i el contracte diuen el mateix».
- `node tooling/gates/segella.mjs`: exit 1, segell divergent (455a0fad contra 88f0ec03).
- `git log -S wikidepoble --format='%h %ad %an %s' --date=iso -- src/sections/text/pageContent.js`, executat pel Mestre: `a555b1ed` i `be16f668`.
- `git diff --stat --no-ext-diff --no-textconv` després de la reparació: `src/sections/text/pageContent.js | 18 +-` (9 afegides i 9 llevades); cap altre fitxer de `src/` tocat per mi.
- Verificació visual del Mur i de la Wiki: feta pel Mestre («l'empelt ha sigut un èxit rotund»). Jo no la vaig poder fer: el navegador està bloquejat pel hook.
- `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260924_1317_auditoria_claude.md`: s'executa després d'aquesta escriptura; el resultat és a la resposta del xat.

**No executat:** `npm test`, `npm run lint`, `npm run build`, `npm run porta` ni `tancament.mjs`. Cap d'ells és a la llista d'ordres que el hook permet.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook de sessió.** El `PreToolUse` de `.claude/settings.json` no té `matcher` i s'aplica a totes les eines: Workflow, subagents, navegador, Glob, Grep, `git show` i qualsevol shell que no siga una lectura auditada estan denegats. No he pogut llistar directoris; els fitxers els he trobat seguint imports, el diff de `wikiManifest.js` i les eixides de les portes.
- **Dades de l'HTML d'Emowe.** Les dades incrustades a `Mapa de mis agentes v0.1.html` (una sola línia d'uns 31 k tokens) no s'han pogut llegir. El que diu aquesta auditoria sobre com funcionaria Emowe amb el nostre corpus és anàlisi del codi, no lectura del mapa generat.
- **Material no obert.** `mapa-visual-agentes.zip` no s'ha obert. Els fitxers de `001 NEXUS/agents` i `skills` els conec només pels errors de `porta-documents`.
- **Governança bloquejada.** No he pogut escriure a `.agents/` (ESTAT, LEDGER, skills, lliçons) ni a `tooling/`: ruta de govern i segell divergent (T11). El torn `torn_b1464e9d-c958-43f3-89b2-40bcd8c2269f` queda obert, sense relleu a ESTAT i LEDGER i sense `tancament.mjs`.
- **Enllaços no comprovats.** No he pogut verificar els enllaços entrants a l'antic slug de la Consola (T13).
- **Arxiu històric.** No he llegit cap fitxer de `90_arxiu_historic/` directament. El prompt de les 08:45 l'he vist a través del `git diff` de l'Escriptori.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1245_prompt_estudi_claude]]
- [[260924_1245_pla_implementacio_claude]]
- [[260924_1245_incidencia_protocol]]
- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
