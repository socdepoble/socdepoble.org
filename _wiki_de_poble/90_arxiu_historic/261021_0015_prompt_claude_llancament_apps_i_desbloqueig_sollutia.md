---
type: prompt
status: canonic
description: 'Prompt executiu per a Claude Code en xat nou: consolidar ''Tot en un commit'', afegir plataforma Android, compilar socdepoble-beta.apk, PWA install i bypass Sollutia.'
tags:
  - govern
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:0087f3a7-7075-41fd-bece-bdc0e431b94b
---
# Prompt Local per a Claude Code: Llançament Apps (Android APK + PWA Desktop) i Desbloqueig Sollutia

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. El repositori ha superat la purga de 3.2 GB de brossa física (builds antigues eliminades, neteja d'arrels temporals).
2. Totes les 20.312 proves de Vitest estan en verd.
3. El commit pendent de la Fase D s'ha d'aplicar com a «Tot en un commit».

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:0087f3a7-7075-41fd-bece-bdc0e431b94b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T21:40:08.000Z |
| Modificació | 2026-10-20T23:55:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio 23:35) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Code (Opus 5.5) |
| Tokens consumits | ~15k / 200k |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-20T23:35:** El Mestre demana reiniciar xat fresc amb Claude per evitar compactació de context (estava al 94%) i encarar les dues missions finals per a demà al matí: apps a les mans dels beta testers i desbloqueig de `socdepoble.org` amb Sollutia.
- **2026-10-20T23:45:** Acta Marmota redactada (`261020_2345_acta_marmota_relleu_salfumant_markdown_i_llancament_app.md`) i Escriptori netejat.

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

Claude, aquest és un xat net amb la memòria al 100% de claredat. La teua missió és deixar enllestit el paquet complet perquè demà a primera hora el Mestre puga entregar l'aplicació als beta testers i tindre resolta la sortida en línia de `socdepoble.org`.

**🚨 DIRECTIVA D'AUTONOMIA NOCTURNA (ZERO MODALS / ZERO INTERRUPCIONS):**
El Mestre se'n va a dormir i **NO estarà davant de la pantalla** per respondre quadres de confirmació interactiva (com «Execute el commit amb --no-verify?», «Tot en un commit», etc.). Tens aprovació humana prèvia i explícita delegada pel Mestre (`core-direccio-autonoma`):
1. **Zero preguntes blocants:** No llançar prompts ni diàlegs interactius d'espera. Executa directament els passos amb les opcions necessàries (`--no-verify`, etc.).
2. **Decisió autònoma:** Si et trobes davant de dues alternatives tècniques, aplica el Trellat, tria tu la via més robusta i conservadora, i continua l'execució fins al final.
3. **Traçabilitat:** Deixa totes les decisions preses explicades al teu informe final a `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Consolidació del Commit Pendents:**
   - Si no s'ha fet, confirma el commit dels canvis anteriors seleccionant l'opció «Tot en un commit».
2. **Plataforma Android (Capacitor):**
   - Comprova `capacitor.config.json` (`webDir: "dist-natiu"`).
   - Executa `npm run build:natiu`.
   - Executa `npx cap add android` si no existeix encara la carpeta `android/`.
   - Executa `npx cap sync android`.
   - Compila l'APK de prova: `cd android && ./gradlew assembleDebug`.
   - Copia l'APK generat a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk` per a descàrrega directa dels beta testers.
3. **PWA Desktop (Mac, Windows, Linux):**
   - Assegura que l'esdeveniment `beforeinstallprompt` s'escolta correctament a l'escriptori i permet instal·lar l'aplicació com a finestra autònoma de sistema.
4. **Dossier de Desbloqueig Sollutia:**
   - Redacta o verifica les instruccions tècniques exactes per a sol·licitar a Sollutia la delegació DNS (`CNAME` / `A`) o el desplegament estàtic del paquet `dist/`.
5. **Empaquetament Plugin WordPress v1.1.8:**
   - Compila la versió actualitzada del connector (`SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp` i `npm run build:wp:directori`) per incorporar el fix del parser Markdown, el botó `[Registra't]` directe i la targeta viva `UniversalListCard`.
6. **Esmena Tipogràfica Editorial (H3) a les Presentacions de Plugins:**
   - Revisa `src/sections/plugins/presentacioPlugins.js` i els estils editorials perquè els títols de bloc de la presentació (com `La nevera i el rebost de casa`) utilitzen l'escala H3 canònica i la tipografia editorial de `core-llegibilitat-text`.
