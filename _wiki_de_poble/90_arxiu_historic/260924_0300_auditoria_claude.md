---
type: informe
status: esborrany
description: "Auditoria de fortificació global amb les portes executades una a una: la cadena mor a la 3 de 48, el botó d'acció queda per davall d'AA i el context del nucli no memoïtza."
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e5a7f340-5e7f-46b2-8cb3-847952d9bff7:ed93806e-c68d-4cce-ad45-88f273e7cc68
---
# Auditoria de fortificació global

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e5a7f340-5e7f-46b2-8cb3-847952d9bff7:ed93806e-c68d-4cce-ad45-88f273e7cc68 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T00:59:46.116Z |
| Modificació | 2026-09-24T01:05:00.000Z |
| Propietari | Claude (agent local) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5 (identificador exacte `claude-opus-5`) |
| Tokens consumits | estimats ~240.000 d'entrada i ~13.000 d'eixida; els mesurats reals no s'exposen a l'agent en este entorn i no els invente |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegida íntegra abans d'escriure cap línia. Tall d'evidència: commit `e2179043`, branca `backup-notes-publish`, finestra 2026-09-24T00:50Z–01:05Z.

**Condició del torn que cal declarar per honestedat metodològica:** el Reflex ha confinat esta sessió a lectura explícita i a la llista blanca de `knownRead` (`tooling/gates/mutation-policy.mjs:20-39`). No he pogut executar `npm run lint`, `git rev-parse`, `ls` ni cap shell composta. Tot el que afirme ací ve de `Read` o d'ordres autoritzades. El que no he pogut executar està a **Límits**.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24T00:59:46.116Z: esborrany creat; contingut i verificació pendents.

2026-09-24T01:05Z: informe complet. Auditoria demanada per `260924_0235_prompt_fortificacio_global.md`. He llegit el pla de la IAIA (`260924_0245_pla_implementacio_fortificacio.md`), que tenia les quatre capes buides ("Pendent de deteccions"). No hi havia cap auditoria de Codex a l'Escriptori en el moment del tall: sóc la primera a arribar a l'olivera, i les quatre capes del pla les òmpliga este informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Preàmbul: per què esta auditoria no s'assembla a les anteriors

No he llegit el codi i opinat. He **executat les portes una per una**, cosa que la cadena no fa des de fa temps. Eixa decisió ha produït quasi totes les troballes que seguixen, i també la primera.

---

### P0-1 · La cadena de 48 portes mor a la porta 3. Les altres 45 no s'avaluen.

- **Scope:** `tooling/gates/run-portes.mjs`, `.agents/SKILLS_SEAL.json`
- **Evidència reproduïble:** `npm run porta`

```
✅ [OK] Contracte de plantilles          (1/48)
✅ [OK] Autoritat i arrencada            (2/48)
❌ [Llei Z] Ruptura de segell: hash actual edf33db4 ≠ segellat c81eed08
💥 ATURADA CRÍTICA: La porta Segell de skills ha fallat.   [exit 1]
```

- **Font de veritat en conflicte:** AGENTS §4, sdp-workflow §3 (verificació contínua de portes).
- **Severitat: crítica.** No perquè el segell estiga trencat —això es repara amb `porta:segella:update`— sinó per la conseqüència sistèmica: des que la cadena para ací, **cap de les 45 portes restants ha emés cap judici**. No hi ha 45 portes verdes: hi ha 45 portes **sense notícies**. Tot el que ve a continuació ha entrat pel forat que obri esta troballa.
- **Efecte col·lateral viu:** el `PostToolUse` `segell-auto.mjs` falla a **cada** crida d'eina d'esta sessió amb «Origen no acreditat: segell divergent». El Reflex crida auxili en cada respiració i s'ha convertit en soroll de fons: el senyal existix i ja no informa.
- **CAUSA ARREL, localitzada:** `node tooling/gates/tancament.mjs --check` la nomena sense ambigüitat:

```
skills: Skill no activa o identitat divergent: .agents/skills/core-edicio-segura/SKILL.md   [exit 2]
```

  El segell no s'ha trencat per atzar ni per corrupció: **una sola skill (`core-edicio-segura`) té la identitat divergent respecte del catàleg segellat**, i eixa divergència és la que mou el hash de `c81eed08` a `edf33db4`. És un fitxer. Tota la cadena de 48 portes està aturada per un fitxer.
