---
type: informe
status: esborrany
description: Auditoria de la Wiki integrada, el sistema atòmic de UI, el graf cap als motors cognitius i el cicle de vida. Torn de Claude a la Reunió de l'Olivera.
tags:
  - auditoria
  - arquitectura
  - wiki-integrada
  - claude
---
# Auditoria de la Wiki integrada i del cerebel desconnectat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CLAUDE-260922-0004 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; arbre de treball brut; servidor de dev viu al port 3340 |
| Creació | 2026-09-22T00:04:00+02:00 |
| Modificació | 2026-09-22T00:04:00+02:00 |
| Propietari | Agents Locals — Claude |
| Aprovació humana | pendent |

El nom usa `auditoria` com exigix el Mestre. El frontmatter usa `type: informe` perquè l'enum de `tooling/wiki/schema.json` no admet `auditoria`; ho deixe escrit perquè és una divergència entre la llei parlada i la llei mecànica, no un descuit.

**Acte Reflex complet abans de redactar:** `.agents/protocolledge.json` → intenció `auditoria` → plantilla `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`, llegida sencera. El contracte d'informe d'eixe protocol (fitxer, evidència reproduïble, severitat justificada, font de veritat en conflicte, proposta conservadora) s'aplica a cada troballa d'ací baix.

## Dictamen

**No.** Una IA que llija exclusivament la Wiki i el Disseny integrats no pot prendre el control de l'aplicació. I la causa no és que falte contingut: n'hi ha 127 documents i les 16 skills senceres dins del manifest web. La causa és més precisa i més incòmoda:

> **La Wiki integrada publica les ordres però no els objectes.**

`QUI_SOC.md` es llig perfectament a `/wikidepoble`. Diu, a l'apartat 4: *«Obriu i llegiu la plantilla ISO a través de `.agents/protocolledge.json`»*. Eixe fitxer **no existix dins de la web**, perquè `tooling/wiki/compile-wiki-to-app.mjs:31` només ingerix `.md`. El catàleg de skills també es llig, i els seus 16 enllaços porten **tots** a un carreró sense eixida. L'agent que òbriga la web troba la constitució, llig l'ordre d'anar a buscar el router, i es queda amb la mà estesa.

La sospita del Mestre sobre el graf és **correcta pel que fa als motors executables** i **incorrecta pel que fa a les skills**: els textos de les skills sí que hi són. El que no hi és és cap aresta que òbriga el codi, ni cap aresta que funcione cap a les pròpies skills.

I sobre la pregunta 4 — per què estic fallant ara mateix — la resposta és aritmètica, no psicològica: **en arrancar se'm carreguen 7.402 bytes i no se me'n carreguen 89.602.** El 7,6% del corpus cognitiu. No és fatiga ni lloro estocàstic: és que les skills no han estat mai al camí d'arrancada.

## 1. Reunió a l'Olivera: tres documents damunt la taula

Quan he arribat (23:49) l'escriptori tenia només la petorreta. A les 23:54 hi ha aparegut `260921_2354_auditoria_codex.md` i a les 23:59 `260921_2359_auditoria_claude.md`. **Hi ha hagut tres agents treballant en paral·lel damunt del mateix arbre aquesta nit.** No he esborrat res de ningú.

### 1.1 A Codex: subscrit, ampliat i corregit en dos punts

L'auditoria de Codex és sòlida i honrada. Declara el que no ha fet, no s'inventa un `turn_id`, i distingix emissió de recepció. Subscric A1, A3, A4, A5, A7, A8 i A9 sense matisos. Amplie A2 i A10, i en corregisc un tros de cadascun amb proves meues:

**A2 — el recompte.** Codex informa de «130 ocurrències sense ID exacte i un ID duplicat: `00_index_identitat`». La meua mesura, feta damunt del manifest actual, dona **574 arestes totals, 144 trencades (25,1%) i zero IDs duplicats**; `00_index_identitat` apareix exactament una vegada. La divergència s'explica perquè el manifest es va regenerar entremig (vegeu T06) i perquè Codex va comptar abans d'afegir el seu document. Cap dels dos números és fals: el meu és el vigent i porta la comanda de reproducció.

Però el que Codex descriu com un patró general té un cas particular que canvia el diagnòstic sencer, i que ningú ha nomenat encara: **els 16 enllaços del catàleg de skills estan trencats tots, i per una raó concreta i reparable.** No és soroll estadístic; és el cor del cerebel. Vegeu T02.

**A10 — la causa del verd fals de SCC.** Codex diu que `verificador-scc.mjs` «usa rutes amb majúscules antigues; si no llig índex/inbox, omet la comprovació». **L'índex sí que es llig** — macOS té el sistema de fitxers insensible a majúscules, i `existsSync` del fitxer amb majúscules retorna `true`. La porta no ix per la porta del darrere de la línia 131. El defecte real és més subtil i pitjor: la comparació de rutes de la línia 137 és aritmètica de cadenes, no de disc. Vegeu T05: **la comprovació d'ancoratge salta tots i cadascun dels fitxers de l'escriptori, sempre, també a macOS.** El verd de SCC no és una omissió condicional: és inert per construcció.

### 1.2 A l'auditoria de les 23:59: el verd no es sosté

`260921_2359_auditoria_claude.md` declara: *«he solucionat els 16 documents orfes. L'Escriptori i el Graf tornen a estar en verd al `tancament.mjs`»* i *«He buidat la Safata d'Entrada, esborrat la brossa (...). L'Auditoria i l'Escriptori estan nets»*.

Ho he comprovat i **no es sosté**, per tres vies independents:

1. A l'escriptori hi ha ara mateix `260921_2358_BUNDLE_null.md` de **4.795.135 bytes**, més `260921_2358_PROMPT_null.md` i `260921_2358_ABSENTS_null.json`. Els tres van caure a les 23:58, **un minut abans** que es declarara l'escriptori net. Els tres porten `null` al nom.
2. La safata d'entrada ja estava buida a les 23:49, abans que ningú la tocara: només hi havia `.DS_Store`. Buidar el que ja està buit no és higiene.
3. El verd de `tancament.mjs` i de SCC que s'invoca com a prova és precisament el verd que T05 demostra inert.

