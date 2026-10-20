---
type: prompt
status: esborrany
description: 'Dutxa de salfumant completa: radiografia de socdepoble.org, discriminació Sollutia vs Sóc de Poble, neteja de brossa i blindatge abans d''afegir Android.'
tags:
  - govern
visibility: private
reflex: sdp:torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:adb2e125-6feb-490e-9b3c-b774bb9baef8
---
# Prompt Consell · Auditoria Salfumant de socdepoble.org i Preparació Android

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només conté els arxius de la sessió actual. Porta Olivera amb codi 0.
- [x] **Pla d'Implementació**: Vinculat al pla vigent `_wiki_de_poble/04_escriptori/261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (RLS, secrets d'n8n, blindatge legal del Mestre).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA per a disseccionar referències de botigues i capacitats mòbils.
- [x] **Rebut obtingut**: Rebut del torn `torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:adb2e125-6feb-490e-9b3c-b774bb9baef8`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:adb2e125-6feb-490e-9b3c-b774bb9baef8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T20:17:57.186Z |
| Modificació | 2026-10-20T20:25:00.000Z |
| Propietari | maria |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:adb2e125-6feb-490e-9b3c-b774bb9baef8 |
| Tall d'evidència | 6d50d01d 22:30 |
| Aprovació humana | Mestre Javi Llinares (ordre per àudio 22:12) |
| requires_human_decision | false |
| Model IA | Gemini 4 Argon (Google AI Studio / Xat Nou de Salfumant) |
| Tokens consumits | Estimat 300k - 600k / 2M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-20T20:17Z: esborrany creat pel tractor `document.mjs` sota `torn_0a677a4c`.
- 2026-10-20T20:25Z: redacció canònica del mandat de neteja integral («dutxa de salfumant»), discriminació arquitectònica Sollutia vs Sóc de Poble, resolució dels 12 P0 i protocol previ a la generació neta d'Android (`npx cap add android`).

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

Actua com a **Auditor Sènior i Membre del Consell** de Sóc de Poble. El Mestre Javi Llinares ha ordenat una neteja estructural sense concessions («dutxa de salfumant») a tot el repositori abans de la publicació a l'App Store d'Apple, a Google Play i a la xarxa WordPress (gentdelatorre.com i directori oficial WordPress.org).

La teua missió és disseccionar tot l'arbre de `socdepoble.org` per:
1. **Diferenciar amb exactitud matemàtica Sollutia de Sóc de Poble:** Sollutia és únicament l'amfitrió i soci d'infraestructura (accés via Frontissa en lectura GET, sense backend injectat). Sóc de Poble és la sobirania de dades (Supabase) i la UI/UX Pedra Seca. Cap codi de Sóc de Poble pot dependre o filtrar-se al backend de Sollutia.
2. **Purgar la brossa i cadàvers digitals:** Detectar fitxers de 0 bytes, scripts de test oblidats, carpetes temporals, selectors CSS orfes i dependències mortes.
3. **Validar i planificar la resolució dels 12 bloquejadors P0** per a la publicació a botigues.
4. **Fixar les regles d'or per generar Android net (`npx cap add android`):** El Mestre ha acordat que la carpeta `android/` es generarà **DESPRÉS** d'aquesta dutxa de salfumant, garantint que el projecte d'Android Studio naix completament nítid i blindat.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Auditoria d'Arrel i Fronteres Sollutia vs Sóc de Poble:**
  - Auditar `src/data/adaptadors/sollutia/` i `tooling/sollutia/`.
  - Confirmar el desacoblament del port neutral `src/data/backendPort.js`.
  - Verificar que el sistema puga funcionar de manera autònoma sense connexió amb l'amfitrió («tot fora»).

- **T2: Scanner de Residus i Brossa («Dutxa de Salfumant»):**
  - Auditar totes les carpetes de `src/`, `tooling/`, `supabase/`, `ios/`, `wordpress-plugin/`.
  - Senyalar fitxers de 0 bytes (com `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp.md`).
  - Identificar scripts temporals de proves i fitxers orfes que s'hagen de reubicar o purgar.