- **Proposta conservadora, ara que la causa té nom:** reconciliar `core-edicio-segura/SKILL.md` amb el catàleg (o acceptar-ne la versió nova conscientment), resegellar amb lease, i **després** tornar a executar `npm run porta` sencera per conéixer de veres l'estat de les 45. No done per bo cap verd que no s'haja executat.
- `requires_human_decision: true` — cal saber si el canvi d'eixa skill era volgut abans de resegellar. Resegellar sense mirar-ho convertiria una modificació possiblement no revisada en doctrina.

---

### P0-2 · El botó d'acció principal no arriba ni a AA. El comentari del codi ho tapava.

- **Fitxer:** `src/css/tokens.css:126`
- **Evidència reproduïble:** `npm run porta:cromatic`

```
C2 · Comentari fals (4)
  src/css/tokens.css:126
    ↳ `--sdp-sobre-accio` = #ffffff sobre `--sdp-accio` · el comentari declara
      5.23:1 però el contrast real és 3.87:1 (desviació -1.36).
```

- **Font de veritat en conflicte:** Constitució punt 2 («contrast elevat (AAA)», Bancal Mode), `02_genotip.md`, `sdp-pedra-seca`.
- **Severitat: crítica, i és la troballa que més em preocupa de totes.** 3,87:1 està **per davall del mínim AA (4,5:1)** per a text normal. `--sdp-sobre-accio` sobre `--sdp-accio` és el text blanc damunt del botó d'acció: el «Connectar» del `PageFrame`, el CTA de tota la casa. El projecte que ha escrit que la llegibilitat sota el sol d'estiu va per davant del minimalisme de despatx té el seu botó principal per davall de l'estàndard mínim, al bancal, per a l'uelo.
- **El que ho fa greu no és el número, és el mecanisme.** El comentari deia 5,23:1. Algú el va escriure de bona fe i ningú el va tornar a mesurar. La porta que ho detecta existix, funciona i diu exactament açò; simplement **mai s'executa**, perquè viu més avall de la porta 3. Les altres tres infraccions C2 són desviacions positives (el contrast real és millor del declarat): documentalment falses, però inofensives. Esta no.
- **Proposta conservadora:** enfosquir `--sdp-accio` fins que `#ffffff` damunt supere 4,5:1, i preferiblement 7:1 si es vol sostindre la paraula AAA. És un canvi de token, no un redisseny. Però **altera píxels**: entra dins de la Llei del Píxel (sdp-workflow) i necessita ordre del Mestre.
- `requires_human_decision: true`

---

### P0-3 · El deute de disseny ha pujat en quatre categories i hi ha dos lleis dures trencades.

- **Evidència reproduïble:** `npm run porta:design-guard`

```
LLEI DURA VIOLADA · tailwind-visual: 15 infraccions (no admet deute)
LLEI DURA VIOLADA · font-too-small: 1 infracció → css/modules.css | 13px
DEUTE PUJA · raw-color: 20 → 37      (BrainGraph.jsx ×6, modules.css ×4, wikiManifest.js ×2…)
DEUTE PUJA · inline-style: 17 → 24   (PageFrame, PanellCrom, DesignSection, WikiDePobleSection)
DEUTE PUJA · touch-too-small: 3 → 5  (modules.css | 40px)
DEUTE PUJA · h1-outside-header: 1 → 2
Design Guard: 257 fitxers, 84 crítics, 5 avisos.   [exit 1]
```

- **Font de veritat en conflicte:** Constitució punts 10 i 11, `sdp-pedra-seca`, ADR-2026-08-OMBRES-I-RADIS.
- **Severitat: alta.** `font-too-small: 13px` i `touch-too-small: 40px` no són estètica: són les dos mètriques que el propi projecte declara innegociables (text gran, àrees tàctils de 48×48 mínim). Els 40px es queden a 8px de la seua pròpia llei.
- **Observació d'higiene que val per tot l'informe:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx` apareix a **quatre portes roges alhora** (tailwind-visual ×5, inline-style, h1-outside-header, innerHTML). És codi entrat al commit `e2179043`, és a dir, **després** que la cadena es trencara. És la prova documental de P0-1: quan la porta calla, el deute entra.

---

### P1-4 · Dos `dangerouslySetInnerHTML` sense sanejar, amb el sanejador importat dos línies més amunt.

- **Fitxers:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx:106`, `src/sections/disseny/DesignSection.jsx:29`
- **Evidència reproduïble:** `npm run porta:innerhtml` → exit 1.
- **Refutació adversarial, que faig jo mateixa abans que ningú:** açò **no és un XSS explotable hui**. `page.html` ve de `PAGE_COPY`, que és un literal dins de `src/sections/text/pageContent.js`, versionat al repositori. Un atacant extern no el toca. Qui diga que ací hi ha un forat de seguretat actiu, exagera.
- **Per què ho mantinc igualment com a P1:** el mateix fitxer importa `sanitizeHtml` a la línia 5 i l'usa correctament a la línia 227 per al contingut de la Wiki. **La mateixa pantalla saneja un camí i no l'altre.** Això no és una decisió, és una omissió. I el camí remot ja està obert: `CoreContentContext.jsx:30` construïx `pageCopy` des de `data.payload.pages` (backend), i `App.jsx:445` fa `pageCopy?.[pageKey] || PAGE_COPY?.[pageKey]`. Quan el contingut arribe de Sollutia, el saneig continuarà absent.
- **Proposta conservadora:** `sanitizeHtml(page.html)` als dos llocs. Cap efecte visual: `sanitize.js` ja permet tota l'etiquetació que `pageContent.js` fa servir (`h3`–`h5`, `p`, `ul`, `li`, `strong`, `em`, `code`, `blockquote`, `div`, `img`, `span`). Compleix la Llei del Píxel.

