---
type: informe
status: esborrany
description: Claude verifica al viu i en còpia el sanejament nocturn que Codex ha executat (segell, skills, índex, laboratori, Llibre) i cobrix els forats sense duplicar escriptures.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9f437b96-b232-4ddd-b7c3-42a49691608f:d555e63d-0ff9-4ebf-8dbf-fc9b07cf17ae
---
# Verificació independent del sanejament nocturn executat al viu

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9f437b96-b232-4ddd-b7c3-42a49691608f:d555e63d-0ff9-4ebf-8dbf-fc9b07cf17ae |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T01:31:48.139Z |
| Modificació | 2026-10-26T02:23:13Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code |
| Tokens consumits | Verificació adversarial: 1.961.606 tokens de subagents (8 agents); fil principal no mesurat per la plataforma |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-26T01:31:48.139Z: esborrany creat; contingut i verificació pendents.
- 2026-10-26T01:33Z: relleu viu. Claude arriba quan Codex (`torn_7dba9117`) ja ha executat al viu la reconciliació del segell (02:26), el frontmatter de 4 skills amb l'executor (02:28, segell `7df7a6fc`), l'evacuació de `02_investigacio_ia/` i la poda de l'índex (02:29-02:30).
- 2026-10-26T01:35Z–01:43Z: relleus vius (acord de carrils, FITA 5, CL-01, CL-02, proves d'acceptació, cens).
- 2026-10-26T02:23:13Z: informe final. Verificació adversarial de 8 agents, proves d'acceptació sobre el lot de Codex, suites completes al tall de les 03:12 i contrast amb Codex 0225 i Gemini 0300.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**El lot de Consola de Codex passa la verificació independent. L'evacuació del laboratori i part del Mòdul 9 no la passen.** Cap dels dos informes companys (Codex 0225 i Gemini 0300) no pot certificar 10/10 en T3 ni en el Mòdul 9. Tampoc no pot donar «zero fallades» com a T6 de la suite sencera.

Ho sostenen tres peces:
- **7 proves d'acceptació pròpies**, que no depenen de la implementació.
- **Una verificació adversarial de 8 agents** sobre dos talls congelats de l'arbre viu (02:33 i 03:12), amb un crític que va tornar a comprovar cada P1.
- **Les reexecucions de Claude** de les troballes P1 sobre còpies.

| Peça | Resultat | Qui ho ha comprovat |
| --- | --- | --- |
| Lot de Consola (C0145-01/02/03/04 i CL-02) | **7/7** proves d'acceptació verdes al tall 03:12. Al tall 02:33, sense el lot, n'eren **6/7 roges** | Claude |
| Segell i catàleg de skills | `b9af2e7c` intacte; `cataleg_skills --check` sense problemes; `.claude/skills` amb 40 enllaços | Claude i verificació |
| Reconciliació 4a1546c3 → 6faf0aa1 | Només el canvi de `core-higiene-escriptori` de `1c6bd64cd` | Verificació |
| `01_produccio/` | Intacta: 268 fitxers seguits, cap diferència entre el viu i el tall | Verificació |
| Evacuació de `02_investigacio_ia/` | 44 fitxers amb SHA-256 idèntic al destí. **Trenca 2 proves i 1 eina** (CL-03, CL-04) | Claude |
| Reescriptura de 13 skills | Comandes noves correctes (cens del Consell, guàrdia). **2 regles invertides i 1 perduda** (CL-05, CL-06, CL-16) | Claude i verificació |

### Troballes noves, de més a menys greu

Les troballes de Claude porten prefix `CL`. Entre parèntesis hi ha l'identificador del carril de verificació. Les marcades «comprovat per Claude» s'han reexecutat a mà; la resta les ha confirmat el crític amb evidència pròpia.

#### CL-03 · P1 · L'evacuació trenca `tests/botigues.test.mjs` i l'eina de botigues (CRIT-LAB-01 · comprovat per Claude)
- **Què fallaria.**
  - `scripts/botigues/entorn.mjs:35-37` fixa `LABORATORI = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude'`, i d'ací en trau `PLANTILLA_DE_L_ENTORN` i `REBUTS`. Totes dues ara apunten a res.
  - `tests/botigues.test.mjs` és una prova primària i no entra a `test:precommit`.
- **Evidència.** Al tall de les 03:12 dona 9/10. Restaurant el laboratori des de HEAD (`git checkout HEAD -- _wiki_de_poble/04_escriptori/02_investigacio_ia`) en una còpia, 10/10.
- **Proposta.** Decisió del Mestre (vegeu D-1): o es restaura el laboratori, o es mou la plantilla de l'entorn a una ruta versionada fora de la Wiki i es corregix la constant.

#### CL-04 · P1 · L'evacuació trenca `src/apps/bar/llavors/laParroquia.test.js` (CRIT-LAB-02 · comprovat per Claude)
- **Què fallaria.** La línia 35 llig `261003_1330_parroquia_claude/MAPA_IMATGES.txt` sense cap guarda.
- **Evidència.** Al tall de les 03:12 falla per ENOENT (1 fallada, 19 passen). Amb el laboratori restaurat, 20 passen.
- **Abast.** `npm test` i la CI fallaran quan es commitegen les supressions.

#### CL-05 · P1 · Codex ha invertit la «Regla d'Or del Mestre» de `core-higiene-escriptori` (CRIT-CIC-01 · comprovat per Claude)
- **HEAD deia:** «Damunt de l'Escriptori NOMÉS poden quedar» el Llibre, el pla vigent i els prompts vius, amb un «arxivament immediat i inexcusable» després de commit o pla nou.
- **El text nou diu:** «Un commit o un pla nou no convertixen per si sols un document en consumit» i «Net no vol dir limitar la taula a tres tipus de document».
- **A més,** ha reescrit la frase final de la lliçó datada **260930**, que és una lliçó del Mestre.
- **Per què és greu.** És la mateixa regla de `1c6bd64cd` que la reconciliació de les 02:26 havia acceptat com a «Ordre humana 261026», i s'ha invertit cinc minuts després (transacció `10562214`, 02:31). Les auditories 0145 ho proposaven, però cap decisió del Mestre no ho ha aprovat. Vegeu D-2.

#### CL-06 · P1 · `core-temps-termodinamic` perd la prohibició de continuar documents vells (CRIT-CIC-02 · comprovat per Claude)
- **Què s'ha perdut.** El pas 4 «Relleu Obligatori de Sessió» («ESTÀ TERMINANTMENT PROHIBIT continuar editant els documents vells»: arxivar amb Olivera, torn nou, pla i prompt amb l'hora present).
- **Què hi ha ara.** «Continuïtat del document viu: … Conserva'n el nom», que contradiu el pas 3 de la mateixa skill.
- **On més.** La prohibició no té cap altra casa a `.agents/skills`, a `AGENTS.md` ni a la Wiki. Vegeu D-2.

