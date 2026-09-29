---
type: informe
status: esborrany
description: 'Implementacio i verificacio de T48 a T54: consola neta, entradilla 256, targeta viva, barra taronja, catàleg, barra blava i connexions en lectura.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_28eba6af-ac54-4edb-80d6-a167ee9cf07b:8e8456c6-ee0a-413c-9dc9-ca3649fdfc82
---
# Auditoria i implementacio T48-T54 Claude Ultra Code

Informe del torn que executa el prompt [[260928_1345_prompt_claude_ultracode]] i el seu pla [[260928_1345_pla_implementacio_claude_ultracode]]. Tot el que es diu ací s'ha verificat al codi, a les proves o al navegador; el que no s'ha pogut verificar es diu a «Límits».

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_28eba6af-ac54-4edb-80d6-a167ee9cf07b:8e8456c6-ee0a-413c-9dc9-ca3649fdfc82 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-28T15:00:14.830Z |
| Modificació | 2026-09-28T16:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (prompt 260928_1345 i quatre decisions del Mestre preses al xat el 28-09) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5): orquestrador i 42 subagents en 5 workflows |
| Tokens consumits | ≈13,55 M: subagents 12.953.245 (mapa 2.355.264; onada 1 2.241.218; onada 2 4.010.081; onada 3 2.641.905; onada 4 1.704.777) i orquestrador ≈0,6 M |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-28T15:00:14.830Z: esborrany creat; contingut i verificació pendents.
- 2026-09-28T16:40Z: contingut complet després de l'onada 4, la suite sencera i la verificació al navegador.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Mètode

El prompt es va acceptar: porta el Pla d'Implementació, i el preflight es complix. Es va treballar en cinc workflows. Primer un mapa de només lectura, amb 8 lectors. Després quatre onades d'implementació amb propietat de fitxers disjunta; cada implementació va passar per un revisor adversarial, i els defectes confirmats entraven a l'onada següent. El prompt deia «T48–T50», però en llistava set tasques (T48–T54), i s'han fet totes set.

### Decisions del Mestre (28-09, al xat)

1. **T50:** targeta viva a la llista, i també a la dreta de l'editor quan hi cap.
2. **T51, data:** cap document existix sense data. En lectura, la de creació o la de l'última versió. En edició, la d'ara. Mai guionets. La regla es documenta al manual.
3. **T51, plomes:** la ploma és el botó d'emoticona; el glif de l'autodesament canvia.
4. **T51:** el botó «Emoticona» de la botonera es conserva.

Interpretació de l'orquestrador, per al punt 2 en edició: si la persona ha triat expressament una data de publicació al calendari (T40), la pastilla mostra eixa tria; si no, la d'ara. Mai la data de l'última edició.

### T48 · Consola

- **GoTrueClient:** el client Supabase ja no crea cap GoTrue. `accessToken` ocupa el lloc d'`auth`, perquè ningú fa servir `client.auth`. Dues crides concurrents amb el mateix JWT comparteixen una sola creació, i el listener ja no reinicia el client si el JWT no canvia. Temps real i baixes usen el client viu sense crear-ne cap: `src/data/supabase/config.js`, `realtime.js`, `xat.js`.
- **Xat en llavor:** la baixa d'una subscripció local ja no crida `channel.unsubscribe` sobre un objecte que no és un canal (TypeError), i `XatContext` captura les baixes.
- **View Transitions:** `App.jsx` captura la promesa `ready` de `startViewTransition` (el `InvalidStateError: Transition was aborted` que es veia al navegador).
- **Mur:** l'avís «Falta la pàgina de sistema» només ix amb el contingut carregat.
- **POST 404 `contacte_organitzacio`:** la RPC no existix a cap migració. El client la sonda una sola vegada per backend i poble, les crides concurrents esperen la sonda, i en eixa càrrega de pàgina ja no la torna a cridar. La migració NO s'ha escrit: `organizations` no té columna de correu i el correu per defecte s'ha de llegir d'`auth.users`. Queda per a backend (Codex).

### T49 · Entradilla de 256 caràcters

- **Font única:** `MAXIM_LEMA = 256` a `src/data/limitsText.js`. Hi viu també `LLINDAR_COMPTADOR`, i els importen `perfilCamps.js`, `src/data/organizations.js`, `PerfilEditor.jsx` i el catàleg. L'alta d'organització compta en caràcters reals (`char_length`).
- **Migració nova** `supabase/migrations/2609281500_lema_entradilla_256.sql`: idempotent, amb el CHECK a 256 a `profiles` i `organizations` i `create_organization` copiada amb `left(…, 256)`. Està afegida a `supabase/README.md`. Una prova de paritat vigila que client i SQL diguen el mateix.
- **No s'ha tocat:** les notes no tenien límit (no se'ls n'ha posat cap), ni els 120 que no són el lema (noms, `role`, px, ms).

