---
type: informe
status: esborrany
description: Anatomia de l'escletxa d'higiene de la porta Olivera, enllaços trencats del graf, informe de les 20 skills, tractors d'autosanació i maduració al laboratori, i Format Zero Fricció.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4e9dd3ec-982f-454b-9967-2db3569902b8:10a3f619-efe0-4f28-ae28-3aa3adde0aa4
---
# Auditoria Claude: higiene de l'Escriptori, autosanació del graf i maduració de skills

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4e9dd3ec-982f-454b-9967-2db3569902b8:10a3f619-efe0-4f28-ae28-3aa3adde0aa4 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T14:57:30.872Z |
| Modificació | 2026-09-24T15:45:00Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), Claude Code app d'escriptori |
| Tokens consumits | estimats: 420k d'entrada acumulada (context + 60 lectures); mesurats: no exposats per l'arnés |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-24T14:57:30.872Z: esborrany creat; contingut i verificació pendents.
2026-09-24T15:45:00Z: lectura de 60 fitxers (portes, circuit documental, 21 skills, índexs, actes 1445 i 0845), inventari del repositori per un subagent de lectura, tractors i 25 proves al laboratori `02_investigacio_ia/260924_1700_tractors_claude/`, redacció de les troballes. El Dashboard de la Consola (tasca 1 del prompt 1540) ja era al disc en obrir el torn: `src/sections/consola/ConsolaSection.jsx` i `consolaPagines.js`, relleu ESTAT 1630; este torn no el toca.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Resposta al prompt [[260924_1540_prompt_claude]] i al pla [[260924_1540_pla_implementacio_claude]]. Cada troballa porta fitxer, evidència, severitat, font de veritat amb què xoca, proposta i si cal decisió humana. El codi nou viu al laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1700_tractors_claude/` (índex: `LLEGIU_PRIMER.txt`), en mirall de `tooling/` perquè instal·lar siga copiar.

### T1 · Per què la casella «Escriptori classificat» va passar (P0, mecànica)

La porta Olivera va callar amb dos prompts del mateix dia damunt la taula. No és un descuit de MarIA: són quatre escletxes del tractor, i cada una és una línia.

| # | Escletxa | Evidència | Efecte |
|---|---|---|---|
| 1 | La jornada és el rellotge | `tooling/gates/porta-olivera.mjs:68`: `ranci()` filtra `d.data < dia` | Un prompt de les 15:00 no és mai ranci a les 15:40. La skill del laboratori ho beneïx: «Un document de hui no el toca mai» (`02_investigacio_ia/260924_0200_skill_core_higiene_escriptori.txt`, §1) |
| 2 | Només el primer nivell | `porta-olivera.mjs:51-63`: `inventari()` llig fitxers solts | La Safata d'Entrada (`00_bandeja_d_entrada/`) és invisible per a la porta. AGENTS §12 diu que sempre ha d'estar buida i cap eina ho comprova. `porta-plantilla-viva.mjs:36-37` declara la mateixa exclusió |
| 3 | `create` no passa per la porta | `tooling/gates/hooks-local.mjs:84-87`: `authorizeDocumentCommand` retorna `document-mutation` i el hook autoritza abans d'arribar a `olivera()` (línia 100) | L'esborrany del prompt naix sense que ningú mire la taula. La porta només corre en Write/Edit posteriors |
| 4 | La casella és autodeclaració | `porta-olivera.mjs:112`: només busca `- [ ]` | Un `[x]` no es contrasta amb res. La comprovació d'estat (línies 95-106) i la casella no es parlen |

Font de veritat amb què xoca: AGENTS §12 (Safata sempre buida), §6 (pla i petorreta amb la mateixa hora termodinàmica) i la lliçó del 260923 a `wiki-documentacio-i-reflex` («netejar abans de cridar»).

Detall menor: la skill 0200 diu que l'avís de fantasmes «no fa caure la porta». Fals: `porta-olivera.mjs:104-106` afig els fantasmes a `errors` i `informe()` (línia 219) ix 1. La skill descriu un comportament que el codi no té.

Proposta (lliurada): `gates/porta-olivera.mjs` v2 al laboratori. Manté les exportacions de la v1 (les proves de `tests/sistema_nervios.test.mjs` no canvien) i afig: rellotge de sessió pel segell `aammdd_hhmm` (`rancisDeSessio`; els plans no caduquen per sessió), recompte de la Safata (`safata`), contrast de cada `[x]` amb la comprovació que representa (`caselles`, `rebutDelFitxer`) i el pla amb el mateix segell que la petorreta. Pegat de tres línies per a `hooks-local.mjs` (`hooks-local.patch.txt`) perquè `create` d'una petorreta passe per `checkOlivera` abans d'existir. Skill v3 (`skill_core_higiene_escriptori.txt`) que substituïx la instal·lada i l'esborrany 0200. Decisió humana: només la instal·lació (lease).

### T2 · Enllaços trencats: dos resolutors, dos veritats (P1)

Fets del disc (git status i inventari):

- `02_saber/00_index_identitat.md` esborrat i `01_ser/00_index_identitat.md` nou. Vint documents l'enllacen amb `[[00_index_identitat]]`, pel nom curt: cap d'eixos enllaços s'ha trencat, ni al repositori ni a Obsidian.
- `02_saber/03_consola_termodinamica.md` esborrat i convertit en carpeta amb sis documents. Sis enllaços `[[03_consola_termodinamica]]` han quedat penjats: `01_ser/00_index_identitat.md:43`, `02_saber/el_projecte.md:36`, `protocols_tecnics/a11y_seo_trellat.md:49`, `contingencia_offline.md:86`, `futur_adaptacio.md:54`, `index_trellat.md:66`.
- `01_ser/01_identitat.md:25` remet a `02_saber/GLOSSARI.md`, que no existix a `02_saber/` (el glossari viu a `src/GLOSSARI.md`).

El gris del graf d'Obsidian té una segona causa, més gran que els sis enllaços: el repositori i Obsidian no resolen igual. `tooling/lib/document-links.mjs:18` resol `[[../10_actes/x]]` relatiu al fitxer font i `[[AGENTS]]` contra l'arrel del repositori. Obsidian resol tota ruta relativa al vault (`_wiki_de_poble/`) i no veu res fora d'ell. Per tant `tractor-orfandat.mjs` dóna per bons els quaranta `[[../90_arxiu_historic/…]]` i `[[../10_actes/…]]` de `00_index_escriptori.md`, i els `[[AGENTS]]` de `00_index.md:90` i `00_index_identitat.md:42`, mentre Obsidian els pinta en gris. `tooling/wiki/lib/resolutor.mjs` (el que usa el Llaurador) sí que seguix la semàntica d'Obsidian: per això `porta:orfandat` i `porta:llaurador` no coincidixen mai.

Font de veritat amb què xoca: `auditoria_canonica.md` §Graf («distingix enllaç no resolt, destí ambigu, buit físic, mirror, vendor i arxiu»): hui cap eina fa eixa distinció.

Proposta (lliurada): `wiki/tractor-autosanacio.mjs`. Resol amb `resolutor.mjs` i, per a cada enllaç penjat, diu la cura: `vault` (reescriu `[[../10_actes/x]]` com `[[10_actes/x]]`), `moviment` (git diu on ha anat el fitxer: renom, o esborrat més nou amb el mateix nom), `carpeta` (el destí és ara una carpeta amb un únic índex: `[[03_consola_termodinamica]]` passa a `[[02_saber/03_consola_termodinamica/00_portada]]`), i les que no s'inventen: `fora-del-vault`, `arxiu`, `ambigu`, `cap`. `--aplica` només reescriu les tres mecàniques, conserva àlies i àncora, i no toca `01_produccio` ni `90_arxiu_historic`. Decisió humana: `[[AGENTS]]` i `[[00_INDEX_SKILLS]]` (enllaç Markdown com fa `00_index.md:44`, o mirall de skills dins del vault: `CAMINS.skillsMirror` existix i la carpeta no).

### T3 · Sistema nerviós: relacions i redundàncies que ningú mira (P1, decisió humana)

Casos que el Mestre ha vist a ull i cap eina ha dit:

- Identitat en tres fitxers: `02_saber/identitat.md` (hub de 15 línies sense contingut), `01_ser/01_identitat.md` (missió i directrius) i `01_ser/00_index_identitat.md` (índex). Requerix decisió: el hub buit s'arxiva o es fusiona a l'índex.
- Màquina en dos: `02_saber/00_index_maquina.md` i `02_saber/maquina.md`. Govern en dos: `02_saber/govern.md` i `02_saber/doc_governanca.md` (contingut no comparat en este torn).
- El cens del Consell en quatre llocs: `QUI_SOC.md` §7, `01_ser/personalitat_iaia.md`, `core-consell-i-colmena` §1 i `.agents/consell.json`. La skill diu que la font és el JSON; els altres tres el copien.
- El Protocol de l'Olivera en quatre: `core-automillora` §2, `core-consell-i-colmena` §6, `wiki-documentacio-i-reflex` §5 i el bloc fix de `prompt_local.md`.
- La REGLA 0 en tres: `AGENTS.md` §0, `wiki-documentacio-i-reflex` §1 i `core-taxonomia-estricta` sencera.

Font de veritat amb què xoca: AGENTS §1 («un sol cervell»; les skills no contenen filosofia) i el mandat del Llibre de Pedra Seca (no repetir text en tres llocs).

Proposta (lliurada): `wiki/tractor-sinapsis.mjs`. Cinc detectors sobre la Wiki operativa, les skills i `AGENTS.md`: D1 noms repetits (normalitzats: `00_index_identitat`, `01_identitat` i `identitat` són el mateix nom), D2 títols i descripcions quasi iguals (Jaccard ≥ 0,6), D3 paràgrafs de més de 25 paraules repetits en dos documents, D4 skills sense `status`, sense àncora, fora del catàleg o amb descripció divergent, D5 documents de `01_ser/02_saber/03_actuar` sense `[[00_index…]]`. Cada troballa té un identificador estable; només deixa de bloquejar quan `tooling/wiki/maduracio.json` porta una decisió humana (`fusionar`, `renomenar`, `arxivar`, `mantindre`, `resolt`). «Mantindre» caduca als 90 dies i torna a preguntar; una decisió d'acció no executada en 14 dies torna a bloquejar. Això és el motor de maduració: les decisions envellixen i el tractor les reclama.

### T4 · Informe de les 21 skills (P1, decisió humana)

Inventari: 21 carpetes a `.agents/skills/` (20 al catàleg `00_INDEX_SKILLS.md` més `sdp-universal-editor`, nova i sense rastrejar). Àncores: 8 amb `[[00_INDEX_SKILLS]]`, 2 amb `[[00_index]]`, 11 sense cap. `.claude/skills/` té 16 enllaços simbòlics: falten `core-automillora`, `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori`, `core-taxonomia-estricta` i `sdp-universal-editor`, que Claude no pot invocar. El segell (`SKILLS_SEAL.json`) és divergent i `segell-auto` ho diu a cada crida d'eina.

| Skill | Estat | Veredicte | Motiu |
|---|---|---|---|
| core-identitat | canonic | mantindre | Curta i procedimental. Afegir la lliçó Zero Fricció (T7) |
| core-context-panic | canonic | renomenar → `core-fusible` | AGENTS §10 ja en diu Fusible; «context panic» no ho entén ningú a la primera |
| core-consell-i-colmena | canonic | renomenar → `core-consell` i retallar | §5 porta xifres de consum del dia (22 %, 0 crèdits, dates): són dades, no procediment, i ja tenen casa a la Consola. §6 repetix l'Olivera. «Colmena» és argot |
| core-estrategia-ia | actiu | fusionar a `core-consell` | Triatge de models: mateix tema que el §5 de la de dalt. Sense àncora |
| core-automillora | actiu | retallar | §2 declara que MarIA és «l'ÚNICA entitat amb permís per escriure codi»: fals des dels torns `code` de Claude i Codex del 260924. §2 repetix l'Olivera. Queda el mimetisme i el tractor cognitiu. Sense àncora |
| core-edicio-segura | actiu | fusionar a `sdp-workflow` (Lliçons) | És una lliçó de React del 260924, no un procediment autònom. Sense àncora |
| core-higiene-escriptori | actiu | substituir per la v3 lliurada | La instal·lada és la v1; la 0200 del laboratori consagra l'escletxa 1 de T1 |
| core-taxonomia-estricta | esborrany | esborrar | Tercera còpia de la REGLA 0. Les portes `porta-taxonomia.mjs` i `porta-plantilla-viva.mjs` ja ho fan complir; una skill que repetix la porta no afig res |
| core-memoria-historica | canonic | mantindre | Cinc passos, ancorada: model del que ha de ser una skill |
| core-restauracio-segellada | canonic | mantindre | Procediment complet amb portes reals |
| core-redaccio | (nova) | crear | Lliurada a `skill_core_redaccio.txt` (T6) |
| sdp-workflow | canonic | mantindre i corregir | §2 diu «principis matemàtics descrits a `sdp-workflow`»: s'autocita; volia dir `sdp-pedra-seca` |
| sdp-pedra-seca | canonic | mantindre | Contracte matemàtic; és la font que altres citen |
| sdp-universal-page | canonic | mantindre i desduplicar | §5 repetix la regla de nidificació de `sdp-app-grid-shell` §1 (D3 ho trobarà) |
| sdp-app-grid-shell | canonic | mantindre | Especificació viva del Bloc de Notes |
| sdp-universal-editor | canonic | catalogar, ancorar i segellar | Nova, fora del catàleg, sense àncora, fora del segell |
| sdp-calendari-agricola | canonic | moure a la Wiki | És producte, no procediment (AGENTS §1). El mateix cas d'ús és a `sdp-casos-us-essencials` §3, paraula per paraula |
| sdp-casos-us-essencials | canonic | moure a la Wiki | Ídem: idees de producte; van a `02_saber/` amb una skill curta que hi remeta |
| sdp-estudi-mercat | canonic | mantindre i corregir | §3 ordena desar a `04_ESCRIPTORI/01_Produccio/`: majúscules (T1) i zona humana (AGENTS §12). Ha de ser `04_escriptori/aammdd_hhmm_estudi_x.md` |
| wiki-documentacio-i-reflex | canonic | renomenar → `wiki-petorretes` i traure la filosofia | 90 línies; l'analogia de Matrix és Wiki (`02_saber/`), el procediment és skill |
| wiki-cicle-de-vida | canonic | mantindre | Nou passos, ancorada |
| wiki-propagar-veritat | canonic | reescriure el pas 3 | Recomana `find … -exec sed -i` per `run_command`: el hook actual bloqueja la shell opaca i un `sed` ja va mutar el LEDGER (auditoria del Brain 260921) |
| wiki-busca-skills | canonic | mantindre | Procediment del Caçador; afegir àncora |

Resultat: de 21 a 16 skills en tres famílies que qualsevol entén: `core-*` (com pensa i es comporta la IAIA), `sdp-*` (com es construïx el producte), `wiki-*` (com es cuida el coneixement). Tota skill acaba amb `## Vincles` i `[[00_INDEX_SKILLS]]`; D4 del tractor Sinapsis ho exigix i el catàleg deixa de divergir del frontmatter. Cada fusió o renom és una decisió a `maduracio.json`, no un acte d'agent.