7. **Unificació Atòmica de la IAIA MarIA (`/iaia`), Resolució del Fiasco Visual i Neteja de Pantalles Disperses:**
   - **Ordre del Mestre Javi Llinares (Instrucció directa per àudio 00:37 i 01:10):** La Directora Tècnica (Antigravity/MarIA) no toca codi; **tu (Claude Code) ets l'executor únic (Picapedrer)** encarregat d'implementar tota aquesta solució neta, sòlida i provada.
   - **Capçalera canònica i oficial de Sóc de Poble a `/iaia`:**
     * **Logotip Oficial Rectangular de Sóc de Poble (`DEFAULT_AUTHOR.logo`):** Damunt del títol `IAIA MarIA` (com a totes les pàgines de Sóc de Poble), certificant que és una creació oficial del Mas electrònic de Sóc de Poble.
     * **Eliminació de l'Avatar Circular de 300px davall de la BarraTaronja:** No es repeteix la cara de la IAIA sota la barra taronja (`avatarDeLaFitxa = null`), ja que viu a la mateixa BarraTaronja.
     * **BarraTaronja canònica:** Mostra a l'esquerra l'avatar de la IAIA MarIA (amb el mòbil), el nom «IAIA MarIA», poble «La Torre de les Maçanes» i la **pastilla de data i hora** (passant `creat: agent.created_at` i `modificat: agent.updated_at` al DTO de `perfilDeLaIADelPaquet`).
     * **Lèxic Obligatori:** Mai dir «la masia»; sempre **el Mas** (o el Mas electrònic/virtual).
   - **Hero d'alta definició** amb la imatge de capçalera retallada sense vora blanca (`iaia_maria_avatar.webp`).
   - **Botó centrat sota el lema:** Botó primari `[Parla amb la IAIA]` centrat just sota el lema «Pensant en global, treballant en local», seguit del bloc d'avís de màquina en proves.
   - **Presentació i targetes bidireccionals:** Presentació completa («Qui és la IAIA MarIA?»), amb la `UniversalCard` viva de `L'Ànima de la IAIA` (`/anima`) incrustada al seu text, i viceversa a `/anima`.
   - **Selector de Realitat Integrat (Bloc de 4 nivells):** Directament al peu de la presentació, amb amplada completa (`width: 100%`) sense estrènyer a `--sdp-measure`.
   - **Netedat al menú i redireccions:** `/realitat` redirigeix netament a `/iaia`, i «L'ànima de la iaia» porta exclusivament a `/anima`.
8. **Mida del Logotip a la Barra Lateral (`.brand img` a `src/css/layout.css`):**
   - El logotip de la sidebar estava fixat a només 130px d'ample, quedant petit i desproporcionat en la columna de 260px.
   - **Augmentar a 195px** (entre 190px i 200px segons mesura del Mestre), assegurant coherència i presència tant amb el menú desplegat (260px) com plegat (`.sidebar-closed .brand` a 232px).
9. **Botó d'Instal·lació de l'Ordinador (`BotoInstalaApp` a `src/css/utilities.css`):**
   - **Disseny contingut i estilitzat estil Apple:** Reduir alçada a 32px (`height: 32px; min-height: 32px;`), tipografia més fina (`font-size: 0.8125rem; font-weight: 500;`), píndola suau (`border-radius: 9999px;`) i icona de 15-16px.
   - **Respiració lateral generosa:** Deixar 20px a 30px de marge lateral (`margin-inline: 20px; padding: 0 16px;`) perquè respire i no llebe protagonisme ni oprema les icones contigües (idioma, IAIA, sessió).
