---
type: informe
status: esborrany
description: Informe d'execució del pla 261014_0210 amb verificació del diagnòstic de Gemini, proves, revisió adversarial, contrast amb Codex i el fusible de CON-03.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1dd5e4c3-3ec8-48a8-a5ce-0a0ce6f7e4f9:89933e69-091d-4e1d-baf4-79a72e7a91d6
---
# Auditoria d'execució del pla 261014_0210: xat sense segrest, guarda sdp-media i registre de Plaquetes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1dd5e4c3-3ec8-48a8-a5ce-0a0ce6f7e4f9:89933e69-091d-4e1d-baf4-79a72e7a91d6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T01:16:04.851Z |
| Modificació | 2026-10-14T01:32:00Z |
| Propietari | agent-local |
| Aprovació humana | Pla i prompt 261014_0210 aprovats pel Mestre, i l'ordre reiterada al xat el 14-10. CON-03 no s'ha aplicat (fusible, vegeu CR-01). Sense commit. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code), amb un workflow de cinc subagents (implementació, revisió adversarial i correcció) |
| Tokens consumits | Subagents: uns 1,18 M segons el comptador del workflow. Bucle principal: no disponible. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-14T01:16:04.851Z: esborrany creat; contingut i verificació pendents. El nom porta 0320 i el document va nàixer a les 03:16 locals: l'hora del nom es va fixar per estimació abans de la creació i el rebut ja la lliga, de manera que no es pot reanomenar.
2026-10-14T01:28:00Z: suite sencera verda (17.488 proves).
2026-10-14T01:32:00Z: informe complet emés. Entrega FINAL d'este torn per al pla 0210.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu

**XAT-01 i XAT-02 estan fets, verificats contra el codi, revisats per un agent adversarial independent i corregits on calia. La suite sencera ix verda: 17.488 proves passen, 89 omeses i cap roja (30 proves més que les 17.458 de referència).**

**CON-03 no s'ha aplicat, per dos motius independents:**

- **Falta d'autoritat.** `.agents/` és zona de governança: només s'hi escriu amb `executor-mutacio.mjs` i un rebut `governance-write` signat, que Claude no té.
- **El canvi faria mentir la Consola.** Tal com està ordenat, marcaria «viu» dues subtasques que no s'executen mai.

Codex hi arriba pel seu compte a la mateixa conclusió (C4-CON-01, 261014_0235). CON-02 (instal·lar el plist a `~/Library/LaunchAgents` i carregar-lo) no figura al prompt ni a l'ordre del xat. A més, és configuració persistent del sistema, fora del repositori: no s'ha fet.

Tall: HEAD `021a03ea`, més els canvis d'esta onada a `src/sections/xat/`, `src/components/PedraSeca/`, `src/components/universal/identitat/` i `src/utils/`. També hi conviuen els de l'onada 261013_1930 (auditoria arxivada 261014_0110). **No són d'este torn** `src/config/i18n.js` ni `src/css/components.css`: els ha tocat una altra mà, i Codex ho registra a VIG-C4-02.

### El diagnòstic de Gemini, verificat al codi

| Afirmació de Gemini (0148) o del pla 0210 | Veredicte | Evidència |
| --- | --- | --- |
| `EntradaDelPoble.jsx:54-64` segresta /xat cap a `/xat/<general.id>` en ample | Cert | Codi de HEAD, línies 58 i 60 |
| El mitjà és 720 a 900 px | Parcial | L'estret és <720 (`graella.js:23`). El llindar d'ample puja amb les amplàries de columna desades (`graella.js:66-69`) |
| El mòbil és `mida === 'compacta'` (Riscos del pla) | Fals | Les mides són `estret`, `mitja` i `ample`. `compacta` és un preset d'amplària de columnes |
| `XatSection.test.jsx` cobrix XAT-01 (Verificació del pla) | Fals | El seu mock no porta `consumixEntrada`. La cobertura és a `EntradaDelPoble.test.jsx` i `XatSection.revisio260930.test.jsx` |
| `Avatar.jsx` munta `<img src="sdp-media://…">` | Cert | La prova antiga `Avatar.test.jsx:62-71` exigia literalment conservar la ref al `src` |
| `AvatarResolt.jsx` la munta quan `storage.js` torna la ref crua | Parcial | El camí existix (`storage.js:321-328` → `useResolvedAsset.js:96-103`), però els avatars van al bucket públic `mitjans` (`getPublicUrl`). Només la carpeta `notes` va a `mitjans_privats`: la guarda és defensa en profunditat |
| `marca.jsx` (`fontSegura`) la munta | Cert, camí real | El logotip d'una entitat al TPV: `PerfilContext` → `IdentitatContext:143,161` → `fontSessio.js:58` → `Tpv.jsx:192` → `UniversalTPV.jsx:210,216` |
| `EventCard.jsx:122` munta l'esquema opac | Fals | El `resolveAsset` síncron el convertix en `/sdp-media://…` (404 del mateix origen): és un altre defecte (CR-03) |
| CON-03: l'script és `scripts/immunitari/plaquetes-plan.mjs` | Fals | Qui consulta les tres subtasques és `plaquetes.mjs:243-275`; `plaquetes-plan.mjs` és un mòdul auxiliar (`prepareRecipe`) |

