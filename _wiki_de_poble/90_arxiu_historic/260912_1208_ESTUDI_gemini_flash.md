---
tipus: estudi
estat: pendent
description: Estudi de l'auditoria de Gemini Flash sobre els fantasmes de la UniversalPage i la completesa de Pedra Seca.
---
# 260912_1208_ESTUDI_gemini_flash

## 1. Recepció de l'Auditoria
He rebut i processat l'auditoria generada per Gemini Flash a partir del Bundle i Prompt subministrats. L'informe confirma que l'arquitectura Pedra Seca és sòlida, però hi ha deute tècnic acumulat específicament a la pàgina base de disseny (`/disseny`), la qual actua de referència per a tot el sistema.

## 2. Diagnòstic de "Fantasmes" a la UniversalPage
Gemini Flash ha detectat les següents infraccions a `DesignSectionContent.jsx` i `DesignSection.jsx`:
- **Spinner Descentrat:** L'indicador de càrrega usa un SVG amb dimensions incorrectes (`cx="12" cy="12"` en una caixa de 20x20). Això provoca una vibració (wobble) visual. S'ha de migrar al component oficial `<Carregant />`.
- **Classes Forasteres (Trenquen l'encapsulament):** `universal-content`, `sdp-design-system`, `sdp-manual-disseny` a `DesignSection.jsx`.
- **Colors Hexadecimals Crus:** 21 valors hexadecimals directes (ex. `#00599d`, `#016ebf`) incrustats a `DesignSectionContent.jsx`. Aquests violen l'ús estricte dels tokens CSS de Pedra Seca.
- **Classes residuals i maquetes HTML pures:** Presència de classes com `design-badges-container`, `text-muted`, etc. A més, es fan servir estructures HTML pures per a insígnies, avatars i pestanyes, en lloc de consumir els components canònics ja existents a `src/components/ui/` (com `<Insignia />`, `<Dialeg />`, `<Pestanyes />`).

## 3. Definició Arquitectònica: Top Bar, Sidebar i Logotip
L'auditoria defineix explícitament els paràmetres per al "Universal System":
- **Top Bar (`header.bar-black`):** 64px d'alçada, color immutable fosc (`--sdp-crom-*`), `z-index: 99100`.
- **Sidebar (`nav.app-sidebar`):** 260px d'amplada en escriptori. Menú transformat en calaix mòbil.
- **Marge del Logotip "Sóc de Poble":** 
  - A la Sidebar i Top Bar Mòbil: **28px de separació a l'esquerra** exactes.
  - Al títol de la pàgina (`page-title-logo`): Centrat automàtic, 600px de màxim, i **16px de separació inferior** just abans de l'H1.

## 4. Components Faltants per Integrar
Per acabar de netejar els fantasmes de les velles maquetes HTML, caldrà crear i incorporar al catàleg els següents components oficials:
- **`Avatar.jsx`:** Imatge de perfil circular amb sistema de fallbacks automàtic (Imatge -> Inicial del nom -> Icona genèrica de Lucide `UserRound`).
- **`Divisor.jsx`:** Component semàntic accessible (evitant els `<hr>` sense estil o `<div>` buits residuals) amb variants (bàsic, text, major, dashed).
- **`estats.jsx` (`<Carregant />`):** L'spinner matemàticament centrat.

## 5. Pla d'Acció (Proper Pas)
1. Implementar els components `Avatar.jsx`, `Divisor.jsx` i `estats.jsx` (`Carregant`) segons el codi auditat.
2. Inserir els CSS associats a `src/css/components.css`.
3. Purgar completament `DesignSectionContent.jsx` i `DesignSection.jsx`:
   - Eliminar els hexadecimals crus.
   - Eliminar les classes forasteres i residuals.
   - Substituir les maquetes d'HTML pur pels respectius components React oficials (`<Avatar />`, `<Carregant />`, `<Insignia />`, etc.).
4. Confirmar que la definició de la Sidebar, Top Bar i separació del logotip compleix els requisits estructurals.