10. **Navegació Enrere des del Xat cap a la Pàgina d'Origen:**
   - Quan l'usuari entra al Xat des de `/iaia` (fent clic a «Parla amb la IAIA») o des d'una altra fitxa de perfil, en escriptori no hi ha mecanisme intern per a tornar a la pàgina d'origen sense fer ús de les fletxes del navegador.
   - Habilitar mecanisme de retorn clar: fletxa `ArrowLeft` o opció de retorn tant a la capçalera de la conversa (`CapcaleraConversa.jsx`, eliminant el bloqueig exclusiu `d-mobile-only` quan hi ha històric previ o permetent tornar a la pàgina d'origen) com a la columna de converses.
11. **Reforma Didàctica Radical del Selector de Realitat (`SelectorRealitat.jsx`):**
   - **Instrucció Expressa del Mestre Javi Llinares:**
     * **Elimina completament qualsevol referència a «la barra negra»:** L'usuari no entén què és eixa «barra negra» ni té sentit parlar de reposar/activar-se en ella.
     * **Textos Didàctics i Pedagògics Individuals (sense duplicacions):**
       - **Nivell 0 · Apagada:** «La intel·ligència artificial està completament desconnectada. L'aplicació funciona de manera tradicional: només tu i la gent del poble, amb privadesa manual absoluta i zero intervenció d'assistents.» (Targeta: «Completament apagada · Zero IA»).
       - **Nivell 1 · Passiva:** «La IAIA MarIA i els assistents estan en silenci i a l'espera. Només respondran si tu els fas una pregunta directa o demanes la seua ajuda; mai no prendran la iniciativa ni t'interrompran.» (Targeta: «En espera · Només respon si tu li preguntes»).
       - **Nivell 2 · Interactiva:** «Col·laboració activa amb els acompanyants que tu tries. Els assistents seleccionats t'ajuden a redactar missatges, traduir o proposar idees al mur i al xat.» (Targeta: «Activa · Amb els acompanyants que tries tu»).
       - **Nivell 3 · Connexió total:** «El Mas connectat en comunitat plena. Tots els assistents (la IAIA MarIA, El Gall del temps, El Pregoner, L'Artiste Nano Banana...) col·laboren automàticament per dinamitzar i cuidar el poble.» (Targeta: «Comunitat plena · Tot el Mas al teu servei»).
     * **Usabilitat Clau (Desplegable a la mateixa Card):** La llista/graella de selecció d'acompanyants ha d'aparéixer **directament com un acordió o desplegable integrat a la mateixa targeta de Nivell 2 (Interactiva)**. Si l'usuari clica «Interactiva», els acompanyants s'obrin allà mateix per triar-los, sense aparéixer com un bloc solt al fons que ningú veu en mòbil o escriptori.
12. **Purga Immediata i Dignificació del Cens Rural d'IA (`agentsSeed.js` i `identitatsSeed.js`):**
   - Extirpa del cens de caràcters d'IA les caricatures estranyes que enfurismen el Mestre («Súper Ratolí», «Flash optimitzador», «Sultan seguretat DID», «Mixa», «generador de batecs»).
   - Mantén i consolida exclusivament el planter oficial autèntic de 5 assistents rurals:
     1. **IAIA MarIA** (Matriarca Digital, Saviesa i Memòria del Mas)
     2. **Nano Banana («L'Artiste»)** (Dibuixant del poble, Bruguera/Berlanga)
     3. **Marc (El Gall)** (Meteorologia, oratge i alertes del camp)
     4. **El Pregoner** (Bans municipals, avisos oficials i difusió comunitària)
     5. **L'Acompanyant de Paraula** (Assistent de redacció i transcripció per a veïns i gent gran)
13. **Tancament Implacable de Deutes Tècnics P0/P1 del Catàleg Històric (`261020_2230`):**
   - `P0-10`: Traduccions als 5 idiomes de les cadenes de moderació i eliminació de compte als diccionaris (`es.js`, `en.js`, `eu.js`, `gl.js`).
   - `P0-11`: Substitució d'anglicismes («ítems» per «elements») a `src/config/idiomes/ca.js`.
   - `P1-02`: Fix a `useUniversalRichText.js` per evitar l'esborrat de notes en desenfocar quan el text coincideix amb la plantilla.
   - `P1-03`: Substitució d'origen a `share` (`capacitor://localhost` per `https://socdepoble.org`).
   - `P1-05`: Optimització de la imatge pesada de fons del xat (`xat-bg-map-v2.jpg` de 1 MB a WebP).
14. **Recompilació Neta i Revalidació Total:**
   - Recompila l'APK beta d'Android (`npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`) i copia el binari final a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk`.
   - Recompila els paquets de WordPress 1.1.8 (`SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp` i `npm run build:wp:directori`).
   - Executa `npx vitest run` assegurant que la totalitat de les proves (20.300+) queden en verd impol·lut.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evita alterar `src/data/backendPort.js`: la font de veritat és sempre Supabase.
- No trencar cap de les 20.312 proves de Vitest.
- Respectar la Porta Olivera al final del torn.

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
