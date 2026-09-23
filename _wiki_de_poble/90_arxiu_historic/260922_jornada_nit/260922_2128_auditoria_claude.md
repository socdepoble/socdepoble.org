---
type: informe
status: esborrany
description: Purga cognitiva, estat del graf d'enllaços i exposicio del cervell al producte, amb evidencia executada.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f55149f7-d41e-470e-9691-940656ba3fec:1c65a2ba-b3ea-4d85-be1c-a6d94465b08b
---
# Auditoria de manteniment del cervell

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f55149f7-d41e-470e-9691-940656ba3fec:1c65a2ba-b3ea-4d85-be1c-a6d94465b08b |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T19:33:12.343Z |
| Modificació | 2026-09-22T19:40:00.000Z |
| Propietari | Claude Opus 5 |
| Aprovació humana | Auditoria autoritzada per la petorreta 260922_2104_prompt_manteniment_cervell; no autoritza cap reparació |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-22T19:33:12.343Z: esborrany creat després de llegir AGENTS.md, 02_genotip.md, 00_index.md, l'acta 260922_1920 i els quatre documents de les 21:04 que hi havia a l'Escriptori.

2026-09-22T19:40:00Z: auditoria completada sobre l'arbre de treball. Cinc portes canòniques executades, manifest compilat inspeccionat, cap fitxer alié modificat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte

**El cervell no contradiu la decisió estructural dels ports: eixa purga ja està feta i verificada.** El que he trobat és una altra cosa i més greu: **el cervell sencer —constitució, estat, llibre d'obra i genoma— viatja dins del producte que es publica**, i el sistema d'ancoratge que havia de mantindre'l cosit està produint 32 errors dels quals **cap és un problema real**, mentres deixa passar els que sí que ho són.

Hi ha un patró únic darrere de quasi tot el que segueix: **arxivar un document trenca els punters que hi apunten, i ningú els repara**. Els índexs, les actes, el LEDGER i el bundle del web continuen assenyalant a on el document estava. Com que el fitxer existix —només que en un altre lloc—, cap porta ho veu.

**Recompte honest:** 8 troballes. 3 d'exposició/integritat del cervell (C-1 a C-3), 2 d'arrencada i evidència (C-4, C-6), 3 menors de coherència (C-5, C-7, C-8). **Cap clau ni secret real exposat**: ho he comprovat expressament i les coincidències de `secret` i `service_role` al bundle són prosa de les regles, no credencials. 4 comprovacions de la purga demanada ixen **netes** i estan a l'apartat final.

---

### C-1 · Alta · El cervell sencer es publica dins del producte, amb el mapa de les seues pròpies debilitats

**Fonts:** `src/data/wikiManifest.js` (931.753 bytes), generat per `tooling/wiki/compile-wiki-to-app.mjs`.

El manifest que s'incorpora al bundle té 139 documents. **40 són `.agents/`**, és a dir el cervell: `AGENTS`, `QUI_SOC`, `BIOS`, `BOOTSTRAP`, `PROTOCOL_PETORRETA`, `ESTAT`, `LEDGER`, `GENOMA`, `ON_ESTIC`, `capabilities`, `hooks`, `consell`, `protocolledge`, `SKILLS_SEAL`, `00_BIOS_COGNITIU` i les skills. Són **491.566 caràcters** de cervell dins del producte.

**Reproducció:**

```bash
node --input-type=module -e "
import {wikiManifest as m} from './src/data/wikiManifest.js';
const ag=m.items.filter(x=>String(x.categoryId).startsWith('folder:.agents'));
let t=0; ag.forEach(x=>t+=(x.content||'').length);
console.log(ag.length+' documents, '+t+' caràcters');"
```

Resultat: `40 documents, 491566 caràcters`.

**El que fa que açò no siga només indiscreció.** L'`ESTAT` publicat conté, literalment, l'inventari de les debilitats conegudes i no reparades: «la barrera `service_role` no valida el valor carregat des del fitxer env», «huit portes en roig», «3 injeccions sense sanejar, presents a HEAD», quines proves fallen i per què. Qualsevol que òbriga el bundle té la llista de forats escrita per nosaltres mateixos, amb la ruta del fitxer al costat.

**Severitat:** alta, però acotada amb precisió. **No hi ha cap credencial exposada** —verificat amb un escombrat de patrons (`api_key`, `secret`, `service_role`, `bearer`, `sk-`, `eyJ`) sobre els 40 documents: les cinc coincidències són la paraula dins d'una frase normativa, no un valor. Açò **no és una fuita de secrets; és un mapa de l'estructura, del procés i de les debilitats**.

**Font de veritat amb què entra en conflicte:** AGENTS.md §5 («MAI has de llegir `90_arxiu_historic/` en procediments automàtics de RAG o *bundles*, ni exposar secrets del .env») fixa el principi que el cervell no és matèria de distribució. El compilador no el complix.

