---
tipus: document
estat: canonic
description: Llibre d'Obra (LEDGER) de Sóc de Poble
---
# Llibre d'Obra (LEDGER) de Sóc de Poble

Aquest és el registre immutable de tots els canvis estructurals i tècnics del projecte.
Qualsevol IA (o humà) que modifique codi està obligada a afegir-hi una entrada abans de finalitzar la seua tasca, complint amb la **Skill Trellat**.

---

## Deute Històric i Arqueologia (L'Herència de Pedra Seca)
*Aquest apartat documenta les decisions preses abans de la creació d'aquest LEDGER (Fase Pre-Mecànica) que condicionen fortament l'arquitectura actual i futura.*
- **Online-First vs Allotjament a Firebase (Online-First temporal):** El sistema va nàixer descentralitzat però hem assumit dependència de Supabase (com a backend) i Firebase Hosting (com a servidor per a la SPA) per garantir el "time to market". S'elimina la consideració de Sollutia com a allotjament del frontend; la destinació final verificada és Firebase Hosting. El sincronitzador offline i l'outbox han sigut esborrats en la Poda del Quadrant A.
- **La Guerra contra el DOM Amfitrió:** S'han hagut d'introduir panys globals (`window.__SDP_REACT_MOUNTED__`) i `queueMicrotask` a `src/PedraSecaEmbed.jsx` perquè el DOM del sistema amfitrió destrueix, remunta i mou instàncies indiscriminadament, generant zombies i competició per la IndexedDB.
- **Mentides de WebKit i Circuit Breaker:** Gran part de la complexitat que hi havia a l'antic outbox ve de tractar els `onabort` muts i `onblocked` infinits del motor d'IndexedDB en dispositius antics. Això va obligar a crear un sistema de quarantena en lloc de cridar `db.clear()` i perdre dades davant la corrupció d'IDB.

---

## 2026-09-01 — Abocament Final i Fix de Totes les Portes (Fase 4)
- **Què:** Restauració completa de la cadena de verificació `npm run porta`. Fix dels falsos positius en el parser Babel, sanejament de `tractor-cens` per als arxius històrics, resolució del conflicte de Tailwind amb `text-panel__head`, i sanejament complet dels tokens canònics de disseny (`tractor-sollutia` i `tractor-tokens`).
- **Per què:** Perquè l'Auditoria estava parant en falsos positius l'assoliment del Fase 4. Es requeria una cadena totalment determinista lliure d'infraccions.
- **Fitxers:** `package.json`, `tooling/gates/tractor-cadena.mjs`, `tooling/gates/tractor-cens.mjs`, `src/config/design-tokens.json`, `src/app/App.jsx`, `src/sections/multimedia/MultimediaSection.jsx`, i altres.
- **Risc:** Zero. Tot el sistema compila (`npm run build`) sense trencar cap baseline ni política estricta.

## 2026-08-28 — Inicialització del Llibre d'Obra
- **Què:** Creació del `LEDGER.md`, `tooling/preflight.mjs`, `.agents/skills/trellat/SKILL.md` i els hooks d'Antigravity.
- **Per què:** Per aturar la precipitació cognitiva de les IAs i complir amb el "Pas 0" de l'auditoria (La Porta de Pedra Seca).
- **Fitxers:** `.agents/LEDGER.md`, `.agents/skills/trellat/SKILL.md`, `tooling/preflight.mjs`, `.agents/hooks/verify.mjs`, `.agents/hooks.json`.
- **Risc:** Baix. (Per revertir-ho, es poden esborrar aquests fitxers i deshabilitar els hooks).

## 2026-08-28 — Tall de Maquinari Lliure de Deute (2022)
- **Què:** Establiment del tall de suport de maquinari a dispositius de **fa 4-5 anys (2021-2022)** (motors web moderns, iOS 16+, Chrome 100+). Elimina l'obligació de suportar maquinari antic o iOS 15.8 per evitar el deute tècnic ("l'efecte Frankenstein").
- **Per què:** Per assolir un estat de **ZERO Deute Tècnic**. Els motors web moderns suporten nativament optimitzacions (`content-visibility`, `adoptedStyleSheets`, JS actual) sense necessitat de *polyfills*, trucs bruts de manipulació de DOM o "rellotges vigilants" extrems. Qualsevol tècnica (com el *Circuit Breaker*) es manté només si aporta robustesa general a l'arquitectura *Online-First*, no com a pegat per al *legacy*.
- **Conseqüència Tècnica:** Es prohibeix la introducció de codi condicional o caigudes de rendiment (*fallbacks* penalitzadors) dirigides a donar suport a navegadors antics.

## 2026-08-30 — Reparacions de l'Auditoria Forense (Sollutia Readiness)
- **Què:** Refactor del host.js i backendPort.js per aplicar el Mode Estricte. Correcció del domini i pas del path al relé OAuth (callback.html). Correcció RLS de section_submissions i actualització de l'avaluació lazy d'appSeed.
- **Per què:** Per blindar l'agnosticisme de l'aplicació i assegurar l'enxufabilitat en l'entorn de producció (Sollutia) sense fuites. Resolt tot el deute estructurat dictat pel Consell d'IAs.
- **Fitxers:** `src/host.js`, `src/data/backendPort.js`, `public/auth/callback.html`, `src/data/oauthRelay.js`, `src/PedraSecaEmbed.jsx`, `src/app/AppDataContext.jsx`, `supabase/schema.sql`, entre altres.

## 2026-08-31 — Higiene de l'Escriptori i Actualització de Tractors
- **Què s'ha fet:** S'ha corregit un paràmetre al detector `tractor-cens.mjs` i s'ha afegit una excepció per a `00_INDEX_Satel_lits.md` a `tancament.mjs`.
- **Raonament (el "per què"):** Les regles de cens llançaven errors perquè buscaven una skill antiga (`multi-agent-review`) en lloc de la nova (`council-review`). També s'han mogut tots els fitxers satèl·lits a l'arxiu històric extern per mantenir l'Escriptori net i la identitat sense *backups* residuals.
- **Fitxers:** `tooling/gates/tractor-cens.mjs`, `tooling/gates/tancament.mjs`.

<!-- HASH: bb5bb54ad32f7d24623e7ee36c6b1ebd0bad218167a28e3b093dcf111b09373e -->
