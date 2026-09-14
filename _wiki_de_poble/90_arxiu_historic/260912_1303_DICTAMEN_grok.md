---
tipus: document
estat: esborrany
description: "🛡️ DICTAMEN D’AUDITORIA: SISTEMA DE DISSENY PEDRA SECA → 10/10 (Grok)"
---
# 🛡️ DICTAMEN D’AUDITORIA: SISTEMA DE DISSENY PEDRA SECA → 10/10 (Grok)

**Font:** Bundle `260912_1252_BUNDLE_auditoria.md` (verificat, 497 fitxers).  
**Abast:** Enginyeria inversa completa del front (components UI, seccions, CSS canònic, deute de classes forasteres).  
**Objectiu aconseguit:** Menú/botonera comú + documentació de la variació “Fixar mapa” + pla d’acció tancat.

---

## 1. Diagnòstic invers (forats reals)

### 1.1 Menú de `/disseny` (el forat principal)
`DesignSection.jsx` usa un `<nav className="sdp-design-nav">` + `<ul>` + `<Link className="sdp-design-nav__enllac">` totalment ad-hoc.  
No reutilitza `PillToggle`, `Pestanyes` ni cap component del catàleg.  
CSS de `.sdp-design-nav*` **no apareix** com a bloc canònic a `index.css` (només s’esmenta en deute de classes forasteres). Resultat: menú visualment inconsistent amb la resta de l’app i sense contracte d’accessibilitat documentat.

### 1.2 `PillToggle` ja és el selector canònic (i s’usa bé)
Definició oficial (`src/components/ui/PillToggle.jsx`):

- `role="group"` + `aria-pressed` (no classe `--active`).
- Actiu = taronja (`--sdp-accio` / `--sdp-accent`) amb text fosc (`--sdp-sobre-accent`).
- `onCanvi` es crida **sempre** (fins i tot sobre l’opció ja activa) → permet toggle.
- Accepta `children` (slot per botons extra).

Usos correctes:
- Mur (filtres + slot de Fixar).
- Multimedia (Galeria / Cronologia).
- Gestoria (Vista densa).
- Catàleg (`PaginaFormularis`).

### 1.3 Variació “Fixar / Desfixar mapa” (Mur)
**Veredicte:** és la forma correcta. No cal component nou. Cal **documentar-la oficialment** com a variació “estat d’acció / pin” del `PillToggle`.

### 1.4 Altres forats detectats (deute visual / estructural)
| Forat | Ubicació | Gravetat |
|-------|----------|----------|
| `.sdp-design-nav*` sense CSS canònic ni component | DesignSection | Alta |
| Classes forasteres a DesignSectionContent (`-col`, `design-badges-container`, `sdp-text-content`, `sw-pedra-50`, `text-muted`) | DesignSectionContent | Mitjana |
| `.sdp-filtre--mapa` marcada forastera | MurSection | Baixa (funcional) |
| Components “maqueta” / “obsolet” al registre (ActionControl, IconButton, UniversalButton, DateTimeControl, diverses icones) | registre.js | Mitjana |
| Dropdown: `minWidth` en línia + focus per fletxes pendent | ui/Dropdown.jsx | Mitjana |
| UniversalIndicatorCard encara “maqueta” | ui/ | Baixa |
| CSS de design-nav absent del layer `components` | index.css | Alta |

---

## 2. Menú Comú: decisió i implementació

**Decisió:** `PillToggle` **encaixa perfectament** com a menú de pàgines del catàleg de disseny (i per a qualsevol selector d’una sola opció activa).  

### 2.1 Implementació per a `/disseny`
Substitueix el `<nav className="sdp-design-nav">` a `DesignSection.jsx` per un `PillToggle`.

### 2.2 CSS mínim addicional (layer components)
Afegir `.sdp-pindola--disseny` i eliminar completament `.sdp-design-nav`, `.sdp-design-nav__llista`, `.sdp-design-nav__enllac`.

### 2.3 Documentació al catàleg
Afegir un espècimen de `PillToggle` com a menú de pàgines.

---

## 3. Variació oficial “Fixar / Desfixar” (documentació canònica)
Afegir a `estandard_ui_universal.md` i a l’espècimen de PillToggle la variació d’estat d’acció (pin / perill controlat).

---

## 4. Pla d’acció cap al 10 (ordre d’execució)
1. **Immediat**: Substituir `sdp-design-nav` per `PillToggle` a `DesignSection.jsx`. Documentar la variació `--taronja` / pin.
2. **Neteja de deute visual**: Purgar classes forasteres de `DesignSectionContent.jsx`. Marcar `.sdp-filtre--mapa` com a canònica o absorbir-la. Actualitzar `registre.js`.
3. **Accessibilitat residual**: Dropdown treure `minWidth` en línia. Verificar que tots els `PillToggle` tenen `etiqueta`.
4. **Inventari final**: Executar scripts d'auditoria per confirmar zero defectes.
5. **Tancament**: Espècimens vius i commit atòmic.
