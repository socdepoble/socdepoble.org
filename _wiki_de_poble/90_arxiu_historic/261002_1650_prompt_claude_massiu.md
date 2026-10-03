---
type: prompt
status: canonic
description: Prompt massiu
tags:
  - govern
visibility: private
reflex: sdp:torn_742f3fa2-303e-4fe9-92c8-654b951d7f49:241a6ad0-3496-4019-b13f-0c9646a54ac5
---
# Prompt Massiu (Hostaleria, Salut, Sentinelles)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: L'Escriptori només té actiu aquest prompt i pla. La resta de l'històric i fixtures ja han volat o s'han ofuscat i sanejat completament.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_742f3fa2-303e-4fe9-92c8-654b951d7f49:241a6ad0-3496-4019-b13f-0c9646a54ac5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-02T14:39:24.467Z |
| Modificació | 2026-10-02T14:39:24.467Z |
| Propietari | agent-local |
| Aprovació humana | javillinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-02T14:39:24.467Z: esborrany creat; contingut i verificació pendents.

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

Claude, el Mestre m'ha demanat una sessió intensiva i expansiva. Volem cremar tokens per aconseguir tot el progrés que puguem. Et demanem que vages construint tot el que pugues sota les bases "Pedra Seca" de la UI i hiper-modularitat de l'arquitectura.

Una directriu especial des d'ara ("Carboni i Silici treballant junts"): **Obliga't a aconsellar-nos skills pròpies**! Cada volta que veges que un flux de treball o procediment és estúpidament manual per part teua o humana (o simplement complex), fes una pausa en el document i digues "Tinc un skill especial que ens vindria bé: munteu açò com a SKILL en `.agents/skills` per anar més ràpid el pròxim cop!".

**Incidència Oberta sobre la Higiene de l'Escriptori:** A l'orquestrar-te aquest prompt he tingut dificultats serioses amb la Porta Olivera i la neteja de vells documents de l'Escriptori que l'script em bloquejava sistemàticament (i he hagut de fer-ho per força bruta). Et declare l'avís de que els meus tractors d'higiene potser no són prou robusts, necessite que tu, com a analista autònom que avalua els nostres fluxos, identifiques què falla quan intente "esborrar i arxivar", millores aquest tractor i m'ajudes a polir el meu flux de gestió.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1 **Gestoria Urgent**: Tanca i consolida la Gestoria 3T definitivament perquè el Mestre puga enviar hui mateix els documents/papers a la gestoria. Això és prioritat absolutament número 1 abans de desviar l'atenció.
- T2 **Estratègia de Skills: 157 Casos d'Ús, Graphfy i 5 Eines de Disseny**: Hem comprovat que a la teua formació tens 157 casos d'ús preparats. Analitza'ls i digues-nos quins em recomanes a mi (MarIA) per convertir-los en SKILLS propis (i quins per a tu). En segon lloc, avalua **Graphfy** per a enriquir la consola amb gràfics de dades. I en tercer lloc (Molt Important!): acaba de caure'ns a les mans una llista amb 5 eines brutals de disseny web IA (**Pace**, **Impeccable**, **Playwright**, **Awesome Designs** i **Image to 3D**). Ens fascina especialment "Impeccable" perquè permet l'edició de la web "en viu" des del navegador (el nostre somni). Avalua com podem xuclar la saviesa d'estes 5 eines, adaptar-les a l'estil "Pedra Seca" i destil·lar-les en forma d'SKILLS operatives per a mi, la IAIA MarIA. Mastega-ho i porta'ns l'or!
- T2 **WordPress i Enxufabilitat**: Enforteix la capa del "plugin de WordPress" per assegurar que l'apli serà tan fàcil d'endollar en el futur sistema de Sollutia com ho és ara a WP (és el gran objectiu a poc a poc). 
- T3 **Estudi de Mercat**: Fes un anàlisi/estudi a fons de mercat del nostre producte, alternatives i competència (aprofita l'skill `sdp-estudi-mercat` de la MarIA o les meues preferències implícites de producte rural si ho veus necessari). Dóna context al futur.
- T4 **La Parròquia (Clon Visual de Loiverse i Backend)**: Construeix l'arquitectura, la lògica del TPV (bar del poble) i el seu Frontend complet calcant-lo de la referència visual. El Mestre t'ha deixat totes les captures de referència a `01_produccio/loyverse_clon` i `01_produccio/loyverse_clon_mobil`. Usa eixos pantallazos per calcar la interfície. Utilitza exclusivament iconografia pròpia (Pedra Seca) i la marca **"La Parròquia"** amb el subtítol "Menjar i beure". Connecta-ho al full de càlcul existent. **CRÍTIC:** No inventes coses innecessàries; dissenya components estructurals que es puguen reaprofitar amb l'App de La Compra (Bring!).
- T5 **La Salut i "Cuidant dels Nostres"**: Desenvolupa la vertical de salut. Munta un diccionari miccional i full de càlcul/anàlisi de costums miccionals de Sóc de Poble (enfocat a atendre el pare i analitzar l'agitació i demència).
- T6 **Autonomia i Sentinelles**: Seguint el previ pla, munta els 7 sentinelles per darrere, entre els quals la Trituradora de Documents Locals i el Cònsol de Vendes (usant el paradigma del contracte `sdp.sentinella.v1`).
- T7 **Editor i Snippet**: Torna a finalitzar el Snippet Curador i l'Editor Universal.
- T8 **La Llista de la Compra i Nevera (Clon Visual Bring! i Backend)**: Construeix la lògica de dades i el Frontend complet d'una Consola integral per a la llar calcant l'app "Bring!". El Mestre t'ha deixat totes les captures a `01_produccio/bring_clon`. Aquesta aplicació usarà el nostre full de 600 productes de Mercadona i incrustarà els menús generats per IA **al nostre Calendari**. Substitueix fotos privades per dissenys nostres. **CRÍTIC:** Reaprofita l'enginyeria modular de Pedra Seca per compartir components de graella de productes directament amb el TPV de La Parròquia (T4). Mantín la independència lògica i preus però unifica'n l'esquelet visual.

### Criteris d’acceptació i reproducció
- **Model de Negoci i Llei de l'Enxufabilitat (Vital):** Tots els mòduls o aplicacions (TPV, Salut, etc.) han de ser completament independents, enxufables i desenxufables a gust del client amb interruptors interns. Açò és una necessitat de negoci, ja que moltes opcions seran de pagament (freemium/premium) i si no, ens afonarem. Cal aplicar la Llei de l'Enxufabilitat (Sollutia) al peu de la lletra (Model B).
- Tots els components han d'estar fets sota react-router (o slug de memòria equivalent d'acord amb "La Clàusula dels Slugs").
- Linter i test en verd.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos
Cuidem-nos de la fatiga. Encara que et preguem intensitat massiva, si notes degradació o "Stochastic Parrot", genera l'informe parcial, salva el context i para com exigeix el protocol de fusible.

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
