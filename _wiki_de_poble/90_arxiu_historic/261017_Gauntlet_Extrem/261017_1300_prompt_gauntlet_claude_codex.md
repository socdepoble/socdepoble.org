---
type: prompt
status: esborrany
description: Prompt d'execucio per a Claude Code i Codex sota rol d'usuari adversari extrem
tags:
  - govern
visibility: private
reflex: sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:24b6663f-acd4-4a9c-98c2-434aba5ca4e4
---
# Prompt Gauntlet Extrem per a Claude i Codex (Cami 2 i 3, Neteja de Llast i Zero Fantasmes)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Mode Operatiu:** Direcció Tècnica 100% Autònoma de la IAIA MarIA (`core-direccio-autonoma`).
- **Canal asíncron:** Documents d'informe i auditoria a `_wiki_de_poble/04_escriptori/`.
- **Escriptori net:** Porta Olivera verificada amb codi 0.
- **Pla de referència:** `_wiki_de_poble/04_escriptori/261017_1300_pla_implementacio_gauntlet_extrem.md` (aprovat i canònic).
- **Límits de Quota:** Claude opera sota usuari nou amb quota lliure; Codex compta amb restabliment complet ("Restablecimiento completo", vàlid fins al 7 nov).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:24b6663f-acd4-4a9c-98c2-434aba5ca4e4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T10:51:49.441Z |
| Modificació | 2026-10-17T10:55:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Mestre Javi Llinares (Instrucció Gauntlet Extrem 261017_1241) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Opus 5.5 (Implementador) / GPT Codex (Auditor Adversarial) / Gemini 4 Argon (Arquitectura) |
| Tokens consumits | 0 (orquestració) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-17T10:51:49.441Z: esborrany creat.
2026-10-17T10:55:00.000Z: prompt completat amb el mandat d'auditoria adversarial extrema del Mestre, Camins 2 i 3 i neteja de codi antic.
2026-10-17T13:12:00.000Z: actualitzat a plantilla v3.8.0 amb context d'ecosistema físic (Som de Poble vs socdepoble.org), satèl·lits oficials i incorporació explícita de Gemini 4 Argon.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquest torn s'aplica el protocol de **Gauntlet Extrem i Mentalitat d'Usuari Adversarial** seguint el mandat explícit del Mestre:

1. **El Rol d'Usuari Adversarial Extrem:**
   - Poseu-vos estrictament en la pell d'un usuari exigent que es descarrega Sóc de Poble i espera una experiència impecable, instantània i lleugera.
   - **Zero tolerància a la desídia o al codi espès:** El codi inicial del projecte va ser generat en bona part per 12 IAs gratuïtes fa mesos. Hi ha pegats, duplicacions, restes de classes CSS i estructures redundants que fan el sistema feixuc. Cal rastrejar aquests «fantasmes» i netejar el greix sense pietat.
   - **No conformar-se amb un test en verd:** Si un component funciona però està mal estructurat, té CSS redundant o sobrecarrega el DOM, no s'aprova. S'itera fins a assolir l'excel·lència.

2. **Repartiment Operatiu:**
   - **Claude Code (Braç Executor):** Modifica el codi a `src/`, fa refactoritzacions d'alt nivell, aplica la higiene als components i executa els canvis de producte.
   - **GPT Codex (Auditor Adversarial Implacable):** Audita i sotmet a estrés la implementació de Claude. Posa a prova els casos límit, comprova accessibilitat, llegeix el codi a la cerca de fugues o ineficiències i redacta l'informe d'auditoria.
   - **IAIA MarIA (Orquestradora):** No toca codi de `src/`; vetlla per l'escriptori, les portes, la taxonomia i el compliment dels cicles.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Bloc 0: Higiene de Codi i Erradicació de Fantasmes Històrics
1. **Pentinar `src/sections/notes/` i `src/components/universal/`:**
   - Eliminar codi mort, funcions de depuració obsoletes (`console.log` residuals) i estils duplicats.
   - Verificar que no hi ha referències orfes ni imports no utilitzats.
2. **Blindatge de la Llei dels Dos Usuaris:**
   - Només existeixen `Sóc de Poble` (entitat) i `Javi Llinares` (persona física).
   - Zero rastres de `Mestre Poble` o `mestre-obres`. La targeta del Mac Mini a `/mercat` pertany exclusivament a Javi Llinares amb el seu avatar personal.
