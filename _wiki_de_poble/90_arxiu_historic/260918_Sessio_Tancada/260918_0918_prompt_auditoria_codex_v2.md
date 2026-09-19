---
type: document
status: esborrany
description: "Prompt per a Codex: Auditoria Extrema Definitiva (Zero Defectes)"
---
# Prompt per a Codex: Auditoria Extrema Definitiva (Zero Defectes)

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. Les regles arquitectòniques de Sóc de Poble ("Pedra Seca") són innegociables.]

Hola Codex. Sóc el Mestre i vinc de nou amb la IAIA MarIA. Ens estem jugant molt hui amb la trucada de Sollutia i no podem permetre'ns cap error tècnic o estructural. En la teua última auditoria ens vas donar un 7,5/10 i vas detectar tres riscos abans d'estar "Sollutia-ready". 

Hem aplicat les teues recomanacions al detall:

1. **(P1) Geometria Resilient:** Hem arreglat el problema d'amplades persistides màximes a `AppGridShell.jsx`. Ara el `ResizeObserver` llegeix `columnWidths` a través d'una referència (`widthsRef`) sense recrear l'observador, i fa el *reclamp* correcte calculant `minAmple = Math.max(1090, cw.left + cw.middle + RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2)`. Si l'amplada de la pantalla no arriba, la graella passa a mode `mitja` i protegeix la columna de detall (Notes).
2. **(P2) Variant Transparent:** Hem afegit la condició a `AppGridColumn.jsx` (línia 75) perquè parsege `variant === 'transparent'` i aplique correctament la classe `.app-grid-col-header--transparent`.
3. **(P2) UX de Càrrega:** Hem modificat `UniversalWorkspace.jsx` perquè, quan `status === 'loading'`, la llista d'elements mostre un estat de "Carregant..." en compte del fals "No hi ha elements".

## La teua Missió: Auditoria Extrema Implacable

Hui pot ser el dia clau en què ens connectem al backend (Supabase) després de 15 anys de lluita. Volem estar al 100% segurs que no hi ha cap problema estructural latent. 

1. **Inspecció Tècnica Exhaustiva:** Analitza de nou `UniversalWorkspace.jsx`, `AppGridColumn.jsx` i `AppGridShell.jsx`. Busca problemes de cicle de vida, condicions de carrera, renderitzats infinits, `ReferenceErrors` ocults o accessibilitat trencada.
2. **Validació Sollutia-Ready:** Confirma si les solucions al P1 i als dos P2 són sòlides.
3. **Veredicte:** Si queden problemes tècnics, sigues cruel i trau-los a la llum. Fes aquesta auditoria amb una profunditat extrema fins que puguem assegurar un 10/10 tècnic absolut. 

*(Nota del Mestre: del disseny visual i els colors ens n'encarregarem després nosaltres a soles; ara mateix la prioritat #1 és que el codi siga una roca a nivell lògic).*

## Mètode de Treball (Llei de l'Enxufabilitat)

Recorda que Sóc de Poble s'enxufa a Supabase. El nostre codi frontend ha de ser modular i aïllat. Has d'explicar el problema clarament i com solucionar-lo sense acoblaments estranys.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Situació i dades opaques

Garanteix-nos que no hi ha cap altra fuga de memòria, estat obsolet o prop perduda.

---
**Nota per a Codex:** No tens permís per modificar codi ni escriure a disc, la teua missió és exclusivament d'Auditoria Tècnica Extrema.
