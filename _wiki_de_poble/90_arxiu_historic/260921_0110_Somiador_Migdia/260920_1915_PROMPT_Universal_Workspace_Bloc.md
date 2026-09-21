---
tipus: petorreta
estat: esborrany
description: "Reconstrucció del Bloc de Notes Universal (UniversalPage) i gestió d'usuari"
tags:
  - maquina
  - claude
  - universal-page
---
# Petorreta — Disseny del Bloc de Notes (UniversalPage) i Gestor d'Usuari

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609201915 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 19:15 |
| Modificació | 2026-09-20 19:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_page]]
- [[design_system_specs]]

## 1. Objectiu de la Missió

Hem de reconstruir i estandarditzar la vista principal del **Bloc de Notes** (l'editor situat a la columna dreta de la graella de notes) perquè complisca fil per randa amb l'arquitectura de la `UniversalPage` i integre la **gestió del perfil d'usuari**. 

Actualment, en obrir el llistat sense cap nota seleccionada, es mostra un estat buit molt primitiu ("Obre un solc") sense disseny. Volem assolir la bellesa i la funcionalitat de la pàgina canònica de disseny que tenim a Sóc de Poble.

## 2. El que has de fer

1. **Estandarditzar el Bloc de Notes (`UniversalEditorShell` o l'equivalent a Notes):**
   - Utilitza la `UniversalPage` com a llenç base per a l'editor o estat buit.
   - Aplica l'anatomia completa dictada a la nostra SKILL `universal-page`:
     - **Barra Blava (`bar-blue`)**: Amb navegació, botons d'acció centrals (Xat, Traduir) i botó de Connectar.
     - **Barra Taronja (`bar-orange`)**: Identitat de l'usuari/autor i botó d'hora.
     - **Capçalera (Frame SEO)**: Imatge de capçalera *full-width* que s'adapte dinàmicament.
     - **Títol Compacte (H1)**: Amb fons blanc, cantons arrodonits (`32px`) i les categories/etiquetes (`Mur`, `Sistema`, `Productivitat`, `Manual`).
   - Recrea l'estat per defecte (Welcome Note) que servisca d'estudi d'escriptura privat i lliure de distraccions, copiant el text i l'estructura visualitzats al prototip (imatge de llibreta escrivint, text introductori "El teu estudi d'escriptura privat i lliure de distraccions", etc.).

2. **Integrar la Gestió d'Usuari al Bloc Universal:**
   - Atés que la UniversalPage s'utilitza a tota l'aplicació, el propi Bloc Universal ha de servir de passarel·la per gestionar la identitat de l'usuari (Connectar, editar perfil, etc.).
   - Assegura't que l'espai on l'usuari escriu/llig té el color de fons correcte (`var(--sdp-fons-lectura)`) per evitar la fatiga visual.

3. **Consultar la Font de Veritat:**
   - Fes servir **exclusivament** `src/sections/disseny/DesignSection.jsx` com a plantilla i font de veritat per copiar l'estructura dom i les classes del disseny. No t'inventes classes.
   - Pots vore també com està muntat `AppGridShell` per respectar els `inert` i comportaments d'espai.

## 3. Què NO has de fer

- No modifiques l'estructura del `AppGridShell`. Només has de tocar el contingut que es renderitza dins de la columna de l'editor (dreta).
- No faces un `dangerouslySetInnerHTML` sense passar per `sanitizeHtml` (recorda la política de la Pedra Seca).
- No introduïsques classes que no existisquen als CSS de Pedra Seca. Totes les classes com `sdp-badge-system`, `sdp-badge-category`, `page-title`, etc., ja estan definides.

## 4. Contracte de Realitat

- Abans de tocar codi, llig els fitxers involucrats del bloc de notes i `DesignSection.jsx`.
- Assegura't de revisar com el `UniversalWorkspace` carrega l'editor a la tercera columna.

---
<<<FI_DEL_BUNDLE>>>
