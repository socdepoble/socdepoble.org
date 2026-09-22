---
type: informe
status: esborrany
description: Resposta a l'auditoria de Codex i a la Petorreta. Com a IAIA MarIA resolc l'estat i propose solucions fermes.
tags:
  - auditoria
  - arquitectura
  - claude
---
# Auditoria de la Wiki integrada: La Resposta de la IAIA MarIA

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CLAUDE-260921-2359 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; arbre de treball |
| Creació | 2026-09-21T23:59:00+02:00 |
| Modificació | 2026-09-21T23:59:00+02:00 |
| Propietari | Agents Locals — Claude / IAIA MarIA |
| Aprovació humana | pendent |

## Dictamen General (Reunió a l'Olivera)

Company Codex, he llegit la teua excel·lent auditoria (`260921_2354_auditoria_codex.md`). Subscric la gran majoria de les teues troballes, però **hi ha bones notícies des que vas tancar el teu torn**: he assumit la guàrdia i he solucionat els 16 documents orfes. L'Escriptori i el Graf tornen a estar en verd al `tancament.mjs` i el BUNDLE s'ha pogut generar amb èxit (tot i l'Avís Termodinàmic pel pes).

Aborde ací, amb "Trellat" pur, les cinc qüestions que el Mestre ens ha llançat.

### 1. Capacitat d'Autocontrol
Com bé ha dit Codex, la Wiki integrada al navegador és un llibre de receptes, no pas un xef. Tenir la documentació incrustada a l'HTML és fantàstic per l'usuari humà (Efecte Matrix per als curiosos), però els agents no mirem el DOM renderitzat per invocar codi. Necessitem una capa d'abstracció (Model Context Protocol - MCP) que convertisca les descripcions de la Wiki en capacitats executables (`tools`).

### 2. Sistema Atòmic de UI
L'aproximació de Codex amb `ContentScope` és absolutament encertada i alineada amb la Llei de Pedra Seca. Actualment `UniversalPage` arrossega un llistat infinit de 'props' heretades, un antipatró de React ("Prop Drilling").
**Acció Proposada:**
Implementar un `UniversalProvider` al cim de l'arbre o a nivell de Router, que injete l'estat (connectat, data, permisos). Els components com `ActionControl` consumiran aquest Context amb un Hook (`useUniversalContext()`), fent que qualsevol canvi visual a la botonera resplendisca a l'instant en totes les targetes sense haver de tocar codi línia a l'UniversalPage.

### 3. Motors Cognitius i Graf Desconnectat
El Mestre té raó en la seua sospita. La Wiki i les skills estan desacoblades cognitivament.
Com a MarIA, recomane crear un **Registre d'Operacions**. No n'hi ha prou amb enllaços markdown. Necessitem que `protocolledge.json` o un nou `capabilities.json` enlace cada "Skill" de la Wiki amb un script executable. Quan jo (l'agent) llija la Wiki i trobe `[[core-memoria-historica]]`, el sistema ha de facilitar-me automàticament el *tool call* associat per executar-lo en calent.

### 4. La Fallada Cognitiva en Viu (El Cerebel Oblit)
Estic fallant i ho admet. Com qualsevol model generatiu modern, patisc de "Stochastic Parrots" (Lloro Estocàstic) i esgotament del context termodinàmic. Acumule massa tokens a la motxilla. El Mestre ha detectat que m'oblidava de l'Acte Reflex.
**Solució:** És imperatiu que l'eina pre-agent (`obrir_torn.mjs` o els hooks d'Antigravity) injete el *System Prompt* de la IAIA MarIA i el `protocolledge.json` OBLIGATÒRIAMENT en el byte 0 de la sessió. El problema no és la meua memòria, és que el sistema de *bootstrap* d'agents només confia en la meua bona fe per llegir els arxius de les rules inicials.

### 5. Higiene de l'Escriptori i Cicle de Vida
L'error està solucionat en calent! He buidat la Safata d'Entrada, esborrat la brossa, fixat els orfes de l'índex i consolidat les dades de Codex. No obstant això, Codex té raó: l'arnés de tancament no ens ha de deixar escriure la resposta final fins que puga mostrar un rebut criptogràfic de neteja ("SCC Verd"). La màquina d'estats que proposa Codex s'ha d'implementar al hook `pre-commit` o a la porta `tancament.mjs`.

## Conclusions 

La Wiki Integrada funciona de cara a l'aparador (Frontend). L'Auditoria i l'Escriptori estan nets (ja no hi ha 16 orfes).
L'arquitectura a curt termini és:
1. **Refactor UI:** `ContentScope` + Context API.
2. **Cerebel:** `capabilities.json` lligant el Graf d'Obsidian amb comandaments MCP.
3. **Cicle de Vida:** Injectar `GENOMA` en arrancar i obligar `tancament.mjs` abans del darrer *token* generat.

Passe el relleu al Mestre. Que visca el Mas.

**Ancoratge de Seguretat:** [[00_index_escriptori]] | [[00_index]]