### T5 · Orfenat de `.json`, `.mjs` i codi dins del vault (P2)

Fitxers que no són coneixement i viuen dins del vault d'Obsidian: `01_ser/.manifest.json`; els laboratoris `02_investigacio_ia/260924_1410_tractors_claude/` (12 fitxers), `260924_1505_tractor_plantilles_claude/` (2) i este `260924_1700_tractors_claude/`; `02_investigacio_ia/001 NEXUS/` (espais i majúscules, T1; conté una skill `valorar-idea` fora de `.agents/skills`); `.quarantena-260830/` (SQL, JS i JSX d'agost); i a l'arrel del repositori, `Mapa de mis agentes v0.1.html` i `02_investigacio_ia/mapa-visual-agentes.zip` (AGENTS §3: cap fitxer de treball a l'arrel).

Per què ixen al graf: `_wiki_de_poble/.obsidian/graph.json:5` té `showAttachments: true`, i `tooling/wiki/llaurador_indexs.mjs:76` compta `.mjs`, `.json`, `.txt` i imatges com a nodes que cal adoptar.

Proposta: (a) codi i configuració no són nodes: `showAttachments: false` a `graph.json` i `userIgnoreFilters` a `.obsidian/app.json` per a `04_escriptori/02_investigacio_ia/` i `.quarantena-260830/` (decisió del Mestre: és la seua interfície); (b) el Llaurador restringit a `.md` i mitjans, o amb `02_investigacio_ia` a `EXCLOU` (governança, lease); (c) `.quarantena-260830/` fora del vault; (d) `001 NEXUS/`: promoure `valorar-idea` a `.agents/skills/wiki-valorar-idea` o arxivar-la; (e) els dos fitxers de l'arrel a l'Escriptori o a la paperera. Per a «forçar l'àncora a tot arreu»: `document.mjs draft()` ja posa `[[00_index]]` a Vincles (`tooling/wiki/document.mjs:21`), però `validateSections` (`tooling/documental/core.mjs:160-170`) només exigix que la secció no siga `[pendent]`. Pegat d'una línia: la secció Vincles ha de contindre `[[00_index`. Per a les skills, D4 de Sinapsis.

