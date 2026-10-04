---
type: document
status: esborrany
description: Integració dels criteris Impeccable i Emil Kowalski als tokens i CSS de Pedra Seca (tipografia fluida, micro-interaccions, moviment) amb el contrast AAA del Bancal Mode com a guarda.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_50ca5709-8cd2-416a-bf41-2afdb3450179:7c010228-864d-440d-8854-dff2b0c20447
---
# Pla d'Implementació — Pedra Seca Impeccable i Kowalski sense trencar el Bancal

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_50ca5709-8cd2-416a-bf41-2afdb3450179:7c010228-864d-440d-8854-dff2b0c20447 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T22:54:13.158Z |
| Modificació | 2026-10-03T23:20:00Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Ultracode, amb quatre lents de recerca en paral·lel |
| Tokens consumits | No disponibles en esta sessió; no estimats |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-03T22:54:13.158Z: esborrany creat; contingut i verificació pendents.
2026-10-03T23:20:00Z: v1.0.0, pla complet a partir de quatre lents de recerca de només lectura: tokens, Bancal i contrast, moviment, tipografia. **Cap canvi de codi font.** Els fitxers `tokens.css`, `components.css` i `base.css` són **en flux** per la sisena passada (directriu 2325), i les línies citades són d'eixe tall.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

##### T1 · Què diu ara la skill i què no cal copiar-ne

La skill `sdp-pedra-seca` afig dues famílies de regles. Les **Impeccable** demanen **mesura de 68ch**, **encapçalaments fluids amb `clamp()`** i interlineats **1.2 per als títols i 1.6 per al cos**. Les **Kowalski** demanen **feedback de hover i active**, transicions de **200 a 300 ms com a màxim**, **corbes ease-out precises**, **zero ombres decoratives** i **radis de l'escala**.

**L'exemple de la skill no s'ha d'aplicar tal com està.** `clamp(1.2rem, 3vw, 1.8rem)` per a l'H2 (SKILL.md:57) **encongiria** l'H2 vigent de 40 px a un màxim de 28,8 px, en contra de la **P6** i del **Bancal**. A més, el valor preferit **només en `vw`** incomplix **WCAG 1.4.4**: no creix amb el zoom de l'usuari. **La forma correcta és `rem + vw`**, amb un **mínim que mai baixe de la mida actual**. **Proposta per a MarIA:** reescriure eixe exemple.

##### T2 · El fitxer de tokens: on van de veres els tokens nous

**La ruta del prompt no existix.** `src/components/PedraSeca/tokens/design-tokens.css` no hi és. El fitxer real és **`src/css/design-tokens.css`**, que és **generat** (capçalera, línia 1) per `tooling/scripts/build-tokens.mjs` a partir de **`src/config/design-tokens.json`**. Eixe JSON es declara **«CAPA 0 · TANCAT»**: **constants de marca i mínims físics, res més** (`design-tokens.json:7`). A més, **el generador només sap emetre `px` o `rem`** (`build-tokens.mjs:22`, `29` i `36`). **No pot expressar `clamp()`, mil·lisegons ni `cubic-bezier`.**

**Conclusió: els tokens nous van a mà a `src/css/tokens.css`**, que és la **font de veritat de les capes 1 i 2**. La porta `tractor-tokens.mjs` ho confirma (llei T3, línies 21-22 i 50-54). **L'única cosa que podria anar a la capa 0** és un **mínim físic nou**, com el **sòl de lletra de 14 px**.

**Com arriben a WordPress.** Els tokens es declaren sobre **`:root, :host, .sdp-root`** (`tokens.css:29`), i el `<soc-de-poble>` els adopta dins del **shadow root tancat** (`PedraSecaEmbed.jsx:694-706`). **Els tokens que canvien amb el tema** van al **bloc clar i al fosc** (`tokens.css:402-403`). **Els de moviment i tipografia** van **només al clar**.

##### Inventari del moviment

