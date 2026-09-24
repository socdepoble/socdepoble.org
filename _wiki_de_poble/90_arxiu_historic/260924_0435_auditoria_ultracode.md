---
type: informe
status: esborrany
description: 'Escombratge estatic profund del repositori amb portes mesurades: tractors cognitius, contrast, cascada CSS, accessibilitat, SEO i inventari de l agenda.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_8c1c7c55-dae2-4c2b-9902-80dd3a4973f7:732960c5-73b4-49e5-aee5-4cc8e6996926
---
# Auditoria ULTRA: escombratge de deute, disseny i accessibilitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8c1c7c55-dae2-4c2b-9902-80dd3a4973f7:732960c5-73b4-49e5-aee5-4cc8e6996926 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T02:35:59.764Z |
| Modificació | 2026-09-24T02:35:59.764Z |
| Propietari | Claude (ultracode) |
| Aprovació humana | Autoritzat pel Mestre a 260924_0400 per esgotar la quota abans del reset |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5 (ultracode). La variant exacta de quota no me l'exposa l'entorn |
| Tokens consumits | Mesurats: l'entorn no m'exposa el comptador. Estimació d'ordre de magnitud: ~390k d'entrada llegida, ~25k d'eixida. No és una mesura |
| Tall d'evidència | HEAD e2179043 amb arbre brut, disc llegit entre 02:18 i 02:35 UTC (04:18–04:35 local) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegida íntegra abans d'escriure. Torn `torn_8c1c7c55-dae2-4c2b-9902-80dd3a4973f7`, abast `documents`. No s'ha tocat cap fitxer de codi: Mode AFK absolut, tal com mana la petorreta.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T02:35:59.764Z: esborrany creat.
- 2026-09-24T02:18–02:35Z: escombratge estàtic i execució de les sis portes autoritzades.
- Codex està editant l'arbre en paral·lel (hi ha una nota seua datada a les 04:27 dins de `260924_0400_prompt_codex_astra_alto.md`). El tall d'evidència és fix; el que ell escriga després no està en este informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Com s'ha fet i què no s'ha pogut fer

El primer que has de saber és que el «mode ULTRA» d'esta nit no ha pogut ser el que volies, i el motiu és arquitectònic. Ho conte a U01 perquè és, literalment, la primera troballa.

**Executat de veres:** sis portes, les úniques que la política de lectura autoritza.

| Porta | Resultat mesurat |
| --- | --- |
| `porta-plantilles.mjs` | ✅ 13 rutes: la plantilla i el contracte diuen el mateix |
| `segella.mjs` | ✅ Skills cryptosegellats, hash `88f0ec03`. **El trencament del segell està reparat** |
| `tractor-enxufe.mjs` | ✅ E1–E4. Port, contracte i pany correctes |
| `tractor-rls.mjs` | ✅ Zero fantasmes i zero forats sobre 18 fitxers SQL |
| `design_guard.mjs --arrel=src` | ⚠️ **PASSA amb 41 crítics** sobre 274 fitxers |
| `porta-documents.mjs` | ❌ 4 errors a les 02:24 → ✅ 0 errors a les 02:52 (vegeu U17) |
| `porta-olivera.mjs --informe` | ❌ sense àncora a les 02:24 → ✅ net a les 02:52 |

**No executat:** `npm test`, `npm run lint`, `npm run build` i les altres 52 portes. La política de lectura no les admet. Cap xifra de proves d'este informe és meua; les que circulen (161, 103) són d'altres torns i no les avale.

Llegit sencer: `tokens.css`, `design-tokens.css`, `base.css`, `sdp.css`, `layout.css`, `components.css`, `modules.css` (3.654 línies), `utilities.css`, `AppGridShell.css`, `WikiDePobleSection.css`, `App.jsx`, `UniversalCard.jsx`, `NotaFitxa.jsx`, `WikiDePobleSection.jsx`, `AgendaSection.jsx`, `useSEO.js`, `sanitize.js`, `sections.js`, `turns.mjs`, `core.mjs`, `command-policy.mjs`, `mutation-policy.mjs`, `hooks-local.mjs`, `run-portes.mjs`, `protocolledge.json`, `.claude/settings.json`.

No llegit: `PerfilShell.css`, la major part de `src/sections/`, `src/data/`, i tot `tooling/` fora dels fitxers citats. On una troballa depén d'alguna cosa que no he llegit, ho dic.

---

### A · Missió crítica 0: per què els tractors cognitius es degraden

#### U01 · P0 · El hook local denega tota orquestració, i amb ella el mode ULTRA

`.claude/settings.json` declara el hook `PreToolUse` **sense `matcher`**, o siga que governa *totes* les eines. `tooling/gates/hooks-local.mjs:85` denega per defecte tot el que no siga una escriptura reconeguda o un `knownRead`.

`tooling/gates/mutation-policy.mjs:53` diu que són lectures `'Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'`.

El problema és que en este client `Glob` i `Grep` arriben **diferits**: no estan carregats, i l'única eina que els pot carregar és `ToolSearch`, que no és a la llista. Resultat mesurat esta nit:

```
ToolSearch  → BLOQUEIG
Agent       → BLOQUEIG
Workflow    → BLOQUEIG
Bash (date) → BLOQUEIG
```

O siga: **la política autoritza `Glob` i `Grep` i alhora bloqueja l'única porta per on poden entrar.** I com que `Agent` i `Workflow` també cauen, no hi ha manera de llançar cap auditoria multiagent. Tota esta auditoria s'ha fet amb `Read`, fitxer a fitxer, i sis ordres `node`.

No és un defecte de seguretat: la denegació per defecte és correcta en una porta. És un defecte de **completesa de la llista de lectures**, i el seu efecte és que la potència que pagues no arriba al disc.

