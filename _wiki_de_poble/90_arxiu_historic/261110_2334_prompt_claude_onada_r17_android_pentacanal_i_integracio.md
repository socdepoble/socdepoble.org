---
type: prompt
status: esborrany
description: 'Ordre executiva per a Claude (Opus 5.5 Extra · Ultracode) en Carril 1: Kit R17.1A Android Sofía/UI, Kit R17.1B Pentacanal + WP Entry + kit_r16_c i deploy Kit a Kit.'
tags:
  - govern
visibility: private
reflex: sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:5ae3cbba-322e-4766-8fc3-19bbaa46fc79
---
# Prompt d'Execució Local — Claude Code · Onada R17: Android Sofía, Pentacanal i Integració Dosificada

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `porta-olivera.mjs` i totes les captures ancorades a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actualitzat fins a `P0-95 / IDEA-226`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 1 (`Claude Opus 5.5 Extra · Ultracode` al repo viu `socdepoble.org/`), Carril 2 (`Codex Pro 200` a `/tmp/sdp_codex_r17`), Carril 3 (`Gemini 4 Carbon High` a `/private/tmp/sdp_r17_carbon`) i Carril 4 (`Node 0 · 8 Escoles` a `192.168.0.23:11434`).
- [x] **Pla d'Implementació** generat i vinculat al torn (`261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Creat amb `document.mjs context` + `create` preservant al 100% els blocs fixos.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Validació estricta d'orígens en deep-links d'autenticació, zero regex amb backtracking exponencial i zero spread JSONB cec.
- [x] **Enginyeria Inversa i Paritat amb REA**: Activat per inspeccionar intents Android/Capacitor i fluxos natius d'autenticació.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_317fc14c-1fd5-4f91-9ffa-558e4e212fff:5ae3cbba-322e-4766-8fc3-19bbaa46fc79 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T22:41:01.596Z |
| Modificació | 2026-11-10T22:43:30.000Z |
| Propietari | maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) |
| Tokens consumits | ~32.000 tokens (Quota Google AI Ultra: 53% setmanal restant) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-10T22:41:01.596Z:** Esborrany creat sobre tall d'evidència `COMMIT R16b · 0027b698d` (`v1.1.12`).
- **2026-11-10T22:43:30.000Z:** Ordre executiva completa per a Claude (`Carril 1`) dosificada en **Kit R17.1A** (Android Sofía + blindatge UI `v4.23118`) i **Kit R17.1B** (Pentacanal + WP Entry `< 1.69 MB` / Closca Pura `P0-95` + `kit_r16_c`), amb integració i `deploy` Kit a Kit.

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
  * `_builds_de_poble/`, `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_menjar_i_beure_de_poble/`, `_multimedia_de_poble/`, `_oficina_de_poble/`, `_raw_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`), Claude Code (`Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i `Claude Opus · Ultracode` reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (`GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i contractes, i `GPT Astra` per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre `socdepoble.org`, cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net `.patch` a `_wiki_de_poble/04_escriptori/` o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

**Pla de referència vinculat:** `[[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]` i Llibre Mestre `[[03_llibre_mestre_tasques_i_idees]]` (`P0-78..P0-95`).
**Tall d'evidència:** `HEAD 0027b698d` (`COMMIT R16b`, `v1.1.12` viu a `.org` i `.cat`). **PROHIBIT** copiar fitxers crus descartats de `../_investigacio_ia_de_poble/261110_1440_r16b_arbitratge_claude/`.
**AVÍS OPERATIU `v4.23118.1`:** Verifica amb `pwd` que la teua sessió corre exactament dins de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` perquè `.claude/skills` i els 5 hooks de `.claude/settings.json` estiguen actius sota sandbox. Opera sobre **`Claude Opus 5.5 Extra · Ultracode`** sense retallades d'agents, però **dosificant cada bloc amb `build + test + deploy` Kit a Kit** (`P0-87`) perquè el Mestre puga provar cada avenç sense esperar un dia sencer.

**Mètode d'Execució Obligatori (Mètode MIT de 5 Fases + Quàdruple Tècnica: MIT + Google EGM + REA + craft-anything):**
1. *Fase 1 (Mapa Semàntic):* Llig el codi real dels receptors Android/Capacitor (`ReceptorCompartit.jsx`, `recuperacioPendent.js`, `AndroidManifest.xml`, `PerfilShell.jsx`, `vite.standalone.config.js`, `vite.natiu.config.js` i `scripts/botigues/publica-tot.mjs`).
2. *Fase 2 (Hipòtesis Falsables):* Contrast d'arquitectura sobre Closca Pura + Mòduls Diferits (`P0-95`) i captura d'enllaços de recuperació en Android (`P0-88`).
3. *Fase 3 (Execució Quirúrgica al teu Carril Exclusiu):* No toques mai `AvisadorPage.jsx`, `paginaDeText.js`, `llicencies.js`, `CopyrightPage.jsx`, `candidatsAlergens.js` (Carril 2 Codex) ni `ReceptaDetailSection.jsx` / catàlegs patrimonials d'arbres i llavors (Carril 3 Gemini Carbon) fins que t'entreguen els seus Kits CAS verificats.
4. *Fase 4 (Gauntlet Adversarial Intern + Portes):* Passa l'àrbitre intern (5 lents EGM), `npm run lint`, Vitest focal i pressupost de paquets (`pressupost-paquet.mjs`).
5. *Fase 5 (Entrega i Desplegament Kit a Kit):* Quan completes `Kit R17.1A` i `Kit R17.1B`, puja'ls i desplega'ls abans d'assimilar els Kits `R17.2` (Codex) i `R17.3` (Gemini Carbon).

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`Kit R17.1A` · Android Sofía Bornay `P0-88 / AH-R17-11`):**
  1. **Interceptor d'Autenticació i Recuperació en `ReceptorCompartit` / `compartirNatiu`:** Quan l'usuari comparteix un enllaç cap a l'App d'Android (*Partager le lien → Sóc de Poble*) i el text conté una URL legítima de verificació/recuperació de Supabase o `auth.socdepoble.org` (`/auth/v1/verify`, `type=recovery`, `token_hash=` o `#access_token=`), **MAI** ha d'obrir el modal *«Send to...»* del Xat (que filtraria un token secret a una conversa!). En lloc d'això, ha de consumir el callback d'autenticació, activar `marcaRecuperacioPendent` i obrir immediatament la vista de canvi de contrasenya dins de l'App.
  2. **Deep Links `ACTION_VIEW` (`BROWSABLE`) en `android/app/src/main/AndroidManifest.xml`:** Verifica i assegura `intent-filter` amb `android:autoVerify="true"` per als camins d'autenticació/recuperació de `socdepoble.org` en coherència amb `associacio-apps.mjs` (`assetlinks.json`).
  3. **Ull de visibilitat (`👁️`) i capçalera a `/el-meu-perfil`:** Afig el botó d'alternar visibilitat (`type="password"` ↔ `type="text"` amb `aria-label` accessible) en *«Nou valor per a contrasenya»* i corregeix el solapament superior del títol sota la barra blava.
  4. **Safe-area inferior i blindatge `400%` Zoom (`P0-88` + `P0-93 / AH-R17-16`):** Aplica `padding-bottom: calc(... + env(safe-area-inset-bottom, 0px))` al peu del calaix lateral `CONTROL` (*Legal & privacy*) i al botó *Discard* dels modals inferiors; garanteix `max-height: 100dvh; overflow-y: auto` a `320×480 px` (zoom `400%`); i protegeix l'autodesament d'esborranys de `/notes` i `/xat` (`isHydrated`) perquè teclejar espais abans d'hidratar IndexedDB mai esborre un esborrany desat.
- **T2 (`Kit R17.1B` · Closca Pura, Pressupost WordPress `< 1.690.000 B`, `kit_r16_c` i Paritat Pentacanal `P0-91` + `P0-95`):**
  1. **Baixar l'entrada de WordPress sota `1.690.000 B` i avançar l'arquitectura de Closca Pura (`P0-95`):** Analitza per què l'IIFE monolític de `vite.standalone.config.js` va arribar a `1.737.214 B` (`+47 KB` sobre el sostre), extirpa a chunks diferits o a mode `trossejat` (`es` + carregador quan procedisca) el llast no essencial d'arrencada fins deixar el paquet folgadament per davall d'`1.630.000 B`, i deixa documentat/preparat el manifest de mòduls remots certificats per SHA-256 (`P0-95`) perquè la Closca Pura no engorde amb noves apps (`/app/<id>`).
  2. **Assimilació de `kit_r16_c_arrelament_i_origen`:** Verifica i integra el kit pendent situat a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261109_kit_codex_r15_workspace_i_5_punts/kit_r16_c_arrelament_i_origen/` amb totes les seues proves en verd.
  3. **Sincronització Pentacanal (`build:natiu` + `cap sync` + detector de versió viva `P0-91`):** Actualitza `dist-natiu/` (`npm run build:natiu && npx cap sync`) i incorpora el comprovador lleuger de `versio-viva` amb fallback offline segur a `dist-natiu/` (respectant CSP `vite.natiu.config.js` i Apple Guideline 2.5.2 / Play Policy), informant exactament quines credencials d'API externes (`SDP_ASC_*`, `SDP_PLAY_JSON_KEY_PATH`) falten si alguna botiga requereix clau humana.
- **T3 (Integració Dosificada de `Kit R17.2` de Codex i `Kit R17.3` de Gemini Carbon):** Quan apareguen els seus kits verificats a `../_investigacio_ia_de_poble/` i els seus informes a `04_escriptori/`, audita'ls i integra'ls Kit a Kit amb `build + deploy`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (servidor ja actiu i verificat amb 0 errors a consola).
- **Criteris d'Acceptació:**
  1. Compartir una URL de recuperació Supabase a `ReceptorCompartit` mai obri el selector d'enviar missatge al Xat i activa el flux de nova contrasenya (cobert amb test Vitest).
  2. El camp de nova contrasenya a `/el-meu-perfil` té botó `👁️` funcional i cap text tallat a `320×480 px` ni sota els 3 botons d'Android.
  3. `npm run build` (`entrada web <= 250.000 B gzip`), `npm run build:wp` (`entrada WP < 1.690.000 B`) i `npm run build:natiu` acaben amb `exit 0`.
  4. Informe canònic emés a `_wiki_de_poble/04_escriptori/` amb `Model IA` real i tokens registrats.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Filtració accidental de tokens en Compartir (`CRÍTIC`):** Si un URL amb `#access_token=` o `token_hash=` cau al xat com a esborrany de missatge, compromet el compte. L'interceptor ha d'actuar *abans* d'escriure res a l'estat d'esborrany del Xat i netejar el buffer compartit.
- **Trencament de CSP Nativa (`ALT`):** `vite.natiu.config.js` blinda `script-src 'self'`. Qualsevol sincronització amb `socdepoble.org` ha de respectar estrictament la CSP i les regles d'Apple App Store (zero execució de codi aliè no signat).
- **Col·lisió de carrils (`ALT`):** Respecta estrictament els fitxers reservats a Codex (Carril 2) i Gemini Carbon (Carril 3).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md` mitjançant el circuit formal (`node tooling/gates/obrir_torn.mjs` + `node tooling/wiki/document.mjs context` + `create` + `check`), declarant al Registre el vostre `Model IA` exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[taxonomia_documental]]