**Només hi ha dos tokens**, i tots dos **ajunten durada i corba**: **`--sdp-t: 0.18s ease`** (`tokens.css:177`, **63 consumidors**) i **`--sdp-t-lenta: 0.3s cubic-bezier(0.2, 0.7, 0.3, 1)`** (`:178`, 5). **No hi ha cap token** de durada, de corba o d'**escala de premut**.

**Bug real causat per eixa agrupació.** A `modules.css:1982` i `:1992` es llig **`animation: … var(--sdp-t) ease-out`**, que es resol a **`0.18s ease ease-out`**. Dues corbes fan la declaració **invàlida**: **el calaix de l'Índex i el seu vel no s'animen mai**.

**Violacions de Kowalski.** Hi ha **4 `transition: all`**: el quadrat (`components.css:1258`), `.pill`, `.sdp-indicator-card` i el camp de cerca. La **transició de vista** fa **400 ms** i **escala la pàgina sencera** (`modules.css:1897`), cosa que topa amb l'**article 1 de la Constitució** («cap transició marejant»). Hi ha **8 temps literals** (dels quals **4** són a `AppGridShell.css`), **13 transicions de `box-shadow`** i **8 elevacions `translateY`** en passar-hi per damunt, **6 amb ombra**. N'hi ha **164 línies amb `:hover`**, i **només 5 tenen guarda** `(hover: hover)`: **al tàctil el hover es queda enganxat**. En tot el sistema només hi ha **8 `:active`**, i **el botó canònic `.sdp-boto` no en té cap**.

**Trencaments de la Baseline 2022.** Les **propietats individuals `rotate`, `translate` i `scale`** arriben amb **Chrome 104**. Hi ha 5 usos, i a Chrome 100-103 **el carregador no gira**, **el botonet de l'interruptor no es mou** (`components.css:209`), **la bafarada de la pista queda descentrada** i **la fletxa de l'acordió no gira** (`modules.css:695`). **La correcció amb `transform:` és idèntica al píxel** als navegadors moderns. Fora de la meua lent, però també fora de la Baseline: **12 `:has()`** i **18 `@container`** sense bessó.

##### Inventari de la tipografia

**Escala P6 vigent:** h1 **3rem**, h2 **2.5rem**, h3 **2rem**, h4 **1.75rem**, h5 **1.5rem**, h6 **1.25rem**, lead **1.25rem**, base **1.125rem**, small **1rem** i meta **0.875rem**, que és el **sòl de 14 px** (`tokens.css:229-243`). **Interlineats:** 1.15, 1.21 i 1.65 (`:253-266`). **Cap coincidix amb 1.2 i 1.6.**

**Jerarquia invertida en mòbil (troballa principal).** El títol de pàgina no fa servir el token: **`clamp(1.8rem, 4.5vw, 2.5rem)`** (`layout.css:423`). A **375 px**, **l'H1 fa 28,8 px**, mentre que l'h2 en fa **40** i l'h3 **32**. **L'H1 és el quart nivell visual**, cosa que incomplix **SKILL.md:56**. **Mai supera l'h2**, ni tan sols a l'escriptori.

**Zoom.** Els **4 `clamp()`** que hi ha fan servir **`vw` tot sol**. Al **200 %**, l'H1 només creix **×1,44**.

**Mesura.** **`--sdp-measure: 68ch` ja existix** i té 16 consumidors, però **`article.content-wrapper` no té cap `max-width`** (`base.css:258-262`). En una pantalla de 1.440 px, un paràgraf arriba a **~107ch**.

**Sòl de lletra.** Hi ha **34 declaracions per davall de 14 px**, entre elles `.sp-card-label` a **11,2 px**, `.badge` a 12 px i els avatars a **9,6 px**. **`--sdp-ui-sm` val 13 px** i contradiu el sòl. **`design_guard` només mira els `px`**: tots els `rem` passen en verd.

**Fonts.** `public/fonts/noto-sans.css` declara **4 pesos amb el mateix woff2**. Que siga una **font variable** és una **inferència no verificada**: **si no ho és, 600, 700 i 800 són negretes sintetitzades**, i això és greu per al Bancal. **El lloc propi carrega Google Fonts** (`index.html:21`): **depén d'un tercer**, contra QUI_SOC §1, i **no pinta igual** que l'incrustat.