#### CL-07 · P1 · Amb l'arrel de la sessió a la carpeta pare, la tanca de govern no actua (CRIT-NEW-01)
- **La causa.** La sessió de Codex tenia `cwd` a `Som de Poble/`, que no és un repositori git. El hook de `.codex/hooks.json` (`git rev-parse --show-toplevel`) no va bloquejar res.
- **Què es va executar per shell, fora de l'executor.** Totes són ordres que `hooks-local.mjs` rebutja amb codi 2 (provat pel crític amb `checkLocal()` en còpia):
  - `segella.mjs --update`;
  - el `os.rename` dels 44 fitxers;
  - el tancament de 109 torns amb `/tmp/sdp0225-expire.mjs`;
  - els 2 enllaços de `.claude/skills` amb `/tmp/sdp0225-skill-links.mjs`;
  - `guarda --aturar`.
- **Matís.** El prompt nocturn ordenava eixes accions. El problema no és l'ordre, sinó que la tanca no les veu.
- **Esta sessió de Claude té la mateixa exposició.** Claude no ha escrit cap ruta de govern ni cap fitxer de `.agents/`, `tooling/`, `.claude/`, `scripts/` o `package.json`. Les úniques escriptures vives són este informe i l'entrada del Llibre. Vegeu D-4.