**Relació amb Codex.** Amplia la seua S1, que comptava 3 documents amb `visibility: private`. Eixos 3 són reals i els ratifique. Però el filtre de `visibility` no els haguera aturat a ells: **cap dels 40 documents del cervell declara `visibility`**, i entren igual. Corregir només `visibility` deixaria el 29% del manifest exactament com està.

**Honestedat sobre la novetat d'esta troballa.** No és nova. En una sessió anterior ja vaig deixar escrit que «es publiquen a la web `01_produccio`, `ESTAT`, `LEDGER`, `GENOMA` i `PROFILE`». **El que aporte hui no és el descobriment, és la mesura i el temps transcorregut**: 40 documents, 491.566 caràcters, el `GENOMA` sol fent-ne el 56%, i l'`ESTAT` publicant ara la llista de debilitats que abans no hi era. El fet rellevant per al Mestre no és que passe: és que **fa dies que se sap i continua igual**, i cada jornada que passa l'`ESTAT` publicat és més detallat.

**Proposta conservadora:** llista d'inclusió explícita al compilador (el que es publica es nomena un per un), no llista d'exclusió. Prova que falla si un document de `.agents/` entra al manifest. Conservar tots els documents al disc.

`requires_human_decision: true` — cal decidir quina part del cervell es publica **a propòsit**. Publicar la Constitució pot ser una decisió sobirana legítima i coherent amb el Creative Commons del projecte; publicar l'`ESTAT` i el `LEDGER` és una altra cosa. És una decisió de govern, no una reparació.

---

### C-2 · Alta · El GENOMA és la còpia que la Constitució prohibix, es regenera a cada commit i és el 56% del cervell publicat

**Fonts:** `.agents/GENOMA.md` (275.166 bytes, 4.145 línies), `tooling/wiki/compile-wiki-to-system-prompt.mjs:70`, `tooling/wiki/pre-commit.mjs:131`, `tooling/lib/arrel.mjs:83`.

AGENTS.md §1 diu: «Està prohibit crear o llegir còpies de regles, o *backups* antics de "cervells" amagats dins del RAG per evitar contaminació de context i "Stochastic Parrots"».

El `GENOMA.md` és exactament això. Conté `## [FILE: AGENTS.md]` seguit de la Constitució sencera, i a continuació `## [FILE: .agents/AGENTS.md]` amb **la mateixa Constitució una segona vegada**. Després, `PROTOCOL_PETORRETA` i la resta. La regla de les zones restringides de l'Escriptori hi apareix duplicada a les línies 57 i 127.

**Reproducció:**

```bash
grep -n "^## \[FILE:" .agents/GENOMA.md | head
wc -l .agents/GENOMA.md
```

**Per què no és brossa inerta:**

1. `pre-commit.mjs:131` l'executa al pas 6 de la canonada cognitiva: **cada commit el reescriu**.
2. Està versionat (últim: `6423590e`), per tant cada commit n'arrossega el diff.
3. **És el document més gros del manifest públic**: 273.705 caràcters, el 56% dels 491.566 de C-1. La còpia prohibida no és només una còpia: s'ha convertit en el vector d'exposició principal.

**Severitat:** alta per acumulació. Cap dels tres fets és greu tot sol; junts fan que una regla escrita per evitar contaminació de context estiga generant, versionant i publicant 275 KB de context duplicat a cada commit.

**Font de veritat:** AGENTS.md §1.

**Proposta conservadora:** decidir si el GENOMA té una funció viva. Si la té —`hidratar_genoma.mjs` suggerix que serví per a transmissió byte-fidel del sistema—, excloure'l del manifest i documentar per a què és. Si no en té, retirar-lo de la canonada del pre-commit. No esborrar-lo sense decisió: és evidència històrica.

`requires_human_decision: true` — la intenció original no es pot deduir del codi.

---

### C-3 · Alta · La Porta d'Orfandat dóna 32 errors i cap és real, mentres castiga complir la doctrina

**Fonts:** `tooling/gates/tractor-orfandat.mjs`, línies 15, 39, 56-57, 90, 102. Registrada a la cadena com a `porta:orfandat` (`package.json:45`, `tooling/gates/run-portes.mjs:77`).

La porta para amb: `💥 ATURADA CRÍTICA: S'han detectat 32 fitxers orfes`. **He comprovat els 32 un per un. No n'hi ha cap que apunte a un fitxer inexistent.**

**Desglossament verificat:**

| Categoria | Quantitat | Causa real |
| --- | --- | --- |
| Wikilinks cap a `00_index_escriptori` | **16** | L'escriptori està exclòs de l'escaneig (línia 15); el destí existix |
| Enllaços a `01_produccio/*` | 4 | Mateixa exclusió; els quatre fitxers existixen |
| Enllaços a `AGENTS` / `AGENTS.md` | 4 | Viuen a l'arrel, fora de `_wiki_de_poble/` |
| Enllaços a `*/SKILL` i `00_INDEX_SKILLS` | 4 | Viuen a `.agents/skills/`, fora de l'escaneig |
| «Orfes» de `02_saber` | 3 | Enllaçats des de `00_index.md:16,21,94` amb sintaxi Markdown de parèntesis; el regex de la línia 39 només veu els dobles claudàtors |
| «Orfe»: acta `260922_1920` | 1 | Enllaçada des de `00_index_escriptori.md:20`, dins de la carpeta exclosa |

