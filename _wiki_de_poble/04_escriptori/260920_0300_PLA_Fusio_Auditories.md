---
type: document
status: acabat
description: Pla d'Implementació — Fusió d'Auditories (Claude + Codex)
tags:
  - pla
  - arquitectura
---

# Pla d'Implementació — Fusió d'Auditories (Claude + Codex)

Aquest pla consolida les troballes exactes de l'auditoria de Claude (codi llest per a aplicar) i les deduccions a partir de l'esbós d'informe de Codex.

## Open Questions

> [!IMPORTANT]
> **Mestre:** He extret tot el que he pogut del "pensament" de Codex, però com que ell no ens ha lliurat l'informe final amb el codi, he dissenyat jo mateix la solució matemàtica als problemes que ell va detectar (especialment al `backendPort.js`).
> 
> A més, he vist que Codex parlava de refactoritzar `matrix.mjs` i `reflex_plantilles.mjs` per unificar el *resolver*. Com que açò toca el cor de l'Efecte Matrix i no tenim el seu codi provat, et propose centrar-nos ara en les correccions segures (Consola, Preact, BackendPort) i demanar-los que facen el refactor profund de Matrix en la "Petorreta d'Auditoria Extrema" que et prepararé. Què et sembla?

## Proposed Changes

---

### [Claude] Neteja del Zombi Vite i Preact
- **Terminal:** Matar procés `68956` i esborrar `.vite`, `@preact`, `@prefresh` de `node_modules`.

#### [MODIFY] `src/components/PedraSeca/organismes/UniversalCard.test.jsx`
Canviarem l'import residual de `preact/test-utils` pel de React 18:
```javascript
import { render } from '@testing-library/react';
import { act } from 'react';
```

#### [MODIFY] `vite.config.js`
Actualitzarem el comentari fals (línies 34-38) que parlava d'un alies de Preact que ja no existeix.
Afegirem el plugin `consolaIaia()` a l'array de plugins.

---

### [Claude] Consola Termodinàmica

#### [NEW] `tooling/vite/consola-iaia.mjs`
El middleware *només-dev* que llig l'estat de l'eixam (consums, rebuts Matrix, inventari de skills, sistema immunitari) directament dels fitxers reals de `.agents/` i ho serveix a `/__iaia/consola.json`.

#### [NEW] `src/sections/consola/consolaContent.js`
La capa de dades que fa `fetch` al servidor de Vite i normalitza els rebuts, consums, crèdits i skills.

#### [NEW] `src/sections/consola/ConsolaSection.jsx`
La UI de la Consola construïda estretament amb la façana de Pedra Seca (`Taula`, `Boto`, `Pestanyes`, `Dialeg`, etc.).

#### [MODIFY] `src/css/components.css`
Injecció de les classes necessàries (`sdp-consola__capcal`, `sdp-consola__resum`, etc.) al `@layer components`.

#### [MODIFY] `src/app/App.jsx`
Ruta `<Route path="/consola" element={<RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>} />` carregada amb `lazy()`.

---

### [Codex] Correcció del `backendPort.js`

El diagnòstic de Codex era precís: `currentImpl` no es netejava entre inicialitzacions (sobreviuen capacitats antigues) i el bucle pujant cap al prototip pare sobreescrivia els mètodes del fill si tenien el mateix nom.

#### [MODIFY] `src/data/backendPort.js`
```javascript
export function setBackendImplementation(impl, force = false) {
  // ... validació ...
  currentImpl = {}; // NETEJA ACTIVA de mètodes residuals
  
  let obj = impl;
  while (obj && obj !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (CONTRACTE_BACKEND.includes(key)) {
        // NOMÉS guardem si el fill no ho ha definit ja (evita sobreescriptura del pare)
        if (currentImpl[key] === undefined) {
          if (typeof obj[key] === 'function') {
            currentImpl[key] = obj[key].bind(impl);
          } else {
            currentImpl[key] = obj[key];
          }
        }
      }
    }
    obj = Object.getPrototypeOf(obj);
  }
}
```

---

### [Codex] Anomalies detectades a reportar / posposar
- **Supabase Privacitat (SQL):** L'RLS dels adjunts privats deixa llegir a tothom del poble. Això s'ha de solucionar modificant SQL i provant-ho a staging. Propose incloure'l a la nova Petorreta.
- **Hook d'arrancada vs Reflex:** `.agents/hooks/preflight_matrix_wrapper.mjs` executa `reflex_plantilles.mjs` però l'informa com a Matrix. L'unificarem en la pròxima macro-refactorització de la mà d'una IA més fresca.

## Verification Plan
1. `npm run dev` i verificar que `localhost:3340/src/main.jsx` no conté `preact`.
2. Visitar `/consola` en local com a superadmin i comprovar que renderitza els rebuts Matrix sense error.
3. Passar les portes `npm run porta:classes` i `npm run test` per assegurar que el disseny i UniversalCard no s'han trencat.
4. Llençar petició simple que carregue el Backend per verificar que no salta cap error de mètode indefinit a `backendPort.js`.