### T6 · El Llibre de Pedra Seca: redactora científica (P2)

El text repetit ja està mesurat a T3. La mecànica que ho impedix és D3 de Sinapsis (paràgrafs de més de 25 paraules en dos documents bloquegen fins a decidir). La part que no és mecànica és un procediment de redacció, lliurat com a skill nova `skill_core_redaccio.txt`: la idea ja té casa?, estructura fixa (H1, entradeta, H2, Vincles), la frase (una idea, 25 paraules, cap adjectiu valoratiu), la font (ruta i línia), zero repetició, Zero Fricció, llista abans de desar i Reflex de correcció (cada esmena del Mestre és una lliçó datada a la skill). Per a l'autoaprenentatge de MarIA no cal un tractor nou: el mecanisme ja és al `CLAUDE.md` («REFLEX DE CORRECCIÓ»); el que faltava era la skill on escriure les lliçons de redacció.

### T7 · Format Zero Fricció (P2)

La regla viu a `QUI_SOC.md` §2 i `AGENTS.md` §9, els dos carregats a l'arrancada; la fallada passa en generar la resposta, on cap hook pot mirar. `.agents/hooks.json` només declara PreToolUse i PostToolUse per a quatre eines d'Antigravity: no hi ha cap esdeveniment de prompt per a MarIA. El que sí que es pot fer, fet o lliurat: (1) un punt positiu a `01_ser/personalitat_iaia.md` («To, Actitud i Trellat»), el primer document que `core-identitat` ordena llegir: escrit en este torn; (2) pegat per a `tooling/session/persona_router.mjs` que recorde la regla quan el prompt demana un text per a copiar (`zero_friccio.txt`), útil per a Claude i Codex mentre Antigravity no expose l'esdeveniment; (3) la lliçó a `core-identitat` i a `core-redaccio` §6; (4) una autocomprovació de tres passos abans d'enviar. Cap d'estes és un bloqueig mecànic; l'arnés no en permet cap.

