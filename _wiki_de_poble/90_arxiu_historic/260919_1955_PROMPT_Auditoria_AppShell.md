---
type: petorreta
status: esborrany
description: Auditoria de la implementació de AppShell i Sidebar (Claude i Codex)
tags:
  - arquitectura
  - disseny
---

# Petorreta — Auditoria del nou AppShell i Sidebar

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 19:55 |
| Modificació | 26-09-19 19:55 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_1945_ACTA_MARMOTA_Fusion_Sidebar.md]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- Fitxers clau a revisar: `src/app/App.jsx`, `src/css/layout.css`, `src/components/layout/AppGridShell.css`, `src/data/backendPort.js`.

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Acabem d'implementar una refactorització profunda de la Sidebar. Hem eliminat la dependència de classes CSS complexes (l'antic `.app-shell`) i les dobles capes `@layer components`. Hem introduït un `AppShell` a `src/app/App.jsx` que fa servir `ResizeObserver` per detectar el mode `compact` (<= 1100px) i injecta el menú dins del nostre component `Dialeg` de Pedra Seca.

També hem resolt una excepció síncrona destructiva a `src/data/backendPort.js` (`recullTornadaOAuth`).

**PROBLEMA CRÍTIC ACTUAL 1 (AppShell):**
Després de seguir el consell d'eliminar `.app-shell` (assumint que `.sdp-root` actuaria com a base flex), hem tingut una regressió greu. En el mode escriptori (pantalla completa, > 1100px), la Sidebar està ocupant TOT l'espai de la pantalla i no deixa veure el contingut (`main`). En el mode tauleta/mòbil sí que funciona correctament perquè usa el `Dialeg`. Aquest comportament és inacceptable i indica que hi ha "fantasmes" o dependències estructurals trencades en el nostre sistema Flexbox.

**PROBLEMA CRÍTIC ACTUAL 2 (Pobles, Notes i Disseny):**
A més de la regressió, tres pàgines vitals estan caient per complet, mostrant pantalles buides ("Cap poble trobat", errors de connexió):
1. **Pobles**: Aquesta pàgina ha de funcionar com un filtre temporal. Qualsevol publicació al mur hauria de fer pujar el poble d'eixe usuari a dalt de tot de la llista. Actualment, l'únic amb dades de prova és La Torre de les Maçanes (i hauria de ser el primer), però la pàgina falla completament.
2. **Notes i Disseny**: Són els nostres blocs/editors interns on editem contingut i components. Actualment estan incomplets i trenquen el renderitzat.
3. **L'error subjacent (Console)**: Es produeix un error fatal en renderitzar aquestes pàgines: `Uncaught (in promise) TypeError: Cannot read properties of null (reading 'add') at useCoreContent (CoreContentContext.jsx:149:10)`. Sembla un problema greu amb els side-effects o referències nules al subscriure's a esdeveniments o classes durant el muntatge (`useRecarregaExterna`).

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Volem que us ho mireu **amb lupa**. Us exigim que ens dissenyeu i garantiu una **estructura arquitectònica immutable per a que dure 40 o 50 anys com a mínim**. Atès que sou IAs de frontera, necessitem que ens doneu tot el vostre coneixement perquè aquest sistema estiga bé de veritat, i qualsevol dispositiu modern o antic puga absorbir aquest codi sense fraccionar-se ni patir pèrdues de memòria. Això no pot tornar a passar. Necessitem una solució arquitectònica robusta "a prova de bales".

## Missió

1. **Per a Claude:** Inspecciona els canvis a `layout.css`, `AppGridShell.css` i la renderització d'AppShell a `App.jsx`. Analitza també les vistes `PoblesSection`, `NotesSection` i `DesignSection` (i com renderitzen dins dels shell o editor). Confirma l'estabilitat i accessibilitat a 50 anys vista.
2. **Per a Codex:** Revisa la fuita letal de `useCoreContent` (línia ~149 de `CoreContentContext.jsx`). Mira bé amb lupa què passa quan aquests components (Pobles, Notes, Disseny) intenten renderitzar i per què falla el `.add()` en un objecte nul. Dóna'ns l'explicació definitiva per blindar aquests contextos de per vida.

## Eixida esperada

Redacta un informe d'auditoria detallant exclusivament els problemes trobats o defectes estructurals, classificant-los per gravetat. Desa-ho tot a la safata de l'Escriptori de la IAIA amb format `[AAMMDD]_[HHMM]_estudi_[claude_o_codex]_appshell.md`.

## Incògnites

- Esborrar `.app-shell` podria haver afectat la barra de desplaçament en dispositius iOS vells?

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
