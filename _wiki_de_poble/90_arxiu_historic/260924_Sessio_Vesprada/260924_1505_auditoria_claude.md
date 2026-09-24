---
type: informe
status: esborrany
description: 'Execució del prompt 1500: tractor que rebutja prompts i plans fora de plantilla, Consola amb pestanyes i explorador, i avaluació de skills i etiquetes'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d89462df-a8bb-4fff-ae36-712a29c70c79:de18ceae-fd1c-4bfb-9aef-9d664c0cd887
---
# Auditoria Claude 260924 1505: tractor de plantilles, Consola en pestanyes i avaluació de skills

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d89462df-a8bb-4fff-ae36-712a29c70c79:de18ceae-fd1c-4bfb-9aef-9d664c0cd887 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T13:04:34.314Z |
| Modificació | 2026-09-24, mateix torn; l'hora de tancament no es pot mesurar (la shell `date` està denegada) |
| Propietari | Claude (Claude Code, agent local) |
| Aprovació humana | aprovat per a implementar (el Mestre va enganxar el prompt 1500 al xat); pendent per a D1–D8 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) |
| Tokens consumits | estimats: ~600 k de context llegit i ~75 k d'eixida; mesurats: no disponibles |
| Respon a | `260924_1500_prompt_claude.md` i `260924_1500_pla_implementacio_claude.md` |
| Tall d'evidència | branca `backup-notes-publish`, HEAD `57ec5684`, arbre brut heretat; torn obert a les 13:04Z (15:04 hora local) |
| requires_human_decision | true (D1–D8, vegeu el resum) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Circuit seguit: `obrir_torn` → `document.mjs context` (plantilla llegida sencera) → `create` → este contingut → `check`. Abans de tocar res vaig llegir sencers:
- el prompt 1500 i el seu pla;
- `.agents/protocolledge.json` i `tooling/wiki/schema.json`;
- els documents 02 i 03 i el contracte 04 de `02_saber/03_consola_termodinamica/`;
- l'HTML d'Emowe, llevat del blob de dades de la línia 203, que són dades de la seua màquina;
- les 22 `SKILL.md` de `.agents/skills/` i `00_INDEX_SKILLS.md`;
- el codi de totes les portes que em podien bloquejar: `hooks-local`, `mutation-policy`, `command-policy`, `core`, `turns`, `segella`, `executor-mutacio`, `reflex_petorreta` (1.037 de 1.586 línies) i `git-staged`;
- l'auditoria 1410 de l'altre torn de Claude (`90_arxiu_historic/260924_Sessio_Vesprada/`), en una lectura nominal i explícita, no de RAG.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T13:04Z: torn `torn_d89462df-a8bb-4fff-ae36-712a29c70c79` obert (abast `code`); esborrany d'esta auditoria creat amb rebut i ancorat.
- Mateix torn:
  - tractor de la plantilla viva i 12 proves al laboratori;
  - Consola en sis pàgines, amb explorador, calendari, inventari, entrades i eixides, i privacitat, a `src/` (15 proves vitest);
  - graf universal generalitzat sense canviar la Wiki;
  - avaluació de les 22 skills;
  - àncores de l'Escriptori reapuntades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

- **Fet a `src/`, sense vore-ho pintat:**
  - la Consola té sis pàgines (Pols, Explorador del cervell, Calendari, Inventari de skills, Entrades i eixides, i Avisos i salut) i un interruptor de Privacitat;
  - totes les pàgines estan construïdes amb peces del catàleg Pedra Seca, sense cap classe CSS nova (T4);
  - el graf de la Wiki continua pintant-se igual: el component ara accepta dades, estil i forces.
