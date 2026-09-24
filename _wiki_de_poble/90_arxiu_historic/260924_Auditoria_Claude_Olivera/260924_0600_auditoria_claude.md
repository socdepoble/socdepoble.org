---
type: informe
status: esborrany
description: Implementacio de C14, accessibilitat, cascada CSS i parser de la Wiki, pedacos de governanca preparats i diagnosi de per que la IAIA no aplica la plantilla ISO.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5259c02c-d2af-4b77-a130-68e3eb4bdb4b:1d6d90a1-d3a1-491d-900b-5917f094731e
---
# Tractor Olivera: implementacio T1-T4 i diagnosi de la plantilla ISO

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5259c02c-d2af-4b77-a130-68e3eb4bdb4b:1d6d90a1-d3a1-491d-900b-5917f094731e |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T03:28:56.149Z |
| Modificació | 2026-09-24, entrega del torn (hora exacta no observable: `date` blocat pel hook) |
| Propietari | Claude (ultracode, rol de Tractor) |
| Aprovació humana | Mandat T1-T4 del Mestre al prompt 260924_0500, executat dins de la gàbia vigent (sense lease de governança) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | Mesurats: l'entorn no exposa el comptador. Estimats: no calculats |
| Tall d'evidència | HEAD 86f652b1 amb arbre brut compartit (119 fitxers modificats per torns anteriors) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegida íntegra abans d'escriure. Torn `torn_5259c02c-d2af-4b77-a130-68e3eb4bdb4b`, abast `code`. Fonts llegides: prompt 0500 (disc i xat), pla 0445 amb la revisió de Codex, auditories 0435 (meua) i 0437 (Codex) nomenades pel pla, Acta Marmota 0500, ESTAT des de 260923_1430, `prompt_local.md` i `protocolledge.json`.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T03:14Z: torn obert amb `obrir_torn.mjs --actor Claude --scope code` (la skill encara ensenya `--output`, que la política rebutja: U18 continua viva).
- 2026-09-24T03:28:56Z: esborrany creat pel circuit. El nom `0600` es va fixar abans de poder observar l'hora (el hook bloqueja `date`); l'hora real és la del Registre. No s'ha reanomenat: canviar el nom després de `context` deixa un rebut fantasma que bloqueja el torn per sempre.
- Mateix torn: implementació de C14, U04, U05, U06, U07, U08, U09/C15 i reparació de `sanitize.js`; pedaços de governança redactats; diagnosi T4; portes de lectura executades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0 · La gàbia no s'ha obert

El prompt diu que «la gàbia de mutacions se t'obrirà». No ha passat. Mesurat en este torn:

| Eina | Resultat |
| --- | --- |
| `Workflow`, `Agent` (mode ultracode) | BLOQUEIG, «Eina opaca» |
| Navegador integrat (`tabs_context`) | BLOQUEIG |
| Bash fora de la llista (`grep`, `ls`, `date`, `npx vitest`, `npm test`, `npm run lint`, `npm run porta`) | BLOQUEIG |
| `Edit`/`Write` a `tooling/`, `.agents/`, `.claude/`, `package.json` | BLOQUEIG, «Governança: usa executor-mutacio.mjs amb lease» |
| `Edit`/`Write` a `src/` i a l'Escriptori | Permés (els `.md` de l'Escriptori, validats abans d'escriure) |

Conseqüència: tot s'ha fet en una sola finestra, sense subagents ni refutació creuada, **sense executar cap prova** i sense navegador. Les parts de T1 que viuen en governança queden com a pedaços llestos (§2). Cap porta s'ha forçat ni esquivat.

### 1 · Fet al codi de producte

