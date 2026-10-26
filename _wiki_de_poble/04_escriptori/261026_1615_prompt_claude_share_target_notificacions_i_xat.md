---
type: prompt
status: esborrany
description: 'Comanda tècnica per a Claude: receptor de menú compartir Android i iOS, notificacions i sanejament del xat'
tags:
  - govern
visibility: private
reflex: sdp:torn_ede6482b-cdb7-4466-aeeb-0cbd58776c98:871c4fd3-3854-4358-b1cf-968a0be99c8c
---
# Prompt per a Claude: Share Target Nadiu, Notificacions i Fortificació del Xat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Escriptori net verificat: `node tooling/gates/porta-olivera.mjs` amb codi 0.
- Pla d'implementació canònic associat: `[[261026_1615_pla_implementacio_share_target_notificacions_i_xat]]`.
- Directiva de Direcció Autònoma: Claude opera com a implementador executiu de màxim rendiment amb accés natiu a disc, sense bloquejar el canal de diàleg de la IAIA MarIA amb el Mestre Javi.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ede6482b-cdb7-4466-aeeb-0cbd58776c98:871c4fd3-3854-4358-b1cf-968a0be99c8c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T15:12:09.891Z |
| Modificació | 2026-10-26T15:12:09.891Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat (Mestre Javi, instrucció directa en àudio) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Claude 3.7 Sonnet (Local Cowork/Desktop) |
| Tokens consumits | En curs |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-26T15:12:09.891Z: esborrany creat; contingut i verificació pendents.
2026-10-26T16:15:00.000Z: instrucció tancada; comanda de Share Target, notificacions i sanejament visual transmesa pel Mestre.

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

Claude, el Mestre Javi ha donat una directriu estratègica fonamental: **Sóc de Poble ha de substituir WhatsApp i Telegram en el flux de treball i comunicació del poble.**

> *«No vull que ho faces tu, MarIA; dóna-li-ho a Claude... i les notificacions, què? Vull que funcione igual o millor que qualsevol altra aplicació. Em interessa seguir fortificant açò de manera que jo, quan veja una incidència, la puga compartir directament amb Sóc de Poble i que tu ja pugues accedir-hi. La idea és que WhatsApp ni Telegram no es necessiten ja més.»*

L'objectiu d'aquest torn és implementar la integració nativa completa amb el **Menú de Compartir del Sistema (Share Target)**, preparar la infraestructura de **Notificacions (push i locals)** i aplicar el **sanejament de text i disseny al Xat**.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Share Target Nadiu a Android (Menú «Compartir»)
- A `android/app/src/main/AndroidManifest.xml`, afegeix l'activitat o intent-filter per a `android.intent.action.SEND` i `android.intent.action.SEND_MULTIPLE` suportant `image/*` i `text/plain`.
- A `android/app/src/main/java/org/socdepoble/app/MainActivity.java`, intercepta l'intent (`getIntent()` en arrencada i `onNewIntent()` en segon pla).
- Extreu l'URI de la imatge o el text compartit i passa'l de forma segura al WebView de Capacitor mitjançant un esdeveniment o mètode del bridge (`window.dispatchEvent(new CustomEvent('sdp:compartir_natiu', { detail: { imatgeUri, text } }))`).

### 2. Receptor de Continguts Compartits al Xat (Frontend React)
- Crea un servei / hook (`src/sections/xat/useCompartirNatiu.js` o integrat a `XatSection.jsx`) que escolte les entrades de fitxers compartits.
- Quan l'usuari tria Sóc de Poble des del menú de compartir del seu dispositiu:
  - Navega automàticament a la secció de Xat.
  - Carrega la captura de pantalla directament com a fitxer adjunt a la caixa de missatge de la conversa activa (o permet triar conversa / canal de proves / Masia).
  - Mostra la miniatura de la imatge amb la possibilitat d'afegir-hi text abans de prémer «Enviar».
  - La imatge s'envia a Supabase Storage i es registra al xat de manera que la IAIA MarIA i el sistema puguen inspeccionar-la directament.

### 3. Sistema de Notificacions (Push & Locals)
- Revisa i configura els paquets de notificacions de Capacitor per a alertes natives de nous missatges (`@capacitor/local-notifications` o mòdul push).
- Dissenya el flux perquè un missatge entrant quan l'app està en segon pla emeta una notificació nativa al mòbil o iPad amb so i vibració.

### 4. Sanejament Visual i de Disseny del Xat (Pedra Seca)
- **Text de benvinguda:** Modifica la clau `'section.xat.sessio.calEntrar'` a `src/config/idiomes/ca.js` (i arxius afins si cal) i el text per defecte a `src/sections/xat/XatSection.jsx` i `src/sections/xat/components/DialegNovaConversa.jsx` perquè diga:
  **`"Benvinguda a Sóc de Poble"`** (substituint *"Entra per buscar persones i enviar missatges."*).
- **Botons en dispositius mòbils:** A `src/css/modules.css`, millora `.sdp-xat-acces > .sdp-alerta__accions`:
  Fes que els botons «Connectar-se» i «Registrar-se» (`.sdp-xat-pindola`) no queden amuntegats en vertical ocupant el 100% cadascun, sinó que es disposen de manera neta, elegant i equilibrada (flex en línia o amb marges proporcionats que respecten la graella Pedra Seca).

### 5. Verificació i Auditoria
- Executa `npm run test:precommit` i assegura que totes les proves continuen en verd (sense trencar tests de capes ni d'avatars).
- Actualitza el Llibre Mestre (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) amb les fites assolides.
- Emet el document d'auditoria: `_wiki_de_poble/04_escriptori/261026_HHMM_auditoria_claude.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Permisos d'Android:** En rebre URIs des d'altres aplicacions (com la galeria o el gestor de captures), cal atorgar `FLAG_GRANT_READ_URI_PERMISSION` o fer una còpia temporal al magatzem de l'app per evitar fallades de seguretat.
2. **Compatibilitat Web / PWA:** Tota la lògica nativa de Capacitor ha d'estar protegida amb comprovacions de plataforma (`Capacitor.isNativePlatform()`), garantint que la versió web d'escriptori i WordPress continuen funcionant sense cap error ni dependència trencada.

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