- **Fet i en quarantena (T3):** el Tractor Salvavides de MarIA, a `02_investigacio_ia/260924_1505_tractor_plantilles_claude/`. És un vigilant del sistema de fitxers: no depén de l'arnés de qui escriu, i Antigravity no executa els hooks de Claude.
- **Fet a l'Escriptori:** 5 àncores penjades, reapuntades a l'arxiu; els dos documents 1500, ancorats com a «fora de plantilla». `porta-olivera --informe` passa de roig a verd.
- **Avaluat, no tocat (T5 i T6):** les 22 skills, les etiquetes i les propietats d'Obsidian. Tot és governança o una escombrada sense superfície aprovada.
- **No fet (T2 i T7):**
  - `publication-policy.mjs`: el contracte de dades diu el contrari que el pla, i `tooling/` està tancat;
  - relleu d'ESTAT i LEDGER, `tancament.mjs` i commit: el hook ho denega. El text del relleu va al final.
- **Decisions teues:**
  - **D1–D5** de l'auditoria 1410, que seguixen obertes;
  - **D6** · obrir al hook les eines de lectura (subagents, workflows, navegador, Glob i Grep);
  - **D7** · excloure `90_arxiu_historic` i `001 NEXUS` del vault d'Obsidian;
  - **D8** · què fem amb el contracte del graf, que ja no casa ni amb les carpetes ni amb el teu ús d'Obsidian.

### T1 · El pla 1500 torna a demanar faena feta i amaga les decisions pendents