### T50 · Targeta viva

- **Peces noves:** `targetaViva.js` (mòdul pur: text pla, emoticona només si s'ha triat, regla de data d'edició), `TargetaViva.jsx` (UniversalCard «pla», accions interceptades, xip «Vista targeta» amb diàleg) i `documentViu.js` (magatzem per id per al Perfil).
- **Notes:** la fitxa activa de la llista és la targeta viva. Corregix l'HTML cru, l'autor (helper compartit `autoriaDeNota`), la data i l'emoticona, i ja no porta la «(i)».
- **Perfil:** la fitxa activa de la llista també és targeta viva, alimentada pel text que s'escriu.
- **Dreta de l'editor:** `DocumentEditor` té la clau opcional `targetaViva` (sense la clau, el DOM és idèntic). Quan l'editor fa 60rem o més, l'aside es veu a la dreta; si no, apareix el xip. Textos per consumidor amb `avisTargetaViva`: el de Notes promet el Mur, el del Perfil no promet cap publicació.
- **Comprovat al navegador:** amb l'editor a 640 px, xip visible i cap aside; amb l'editor ample (pantalla de 2400 px), aside de 384 px i xip amagat.

### T51 · Barra taronja

- **Barres extretes de `PageFrame`:** `barres/BarraTaronja.jsx`, `BarraBlava.jsx` i `BotoVisibilitat.jsx`, amb el mateix DOM. Són les peces pare que també fan servir els espècimens (abans hi havia còpies a mà).
- **Graella de tres columnes:** autoria, espai central i accions amb data. L'espai central és `EmoticonaBarra`. En edició sempre és un botó, amb la ploma blanca si no hi ha emoticona. En lectura queda buit si no se n'ha triat cap. La lògica viu a `emoticonaDeBarra` (`src/utils/emoji.js`) i llig sempre el camp cru, mai la 🪶 del model de la llista.
- **Emoticona fora de l'editor:** la caputxa d'UniversalCard mostra l'emoticona triada, i el Mur la rep al payload jsonb (sense migració).
- **Icones blanques:** pin, món, cadenat, ploma i desament, dins de `@layer components`, amb anell de focus en tema fosc.
- **Autodesament:** passa de la ploma a `CloudUpload`.
- **Data en edició:** la triada o la d'ara, també a l'estat buit i a la còpia del Foraster, que abans deia «Data».
- **Data en lectura:** un sol lector (`editorial.js`, amb `dosDigits` de `calendari.js`) i fonts reals. La de les publicacions editades ve d'`updated_at`, amb un marge de 60 s perquè la inserció no compte com a edició. Els perfils porten `created_at`/`updated_at` (també en llavor) i els mapejadors remots, `creat`/`modificat`. El catàleg té `VERSIO_CATALEG` (`cataleg/versio.js`). Les dates que només tenen dia es pinten sense hora inventada: abans eixien les «02:00» de la mitjanit UTC. El Mur ordena i filtra pel mateix dia que pinta la pastilla, i la data fixa inventada («2026-08-21») ja no hi és.
- **Proves T36:** les 3 que ja eren roges estan alineades amb l'avís de 5 s, que ara es neteja en desmuntar.
- **Manual:** la regla de la pastilla, de l'emoticona i de les icones queda escrita a [[identitat_visual]] §6, per ordre del Mestre, i al catàleg.

### T52 · Manual i catàleg

- **El fitxer `pedra_seca.md` no existix.** El manual efectiu són les skills `sdp-pedra-seca`, `sdp-universal-page`, `sdp-universal-editor` i `sdp-app-grid-shell`, més el catàleg de `/disseny`.
- **Catàleg:**
  - `ARBRE_UNIVERSAL` amb relacions `munta`/`instancia`/`versio` i consumidors reals: UniversalCard és una versió de PageFrame i NO n'hereta res, i el Xat munta AppGridShell per ClosCaXat.
  - `Llinatge` a cada espècimen i espècimen «Arbre universal».
  - Especímens nous amb components reals: BarraEines, Classificació, Impressió, Composició, Columnes, TargetaViva i EmoticonaBarra.
  - Posats al dia: Shell, Divisor, Gestor, UniversalWorkspace, NavMobil, Opcions (GrupCamps de veres), ControlsBarra, EstatDesament, Calendari i UniversalCard.
  - Cap mostra d'edició porta data fixa.
- **Registre:** sense rutes `ui/` fantasma, amb Divisor i AppGridResizer separats. Prova de paritat entre manifest i carregadors, i porta C1–C3 comprovada a mà.

### T53 · Barra blava