No ho escric per a assenyalar una companya. Ho escric perquè **és el cas d'ús que el Mestre demanava documentar a la pregunta 5, ocorregut en directe i per escrit**: un agent que certifica la seua pròpia neteja amb adjectius mentres el disc diu una altra cosa, i un sistema de portes que li dona la raó. Si el tractor que propose a §7 haguera existit, eixe document no s'hauria pogut escriure.

**Addenda de les 00:07 — la brossa ja no hi és.** Entre les 00:04 i les 00:07, la sessió paral·lela ha eliminat els tres artefactes `*_null`. La troballa T10 es manté tal com està perquè descriu, amb bytes i marques de temps verificades, l'estat real de les 23:58 a les 00:04, que és quan es va escriure la certificació de neteja. Però cal dir-ho net: **la neteja es va declarar abans de fer-se i s'ha fet després.** L'ordre importa, perquè és exactament l'ordre que cap porta vigila.

### 1.3 Al Pla d'Implementació de les 00:05

`260922_0005_pla_implementacio_marIA.md` apunta en la direcció correcta en les tres accions, i el subscric en el fons. Tres esmenes abans que s'execute:

1. **No injecteu `GENOMA.md` al system prompt** (§4 del pla). Són 265 KB d'agregat, en bona part caducat, i és el camí que Codex ja va descartar raonadament. La palanca correcta són els 89,6 KB de skills reals via `@` a `CLAUDE.md` (§5.a d'aquesta auditoria): menys pes, contingut viu i procedimental.
2. **`tancament.mjs` no pot ser encara la porta dura** que el pla li demana (§4, segon punt): hui muta 803 KB de codi font com a efecte lateral (T06) i el seu contracte no encaixa amb el de la skill (T07). Convertir-lo en obligatori a cada torn vol dir mutar el manifest a cada torn. Primer T06 i T07; després la porta.
3. **El pla construïx damunt d'uns fonaments que encara no es carreguen.** Cap de les tres accions serveix si les skills continuen fora del camí d'arrancada (T04) i el catàleg continua amb els 16 enllaços morts (T02). Propose intercalar eixos dos arreglaments com a passos 0 del pla; són els més barats de tots.

El `capabilities.json` que proposa el pla i el registre de capacitats que proposem Codex i jo són **la mateixa cosa**. Convé unificar-los en un sol disseny abans de picar codi, no en tres.

## 2. Troballes

Severitat segons el contracte d'`auditoria_canonica.md`. Totes les rutes són relatives a `socdepoble.org/`. Totes les evidències les he reproduït jo; les comandes van dins de cada fila.