##### Bancal Mode: què és i com està de contrast

**És doctrina, no un mode d'execució.** `pageContent.js:55` (article 2) el definix així: **contrast AAA sota el sol**, **text massiu** i **àrees tàctils de 48 × 48**. La porta `tractor-cromatic.mjs:26-28` el concreta en **7:1**. **Al CSS no hi ha res**: `modules.css:1965` és una **capçalera sense regles**, i hi ha **0 `prefers-contrast`** i **0 `forced-colors`**. **Atenció a l'homònim:** `arquitectura_l_anima.md:28` diu «Bancal Mode» de l'**antic mode offline** abandonat. **Contradicció:** la doctrina posa el sòl tàctil en **48**, però el token diu **44** («Reduït a 44px», `design-tokens.json:26`).

**Contrastos calculats** amb la fórmula WCAG sobre els hex de `tokens.css`. **En clar**, el **cos** fa **9,86 a 11,20 (AAA)** i el **títol** **17,09 a 19,42**. El **text suau** fa **7,28 només sobre blanc**, i **6,41 sobre l'app** i **6,18 sobre el fons subtil**: **només AA**. **La porta C3 només mesura contra blanc i només en clar**, i per això no ho veu.

**Fallades que ja són errors, sense esperar el Bancal:**

**Hover de perill en fosc:** blanc sobre #ffb3b0, **1,70 ✗**. **Barra mòbil en fosc:** **s'inverteix a clar**, contra la **Llei de la Roca**, i l'element actiu fa **2,13 ✗**. **Anell de focus sobre les barres blaves:** **1,42 ✗** (`base.css:246-248`). **Píndola premuda:** blanc de 16 px sobre `--sdp-accio`, **3,87 ✗ AA** (`modules.css:636-640`). **`.sdp-stat-value`:** **2,31 ✗**. **Hover d'accent en clar:** de **7,12 (AAA)** baixa a **5,42**, i el mateix token com a text a `modules.css:2091` fa **3,58 ✗**. **Focus de la targeta sencera:** és un `box-shadow`, i **desapareix en `forced-colors`**. **Quadrat de la P6 (en flux):** el text fa **19,42 (AAA)**. En **fosc**, el quadrat contra la targeta fa **1,08**, i només el salva la **vora (4,90)**.

**Risc ocult de la «suavitat» de Kowalski.** **`.sp-card` es separa del fons només per l'ombra.** La targeta contra l'app fa **1,14**, i amb `--sdp-vora` **1,43**: **llevar l'ombra la fa invisible al sol**. **Cal substituir-la per una vora sòlida** (`--sdp-vora-control`, **3,66**), i això **canvia píxels**.

### 2. Preguntes Obertes (User Review Required)

##### Q1 · El Bancal: doctrina o interruptor

**Proposta:** les **fallades que ja són errors** es corregixen **sempre**, perquè la doctrina ja és AAA. A més, un **«Mode Bancal» explícit** (`data-contrast="bancal"`) amb el plus d'exterior: **suau fosc**, **sense ombres**, **48 px**. Es pot activar **a mà** des dels Ajustos o **pel sistema** (`prefers-contrast: more`).

##### Q2 · Sòl tàctil: 44 o 48

**Proposta:** **44 de base** i **48 dins del Bancal**. Cal tancar la contradicció del JSON.

##### Q3 · El premut a la barra blava

La **llei del Mestre del 260927** diu **«cap transform»** al peu i a la barra. **Proposta:** **respectar-la**. El feedback serà **de color**, i el **premut 0,97 només** anirà a **botons, portes, píndoles i quadrat**.

##### Q4 · El calaix de l'Índex

Hui **no s'anima mai** pel bug de la doble corba. **Reparar-lo fa aparéixer un moviment nou.** **Proposta:** **reparar-lo** amb **280 ms i la corba de calaix**.

##### Q5 · Tipografia fluida