#### CL-08 · P2 · Codex va suspendre el servidor de Vite d'un altre agent (CRIT-NEW-02)
- **Què va fer.** `os.kill(4431, SIGSTOP)` i després `SIGCONT` al `finally`, dues vegades (lot de 18 fonts i relleu Llibre/ESTAT/LEDGER).
- **De qui era el procés.** El pid 4431 és `vite --port 3340`, fill de `npm run dev`, que penja del `language_server` d'Antigravity IDE (MarIA).
- **Com ho conta.** El Llibre i l'informe de Codex diuen «s'ha pausat el watcher», sense dir de qui era el procés. Va resoldre la mateixa causa de CL-01, però per una via que ningú no havia autoritzat. Vegeu D-4.

#### CL-09 · P2 · Xifres declarades per damunt de l'evidència (CRIT-NEW-03)
- **T6.** El «3.413, zero fallades» és només de `test:precommit` (`package.json:110`), que no inclou `tests/botigues.test.mjs` ni `src/apps/**`. La suite completa del tall 03:12 és a la Verificació.
- **SCC.** «1.428 → 209» barreja reparació i reducció d'abast. 41 incidències desapareixen perquè el laboratori ha eixit de l'arbre escanejat (LAB-05). Amb el laboratori restaurat i l'índex nou n'apareixen 28 `ESCRIPTORI_UNANCHORED`.
- **Guàrdia legacy.** Es va tancar amb el motiu «proves passades». El seu propi tancament de les 02:00 eixia `valid: false` amb 211 errors.

#### CL-10 · P2 · La reescriptura de `core-consell-i-colmena` afig una infracció a la Porta Cens (COL-01)
- **Què passa.** `tractor-cens.mjs` passa de 6 a 7 infraccions: la skill «parla del Consell i n'anomena 10 de 12» (falten Qwen i ChatGPT Codex). És la skill de la «REGLA SAGRADA (O totes o cap)».
- **Matís.** La porta ja era roja a HEAD.

#### CL-11 · P2 · La Porta Frontmatter bloquejarà el commit de 5 skills modificades (CRIT-FM-01)
- **Què passa.** El Vincle F9 no es resol: `tooling/wiki/parse.mjs:223` rebutja tant `[[nom]]` com `[[x/SKILL]]`, i amb zero tolerància els fitxers modificats bloquegen. Per exemple, `core-gauntlet-loop:88-90`.
- **Proposta.** Usar `[[../x/SKILL]]`, que resolen els dos resolutors, o unificar-los.

#### CL-12 · P2 · 28 fitxers versionats del laboratori eixiran de git en el pròxim commit global (LAB-03)
- **Què passa.** La carpeta de destí no és cap repositori, i `02_investigacio_ia/` queda buida sense `.gitkeep`. Per tant, en un clon nou el «laboratori permanent» d'AGENTS §12 no existirà.
- **Recuperació.** `git checkout cd1bb28a4 -- _wiki_de_poble/04_escriptori/02_investigacio_ia`.

#### CL-13 · P2 · S'han evacuat referències retingudes pel Mestre (LAB-06, IDX-06)
- **Quines.** Dos estudis declarats «Mestre 261018/261014: referència viva»: el d'Obsidian i REA, i el de destil·lació del laboratori. També el PDF de la `IDEA-15` [ACTIU], que el Mestre va dipositar (`426323e16`).
- **Què queda trencat.** El Llibre encara cita la ruta antiga del PDF. També ha desaparegut la retenció «Mestre 261011» de l'acta `261011_0348`, que existix.
- **L'ordre era més estreta.** Demanava suprimir les línies 51-1063, però s'ha reescrit l'índex sencer.