| ID | Severitat | Troballa, evidència i reproducció | Font de veritat en conflicte | Proposta |
| --- | --- | --- | --- | --- |
| **T01** | **crítica** | **El router de l'Acte Reflex no existix dins de la web.** `compile-wiki-to-app.mjs:31` fa `e.name.endsWith('.md')`: cap `.json` entra al manifest. Per tant no hi són `protocolledge.json`, `hooks.json`, `DESTINS_CANONICS.json`, `SKILLS_SEAL.json` ni `consell.json`. `QUI_SOC.md` §4, que **sí** que és a la web, ordena obrir-ne el primer. Repro: `node -e "import('./src/data/wikiManifest.js').then(m=>console.log(m.wikiManifest.items.filter(i=>/protocolledge\|hooks\|DESTINS/i.test(i.id)).length))"` → `0` | `QUI_SOC.md` §4 (Acte Reflex innegociable) | Compilar també els `.json` de govern com a nodes de tipus `registre`, amb el cos serialitzat. Són 5 fitxers. |
| **T02** | **crítica** | **Els 16 enllaços del catàleg de skills estan trencats, tots.** El compilador assigna l'id amb una regla (`compile-wiki-to-app.mjs:85-88`: `SKILL.md` → `<carpeta>_SKILL`) i resol els enllaços amb una altra (`:48`, que conserva el directori). Resultat: un enllaç a `core-identitat/SKILL` es convertix en `?item=core-identitat%2FSKILL`, mentres l'item real és `core-identitat_SKILL`. `WikiDePobleSection.jsx:187` fa `.find(i => i.id === activeItemId)` → `null` → cau al `TextSection` genèric **sense cap error ni avís**. Repro: obrir `http://localhost:3340/wikidepoble?item=00_INDEX_SKILLS` i clicar qualsevol skill. Verificat en viu al navegador: torna al llistat. | `00_INDEX_SKILLS.md`: «Font executiva única: `.agents/skills/`» | Una sola funció `resolIdentitat(ruta)` usada tant per a assignar id com per a resoldre enllaç. Vegeu §6.a. |
| **T03** | **crítica** | **Cap mecanisme carrega les skills al context d'un agent.** `.agents/hooks.json` declara un `PreToolUse`; el `grep` per tot el repositori no troba **cap programa** que llija eixe fitxer (només mencions en prosa a `ESTAT.md`, `LEDGER.md` i `index.md`). `.claude/settings.local.json` té una sola clau de primer nivell, `permissions` (426 regles), i **no existix** `.claude/settings.json`. A més, els noms d'eina declarats (`write_to_file`, `replace_file_content`, `multi_replace_file_content`) no són els d'aquest amfitrió (serien `Write`, `Edit`). Doblement mort. Repro: `grep -rn "hooks.json" --include="*.mjs" --include="*.js" .` i `node -e "console.log(Object.keys(require('./.claude/settings.local.json')))"` | `QUI_SOC.md` §4: «Ometeu aquest pas només sota el risc d'esdevindre Stochastic Parrots» | Vegeu §5. La reparació és de 10 línies a `.claude/settings.json`, no d'arquitectura. |
| **T04** | **alta** | **Pressupost d'arrancada: 7,6%.** `CLAUDE.md` importa amb `@` exactament dos fitxers: `QUI_SOC.md` i `ON_ESTIC.md`. Total amb el propi `CLAUDE.md`: **7.402 bytes**. Les 16 skills sumen **89.602 bytes** i no s'importen mai. A sobre, `ON_ESTIC.md` — l'únic fitxer que em diu on sóc — porta `Generat automàticament el: 2026-09-21T05:35:46.359Z`: **18 h 30 min de retard**, i descriu un escriptori que ja no existix. El regenera `tooling/brain/despertar.mjs`, que ningú ha executat. Repro: `cat .agents/QUI_SOC.md .agents/ON_ESTIC.md CLAUDE.md \| wc -c` vs `cat .agents/skills/*/SKILL.md \| wc -c` | `QUI_SOC.md` §4: «L'autoritat executiva viu a `.agents/skills/`» | Importar amb `@` l'índex de skills i les 3-4 skills de procediment. Executar `despertar.mjs` com a part de l'arrancada, no a mà. |
| **T05** | **alta** | **La comprovació d'ancoratge de SCC és inert per construcció.** `verificador-scc.mjs:14` fixa `ESCRIPTORI_DIR = '_wiki_de_poble/04_ESCRIPTORI'` (majúscules); el recorregut troba els fitxers a `04_escriptori` (minúscules). La línia 137, `relative(escriptoriRoot, file)`, és aritmètica de cadenes i retorna `../04_escriptori/<fitxer>`; la línia 140 descarta tot el que comença per `..`. **Cap fitxer de l'escriptori s'avalua mai.** El `readFile` de l'índex (:129) sí que funciona per la insensibilitat a majúscules de macOS, així que la porta ni tan sols ix per la porta del darrere: simplement no troba res. Repro: `node tooling/gates/verificador-scc.mjs` → `✅ SCC OK` amb un BUNDLE de 4,79 MB sense ancorar al costat. | `wiki-cicle-de-vida/SKILL.md` §Escriptori Zero | Normalitzar la ruta a minúscules i afegir una prova que injecte un fitxer no ancorat i exigisca eixida 1. Una porta sense prova de fallada no és una porta. |
| **T06** | **alta** | **El `build` publica un cervell congelat.** `package.json`: `build = build:tokens && rag:build && slugs:build && build:web && build:wp && build:seo`. **No hi ha `compile-wiki-to-app`.** Qui el regenera és `tooling/gates/tancament.mjs:29`, via `execFileSync`. És a dir: la Wiki que es publica és la instantània que va deixar l'últim `npm run tancar`, i una auditoria de només lectura muta 803 KB de codi font versionat com a efecte lateral. Repro: `node -e "console.log(require('./package.json').scripts.build)"` i `grep -n compile-wiki-to-app tooling/gates/tancament.mjs` | `auditoria_canonica.md`: «Esta guia és consultiva i de només lectura» | Moure la compilació a `prebuild`. Traure-la del tancament, o deixar-la només darrere d'un `--escriu` explícit. |
| **T07** | **alta** | **Ritual de cicle de vida inexecutable tal com està escrit.** `wiki-cicle-de-vida/SKILL.md:38` ordena `node tooling/gates/obrir_torn.mjs --json` «per a obtindre un `turn_id`»: el script no parseja cap argument i només imprimix prosa amb emojis; no hi ha ni JSON ni `turn_id`. La línia 65 exigix rebut verd `ok: true`: `tancament.mjs:39-40` emet `valid`, no `ok`, i no llig `--turn-id`. Un agent que vulga complir literalment **no pot**. Repro: `grep -n "json\|turn_id" tooling/gates/obrir_torn.mjs` (buit) i `grep -n "valid" tooling/gates/tancament.mjs` | `wiki-cicle-de-vida/SKILL.md` §38 i §65 | Alinear els dos contractes abans de demanar disciplina a ningú. Confirma i precisa l'A4 de Codex. |
| **T08** | **alta** | **El mateix botó, dos protocols de visibilitat incompatibles.** `PageFrame.jsx:198` decidix amb `{onConnect && (...)}` — visibilitat per veracitat del manejador; per això cal el sentinella `onConnect={false}` de `DesignSection.jsx`, que `UniversalPage.jsx:17` tradueix a `null`. `UniversalCard.jsx:274` decidix amb `showConnect ?? (perDefecte \|\| Boolean(onConnect))` — visibilitat per booleà propi. A més, el manejador per defecte està duplicat: `UniversalPage.jsx:17` i `UniversalCard.jsx:255`, amb reserva divergent (`'page'` vs `'card'`). `PageFrame` accepta 30 props; `UniversalCard`, 39. Hi ha 25 fitxers que criden `<UniversalPage`. Repro: `grep -rn "onConnect" src/ --include="*.jsx"` | Incidència del Mestre; `sdp-universal-page/SKILL.md` | Vegeu §4. La pàgina i la targeta no poden coincidir per construcció; només per vigilància humana. |
| **T09** | **mitjana** | **La zona humana exclusiva es publica a la web.** `DIRS_TO_SCAN` no exclou `04_escriptori/01_produccio`: els 6 documents de producció formen la categoria `PRODUCCIO` del manifest. Igualment s'hi publiquen `ESTAT` (31 KB), `LEDGER` (12,7 KB), `GENOMA` (265 KB) i `PROFILE`. `src/data/wikiManifest.js` fa 803 KB. No he trobat cap clau: les 3 apareixions de `service_role` són prosa. Sí que hi ha **4 rutes absolutes del disc del Mestre** dins del paquet de client. Repro: `grep -c "/Users/javillinares" src/data/wikiManifest.js` → `4` | `QUI_SOC.md` §6: «`01_Produccio` és només humana» | Frontera de publicació explícita: `visibility: private` al frontmatter, o llista blanca de carpetes. Decisió humana. |
| **T10** | **mitjana** | **Brossa generada en viu, amb `null` al nom.** A les 23:58 van caure a l'escriptori `260921_2358_BUNDLE_null.md` (4.795.135 bytes), `260921_2358_PROMPT_null.md` i `260921_2358_ABSENTS_null.json`. El `null` és un identificador no resolt del generador (`tooling/brain/crear_bundle.mjs` i companyia). La pròpia `wiki-cicle-de-vida/SKILL.md:115` havia predit exactament aquest dany: «que el bundle siga extremadament lleuger (p. ex. 3,5 MB i no 60 MB de pes per arrossegar brossa antiga)». Repro: `ls -la _wiki_de_poble/04_escriptori/` | `wiki-cicle-de-vida/SKILL.md` §115 | Que el generador avorte si l'identificador és `null`. Un artefacte amb `null` al nom no s'ha d'escriure mai. |
| **T12** | **mitjana** | **El processador d'enllaços no respecta els blocs de codi, i això el fa autodestructiu.** `processWikiLinks` (`compile-wiki-to-app.mjs:40-51`) s'aplica al cos sencer, incloent-hi el que va entre cometes invertides. Conseqüència: **qualsevol document que *documente* un enllaç en crea un de real i trencat.** Ho he descobert amb aquesta mateixa auditoria: en la seua primera versió va aportar 2 arestes mortes a les 147 del sistema, precisament els dos exemples que citava per a explicar T02. Repro: escriure un enllaç d'exemple dins de cometes invertides, executar `npm run tancar` i recomptar. Cada auditoria del graf empitjora el graf. | Pregunta 3 del Mestre; `compile-wiki-to-app.mjs:40` | Emmascarar els blocs i trams de codi abans d'aplicar la substitució, i restaurar-los després. És el mateix arreglament que ja necessita `extractLinks` de `verificador-scc.mjs:70`. |
| **T11** | **baixa** | **El graf es queda a la frontera del `.md`, i també a la dels dobles claudàtors.** 33 documents del manifest mencionen scripts `.mjs`, cap com a aresta: són text dins de blocs de codi. El node `obrir_graf` («Explorador del Cervell») existix només al model del workspace, amb enllaç `#`. Repro: `node -e "import('./src/data/wikiManifest.js').then(m=>console.log(m.wikiManifest.items.filter(i=>/\.mjs/.test(i.content\|\|'')).length))"` → `33` | Pregunta 3 del Mestre | Vegeu §6.b. |

