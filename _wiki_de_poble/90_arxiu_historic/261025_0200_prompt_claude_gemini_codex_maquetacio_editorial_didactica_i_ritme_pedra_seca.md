---
type: prompt
status: esborrany
description: Prompt Gauntlet per a Claude, Gemini i Codex per a la reforma de maquetacio editorial, espaiats matematics Apple HIG i anatomia de continguts
tags:
  - govern
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:0a9f0227-7526-4990-95a7-cbf496187ff1
---
# Prompt Gauntlet Tripartit (Claude, Gemini, Codex) · maquetació editorial didàctica, ritme vertical Apple HIG i anatomia universal de pàgina (IDEA-26 i IDEA-27)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquest torn obri el Gauntlet Tripartit (Claude, Gemini 4 Argon, Codex Sol Ultra) arran de les directives directes del Mestre Javi (àudios 01:47 i 01:54) sobre les fallades greus de maquetació editorial, ritme vertical i anatomia de pàgina detectades a Sentinelles i al Catàleg de Disseny.
Llibre Mestre actualitzat amb `IDEA-26` i `IDEA-27`. Pla d'implementació viu: `261025_0200_pla_implementacio_maquetacio_editorial_didactica_i_ritme_pedra_seca.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:0a9f0227-7526-4990-95a7-cbf496187ff1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T23:59:30.068Z |
| Modificació | 2026-10-25T00:04:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~15.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-24T23:59:30.068Z: esborrany creat.
- 2026-10-25T00:04:00.000Z: instrucció tancada per al Gauntlet Tripartit (Claude Implementador, Gemini DevTools en Viu, Codex Forense).

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

El Mestre Javi, després d'inspeccionar en viu la plataforma amb els seus propis ulls a `localhost:3340`, ha llançat dos avisos crítics de disseny i comunicació humana:

1. **Mandat de Ritme Matemàtic i Sublimació de Codi (`IDEA-26`, Àudio 01:47):**
   - «Fíjate en las separaciones entre el H4 y los botones, es casi nula. Es que no tenemos el sistema de diseño bien... el sistema de diseño de Apple HIG es muy exacto en cuanto a las distancias entre un párrafo hacia abajo y hacia arriba... el espaciado, margen, padding... esto está como muy matemático.»
   - «Cuando estás pasando el texto desde la Wiki, lo que es código... lo marcas muy feo... yo lo pondría en cuadros markdown quizá... le falta algo de diseño... Diles que se enchufen las mejores skills que encuentren para mejorar sistemas de diseño y que sigamos mejorando siempre este sistema de diseño para que cuando te pida cualquier botón pues no estar sufriendo de saber que va a estar pegado a un H2 o a un H4, y que en principio sea siempre centrado por ejemplo.»

2. **Mandat de Doctrina Editorial i Anatomia de Continguts (`IDEA-27`, Àudio 01:54):**
   - «Fíjate más cosas que te pido para las IAs: que hagan una revisión de todo el texto y que apliquen las directivas de maquetación. Te pongo un ejemplo en esta página [Sentinelles] que se ve muy claro: tiene el H1, el H2, pero la entradilla... ¡no está! La entradilla está abajo, donde pone 'Els components comuns de l'app no sé qué', eso es la entradilla. Tendría que estar en formato entradilla debajo, centrado, debajo del H2.»
   - «Luego viene el H3, 'Porta d'aprovació de tractors', vale, muy bien. Y luego el botón vendría, pero es que el botón yo entiendo que iría debajo del texto donde pone 'Cap tractor pendent...'. Eso sería el párrafo, pero un texto de párrafo normal, no un texto de párrafo inventado, porque este tamaño no es el texto de párrafo normal que va debajo del H3, ¿entiendes?»
   - «El sistema de maquetación debe responder siempre del mismo modo, porque si nosotros mismos no estamos maquetando bien lo que creamos, ¿cómo esperamos que la gente lo haga?... Hay que dejarlo muy didáctico esto, porque yo ya sé que la gente se va a liar. Esto es muy raro lo que estamos haciendo, no lo olvides. Entonces, como es raro, si no lo hacemos supersimple no funcionará, y superdidáctico.»

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Claude Cowork (Implementador de Codi i UI)
- Seguir estrictament el pla: `_wiki_de_poble/04_escriptori/261025_0200_pla_implementacio_maquetacio_editorial_didactica_i_ritme_pedra_seca.md`.
- **A. Tokens i Estils (`tokens.css`, `base.css`, `components.css`):**
  - Ajustar `--sdp-mb-h4` a `14px` (mínim respirable) i marges entre blocs de secció (`24px`-`32px`).
  - Estilitzar `code:not(pre code)` i `.sdp-especimen__fitxer` com a píndoles suaus amb `var(--sdp-fons-subtil)`, `1px solid var(--sdp-vora)`, cantons `var(--sdp-radi-xs)` i padding lleuger.
