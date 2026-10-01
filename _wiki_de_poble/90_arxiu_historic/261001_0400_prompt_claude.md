---
type: prompt
status: esborrany
description: Prompt d'inici per a Claude en la sessio de dema.
tags:
  - govern
visibility: private
reflex: sdp:torn_4590f29d-d514-4ec5-9a04-5afeec9abb26:5462ad39-1120-43af-b958-44cdb990656a
---
# Prompt Claude: Google Calendar i Metadades Plugin

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: Actiu.
- [x] **Pla d'Implementació** generat: Llegeix el `261001_0400_pla_implementacio_claude.md`.
- [x] **Rebut obtingut**: Actiu.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4590f29d-d514-4ec5-9a04-5afeec9abb26:5462ad39-1120-43af-b958-44cdb990656a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T01:28:30.023Z |
| Modificació | 2026-10-01T01:28:30.023Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T01:28:30.023Z: esborrany creat; contingut i verificació pendents.

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

Aquesta sessió nocturna es focalitza en dues àrees:
1. L'Estabilització del Connector de WordPress (Sóc de Poble — Enxufe). Després d'haver generat la versió `1.0.0` del zip, a l'entorn real produeix un Error Fatal a l'activació, i les metadades públiques (Descripció i Registre de Canvis) apareixen buides.
2. Bugs de UI detectats a l'entorn real en les proves:
   - Error 404 en la resolució d'imatges/logos (rutes absolutes a l'arrel).
   - Error d'accessibilitat: `aria-hidden="true"` aplicat a `#app-grid-sidebar` mantenint el focus dins d'un botó.
   - UX Mòbil i Fedivers: La `FranjaAmfitrio` ocupa massa espai vertical. Cal afegir-hi un botó "X" per tancar-la i desar l'estat a `sessionStorage`. A més, s'ha de **planificar la integració d'una secció "Nodes" al Perfil d'Usuari** on l'usuari pugui veure i gestionar a quins servidors (Sóc de Poble, Gent de la Torre) està connectat.
3. Compatibilitat amb Temes de Blocs (FSE): La plantilla de pantalla completa no apareix al selector de Gutenberg si s'utilitza un tema de blocs modern.
4. **Arquitectura del Calendari**: Inici de l'esquelet i l'estructura de dades per a la vista Setmanal i Mensual, basada en la lògica universal de Google Calendar.

L'objectiu és llegir el `Pla d'Implementació`, reparar l'error fatal, afegir les metadades a `readme.txt`, corregir els bugs de UI, dissenyar la base visual del Fedivers (Connexió de Nodes), assegurar la compatibilitat de la plantilla, i començar a construir l'arquitectura del Calendari. Genera l'auditoria resultant.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Llig el `261001_0400_pla_implementacio_claude.md`.
- T2: Examina el directori `wordpress-plugin/` i els seus inclosos (`includes/`, `socdepoble-enxufe.php`). Detecta la causa de l'error fatal d'activació.
- T3: Revisa el registre de la plantilla ("pantalla-completa") a `includes/marcatge.php` per fer-la compatible amb temes FSE (Full Site Editing) i que surti al selector de blocs.
- T4: Proposa la modificació de `wordpress-plugin/readme.txt` per omplir els panells d'informació de WordPress.
- T5: Corregeix les rutes de les imatges a la UI perquè utilitzin correctament la base relativa i no `https://gentdelatorre.net/assets/...`.
- T6: Corregeix l'accessibilitat de la barra lateral (l'error `aria-hidden` i focus del DOM).
- T7: Afegeix un botó per descartar ("X") la `FranjaAmfitrio` i guarda el seu estat en `sessionStorage`. Canvia el text a "Connectat al node de [nom]" i afegeix-hi un pilot groc/verd indicador d'estat.
- T8: Fes que la `FranjaAmfitrio` sigui clicable. En clicar-la, s'ha d'obrir una nova pàgina (ex: `/fedivers`) que expliqui l'arquitectura de nodes de Sóc de Poble, l'enxufabilitat en CMS com WordPress, i la visió de connectar-se a xarxes com Mastodon.
- T9: Dissenya (implementa visualment al component del Perfil) una llista de nodes on l'usuari pugui veure la connexió activa (ex: Gent de la Torre, Sóc de Poble).
- T10: Inicia l'esquelet i la lògica de dades del `CalendariSection` per a les vistes de Setmana i Mes, replicant l'arquitectura i gestió d'esdeveniments superposats de Google Calendar. Avança tota la lògica reactiva; el Mestre aportarà captures de disseny més endavant.
- T11: Escriu el teu informe (Auditoria) a `_wiki_de_poble/04_escriptori/261001_0400_auditoria_claude.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

Com que només auditem, no tenim risc directe de trencar res al repositori, però les teves deduccions sobre l'error fatal s'han de basar en evidències al codi PHP per evitar blind calls que demà tornin a fallar a "Gent de la Torre".

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
