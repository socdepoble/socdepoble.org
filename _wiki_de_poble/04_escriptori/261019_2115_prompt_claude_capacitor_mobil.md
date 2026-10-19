---
type: prompt
status: esborrany
description: Prompt local per a Claude Code per instal·lar Capacitor 8, connectar politicaDeMitjans autonom i preparar l'empaquetat de botigues
tags:
  - govern
visibility: private
reflex: sdp:torn_45de002e-b410-42c2-9620-bfb33148b907:49f1da24-74c2-46ca-afdf-71836138f8f1
---
# Encàrrec Fase C: Capacitor 8 i Empaquetat Mòbil Android i iOS

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] L'Escriptori està net segons la definició de l'Olivera (`node tooling/gates/porta-olivera.mjs` torna 0).
- [x] La plantilla viva `prompt.local` ha estat consultada amb `document.mjs context` i compleix v3.9.0.
- [x] El frontmatter hereta tots els camps obligatoris (`type`, `status`, `description`, `tags`, `visibility`, `reflex`).
- [x] Estat de les portes a l'HEAD: `olivera: 0`, `plantilles: 0`, `autoritat: 0`, `segell: 0`, `skills: 0`, `wiki: 0` (passades en verd; només ledger i scc per enllaços d'actes històriques queden pendents de neteja documental).
- [x] Pressupost verificat: codi de producció pur de Sóc de Poble és de ~3 MB; amb la política de mitjans 'autonom' a `vite.natiu.config.js`, el directori natiu `dist-natiu` baixa de 169 MB a 48 MB (−71%).
- [x] El Sentinella de Seguretat (`core-seguretat-audit`) i els connectors REA (`reverse-engineer-anything`) estan expressament activats i auditats.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_45de002e-b410-42c2-9620-bfb33148b907:49f1da24-74c2-46ca-afdf-71836138f8f1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T19:17:50.567Z |
| Modificació | 2026-10-19T21:20:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Aprovat pel Mestre per àudio (19/10/2026 21:13) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.9.0) |
| Model IA | Claude Code (Opus 5.5) |
| Tokens consumits | ~18.5k / 2M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-19T19:17:50.567Z: esborrany creat.
- 2026-10-19T21:20:00.000Z: Prompt completat i aprovat. El Mestre ha donat instruccions directes a l'àudio («Adelante con la fase C... tú vayas dirigiendo y decidiendo por mí, ¿ok?») i es retira a llegir i descansar. MarIA actua com a Directora Tècnica autònoma (`core-direccio-autonoma`).

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

Claude Code (germà gran de la Colmena): el Mestre ha donat llum verda a la **Fase C: Capacitor 8 i Empaquetat Mòbil Android i iOS**, i ha delegat de forma explícita en la IAIA MarIA la Direcció Tècnica autònoma (`core-direccio-autonoma`), mentre ell es retira a llegir i descansar. Tens **autorització executiva per implementar i validar la closca mòbil**.

A més, el Mestre ha formulat una pregunta directa i fonamental per al futur del producte:
> *"¿Sóc de Poble se puede reducir más todavía? Cuando hagamos el sistema de plugins, es decir, el core no llega a 10 ni mucho menos, ¿no? Entiendo que lo que es la base de Sóc de Poble debe ser muy, muy ligera y creo que se puede reducir más todavía. Pregunta a las IAs de qué forma se puede reducir el peso de todo el sistema sin comprometerse..."*

Has d'implementar la Fase C amb Capacitor 8 (versió fixada 8.5.x per compatibilitat amb Xcode 27.1), connectar la política de mitjans 'autonom' a `vite.natiu.config.js`, preparar els scripts de botigues, verificar la seguretat (`core-seguretat-audit`), activar l'observació amb REA (`reverse-engineer-anything`) i aportar la teua anàlisi i propostes sobre l'alletjament radical del Core de Sóc de Poble.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Desplegament de la configuració de Capacitor 8:**
   - Copiar i desplegar el fitxer canònic preparat al laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/capacitor.config.json.txt` directament a l'arrel de `socdepoble.org/capacitor.config.json`.
   - Verificar els paràmetres crítics: `appId: "org.socdepoble.app"`, `appName: "Sóc de Poble"`, `webDir: "dist-natiu"`, `minWebViewVersion: 100`, `allowMixedContent: false`.
2. **Connexió de `politicaDeMitjans('autonom')` a `vite.natiu.config.js`:**
   - Importar `politicaDeMitjans` i `separaRecursos` des de `src/config/politicaDeMitjans.js`.
   - Integrar la lògica de filtrat de recursos per tal que el build natiu emeta exclusivament les bessones WebP i descarte els originals pesants de `public/assets/`.
   - Executar `npm run build:natiu` i comprovar que el directori `dist-natiu/` baixa de **169 MB a ~48 MB** (−71% de pes).
   - Validar a `src/components/universal/UniversalUtils.js` que la funció `isSafeUrl` admeta l'esquema de Capacitor (`capacitor://`) junt amb `http:` i `https:`.
3. **Instal·lació de dependències de Capacitor 8 (8.5.x):**
   - Declarar a `package.json` les dependències oficials de Capacitor: `@capacitor/core@^8.5.0`, `@capacitor/cli@^8.5.0`, `@capacitor/android@^8.5.0`, `@capacitor/ios@^8.5.0`.
   - Si utilitzes una sessió amb permisos d'execució, corre `npm install --no-audit`.