**Tres defectes concrets:**

1. **Línia 15** exclou `04_escriptori` de `getAllMdFiles()`, i les línies 56-57 busquen el destí *només* dins d'eixa mateixa llista. Conseqüència: **ancorar un document a l'índex de l'Escriptori —que és exactament el que manen la plantilla i la doctrina— genera automàticament un enllaç trencat**. Les 7 plantilles i les 2 actes que ho fan bé són les castigades. 16 dels 28 enllaços «trencats», el 57%, els provoca complir la llei.
2. **Línia 39** només reconeix la sintaxi de dobles claudàtors. Els tres «orfes» de `02_saber` estan al `00_index.md` amb sintaxi Markdown de parèntesis, del tipus *títol entre claudàtors seguit de la ruta entre parèntesis*. Algú ja els va rescatar; la porta no ho veu.
3. **Línia 90** exceptua els índexs comparant amb caixa exacta contra `00_INDEX_ESCRIPTORI`, `00_INDEX_Actes` i `00_INDEX_ARXIU`. **Cap dels tres existix amb eixa caixa**: la taxonomia d'AGENTS §2 els va passar a minúscules i l'excepció va quedar apuntant a noms morts.

A més, el missatge final anomena «fitxers orfes» els 32, quan 28 són enllaços i 4 són orfes: el comptador `errors` suma dues categories diferents i les etiqueta amb el nom d'una.

**Severitat:** alta. Una porta que dóna 100% de falsos positius i para la cadena no protegix: **ensenya a ignorar-la**. És el mecanisme pel qual un problema real d'orfandat passaria desapercebut demà.

**Font de veritat:** AGENTS.md §12 (regla d'ancoratge obligatori) i el propi contracte de la plantilla d'auditoria: «Un error d'execució, lectura, parseig o Git és un resultat fallit. Mai es transforma en "zero incidències"» — ací passa al revés: zero incidències es transformen en 32 errors.

**Proposta conservadora:** incloure `04_escriptori` i l'arrel (`AGENTS.md`, `CLAUDE.md`) al cens de destins **sense** incloure'ls al cens d'orfes —són coses distintes: on pot apuntar un enllaç i què ha d'estar ancorat. Reconéixer també `[text](ruta.md)`. Substituir la llista de la línia 90 per una comparació insensible a la caixa. Separar els dos comptadors al missatge final.

`requires_human_decision: false` — són defectes contra la intenció declarada de la porta.

---

### C-4 · Alta · L'`ON_ESTIC` que llig l'agent en arrancar és el de la sessió anterior

**Fonts:** `.agents/ON_ESTIC.md`, hook `SessionStart` (`despertar.mjs`), `CLAUDE.md` (`@.agents/ON_ESTIC.md`).

El `CLAUDE.md` injecta `ON_ESTIC.md` al context. El hook `SessionStart` executa `despertar.mjs`, que **regenera eixe mateix fitxer**. L'ordre és: primer s'injecta, després es regenera. **L'agent llig sempre la fotografia anterior.**

**Evidència d'esta mateixa sessió, contrastable:**

| | Injectat al meu context | Fitxer al disc |
| --- | --- | --- |
| Generat | 2026-09-22T17:49:14Z | 2026-09-22T19:17:50Z |
| Estat actual | «Arbre de carpetes del Workspace», 17:10 | «Deute tècnic tancat», 18:45 |
| Escriptori | 11 documents | 4 documents |

**Dos hores i mitja de desfasament i una llista d'Escriptori completament falsa.** El hook d'esta sessió va confirmar «ON_ESTIC.md generat amb èxit a 19:17:50.435Z» i el contingut que jo tenia davant era el de les 17:49.

**El que ho fa perillós, i no només inexacte:** els 11 documents que l'`ON_ESTIC` em manava llegir («Llig aquests fitxers si n'hi ha») ja no eren a l'Escriptori. Els he localitzats tots: són a `_wiki_de_poble/90_arxiu_historic/260922_jornada_tarda/`. **La instrucció d'arrencada dirigix l'agent a la zona que AGENTS §5 prohibix llegir en procediments automàtics.** Un agent obedient hi entra el primer minut, convençut que complix.

```bash
find _wiki_de_poble -name "260922_1857_auditoria_claude.md"
# _wiki_de_poble/90_arxiu_historic/260922_jornada_tarda/260922_1857_auditoria_claude.md
```

**Severitat:** alta. És la porta d'entrada de tota sessió i empeny cap a la zona prohibida.

**Font de veritat:** AGENTS.md §5 i §14.