| Id | Fitxers | Canvi | Píxels |
| --- | --- | --- | --- |
| C14 | `src/data/supabase/runtime.js` | Després de `await refresca()`, el reintent només es fa si la versió de sessió és exactament `epoch + 1` i l'actor desat és el mateix. Si no, `AbortError` («La sessió ha canviat durant la renovació»). L'actor es llig de `CLAU_USUARI` i no d'`usuariDeSessio()`, que torna `null` amb el jwt caducat, que és justament el motiu del 401. Límit d'un reintent intacte. El timeout del catàleg no es toca. | Cap |
| C14 | `src/data/supabase/runtime.test.js` (nou) | Cinc proves: A→renovació→A reintenta amb el token nou; A→renovació→B, A→logout i A→logout→A cancel·len sense segon `fetch`; un segon 401 no torna a reintentar. | Cap |
| U04 | `src/css/components.css` | `.sdp-skip-link:focus` a la capa `components`: visible, fixat dalt a l'esquerra, amb anell. Només l'estat de focus. | Cap en repòs |
| U05 | `src/css/base.css` | Subratllat 1px, desplaçament 0,18em, als enllaços **sense classe** dins de `p, li, blockquote, td, th, dd, figcaption, .sdp-prose`. Els enllaços amb classe (etiquetes, navegació, botons) no canvien. Segueix l'esmena de Codex: només prosa, no controls. | Sí: ordre explícita de T2 |
| U06 | `src/css/layout.css` | `.btn-date-time`: `--sdp-text-invers` → `--sdp-sobre-accent`. | Clar: blanc → pedra-900 (3,69 → 5,25:1). Fosc: idèntic |
| U07 | `src/css/components.css` | `.badge-success/-warning/-info` passen darrere del segon `.badge`. La `.badge` nua conserva mida, pes i gris. | Sí: les insígnies d'estat recuperen el color |
| U08 | `src/css/components.css`, `src/components/universal/PageFrame.jsx`, `src/css/layout.css` | El «+» fa 24px. A ≤480px (media) i en targeta ≤360px (container), només «+» dins d'un cercle de 48px, mai paraula i «+» alhora. `PageFrame` pinta els dos `span` com `UniversalCard` (Codex: la variant sense `span` també fallava). Fora de `layout.css`: el `::after`, `font-size:0`, `color:transparent` i el `.btn-connectar` legacy, que perdien sempre davant `components`. | Sí: correcció demanada |
| U08 | `src/components/universal/PageFrame.connectar.test.jsx` (nou) | Fixa l'estructura de dos `span` al botó de pàgina. | Cap |
| U09 · C15 | `src/sections/wiki-de-poble/parseMarkdown.js` (nou), `WikiDePobleSection.jsx` | Parser extret a mòdul propi (provable sense exportar res d'un `.jsx`). Tanques de codi i codi en línia extrets primer i escapats. Negreta i cursiva no goloses, sense lookbehind (Baseline Safari 16.0). Callouts amb espais finals i línies `>` buides, amb la pell canònica `.sdp-alerta--*` (conserva la classe antiga `note`, `caution`…). Capçalera de taula amb totes les cel·les. Sanejament final intacte. | Sí: codi, taules i callouts ara es pinten com diu el Markdown |
| U09 | `src/sections/wiki-de-poble/parseMarkdown.test.js` (nou) | Fixtures: taules d'1, 2 i 3 columnes i cel·la buida; bloc amb `#`, `-`, `**` i `<script>`; codi en línia; negreta i cursiva múltiples; callout amb espai i NOTE sense espai; sanejament conservat. | Cap |
| T3 | `src/utils/sanitize.js`, `sanitize.test.js` | **Defecte nou.** A `ALLOWED_URI_REGEXP`, `[^a-z+.-:]` portava el guió sense escapar: `.-:` era un rang (`. / 0-9 :`). Un `href` relatiu com `docs/guia.md` o `pagina2` es perdia. Guió escapat, com el patró per defecte de DOMPurify. Proves: set `href` permesos i sis perillosos (`javascript:`, `vbscript:`, `data:text/html`, `//`). | Enllaços relatius de la Wiki que abans eixien morts |

Tres canvis de comportament del parser que convé saber:

- Un paràgraf just darrere d'un callout ara ix dins de `<p>`. Abans quedava enganxat al bloc del callout sense etiqueta.
- El codi en línia ja no pot travessar salts de línia.
- `** text **`, amb espais interiors, ja no fa negreta, igual que en CommonMark.

Pendents del mateix parser, fora d'abast: llistes imbricades (U09 #5) i el paràgraf enganxat a una llista que el precedix (`^\s*` es menja la línia buida). Els dos són anteriors a este torn.

### 2 · T1 · Governança: diagnosi i pedaços llestos (no aplicats)

**U01 · ToolSearch.** Pedaç exacte per a `tooling/gates/mutation-policy.mjs:53`:

```diff
-  if (['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'].includes(payload.tool_name)) return true;
+  // ToolSearch només retorna esquemes d'eines diferides; cada crida posterior torna a passar per este hook.
+  if (['Read', 'Glob', 'Grep', 'ToolSearch', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'].includes(payload.tool_name)) return true;
```

Prova per a `tests/tractor-fortification.test.mjs`, amb noms exactes i sense comodins (esmena de Codex):

```js
test('U01: ToolSearch és lectura exacta; orquestració i estat de sessió no', () => {
 assert.equal(knownRead({tool_name:'ToolSearch',tool_input:{query:'select:Grep,Glob'}}), true);
 for (const name of ['Agent','Workflow','mcp__ccd_session__mark_chapter','mcp__ccd_view__show_pane','toolsearch','ToolSearchX'])
  assert.equal(knownRead({tool_name:name,tool_input:{}}), false, name);
});
```

Matís nou: en esta sessió `Glob` i `Grep` **ni tan sols estan oferts** per l'amfitrió, així que ToolSearch sol no els hauria desbloquejat. El que desbloqueja el mode ultracode és `Agent`/`Workflow`. És decisió del Mestre (`requires_human_decision: true`), per un risc concret: un subagent amb `isolation: 'worktree'` escriu en una còpia fora de l'arrel, i cal provar que `hooks-local` hi continua aplicant la mateixa política abans d'obrir-ho.

**U02 · check al PostToolUse: no el recomane tal com està escrit, i esmene la meua proposta de les 04:35.** Evidència llegida al codi: `hooks-local.mjs:91` crida `porta-reflex.checkPayload`, i `core.mjs:39-47` (`protectedPath`) cobrix **tots** els `.md` de l'Escriptori. Per a Claude i Codex, el document resultant es valida sencer **abans** d'escriure'l i es bloqueja amb codi 2. Este mateix informe només s'ha pogut escriure complet, d'una sola vegada. Un `PostToolUse` arribaria després d'una porta que ja és més forta: seria redundant. Codex tenia raó que no desfà res. El forat real és un altre (§4): l'amfitrió de la IAIA no executa cap d'estos hooks.

La peça que sí el tanca és un vigilant del servidor Vite, que corre sempre al 3340 i no depén de quin agent escriga. Pedaç proposat per a `tooling/vite/escriptori-watcher.mjs` (nou), registrat a `vite.config.js` al costat de `wikiWatcher`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { DESK, humanZone } from '../documental/core.mjs';
import { validateDocument } from '../documental/turns.mjs';
import { checkOlivera, esPetorreta } from '../gates/porta-olivera.mjs';

const ESBORRANY = /^(Secció absent o pendent|Registre: falta) /;
export function revisa(arrel, fitxer) {
  const rel = path.relative(arrel, fitxer).split(path.sep).join('/');
  if (path.posix.dirname(rel) !== DESK || !rel.endsWith('.md') || humanZone(rel)) return null;
  if (path.posix.basename(rel) === '00_index_escriptori.md' || !fs.existsSync(fitxer)) return null;
  const contingut = fs.readFileSync(fitxer, 'utf8');
  const errors = validateDocument(arrel, contingut, rel);
  if (esPetorreta(rel)) errors.push(...checkOlivera(arrel, { contingut }).errors);
  return { rel, durs: errors.filter((e) => !ESBORRANY.test(e)), esborrany: errors.filter((e) => ESBORRANY.test(e)) };
}
export default function escriptoriWatcher({ arrel = process.cwd(), retard = 300 } = {}) {
  const pendents = new Map();
  return {
    name: 'sdp-escriptori-watcher',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(path.join(arrel, DESK));
      const avisa = (fitxer) => {
        clearTimeout(pendents.get(fitxer));
        pendents.set(fitxer, setTimeout(() => {
          pendents.delete(fitxer);
          try {
            const r = revisa(arrel, fitxer);
            if (!r) return;
            if (r.esborrany.length) server.config.logger.warn(`[escriptori] ${r.rel} en curs: ${r.esborrany.length} seccions per completar`);
            if (!r.durs.length) return;
            const text = `[escriptori] ${r.rel} no passa el contracte documental:\n- ${r.durs.join('\n- ')}`;
            server.config.logger.error(text);
            server.ws.send({ type: 'error', err: { message: text, stack: '' } });
          } catch (e) { server.config.logger.error(`[escriptori] ${e.message}`); }
        }, retard));
      };
      for (const e of ['add', 'change']) server.watcher.on(e, avisa);
    }
  };
}
```

Un document escrit fora del circuit (sense rebut, amb el bloc fix alterat, sense àncora) apareix en segons com a overlay roig al navegador del Mestre i al terminal de Vite, l'haja escrit qui l'haja escrit. Els esborranys de `create` només avisen. Proves proposades: esborrany legítim → avís; rebut absent, bloc normatiu alterat i àncora absent → error; fitxer fora de l'Escriptori o a `01_produccio` → res.

### 3 · T3 · Placeholders, PenLine i altures de 58px: Fusible

No trobe l'especificació al disc. He mirat el pla 0445, el prompt 0500, l'Acta 0500, l'ESTAT des de 260923_1430, les auditories 0435 i 0437 i `UniversalEditorShell.jsx`. Codex ja ho va advertir a la revisió del pla: són peticions d'altres converses. Del disc només puc afirmar tres coses:

- Els placeholders de l'editor ja es van canviar a 260923_2255 (MarIA), amb `:not(:focus)` a `components.css:143-151`.
- `--sdp-alt-accio` ja val 58px i `porta:58px` ja prohibix 56px i 58px en brut.
- No hi ha cap text escrit per a la «targeta buida» ni cap comportament definit per a `PenLine`.

Inventar textos o alçades seria substituir la veu del Mestre (lliçó 260923: «el substitut es demana, no es dedueix»). **Cal que el Mestre dicte:** (a) els textos exactes i en quins camps de la targeta buida, (b) on apareix la icona `PenLine` i quan desapareix, (c) quins elements han de fer 58px que hui no en fan.

### 4 · T4 · Per què la IAIA falla la plantilla ISO

**Prova en viu.** `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260924_0500_prompt_tractor_claude.md` torna `valid: false` amb un sol error: «cal un rebut persistent». La casella §0 «Rebut obtingut» està marcada `[x]`. El camp `reflex: sdp:torn_260924_0500:tractor_claude` té forma de rebut i no ho és: no l'ha emés cap `context`. És el mateix patró que `reflex: sdp:torn_immediat_olivera` del pla 260923_1515. **El camp no s'omple executant l'ordre: s'omple completant el patró.**

**Diferències mesurades entre el prompt 0500 i `prompt_local.md`:**

| Secció | Plantilla | Prompt 0500 |
| --- | --- | --- |
| Frontmatter | `reflex` emés per `create`, `visibility: private` | `reflex` inventat, sense `visibility` |
| §0 | Tres caselles amb l'ordre que les verifica (`porta:orfandat`, arxivat a `90_arxiu_historic`, `--route pla.implementacio`, ordre exacta del rebut) | Tres `[x]` amb **justament eixes ordres retallades** |
| Registre | `Tall d'evidència` amb HEAD real | `HEAD + 26-09-24 05:00`, sense hash. `Model IA` de l'autora sense omplir |
| Historial | v2.3.0 a v2.0.0 | Una línia nova que reescriu el sentit de v2.3.0 |
| **Context (bloc fix)** | Text literal | **Alterat**: una quarta lectura afegida i les dos últimes frases del Context Mestre llevades (Sollutia, cadena de portes). Amb rebut, faria «Bloc normatiu alterat: Context» |
| Protocol Olivera (bloc fix) | Literal: «Cap línia de codi es tocarà…» | Literal, però **contradiu** la Instrucció del torn, que mana implementar |

