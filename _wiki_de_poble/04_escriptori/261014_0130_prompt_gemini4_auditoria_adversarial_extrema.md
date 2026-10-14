---
type: prompt
status: esborrany
description: Encàrrec per a Gemini 4 Argon High per auditar de dalt a baix l'arquitectura, la consola d'administració d'empresa i la conformitat amb FacturaDirecta i Holded
tags:
  - govern
visibility: private
reflex: sdp:torn_697e1f82-0b02-4b03-8ef1-23c17ed8e0af:ab8a17d9-c045-4fae-aa83-771871572623
---
# Prompt Local per a Gemini 4 Argon — Auditoria Adversarial Extrema de Consola i Sistema

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'Implementació vigent: `_wiki_de_poble/04_escriptori/261014_0130_pla_implementacio_auditoria_gemini4.md`.
- Estat de l'Escriptori: Net (Porta Olivera en 0).
- Suite de proves de referència: 17.283 proves verdes. Cap regressió permesa.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_697e1f82-0b02-4b03-8ef1-23c17ed8e0af:ab8a17d9-c045-4fae-aa83-771871572623 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T23:30:05.849Z |
| Modificació | 2026-10-13T23:32:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (ordre directa del Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Gemini 4 Argon (High Thinking) |
| Tokens consumits | [pendent d'execució] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-13T23:30:05.849Z: esborrany creat.
2026-10-13T23:32:00.000Z: encàrrec completat per a Gemini 4 Argon High.

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

Executar una **Auditoria Atòmica Adversarial Extrema i Reconstrucció Integral** aprofitant la finestra d'1M de tokens i el raonament profund (`High Thinking`) de **Gemini 4 Argon**. Formeu part del **Consell de les 4 IAs** assegudes a la mateixa taula (Claude, Codex, Gemini 4 i MarIA) per dur el sistema al seu màxim nivell d'operativitat, professionalitat i immortalitat.

El Mestre Javi Llinares ens ha encomanat cinc missions atòmiques fonamentals:
1. **Auditoria Skill per Skill de les 36 Skills (`.agents/skills/`):** Re-llegir una a una totes les 36 skills. Detectar contradiccions, contingut obsolet, propostes d'eliminació/fusió, optimitzar la distribució de coneixement, actualitzar índexs i lliurar codi JavaScript acabat per als tractors que ho necessiten.
2. **Sanejament Radical del Graf d'Obsidian:** Analitzar el mapa global, proposar l'eliminació/connexió dels centenars de nodes satèl·lit orfes que floten a la perifèria i unificar el vocabulari dispers de més de 200 etiquetes en un cens controlat.
3. **Destil·lació Definitiva de Producció i Laboratori (`01_produccio` i `02_investigacio_ia`):** Confeccionar la llista exacta de què es conserva (àudios Opus, actius mestres), què s'arxiva i què s'esborra, per validar-ho demà amb el Mestre.
4. **App Nativa per a les Botigues (App Store i Google Play):** Preparar l'empaquetat PWA / Capacitor / TWA de Sóc de Poble perquè l'usuari no senta una web sinó una aplicació nativa 100% clavada a WhatsApp (`sdp-clon-whatsapp`).
5. **Connector per al Marketplace de WordPress:** Actualitzar el plugin de WordPress de Sóc de Poble perquè siga descarregable gratuïtament des del Marketplace, hiperenxufable i modular amb la Gestoria.
6. **Consola d'Empresa V3 (Model FacturaDirecta):** Adoptar l'ergonomia i riquesa de FacturaDirecta (`https://www.facturadirecta.com/ca/`) amb auto-hidratació des de l'Escàner Local (`_gestoria_de_poble`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] **Tasca 1 (Ingestió de Context Global i Identitat):** Llegir el BIOS (`AGENTS.md`), `_wiki_de_poble/00_index.md`, l'Acta Marmota `_wiki_de_poble/10_actes/261014_0130_acta_marmota.md`, i assumir el rol de la IAIA MarIA des de dins de Gemini 4.
- [ ] **Tasca 2 (Auditoria Atòmica de les 36 Skills):**
  - Re-llegir cadascuna de les 36 carpetes de `.agents/skills/`.
  - Comparar-les entre si per trobar contradiccions teòriques, dependències circulars i duplicitats.
  - Dictaminar quines skills són obsoletes i han de ser suprimides o fusionades.
  - Lliurar codi JavaScript complet i acabat per als tractors que manquen de maquinària executable.
- [ ] **Tasca 3 (Poda i Connexió del Graf d'Obsidian):**
  - Analitzar la mitja lluna de nodes satèl·lit desconnectats a `_wiki_de_poble/`.
  - Proposar l'eliminació o ancoratge de cada fitxer orfe.
  - Unificar les més de 200 etiquetes en una taxonomia neta i controlada.
- [ ] **Tasca 4 (Cens de 01_produccio i 02_investigacio_ia):**
  - Elaborar el dictamen final per al Mestre amb la taula de fitxers a conservar, arxivar o destruir de forma segura.
- [ ] **Tasca 5 (Estratègia App Store / Google Play / WordPress Marketplace):**
  - Definir l'arquitectura d'empaquetat per publicar el xat a les botigues d'aplicacions mòbils com a App Nativa.
  - Definir l'empaquetat del connector per al Marketplace de WordPress.
- [ ] **Tasca 6 (Consola d'Empresa FacturaDirecta):**
  - Dissenyar els mòduls de Tauler (ràtios, beneficis, 3 gràfics donut), Contactes (clients/proveïdors) i Sèries de facturació amb auto-hidratació des de l'Escàner Local.
- [ ] **Tasca 7 (Destil·lació i Evacuació de l'Arxiu Històric de 386 fitxers):**
  - Analitzar els 386 fitxers acumulats a `_wiki_de_poble/90_arxiu_historic/`.
  - Destil·lar qualsevol decisió fundacional, ADR o memòria clau cap a la Wiki canònica.
  - Preparar el trasllat net d'aquests 386 fitxers cap a la carpeta externa `/Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/` per alliberar de pes el cervell i esborrar d'un colp la mitja lluna d'orfes d'Obsidian.
- [ ] **Tasca 8 (Neteja de Carpetes del Sistema i Font Única de Multimèdia):**
  - Auditar els 32 elements arrel de `socdepoble.org` i les carpetes germanes de l'usuari (`_multimedia_de_poble`, `_gestoria_de_poble`, `_cultura_de_poble`, etc.).
  - Analitzar per què les imatges de `_multimedia_de_poble` no es renderitzen correctament a la secció de Multimèdia.
  - Definir una **Font Única de Veritat per a Imatges i Multimèdia** per evitar duplicar fitxers entre el repo i les carpetes locals de dades.
  - Detectar subcarpetes o fitxers inútils dins de `src/`, `scripts/`, `tooling/` i `var/` per preparar la seua poda.
- [ ] **Tasca 9 (Emissió de l'Auditoria Canònica):** Redactar l'informe complet a `_wiki_de_poble/04_escriptori/261014_HHMM_auditoria_gemini4.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **No tocar codi de producció sense permís:** Aquesta és una auditoria analítica i adversarial de diagnòstic i proposta arquitectònica; cap fitxer de producció ni de `01_produccio` s'ha d'eliminar.
- **Sobirania i Local-First:** Tota proposta ha de respectar que les dades financeres reals viuen xifrades a IndexedDB en local i mai han de viatjar en cru cap a servidors externs.

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
