---
type: prompt
status: actiu
description: 'Prompt per a Claude: Implementació de la UI i Flux de Registre'
tags:
  - govern
visibility: private
reflex: sdp:torn_75cf1a7a-e87f-474e-8e65-036838f7cc9f:73a37e42-bd00-4ad7-9102-ad93d644dddf
---
# Prompt Implementació Opus

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_75cf1a7a-e87f-474e-8e65-036838f7cc9f:73a37e42-bd00-4ad7-9102-ad93d644dddf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T15:32:17.841Z |
| Modificació | 2026-09-30T15:32:17.841Z |
| Propietari | agent-local |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | iaia-maria (gemini) |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T15:32:17.841Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Hola Claude (Opus / UltraCode). Ja has analitzat l'arquitectura teòrica (informe v1.0.0). El Mestre ha aprovat les teues recomanacions **amb excepcions innegociables (D1, D3 i D4)**:
- **D1:** El verb NO és guardar. És **CONNECTAR**. Quan es connecta, aterra en una "Safata d'Entrada" (Bloc de notes) des d'on s'organitza.
- **D3:** El botó central de la barra mòbil NO és "Publicar", sinó "Panell de Control" (`/control`) per accedir a funcionalitats avançades.
- **D4:** L'element a la Safata d'Entrada **ÉS EDITABLE**. És una còpia local de l'usuari on pot afegir reflexions o donar format (H1, H2) abans de republicar-ho al Mur. Quan es guarde contingut d'altres (ex: un enllaç extern), el sistema haurà d'avisar si té Copyright i forçar/facilitar l'atribució a l'autor original en cas de republicació. 
- **D7:** Al Xat, el canal "Avisos" és estrictament unidireccional (només lectura, sense barra d'escriptura per a l'usuari). El "General" només es mostra si hi ha moderació. 
- **D8:** Quan s'arriba a l'App des de fora (Share), l'aterratge és la portada del Poble, no el xat.
- **D9:** En "Comentar" una publicació, s'obri un xat privat amb l'autor. Tanmateix, si l'autor ha obert un grup de debat per a la publicació, hi haurà un pas intermedi permetent triar entre privat o grup públic. 
- **D10:** Implementar la funció "Compartir" cap a l'App usant l'API nativa de mòbil (Web Share Target). 
- **D13:** L'URL pública dels usuaris serà a l'arrel: `/[usuari]`. L'usuari és global i pot pertànyer/publicar a diverses comunitats (pobles).
- **D15:** Llicència per defecte: Creative Commons. L'última opció del selector és "Copyright (C)" amb un text personalitzable (màx 256 caràcters).
- **D16:** La pestanya de "Novetats" (Estats) s'amaga. 
- **D17:** La pestanya de "Telefonades" NO S'ELIMINA. Quan l'usuari la polse, ha de mostrar un missatge clar: "Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament." 
- **D18:** La URL d'un poble és una "Comunitat". NO mostra xats privats de l'usuari, sinó que agrupa els xats públics del poble, encapçalats pel "Grup General" i seguits de subgrups com "Walapop Torruano" o "Compartir Cotxe". Això manté net l'espai privat de l'usuari. 

És hora de programar el codi real (Frontend) en React i CSS respectant les decisions que tu mateix vas establir i les correccions de Codex de la fase adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Neteja i Idioma.** L'idioma anglés s'activa per defecte de manera errònia. Força que el Valencià siga l'estàndard sempre.
- **T2: Reparació de Vistes.** Neteja les crides trencades a DB (Mur, Mercat) que llancen `ERR_CONNECTION_REFUSED`.
- **T3: La UI de Pedra Seca (Mode WhatsApp).** Implementa la barra inferior. El botó central **NO és publicar**, ha de ser l'accés al "Panell de Control" (`/control`) per a futures funcionalitats pro. Mantín la pestanya de Telefonades amb l'avís indicat a D17.
- **T4: Registre i Flux de Sessió (Prioritat 1).** Desenvolupa els components per a registrar-se i iniciar sessió neta a través de l'API de Supabase existent, permetent l'entrada als betatesters.
- **T5: Tancament.** Genera el teu resum d'accions en un informe d'auditoria.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:8881/pedra-seca-demo/` i `http://localhost:3340` (vite).
- **Criteris d'Acceptació:** No hi ha errors bloquejants a la consola. El layout inferior és usable en format mòbil. L'usuari es pot registrar al sistema.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre dependències massa fortes en Supabase a l'hora de muntar la sessió. Recorda l'enxufabilitat.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