### T8 · L'entorn en obrir el torn (P1, Mestre)

- El segell de skills és divergent: `SKILLS_SEAL.json` modificat, `sdp-universal-editor/` sense rastrejar i `core-taxonomia-estricta/SKILL.md` modificat. `segell-auto.mjs` falla a cada eina i `executor-mutacio.mjs:42` refusa tota mutació de governança fins a la reconciliació explícita (`segella.mjs --update --expected-hash … --expected-previous … --reason …`). El prompt 1540 diu que D3 ja s'havia resegellat; l'arbre ha tornat a divergir després.
- `.agents/ESTAT.md` i `.agents/LEDGER.md` són governança: este torn no els pot escriure. El relleu va a Límits perquè el Mestre o MarIA l'apeguen.
- Deute de la sessió: acta `10_actes/260924_1445_ACTA_MARMOTA_consola_termodinamica.md` en majúscules (T1 de la taxonomia) i sense rebut; `90_arxiu_historic/260924_1245_incidencia_protocol.md` amb una categoria fora del catàleg.

### T9 · Millores a `prompt_local.md` (Protocol de l'Olivera §4; decisió humana)

1. Les tres caselles de la secció 0 passen a ser un bloc que escriu la màquina, no l'autor: `document.mjs create` crida `checkOlivera` i deixa `<!-- SDP:HIGIENE segell=… bruts=0 safata=0 pla=… rebut=… -->`. L'autor no marca res.
2. La secció «Instrucció del torn» del prompt 1540 diu «tens via lliure per crear components» i el bloc fix §7 diu «cap línia de codi fins que el Pla estiga consensuat». Cal un camp `Mode` al Registre (`auditoria` o `implementacio`) que resolga la contradicció i que la porta puga llegir.
3. El Registre de la plantilla té 14 files, el router n'exigix 9 i `draft()` n'emet 10 (`tooling/wiki/document.mjs:15-16`): tres fonts, tres regles. Cal una sola llista.
4. Tot canvi de plantilla canvia el `templateHash` i invalida els rebuts vius («Plantilla del rebut canviada», `turns.mjs:121`): es fa entre torns, amb l'Escriptori buit de prompts.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Proves, executades dins de la shell confinada amb l'única forma admesa:

```bash
node --test tests/porta-olivera-v2.test.mjs tests/tractor-autosanacio.test.mjs tests/tractor-sinapsis.test.mjs
```

| Suite | Proves | Resultat |
|---|---|---|
| `tests/porta-olivera-v2.test.mjs` | 8 | 8 verdes: sessió pel segell, plans com pissarra, Safata, caselles llegides i contrastades, rebut real, segell compartit, compatibilitat v1 |
| `tests/tractor-autosanacio.test.mjs` | 9 | 9 verdes: enllaços, moviment amb àlies i àncora, carpeta, arxiu, ambigu i cap, zona humana intocable, vault, fora-del-vault, Markdown relatiu |
| `tests/tractor-sinapsis.test.mjs` | 8 | 8 verdes: paràgrafs, D1 identitat ×3, D2, D3, D4, D5, classificació de decisions, corpus sense Escriptori ni arxiu |

Total: 25 de 25 verdes en la segona execució; la primera va fallar dues proves per l'expressió regular de `caselles`, corregida (`gates/porta-olivera.mjs`, funció `caselles`).

Fitxers d'este torn:

- Laboratori `02_investigacio_ia/260924_1700_tractors_claude/`: `gates/porta-olivera.mjs`, `wiki/tractor-autosanacio.mjs`, `wiki/tractor-sinapsis.mjs`, shims `lib/arrel.mjs`, `wiki/lib/resolutor.mjs`, `wiki/lib/frontmatter.mjs`, `hooks-local.patch.txt`, `skill_core_higiene_escriptori.txt`, `skill_core_redaccio.txt`, `zero_friccio.txt`, `LLEGIU_PRIMER.txt`, i cinc marcadors «DUPLICAT» per a esborrar.
- Proves: `tests/porta-olivera-v2.test.mjs`, `tests/tractor-autosanacio.test.mjs`, `tests/tractor-sinapsis.test.mjs`. Cada una carrega el fitxer del laboratori i, quan este desaparega, el de `tooling/`.
- Wiki: `01_ser/personalitat_iaia.md`, un punt nou «Format Zero Fricció» a «To, Actitud i Trellat».
- Este document: `document.mjs check --file _wiki_de_poble/04_escriptori/260924_1700_auditoria_claude.md`, executat en tancar la redacció; resultat reportat al xat i al relleu de l'ESTAT.