### Execució per front

| Front | Què ha canviat | Evidència |
| --- | --- | --- |
| **XAT-01** | Opció A de Gemini, compatible amb T1 del 260930. En la primera arribada a /xat en ample i amb sessió, `EntradaDelPoble` decidix entrar i `XatSection.entraALaComunitat` obri la **fitxa** de la comunitat del poble a la columna de llista (`/xat?comunitat=<fil.id>`, amb replace, la mateixa ruta que `obriComunitat`). Mai no obri cap fil: la dreta conserva `ColumnaDretaBuida` fins que la persona tria canal. Sense comunitat no fa res en cap mode; s'ha retirat la creació automàtica en seed/local. En estret i en mitjà, res. Si el focus era fora del Xat (també a la pàgina amfitriona, a través del Shadow DOM tancat), l'efecte T67 no el mou | `EntradaDelPoble.jsx`, `XatSection.jsx:888-903`; `EntradaDelPoble.test.jsx` reescrita; 4 proves d'integració noves a `XatSection.revisio260930.test.jsx`; `src/sections/xat`: 691/691 |
| **XAT-02** | `esMitjaOpac` passa a un mòdul neutral, `src/utils/mitjaOpac.js`, ara sense distingir majúscules, com el filtre de `sanitize.js`. `CaraXat` la reexporta i la seua API no canvia. Guarda a `Avatar.jsx`, `AvatarResolt.jsx` i `fontSegura` de `marca.jsx`: una ref opaca es tracta com a imatge absent (inicials, marca o silueta). La resta de fonts no canvien (Llei del Píxel) | Proves noves: `mitjaOpac.test.js`, `AvatarResolt.test.jsx`, `marca.test.jsx` (inclou el TPV real) i `qualitat.mitjaOpac.test.js` (ESLint, fronteres d'imports). `Avatar.test.jsx` deixa d'exigir el defecte i prova `SDP-MEDIA://` i `sDp-MeDiA://` (tanca C4-XAT-03 de Codex) |
| **CON-03** | No aplicat (CR-01) | `.agents/cron/registre_tasques.json` intacte |

### Troballes obertes

Cada troballa porta el fitxer o l'abast, l'evidència, la severitat, la font de veritat amb què entra en conflicte i una proposta conservadora.

**CR-01 · P2 · CON-03 faria mentir la Consola (fusible).** `.agents/cron/registre_tasques.json:16-48` i `src/sections/consola/mapa/construeixMapa.js:568-578`.

- La regla de l'Onada 6 marca «desconegut» una subtasca sense script amb la mare viva **a posta**: «que la mare corra no diu que execute esta subtasca».
- El job horari llança `plaquetes.mjs diagnostic --autonom`, i en mode autònom només s'executen les tasques L0 i L1 (`plaquetes.mjs:24-27` i `243`, `256`, `267`).
- `lapida-fantasmes` i `quarantena-brossa` són **L2**: no s'executen mai cada hora. Declarar-los un script les pintaria «viu» sense cap execució.
- `adopta-orfes` (L1) sí que es diagnostica cada hora, encara que no s'aplica mai (`plaquetes.mjs:290`; aplicar exigix recepta aprovada i Reflex, `:322-344`).
- Codex hi afig que `plaquetes-plan.mjs:45` rebutja `DESTRUEIX`, que és l'operació de la quarantena.

Proposta conservadora, per a MarIA amb lease:

1. Per a `adopta-orfes`, i només per a ella: `"script": "scripts/immunitari/plaquetes.mjs"`. És cert, perquè és l'script que la diagnostica.
2. Les dos L2 es queden «desconegut», o la Consola aprén a dir «aturada per nivell (L2)». Això segon és un canvi de presentació i ha de passar per un pla.

`requires_human_decision: true`.

**CR-02 · P2 · `useResolvedAsset.js` és la causa arrel de l'esquema opac al DOM (fora de l'ordre).** `src/hooks/useResolvedAsset.js:96-103` publica com a `ready` qualsevol cadena que torne el port, també una ref encara opaca. A més dels tres components blindats, encara poden pintar `sdp-media://`:

- `SdpImageNodeView.jsx:12` (`resolvedSrc || src`): probablement és la font més freqüent a l'editor.
- `UniversalEditorShell.jsx:572` i `706-707`.
- `ItemMedia.jsx:53` i `87-92`.

Proposta: publicar `missing` quan la resolució continua sent opaca, que ho arregla per a tots els consumidors alhora, amb les seues proves. `requires_human_decision: true`.

**CR-03 · P3 · 404 del mateix origen amb `/sdp-media://…`.** `EventCard.jsx:122,131`, `BarraTaronja.jsx:54-55`, `TargetaDelMur` i la portada de `PageFrame`. El `resolveAsset` síncron (`assetResolver.js:114-140`) en fa un camí relatiu. No és l'error d'esquema desconegut, i les proves ho fixen «com abans» (`EventCard.test.jsx:264-266`). Cal un pla propi. `requires_human_decision: true`.

**CR-04 · P3 · El logotip d'organització no es veu mai al TPV en remot.** XAT-02 n'ha llevat el símptoma: ara surten les inicials directament, sense una `<img>` trencada. El defecte funcional, però, continua. El `logo_url` és `sdp-media://mitjans/…/organitzacions/…`, que el port sabria resoldre amb `getPublicUrl`, però cap pas de `fontSessio.js:58` → `Tpv.jsx` → `UniversalTPV` passa pel port. `requires_human_decision: true`.

**CR-05 · P3 · XAT-01: lletra o esperit de l'ordre.** L'ordre diu «retirar el segrest». L'Opció A canvia l'obertura d'un canal per una navegació automàtica a la fitxa de la comunitat (`replace`). A més, la columna dreta mostra la pàgina destacada del Xat (`paginaDestacada`: `xat` o `anima`), no una targeta específica de cada comunitat. Hi ha dues alternatives:

- Si el Mestre no vol cap navegació: llevar `onEntra` (una línia, `XatSection.jsx:1322`).
- Si vol una presentació de la comunitat a la dreta: és un component nou, que ha de passar per un pla.

`requires_human_decision: true`.

**CR-06 · P3 · Procés: mutacions en un arbre compartit.** Per comprovar que les proves no eren inerts, dos subagents van mutar fitxers temporalment (`EntradaDelPoble.jsx` i un instant `Avatar.jsx`) i els van restaurar. Codex, que auditava alhora, va veure els mutants (C4-XAT-01: «MUTACIO») i no va poder atribuir el verd a cap tall. Lliçó: en un arbre compartit amb un auditor viu, les mutacions es fan en una còpia o en un worktree, mai al disc compartit. Els fitxers finals són els que verifica la suite d'este informe. `requires_human_decision: false`.

**CR-07 · P3 · Design Guard roig per deute previ (sense canvis).** `design_guard.mjs --arrel=src` ix amb 1 per `focus-invisible` a `.toc-drawer:focus` (`modules.css:2682`). El comentari d'eixa regla diu que la porta reconeix `ALLOW_FOCUS_INVISIBLE`, però `design_guard.mjs` no implementa cap marcador d'eixe tipus. Ja constava a l'auditoria 261014_0110 (CL-03). `requires_human_decision: true`.

### Retroalimentació de les plantilles `prompt_local` i `pla_implementacio`