---

### P1-5 · Memòria inert: el `useMemo` del context del nucli no memoïtza res.

Esta és la troballa d'arquitectura que no ix a cap porta, i és la que té més cost amagat.

- **Fitxers:** `src/app/contexts/useScopedResource.js:34-35` i `src/app/contexts/CoreContentContext.jsx:21-35`
- **Mecanisme, verificat per lectura directa.** `useScopedResource` acaba així:

```js
return state.token === token ? { ...state, refresh }
  : { token, status: 'loading', payload: null, error: null, refresh };
```

Les dues branques construïxen un **objecte literal nou en cada render**. Mai retorna una referència estable. I `CoreContentContext` el consumix així:

```js
const data = useScopedResource(loadCoreContent, actorId, scopeKey, config);
const value = useMemo(() => { … }, [data]);   // ← `data` canvia d'identitat sempre
```

- **Conseqüència:** el `useMemo` es recalcula en **tots** els renders. `value` és sempre un objecte nou, per tant **tots els consumidors de `useCoreContent()` es re-renderitzen en cada render del proveïdor**, encara que les dades no hagen canviat gens. El `useMemo` és decoratiu: dóna la sensació d'optimització sense fer-ne cap.
- **Amplificació:** dins d'eixe memo inútil hi ha `pageCopy: (data.payload.pages || []).reduce((acc, p) => ({ ...acc, [p.id]: { ...p } }), {})`, que és un *spread* dins d'un `reduce`: **O(n²)** en nombre de pàgines, recalculat en cada render. Amb poques pàgines no es nota. Amb el catàleg real de Sollutia, i en un telèfon vell al bancal, sí.
- **Severitat: alta en cost, zero en visibilitat.** No trenca res; fa que tot vaja més lent sense motiu i sense símptoma diagnosticable. És la forma més caríssima de deute: la que no es queixa.
- **Proposta conservadora:** estabilitzar la referència dins de `useScopedResource` (memoïtzar l'objecte retornat sobre `[state, token, refresh]`) i, per separat, canviar el `reduce` per `Object.fromEntries(pages.map(p => [p.id, { ...p }]))`. Cap canvi de comportament observable. Compleix la Llei del Píxel.

---

### P1-6 · Dos `<h1>` en cada document de la Wiki.

- **Fitxers:** `src/components/universal/PageFrame.jsx:289` i `src/sections/wiki-de-poble/WikiDePobleSection.jsx:31`
- **Mecanisme:** `PageFrame` pinta `<h1>{title}</h1>` dins de `<header className="page-title">`. Tot seguit, `parseMarkdown` converteix `^# (.*)$` en `<h1>$1</h1>` **dins** de `<article className="content-wrapper">`. Com que pràcticament tot document de la Wiki comença amb `# Títol` (AGENTS.md, `02_genotip.md`, les skills…), cada fitxa servix **dos H1**.
- **Evidència creuada:** `npm run porta:design-guard` → `DEUTE PUJA · h1-outside-header: 1 → 2`.
- **Jerarquia real que rep el rastrejador:** `h1` (títol) → `h2` (subtítol) → **`h1`** (contingut) → `h2`, `h3`… El salt cap arrere invalida l'arbre de capçaleres per a lectors de pantalla i per al rastrejador alhora. És la dimensió 3 del prompt, i és un defecte real, no estilístic.
- **Proposta conservadora:** a `parseMarkdown`, degradar `# ` a `<h2>` i desplaçar la resta un nivell, **o** no pintar el `<h1>` de `PageFrame` quan el contingut ja en porta un. La primera opció és menys invasiva i no toca cap altra secció. **Altera l'aparença** (la mida del títol dins del cos): decisió del Mestre.
- `requires_human_decision: true`

---

### P1-7 · L'avatar d'OAuth es pinta sense passar pel filtre d'origen que el projecte ja té escrit.

- **Fitxer:** `src/app/App.jsx:422-424`

```js
const avatar = currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url
            || currentUser?.user_metadata?.picture;
if (currentUser && avatar) {
  return <img src={avatar} alt={…} className="sdp-avatar__imatge" />;
}
```

- **Font de veritat en conflicte:** Constitució punt 6 («Zero Rastres: prohibició total de… qualsevol eina que mercantilitze l'atenció del poble») i el propi `src/utils/sanitize.js:37-50`, que per a l'HTML **sí** fa exactament esta feina: comprova `esFontImatgeSegura(src)`, buida el `src` si no és d'un origen permés i força `referrerpolicy="no-referrer"`.
- **El defecte és d'asimetria:** la política existix, està ben escrita i té la seua llista d'orígens (`origensMitjans`: Google, Facebook, GitHub). Però **només s'aplica al camí que passa per DOMPurify**. El camí de JSX no la travessa. La mateixa regla val o no val segons per on entra el píxel.
- **Vector concret:** `user_metadata` en Supabase és, en la configuració per defecte, **escrivible per l'usuari propietari**. Un usuari pot posar-se un `avatar_url` cap a un servidor seu; cada visitant del seu perfil li fa una petició amb `Referer` i IP. És un far de tercers plantat dins d'una casa que ha declarat la guerra als fars de tercers.
- **Severitat: mitjana-alta.** No és robatori de sessió; és seguiment, i el seguiment és precisament el que esta Constitució prohibix pel seu nom.
- **Proposta conservadora:** passar `avatar` per `esFontImatgeSegura()` abans de pintar-lo i afegir `referrerpolicy="no-referrer"` a l'`<img>`. Si no passa el filtre, caure al `sdp-avatar-placeholder` que ja existix a la línia 428. Visualment idèntic per a tots els avatars legítims.

---

### P2-8 · L'aïllament d'errors té dos nivells i li falta el del mig.

- **Fitxers:** `src/PedraSecaEmbed.jsx:57` i `src/app/App.jsx:482-516`
- **Rectificació d'una lectura precipitada meua, que deixe escrita en compte d'esborrar-la:** la meua primera impressió va ser que els proveïdors quedaven **sense** boundary. És fals. `PedraSecaEmbed` embolica tot l'arbre amb `<ErrorBoundary>` a la línia 57. Hi ha xarxa.
- **La troballa real, ja verificada, és una altra:** hi ha un boundary **global** (PedraSecaEmbed) i un boundary **de ruta** (`RouteErrorBoundary`, `App.jsx:512`), i els cinc proveïdors de dades viuen **entre els dos**:

```
ErrorBoundary  (global — tomba tota l'app)
 └ SessionProvider → IdentitatProvider → App
    └ CoreContentProvider → MurProvider → NotesDataProvider
       → XatProvider → MultimediaProvider     ← ací no hi ha cap xarxa intermèdia
        └ RouteErrorBoundary  (només protegix les rutes)
           └ AppRoutes
```

- **Conseqüència:** un error dins de `MultimediaProvider` —una secció secundària— no degrada Multimèdia: **cau al boundary global i s'emporta Xat, Mur, Notes i la navegació sencera**. El comentari d'`AppDataLoader` (`App.jsx:502-504`) diu explícitament que es va llevar el bloqueig global «per a mantindre l'accessibilitat a les seccions independents». Eixa intenció està escrita, però l'arbre de boundaries no la sosté.
- **Camí real que ho dispara:** `sessionService.js:36-38` llança `'Dos instàncies no poden compartir una sessió amb configuracions diferents.'` des d'un `useEffect` (`SessionContext.jsx:17`). Dos `<soc-de-poble>` a la mateixa pàgina amb configuració distinta —cas que `PedraSecaEmbed` documenta com a **suportat** al comentari P0-6— apaguen l'aplicació sencera.
- **Proposta conservadora:** un `ErrorBoundary` per proveïdor de secció, o com a mínim un que embolique el bloc `MurProvider…MultimediaProvider` per damunt d'`AppDataLoader`.

---

### P2-9 · L'ESLint i el Design Guard no tenen la mateixa definició de «Tailwind visual».

- **Fitxers:** `eslint.config.js:42` enfront de l'eixida de `tooling/gates/design_guard.mjs`
- **Evidència:** el selector d'ESLint caça `p-[0-9]`, `bg-[a-z]+-[0-9]+`, `text-[a-z]+-[0-9]+`, `rounded`, `shadow`. Les 15 infraccions que el Design Guard declara **llei dura** són `sdp-text-centrat`, `sdp-bg-alt`, `sdp-border-soft`, `sdp-p-m`, `sdp-text-brand`, `sdp-text-mut`. **Cap casa amb el regex d'ESLint**: `-m`, `-alt`, `-soft`, `-brand` i `-mut` no són dígits.
- **Conseqüència:** dos autoritats vigilen la mateixa llei amb definicions incompatibles. Un agent que passa l'ESLint creu legítimament que complix la Pedra Seca; el Design Guard diu que no. Com que el Design Guard viu darrere de la porta 3, **guanya sempre la definició equivocada**.
- **Severitat: mitjana, però estructural.** És deute de governança, no de codi. Cal una sola font de veritat del vocabulari prohibit, llegida pels dos.

---

### P2-10 · La plantilla canònica d'auditoria conté un enllaç trencat i un TODO.

- **Evidència reproduïble:** `document.mjs context --route auditoria` retorna, literalment, dins del cos de la plantilla:

```
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
```

- **Conseqüència:** **tot** document generat des d'esta ruta hereta un enllaç trencat i un TODO, i alimenta després la porta d'orfandat que els compta. El sistema es fabrica la seua pròpia brossa i tot seguit l'enxampa. Este mateix informe l'ha hagut d'ometre a mà per no propagar-lo.
- **Severitat: mitjana.** Cost de reparació baix, efecte recurrent i creixent.

---

### P2-11 · Accés directe a `localStorage` fora de l'encapsulació.

- **Fitxer:** `src/sections/disseny/cataleg/detailRegistry.jsx:8, 16, 20`
- **Evidència:** `npm run porta:persistencia` → `L2 · localStorage encapsulat ❌ 3 infraccions`. Les altres tres lleis (L1, L3, L4) passen.
- **Font en conflicte:** la pròpia porta: «cap migració a IndexedDB podrà atrapar esta crida».

---

### P2-12 · Graf documental: 14 enllaços trencats, 5 orfes, 6 documents sense ancorar.

- **Evidència:** `npm run porta:orfandat` → exit 1; `npm run porta:scc` → `valid: false` amb 38 errors.
- **Detall rellevant:** els sis enllaços trencats de `00_index_escriptori.md` apunten a documents del torn anterior que **ja són a `90_arxiu_historic/`**. L'arxivat es va fer; el reenllaçat no. I cinc actes de `10_actes/` no tenen cap enllaç entrant.
- **Cas especial que cal separar i no barrejar amb la resta:** `04_escriptori/01_produccio/` té cinc fitxers no ancorats (`gestoria_*.jsx`, `generador_sitemap.mjs`). És **zona humana**: AGENTS §12 els subjecta a ancoratge obligatori però prohibix a la IA tocar-los. **Cap agent pot tancar esta troballa**; només el Mestre. Mentre estiga oberta, `porta:scc` no tornarà a verd i cap torn arribarà a `closed`. Això no és un defecte de ningú: és una regla sense canal d'execució.
- `requires_human_decision: true`

---

### P1-15 · El Pla d'Implementació d'esta mateixa reunió és un document invàlid segons el contracte.

Esta troballa m'incomoda escriure-la, perquè assenyala la pissarra on estem escrivint tots. La deixe igualment.

- **Fitxer:** `_wiki_de_poble/04_escriptori/260924_0245_pla_implementacio_fortificacio.md`
- **Evidència reproduïble:** `node tooling/gates/tancament.mjs --check --turn-id <torn>` retorna tres errors sobre eixe fitxer:

```
reflex: cal un rebut persistent emés per document.mjs context
frontmatter.type: fora de l'enum
Document sense àncora
```

- **Mecanisme:** el pla porta `type: pla_implementacio` al frontmatter. **Eixe valor no existix a l'enum de `tooling/wiki/schema.json`.** A més, es va escriure sense passar per `document.mjs context`, per la qual cosa no té rebut, i no està ancorat a `00_index_escriptori.md`, per la qual cosa `porta:scc` el declara `ORPHAN_OPERATIVE`.
- **Font de veritat en conflicte:** AGENTS §0 (REGLA 0, acte reflex pre-prompt), `wiki-cicle-de-vida` passos 2 i 4.
- **Per què és P1 i no una nota a peu de pàgina:** cap torn d'esta sessió podrà arribar mai a `closed` mentre eixe fitxer estiga així, perquè `tancament.mjs` el revisa i falla. El mateix document que havia de coordinar la reunió és el que bloqueja el tancament de la reunió.
- **El patró és més gran que el cas:** el Protocol de l'Olivera **exigix** un Pla d'Implementació (skill `wiki-documentacio-i-reflex`, lliçó del 260923), però la ruta `pla.implementacio` produïx un `type` que l'esquema rebutja. Seguir la doctrina al peu de la lletra genera un document invàlid. Això no és un descuit de qui va escriure el pla: és una **contradicció entre dues fonts de veritat** que continuarà repetint-se en cada reunió fins que s'alinee l'enum amb la ruta.
- **Proposta conservadora:** afegir `pla_implementacio` a l'enum de `schema.json`, o canviar la ruta perquè emeta un `type` admés. Decidir quina de les dues és feina del Mestre, no meua: és ell qui sap quina de les dos fonts mana.
- `requires_human_decision: true`

---

### P2-16 · Una part del cens d'orfandat són falsos positius. Cal separar-los abans de comptar.

Si no dic açò, les xifres de P2-12 s'inflen i algú dedicarà hores a perseguir fantasmes.

- **Evidència:** `tancament.mjs --check` declara, entre d'altres:

```
❌ Enllaç trencat a 00_index: el destí '00_index_escriptori' no existeix ni entre els vius ni a l'arxiu.
❌ Enllaç trencat a 02_genotip: el destí 'AGENTS' no existeix ni entre els vius ni a l'arxiu.
❌ Enllaç trencat a 00_index_identitat: el destí 'AGENTS' no existeix ni entre els vius ni a l'arxiu.
```

- **Refutació:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md` **existix** —l'he llegit sencer en esta sessió— i `AGENTS.md` **existix** a l'arrel del repositori. Cap dels tres enllaços està trencat de veres.
- **Diagnòstic:** el teixidor no resol destins que viuen **fora de `_wiki_de_poble/`** (cas d'`AGENTS.md`, a l'arrel) i té un problema de resolució amb l'índex de l'Escriptori. Són falsos positius del comptador, no deute documental.
- **Conseqüència operativa:** el recompte de «enllaços trencats» barreja tres coses distintes: enllaços realment morts (els sis de l'Escriptori que apunten a `90_arxiu_historic/`, que sí són reals), àncores que la pròpia doctrina obliga a posar, i destins que existixen però que el teixidor no sap resoldre. **Fins que no es separen, la porta d'orfandat no és accionable: només fa por.**
- **Proposta conservadora:** classificar l'eixida del teixidor per causa (mort / fora d'abast / no resolt) abans de tocar cap enllaç. No esborrar cap enllaç per a fer callar el comptador.

---

### P3-13 · Dependència congelada sense declarar-ho.

- **Fitxer:** `src/PedraSecaEmbed.jsx:44`

```js
const isMemory = React.useMemo(() => config.routerType === 'memory' || isFirstInstance === false, []);
```

Llig `config.routerType` i `isFirstInstance` amb l'array de dependències **buit**. Probablement és deliberat (canviar de tipus de router en calent destruiria l'estat de navegació), però no hi ha ni comentari ni `eslint-disable`, a diferència d'`App.jsx:466`, on sí que se'n posa un d'explícit.

**Contradicció que no he pogut resoldre en este torn:** `eslint.config.js:35` té `'react-hooks/exhaustive-deps': 'warn'` i `package.json:80` corre el lint amb `--max-warnings=0`. Si la regla s'aplica ací, **el lint hauria d'estar roig ara mateix**. No he pogut executar `npm run lint` (no és a la llista blanca del Reflex). Ho deixe declarat, no resolt. Que ningú ho llisca com una troballa confirmada.

---

### P3-14 · Doble font de veritat sobre la classe `sidebar-closed`.

- **Fitxer:** `src/app/App.jsx:148-155` i `:320`. React la posa via `className`; dos `useEffect` la posen i la lleven via `classList`. Hui no divergixen perquè llegixen la mateixa variable, però són dos mans damunt del mateix atribut, i això només s'aguanta mentre ningú toque cap de les dos.

---

### El que està ben fet, i ho dic amb la mateixa precisió

No done verds per silenci. Estos els he executat o llegit:

| Porta / prova | Resultat |
| --- | --- |
| `porta:rls` | ✅ Zero fantasmes i zero forats sobre 18 fitxers SQL |
| `porta:enxufe` | ✅ |
| `porta:frontera` (Sollutia) | ✅ |
| `porta:cens` (skills) | ✅ |
| `porta:tdz` | ✅ |
| `porta:atomic` | ✅ |
| `porta:58px` | ✅ |
| `porta:plantilles` | ✅ 13 rutes coherents |
| `porta:autoritat` | ✅ `valid: true` |
| `npm test` | ✅ **103/103** en 28 fitxers, 10,15 s |

I tres peces de codi millors que la mitjana del que es veu en projectes amb pressupost:

1. **`src/utils/sanitize.js`** — el ganxo de DOMPurify s'arma **en carregar el mòdul**, no dins de la funció, amb el raonament escrit al costat: un control de seguretat no pot dependre de l'ordre de renderitzat. Això és pensament de segon ordre.
2. **`sanejaConfig()` a `PedraSecaEmbed.jsx:160-217`** — allowlist estricta d'orígens, bloqueig explícit de `//` protocol-relative, sense comodins de `supabase.co`, i un advertiment de seguretat escrit a la línia 135 sobre qui pot tocar `supabase-url`. És exactament la peça que un atacant intentaria doblegar, i està tancada.
3. **Els comentaris forenses de `PedraSecaEmbed.jsx`** (P0-1 a P0-8). Cada un explica el defecte, per què va passar i quina premissa falsa el sostenia. És memòria institucional dins del codi, i val més que molta documentació.

---

### Veredicte per al Mestre

Em demanes una nota i una opinió honesta. La plantilla em diu que no assigne puntuacions inventades; te la done igual perquè me la demanes tu, però et dic com la calcule i on pot fallar.

**7 sobre 10.**

**Què és això que heu construït.** Has fet una cosa que, sent dissenyador gràfic, no havies d'haver pogut fer: un sistema amb **48 portes automàtiques, 103 proves i una constitució executable**. Això no és normal. La major part de projectes amb equip i finançament no tenen ni una tercera part d'esta disciplina. El tractor cromàtic que mesura si un comentari sobre contrast diu la veritat no l'he vist mai en cap altre repositori. Ni una vegada. Això que sents no és síndrome de l'impostor: és que has construït una cosa rara i bona i no tens amb què comparar-la, perquè no hi ha amb què.

**Per què 7 i no 9.** Perquè el valor d'una porta no és existir, és **executar-se**. Ara mateix en tens 48 i se n'executen 3. La distància entre el 7 i el 9 no és construir res nou: és **encendre el que ja tens**. Quan he executat les portes a mà —una cosa que la cadena hauria de fer sola— han eixit de seguida un botó per davall d'AA, dos lleis dures trencades, deute pujant en quatre categories i un `innerHTML` sense sanejar. Cap d'eixes troballes és profunda. Totes eren visibles per a la maquinària que ja tens escrita. El sistema **sabia** tot açò i no ho podia dir.

**Per què no 5.** Perquè quan he anat a buscar els forats de veritat —els que et poden fer mal— les portes importants estaven tancades. RLS net sobre 18 fitxers SQL. `sanejaConfig` amb allowlist estricta. El ganxo de DOMPurify armat en carregar el mòdul. Eixes tres peces són les que decidixen si un projecte és segur o no, i estan ben fetes, amb el raonament escrit al costat. La casa està ben construïda; el que passa és que el vigilant fa temps que es va quedar adormit a la porta 3.

**El diagnòstic en una frase:** el teu problema no és de qualitat de codi. És que **la qualitat no es mesura des de fa temps i ningú se n'havia adonat, perquè el sistema d'avís és precisament el que està apagat.**

**Per on començaria, en este ordre:**

1. **Mirar `core-edicio-segura/SKILL.md`, decidir si el canvi era volgut, resegellar i executar la cadena sencera.** Fins que no sàpigues l'estat real de les 45 portes restants, qualsevol pla és endevinar. No altera ni un píxel. És **un fitxer**: eixe és tot el que separa el projecte de recuperar la seua pròpia vista.
2. **P0-2, el contrast del botó.** És l'única troballa que li fa mal a una persona de veritat, hui, al bancal.
3. **P1-4, P1-5 i P1-7:** tres canvis quirúrgics, sense efecte visual, que tanquen un risc latent, una fuita de rendiment i un far de tercers.
4. **P1-6, el doble H1:** espera a tindre pla. Toca píxels.

**Sobre pujar a models de raonament més potents.** El coll d'ampolla d'este projecte no és la potència de càlcul de qui l'audita. Les catorze troballes d'ací dalt les ha donades **executar les portes que ja tens escrites**, no raonar més fort. Un model més potent amb la cadena aturada tornarà a trobar exactament això mateix. Encén la cadena primer; després paga el raonament car per al que quede.

**Millora del format del prompt, com demana el punt 4 del Protocol de l'Olivera.** `prompt_local.md` hauria d'exigir al destinatari una **línia d'estat de la cadena de portes al principi de l'informe**: quantes n'ha executades, quantes han passat, quantes no ha pogut executar i per què. Les tres caselles de la secció 0 verifiquen la higiene de qui **escriu** la petorreta; no hi ha cap casella que òbligue qui **respon** a declarar sobre quanta maquinària real ha passat. Sense eixa línia, un informe que ha executat 3 portes i un que n'ha executat 48 s'assemblen massa.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Portes executades individualment (14 de 48):** `porta` (cadena), `design-guard`, `tdz`, `rls`, `innerhtml`, `enxufe`, `frontera`, `cens`, `orfandat`, `atomic`, `scc`, `persistencia`, `cromatic`, `58px`.
- **Proves:** `npm test` → 28 fitxers, 103 proves, exit 0, 10,15 s.
- **Cicle documental complet:** torn obert (`obrir_torn.mjs`), plantilla llegida íntegra (`document.mjs context`), esborrany creat amb rebut persistent (`document.mjs create`), document validat contra el contracte (`document.mjs check` → `valid: true, errors: []`) i tancament comprovat en mode lectura (`tancament.mjs --check`).
- **Estat del tancament, declarat sense maquillar:** `valid: false`. Passen `plantilles`, `autoritat` i `ledger`; fallen `segell` (exit 1), `skills` (exit 2), `wiki` (exit 1) i `scc` (exit 1). **Cap d'eixos quatre fracassos l'ha causat este torn**: són el deute heretat que descriuen P0-1, P1-15, P2-12 i P2-16. El meu document valida; el que no valida és l'arbre on l'he deixat. Ho dic explícitament perquè ningú puga llegir un verd on no n'hi ha.
- **Lectura directa de:** `App.jsx`, `PedraSecaEmbed.jsx`, `main.jsx`, `PageFrame.jsx`, `UniversalPage.jsx`, `SessionContext.jsx`, `CoreContentContext.jsx`, `useScopedResource.js`, `sessionService.js`, `sanitize.js`, `WikiDePobleSection.jsx`, `DesignSection.jsx`, `pageContent.js`, `eslint.config.js`, `package.json`, `hooks-local.mjs`, `mutation-policy.mjs`.
- Tota troballa porta fitxer, línia i ordre reproduïble.
- Les dues troballes que he hagut de rectificar durant l'auditoria (P1-4, sobre la severitat real de l'`innerHTML`; i P2-8, sobre l'existència del boundary global) porten la rectificació **escrita dins del cos**, no esborrada. Una auditoria que amaga els seus propis girs no es pot auditar.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **No he executat 34 de les 48 portes.** Les catorze que he triat cobrixen les quatre dimensions del prompt. La resta continua sense notícies, i això forma part de la troballa P0-1, no de la seua solució.
2. **No he pogut executar `npm run lint`** ni cap shell composta: el Reflex confina esta sessió (`mutation-policy.mjs:20-39`). P3-13 queda declarat, no resolt.
3. **No he tocat `90_arxiu_historic/`** (AGENTS §5) ni cap fitxer de `04_escriptori/01_produccio/` (AGENTS §12).
4. **No he modificat cap línia de codi de producte.** El prompt ho prohibix expressament i ho he complit. L'única escriptura d'este torn és este document.
5. **No he verificat res en navegador.** Les troballes visuals (P0-2, P1-6) vénen de tractors i de lectura de codi, no de mesura en pantalla. El contrast de 3,87:1 el calcula `tractor-cromatic.mjs`; recomane confirmar-lo amb una mesura independent abans de tocar el token.
6. **El backend real de Sollutia no existix encara.** Tot el que dic sobre la frontera d'autenticació és sobre el codi que l'espera, no sobre la integració.
7. **No he pogut escriure el relleu a `.agents/ESTAT.md` ni a `.agents/LEDGER.md`**, com exigix AGENTS §4. `tooling/gates/mutation-policy.mjs:14` classifica `.agents/` com a ruta de governança i exigix `executor-mutacio.mjs` amb lease, que este torn no té. `tancament.mjs --check` ho reporta correctament com a «falta el relleu d'aquest torn». **El torn queda obert i el relleu pendent**: ho ha de fer la IAIA MarIA o el Mestre amb lease. No ho considere un defecte del sistema, sinó el sistema funcionant: un agent local no ha de poder escriure el Llibre d'Obra tot sol.
8. **No hi havia auditoria de Codex a l'Escriptori** en el moment del tall. Este informe no ha pogut criticar ni aprofitar cap treball company, com demana el Protocol de l'Olivera. Si Codex arriba després, té autoritat total per a rebatre'm, i especialment P1-5 i P2-8, que són les dues conclusions que depenen més de la meua lectura i menys d'una porta.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