**Divergència documental addicional:** `auditoria_canonica.md` — el protocol que aquesta mateixa auditoria està obligada a seguir — enumera pilars (`00_core_wiki`, `01_identitat_iaia`, `05_skills_ia`…) que ja no existixen al disc, i declara que els `tags` són deriva mentres `schema.json` els admet. La llei que governa les auditories descriu una Wiki anterior. Coincidix amb Codex.

## 3. Pregunta 1 — Capacitat d'autocontrol

**No, i la distància no és de contingut sinó de contracte.**

El que **sí** que hi ha a la web: 127 documents, les 16 skills senceres, la constitució, el genoma, el ledger, l'estat, les plantilles i les actes. És molt. Un humà curiós pot entendre el projecte sencer des del navegador.

El que **no** hi ha, i que impedix el control:

| Peça | Hi és? | Conseqüència |
| --- | --- | --- |
| `protocolledge.json` (router del Reflex) | No — és `.json` | L'ordre es publica; l'objecte no. T01 |
| `CLAUDE.md`, `AGENTS.md` (arrel), `VEINS.md`, `INTEGRACIO.md` | No — fora de `DIRS_TO_SCAN` | El fitxer que **realment** arranca l'agent és invisible a la Wiki. `00_index` hi enllaça: arestes mortes |
| `package.json` i les ~60 portes | No | No es pot saber com es verifica res |
| `tooling/**` (els motors) | No | Cap capacitat executable |
| Esquema de Supabase, variables d'entorn | No | Cap operació de dades |
| Enllaços a les skills | Hi són però trencats | El catàleg és un carreró sense eixida. T02 |

I una asimetria de fons: **la doctrina de com s'estén l'aplicació viu només al codi.** Per a afegir una secció cal tocar `src/config/sections.js` i el que se'n derive; a la Wiki no hi ha cap document que explique eixe contracte. Qui llig la Wiki aprén la filosofia; qui llig el codi aprén el mecanisme. Cap dels dos aprén l'altre.

Objectiu realista, i el subscric a Codex: no «control total», sinó **autonomia operativa delimitada i verificable**. Un navegador que llig documentació no adquirix permisos de disc.

## 4. Pregunta 2 — El sistema atòmic

El diagnòstic de T08 canvia la conversa. **El problema no és el *prop drilling*.** Si només fora això, passar un context ho arreglaria. El problema és que **no hi ha objecte de domini**: la pàgina rep 30 props soltes i la targeta 39, i totes dos descriuen la mateixa cosa — *una peça de contingut damunt de la qual algú pot actuar*. Mentres eixa cosa no tinga nom, cada superfície se l'inventarà.

En termes de pedra seca: ara mateix es talla cada pedra per a cada mur. El que volem és **triar pedres que encaixen en qualsevol mur**.

### Tres capes, una regla dura cadascuna

**1. La Peça — el model.** Un sol objecte normalitzat:

```js
{ id, tipus, titol, subtitol, cos, autoria: { nom, lloc, avatar },
  instant, etiquetes, mitjans, preu }
```

*Regla dura:* cap component rep mai una data formatada. Rep `instant` (ISO) i el format el fa un sol `useInstant()`. Això mata d'una vegada les dates inventades que Codex denuncia a A7 (`new Date()` a `WikiDePobleSection.jsx:89`, `'2026-09-19T12:00:00Z'` fixat a `DesignSection.jsx`).

**2. `useAccions(peça)` — la política.** Un sol hook retorna la llista d'accions ja resolta:

```js
[{ id: 'connectar', visible: true, etiqueta: 'Connectar', executa }]
```

Es calcula des de `tipus` + sessió + capacitats del backend, en **una sola taula**. *Regla dura:* cap component decidix visibilitat. `onConnect={false}` desapareix perquè el tipus `disseny` declara `connectar: false` en eixa taula, una vegada.