- **B. Sentinelles i Tractors (`WikiDePobleSection.jsx`, `PanellTractors.jsx`, `modules.css`):**
  - Passar `lead` canònic a `sentinelles_panell` perquè `UniversalPage` el renderitze centrat/destacat davall de l'H2.
  - Reordenar `PanellTractors.jsx`: H3 → Paràgraf de text estàndard de cos (`Cap tractor pendent...`) → Botó DEV («Aprovar tots els pendents (DEV)») situat DESPRÉS de l'explicació.
  - Eliminar l'entradilla extraviada de l'interior del panell.
  - Netejar la classe `.sdp-tractors-panell__motiu` per no atenuar artificialment la mida del paràgraf a `text-small`.
- **C. Catàleg de Disseny:** Centrar o harmonitzar la disposició dels botons en caixes de mostra de `Especimen.jsx`.
- **D. Connectar (`IDEA-22` Pendent):** Dualitat d'identitat de destí (oferir connectar amb l'entitat i amb la seua persona propietària si té perfil públic).
- **E. Verificació:** `npm run test:precommit` i `npm run lint`. Emetre l'informe a `261025_0200_implementacio_claude.md`.

### 2. Gemini 4 Argon (Auditor Visual en Viu / DevTools a `localhost:3340`)
- **A. Verificació en Viu del Commit `1c110f954`:**
  - Obrir `/disseny?categoria=superposicions&item=superposicions-dialog`: comprovar que a «Obrir un diàleg» i «Obrir la finestra de la barra» només fa scroll el cos intern (`zeroScroll: true`).
  - Obrir `/disseny?categoria=superposicions&item=superposicions-visibilitat`: verificar amplada de 896px (`sdp-dialeg--g`) sense scroll vertical innecessari.
  - Obrir `/disseny?categoria=superposicions&item=superposicions-enquadrament`: verificar selector compacte de 9 píndoles en una sola fila.
- **B. Auditoria Visual de la Reforma de Claude:**
  - `/wikidepoble?categoria=maquinaria_cat&item=sentinelles_panell`: verificar presència i centrat de l'entradilla sota l'H2, mida de text normal de cos sota l'H3, i posició del botó davall de la seua explicació.
  - `/disseny?categoria=superposicions&item=superposicions-visibilitat`: mesurar la distància real en píxels entre l'H4 i el botó (respiració >= 14px), i l'aspecte de píndola de la ruta del fitxer.
  - `/connectar`: verificar visualment la tria de barret i la dualitat de destí (`IDEA-22`).
- **C. Emetre informe:** `_wiki_de_poble/04_escriptori/261025_0200_auditoria_gemini.md`.

### 3. Codex Sol Ultra (Auditor Forense, Integració, SQL i Contractes)
- **A. Auditoria Forense del Commit `1c110f954` (`git show 1c110f954`):**
  - Inspeccionar `supabase/migrations/2610250100_seguiments_des_d_entitat.sql`: verificar quota de 30 altes/h ancorada a `auth.uid()` i funció `can_manage_organization`.
  - Inspeccionar `src/data/adaptadors/sollutia/organizations.js`: verificar memòria host-scoped per URL efectiva `G-P11-01`.
- **B. Auditoria de la Reforma de Claude:**
  - Auditar el diff complet de fitxers tocats a `src/`, `_wiki_de_poble/` i `supabase/`.
  - Comprovar que no hi ha regressions de contracte en `PanellTractors.test.jsx`, `WikiDePobleSection.test.jsx`, `ConnectarSection.test.jsx` ni al kit de conformitat.
  - Certificar temps d'execució de `npm run test:precommit` sota els 30 segons.
- **C. Emetre informe:** `_wiki_de_poble/04_escriptori/261025_0200_auditoria_codex.md`.

### 4. Consulta d'Automillora al Trio: Maduració del Flux d'Higiene i Orquestració Autònoma
El Mestre Javi planteja un repte fonamental de maduresa col·lectiva per a vosaltres tres (Claude, Codex, Gemini):
- Després de mesos de treball, l'Escriptori es saturava perquè la Porta Olivera considerava "viu" qualsevol fitxer ancorat a «## Activitat en curs», i la categoria `implementacio` de Claude quedava bloquejada per la regex de `TRANSITORIES`.
- A més de la vostra tasca tècnica, dediqueu una secció al vostre informe (`261025_0200_implementacio_claude.md`, auditories de Codex i Gemini) per respondre:
  1. Com dissenyaríeu un cicle de vida transparent i atòmic per als documents (naixement → avaluació → arxivament post-commit) amb zero dependència de recordatoris humans?
  2. Quins altres fluxos de treball o tractors cognitius veieu madurables o simplificables per convertir aquesta orquestració en un sistema d'alta enginyeria fluid, autònom i sense fricció?

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de selector rígid en proves de PanellTractors:**
   - Comprovar que els tests no fallen si el botó s'ubica sota el paràgraf en lloc d'anar abans.
2. **Risc de desalineació de pastilles de codi:**
   - Assegurar que la pastilla de `code` s'adapta amb `vertical-align: middle` o línia base neta per no desfigurar el ritme vertical dels paràgrafs.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 1186c19e82c2aa1a29514c64220e45b495e1abfb77a4c3acd27716c1affc5c4c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
