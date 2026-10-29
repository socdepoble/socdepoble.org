---
type: document
status: canonic
description: "Acta Marmota: Tancament de la sessió de nit. Passada de disseny completada i inici de la refactorització de la Gestoria preparat."
tags: [govern, acta]
---
# Acta Marmota: Tancament Onada 4 (261004)

## Resum de la Jornada (Onada 4 - Sessió Nocturna)

El Mestre ha dirigit una sessió intensiva per polir l'arquitectura i l'UI de Sóc de Poble:

1. **Passada de Disseny (Components.css / Modules.css):**
   - S'ha completat la definició de la Taxonomia 2026 de colors i targetes.
   - S'ha creat l'estat `.sdp-badge-buit` (transparent amb vorell fosc) per a les botoneres desmarcades, per no confondre-les amb les carpetes de Sistema.
   - S'ha estandarditzat l'ús d'aquesta classe a `BotoneraClassificacio`, `DocumentPrintPreview`, i el `CopyrightSelector`.

2. **Arquitectura i Refactorització Futura:**
   - S'ha establert la **Llei Innegociable de "No Inventar Targetes"**: Tot el que construïm ha d'usar obligatòriament l'`UniversalCard` (Llistes) i l'`UniversalEditor` (Detall). El RSS i La Nevera de Casa estan pendents de refactorització per eliminar els seus propis invents.
   - S'han establert les bases de la nova **Gestoria**: Será un ERP modular (model Holded/Odoo) amb facturació immutable (Veri*Factu/Llei Antifrau). S'ha creat el prompt (`261004_0320_prompt_claude_gestoria.md`) amb l'especificació d'aquest i la finalització del Xat (Multimèdia i investigació de WebRTC P2P).
   - Aquest prompt inclou a més funcions com la inserció de targetes vives a l'editor universal i l'enllaç universal de les boines d'autor.

## Estat a l'anar a dormir
- Claude està executant autònomament la **Passada de Tancament** (`onada4-tancament`) en segon pla per empaquetar el ZIP 1.0.2. Aquest procés acabarà a soles al teu terminal, aplicant el cens de contrast, resolent aïllaments i verificant que tot compleix AAA. No cal que hi sigues tu ni jo per a que remate això; ell generarà el ZIP en acabar.
- La safata d'entrada i l'escriptori contenen els elements de referència i prompts per a la pròxima sessió (`_wiki_de_poble/04_escriptori/`).

## Pròxima Acció en Despertar
1. **Obrir un Xat Nou (Vital per a estalviar tokens):** El context actual té més de 57 artefactes acumulats. Començar en un xat net l'endemà reduirà dràsticament l'ús de tokens i millorarà la lucidesa.
2. Verificar el **ZIP 1.0.2** generat per Claude i prendre decisió sobre les menudalles que ha deixat penjades (el botó de CopyrightTrencat i el menú a 320px).
3. Entregar el nou Prompt (`_wiki_de_poble/04_escriptori/261004_0320_prompt_claude_gestoria.md`) a Claude en un xat fresc per arrencar el motor de la Gestoria, refactoritzar l'RSS/Nevera, i tancar el Xat Multimèdia.
4. Codex continuarà reservat per entrar només en punts crítics (quan la Gestoria estiga implementada) i validar el Codi, i així no cremar el 51% lliure que li queda de quota setmanal.

## Vincles

- [[00_index]]