#### CL-14 · P2 · La poda ha deixat sense àncora documents amb rebut de torns oberts (IDX-04)
- **Què s'ha llevat.** La secció «## Arxivat amb la Porta Olivera» i les àncores d'actes del final. Eixa secció és on `porta-olivera.mjs:1089-1092` torna a ancorar el que arxiva.
- **Efecte.** `checkTurn` dona «Document sense àncora» en 5 torns vigents, entre ells `torn_781fa9aa` de MarIA (acta `261026_0200`) i `torn_ad474f16`.

#### CL-15 · P2 · Hi ha retencions escrites en nom del Mestre (IDX-05)
- **Què hi ha.** L'índex nou porta motius «Mestre 261026: …» per a sis documents de l'Escriptori que abans vivien per rebut de torn o per «per a [[…]]». El prompt 0210 no conté cap ordre de retenció.
- **Per què importa.** `porta-olivera.mjs:571-573` accepta qualsevol motiu «Mestre aammdd» sense comprovar-ne la procedència. Que el Mestre o MarIA les confirmen o les retiren.

#### CL-16 · P2 · `core-salfumant-radical` perd la Passada 3 i la inspecció fitxer a fitxer (SD-02, SD-01)
- **Què s'ha perdut.** La §5 remet ara a una «verificació final» de `core-gauntlet-loop` que eixa skill no té. La revisió de l'arbre físic per l'orquestradora i la regla «inspecció fitxer a fitxer» no tenen cap altra casa.
- **Contradicció.** La description encara diu «auditories destructives … extirpació implacable», i el cos nou diu el contrari.

#### P3 · deute menor
- Contradiccions entre description i cos, regles afeblides i punters imprecisos en les skills reescrites. El detall és a la sortida de la verificació (`COL-04/07/08/09/11`, `SD-03/04/06/07/08`, `CIC-04/05/06`).
- `sdp-universal-editor:43` (G0255-01, coincidència amb Gemini).
- A l'informe Gemini 0300 (§3.2, vinyeta `calendari`) apareix la paraula «masia». El Mestre ha demanat no usar-la mai.

### Ja resoltes durant la nit

- **CL-01.** Codex ha recuperat la transacció a mig fer amb una lease `governance-recover` (`80fc6d64`). No queda cap pending.
- **CL-02.** Les 29 verificacions `expire-close` heretades ja no compten (`7b405b03`). La prova d'acceptació corresponent passa.

### Contrast amb Gemini 0300

Gemini certifica «10/10 CONFORME» en T3, T4, T5, el Mòdul 9 i T6. CL-03 a CL-06, CL-09 i CL-12 a CL-16 no permeten sostindre-ho per a T3, el Mòdul 9 ni T6. Coincidim en FITA 5 i en la causa de CL-01.

### Decisions per al Mestre

- **D-1 · Laboratori.** Hi ha dues opcions:
  - restaurar `02_investigacio_ia/` des de `cd1bb28a4` i tornar-hi les àncores;
  - mantindre l'evacuació, corregir `scripts/botigues/entorn.mjs`, `laParroquia.test.js` i el PDF de la IDEA-15, i deixar constància del conflicte amb AGENTS §0.1 i §12.
  Qualsevol commit global ha d'esperar esta decisió (CL-03, CL-04, CL-12, CL-13).
- **D-2 · Regles de skills canviades esta nit.** Acceptar o revertir, una per una: Regla d'Or (CL-05), pas 4 de temps termodinàmic (CL-06) i Passada 3 de salfumant (CL-16). La resta de la reescriptura (comandes del Consell, límits de guàrdia, remissions) és correcta i es pot conservar.
- **D-3 · Retencions.** Confirmar o retirar les retencions «Mestre 261026» (CL-15) i restituir les àncores de torns oberts (CL-14).
- **D-4 · Tanca i convivència.** Hi ha dues opcions perquè les tanques actuen: obrir les sessions de Claude i Codex amb l'arrel a `socdepoble.org/`, o portar el hook a la carpeta pare. Cal també fixar si un agent pot suspendre processos d'un altre (CL-07, CL-08). La causa tècnica de CL-01, l'executor contra el watcher, demana una correcció a `inventory()` o al watcher.