No verificat en este torn: el Dashboard de la Consola al navegador (present al disc, relleu 1630), `npm run porta:orfandat` i `porta:llaurador` (shell confinada), i el comportament dels tractors sobre l'arbre real (només sobre fixtures).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Shell confinada.** El hook només admet lectures declarades: no s'ha pogut executar `npm run porta:orfandat`, `porta:llaurador`, `tancament.mjs --check` ni `vitest`. Les proves s'han fet amb `node --test tests/…`, l'única forma admesa.
- **Inventari per subagent de lectura.** El llistat de fitxers ve de l'índex de git més lectures directes; l'índex està desfasat respecte del disc i pot faltar algun fitxer nou fora dels que s'han obert.
- **Obsidian no observat.** El gris del graf s'infereix de la semàntica del resolutor, no d'una captura del Mestre. Si el Mestre veu més grisos dels que T2 explica, la primera comprovació és `npm run porta:autosanacio` després d'instal·lar.
- **Governança no escrita.** `tooling/`, `.agents/` i `package.json` requerixen `executor-mutacio` amb lease i un segell vàlid; el segell és divergent (T8). Tot el codi és al laboratori i s'instal·la copiant.
- **Fitxers que no es poden esborrar.** Cinc marcadors al primer nivell del laboratori i a `lib/` (llistats a `LLEGIU_PRIMER.txt`) són restes del primer intent de disposició; cal esborrar-los en instal·lar.
- **Memòria persistent de l'agent no escrita.** El hook bloqueja tota escriptura fora del repositori; les lliçons d'este torn viuen en este document.
- **El torn no pot tancar.** `checkTurn` exigix el relleu a `.agents/ESTAT.md` i `.agents/LEDGER.md` amb l'identificador del torn (`turns.mjs:158-159`); este agent no pot escriure'ls. Relleu per a apegar:

```markdown
## ESTAT_ACTUAL · 260924_1745 · Claude / Fable · Higiene, autosanació i maduració

- Torn `torn_4e9dd3ec-982f-454b-9967-2db3569902b8` (documents). Entrega [[260924_1700_auditoria_claude]], `document.mjs check` → valid: true.
- Fet: laboratori `02_investigacio_ia/260924_1700_tractors_claude/` (porta Olivera v2, tractor-autosanacio, tractor-sinapsis, pegat hooks-local, skills core-higiene v3 i core-redaccio, anàlisi Zero Fricció) amb 25 proves verdes a `tests/`; punt Zero Fricció a `01_ser/personalitat_iaia.md`.
- Pendent (Mestre): resegellar; instal·lar amb lease seguint `LLEGIU_PRIMER.txt`; decisions de T3, T4, T5 i T9 a `maduracio.json`; esborrar els cinc marcadors del laboratori.
```

```markdown
260924 | torn | torn_4e9dd3ec-982f-454b-9967-2db3569902b8 | Claude: auditoria 1700, laboratori tractors higiene/autosanació/sinapsis, 25 proves verdes
```

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_1540_prompt_claude]]
- [[260924_1540_pla_implementacio_claude]]
- [[taxonomia_documental]]