**Proposta conservadora.** Afegir a `knownRead` de `mutation-policy.mjs` les eines que no poden mutar res:
- `ToolSearch` — només retorna esquemes; no atorga cap capacitat, perquè cada crida posterior torna a passar pel mateix hook.
- Les eines de vista de l'amfitrió (`mcp__ccd_view__*`, `mcp__ccd_session__mark_chapter`).

`Agent` i `Workflow` **no** s'han d'afegir: els subagents escriuen, i el hook ja els vigilarà individualment, però l'expansió de superfície mereix una decisió teua i no un pedaç meu. `requires_human_decision: true`.

#### U02 · P0 · La plantilla es valida DESPRÉS d'escriure, no abans

Primer, una correcció al registre, perquè en algun lloc s'ha dit el contrari: **`validateSections` existix i està endollada.** `tooling/documental/turns.mjs:123` la crida dins de `validateDocument`, i funciona. Ho sé perquè esta nit ha caçat el fitxer germà del teu prompt.

Segon, la prova en viu del que et queixes. A les 02:24 UTC, `node tooling/gates/porta-documents.mjs` ha tornat això (a les 02:52 ja estava reparat: vegeu U17):

```
{
  "valid": false,
  "checked": 8,
  "errors": [
    "…/260924_0400_prompt_codex_astra_alto.md: reflex: cal un rebut persistent emés per document.mjs context",
    "…/260924_0400_prompt_codex_astra_alto.md: frontmatter.tags[2]: fora de l'enum",
    "…/260924_0400_prompt_codex_astra_alto.md: frontmatter.tags[4]: fora de l'enum",
    "Sense àncora: …/260924_0400_prompt_codex_astra_alto.md"
  ]
}
```

Eixe fitxer és el bessó del que m'has passat a mi: el mateix acte de generació, la mateixa hora. La IAIA no va ometre seccions per casualitat en un document i no en l'altre: **va escriure els dos fora del circuit, i el sistema se'n va assabentar una hora després, perquè algú va executar la porta a mà.**

Ací està la mecànica exacta del forat, amb tres fets llegits al codi:

1. **El rebut acredita entrega, no compliment.** `turns.mjs:86-101` (`deliverContext`) entrega la plantilla i emet el rebut en el mateix acte. Entre eixe moment i el fitxer al disc no hi ha cap comprovació. El rebut només es contrasta quan algú valida.
2. **La validació de seccions és presencial, no substantiva.** `core.mjs:160-170`: una secció és vàlida si existix i si el seu contingut no és literalment `[pendent]`. Una secció amb una paraula passa. El contracte no sap dir «esta secció ha de dir açò».
3. **Ja tens el mecanisme fort, i només el fas servir en dos seccions.** `core.mjs:166-168` compara els `blocsFixos` **byte a byte** amb la plantilla i falla si s'han tocat. Per a `prompt.local`, `protocolledge.json:83-86` en declara exactament dos: `Context` i `Protocol de la Reunió a l'Olivera`. Les altres huit seccions no tenen eixa protecció.

I encara n'hi ha una quarta, esta ja de doctrina contra codi:

4. **La primera ordre de la primera skill està trencada.** `.agents/skills/wiki-cicle-de-vida/SKILL.md`, pas 1, ensenya:
   `obrir_torn.mjs --actor NOM --scope code --output /tmp/torn-NOM.json`
   `tooling/documental/command-policy.mjs:71` només admet els flags `['actor','scope']`. Amb `--output` la política llança «Flag documental no autoritzat». Ho he comprovat esta nit: he hagut de llevar-lo per poder obrir el torn. Un agent que òbriga la skill i la seguisca al peu de la lletra **falla a la primera línia**, i des d'eixe fracàs improvisa la resta del procediment. Això és, literalment, la fàbrica de degradació que em demanes que trobe.

##### La solució radical que demanes

No cal reinventar res: el circuit mecànic ja existix i és bo. `command-policy.mjs:91-98` ja exigix context previ per a eixe fitxer exacte, ja es nega a sobreescriure i ja valida el frontmatter de sortida. El que falta és **obligar a passar-hi**. Quatre peces, de menys a més cost:

1. **`blocsFixos` maximalista.** Una edició de JSON. Tota secció que siga doctrina i no contingut (`Context`, `Protocol de la Reunió a l'Olivera`, i jo hi afegiria la capçalera de `Riscos` i la de `Tasques` com a blocs amb esquelet fix) va a `blocsFixos`. A partir d'eixe moment, ometre-les o reescriure-les és un error dur, no una omissió invisible. **Cost: 4 línies. Impacte: el defecte d'esta nit hauria sigut impossible.**

2. **Porta de sortida al PostToolUse.** Hui `.claude/settings.json` només executa `segell-auto.mjs` després de cada eina. Afig-hi `document.mjs check --file <el fitxer escrit>` quan el fitxer siga un `.md` sota `04_escriptori/`, i que un `check` roig **falle la crida**. `check` ja està autoritzat com a `kind:'read'` (`command-policy.mjs:82`), o siga que no obri cap superfície nova. **Cost: 3 línies de configuració. Impacte: un document invàlid no pot sobreviure al torn que el va crear.** Esta és, de les quatre, la que hauria evitat el problema sense demanar-li res a l'atenció de cap model.

3. **`document.mjs fill --turn-id --file --section <id> --from <origen>`.** Una subordre nova a `specifications` (`command-policy.mjs:78`). L'agent deixa d'escriure el document sencer: `create` fa l'esquelet i l'agent omple **una secció cada vegada**, per identificador. La CLI rebutja qualsevol `id` que no siga a la ruta. L'agent deixa de ser l'autor de l'estructura i passa a ser només l'autor del text. Això és el que fa que l'aplicació de plantilles siga mecànica de veres: no perquè el model s'esforce més, sinó perquè **no té la possibilitat física d'ometre una secció**.

