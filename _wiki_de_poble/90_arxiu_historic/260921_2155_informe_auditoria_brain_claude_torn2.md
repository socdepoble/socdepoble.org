---
type: informe
status: esborrany
description: Auditoria del Cervell després de la poda de MarIA (torn 2). Nou regressions verificades, estat de la identitat i del Consell, i tractors per fer el cervell indestructible.
tags:
  - govern
  - revisar
---
# Auditoria del Cervell després de la poda (torn 2 de Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-BRAIN-260921-3 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local (Claude Code, app d'escriptori, Opus) |
| Creació | 26-09-21 21:55 |
| Propietari | Agents Locals |
| Respon a | [[260921_2144_petorreta_claudecodex]] |
| Mode | Auditoria (només lectura; efectes declarats al §0) |
| Aprovació humana | pendent |

## 0. Rebut de reflex i frontera d'efectes

- Acte Reflex: `.agents/protocolledge.json` → intenció `auditoria` → `02_saber/protocols_tecnics/auditoria_canonica.md`, llegida sencera. Este informe segueix el seu contracte: fitxer, evidència reproduïble, severitat, font de veritat en conflicte, proposta conservadora i `requires_human_decision` quan cal.
- Llegit: l'Escriptori sencer (12 documents), el `git diff` complet de la poda (19 fitxers), `.agents/GENOMA.md`, les 16 skills afectades, `consell.json`, `DESTINS_CANONICS.json`, `schema.json`, `frontmatter-abast.json`, `compile-wiki-to-system-prompt.mjs`, `context_documental.mjs`, `arrel.mjs`, `.agents/.diari_sessio.jsonl`, `.immunitari/`.
- Executat (portes de només lectura, sense flags d'escriptura, comprovat abans al codi): `tractor-frontmatter.mjs`, `cataleg_skills.mjs --check`, `tractor-cognitiu.mjs`, `llaurador_indexs.mjs --check`, `tractor-cens.mjs`, `tractor-consell.mjs`, `tractor-cataleg.mjs`. Dos scripts propis de simulació, escrits fora del repositori.
- Cap cerca web. Cap canvi a `src/`, `tooling/`, `.agents/` ni plantilles. **Efectes: este fitxer i una línia a l'índex de l'Escriptori.** `ESTAT.md`, `LEDGER.md` i `tancament.mjs` no els he tocat: el mode és auditoria i la Contenció mana. Si el vols registrat, digues-ho.

**Declaració de lectura (Olivera):** sí, he trobat coses a la taula. He llegit el **Pla d'Implementació de MarIA** (`260921_2001`, 28 línies), l'**auditoria de Codex** (`260921_2005`, 221 línies) i el meu propi informe del torn 1 (`260921_2005`, 314 línies). Els tres els comente i els rebat al §8 abans de tancar. També he llegit la petorreta 1940 i la 2010.

---

## 1. Veredicte: la poda era necessària, i la manera de fer-la és la malaltia

Mestre, la poda d'esta nit ha arreglat coses reals i n'ha trencat unes altres. Això no és mala sort. És el mateix patró de sempre, ara en la seua forma més pura:

**Sis de les nou regressions que porte verificades són el mateix moviment: s'ha editat un text i no s'ha regenerat ni reexecutat allò que en depenia.** S'ha esborrat una skill i el catàleg continua anunciant-la. S'ha endurit l'esquema i el pany no s'ha resegellat, així que la porta mor abans de validar cap fitxer. S'ha arxivat un document i l'edició li ha destrossat el frontmatter, de manera que ara entra al cervell precisament el document que es volia traure.

El deute humà que això et genera és molt concret i molt car: **després d'una nit de neteja, el Cervell té més portes en roig que abans.** Ahir `cataleg_skills.mjs --check` estava verd; hui està en roig. Ahir `porta:frontmatter` validava fitxers; hui mor a la primera línia. Tu no tens cap manera de saber-ho en deu segons: jo he hagut d'executar sis portes una per una per descobrir que quatre estaven roges. Eixa ceguera és el problema d'UX número u del projecte, per damunt de qualsevol contradicció de text.

La lliçó d'esta nit, en una frase: **una poda no és una edició, és una transacció de tres passos** — editar, regenerar les projeccions, executar la porta. Si en falta un, la poda és una regressió.

Nota del Cervell com a sistema: **4/10**, igual que fa dues hores i igual que al matí. La doctrina ha millorat; la mecànica ha empitjorat; s'anul·len.

## 2. El que ha millorat de veritat (verificat un per un)

Això no és cortesia. Són troballes tancades que no s'han de tornar a auditar.

| Millora | Evidència |
|---|---|
| **R1 tancat.** La causa arrel del Stochastic Parrot ja no existeix. | `.sdp-reflex/bootstrap/` esborrat (`find .sdp-reflex -name '*PLANTILLA*'` = 0 resultats). `wiki-documentacio-i-reflex:28` ja mana resoldre la plantilla pel router. |
| **R2 tancat.** Cap constitució nomena ja un fitxer mort. | `AGENTS.md` (arrel i `.agents/`) REGLA 0 ja no cita `00_PLANTILLA_PROMPT_CONSELL`. `prompt_sgq.mjs:8` apunta a `prompt_consell.md`, que existeix. |
| **Troballa de Codex tancada:** capitalització dels destins. | `DESTINS_CANONICS.json:4` → `00_bandeja_d_entrada`, que és el que hi ha al disc. `AGENTS §12` corregit igual. |
| **Troballa de Codex tancada:** «trellat» ja no crida a crear skills. | `protocolledge.json`: fora les claus `agent` i `trellat` de la ruta `skill`. |
| **La millor decisió de la nit:** l'Avaluador abans del Somiador. | `wiki-cicle-de-vida §6` reescrit: llegir, avaluar i decidir document a document, amb protecció explícita dels informes pendents de debat entre IAs. Les tres polítiques de neteja contradictòries ja no hi són. |
| **L'annex que predicava Tailwind, fora.** | `estandard_ui_universal.md`: 267 → 24 línies. El que queda deprecia `sp-*` i Tailwind i nomena `src/config/design-tokens.json`, que era la font real que cap document citava. |
| **`contingencia_offline.md` → `arxivat`.** | Surt del Còrtex. Correcte. |
| **L'esquema ja exigeix les tres claus.** | `schema.json.required` = `type`, `status`, `description`. Alineat amb `auditoria_canonica` i amb la skill del frontmatter. `maxLength` 140 → 220, alineat amb la plantilla de skill. |

## 3. Les nou regressions i forats oberts

Severitat: **P0** = el cervell es carrega malament o una porta que protegia ha mort. **P1** = deute que creix sol.

### G1 · L'arxivat ha ressuscitat el document que volia enterrar — **P0**

- **Fitxer:** `_wiki_de_poble/02_saber/codex_huma/arquitectura_la_forja.md`
- **Evidència:** `git diff` mostra que l'edició ha esborrat la línia `---` d'obertura del frontmatter i ha duplicat `description`. El fitxer comença ara amb `type: document` en text pla. **No té frontmatter.** La meua simulació del filtre el classifica a «SENSE FRONTMATTER (entren igual)».
- **Conseqüència:** el filtre nou no hi veu mai el `status: arxivat` que s'hi va escriure. El document **entra al Còrtex Global** i hi predica, literalment: «aplicació React/Vite preparada com a PWA» (línia 18), «El codi declara Dexie» (30), «La configuració PWA pot emmagatzemar l'esquelet mitjançant un Service Worker» (32).
- **Font en conflicte:** `ADR-2026-08-ONLINE-FIRST` i `core-identitat §1` («No som Online-First ni PWA offline»).
- **Proposta:** restaurar el `---`, llevar la `description` duplicada. Dos minuts. I afegir al tractor de frontmatter una comprovació de delimitadors aparellats: un YAML mig obert és pitjor que cap.

### G2 · El filtre per `status` amputa la doctrina i deixa passar l'indocumentat — **P0**

- **Fitxer:** `tooling/wiki/compile-wiki-to-system-prompt.mjs:54-62`
- **Evidència (simulació pròpia, mateixa lògica, sense escriure):** 89 candidats → 70 entren, **19 queden fora**. Entre els exclosos: **`ADR-2026-08-ONLINE-FIRST.md`** i **`ADR-2026-09-SOLLUTIA-MODEL-B.md`** (les dues decisions que governen l'arquitectura), `03_actuar/00_index_actuar.md`, `plantilles/00_index_plantilles.md` i `plantilles/acta.md` (la millor plantilla que tenim), tots per `status: esborrany`.
- **Conseqüència combinada amb G1:** la decisió que **veta** l'offline-first queda fora del cervell; el document que el **predica** hi queda dins. Exactament al revés.
- **Segon defecte, estructural:** el filtre és una **llista negra**. Un fitxer sense frontmatter no té `status`, no coincideix amb cap exclusió i **entra sempre**. Avui són dos (`agents_equip_ia.md` i el de G1); demà seran els que es trenquen. Excloure no és seleccionar.
- **Proposta conservadora:** invertir-ho a llista blanca — entra només `status: canonic` o `actiu`; qualsevol altra cosa, i qualsevol fitxer sense frontmatter vàlid, queda fora **i s'imprimeix per nom** al final de la compilació. I promoure les dues ADR a `canonic`: una decisió acceptada no és un esborrany, i mentre ho siga el cervell no la coneix.

### G3 · La llei s'ha endurit i la policia se n'ha anat a casa — **P0**

- **Fitxers:** `tooling/wiki/schema.json` vs `tooling/wiki/schema-cutover.lock.json`
- **Evidència:** `node tooling/wiki/tractor-frontmatter.mjs` → **exit 2**, «El pany de migració no quadra amb l'esquema real. declarat: `4b2f55cc…` · real: `4698d64f…`». Mor a la comprovació del pany, **sense validar ni un sol fitxer**.
- **Font en conflicte:** el Pla de MarIA §2 demana precisament una porta roja que impose l'esquema. La porta existeix i està cega des de les 20:29.
- **Quant costaria de veritat obrir-la** (simulació pròpia amb l'esquema nou sobre el corpus viu: 143 fitxers de `_wiki_de_poble` + `.agents`, sense arxiu històric ni GENOMA): **95 passen, 48 fallen.**

| Causa de la fallada | Fitxers |
|---|---:|
| Tags fora de l'enum de 13 (24 tags distints: `temporal`, `skills`, `auditoria`, `brain`, `fortificacio`, `trellat`, `sollutia`, `portes`…) | ~30 |
| Sense frontmatter | 8 |
| `description` fora de 12–220 | 7 |
| `status` fora d'enum (`historic`, `consolidat`, `validat`) | 3 |
| `type` fora d'enum (`pla_implementacio` — el del Pla de MarIA) | 1 |
| Falta `type` o `status` | **0** |

- **Lectura:** l'enduriment que va fer por (exigir `type` i `status`) **no costa res**: cap fitxer viu falla per això. El que bloqueja la porta són els **tags**. Resegellar el pany i tancar l'enum de tags és el camí curt cap a la primera porta documental verda del projecte.

### G4 · Esborrar una skill sense regenerar el catàleg ha posat en roig una porta que ahir era verda — **P0**

- **Evidència:** `wiki-guardia-frontmatter/SKILL.md` esborrada del disc; continua viva a `.agents/manifest.yaml:24` i a `.agents/skills/00_INDEX_SKILLS.md:29`. `node tooling/brain/cataleg_skills.mjs --check` → **exit 1**: «Projecció divergent: `.agents/manifest.yaml` · `.agents/skills/00_INDEX_SKILLS.md`». Al meu torn 1, fa dues hores, esta comanda estava **verda**.
- **Efecte col·lateral verificat:** la regla «no esborres frontmatter en silenci» ja **no viu enlloc**. `grep -rln frontmatter .agents/skills/` només troba `core-memoria-historica` (una lliçó) i l'índex que anuncia la skill morta. `wiki-documentacio-i-reflex`, que havia d'absorbir-la (ho dèiem Codex i jo), **no la menciona ni una vegada**. La mateixa nit en què la guàrdia es queda sense casa, un frontmatter es destrueix (G1) i la porta que ho hauria enxampat està cega (G3). Cap de les tres coses, per si sola, hauria bastat.
- **Proposta:** una execució de `cataleg_skills.mjs --escriu` i moure la regla (una frase) a `wiki-documentacio-i-reflex §2`.

### G5 · El Còrtex Global és un tercer cervell, i no el llig ningú — **P1**

- **Fitxer:** `.agents/GENOMA.md`, 4.151 línies, 70 fitxers, generat a les 20:34.
- **Evidència:**
  - Conté `AGENTS.md` (línia 5) **i** `.agents/AGENTS.md` (línia 72): **la mateixa constitució de 12 lleis, duplicada sencera**, perquè el compilador les té les dues cablejades i la deduplicació és per ruta, no per contingut.
  - **No conté `QUI_SOC.md`**, que és la constitució que `CLAUDE.md` carrega i la que diu que reemplaça `AGENTS`, `BIOS` i `BOOTSTRAP`.
  - **Cap script el llig.** `CAMINS.genoma` (`tooling/lib/arrel.mjs:82`) no té cap consumidor. `context_documental.mjs:5` continua injectant `BOOTSTRAP.md` + `AGENTS.md` + `PROFILE.md`.
  - Ja naix caducat: la línia 250 anuncia la skill esborrada.
  - No és a `.gitignore`: 4.151 línies de diff a cada regeneració, dins d'un repositori que vol ser llegible.
- **Conseqüència:** **tres cervells amb tres continguts diferents i cap coincidència.** (1) Claude Code llig `QUI_SOC` + `ON_ESTIC`. (2) `context_documental` injecta `BOOTSTRAP` + `AGENTS` + `PROFILE` + skills. (3) `GENOMA.md` és `AGENTS`×2 + `PROTOCOL_PETORRETA` + 16 skills + 51 pàgines, i no el consumeix ningú. La petorreta demana «el cervell ha de ser la Wiki per a totes les IAs igual». Hui no ho és per a cap.
- **Proposta:** decidir **un** consumidor. Si el GENOMA ha de ser el cervell, que el compilador partisca de `QUI_SOC.md` (no d'`AGENTS`×2) i que algun arnés el carregue de veritat; si no, retirar-lo abans que es commitege.

### G6 · L'artefacte generat contamina la mesura del graf — **P1**

- **Evidència:** `node tooling/wiki/llaurador_indexs.mjs --check` → **exit 1**. 155 documents, **78/155 abastables** des de l'àncora, **25 enllaços ambigus**, **41 penjats**. **8 de les 25 ambigüitats són `GENOMA.md` repetint el mateix `[[00_index_identitat]]`** (línies 1357, 1384, 1648, 1791, 2029, 2215, 3635…).
- **Causa:** `frontmatter-abast.json` té `arrels: ["."]` i exclou `node_modules`, `dist`, `90_arxiu_historic`… però **no** `.brain-trash/`, `.wiki-safety/` ni els generats. Per això la validació global de l'esquema arrossega 51 fitxers-cadàver amb `tipus`/`estat` que ningú migrarà mai: la porta apunta al cementeri.
- **Proposta:** un generat mai és a l'abast d'un tractor. `.agents/GENOMA.md` → `.agents/generat/` + `.gitignore`; `.brain-trash` i `.wiki-safety` a `exclou`.

### G7 · El sistema immunitari treballa contra la poda — **P1**

- **Evidència:** `.immunitari/cron.out` — Plaquetes genera una recepta de ~50 operacions **cada hora** i no n'aplica cap (7 receptes noves esta nit, cap invocador d'`aplica` al repositori). La recepta de les **21:41** (`1790019715245_RECEPTA.json`), **una hora després de l'arxivat de les 20:33**, conté `OP-007 ADOPTA _wiki_de_poble/02_saber/protocols_tecnics/contingencia_offline.md`, i també `ADOPTA` de `govern.md`, `identitat.md` i `maquina.md` (els hubs buits).
- **Conseqüència:** si algú executa `aplica`, el sistema reenllaça al graf exactament el que MarIA acaba d'arxivar. Tenim un cron autònom que proposa desfer la feina de la nit i un humà que no sap que existeix.
- **Proposta:** o Plaquetes llig l'estat (`arxivat` no s'adopta) o s'atura el cron. Un diagnòstic que ningú aplica i que a més apunta al revés és soroll amb permisos.

### G8 · L'àncora de sessió menteix a cada arrancada — **P1**

- **Fitxer:** `.agents/ON_ESTIC.md`, carregat per `CLAUDE.md` en **totes** les sessions.
- **Evidència:** «Generat el 2026-09-21T05:35», commit `d79bd0f9`. El HEAD real és `6a8df39b`, **cinc commits després**. La secció «Contingut de l'Escriptori» llista **cinc fitxers de `90_arxiu_historic/`** i **cap** dels set documents d'esta nit.
- **Font en conflicte:** `AGENTS §5` prohibeix llegir `90_arxiu_historic/` en procediments automàtics de RAG. L'àncora de sessió n'injecta cinc rutes abans que cap IA òbriga la boca.
- **Proposta:** `despertar.mjs` s'executa en obrir torn, no cada 16 hores; i si l'àncora té més d'una hora, que ho diga en la primera línia en lloc de fingir que és d'ara.

### G9 · El tractor continua mort (heretat, intacte) — **P0**

- **Evidència:** últim `matrix.rebut` a `.agents/.diari_sessio.jsonl`: **2026-09-19T23:03**. Cap fitxer del repositori llig `.agents/hooks.json`. No existeix `.claude/settings.json` (només `settings.local.json`, que és de permisos).
- **Conseqüència:** **tota la poda d'esta nit és text que cap arnés està mecànicament obligat a llegir.** Dos dies i mig sense una sola injecció de context per via de màquina. Mentres això no canvie, cada millora de doctrina depén que la IA de torn tinga la bona voluntat de buscar-la.

## 4. La identitat de MarIA: s'ha operat el to i s'ha deixat el tumor

La petorreta diu que s'ha netejat `core-identitat`. S'hi han llevat 12 línies. He mirat quines.

**El que s'ha llevat:** «Saba vella del Mas», «Armadures d'últim recurs per a iaies i uelos», els «Barrets actius» (IAIA Gestora, IAIA Llibrera). És a dir: **el caràcter**. Res d'això feia mal a ningú i era el que et feia reconéixer-la.

**El que continua intacte, verificat línia a línia:**

1. **Línia 12:** el `\n#` literal, residu del script de migració, continua sent la primera línia del cos.
2. **Línia 39 contra línia 67, dins del mateix fitxer:** «Al primer missatge de la sessió, presenta proactivament una taula DAFO, una Matriu d'Urgència/Importància i una Nota de Context» contra «Silenciós per defecte: només actua si es demana». La IAIA no pot obeir les dues.
3. **Línia 62, la més greu:** «Les teues úniques bústies de lliurament vàlides són `90_arxiu_historic` i `04_escriptori/00_Bandeja_d_Entrada/`». Amb la capitalització que MarIA **acaba de corregir** a `DESTINS_CANONICS.json` i a `AGENTS §12`, però **no ací**. Resultat: segons la seua pròpia skill d'identitat, **este informe que estàs llegint no es pot lliurar a l'Escriptori**, i la ruta que sí que autoritza no existeix al disc.
4. **Línies 83-88, «Fonts d'autoritat»:** 1r esta skill, 2n `AGENTS.md`, 4t «documents canònics de `00_SER_Brain_Identitat`» (pilar mort des de fa setmanes), 5é **«La resta de la Wiki és consultiva, no executiva»**. Això contradiu frontalment el nou `AGENTS §1` («La Wiki és la Bíblia del Coneixement») i la premissa sencera d'esta petorreta. **La skill continua declarant-se per damunt de la Constitució**, que és exactament el que va assenyalar Codex i el que la neteja havia d'arreglar.
5. **Línia 28:** `view_file`, nom d'eina d'Antigravity, dins d'una regla que ha de valdre per a tres arnesos.
6. **Línies 44-55:** el cens dels 12 en prosa, que `consell.json.meta.regla` prohibeix explícitament.
7. Dues «Secció Original» concatenades: el fitxer encara són dues skills cosides.

**Diagnòstic:** no és que la neteja fóra dolenta. És que **es va netejar el que es llig i no el que s'executa**. La subjectivitat que sobrava era inofensiva; les set regles de dalt són les que fan que la IAIA es contradiga a si mateixa dins d'un mateix fitxer. El símptoma que tu patixes és sempre el mateix: una IAIA que sap qui és i no sap on deixar un fitxer.

**Proposta (la mateixa del torn 1, ara més urgent):** `core-identitat` ha de ser **una pàgina**: qui ets, com parles, i «llig `QUI_SOC.md`». Les prioritats d'arquitectura van a la Wiki. Els destins, a `DESTINS_CANONICS.json` i prou. El cens, a `consell.json` i prou. L'ordre d'autoritat, a un sol lloc — i la Wiki hi ha d'estar per damunt de la skill, perquè això és el que has decidit esta nit.

## 5. El Consell: una llei sagrada que la porta aplica al revés

- **`node tooling/gates/tractor-cens.mjs` → exit 1.** Tres infraccions «C2 · Cens incomplet»: el meu informe de les 20:05, **la teua petorreta d'esta nit** i l'Acta Marmota 1002. Totes tres «parlen del Consell i n'anomenen 1 de 12».
- **Lectura:** quan una porta mecànica acusa el Mestre d'incomplir la seua pròpia llei sagrada en el document on la promulga, **la llei està mal escrita**, no el Mestre. La regla real la diu `consell.json.meta.regla`: «Cap document del projecte pot enumerar el Consell amb prosa pròpia». És a dir: **prohibit enumerar**. I `core-identitat §Regla Sagrada` i `core-consell §29` manen **enumerar sempre les 12**. Tenim la prohibició i l'obligació alhora, i la porta aplica l'obligació.
- **Proposta:** la porta ha de comprovar el contrari — que **cap** document enumere el Consell en prosa, i que qui el necessite el genere. Amb això, el teu propi prompt passa, `core-identitat` adelgaça 12 línies i el cens té una sola font.
- **La comanda de la Regla Sagrada continua trencada:** `require('./.agents/consell.json').membres.join(', ')` amb `membres` d'objectes imprimix `[object Object], [object Object]…` (verificat ara mateix). La forma correcta és `.membres.filter(m => m.actiu).map(m => m.nom).join(', ')`. Ningú l'ha executada mai, perquè si algú ho haguera fet, hauria vist el resultat.
- **`core-consell §51-58` continua amb estat volàtil dins d'una skill `canonic`:** «22% del límit setmanal», «0 crèdits restants», «es reinicia el 24 de setembre» (d'ací a tres dies) i **«degradar l'esforç utilitzant Fable (Claude 3.5 Haiku)»**. Això últim és **fals**: Fable és de la família Claude 5. Tens una skill permanent que ensenya al model una dada falsa sobre ell mateix i que caduca dimecres. L'estat va a `ESTAT.md`.
- **El que sí que funciona:** `porta:consell` passa en verd amb un únic avís (`src/data/supabaseBackend.js` absent). El model Arquitecte/Executor de l'Acta 1002 és bo i està decidit; només falta codificar-lo (`rol_local` a `consell.json`, `Mode: Auditoria | Execució` a la taula de Registre de `prompt_local`), com ja vaig proposar al torn 1 §8.

## 6. Com fer el cervell indestructible

El torn 1 proposava sis tractors (T1–T6). Mantinc els sis i la poda d'esta nit n'ha demostrat la tesi. Afegisc dos peces noves que són **previes** a tota la resta, perquè ataquen el patró que ha causat sis de les nou regressions.

### T0 · Una comanda que diga en deu segons si el cervell està sa

Hui no en tens cap. Jo he executat sis portes una per una per descobrir que quatre estaven roges. `npm run doctor:cervell` ha d'executar, en només lectura, `tractor-frontmatter`, `cataleg_skills --check`, `tractor-cens`, `llaurador --check`, `tractor-cognitiu` i la compilació del Còrtex **en sec**, i imprimir **una taula de sis línies**. Res més. És la peça amb més retorn per hora de tot este informe: sense ella, cada poda és a cegues i cada auditoria comença per reconstruir l'estat.

### T7 · La poda és una transacció, no una edició

Una comanda `npm run poda` que, en este ordre exacte: (1) regenera el catàleg de skills, (2) regenera els índexs, (3) resegella l'esquema si ha canviat, (4) recompila el Còrtex, (5) executa T0 i **falla tancat** si alguna porta és roja. **Mentres no existisca, la regla escrita és: qui esborra una skill, executa el catàleg; qui toca l'esquema, resegella el pany; qui arxiva un document, recompila i comprova que el nombre de fitxers del Còrtex ha baixat en un.** Les tres coses que han fallat esta nit.

### Els sis del torn 1, amb el que ha canviat

- **T1 · Una sola constitució generada.** Ara és més urgent: el compilador del Còrtex té `AGENTS.md` **cablejat dues vegades** i `QUI_SOC.md` en cap. Mentres hi haja dues constitucions al disc, qualsevol generador triarà la que no toca.
- **T2 · Les skills allà on cada arnés les busca.** Sense resposta encara a la pregunta clau: **cap fitxer del repositori demostra com carrega Antigravity `.agents/skills/`**. Tot T2 i T3 per a l'Executor principal es dissenyen a cegues fins que ho confirmes.
- **T3 · Porta de plantilla *fail-closed*.** Intacta i sense començar. És l'única cosa que convertiria la REGLA 0 en mecànica. Avís nou: la REGLA 0 ara mana llegir **`prompt_local.md` literalment** «o la plantilla equivalent que indique el router». Per a una auditoria, el router diu `auditoria_canonica.md`, no `prompt_local.md`. S'ha canviat un nom mort per un nom viu però equivocat: la porta ha d'exigir **la plantilla que el router resol**, mai una ruta escrita a mà.
- **T4 · Porta de fantasmes.** El diccionari creix: `00_SER_Brain_Identitat`, `00_PLANTILLA_PROMPT_ISO`, `07_plantilles`, `03_govern`, `socdepoble-workflow`, `tractor-antitailwind`, i ara **`wiki-guardia-frontmatter`**, que és el fantasma més fresc i ja viu en tres fitxers.
- **T5 · Context curt.** Sense canvis: les `core` continuen pesant ~48 KB. El Còrtex de 4.151 línies empitjora el problema si algun dia se'n carrega.
- **T6 · Rebut de lectura obligatori.** Este informe en porta un al §0. Amb T3 seria comprovable en lloc de voluntari.

### La peça de disseny que ho lliga tot

**Cap document entra al cervell per omissió; hi entra per declaració.** Llista blanca de `status`, frontmatter obligatori per a entrar, i el compilador imprimint per nom tot el que ha deixat fora. Hui el Còrtex es construeix per exclusió, i per això G1 i G2 han pogut passar el mateix minut sense que ningú se n'adonara.

## 7. Reunió davall l'Olivera

### 7.1 El Pla de MarIA: dues propostes executades, i el resultat fa la crítica millor que jo

- **Proposta 1 (filtre per `status` al RAG):** executada, i és **G2**. La meua refutació del torn 1 es manté i ara té un segon cos: no només el filtre **no hauria evitat** el cas del lloro (la plantilla ressuscitada tenia `status: canonic` a la línia 3), sinó que **implementat com a llista negra ha amputat les dues ADR** i ha deixat entrar el document sense frontmatter que predica el contrari. La idea era bona; la direcció del filtre és el defecte. Inverteix-la.
- **Proposta 2 (Tractor Cognitiu que impose l'esquema):** no calia crear-lo, ja existia (`porta:frontmatter`). S'ha endurit la llei i s'ha trencat el pany: **G3**. La bona notícia és la mesura del §3: el que bloqueja la porta són els tags, no l'enduriment. El camí curt existeix i és de dues hores.
- **Proposta 3 (llei de neteja):** **la millor decisió de la nit**, i la mantinc sencera. Un sol pendent: la Llei de Destins de `core-identitat` continua sent una **quarta** política de neteja viva, i a més amb una ruta que ja no existeix (§4.3). Retira-la; no n'afegisques una cinquena.
- **Una cosa que el Pla no preveia i que ha passat:** esborrar la skill de la guàrdia (proposta implícita de Codex i meua) sense fusionar-ne el contingut ha deixat la regla del frontmatter sense casa **la mateixa nit** en què un frontmatter s'ha destruït. La lliçó no és «no esborres skills»: és **«fusiona abans d'esborrar, i executa el catàleg després»**.

### 7.2 Codex: on tenia raó i què queda obert

| Troballa de Codex | Estat ara | Verificació meua |
|---|---|---|
| `00_Bandeja_d_Entrada` vs disc en minúscules bloqueja la validació | **TANCADA** | `DESTINS_CANONICS.json:4` corregit; `cataleg` ja no es queixa de capitalització |
| «Trellat» activa la creació d'skills | **TANCADA** | claus `agent` i `trellat` fora de la ruta `skill` |
| Via de retorn al passat via UUID fix del Reflex | **TANCADA** | `.sdp-reflex/bootstrap/` inexistent |
| **El resolutor tria per `claus` i ignora `quan`** | **OBERTA** | `context_documental.mjs:53` intacte: `data.rutes.filter(row => row.claus.some(...))`. Llevar `agent`/`trellat` baixa el soroll, no la causa. `estudi_ia` encara té la clau `informe`; `prompt.local`, `local` |
| El contracte documental varia segons qui el llija | **PARCIAL** | Schema alineat en `required` i en 220 caràcters. Queden `eines_obligatories` (text usat com a llista) i les longituds de nom |
| Autoritats incompatibles; cap skill per damunt de qui governa | **OBERTA** | `core-identitat §Fonts d'autoritat` continua posant-se 1a i declarant la Wiki «consultiva» (§4.4) |
| Pedra Seca: taronja vs blau a `branding.md` | **OBERTA** | Sense canvis al diff |
| «Dormir» no acredita consolidació | **TANCADA** | `wiki-cicle-de-vida §6` reescrit amb l'Avaluador i la protecció d'informes pendents |

**On continue discrepant de Codex:**
1. **«Evitaria una fusió gegant».** Continue: el problema no és el nombre de skills sinó **quantes són `core: true`** (48 KB sempre al context). La mateixa nit ha demostrat el cost oposat, però: la fusió mal feta (esborrar sense absorbir) és pitjor que la duplicació. Ordre correcte: **primer absorbir, després esborrar, sempre regenerar.**
2. **«Retirar l'obligació d'escriure una regla després de qualsevol correcció».** No. És una ordre explícita del Mestre a `CLAUDE.md`. El que sí que cal és que siga **declarada i comprovable** (`APRENC → <skill>/<secció> | motiu | data` al LEDGER), que és el que demana la petorreta 2010.
3. **El seu «Cuestióname 1» (Wiki original o skills originals)** ja està decidit per esta petorreta: la Wiki és el cervell. El que falta no és la decisió, és que **`core-identitat` encara diga el contrari** i que el compilador encara no llisca `QUI_SOC`.

### 7.3 Per al torn de Codex: què refutar primer

- **G1** és la meua troballa més forta i la més fàcil de tombar: obri `arquitectura_la_forja.md` i confirma si la primera línia és `---` o `type: document`. Si és `---`, G1 cau sencera.
- **G2**: executa la meua aritmètica pel teu compte (19 exclosos de 89). Si comptes un nombre distint, digues quin i per què.
- **G5**: busca un consumidor de `.agents/GENOMA.md` que jo no haja trobat. Si existix, canvia tot el §3.G5.
- **G7**: mira si hi ha cap invocador d'`aplica` de Plaquetes fora del repositori (launchd, cron d'usuari). Jo només he mirat dins.
- I la pregunta que no he pogut contestar ningú dels dos: **com carrega Antigravity `.agents/skills/`?** Mentres no ho sapiem, la meitat dels tractors es dissenyen a fosques.

## 8. Preguntes obertes al Mestre (`requires_human_decision: true`)

1. **Les dues ADR:** les promocione a `status: canonic` perquè entren al cervell, o accepten que el cervell no conega la decisió que veta el PWA? *Assumpció per defecte: promocionar-les.*
2. **El Còrtex Global:** `.agents/GENOMA.md` ha de tindre un consumidor real (i llegir `QUI_SOC` en lloc d'`AGENTS`×2), o el retirem abans de commitejar 4.151 línies generades? *Assumpció per defecte: retirar-lo fins que hi haja consumidor.*
3. **La Regla Sagrada del Consell:** invertim la porta (prohibit enumerar en prosa, cens generat) tal com diu `consell.json`? Això fa passar la teua pròpia petorreta. *Assumpció per defecte: sí.*
4. **Tags:** accepten tancar l'enum (proposta de 12 al torn 1 §7), migrar en sec amb revisió humana i resegellar el pany? És l'únic que separa el projecte de la primera porta documental verda. *Assumpció per defecte: sí.*
5. **Antigravity:** llig de veritat `.agents/skills/` amb `core: true`, `.agents/rules/` i `.agents/hooks.json`? **Segueix sense resposta des del torn 1 i bloqueja T2, T3 i T7.**
6. **Plaquetes:** aturem el cron o li ensenyem a respectar `status: arxivat`? *Assumpció per defecte: aturar-lo fins que respecte l'estat.*

## 9. Límits d'este informe

- Les dues mesures noves (19 exclosos del Còrtex; 48 fallades de 143 amb l'esquema nou) són **simulacions pròpies** fetes amb la mateixa lògica del codi vigent, executades fora del repositori. **No són l'eixida de les portes**: `porta:frontmatter` no arriba a validar res per G3, i recompilar el Còrtex hauria significat escriure.
- No he executat la cadena sencera (`npm run porta`) ni `porta:reflex`: la primera arrossega deute previ de codi que no és l'encàrrec d'esta nit, i la segona escriu.
- No he rellegit la Wiki fitxer a fitxer: el torn 1 ja ho va fer i eixe inventari continua vigent llevat dels canvis que reporte al §2 i al §3.
- No he obert `90_arxiu_historic/` (prohibició de `QUI_SOC §6`).
- El 4/10 és judici professional, no telemetria.

**Ancoratge de Seguretat:** [[00_index_escriptori]]

Sóc de Poble!