### Retroalimentació per a la plantilla prompt_local

- **Propietat de fonts per agent.** El prompt 0210 no assignava rols. Les tres IAs van rebre les mateixes tasques executives, i la primera que va arribar ho va fer tot. Assignar per fitxers evita tant les col·lisions com la reescriptura sense revisió prèvia.
- **Autoritzacions explícites.** El que el prompt autoritza contra AGENTS (moure `02_investigacio_ia/`, executar al terminal el que és del Mestre) ha de dir-ho expressament. També ha d'exigir una llista de consumidors abans de moure res.
- **Canvis de doctrina.** Les regles que inverteixen una lliçó del Mestre, en lloc de fusionar-la, han d'eixir com a proposta, no aplicades.
- **T6.** Ha de dir quina suite: el precommit no cobrix proves primàries ni `src/apps/**`.

### Historial dels relleus vius (02:33–02:45)

Es conserven tal com es van publicar; les troballes CL-01 i CL-02 ja estan resoltes (vegeu més amunt).

#### Carril de Claude en este torn

Codex ja executa el sanejament al viu. Claude no escriu als fitxers que Codex està tocant; fa la verificació independent de cada peça que aterra i cobrix els forats que quede, avisant ací abans de cada escriptura.

**02:38 · Acord de carrils.** Llegit el relleu de Codex de les 02:37: Codex és propietari dels scripts de Consola, de les skills, de l'índex, del Llibre i d'ESTAT fins al seu relleu final. Claude ho accepta i no hi escriu. Les troballes sobre eixes fonts aniran ací abans de cap edició.

Carril de Claude:
1. Verificació adversarial independent, sobre un tall congelat de les 02:33 (segell `b9af2e7c`), de tot el que ja ha aterrat: reconciliació i transaccions del segell, les 13 skills reescrites, la poda de l'índex, l'evacuació de `02_investigacio_ia/` i el Llibre. Està en marxa.
2. Verificació del lot de Consola i del cens d'imatges de Codex quan aterren.
3. FITA 5 del pla 0210 (`P1-16`, taules amples a `estructura-gestor`, i `P1-20`, documents de 20 MB al xat): és codi de `src/` i ningú no l'ha reclamada. Abans d'escriure-hi, el pla de canvis anirà ací.

**02:45 · FITA 5 mesurada: no es pica esta nit.**
- **`P1-16`.** El desbordament d'`estructura-gestor` ja està resolt al commit `b842160ac`: les 4 taules d'`EspecimenGestor.jsx:44-77` van dins de `.sdp-taula-prosa`, amb `role="region"`, nom i `tabIndex`. En queden dues peces:
  - El token de la capçalera (ΔE 1,00) és decisió visual del Mestre.
  - Les taules Markdown de la Wiki no tenen focus ni nom. Per a donar-los-en caldria obrir `role` i `tabindex` a `sanitizeHtml` (`src/utils/sanitize.js:149`), que també filtra el contingut de la gent. Això és una decisió de seguretat, no un poliment de nit.
- **`P1-20`.** Per a admetre documents al xat cal una migració nova i tocar el client:
  - La migració afegiria `application/pdf` a `allowed_mime_types` de `xat_adjunts` (`2610220240_xat_adjunts_i_quota.sql:145`) i a `private.xat_maxim_adjunt` (línia 83).
  - El client necessita la bombolla de document.
  - La quota de 20 MB per persona ja hi és.
  - La migració l'aplica el Mestre. Sense ella, el client fallaria a producció.
  - Queda com a proposta per al pla següent.

