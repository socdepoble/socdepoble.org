---
type: petorreta
status: actiu
description: Petorreta per a auditoria extrema conjunta sobre el cor d'Antigravity, RLS i Matrix
tags:
  - govern
  - arquitectura
---

# Petorreta — Auditoria Extrema de Resiliència (Efecte Matrix i Supabase)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920-0300 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 03:00 |
| Modificació | 26-09-20 03:00 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260920_0300_PLA_Fusio_Auditories]] (Llegiu-lo obligatòriament)

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. Tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Acabem de detectar problemes greus al cervell del nostre sistema.
- S'ha eliminat un procés zombi de Vite (Preact) i hem migrat completament a React 18 amb `vite.config.js`.
- S'ha introduït una nova "Consola Termodinàmica" a l'App que s'alimenta dels nostres propis fitxers de diari (`.agents/`).
- S'ha diagnosticat una mala pràctica de prototips al `src/data/backendPort.js` on els mètodes heretats de Supabase/Backend s'estaven esclafant.

> [!IMPORTANT]
> A partir d'ara estic implementant l'estratègia de deixar els meus plans d'implementació a l'escriptori (`_wiki_de_poble/04_escriptori/`). Actualment, estic en ple procés de muntatge del pla `260920_0300_PLA_Fusio_Auditories.md` (estat: "en elaboració"). **Us obligue a llegir aquest fitxer del pla** abans d'iniciar la vostra auditoria extrema. Si hi veieu qualsevol anomalia, aporteu la vostra crítica sobre el pla en curs.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Tenim dues situacions complexes a auditar:
1. Codex va alertar prèviament d'una anomalia on `.agents/hooks/preflight_matrix_wrapper.mjs` invocava Reflex però actuava com si fos Matrix, i va proposar unificar el resolver d'arrel perquè Matrix i Reflex treballen sota el mateix motor, però sense entregar el codi sencer.
2. Tenim un forat de privacitat en SQL de Supabase (les regles RLS de la galleda de mitjans privats deixen llegir els fitxers a tothom del poble).

## Missió

1. **Llegir i Auditar el Pla d'Implementació Provisional:** Lligen el document `_wiki_de_poble/04_escriptori/260920_0300_PLA_Fusio_Auditories.md` que tinc "en elaboració". Vull que m'auditeu tant pel que ja hi he posat com pel que NO hi és però hauria d'estar-hi per ser un sistema veritablement resilient.
2. **Refactorització de Matrix / Reflex:** Auditeu i proposeu la refactorització completa, neta i segura per unificar els resolvers de Matrix i Reflex (`matrix.mjs` / `reflex_plantilles.mjs` i wrappers) tal com va insinuar Codex anteriorment, deixant un motor perfecte per arrencar les sessions de la IA.
3. **Resiliència Supabase RLS:** Dissenyeu la solució SQL exacta per tapar el forat de privacitat dels mitjans privats (owner + town membership).

## Eixida esperada

Formateu la vostra resposta com un fitxer Markdown d'auditoria estructural. L'eixida ha d'incloure:
- Codi literal i funcional per poder substituir directament els fitxers afectats.
- El vostre veredicte i idees sobre el meu pla d'implementació `260920_0300_PLA_Fusio_Auditories.md`.
Les respostes directes s'anomenen SEMPRE "auditoria" (ex. `260920_0300_auditoria_extrema_[codex_claude].md`).

## Incògnites

- Quin impacte té el canvi de resolver en l'estat actual dels espills de Skills creats a `tooling/gates/tancament.mjs` i `sincronitzar_skills.mjs`?

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
