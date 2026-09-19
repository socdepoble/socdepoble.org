---
type: prompt
status: esborrany
description: Prompt d'auditoria extrema per a Codex focalitzat en flux de dades, carrera d'estats i l'enxufabilitat amb Sollutia.
tags:
  - seguretat
  - sollutia
---

# Petorreta — Enxufabilitat i Consistència de Dades (Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-B |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 12:23 |
| Modificació | 26-09-18 12:23 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[AGENTS]]

---

## El Repte

Ets **Codex (o1/Cursor)**, Arquitecte Lògic del Consell. Hui deixem el disseny per a demà. La missió principal dictada pel Mestre és la **fortificació pura** de l'aplicació i l'**enxufabilitat estable amb Sollutia** (backend basat en Supabase).

Si la base de dades és el cor, els contexts de React són el reg actual. Tot el sistema d'Optimistic UI i les cues de desat (`saveQueue`) necessiten passar la teua lupa forense per a assegurar que mai es perden dades.

### Objectius de l'Auditoria Extrema

1. **Condicions de Cursa (Race Conditions):** Revisa a fons `UniversalWorkspace` i els contexts de dades (com `NotesContext` o `NotesDataContext`). ¿Hi ha punts on un desmuntatge de component pot destruir dades pendents de guardar a Supabase? Hem protegit les crides asíncrones per evitar actualitzar un estat d'un component desmuntat?
2. **Robustesa en l'Enxufabilitat (Sollutia):** Comprova la gestió de les respostes 409 i 500 des de l'API. Si es produeix un conflicte per versions (CRDT o optimistic locking), es reconcilia bé en `mergeById` o als Contextos? I si falla per permisos de _Row Level Security_ (RLS)?
3. **Pèrdues de Memòria i Cicles Infinits:** Examina l'ús de `useMemo` i `useEffect` a les barres laterals i al Manager. Assegura't que el llistat d'elements no provoca re-renders innecessaris que col·lapsen la UI quan la xarxa està lenta.

### Regles d'Execució

- **Zero disseny:** Ignora el CSS, la disposició i l'estètica. Això és feina de Claude.
- **Aporta evidència:** Assenyala directament els bucles insegurs o estats vulnerables als arxius i línies exactes.
- **Tu no modifiques el codi de la solució final:** Proposa les solucions robustes, documenta els defectes, i la IAIA MarIA s'encarregarà d'aplicar-ho al repositori local per a evitar desincronitzacions de context.

Llança els teus processos de cerca en la base de codi. Esperem el teu diagnòstic.