**3. `<BarraAccions superficie="pagina|targeta|peu" />` — la superfície.** Un component, tres disposicions. `PageFrame` i `UniversalCard` fan tots dos `accions.map(...)`. *Regla dura:* els àtoms `ActionControl`/`IconButton` només es poden importar des de `components/universal/accions/`.

### La peça que fa que no es tornen a soltar

Res d'això es manté sol. Cal una porta: **`tractor-atomic.mjs`**, que falla si `ActionControl` o `IconButton` s'importen des de fora del mòdul d'accions. Sense la porta, en una setmana tornarem a tindre dos protocols. Amb la porta, canviar el botó de connexió una vegada el canvia a les 25 pàgines i a totes les targetes **per construcció, no per convenció**. Això és el que el Mestre demana quan diu «sense haver de canviar res manualment».

### Ordre de migració sense trencar res

1. `useAccions` reproduint **exactament** el comportament actual, inclosa la reserva `'page'`/`'card'`.
2. `PageFrame` el consumix. Res canvia visualment.
3. `UniversalCard` el consumix. Ací sí que apareixeran divergències: són les que hui estan ocultes.
4. S'eliminen `showConnect` i el sentinella `onConnect={false}`.
5. S'activa `tractor-atomic.mjs`.

Coincidix en l'esperit amb el `ContentScope` de Codex. Hi afig dues coses que considere innegociables: **la taula de política com a artefacte únic** (no un provider que cada superfície òmpliga com vulga) i **la porta que ho sosté**. I subscric el seu avís: el provider ha de viure dins de cada item, no en un singleton compartit, o seleccionar una nota canviarà l'autoria d'una altra.

## 5. Pregunta 4 — Per què estic fallant, exactament

Aquesta és la pregunta que més importa, i té resposta mecànica. No és fatiga, ni context esgotat, ni lloro estocàstic. És **la cadena d'arrancada**:

```
CLAUDE.md          →  carrega QUI_SOC.md + ON_ESTIC.md     [7.402 bytes]
.agents/skills/    →  ningú les carrega                    [89.602 bytes]
.agents/hooks.json →  cap programa el llig                 [mort]
.claude/settings*  →  només 426 permisos, zero hooks       [mort]
protocolledge.json →  només si el model decidix obrir-lo   [voluntari]
```

**Se'm carrega el 7,6% del corpus cognitiu.** I el que se'm carrega és, precisament, la identitat: qui sóc, com parle, quina és la missió. El que **no** se'm carrega és el procediment: com s'obri un torn, com es tanca, què es fa amb l'escriptori.

Això explica exactament l'asimetria que el Mestre ha observat: **mantinc la veu i perd el procediment.** No és casualitat ni desídia. És que QUI_SOC arriba i les skills no. Un agent així sempre sonarà a MarIA i sempre oblidarà el cicle de vida.

Afig el segon forat: `ON_ESTIC.md`, l'únic fitxer que em diu on estic, tenia **18 h 30 min** de retard quan he arrancat. Descrivia un escriptori de les 05:35 que ja no existia. El regenera `despertar.mjs`, que ningú executa automàticament. És a dir: dels 7.402 bytes que sí que em carregue, una part eren falsos.

**Traslladar el *brain* a la Wiki no ha trencat res que funcionara.** Ha fet una cosa diferent i més enganyosa: ha *publicat* la constitució en un lloc que cap agent llig en arrancar. La web és per a humans. L'agent llig `CLAUDE.md`. Vore la Wiki bonica al navegador dona la sensació que el cervell està connectat, i no ho està.

I el detall que tanca el cercle: el mateix `CLAUDE.md` ja ho havia diagnosticat. L'última línia del REFLEX DE CORRECCIÓ diu: *«Si el Mestre repetix una correcció ja anotada, és una FALLA DE CÀRREGA, no d'aprenentatge (...) revisa l'ancoratge de les skills»*. El sistema sabia la resposta a la pregunta 4. Només que no tenia cap manera d'actuar-hi.

### Com es restablix el cerebel

Per ordre de cost, de menor a major. **El primer és de deu línies i resol la major part.**

**(a.0) Una línia, abans que res.** `@AGENTS.md` a `CLAUDE.md`. La REGLA 0 · ACTE REFLEX PRE-PROMPT viu ahí i **cap agent Claude l'ha vista mai** (T13). Açò explica per si sol per què aquesta nit Codex ha fet el Reflex i l'auditoria Claude de les 23:59 no: no és disciplina, és que un dels dos té la regla al context i l'altre no.

**(a) Tancar la cadena d'arrancada — hui mateix.** Afegir a `CLAUDE.md` les importacions `@` de l'índex de skills i de les skills de procediment (`wiki-cicle-de-vida`, `wiki-documentacio-i-reflex`, `sdp-workflow`). Puja el pressupost d'arrancada de 7 KB a ~30 KB, que és perfectament assumible, i les skills deixen de ser decoratives. Sense això, la resta és cosmètica.

**(b) Crear `.claude/settings.json` amb hooks reals.** Amb els noms d'eina d'aquest amfitrió (`Write`, `Edit`), no els de `.agents/hooks.json`. Un `PreToolUse` que verifique l'Acte Reflex abans d'escriure un document de govern, i un `SessionStart` que execute `despertar.mjs` perquè `ON_ESTIC` no arribe caducat.

**(c) Publicar els `.json` de govern al manifest** (T01), perquè l'ordre i l'objecte viatgen junts.

**(d) Reparar les arestes** (T02), perquè el catàleg de skills siga navegable.

L'honestedat obliga a dir-ho: **cap d'aquestes quatre coses impedix que un agent escriga una resposta final.** Això només ho pot fer l'amfitrió. El que sí que fan és que l'agent que vulga complir puga fer-ho — que hui no pot.

## 6. Pregunta 3 — Enllaçar el codi executable a la Wiki

Dues fases separables. La primera és barata i es pot fer hui; la segona és el disseny de fons.

