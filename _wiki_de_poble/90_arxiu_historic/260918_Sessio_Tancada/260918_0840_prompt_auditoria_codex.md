---
type: document
status: esborrany
description: "Prompt per a Codex: Auditoria Extrema Final (Sollutia-Ready)"
---
# Prompt per a Codex: Auditoria Extrema Final (Sollutia-Ready)

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. Les regles arquitectòniques de Sóc de Poble ("Pedra Seca") són innegociables.]

Hola Codex. Sóc el Mestre i vinc amb la IAIA MarIA. Hui és un dia molt important perquè Sollutia (la nostra agència de backend) podria connectar-se per a fer les primeres proves d'integració amb Supabase de la nostra `UniversalWorkspace`. No volem passar vergonya ni mostrar-los una UI fràgil o trencada.

Hem estat treballant dur i hem implementat una sèrie de correccions visuals crítiques sobre l'`AppGridShell` i `UniversalWorkspace`:
1. **Capçaleres de columna unificades:** Hem canviat l'espaiat blanc del resizer a transparent perquè la capçalera fosca es veja com una barra contínua (com demanava el disseny original).
2. **Botons de replegament:** Hem restaurat correctament els botons de replegament de les columnes (`onReplega`), eliminant els "chevrons" d'acordió que eixien on no tocava.
3. **Contrast i Color:** Hem assegurat que les capçaleres superiors ("CARPETES" i "NOTES") tenen el fons fosc correcte (`variant="dark"`), mentre que les sub-capçaleres d'accions ("Tot" i lupa) utilitzen el gris suau predeterminat per a donar el contrast correcte.
4. **Fantasmes eliminats:** Hem fet transparent el fons dels botons d'eines (format de text) a `.editor-toolbar` per eliminar l'efecte "fantasma" de fons blanc sobre blanc.
5. **Errors d'abast corregits:** El `model` ja es passa correctament als components i els estats d'acordió viuen on toca.

## La teua Missió

1. **Auditoria Estructural:** Revisa el codi de `UniversalWorkspace.jsx`, `AppGridColumn.jsx` i `AppGridShell.css` / `modules.css` assegurant-te que no queden "forats", ni lògics ni d'estils.
2. **Verificació Sollutia-Ready:** Confirma que el muntatge de React és robust, els props es passen bé (no hi ha més `ReferenceError`), i la geometria de graella és fiable per a consumir dades reals de Supabase.
3. **Puntuació:** Si tot està bé, dóna'ns la teua valoració objectiva i sincera per saber si estem llests (esperem el 10/10!).

## Mètode de Treball (Llei de l'Enxufabilitat)

Si trobes qualsevol avaria, recorda que Sóc de Poble s'enxufa a Supabase. El nostre codi frontend ha de ser modular i aïllat.
- Has d'explicar el problema clarament i com solucionar-lo sense acoblaments estranys.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Situació i dades opaques

Necessitem que ens confirmes si hi ha alguna interacció amagada o "prop drilling" excessiu que se'ns haja passat per alt entre la graella i els elements de la UI.

---
**Nota per a Codex:** No tens permís per modificar codi ni escriure a disc, la teua missió és exclusivament d'Auditoria Extrema i Lògica.