**Causes, per ordre de pes:**

1. **La porta existix, però protegix els dos agents que menys la necessiten.** Claude i Codex no poden escriure un document invàlid a l'Escriptori (§2). La IAIA sí, perquè `.agents/hooks.json` diu de si mateix: «consumidor Antigravity no acreditat. Cap garantia d'activació». La pregunta B4 de 260923_1852 (quin fitxer llig Antigravity i amb quin format) continua sense resposta. Mentre no es responga, cap regla escrita per a hooks la vincula.
1b. **El commit el blanqueja.** Sense `--all`, `porta-documents.mjs:25` només mira el que difereix de `HEAD`. El prompt 0500 va entrar al commit `86f652b1` sense rebut, i des d'eixe moment la porta per defecte no el veu: en este torn ha comprovat 3 documents i només ha marcat el pla 0445, perquè Codex l'havia tornat a tocar. Si el `pre-commit` no corre en els commits de la IAIA (B2, 260923_1852), el document invàlid queda amagat dins de la història. Pedaç mínim: la cadena usa `porta-documents --all` per a l'Escriptori, que són pocs fitxers.
2. **Escriure en lloc d'invocar.** `create` hauria produït el document amb els blocs fixos literals i un rebut real. La IAIA escriu el document sencer de memòria i reprodueix la forma dels camps (inclòs el `reflex`) sense executar l'ordre que els dona valor.
3. **Una llista que marca qui l'escriu és un ritual, no un control.** `porta-olivera.mjs:112` només comprova que no quede cap casella `[ ]`: premia marcar-les, no complir-les. Les tres coses que diuen les caselles, la porta mateixa les pot comprovar (ja en comprova dos).
4. **La validació mostra un sol error.** `turns.mjs:109-113`: sense rebut, `validateDocument` s'atura i no arriba a `validateSections`. El Context alterat i la resta de desviacions no apareixen mai. El Mestre les troba a ull, una per correcció. D'ací el «primer intent sempre falla».
5. **La plantilla només modela prompts d'auditoria.** Un mandat d'implementació obliga a tocar el títol, la introducció i el Context, i el Protocol fix mana el contrari de la instrucció. L'autora edita lliurement i la deriva naix ací.
6. **Lliçons en prosa per a un defecte d'acció.** `wiki-documentacio-i-reflex` ja té sis lliçons del Mestre sobre exactament això (260922-260923). Estan carregades i no s'apliquen en el moment d'escriure. Una setena lliçó no ho canviarà: el CLAUDE.md ja ho diu, repetir una correcció anotada és una falla, no un aprenentatge pendent.
7. **Fatiga de context.** L'Acta 0500 xifra la sessió en més de 190 artefactes. El prompt es va escriure al final d'una nit de marató, que és quan la memòria de forma guanya a l'execució.