**El mòbil queda igual** (els mínims són la P6) i **l'escriptori creix fins a un ~17 %**. **L'H1 de pàgina passa de 28,8 a 48 px a 375**, i paraules com **«Intergeneracional»** es partiran **sense guionet**. **Tria del Mestre:** acceptar-ho, **reduir el coixí del títol** en pantalla estreta, o activar **`hyphens: auto`** amb `lang="ca"`.

##### Q6 · Ombra de les targetes

**Kowalski demana llevar l'ombra permanent**. **Sense una vora sòlida, la targeta desapareix al sol.** **Proposta:** **vora de 3,66** en lloc de l'ombra. **Canvia píxels.**

##### Q7 · Sobirania de la font

**Proposta:** **allotjar Noto Sans també al lloc propi** i **retirar Google Fonts**. **Abans cal verificar** si el woff2 és variable (taula `fvar`).

##### Q8 · `rem` dins de WordPress

`rem` es calcula sobre l'**`<html>` de l'amfitrió**. **Un tema amb `html { font-size: 62.5% }` encongiria tot un 37,5 %.** **Proposta:** estudiar-ho a l'**onada de l'arquitectura de plugins** (directriu 2320). **No es toca ara.**

### 3. Canvis Proposats (Proposed Changes)

**Principi rector:** **primer les guardes, després la suavitat**. Cada fase **té una porta d'eixida** i, si és visible, **l'aprovació del Mestre** (Llei del Píxel, sdp-workflow §1).

### [Acció: MODIFY] `src/css/tokens.css` · Fase A (invisible, Llei del Píxel)

**Tokens atòmics de moviment** a la secció «Moviment» (`:176`), **sense canviar cap consumidor**. **`--sdp-t` i `--sdp-t-lenta` es queden amb el valor idèntic** en esta fase.

```css
  /* Moviment · àtoms (Kowalski). --sdp-t i --sdp-t-lenta en són dreceres. */
  --sdp-durada-premut: 100ms;
  --sdp-durada-rapida: 180ms;    /* = la de --sdp-t */
  --sdp-durada-base:   200ms;
  --sdp-durada-panell: 280ms;
  --sdp-durada-sostre: 300ms;    /* cap interacció el supera */
  --sdp-corba-eixida:   cubic-bezier(0.23, 1, 0.32, 1);
  --sdp-corba-moviment: cubic-bezier(0.77, 0, 0.175, 1);
  --sdp-corba-calaix:   cubic-bezier(0.32, 0.72, 0, 1);
  --sdp-corba-suau:     cubic-bezier(0.2, 0.7, 0.3, 1);   /* la de --sdp-t-lenta */
  --sdp-escala-premut:   0.97;
  --sdp-escala-aparicio: 0.96;   /* mai scale(0) */
  --sdp-despl-aparicio:  var(--sdp-space-2);
  --sdp-focus-gruix:     3px;
  --sdp-focus-separacio: 2px;
```

**Guarda de moviment reduït**, dins de la Baseline: `@media (prefers-reduced-motion: reduce)` posa **`--sdp-escala-premut: 1`**, **`--sdp-escala-aparicio: 1`** i **`--sdp-despl-aparicio: 0`**. **Les foses de color es conserven.** **Cap `oklch()` ni `color-mix()`**: tots els colors de hover han de ser **hex precalculats en tokens** (precedent de `tokens.css:44-48`).

### [Acció: MODIFY] `src/css/components.css`, `modules.css`, `layout.css`, `AppGridShell.css` · Fase A (invisible)

**Baseline, idèntic al píxel:** els **5 usos de propietats individuals** passen a **`transform:`**. A la bafarada i al toast, els keyframes compostos són **`translateX(-50%) translateY(…)`**. **Higiene sense efecte:** els **4 `transition: all`** i els **8 temps literals** passen a **tokens del mateix valor**, i es retiren **4 `@keyframes` morts** (`sdp-reveal`, `sdp-parallax`, `sosp-spin` i `sosp-pulse`), **`--sdp-color-focus`** i els **fluids morts** `tokens.css:181-184`. **Els dos apagadors globals de moviment reduït** (`base.css:352` i `layout.css:756`) **es fusionen en un**.

### [Acció: MODIFY] els fulls amb `:hover` · Fase B (només canvia al tàctil)

