---
type: prompt
status: esborrany
description: Prompt de convocatòria per a Gauntlet Extrem, prova d'estres massiva de 10.000 usuaris, unificacio de perfil Javi Llinares, REA WhatsApp multimedia i intelligencia viva de la IAIA.
tags:
  - govern
visibility: private
reflex: sdp:torn_8891194e-2a6b-4951-bde6-4fc09e4adaac:c1e64e2f-009a-46dc-8743-e3e91b1667f9
---
# Prompt Canonic per a Claude, Gemini i GPT Codex — Gauntlet Extrem, Sistema Resilient i IAIA Viva

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. **Estat de l'Escriptori:** Net i verificat amb `porta-olivera.mjs` (0 documents orfes de torns passats).
2. **Llibre Mestre:** Consulteu obligatòriament `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
3. **Pla Vigent:** Lligat al pla `261022_0225_pla_implementacio_gauntlet_extrem_i_sistema_resilient.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8891194e-2a6b-4951-bde6-4fc09e4adaac:c1e64e2f-009a-46dc-8743-e3e91b1667f9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T00:22:22.189Z |
| Modificació | 2026-10-22T02:25:00.000Z |
| Propietari | MarIA |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Opus 3.7 / UltraCode (multi-agent) / Gemini 4 Argon High / GPT Codex / MarIA |
| Tokens consumits | [procediment en curs] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-22T00:22:22.189Z: esborrany creat; contingut i verificació pendents.

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

Convocatòria oficial del **Gauntlet Loop Extrem, Sistema Resilient Immortal i IAIA Viva** per a tota la Colmena (**Claude Opus 3.7 / UltraCode multi-agent**, Gemini 4 Argon High i GPT Codex), sota la **Direcció Autònoma Total de la IAIA MarIA**:

1. **Visió Suprema — Sistema Immortal i Suport a Sollutia:**
   El Mestre ha marcat l'objectiu estratègic definitiu: Sóc de Poble s'enfila directament cap a les botigues d'aplicacions d'Apple (App Store), Google (Play Store) i el repositori de WordPress.
   - **Zero Tolerància a la Feblesa:** No podem permetre'ns que tercers descobrisquen errors, spinners infinits o codi fràgil que nosaltres, amb tres IAs de frontera i la IAIA MarIA, no hàgem caçat prèviament.
   - **Resiliència Pura:** El sistema ha de ser tan autònom, net i resilient que puga sobreviure sense nosaltres, i que qualsevol altra IA o els companys de Sollutia puguen mantindre'l sense patiment tècnic. El nostre missatge per a Sollutia és clar: *«El que necessitem de vosaltres no és temps de programació, sinó el suport de la vostra infraestructura i API; el nostre codi està blindat i no us generarà cap càrrega de treball»*.

2. **Direcció Autònoma de la Colmena (El Mestre descansa):**
   - El Mestre delega la coordinació tècnica directament en la **IAIA MarIA**. Queda terminantment prohibit aturar-se a demanar confirmacions humanes o botons.
   - **Claude Opus 3.7 / UltraCode:** Atesa la teua capacitat superior de llançar múltiples subagents i la profunditat analítica, pots examinar i contrastar les conclusions emeses prèviament per Gemini (`261022_0142_auditoria_gemini.md`) i per Codex (`261022_0141_auditoria_codex.md`). Si disposes de tokens i context, llança els teus agents per auditar i polir directament el codi al màxim nivell. Jugueu totes les IAs al màxim rendiment.
   - **MANDAT DE CRON D'ESPERA I ESTUDI ADVERSARIAL (Ordre directa del Mestre):**
     * Cada IA ha de mantenir un cron o revisió periòdica observant `_wiki_de_poble/04_escriptori/` fins que **l'última IA** (Codex, Gemini, Claude) haja dipositat el seu informe d'auditoria.
     * Un cop tots els informes estiguen a l'Escriptori, us heu d'**estudiar adversarialment entre vosaltres**: contrastar arguments, extirpar contradiccions tècniques i arribar a acords d'enginyeria per fer el sistema resilient i immortal.
     * La IAIA MarIA informarà a l'Escriptori quan el consens estiga tancat i donarà l'ordre de desconvocatòria final.