- Entre les 12:07Z i les 12:36Z, un altre torn de Claude (`torn_521ee9db`) va construir el Mapa de la Consola a `src/sections/consola/mapa/`: compilador pur, validació, panell i 40 proves.
- Va deixar al laboratori, en quarantena, la closca que llig el disc (`mapa_consola.mjs`), la ruta del middleware, la frontissa, el Time Machine i la porta de taxonomia.
- Va tancar amb cinc decisions per a tu (D1–D5).
- Després, algú va moure l'auditoria 1410 a `90_arxiu_historic/260924_Sessio_Vesprada/` sense `handoff` ni àncora, i va escriure el pla 1500. El pla no cita ni l'auditoria ni les decisions.
- Per això «generar el Mapa JSON» (criteri d'acceptació del prompt) no depén de picar més codi. Depén de D3 (resegellar) i D4 (instal·lar el laboratori). Les ordres exactes són a C7 i C8 de l'auditoria 1410, i continuen vigents.

### T2 · El candau: per què cap agent pot complir la meitat del pla

- **Segell trencat.** `node tooling/gates/segella.mjs` torna «455a0fad ≠ 88f0ec03».
  - El manifest segellat té 21 fitxers i no inclou `core-taxonomia-estricta/SKILL.md`, que sí que existix.
  - `executor-mutacio.mjs:42` es nega a escriure amb el segell invàlid.
  - El resegellat (`segella.mjs:87`) exigix el hash complet, l'anterior i un motiu, i el hook no deixa executar-lo a cap agent.
- **Lease de govern.** Encara amb el segell bo, escriure a `tooling/`, `.agents/`, `.husky/` o `package.json` demana una lease `governance-write` de `reflex_petorreta.mjs` (`open` i `seal`). L'`open` només el pot executar un humà des del terminal.
- **Hook sense `matcher`.** `.claude/settings.json:32-41` aplica `hooks-local.mjs` a totes les eines, i la línia 85 denega tota eina que no siga d'escriptura documental. Cauen Agent, Workflow, AskUserQuestion, el navegador, Glob i Grep. Conseqüències:
  - l'ordre ultracode no s'ha pogut complir: cap workflow ni revisor independent ha corregut, i la refutació ha sigut meua i manual;
  - cap verificació visual: `tabs_context` torna «BLOQUEIG»;
  - cap prova executada: `npm test`, `vitest`, `node --test` i `eslint` no són a la llista de lectures de `mutation-policy.mjs:43-66`;
  - les preguntes van per escrit perquè el diàleg de preguntes també està denegat.
- **D6 (proposta):** afegir a `knownRead` de `mutation-policy.mjs:53` les eines de lectura pura: Glob, Grep, `Agent` amb `subagent_type: Explore` i les del navegador. Afegir també `npx vitest run` i `node --test tests/*.test.mjs` a `READ_NODE_COMMANDS`. És un canvi de govern: el decidixes tu.

### T3 · Tractor Salvavides de MarIA (fet, en quarantena)

**El forat que tapa.** `validateDocument` (`tooling/documental/turns.mjs:109-113`) no sap la ruta d'un document sense rebut. Hi afig l'error del `reflex`, l'esquema, i ja no mira seccions, blocs fixos ni Registre. Evidència d'este torn:
- `document.mjs check` sobre el prompt 1500: **1** error (`reflex`);
- sobre el pla 1500: **3** errors (`reflex` i dos tags fora de l'enum), però al pla li falten sis de les set seccions de la ruta `pla.implementacio`: Acte reflex, Historial, Canvis proposats, Verificació, Riscos i Vincles.

El validador li diu a MarIA que ho té quasi bé. Per això no aprén.

**Per què un vigilant, i no un hook.** MarIA escriu des d'Antigravity. `.agents/hooks.json` declara hooks d'Antigravity sense consumidor acreditat (`02_calendari.md`, taula). Una porta dins de l'arnés de Claude no la veu. Un procés de launchd que vigila la carpeta, sí: vigila tant Antigravity com Codex, un humà o un `sed`.

**Què fa `porta_plantilla_viva.mjs`** (destí `tooling/gates/porta-plantilla-viva.mjs`):
- **Superfície declarada:** primer nivell de `04_escriptori/`, documents de les categories `prompt`, `macro_prompt`, `micro_prompt`, `petorreta`, `pla` i `pla_implementacio`, més qualsevol `.md` amb nom lliure que diga «prompt», «petorreta» o «pla». Detecta també els noms en majúscules, que així no se n'escapen.
- **Nivell `estructura`**, el que s'exigix en desar:
  - nom taxonòmic;
  - rebut de `document.mjs context` vinculat a este fitxer;
  - ruta del rebut coherent amb la categoria del nom;
  - les claus de frontmatter que porta el bloc `SDP:EIXIDA` de la plantilla, i l'esquema;
  - `type` de la ruta;
  - les seccions de la ruta, en el seu ordre, sense repetides ni afegides;
  - els blocs fixos, literals;
  - les files del Registre.

  Una secció encara pot dir «[pendent]». Està calibrat: un esborrany acabat d'eixir de `create` suspén `check` amb 5 errors, i el vigilant no el pot tirar mentre es completa.
- **Nivell `complet`** (`--complet`): l'anterior més `validateDocument` sencer. És per al tancament.
- **Tot alhora:** retorna la llista sencera d'incompliments i les ordres de recuperació (`obrir_torn` → `context` → llegir → `create`).
- **Vigilant** (`--vigila --quarantena --avisa`):
  - mou a `.sdp-paperera/plantilles/` el document **sense rebut** que no passa;
  - hi deixa un `.rebuig.json` amb els errors i la recuperació;
  - avisa amb una notificació de macOS.
- **Límits del vigilant:**
  - mai mou un document amb rebut o citat per un torn, perquè trencaria el registre del torn: eixos es denuncien;
  - mai esborra;
  - els documents que ja hi són quan arrenca es denuncien i no es mouen;
  - un humà que vulga esborranyar a mà ho fa a `00_bandeja_d_entrada/`, que queda fora.
- **Proves:** `porta_plantilla_viva_test.mjs`, amb 12 casos:
  - catàleg, noms lliures i deducció de ruta;
  - document fidel amb seccions pendents;
  - tots els incompliments alhora;
  - claus de la plantilla, ordre i repetició;
  - encapçalament dins de codi;
  - quarantena, sense trepitjar un fitxer que ja hi era i fora del primer nivell;
  - vigilant de punta a punta amb un revisor injectat;
  - plist.

**Instal·lació (D4 bis).** `tooling/` i `tests/` no estan segellats: no cal resegellar per a copiar-los.

```bash
cp "_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1505_tractor_plantilles_claude/porta_plantilla_viva.mjs" tooling/gates/porta-plantilla-viva.mjs
```

```bash
cp "_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1505_tractor_plantilles_claude/porta_plantilla_viva_test.mjs" tests/porta-plantilla-viva.test.mjs
```

```bash
node --test tests/porta-plantilla-viva.test.mjs
```

```bash
node tooling/gates/porta-plantilla-viva.mjs --escriptori
```

```bash
node tooling/gates/porta-plantilla-viva.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist
```

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist
```

- `--escriptori` hauria de denunciar els dos documents 1500 i ningú més. Si en denuncia algun altre, és una troballa: ensenya-me-la abans d'activar la quarantena.
- **Pre-commit:** una línia a `tooling/gates/git-staged.mjs:40`. Cal afegir `['tooling/gates/porta-plantilla-viva.mjs','--staged']` a la llista, darrere de `porta-documents`.
- **`package.json`:** `"porta:plantilla-viva": "node tooling/gates/porta-plantilla-viva.mjs --escriptori"`, i afegir la prova a `test:node`.
- **Relació amb `core-taxonomia-estricta`:** és la versió en prosa d'este mateix tractor. Té el frontmatter invàlid i no la carrega cap cens (T5). Quan el vigilant corra, la proposta és retirar-la.

### T4 · Consola Termodinàmica en sis pàgines (fet a `src/`)

**Pàgines.** Una per cada peça de `03_consola_termodinamica/`, amb les sis pestanyes d'Emowe traduïdes:

| Pàgina | Document | Pestanya d'Emowe |
| --- | --- | --- |
| Pols | `00_portada` | «cifras» de dalt |
| Explorador del cervell | `01_fluxos_skills` | «Flujos trabajo skills» i el graf d'Obsidian de la teua captura |
| Calendari | `02_calendari` | «Calendario» |
| Inventari de skills | `03_inventari_skills` | «Skills» |
| Entrades i eixides | `01_fluxos_skills` | «Entradas y salidas» |
| Avisos i salut | `05_actors_i_salut` | cap; és el panell del Mapa del torn 1410 |

**Explorador del cervell** (`ExploradorMapa.jsx`). És el panell de filtres d'Obsidian parlant el contracte `sdp.mapa.v1`:
- **Filtres:** un interruptor per cadascun dels 9 tipus de peça (amb el recompte), un per als òrfens i un per cada confiança (declarat, derivat i inferit).
- **Cerca:** mostra la coincidència i els seus veïns, com Obsidian.
- **Visualització:** fletxes; densitat compacta, normal o espaiada (la «espaiada» porta la teua distància d'enllaç, 250).
- **Detall del node:** què llig, què escriu, a qui crida, qui el crida, els avisos, i si és una caixa opaca.
- **Traç:** una relació inferida de la prosa es pinta discontínua.

**Calendari** (`CalendariMapa.jsx` i `calendariMapa.js`):
- **Caixes per cadència:** diàries, setmanals, mensuals, altres, residents, en arrencar, per esdeveniment i sense cadència.
- **Mes:** navegable, de dilluns a diumenge, dins d'una `Taula` accessible.
- **Regles:**
  - `regla_cron` d'Emowe;
  - una cadència en segons de setmanes o mesos no té dia fix i no es pinta al mes;
  - sense cadència declarada no hi ha punt: el que falta es pinta, no s'inventa.

**Inventari de skills.** Semàfor d'Emowe (3 avisos o més, roig; 1 o 2, ambre; cap, verd), filtres i cens a quatre bandes: disc, índex, Claude i segell.

**Entrades i eixides.** Per a cada skill i cada ruta: què llig, què escriu, qui la crida i a qui crida. Hui quasi totes les skills eixiran «caixa opaca», i és veritat: cap declara el camp `contracte` que proposa `04_contracte_de_dades.md`.

**Privacitat.** Un `Interruptor` canvia per punts totes les rutes, ordres i empremtes que la Consola pinta amb `<Mono>`. El lector de pantalla diu «dada amagada». Com vas dir, hui no hi ha res marcat com a privat.

**Decisions de construcció:**
- **Components:** només peces del catàleg (`Pestanyes`, `Interruptor`, `PillToggle`, `Camp`, `Taula`, `Insignia`, `UniversalCard`, `EstatBuit`, i `BrainGraph`). Pedra Seca §9 prohibix programar un component que no tinga referent al catàleg de disseny.
- **CSS:** cap classe nova.
- **Muntatge:** només es munta la pestanya activa, de manera que el graf no simula amagat. El Mapa es llig una vegada per a totes (`useMapa.js`).
- **`BrainGraph.jsx` i `useForceLayout.js`:** accepten `graf`, `estil`, `forces`, `fletxes`, `textos` i `renderDetall`. Sense eixes props, el camí de dibuix és el mateix d'abans i la Wiki no canvia cap píxel. Les proves existents de `BrainGraph.test.jsx` no tenen cap motiu per a canviar.

**Canvis visuals conscients:**
- el panell del Mapa passa de baix de tot a la pàgina «Avisos i salut»;
- al diàleg de rebuts, la ruta de cada font ara va en `<Mono>` perquè la Privacitat la puga amagar.

**Sense dades fins a D4.** Mentre el compilador i la ruta `/__iaia/mapa.json` estiguen al laboratori, les pàgines 2–6 diuen «Mapa no disponible» i expliquen per què.

**Pendent:**
- **llegenda de colors del graf:** necessita un espècimen al catàleg (§9);
- **«Agentes atómicos»:** no hi ha dades (cap skill declara `contracte`);
- **plànol d'actors:** `05_actors_i_salut` demana un component nou.

**Glossari de la traducció:**

| Emowe (castellà) | Consola (valencià) |
| --- | --- |
| Flujos trabajo skills | Explorador del cervell |
| Entradas y salidas · qué lee · qué produce · dónde | Entrades i eixides · què llig · què produïx · on |
| declarado · inferido · supuesto | declarat · inferit · derivat (el tercer nivell del contracte) |
| caja opaca | caixa opaca |
| Calendario · diarias · semanales · mensuales · hoy | Calendari · diàries · setmanals · mensuals · hui |
| lo que corre solo · nadie la lanza | el que corre sol · ningú la llança |
| Privacidad · piezas ocultas | Privacitat · dada amagada |
| huérfana · llama a · la llaman | òrfena · crida · la criden |
| tocadas en 30 días · con avisos · solo las mías | amb avisos · òrfenes · fora d'algun cens · nucli |

### T5 · Avaluació de les 22 skills

**Cens.** Els quatre comptadors no donen el mateix nombre:

| Cens | Skills | Font |
| --- | --- | --- |
| Disc | 21 | `.agents/skills/*/SKILL.md` |
| Índex | 20 | `00_INDEX_SKILLS.md`; no porta `core-taxonomia-estricta` |
| Segell | 20 | no porta `core-taxonomia-estricta` |
| Catàleg de Claude | 16 | la llista de skills d'esta mateixa sessió |

Cinc skills són inabastables per a Claude: `core-automillora`, `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori` i `core-taxonomia-estricta`. És la busca de `core-estrategia-ia` de la teua captura d'Obsidian.

**Defectes transversals:**
- **`\n` literal davant del títol** en quatre skills: `sdp-app-grid-shell:11`, `sdp-casos-us-essencials:12`, `sdp-estudi-mercat:11` i `wiki-propagar-veritat:11`. L'H1 no és un títol sinó un paràgraf que comença per «\n#».
- **Ferida del `sed` Offline→Online** a `wiki-propagar-veritat`:
  - la línia 13 diu «canviem d'estratègia Online-First a online-first»;
  - la línia 17 diu «`Online-First`, `Online-First`».
- **Contradiccions amb la doctrina:**
  - `core-automillora` §2.1 diu que MarIA és «l'ÚNICA entitat amb permís per escriure codi» i que Claude i Codex «NO tenen permisos d'edició». El prompt 1500 diu «Tens l'autoritat per a picar codi»;
  - `core-consell-i-colmena` §1 obliga a nomenar el Consell amb `node -e …`, i el hook denega `node -e` a Claude;
  - `wiki-cicle-de-vida` pas 1 dóna `obrir_torn.mjs … --output /tmp/torn-NOM.json`, i `command-policy.mjs:71` refusa `--output`.
- **Frontmatter invàlid contra `schema.json`:**
  - `core-taxonomia-estricta` no porta `type` ni `status`;
  - `core-restauracio-segellada` porta `eines_obligatories` com a llista, i l'esquema diu `string`;
  - per recompte manual, tres descripcions passen de 220 caràcters: `core-context-panic` (~243), `core-memoria-historica` (~230) i `sdp-casos-us-essencials` (~270). La porta de frontmatter ho ha de confirmar.
- **Disparadors:**
  - huit de decoratius (1410, C3);
  - «core» (`core-automillora`) casa amb qualsevol paraula que el continga;
  - «error» casa amb qualsevol traça;
  - «ui» casa amb «quin» i «seguir»;
  - «estrategia», sense accent, no casa amb «estratègia».

**Proposta per skill.** És una mutació de govern: es fa d'una tacada, amb lease, després de D3.

| Skill | Proposta |
| --- | --- |
| `core-automillora` | reescriure §2.1 amb la jerarquia real, o retirar la skill; tags `[aprenentatge, col·laboració]`; entrar-la al catàleg de Claude |
| `core-consell-i-colmena` | canviar `node -e` per «llig `.agents/consell.json`» |
| `core-context-panic` | descripció de 220 caràcters o menys; disparador «error» → «bucle d'errors» |
| `core-edicio-segura` | entrar-la al catàleg; disparadors reals: «replace_file_content», «reescriure el component» |
| `core-estrategia-ia` | tags `[consell, maquina]`; disparadors «consum», «estratègia», «crèdits», «tokens»; entrar-la al catàleg: és la font dels panells Consums i Crèdits |
| `core-higiene-escriptori` | canviar `ls -l` per `porta-olivera --informe`; entrar-la al catàleg |
| `core-identitat` | disparador real («qui soc», «identitat»), o declarar-la d'arrencada |
| `core-memoria-historica` | descripció sense `_arxiu_wiki_de_poble` (el cos ja ho nega); tags `[memòria, aprenentatge]` |
| `core-restauracio-segellada` | descripció que diga què fa i quan; `eines_obligatories` com a text |
| `core-taxonomia-estricta` | retirar-la quan el vigilant de T3 corra |
| `sdp-app-grid-shell`, `sdp-estudi-mercat`, `sdp-casos-us-essencials`, `wiki-propagar-veritat` | llevar el `\n` literal |
| `sdp-casos-us-essencials` | descripció curta; tags `[saber]` |
| `sdp-estudi-mercat` | tags `[saber]` en lloc d'`[escriptori]` |
| `sdp-universal-page` | tags `[disseny]` en lloc de `[core]` |
| `sdp-calendari-agricola` | tags `[saber]` |
| `wiki-propagar-veritat` | restaurar l'exemple Offline-First → Online-First |
| `wiki-cicle-de-vida` | llevar `--output` del pas 1 |

Les descripcions de `sdp-pedra-seca`, `sdp-workflow`, `wiki-busca-skills`, `wiki-documentacio-i-reflex` i `sdp-universal-page` diuen el que fan. Només manca, a totes, el «quan s'activa» en la mateixa frase.

### T6 · Etiquetes, propietats i òrfens d'Obsidian (les teues captures)

- **L'anell d'òrfens és sobretot arxiu.** El `graph.json` d'ara té `showOrphans: true`, `showAttachments: true` i `search: ""`, és a dir, sense cap exclusió. El graf pinta tot `90_arxiu_historic/`, l'Escriptori i els adjunts: els punts taronja són adjunts i els verds, etiquetes. Si tornes a posar `-path:"90_arxiu_historic"` al filtre, l'anell s'encongix fins als òrfens reals.
- **El contracte del graf està ranci (D8).** `reflex_petorreta.mjs:216-237` exigix `showOrphans: false`, `showAttachments: false` i cinc exclusions i quatre grups de color de carpetes que ja no existixen (`00_SER_Brain_Identitat`, `01_SABER_Cultura_Coneixement`…). Hui el vault té `01_ser`, `02_saber` i `03_actuar`, i el `graph.json` modificat trenca el pany de la línia base de la Wiki. Opcions:
  - (a) actualitzar el contracte a les carpetes vigents i deixar-te els interruptors de visualització;
  - (b) tornar el `graph.json` al contracte.
- **Etiquetes fora de l'enum de `schema.json`:** `claude` (11), `ui` (6), `olivera` (4), `opus` (4), `tancament` (4), `allucinacio` (3), `cognitiu` (3), `ultracode` (3), `consola` (2), `wiki-integrada` (2) i `arquitectura_cognitiva` (1).
- **Colors que Obsidian llig com a etiquetes:** `0984E3` (el blau del cànon, `tokens.css:66`), `5e9400` i `a25ecc`. Són `#RRGGBB` escrits en prosa fora de codi. Arreglar-ho és posar-los entre accents greus; es troben fent clic a l'etiqueta.
- **Propietats fora de l'esquema:**
  - `tipo`, `visibilidad` i `ultimo_uso_tablero` són claus en castellà. Hipòtesi no verificada (no puc llistar carpetes): venen de `02_investigacio_ia/001 NEXUS/`, el material d'Emowe;
  - `destinatari` i `recipient` venen de prompts arxivats;
  - `cssclasses` és d'Obsidian mateix.
- **Per què no ho he netejat:**
  - és una escombrada sense superfície aprovada (lliçó 260923);
  - bona part viu a `90_arxiu_historic/`, que no es toca, o a `01_produccio/`, que és teua.
- **D7:** posar `90_arxiu_historic/` i `02_investigacio_ia/001 NEXUS/` a «Fitxers exclosos» d'Obsidian (`.obsidian/app.json`, `userIgnoreFilters`). Els panells d'etiquetes, de propietats i el graf mostrarien només el Mas viu, sense moure cap fitxer.

### T7 · `publication-policy.mjs`: per què no l'he tocat (D2)

- **El contracte i el pla diuen el contrari:**
  - `04_contracte_de_dades.md`, «On viu l'eixida», diu que el Mapa i la maquinària no han d'entrar ni al manifest públic, ni al RAG, ni al paquet de WordPress;
  - el pla 1500 diu «fer públic el cervell»;
  - la directiva de l'àudio de les 14:05, citada pel torn 1410, deia «en entrar com a superusuari».
- **Fer-lo públic no és una línia.** `publicWikiFiles` alimenta quatre exportadors (manifest, slugs, RAG i SEO) i el paquet de WordPress, i arxivar no despublica. Les skills descriuen les portes i on fallen: publicar-les és donar el plànol de les defenses.
- **Si el repositori de GitHub ja és públic, les skills ja ho són.** Aleshores la decisió és només si l'aplicació les ensenya.
- **Recomane, com el torn 1410:** superadministració, amb el JSON compilat i sense rutes locals. La Consola ja té Privacitat per a gravar pantalla.
- **Per a tocar `tooling/`** calen D3 i la lease.

### T8 · Millores per a `prompt_local.md` (Olivera §4)

- **El prompt 1500 declara el que no ha fet:**
  - marca «[x] Rebut obtingut» i el Registre diu «Rebut: sdp:torn:pendent»;
  - la Creació està girada: «26-09-24».

  El tractor de T3 convertix eixes caselles en una comprovació.
- **Contradicció interna, repetida del torn 1410:** la «Instrucció del torn» cedix l'execució i el bloc fix de l'Olivera diu «Cap línia de codi es tocarà». Proposta: un camp «Mode: auditoria | execució» al Registre, i un bloc Olivera que el llegisca.
- **Una casella nova a la secció 0:** «`node tooling/gates/porta-plantilla-viva.mjs --fitxer CAMÍ` → valid: true».

### Relleu proposat per a ESTAT i LEDGER (per a enganxar-lo qui tinga permís)

```markdown
## ESTAT_ACTUAL · 260924_1505 · Claude · Consola en sis pàgines, tractor de plantilles en quarantena

- Torn `torn_d89462df-a8bb-4fff-ae36-712a29c70c79` (code). Entrega [[260924_1505_auditoria_claude]].
- Fet a src/: Consola en pestanyes (Pols, Explorador del cervell, Calendari, Inventari, Entrades i eixides, Avisos i salut) i Privacitat; BrainGraph i useForceLayout accepten dades i forces sense canviar la Wiki; 15 proves vitest no executades.
- En quarantena (02_investigacio_ia/260924_1505_tractor_plantilles_claude/): porta-plantilla-viva (vigilant de launchd) i 12 proves node.
- Escriptori: 5 àncores reapuntades a l'arxiu; porta Olivera verda.
- Pendent del Mestre: D1–D5 (auditoria 1410), D6 hook de lectura, D7 exclusions d'Obsidian, D8 contracte del graf. Commit pendent.
```

```markdown
260924 | torn | Claude | Consola en pestanyes, tractor plantilla viva, avaluació de skills
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Ordres executades en este torn (de lectura o documentals autoritzades) i el seu resultat:

- `node tooling/gates/segella.mjs`: exit 1, ruptura 455a0fad contra 88f0ec03.
- `node tooling/wiki/document.mjs check`:
  - sobre el prompt 1500: 1 error (`reflex`);
  - sobre el pla 1500: 3 errors (`reflex` i `tags[1]`, `tags[2]` fora de l'enum);
  - sobre l'esborrany acabat de crear d'esta auditoria: 5 errors de seccions i Registre pendents, que és la calibració del nivell `estructura` de T3.
- `node tooling/gates/porta-plantilles.mjs`: «✅ 13 rutes: la plantilla i el contracte diuen el mateix».
- `node tooling/gates/porta-olivera.mjs --informe`:
  - abans: exit 1, amb dos documents sense àncora i cinc àncores penjades;
  - després de reapuntar: sense cap error ni avís.
- `node tooling/gates/design_guard.mjs --arrel=src`, amb tot el codi nou: «297 fitxers, 41 critics, 5 avisos. PASSA. El deute de disseny no puja». 41 és la mateixa línia base.
- `obrir_torn`, `context` i `create`: torn `torn_d89462df-…`, rebut `…:de18ceae-…`, estat `draft`.
- Denegats pel hook, i per això res del que segueix està comprovat en execució: `Agent`, `mcp__Claude_Browser__tabs_context`, `npm test`, `npx vitest`, `node --test`, `eslint` i `npm run build`.
- **Traçat manual de proves.** Cada `expect` i cada `assert` s'ha contrastat línia a línia amb el codi:
  - 12 proves node del tractor;
  - 8 de `grafMapa.test.js`;
  - 7 de `calendariMapa.test.js`, amb el càlcul a mà que l'1-09-2026 és dimarts i el 24-09-2026 és dijous.

  En traçar-les vaig corregir dos errors abans d'entregar: l'ordre de les caixes opaques, que Emowe posa al final, i un càlcul redundant del calendari.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook sense `matcher` (T2).** Cap workflow, cap subagent, cap revisor independent, cap navegador i cap prova executada. La revisió adversarial és meua i manual. Cap prova d'este document s'ha d'entendre com a passada.
- **Cap verificació visual.** Les sis pàgines no s'han vist pintades. S'han de mirar a `http://localhost:3340/consola`, i també a la Wiki, dins de l'element «Consola Termodinàmica».
- **Governança tancada.** Cap escriptura a `.agents/`, `tooling/`, `.husky/` ni `package.json`. Per això el tractor és al laboratori, les skills no s'han tocat i el relleu va com a text.
- **Hipòtesis marcades com a tals:**
  - l'origen de les propietats en castellà (`001 NEXUS`);
  - les llargàries de les descripcions (recompte manual);
  - els recomptes d'etiquetes (llegits de la teua captura, no del disc).
- **Arbre concurrent.** MarIA pot escriure a l'Escriptori mentre este torn corre (torn 1410, C10). Els fitxers de `src/` i del laboratori són d'este torn; no puc garantir que ningú els toque després.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1500_prompt_claude]]
- [[260924_1500_pla_implementacio_claude]]
- [[04_contracte_de_dades]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[taxonomia_documental]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