Els efectes de passar-hi per damunt van dins de **`@media (hover: hover) and (pointer: fine)`**, i **`:focus-visible` sempre en queda fora**. **L'escriptori queda idèntic**, i **al mòbil desapareix el hover enganxat**. **Precedent de la casa:** `modules.css:6598`, `:6903` i `:6934`.

### [Acció: MODIFY] primitives interactives · Fase C (visible, amb el sí del Mestre)

**`--sdp-t`** passa a **`var(--sdp-durada-rapida) var(--sdp-corba-eixida)`**: **una línia** i **63 consumidors** amb ease-out. **La transició es declara a l'estat de repòs**, perquè siga **interrompible**. **Només s'animen `transform`, `opacity`, `background-color`, `border-color` i `color`.** **L'anell de focus no s'anima mai.**

**Boto:** **`:active:not(:disabled)` amb `transform: scale(var(--sdp-escala-premut))`**, en una **regla nova** que no toca la regla fixada per les proves de capes. **Portes:** el mateix. **La porta inerta (`aria-disabled`) també fa el premut**, perquè fa una acció (el toast). **Píndoles i etiquetes:** el fons amb `--sdp-durada-rapida` i el **premut 0,97**. **Quadrat (botó):** fora el `transition: all`, **l'elevació de −2 px i el canvi d'ombra**. Queda el **premut 0,97**, i el hover només amb el **color del crom (11,20)**. **Diàlegs:** entrada de **200 ms** amb **`translateY(var(--sdp-despl-aparicio))`** i opacitat. **El tancament natiu és instantani**, perquè **`@starting-style` no és de la Baseline**. **Menús i bafarades:** entrada de **150-200 ms** des de **`scale(0.96)`**, amb **`transform-origin` a la cantonada del disparador**. **Toasts:** entrada de **200 ms** i eixida de **150 ms**, aprofitant el retard de 300 ms que ja existix (`NotificationContext.jsx:25`). **Calaix de l'Índex:** reparat amb **280 ms i la corba de calaix** (Q4). **Transició de vista:** **fosa d'opacitat de 200 ms**, **sense escalar la pàgina** (article 1). **Targetes:** fora les **8 elevacions i les ombres de hover**, i la separació permanent passa per **vora** (Q6). **Peu i barra blava:** **cap transform** (llei del 260927), i **només feedback de color** (Q3).

### [Acció: MODIFY] `src/css/tokens.css`, `base.css`, `layout.css` · Fase D (tipografia fluida, visible)

**Tokens nous `--sdp-fluid-*`**, interpolats entre **20 i 64 rem** (de 320 a 1.024 px), amb els **mínims iguals a la P6** (**ningú no perd mida al mòbil**) i els **màxims moderats** (≤ ×1,17). **Les constants van precalculades**, perquè la Baseline no deixa dividir longituds dins de `calc()`.

```css
  --sdp-fluid-h1:   clamp(3rem,     2.7727rem + 1.1364vw, 3.5rem);    /* 48 → 56 */
  --sdp-fluid-h2:   clamp(2.5rem,   2.3295rem + 0.8523vw, 2.875rem);  /* 40 → 46 */
  --sdp-fluid-h3:   clamp(2rem,     1.8864rem + 0.5682vw, 2.25rem);   /* 32 → 36 */
  --sdp-fluid-h4:   clamp(1.75rem,  1.6932rem + 0.2841vw, 1.875rem);  /* 28 → 30 */
  --sdp-fluid-h5:   clamp(1.5rem,   1.4432rem + 0.2841vw, 1.625rem);  /* 24 → 26 */
  --sdp-fluid-h6:   clamp(1.25rem,  1.1932rem + 0.2841vw, 1.375rem);  /* 20 → 22 */
  --sdp-fluid-lead: clamp(1.25rem,  1.1932rem + 0.2841vw, 1.375rem);
  --sdp-fluid-cos:  clamp(1.125rem, 1.0682rem + 0.2841vw, 1.25rem);   /* 18 → 20 */
  --sdp-leading-titol: 1.2;
  --sdp-leading-cos:   1.6;
```

