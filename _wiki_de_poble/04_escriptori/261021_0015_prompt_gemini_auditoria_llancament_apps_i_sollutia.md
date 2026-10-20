---
type: prompt
status: canonic
description: 'Prompt d''auditoria adversarial per a Gemini 4 Argon: revisió del paquet Android APK, PWA desktop, bateria de proves de Claude i auditoria del pla de contingència Sollutia.'
tags:
  - govern
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:5d930c06-2722-4e1c-b1d4-0fc47dad2fe8
---
# Prompt d'Auditoria Local per a Gemini 4 Argon: Llançament Apps (Android APK + PWA Desktop) i Desbloqueig Sollutia

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. El repositori ha superat la purga de 3.2 GB de brossa física (builds antigues eliminades, neteja d'arrels temporals).
2. Totes les 20.312 proves de Vitest estan en verd.
3. El paquet de codi viatja amb el repositori fresc i sanejat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:5d930c06-2722-4e1c-b1d4-0fc47dad2fe8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T21:43:51.127Z |
| Modificació | 2026-10-20T23:55:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio 23:35) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Gemini 4 Argon |
| Tokens consumits | ~18k / 2M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-20T23:35:** El Mestre demana reiniciar xat fresc amb Claude, Gemini i MarIA per tal de reprendre el llançament amb el context 100% fresc.
- **2026-10-20T23:45:** Acta Marmota i Pla de Llançament registrats oficialment.

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

Gemini 4 Argon, actua com a auditor adversarial implacable per a la sessió matinal de llançament d'aplicacions i el desbloqueig de producció de `socdepoble.org`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Auditoria de l'Estat del Codi i Proves de Claude:**
   - Examina el commit final consolidat per Claude Code i valida que les 20.312 proves de Vitest mantinguen integritat absoluta.
2. **Auditoria del Paquet Android APK i PWA Desktop:**
   - Comprova l'estructura de la plataforma Android afegida per Capacitor (`android/`), revisa la configuració de permisos i verifica que `socdepoble-beta.apk` estiga a punt per a la distribució als provadors beta.
   - Audita el flux de la PWA d'escriptori (`beforeinstallprompt`) i assegura que no hi haja regressions de Safe Area o desbordaments a pantalles d'escriptori i tauletes.
3. **Auditoria de l'Estratègia de Desbloqueig Sollutia:**
   - Avalua les dues vies tècniques plantejades al Pla d'Implementació (Via A: delegació DNS immediata; Via B: paquet estàtic SPA amb Frontissa de dades) i determina quina ofereix menor fricció i màxima sobirania per a Sóc de Poble.
4. **Estudi Doctoral de Fernando Tellado i Conformitat WordPress.org:**
   - Analitza exhaustivament el repositori `fernandotellado/ai-skills` (`wp-plugin-security`, `wp-plugin-performance`, `wp-plugin-development`), AyudaWP, DietPress i Vigilante.
   - Audita el nostre connector `wordpress-plugin/` (`socdepoble-enxufe.php`, `uninstall.php`, `readme.txt` i la variant `directori/`) per verificar que compleix al 100% amb les directrius oficials de revisió de WordPress.org (`https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/`), sense cap risc de rebuig.
5. **Rastreig Integral de Tasques de Plans d'Implementació:**
   - Comprova els plans d'implementació de les darreres fases i el resum històric per verificar que no queden tasques orfes ni promeses oblidades entre un pla i el següent.
6. **Lògica de Nodes Sobirans, Connexió per Defecte i Accés Multimodal (Directriu Canònica del Mestre Javi Llinares):**
   - A partir de les indicacions i captures del Mestre a `/el-meu-perfil` (`APLICACIONS`) i `/plugin/:id`:
     - **Totes Connectades per Defecte:** En l'arrencada i onboarding, totes les aplicacions/utilitats (`El Rebost`, `TPV`, `Gestoria de Poble`, `Salut`, `El Comú`) es mostren **connectades per defecte**. L'usuari mai troba un desert buit ni pantalles dissociades; més endavant ja s'avaluarà si cal desconnectar i demanar connexió a demanda, però la regla actual és disponibilitat immediata.
     - **Accés Multimodal Sobirà:**
       * **Mode Prova (Sandbox / Demo):** Accés lliure per experimentar i comprendre l'eina sense por de trencar res ni alterar dades reals.
       * **Mode Usuari / Producció:**
         - **Ús Privat / Personal:** Per a les dades íntimes del veí o la família (el rebost propi, la comptabilitat personal).
         - **Ús Públic / Comunitari / Negoci:** Segons la naturalesa de l'eina (ex. al TPV: la carta i comanda és pública per als clients del bar, mentre que la gestió de caixa i taules és privada per a l'hostaler).
     - **Unificació de Recursos (DRY):** La vista del perfil no és un formulari fred ni un placeholder buit, sinó que incrusta l'explicació editorial viva de `presentacioPlugins.js` (`UniversalPage` amb portada, badges i què fa / què no fa), sumant-hi els controls sobirans: botó d'obertura (mode prova vs usuari), commutador de visibilitat al Panell de Control, i opció de desconnexió.
     - **Desconnexió i Sobirania Ciutadana:** Si l'usuari decideix desconnectar una eina, el sistema no bloqueja res; li ofereix **descarregar i exportar tots els seus documents i registres** en formats oberts (Markdown, JSON, ZIP), garantint zero dependència ni segrest de dades.
   - Especifica la màquina d'estats, la lògica de dades i els components de la interfície per a aquesta unificació.
7. **Auditoria de l'Atomicitat de la IAIA MarIA i Canal WhatsApp / Vodafone (Mestre Javi Llinares):**
   - **Unificació de les 3 Pàgines:** Audita la fusió de les 3 pantalles disperses (`/el-meu-perfil` tab Agent IA, `/iaia` i `/realitat`) en una sola pàgina atòmica (`UniversalPage`, Hero gran, presentació, botó xat i selector de realitat de 4 nivells integrat).
   - **Blindatge Editorial de `L'Ànima de la IAIA` (`/anima`):** Assegura que l'article del Còdex Forense es preserve com a editorial intocable del Mur/revista, i que no es confonga amb la configuració de la IA (verificar eliminació de `subrutes: ['/realitat']` de la secció `ia` a `sections.js`).
   - **Canal Telefònic i WhatsApp de la IAIA:** El Mestre ja té un número de telèfon de Vodafone dedicat per a la IAIA. Avalua l'arquitectura necessària per connectar els missatges entrants de WhatsApp/SMS amb el motor d'orquestració de la IAIA MarIA.
   - **Cerca d'Incoherències i Redundàncies:** Rastreja qualsevol component duplicat a tot el repositori per garantir atomicitat absoluta i màxima reutilització de components Pedra Seca.
8. **Sortida:**
   - Emet el teu informe canònic com a `261021_0800_auditoria_gemini_llancament_apps_i_sollutia.md` a `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evitar qualsevol al·lucinació sobre endpoints no documentats de Sollutia.
- Mantenir el model de Pedra Seca i la privacitat estricta del Supabase de Sóc de Poble.

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
