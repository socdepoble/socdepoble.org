---
tipus: informe
estat: canonic
description: "Auditoria forense d'UI per assolir el 10/10 en Pedra Seca (Menús, Píndoles i Cercadors)."
---
# 🛡️ DICTAMEN D'AUDITORIA: SISTEMA DE DISSENY PEDRA SECA 10/10

**Data:** 12 de Setembre de 2026
**Emet:** IAIA MarIA (Seient Núm. 5 del Consell d'IAs)
**Àmbit:** Neteja d'estils orfes, estandardització de botoneres de navegació i validació de lògica inversa al Mur.

Mestre, he analitzat els 2.0 GB de rutes, fulls d'estils i components que pengen de l'arrel de Sóc de Poble. Hem forjat moltes lleis al llarg de l'estiu (Llei de Vida, Llei de Pedra Seca, Zero Tailwind al Core), però per assolir el **10 sobre 10**, cal escombrar els últims racons on els components es comportaven de manera rebel o feien servir estils fora del contracte.

A continuació expose el diagnòstic i el pla d'acció exacte (codi a la mà) per a cosir els darrers forats.

---

## 1. El Menú Comú (`MenuPindoles` vs `PillToggle`)

### L'Error Semàntic
Avaluant la teua proposta d'usar `PillToggle` per al menú de la pàgina `/disseny`, el veredicte és **NO**.
`PillToggle` està dissenyat com a un grup de controls de formulari (`role="group"` amb botons radi i `aria-pressed`). En canvi, el menú del catàleg de disseny és **navegació pura** (enllaços cap a altres vistes que recarreguen el router via `?pagina=X`). Si fem servir botons on hi hauria d'haver enllaços (`<Link>`), trenquem el SEO, l'historial del navegador i l'accessibilitat per als lectors de pantalla.

### La Solució de Trellat
No hem de duplicar el disseny, només la semàntica. L'estructura de `.sdp-pindola` és tan neta que podem crear un component germà anomenat `MenuPindoles` que faça servir **exactament les mateixes classes CSS**, però construint un `<nav>` ple d'enllaços `<a>` en comptes d'un `<div role="group">` amb `<button>`. L'HTML5 permet tindre els `<a>` directament penjant del `<nav>` sense necessitat d'embrutar-ho amb llistes `<ul>` i `<li>`.

---

## 2. El Botó "Desfixar" al Mur (La Píndola Taronja)

Al fitxer `MurSection.jsx` has injectat un botó de fixar/desfixar el mapa passant-lo com a `children` dins del `PillToggle`.
**Veredicte:** És una solució brillant a nivell d'arquitectura de *slots* de React. Com que està dins del mateix grup d'accions del Mur, té sentit que convisca dins del mateix contenidor `.sdp-pindola`.

El problema no és la implementació al Mur, sinó que **no està documentat al catàleg**. La classe `.sdp-pindola__opcio--taronja` ja existeix a `components.css`, però cap IA o nou desenvolupador sap que es pot gastar així. Ho solucionarem oficialitzant aquest patró al catàleg d'espècimens.

---

## 3. Caça de Forats: Classes Òrfenes i Components Bruts

Fent arqueologia profunda al codi, he trobat els següents deutes que cal eradicar hui mateix per arribar al 10:

1. **`sdp-cataleg-nav` és codi zombi:** Al fitxer `components.css` sobreviuen les antigues classes del menú de disseny (`.sdp-cataleg-nav`, `.sdp-cataleg-nav__llista`, etc.). Ocupen pes termodinàmic inútil. S'han de fulminar immediatament en introduir el `MenuPindoles`.
2. **`UniversalSearch` està trencat:** Actualment a `UniversalSearch.jsx` usem classes de transició com `.universal-search-wrapper` i `.universal-search-input` que tenen regles d'estil a `index.css`. Açò trenca l'encapsulament dels formularis. Cal reescriure-ho amb el patró d'etiquetes de Pedra Seca.

---

## 🛠️ PLA D'ACCIÓ EXECUTABLE (CODI PER IMPLEMENTAR)

Aplica immediatament aquestes mutacions al codi font per tancar l'arquitectura:

### ACCIÓ 1: Crea el component `MenuPindoles` a `src/components/ui/navegacio.jsx`
Afig aquest codi al final del fitxer:
```jsx
export function MenuPindoles({ opcions = [], actual, etiqueta, className }) {
  return (
    <nav aria-label={etiqueta} className={['sdp-pindola', className].filter(Boolean).join(' ')}>
      {opcions.map((o) => (
        <Link 'page' : ? actual aria-current="{o.valor" className="sdp-pindola__opcio" key="{o.valor}" to="{o.href}" undefined}>
          {o.icona ? <span className="sdp-pindola__icona" aria-hidden="true">{o.icona}</span> : null}
          {o.text}
        </Link>
      ))}
    </nav>
  );
}
```

Al fitxer `src/components/ui/index.js`, exporta'l per fer-lo oficial:

```javascript
export { MollaPa, Paginacio, MenuPindoles } from './navegacio.jsx';
```

### ACCIÓ 2: Actualitza `components.css` per suportar els enllaços-píndola

Localitza la secció de `sdp-pindola` dins de `@layer components` i afig `text-decoration: none;` i el suport de `aria-current`:

```css
  .sdp-pindola__opcio {
    /* ... la resta del codi igual ... */
    text-decoration: none;
  }
  
  .sdp-pindola__opcio[aria-pressed="true"],
  .sdp-pindola__opcio[aria-current="page"] {
    background: var(--sdp-accio);
    border-color: var(--sdp-accio);
    color: var(--sdp-text-invers);
  }
```

**Molt important:** Acte seguit, esborra les antigues classes `.sdp-cataleg-nav` (tot eixe bloc sencer) de `components.css`.

### ACCIÓ 3: Injecta el `MenuPindoles` a la pàgina de Disseny

Ves a `src/sections/disseny/DesignSection.jsx`. Substitueix el vell `<nav className="sdp-design-nav">...` per:

```jsx
import { MenuPindoles } from '../../components/ui/navegacio.jsx';

// Dins del retorn del component, abans de <div className="sdp-design-content">:
<MenuPindoles actual="{actual}" etiqueta="Pàgines del sistema de disseny" opcions="{PAGINES.map(p"> ({
    valor: p.id,
    text: p.titol,
    href: p.id === 'fonaments' ? pathname : `${pathname}?pagina=${p.id}`
  }))}
/>
```

### ACCIÓ 4: Oficialitza la "Píndola Taronja" al Catàleg

Ves a `src/sections/disseny/cataleg/PaginaFormularis.jsx`. A l'espècimen del `PillToggle`, actualitza el codi JSX de demostració per ensenyar als humans com inserir el botó d'acció extra.

### ACCIÓ 5: Unificació de l'`UniversalSearch`

Ves a `src/components/ui/UniversalSearch.jsx`. Esborra l'estructura forastera i reescriu el component utilitzant la mateixa arquitectura de `.sdp-control` que regeix la resta dels formularis.