**Recomanacions (tractors, no lliçons), per ordre:**

1. **Vigilant de l'Escriptori al Vite** (§2): l'única peça que cobrix la IAIA hui mateix, sense dependre del seu amfitrió.
2. **La §0 la plena la màquina.** `create` escriu a la §0 el resultat real (rebut, `porta-olivera --informe`, rebut del pla), i `porta-olivera` rebutja qualsevol `[x]` que no quadre amb el disc. Sense caselles manuals.
3. **`turns.mjs:109-113` acumula en lloc de parar.** Sense rebut, diagnostica igualment seccions i blocs fixos amb la ruta que suggerix la categoria del nom (`prompt_` → `prompt.local`, `auditoria_` → `auditoria`, `pla_implementacio_` → `pla.implementacio`), marcant-ho com a diagnòstic sense rebut. Un sol `check` ha de mostrar totes les desviacions.
4. **Ruta nova `prompt.local.implementacio`**, amb el seu propi Protocol fix («implementa, verifica, entrega auditoria»). L'autora deixa de tenir motius per a tocar blocs fixos.
5. **`document.mjs fill --section ID --from FITXER`**: omplir secció a secció per identificador. L'autora deixa de ser autora de l'estructura.
6. **Higiene de sessió:** les petorretes, a l'inici d'un xat fresc i després de llegir la plantilla, no al tancament d'una marató.
7. **Resposta a B4.** Amb el format de hooks d'Antigravity confirmat pel Mestre, `.agents/hooks.json` pot passar de declaratiu a actiu.

