---
tipus: document
estat: esborrany
description: "🛡️ RESPOSTA DEL CONSELL: AUDITORIA I CALENDARI"
---
# 🛡️ RESPOSTA DEL CONSELL: AUDITORIA I CALENDARI

## 1. Auditoria Visual de la Pàgina de Disseny ("Pedra Seca")

Després de revisar l'arquitectura de la `DesignSection`, la `UniversalPage` i la `UniversalCard`, hem detectat inconsistències que trenquen la puresa del sistema "Pedra Seca" afegint nodes i classes innecessàries al DOM (classes "fantasma" o embolcalls redundants).

### Problema Principal: Doble `content-wrapper` a `DesignSection.jsx`

El component `UniversalPage` (a través de `PageFrame`) ja s'encarrega d'embolcallar els fills amb `<article className="content-wrapper">`. Això fa que qualsevol wrapper addicional al fill siga redundant i provoque regles CSS duplicades, padding trencat o l'aparició d'scrolling inesperat al mòbil.

A `src/sections/disseny/DesignSection.jsx`, estem fent això:

```javascript
      <nav className="sdp-cataleg-nav" aria-label="Pàgines del sistema de disseny">
        {/* ... */}
      </nav>
      <div className="content-wrapper"> {/* ❌ Embolcall redundant / fantasma */}
        {Pagina ? (
          <Suspense fallback={<Carregant etiqueta="Carregant la pàgina del catàleg…" />}>
            <Pagina />
          </Suspense>
        ) : <DesignSectionContent />}
      </div>
```

**Solució Exacta (Codi a corregir a `DesignSection.jsx`):**

S'ha d'eliminar el `div.content-wrapper` redundant i passar el contingut directament, ja siga lliure o utilitzant un fragment (`<>`) si fa falta agrupar-ho per a React. Així el DOM serà fidel a l'estructura de la `UniversalPage`.

```javascript
// Substitueix les línies 53-59 per això:
      {Pagina ? (
        <Suspense fallback={<Carregant etiqueta="Carregant la pàgina del catàleg…" />}>
          <Pagina />
        </Suspense>
      ) : (
        <DesignSectionContent />
      )}
```

---

## 2. Recomanació de Llibreria de Calendari per a React

Per tal de garantir que el sistema d'Agenda siga ultralleuger, respecte al 100% l'estètica de **Pedra Seca** (design tokens) i oferisca una experiència mòbil immillorable, la millor opció dins l'ecosistema lliure és:

### Opció Principal: `react-day-picker` (v8/v9)

**Per què és la millor opció per a Sóc de Poble:**
1. **Model "Headless" (Customització Total):** A diferència d'opcions com `react-big-calendar` que injecten tones de CSS inline o classes inflexibles, `react-day-picker` et permet reemplaçar gairebé qualsevol part del DOM. Pots assignar fàcilment les classes pròpies del sistema *Pedra Seca* (`.sp-card`, `.sp-button`, etc.) sense haver de lluitar contra estils predefinits.
2. **Accessibilitat (A11y) Nadiua:** La navegació per teclat, el suport de lectors de pantalla i els atributs ARIA (molt importants per a la IAIA MarIA i el Baseline) ja estan fets de fàbrica seguint les directrius WAI-ARIA.
3. **Molt Lleugera:** Està construïda sobre `date-fns`, una llibreria modular estàndard. Així evitem carregar monstruositats com `moment.js`.
4. **Pensada per a Mòbils:** El disseny de la graella de dies respon perfectament a gestos tàctils de CSS i es redimensiona sense problemes amb contenidors Flex/Grid moderns. L'experiència serà infinitament millor que incrustar un `iframe` de Google Calendar.

**Alternativa si vols zero-DOM imposat:** `@react-aria/calendar` (d'Adobe).
Si busqueu tindre un control encara més pur i no importar absolutament res de CSS, la implementació headless de *React Aria* us proporcionarà només els *hooks* de comportament matemàtic i d'accessibilitat (`useCalendar`, `useCalendarGrid`), deixant l'esquelet HTML al vostre lliure albir. És l'estàndard d'or de la puresa, tot i que demana escriure més codi inicial.

**Verdicte del Consell:** Trieu `react-day-picker` per iterar més ràpid amb un DOM net, o `@react-aria/calendar` si voleu una puresa estructural religiosa de Pedra Seca des del primer node.