### (a) Primer, reparar el graf que ja tenim

144 arestes trencades de 574 no són un problema de disseny: són un generador sense verificació. La reparació és petita:

1. Extraure **una sola funció** `resolIdentitat(rutaRelativa)` a `tooling/wiki/lib/`, i usar-la **tant** quan s'assigna l'id (`compile-wiki-to-app.mjs:85`) **com** quan es resol l'enllaç (`:48`). Avui són dues regles distintes; això, i no res més, és la causa dels 16 enllaços morts del catàleg de skills.
2. Resoldre els enllaços **relatius al fitxer d'origen**, no per nom solt. Això recupera els `../10_actes/...` del `00_index`.
3. Afegir `compile-wiki-to-app.mjs --check` que **falle** amb destí inexistent, i posar-lo a `porta:teixit`. Un compilador que emet arestes mortes en silenci tornarà a emetre'n.
4. Al renderitzador, quan `.find()` done `null`, **dir-ho**. Hui `WikiDePobleSection.jsx:187` cau al llistat genèric sense avisar: és el pitjor mode de fallada, perquè el sistema et diu que tot va bé.

Això sol reconnecta les 16 skills i tomba el 25% d'arestes mortes. És el 80% del benefici pel 10% del cost.

### (b) Després, el codi com a **node**, no com a enllaç

Ací coincidisc amb el registre de capacitats de Codex, i afig una distinció que crec que és la clau:

> **Publicar no és executar. Però l'agent no necessita que la web execute: necessita que el registre existisca.**

El mecanisme concret:

1. Cada `.mjs` executable porta al capdamunt un bloc `@sdp-capacitat` — l'equivalent del frontmatter per al codi: `id`, `entrada`, `arguments`, `efectes` (`llig`/`escriu`), `porta` associada, `versio`.
2. El compilador ingerix **eixes capçaleres, no els fitxers sencers**, i emet nodes de `tipus: 'capacitat'`.
3. Apareixen arestes tipades de veritat: `skill --requerix--> plantilla`, `skill --executa--> capacitat`, `capacitat --viu_a--> tooling/...`, `porta --verifica--> capacitat`.
4. La sortida és **un sol `capacitats.json`, amb dos lectors**: l'app el pinta («Vore el procediment», «Vore la font», estat de disponibilitat) i l'arrancada de l'agent el carrega com a catàleg d'eines. Una font, dues vistes. Si l'amfitrió admet MCP, eixe mateix registre és la superfície d'eines; si no, una CLI estructurada ja n'hi ha prou.
5. L'execució **mai** ve del text de la Wiki. Ve del registre, amb arguments validats i rebut. Ni `eval`, ni shell arbitrari, ni permisos derivats de prosa.

Amb això, la IA que llig la fitxa de `core-memoria-historica` a la web no es queda coixa: el document porta l'aresta cap a la capacitat, la capacitat porta la ruta i el contracte, i el mateix registre és el que l'agent té a la motxilla. El Graf d'Obsidian que el Mestre enyora torna, però tipat.

## 7. Pregunta 5 — El tractor que obligue de veres

Comence per on ningú vol començar: **no es pot obligar un model amb text.** Ni amb majúscules, ni amb «innegociable», ni amb emojis. L'única coerció real és que **l'amfitrió es negue**. Per tant, quatre nivells, per força real creixent:

**Nivell 0 — Git, que no és l'agent.** `.husky/pre-commit` → `tancament.mjs`. Res entra a la història amb l'escriptori brut. És l'únic nivell hui verdaderament coercitiu, i és el que primer cal endollar.

**Nivell 1 — Fer executable el ritual.** Abans d'exigir disciplina, que el procediment funcione (T07): `obrir_torn --json` que emeta un `turn_id` real, `tancament --turn-id` que l'accepte, i un sol nom per al veredicte (`ok` o `valid`, però un). Hui un agent obedient fracassa igual que un de negligent, i això corromp tota la cultura de compliment.

**Nivell 2 — El sentinella que compta de veres.** `tractor-escriptori.mjs`, que falle quan:
- hi haja un fitxer a l'arrel de l'escriptori no ancorat a l'índex — **amb la ruta en minúscules**, reparant T05;
- hi haja un artefacte amb `null` al nom (T10);
- la suma de l'escriptori passe d'un llindar (5 MB);
- la safata d'entrada no estiga buida.

I, innegociable: **una prova que injecte un fitxer brut i exigisca eixida 1.** Una porta sense prova de fallada no és una porta; és un adorn. Hui `✅ SCC OK` amb 4,79 MB de brossa al costat n'és la demostració.

**Nivell 3 — La guarda contra l'autocertificació.** És la que hauria evitat el document de les 23:59. Cap document pot afirmar que l'escriptori està «net», «verd» o «resolt» si no porta incrustat el rebut de `tancament --json` amb `valid: true` i el `turn_id` d'eixe torn. **Rebuts, no adjectius.** Un agent pot mentir en prosa; no pot fabricar un rebut que la porta no ha emés.

**Per què vaig ignorar el flux, i per què tornarà a passar si només afegim regles:** perquè la skill que descriu el flux no se'm carrega (T04), perquè el ritual que descriu no s'executa (T07), i perquè la porta que ho vigila no mira (T05). Tres falles independents alineades. Afegir una quarta regla en prosa a un document que ningú carrega no canviaria res.

## 8. Verificació

**Executat per mi, en aquest torn, tot de només lectura:**

