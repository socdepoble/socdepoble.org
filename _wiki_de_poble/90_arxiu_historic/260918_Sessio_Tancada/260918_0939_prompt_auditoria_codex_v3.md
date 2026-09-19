---
type: document
status: esborrany
description: "Prompt per a Codex: Auditoria Extrema V3 (Zero Defectes)"
---
# Prompt per a Codex: Auditoria Extrema V3 (Zero Defectes)

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. Les regles arquitectòniques de Sóc de Poble ("Pedra Seca") són innegociables.]

Hola Codex. Sóc el Mestre i vinc de nou amb la IAIA MarIA. En la teua última auditoria ens vas donar un 8/10 i vas traure a la llum diversos defectes molt perillosos per a la integració. Et donem les gràcies perquè ens acabes de salvar d'uns bons "fantasmes". Hem aplicat immediatament les teues correccions.

Ací tens el que hem solucionat:

1. **(P1) Memoització amb estat obsolet:** Hem eliminat completament l'ús innecessari del `useMemo` que embolicava l'arbre JSX de `WorkspaceFrame` a `UniversalWorkspace.jsx`. Ara l'estat i el `status` passen nets sense congelar-se.
2. **(P1) Cursa asíncrona de creació:** Hem afegit referències de muntatge (`mountedRef`) i de la categoria actual (`currentCategoryRef`) a `createAndSelect`. Si el component es desmunta o la categoria canvia mentre es crea la nota, la promesa s'ignora i no reescriu l'estat per accident.
3. **(P1) Errors de backend (props perdudes):** Ara `UniversalWorkspace.jsx` llegeix `status === 'error'` i renderitza adequadament `<p role="alert">Error de connexió.</p>`, solucionant l'efecte del buit fals.
4. **(P2) Robatori de Focus:** Hem esborrat l'efecte línia 444 que movia forçosament el focus davant de qualsevol reconciliació.
5. **(P2) Càrrega no accessible:** Ara quan està carregant s'empra el `role="status"` i el `aria-live="polite"`.
6. **(P2) Efectes Laterals:** La persistència a `localStorage` ja no s'executa dins de l'actualitzador del `setState`, sinó que és totalment pura. I el panell tancat s'avalua fora de la funció pura d'actualització.

## La teua Nova Missió: L'Auditoria del 10/10

Si abans estaves al 8/10, vull saber si ara ja estem al 10/10 tècnic.

1. **Inspecció:** Examina `UniversalWorkspace.jsx`, `AppGridColumn.jsx` i `AppGridShell.jsx` amb lupa. Queda alguna cursa asíncrona, memory leak, defecte lògic amagat o "prop drilling" corrupte?
2. **Sollutia-Ready:** Podem connectar l'adaptador de dades final de Sollutia a aquesta graella amb els ulls tancats?

*(Nota: d'errors residuals d'alineació visual, CSS i UX ja ens n'encarregarem més tard en el prompt de disseny. Ara vull el 10/10 de la lògica dura).*

Dona'm un veredicte implacable. No tens permís per escriure a disc ni modificar codi, només reportar si trobes el més mínim forat.