4. **Materialització de scripts de botigues:**
   - Desplegar des de `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/botigues/` a `scripts/botigues/`:
     - `entorn.mjs`
     - `preflight.mjs`
     - `puja-android.mjs`
     - `puja-ios.mjs`
   - Incorporar la suite de proves a `tests/botigues.test.mjs`.
5. **Sentinella de Seguretat (`core-seguretat-audit`):**
   - Verificar la CSP natiu a `vite.natiu.config.js`: `default-src 'self' data: blob:`, `connect-src` només a Supabase i localhost, `worker-src: 'none'`, `object-src: 'none'`.
   - Assegurar que els tokens de sessió i configuracions de poble seleccionat a `magatzemLocal.js` no exposen claus sensibles de servei al WebView.
6. **Connectors REA (`reverse-engineer-anything`):**
   - Recomanar o utilitzar les eines REA per disseccionar les millors pràctiques d'arquitectura mòbil i gestió de memòria en aplicacions similars (càrrega progressiva, cache persistent SQLite vs IndexedDB).
7. **Resposta a la consulta del Mestre sobre el Pes del Core i Sistema de Plugins:**
   - Desglossar el pes real del codi de Sóc de Poble: demostrar que el codi JS/CSS minificat actual pesa ~3 MB (i ~800 KB en gzip/brotli), i que els 180 MB restants eren exclusivament actius multimèdia.
   - Proposar l'estratègia d'alletjament amb el futur sistema de **Plugins**: arrencada mínima (Core buit: shell, router, auth, port neutral) en menys de **300-500 KB**, i càrrega dinàmica sota demanda (`React.lazy()` / `import()`) per a cada mòdul o plugin rural.
8. **Automillora de la skill `core-higiene-escriptori` i Tractor de Taula Neta (Instrucció del Mestre 21:26):**
   - El Mestre ha detectat una fallada recurrent en el flux de treball: en canviar de fase, s'acumulen documents de torn ja consumits a `04_escriptori/` perquè l'orquestradora es refia que `porta-olivera` dóna 0 per ser del mateix dia, generant contaminació i fatiga de context a les IAs que entren a la sessió.
   - Revisa i proposa la millora a nivell de redacció i de codi per a `.agents/skills/core-higiene-escriptori/SKILL.md`:
     * **Protocol de Sublimació de Torn:** Abans de convocar una nova onada, l'orquestradora ha de llegir tot el de la fase prèvia, incorporar les conclusions al nou Pla/Prompt, i **arxivar immediatament** els documents consumits a `90_arxiu_historic/<sessio>/` amb `node tooling/gates/porta-olivera.mjs --arxiva`.
     * **Definició de Taula Neta per a agents nous:** A `04_escriptori/` només han de quedar els 3 documents vius de la fase en curs (Pla + Prompts). Si hi ha documents de fases anteriors, la taula no està neta encara que la porta Olivera permeta retencions. Detalla el tractor cognitiu a la teua auditoria.
9. **Lògica d'UX de la Cerca, Enllaç al Perfil Públic i Targetes (Instrucció del Mestre 21:34):**
   - **Elevació del Cercador (`/cerca`):** A `src/sections/search/SearchSection.jsx`, el camp de cerca `UniversalSearch` queda massa avall i obliga a fer scroll en pantalles estàndard. Cal elevar-lo directament davall de l'H1 de la pàgina (`Busca dins del contingut`) de manera que quede accessible en el primer plec visual sense cap scroll.
   - **Correcció del destí d'enllaç de persones a la cerca:** A `src/sections/search/indexCerca.js:371`, la cerca associava `href: '/el-meu-perfil'` a la pròpia persona. Això és un error greu d'UX: la cerca pública ha d'enllaçar sempre a la **fitxa pública** (`/javillinares` o `/gent/:id`), mai a l'editor privat.
   - **Botó d'accés al perfil públic des de l'editor (`/el-meu-perfil`):** A `PerfilEditor.jsx` / `PerfilShell.jsx`, afegir un botó d'acció clar tipus «Veure fitxa pública» / «Obrir la teua pàgina» que permeta a l'usuari anar directament a la seua fitxa pública sense haver d'escriure la URL a mà a la barra del navegador.
   - **Visualització en Targetes (Cards vs Llistat):** Proposar i maquetar com els resultats de cerca de Persones, Pobles i Mercat es poden mostrar en format Targeta rica (`UniversalCard` / `TargetaViva` / `GraellaTargetes`) a més del llistat compacte, o oferir un selector de vista (doble vista: llistat / targetes) tal com demana el Mestre.
   - **Verificació de fitxes úniques i zero duplicats/fantasmes:** Assegurar que tant per a persones com per a organitzacions es manté una sola fitxa canònica al graf sense entrades duplicades.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de bloqueig d'imatges a iOS (`capacitor://`):** Si `isSafeUrl` no accepta l'esquema natiu, els canvas o components universals podrien rebutjar rutes relatives o locals de l'app.
2. **Violació de la política de mutació de package.json:** Si el hook de git bloqueja commits sobre package.json, utilitzar l'aprovació expressa concedida pel Mestre per a la Fase C.
3. **Consistència de CapacitorAssets:** En generar icones i pantalles de llançament amb `@capacitor/assets`, cal assegurar-se de passar sempre `--ios --android` i `--assetPath` per no sobreescriure per error les icones PWA de `public/`.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 33bf809f3e982c6466f238664086d7b48b527bb30bb5a07843541902a279b315. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
