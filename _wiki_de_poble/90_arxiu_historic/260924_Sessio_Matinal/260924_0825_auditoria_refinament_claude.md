---
type: informe
status: esborrany
description: Pedaços copiables per a la roda i els grisos de Notes i per a la roda del crom, reparació de l'índex de l'Escriptori i incidència greu de la petorreta 0800.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f:8f995895-86a7-4ede-a5ad-5f04f022b293
---
# Refinament de Notes, roda del crom i governança documental

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f:8f995895-86a7-4ede-a5ad-5f04f022b293 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T06:26:10.310Z |
| Modificació | 2026-09-24T06:26:10.310Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | `auditoria` |
| Torn | `torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f` · abast `documents` · obert 06:25:04Z |
| Petorreta origen | `260924_0800_prompt_refinament_opus.md` (sense rebut: vegeu §0) |
| Lectures prèvies (Olivera) | `260924_0754_auditoria_claude.md` sencera. De l'arxiu, només les capçaleres de 0630, 0645, 0652, 0711, 0716, 0717 (auditoria i annex), 0720 i 0722 i dels quatre documents de Fable, per a localitzar-los; no hi ha cap pla actiu a l'Escriptori |
| Tall d'evidència | HEAD `5eee1293`, arbre brut. `src/css/layout.css` ja estava modificat abans del torn (dos `#ffffff`, vegeu F-A) |
| Mode AFK | **sí per al codi**: cap fitxer de `src/`, `tests/`, `tooling/` ni `.agents/` tocat. L'únic canvi fora d'este document és la reparació d'àncores de `00_index_escriptori.md` (tasca 1 de la petorreta) |
| requires_human_decision | **true**: R3 (què fa la roda mentre no hi haja gestor), R4 i R5 (lectura conjunta dels dos encàrrecs de to), G3 (estat de la skill i quina versió s'instal·la), F-A |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`). S'ha demanat Ultracode: `hooks-local.mjs:85` ha denegat el `Workflow` i també el navegador integrat. Tot s'ha fet en solitari |
| Tokens consumits | Mesurats: l'entorn no els exposa. Estimats: no n'invente cap xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

He llegit sencera la plantilla que ha retornat `document.mjs context --route auditoria` abans de crear res, i he seguit el contracte d'informe: cada troballa porta fitxer, evidència, severitat, font de veritat, proposta conservadora i decisió humana quan cal. També he llegit sencera la plantilla canònica de la petorreta (`_wiki_de_poble/03_actuar/plantilles/prompt_local.md`) per a poder contrastar-hi la 0800.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T06:26:10.310Z: esborrany creat pel circuit (`obrir_torn`, `context`, `create`).
- Mateix torn, abans del `create`: àncores de `00_index_escriptori.md` reparades (G1). Després del `create`, l'àncora d'este document s'ha mogut a «Activitat en curs».
- Redacció d'este informe en una sola escriptura: `porta-reflex` valida el document sencer a cada escriptura. L'hora exacta de redacció no la sé: l'entorn no deixa executar `date`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0 · Incidència Greu d'Incompliment de Protocol de Petorreta (0800)

La petorreta mana que, si està incompleta, s'anote esta incidència. Ho està, i ho dic amb evidència de disc:

| # | Què | Evidència | Font de veritat |
| --- | --- | --- | --- |
| 1 | La casella «Pla d'Implementació escrit i desat» està marcada i és falsa | No existix `260924_0800_pla_implementacio_refinament_opus.md`. `porta-olivera --informe`: «❌ Cap Pla d'Implementació de hui» | Plantilla `prompt_local.md` §0; lliçó 260922 «Nomenclatura exacta del Pla» |
| 2 | La casella «Rebut obtingut» està sense marcar, i la petorreta ha eixit igualment | `porta-documents`: «reflex: cal un rebut persistent emés per document.mjs context». La secció 0 mateixa diu «Marca les tres caselles o para» | AGENTS §0 (Regla 0); `wiki-documentacio-i-reflex` §1 |
| 3 | Tres etiquetes fora del vocabulari | `porta-documents`: `tags[1]`, `tags[2]` i `tags[3]` fora de l'enum (`refinament`, `ui`, `ultracode`) | `tooling/wiki/schema.json` |
| 4 | Petorreta sense àncora a l'índex | `porta-olivera --informe`: «Sense àncora a l'índex: 260924_0800_prompt_refinament_opus.md» (ara reparat per G1) | AGENTS §12 |
| 5 | Bloc fix de l'Olivera alterat | La plantilla v2.3 diu al punt 3 «Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut)» i té un punt 4. La 0800 els substituïx. També falten les seccions «Registre» (la taula penja de la secció 0), «Historial», «Riscos» i «Vincles» | `prompt_local.md`; `blocsFixos` de `protocolledge.json` |
| 6 | Les dianes de les tasques 1 i 2 no són on la petorreta diu | Les quatre petorretes i el pla 0720 ja són a `90_arxiu_historic/260924_Auditoria_Olivera/` (carpeta sense versionar), i els quatre documents de Fable a `260924_Auditoria_Fable/` | Estat del disc |

És, com a mínim, la **cinquena recaiguda documentada** del mateix defecte (pla 1515, prompt 0500, pla i prompt 0545, prompt 0722 i ara 0800). El `CLAUDE.md` ho classifica com a falla de càrrega, no d'aprenentatge, i mana registrar-ho al LEDGER com a «recaiguda» (la línia és a §Límits, punt 4).

**Què he fet amb la clàusula «no generes codi».** La petorreta, per la seua clàusula final, em demana no generar codi. Ho he llegit així:

- He registrat la incidència, que és el que la clàusula vol aconseguir.
- **No he tocat cap línia de codi**: Mode AFK, que és el que mana la plantilla canònica.
- Sí que lliure els pedaços com a text dins d'este document, perquè el Mestre ha invocat Ultracode en persona en esta sessió i les tasques són autosuficients.

Si el Mestre vol la lectura estricta, n'hi ha prou de no aplicar R1–R6. La resta d'esta auditoria continua valent.

**Proposta conservadora (IAIA):** crear el pla germà pel circuit (`document.mjs context --route pla.implementacio --file _wiki_de_poble/04_escriptori/260924_0800_pla_implementacio_refinament_opus.md`), i emetre les petorretes següents amb `context` i `create`, no escrivint-les a mà. No he creat eixe pla jo: hauria amagat la incidència i hauria signat en nom de la IAIA.

---

### 1 · Com aplicar (llig açò abans de copiar res)

1. **Cada pedaç és una substitució exacta.** Busca el bloc «ABANS» literal i substituïx-lo pel «DESPRÉS». Si no hi apareix exactament, **para**: algú ha tocat el fitxer després de la meua lectura. Els números de línia són orientatius.
2. **Qui aplica què.**
   - R1–R6 (`src/` i proves) els pot aplicar la IAIA o el Mestre.
   - G3 és governança (`.agents/`, `.claude/`): només el Mestre, o un agent amb lease.
3. **Conflictes amb la 0754.**
   - **P11 de la 0754 (roda del crom).** El Mestre ha triat «només per al superadmin, sense esborrar-la». Per tant, de la P11 **no s'aplica el pas 1** (esborrar l'import) i el pas 4 s'aplica **conservant `<BotoCrom />`**: el bloc corregit és a R1. El pas 5 de la P11 és exactament R1.
   - **P4 de la 0754 i R3.** Totes dues s'ancoren en la mateixa línia de `NotesContext.jsx`. Aplica **primer la P4** (que la conserva intacta) i **després R3**. Al revés, la P4 ja no casa.
   - **P10 de la 0754 i R4–R5.** Totes toquen el bloc de Notes de `modules.css`, però en regles diferents: no es trepitgen.