4. **Arreglar el text de la skill** (llevar `--output`, U18).

Amb 1 i 2 ja tens la garantia dura, i les dos són d'un matí. La 3 és l'arquitectura definitiva.

#### U17 · P1 · Un sol document mal escrit té tancades 54 de les 59 portes

**Estat: el cas concret s'ha resolt mentres jo escrivia este informe. El mecanisme continua viu i és el que importa.**

`tooling/gates/run-portes.mjs:29-91` declara **59 passos** i, quan un falla, `process.exit(1)` a la línia 118. No hi ha `continue-on-error`. Per tant, un document mal format al pas **5 de 59** (`Contracte documental`) deixa els passos **6 al 59 sense executar-se**: el linter, el build, les proves de Node, les de Vitest, `porta:cromatic`, `porta:tokens`, `porta:crom`, `porta:orfandat`, `porta:scc`, `porta:cadena`, `porta:frontmatter`.

O siga: **quan això passa no hi ha 54 portes roges, hi ha 54 portes sense notícies.** I qualsevol «verd» que algú reporte d'eixa zona és silenci, no salut.

Cronologia mesurada d'esta nit:

| Hora (UTC) | `porta-documents` | `porta-olivera` |
| --- | --- | --- |
| 02:24 | ❌ 4 errors, 8 documents comprovats | ❌ sense àncora |
| 02:52 | ✅ **0 errors, 10 documents** | ✅ **cap avís** |

Entre les dos mesures, Codex ha regularitzat `260924_0400_prompt_codex_astra_alto.md` i jo he entregat este informe pel circuit. La cadena ja no mor al pas 5.

Això **no desmentix la Missió 0, la confirma**: durant quasi una hora, un únic document escrit fora del circuit a les 04:00 va mantindre 54 portes a fosques, i la reparació va ser manual i humana. Amb la porta de sortida que propose a U02 (punt 2), eixa hora hauria sigut zero segons.

Cap de les 54 portes no s'ha executat en esta auditoria: el meu permís de lectura no les cobrix (U01). Que estiguen ara abastables no vol dir que estiguen verdes.

#### Nota sobre el Design Guard

`design_guard.mjs` ha dit: `274 fitxers, 41 critics, 5 avisos. PASSA. El deute de disseny no puja.`

És un **trinquet, no una porta de tolerància zero**. Verd vol dir «el número no ha pujat», no «no hi ha crítics». N'hi ha 41. Convé que això quede escrit en algun lloc visible, perquè un «PASSA» amb 41 crítics es llig malament a les tres del matí.

---

### B · Les tres decisions estètiques pendents

Abans de res: **dos de les tres ja estan decidides al codi.** La pissarra de l'escriptori s'ha quedat arrere respecte del disc. Això, per cert, és una altra cara de U02: ningú reconcilia el pla amb el codi.

#### U03 · P1 · Decisió 1 (el blau): el token no és el problema. Queden set superfícies de text

**El que ja està resolt** (verificat a la cascada, no deduït):

`--sdp-canon-blau` val `#0984E3` (`design-tokens.css:5`). Blanc damunt: he calculat la luminància relativa i dóna **3,87:1**. El número és correcte.

Però `--sdp-accio-control` val `--sdp-secondary-700` = `#004983`, blanc damunt fa **9,21:1**, i el bloc de tema fosc **no el redefinix**: es manté igual en clar i en fosc. I estos cinc controls ja hi han migrat:

| Control | Fitxer | Estat |
| --- | --- | --- |
| `.sdp-boto--primari` | components.css:67 | ✅ 9,21:1 |
| `.btn-secondary` | components.css:423 | ✅ 9,21:1 |
| `.pill--primary` | components.css:1180 | ✅ 9,21:1 |
| `.sdp-paginacio__num[aria-current]` | components.css:260 | ✅ 9,21:1 |
| `.btn-connectar` | components.css:1361 | ✅ 9,21:1 |

**El bug d'1,74:1 en tema fosc està mort.** Hi ha una còpia vella de `.btn-connectar` a `layout.css:541` que encara demana `--sdp-accio-forta`, però viu a `@layer legacy` i `components` li guanya. Ho he verificat per ordre de capes (`index.css:45`: `reset, sdp, legacy, components, utilities`), no per especificitat.

**El que NO està resolt.** Queden set superfícies que encara pinten text blanc damunt de `--sdp-accio` (3,87:1):

| # | Selector | Fitxer | Text? | Veredicte |
| --- | --- | --- | --- | --- |
| 1 | `.app-grid-col-header__accio` (CREAR NOTA) | AppGridShell.css:413 | sí, 16px/700 | ❌ falla 1.4.3 |
| 2 | `.sdp-pindola__opcio[aria-pressed="true"]` | modules.css:572 | sí, 16px/700 | ❌ falla 1.4.3 |
| 3 | `.xat-main-header` (títol i subtítol del xat) | modules.css:2395 | sí; el subtítol a `opacity:.8`, pitjor | ❌ falla 1.4.3 |
| 4 | `.sdp-badge-system` | modules.css:1192 | sí, 0,7rem/800 | ❌ falla, i de llarg |
| 5 | `.btn-publish` | components.css:1268 | sí | ❌ si encara s'usa (l'editor ja va per `.sdp-bloc-action` taronja; cal confirmar-ho) |
| 6 | `.sp-card-footer` | components.css:996 | hui no en porta | ⚠️ trampa latent |
| 7 | `header.bar-blue` | layout.css:196 | hui no en porta | ⚠️ trampa latent |

El número 2 fa mal: `.sdp-pindola` és el component canònic, el que usen el registre i l'onboarding, i el comentari de `modules.css:531` documenta el blanc sobre `--sdp-accio` **com a doctrina**. O siga que la regla escrita mana fer una cosa que no compleix.