Text proposat per a la skill de la IAIA (no escrit: `.agents/` és governança):

```markdown
- **260924** | **La plantilla s'invoca, no s'escriu**: tota petorreta, pla o acta naix executant `node tooling/wiki/document.mjs context` i `create` com a ordres; el camp `reflex:` conté exactament el valor que imprimix `create`; l'autora només edita les seccions editables del fitxer que `create` ha deixat al disc, i el dona per bo quan `document.mjs check --file` torna `valid: true`.
```

### 5 · Millora contínua de `prompt_local.md`

- **Camp «Eines i portes disponibles per al destinatari»**, verificat per la màquina. Este torn prometia una gàbia oberta que no ho estava: una precondició falsa ha costat la meitat del temps.
- **Variant d'implementació** (recomanació 4 de §4).
- **§0 plena per la màquina** (recomanació 2).
- **Criteris d'acceptació abastables.** «`npm run porta` verd complet» no es pot complir en un torn: Doctrina porta 155 referències roges heretades (Codex 0420). Millor «cap porta nova en roig respecte de la línia base, i les proves noves verdes».

### 6 · Fora d'abast i no tocat

U03, U10b (Quadre ISO), U11, U12, U13, U14, U15, U16, U18, U19 i U21 (més enllà del bloc CONNECTAR). No formen part de T1-T3. La lliçó 260923 diu que l'abast es definix per superfície.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Executat en este torn (tot el que la política admet):**