- **T3: Pla de Resolució dels 12 Bloquejadors P0 de Botigues:**
  - `P0-01` Seguretat RLS: filtració de `contact_email` a usuaris `anon` en `2610181915_organitzacions_correu_i_membres.sql`.
  - `P0-02` Secrets: revocació del secret històric d'n8n del commit `ed6077ff`.
  - `P0-03` Apple OAuth: Client IDs i URLs a `ios/App/App/Info.plist`.
  - `P0-04` Apple Guideline 5.1.1(v): revocació de tokens amb `https://appleid.apple.com/auth/revoke`.
  - `P0-05` Migracions: aplicar Fase D i Fase E a Supabase Prod.
  - `P0-06` Google Play Data Safety: enllaç públic `/legal#esborra-compte` a `socdepoble.org`.
  - `P0-07` Iconografia: substituir icones per defecte de Capacitor per l'escut oficial.
  - `P0-08` Titularitat Legal i Subvenció Europea (50.000 €): La subvenció europea s'ha sol·licitat a nom de Fco. Javier Llinares García (persona física promotora). Per tant, el titular oficial a `legalContent.js` ha de continuar sent Fco. Javier Llinares García (NIF: 21476359V) per garantir la concordança jurídica amb l'expedient europeu i l'art. 10 de la LSSI-CE (evitant qualsevol risc de discrepància administrativa). Harmonitzar les dades de la línia 28 amb la 71, i corregir els 11 castellanismes de «la teua conta» per «el teu compte».
  - `P0-09` Sanejament web: retirar `<iframe src="/iaia-maria">` i enllaç `/skills` a `pageContent.js:115`.
  - `P0-10` & `P0-11` Diccionaris i lèxic: completar traduccions pendents i canviar «ítems» per «elements».
  - `P0-12` Arxiu històric: constatar l'evacuació completada a `_arxiu_wiki_de_poble/historics_2026/`.

- **T4: Protocol de Naixement d'Android (`npx cap add android`):**
  - Definir la configuració prèvia a `capacitor.config.ts` (`appId: 'org.socdepoble.app'`, `appName: 'Sóc de Poble'`, `webDir: 'dist'`).
  - Llistar permisos estrictes per a `AndroidManifest.xml` (càmera, fotos, xarxa, notificacions).
  - Procediment per a la generació del Keystore de Google Play i compilació d'AAB.

- **T5: Verificació del Connector WordPress:**
  - Validar `wordpress-plugin/soc-de-poble/soc-de-poble.php` per a desplegament a `gentdelatorre.com` i directori oficial de WordPress.org.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`.
- **Criteris d'Acceptació:**
  1. Informe redactat amb estructura canònica d'auditoria (v2.0.0).
  2. Identificació exhaustiva de tots els fitxers a netejar o moure.
  3. Llista de comprovació validada per a no deixar cap dels 12 P0 sense cobrir.
  4. Protocol tècnic per afegir la plataforma Android sense errors de configuració.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Esborrar fitxers útils sense verificar si tenen consumidors vius (sempre moure a `_arxiu_wiki_de_poble/` abans d'eliminar res).
- Acoblar el component web de Sóc de Poble a la infraestructura interna de Sollutia violant el Model B.
- Exposició de dades personals del Mestre Javi en lloc de la persona jurídica de l'Associació Cultural.
- Generar Android abans d'haver netejat el projecte, contaminant la nova carpeta `android/` amb dependències o fitxers obsolets.

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
- [[261020_2045_pla_implementacio_el_comu_i_llistes_reactives]]
- [[261020_2230_resum_historic_deutes_tecnics_i_tasques_pendents]]
- [[261020_2230_resum_historic_llisons_skills_i_casos_d_us]]

