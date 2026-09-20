---
type: plantilla
status: canonic
description: Plantilla per preparar una funcionalitat per a producció amb controls de qualitat i risc.
tags:
  - maquina
---
# Modo Producció (Botiga de Diumenge)
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
Auditoria forense final abans que el projecte es considere "acabat" o es publique. No és per a idear, és per a polir.

## CHECKLIST D'AUDITORIA
1. **Funcionalitat:** Obre sense errors? Les imatges carreguen? Rutes OK?
2. **Responsive:** Hi ha scroll horitzontal en mòbil? Llegibilitat?
3. **Disseny (Pedra Seca):** Radis de 28px i 18px? S'aplica estrictament la paleta de 4 colors (Primary, Secondary, Tertiary, Neutral)? Tipografia Noto Sans?
4. **UX/Copy:** Enllaços de la Sidebar intactes? Res de text "Lorem Ipsum"?
5. **Accessibilitat:** Contrast suficient? Alt text a imatges?

## PROCÉS ESTÀNDARD
1. Diagnòstic (Llista d'errors).
2. Pla de Correcció (Agrupar canvis al DOM per evitar errors asíncrons).
3. Aplicació Segura.
4. Re-validació final.

---
_Fent poble amb [[el_projecte|Sóc de Poble]]! © 2026_

---


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** [[00_plantilles|07_plantilles]]
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