- **Fletxes:** el glif de cada fletxa s'acosta 4 px al llibre dins de la seua cel·la, que continua fent 44 px. La tinta passa de 27 a 23 px, semblant a la del trio central.
- **Trio central:** centrat respecte a tota la barra (variant A, doctrina §1.A).
- **«+» a ≤480 px d'ample de barra (abans 400):** CONNECTAR sobreeixia la barra entre 401 i 474 px. L'espècimen porta els dos spans i una mostra estreta.
- **Aclariment:** `UniversalToolbar.jsx` és la barra d'eines de l'editor, no la barra blava (que és `header.bar-blue` de PageFrame).

### T54 · Connexions en lectura

- **Resolvedor únic:** `src/sections/detail/elementDeSeccio.js`, que també fa servir `ItemDetailSection` sense canviar-li el DOM.
- **Diàleg Connectar:** porta una mini-card amb foto i títol. La imatge es resol en local, mai des de l'URL. Després de guardar fa `navigate` amb `replace`.
- **Lector:** Notes > Connectats obri `ConnexioDetall.jsx`, sense editor, ploma ni camps editables. Si troba l'original, en mostra la pàgina; si no, una pàgina de caiguda amb «Obri l'original», amb estats de càrrega i d'error. La tira de recopilació porta Obri l'original, Carpeta, Borrar i Compartir/Actualitzar al Mur.
- **Compartir al Mur:** publica un cos fet amb l'origen (`cosDeConnexioPerAlMur`), no el cos privat de la nota. La nota desada no canvia.
- **Textos:** els textos de Connectar, visibilitat i catàleg ja no prometen el que el lector no fa.

### Higiene heretada (T39–T47)

