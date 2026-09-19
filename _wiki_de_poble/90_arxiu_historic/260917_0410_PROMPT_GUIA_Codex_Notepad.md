---
type: document
status: esborrany
description: "🎯 PROMPT GUIA: Bloc de Notes Universal (Fase 1)"
---
# 🎯 PROMPT GUIA: Bloc de Notes Universal (Fase 1)

**Instruccions d'ús per al Mestre:** 
Copia TOT el text que hi ha a continuació dins de la línia separadora i enganxa'l al xat de Codex (Tria el model **Sol Medio** o el més potent que tinguis, ja que aquest és un repte purament lògic i arquitectònic).

---

Aquest és el directori arrel del projecte Sóc de Poble: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`.
Com que tens accés de lectura, vull que inspeccionis els següents fitxers abans de començar:
1. L'estructura de l'AppGridShell a `src/components/layout/AppGridShell.jsx`
2. Les seccions actuals a `src/config/sections.js`
3. L'actual catàleg de disseny a `src/sections/disseny/DesignSection.jsx` (perquè entengues com està distribuït ara mateix abans de refactoritzar-lo).
4. L'arxiu de les regles de disseny a `_wiki_de_poble/04_arquitectura_disseny/pedra_seca.md`
5. L'índex de les meues regles (AGENTS.md) a `.agents/AGENTS.md`

**EL REPTE (Arquitectura Lògica):**
Volem desenvolupar la funcionalitat de "Bloc de Notes Universal" (Universal Notepad) per al sistema. L'objectiu no és només fer una eina per prendre notes, sinó dissenyar un **motor estructural de 3 columnes** (Patró Master-Detail) que en el futur servirà també per allotjar el Catàleg del Sistema de Disseny Pedra Seca.

L'estructura a tres columnes ha de ser genèrica:
- **Columna 1 (Navegació/Categories):** Carpetes, àrees o seccions (ex: Àtoms, Molècules o bé Llibreta Personal, Reunions).
- **Columna 2 (Llista d'Ítems):** Llistat d'elements dins de la categoria seleccionada, amb cerca o filtratge per etiquetes.
- **Columna 3 (Visor/Editor):** L'espai principal on es renderitza el contingut de l'ítem (text editable si és una nota, o un component viu si és el catàleg de disseny).

**LA TEUA TASCA:**
Ets l'Arquitecte Lògic del Consell. NO vull que programes el CSS ni els detalls visuals fins de Pedra Seca encara (d'això s'encarregarà Claude més tard). Vull que:
1. Dissenyes l'**Estructura de Dades** (l'estat de React, els contexts o l'esquema hipotètic de base de dades CRDT) per a gestionar aquest model a 3 columnes de forma genèrica.
2. Dissenyes l'**Esquelet de Components React** necessaris per acoblar açò dins del nostre `AppGridShell` existent.
3. M'expliques com passarem les dades entre les columnes (selecció, actiu, edició).

Dona'm l'anàlisi i el codi dels components lògics proposats. Recorda NO utilitzar Tailwind ni dependències externes de UI, seguim l'enfocament estricte de Sóc de Poble.

---
