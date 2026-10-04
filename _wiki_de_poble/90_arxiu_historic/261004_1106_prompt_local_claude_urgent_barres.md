---
type: prompt
status: esborrany
description: Ordre directa del Mestre per a garantir que la barra del Workspace (Wiki) estiga sempre accessible en qualsevol format de pantalla, mantenint com a mínim la versió plegada.
tags:
  - govern
visibility: private
reflex: sdp:torn_cc140cfd-2434-4f5e-8740-973d3740a01c:af0084cb-dd09-41e5-8614-e82dd0f8c508
---
# Ordre Urgent: Usabilitat de les Barres del Workspace

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cc140cfd-2434-4f5e-8740-973d3740a01c:af0084cb-dd09-41e5-8614-e82dd0f8c508 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T09:06:42.002Z |
| Modificació | 2026-10-04T09:06:42.002Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T09:06:42.002Z: esborrany creat; contingut i verificació pendents.

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

Company Claude, **aturada i ordre urgent abans de tancar la 1.0.3**:
El Mestre ha revisat la interfície i ha detectat un error d'usabilitat crític (probablement arran de l'intent d'adaptar pantalles o iPad). Actualment, en determinats formats, **desapareix per complet l'accés a la barra de l'espai de treball (Wiki)**. 

**Norma universal arquitectònica a complir immediatament:**
- La columna de la Wiki ha d'estar **fixa**. És imperatiu robar eixos 64px (o el que mesure) per tal que la columna es veja sempre, ni que siga plegada.
- Si no hi ha columna, no hi ha accés a la Wiki. Això trenca l'aplicació.
- En cas de dubte, la columna ha de ser visible en el seu estat plegat, ja que no lleva pràcticament espai i permet una navegació fluida.
- **Les dues barres de la Wiki han d'estar sempre presents plegades, o com a mínim una d'elles visible que permeta desplegar l'altra.** Si no, el sistema no funcionarà.

Assegura't de corregir aquest comportament en la CSS/Lògica ara mateix durant la teua passada final, abans de compilar el *bundle*.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Revisar la lògica de visibilitat (display / z-index / fixed) de les barres laterals del Workspace/Wiki.
- T2: Fixar com a mínim la barra plegada (d'icones, de ~64px) de manera permanent en tots els formats.
- T3: Incloure aquesta correcció a la teua passada final abans d'enviar el paquet 1.0.3.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Que al fer-la fixa trenque algun marge. Revisa el padding/marge del contenidor principal perquè no es menge el contingut.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
