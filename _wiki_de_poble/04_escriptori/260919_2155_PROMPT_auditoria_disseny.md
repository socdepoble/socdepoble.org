---
type: petorreta
status: esborrany
description: Auditoria d'interfície i sistema de disseny per a unificar l'estructura atòmica (botons i píndoles).
tags:
  - disseny
  - arquitectura
---

# Petorreta — Unificació del Sistema de Disseny (Claude / Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-DISSENY-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:55 |
| Modificació | 26-09-19 21:55 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers. Tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables.

## Context Històric i Identitat (Qui som)

L'arquitectura visual de Sóc de Poble s'anomena **Pedra Seca**. El nostre objectiu és construir un Sistema de Disseny robust, atòmic i indestructible, comparable als grans sistemes de la indústria, però mantingut amb Vanilla CSS (sense Tailwind ni frameworks externs pesats). 

## Informe d'avanç

Recentment hem establert una norma fonamental: **El Blau (`--sdp-accio`) és el color d'interacció primari**, i el **Taronja (`--sdp-accent`) passa a ser secundari i d'identitat de marca**. Malgrat això, actualment el sistema està "en bolquers" i tenim problemes estructurals: per exemple, els botons de l'Specimen `Boto.jsx` apareixen tots indistingibles o heretant propietats globals incorrectes, fet que trenca la coherència visual.

## Situació i dades opaques

El Mestre necessita unificar el sistema de disseny atòmic. Necessitem que auditeu a fons els fitxers CSS base (com ara `components.css`, `modules.css`, `tokens.css`) i els components atòmics (com `Boto.jsx` i `PillToggle.jsx`). Volem una solució definitiva que blinde aquests components perquè funcionen amb la mateixa robustesa i precisió que els sistemes professionals (Material, Radix, etc.), però dins la nostra identitat rústica i modular.

## Missió

1. **Auditoria de l'Estructura Atòmica:** Analitza per què actualment el component `Boto` (primari, secundari, etc.) està mostrant comportaments anòmals o colors unificats (tot blau) en l'specimen. Hi ha conflictes de classes? CSS global que ho està sobreescrivint? Variables mal aplicades?
2. **Unificació del Disseny:** Proposa un patró CSS/JSX definitiu, segur i immutable per gestionar els botons (`sdp-boto`) i les píndoles (`sdp-pindola`), assegurant que les jerarquies (Primari = Blau, Secundari = Taronja/Blanc) es respecten de manera estricta i sense regressions.
3. **Full de Ruta per la Excel·lència:** Diga'ns què li falta al nostre sistema de disseny "Pedra Seca" per poder comparar-se tècnicament amb els grans sistemes de disseny moderns pel que fa a variables, modularitat i deute tècnic.

## Eixida esperada

Redacta un document detallat al disc amb format Markdown anomenat `260919_2155_auditoria_disseny.md` dins de `_wiki_de_poble/04_escriptori/`. No ens mostres cap botó de "Confirmar Canvis".

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