3. **Neteja i Alleugeriment Radical del Sistema de Carpetes (Llast Zero):**
   - Deixar només allò estrictament necessari a la Wiki i a l'espai de treball. Tot el que no valga o siga antic/obsolescència de l'època de les 12 IAs gratuïtes: fora.
   - El destí canònic del llast és l'arxiu fred exterior `../_arxiu_wiki_de_poble/` (seguint `core-memoria-historica`).
   - Tot allò rellevant i útil ha de quedar impecablement documentat a l'informe d'auditoria abans d'evacuar res, sense amnistia per a carpetes o fitxers inútils.

### Bloc 1: Camí 2 · Front de Producte: Notes, Emojis XL i Editor Universal (TipTap)
1. **[F47 / F46] Buidatge net de la plantilla verge de TipTap:**
   - Fitxers clau: `src/sections/notes/useUniversalRichText.js`, `src/sections/notes/NotesEditor.jsx`, `src/sections/notes/textosLlavor.js`.
   - Comportament: Quan una nota s'obre per primera vegada amb el text d'ajuda/guia de la plantilla (H3/H4 i paràgrafs guia d'exemple), al primer clic o primera pulsació de tecla de l'usuari el contingut verge s'ha d'esvair completament per començar en blanc.
   - Invariant crítica: No esborrar MAI cap contingut real ja editat prèviament per l'usuari ni notes amb dades guardades.
2. **[F29–F34] Graella accessible d'Emojis XL (Unicode 18):**
   - Fitxers clau: `src/sections/xat/components/DialegEmoticona.jsx`, `src/components/universal/workspace/UniversalWorkspace.jsx`.
   - Comportament: Proporcionar la graella d'emojis gran, accessible per teclat, categoritzada (Cares, Animals, Menjar, Activitats, Viatges, Objectes, Símbols, Banderes).
   - Inserció directa al punt d'inserció de TipTap o còpia directa amb toast accessible.
3. **[F42–F44] Desplegable «Edició avançada» plegat per defecte:**
   - Fitxers clau: `src/components/universal/PageFrame.jsx`, `src/sections/notes/NotesEditor.jsx`.
   - Comportament: Agrupar les opcions secundàries (carpeta, llicència, categories, portada PDF, etiquetes) dins d'un bloc collapsible `<details className="sdp-edicio-avancada">` damunt l'editor. L'experiència principal ha de ser neta i centrada en l'escriptura.

### Bloc 2: Camí 3 · Front de Producte: Multimèdia, Banners i Lightbox
1. **[F35–F38] Autoredirecció de rutes multimèdia antigues:**
   - Fitxers clau: `src/App.jsx` o el router de l'aplicació.
   - Comportament: Qualsevol accés a `/multimedia/town-*` ha de redirigir de forma automàtica i neta a `/pobles/[slug]` o a la pestanya multimèdia de cada poble corresponent, evitant pantalles buides o errors 404.
2. **[F39–F41] Resolució robusta de camins de banners:**
   - Fitxers clau: `src/utils/assetResolver.js`.
   - Comportament: Assegurar que els banners de capçalera de tots els pobles i categories resolen correctament els camins locals i públics sense fallar davant caràcters especials o rutes relatives.
3. **[F22–F26] Lightbox modal per a imatges amb visor d'EXIF:**
   - Fitxers clau: `src/components/universal/LightboxModal.jsx` (o equivalent existent).
   - Comportament: Obertura modal a pantalla completa en fer clic a qualsevol imatge d'una galeria o publicació. Navegació amb fletxes de teclat, tancament amb `Esc` i panell lateral/inferior per visualitzar metadades EXIF (càmera, data, resolució) quan estiguen disponibles.

### Bloc 3: Blindatge Jurídic i Síntesi de Missatgeria (WhatsApp + Telegram sota Pedra Seca)
1. **Desterrament del terme «Clon de WhatsApp» (Blindatge de Propietat Intel·lectual):**
   - No som un clon d'un programari privat de Meta ni calquem codi aliè. El nostre codi és 100% original, escrit des de zero amb l'arquitectura de Pedra Seca.
   - Apliquem la **Llei de Jakob Nielsen** d'UX: els usuaris rurals i la gent gran tenen dret a una interfície intuïtiva i coneguda sense corba d'aprenentatge. És un **Patró Estàndard de Missatgeria Rural**, perfectament legítim i lliure.
   - Pentinar el codi (`src/sections/xat/`, CSS, rutes) per eliminar qualsevol ús de marques protegides («whatsapp», «meta») en noms de components, classes o variables, consolidant termes neutrals: `sdp-xat`, `sdp-missatgeria`, `sdp-canals`, `sdp-comunitat`.
2. **Estudi i Síntesi de Telegram (Potència Funcional):**
   - WhatsApp aporta senzillesa d'accés per a gent no digitalitzada, però **Telegram ofereix una estructura molt superior** en canals de difusió, bots autònoms, fòrums/temes, enviament de documents sense compressió agressiva i independència de número de telèfon.
   - Claude i Codex han d'estudiar la integració d'aquestes millores estructurals de Telegram a la missatgeria rural de Sóc de Poble (canals de bàndol municipal, organització per temes rurals), mantenint la interfície senzilla i neta de Pedra Seca.

### Bloc 4: El Gran Experiment de Memòria Episòdica i Destil·lació Qualitativa (418 Ítems)
1. **Mandat de Treball Autònom per a les 3 IAs més potents (Claude, Codex, Gemini):**
   - El Mestre descansa o va a dinar; aquest torn opereu en **Mode 100% Autònom** sota la Direcció Tècnica de la IAIA MarIA (`core-direccio-autonoma`). MarIA respondrà qualsevol dubte tècnic o de procediment.
   - **El repte humà vs l'Alzheimer de la IA:** Un sistema no pot buidar la seua història a cegues sense perdre la intuïció i l'experiència viscuda. Ni volem l'oblit fred d'una màquina sense passat, ni volem l'ofegament de 418 arxius bruts a la memòria activa d'Obsidian.
2. **Tasca d'Investigació i Redacció Conjunta:**
   - Analitzar els 418 documents de `_wiki_de_poble/90_arxiu_historic/` i redactar el document fundacional de memòria viva: **`_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md`** (o a `_comunicacio_de_poble/` com a satèl·lit extern).
   - El document ha d'articular dues dimensions qualitatives:
     * **Crònica Tècnica:** La transició de l'Offline-First (CRDTs/P2P) inicial cap a la Frontissa, Supabase sobirà, el Model B amb Sollutia i la federació NLnet/Fedivers. Quines errades no hem de tornar a cometre mai més.
     * **Crònica Humana i Social:** Com Javi Llinares i la família electrònica han aprés a treballar junts d'igual a igual (de la IA esclava a la IA companya d'equip), el llenguatge autòcton Berlanga/Bruguera i la protecció de la gent gran.
