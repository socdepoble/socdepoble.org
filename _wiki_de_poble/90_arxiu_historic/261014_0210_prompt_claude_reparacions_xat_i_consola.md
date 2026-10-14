---
type: prompt
status: esborrany
description: 'Encàrrec per a Claude Code per executar les reparacions diagnosticades per Gemini 4 Argon: presentació del xat, avatar sdp-media i sincronització de tasques a la consola'
tags:
  - govern
visibility: private
reflex: sdp:torn_2a27291f-be56-4f2c-a96d-2d0a1a633816:9e590e5f-7dfe-4fa5-a173-e42f08503b5d
---
# Prompt Local per a Claude Code — Reparació del Xat i Sanejament de la Consola Termodinàmica

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'Implementació vigent: `_wiki_de_poble/04_escriptori/261014_0210_pla_implementacio_reparacions_xat_i_consola.md`.
- Auditoria de referència: `_wiki_de_poble/04_escriptori/261014_0148_auditoria_gemini4.md` (diagnòstic exacte de Gemini 4 Argon High).
- Estat de l'Escriptori: Net (Porta Olivera en 0).
- Suite de proves de referència: 17.458 proves verdes. Cap regressió permesa.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2a27291f-be56-4f2c-a96d-2d0a1a633816:9e590e5f-7dfe-4fa5-a173-e42f08503b5d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T00:07:58.347Z |
| Modificació | 2026-10-14T00:10:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude Code / Claude 3.7 Sonnet |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-14T00:07:58.347Z: esborrany creat.
2026-10-14T00:10:00.000Z: encàrrec completat amb els 4 fronts de reparació immediata de Gemini 4.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Executar de forma autònoma i quirúrgica les 4 reparacions diagnosticades per Gemini 4 Argon High a l'informe `261014_0148_auditoria_gemini4.md`:
1. **Clon de WhatsApp - Targeta de Presentació a Gent de La Torre (`XAT-01`):** A `src/sections/xat/components/EntradaDelPoble.jsx:58-61`, retirar la redirecció forçada que segresta `/xat` cap a `/xat/<general.id>` quan `midaRef.current === 'ample'`. L'usuari ha de veure la columna de presentació de la comunitat/poble al panell dret fins que clique deliberadament un canal.
2. **Purga d'ERR_UNKNOWN_URL_SCHEME (`sdp-media://`) (`XAT-02`):** A `src/components/PedraSeca/atoms/Avatar.jsx`, `src/components/universal/identitat/AvatarResolt.jsx` i `src/components/PedraSeca/organismes/marca.jsx`, afegir la guarda `!esMitjaOpac(url)` per evitar renderitzar `<img src="sdp-media://...">` en cru.
3. **Consola Termodinàmica - Tasques Desconegudes (`CON-03`):** A `.agents/cron/registre_tasques.json`, afegir `"script": "scripts/immunitari/plaquetes-plan.mjs"` a `adopta-orfes`, `lapida-fantasmes` i `quarantena-brossa`.
4. **Verificació de Proves:** Comprovar que la suite de 17.458 proves es manté al 100% en verd.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (EntradaDelPoble.jsx):** Desactivar l'autonavigació forçada a la sala general en pantalla ampla per permetre que la pàgina de benvinguda de la comunitat siga visible.
- [ ] **Tasca 2 (Avatar i sdp-media):** Blindar els components d'Avatar perquè les referències opaques `sdp-media://` no arriben com a atribut `src` d'imatge al navegador.
- [ ] **Tasca 3 (registre_tasques.json):** Declarar l'script de plaquetes per a les 3 tasques de manteniment.
- [ ] **Tasca 4 (Verificació):** Executar les suites i emetre l'informe a `_wiki_de_poble/04_escriptori/261014_HHMM_auditoria_claude.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Assegurar que la navegació en mòbil (`mida === 'compacta'`) continua funcionant amb la màxima fluïdesa.
- Zero regressions a les 17.458 proves verdes.

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

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 89652d0020c665ffb26152e000fbf97406f3716c40b74f914cab4a04652b3513. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
