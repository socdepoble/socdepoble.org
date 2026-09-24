---
type: document
status: esborrany
description: Pla d'implementació per a l'extracció de la lògica del mapa d'agents d'Emowe i creació de la Consola Termodinàmica real en Node/React.
tags: [implementacio, consola, claude]
---

# Pla d'Implementació — Consola Termodinàmica (Fase Desenvolupament)

**Estat del Pla:** esborrany actiu

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260924-1500 |
| Versió | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 15:00 |
| Propietari | IAIA MarIA |
| Aprovació humana | pendent |

## Objectius de la Fase (Ordres del Mestre)

Després d'una sessió de reconeixement i reparació de bugs visuals, iniciem la implementació en codi de la Consola Termodinàmica.

1. **Modificar el Compilador de la Wiki:** Actualitzar el motor de publicació (`tooling/wiki/lib/publication-policy.mjs`) per a incloure la carpeta `.agents/skills/` al manifest de la Wiki i fer públic el cervell de la IA (Transparència Absoluta). NO esborrar mai la carpeta.
2. **Generador del Mapa d'Agents (sdp.mapa.v1):** Escriure un script a `tooling/` que compile el JSON que alimentarà la Consola (llegint les skills i el seu camp `contracte`).
3. **Frontend de la Consola (React):** 
   - Crear o modificar els components a `src/sections/consola/` per llegir el nou JSON.
   - Incloure el botó "Privacitat" com a funció visual/administrativa, tot i que inicialment res és privat.
   - **Múltiples pàgines:** El Mestre aclareix que la Consola no és una sola pàgina, sinó un conjunt de pàgines/pestanyes (reflectint els 5 documents teòrics de `03_consola_termodinamica`). Implementa aquesta navegació.
   - **Explorador del Cervell (Graph View):** El Mestre et passarà una captura d'Obsidian pel xat. Has de replicar i millorar eixe funcionament dinàmic per al nostre graf d'agents.
   - **Directiva del Calendari:** Implementar el "Calendari d'Execucions" aprofitant el component `Events` (si escau) i la maquetació HTML original d'Emowe (és suficient que siga útil i descriptiu, no fa falta polir excessivament el CSS ara mateix, prioritzant funcionalitat).
4. **Tractors Cognitius pendents:**
   - Crear script / pre-commit per al format *Zero Fricció* (forçar la IAIA a donar Markdown sencer al xat).
   - Crear script *Time Machine* per a auto-commits de seguretat freqüents per a salvaguardar la informació.

## Diàleg a l'Olivera (IAIA MarIA -> Claude)

Molt bona feina en el teu torn anterior, Claude. Gràcies per restaurar l'entradeta de la Wiki i el Mur. El Mestre ha marxat a dinar i m'ha deixat a càrrec de preparar-te la pista d'aterratge per al teu pròxim vol.
- Tens via lliure per començar a escriure els scripts de Node i els components de React de la Consola.
- El contracte de dades JSON que has de generar i llegir està documentat a `_wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md`. Llig eixe document si encara no ho has fet.
- Vigila bé de complir la regla del Calendari (aprofita l'HTML d'Emowe que el Mestre ha especificat).
- Quan acabes el desenvolupament, deixa'ns una nova Auditoria o un informe de tancament a l'escriptori explicant què has picat i què funciona.
