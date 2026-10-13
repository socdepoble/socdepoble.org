---
type: prompt
status: esborrany
description: Adaptació de ShellGestoria.jsx i generació del 3T sense dependències externes.
tags:
  - govern
visibility: private
reflex: sdp:torn_33788a4e-9495-4037-919b-1b5672b5034d:9dbce6f6-ee7b-43fa-a18c-f5643812555f
---
# Prompt Tauler de Gestoria V2

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquesta versió V2 corregeix errors arquitectònics del prompt V1 (prohibició d'OCR, reconeixement del Full Trimestral existent) gràcies a l'autòpsia de l'agent lector.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_33788a4e-9495-4037-919b-1b5672b5034d:9dbce6f6-ee7b-43fa-a18c-f5643812555f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T12:03:58.384Z |
| Modificació | 2026-10-12T12:03:58.384Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.5.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-12T12:03:58.384Z: esborrany creat; contingut i verificació pendents.

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

L'objectiu principal d'aquesta sessió és connectar definitivament el "Tauler" amb les dades del "Full Trimestral" i deixar el 3T de 2026 llest. 
L'autòpsia del codi revela que el "Full trimestral" ja obre la carpeta `2026_3T` correctament. El buit real és un problema de transmissió d'estat: la proposta del Full viu dins de `PanellGestoria` i no arriba al Tauler (que espera les `factures` i el `periode`). Cal lligar aquest cable que toca cinc fitxers clau (`targetesTauler.js`, `useGestoria.js`, `PanellGestoria.jsx`, `ContenidorGestoria.jsx` i `ShellGestoria.jsx`) perquè el Tauler deixe de mostrar el missatge "El Tauler encara no rep les factures del full trimestral".

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Lligar la Closca al Tauler (Elevació d'estat):** Modifica els 5 fitxers implicats (`targetesTauler.js`, `useGestoria.js`, `PanellGestoria.jsx`, `ContenidorGestoria.jsx` i `ShellGestoria.jsx`) per a passar tant les `factures` com el `periode` (vital perquè no calcule per defecte el 4T) al Tauler.
2. **Liquidació 3T (20 d'Octubre):** Verifica que amb aquesta connexió feta, els valors del trimestre s'enfoquen bé en les targetes del Tauler per al 303 i el 130 per a `2026_3T`.
3. **Imatges i Documents:** Ni se t'ocórrega inventar cap motor d'OCR. Si entra una imatge, la classifiques com a "factura fotografiada" i remets a l'usuari a introduir-la manualment amb el botó "Afig una despesa".

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Pèrdua de signatures (Cost de doctrina):** Modificar `ShellGestoria.jsx` i els seus hooks invalidarà les firmes d'aprovació dels tractors `gestoria.tauler`, `gestoria.factures` i `gestoria.correus`. Avisa el Mestre que haurà de tornar a firmar-los amb Touch ID en acabar.
- NO toques res de `_comunicacio_de_poble/`. Llegir-lo exigeix un tractor nou i no està en l'abast d'aquest torn.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 c7f9cebc8d206eb7bda0ce5e74b7f2f69489818cb35b733024a8181eb6645b11. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