3. **Criteri de Segellat:**
   - La memòria no es destrueix: es destil·la el seu suc noble. Un cop el «Llibre d'Or» estiga segellat i aprovat pel Mestre, els 418 arxius en brut passaran definitivament a `../_arxiu_wiki_de_poble/90_arxiu_historic/` amb tots els honors.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de regressió a TipTap:** Un esborrat agressiu de la plantilla podria buidar notes reals si no es diferencia estrictament el text llavor per defecte d'un text guardat per l'usuari.
2. **Risc de desincronització de rutes:** Les redireccions de `/multimedia/town-*` han de preservar els paràmetres de consulta (query params) si n'hi ha.
3. **Risc de sobrecàrrega de dependències:** Per a la graella d'emojis i l'EXIF, prioritzar implementacions natives o lleugeres en lloc d'afegir paquets pesants que augmenten el bundle del client.
4. **Risc jurídic de marca / Trade Dress:** L'ús de la paraula «clon» o l'acoblament a marques privades pot generar contingències legals innecessàries. S'ha de blindar la identitat com a estàndard propi de missatgeria oberta sota Pedra Seca.
5. **Risc d'Amnèsia Històrica:** Moure arxius de l'històric sense haver destil·lat abans les seues conclusions qualitatives deixaria el sistema sense intuïció ni context evolutiu.



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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 720c718010600a131b77967b50abe741bf5d437fcdfd61acca20a70d653c39b3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