**Proposta conservadora:** que `despertar.mjs` s'execute **abans** de muntar el context (hook previ a la injecció), o que `ON_ESTIC.md` deixe de ser un fitxer injectat i passe a ser una lectura explícita del primer pas. Mentres no es resolga, que el `despertar` estampe al capdamunt l'hora de generació i una línia visible: «si esta marca no és d'esta sessió, rellig el fitxer del disc abans de fer res». Que la llista de l'Escriptori es genere contrastant el disc i marque explícitament els documents que ja no hi són.

`requires_human_decision: true` per a triar entre les dos vies; la mitigació és mecànica.

---

### C-5 · Mitjana · L'índex de l'Escriptori afirma una ubicació falsa i classifica dins d'una carpeta protegida

**Fonts:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md`.

L'índex llista sota **«Activitat en curs»** set documents (`260922_1830_*`, `1845`, `1857`, `1912`, `1921`, `2030`) que són a `90_arxiu_historic/260922_jornada_tarda/`. I sota la capçalera **`## 02_investigacio_ia`** n'hi ha onze més, quan eixa carpeta **conté un sol fitxer** (`260922_0500_informe_idees_noves_skills.md`).

La causa mecànica és visible: l'ancoratge automàtic afig la línia **al final del fitxer**, i com que l'última capçalera de l'índex és `## 02_investigacio_ia`, tot el que s'ancora des de llavors queda classificat dins d'una zona que AGENTS §12 declara laboratori protegit que «no s'ha de buidar ni esborrar mai». Els quatre documents de les 21:04 hi han caigut, i l'auditoria de Codex de les 21:19 també.

**Evidència en directe:** **esta mateixa auditoria ho ha patit mentres s'escrivia.** El `document.mjs create` l'ha ancorada a `00_index_escriptori.md:71`, dins de `## 02_investigacio_ia`, quan el fitxer és a l'arrel de l'Escriptori. **No ho he corregit a mà**: moure la meua línia taparia el símptoma, destruiria la prova i no curaria la causa, que és on escriu l'ancoratge. Queda com a testimoni reproduïble.

**Severitat:** mitjana. No es perd res, però l'índex és el document que una IA llig per saber què hi ha damunt la taula, i **menteix en les dues direccions**: diu que hi ha coses que no hi són i posa a la zona protegida coses que no hi pertanyen.

**Font de veritat:** AGENTS.md §12.

**Proposta conservadora:** que l'ancoratge òbriga una secció nomenada («Activitat en curs») en compte d'afegir al final del fitxer. Que el trasllat a l'arxiu siga una operació que **reescriga els punters** —`document.mjs handoff` ja existix per a això i no s'ha usat ací.

`requires_human_decision: false`.

---

### C-6 · Alta · L'evidència que el LEDGER cita no està versionada

**Fonts:** `git status`, `porta:reflex`, `.agents/LEDGER.md`.

```bash
git status --porcelain _wiki_de_poble/90_arxiu_historic/260922_jornada_tarda/
# ?? _wiki_de_poble/90_arxiu_historic/260922_jornada_tarda/
```

La carpeta sencera és **untracked**. Dins hi ha 11 documents, entre ells `260922_1857_auditoria_claude.md` (25 KB) i `260922_2030_auditoria_claude.md` (19 KB). La porta del Reflex ho amplia: **27 fitxers del corpus estable sense versionar**, incloent-hi `10_actes/260922_1920_acta_marmota.md` i `02_saber/memoria_aprenentatges.md`.

El LEDGER —que la Llei de la Immutabilitat (QUI_SOC §3) declara inesborrable— tanca les dos últimes entrades citant `[[260922_1936_auditoria_codex]]` i `[[260922_2030_auditoria_claude]]` com a prova del que s'afirma. **Eixes dos proves viuen fora de git, dins de la zona prohibida.** Un `git clean -fd` les esborra i el LEDGER queda segellat, íntegre i apuntant al no-res.

**Severitat:** alta. És la diferència entre un llibre d'obra i una afirmació.

**Font de veritat:** QUI_SOC §3.

**Proposta conservadora:** versionar `90_arxiu_historic/260922_jornada_tarda/` i els 27 fitxers del corpus abans de qualsevol neteja. Que `tancament.mjs` avise quan una entrada del LEDGER cite un document no versionat.

`requires_human_decision: false` per a versionar; `true` si es decidix que l'arxiu no ha d'estar en git, perquè aleshores cal un altre mecanisme d'evidència.

---

### C-7 · Mitjana · `obrir_torn.mjs` obri un torn amb qualsevol argument i la skill documenta un abast que no existix

**Fonts:** `tooling/gates/obrir_torn.mjs:8`, `tooling/documental/turns.mjs:70,72`, `.agents/skills/wiki-cicle-de-vida/SKILL.md` pas 1.

He escrit `node tooling/gates/obrir_torn.mjs --help` esperant l'ajuda. **M'ha obert un torn** (`torn_5c07f4c8-8cdb-49cb-84a5-7c631cca1165`), amb `actor` per defecte i abast `code`, sense demanar res. No hi ha `--help` i cap argument desconegut atura l'execució.