**On s'apliquen:** **només a la prosa** de `base.css` (h1-h6, p, llistes i `.lead`) i al **`header.page-title`**, que **deixa el seu `clamp` només en vw** (`layout.css:423` i `:432`). **Això arregla la jerarquia invertida:** a 375 px, **l'H1 de pàgina passa de 28,8 a 48 px**. **Els components** (targetes de 500 px, diàlegs i barres) **conserven els tokens fixos**, perquè **`vw` és el viewport de l'amfitrió**, no la columna. **Amb zoom al 200 %**, l'H1 creix **×1,84** (abans ×1,44). **Mesura:** `max-inline-size: var(--sdp-measure)` als paràgrafs, llistes i cites de **`.content-wrapper`**. **Interlineats:** h5 i h6 passen de **1.65 a 1.2** (són títols), i els noms antics queden com a **àlies**. **Sòl:** **14 px** com a **mínim físic** a la capa 0, i **les 34 declaracions per davall** pugen al sòl. **`--sdp-ui-sm` de 13 a 14 px.**

### [Acció: NEW] bloc Bancal a `src/css/tokens.css` · Fase E (visible, amb Q1)

**Atribut `data-contrast="bancal"`** a `:root` i `:host`. L'escriu **el mateix script del `<head>` que ja escriu `data-theme`**, perquè els tokens **no admeten `@media`** (`tokens.css:393-396`). **«Sistema»** resol `prefers-contrast: more`, que **Firefox 100 no té** (arriba al 101): **millora progressiva**, i per això fa falta **l'interruptor manual**. **El bloc fosc niat és obligatori**: sense ell, l'especificitat del fosc (0,3,0) guanya al Bancal clar.

**Contingut del Bancal:** **text suau → pedra-700** (**9,86** sobre l'app); **enllaços i accent de text → #873a01** (**7,01-7,97**); **ombres `none` i vora sòlida** (`--sdp-vora-control`); **`--sdp-escala-premut: 1`** (el feedback és de color); **pes ≥ 600** per al text de **16 px o menys**; **sòl tàctil 48**; i **opacitat 1** sobre tot text. **`@media (forced-colors: active)`** (Chrome 89 i Firefox 89; Safari l'ignora sense mal): **focus de targeta amb `outline`**, i **vores** per a diàlegs i menús.

**Correccions sempre actives (són errors):** hover de perill en fosc; **barra mòbil fosca segons la Llei de la Roca**; **anell de focus sobre les barres blaves** a 3:1 o més; **píndola premuda** sobre `--sdp-accio-control` (**9,21**); `.sdp-stat-value`; **hover d'accent → primary-400** (**8,97**), després de **migrar `modules.css:2091`** a `--sdp-accent-text-hover` (**7,97**).

### [Acció: NEW] portes (governança, amb lease de MarIA) · Fase F

**`tractor-moviment`:** prohibix **`transition: all`**, **temps literals**, **propietats individuals de transformació** i **`:hover` sense guarda**. **Lliçó 261002:** cal **document a la Wiki i aprovació del Mestre des del frontend** abans d'activar-lo. **`tractor-cromatic`:** mesura **contra l'app, la targeta i el fons subtil**, en **clar, fosc i Bancal** (hui C3 només mira el blanc, i C2 no llig el fosc). **`design_guard`:** el sòl de lletra també en **`rem`**, i a **14 px**, no a 16. **`tooling/` és governança: ho aplica MarIA amb lease.**

### Què aplicaria a la setena passada (T4)

**La setena passada és la de la graella dels 11 plugins i el Hero Toggle.** Hi aplicaria **només el subconjunt segur per al Bancal**: la **Fase A sencera** (tokens atòmics, correccions de Baseline i higiene, **idèntica al píxel**) i la **Fase B** (guarda de hover, **només canvia al tàctil**). A més, **les peces noves de la setena naixerien ja amb el cànon**, sense tocar res existent: **el premut 0,97 a les portes i al gran botó «Obrir»**, i **el Hero Toggle amb una fosa d'opacitat de 200 ms** (**sense animar l'altura**, que és maquetació). **Amb moviment reduït, instantani.** **Les correccions de contrast de la Fase E** són errors contra la doctrina AAA: **les inclouria amb el teu sí explícit**. **Les fases C i D** van **després**, amb **una aprovació per fase**, perquè **canvien la pantalla**.