4. **Ordre recomanat:** G3 (Mestre, desbloqueja el segell) → R1 → R2 i R3 → R4 i R5 → R6 → proves, lint i volta visual (§Verificació).

---

### 2 · Mapa de tons de Notes: com està i com queda

Llegit a la cascada real: `index.css` declara les capes `reset, sdp, legacy, components, utilities`. `components.css`, `modules.css` i `AppGridShell.css` escriuen totes dins de `components`, en eixe ordre d'`@import`. Els valors ixen de `tokens.css`. Els tokens de crom no canvien amb el tema, així que la taula val igual en clar i en fosc.

| Zona | Regla que guanya ara | Ara | Després de R4 i R5 |
| --- | --- | --- | --- |
| Fila 1, esquerra (CARPETES) | `modules.css:3310` (0,4,0) | 800→900 (`#22211e`→`#0e0d0c`) | igual |
| **Fila 2, esquerra (Tot · roda)** | `modules.css:3313` (0,5,0) | 700→750 (`#3d3b35`→`#302e29`) | **750→800** (`#302e29`→`#22211e`) |
| **Cos esquerre (Mur, Mercat…, CATEGORIES, ETIQUETES)** | `.sdp-workspace-groups`, `modules.css:291` | **700** (`#3d3b35`) | **900**, `--sdp-crom-fons` (`#0e0d0c`), el de `nav.app-sidebar` |
| Fila 1, central (NOTES) | `modules.css:3299` (0,4,0) | 750→800 | igual |
| **Fila 2, central (lupa · ordenar · CREAR NOTA)** | `modules.css:3307` (0,4,0) | 600→700 (`#5b564e`→`#3d3b35`) | **700→750** |
| Llistat central (fitxes de notes) | `modules.css:3439` | `--sdp-fons-app` (`#f3f0ec` en clar) | igual |

**Diagnosi dels dos encàrrecs de to.** El llistat «Mur, Mercat» és l'arbre de la columna de Carpetes. El pinta `.sdp-workspace-groups` amb `--sdp-pedra-700`, que és **exactament el to de dalt del degradat de la fila 2 esquerra (700→750)**. Per això la fila de «Tot» es fonia amb el llistat: no hi havia cap escaló entre tots dos. La fila 2 central (600→700) era, a més, més clara que eixe llistat.

**Lectura conjunta (requires_human_decision).** Els dos encàrrecs es van escriure sobre l'estat d'ara, i junts donen este resultat:

- La fila 2 queda més fosca que el gris d'abans del llistat (700).
- També queda més clara que el negre nou (900).
- El resultat és una banda grisa entre dos negres (la fila 1 acaba en 900 i el cos és 900).

Una fila 2 més fosca que un llistat negre només seria possible fent-la negra també, i aleshores es perdria la jerarquia que es demana. Si el Mestre vol un altre escaló, és una línia de R4 per columna.

**Contrast del text blanc (`--sdp-crom-text`)**, calculat amb la fórmula WCAG a partir dels hex de `tokens.css`: sobre 700, 11,2:1; sobre 750, 13,6:1; sobre 800, 16,1:1; sobre 900, 19,4:1. Tot és AAA, abans i després.

---

### R1 · La roda del crom, només per al superadmin

- **Fitxer:** `src/components/universal/PanellCrom.jsx`.
- **Evidència:** línia 95. En desenvolupament la condició deixa passar qualsevol rol, sessió absent inclosa.
- **Severitat:** P2 (control d'accés d'una eina de sistema).
- **Font de veritat:** ordre del Mestre a la 0800. Coherent amb `/admin`, `/consola` i `/realitat`, que ja exigixen `RequireAuth rol="superadmin"` (`App.jsx:566-581`).
- **Regles dels hooks:** els quatre hooks (`useSession`, dos `useState`, `useCallback`) van tots abans del `return`. No canvia.

ABANS:

```jsx
  if (rol !== 'superadmin' && import.meta.env.MODE !== 'development') return null;
```

DESPRÉS:

```jsx
  // Només el superadmin veu la roda, també en desenvolupament (ordre del
  // Mestre, 260924): en local cal una sessió superadmin, com per a /consola.
  if (rol !== 'superadmin') return null;
```

**Conseqüència que has de saber.** El rol ix de `elMeuRol(config)` quan el backend té la capacitat `sessio`; si no la té, val `'usuari'` (`sessionService.js:77-86`). Per tant:

