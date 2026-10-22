---
type: prompt
status: esborrany
description: Prompt d'execucio per a Claude, Gemini i GPT Codex (amb direccio de MarIA) per a retirar el boto PWA, reduir el pes del connector de WordPress a menys de 2.5 MB, connectar amb l'autor i auditar la didactica del sistema.
tags:
  - govern
visibility: private
reflex: sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:88a0a4c5-f89a-451d-88fb-b36fd1e461e2
---
# Prompt Canonic per a Claude, Gemini i GPT Codex — Alleugeriment WP, PWA i Auditoria Didactica

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a l'Eixam (Claude, Gemini 4 Argon / 1.5 Pro, i GPT Codex sota la direcció de la IAIA MarIA).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. **Estat de l'Escriptori:** Net i verificat amb `porta-olivera.mjs` (0 documents orfes de torns passats).
2. **Llibre Mestre:** Consulteu obligatòriament `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
3. **Pla Vigent:** Lligat al pla `261021_2345_pla_implementacio_alleugeriment_wp_pwa_i_auditoria_didactica.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:88a0a4c5-f89a-451d-88fb-b36fd1e461e2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T21:39:57.728Z |
| Modificació | 2026-10-21T23:00:00.000Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude 3.7 Sonnet / Gemini 4 Argon High / GPT Codex (o1-pro) / MarIA |
| Tokens consumits | [procediment en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-21T21:39:57.728Z: esborrany creat.
- 2026-10-21T21:42:00.000Z: instruccions completes d'alleugeriment WP, retirada PWA, avatar xat, respostes IAIA i auditoria didàctica humana a tres bandes.

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

Aquest torn convoca la Colmena a tres bandes (**Claude + GPT Codex + MarIA**) sota la direcció del Mestre Javi Llinares.

🔥 **DIRECTIVA SUPREMA DE DIRECCIÓ AUTÒNOMA (El Mestre no hi serà):**
El Mestre Javi Llinares delega expressament tot el comandament tècnic i la resolució de dubtes en l'orquestradora (IAIA MarIA). Està terminantment prohibit aturar-se a meitat camí per demanar confirmacions humanes o traure un botó perquè l'usuari clique, ja que el Mestre no hi serà durant la nit. Resoleu els dubtes internament i avanceu de forma 100% autònoma fins al final.

🔬 **MANDAT INNEGOCIABLE DE REA (Enginyeria Inversa Real):**
L'anàlisi d'Obsidian (`/Applications/Obsidian.app`) s'ha d'executar OBLIGATÒRIAMENT mitjançant les eines de REA (*Reverse Engineer Anything*) aplicant la metodologia d'Emowe (`_wiki_de_poble/04_escriptori/02_investigacio_ia/rea-sin-humo.pdf`). Si alguna IA no té les eines REA actives, les ha d'instal·lar immediatament (`github.com/morluto/rea` o `npx -y rea-agents@6.5.0 mcp`). No s'admeten aproximacions superficials sense disseccionar el binar físic.

Els objectius són dos grans blocs d'acció:
1. **Accions Mecàniques Immediates d'Alleugeriment i Poliment:**
   - Retirar temporalment el botó PWA «Instal·la al teu ordinador / telèfon» per no confondre els beta testers aquesta nit.
   - Alleugerir radicalment el ZIP del connector de WordPress (`socdepoble.zip`), desallotjant les imatges estàtiques pesades (39 MB descomprimits) cap al Supabase Storage / URLs canòniques, deixant el ZIP final per davall de 2,5 MB (molt lluny del límit de 10 MB).
   - Polir el Xat: corregir l'avatar de la comunitat Sóc de Poble perquè mostri el logo verd quadrat oficial en comptes de «SD», activar la resposta oficial/frase feta de la IAIA MarIA en remot, i mostrar botons clars de connexió/registre per a visitants sense sessió.
   - Polir la fitxa de persona: eliminar la duplicitat de l'avatar redó de 300px davant de l'H1 quan ja està a la Barra Taronja.
2. **La Gran Auditoria Didàctica i d'Interacció Humana («El Veí del Poble»):**
   - Assumir la perspectiva d'un veí del poble o usuari sense coneixements tècnics que entra per primera vegada a la plataforma.
   - Auditar eines com Gestoria (`/plugin/gestoria`) i Lector RSS (`/plugin/rss`):
     - Falten textos didàctics que expliquen de forma planera i humana què és l'eina i com s'utilitza.
     - L'estat buit («Este node no porta esta app») no pot tindre un botó «Obrir» que no funciona; ha d'oferir un botó clar de **«Descarrega / Instal·la l'extensió a este node»** i una opció de **«Desactiva esta eina»**.
   - Revisar les preguntes obertes del Llibre Mestre de Tasques (`03_llibre_mestre_tasques_i_idees.md`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (UI PWA):** Ocultar el botó `BotoInstalaApp` a la Barra Negra (`header.bar-black`) mantenint net el codi per quan es reactive en el futur.
- [ ] **Tasca 2 (Connector WP < 2.5 MB):** 
  - Analitzar `wordpress-plugin/dist/assets/` i retirar els binaris d'imatges pesats de mostra.
  - Assegurar que els components resolen les imatges cap a `https://socdepoble.org/assets/...`.
  - Reempaquetar el connector a `_builds_de_poble/wordpress/socdepoble.zip` i verificar que la mida és inferior a 2,5 MB.
- [ ] **Tasca 3 (Xat i Identitat):**
  - Configurar l'avatar de la comunitat «Sóc de Poble» al xat amb el logotip oficial quadrat verd.
  - Implementar o connectar la resposta de cortesia/benvinguda de la IAIA MarIA en mode remot.
  - Afegir el botó de crida a l'acció («Connectar-se / Registrar-se») als peus del xat quan s'accedeix sense sessió.
- [ ] **Tasca 4 (Unificació del Perfil de Javi Llinares i Retirada d'Avatar Duplicat):**
  - **Ordre directa del Mestre (261022):** Conviuen dos perfils diferents de Javi Llinares. Cal **eliminar el vell** i deixar només el perfil bo i canònic:
    * *Perfil vell a extirpar:* H2 «Coordinador del projecte Sóc de Poble» i entradilla «Coordinador i visionari darrere del projecte Sóc de Poble» (a `src/data/agentsSeed.js` JAVI).
    * *Perfil bo a consolidar:* H1 «Javi Llinares», poble «La Torre de les Maçanes», H2 «La Torre de les Maçanes», i entradilla oficial: *«Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.»* (el que es veia a la ruta llarga d'UUID `cc74bb...`).
  - Assegurar que tant `/javillinares` com `/gent/javillinares` resolen de forma unificada i neta la fitxa bona del Mestre.
  - Eliminar l'avatar redó de 300px duplicat sobre l'H1 per a persones físiques (l'avatar només viu a la Barra Taronja).
  - Actualitzar els tests associats a `PerfilPublicSection.test.jsx`.
- [ ] **Tasca 5 (Auditoria Didàctica Humana):**
  - Auditar exhaustivament les pantalles `/plugin/gestoria`, `/plugin/rss`, `/notes`, `/mercat`, `/pobles`.
  - Emetre l'informe didàctic assenyalant:
    1. On falta text pedagògic per als veïns.
    2. On hi ha estats buits confusos o botons enganyosos.
    3. Proposta de redacció en valencià planer i trellat rural.
- [ ] **Tasca 6 (Connectar amb l'Autor · Xarxa Humana Rural):**
  - Auditar i dissenyar a `/connectar` (`ConnectarSection.jsx` / `useConnectaTargeta.js`) l'opció explícita de **Connectar amb l'Autor**.
  - No només desar la pàgina/card al Mas, sinó permetre establir connexió humana directa amb la persona o entitat creadora, preparant la base de dades i la interfície per a visualitzar qui està connectat amb qui.
- [ ] **Tasca 7 (Metodologia REA Sense Fum d'Emowe: Deconstrucció d'Obsidian Local, Bring! i Loyverse):**
  - 🎥 **VÍDEO OBLIGATORI DE YOUTUBE D'EMOWE:** [https://youtu.be/YpKpragPGyk?si=UCVcSYDL6imUlxBt](https://youtu.be/YpKpragPGyk?si=UCVcSYDL6imUlxBt)
    *(On Marcos / Emowe explica pas a pas com va recrear el seu propi Obsidian en 22 minuts amb REA, graf de nodes i suport per a 7.000 notes).*
  - 📄 **DOCUMENT DE REFERÈNCIA A L'ESCRIPTORI:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/rea-sin-humo.pdf`
  - 💻 **APLICACIÓ LOCAL DISPONIBLE PER A REA:** `/Applications/Obsidian.app` (paquet Electron a `Contents/Resources/app.asar`).
  - **Els 4 Passos d'Emowe (Obligatoris per no cremar context):**
    1. *No demaneu clonar l'app sencera de colp:* Demanar una cosa concreta (el graf, la cerca, els enllaços bidireccionals `[[...]]`).
    2. *Demanar primer el mapa:* Analitzar només els fitxers propis del programa, ignorant les llibreries enormes de tercers per no quedar-se penjat.
    3. *Interrogar amb preguntes curtes i proves:* Cada conclusió ha d'indicar d'on ix (fitxer o funció) i distingir entre confirmat, deduït o desconegut.
    4. *El manual abans que el codi:* Redactar primer el manual de comportament de la funcionalitat en un informe a `04_escriptori/`, i només després implementar la nostra versió neta a Sóc de Poble (`UniversalWorkspace` / Bloc de Notes) sota el disseny Pedra Seca.
  - **Els Prompts REA d'Emowe a aplicar:**
    * *Prompt 1 (El mapa primer):* `Con REA, haz solo un mapa de /Applications/Obsidian.app: qué partes tiene, con qué tecnología está hecha y qué ficheros son suyos y cuáles librerías de terceros.`
    * *Prompt 2 (Pruebas y límites):* `Para cada conclusión, dime de dónde la sacas (fichero o función) y márcala como confirmada, deducida o desconocida.`
    * *Prompt 3 (Una función a la vez):* `Entiende cómo funciona [el grafo de vínculos bidireccionales / la sincronización local / los paneles plegables] en Obsidian y enséñame las pruebas.`
    * *Prompt 4 (El manual antes que el código):* `Escribe un manual de comportamiento de [la función] sin copiar código. Lo construiremos en Sóc de Poble a partir de esa especificación.`
- [ ] **Tasca 8 (Deconstrucció de WhatsApp amb REA i Multimèdia Interactiva al Xat):**
  - Aplicar REA al patró de WhatsApp (`sdp-clon-whatsapp`) per fer el Xat plenament operatiu per als veïns:
    1. **Àudios:** Enregistrament i reproducció operativa de missatges de veu directes al fil de conversa.
    2. **Imatges:** Pujada i previsualització d'imatges operatives.
    3. **Vídeos curts:** Prova pilot de clips de fins a 10 segons.
    4. **Trellat Rural i Quota de Dades:** Sostre de 20 MB per usuari. En arribar al límit, missatge proper de poble: *«Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!»*.
- [ ] **Tasca 9 (Auditoria Forense de Rendiment i Càrrega Remota):**
  - **Problema observat en viu pel Mestre:** Càrrega excessivament lenta amb spinner infinit en entrar a `socdepoble.org/gent/...` i error a la consola: `GET https://socdepoble.org/favicon.svg 500 (Internal Server Error)`.
  - Auditar la cadena de resolució (`loadPerfilPublic`, queries de Supabase, gestió d'Auth a `personaDeSessio.js` i rewrites de Firebase per a recursos estàtics) per eliminar els colls d'ampolla i reduir el temps de càrrega a menys d'1 segon.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Imatges trencades en el connector:** Cal validar que cap component de la SPA depenga de rutes relatives locals del connector per a carregar il·lustracions del poble, sinó de les URLs absolutes ja desplegades.
- **Sobreescriptura de sessions en proves:** Treballar amb fixtures i verificar que les proves unitàries continuen passant amb 100% d'èxit.

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