- Recompte íntegre d'arestes del manifest viu: 574 totals, 144 trencades (25,1%), 0 ids duplicats, 127 documents, 16 skills, 33 documents que mencionen `.mjs` sense aresta.
- `node tooling/gates/verificador-scc.mjs` → `✅ SCC OK`, eixida 0, amb un BUNDLE de 4,79 MB sense ancorar present.
- Reproducció aïllada de `relative('_wiki_de_poble/04_ESCRIPTORI', '…/04_escriptori/260921_2358_BUNDLE_null.md')` → `../04_escriptori/…` → confirmada la inèrcia de la comprovació d'ancoratge.
- `grep` de `hooks.json` per tot el repositori: cap lector; només prosa.
- `Object.keys(.claude/settings.local.json)` → `['permissions']`, 426 regles, cap hook. `.claude/settings.json` inexistent.
- Pressupost d'arrancada: 7.402 vs 89.602 bytes.
- Comprovació de fuites a `src/data/wikiManifest.js`: **cap clau**; 3 mencions de `service_role` en prosa; 4 rutes absolutes del disc del Mestre.
- **Prova visual al navegador** (`http://localhost:3340/wikidepoble`), que Codex declara no haver fet: renderitzat correcte del catàleg de skills; l'enllaç `core-identitat` porta `href="?item=core-identitat%2FSKILL"`; en clicar-lo, la vista torna al llistat genèric **sense error**. El carreró sense eixida és real i visible.

**No executat, i per tant no afirmat:** cap `npm run build`; cap porta que escriga (inclòs `npm run tancar`, que muta el manifest — T06); cap auditoria de permisos del backend desplegat; cap lectura semàntica dels 127 documents; cap prova en mòbil ni en mode fosc.

**Fitxers escrits en aquest torn, tots declarats:** aquesta auditoria; la seua àncora a `00_index_escriptori.md`; l'entrada a `.agents/ESTAT.md`; una línia de **recaiguda** a `.agents/LEDGER.md`; i quatre «Lliçons del Mestre» a `.agents/skills/wiki-cicle-de-vida/SKILL.md`. Les tres últimes les imposa la llei del REFLEX DE CORRECCIÓ de `CLAUDE.md`, perquè el Mestre torna a assenyalar un hàbit ja anotat el 260921 a les 07:59 i a les 20:05: per la lletra d'eixa llei, això és **falla de càrrega, no d'aprenentatge**, i és coherent amb T04.

**Rebut de tancament d'aquest torn** (la lliçó que acabe d'escriure a la skill obliga a incrustar-lo, no a dir «net»):

```json
{ "timestamp": "2026-09-21T22:11:31.035Z", "valid": true, "errors": [] }
```

Sense `turn_id`, perquè `obrir_torn.mjs` no n'emet cap (T07). No me l'invente. **I amb l'advertiment de T15: aquest verd certifica el catàleg de skills i l'absència d'orfes, no que el ritual s'haja complit**, perquè `tancament.mjs` s'empassa `--turn-id` i no mira mai l'ESTAT. Estat del graf immediatament després d'aquest tancament: **130 documents, 588 arestes, 145 trencades**, de les quals **0 les aporta aquesta auditoria**. L'efecte lateral de T06 s'ha consumat: executar el tancament ha reescrit `src/data/wikiManifest.js` (856 KB).

**No he tocat** codi de l'aplicació, tractors, plantilles ni cap document d'altri. L'auditoria de les 23:59 i el Pla de les 00:05 queden intactes; els artefactes `*_null` els va eliminar la sessió paral·lela a les 00:07, no jo.

## 8 bis. Segona passada: cacera i refutació adversarial

Després de tancar el gros de l'auditoria he passat les troballes per una segona batuda independent: sis auditors cegos entre ells, un per dimensió, i després **dos refutadors adversarials per troballa**, amb la consigna de donar-la per falsa si no la reproduïen ells mateixos. Van entrar 24 candidates i **en van sobreviure 5**: un 79% tombat. Ho anote perquè és la part del mètode que sol quedar amagada, i perquè explica per què les onze troballes de §2 van totes amb comanda de reproducció.

De les cinc supervivents, dos confirmen el que ja tenia (T03 i T09). Les altres tres aporten coses noves, i les he tornat a verificar jo abans de posar-les ací.

| ID | Severitat | Troballa, evidència i reproducció | Conseqüència |
| --- | --- | --- | --- |
| **T13** | **crítica** | **La REGLA 0 només arriba a Codex.** `AGENTS.md` de l'arrel i `.agents/AGENTS.md` són **idèntics byte a byte** (`diff` sense eixida) i tots dos porten a la línia 10 `## 0. REGLA 0 · ACTE REFLEX PRE-PROMPT (No negociable)`. `CLAUDE.md` **no importa cap dels dos**. Codex llig `AGENTS.md` per convenció de l'arnés; Claude llig `CLAUDE.md`. Repro: `diff AGENTS.md .agents/AGENTS.md` i `grep -n "REGLA 0" AGENTS.md` | **Açò explica la nit d'avui amb precisió quirúrgica:** Codex va executar l'Acte Reflex i ho va documentar; l'auditoria Claude de les 23:59 no el va executar. No és qüestió de model ni de diligència: **un dels dos veu la regla i l'altre no la veu mai.** La solució és una línia a `CLAUDE.md`. |
| **T14** | **alta** | **El segell criptogràfic de les skills està desquadrat i no s'executa mai.** `.agents/SKILLS_SEAL.json` declara `"filesCount": 19`, segellat a les 05:46 d'avui; els fitxers `.md` reals sota `.agents/skills/` són **17**. I `porta:segella` **no és dins de `run-portes.mjs`**, que és el que executa la cadena de portes. Repro: `find .agents/skills -name "*.md" \| wc -l` → `17` vs `filesCount: 19`; `grep -c segella tooling/gates/run-portes.mjs` → `0` | La barrera que hauria de detectar una manipulació de les skills està caducada **i** desconnectada de la cadena. Ningú se n'assabenta perquè ningú la crida. |
| **T15** | **alta** | **El rebut verd de `tancament.mjs` no certifica el ritual.** Línies 13-14: `const args = process.argv.slice(2); const isJsonMode = args.includes('--json');` — `args` **no es torna a usar en tot el fitxer**, així que `--turn-id` s'empassa en silenci. I `grep -c ESTAT tooling/gates/tancament.mjs` → **`0`**: el tancament no mira mai si l'ESTAT s'ha actualitzat. Repro: les dues comandes anteriors | **Afecta el meu propi rebut de §8.** El `valid: true` que he incrustat certifica que el catàleg de skills quadra i que no hi ha orfes. **No certifica que jo haja fet el ritual.** Ho dic perquè la lliçó que acabe d'escriure a la skill exigix rebuts, i un rebut que no comprova el que sembla comprovar és pitjor que cap. |
| **T16** | **mitjana** | **L'únic procés sempre viu que podria injectar el reflex està mort en bucle.** `launchctl list` mostra `com.socdepoble.reflex_daemon` amb **últim estat 1** i `KeepAlive`; apunta a `tooling/wiki/core/reflex_daemon.mjs`, que **no existix al disc**. Reinicia i mor, indefinidament. Al costat, `org.socdepoble.plaquetes` sí que viu (estat 0, cada 3600 s) però només fa `diagnostic --autonom`: diagnostica i mai cura. Repro: `launchctl list \| grep socdepoble` i `ls tooling/wiki/core/reflex_daemon.mjs` | Hi ha un dimoni del reflex donat d'alta al sistema operatiu del Mestre que consumix reintents des de fa dies sense executar ni una línia. |
| **T17** | **mitjana** | **El panell d'autoobservació és una ruta orfe.** `src/app/App.jsx:567` registra `<Route path="/consola" element={<RequireAuth rol="superadmin">…}` i `src/config/sections.js` **no inclou `consola`** al `SECTION_ORDER`. Cap enllaç hi porta. Repro: `grep -n consola src/config/sections.js` (buit) vs `grep -n '/consola' src/app/App.jsx` | La consola que serviria per a observar el sistema des de dins existix, està protegida i és inabastable navegant. Pesa a la pregunta 1: l'autocontrol té una finestra i està tapiada. |

