---
tipus: petorreta
estat: actiu
description: "Pla de xoc de Disseny (Pedra Seca) i Components Atòmics"
tags:
  - disseny
  - claude
  - ui-kit
---

# Petorreta — Direcció d'Art i Components Atòmics (Operació 24%)
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609162245 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 22:45 |
| Modificació | 2026-09-16 22:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | Claude |

## Missió i Context previ

**El perímetre de seguretat backend està assegurat:**
No cal que dediques tokens a revisar vulnerabilitats d'OAuth (PKCE) o polítiques RLS de base de dades. Eixes capes ja han sigut validades per la resta del Consell. Hui et cridem per a l'arquitectura de connexió superior (Front-end) i l'arquitectura visual. Et queda un 24% de quota de tokens, així que reparteix-los estratègicament entre l'enxufabilitat i el disseny visual.

**ATENCIÓ - PEGATS RECENTS (NO INCLOSOS AL BUNDLE):**
Tingues en compte que el Bundle que estàs analitzant està desactualitzat en els següents aspectes. Aquests errors **ja han estat arreglats hui mateix**, així que no cal que els reportes de nou:
1. S'ha pujat el timeout de `arrencaAutoTimer` a `src/host.js` de 100ms a **1000ms** per tolerar la latència de la injecció del plugin.
2. L'error de l'RLS del xat en `260916_2300_correccions_mur_i_xat.sql` (`with check (false)`) ja ha estat esmenat amb un `exists` perquè els creadors puguen afegir participants.
3. S'han **esborrat absolutament totes les mencions al CMS original/tradicional** en tot el codi (llevat d'aquest prompt) per evitar al·lucinacions de l'eixam; l'arquitectura està referenciada només com a "CMS amfitrió", "CMS extern" o "Sollutia".
Centrat exclusivament en el que queda trencat o millorable pel que fa a l'enxufabilitat de Sollutia i al disseny.

**El que volem de tu:**
1. **L'Enxufabilitat amb Sollutia (Prioritat Màxima):** Aquest és l'objectiu absolut. Volem que t'assegures que tota l'arquitectura del frontend i l'API de `host.js` siga impecable per rebre el backend de Sollutia. Tot i que els altres membres del Consell ja han fet la seua passada de seguretat i hem tancat els forats crítics, et demanem a tu, amb la teua visió macro, que garantisques que l'encaix (React vs Custom Elements, cicle de vida, gestió d'estat) no té fissures, problemes de rendiment o efectes secundaris indesitjats.
2. **Disseny Atòmic i Pedra Seca (Amb el 24% restant):** Amb el que et quede de quota (un 24%, esgota'l completament però no demanes més), vull que m'ajudes a perfilar i catalogar el nostre Sistema de Disseny (Pedra Seca). Necessite que establisques regles clares per als components atòmics (colors, distribucions, marges i ombres).
3. **El Bloc de Notes i l'Àrea de Gestió:** Si encara et queda espai mental, dóna'm pautes d'arquitectura visual per a crear formularis i llistats nets per al ciutadà en la part d'Identitats i el Bloc de Notes.

## Objectiu de l'Eixida (Fes-ho pas a pas)

Escriu-me el següent, usant format markdown:
- Un veredicte absolut sobre la robustesa de l'enxufabilitat i qualsevol millora arquitectònica necessària per a la integració amb Sollutia.
- Una proposta d'estructura per als components atòmics a `src/components/PedraSeca/`. Quins falten i quines variants haurien de tindre?
- Consells per optimitzar el disseny responsive (Flexbox vs Grid) dins de les classes genèriques.

Sigués directe, concís, quirúrgic. Esgota el 24% de tokens per a Pedra Seca justament, sense passar-te ni quedar-te curt. No demanes més context. Dóna'm només l'arquitectura (Sollutia + CSS) necessària.
