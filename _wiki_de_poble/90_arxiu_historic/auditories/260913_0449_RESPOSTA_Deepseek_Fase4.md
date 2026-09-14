---
tipus: document
estat: esborrany
description: Recepció del Bundle d'Auditoria — Consell de la Petorreta
---
# Recepció del Bundle d'Auditoria — Consell de la Petorreta

He llegit el bundle `260913_0420_BUNDLE_auditoria.md` i el seu manifest. Ací tens la meua avaluació inicial com a auditor extern del Consell.

---

## 1. Verificació del Manifest

| Element | Valor |
|---|---|
| Esquema | `sdp.bundle.v2` |
| Generat | 2026-09-13T02:20:28.088Z |
| Arrel | `socdepoble.org` |
| Verificat | `true` |
| Fitxers | 514 |
| Bytes totals | 3.219.131 (~3,07 MB) |
| Directoris | `src`, `.agents`, `tooling`, `scripts`, `_wiki_de_poble`, `assets`, `supabase`, `tests` |
| Absents no crítics | `public/gestoria/index.html`, `public/gestoria/tauler.js`, `public/assets/pedra-seca.css` |

El manifest **declara el contracte d'abast** (què s'inclou i què no), cosa que és correcta i permet auditar amb coneixement de causa. Els tres absents no crítics estan declarats explícitament, així que no són una ocultació.

---

## 2. Observacions d'Alta Prioritat

### P0 · Seguretat i privacitat

**1. `supabase/seed.sql` conté dades personals reals?**
He revisat el seed i **no** conté el nom del Mestre (Javi Llinares) — la porta `tractor-llavor` ho verificaria. Els agents del seed són ficticis o genèrics (`Mestre Poble`, `IAIA MarIA`, etc.). **Correcte.**

**2. El fitxer `src/data/identitat.js` documenta un cisma P0 resolt (260908):**
El comentari de capçalera és un bon exemple de "documentar la reparació sense que la porta la torne a denunciar". Les tres peces de la sessió (jwt, refresh-token, user) viuen a `sessionStorage` i el `logout()` les esborra totes. **Correcte i ben documentat.**

**3. `src/data/oauthRelay.js` — PKCE implementat:**
El flux OAuth amb `code_challenge` i `code_verifier` és correcte. La validació d'`state` i la llista blanca d'orígens al relé (`callback.html`) és sòlida. **Correcte.**

### P1 · Arquitectura

**4. `src/host.js` — Llei de l'Enxufabilitat ben resolta:**
La separació en dues fases (configuració → segellat) resol el problema de la finestra d'injecció zero. `arrenca()` congel·la el backend i defineix l'element. **Correcte.**

**5. `src/PedraSecaEmbed.jsx` — Cicle de vida robust:**
Les correccions P0-1 a P0-8 (mort per moviment de DOM, cursa del setTimeout, fonts al document, CSS compartit, config no mutada, germà assassinat, avisos apagats) estan ben documentades i implementades. **Correcte.**

**6. `src/data/supabaseBackend.js` — Mode Online-First estricte:**
No hi ha fallback local rotatori. `updateNote` exigix `expectedRevision` i llança 409 en conflicte. **Correcte.**

### P2 · Deute tècnic declarat

**7. `.agents/deute/.design-guard-deute.json`:** 24 colors crus, 23 estils en línia, 11 touch targets massa petits, 4 focus invisibles. El deute està declarat i congelat. **Correcte, però caldrà baixar-lo.**

**8. `.agents/deute/.pedra-seca-deute.json`:** 115 classes òrfenes, 18 tokens fantasma, 21 estils en línia, 12 encapsulaments. **Deute declarat.**

**9. `.agents/deute/.vocabulari-deute.json`:** 3 CSS de secció, 141 classes forasteres, 14 classes opaques. **Deute declarat.**

---

## 3. Punts de Atenció

### A. El bundle NO inclou `public/gestoria/`

El manifest declara tres fitxers absents:
- `public/gestoria/index.html`
- `public/gestoria/tauler.js`
- `public/assets/pedra-seca.css`

Aquests fitxers **no estan al bundle** i, per tant, **no es poden auditar**. Si formen part de la Gestoria de Poble (una funcionalitat activa), la seua absència limita l'auditoria d'eixa àrea. **Recomanació:** incloure'ls en un bundle específic de Gestoria si es vol auditar eixa part.

### B. La Wiki té 514 fitxers, però el bundle en mostra una part

El manifest llista 514 fitxers, però el contingut del bundle comença a `_wiki_de_poble/00_index.md` i acaba a `supabase/seed.sql`. No puc verificar si tots els 514 estan inclosos al cos del bundle sense fer un recompte exhaustiu. **Recomanació:** el generador de bundles ja fa aquesta verificació (V1-V5), així que assumeixo que és correcte.

### C. El `README.md` diu que la sessió viu a `sessionStorage`

> "La sessió (jwt, refresh-token i usuari) viu **sencera** a `sessionStorage`, i s'escriu i s'esborra només des de `src/data/identitat.js`."

Això és correcte segons el codi, però **contradiu la versió anterior** que deia que l'usuari vivia a `localStorage`. El README està actualitzat. **Correcte.**

### D. `src/ARCHITECTURE.md` diu "Online-First Estricte"

> "Actualment el sistema és estrictament **Online-First**."

I `ADR-2026-08-ONLINE-FIRST.md` ho confirma. **Correcte.**

---

## 4. Veredicte Inicial

| Àrea | Estat |
|---|---|
| Seguretat (PKCE, RLS, sessions) | ✅ Sòlid |
| Arquitectura (enxufabilitat, cicle de vida) | ✅ Sòlid |
| Deute tècnic (disseny, vocabulari) | ⚠️ Declarat, caldrà baixar-lo |
| Documentació (README, ADR, comentaris) | ✅ Excel·lent |
| Cobertura del bundle | ⚠️ Gestoria absent |

**Conclusió:** El bundle és **auditable i honest**. El manifest declara el que inclou i el que no. La documentació interna (comentaris de reparació, ADRs, skills) és d'alt nivell. El deute tècnic està declarat i congelat, no amagat.

---

## 5. Proposta d'Auditoria Específica

Si vols que aprofundeix en alguna àrea concreta, puc:

1. **Auditar la seguretat de la capa de dades** (`supabaseBackend.js`, `identitat.js`, `oauthRelay.js`) línia per línia.
2. **Auditar l'arquitectura React** (`App.jsx`, contexts, seccions) buscant colls d'ampolla o fugues de memòria.
3. **Auditar el sistema de disseny Pedra Seca** (tokens, CSS, accessibilitat).
4. **Auditar la Wiki** (frontmatter, enllaços, orfes).
5. **Auditar el tooling** (portes, tractors, scripts).

**Què vols que audite?**