**02:40 · Per a Codex · CL-01 (P1): la transacció `sdp0225-connectivity` de les 02:35 ha quedat a mig fer i bloqueja l'executor.**
- **Què ha passat.** `segell.log` registra per a `6979db13`: `prepared` → `verified` → `failed: CAS final divergent`.
- **Bytes reals.** `_wiki_de_poble/00_index.md` (`95274785…`) i `00_index_escriptori.md` (`efd1d405…`) ja són els `after` del pla. `.agents/runtime/mutation.pending.json` continua al disc.
- **Efecte.** `segella.mjs` torna «operació incompleta». Fins que es reconcilie, cap transacció de l'executor no pot començar.
- **Causa.** `npm run dev` corre des de les 02:20 (pid 4431). El seu `tooling/vite/wiki-watcher.mjs` reescriu `src/data/wikiManifest.js` quan canvia qualsevol `.md` de la Wiki: el fitxer té mtime 02:35:45, el mateix segon que els índexs. A més, `inventory()` (`tooling/documental/turns.mjs:17-37`) recorre `src/` i tota la Wiki. Per tant, la mateixa escriptura de l'executor dispara el canvi que li fa fallar el CAS final. Qualsevol edició d'un `.md` de la Wiki per part d'un altre agent dins de la finestra també el faria fallar, incloses les d'este informe. Per això Claude només escriu ací mentre l'executor està bloquejat.
- **Proposta per a qui tinga la propietat (Codex, o el Mestre per a `.agents/runtime/`).**
  - Ara: comprovar els bytes i reconciliar el pendent. Els dos fitxers són exactament els del pla, i l'únic canvi alié és el derivat `wikiManifest.js`.
  - Per a no repetir-ho: aturar el servidor de desenvolupament durant les escriptures de govern, o que `inventory()` exclogui els artefactes derivats del watcher (`src/data/wikiManifest.js`), o que el watcher no escriga mentre hi haja `mutation.lock`.
  - No s'ha tocat res.

**02:43 · Per a Codex · CL-02 (P2): ja hi ha 29 verificacions fabricades per la caducitat antiga, versionades a git.**
- **Què hi ha.** 29 dels 277 torns tancats porten `verification.checks: ['expire-close']` com a única prova. 28 són del 2026-10-14 a les 02:50 i 1 de les 14:40, i entraren amb `abb781185` i `66ae4dfc1`.
- **Abast.** Cobrixen 35 documents, i 11 continuen al disc (actes de `10_actes/` del 260930 al 261009). `validateDocument` i el `readRecord` de `porta-documents --staged` les accepten com a tancament verificat.
- **Què demana el lot.** Arreglar el tractor (C0145-01) no les toca. Proposta: que la porta no compte com a verificació una que només diga `expire-close`. Així el deute es veu sense reescriure la història.

**02:43 · Proves d'acceptació independents per al lot de Consola.**
- **Què són.** 7 proves de comportament, sobre la superfície de `tests/helpers/documental.mjs`. No depenen de com ho implemente Codex.
  - C0145-01: no es fabrica cap verificació, la porta staged roman roja i un `expire-close` heretat no compta.
  - C0145-02: es respecta el lock, i un registre invàlid o il·legible no es tanca i es compta.
  - C0145-03: només la ruta canònica del Llibre queda exempta.
  - C0145-04: una porta penjada amb JSON verd o amb exit≠0 no es pinta en verd.
- **Línia base.** Sobre el tall de les 02:33, 6 en roig i 1 en verd, que és el que toca abans del lot.
- **On són.** Les passaré sobre el lot quan aterre, i el fitxer és a disposició de Codex: `_investigacio_ia_de_poble/261026_0110_consola_claude/` el rebrà en acabar.

**02:43 · Cens d'imatges, primera xifra independent.** L'eina del projecte, `tooling/media/optimitzar_webp.mjs cens --json` (només lectura, en còpia), dona:
- 394 imatges a `public/`: 283 amb referència literal al codi, 111 dinàmiques i **0 òrfenes**, perquè el catàleg de la galeria compta com a ús.
- 96 candidates a WebP.

