---
type: document
status: esborrany
description: Pla d'Implementació de MarIA per a l'Explorador Visual del Brain i Coordinació amb Claude/Codex.
tags:
  - planificacio
  - graf
  - arquitectura
---
# Pla d'Implementació: Explorador Visual del Brain i Coordinació

**Context de la Sessió (Reunió a l'Olivera):**
Aquest pla es deixa a l'escriptori com a senyal de coordinació asíncrona. Mentre escric açò, sabem que **Claude Opus** i **Codex** estan auditant en paral·lel les Fases 4 i 5 de Fortificació, l'arrel del nostre deute cognitiu (la incapacitat de les IA per llegir sistemàticament la plantilla ISO) i les bases per al Graf. 
L'objectiu de deixar aquest pla ací és que, quan Claude i Codex aterren amb els seus informes, vegen que MarIA ja té les bases preparades per a executar l'arquitectura visual de l'Explorador del Brain.

## Fase 1: Explorador Visual del Brain (Graf Interactiu)

Prenent com a referència visual l'experiència d'usuari d'Obsidian (captura aportada pel Mestre), implementarem el següent:

1. **Interfície i Panell de Control:**
   - Implementarem un graf interactiu de nodes usant una llibreria lliure i fluïda (tipus `react-force-graph` o D3.js).
   - Inclourem un botó de **roda dentada (⚙️)**, just com a Obsidian, que òbriga un panell de control. Aquest panell permetrà a l'usuari encendre, apagar i filtrar:
     - Etiquetes (tags).
     - Categories estructurals.
     - Enllaços entre documents.
   - S'integrarà visualment utilitzant els tokens del nostre Sistema de Disseny *Pedra Seca*.

2. **Lògica de Dades (Sincronització en Viu):**
   - El graf s'alimentarà del JSON de dades de la nostra Wiki.
   - S'investigarà i aplicarà un mecanisme de sincronització (com un watcher de desenvolupament optimitzat o un script que refeta automàticament els canvis) perquè, cada volta que un arxiu canvie, el graf de la web s'actualitze en temps real, sense dependre de lents processos manuals de construcció (buscant l'experiència d'una App nativa).

## Fase 2: Resolució del Deute Cognitiu (A l'espera de l'Olivera)

Actualment la IA pateix d'un greu bloqueig que fa que oblide contínuament els actes reflexos i les regles de la Plantilla ISO.
- **Acció:** Esperem la finalització de les auditories de Claude i Codex. Analitzarem el seu diagnòstic forense sobre el sistema de *skills* i aplicarem la cura recomanada per extirpar aquest error esgotador d'una vegada per totes.

## Fase 3: Fortificació de Dades

- **Acció:** Executar l'arquitectura de portes de seguretat, la integració del `public_assets` a Supabase, i les incidències de l'OEPM segons la fulla de ruta que aporten les IA en paral·lel.

---
*Nota per a Claude/Codex: Si acabeu de descarregar el vostre informe a l'escriptori i llegiu això, sàpigueu que el camí ja està preparat. Ajunteu els vostres descobriments a la taula perquè puguem executar plegats!*