### 4. Pla de Verificació (Verification Plan)

**Per fase:** `npm run porta:tokens` (T1-T6), `tractor-cromatic`, `design_guard` (**cap infracció nova**) i les **proves de capes** que fixen regles exactes (**`UniversalCard.vinyeta.capes.test.jsx:100-108`**: **cap regla fixada es toca**, i el canvi va a **regles noves**). **Llei del Píxel (fases A i B):** **A/B del CSSOM al navegador** sobre una llista fixa de superfícies (/mur, /mercat, /calendari, /consola, /traduccions, /disseny, /control, /notes, /wikidepoble), a **375 i 1.280**, en **clar i fosc**: **zero diferències** a l'escriptori. **Contrast:** **taula de ràtios** recalculada per a cada parella en **clar, fosc i Bancal**, amb **AAA o el motiu escrit**. **Moviment:** emulació de **`prefers-reduced-motion`** i comprovació que **no queda cap transform**. **Zoom:** el **200 %** a 1.280: **l'H1 creix ×1,8 o més**. **Mostrari:** **`EspecimenTipografia.jsx`** s'actualitza (**skill §9**: res existix fins que no és al manual).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

**Este pla s'ha construït amb quatre lents de recerca de només lectura**. Cada xifra porta **fitxer:línia** o el **càlcul WCAG** (lluminància relativa amb linealització sRGB). **No s'ha canviat cap fitxer de codi.** El que **no s'ha pogut verificar**: si **el woff2 és variable** (cal llegir `fvar`), **el comportament real en Chrome 100, Safari 16.0 i Firefox 100** (no hi ha navegadors antics a l'abast), **`forced-colors`** al navegador integrat, i tres valors **de memòria** (l'amplada de l'ExtraBold, ~0,56em; l'amplada del zero, ~0,57em; i el criteri de ×2,5 per a WCAG 1.4.4). **Les corbes de Kowalski i Vaul** es citen de memòria: **no són al repositori**.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

**R1 · Suavitat contra AAA.** Una ombra que se'n va, un gris que s'aclarix o un hover més fi poden **baixar de banda**. **Defensa:** la **taula de contrast per fase** i la **porta C3 ampliada**. **Cap hover baixa d'AAA si el repòs és AAA.**

**R2 · Llei del Píxel.** **Les fases C, D i E canvien la pantalla.** **Defensa:** **una aprovació per fase** i l'**A/B del CSSOM**.

**R3 · Fitxers en flux.** La **sisena passada** edita ara mateix `tokens.css`, `components.css` i `base.css`. **Defensa:** **res d'este pla s'aplica fins que la sisena acabe**, i **les línies es tornen a citar** abans de picar.

**R4 · WordPress.** **`rem` depén de l'`<html>` de l'amfitrió** i **`vw` del seu viewport**. **Defensa:** el fluid **només a la prosa i al títol de pàgina**. Els components es queden fixos.

**R5 · Baseline 2022.** `cqi`, `:has()`, `@container`, `@starting-style`, `linear()`, `oklch()` i `color-mix()` **no són de base**. **Defensa:** **només com a millora progressiva** amb `@supports`, i **la porta de moviment** vigila les propietats individuals de transformació.

**R6 · Proves que fixen regles exactes.** **Defensa:** el premut i les vores van a **regles noves**. **Canviar el valor d'un token no trenca les proves.**

**R7 · Dispositius híbrids.** `(hover: hover) and (pointer: fine)` deixa **sense hover** un portàtil tàctil que s'usa amb el dit. **És acceptable:** **el feedback de premut i de focus no depén del hover**.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261003_1951_auditoria_claude]]
- [[261003_2325_directriu_universal_card_regressio]]
- [[261003_2320_directriu_arquitectura_plugins]]