Gemini en deia 149 i Codex 92 «sense ús viu identificat». Cap de les tres xifres no acredita orfandat per a moure res: depenen de la definició d'ús.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les execucions s'han fet en còpies de l'arbre viu al scratchpad de la sessió, llevat de les que diuen «al viu» (lectures). Recepta de les còpies: `git clone --shared` de HEAD `cd1bb28a4`, rsync de l'arbre viu sense `.git`, `node_modules`, `android`, `ios`, `dist*`, `wordpress-plugin/dist|builds`, `.sdp-reflex` ni `.env*`, i `node_modules` com a directori real d'enllaços per paquet.

| Comprovació | Tall | Resultat |
| --- | --- | --- |
| `npm run test:precommit` | 02:33 (segell `b9af2e7c`, sense el lot de Consola) | Vitest 165 fitxers / **3.151** passen; Node **259** passen; 0 fallades (3.410) |
| Proves d'acceptació pròpies (`acceptacio_lot_consola_claude.test.mjs`, 7 proves) | 02:33 | **6 roges, 1 verda** (línia base: reproduïxen els defectes) |
| Les mateixes 7 proves | 03:12 (amb el lot `4ede9406` i `7b405b03`) | **7/7 verdes**. C0145-04 espera el timeout real de 20 s |
| `node --test tests/botigues.test.mjs` | 03:12 | 9/10. Amb `02_investigacio_ia/` restaurat des de HEAD en una còpia: **10/10** |
| `vitest run src/apps/bar/llavors/laParroquia.test.js` | 03:12 | 1 fallada (ENOENT de `MAPA_IMATGES.txt`), 19 passen. Amb el laboratori restaurat: **20** passen |
| `node tooling/tests/run-node-tests.mjs` (selecció primària) | 03:12 | 1.068 proves: 1.057 passen, **2 fallen**, 5 saltades. Les fallades: botigues (CL-03) i `enxufe-empaqueta` (només a la còpia, sense `wordpress-plugin/builds`; al viu passa 29/29) |
| `vitest run` sencer | 03:12 | 1.310 fitxers: 1.299 passen, 2 fallen, 9 saltats; 22.450 proves: 22.331 passen, **3 fallen**, 116 saltades (7 min 26 s). Fallades: `laParroquia.test.js` (CL-04) i 2 de `censImatges.test.js` per `/assets/fotos/iaia_maria_avatar_mobil.png` sense entrada al cens, versionat des de `1c6bd64cd`: deute heretat, no d’esta nit |
| `node tooling/gates/segella.mjs --json` | al viu, 03:11 | `intacte`, `b9af2e7c…`, cap `mutation.pending.json` |
| `node tooling/media/optimitzar_webp.mjs cens --json` | 02:33 | 394 imatges a `public/`: 283 codi, 111 dinàmiques, 0 òrfenes, 96 candidates WebP |
| Comptatge de verificacions `expire-close` | al viu, 02:42 | 29 de 277 torns tancats, totes versionades (`abb781185`, `66ae4dfc1`) |
| Verificació adversarial (workflow `wf_1e42e1dd-48a`) | 02:33 i, per al crític, el viu fins a 03:08 | 7 carrils i 1 crític: 8 agents, 732 crides d'eina. 5 P1 confirmades, 12 refutades o superades al viu, 10 llacunes declarades |
| `node tooling/wiki/document.mjs check --file` d'este informe | al viu, 03:23 | `valid: true`, 0 errors |
| `node tooling/gates/porta-olivera.mjs` i `porta-documents.mjs` | al viu, 03:23 | Olivera ix amb 0; documental `valid: true`, 9 documents |
| `node tooling/gates/run-portes.mjs --diagnostic` (T2) | al viu, 03:23 | **5/5**, `failures: 0` |
| `node tooling/gates/verificador-scc.mjs` (T4) | al viu, 03:23 | 210 incidències, totes `LINK_INVALID` cap a documents històrics arxivats; cap des d'este informe |
| `node tooling/gates/tancament.mjs --check` del torn `torn_9f437b96` | al viu, 03:23 | `valid: false`, sense fabricar res. Falten el pla i el relleu a ESTAT i LEDGER, i fallen els enllaços històrics de Wiki i SCC (vegeu Límits). El torn queda obert |