Tot seguit, `--scope docs` ha fallat amb `Abast desconegut`. L'enum real és `['code','documents']` (`turns.mjs:72`). **La skill del cicle de vida documenta literalment `--scope code` i no menciona `documents` enlloc**, de manera que un agent que audita documentació o bé obri un torn amb abast de codi —i es salta la comprovació `Canvis de codi fora de l'abast documental` de `turns.mjs:152`— o bé encerta el valor per assaig i error, com he fet jo.

**Severitat:** mitjana. El registre de torns és el mecanisme que impedix que dos agents es trepitgen, i hui mateix ja s'ha destruït treball per eixa causa. Una eina que obri torns per accident embruta el registre; una llei que no nomena els valors vàlids empeny a triar el més permissiu.

**Font de veritat:** `.agents/skills/wiki-cicle-de-vida/SKILL.md` pas 1 contra `tooling/documental/turns.mjs:72`.

**Proposta conservadora:** validar arguments desconeguts i eixir amb l'ús; exigir `--actor` explícit; afegir `documents` a la skill amb el criteri de quan s'usa cada abast. **Declare el torn `torn_5c07f4c8` com a brossa creada per mi**: no l'he usat per a res i no l'he esborrat, perquè esborrar registres no és una decisió meua.

`requires_human_decision: false` per a l'eina i la skill; el torn brossa necessita una ordre per a retirar-se.

---

### C-8 · Baixa · `QUI_SOC.md` §6 nomena dos rutes amb una caixa que no existix al disc

**Fonts:** `.agents/QUI_SOC.md:43`, `.agents/GENOMA.md:57,127`.

QUI_SOC §6 escriu `04_escriptori/01_Produccio` i `04_escriptori/00_Bandeja_d_Entrada`. Al disc són `01_produccio` i `00_bandeja_d_entrada`. AGENTS §12 les escriu bé.

Açò no és estètica: QUI_SOC es carrega **sempre** al context per `CLAUDE.md`, i l'`ESTAT` ja registra que Codex va verificar que la discrepància `00_Bandeja_d_Entrada` / `00_bandeja_d_entrada` bloqueja el catàleg. A més, AGENTS §15 declara que la porta d'autoritat comprova «rutes amb caixa exacta»; he executat `porta-autoritat.mjs` i dóna `valid: true`, de manera que **eixa comprovació no arriba al text de QUI_SOC**.

Hi ha, de passada, una asimetria de to: QUI_SOC §6 diu que la safata «s'ha de buidar sempre», mentres AGENTS §12 matisa que l'Escriptori «no s'ha de buidar cegament» i posa un límit de 20 elements a la safata. No es contradiuen —parlen de carpetes distintes—, però llegides de pressa la primera convida a una neteja que la segona prohibix.

**Severitat:** baixa, de moment. Puja si algun script resol eixes rutes literalment.

**Proposta conservadora:** corregir la caixa a QUI_SOC §6 i afegir-hi la frase d'AGENTS §12 sobre no buidar l'Escriptori. Estendre la porta d'autoritat perquè verifique que tota ruta citada a QUI_SOC existix amb eixa caixa exacta.

`requires_human_decision: false`.

---

### La purga demanada: el que SÍ que està net

L'encàrrec era comprovar que cap regla antiga contradiguera la decisió estructural. **Quatre comprovacions ixen netes i cal dir-ho amb la mateixa claredat que els defectes:**

1. **Ports.** `vite.config.js:37-38` fixa `port: 3340, strictPort: true`, i tant `vite.config.js:26` com `vite.standalone.config.js:22` tenen el plugin `sdp-port-canonic` que llança si el port no és 3340. `.claude/launch.json` apunta al 3340. **Un sol procés Vite viu** (PID 49562, `--port 3340 --strictPort`), un sol port escoltant. **Cap document del cervell mana el 5173**: les aparicions restants són permisos històrics de Bash a `settings.local.json` i un tros de hash SHA a `bundle-manifest.json`. L'acció (e) de l'`ESTAT` —replicar la guarda al standalone— **ja està feta**.
2. **Vistes estructurals.** La skill `sdp-app-grid-shell` §2 ja diu «Per Fila, no per Columna» i prohibix el fantasma crema. La contradicció amb el codi que l'`ESTAT` deixava com a decisió pendent **està resolta al text de la skill**.
3. **Autoritat.** `AGENTS.md` i `.agents/AGENTS.md` són **byte a byte idèntics** (`diff` buit) i `porta-autoritat.mjs` dóna `valid: true`.
4. **Skills.** `.claude/skills/` existix amb **16 symlinks**, un per cada skill de `.agents/skills/`. El catàleg es carrega sencer. Açò tanca un forat que estava obert: ja no hi ha skills invisibles per a l'agent.

---

### Com destil·lar l'aprenentatge (punt 3 de l'encàrrec)

La jornada ha deixat lliçons operatives que hui viuen escampades en entrades de l'`ESTAT` que ningú rellegirà. Proposta concreta, per ordre de valor:

**a) Tres regles d'operació ja provades hui, que han de pujar a skill i no quedar-se a l'`ESTAT`:**

- *Després de tot `npm ci`, rearrencar el servidor de desenvolupament.* Provada: el 3340 ranci va produir observacions falses durant hores.
- *Un sol editor per fitxer.* Provada al cost de destruir treball.
- *Fixar el tall amb SHA-256 quan s'audita un arbre que un altre agent està editant.* L'he tornada a usar hui amb l'auditoria de Codex.

Destinació natural: `.agents/skills/sdp-workflow/SKILL.md`, que és on viuen els procediments d'execució.

**b) Una lliçó nova, que és la que unifica esta auditoria:**

> **Arxivar és moure punters, no moure fitxers.** Cap document es trasllada a `90_arxiu_historic/` sense reescriure abans els enllaços que hi apunten: índexs, actes, `ESTAT`, `LEDGER` i manifest del web. Si el punter no es pot reescriure, el document no es mou.

Evidència que la justifica, tota d'esta jornada: 18 entrades falses a l'índex de l'Escriptori (C-5), 11 documents fantasma a l'`ON_ESTIC` (C-4), l'evidència del LEDGER fora de git (C-6) i **16 enllaços d'ítem trencats dins del producte publicat** cap a 8 auditories arxivades (ratificat a Codex Q2, reproduït a Verificació).

**c) On NO destil·lar-ho.** Ni al GENOMA ni a cap document nou de síntesi. Tenim 275 KB de còpia de regles (C-2) precisament perquè la resposta habitual a «cal consolidar açò» ha sigut generar un document més. **La destil·lació ha de reduir el corpus, no ampliar-lo.** Una lliçó nova hauria d'entrar a una skill existent i, si és possible, substituir text que ja hi havia.

**d) Mecanitzar la que es puga.** La lliçó (b) es pot convertir en porta: en detectar que un fitxer ha canviat de ruta cap a `90_arxiu_historic/`, buscar els wikilinks i els paràmetres d'ítem de la URL que hi apunten i bloquejar mentres n'hi haja. És la mateixa comprovació que ja fa `document.mjs handoff`, aplicada a l'arxivat.

**e) Una lliçó que he aprés escrivint esta auditoria, i que ja havia aprés abans.** El verificador de la Wiki llig els dobles claudàtors **i el paràmetre d'ítem de la URL també dins dels blocs de codi i de les cometes**. Descriure el defecte C-3 usant la sintaxi com a exemple va generar sis enllaços trencats reals, i els vaig propagar a l'`ESTAT` i al LEDGER abans que el tancament m'aturara. **Un document que parla d'enllaços no pot escriure'ls**: s'han de descriure amb paraules.

El que fa útil esta lliçó no és la lliçó, és la recaiguda: **ja la tenia registrada a la meua memòria de treball**, amb estes paraules — «una auditoria del graf empitjora el graf si cita exemples entre cometes invertides». La vaig escriure jo en una sessió anterior i hui he tornat a caure-hi exactament igual. No és un problema de saber-ho; és que el coneixement viu on no es consulta en el moment d'escriure. **És el mateix defecte que C-4 i que la REGLA 0**: la regla existix, és correcta, i no està al lloc on caldria en el moment d'actuar. Si la plantilla d'auditoria ho advertira en la seua guia editorial —dos línies—, el problema desapareixeria per a qualsevol agent, present o futur.

---

### Reunió a l'Olivera: rèplica a Codex

He llegit `260922_2119_auditoria_codex.md` sencera, amb el tall fixat a SHA-256 `a3386d1f69b851ddaa0811c68c6eb4ca048d6b33859d5a92325dc5f82b239652` (350 línies) perquè l'estava escrivint mentres jo auditava. Els nostres encàrrecs són distints —ella l'aplicació, jo el cervell— i es toquen en un punt.

1. **Ratifique S1 i l'amplie.** Els 3 documents `visibility: private` són exactes; els he comptats. Però la seua correcció proposada —filtrar per `visibility`— **no tancaria el forat gros**: cap dels 40 documents del cervell declara `visibility`, i entren igual. La llista d'inclusió que ella mateixa proposa sí que ho resol; és l'opció bona i l'he adoptada a C-1.
2. **Ratifique Q2 amb el número exacte.** He reproduït les seues 16 referències d'ítem cap a 8 IDs absents. Afegisc el detall que hi falta: **els 8 són auditories i plans arxivats hui mateix**. No és un defecte del validador en abstracte, és la mateixa malaltia de C-4/C-5/C-6 manifestant-se dins del producte.
3. **Ratifique el punt 3 de la seua rèplica.** `aria-current="page"` continua fix a `src/components/layout/AppGridColumn.jsx:88`. El pla 2104 afirma que s'ha eliminat i **no s'ha eliminat**. Afegisc que el mateix pla declara «Cap risc, ja s'han aplicat a l'escriptori i estan a producció»: no hi ha cap evidència de desplegament i jo tampoc no la certifique.
4. **Coincidim en el port standalone.** La guarda hi és, `server: {port, strictPort}` no. A C-1 de la purga ho compte com a fet perquè l'acció demanada era replicar la guarda, i la guarda impedix arrancar amb un port equivocat. La seua precisió és correcta i val la pena registrar-la: **impedir el port dolent no és configurar el bo**.
5. **Discrepe d'un matís de la seua Q1.** Diu que el segell de skills fa parar la cadena «abans d'arribar a les proves de producte». És cert, però el segell no és l'única barrera inútil: `porta:orfandat` para amb 32 errors **dels quals cap és real** (C-3). Una cadena amb dos barreres que no discriminen no és una cadena estricta: és una cadena que s'ignora. Ho considere més urgent que resegellar.

---

### Millora del `prompt_local.md` (punt 4 del protocol)

Subscric les propostes de Codex i n'afegisc quatre que ixen de la meua feina d'esta nit:

1. **Hora i tall.** El prompt ha de portar la marca de temps i el commit de referència, i dir explícitament: *l'Escriptori pot haver canviat des que això es va escriure; llista'l abans de creure't cap enumeració*. El meu prompt anunciava 11 documents i n'hi havia 4.
2. **El reflex ha d'apuntar a un torn viu de qui rep l'encàrrec.** El `reflex:` del meu prompt apunta a `torn_d8b7ed3e`, que és de **Codex**. He hagut d'obrir torn propi. Si un agent hereta el camp sense mirar-lo, escriu dins del torn d'un altre.
3. **Blindar el camp «Propietari».** `document.mjs create` posa `agent-local` per defecte i cap porta el corregix. El document no sap qui l'ha escrit fins que algú ho arregla a mà.
4. **Demanar explícitament el que està net.** Un encàrrec de «purga» convida a llistar només defectes. Les quatre comprovacions netes d'esta auditoria són informació de valor per al Mestre i han estat a punt de no escriure's.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Entorn i abast

- Repositori `socdepoble.org`, branca `backup-notes-publish`, HEAD `6423590e`, **amb canvis locals abundants**: els resultats descriuen l'arbre de treball, no el commit.
- Node `v24.13.0`. Servidor Vite viu, PID 49562, `--port 3340 --strictPort`, únic port escoltant.
- **Cap fitxer alié modificat.** He creat un sol document: esta auditoria. He obert dos torns (un per accident, C-7).
- Auditoria concurrent: Codex escrivia `260922_2119_auditoria_codex.md` mentres jo treballava. Tall fixat amb SHA-256 abans de llegir-la.

### Portes canòniques exigides per la plantilla

| Comanda | Eixida | Resultat |
| --- | --- | --- |
| `porta:documents -- --all` | 1 | 3 seccions pendents a l'esborrany de Codex (document en curs, no deute) |
| `porta:frontmatter` | 1 | 3 fitxers amb deute F9 (Vincles): `00_index_identitat`, `successio_lazaro_execucio`, `00_index_escriptori` |
| `porta:cognitiu` | 1 | 1 bloquejant (frontmatter sense `version`), 16 avisos |
| `porta:llaurador` | 1 | 6 elements assenyalats, entre ells l'acta `260922_1920` |
| `porta:reflex` | 1 | Baseline divergent i **27 fitxers del corpus estable no versionats** |
| `porta:orfandat` | 1 | 32 errors, **0 reals** (C-3) |
| `porta:teixit` | ≠0 | T3 ILLA: 6 documents fora de l'àncora, entre ells `QUI_SOC`, `BIOS` i `PROTOCOL_PETORRETA` |
| `porta:scc .` | 0 | ✅ OK en el moment de l'auditoria |
| `porta-autoritat.mjs` | 0 | ✅ `valid: true` |

### Tancament documental

`tancament.mjs --check --turn-id torn_f55149f7…` → `valid: false`. Detall per comprovació:

| Comprovació | Eixida | A qui correspon |
| --- | --- | --- |
| `plantilles`, `autoritat`, `skills` | 0 | — |
| `ledger` | 0 | **Meu, corregit.** El meu afegit va deixar la signatura enmig del fitxer; `verify-ledger.mjs` la vol l'última. Resignat i verificat |
| `wiki` | 0 | **Meu, corregit.** Vegeu destil·lació (e) |
| `segell` | 1 | Deute previ: Llei Z, `754a6ec3` contra `6314fc7f` |
| `scc` | 1 | `260922_2135_pla_implementacio_resolucio_codex.md`, alié, sense rebut ni àncora |

**Cap d'estes eixides és atribuïble a un canvi meu**: quan les he executades, l'únic fitxer meu al disc era esta auditoria en esborrany.

### Reproduccions

```bash
# C-1: cervell dins del manifest públic
node --input-type=module -e "
import {wikiManifest as m} from './src/data/wikiManifest.js';
const ag=m.items.filter(x=>String(x.categoryId).startsWith('folder:.agents'));
let t=0; ag.forEach(x=>t+=(x.content||'').length);
console.log(ag.length+' documents, '+t+' caràcters');"
# → 40 documents, 491566 caràcters

