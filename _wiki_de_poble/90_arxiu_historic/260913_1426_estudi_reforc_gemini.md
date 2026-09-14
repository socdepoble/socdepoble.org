---
tipus: document
estat: esborrany
description: Informe de Reforç (Gemini Flash)
---
# Informe de Reforç (Gemini Flash)

Conté la resposta de Gemini Flash a la Petorreta d'auditoria destructiva.

## Veredicte Preliminar (4.5/10)
Gemini Flash fa una anàlisi implacable focalitzada en el rendiment, els colls d'ampolla i l'estàndard d'accessibilitat/baseline. Toca els mateixos punts P0 de les facetes que Claude i Codex, però destaca tres forats específics impressionants:

1. **[P0] Buidat de la Carpeta "Tot":** 
   A `ManagerContext.jsx`, si l'arbre és pla i no té `.children`, en seleccionar l'arrel (`f-tot`), el llistat es queda a 0 perquè la lògica d'arbre no reconeix les carpetes planes sense l'atribut parent. Desapareixen totes les notes.

2. **[P1] Incompatibilitat Baseline 2022 per culpa de `:has()`:**
   En `AppGridShell.css` s'està usant el pseudo-selector `:has()` per replegar columnes. Això incompleix el Baseline 2022 (Firefox no ho va suportar fins desembre de 2023). Gemini proposa un sistema robust basat en atributs `data-layout` directament al wrapper.

3. **[P1] Bloqueig Termodinàmic de DOMParser:**
   Mentre que Claude deia que hi havia massa crides a `Intl` i extracció de text, Gemini ha posat el dit a la llaga: `DOMParser` instanciat 100 vegades per pulsació gela completament els dispositius mòbils. Proposa una extracció ultra-ràpida amb Regex només per a indexar les cerques en viu.

## Conclusió
Gemini Flash és el millor perfilador de rendiment i higiene de plataformes. Tindre un detector de trencament de Baseline 2022 és un luxe absolut. El seu codi de blindatge (Data-attributes en lloc de `:has()` i Regex ràpida en lloc de DOMParser) és de pas obligatori.
