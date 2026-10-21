---
type: prompt
status: esborrany
description: 'Prompt canonic per a Claude i Gemini: desplegament oficial a botigues Google/Apple/WordPress.org, assimilacio AyudaWP i poda Salfumant Fase 2'
tags:
  - govern
visibility: private
reflex: sdp:torn_4400d512-c727-4114-a441-0e66a1e1fc53:1e113b87-b01c-4a14-a01b-85e30db1ee30
---
# Auditoria i Desplegament Botigues, AyudaWP i Salfumant Fase 2

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. **Estat de l'Escriptori:** Net i verificat amb `porta-olivera.mjs`.
2. **Llibre Mestre:** Consulteu obligatòriament `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
3. **Pla Vigent:** Lligat al pla aprovat `261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4400d512-c727-4114-a441-0e66a1e1fc53:1e113b87-b01c-4a14-a01b-85e30db1ee30 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T16:47:51.071Z |
| Modificació | 2026-10-21T16:50:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | claude-3-7-sonnet / gemini-2.5-pro |
| Tokens consumits | ~12.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-21T16:50:00: esborrany aprovat per autoritat del Mestre Javi Llinares. Focus: Desplegament oficial de botigues (WordPress.org, Google Play, Apple App Store), assimilació AyudaWP i poda Salfumant Fase 2.

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

> **Destinataris del torn actiu:** **Claude Code** (executor de codi, aprofitant el 41% de context disponible) i **Gemini** (auditor de conformitat i contrast de seguretat).
> **🔥 DIRECTIVA SUPREMA DEL MESTRE JAVI LLINARES:** Res d'enviaments informals d'APKs ni paquets per WhatsApp als beta testers. Volem publicar directament, oficialment i 100% legal a les botigues (WordPress.org, Google Play Store i Apple App Store).

Heu d'assumir la implementació dels següents quatre mòduls aprovats al Pla d'Implementació:

1. **Mòdul A (WordPress v1.1.9 i Paquets Oficials · `P0-13` / `P0-16`):**
   - Pujar `Version: 1.1.9` a `wordpress-plugin/socdepoble-enxufe.php` i `wordpress-plugin/readme.txt`.
   - Eliminar la carpeta paràsita `wordpress-plugin/supabase/`.
   - Executar la compilació i l'empaquetat (`node tooling/scripts/empaqueta.mjs`).
   - Confirmar que es generen els dos ZIPs a `_builds_de_poble/wordpress/`:
     * `wordpress_enxufe_v1.1.9.zip` (per a Sollutia i `gentdelatorre.net`).
     * `wordpress_directori_v1.1.9.zip` (<10 MB, sense actualitzador extern, llest per a enviar a WordPress.org).

2. **Mòdul B (Poda Salfumant Radical Fase 2 · `P0-14`):**
   - **Retirar `assets/img/` de Git:** Moure `socdepoble.org/assets/img/` a `../_multimedia_de_poble/quarantena_arrel_assets/` i executar `git rm -r assets/img/` (estalvi de 8,8 MB directes).
   - **Netejar orfes de `public/assets/uploads/` (1,31 MB):** Eliminar `nano_mercat_llaurador_1774197050578.png` i `post_fira_artesania_1774198229727.png` (0 referències).
   - **Migració WebP dels 128 rasters duplicats:** Actualitzar referències a `src/config/censImatges.js` i `media_registry.json` cap a `.webp` i evacuar els rasters originals a `../_multimedia_de_poble/originals_raster_public/` (estalvi net de 113,67 MB a `public/assets/`).
   - **Eliminar vistes mortes del Lector:** `src/apps/lector/vistes/Carpetes.jsx` i `src/apps/lector/vistes/Fonts.jsx`.

3. **Mòdul C (Tractor Cognitiu `sdp-vigilant-tellado`):**
   - Crear el tractor canònic a `.agents/skills/sdp-vigilant-tellado/SKILL.md` traduint les 6 regles Tellado (`VIG-01` a `VIG-06`) basades en el plugin *Vigilante* d'AyudaWP i el checklist de 77 punts.

4. **Mòdul D (Sincronització Nativa Mòbil):**
   - Executar `npm run build:natiu`.
   - Executar `npx cap sync ios` i `npx cap sync android` per deixar els projectes mòbils 100% sincronitzats amb el codi net (zero «conta», zero iframes recursius).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1:** Bump a 1.1.9 de WordPress, purga de `wordpress-plugin/supabase/` i generació dels ZIPs canònics.
- [ ] **Tasca 2:** Execució de la poda de Salfumant Fase 2 (`assets/img/`, orfes i migració WebP de 115 MB).
- [ ] **Tasca 3:** Creació de la skill/tractor `.agents/skills/sdp-vigilant-tellado/SKILL.md`.
- [ ] **Tasca 4:** Recompilació nativa i `cap sync` per a iOS i Android.
- [ ] **Tasca 5:** Verificació de proves (`npm test` >20.400 en verd) i Porta Olivera en verd.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Totes les imatges i fòssils evacuats es traslladen a `_multimedia_de_poble/`, mai amb esborrat destructiu.
- La Frontissa de Sollutia (`src/data/adaptadors/sollutia/`) és sagrada i intocable.

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
