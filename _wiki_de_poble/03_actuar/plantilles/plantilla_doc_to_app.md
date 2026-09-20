---
type: plantilla
status: canonic
description: Plantilla per convertir documentació en funcionalitats d'aplicació traçables i verificables.
tags:
  - maquina
---
# Doc to App (Transformació IAIA)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular Negre (Per a Light Mode):** `/assets/system/ui/logo-socdepoble-rect-negre.svg`
- **Rectangular Estàndard:** `/assets/system/ui/logo-socdepoble-rect.svg`

## MISSIÓ DEL PROTOCOL
Transformar contingut estàtic (PDFs, notes, bans de l'ajuntament) en mini-aplicacions web interactives i útils per al veí.

## EL RESULTAT (DELIVERABLE)
- **Carpeta Nova:** `miniapp_<tema>_<timestamp>/`
- **index.html:** Interfície interactiva (Pure HTML/CSS/JS).
- **data.json:** Les dades de la IAIA MarIA estructurades.

## FUNCIONALITATS OBLIGATÒRIES
1. Busca ràpida (Search bar).
2. Filtres per categories de poble.
3. Disseny Mobile-First (Bento).
4. Botons de utilitat (Copia, comparteix, amplia).

## FLUX DE TREBALL
1. **Lectura/Extracció:** IA llegeix el document.
2. **Estructura:** Convertir a JSON amb el to de la Tia Maria.
3. **Generació:** Crear l'HTML premium de Pedra Seca.
4. **Validació:** Passar el Skill de Producció (Botiga de Diumenge).

---
_Fent poble amb [[el_projecte|Sóc de Poble]]! © 2026_

---


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** [[00_plantilles|07_plantilles]]
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