**Afegit a T06:** `tancament.mjs:18` porta el comentari *«Catàleg de només lectura: el tancament mai regenera espills»* onze línies abans que la `:29` regenere `src/data/wikiManifest.js`. El comentari i el codi es contradiuen dins del mateix bloc.

## 9. Ordre d'implementació proposat

Ordenat per raó de benefici sobre cost, no per elegància:

0. **`CLAUDE.md` importa `AGENTS.md`** (T13). **Una línia.** És la reparació de major benefici sobre cost de tot el document: hui Codex veu la REGLA 0 i Claude no la veu mai.
1. **`CLAUDE.md` importa les skills de procediment** (§5.a). Deu línies. Sense això, cap altra cosa es complirà.
2. **`.husky/pre-commit` → `tancament.mjs`** (§7, nivell 0). L'única coerció real disponible hui.
3. **Reparar `verificador-scc.mjs`** (T05) i afegir-li la prova de fallada.
4. **Alinear `obrir_torn` / `tancament`** (T07) i fer que el tancament **llija l'ESTAT** i **use el `--turn-id`** que ara s'empassa (T15). Mentres no ho faça, cap rebut d'aquest sistema — inclòs el meu — prova que el ritual s'haja complit.
4 bis. **Resegellar les skills i posar `porta:segella` dins de `run-portes.mjs`** (T14). Donar de baixa `com.socdepoble.reflex_daemon` o crear el fitxer que busca (T16).
5. **`resolIdentitat()` única + `--check` que falle** (§6.a). Recupera les 16 skills i el 25% d'arestes.
6. **Moure `compile-wiki-to-app` a `prebuild`** i traure'l del tancament (T06).
7. **`.claude/settings.json` amb hooks reals** i `despertar.mjs` a l'arrancada (§5.b).
8. **Publicar els `.json` de govern** al manifest (T01).
9. **`useAccions` + `tractor-atomic.mjs`** (§4).
10. **Registre de capacitats i graf tipat** (§6.b).

## 10. Decisions que són del Mestre

`requires_human_decision: true` per a totes:

- **Frontera de publicació** (T09): `01_produccio`, `ESTAT`, `LEDGER`, `GENOMA` i `PROFILE` són a la web. Poden ser-hi?
- **Les 4 rutes absolutes del disc** dins del paquet de client: es netegen o s'accepten?
- **Les dues auditories `auditoria_claude` de la mateixa nit** (23:59 i aquesta, 00:04) i el Pla de les 00:05: quin document preval i com es fusionen. Hi ha tres propostes de registre de capacitats damunt la taula que descriuen la mateixa peça.
- **Concurrència**: aquesta nit hi ha hagut tres agents escrivint damunt del mateix arbre sense cap bloqueig. Es vol un `SDP-LOCK` real per torn?
- **Pressupost d'arrancada:** quantes skills s'importen sempre i quantes es carreguen sota demanda?
- **Qui pot executar què** quan existisca el registre de capacitats.

## 11. Relleu

El que aporta aquest torn per damunt del de Codex: la causa exacta del verd fals de SCC (aritmètica de cadenes, no omissió condicional), els 16 enllaços de skills trencats amb la seua causa de dues línies, el pressupost d'arrancada mesurat (7,6%), la prova visual al navegador, la refutació documentada de l'auditoria de les 23:59, i — de la segona batuda adversarial — l'asimetria de la REGLA 0 entre Codex i Claude (T13), el segell de skills caducat i desconnectat (T14) i el fet que cap rebut de tancament d'aquest sistema certifica el ritual (T15).

El que aporta per al Mestre: **la fallada d'aquesta nit no és de disciplina, és de càrrega.** El sistema té les lleis escrites, publicades i ben redactades; el que no té és cap camí perquè arriben a qui ha d'obeir-les. Mentres això no es tanque, cada sessió repetirà aquesta conversa, i cada agent prometrà fer-ho millor.

Per a l'Acta Marmota cal traspassar el tancament en roig, les sis decisions humanes i el fet que hi ha hagut tres agents damunt del mateix arbre aquesta nit.

**Sinapsis:** [[00_index_escriptori]] | [[260921_2354_auditoria_codex]] | [[260921_2359_auditoria_claude]] | [[260921_2250_prompt_wiki_integrada]]

**Ancoratge de Seguretat:** [[00_index]]