1. **Verificar abans de prescriure.** El prompt donava l'script exacte de CON-03 (`plaquetes-plan.mjs`) i el mòbil com a `compacta`, i les dues coses són falses. Quan una correcció ve d'una altra IA, la plantilla pot exigir la cita `file:line` verificada per qui escriu el prompt.
2. **Dir qui té la lease** quan una tasca toca `.agents/`. Si no, l'executor local no la pot fer i el pla no ho preveu.
3. **Preguntar per la salut, no pel color.** Una tasca de l'estil «que passe a viu» convida a fabricar un verd. És millor formular-la així: «que la Consola diga la veritat sobre si s'executa».
4. **Mutacions fora del disc compartit** quan hi ha un auditor que vigila per hash (CR-06).
5. **El pla i el prompt diuen coses diferents.** El pla porta CON-02 (LaunchAgents) i el prompt no; el pla no llista `marca.jsx` al títol del front. Han de ser una sola llista.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src tests` (03:14-03:28) | **1.028 fitxers verds i 6 omesos. 17.488 proves verdes, 89 omeses, 0 roges.** Les variants en majúscules d'`Avatar.test.jsx` i `marca.test.jsx` i el comentari de `sanitize.js` es van desar amb la suite ja en marxa: es comproven a part a la fila següent |
| `npx vitest run` Avatar, marca, CaraXat, mitjaOpac, qualitat.mitjaOpac i AvatarResolt | 6 fitxers, 32/32, amb `SDP-MEDIA://` i `sDp-MeDiA://` |
| `npx vitest run src/sections/xat` (corrector de XAT-01) | 59 fitxers, 691/691 |
| Abast de XAT-02: PedraSeca, universal, xat, utils, apps, profile, realitat, search, mur, notes, detail, mercat, hooks, disseny i config | Tot verd: 273 + 137 + 106 + 56 fitxers |
| Mutació de XAT-01 (implementador, després restaurada) | Sense la guarda de mida, fallen 2 proves; tornant el salt al General, en fallen 6 |
| Revisió adversarial | XAT-01: 1 mitjana (el focus robat a l'amfitrió), corregida, i 4 baixes. XAT-02: 6 baixes; la de majúscules s'ha corregit, i la resta són CR-02, CR-03, CR-04 i comentaris (`sanitize.js:199-205` corregit, `XatContext.jsx:1358` actualitzat) |
| Codex, auditoria viva (VIG-C4-01 i 02) | Mateixa conclusió sobre CON-03. Focus de XAT-01 verificat amb 143 proves. Majúscules (C4-XAT-03) detectades i ara tancades |
| Navegador (pestanya de fons, 1440×900, seed, sense poble d'amfitrió) | `/xat` mostra la llista i la presentació a la dreta, sense errors de consola. El camí de XAT-01 exigix un amfitrió amb `poble` i sessió: no es reprodueix a localhost, i el cobrixen les proves d'integració amb un amfitrió simulat i un Shadow DOM tancat |
| `node tooling/gates/design_guard.mjs --arrel=src` | Eixida 1 per CR-07, deute previ. Baixen inline-style (17 a 4), touch-too-small (3 a 2) i raw-color (20 a 17) |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit.** L'arbre barreja les dos onades de Claude amb canvis aliens (`i18n.js`, `components.css`, `.agents/`, l'índex, l'arxiu i el graf d'Obsidian).
- **Res a `.agents/`:** ni CON-03 ni el relleu d'ESTAT i LEDGER. Claude no té lease de governança, i el relleu és de MarIA.
- **No executat per bloqueig del hook:** les proves `node --test`, `tancament.mjs --check` i `mapa-consola.mjs --json`. Este últim és la verificació que proposa el pla, i no s'ha pogut fer perquè CON-03 no s'ha aplicat.
- **No fet:** CON-02 (LaunchAgents, configuració persistent fora del repositori i fora del prompt); CR-02, CR-03 i CR-04, que són fora de l'ordre.
- **Llegits sencers:** l'auditoria de Gemini 0148 (v2), el pla i el prompt 0210, l'auditoria de Codex 0235, el pla i el prompt de Gemini 0130 i l'estudi del laboratori 1600 (en el torn anterior). Res de `90_arxiu_historic/`.
- **Cap cron ni schedule creat.** El workflow ha acabat i les pestanyes de fons del navegador estan tancades.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_0210_pla_implementacio_reparacions_xat_i_consola]]
- [[261014_0210_prompt_claude_reparacions_xat_i_consola]]
- [[261014_0148_auditoria_gemini4]]
- [[261014_0235_auditoria_codex]]
- [[../90_arxiu_historic/261014_0110_auditoria_claude]]