- `SelectorIdentitat.test.jsx` apuntava a un fitxer que ja no existix: ara prova les peces reals de la barra negra.
- Lleva els mocks morts del selector i el CSS orfe.
- Token `--sdp-icona-xs` (el guard deixa de veure els 14 px com a zona tàctil).
- `h1` del mock de la Wiki dins del `header.page-title`.
- `tests/lint_logica_usuari` i `tests/lint-sessio`, en verd.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src` (abans del torn) | 169 fitxers, 1.794/1.797; 3 roges (T36) i 1 suite que no carregava (SelectorIdentitat) |
| `npx vitest run src` (final, 18:22) | **189 fitxers, 2.163/2.163** |
| `node --test` lint-sessio, lint_logica_usuari, backend_consolidacio, migracio-identitat-f1 | 59 verdes, 0 roges, 1 diagnòstic heretat (classes òrfenes de `PageFrame.jsx`, d'abans del torn) |
| `design_guard --arrel=src` | 26 crítics i 5 avisos (abans, 29 i 5). L'única identitat nova és `h1-multiple` de `DocumentPrintPreview.jsx`, heretada de T39–T47 |
| Navegador, mode llavor, /notes a 1440 px | Barra taronja en graella, ploma blanca al centre, cadenat blanc, pastilla d'edició amb l'hora d'ara, targeta viva a la llista sense «(i)», xip «Vista targeta» |
| Navegador, pantalla de 2400 px | Aside de la targeta viva de 384 px, xip amagat |
| Navegador, mòbil de 375 px, /mur | Fletxes agrupades, «+» circular, pastilla de només dia a la targeta de sistema, consola sense errors |
| Navegador, mode remot (localhost:54321), /mur, /xat i /notes | Cap avís de GoTrueClient, cap error de consola, cap recurs 4xx a /notes |

Les revisions adversarials van trobar defectes de severitat mitjana en totes les onades, i tots s'han corregit a l'onada següent o al remat final. Els de severitat baixa que queden són a «Límits».

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### No s'ha pogut fer (i per què)

- **ESTAT, LEDGER i tancament:** el hook bloqueja `.agents/`, i `executor-mutacio.mjs` rebutja qualsevol mutació perquè el segell és divergent («Segell previ invàlid»). `tancament.mjs` no és a la llista d'ordres permeses. La mateixa situació ja constava al relleu anterior.
- **Skills del manual:** `sdp-pedra-seca`, `sdp-universal-page` i `sdp-universal-editor` encara diuen que la ploma és l'autodesament, que la barra d'eines va davall de l'entradilla i que el trio té un altre ordre, i no parlen ni de la targeta viva ni de la regla de la data. El text proposat és al final d'esta secció.
- **Migracions:** no s'han aplicat (el hook no permet `psql` ni la CLI de Supabase). Cal aplicar `2609281500_lema_entradilla_256.sql` ABANS de publicar el client: si no, un lema de 121 a 256 caràcters rep l'avís genèric del servidor (el text es conserva).
- **Data de la Wiki:** 73 de 74 documents no porten data al manifest. És feina del generador `tooling/wiki/compile-wiki-to-app.mjs` (governança). La prova de contracte els compta. Pedaç proposat: que el generador injecte `date` (frontmatter o data de creació del fitxer) i una data de modificació.
- **Aplicacions:** `DetallAplicacio` encara no té cap font de data.
- **Perfil sense emoticona:** `profiles` no té cap camp on desar-la. Cal decidir entre la columna `profiles.icon` (migració) o una RPC.
- **Esborrar fitxers:** no es pot (no hi ha `rm` permés). No n'ha calgut cap.
- **Perfil amb sessió:** no s'ha vist al navegador; el cobrixen proves d'integració.

### Decisions que queden per al Mestre

1. **Xip de 24 px:** el xip «Vista targeta» hereta els 24 px d'alt de la família `.sdp-copyright-selector` («Vista A4 / PDF», «Crear portada»), per davall de `--sdp-touch`. Pujar-la sencera canvia píxels.
2. **Dates en llavor:** les fitxes del Perfil en llavor porten com a data el moment de carregar la pàgina.
3. **Data de servidor de les publicacions:** `updated_at` naix amb la inserció. El marge de 60 s ho resol al client; la solució de servidor és un trigger `before insert` més una esmena de les files antigues (Codex).
4. **Etiquetes privades al Mur:** una connexió compartida porta al Mur les seues categories i etiquetes privades com a `labels`. Ja passava abans.
5. **h1 de la impressió:** l'`h1-multiple` de `DocumentPrintPreview.jsx` són dos `<h1>` de l'HTML d'impressió, dins de template strings. Cal acceptar-lo com a deute o canviar la guàrdia.
6. **Subtítol de la targeta:** el subtítol d'UniversalCard és sempre `h4`, siga quin siga `headingLevel`. Per això el catàleg manté el títol en h3, com l'app.
7. **Seed del Mur:** en llavor, les publicacions no porten cap data i ara baixen al final del Mur, davall de les pàgines de sistema.
8. **Porta del catàleg:** regla C4 proposada per a `tooling/gates/tractor-cataleg.mjs`: una entrada `fora:true` dins de `PedraSeca/` ha de fallar.

### Pendents menors coneguts

- **EstatDesament a l'espècimen:** munta `EstatDesament`, que porta la regió `role="status"`, dins de la barra de mostra; la closca real hi posa només la icona.
- **`dosXifres` d'UniversalCard:** encara és una còpia pròpia.
- **`--sdp-desplegable-ample`:** `Dropdown.jsx` l'escriu, però ja no el llig cap regla.

### Text proposat per a `sdp-pedra-seca` (§10, per a qui puga segellar)

```markdown
## 10. La Barra Taronja (regles del Mestre, 28-09-2026)
- La pastilla de data és sempre present i plena. Lectura: data de creació o de l'última versió si és posterior. Edició: la data triada al calendari o, si no n'hi ha, la d'ara. Mai la data de l'última edició, mai guionets. Una font de només dia es pinta sense hora.
- L'espai central és l'emoticona del document: en edició, sempre un botó (ploma blanca si no n'hi ha cap); en lectura o targeta, buit si no s'ha triat.
- La ploma només vol dir «tria una emoticona». L'autodesament fa servir el núvol (CloudUpload).
- Totes les icones de la barra són blanques dins del cercle de vel fosc.
- El component pare és `src/components/universal/barres/BarraTaronja.jsx`; PageFrame i els espècimens el munten.
```

## Proposta d'Automillora

1. **Llista de shell permesa als prompts.** El hook només deixa passar lectures elementals, `npx vitest run`, `node --test`, `git status/diff/log` i el circuit documental. Cada prompt per a agents locals hauria de portar-la escrita: els subagents que no la saben perden torns contra el bloqueig.
2. **Segell vàlid abans de delegar.** Amb el segell divergent, cap agent pot tancar el torn (ESTAT, LEDGER, `tancament.mjs`). Cal reconciliar-lo abans de cada torn llarg.
3. **Una decisió visual es pregunta al principi.** Quatre preguntes al Mestre a l'inici (targeta, data, plomes, botó) han estalviat una onada sencera de refer.
4. **Revisió adversarial per onada.** Les revisions han trobat defectes reals en totes les onades (textos falsos, dates inventades, proves que no podien fallar), que les proves verdes dels implementadors no veien. Convé mantindre-la.
5. **Navegador net per a verificar.** Una pestanya vella conserva errors d'HMR antics al buffer de consola. Visitar `/registre` força el mode remot per a tot el node (clau `sdp_embed_data-mode-choice:…` a `localStorage`). Cal verificar en una pestanya nova i esborrar la clau en acabar.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[identitat_visual]]
- [[260928_1345_prompt_claude_ultracode]]
- [[260928_1345_pla_implementacio_claude_ultracode]]
