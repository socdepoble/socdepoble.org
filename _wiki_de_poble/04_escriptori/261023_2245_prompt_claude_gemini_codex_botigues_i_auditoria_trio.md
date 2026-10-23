---
type: prompt
status: esborrany
description: Convocatòria a tres bandes (Claude, Gemini, Codex) per al llançament a botigues, prevol i auditoria del sistema
tags:
  - govern
visibility: private
reflex: sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:f4d95c1b-e9ed-4fef-9183-4d537787bf2b
---
# Prompt Canònic d'Execució i Auditoria a Tres Bandes — Botigues Mòbils i Auditoria Adversarial

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a la Colmena d'agents locals amb accés natiu a disc (Claude Opus 5.5, Gemini 4 Argon i Codex Sol Ultra) en estricta igualtat de condicions operatives.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori netejat amb Porta Olivera: Codi 0 confirmat.
- [x] Pla d'implementació viu i aprovat pel Mestre: `_wiki_de_poble/04_escriptori/261023_2245_pla_implementacio_botigues_i_auditoria_trio.md`.
- [x] Torn obert: `torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b`.
- [x] Repartiment d'actors locals a disc: Codex Sol Ultra (Auditor Adversarial) + Gemini 4 Argon (Potència, Binaris i Integritat) + Claude Opus 5.5 (Execució i Prevol Botigues).
- [x] Orquestradora i Directora Tècnica: IAIA MarIA (coordina, arbitra i teixeix el diàleg creuat entre les tres).
- [x] Git sincronitzat amb remote (`fork/backup-notes-publish`, commit `95175575d`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_db5a99fd-b6c3-40c7-a1c1-bde6439dd49b:f4d95c1b-e9ed-4fef-9183-4d537787bf2b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T20:41:51.976Z |
| Modificació | 2026-10-23T20:44:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon + Codex Sol Ultra |
| Tokens consumits | ~ |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-23T20:41:51.976Z: Convocatòria canònica a tres bandes ordenada pel Mestre Javi Llinares per preparar el llançament a Google Play i Apple App Store, acompanyat d'una auditoria adversarial de Codex i verificació de Gemini.

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

Ordre directa del Mestre Javi Llinares (Convocatòria a Tres Bandes):
1. **Codex Sol Ultra (Auditor Adversarial · El Tercer Ull):**
   - Executar una auditoria forense adversarial implacable de l'estat actual del repositori (`b082b13`). Donar «una altra visió» desapassionada i crítica de tot el sistema després de les últimes novetats (desplegament viu a Firebase, curació del Service Worker R1+R2, aprimament del connector WordPress a 2.8 MB, i puresa visual del xat).
   - Avaluar conformitat amb les polítiques estrictes d'Apple App Store (Guideline 2.1 controls inerts/pantalles incompletes, 5.1.1 privacitat i flux d'esborrat de compte a `/legal#esborra-compte`, Guideline 4.0/4.2 valor natiu) i Google Play Console.
   - Detectar qualsevol punt cec, risc de seguretat o inconsistència estructural. Emetre informe canònic a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_codex.md`.
2. **Gemini 4 Argon (Verificació de Potència, Binaris i Integritat):**
   - Avaluar amb la seua potència d'anàlisi l'impacte de totes les novetats en la salut global del sistema.
   - Comprovar la paritat dels binaris natius i les mides d'empaquetat (`dist-natiu/`, `dist/`, `socdepoble.zip` a 2.8 MB, AAB de release).
   - Validar que els actius gràfics natius (`Assets.xcassets` vs `res/mipmap`) no contenen canal alfa i respecten el verd canònic `#0F672F`. Emetre informe canònic a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_gemini.md`.
3. **Claude Opus 5.5 (Execució Tècnica i Prevol de Botigues):**
   - Dirigir la configuració de `.env.botigues.local` amb el Mestre i executar el prevol `node scripts/botigues/preflight.mjs --plataforma totes`.
   - Executar `./gradlew bundleRelease` per generar l'AAB d'Android (`android/app/build/outputs/bundle/release/app-release.aab`) i guiar l'obertura d'Xcode (`npx cap open ios`) per a la pujada a TestFlight / App Store Connect esta mateixa nit.
4. **Consens, Diàleg Creuat i Mode Automàtic a l'Escriptori:**
   - Totes tres IAs (Claude Opus 5.5, Gemini 4 Argon i Codex Sol Ultra) teniu accés natiu directe al disc en estricta igualtat de condicions operatives.
   - Treballeu de manera autònoma dipositant les conclusions dels vostres blocs a `_wiki_de_poble/04_escriptori/` (`AAMMDD_HHMM_auditoria_[nom].md`).
   - Heu de llegir de forma continuada els documents que les altres companyes vagen deixant a l'Escriptori per a produir un diàleg creuat i enriquir les conclusions conjuntament.
   - La IAIA MarIA actua com a Directora Tècnica i representant del Mestre Javi Llinares: supervisa els informes, arbitra les divergències i prepara la decisió final per al desplegament.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### T1 · Resolució del Prevol Mòbil (`scripts/botigues/preflight.mjs`)
- Validar les eines natives i revisar les claus que falten a `.env.botigues.local`.
- Guiar la signatura d'Android (Keystore) i el Team ID d'Apple.

### T2 · Auditoria Adversarial Implacable (Codex Sol Ultra)
- Escaneig de controls inerts al xat i a les pàgines universals per evitar rebuig a l'App Store.
- Comprovació de la privacitat de dades i flux d'esborrat de compte.

### T3 · Verificació de Paritat i Binaris Natius (Gemini 4 Argon)
- Validar que les imatges de llançament (`Assets.xcassets`) no tenen canal alfa i respecten `#0F672F`.
- Verificar que el paquet natiu d'Android genera un AAB vàlid per a Google Play Console.

### T4 · Compilació de Release i Lliurament (Claude Opus 5.5)
- Execució de compilació neta de release per a Android (`app-release.aab`).
- Verificació del target d'iOS a Xcode.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Bloqueig per absència de claus d'API a App Store Connect:** Mitigació: Si no es disposa de la clau `.p8`, la pujada a Apple es realitza mitjançant Xcode natiu (`Product -> Archive -> Distribute App`), procediment 100% oficial i natiu a macOS.
- **Rebuig per controls inerts:** Mitigació: L'auditoria de Codex detectarà botons sense acció per aplicar `esAppNativa()` o rutes informatives abans de la tramesa.

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
