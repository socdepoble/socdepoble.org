---
tipus: estudi
estat: pendent
description: "Estudi de l'auditoria de Claude sobre la UniversalPage i el sistema de disseny."
---
# 260912_1212_ESTUDI_claude

## 1. Recepció de l'Auditoria
He processat l'auditoria de Claude (3,3 MB, 448 fitxers). L'anàlisi de Claude és profundament incisiu i corregeix premisses falses de l'encàrrec, apuntant problemes d'alineació òptica i CSS que havien passat desapercebuts.

## 2. Descobriments Clau de Claude
- **El doble error de l'Spinner:** L'spinner del `Suspense` està trencat perquè el contenidor no té regles CSS (classes orfes `universal-content`, etc.). A banda, els tres spinners de la secció 12 tenen el `viewBox="0 0 20 20"` però un cercle `(12,12) r="10"`, de manera que l'SVG queda tallat. S'ha de canviar el `viewBox` a `0 0 24 24` o usar el component `<Carregant />` directament.
- **Alertes trencades:** Les alertes de la pàgina base porten la classe modificadora `sdp-alerta--info`, però s'han deixat per el camí la classe base `sdp-alerta`. Això destrueix el padding, flex i marges.
- **Premissa falsa sobre elements faltants:** `Alerta`, `Dialeg`, `Progres`, `Pestanyes`, `Insignia` i `Boto` ja existeixen. La pàgina base simplement no els utilitza. Els únics que falten realment són `Avatar`, `Taula` i `Divisor` (que Codex ja ens va proporcionar).
- **El caos del Marge del Logotip:**
  - 28px no pertany a l'escala de 4/8 de Pedra Seca (hauria de ser 24px o 32px).
  - L'`!important` ofega el comportament responsiu (a tauletes i a <=480px fa coses rares amb el `flex-shrink`).
  - Quan la Sidebar està tancada, el "centrat" queda desplaçat 14px a la dreta per culpa d'això.
- **Contradiccions Doctrinals:** La pàgina proclama "P2P offline-first" i "IA local", la qual cosa viola l'ADR actual (Online-First). L'arxiu `doc_logos_oficials.md` té rutes trencades (`{ruta_logo_principal}`).

## 3. Integració amb l'Auditoria de Codex
L'estudi de Claude complementa perfectament el de Codex:
1. Codex ens dóna l'arquitectura i els components nous (Taula, Divisor, Avatar, Menu, AppShell).
2. Claude ens adverteix de les classes base absents (`sdp-alerta`), de l'alineació matemàtica del logo (llevar l'`!important` i ajustar-lo a l'escala), de la reparació del `viewBox` de l'spinner i de la coherència del text.

## 4. Proper Pas (Implementació)
He unit ambdues auditories en el Pla d'Implementació oficial. Els passos seran:
1. Refactoritzar `App.jsx` i la closca de la Top Bar / Sidebar.
2. Definir la caixa geomètrica perfecta i lliure d'`!important` per al logo.
3. Netejar `/disseny`, crear `PaginaFonaments.jsx` i reparar les alertes.
4. Afegir els components nous.
5. Corregir els textos enganyosos sobre "offline-first".
