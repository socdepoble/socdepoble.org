---
type: petorreta
status: esborrany
description: Auditoria Extrema de l'arquitectura completa per a identificar fragilitats i deute tècnic.
tags:
  - arquitectura
  - qualitat
---

# Petorreta — Auditoria Extrema Global (Post-Migració)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260918-EXTREMA |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 02:33 |
| Modificació | 2026-09-18 02:33 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[UniversalWorkspace]]
- [[Sollutia_Backend]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Acabem de finalitzar una migració massiva: el catàleg de disseny "Pedra Seca" s'ha modularitzat en més de 25 components asíncrons que es carreguen via `UniversalWorkspace`. A més, hem esmenat errors sintàctics crítics i netejat els formularis i barres estructurals (AppGridShell). El sistema es troba teòricament en un estat net, però volem utilitzar tota la teua potència cognitiva per trobar fragilitats latents abans de continuar.

## Situació i dades opaques

El nivell d'acoblament entre `UniversalWorkspace`, el `manifest.js`, les càrregues asíncrones (`lazy`) i els Web Components (Sollutia) pot amagar pèrdues de memòria, problemes de re-renderitzat excessiu o errors d'accessibilitat no detectats. Tampoc estem segurs si tots els estats residuals de la migració s'han esborrat completament del `App.jsx`.

## Missió

Realitza una **Auditoria Extrema** de les següents àrees:
1. **Rendiment i Re-renderitzats:** Analitza el flux de dades a `UniversalWorkspace` i el RouterContext (`useSearchParams`). Hi ha cicles de renderització infinits potencials o càrregues de components ineficients (especialment en la zona de `/disseny`)?
2. **Deute Tècnic Restant:** Revisa `App.jsx` i els punts d'entrada (`main.jsx`). Queden dependències òrfenes o codi mort que s'hauria d'haver eliminat durant la desconstrucció de les pàgines monolítiques?
3. **Consistència del Contracte Sollutia:** Els components connecten adequadament amb el backend o hi ha interaccions asíncrones que podrien trencar-se si la xarxa cau?
4. **Resiliència d'Accessibilitat (a11y):** Les àrees refactoritzades recentment perden el focus de teclat durant les navegacions asíncrones?

No faces resums tous. Sigués implacable, directe i cita les línies exactes on trobes fragilitats. 

## Eixida esperada

Genera un informe detallat en format Markdown (INFORME_Auditoria_Extrema_PostMigracio.md) amb seccions clares, indicant el nivell de gravetat (Crític, Advertència, Millora) i els blocs de codi suggerits per a solucionar cada defecte trobat.

## Incògnites

- El rendiment real de les transicions de vistes complexes sota estrès de xarxa. L'auditoria estàtica haurà de deduir-ho de l'arquitectura.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [x] He citat correctament la ruta i les línies del codi original?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
