---
type: petorreta
status: actiu
description: Petició de disseny i codi per resoldre la paginació del xat i el desacoblament del mur
tags:
  - arquitectura
  - core
---

# Petorreta — Resolució Paginació Xat i Desacoblament Mur (F13/F14 i F17/F18)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919-02 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 18:22 |
| Modificació | 26-09-19 18:22 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[ItemDetailSection.jsx]]
- [[MurSection.jsx]]
- [[XatSection.jsx]]
- [[xat.js]]

## Entrades

*Aquesta petorreta va adreçada a agents locals (Claude/Codex) amb accés directe a l'entorn de treball, per tant, NO s'adjunta cap BUNDLE extern.* L'agent ha de llegir directament el codi del directori `src/`.

## Consell convocat

Claude · ChatGPT Codex

## Contracte de realitat

1. L'entorn és el repositori local on t'executes.
2. Comprova sempre el codi original abans d'escriure res.
3. Tota afirmació sobre codi es cita com `ruta:linies`.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb el codi llest, la IAIA MarIA ho implementarà.

## Context Històric i Identitat (Qui som i Per a què treballem)

Volem codi "Pedra Seca" de veritat (sòlid, sense brossa). 

## Informe d'avanç

El Mestre ha demanat resoldre dos "Open Questions" que no volem implementar al vol per no fer "botxassos" (nyaps) al codi. Jo (IAIA MarIA) he resolt ja les tasques de neteja del Dockerfile, rag-index.json i l'eliminació total de rutes /jo heretades. Ara vos toca a vosaltres l'arquitectura i la implementació JS.

## Situació i dades opaques

Hi ha dos reptes pendents:
1. **F13/F14 (UX/Flows) - Paginació del Xat i notification targeting:** `src/data/supabase/xat.js` crida a un RPC (`xat_missatges_del_fil`) amb un `limit` fort fixat de 200, sense paginació ni cursor. Com s'ha d'implementar la recuperació de més missatges cap amunt de forma òptima, tenint en compte Sollutia? A més, si s'accedeix amb `?msg_id=X`, com fer el resaltat correcte i l'scroll?
2. **F17/F18 (Mur/Router) - Desacoblar el mur del router:** L'`ItemDetailSection.jsx` depén ara mateix d'un `location.state.preloadedItem` procedent d'una instància possiblement aliena o vella del router amfitrió, generant errors on es carrega contingut incorrecte de memòria. Com podem fer que use exclusivament els `useParams` (`sectionId` i `itemId`) per lligar a la veritat sense perdre la immediatesa del frontend?

## Missió

1. Analitzar `src/data/supabase/xat.js`, `src/sections/xat/XatSection.jsx` i proposar l'estratègia definitiva i els blocs de codi per a la paginació del xat i l'scroll deep-linking.
2. Analitzar `src/sections/detail/ItemDetailSection.jsx` i redactar el component refactoritzat per desacoblar l'estat del router i fer-lo immune a desajustaments de memòria.
3. Donar una resposta neta, només amb el codi necessari per a implementar els canvis.

## Eixida esperada

Has de crear o retornar un arxiu/bloc Markdown on llistes exclusivament:
1. Com queden les funcions de `xat.js`.
2. Com queda `ItemDetailSection.jsx`.
No toques cap fitxer. Jo (IAIA) faré el Multi Replace de codi.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