- En local sense sessió, o amb el backend apagat, la roda desapareix, com ja passa amb `/consola`.
- Mentre el rol és `'desconegut'` (s'està comprovant), la roda tampoc es veu. Al superadmin li apareixerà un instant després de carregar, i les icones de la barra negra es mouran 44px. Això ja passava en producció.

**P11 de la 0754, pas 4, corregit per a conservar la roda.** Aplica este bloc en lloc del «DESPRÉS» de la 0754. Només canvia l'`aria-expanded`:

```jsx
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" aria-expanded={menuObert ? 'true' : 'false'} aria-controls="app-sidebar" onClick={() => onToggleSidebar?.()}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <BotoCrom />
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
```

---

### R2 · La roda de CARPETES torna (Notes)

- **Fitxer:** `src/sections/notes/NotesSection.jsx`.
- **Evidència:**
  - `UniversalWorkspace.jsx:238-243` només construïx la roda («Configurar categories», icona `Settings`) si rep `onManageCategories`.
  - `NotesSection.jsx:157-173` no li la passa.
  - `NotesContext.jsx:248` i `:262` sí que exposen `obriConfiguracioNotes`, però ningú la crida. És el patró de «maquinària correcta sense endollar».
  - La prova `UniversalWorkspace.test.jsx:185` confirma que, sense la prop, la roda no hi és.
- **Severitat:** P2 (regressió visual d'un control canònic).
- **Font de veritat:** `sdp-app-grid-shell` §2: «A la part dreta d'aquesta barra hi ha exclusivament l'icona de la "Roda Dentada"». I §3: replegada la columna, la roda continua visible i alineada amb l'icona d'obrir.
- **On viu la roda.** No va a la columna central: va **a la dreta de «Tot»**, a la fila 2 de la columna de Carpetes. La lupa i CREAR NOTA són la mateixa fila, però de la columna central. Com que la skill vol que les barres semblen una sola, les tres coses es llegixen com una capçalera, i així ho descriu la petorreta.
- **Quan va desaparéixer:** no ho puc datar. `git log -p` i `git show` no són a la llista de lectures admeses.
- **Abast:** Wiki (`sdp-wiki-workspace`) i Disseny (`sdp-cataleg`) no passen la prop i continuen sense roda. Cap altra pantalla canvia.

ABANS (línies 69–72):

```jsx
  const {
    status, error, notes, noteFolders, creaNota,
    informaError, refresh, canCreate,
    notesComplete, resolveNote, workspaceKey
```

DESPRÉS:

```jsx
  const {
    status, error, notes, noteFolders, creaNota,
    informaError, obriConfiguracioNotes, refresh, canCreate,
    notesComplete, resolveNote, workspaceKey
```

ABANS (línies 162–163):

```jsx
      onCreate={onCreate}
      onCreateError={informaError}
```

DESPRÉS:

```jsx
      onCreate={onCreate}
      onCreateError={informaError}
      onManageCategories={obriConfiguracioNotes}
```

Si el context no està disponible, la funció arriba `undefined` i la roda no es pinta, que és el comportament d'ara. No hi ha cap cas nou d'error.

### R3 · Que la roda no siga un botó mut

- **Fitxer:** `src/sections/notes/NotesContext.jsx`.
- **Evidència:** la línia 248 només fa `console.log('obriConfiguracioNotes no implementat')`. Amb R2 sola, la persona clicaria una roda que no fa res.
- **Severitat:** P2 (a11y i honestedat de la interfície).
- **Font de veritat:** `NotaFitxa.jsx:26-38` ja resol este mateix cas (botons que encara no connecten) avisant la persona.
- **Proposta:** avisar amb el sistema de notificacions que ja hi ha (`showToast`, `NotesContext.jsx:48`). No invente cap gestor de carpetes.
- **requires_human_decision:** el text de l'avís. L'alternativa és un `Dialeg` com el de `NotaFitxa`.

ABANS (línia 248; si ja has aplicat la P4 de la 0754, continua igual):

```jsx
  const obriConfiguracioNotes = useCallback(() => console.log('obriConfiguracioNotes no implementat'), []);
```

DESPRÉS:

```jsx
  // La roda de CARPETES ja es veu (sdp-app-grid-shell §2), però el gestor de
  // carpetes, categories i etiquetes encara no existix: ho diem a la persona
  // en lloc de deixar un botó mut. Quan hi haja gestor, s'obrirà ací.
  const obriConfiguracioNotes = useCallback(
    () => showToast('La configuració de carpetes, categories i etiquetes encara no està disponible.'),
    [showToast]
  );
```

El `ctxValue` i les seues dependències ja inclouen `obriConfiguracioNotes` (línies 262 i 266), així que no cal tocar res més. De passada, desapareix un `console.log` del codi de producte.

---

### R4 · La fila 2 (Tot · roda · lupa · CREAR NOTA), un to més fosca

- **Fitxer:** `src/css/modules.css`, bloc del Bloc de Notes (`@layer components`).
- **Evidència:** la taula de §2.
- **Severitat:** P3 (jerarquia visual).
- **Font de veritat:** l'ordre del Mestre. El comentari de `modules.css:3380` ja descriu esta fila com «gris fosc», però la regla general la pintava clara.
- **Abast:** només `.sdp-bloc`. Les regles generals (`modules.css:3307` i `:3313`) no es toquen, i Wiki i Disseny conserven la seua fila.
- **Per què guanya:** les dues regles noves tenen la mateixa especificitat que les generals, (0,4,0) i (0,5,0), i van després. Sense `!important`.
- **Baseline:** només `linear-gradient` i `var()`. No hi ha cap color en brut ni cap `:has()`.

ABANS (línies 3383–3387):

```css
  .sdp-bloc .app-grid-column--middle .app-grid-col-header {
    position: sticky;
    top: 0;
    flex: none;
  }
```

DESPRÉS:

```css
  .sdp-bloc .app-grid-column--middle .app-grid-col-header {
    position: sticky;
    top: 0;
    flex: none;
  }

  /* Ordre del Mestre (260924): la segona fila (Tot i roda · lupa i CREAR NOTA)
     baixa UN escaló de l'escala de dalt (900 → 800 → 750 → 700 → 600) perquè
     quede més fosca que el llistat de davall. Es conserva la relació per
     columna: la central continua un escaló més clara que l'esquerra.
       · esquerra: 700→750 passa a 750→800
       · central:  600→700 passa a 700→750
     Només el Bloc: Wiki i Disseny conserven la seua. Mateixa especificitat que
     les regles generals de dalt (0,4,0 i 0,5,0), i guanya per ordre. */
  .sdp-bloc .sdp-workspace-column > .app-grid-col-header + .app-grid-col-header {
    background: linear-gradient(var(--sdp-crom-capcalera), var(--sdp-crom-subcapcalera));
  }
  .sdp-bloc .app-grid-column--left .sdp-workspace-column > .app-grid-col-header + .app-grid-col-header {
    background: linear-gradient(var(--sdp-crom-subcapcalera), var(--sdp-crom-subcapcalera-fosca));
  }
```

La columna replegada no es veu afectada: només té una capçalera, i el selector `+` no hi casa.

### R5 · La columna de Carpetes, en el negre suau de la closca

- **Fitxer:** `src/css/modules.css`, mateix bloc.
- **Evidència:** hi ha dues capes grises, una damunt de l'altra.
  - La columna la pinta `AppGridShell.css:193-196` amb `--app-grid-bg-esquerra`, que val `--sdp-pedra-750` (`AppGridShell.css:19`).
  - Damunt, l'arbre la tapa amb `.sdp-workspace-groups` i `--sdp-pedra-700` (`modules.css:291`, `min-height: 100%`). Esta és la capa que es veu.
  - La regla del Bloc `.sdp-bloc .app-grid-column--left` (`modules.css:3397`) declara `--sdp-crom-subcapcalera`, però empata a (0,2,0) amb la d'`AppGridShell.css` i perd per ordre d'`@import`. És una declaració morta que diu un gris que no es pinta.
- **Severitat:** P3 (harmonia visual). De passada, es retira un primitiu d'un component: `tokens.css:16-17` diu que escriure `var(--sdp-pedra-*)` en un component «és un error».
- **Font de veritat:** l'ordre del Mestre. `nav.app-sidebar` pinta amb `--sdp-crom-fons` (`layout.css:49`).
- **Colors de dins, revisats un per un.** Cap no canvia, i tots continuen sent llegibles sobre el negre:
  - El text i les icones hereten `--sdp-crom-text` (`AppGridShell.css:195`, `modules.css:291`, `:298`, `:3416`).
  - El hover és un vel blanc del 9% (`modules.css:3419`), que continua sent visible.
  - L'actiu té fons crema i text negre (`modules.css:3423-3431`), independent del fons.
  - El focus és `--sdp-crom-focus`, a 8,97:1 sobre el negre.
  - El filet de les carpetes niuades és `--sdp-crom-hover`, decoratiu.
  - Les barres de scroll són fosques per `color-scheme: dark`.
- **Mecanisme:** `.app-grid-page.sdp-bloc` (0,2,0) guanya a `.app-grid-page` (0,1,0) d'`AppGridShell.css` per especificitat, encara que vaja abans. És el mateix recurs que ja explica el comentari de `modules.css:3283-3288`.

ABANS (línies 3370–3378):

```css
  .sdp-bloc,
  .app-grid-page.sdp-bloc {
    --sdp-bloc-control: max(var(--sdp-touch), var(--sdp-touch-comode));
    --sdp-bloc-nav-fons: var(--sdp-pedra-750);
    --sdp-bloc-nav-text: var(--sdp-crom-text);
    --sdp-bloc-nav-meta: var(--sdp-crom-text-suau);
    --sdp-bloc-capcalera-fons: var(--sdp-pedra-700);
    --sdp-bloc-fitxa-mida: 86px;
  }
```

DESPRÉS:

```css
  .sdp-bloc,
  .app-grid-page.sdp-bloc {
    --sdp-bloc-control: max(var(--sdp-touch), var(--sdp-touch-comode));
    /* Fons de la columna de Carpetes: el negre suau de la closca, el mateix de
       nav.app-sidebar (ordre del Mestre, 260924). AppGridShell.css el llig com
       --app-grid-bg-esquerra al mateix element; ací mana perquè
       `.app-grid-page.sdp-bloc` (0,2,0) guanya a `.app-grid-page` (0,1,0). */
    --sdp-bloc-nav-fons: var(--sdp-crom-fons);
    --app-grid-bg-esquerra: var(--sdp-bloc-nav-fons);
    --sdp-bloc-nav-text: var(--sdp-crom-text);
    --sdp-bloc-nav-meta: var(--sdp-crom-text-suau);
    --sdp-bloc-capcalera-fons: var(--sdp-pedra-700);
    --sdp-bloc-fitxa-mida: 86px;
  }
```

ABANS (línies 3397–3401):

```css
  .sdp-bloc .app-grid-column--left {
    background: var(--sdp-crom-subcapcalera);
    color: var(--sdp-bloc-nav-text);
    color-scheme: dark;
  }
```

DESPRÉS:

```css
  /* El fons real de la columna el pinta AppGridShell.css amb
     --app-grid-bg-esquerra (empata a 0,2,0 i guanya per ordre d'@import);
     ací es repetix la mateixa variable perquè ningú llija un gris que no es veu. */
  .sdp-bloc .app-grid-column--left {
    background: var(--sdp-bloc-nav-fons);
    color: var(--sdp-bloc-nav-text);
    color-scheme: dark;
  }
  /* L'arbre de Carpetes, Categories i Etiquetes no pinta un gris propi damunt
     de la columna: la regla general de .sdp-workspace-groups hi posa
     --sdp-pedra-700 per a tots els espais de treball. Al Bloc, el negre suau. */
  .sdp-bloc .sdp-workspace-groups {
    background: var(--sdp-bloc-nav-fons);
  }
```

Precisions sobre R5:

- **`--sdp-bloc-nav-fons`.** La variable ja existia amb `--sdp-pedra-750`. No l'he trobada consumida a `modules.css`, `components.css`, `AppGridShell.css` ni `layout.css`. Ara passa a ser l'única font del fons de la navegació del Bloc. Sense `grep` no puc garantir que no la use cap altre full: la comprovació és a §Verificació.
- **Regla general intacta.** `.sdp-workspace-groups` de `modules.css:291` no es toca: la Wiki i el Disseny conserven el seu gris.
- **Fora d'abast: la franja replegada** (56px). Continua amb 700→750 (`modules.css:3359-3368`). Si el Mestre la vol negra també, és una línia més, però no s'ha demanat. És una decisió humana.

---

### R6 · Proves

**R6a · Fitxer nou** `src/components/universal/PanellCrom.test.jsx`. Fixa `MODE=development`, que és justament el forat que tanca R1. Amb el codi d'ara, les tres primeres proves fallen. Amb R1, passen.

```jsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const sessio = vi.hoisted(() => ({ rol: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ rol: sessio.rol }) }));

import { BotoCrom } from './PanellCrom.jsx';

// La condició vella deixava passar tothom en MODE development: la prova es fa
// en eixe mode perquè el forat no puga tornar sense que ho notem.
beforeEach(() => vi.stubEnv('MODE', 'development'));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

test.each([null, 'desconegut', 'usuari'])('rol %s: la roda del crom no es mostra, tampoc en desenvolupament', (rol) => {
  sessio.rol = rol;
  render(<BotoCrom />);
  expect(screen.queryByRole('button', { name: 'Crom del sistema' })).toBeNull();
});

test('superadmin: la roda del crom es mostra', () => {
  sessio.rol = 'superadmin';
  render(<BotoCrom />);
  expect(screen.getByRole('button', { name: 'Crom del sistema' })).toBeTruthy();
});
```

Comprovat per lectura: amb el panell tancat, el `Dialeg` només té el botó «Tancar» (`Dialeg.jsx:76`), així que «Crom del sistema» és únic. `arrel` queda a `null` en jsdom i no s'executa cap càlcul de color.

**R6b · `src/sections/notes/NotesSection.test.jsx`.** Tres substitucions i una prova nova.

ABANS (línia 4):

```js
const mocks = vi.hoisted(() => ({ model: null, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' } }));
```

DESPRÉS:

```js
const mocks = vi.hoisted(() => ({ model: null, props: null, obri: () => {}, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' } }));
```

ABANS (línies 5–7):

```js
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true
}) }));
```

DESPRÉS:

```js
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true,
  obriConfiguracioNotes: mocks.obri
}) }));
```

ABANS (línia 10):

```js
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: ({ model }) => { mocks.model = model; return null; } }));
```

DESPRÉS:

```js
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => { mocks.model = props.model; mocks.props = props; return null; } }));
```

Al final del fitxer:

```js
test('la roda de CARPETES torna: el Bloc passa la seua configuració a l’espai de treball', () => {
  render(<NotesSection />);
  expect(mocks.props.onManageCategories).toBe(mocks.obri);
});
```

**R6c · `src/components/universal/workspace/UniversalWorkspace.test.jsx`.** Una prova nova de §2 i §3 de la skill, al final del fitxer. ABANS (línies 191–195):

```jsx
test('revalidació buida no es presenta com absència i crear queda desactivat', () => {
  render(<UniversalWorkspace model={{ status: 'revalidating', items: [] }} onCreate={() => {}} />);
  expect(screen.queryByText('No hi ha elements.')).toBeNull();
  expect(screen.getByRole('button', { name: 'CREAR' }).disabled).toBe(true);
});
```

DESPRÉS:

```jsx
test('revalidació buida no es presenta com absència i crear queda desactivat', () => {
  render(<UniversalWorkspace model={{ status: 'revalidating', items: [] }} onCreate={() => {}} />);
  expect(screen.queryByText('No hi ha elements.')).toBeNull();
  expect(screen.getByRole('button', { name: 'CREAR' }).disabled).toBe(true);
});

test('la roda de CARPETES apareix amb onManageCategories i continua visible amb la columna replegada', () => {
  const onManage = vi.fn();
  render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      labels={{ categories: 'CARPETES', items: 'NOTES' }}
      onManageCategories={onManage}
      renderDetail={() => null}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Configurar categories' }));
  expect(onManage).toHaveBeenCalledTimes(1);
  // sdp-app-grid-shell §3: replegada la columna, la roda continua al costat de l'icona d'obrir.
  fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' }));
  expect(screen.getByRole('button', { name: 'Expandir CARPETES' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Configurar categories' })).toBeTruthy();
});
```

Esta prova no depén de cap pedaç: comprova el contracte que R2 fa servir. El `clientWidth` de 1400px de `beforeAll` (línia 32) manté la graella en «ample», que és on existix la variant replegada.

---

### G1 · Àncores de l'Escriptori (tasca 1): aplicat

- **Fitxer:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md`.
- **Abans:** `porta-olivera --informe` avisava de «10 àncores a documents que ja no són a l'Escriptori» i de la 0800 sense àncora.
- **Mecanisme:** `tractor-orfandat` resol les àncores sense ruta només entre els fitxers que no són de l'arxiu (`tractor-orfandat.mjs:15`). Per a ell, les deu eren enllaços trencats.
- **Fet:**
  - Les quatre de Fable i les sis de l'Olivera, reapuntades a la ruta real de l'arxiu. Així es resolen des del disc (`document-links.mjs:18`).
  - L'acta 0717 de Codex, llistada amb les actes (`../10_actes/`).
  - Les quatre petorretes que demanava la tasca, ancorades a la seua ruta d'arxiu, que és on viuen:
    - `260924_0630_prompt_fortificacio_opus`
    - `260924_0645_pla_implementacio_opus` (és un pla, no una petorreta)
    - `260924_0711_prompt_fortificacio_codex`
    - `260924_0722_prompt_implementacio_opus`
  - «Activitat en curs» diu ara la veritat: 0800, 0754 i este document.
- **No fet:** no he mogut ni esborrat cap fitxer. Els documents arxivats a mà continuen sense `handoff` registrat als seus torns: `torn_589c9270` de Fable, `torn_b0e47896` i `torn_90b82d38` de Claude, i `torn_4e7c263a` de Codex. És el mateix defecte que Fable va documentar per al torn `torn_5259c02c`.

### G2 · La proposta del `matcher` (tasca 2): no aplicat, i per què

- **Fitxer:** `_wiki_de_poble/90_arxiu_historic/260924_Auditoria_Olivera/260924_0720_pla_implementacio_olivera.md`, §1, «Aportacions de la IAIA MarIA». Hi proposa afegir `Bash|Write|Edit|MultiEdit|NotebookEdit` com a `matcher` a `.claude/settings.json`.
- **Per què no l'he esborrat:**
  - El document ja no és a l'Escriptori: és a l'arxiu. `wiki-cicle-de-vida` §6: «no es reescriu història tancada».
  - A més, porta el rebut `reflex` del torn de Codex (`torn_4e7c263a`). Editar-lo en nom d'un altre torn falsejaria eixe rebut.
- **Efecte real:** la proposta ja no està a cap superfície activa, així que ningú la pot aplicar per error, que era el que temia la 0754. Per si de cas, l'àncora nova de l'índex diu explícitament que la F1 del `matcher` queda substituïda per la F1′ (0754, P1).
- **Si el Mestre vol igualment el text esborrat:** és una edició de la zona d'arxiu que ha d'ordenar ell. Proposta: una línia al peu del pla, «Superat per 0754 P1 (F1′)», en lloc d'esborrar. Així la història continua llegible.

### G3 · El frontmatter de `core-taxonomia-estricta` (tasca 3): pedaç per al Mestre

- **Fitxer:** `.agents/skills/core-taxonomia-estricta/SKILL.md` (governança: el Mestre o un agent amb lease).
- **Què és invàlid, exactament:**

| Llei | Què diu la porta | Per què |
| --- | --- | --- |
| F1 (`tractor-frontmatter.mjs:386-400`) | falten `type`, `status`, `type\|tipus` i `status\|estat` | `schema.json` exigix `type`, `status` i `description`; el frontmatter només té `name`, `description` i `version` |
| F9 (`tractor-frontmatter.mjs:59-99`) | «Cal exactament una secció real ## Vincles» | la skill no en té |
| Catàleg | no apareix a `.agents/skills/00_INDEX_SKILLS.md` | ningú el va regenerar |
| Claude Code | no existix `.claude/skills/core-taxonomia-estricta/` | la skill no apareix a la llista de skills d'esta mateixa sessió |

- **La porta F1–F9 abasta la skill:** `frontmatter-abast.json` arrela a `.` i no exclou `.agents/`.
- **El segell no es trenca pel frontmatter.** Es trenca perquè s'hi va afegir un fitxer `.md` nou dins de `.agents/skills/`, i `segella.mjs` els segella tots. Per això, **resegellar sense corregir el catàleg ni el frontmatter només trasllada el problema**.

**Pas 1. Frontmatter.** ABANS (línies 1–5):

```yaml
---
name: core-taxonomia-estricta
description: Tractor documental per blindar la taxonomia i evitar generació de documents arbitraris que no segueixen les plantilles canòniques.
version: 1.0.0
---
```

DESPRÉS (format de la plantilla ISO de skills, §2):

```yaml
---
type: skill
status: esborrany
description: Tractor documental per blindar la taxonomia i evitar generació de documents arbitraris que no segueixen les plantilles canòniques.
tags:
  - govern
  - skills
name: core-taxonomia-estricta
triggers_on:
  - petorreta
  - prompt
  - pla d'implementació
  - pla_implementacio
  - auditoria
  - acta
  - informe
  - bundle
version: "1.0.0"
---
```

- **`status: esborrany` i no `canonic` (requires_human_decision).** Fable va documentar que el cos instal·lat encara ensenya a «generar el document» de memòria, i que hi ha una segona versió amb rebut a l'arxiu (`260924_0555_skill_core_taxonomia_estricta.md`). Mentre el Mestre no trie, dir `canonic` seria afirmar un consens que no existix.
- **`triggers_on`.** És el que llig `build_skills_index.mjs` per a encaminar. Amb estos gallets, el router assenyala la skill cada vegada que es parla de petorretes, prompts, plans, auditories, actes, informes o bundles, que és el moment exacte en què la skill ha de disparar.
- **Etiquetes.** `govern` i `skills` són dins de l'enum de `schema.json`.

**Pas 2. Vincles (F9).** Afig al final del fitxer, després de l'última línia de §3:

```markdown

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
```

**Pas 3. Catàleg.** A `.agents/skills/00_INDEX_SKILLS.md`, ABANS (línia 22):

```markdown
- [[core-restauracio-segellada/SKILL|core-restauracio-segellada]]: Core skill per a restauració segura
```

DESPRÉS:

```markdown
- [[core-restauracio-segellada/SKILL|core-restauracio-segellada]]: Core skill per a restauració segura
- [[core-taxonomia-estricta/SKILL|core-taxonomia-estricta]]: Tractor documental per blindar la taxonomia i evitar generació de documents arbitraris que no segueixen les plantilles canòniques.
```

**Pas 4. Visibilitat a Claude Code.** Primer comprova quina forma tenen les altres entrades de `.claude/skills/`:

```bash
ls -l .claude/skills
```

Si són enllaços relatius cap a `../../.agents/skills/…`, crea el que falta amb la mateixa forma:

```bash
ln -s ../../.agents/skills/core-taxonomia-estricta .claude/skills/core-taxonomia-estricta
```

**Pas 5. Resegellat explícit**, després de revisar el diff dels passos 1 i 3. Primer, llig el hash nou (el camp `hash` de l'eixida):

```bash
node tooling/gates/segella.mjs --json
```

Després, substituïx `HASH_NOU` per eixe valor:

```bash
node tooling/gates/segella.mjs --update --expected-hash=HASH_NOU --expected-previous=88f0ec03b3910a6e95785b3a3e0e67a69170357a319a5c005474e0eec148104d --reason="core-taxonomia-estricta: frontmatter ISO, Vincles i catàleg (auditoria 260924_0825)"
```

El valor previ és el de `.agents/SKILLS_SEAL.json` d'este tall. `segella.mjs:87` exigix els tres paràmetres i fa CAS: si algú canvia una skill entre les dos ordres, el resegellat es refusa.

**Pas 6. Comprovació:**

```bash
node tooling/gates/segella.mjs
```

```bash
npm run porta:frontmatter
```

```bash
npm run skills:index
```

- **Fora d'abast (requires_human_decision):** quin cos val. El frontmatter és el que demanava la tasca. La comparació entre les dos versions del cos ja la va fer Fable, a l'arxiu `260924_0555_auditoria_fable.md`, §3.

---

### Altres troballes (fora de l'abast de la 0800; no tocades)

**F-A · Regressió de contrast a la barra taronja (P1, requires_human_decision).**

- **Fitxer:** `src/css/layout.css:500` i `:520`, canvi sense comitejar d'autoria desconeguda (`git diff`).
- **Què ha canviat:**
  - `.btn-date-time` ha passat de `var(--sdp-sobre-accent)` a `#ffffff`.
  - `.btn-icon-orange` ha passat de `var(--sdp-text-invers)` a `#ffffff`.
- **Per què és una regressió:** el comentari de les línies 516–517, just damunt, avisa que el blanc sobre el taronja amb vel fa 3,69:1, per davall de l'AA. És l'A05 de Codex, que la 0754 ja va assenyalar.
- **Lleis que trenca:** Pedra Seca §2 («cap hex arriba mai a un component») i la Llei del Píxel.
- **La porta no ho veu:** `design_guard` dona 278/41/5, igual que abans del canvi.
- **Proposta conservadora:** que qui ho va fer ho diga a l'Olivera. Si no era intencionat, es tornen les dues línies als tokens d'abans.

**F-B · Focus quasi invisible a les capçaleres de crom en tema clar (P2).**

- **Fitxer:** `AppGridShell.css:426-435`. Els controls de les capçaleres (Tot, roda, lupa, ordenar i CREAR NOTA) marquen el focus amb `--sdp-focus`, que en clar és `--sdp-secondary-700` (`#004983`).
- **Contrast:** 1,5:1 sobre el 750 i 1,7:1 sobre el 800. WCAG 2.4.11 i 1.4.11 en demanen 3:1. En fosc, `--sdp-focus` passa a taronja i sí que complix.
- **Estat amb R4:** R4 millora un poc el contrast, però no el tanca.
- **Proposta:** usar `--sdp-crom-focus` a estes regles, com ja fa `.sdp-bloc .sdp-workspace-nav-item:focus-visible` (`modules.css:3432-3435`). Dona 7,4:1 sobre el 800.

**F-C · HEAD ja porta el segell trencat (P1).**

- **Evidència:**
  - `git status` no mostra cap canvi a `.agents/skills/` ni a `.agents/SKILLS_SEAL.json`.
  - `segella.mjs` dona ruptura (455a0fad contra 88f0ec03).
  - Per tant, el commit `5eee1293` es va fer amb el segell trencat.
- **Conseqüència:** o es va passar amb `--no-verify`, o el pre-commit no executa el segell. La 1833 de Claude ja ho havia vist en quatre dels cinc commits anteriors.
- **Proposta:** que el Mestre ho comprove amb `git log -1 --stat` i amb la configuració del hook. Jo no puc: no són lectures admeses.

**F-D · Primitius dins de components, a la mateixa zona (P3).** `tokens.css:16-17` ho declara error. Casos:

- `AppGridShell.css:19` (`--sdp-pedra-750`);
- `modules.css:197`, `:200` i `:291`;
- `--sdp-bloc-capcalera-fons` (`modules.css:3376`).

R5 en retira un (`--sdp-bloc-nav-fons`). La resta, per abast (lliçó 260923 «l'abast es definix per superfície»), queda documentada i intacta.

**F-E · La skill i el CSS es contradiuen sobre les files (P3, requires_human_decision).**

- **La skill:** `sdp-app-grid-shell` §2 diu que la fila 1 és «un sol gris uniforme… No hi ha degradats cap al centre» i que la fila 2 és «un gris més intens».
- **El CSS:** `modules.css:3290-3315` usa degradats i, a més, fa la columna central un escaló més clara, atribuint-ho a eixa mateixa skill, que no ho diu.
- **Per què no ho toque:** R4 respecta el CSS vigent, perquè el comentari cita una captura del Mestre del 260922.
- **Proposta:** que el Mestre diga quina de les dues fonts mana i que l'altra s'hi alinee.

**F-F · L'arxivat a mà ha trencat els Vincles de la 0754 (P3).**

- **Evidència:** `260924_0754_auditoria_claude.md:1347-1351` enllaça sense ruta 0716, 0652, 0717, 0720 i 0722, que ja són a l'arxiu. Són cinc enllaços trencats per a `tractor-orfandat` i per a F9.
- **Proposta:** reapuntar-los a `../90_arxiu_historic/260924_Auditoria_Olivera/…` com a G1. Ho ha de fer qui tinga el torn d'eixe document; no l'he tocat.

---

### Rèplica a l'Olivera

No hi ha cap Pla d'Implementació actiu on escriure: l'últim, el 0720, és a l'arxiu. Quan la IAIA cree el germà de la 0800, esta és la meua aportació per a la pissarra:

```markdown
### Claude (Opus 5.5) · auditoria 260924_0825
- R1 crom només superadmin (PanellCrom.jsx:95) + prova en MODE development. Substituïx la P11 de la 0754 (pas 1 fora; pas 4 conservant <BotoCrom />).
- R2+R3 roda de CARPETES: NotesSection passa onManageCategories; el stub avisa amb showToast. P4 de la 0754 abans que R3.
- R4 fila 2 un escaló més fosca (750→800 / 700→750); R5 columna de Carpetes a --sdp-crom-fons. Només .sdp-bloc.
- G1 índex reparat; G2 no s'edita l'arxiu; G3 frontmatter + Vincles + catàleg + enllaç + resegellat (Mestre).
- Decisions: text de l'avís de R3; to de la franja replegada; status de la skill; F-A (qui va posar #ffffff).
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Executat en este torn** (totes són lectures admeses o ordres del circuit documental):

| Ordre | Resultat |
| --- | --- |
| `git status --short` | Arbre brut. Les carpetes `260924_Auditoria_Fable/` i `260924_Auditoria_Olivera/` són noves i sense versionar. Els quatre documents 0545/0555 figuren esborrats de l'Escriptori |
| `git diff --no-ext-diff --no-textconv` | `layout.css` amb dos `#ffffff` (F-A); a l'índex, les àncores 0652–0754 sense ruta |
| `porta-olivera.mjs --informe` (abans de G1) | ❌ 2 documents solts, cap pla de hui, la 0800 sense àncora, 10 àncores fantasma |
| `porta-documents.mjs` (abans) | ❌ 3 documents comprovats. La 0800 sense rebut, amb `tags[1..3]` fora de l'enum i sense àncora |
| `segella.mjs` | ❌ ruptura, 455a0fad contra 88f0ec03 |
| `design_guard.mjs --arrel=src` | ✅ 278 fitxers, 41 crítics, 5 avisos (línia base, igual que Fable) |
| `obrir_torn.mjs --actor Claude --scope documents` | ✅ `torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f` |
| `document.mjs context` i `create` | ✅ plantilla, rebut i esborrany ancorat |
| `porta-olivera.mjs --informe` (després de G1 i d'este document) | 3 documents solts. Queda un sol error: «❌ Cap Pla d'Implementació de hui», que és de la IAIA (§0). Cap àncora fantasma ni cap document sense àncora |
| `document.mjs check --file` (este document) | ✅ `valid: true`, cap error |
| `porta-documents.mjs` (després) | ❌ 4 documents comprovats. Només queden els tres errors propis de la 0800 (rebut i `tags[1..3]`); el de l'àncora ha desaparegut. Este document i la 0754 passen |

**Llegit sencer per a construir els pedaços:**

- `PanellCrom.jsx`, `App.jsx`, `SessionContext.jsx`, `sessionService.js`, `Dialeg.jsx`.
- `NotesSection.jsx`, `NotesContext.jsx`, `NotaFitxa.jsx`.
- `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.jsx`, `NotificationContext.jsx`, `AvisadorEfimer.jsx`.
- `WikiDePobleSection.jsx` i `DesignSection.jsx`, per a saber qui més usa l'espai de treball.
- CSS: `index.css`, `tokens.css`, `AppGridShell.css`, `components.css` i `modules.css`, sencers (3.654 línies), més `layout.css:1-140` i `:494-533`.
- Proves: `NotesSection.test.jsx` i `UniversalWorkspace.test.jsx`.
- Govern: `hooks-local.mjs`, `mutation-policy.mjs`, `command-policy.mjs`, `porta-olivera.mjs`, `porta-reflex.mjs`, `tractor-orfandat.mjs`, `document-links.mjs`, `segella.mjs`, `build_skills_index.mjs`, `tractor-frontmatter.mjs`, `schema.json`, `frontmatter-abast.json`, `SKILLS_SEAL.json`, `00_INDEX_SKILLS.md`, la skill i la plantilla de skills.

**Per a qui aplique els pedaços** (terminal del Mestre; cada ordre és independent):

```bash
npx vitest run src/components/universal/PanellCrom.test.jsx src/sections/notes/NotesSection.test.jsx src/components/universal/workspace/UniversalWorkspace.test.jsx
```

```bash
npm test -- --run
```

```bash
npm run lint
```

```bash
node tooling/gates/design_guard.mjs --arrel=src
```

```bash
grep -rn "sdp-bloc-nav-fons" src/
```

L'últim `grep` ha de mostrar només les línies de `modules.css` que toca R5. Si n'ix una altra, eixa regla canvia de gris a negre i s'ha de mirar abans de donar R5 per bo.

**Volta visual** a `http://localhost:3340/notes`, amb la finestra de més de 1.090px, en tema clar i en fosc:

1. **Fila 2 esquerra:** «Tot» a l'esquerra i la roda a la dreta. La fila és visiblement més fosca que abans i ja no es fon amb el llistat. En clicar la roda, apareix l'avís de R3.
2. **Columna replegada:** «Replegar CARPETES» deixa la franja amb l'icona d'expandir i la roda alineades (§3 de la skill).
3. **Fila 2 central:** lupa, ordenar i CREAR NOTA, un to més fosca. El botó blau, igual.
4. **Cos de Carpetes:** negre com la barra lateral de l'app. «Mur», «Mercat», CATEGORIES i ETIQUETES, en blanc; el hover es veu; l'element actiu, en crema amb text negre.
5. **Llei del Píxel:** `/wikidepoble` i `/disseny`, idèntics a abans.
6. **Tauleta:** amb la finestra entre 720 i 1.090px, el calaix de Carpetes també és negre.
7. **Crom:** sense sessió superadmin, la barra negra no porta roda. Amb sessió superadmin, sí.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Cap pedaç s'ha executat.** El hook no em deixa llançar proves, ni lint, ni el navegador. Tot el que dic sobre píxels ix de llegir la cascada, no d'una captura. Tracta cada pedaç com a correcte fins que una prova diga el contrari, i no al revés.
2. **Sense `grep` ni `Glob`.** L'inventari de consumidors (de la roda, de `.sdp-bloc` i de `--sdp-bloc-nav-fons`) ve de seguir imports i de llegir fitxers sencers. Per a les capes que poden guanyar a `components` (regles sense capa i declaracions `!important` de `legacy`), he llegit sencers `index.css`, `components.css`, `modules.css` i `AppGridShell.css`. No he llegit sencers `base.css`, `sdp.css`, `utilities.css`, `WikiDePobleSection.css` ni `PerfilShell.css`: si algun portara un `!important` sobre estos selectors, R4 o R5 hi perdrien. La volta visual ho detecta.
3. **Arbre concurrent.** Els blocs «ABANS» són literals de les lectures d'este torn. Si no casen, algú ha tocat el fitxer: para.
4. **Relleu sense escriure.** No he tocat l'ESTAT ni el LEDGER, perquè són governança i no tinc lease. El torn `torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f` queda obert. Blocs preparats:

```markdown
## ESTAT_ACTUAL · 260924_0825 · Claude · Refinament de Notes, roda del crom i governança documental

- Torn `torn_0c53760a-bf44-46fe-b7f3-4876d32ab65f` (documents). Entrega [[260924_0825_auditoria_refinament_claude]]. AFK: zero codi tocat.
- Fet: índex de l'Escriptori reparat (10 àncores fantasma reapuntades a l'arxiu; 0800 i les quatre petorretes 0630/0645/0711/0722 ancorades).
- Pedaços: R1 crom només superadmin; R2–R3 roda de CARPETES amb avís; R4 fila 2 un escaló més fosca; R5 Carpetes en negre suau; R6 proves. G3 frontmatter, Vincles, catàleg i resegellat per al Mestre.
- Incidència greu: petorreta 0800 sense rebut, sense pla germà i amb el bloc de l'Olivera alterat. Cinquena recaiguda.
- Decisions del Mestre: text de l'avís (R3), franja replegada, status de la skill, qui va posar #ffffff a layout.css (F-A).
```

```markdown
260924 | recaiguda | wiki-documentacio-i-reflex | petorreta 0800 sense rebut ni pla germà; cinquena vegada
```

5. **Recordatori (AGENTS §14):** falta l'Acta Marmota d'esta jornada.
6. **Millora de `prompt_local.md`.** La plantilla hauria de tindre un camp de mode explícit (`audit-only`, `patch-document` o `apply`), com ja van proposar Codex i la 0754. Així, una clàusula com la de la 0800 («no generes codi») no hauria de competir amb una ordre de generar pedaços.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0754_auditoria_claude]]
- [[260924_0800_prompt_refinament_opus]]