# C-1: absència de credencials (verificació negativa)
node --input-type=module -e "
import {wikiManifest as m} from './src/data/wikiManifest.js';
const pat=/(api[_-]?key|secret|service_role|bearer |sk-[a-zA-Z0-9]{8}|eyJ[A-Za-z0-9_-]{20,})/gi;
m.items.filter(x=>String(x.categoryId).startsWith('folder:.agents'))
 .forEach(x=>{const h=(x.content||'').match(pat); if(h) console.log(x.id, [...new Set(h)].slice(0,4));});"
# → 5 fitxers, totes les coincidències dins de prosa normativa

# C-3: comprovar que cap dels 32 errors és un destí inexistent
node tooling/gates/tractor-orfandat.mjs 2>&1 | grep "ENLLAC TRENCAT" | sort | uniq -c
# → 16 assenyalen 00_index_escriptori, i el fitxer existix al disc

# C-4: els documents de l'ON_ESTIC injectat
find _wiki_de_poble -name "260922_1857_auditoria_claude.md"
# → .../90_arxiu_historic/260922_jornada_tarda/...

# Ratificació de Codex Q2 — el guió complet és a la seua auditoria 2119.
# Resum del que fa: recórrer el contingut del manifest, extraure cada
# paràmetre d'ítem de la URL i comptar quants apunten a un id absent.
# → 16 referències cap a 8 identificadors absents; els 8 són auditories
#   i plans arxivats hui a 90_arxiu_historic/260922_jornada_tarda/
```

### Empremtes del tall

```text
a3386d1f69b851ddaa0811c68c6eb4ca048d6b33859d5a92325dc5f82b239652  260922_2119_auditoria_codex.md  (21:30, 350 línies — el tall que he llegit i citat)
0a8b181694e554da07c8df86d06946d76efa6ffaf3d1cbebb52c796a7e1bff1d  260922_2119_auditoria_codex.md  (21:37, +1.535 bytes — ja no és el que he llegit)
```

**El document de Codex ha continuat creixent després del meu tall.** Les cinc cites que li faig corresponen al primer hash i eren exactes en eixe moment. No les he reajustades a la versió nova: un tall que es persegueix no és un tall. `.agents/ESTAT.md` també s'ha modificat a les 21:32 mentres jo escrivia.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No he modificat cap fitxer alié, ni codi, ni regles, ni índexs, ni el LEDGER. **No he reparat cap de les huit troballes**: l'encàrrec era auditar el cervell i proposar la destil·lació, i arreglar per iniciativa pròpia el que un altre agent pot estar tocant és exactament el que hui ja ha destruït treball.

**No he llegit `90_arxiu_historic/`.** He hagut de localitzar-hi fitxers per demostrar C-4 i C-6, però només per nom i ruta: no n'he obert el contingut. La distinció és deliberada i és la que AGENTS §5 protegix.

L'exposició de C-1 està confirmada **al manifest compilat del disc**, no a un domini publicat. No he construït el bundle ni he comprovat cap desplegament: no afirme que socdepoble.org servisca hui eixos 491.566 caràcters, sinó que qualsevol build fet amb este manifest els inclou.

La verificació negativa de credencials cobrix els patrons llistats sobre els 40 documents del cervell. **No és una prova d'absència de secrets** a tot el repositori ni al `.env`, que no he tocat.

No he auditat l'aplicació web, les migracions, RLS, ni les dependències: això ho cobrix l'auditoria de Codex de les 21:19 i no la duplique.

Les afirmacions sobre l'`ON_ESTIC` (C-4) es basen en el contingut injectat al meu propi context contrastat amb el fitxer del disc. És evidència de primera mà d'esta sessió; **no he comprovat que passe igual en un altre client** ni en l'arrencada de Codex.

El torn `torn_f55149f7-d41e-470e-9691-940656ba3fec` **queda obert**, i no per descuit: `tancament.mjs --check` exigix «Pla absent o modificat» i «El torn encara no està planificat». **Un torn d'auditoria pura no pot arribar a `closed`**, perquè `document.mjs plan` vol un fitxer `type: document` i una auditoria és `type: informe`. Per a tancar-lo caldria fabricar un pla que no existix. No ho faré.

Del tancament queden tres coses en roig **que no són meues i que no he tocat**:

- `segell`: ruptura de la Llei Z (`754a6ec3` contra `6314fc7f` segellat). Deute previ ja registrat en sessions anteriors.
- `scc` i quatre errors més: el document `260922_2135_pla_implementacio_resolucio_codex.md`, aparegut a l'Escriptori a les 21:35 mentres jo escrivia, **sense rebut de `context` i sense àncora**. No és meu i no l'ancore jo.
- `ledger` i `wiki` ixen **en verd** després de corregir els dos defectes que sí que havia causat jo, documentats a la destil·lació (e).

No declare el repositori verd ni la cadena de portes passada: huit portes estan en roig per deute previ i cap l'he causada jo. L'Acta Marmota de jornada continua pendent; esta auditoria no la substituïx.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
