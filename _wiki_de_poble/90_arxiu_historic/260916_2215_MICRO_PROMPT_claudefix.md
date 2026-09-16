---
tipus: petorreta
estat: actiu
description: Instruccions per a Claude per a resoldre els C1-C4 i P0 (Embeds, OAuth, Singleton, Fallback Híbrid)
tags:
  - seguretat
  - sollutia
  - arquitectura
---

# Petorreta — Resolució d'Auditoria Extrema Sollutia (C1-C4 i P0)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609162215 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 22:15 |
| Modificació | 2026-09-16 22:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-16 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]

## 🎯 Ordres per a Claude (Destrossa i Enxufabilitat)

Som la IAIA MarIA i el Mestre Javi. Ja has vist el teu propi informe devastador (C1-C4) i el dels teus companys (P0-2, S1-S2). Totes estes vulnerabilitats ens impedeixen obrir la integració amb Sollutia de forma segura.

Hem utilitzat pràcticament tota la bossa de context diari. Per això he destil·lat els fitxers afectats directament en aquest Micro-Bundle, lliure de tot soroll extern. Necessitem que **aprofites la teua potència estructural**, destrosses les ineficiències i **ens dones el codi de reemplaçament exacte per enxufar la solució**:

### 1. Suplantació del Mur (C1)
A `src/data/mapejadorSeccions.js` i els scripts SQL. Qualsevol pot suplantar posts oficials per culpa del comportament d'inserció i de `mergeById`.
**Requisit**: Dóna'm l'script SQL idempotent per afegir el `check (payload->>'id' = id::text)`, el control de trigger a `created_at` i les proteccions a la taula. Reescriu `mapejadorSeccions.js` o `content.js` per a no trepitjar contingut oficial.

### 2. Xat Obert (C2)
A `260908_xat_v2_correccions.sql` i `xat_participants`.
**Requisit**: Fes l'script de revocació per a `authenticated` i re-protegeix la taula `xat_participants` perquè només el creador puga convidar.

### 3. El Fallback Híbrid Perillós (C4, P0-2) i la Sessió
A `src/host.js` i `identitat.js`.
**Requisit**: L'amfitrió omplia funcions amb Supabase. Destroça eixa dependència i fes que la injecció de `arrenca()` siga **TOT O RES** (fail-closed). A més, `adoptaSessioExterna()` ha de cridar al backend per validar la firma del JWT, i `injectaSessio()` només es pot cridar abans del segellat.

### 4. La Frontera OAuth i el PKCE (C3)
A `public/auth/callback.html` i `oauthRelay.js`.
**Requisit**: Resol el robatori del fragment de PKCE per JS de tercers. Mou la lògica PKCE de retorn, i treu localhost de producció.

### 5. Singleton i Atributs HTML (S2, P0-4)
A `src/PedraSecaEmbed.jsx`.
**Requisit**: Evita que `connectedCallback` mate altres instàncies. I no llisques més d'atributs lliures (`supabase-url`, `anon-key`). Només la API JS (injetada per Sollutia) els podrà declarar.

### 6. L'Informe "Enxufable" per a Sollutia
A l'últim bloc, redacta un breu **INFORME PER A SOLLUTIA**. Ha d'explicar als seus enginyers com s'ha tancat l'arquitectura i què han de fer exactament ells al seu JavaScript per **configurar()** i incrustar el Web Component amb seguretat.

Ens juguem la vida de l'arquitectura. Dona'm el codi i lidera'ns fora d'este deute tècnic.
