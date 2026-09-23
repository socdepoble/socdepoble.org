---
type: informe
status: esborrany
description: Auditoria del Brain (.agents i wiki) amb 16 portes executades, 5 bloquejadors, nota 4/10 i pla de reparació ordenat.
tags:
  - consell
  - govern
  - revisar
reflex: llegit
---
# Informe d'auditoria del Brain (torn 1 de Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-BRAIN-260921-CLAUDE |
| Respon a | [[260921_0640_prompt_millora_brain]] (SDP-PROMPT-CONSELL-BRAIN-MAX) |
| Versió | 1.0.0 |
| Creació | 26-09-21 07:01 |
| Agent redactor | Claude (Fable 5.1), agent local amb accés a disc |
| Tall auditat | HEAD `d79bd0f9` + arbre de treball (39 esborrats, 31 sense seguiment, 6 modificats) |
| Propietari | Consell |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Vincles (Ancoratge de Seguretat)

- [[00_index_escriptori]]
- [[260921_0640_prompt_millora_brain]]

---

## 0. Rebut de reflex: què he llegit abans d'escriure

Per `.agents/protocolledge.json`, la intenció «auditoria» resol a `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`. L'he llegida sencera i l'he seguida en el que encara és vàlid (contracte d'informe: fitxer, evidència reproduïble, severitat, font de veritat en conflicte, proposta conservadora, `requires_human_decision`). Cinc dels seus punts són obsolets i els documente a T-21.

Fonts llegides senceres per mi: `CLAUDE.md`, `.agents/QUI_SOC.md`, `AGENTS.md`, `PROTOCOL_PETORRETA.md`, `LEDGER.md`, `ESTAT.md`, `ON_ESTIC.md`, `hooks.json`, `protocolledge.json`, `rules/00_BIOS_COGNITIU.md`, `skills/00_INDEX_SKILLS.md`, les 12 plantilles de `03_actuar/plantilles/`, els 5 fitxers de `01_ser/`, 20 documents de `02_saber/`, `00_index.md`, `00_index_escriptori.md`, `tooling/gates/run-portes.mjs`, `porta-reflex.mjs`, la capçalera de `tancament.mjs` i `tractor-registre.mjs`, `tooling/wiki/schema.json`, els diffs sense cometre de `despertar.mjs`, `prompt_sgq.mjs`, `schema.json` i `protocolledge.json`.

Fonts llegides per quatre agents d'inventari (i verificades per mi a mostra): les 16 skills, els 87 documents de `01_ser/02_saber/03_actuar/10_actes`, tot `tooling/brain/` i `tooling/wiki/`, els 17 fitxers heretats de `.agents/`, l'arxiu `90_arxiu_historic/260921_Sessio_Tancada/` i els dos informes de la Reunió davall l'Olivera del matí.

Verificacions de mostra: 31 afirmacions dels agents comprovades a mà. 30 confirmades. 1 imprecisió (l'agent de skills va llegir com a error que `skill-llicons-pendents` no existisca; `CLAUDE.md` diu «crea-la», és per disseny).

Portes executades (totes de només lectura): `porta:frontmatter`, `porta:esquemes`, `porta:llaurador`, `porta:cognitiu`, `porta:reflex`, `porta:nomenclatura`, `porta:consell`, `porta:cens`, `porta:cataleg`, `porta:registre`, `porta:manifest`, `porta:teixit`, `porta:frontera-auth`, `verificador-scc.mjs .`, `matrix.mjs` amb 10 frases, `npm run tancar`. Cap escriptura a `src/`, `tooling/` ni `.agents/skills/`. Cap cerca web.

---

## 1. Veredicte en una pàgina

**Nota: 4 / 10.** El disseny cognitiu val un 8. L'estat operatiu val un 3. La mitjana de les set dimensions de la rúbrica (§7) dona 4,1.

En tres frases:

1. **El Brain té bones idees i molta llei, però hui no s'executa:** el router de plantilles, el ritual de tancament, la porta de frontmatter, el catàleg de skills i el doctor del Reflex estan morts o en roig, i el pre-commit i la CI que haurien de fer durable tot això no poden passar en verd des de fa dies.
2. **La reestructuració d'esta matinada (renoms de skills i plantilles, enum d'etiquetes, Somiador dins del Despertar) ha canviat noms de carpeta sense canviar les identitats que els programes lligen**, i ha creat cinc trencaments nous damunt dels que ja hi havia.
3. **La memòria entre sessions és un tub amb forats:** el context de despertar dona tasques ja fetes fa dos dies, el Somiador buida l'escriptori a l'arrencada sense criteri d'edat i cap a una carpeta que la constitució declara «MAI llegir», i el mecanisme de lliçons que hauria de fer madurar la IAIA té zero entrades en tres setmanes.

El que sí funciona i cal protegir: la cultura (Trellat, Pedra Seca, Consell, Olivera, Marmota), `01_trellat.md`, `sdp_lock.md`, `doc_governanca.md` (menys els noms morts), `PROTOCOL_PETORRETA.md`, la skill `core-restauracio-segellada` (la millor de les setze: definix el seu propi predicat d'aturada, el seu contracte de hash i el seu mode de fallada), `core-context-panic`, i un exèrcit de 48 portes que, quan s'arreglen les identitats, tornarà a ser l'actiu més valuós del projecte.

---

## 2. Els cinc bloquejadors (P0)

### P0-1 · Catorze de setze skills tenen una identitat divergent, i això mata el router, el tancament, el catàleg i el cens

- **Evidència reproduïble.** `for d in .agents/skills/*/; do grep -m1 '^name:' "$d/SKILL.md"; done` mostra que només `core-context-panic` i `core-restauracio-segellada` tenen `name:` igual al nom de carpeta. Les altres 14 conserven el nom vell (`name: skill-iaia-identitat` dins de `core-identitat/`, `name: pedra-seca` dins de `sdp-pedra-seca/`, etc.). `tooling/brain/cataleg_skills.mjs:56-57` exigix `d.name === entry.name` i llança `Skill no activa o identitat divergent`.
- **Cadena de caiguda (tot verificat executant-ho):**
  - `node tooling/brain/matrix.mjs "<qualsevol frase>"` → el mateix error per a les 10 frases provades. El router de plantilles (`porta:matrix`) no encamina res.
  - `npm run porta:manifest` → exit 2, mateix error.
  - `npm run tancar` → `Catàleg divergent`, exit 1. **El ritual que `QUI_SOC.md` §6 declara obligatori per a tancar qualsevol tasca no pot completar-se.**
  - `npm run porta:registre` → «Registre declara 16 · disc en té 16 · coincidixen 2 · Exactitud del registre: 13%». 11 fantasmes (R1) i 3 divergències de prefix (R11).
  - `npm run porta:cens` → C5 en roig: `tractor-cens.mjs:228` busca `.agents/skills/skill-consell-i-colmena/SKILL.md`, que ja no existix.
  - `npm run porta:reflex` → «Fitxer crític absent: `.agents/skills/socdepoble-workflow/SKILL.md`» (`reflex_petorreta.mjs:100`) i «Falta AGENTS.md a l'arrel».
  - `.agents/manifest.yaml` (generat, «no editar a mà») apunta a 14 rutes mortes; `.agents/SKILLS_SEAL.json` segella 20 fitxers del 17 de setembre d'un arbre que ja no existix.
  - `cataleg_skills.mjs:67` té el nombre 16 escrit a mà: `if (skills.length !== 16) throw`. Qualsevol fusió de skills (que este mateix prompt demana) trencarà la cadena una altra vegada.
- **Font de veritat en conflicte.** `03_actuar/plantilles/skill.md` §2 (el `name:` és la identitat de la skill) contra les carpetes renomenades.
- **Severitat.** P0: bloqueja el cicle de vida sencer (obrir torn, encaminar plantilla, tancar sessió).
- **Proposta conservadora.** Corregir el `name:` dels 14 `SKILL.md` perquè coincidisca amb la carpeta; regenerar `00_INDEX_SKILLS.md` i `manifest.yaml` amb `node tooling/brain/cataleg_skills.mjs --escriu`; corregir les dues rutes cablejades (`tractor-cens.mjs:228`, `reflex_petorreta.mjs:100`); fer dinàmic el recompte de `cataleg_skills.mjs:67`; tornar a segellar amb `npm run porta:segella`. Verificació: `npm run tancar` i `npm run porta:registre` en verd.

### P0-2 · La porta de frontmatter no s'executa: l'enum tancat d'etiquetes no l'imposa ningú

- **Evidència.** `npm run porta:frontmatter` → «El pany de migració no quadra amb l'esquema real. declarat 4dbd0f8a… real 3cf33894…», exit 2. La porta mor abans de mirar cap fitxer. Causa: `tooling/wiki/schema.json` s'ha editat (enum d'etiquetes) sense `--segella-esquema`.
- **Conseqüències ja visibles.** Amb la porta cega, en un matí han entrat 15 fitxers amb etiquetes fora de l'enum nou (`sollutia`, `temporal`, `skills`, `marmota`, `log`, `auditoria`, `coneixement`, `acta-marmota`, `graf`), 3 amb `status` fora de l'enum (`historic`, `consolidat`, `validat`), 1 sense frontmatter (`01_ser/agents_equip_ia.md`), i el propi prompt `260921_0645_prompt_arquitectura_i_seguretat.md` porta l'etiqueta `seguretat`, que l'esquema d'eixa mateixa sessió va llevar. També `00_index_escriptori.md` (etiqueta `graf`) i `00_INDEX_SKILLS.md` (etiqueta `skills`).
- **Contradicció de portes.** `tooling/gates/porta-reflex.mjs:26-31` bloqueja qualsevol `type: prompt|informe|acta` a l'escriptori que no porte `reflex:`; `schema.json` té `additionalProperties: false` i no declara `reflex`. **Un document que passa l'una viola l'altra.** Este informe porta `reflex: llegit` i, per tant, és invàlid segons l'esquema; ho faig a consciència i ho documente.
- **Segona porta morta.** `npm run porta:esquemes` → «Falta tooling/wiki/esquema_frontmatter.json». La v1 es va esborrar (bé: `tractor-frontmatter.mjs:8` la declara obsoleta) però la porta que la comparava continua a la cadena. I `tooling/wiki/codemod_frontmatter.mjs`, que és el reparador que `tractor-frontmatter.mjs:535` recomana, llig eixe mateix fitxer absent a la línia 33 i mor amb ENOENT.
- **Font de veritat.** `schema.json` és «Única font mecànica de veritat» (la seua pròpia descripció). El pany diu que no.
- **Severitat.** P0: la garantia central de la reestructuració d'esta matinada («hem forçat l'ús d'una enumeració tancada») és fals en execució.
- **Proposta.** Decidir el contracte de `reflex` (§5, pas 3), afegir-lo a `schema.json` si es manté, i només aleshores `node tooling/wiki/tractor-frontmatter.mjs --segella-esquema`. Esborrar `tractor-esquemes.mjs` de `run-portes.mjs` i de `package.json`, o restaurar el seu segon esquema. Executar la porta i decidir fitxer per fitxer els 22 infractors (no `--baseline` a cegues).

### P0-3 · El pre-commit i la CI són una ficció: tot commit d'avui ha hagut de saltar-se'ls

- **Evidència.** `git config core.hooksPath` → `.husky/_`. `.husky/pre-commit` executa `npm run gate` (= `run-portes.mjs`, 48 passos, s'atura al primer roig), després `lint`, després `test`. Els dos workflows de GitHub (`sdp_lock_ci.yml`, `wiki-integrity.yml`) executen `npm run gate`. He executat 16 d'eixos passos: 5 morts (frontmatter, esquemes, manifest, matrix, tancar) i 8 en roig (registre, reflex, llaurador, teixit, scc, nomenclatura, cens, consell). El primer roig de la cadena en ordre és `porta:cens` (pas 20) i el segueixen registre, manifest, reflex, llaurador, frontmatter, esquemes, nomenclatura, teixit, scc. **La cadena no pot arribar al pas 48 ni en local ni en CI.**
- **Prova documental.** `ESTAT.md:105` («`--no-verify` pel deute estructural»), `10_actes/260918_1736…:23` («La Porta Reflex està trencada»). Els quatre commits d'esta matinada (`5ff9c1c1`, `e441ad36`, `64de6341`, `d79bd0f9`) han entrat amb la cadena en roig.
- **Font de veritat en conflicte.** `PROTOCOL_PETORRETA.md` P-09 i P-11: «`--no-verify` … només es poden cobrir amb CI i protecció de branca»; «Fins que un commit atòmic autoritzat els incorpore, el diagnòstic correcte és roig». `sdp_lock.md` §Alliberament: «No hi ha bypass d'emergència». La pràctica real és el bypass permanent.
- **Severitat.** P0 sistèmic: cap de les 48 portes protegix res mentre el commit normal les esquive.
- **Proposta.** Partir `porta` en `porta:codi` (ràpida, ha d'estar en verd, és la que bloqueja) i `porta:wiki` (consultiva fins que el deute documental baixe a zero). Fins que això no passe, deixar constància a cada commit que ha entrat amb bypass, com fa l'`ESTAT`. `requires_human_decision: true` (canvia el contracte de commit).

### P0-4 · La memòria entre sessions perd informació per quatre forats

- **Forat 1: el Despertar llig el final d'un ESTAT que creix pel principi.** `despertar.mjs:30-35` agafa els últims 1500 caràcters de `.agents/ESTAT.md`. Les entrades d'`ESTAT.md` van de la més nova (línia 8, 26-09-21 03:55) a la més vella (línia 130), després ve un bloc «Estat anterior conservat» del 18 de setembre, i l'última entrada real (05:55 d'avui) s'ha afegit al final. Resultat verificat a l'`ON_ESTIC.md` que jo mateix he carregat: les «Properes passes» que em dona són les del 18 de setembre, i inclouen «llevar `:host { all: initial }` de `tokens.css:20`», que `ESTAT.md:86` declara fet el dia 19. **El context de despertar dona ordres obsoletes.**
- **Forat 2: el Somiador buida l'escriptori a l'arrencada, sense criteri.** `despertar.mjs:42-43` (diff sense cometre) executa `node tooling/brain/somiador.mjs` a través de `runGitCommand`, que en cas d'error torna la cadena `'Desconegut'` i la descarta. `somiador.mjs:28,49,62` no té cap comprovació d'edat: mou amb `renameSync` **tot** fitxer solt de `04_escriptori/` (excepte els que contenen `index`), els de més de 500 KB o amb `BUNDLE` al nom cap a `../_arxiu_wiki_de_poble/` i la resta cap a `90_arxiu_historic/<data>_Sessio_Tancada/`. Les «Fases 2 i 3» (destil·lació) són un comentari (`:54-55`). Conseqüències verificades: (a) 7 fitxers del matí moguts a l'arxiu amb hash idèntic (no s'ha perdut res); (b) `00_index_escriptori.md:31-34` encara els llista com a «Documents Actius» i no llista els dos prompts vius, perquè el Somiador salta els índexs; (c) l'arxiu intern és untracked per git i no té `00_INDEX_ARXIU` (enllaçat des de `00_index.md:13`), o siga que els set documents queden fora de git i fora del graf alhora; (d) `QUI_SOC.md` §6 diu «MAI llegir `90_arxiu_historic/`» i `DESTINS_CANONICS.json` el declara `READ-ONLY. Prohibit escriure a l'històric llevat d'ordre humana explícita`; (e) `PROTOCOL_PETORRETA.md` P-10 prohibix crear, editar o moure res a `_arxiu_wiki_de_poble`, i el Somiador hi escriu per disseny (`somiador.mjs:18`). L'ordre correcte de la vida d'un escriptori és dormir al final del dia, no en despertar-se.
- **Forat 3: `ON_ESTIC.md` és una foto, no un túnel.** Es genera només amb `npm run despertar` a mà. El que he carregat porta `2026-09-21T04:06`, commit `64de6341` (un darrere de HEAD) i llista 7 fitxers que ja no són a l'escriptori. No hi ha cap `SessionStart` a `.claude/settings.json` (el fitxer no existix; `.claude/settings.local.json` només té `permissions`). A més, `despertar.mjs:21` filtra `'00_Bandeja_d_Entrada'` i `'01_Produccio'` en majúscules, que mai coincidixen amb els directoris reals en minúscules: per això `ON_ESTIC` els llista com si foren fitxers de treball.
- **Forat 4: el LEDGER «immutable» ha sigut mutat per un reemplaçament cec, i el mecanisme de lliçons està buit.** `git log -S"Offline-First" -- .agents/LEDGER.md` → commit `b8f0ee3a` (17 de setembre, 197 fitxers). Abans: «**Offline-First vs Allotjament a Firebase (Online-First temporal)**». Després: «**Online-First vs Allotjament a Firebase (Online-First temporal)**». La paraula `Offline-First` ha desaparegut de tota la wiki (0 aparicions fora de l'arxiu) i han quedat frases com «S'ha eliminat la fractura ideològica entre *Online-First* i *Online-First*» (`10_actes/260914_2359…:14`) i «la mort de l'arquitectura Online-First … passa a ser estrictament Online-First» (`core_registre_automillora.md:22`). La skill que ensenya a fer estos reemplaçaments (`wiki-propagar-veritat`) s'ha reemplaçat a si mateixa: el seu exemple a la línia 28 és `sed -e 's/dispositius moderns/dispositius moderns/g'`, una ordre que no fa res. I `grep -rn "Lliçons del Mestre" .agents/` torna una sola línia: la instrucció. **Zero lliçons en tres setmanes.** El LEDGER tampoc té cap línia `correcció` ni cap entrada per als quatre commits d'avui.
- **Severitat.** P0: la maduració que este prompt demana («que IAIA MarIA puga automadurar») no té cap conducte físic hui.
- **Proposta.** §5, passos 5 a 8.

### P0-5 · Tres constitucions, tres «Acte Reflex» i un `AGENTS.md` arrel que tothom cita i ningú ha creat

- **Tres constitucions vives.** `.agents/QUI_SOC.md:62` diu «reemplaça i fusiona BOOTSTRAP, AGENTS, BIOS i BASELINE»; les quatre continuen al disc i les lligen 30 programes (`context_documental.mjs:5-6`, `cataleg_skills.mjs:68`, `verify-bios.mjs:11`, `broker.mjs:93-94`, `tractor-registre.mjs:60`, `tractor-doctrina.mjs:54`, `manifest.yaml`, `hooks/verify.mjs:8-9`, els tests). `QUI_SOC.md` el llig **un sol fitxer**: `CLAUDE.md`. Cap programa, porta ni test el coneix. La fusió és una frase, no una migració. Deu regles d'`AGENTS.md`, `BOOTSTRAP.md`, `BIOS.md` i `BASELINE.md` no tenen equivalent a `QUI_SOC.md` (taxonomia de noms §2, Protocol Fusible §10, Inici de sessió i Acta Marmota §14, quota de 20 elements a la safata, Fail-Closed de BOOTSTRAP §3, seqüència d'arrencada de BIOS, entre altres).
- **`AGENTS.md` a l'arrel.** El demanen `doc_governanca.md:11` (nivell 1 de la jerarquia de veritat), `successio_lazaro_execucio.md:16`, `00_arquitectura_tecnica_unificada.md:12`, `soci_sollutia.md:206`, `reflex_petorreta.mjs:96,1423` («Falta AGENTS.md a l'arrel; l'autodescobriment no està garantit»), `compile-wiki-to-system-prompt.mjs`, `generar_genoma_v2.mjs`. No existix. Codex busca `AGENTS.md` a l'arrel per convenció; ací només troba `.agents/AGENTS.md`, que no carrega sol. `CLAUDE.md` carrega `QUI_SOC.md`. **Els dos agents locals arranquen amb constitucions diferents.**
- **Tres significats d'«Acte Reflex».** (a) `QUI_SOC.md` §4 i `AGENTS.md` §0: llegir la plantilla abans d'escriure un prompt. (b) `02_genotip.md` llei 3, `PROTOCOL_PETORRETA.md`, `auditoria_canonica.md:17`: la lease criptogràfica `open → seal → rebut` per a qualsevol efecte lateral. (c) `CLAUDE.md`: el reflex de correcció (escriure la lliçó quan el Mestre corregix). Tres mecanismes diferents amb un sol nom. `AGENTS.md` §0 a més cita `[[00_PLANTILLA_PROMPT_CONSELL]]`, un fitxer que només sobreviu dins de `.sdp-reflex/bootstrap/`.
- **Fet observable en este mateix encàrrec.** El prompt que m'ha convocat s'ha escrit amb `prompt_consell.md` (plantilla per a IAs externes: «acompanya un BUNDLE», «Equip d'Auditoria (El Consell)») en lloc de `prompt_local.md` (sense bundle, amb la regla de la Reunió davall l'Olivera). `AGENTS.md` §6 diu que per a Claude i Codex «NO S'HA DE GENERAR CAP BUNDLE». El router que hauria de triar la plantilla estava mort (P0-1). **El sistema ha fallat en el primer prompt posterior a la seua pròpia reestructuració.**
- **Severitat.** P0 cognitiu: la IAIA no pot obeir tres constitucions i tres reflexos alhora sense triar en silenci.
- **Proposta.** Una sola constitució a l'arrel (`AGENTS.md`, convenció multiarnés), `CLAUDE.md` = `@AGENTS.md` + `@.agents/ON_ESTIC.md`, i les altres esborrades en la mateixa Petorreta que actualitze els 30 lectors. Tres noms per a tres mecanismes: «Reflex de plantilla», «Lease» i «Lliçó». `requires_human_decision: true`.

---

## 3. Troballes per capa

Format: **T-nn · Severitat · Fitxer** — evidència · font en conflicte · proposta.

### 3.1 Identitat i constitució

- **T-01 · P1 · `01_ser/`** — El pilar de l'identitat té 5 fitxers: un tombstone (`00_bios.md`, `type: petorreta`, apunta a `.agents/skills/identity-iaia-core/` inexistent), un embolcall de 15 línies (`03_equip_ia.md` = `![[agents_equip_ia]]`), l'únic fitxer de la wiki sense frontmatter (`agents_equip_ia.md`), i dos documents reals. Mentrestant, 14 documents etiquetats `core, genoma, identitat` viuen a `02_saber/` (`antigravity`, `anatomia_cognitiva`, `perfil_psiquiatric`, `el_projecte`, `identitat_visual`, `doc_logos_oficials`, `03_consola_termodinamica`, `soci_sollutia` que diu literalment «Aquest document pertany a `00_SER`» a la línia 20, etc.). Font: `00_index_identitat.md:67` («identitat → `01_ser`»). Proposta: moure'ls i deixar `01_ser/` com el nucli de 8 KB que `.manifest.json` promet (que a més llista `00_BIOS.md`, `01_IDENTITAT.md`… en majúscules que no existixen).
- **T-02 · P1 · `01_ser/02_genotip.md`** — Títol «LES 9 LLEIS», línia 12 «Són 9 lleis», llista de 10. Sinapsi `[[02_EQUIP_IA]]` trencada (el fitxer és `03_equip_ia.md`). Proposta: «10 lleis» i enllaç corregit.
- **T-03 · P1 · Cens del Consell, quatre llistes i una ordre trencada** — `consell.json` (12, font de veritat) = `QUI_SOC.md` §7 (12, mateix ordre; el rol de Claude passa de «Seient Núm. 5 · Auditor sènior» a «narrativa, to valencià, filosofia») ≠ `agents_equip_ia.md` (11 del cens: el 12é és «ChatGPT (OpenAI)», no «ChatGPT Codex») ≠ `core-consell-i-colmena` (10: sense Copilot ni Codex, i afig `Fable`, `IAIA MarIA` i `Mestre`) ≠ `core-identitat` (12 escrits a mà). La «REGLA SAGRADA» de `core-consell-i-colmena:29` mana executar `node -e "console.log(require('./.agents/consell.json').membres.join(', '))"` i enganxar l'eixida: l'he executada i imprimix `[object Object]` dotze vegades (`membres` és una llista d'objectes). `core-identitat:47-62` prohibix escriure els noms de memòria i tot seguit els escriu. `porta:cens` ho detecta (C2 en 6 fitxers). Proposta: una sola llista, la de `consell.json`, amb l'ordre `.map(m => m.nom).join(', ')`, i les altres tres esborrades o generades.
- **T-04 · P2 · `core-consell-i-colmena/SKILL.md:51-58`** — Quotes d'un dia concret com a norma permanent: «22% del límit setmanal restant», «Es reinicia en 4 dies i 2 hores (aproximadament el 24 de setembre)», «degradar l'esforç utilitzant Fable (Claude 3.5 Haiku)». Fable no és Haiku (ho diu la mateixa taula de `core_registre_automillora.md:20`, que corregia una confusió idèntica). Proposta: llevar tot estat transitori de les skills; l'estat va a `ESTAT.md`.
- **T-05 · P2 · Baseline i gallet** — `PROFILE.md:14` («sense necessitat de cap paraula clau, ni tan sols "Sóc de Poble!"») contra `AGENTS.md:68` (la frase dispara la lectura de l'última acta) contra `QUI_SOC.md:11` («gallet cultural obligatori») contra `01_identitat.md:22` («No tries l'última acta per data com a autoritat»). I `ADR-2026-08-ONLINE-FIRST.md:17-18` diu «El projecte ja no necessita suport específic per a dispositius moderns», una frase invertida per una edició fallida. Proposta: una sola regla d'arrencada a la constitució única.
- **T-06 · P2 · `.agents/` heretats** — `README.md` no és un readme (bloc d'adopcions del Llaurador amb un sol enllaç). `index.md` té 4 orfes cap a fitxers que no existixen. `cervells/placeholder.md` està buit. `ESTAT.md.abans-260830` i `manifest.yaml.abans-260830` són còpies `.abans` que `wiki-cicle-de-vida` §2 prohibix («No es fan còpies a mà»), amb zero referències. `rules/00_BIOS_COGNITIU.md` existix «per a complir l'exigència R5 del tractor-registre» (documentació per a la porta, no per a la persona) i té l'H1 duplicat. `.ancora_sessio.json` és del 2 de setembre. Proposta: esborrar els quatre primers i el placeholder; `00_BIOS_COGNITIU` s'absorbix a la constitució.

### 3.2 Skills (16)

- **T-07 · P1 · Duplicació literal** — `sdp-workflow/SKILL.md` (`name: socdepoble-workflow`) és la mateixa cosa que la secció `## Secció Original: socdepoble-workflow` de `wiki-cicle-de-vida/SKILL.md:94-113`, i la còpia embeguda és la més forta («Si no hi ha rebut verd (`ok: true`), el torn no pot acabar» contra «com `npm run porta` si hi ha scripts configurats»). La Reunió davall l'Olivera està escrita dues vegades (`core-consell-i-colmena` §6 i `wiki-documentacio-i-reflex` §5). La regla «llig `protocolledge.json` abans d'escriure» està en 4 skills. La regla «cap document solt» en 5. La taxonomia `AAMMDD_HHMM_…` en 4. «Destil·la a la SKILL.md o crea'n una» en 3. Proposta: §4.2.
- **T-08 · P1 · Contradiccions entre skills** — Destins vàlids: `core-identitat:67` («úniques bústies: `90_arxiu_historic` i `00_Bandeja_d_Entrada`; qualsevol altra és invàlida») contra `wiki-cicle-de-vida:106` («TOT document al Mestre va a `04_ESCRIPTORI/`») i `:110` («la Bandeja SEMPRE buida») contra `sdp-estudi-mercat:52` (`01_Produccio/`, zona humana). Què és «dormir»: `wiki-cicle-de-vida:75` («esborra … No l'arxives enlloc») contra `wiki-documentacio-i-reflex:44` («mou tota la brossa a `90_arxiu_historic`») contra `wiki-cicle-de-vida:110` («No l'has de buidar de manera cega»). Reemplaçament massiu (`wiki-propagar-veritat:23`, `sed` sobre milers de fitxers sense àncora) contra `core-restauracio-segellada:50,136` («cap byte … sense un segell per fitxer»). Proposta: un sol text per a cada regla, i la del segell guanya.
- **T-09 · P1 · Skills que no citen les seues portes** — `sdp-pedra-seca` no anomena `porta:pedra-seca`, `porta:design-guard`, `porta:tokens`, `porta:58px` ni `porta:inlinestyles`; `wiki-guardia-frontmatter` no anomena `porta:frontmatter`; `wiki-documentacio-i-reflex` no anomena `porta:matrix` ni `porta:reflex`. L'única skill que llista portes és `wiki-cicle-de-vida` §9, on no les buscaria ningú, i hi cita `tractor-antitailwind.mjs`, que no existix. Proposta: cada regla amb la porta que la fa complir, i un `03_actuar/00_index_portes.md` generat des de `run-portes.mjs`.
- **T-10 · P2 · Danys de migració** — 8 skills (i 17 documents de la wiki: 25 en total) comencen el cos amb els dos caràcters literals `\n` davant del títol (verificat amb `od -c`: `\ n # I d e n t i t a t`). En cap renderitzador eixe H1 és un H1. `sdp-casos-us-essencials` té `\"cards\"` mal escapat al YAML. `core-identitat` té tres H1 i `## Ancoratge de la Wiki` dues vegades. `wiki-cicle-de-vida` diu «Quatre Lleis» i en té sis, salta del §7 al §9 i té l'ancoratge a mitjan document. `wiki-documentacio-i-reflex` §4 «Les Tres Pedres» numera 1, 2, 5. `core-memoria-historica` diu «7 Grans Aprenentatges» i en té 8. Proposta: un sol pas de neteja, revisat.
- **T-11 · P2 · Frontmatter de skills** — Cap de les 16 té `version` ni `lang` (avisos de `porta:cognitiu`); només una té `eines_obligatories`; `wiki-guardia-frontmatter` (la guàrdia del frontmatter) és l'única sense `tags`; `wiki-cicle-de-vida` té `tags: core` sense `core: true`. `SKILLS_SEAL.json` és del dia 17. Proposta: la plantilla `skill.md` §2 ja ho exigix; fer-ho complir amb `porta:registre` R7/R8.
- **T-12 · P2 · `sdp-casos-us-essencials`** — No té cap regla, porta ni ordre. És un registre de dues idees de producte. Proposta: moure a `02_saber/casos_us_essencials.md` (`type: document`).
- **T-13 · P2 · 8 skills sense `## Ancoratge de la Wiki`** — `core-consell-i-colmena`, `sdp-app-grid-shell`, `sdp-universal-page`, `sdp-workflow`, `wiki-busca-skills`, `wiki-guardia-frontmatter`, `wiki-propagar-veritat`, `sdp-casos-us-essencials`. I les que sí en tenen apunten a `[[00_INDEX_SKILLS]]`, que viu a `.agents/`, fora del vault d'Obsidian que la regla vol protegir.

### 3.3 Plantilles (12) i `protocolledge.json`

- **T-14 · P1 · `03_actuar/plantilles/00_index.md`** — En el tall inicial, 15 de 15 enllaços trencats (`00_PLANTILLA_PROMPT_CONSELL`, `plantilla_brainstorming`, `PLANTILLA_ISO_SDP.md`…) i cap dels 11 fitxers reals. A les 07:07 (mentre escrivia) MarIA n'ha reescrit el contingut amb els noms nous: la primera meitat de la troballa queda tancada. La segona no: com que es diu `00_index.md`, col·lisiona amb `_wiki_de_poble/00_index.md`: `porta:llaurador` compta 62 enllaços `[[00_index]]` ambigus «→ 2 candidats» i `porta:teixit` 61 penjats. **Un sol nom de fitxer nou ha fet ambigus 61 enllaços que abans resolien.** Proposta: renomenar a `00_index_plantilles.md` (patró que ja usen `00_index_identitat`, `00_index_maquina`, `00_index_actuar`, `00_index_escriptori`) i regenerar-ne el contingut.
- **T-15 · P1 · Doble frontmatter i marcadors** — `prompt_consell.md` i `prompt_local.md` tenen dos blocs YAML consecutius (`:1-8` propi, `:9-16` de càrrega) amb `[TAG1]`, `[TAG2]` i `type: petorreta` (mentre els prompts reals usen `type: prompt` i `porta-reflex.mjs` només mira `prompt|informe|acta`, o siga que un `petorreta` la passa sense rebut). Cap de les dues té `reflex:`; per això els prompts d'avui l'han afegit a mà. Els dos comparteixen el 70% del text. Proposta: una sola `prompt.md` amb dos blocs condicionals (`destinatari: extern|local`), que el router ja distingix, i la càrrega YAML com a bloc de codi ` ```yaml `, no com a segon frontmatter.
- **T-16 · P1 · Les plantilles sembren deute al graf** — Les dues plantilles de prompt porten `[[IAIA MarIA]]`, `[[universal_maquetation]]` i `[[design_system_specs]]` (`prompt_local.md:30,37,38`): cap dels tres existix. Cada prompt generat naix amb tres enllaços penjats (6 aparicions ja al graf). Proposta: `[[01_identitat]]`, `[[sdp-pedra-seca]]` o res.
- **T-17 · P2 · Bloc de logos repetit sis vegades** — `brainstorming.md`, `branding.md`, `doc_to_app.md`, `pla.md`, `produccio.md`, `skill.md` incrusten el mateix bloc «LOGOS OFICIALS (Font de la Veritat)», mentre `doc_logos_oficials.md:16` mana «Cap plantilla ha d'incrustar blocs repetits de logos» i després només té marcadors `{ruta_logo_principal}` sense ruta. Cinc plantilles duen «Data: 2026-06-19 Hora: 14:30» copiat. Set duen `**Categoria:** [[00_plantilles|07_plantilles]]`, dos enllaços morts. Proposta: el bloc viu una vegada a `doc_logos_oficials.md` amb rutes reals, i les plantilles l'enllacen.
- **T-18 · P2 · «ISO» erradicat i vigent** — `sgq_prompts.md:12` (creat esta matinada): «Aquesta nomenclatura ha quedat erradicada … La plantilla canònica … és ara `00_PLANTILLA_PROMPT_CONSELL.md`» (fitxer renomenat el mateix matí). `skill.md:9` «PLANTILLA ISO … Versió ISO 2.0.0». `QUI_SOC.md` §4 «llegiu la plantilla ISO». `wiki-guardia-frontmatter` «esquema ISO v2.1». Proposta: una paraula (SGQ) i `sgq_prompts.md` corregit o fusionat a `00_index_plantilles.md`.
- **T-19 · P2 · Plantilles obsoletes o desplaçades** — `doc_to_app.md` demana «miniapp_<tema>/index.html Pure HTML/CSS/JS, disseny Bento»: contradiu `doc_governanca.md` §Frontera («React/Vite és la carcassa productiva») i `sdp-pedra-seca` §9. `branding.md` duplica `identitat_visual.md` i `doc_logos_oficials.md` (i dona el blau `#016ebf` on `llibre_blanc…:31` diu `0984E3`, i `base_size: 19px` on `a11y_seo_trellat.md:22` diu 16 px). `produccio.md` és una checklist que ja cobrixen les portes de disseny i `a11y_seo_trellat.md`. `bundle.md` no és una plantilla sinó la fitxa d'eixida de `crear_bundle.mjs` (que, a més, és orfe: cap script `npm run bundle`). Proposta: §4.2.
- **T-20 · P2 · `protocolledge.json`** — Amb l'arbre de treball, les 12 rutes resolen (verificat). A HEAD, 12 de 13 apunten a fitxers esborrats: la correcció està sense cometre. Els identificadors de ruta no coincidixen amb els fitxers (`estudi_ia` → `estudi_consell.md`; `modo_produccion` en castellà → `produccio.md`; `planificacio` → `pla.md`). Les claus de la ruta `skill` inclouen `"agent"` i `"trellat"`, dues paraules presents en quasi qualsevol prompt d'este projecte, i `estudi_ia` inclou `"informe"`. Quan el router torne a viure, encaminarà malament. Proposta: ids = noms de fitxer; claus específiques; una prova amb 20 frases reals que ha de passar.
- **T-21 · P1 · `auditoria_canonica.md` (la plantilla a què em remet l'Acte Reflex)** — Descriu 13 pilars (`00_core_wiki` … `12_actes`) que no existixen; cita `03_govern/` (no existix); «Camps obligatoris: status, type, description» contra `schema.json` (`required: ["description"]`); «Camps opcionals: aliases, revisat» contra un esquema que no admet `revisat` i sí admet `tags`, `name`, `version`…; peu amb «(BROKEN LINK: skills)» i `<!-- TODO: fix link -->` copiat en 8 protocols. **Complir l'Acte Reflex m'hauria induït a error en cinc punts.** Proposta: reescriure-la contra l'esquema real i l'arbre real (3 pilars + 3 zones).

### 3.4 Wiki (`01_ser`, `02_saber`, `03_actuar`, `10_actes`)

- **T-22 · P1 · Cinc hubs buits amb `status: canonic`** — `coneixement.md`, `govern.md`, `graf.md`, `identitat.md`, `maquina.md`: 0 caràcters de contingut útil cadascun. `00_index_maquina.md`: una sola línia, un enllaç mort (`03_actuar/07_plantilles/plantilla_estudi_ia`). `03_actuar/00_index_actuar.md`: «Els índexs s'ompliran progressivament». Proposta: esborrar els sis (o convertir-los en índexs generats). `requires_human_decision: true` (poden ser MOC volguts per Obsidian).
- **T-23 · P1 · Quatre taxonomies incompatibles** — `00_index_identitat.md` (00 SER/01 SABER/02 ACTUAR/03 GOVERNAR + 04 ARXIU/05 ESCRIPTORI a `05_Escriptori_Soc_de_Poble/`, ruta citada en 8 fitxers), `auditoria_canonica.md:25` (13 pilars), `core_registre_automillora.md:48` (5 pilars amb REGISTRE), `successio_lazaro_execucio.md:31-37` (`01_ser … 03_govern`). Al disc: `01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes`, `90_arxiu_historic`. Cap document descriu el que hi ha. Proposta: un sol paràgraf a la constitució («3 pilars + 3 zones») i `wiki-propagar-veritat` aplicada amb revisió, no amb `sed`.
- **T-24 · P1 · Graf** — 62 de 152 destins `[[…]]` no resolen (41%); `porta:llaurador`: 59 de 145 documents inabastables des de l'àncora (entre ells `QUI_SOC.md`, `ON_ESTIC.md`, `protocolledge.json`, les 16 skills, les 12 plantilles, els 2 prompts d'avui); `porta:teixit`: 40 orfes (màxim 5) i 17 illes; `verificador-scc`: 22 `ORPHAN_OPERATIVE` (`CLAUDE.md` i `VEINS.md` inclosos). `00_index.md` arrel: 42 de 90 enllaços morts (26 cap a miralls `01_ser/00_AGENTS_I_SKILLS_MIRROR/` i `02_saber/skills_mirror/` que ja no existixen), `description: 00INDEX` (7 caràcters, l'esquema en demana 12), `type: document` en lloc de `index`. `[[00_INDEX_Actes]]` citat 9 vegades: no hi ha índex d'actes. `[[MOTOR_OFFLINE]]` citat 8 vegades: el fitxer es diu `contingencia_offline.md`. **Tres portes del graf usen tres àncores diferents**: llaurador → `_wiki_de_poble/00_index.md`; teixidor → `04_escriptori/00_index_escriptori.md`; SCC → `00_INDEX.md`. Proposta: una àncora, un índex d'actes generat, i regenerar `00_index.md` des del disc.
- **T-25 · P1 · Documents al pilar equivocat** — 9 protocols de `02_saber/protocols_tecnics/` es declaren a si mateixos «fitxa consultiva de `03_actuar`» (`seguretat_execucio.md:14`, `self_repair.md:15`, `successio_lazaro_execucio.md:14`) i l'índex els anomena «Skills Operatives». `sistema_immunitari.md` és `type: skill` (manual de `plaquetes.mjs`) dins de `02_saber`. `obsidian_plugins/plugins.md` i `homepage.md` són 255 línies d'anglés copiades del web d'Obsidian (`5946 results`), etiquetades `temporal`. Les lleis (`doc_governanca`, `llei_05_privacitat`, `estandard_ui_universal`, `estandard_integracio_react`, `forja_to_core`, `sdp_lock`) apunten a un `03_govern` que no existix. Proposta: §4.2, i decisió sobre el quart pilar (`requires_human_decision: true`).
- **T-26 · P2 · Contradiccions de contingut** — Tailwind: «ZERO Tailwind CSS … ESLint bloquejarà el commit» (`estandard_ui_universal.md:49-51`) contra «Totes les mides venen … utilitzant les classes de Tailwind injectades» (`:260`, mateix fitxer) contra «ESLint relaxat: permetem classes de layout» (`10_actes/260915_1410…:17`). Mida tàctil: 44 px (`tractor-consell` L5), 48 px (`01_trellat.md`, `a11y_seo_trellat.md`, `perfil_psiquiatric.md:53`, que diu «48px … esborrats de l'existència. Botons a mínim 48px» en dues frases seguides), 56 px (`estandard_ui_universal.md:126`) i 58 px (`porta:58px`). Tokens `--sp-*` (`a11y_seo_trellat.md:22`) contra `--sdp-*` (`estandard_integracio_react.md:66`). Dexie/PWA: «Futur; no és dependència actual» (`00_arquitectura_tecnica_unificada.md:43-45`) contra «La PWA usa `vite-plugin-pwa` … usa Dexie» (`contingencia_offline.md:14-15`). `forja_to_core.md:12` diu que `npm run porta` no existix; existix. `doc_governanca.md:48-50`, `03_consola_termodinamica.md:34-36` i `index_trellat.md:47` citen tres scripts (`wiki:test`, `wiki:audit:strict`, `precommit:sdp`) que no són a `package.json`. Proposta: una decisió per línia, registrada, i `wiki-propagar-veritat` amb revisió.
- **T-27 · P2 · `10_actes/`** — 18 fitxers, sense índex. 16 noms en majúscules o CamelCase (`porta:nomenclatura` N1) contra `AGENTS.md:21` («sempre en minúscules») mentre la plantilla `acta.md:8` mana `YYMMDD_HHMM_ACTA_Sessio_Titol_Hiper_Descriptiu…`. Tres `status` fora d'enum, sis etiquetes fora d'enum, un fitxer que no és acta (`260916_0645_ACTA_sincronitzacio_disseny.md`: una tasca pendent). Els comentaris HTML de la plantilla es copien literalment a les actes produïdes (`260919_1945…:9,12`). Proposta: `00_index_actes.md` generat, noms normalitzats, plantilla amb els comentaris fora del cos.
- **T-28 · P2 · `00_visio_i_pilars.md` ≈ `el_projecte.md`** — Mateix llinatge de 30 anys, mateixos 4 cartells fundacionals, mateixa missió. Proposta: fusionar a `01_ser/el_projecte.md`.
- **T-29 · P2 · `core_registre_automillora.md`** — `status: arxivat` amb l'avís «Este registre és històric i està arxivat», i l'última fila és del 20 de setembre. És alhora l'únic diari d'aprenentatge del projecte i un document tancat. Proposta: decidir. Si les lliçons van a les skills (`CLAUDE.md`), arxivar-lo de veritat; si no, reobrir-lo.

### 3.5 Memòria (`ESTAT`, `LEDGER`, actes, diari, `ON_ESTIC`)

- **T-30 · P1 · `ESTAT.md`** — 23 KB, `status: esborrany`, entrades en ordre invers al que llig el Despertar (P0-4). Conté un bloc «Estat anterior conservat» del 18 de setembre amb «Properes passes» ja fetes. Proposta: ordre únic (les noves al final), les «Properes passes» en una secció `## Obert` que es reescriu i no s'acumula, i el Despertar llegint entrades senceres (per capçalera `## `), no 1500 caràcters.
- **T-31 · P1 · `LEDGER.md`** — Entrades fora d'ordre cronològic (08-28 després de 09-01), un segell `<!-- HASH -->` a mitjan fitxer (les entrades posteriors no estan segellades), cap entrada per als 4 commits d'avui ni per als arxivats del Somiador, cap línia `correcció`, i la línia 15 mutada pel reemplaçament cec del dia 17 (P0-4). La introducció cita «la Skill Trellat» (`.agents/skills/trellat/`, no existix). Proposta: restaurar la línia 15 des de `b8f0ee3a~1`, afegir les entrades que falten marcades com a retroactives, `node tooling/verify-ledger.mjs --sign`, i documentar què cobrix el HASH.
- **T-32 · P2 · `.agents/.diari_sessio.jsonl`** — 38 rebuts `matrix.rebut`, l'últim del 19 de setembre a les 23:03. Tots hashegen `BOOTSTRAP.md` i `AGENTS.md`; cap coneix `QUI_SOC.md`. Els rebuts citen `02_saber/plantilles/plantilla_iso_sdp.md`, ruta que no existix. **Cap rebut per a la reestructuració d'avui**: segons `PROTOCOL_PETORRETA.md` P-02, un canvi en `.agents/` o de més de cinc fitxers és risc alt i exigix Petorreta; s'han tocat 70 fitxers sense lease. Proposta: o el Reflex s'aplica a la reestructuració, o es reconeix que hui no s'aplica a res.
- **T-33 · P2 · Dos dimonis de launchd al Mac del Mestre** — `launchctl list` mostra `org.socdepoble.plaquetes` (últim codi d'eixida 0) i `com.socdepoble.reflex_daemon` (últim codi d'eixida 1). El sistema immunitari corre sense supervisió mentre Claude, Codex i la IAIA editen el mateix arbre. `.immunitari/` té 121 fitxers, `.wiki-safety/` 114 (6,6 MB), `.brain-trash/` 45, `.sdp-paperera/` 50, `.sdp-reflex/` 53: cinc papereres ocultes amb quatre polítiques. Proposta: un sol directori d'estat ocult amb un sol `.gitignore`, i el dimoni del Reflex diagnosticat o desactivat. `requires_human_decision: true`.
- **T-34 · P2 · Arrel del repositori** — `prompt.md` (1400 línies: una resposta de Codex enganxada amb `<USER_REQUEST>`), `apply_codex_notes.js` i `apply_codex_notes.cjs` (el mateix script dues vegades) són a l'arrel i cometsos avui (`63f81d95`). `AGENTS.md:24`: «Cap fitxer temporal ni de treball s'ha de deixar a l'arrel del repo». Proposta: esborrar-los del seguiment.

### 3.6 Portes i arnesos

- **T-35 · P1 · `.agents/hooks.json` no el llig cap programa d'este repositori** — Confirmat per grep total: només prosa el cita. Noms d'eina (`write_to_file`, `replace_file_content`) i forma de càrrega (`toolArgs.CodeContent`, `TargetFile`) d'un IDE concret; per a Claude Code el hook viuria a `.claude/settings.json` (no existix) amb `Write|Edit` i `tool_input.file_path`. **No puc verificar si l'IDE Antigravity el llig**: no hi ha evidència al repo i tinc prohibida la cerca web. La versió anterior (HEAD~1) tenia dos hooks cap a `.agents/hooks/verify.mjs` i `preflight_matrix_wrapper.mjs`; la nova els ha deixat orfes (els cita només el test), i `wiki-cicle-de-vida:26` encara els documenta com a actius. `verify.mjs`, si algú el cridara, denegaria tota escriptura a la wiki: `DESTINS_CANONICS.json` declara `00_Bandeja_d_Entrada` en majúscules i `segura()` llança `Capitalització no canònica` (verificat).
- **T-36 · P1 · `porta-reflex.mjs` és de porta oberta** — `:46-48` `process.exit(0)` davant de qualsevol error de JSON; `:41-45` exit 0 per a tot fitxer fora de `04_escriptori`; `:57` exit 0 sense stdin ni arguments; `:26` ignora `type: petorreta`; `:27` accepta qualsevol `reflex:` (fins i tot `reflex: no`). No té test. No és a `run-portes.mjs` ni a `tancament.mjs`. El rebut és una paraula (`llegit`), no el parell de hashos que l'informe de Claude del matí especificava (§5 Anella 1). Proposta: o un rebut amb substància (hash curt de la plantilla llegida), fail-closed, amb test negatiu i cablejat a l'arnés real; o esborrar-lo. Una porta que sempre diu que sí és pitjor que cap porta: dona fe falsa.
- **T-37 · P1 · Tres sistemes de hooks de git** — husky (`core.hooksPath=.husky/_`, actiu), `.githooks` (`PROTOCOL_PETORRETA.md` P-10 diu que `reflex init` el configura; no existix), `.git/hooks/pre-commit` (`sistema_immunitari.md:60-67`). `tooling/wiki/pre-commit.mjs` (l'orquestrador de 7 passos del Reflex) no el crida `.husky/pre-commit` i a més executa `node 06_EINES/canonada.mjs` (ruta morta). Proposta: un sol sistema.
- **T-38 · P2 · Guardes CLI trencades** — `tooling/wiki/seo_auditor.mjs:14` usa `` `file://${process.argv[1]}` `` sense `decodeURI`; l'arrel té espais («Som de Poble») i la guarda no salta mai (verificat: exit 0 sense eixida). Mateixa forma a `tooling/lib/arrel.mjs:362` i a `tooling/gates/tractor-arrel.mjs:184`, que la recomana. `matrix.mjs:15` executa el CLI en importar-lo. Proposta: `pathToFileURL(path.resolve(process.argv[1])).href`, com ja fan `desenterrar.mjs` i `reflex_petorreta.mjs`.
- **T-39 · P2 · Orfes de tooling** — 19 scripts de `tooling/brain/` i 24 de `tooling/wiki/` sense cap cridador (`crear_bundle.mjs` inclòs, l'únic que fa bundles per al Consell). `maintain.sh` crida `brain_audit.py`, que no existix. `crear_bundle.mjs:600-606` imprimix «L'Escriptori ha sigut reindexat» dins d'un `try` amb la crida comentada. Proposta: `03_actuar/00_index_eines.md` generat, i esborrar el que no es cride en 30 dies.
- **T-43 · P2 · El validador SGQ no pot validar cap prompt** — `node tooling/wiki/validar_prompt_sgq.mjs <fitxer>` → «SGQ BLOQUEJAT: Plantilla SGQ incompleta: Cos canònic». `prompt_sgq.mjs:52-65` exigix una secció `## Cos canònic` amb 12 encapçalaments dins de la plantilla que `protocolledge.json` resol per a `prompt.consell`; la nova `prompt_consell.md` no la té. Els tres scripts que usen esta biblioteca (`crear_bundle.mjs`, `generar_petorreta_inversa.mjs`, `validar_prompt_sgq.mjs`) són orfes, o siga que la fallada no la veu ningú. Proposta: o la plantilla recupera el cos canònic, o el validador es retira; no les dues coses a mitges.
- **T-40 · P2 · `porta:nomenclatura` N2** — `tractor-psicopatia.test.mjs` cita `_wiki_de_poble/norma.md`, `norma.md.orig` i `memoria.md`; `canonada.mjs` cita `05_Escriptori_Soc_de_Poble`; `.cache-tractor.json` cita `04_arquitectura_disseny`. `porta:consell` L9 avisa d'una clau de Supabase incrustada a `dist/` i `wordpress-plugin/dist/` versionats (fora del meu abast; ho deixe a l'auditoria d'arquitectura i seguretat del prompt 0645).

### 3.7 Escriptori i cicle de vida

- **T-41 · P1 · Tres polítiques de neteja i cap regla d'edat** — Vegeu P0-4 i T-08. `AGENTS.md` §12 tolera fins a 20 elements a la safata; `QUI_SOC.md` §6 «s'ha de buidar sempre». `02_investigacio_ia/` (5 informes de setembre, en majúscules) és una subcarpeta que cap regla preveu i cap índex enllaça. `01_produccio/` conté codi (`codex_refactor/*.jsx`, `generador_sitemap.mjs`) enmig de la wiki. Proposta: §4.5, principi 5.
- **T-42 · P2 · `00_index_escriptori.md`** — Llista 4 documents arxivats i omet els 2 vius (T7 de Claude i F5 de Codex del matí: no aplicat, i ha empitjorat). Ho corregisc jo en ancorar este informe (vegeu §6).

---

## 4. Resposta a la missió del prompt

### 4.1 Contradiccions (resum)

Comptades i citades: 22 contradiccions entre documents de la wiki i la constitució (§3.1 a 3.4), 7 entre skills (T-08), 3 entre portes (P0-2 `reflex` vs esquema; tres àncores del graf; `porta-reflex` vs `PROTOCOL_PETORRETA` P-07 fail-closed). Les cinc que més mal fan: (1) tres constitucions; (2) tres significats d'«Acte Reflex»; (3) què fa «dormir» amb els fitxers; (4) on es lliuren els documents; (5) Online-First contra Offline-First després del reemplaçament cec.

### 4.2 Consolidació (què fusionar, què esborrar, què moure)

**Skills: 16 → 10.**

| Resultat | Ve de | Motiu |
| --- | --- | --- |
| `core-identitat` | `core-identitat` (neteja: un H1, un ancoratge, llista del Consell substituïda per l'ordre a `consell.json`) | Arrencada d'identitat |
| `core-consell-i-colmena` | `core-consell-i-colmena` + `wiki-documentacio-i-reflex` §5 (Olivera) | Un sol text per a la reunió local; fora les quotes |
| `core-context-panic` | igual | Ja és curta i executable |
| `core-restauracio-segellada` | igual | La millor de les setze |
| `core-memoria` | `core-memoria-historica` sense les Lliçons 1, 5, 7 (que són llei de disseny) | Memòria i circuit de lliçons |
| `wiki-cicle-de-vida` | `wiki-cicle-de-vida` + `sdp-workflow` + `wiki-documentacio-i-reflex` §1-4 + `wiki-guardia-frontmatter` | Com naix, es nomena, es formata, s'ancora i es tanca un torn o document; §9 (catàleg de portes) ix a un índex generat |
| `wiki-recerca` | `wiki-busca-skills` + `sdp-estudi-mercat` | Un sol protocol d'investigació externa amb dos objectes (repositoris, competidors) i una sola ruta d'eixida |
| `wiki-propagar-veritat` | reescrita: subordinada a P-02 (canvi massiu = Petorreta), `git grep` + revisió, mai `sed` sobre `LEDGER`/`10_actes`, exemples reals | Ha de deixar de poder destruir-se a si mateixa |
| `sdp-pedra-seca` | `sdp-pedra-seca` + Lliçons 1 i 7 de memòria + les portes que fan complir cada regla | La llei visual |
| `sdp-universal-page` | `sdp-universal-page` + `sdp-app-grid-shell` + Lliçó 5 | Una sola anatomia (pàgina, editor, graella), una sola llei de niament |

`sdp-casos-us-essencials` passa a `02_saber/casos_us_essencials.md`. Fusions: `requires_human_decision: true` (són tractors cognitius del Mestre).

**Plantilles: 12 → 7 (6 plantilles + 1 índex).** `prompt.md` (fusió de consell i local, amb `reflex` al frontmatter de càrrega), `estudi.md`, `acta.md` (comentaris fora del cos), `pla.md` (amb la checklist de `produccio.md` com a fase QA), `skill.md`, `brainstorming.md`, `00_index_plantilles.md` (generat). Fora: `doc_to_app.md` (arquitectura pre-React: arxivar), `branding.md` (a `identitat_visual.md`), `bundle.md` (fitxa tècnica de `crear_bundle.mjs` a `03_actuar`). `requires_human_decision: true`.

**Wiki (87 documents).** Esborrar 6 buits (T-22). Fusionar `00_visio_i_pilars` a `el_projecte` (T-28). Moure 14 identitaris a `01_ser` (T-01). Moure 9 protocols + `sistema_immunitari` + `bundle` a `03_actuar/fitxes/` (T-25). `obsidian_plugins/` fora del vault (`requires_human_decision`). `core_registre_automillora`: decidir (T-29). Reescriure `auditoria_canonica` (T-21). Corregir a mà els 12 fitxers del dany Online/Offline i els 25 del `\n`.

**`.agents/`.** Constitució única a l'arrel; esborrar `BIOS.md`, `BOOTSTRAP.md`, `BASELINE.md`, `README.md`, `index.md`, `cervells/`, `*.abans-260830`, `rules/00_BIOS_COGNITIU.md` en la mateixa Petorreta que actualitze els 30 lectors. Conservar `PROFILE.md` (veu), `PROTOCOL_PETORRETA.md` (llei executable), `consell.json`, `protocolledge.json`, `DESTINS_CANONICS.json` (en minúscules), `deute/`, `skills/`, `ESTAT.md`, `LEDGER.md`, `ON_ESTIC.md`. `requires_human_decision: true`.

### 4.3 Val la pena? (reiteracions, antiguitat, casos d'ús futurs)

- **Reiteracions:** la regla del Reflex apareix en 6 llocs, la del graf en 5, la del Consell en 4, la del Baseline 2022 en 9, els logos en 7. Cada còpia és una oportunitat de divergir, i totes han divergit.
- **Antic i ja fals:** `doc_to_app.md` (mini-apps HTML), `contingencia_offline.md` i `arquitectura_sistema_nervios.md` (CRDT/P2P declarats abandonats per l'ADR-2026-08, però encara descrits com a vius a `soci_sollutia.md:87`), `03_consola_termodinamica.md` i `doc_governanca.md` (tres scripts inexistents), `auditoria_canonica.md` (13 pilars), `sgq_prompts.md` (nascut obsolet), `00_index_identitat.md` (`05_Escriptori_Soc_de_Poble`), `forja_to_core.md` («no hi ha `npm run porta`»), `wiki-propagar-veritat` (exemples buits), `core-consell-i-colmena` (quotes del 20 de setembre).
- **Casos d'ús que encara no s'han donat i que el Brain hauria de suportar:**
  1. **Un tercer arnés.** Hui hi ha tres formes d'arrencar (CLAUDE.md, `.agents/AGENTS.md`, hooks.json) per a tres eines. Quan entre Gemini CLI (`GEMINI.md`) o un altre, es crearà una quarta constitució. Una sola font generada evita això.
  2. **La successió humana (Protocol Lázaro).** Si el Mestre no pot continuar, algú ha de poder llegir el Brain sense IA. `codex_huma/` és la llavor correcta; li falten els volums III i IV i un índex.
  3. **Els veïns.** `VEINS.md` remet a `00_PORTAL.md` per carpeta; no n'existix cap. La primera vegada que la IAIA necessite la Gestoria, llegirà tot el veí.
  4. **Bundles per al Consell extern.** `crear_bundle.mjs` és orfe; el proper prompt a Z.ai o Kimi es farà a mà.
  5. **Reobrir un debat tancat.** `core-memoria-historica` §3 mana llegir 10-20 actes abans de proposar; sense índex d'actes ni resums, cap agent ho fa. Una Acta Marmota amb `## Decisions` extretes a un fitxer `decisions.json` faria consultable el passat en un sol fitxer.
  6. **La segona IA del torn (Olivera).** L'informe del matí demanava un veredicte CONFIRMADA/REFUTADA/NO VERIFICADA per troballa. No està codificat en cap skill. Este informe ho fa (§6) perquè crec que és la millor eina contra el 27% de troballes falses que produïm els agents.

### 4.4 Sentit i propòsit: una gramàtica de noms

Hui conviuen: `core-`/`sdp-`/`wiki-` amb guió a les skills; `prompt_consell` amb guió baix, `pla`, `acta` sense família a les plantilles; `00_index`, `00_index_identitat`, `00_INDEX_SKILLS`, `00_INDEX_Actes`, `00_INDEX_ARXIU` als índexs; `260921_0555_INFORME_…` i `260921_0551_informe_…` als documents; `QUI_SOC`, `ON_ESTIC`, `VEINS` en majúscules a l'arrel; rutes id `modo_produccion` en castellà. Proposta d'una sola gramàtica, curta:

1. **Skills:** `<familia>-<funcio>` amb guió (Antigravity ja imposa `[a-z0-9-]`), `name:` = carpeta, tres famílies: `core` (qui sóc i com m'ature), `wiki` (com escric i recorde), `sdp` (com construïsc el producte).
2. **Plantilles:** `<tipus_document>.md` (`prompt`, `acta`, `estudi`, `pla`, `skill`, `brainstorming`); la variant va dins, no al nom.
3. **Índexs:** `00_index_<zona>.md` en minúscules, un per carpeta, generats.
4. **Documents de treball:** `aammdd_hhmm_<tipus>_<tema>_<agent>.md` en minúscules, on `<tipus>` ∈ enum `type` de l'esquema (`prompt`, `informe`, `acta`, `pla`, `estudi`).
5. **Enums de l'esquema:** `type` de 13 a 8 (`document`, `norma`, `index`, `plantilla`, `skill`, `prompt`, `informe`, `acta`; `petorreta`=`prompt`, `hub`=`index`, `protocol`=`norma`, `briefing`=`informe`, `registre`=`document`); `status` de 7 a 5 (`esborrany`, `actiu`, `canonic`, `generat`, `arxivat`; `quarantena` i `futur` són ubicació i intenció, no estat); `tags` tancats i amb propietari.
6. **Arrel:** només `AGENTS.md`, `CLAUDE.md`, `README.md`, `VEINS.md`, `INTEGRACIO.md`, codi i configuració.

Cada nom respon «què és» (tipus), «per a qui» (família o agent) i «quan» (segell) i res més. Si un nom necessita una explicació, és un nom equivocat.

### 4.5 Tesi: el Brain com a organisme amb tres teixits i un metabolisme

La pregunta del prompt és com pot «automadurar» la IAIA MarIA. La resposta curta: hui no pot, perquè el circuit d'aprenentatge està obert en quatre punts (P0-4). La resposta llarga són sis principis, cadascun amb el que ja existix, el que falta i com es mesura.

**Principi 1 · Una veritat, un fitxer, una porta.** Cada fet del Brain té exactament un lloc on s'escriu, i una porta que falla si es contradiu en un altre lloc.

| Veritat | Fitxer únic | Porta que ho vigila | Estat hui |
| --- | --- | --- | --- |
| Qui sóc i quines lleis obeïsc | `AGENTS.md` (arrel) | `porta:reflex` doctor + `verify-bios` | 7 fitxers, cap porta verda |
| Quines habilitats tinc | `.agents/skills/*/SKILL.md` (`name` = carpeta) | `porta:registre`, `cataleg_skills --check` | 13% d'exactitud |
| Amb quina forma escric | `03_actuar/plantilles/*.md` via `protocolledge.json` | `porta:matrix` amb 20 frases de prova | router mort |
| Quines metadades porta un document | `tooling/wiki/schema.json` | `porta:frontmatter` | pany trencat |
| Qui és el Consell | `consell.json` | `porta:cens` | 4 llistes |
| On estem i què queda obert | `ESTAT.md` (§ Obert reescrit) | `despertar` llig entrades, no bytes | ordre invers |
| Què s'ha decidit i per què | `LEDGER.md` + `10_actes/` + `00_index_actes.md` | `verify-ledger --sign` + índex generat | mutat, sense índex |
| Quin graf tinc | `_wiki_de_poble/00_index.md` (única àncora) | llaurador, teixidor, SCC amb la mateixa àncora | tres àncores |

**Principi 2 · El Brain s'ha de poder carregar des de qualsevol arnés.** Claude llig `CLAUDE.md`; Codex llig `AGENTS.md` a l'arrel; Antigravity llig `.agents/`. Una sola font (arrel) i dos punters (`CLAUDE.md` = `@AGENTS.md` + `@.agents/ON_ESTIC.md`; `.agents/AGENTS.md` = enllaç simbòlic o fitxer generat). El que un arnés no puga carregar sol, s'injecta amb un hook `SessionStart` que executa `npm run despertar` i imprimix `ON_ESTIC.md` per stdout (Claude Code afig eixa eixida al context; així el túnel es tanca sense editar `CLAUDE.md`).

**Principi 3 · Cap porta verda sense prova de fallada.** De les 48 portes, una té test (`tractor-psicopatia`). Cada porta nova (i `porta-reflex` la primera) porta un fixture que ha de fer-la fallar; `npm run porta:selftest` els executa. Una porta que no s'ha vist mai en roig no s'ha vist mai. Les que hui són inevitablement roges (deute documental) passen a consultives fins que el deute siga zero, per a no ensenyar a saltar-se-les totes.

**Principi 4 · El circuit de lliçons ha de ser mecànic, i un de sol.** `CLAUDE.md` mana escriure la lliçó a `## Lliçons del Mestre` de la skill i una línia al `LEDGER`. Cap skill té la secció; cap línia existix; `core_registre_automillora.md` està arxivat i s'hi continua escrivint. Proposta: `npm run llico -- <skill> "<text>"` que afig l'entrada datada a la skill, la línia al LEDGER i incrementa un comptador al `00_INDEX_SKILLS.md` (el «comptador de Lliçons» del pla 0550, no aplicat). Mètrica de maduresa: lliçons registrades / correccions del Mestre detectades a les actes. Hui: 0 / desconegut.

**Principi 5 · Despertar i dormir són dos moments diferents, i dormir és un acte amb rebut.** Despertar (arrencada) només llig: l'última acta per índex (no per data), les últimes N entrades d'`ESTAT`, la llista de l'escriptori, `git status` resumit i les preguntes obertes. Dormir (`npm run dormir`, al tancament o quan l'escriptori passe de 20 fitxers solts) fa el que el Somiador promet i no fa: (1) inventari; (2) per a cada prompt respost, un `DESTIL` de 40 línies; (3) una `PROPOSTA` de lliçons amb `requires_human_decision`; (4) moure només el que té segell de dia anterior o resposta, cap a `90_arxiu_historic/<data>/` amb `00_index_arxiu.md` regenerat i una línia al LEDGER; mai a `../_arxiu_wiki_de_poble` (P-10: això és un acte humà). L'índex de l'escriptori es reescriu en el mateix pas. El Despertar no mou res.

**Principi 6 · Refutació en dues fases, sempre.** Tota troballa d'un agent és una hipòtesi fins que un segon agent (o el mateix, en una fase separada) la marca CONFIRMADA, REFUTADA o NO VERIFICADA amb evidència. En esta auditoria, de 31 comprovacions una ha caigut. El torn 2 de Codex hauria de començar per la llista del §8.

**Mètriques de maduresa** (complint el contracte de `03_consola_termodinamica.md`: fórmula, font, denominador, prova):

| Mètrica | Fórmula | Font | Llindar | Hui |
| --- | --- | --- | --- | --- |
| Identitat de skills | skills amb `name` = carpeta / skills | `cataleg_skills --check` | 100% | 2/16 |
| Encaminament | frases de prova ben encaminades / 20 | `matrix.mjs` amb fixture | 20/20 | 0/10 |
| Salut del graf | destins `[[…]]` resolts / destins | `porta:teixit` | 100% | 90/152 |
| Abastabilitat | documents abastables des de l'àncora / documents | `porta:llaurador` | 100% | 86/145 |
| Portes vives | portes en verd o consultives amb test / portes | `porta:selftest` | 48/48 | 3 verdes de 16 provades |
| Frescor del context | segons entre HEAD i `ON_ESTIC.timestamp` | `despertar` | < 1 sessió | 1 commit i 3 h |
| Aprenentatge | lliçons datades a skills / correccions | `grep` + actes | ≥ 1 per correcció | 0 |
| Fidelitat de la constitució | regles a la constitució amb porta / regles | manual (una vegada) | creixent | 0 de 14 |

---

## 5. Pla de reparació ordenat (sense executar)

Cada pas diu què es toca, com es verifica i si cal decisió humana. Els passos 1 a 4 són de 30 minuts en total i tornen la vida al sistema; la resta són Petorretes.

1. **Identitat de skills (P0-1).** Corregir `name:` als 14 `SKILL.md`; `node tooling/brain/cataleg_skills.mjs --escriu`; canviar `tractor-cens.mjs:228` i `reflex_petorreta.mjs:100` als noms nous; fer dinàmic `cataleg_skills.mjs:67`; `npm run porta:segella`. Verificació: `npm run tancar`, `npm run porta:registre`, `npm run porta:manifest`, `node tooling/brain/matrix.mjs "crear un prompt"` en verd.
2. **Col·lisió d'índexs (T-14).** `git mv _wiki_de_poble/03_actuar/plantilles/00_index.md _wiki_de_poble/03_actuar/plantilles/00_index_plantilles.md` i regenerar-ne el contingut. Verificació: `porta:llaurador` sense «ambigus».
3. **Contracte de `reflex` (P0-2).** Decidir: (a) `reflex` amb valor `<sha8 de la plantilla>` afegit a `schema.json` i `porta-reflex.mjs` fail-closed amb test; o (b) esborrar `porta-reflex.mjs` i `hooks.json`. Després `node tooling/wiki/tractor-frontmatter.mjs --segella-esquema`. Esborrar `porta:esquemes`. Verificació: `porta:frontmatter` s'executa i llista els 22 infractors. `requires_human_decision: true`.
4. **Despertar sense Somiador (P0-4).** Llevar les línies 42-43 de `despertar.mjs`; corregir el filtre en minúscules (`:21`); llegir `ESTAT.md` per entrades; moure l'entrada de les 03:55 al final o invertir la convenció. Verificació: `npm run despertar` i llegir `ON_ESTIC.md` a mà: cap tasca ja feta.
5. **Dormir com a acte (P0-4, T-41).** `npm run dormir` = `somiador.mjs` amb criteri d'edat i resposta, sense escriure a `../_arxiu_wiki_de_poble`, amb `00_index_arxiu.md` + LEDGER + reescriptura de `00_index_escriptori.md`. Verificació: executar-lo en una còpia amb 3 fitxers de prova.
6. **LEDGER (T-31).** Restaurar la línia 15 des de `git show b8f0ee3a~1:.agents/LEDGER.md`; afegir les entrades retroactives d'avui; `node tooling/verify-ledger.mjs --sign`.
7. **Dany Online/Offline (P0-4).** Revisar a mà els 12 fitxers amb `Online-First` fora de l'arxiu i les 3 frases autocontradictòries; no usar `sed`. Reescriure l'exemple de `wiki-propagar-veritat`.
8. **Els 25 `\n` (T-10).** Un sol pas revisat: `perl -0pi -e 's/^\\n(?=#)//m'` sobre la llista del §3.2, amb `git diff` llegit abans de cometre.
9. **Constitució única (P0-5).** Petorreta P-02: `AGENTS.md` a l'arrel amb `QUI_SOC` + les 10 regles no cobertes; `CLAUDE.md` de dues línies + reflex de correcció; actualitzar `context_documental.mjs:5-6`, `cataleg_skills.mjs:68`, `manifest.yaml`, `broker.mjs:93-94`, `verify-bios.mjs:11`, `nomenclatura.json`, `hooks/verify.mjs:8-9`, `tests/backend_consolidacio.test.mjs:16-17`; esborrar els heretats. Tres noms per als tres reflexos. `requires_human_decision: true`.
10. **Cens del Consell (T-03).** Una llista (`consell.json`); ordre `.map(m => m.nom)`; les altres tres llistes esborrades o generades; `porta:cens` en verd.
11. **Fusions de skills i plantilles (§4.2).** Una Petorreta per família; cada fusió amb `git mv` (història) i `porta:registre` en verd al final. `requires_human_decision: true`.
12. **Wiki (§4.2, T-22 a T-29).** Esborrar buits, moure pilars, un paràgraf de taxonomia, reescriure `auditoria_canonica`, índex d'actes, `00_index.md` regenerat. Una àncora per a llaurador, teixidor i SCC.
13. **Portes (P0-3, T-35 a T-38).** `porta:codi` bloquejant i `porta:wiki` consultiva; `porta:selftest`; guardes CLI amb `pathToFileURL`; un sol sistema de hooks; `SessionStart` a `.claude/settings.json`. `requires_human_decision: true`.
14. **Arrel i papereres (T-33, T-34).** `git rm --cached prompt.md apply_codex_notes.*`; un sol directori d'estat ocult; el dimoni del Reflex diagnosticat. `requires_human_decision: true`.
15. **Tornar a segellar els deutes** (`porta:baseline`) **només després** dels passos anteriors i amb el `diff` dels fitxers de deute llegit.

---

## 6. Refutacions i límits (el que no afirme)

- **REFUTADA:** «El Somiador ha perdut fitxers». Els 7 arxivats tenen SHA-256 idèntic a la versió de HEAD.
- **REFUTADA (a l'arbre de treball), CONFIRMADA (a HEAD):** «`protocolledge.json` apunta a fitxers absents» (F1 de Codex). 12/12 resolen ara; 12/13 no resolien a HEAD. La correcció està sense cometre: si algú fa `git stash`, el router torna a morir per una segona raó.
- **REFUTADA:** que `CLAUDE.md` cite una skill inexistent (`skill-llicons-pendents`): diu «crea-la».
- **NO VERIFICADA:** que l'IDE Antigravity llija `.agents/hooks.json`. Cap programa del repo ho fa; la forma del fitxer és la d'eixe IDE; no tinc manera de comprovar-ho sense eixir del bundle. Si el llig, `porta-reflex.mjs` continua sent de porta oberta (T-36).
- **NO VERIFICADA:** «Kimi: finestra de context de més de 2 milions de tokens» (`agents_equip_ia.md:30`). Afirmació factual sense font; dubtosa.
- **NO VERIFICADA:** què compara exactament `tractor-cognitiu` P7 («Doble font canònica del Consell»), que passa en verd amb quatre llistes divergents. `porta:cens` sí que ho detecta.
- **Fora d'abast:** `src/`, els 48 tractors (només he llegit `run-portes`, `porta-reflex`, `tancament`, capçalera de `tractor-registre` i una línia de `tractor-cens`), `tooling/broker/`, el contingut de `.quarantena-260830/` i de `90_arxiu_historic/` més enllà dels noms i hashos, i tot el prompt 0645 (arquitectura i seguretat).
- **Sobre la nota:** `auditoria_canonica.md:76` diu «No s'assigna una puntuació inventada». La del §7 no és inventada: ix d'una rúbrica de set dimensions amb evidència citada per a cadascuna. Si el Consell prefereix no tindre nota, la rúbrica es queda i el número se'n va.

---

## 7. Nota i rúbrica

| Dimensió | Nota | Motiu principal |
| --- | --- | --- |
| Identitat i constitució | 3 | Tres constitucions, tres reflexos, arrel sense `AGENTS.md` (P0-5) |
| Skills | 4 | Bon contingut en 6 de 16; identitat trencada en 14; zero lliçons; duplicats i contradiccions (P0-1, T-07, T-08) |
| Plantilles i router | 3 | Router mort, índex 15/15 trencat, doble frontmatter, blocs copiats (T-14 a T-20) |
| Wiki | 4 | Cinc hubs buits, quatre taxonomies, 41% d'enllaços morts, dany Online/Offline; però `01_trellat`, `sdp_lock`, `doc_governanca`, `codex_huma` són bons (T-22 a T-29) |
| Memòria | 3 | Context de despertar obsolet, Somiador cec, LEDGER mutat, diari mut (P0-4, T-30 a T-32) |
| Portes i arnesos | 4 | 48 portes són un actiu real; 5 mortes, 8 roges, cap hook actiu, pre-commit i CI en bypass (P0-2, P0-3, T-35 a T-38) |
| Cultura i disseny cognitiu | 8 | Trellat, Pedra Seca, Consell, Olivera, Marmota, Lázaro, Fusible: idees clares, originals i útils |

**Mitjana: 4,1. Nota: 4 / 10.** Amb els passos 1 a 8 del §5 (un matí de faena) el sistema torna a executar-se i la nota puja a 6. Amb els passos 9 a 15 (tres Petorretes) el Brain queda coherent i mesurable, i el 8 que l'informe del matí prometia és honest.

---

## 8. Per al torn 2 (Codex): què refutar primer

1. Fes els passos 1 i 2 del §5 en una còpia temporal i confirma que `tancar`, `registre`, `manifest`, `matrix` i `llaurador` passen a verd. Si no, la meua cadena causal de P0-1 és incompleta.
2. Refuta P0-4 forat 1: hi ha cap altre lector d'`ESTAT.md` que assumisca les entrades noves dalt? Si n'hi ha, el que cal canviar és `despertar.mjs`, no l'`ESTAT`.
3. Verifica amb el Mestre si Antigravity llig `.agents/hooks.json` (T-35). Si sí, mesura el que `porta-reflex.mjs` bloqueja de veritat amb un fitxer sense `reflex:`.
4. Revisa `tooling/broker/broker.mjs` (no auditat): llig `AGENTS`, `BOOTSTRAP` i `PROTOCOL_PETORRETA` com a «procediments»; què fa amb ells?
5. Passa els 48 tractors pel patró «porta que ix verd sense comprovar res» (`exit 0` en un `catch`, comprovacions inerts). En conec quatre d'auditories anteriors; ací n'he trobat una més (`porta-reflex`).
6. Discuteix §4.2: quines fusions perden un tractor cognitiu que jo no veig.

---

## 9. Reunió davall l'Olivera: contrast amb l'informe de Codex (06:53) i el pla de MarIA (06:55)

Codex ha entregat el seu informe (`260921_0653_informe_auditoria_brain_codex.md`) abans que jo acabara el meu; hem treballat en paral·lel sobre el mateix tall sense llegir-nos. Per la regla de la reunió, el contraste ací. El pla de MarIA (`260921_0655_pla_implementacio_brain_maria.md`, modificat a les 07:08) respon només al de Codex.

### 9.1 Convergència independent (dos auditors, les mateixes xifres)

- **Nota 4/10 en els dos**, per camins diferents (rúbrica de set dimensions ací; judici professional en cinc allà).
- 14 de 16 skills amb `name` diferent de la carpeta, i la cadena catàleg → Matrix → Tancament (el meu P0-1, el seu P1 «canvi de noms»).
- Pany de l'esquema (P0-2 = «Frontmatter») i `porta:esquemes` amb fitxer inexistent.
- Llaurador: 59 inabastables, 62 ambigus, 136 penjats. Xifres idèntiques, per tant reproduïbles.
- Despertar executa Somiador abans de generar `ON_ESTIC` (P0-4 forat 2 = el seu primer P1).
- Número màgic 16 (P0-1 = el seu P2). `00_index` duplicat (T-14 = «graf»). Constitució contra skills (P0-5, T-08 = «constitució»).
- Etiquetes fora d'enum: jo 15 fitxers dins de `01/02/03/10`; ell 29 usos en 25 documents comptant `.agents` i l'escriptori. Compatibles.

### 9.2 Troballes de Codex que jo no tenia, verificades ara (set de set CONFIRMADES)

1. `somiador.mjs:49` fa `renameSync` sense comprovar si el fitxer de destí existix: un arxivat antic amb el mateix nom s'esborra en silenci. `grep existsSync` només troba la comprovació del directori (`:48`).
2. `entropia_zero_router.mjs` → `validarFrontmatter({…, tags: ['NO_EXISTEIX']})` torna `[]`. El «validador global» que el pla de MarIA vol usar per a verificar les etiquetes no valida l'enum: donaria un verd fals.
3. `build_rag_index.mjs:16` inclou `.agents` a consciència (ho va afegir el pla de les 05:50 d'este mateix matí) i escriu a `public/rag-index.json` sense cap filtre per `status`. `ESTAT`, `LEDGER`, actes, esborranys i skills es publiquen. Ho passe també a l'auditoria d'arquitectura i seguretat (prompt 0645).
4. `tooling/gates/obrir_torn.mjs` no té `--json`, ni `turn_id`, ni cap escriptura. La Llei 1 de `wiki-cicle-de-vida` («sense `turn_id` el torn és il·legítim») promet un passaport que l'script no expedix.
5. `reflex_petorreta.mjs:811` exigix `tipus: petorreta` i `schema.json` prohibix `tipus`: cap Petorreta mecànica pot ser vàlida per als dos alhora.
6. `cataleg_skills.mjs:51` només admet `[a-z0-9-]`: la forma `<familia>_<funcio>` que el prompt anuncia és impossible per a les skills; només val per a plantilles.
7. `skill.md:36` («màx 220 caràcters») contra `schema.json` (`maxLength: 140`).

### 9.3 On discrepe de Codex

- «Fusionar no és concatenar»: hi estic d'acord i ho faig meu. Les fusions del §4.2 s'han de llegir com a reescriptures amb una responsabilitat per skill, no com un `cat`. `core-identitat` i `wiki-cicle-de-vida` ja són concatenacions («Secció Original») i per això contenen les contradiccions de T-08.
- Codex no cobrix el LEDGER mutat, l'ordre de l'ESTAT contra el `despertar`, les tres constitucions ni `hooks.json` sense lector; jo no cobria el RAG ni `obrir_torn`. Els dos informes es complementen més que no es contradiuen. Cap desacord de fons.

### 9.4 Opinió sobre el pla de MarIA (06:55), punt per punt

1. Somiador fora del Despertar i comprovació de col·lisió: **sí**. Però «l'arxivament es farà manualment» és tornar a no tindre cicle. Cal `npm run dormir` amb criteri (§4.5, principi 5).
2. Llevar el 16 i corregir `name`: **sí**, és el pas 1 del §5. Hi falta: `cataleg_skills.mjs --escriu` (índex i manifest), `tractor-cens.mjs:228`, `reflex_petorreta.mjs:100` i `porta:segella`. Sense això, `porta:cens` i `porta:reflex` continuen roges.
3. `tipus` → `type` al Reflex: **sí**. «Desactivar o relaxar» el Cos canònic de l'SGQ: **no**. Un validador relaxat perquè encaixe una plantilla que ha perdut el cos no valida res (T-43). O la plantilla recupera el cos, o el validador es retira dient-ho.
4. RAG sense `.agents` i sense `arxivat`: **sí, però** el filtre ha de ser una llista blanca d'estats publicables (`canonic`, `actiu`), no una llista negra: amb la negra, `esborrany` i `generat` continuen eixint. I dos plans del mateix dia (05:50 i 06:55) diuen el contrari sobre `.agents`: cal una decisió escrita al LEDGER.
5. Un `migrar_tags.mjs` que «traduirà al tag vàlid més proper o els eliminarà»: **no**. És el mateix gest que va mutar el LEDGER (P0-4) i contradiu la Lliçó 8 de `core-memoria-historica` («la semàntica és exclusiva del carboni»). Un script pot llistar (fitxer, etiqueta, proposta); la decisió és humana, i 25 fitxers són risc alt segons P-02.
6. Un tractor nou d'enllaços trencats: **no**. Ja n'hi ha tres (`llaurador --check`, `teixidor`, `verificador-scc`) amb tres àncores diferents (T-24). Un quart no arregla res; unificar l'àncora sí. La «correcció manual» de l'índex de plantilles (07:07) n'ha arreglat el contingut però no el nom: mentre es diga `00_index.md`, els 62 enllaços ambigus continuen (T-14, pas 2 del §5).
7. Verificar amb `entropia_zero_router.mjs`: **no serveix** per a les etiquetes (9.2, punt 2).
8. El pla no toca: el pany de l'esquema (sense `--segella-esquema`, `porta:frontmatter` seguix morta), `reflex:` contra l'esquema, l'ordre de l'ESTAT, el LEDGER mutat, el pre-commit en bypass, l'`AGENTS.md` de l'arrel ni les tres constitucions. Són els passos 3, 4, 6, 9 i 13 del §5.
9. Forma: el pla declara `type: pla`, que no és a l'enum de l'esquema; l'informe de Codex, `type: document` sense `reflex:`. Cap dels dos passa per `porta-reflex.mjs`, que només mira `prompt|informe|acta`. Tres documents del mateix matí, tres maneres d'esquivar la mateixa porta sense voler-ho.

### 9.5 Concurrència durant la sessió

Mentre escrivia, el cron `org.socdepoble.plaquetes` ha corregut en «Mode Autònom» i ha generat una recepta de 52 operacions (`.immunitari/receptes/1789966036384_RECEPTA.json`); `sistema_immunitari.md` R1 diu que «el mode autònom no existeix en v1». No ha aplicat res (cal aprovació per hash), però és un quart editor damunt del mateix arbre. Tall reverificat al final: cap dels fitxers que cite ha canviat entre la lectura i la cita, excepte `03_actuar/plantilles/00_index.md` (reescrit a les 07:07; T-14 actualitzat).

---

**Efectes laterals d'este torn:** este informe, la seua entrada a `00_index_escriptori.md` (amb els quatre enllaços arxivats marcats com a tals, els dos prompts vius, l'informe de Codex i el pla de MarIA afegits), una entrada a `ESTAT.md`, una entrada a `LEDGER.md`. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni a cap plantilla. `npm run tancar` executat i fallit per P0-1; el resultat queda anotat a l'`ESTAT`.

*Sóc de Poble!*