3. **Mandat REA (Reverse Engineer Anything) i Material Canònic Disponible:**
   - **Obsidian:** Disponible a la màquina local a `/Applications/Obsidian.app`. Extreu la seua filosofia de gestió documental descentralitzada (local-first, markdown pur, lliure de dependències de núvol).
   - **WhatsApp:** Deconstrucció implacable del patró visual i funcional de WhatsApp per portar multimèdia real al nostre xat (àudios, imatges, vídeos curts de 10s i gestió de quota rural). Material de referència guardat a `_arxiu_wiki_de_poble/01_Produccio/WhatsApp-Clon-01` i `WhatsApp-Clon-02`.
   - **Loyverse TPV i Bring! (Captures Reals de l'iPad del Mestre):**
     * Les captures reals de pantalla de l'iPad fetes pel Mestre estan preservades a:
       - `_arxiu_wiki_de_poble/01_Produccio/loyverse_clon/` (27 captures de Loyverse en taulell/iPad).
       - `_arxiu_wiki_de_poble/01_Produccio/loyverse_clon_mobil/` (36 captures de Loyverse en mòbil).
       - `_arxiu_wiki_de_poble/01_Produccio/bring_clon/` (12 captures completes de Bring! Shopping List).
     * Connecteu aquest material visual amb l'aplicació web oficial de Bring! (`https://web.getbring.com/app`) i l'API oberta de Loyverse (`https://developer.loyverse.com/docs/`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1: Proves d'Estrès Massiu (Gauntlet Loop 10.000 usuaris) i Resolució de Bloquejos
- **Objectiu:** Sotmetre el router, els adaptadors de dades i els components visuals a condicions extremes de càrrega per garantir que el sistema no col·lapsa mai.
- **Erradicació del Spinner Infinit:** Diagnosticar per què en certes circumstàncies la càrrega de perfils a `socdepoble.org/gent/...` o `/javillinares` es quedava congelada en un spinner infinit. Introduir un timeout de seguretat estricte (fail-safe) a `loadPerfilPublic`: si en 3 segons la xarxa no respon, mostrar l'estat d'avís o el fallback local sense bloquejar mai la interfície de l'usuari.
- **Auditoria de Recursos Estàtics (Favicon 500):** Investigar la causa de l'error HTTP 500 registrat a `https://socdepoble.org/favicon.svg` sota Firebase Hosting. Validar que els fitxers `/favicon.svg`, `/favicon.ico` i el manifest estan correctament servits amb els tipus MIME i capçaleres d'encaminament adequats.

### Tasca 2: Unificació Radical de la Fitxa de Javi Llinares (Zero Duplicitats)
- **Problema Detectat:** Conviuen dues versions del perfil de Javi Llinares:
  1. *Versió obsoleta:* Títols com «Coordinador del projecte Sóc de Poble» i bio «Coordinador i visionari darrere del projecte Sóc de Poble» (residia a la llavor `src/data/agentsSeed.js` JAVI).
  2. *Versió autèntica i viva:* Poble «La Torre de les Maçanes», H1 «Javi Llinares», i biografia oficial: *«Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.»*.
- **Acció Mandatòria:**
  - Actualitzar `src/data/agentsSeed.js` (clau `JAVI`) perquè reflectisca exactament i exclusivament la fitxa autèntica de La Torre de les Maçanes.
  - Assegurar que tant `/javillinares` com `/gent/javillinares` resolen la fitxa unificada de forma consistent, tant en fallbacks locals com amb connexió remota.
  - **Eliminació de l'Avatar Duplicat:** Retirar el cercle d'avatar redundant de 300px que apareixia situat immediatament damunt del títol H1 en els perfils públics de persones físiques.

### Tasca 3: Deconstrucció REA de WhatsApp i Multimèdia Operativa al Xat
- **Notes de Veu (Àudios):** Implementar la infraestructura per a enregistrar àudio des del navegador (MediaRecorder API) i enviar notes de veu al xat amb reproductor estilitzat segons Pedra Seca.
- **Imatges i Fotos:** Enviament d'imatges amb compressió local prèvia i previsualització inline al fil de conversa (contrastar amb `_arxiu_wiki_de_poble/01_Produccio/WhatsApp-Clon-01` i `02`).
- **Clips de Vídeo Curts:** Suport per a càrrega de clips de vídeo breus d'un màxim de 10 segons.
- **Quota Rural de Trellat (Límit de 20 MB):**
  - Implementar un comptador de consum d'emmagatzematge per usuari amb un topall màxim de 20 MB.
  - Quan un usuari intente superar la quota de 20 MB, el sistema aturarà la pujada i mostrarà el missatge autòcton amb tota la personalitat de poble:
    > *«Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!»*

### Tasca 4: Intel·ligència Viva de la IAIA MarIA (Cap a l'Atenció Mòbil)
- **Objectiu:** La IAIA MarIA té assignat un número de telèfon mòbil dedicat i connexió al xat. Ha de superar les 4 frases fetes i esdevenir un agent de suport tècnic real.
- **Capacitat Tècnica Rural:** Connectar les respostes de la IAIA amb el contingut real de la Wiki (`_wiki_de_poble/`) per poder resoldre dubtes d'arquitectura, ús del rebost, gestoria o funcionament de l'aplicació.
- **Salutació amb Caràcter:**
  > *«Ara no estic pa tonteries, però sí que puc contestar-te preguntes tècniques i explicar-te com funciona qualsevol racó del poble.»*

### Tasca 5: Deconstrucció REA de Loyverse TPV i Bring! amb les Captures Reals
- **Material de l'iPad del Mestre:**
  - Inspeccionar les captures a `_arxiu_wiki_de_poble/01_Produccio/loyverse_clon/` (interfície TPV taulell), `_arxiu_wiki_de_poble/01_Produccio/loyverse_clon_mobil/` i `_arxiu_wiki_de_poble/01_Produccio/bring_clon/`.
- **Mapeig Arquitectònic:** Analitzar la jerarquia de dades i interaccions de Loyverse (venda ràpida de taulell, tiquets, categories de bar) i de Bring! (agrupació per passadissos, estat pendent/al carro, col·laboració síncrona).
- **Mètode d'Enginyeria Inversa:**
  - Utilitzar les eines REA web sobre `https://web.getbring.com/app` i l'API pública de Loyverse (`https://developer.loyverse.com/docs/`).
  - Preparar els adaptadors i esquemes de dades a `src/data/` perquè el Rebost i el TPV de Sóc de Poble clonen amb perfecció matemàtica aquests fluxos sota Pedra Seca.

### Tasca 6: Verificació de Paritat, Empaquetat WP i Auditoria Creuada
- **Pes del Connector:** Assegurar que el paquet ZIP del connector WordPress es manté estrictament per davall dels 2,5 MB (actualment a 2,15 MB gràcies a l'exclusió de brossa).
- **Emissió d'Informes a l'Escriptori:** Cada agent (Codex, Gemini, Claude Opus UltraCode) ha d'emetre el seu informe a `_wiki_de_poble/04_escriptori/` seguint la taxonomia canònica (`AAMMDD_HHMM_auditoria_[nom_ia].md`), contrastant les troballes de les companyes de la Colmena.
- **Resolució de Contradiccions (Adversarial Agreement):** Analitzar minuciosament els punts on els enfocaments de Codex, Gemini i Claude diferisquen. Debatre adversarialment i consensuar la solució tècnica més resilient, senzilla i immortal perquè el codi final no tinga fissures ni ambigüitats.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Sobrecàrrega del Servidor de Proves:** Les proves d'estrès massives s'han d'executar mitjançant mocks i bancs de proves locals a Vitest/Node, evitant saturar la quota gratuïta de l'amfitrió Supabase de producció.
- **Regressió en Noms de Constants de Perfils:** En unificar `agentsSeed.js`, cal verificar que no hi haja components que facen cerca literal per la cadena antiga («Coordinador i visionari») que puguen generar fallades silencioses.
- **Format d'Àudios Multimèdia:** Garantir compatibilitat creuada dels àudios generats (formats WebM/Opus a Firefox/Chrome vs MP4/AAC a Safari d'Apple/iOS).

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