**La meua recomanació és que NO repintes el blau.** Acaba la migració: eixes set superfícies a `--sdp-accio-control`, que ja existix, ja està provat i ja té cinc precedents. `--sdp-accio` (#0984E3) es queda com el blau de barres i superfícies, que és on 3,87:1 és legal (és contrast no textual, mínim 3:1). La identitat de marca no es toca.

Això mou píxels en eixos set elements (blau més fosc) i per tant és ordre teua. `requires_human_decision: true`.

**Si tot i així vols repintar el token**, ací tens els valors, calculats conservant la cromaticitat exacta de `#0984E3` (multiplicació escalar en llum lineal: el to no es mou, només baixa la lluminositat):

- `#0777CE` → **4,63:1**. És el que recomane: AA amb marge.
- `#0779D1` → **4,50:1**. El mínim just; qualsevol arrodoniment el tomba.

I un avís sobre on editar: `src/css/design-tokens.css` diu a la primera línia `AUTO-GENERATED FROM design-tokens.json`. Editar `tokens.css` no servirà de res. **No he trobat `design-tokens.json` a l'arrel** (i sense `Glob` no el puc buscar): o viu en una altra carpeta, o s'ha perdut i els cànons només existixen ja al fitxer generat. Val la pena comprovar-ho abans de tocar res.

#### U10 · Decisió 2 (els títols de la Wiki): **ja està feta, i bé**

`WikiDePobleSection.jsx:26-30`:

```js
html = html.replace(/^(#{1,6}) (.*$)/gim, (_match, hashes, text) => {
  const visual = hashes.length;
  const semantic = Math.min(visual + 1, 6);
  return `<h${semantic} class="h${visual}">${text}</h${semantic}>`;
});
```

Baixa el nivell semàntic i conserva la classe visual. `base.css:63-130` declara `.h1`…`.h6` amb exactament les mateixes regles que les etiquetes, i el fitxer nou `WikiDePobleSection.css` pega els selectors adjacents (`.h1 + p`, `.h2 + .h3`…) perquè el ritme vertical no es moga. **Compleix la Llei del Píxel: no era un redisseny, era neteja.**

He comprovat la peça que ho podria haver matat en silenci: `sanitize.js:81` té `'class'` a `ALLOWED_ATTR`. Si el sanejador llevara els `class`, tots els títols de la Wiki haurien encongit un escaló i ningú se n'hauria adonat fins que tu obrires un document. No passa.

**No hi ha res a decidir ací.** Es pot llevar de la llista.

#### U10b · Decisió 3 (el Quadre ISO): mig veritat, i es partix en dos

El quadre **no està pelat**. És una `<table>` nua i per tant agafa la pell canònica de `sdp.css:9-33`: coixí a `th`/`td`, capçalera amb `--sdp-fons-app`, files parells amb `--sdp-fons-subtil`, vores. Es veu com qualsevol altra taula del sistema. El que li falta no és pell, és **identitat pròpia**. Vestir-lo és gust, i és ordre teua.

**Els callouts, en canvi, sí que estan pelats, i això és un bug, no una decisió.** `WikiDePobleSection.jsx:36-39` emet `<div class="note">`, `<div class="warning">`, `<div class="caution">`. He llegit tots els fulls d'estil del projecte (llevat de `PerfilShell.css`, que no pinta callouts) i **`.note`, `.warning` i `.caution` no estan declarades enlloc**. El parser genera classes que ningú ha escrit.

N'hi ha un cas viu i reproduïble ara mateix: el contingut de la pàgina «Explorador del Cervell» (`WikiDePobleSection.jsx:302`) porta un `> [!NOTE]`. Obri-la i veuràs un paràgraf solt sense caixa.

**Proposta:** separa-ho. Donar pell a `.note/.warning/.caution` amb els tokens que ja tens (`--sdp-info-fons`/`--sdp-info-text`, `--sdp-avis-fons`/`--sdp-avis-text`, `--sdp-error-fons`/`--sdp-error-text`, que ja fan servir `.sdp-alerta--*` a `components.css:100-103`) és reparar una classe òrfena. Vestir el Quadre ISO és disseny nou. `requires_human_decision: true` només per al segon.

---

### C · Accessibilitat: el que ningú havia mesurat

#### U04 · P1 · L'enllaç de salt no es fa visible mai

`App.jsx:323`:

```jsx
<a href="#main-content" className="sr-only sr-only-focusable sdp-skip-link">Salta al contingut principal</a>
```

`.sr-only` (`base.css:229`) el retalla a 1×1px amb `clip`. **Ni `.sr-only-focusable` ni `.sdp-skip-link` estan declarades en cap full** dels que he llegit (tokens, design-tokens, base, sdp, layout, components, modules, utilities, AppGridShell, WikiDePobleSection). L'única excepció que no he obert és `PerfilShell.css`, on no tindria cap sentit que hi foren.

L'enllaç funciona si l'actives a cegues, però **no es veu mai**. Per a una persona vidente que navega amb teclat, l'ordre de tabulació comença amb un element invisible. Incompliment de WCAG 2.4.7.

**És l'únic arranjament d'esta secció que no mou ni un píxel de l'estat per defecte**, perquè només afecta l'estat de focus:

```css
.sdp-skip-link:focus-visible {
  position: fixed; inset: var(--sdp-space-2) auto auto var(--sdp-space-2);
  width: auto; height: auto; margin: 0; padding: var(--sdp-space-3) var(--sdp-space-4);
  clip: auto; clip-path: none; overflow: visible; white-space: normal;
  background: var(--sdp-fons-targeta); color: var(--sdp-text-titol);
  border-radius: var(--sdp-radi-s); box-shadow: var(--sdp-ombra-3);
  z-index: var(--z-calaix);
}
```

#### U05 · P1 · Els enllaços del text es distingixen només pel color, a 2,03:1 — i cap color ho pot arreglar

`base.css:214`: `a { color: var(--sdp-accent-titol); text-decoration: none; }`

- `--sdp-accent-titol` = `--sdp-primary-700` = `#ad4c03`. Contra blanc: **5,51:1** ✓ (el comentari del codi diu la veritat).
- Text del cos: `--sdp-text-cos` = `--sdp-pedra-700` = `#3d3b35`.
- **Enllaç contra text del cos: 2,03:1.**

WCAG 1.4.1 exigix 3:1 entre l'enllaç i el text que l'envolta quan el color és l'única pista. I al `:hover` només s'enfosquix més (`--sdp-accent-text-hover`): no apareix cap subratllat.

Ara la part que fa que això no siga una opinió. He comprovat si hi ha **algun** color que salve les dos condicions alhora:

- Per arribar a 3:1 contra el text del cos, l'enllaç necessita una luminància relativa de 0,2313 o més (més clar). Però a 0,2313 el contrast contra el blanc baixa a **3,73:1**, per davall del 4,5:1 que necessita ell mateix.
- Per l'altre costat (enllaç més fosc que el text), la luminància eixiria **negativa**. No existix.

**Conclusió: no hi ha cap color que complisca. L'única reparació conforme és una pista no cromàtica, o siga un subratllat.** Això mou píxels a cada enllaç de la Wiki i de tota la prosa editorial, i per tant és decisió teua. Però ara ja saps que no és una qüestió de trobar el taronja bo: no n'hi ha cap. `requires_human_decision: true`.

#### U06 · P1 · El botó de data/hora falla en tema CLAR i passa en fosc

Esta ningú l'havia vista, i és el mirall exacte del bug que tots buscàveu.

`layout.css:518-520` — `.btn-date-time { background: var(--sdp-crom-scroll-pista); color: var(--sdp-text-invers); }`

- `--sdp-crom-scroll-pista` és `rgba(0,0,0,0.15)` i és **crom**: no s'invertix mai.
- El botó viu dins de `.sp-card-header`, que és `--sdp-accent` = `#FF7300`, que **tampoc** s'invertix.
- Composició real del fons: `#D96200`.
- `--sdp-text-invers` **sí** que s'invertix: `pedra-50` (blanc) en clar, `pedra-900` en fosc.

| Tema | Tinta | Contrast |
| --- | --- | --- |
| Clar | `#ffffff` | **3,69:1** ❌ |
| Fosc | `#0e0d0c` | **5,25:1** ✓ |

La lletra és `var(--sdp-text-meta)` (14px) amb pes 700. 14px negreta són 10,5pt: **no és «text gran»**, o siga que li toca 4,5:1. Falla en clar.

És exactament la patologia que vau diagnosticar per al blau —un token que fa dos faenes— però al revés: ací el que s'invertix és la **tinta** damunt d'una superfície que no s'invertix.

**Reparació neta:** canviar `--sdp-text-invers` per **`--sdp-sobre-accent`** (que val `pedra-900` en els dos temes). Damunt de `#D96200` dóna **5,25:1** en clar i en fosc. En tema fosc no mou ni un píxel (ja és eixe color); en clar la pastilla passa de lletra blanca a lletra quasi negra. Un token, una línia. `requires_human_decision: true` per la part de clar.

#### U11 · P2 · `aria-expanded="false"` clavat al botó del menú mòbil

`App.jsx:398`: el botó del logo de la barra negra porta `aria-expanded="false"` **literal**, amb `aria-controls="app-sidebar"`. `onToggleSidebar` obri i tanca el calaix, però l'atribut no canvia mai. Un lector de pantalla anuncia sempre «replegat». WCAG 4.1.2.

És la mateixa família que el fantasma d'`aria-current` que ja teníeu identificat i que continua viu: `modules.css:3330` el tapa des del CSS i el comentari diu, literalment, que l'atribut «sobra i s'ha de llevar del JSX en un torn propi».

#### U12 · P2 · L'estirada per recarregar pot endur-se l'esborrany

`App.jsx:241-319`. El gest està muntat sobre `main.app-main`, o siga **a tota l'aplicació**, editor de Notes inclòs. Passats 100px amb `scrollTop === 0`, `App.jsx:297` fa `window.location.reload()`.

En un mòbil, una estirada de més al capdamunt de l'editor recarrega la pàgina sencera. Si l'esborrany no s'ha persistit encara, se'n va. Per a un públic rural que treballa amb el telèfon, això és una pèrdua de faena sense avís i sense confirmació.

Bonus tècnic: `App.jsx:311` registra `touchmove` amb `{ passive: false }` però `onTouchMove` no crida mai `preventDefault()`. Es paga el cost de rendiment de l'scroll no passiu sense obtindre'n res.

#### U13 · P2 · `100vh` en dos llocs on la resta del sistema ja fa servir `dvh`

- `modules.css:1907` — `.toc-overlay { height: 100vh; }`
- `modules.css:3644` — `.sdp-wiki-graf { height: calc(100vh - 200px); }` (i el 200 és un número màgic)

`.sdp-dialeg` ja usa `min(88dvh, …)` i `100dvh`. En mòbil, `100vh` no compta la barra d'adreces: el calaix de l'índex es fica per davall i l'últim element no s'arriba a tocar.

---

### D · Cascada i deute de CSS

#### U07 · P2 · Les insígnies d'estat es pinten grises

Esta és de cascada pura, i és visible.

A `components.css`:
- línia 480: `.badge { … }` — sense color.
- línia 492: `.badge-success { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }` (i `-warning`, `-info` a continuació).
- línia **1206**: **`.badge { … background: var(--sdp-fons-subtil); color: var(--sdp-text-titol); }`**

Les dos `.badge` i les tres `.badge-*` tenen la **mateixa especificitat** (0,1,0) i viuen a la **mateixa capa** (`components`). Guanya la que va després a la font: la de la línia 1206.

**Resultat: cada `.badge-success`, `.badge-warning` i `.badge-info` de l'aplicació es pinta gris neutre.** El verd, el groc i el blau d'estat s'han perdut. La segona `.badge` també li canvia la mida i el pes (0,7rem/800 en lloc de 0,75rem/700).

Reparació: llevar el bloc duplicat de la línia 1206, o pujar-lo per damunt dels modificadors. Açò **mou píxels**, però en la direcció de tornar un disseny que estava previst i que s'ha trencat sense que ningú ho notara. `requires_human_decision: true`.

#### U08 · P2 · La icona `+` de CONNECTAR: tres mecanismes barallant-se (la teua petició 4)

He trobat d'on ix el `+` menudet, i el diagnòstic no és el que semblava.

L'element és `className="btn-connectar sp-card-connect"` (`UniversalCard.jsx:317`), o siga que li apleguen regles de dos classes i de dos capes.

Hi ha **tres** mecanismes que volen produir un `+`:

1. `components.css:1050-1060` — `@container (max-width: 360px)`: amaga `.sp-card-connect-text` i mostra `.sp-card-connect-plus`, un `<span>` de veres que hereta la lletra del botó (14px).
2. `layout.css:470` — `@media (max-width: 480px)`: `.sp-card-connect { font-size: 0; color: transparent; }`
3. `layout.css:471` — `.sp-card-connect::after { content: '+'; font-size: 24px; }`

El 2 **no funciona**. `layout.css` és `@layer legacy` i `components.css` és `@layer components`; l'ordre de capes (`index.css:45`) fa que `components` guanye sempre, sense que la media query hi tinga res a dir. Per tant `.btn-connectar { font-size: var(--sdp-text-meta); color: var(--sdp-sobre-accio); }` sobreviu i **la paraula CONNECTAR continua visible**.

**El que veus en un telèfon de menys de 480px amb el contenidor per damunt de 360px és: «CONNECTAR» a 14px _i_ un `+` de 24px al costat.** El `+` no és massa menut: és que **no hauria d'estar-hi** alhora que la paraula.

I hi ha més mort en eixe mateix bloc: `width:44px`, `height:44px`, `padding:0` i `border-radius:50%` de `layout.css:468-470` també perden contra el bloc compartit de `components.css:1296-1316` (48px, pastilla, coixí lateral). **Tot el `@media (max-width: 480px)` per als controls de la targeta és lletra morta** des que eixos controls van pujar a `@layer components`.

**Proposta:** esborrar les regles de `.sp-card-connect` i `.sp-card-action` d'eixe `@media` (inclòs el `::after`), i deixar que la container query faça la seua faena, donant-li a `.sp-card-connect-plus` la mida que vols:

```css
.sp-card-connect-plus { font-size: 24px; line-height: 1; }
```

Així el `+` és gros, apareix quan la targeta és estreta (que és el criteri correcte: depén de l'amplada de la *targeta*, no de la pantalla) i mai conviu amb la paraula.

#### U09 · P2 · El parser de Markdown de la Wiki té cinc forats

`WikiDePobleSection.jsx:20-74`. Per ordre de dany:

1. **No entén les tanques de codi.** No hi ha cap tractament de ` ``` `. Dins d'un bloc de codi, un `#` es convertix en encapçalament i un `-` en element de llista. La teua Wiki està plena de blocs de codi (la Constitució, les skills, els protocols). Això es veu.
2. **Negreta i cursiva golosa.** `/\*\*(.*)\*\*/gim`: sobre `**A** i **B**` el `.*` s'ho menja tot i produïx `<strong>A** i **B</strong>`, amb els asteriscos a la vista. Igual amb `*`. Reparació: `(.*?)`.
3. **Els callouts es trenquen amb un espai final.** `/^> \[!([A-Z]+)\]\n/` exigix que el claudàtor toque el salt de línia. `> [!CAUTION] ` amb un espai darrere no casa i cau al `blockquote` pla. És exactament com estan escrits alguns dels teus documents.
4. **Les classes que emet no existixen** (U10b).
5. **Les llistes imbricades es despleguen.** `/^\s*-\s+(.*)$/gim` es menja la sagnia: un `  - ` fill queda al mateix nivell que el pare.

---

### E · SEO

#### U14 · P1 · `VITE_CANONICAL_URL` sense validar pot deixar l'app en blanc, i el SEO està fora de la xarxa de seguretat

`useSEO.js:24-25`:

```js
const origin = import.meta.env?.VITE_CANONICAL_URL || window.location.origin;
const imageUrl = new URL(image || resolveAsset('…'), origin).href;
```

Si algú posa `VITE_CANONICAL_URL=socdepoble.org` (sense esquema), `new URL(x, 'socdepoble.org')` **llança**. I ho fa dins d'un `useLayoutEffect`.

El problema de dalt és on està muntat: `App.jsx:513-519` posa `<RouteSEO />` com a **germà** de `<RouteErrorBoundary>`, no dins. És l'únic límit d'error de l'aplicació. Una excepció a `useSEO` no la para ningú: pantalla en blanc a totes les rutes.

Dos reparacions, cap de les dos mou un píxel:
- validar l'origen una vegada i caure a `window.location.origin` si no parseja;
- moure `<RouteSEO />` dins del `RouteErrorBoundary`.

També sospite que l'efecte es torna a executar en cada render, perquè `resolveAsset` és a l'array de dependències (`useSEO.js:34`) i ve de `useUIActions()`. Si eixe hook retorna un objecte nou cada volta, la identitat canvia sempre. **No ho he verificat**: no he llegit `UIContext`. Val la pena mirar-ho, perquè és el patró que ja us ha mossegat a `CoreContentContext`.

#### U15 · P2 · Zero dades estructurades per defecte

`useSEO.js:28-30` només emet JSON-LD si qui crida li passa un `jsonLd`. Per defecte no n'hi ha cap. Per a una plataforma de patrimoni local això és la victòria de SEO més barata que hi ha:

- `Organization` al `layout` (una vegada, amb nom, logo i `sameAs`),
- `Event` a l'Agenda quan s'endolle (encaixa amb l'`ActeDTO` que ja teniu),
- `Article` a les publicacions del Mur i als documents de la Wiki (ja teniu títol, data i autor).

La llista `PRIVATE` de `useSEO.js:6-8` està bé i cobrix el que ha de cobrir. Però compte: només posa `noindex`. No trau la ruta de cap sitemap.

---

### F · Tasca 3: l'Agenda, situació real

#### U16 · Inventari

**Hi ha un sol fitxer:** `src/sections/agenda/AgendaSection.jsx`, 202 línies. Ben fet: fallada tancada, `AbortController`, guarda per capacitat (`teCapacitat('agenda')`), només primitives de Pedra Seca, zero CSS propi, formatadors `Intl` a escala de mòdul.

**No està endollada, i és a propòsit.** No hi ha cap ruta `/agenda` (he llegit `AppRoutes` i `ActorRoutes` senceres) ni cap import. I `src/config/sections.js:3-8` ho declara negre sobre blanc:

> *La secció Agenda ('/agenda', 'AgendaSection.jsx') està implementada funcionalment però actualment es troba en quarantena formal fins que s'estabilitze el nucli. No afegir a SECTIONS fins a nova ordre de Producció.*

O siga: quarantena documentada, no oblit. Bé.

**Ara la notícia que et canvia el pla: l'agenda no té cap graella de calendari.** És una **llista** amb navegació per rangs de setmana i mes. No hi ha quadrícula de dies, ni cel·les, ni selector de data. Del que hi ha, açò és el que serveix de veres:

| Peça | Línies | Reutilitzable? |
| --- | --- | --- |
| `calculaRang(referencia, vista)` | 36-49 | **Sí, tal qual.** Exportada, pura, rangs semioberts `[desde, fins)`, setmana des de dilluns amb `(ref.getDay()+6)%7` |
| `mou(referencia, vista, passos)` | 51-60 | Sí, però és privada. Té la cura del `setDate(1)` per evitar el salt del 31 |
| `iniciDelDia(data)` | 29-33 | Sí, privada |
| `titolDelRang`, `formataActe` | 62-72 | Només per a l'agenda |
| Tota la resta (estat, efecte, targetes) | 74-202 | No |

**El que falta i no existix enlloc de Pedra Seca:** la graella de 7×N, l'estat de cel·la (hui / triat / mes veí), el patró de teclat de `role="grid"` (fletxes, PageUp/PageDown, Home/End, Escape) i l'`aria-selected`.

**El que sí que tens i encaixa:** `Dialeg` (capa superior, Escape, trampa de focus, ja el fa servir `NotaFitxa`), `Boto`, `.sdp-pindola` per al parell setmana/mes, `.sp-card-calendar-badge` (el bloc de 128px amb dia/mes/any, que **ja és clicable**: `UniversalCard.jsx:87-102`) i els tokens d'espaiat més `--sdp-touch` (44px) per a la mida de cel·la.

**El contracte del botó de data, hui:**
- `UniversalCard` exposa la prop `onDateTime`.
- `NotaFitxa.jsx:74` li passa `mostrarAvisPrevisualitzacio`. **La teua petició 1 ja està servida pel costat de la previsualització:** el botó de data obri el diàleg d'avís.
- Si ningú passa `onDateTime`, el valor per defecte (`UniversalCard.jsx:257-262`) navega a `/mur?date=AAAA-MM-DD`.
- **El que falta és només el costat de l'editor:** ningú li passa un calendari. El punt d'endoll és **una prop, en una crida**.

**Esforç real:**
- Nou: `src/components/PedraSeca/organismes/Calendari.jsx` (~180-220 línies amb la graella de teclat completa) i `src/components/PedraSeca/lib/dates.js` on treure `calculaRang`, `mou` i `iniciDelDia` perquè l'agenda en quarantena i el giny compartisquen l'àlgebra en lloc de duplicar-la.
- Tocat: un bloc de ~40 línies a `components.css`, l'`index.js` de Pedra Seca, i el cablejat de l'`onDateTime` a l'editor.
- **Cap dependència nova.** Tot amb `Intl` i CSS Grid.

Un detall menut mentres hi eres: l'agenda formata amb `'ca'` i `WikiDePobleSection.jsx:80` amb `'ca-ES'`. Convé triar-ne un.

---

### G · Higiene

#### U18 · P3 · La skill ensenya una ordre que la política rebutja
`.agents/skills/wiki-cicle-de-vida/SKILL.md` pas 1 inclou `--output /tmp/torn-NOM.json`. `command-policy.mjs:71` només admet `['actor','scope']`. Comprovat esta nit. Vegeu U02.

#### U19 · P3 · Dos tokens per a la mateixa Llei de Vida
`--sdp-touch: 44px` (tokens.css:175, escrit a mà, amb el comentari «Cap control per davall») i `--sdp-touch-min: 44px` (design-tokens.css:10, generat). Els consumidors estan repartits: `base.css:210` i `.sdp-pindola__opcio` usen el primer; tot `components.css` usa el segon. Hui valen igual. El dia que algú en canvie un, la llei es bifurca en silenci i cap porta ho dirà.

#### U20 · P3 · `.DS_Store` dins de `.agents/skills/`
Ho ha dit `segella.mjs` esta nit: *«1 fitxer(s) fora del segell perquè no són regles: .agents/skills/.DS_Store»*. Cosmètic, però viu dins del directori segellat.

#### U21 · P3 · Regles mortes a `layout.css` que es lligen com a doctrina viva
`.btn-connectar` (541-562) està sobreescrita sencera per `components.css`. El bloc `@media (max-width:480px)` per als controls de la targeta (468-471), igual. Es lligen com si manaren i no manen res. El pròxim que vulga canviar el botó de connectar editarà el fitxer equivocat i no veurà cap efecte.

---

### Sobre la plantilla `prompt_local.md` (punt 4 del Protocol)

Tres coses que m'haurien fet la faena millor:

1. **El «Tall d'evidència» hauria de ser obligatori i omplit per la màquina**, no `[HEAD + hora]` a mà. Amb un arbre compartit i tres agents editant alhora, si no fixes el tall les cites caduquen mentres escrius. Esta nit Codex ha tocat un fitxer que jo acabava de citar.
2. **Falta un camp «Portes executables per al destinatari».** Jo he perdut els primers minuts descobrint què podia executar. Si la petorreta digués les sis ordres autoritzades, l'auditoria comença amb evidència en lloc de començar amb frustració.
3. **La casella 0 «Escriptori classificat» s'autocertifica.** Les tres caselles venien marcades `[x]` i `porta-olivera` estava roja en eixe mateix moment. Una casella que la màquina pot comprovar no l'ha de marcar l'autor: que la òmpliga el resultat de la porta.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executades esta nit, sobre HEAD `e2179043` amb arbre brut, entre 02:18 i 02:35 UTC:

- `node tooling/gates/porta-plantilles.mjs` → ✅ 13 rutes coherents.
- `node tooling/gates/segella.mjs` → ✅ hash `88f0ec03`; avís de `.DS_Store`.
- `node tooling/gates/tractor-enxufe.mjs` → ✅ E1–E4.
- `node tooling/gates/tractor-rls.mjs` → ✅ 18 fitxers SQL, zero forats.
- `node tooling/gates/design_guard.mjs --arrel=src` → ⚠️ PASSA amb 41 crítics i 5 avisos sobre 274 fitxers.
- `node tooling/gates/porta-documents.mjs` → ❌ eixida 1, quatre errors, 8 documents (02:24) · **tornada a executar a les 02:52 → ✅ `valid:true`, 0 errors, 10 documents**.
- `node tooling/gates/porta-olivera.mjs --informe` → ❌ document sense àncora (02:24) · **tornada a executar a les 02:52 → ✅ net, 9 documents solts**.
- `git status --short`, `git diff --stat` → tall d'evidència fixat.

Les dos portes documentals s'han tornat a executar després d'entregar este informe pel circuit (`document.mjs context` → `create` → omplir → `check` → `valid:true`). El canvi d'estat entre les 02:24 i les 02:52 té dos causes: la regularització que ha fet Codex del seu fitxer i l'entrada en regla d'este document. **No l'atribuïsc sencer a cap de les dos.**

**No executat i per tant no avalat:** `npm test`, `npm run lint`, `npm run build`, i els 52 passos restants de `run-portes.mjs`. La política de lectura (`mutation-policy.mjs:43-51`) no els admet.

**Mètode dels contrastos:** els ratios de contrast d'este informe els he calculat jo amb la fórmula de luminància relativa sRGB de la WCAG, a partir dels valors hexadecimals llegits als fulls d'estil i resolent la cadena de `var()` fins al primitiu. No provenen de cap eina ni de cap comentari del codi (de fet, U06 contradiu el que suggerix el codi). Els composites amb `rgba()` els he fet en espai sRGB amb alfa simple, que és el que fa el navegador.

**Mètode de la cascada:** les afirmacions sobre quina regla guanya (U03, U07, U08, U21) surten de l'ordre de capes declarat a `index.css:45` (`reset, sdp, legacy, components, utilities`) i de l'especificitat i l'ordre de font. No he obert el navegador: el servidor de Vite i el DOM no han entrat en esta auditoria.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Auditoria estàtica pura.** Ni navegador, ni proves, ni build. Cap troballa visual s'ha confirmat en pantalla.
- **Sense `Glob` ni `Grep`** (U01). Tota afirmació del tipus «no existix enlloc» es limita als fitxers que he llegit i que enumere a la secció Troballes. Concretament, no he obert `PerfilShell.css`, ni la major part de `src/sections/`, `src/data/`, `src/components/PedraSeca/`, ni `tooling/` fora dels fitxers citats.
- **Sense subagents ni workflow** (U01): una sola finestra de context, sense refutació adversarial creuada. Les troballes no han passat per cap segon parell d'ulls. Tracta-les com a primera passada, no com a veredicte.
- **Arbre concurrent.** Codex està treballant en paral·lel. Abans d'actuar sobre qualsevol cita, torna-la a verificar contra el disc.
- **Tres afirmacions que marque com a no verificades i que cal comprovar:** (a) si `.btn-publish` encara té consumidors; (b) si `resolveAsset` canvia d'identitat cada render a `UIContext` (U14); (c) on viu `design-tokens.json`, o si s'ha perdut (U03).
- **No he tocat cap fitxer de codi, ni `.agents/`, ni l'`ESTAT`, ni el LEDGER.** El torn `torn_8c1c7c55-dae2-4c2b-9902-80dd3a4973f7` queda **obert**, i no per un error: `checkTurn` exigix pla vinculat i relleu anotat a `.agents/ESTAT.md` i `.agents/LEDGER.md`, i eixos dos fitxers són zona de governança on la meua eina directa no té autoritat (`mutation-policy.mjs:15`). El relleu l'ha d'anotar qui tinga la lease. Este informe ja està validat (`check` → `valid:true`) i ancorat.
- No hi ha cap puntuació global en este informe. Una nota sobre 10 seria un número inventat, i la plantilla ho prohibix expressament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0245_pla_implementacio_fortificacio]]
- [[260924_0356_auditoria_claude]]
- [[260924_0357_auditoria_codex]]