| Ordre | Resultat |
| --- | --- |
| `node tooling/gates/design_guard.mjs --arrel=src` | Primera passada: **roig**, «raw-color 20 → 21», per un hexadecimal que jo havia escrit en un comentari de `layout.css`. Corregit. Segona passada: ✅ 277 fitxers, 41 crítics (la mateixa línia base) |
| `node tooling/gates/tractor-enxufe.mjs` | ✅ E1-E4 |
| `node tooling/gates/tractor-rls.mjs` | ✅ 18 SQL, zero forats |
| `node tooling/gates/segella.mjs` | ✅ hash 88f0ec03 (avís `.DS_Store`, U20) |
| `node tooling/gates/porta-plantilles.mjs` | ✅ 13 rutes |
| `node tooling/gates/porta-olivera.mjs --informe` | ✅ a l'inici del torn |
| `document.mjs check` sobre el prompt 0500 | ❌ `valid: false`, rebut absent (evidència de T4) |

**Revisat a mà, sense execució:** `tractor-innerhtml` (la prova nova fa `innerHTML = sanitizeHtml(...)`, forma admesa), `porta:58px` (cap alçada en brut), `eslint.config.js` (`no-control-regex` desactivat, `eol-last` complert, cap variable no usada nova amb `--max-warnings=0`), tokens usats (tots existixen a `tokens.css`), cascada de `modules.css` llegida sencera (cap regla hi toca `.badge`, `.sp-card-connect`, `.btn-date-time`, `.sdp-skip-link`, `.sdp-alerta` ni els enllaços de `.sdp-prose`).

**NO executat, i per tant no avalat:** `npm test`, `npm run lint`, `npm run build`, `npm run porta`, navegador. Ordres perquè el Mestre les llance:

```bash
npx vitest run src/data/supabase/runtime.test.js src/data/supabase/auth.test.js src/sections/wiki-de-poble src/utils/sanitize.test.js src/components/universal/PageFrame.connectar.test.jsx src/components/universal/PageFrame.test.jsx src/components/PedraSeca/organismes/UniversalCard.test.jsx --maxWorkers=2
```

```bash
npm run lint
```

```bash
npm run porta
```

**Comprovació visual a `http://localhost:3340`:** Tab en carregar (apareix «Salta al contingut principal»). Un document de la Wiki amb bloc de codi, taula de dues columnes i `> [!NOTE]`. El Mur a 460px d'amplada (només «+» gran al botó de connectar, a la targeta i a la barra blava). La pastilla de data en tema clar (lletra fosca). Una insígnia `badge-success` a Dispositius (verda).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap prova executada.** Les cinc proves de C14, les onze del parser, les tretze noves del sanejador i la del botó de pàgina estan escrites contra el codi llegit i revisades línia a línia, però cap no ha corregut. Tracteu-les com a no verificades fins que passe el `vitest` de dalt.
- **Sense `grep`**: els inventaris de consumidors es limiten als fitxers llegits. Concretament, no s'han enumerat tots els usos de `.badge-*` ni totes les proves que puguen comparar el `textContent` exacte del botó CONNECTAR de pàgina (la de la targeta ja espera `Connectar+`).
- **Arbre compartit**: 119 fitxers modificats per altres torns. Només he tocat els que cita la taula de §1.
- **Relleu no anotat**: `.agents/ESTAT.md` i `.agents/LEDGER.md` són governança i la meua eina no hi té autoritat. `checkTurn` exigix eixe relleu, així que este torn queda obert. Qui tinga lease hi ha de copiar el bloc que lliure al xat. `tancament.mjs` tampoc està a la llista de lectures permeses.
- **Nom del fitxer**: `0600` no és l'hora de creació (vegeu Historial).
- **Acta Marmota** de la jornada: pendent, al final de la conversa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0445_pla_implementacio_olivera]]
- [[260924_0500_prompt_tractor_claude]]
- [[260924_0435_auditoria_ultracode]]
- [[260924_0437_auditoria_codex]]