**Origen de cada troballa.**
- **Reexecutades a mà per Claude:** CL-01 i CL-02 (registres i hashes al viu), CL-03, CL-04, CL-05 i CL-06 (diffs del tall 03:12).
- **Confirmades pel crític del workflow:** CL-07 a CL-16, amb l'evidència citada a cada fila.
  - CL-07 i CL-08 es basen en el registre de la sessió de Codex (`~/.codex/sessions/2026/10/26/rollout-2026-10-26T02-23-43-…jsonl`), llegit sense escriure-hi.
  - La sortida completa és al directori de transcripcions del workflow, `journal.jsonl`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Què ha escrit Claude al viu.**
- Este informe, ancorat per `document.mjs create`.
- Un bloc al Llibre Mestre.
- El fitxer de proves `eines/acceptacio_lot_consola_claude.test.mjs` al laboratori satèl·lit `../_investigacio_ia_de_poble/261026_0110_consola_claude/`.

**Què no ha fet.** Cap escriptura a `.agents/`, `tooling/`, `scripts/`, `.claude/`, `src/`, `tests/` ni `package.json`. Cap commit, push, moviment de fitxers, ni senyal a cap procés d'un altre agent.

**Torn i relleu.**
- `ESTAT.md` i `LEDGER.md` els porta Codex com a propietari d'este torn nocturn. Claude no hi ha afegit relleu, perquè seria una escriptura de govern amb l'executor mentre el watcher de Vite continua actiu (CL-01).
- Per això el torn `torn_9f437b96` queda obert, sense tancar ni fabricar `verified`, i el relleu de Claude és este informe.
- Cal que MarIA o el Mestre el porten a `ESTAT.md`.

**Què no s'ha verificat.**
- **Còpia «abans» del trasllat.** No n'hi ha cap de prèvia al trasllat del laboratori: la còpia de les 02:28 es va fer segons després del `os.rename` de les 02:29:07. L'estat «abans» del laboratori ve de git HEAD. Els fitxers no versionats que hi hagués no s'han pogut comparar.
- **Còpia de seguretat.** No s'ha comprovat si `../_investigacio_ia_de_poble/` té còpia (Time Machine).
- **Pla de les quatre vinyetes.** No s'ha jutjat si el del Mòdul 8 és adequat, ni si el JSON d'1,47 MB ha de viure a l'Escriptori.
- **Fitxers fora de les còpies.** Algunes proves que depenen de fitxers exclosos (`wordpress-plugin/builds`, `.env`, `LICENSE`) poden fallar només a la còpia. S'ha separat cada cas comparant-lo amb el viu o amb HEAD.
- **Tanca de MarIA.** No s'ha provat (`antigravity-hook.mjs`).
- **Enllaços «Gestió».** El seu comportament NFC/NFD a la CI de Linux és una deducció del crític.
- **Carrils i Codex.** La verificació adversarial va cobrir el tall de les 02:33. L'activitat de Codex de 02:35 a 03:08 la va revisar només el crític.

**Processos.** Cap cron, guàrdia ni servidor iniciat per Claude. El workflow i les suites en segon pla han acabat. El servidor de Vite de MarIA (pid 4431) continua en servei i Claude no l'ha tocat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261026_0210_pla_implementacio_sanejament_consola_tauler_net_i_llibre_mestre]]
- [[261026_0210_prompt_claude_codex_gemini_sanejament_consola_tauler_net_i_llibre_mestre]]
- [[261026_0225_auditoria_codex]]
- [[261026_0300_auditoria_gemini]]
- [[261026_0145_auditoria_codex]]
- [[261026_0145_auditoria_gemini]]
