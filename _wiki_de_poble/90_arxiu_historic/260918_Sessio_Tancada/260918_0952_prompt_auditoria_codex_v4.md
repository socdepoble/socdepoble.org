---
titol: "Prompt per a Codex/Astra: Auditoria Extrema V4 (Prova del Cotó Fluix)"
descripcio: "Petorreta final per a auditar la graella i UniversalWorkspace després d'haver resolt la cursa asíncrona V4 i l'enrutament d'IDs de Perfil."
autor: "IAIA MarIA"
data_creacio: "2026-09-18"
estat: "esborrany"
tags:
  - prompt
  - consell
  - auditoria
---
# Prompt per a Auditoria Extrema V4 (Prova del Cotó Fluix)

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. L'arquitectura és sagrada.]

Hola. Sóc el Mestre i vinc amb la IAIA MarIA. En l'última auditoria ens vau donar un 7/10 i vau traure a la llum defectes estructurals molt fins i subtils. Gràcies a açò, hem pogut blindar el codi. Hem aplicat absolutament totes les correccions.

Ací tens el que hem solucionat a fons:

1. **(P1) Contracte d'onCreate i IDs Compostos:** Ara `creaOrg` a `PerfilShell.jsx` retorna exactament l'ID que el workspace espera (`org_id-dades_basiques`), evitant que `requestItem` penge l'estat asíncron esperant un ID base que mai arribarà.
2. **(P1) Col·lapse d'IDs de Carpetes/Categories:** Hem arreglat `UniversalWorkspace.jsx` perquè passe tot l'objecte `category` (amb `groupId`, `kind`, etc.) a `onCreate`, no només l'ID pla. Així, el consumidor pot prendre decisions precises.
3. **(P1) Cursa Asíncrona (A -> B -> A):** Hem substituït el ref de la categoria actual per un contador monotònic (`createGenerationRef`). Ara qualsevol desviació (fins i tot tornar a la categoria inicial mentre carregava) invalida correctament l'operació asíncrona. 
4. **(P2) Efectes Laterals en Actualitzadors:** A `AppGridShell.jsx` hem purificat el `setColumnWidths` i el `setMida`. La persistència a `localStorage` ara s'executa com a un side-effect segur i no contamina el cicle de React.
5. **(P2) Prop drilling de Focus:** Hem canviat l'`expandBtnRef` pel `collapseBtnRef` al lloc correcte d'`AppGridColumn.jsx`.
6. **(P2) Errors Ocults (Stale Data):** Hem canviat l'ordre a la llista d'`UniversalWorkspace.jsx` perquè prioritze `status === 'loading'` o `status === 'error'` inclús quan hi ha `filteredItems.length > 0`.

## La teua Nova Missió: El 10/10 Definitiu

Estem a les portes de la integració final amb l'adaptador de dades de Sollutia.
Vull que busques qualsevol defecte residual:
1. Queda alguna fuga de memòria, condició de carrera o defecte d'accessibilitat greu?
2. La frontera de l'adaptador (dades locals vs universals) és 100% sòlida?

Dona'm un veredicte. Si és un 10/10 tècnic, començarem amb el disseny visual. No modifiques ni escrigues cap fitxer, només vull l'anàlisi.
