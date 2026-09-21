---
type: informe
status: esborrany
description: Auditoria de Claude sobre la Reunió davall l'Olivera, l'excés de confiança de MarIA, la memòria episòdica i el túnel Brain–Wiki. Primer torn de la reunió; Codex ha de llegir-lo i refutar-lo.
tags:
  - col·laboració
  - arquitectura
  - memòria
---
# Informe d'enllaç · Reunió davall l'Olivera (torn 1: Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-LOCAL-260921-OLIVERA-1 |
| Respon a | [[260921_0530_PROMPT_Reunio_Olivera]] |
| Torn | 1 de 2 (següent: Codex) |
| Creació | 26-09-21 05:55 |
| Agent redactor | Claude (Fable 5.1, app d'escriptori) |
| Aprovació humana | pendent |
| Efectes laterals | Este fitxer, una línia a `00_index_escriptori.md`, una línia al LEDGER, ESTAT. Cap canvi de codi. |

## Vincles (Ancoratge de Seguretat)

- [[00_INDEX_ESCRIPTORI]]
- [[skill-consell-i-colmena]]
- [[skill-documentacio-i-reflex]]
- [[skill-memoria-historica]]

## Lectures fetes abans d'escriure (rebut de reflex)

`.agents/protocolledge.json` · `02_SDP_PLANTILLA_PROMPT_IAS_LOCALS_v1.0.md` · `auditoria_canonica.md` · `skill-documentacio-i-reflex` · `skill-memoria-historica` · `BOOTSTRAP.md` · `00_BIOS_COGNITIU.md` · `BASELINE.md` · `.agents/hooks.json` · `.claude/settings.local.json` · `tooling/brain/somiador.mjs` · `matrix.mjs` · `despertar.mjs` · `tooling/wiki/schema.json` · `package.json` (scripts) · cua del LEDGER · `00_index_escriptori.md`.

---

## 0. Qualificació operativa

| | Nota | Motiu en una línia |
| --- | --- | --- |
| Capacitat actual | **4 / 10** | Les regles existeixen i són bones, però cap arnés les executa: tot depén que l'agent «recorde» llegir-les. |
| Amb les solucions d'este informe | **8 / 10** | Reflex forçat per hook fail-closed, dos documents d'identitat, ritual de son amb destil·lació i purga. |
| Sostre realista | 9 | El 10 exigiria que el Mestre no fóra mai el punt únic de fallada, i hui ho és per disseny (Lliçó 8: la semàntica és del carboni). |

Nota d'honestedat: `auditoria_canonica.md` prohibeix «puntuació inventada». Estes xifres són un judici qualitatiu demanat pel Mestre, no una mètrica calculada. Codex pot i ha de discutir-les.

---

## 1. Psicologia i UX: és viable la Reunió davall l'Olivera?

**Sí, i és la millor idea de col·laboració que hi ha al repositori.** Però funciona per raons humanes, no tècniques:

- **Externalitza la memòria de treball.** Una IA no té memòria entre sessions; un fitxer a l'Escriptori sí. La reunió converteix el «cervell ràpid» (context) en «cervell lent» (disc) en el moment exacte en què el primer s'apaga.
- **Crea un testimoni.** Quan Codex llig un informe amb autor, hora i lectures fetes, ja no pot al·lucinar «què va dir Claude». El document és l'acta.
- **Obliga a discrepar per escrit.** La regla «llig i opina abans de donar el teu» és el mecanisme de refutació adversarial que ja hem vist que talla un ~27% de falses troballes.

**El risc humà principal:** que el Mestre faça de missatger entre dos agents que no es veuen. Si cada torn exigeix que el Mestre copie, llance i explique, la reunió cansa més que ajuda. L'objectiu ha de ser que el Mestre només diga «Codex, torn 2» i tot l'altre siga automàtic.

---

## 2. És efectiu i suficient el model asíncron de fitxers? (pregunta 1)

**Efectiu: sí. Suficient: no.** Li falten tres peces:

1. **Un fitxer, no una carpeta.** Hui a l'Escriptori conviuen tres prompts d'esta matinada. La segona IA no sap quin és «l'informe de la primera» si no li ho diuen. Cal un nom determinista: mateix segell horari que el prompt, categoria `INFORME`, sufix d'agent.
2. **Un rebut de lectura.** L'informe ha de dir què s'ha llegit (com fa la secció «Lectures fetes» d'ací). Si no, la segona IA no pot saber si la primera va treballar de memòria.
3. **Un tancament de reunió.** Dos informes solts no són una decisió. Cal un tercer document curt (o una secció a l'Acta Marmota) on el Mestre ratifique què s'accepta i què es descarta. Sense això, la reunió deixa satèl·lits.

---

## 3. Perills cognitius i bucles (pregunta 2)

| Perill | Com es manifesta | Antídot |
| --- | --- | --- |
| **Herència d'al·lucinació** | Codex accepta una troballa falsa de Claude perquè «ve d'un company» | Regla dura: el segon torn ha de marcar cada troballa com CONFIRMADA / REFUTADA / NO VERIFICADA, amb evidència pròpia |
| **Pèrdua de l'arrel** | El torn 2 llig només l'informe i no el prompt ni les skills | L'informe d'enllaç és un índex, no un substitut: ha d'enllaçar el prompt i llistar les skills llegides |
| **Amuntegament** | L'Escriptori es converteix en 90_arxiu_historic amb un altre nom | Reunió = un prompt + N informes + un tancament, tots amb el mateix segell; el somiador els arxiva junts |
| **Deriva de format** | Cada agent inventa la seua plantilla d'informe | Una plantilla `plantilla_informe_enllac.md` al protocolledge amb clau `olivera` |
| **Bucle de cortesia** | Els dos agents es donen la raó per no crear conflicte | El torn 2 ha de tindre obligació de discrepar en almenys un punt o justificar per què no |
| **Concurrència** | Codex i Claude editen alhora (ja ha passat: memòria «arbre concurrent») | Fixar el tall (`git rev-parse HEAD`) al Registre de cada informe |

---

## 4. Estructura ideal de l'informe d'enllaç (pregunta 3)

Màxim 2.000 paraules. L'ordre importa: el que és car de verificar va al principi, el que és barat al final.

```markdown
---
type: informe
status: esborrany
description: <una frase: què s'ha auditat i quin és el veredicte>
tags: [olivera, <tema>]
---
# Informe d'enllaç · <tema> (torn N: <agent>)

## Registre
| Respon a | [[<prompt amb el mateix segell>]] |
| Torn | N de M (següent: <agent>) |
| Tall git | <sha curt> |
| Lectures fetes | <llista de skills i plantilles llegides, no resumides> |
| Efectes laterals | <fitxers tocats o "cap"> |

## 0. Veredicte en 5 línies
## 1. Troballes (taula: fitxer · evidència reproduïble · severitat · font de veritat · proposta · requires_human_decision)
## 2. Discrepàncies amb el torn anterior (només a partir del torn 2)
## 3. Què NO he verificat (honestedat de cobertura)
## 4. Preguntes obertes per al Mestre (màxim 3)
## Ancoratge: [[00_INDEX_ESCRIPTORI]]
```

Justificació de cada camp:
- **Tall git**: sense això les cites deixen de ser reproduïbles a l'hora següent.
- **Lectures fetes**: és el rebut que cura l'excés de confiança. Si no hi apareix la skill, el torn 2 ha de sospitar.
- **Què no he verificat**: evita que el torn 2 assumisca cobertura total.
- **Taula de troballes** amb els sis camps que ja exigeix `auditoria_canonica.md`. No inventem un contracte nou.

---

## 5. L'error de MarIA i la cadena irrompible (pregunta 4)

### Diagnòstic: no és un error de caràcter, és un error d'arnés

La pregunta del prompt («per què un agent que sap que les regles viuen al disc tria al·lucinar-les?») té una resposta mecànica, no psicològica: **perquè res l'obliga**. He comprovat la cadena que hauria d'obligar-lo:

| Peça | Estat | Evidència |
| --- | --- | --- |
| `.agents/hooks.json` declara `preflight-matrix` i `trellat-gate` | **Mort** | Cap arnés llig este fitxer. Claude Code llig `.claude/settings.json`, que no existeix; `settings.local.json` només té permisos. Els matchers (`write_to_file`, `replace_file_content`) són noms d'eines d'Antigravity, no de Claude Code. |
| `tooling/brain/matrix.mjs` (router de plantilles) | **Funciona però orfe** | No hi ha cap script `npm` ni hook que el cride. Només `despertar` està a `package.json`. |
| REGLA 0 d'`AGENTS.md` | **Prosa** | Es carrega via `@.agents/AGENTS.md` al CLAUDE.md, però una regla llegida no és una regla executada. |
| `skill-documentacio-i-reflex` | **Prosa** | Diu «TENS TOTALMENT PROHIBIT», però una skill és pull: només actua si l'agent decideix obrir-la. |

Conclusió: MarIA va fer exactament el que fa qualsevol agent amb un context de 200k tokens ple: va optimitzar per velocitat perquè el cost de saltar-se la lectura era zero. L'excés de confiança és el símptoma; la causa és que **la lectura és opcional en temps d'execució**.

### La cadena proposada (fail-closed, tres anelles)

1. **Anella 1 · Rebut obligatori al frontmatter.** Tot document de l'Escriptori de categoria `PROMPT` o `INFORME` ha de dur un camp `reflex` amb el hash curt de la plantilla i de les skills llegides. Exemple: `reflex: {plantilla: 02_SDP..._v1.0@a3f9, skills: [documentacio-i-reflex@71c2]}`. El hash es calcula amb `matrix.mjs`. Sense rebut, el document és invàlid.
2. **Anella 2 · Hook real.** Un `PreToolUse` a `.claude/settings.json` (i l'equivalent a la configuració de Codex/Antigravity) sobre `Write|Edit` que, quan la ruta cau a `04_escriptori/*_PROMPT_*|*_INFORME_*`, executa `node tooling/gates/porta-reflex.mjs <ruta>` i **bloqueja** si el rebut falta o el hash no coincideix amb la plantilla viva. Fail-closed: si el gate no pot executar-se, l'escriptura no passa.
3. **Anella 3 · Porta de tancament.** `tancament.mjs` afig la mateixa comprovació sobre tot l'Escriptori, per si algun agent escriu per una via que no passa pel hook (shell, `cat >`).

Efecte lateral positiu: el rebut fa que **la segona IA de la reunió sàpiga exactament quina versió de les regles va llegir la primera**. Si la plantilla ha canviat entre torns, es veu al hash.

Pel que fa al Reflex de Correcció del CLAUDE.md: la lliçó positiva a anotar a `skill-documentacio-i-reflex` és «Abans d'escriure a l'Escriptori, obri la plantilla del protocolledge i deixa'n el rebut al frontmatter». No l'anote jo perquè el prompt em prohibeix modificar skills; ho deixe com a proposta.

---

## 6. La Memòria Episòdica: el ritual de dormir (pregunta 5)

### Per què hi ha 2 GB

`tooling/brain/somiador.mjs` existeix i és el ritual de son actual. Fa exactament una cosa: **mou tot l'Escriptori a `90_arxiu_historic/AAMMDD_Sessio_Tancada/` sense llegir res**. Després executa el llaurador d'índexs i el teixidor. No destil·la, no purga, no diferencia un bundle de 3 MB d'una acta de 2 KB. És un «dormir sense somiar»: la memòria a curt termini s'aboca sencera a la llarga. D'ací els gigues.

### Algoritme de consolidació (quatre fases, com el son real)

**Fase 1 · Inventari (ràpid, sense LLM).**
Llista l'Escriptori i agrupa per segell horari (`AAMMDD_HHMM`). Cada grup és un «episodi»: prompt + bundle + informes + acta. Classifica cada fitxer per mida i categoria.

**Fase 2 · Destil·lació (amb LLM, un episodi cada vegada).**
Per a cada episodi, llig només els fitxers de categoria `INFORME`, `ACTA` i `ESTUDI` (mai els `BUNDLE`) i extrau tres coses en un fitxer `AAMMDD_HHMM_DESTIL_<tema>.md` de màxim 40 línies:
- Decisions preses (amb qui les va ratificar).
- Lliçons que semblen estructurals (candidates a skill).
- Errors repetits respecte a episodis anteriors (creuament amb els DESTIL previs).

**Fase 3 · Proposta de consolidació (sense escriure a skills).**
Genera `AAMMDD_HHMM_PROPOSTA_llicons.md` amb, per a cada lliçó candidata: skill destí, text en forma positiva, evidència (episodi d'origen). Marca `requires_human_decision: true`. El Mestre ratifica amb una paraula i llavors sí que s'escriu a `## Lliçons del Mestre`. Açò respecta la Lliçó 8 (la màquina no decideix semàntica) i evita que la IA s'autoescriga regles al·lucinades.

**Fase 4 · Purga física (determinista).**
- `BUNDLE` de qualsevol mida i qualsevol fitxer > 500 KB → `_arxiu_wiki_de_poble/<any>/<episodi>/` (fora del repo, com ja diu `skill-memoria-historica`).
- `PROMPT` ja respost i amb DESTIL generat → mateix destí extern.
- Es queden al repo: `ACTA`, `DESTIL`, `PROPOSTA` no ratificada, i un `00_INDEX_ARXIU` amb una línia per episodi apuntant a la ruta externa.
- El somiador no esborra mai: mou i deixa rastre al LEDGER (Llei de la Immutabilitat).

**Quan es dispara.** Sense dependre del Mestre: (a) en `tancament.mjs` si l'Escriptori té més de 20 fitxers solts, (b) per cron setmanal ja existent (`.immunitari/cron.out` mostra que hi ha un cron actiu), i (c) manualment amb `npm run dormir`. Les fases 1, 2 i 4 són autònomes; la 3 sempre espera ratificació.

---

## 7. El túnel entre el Brain i la Wiki (pregunta 6)

### Diagnòstic: el túnel ja existeix, però és estret i porta per un altre lloc

L'únic mecanisme *push* real (que entra al context sense que l'agent decidisca res) és el `CLAUDE.md` amb els seus `@imports`. Hui carrega `AGENTS.md` i `00_INDEX_SKILLS.md`. Tot l'altre (BOOTSTRAP, BIOS, BASELINE, ESTAT, identitat de MarIA, LEDGER, acta marmota) és *pull*. Mesurat:

| Document | Mida | Es carrega sol? |
| --- | --- | --- |
| AGENTS.md | 7,2 KB | Sí |
| 00_INDEX_SKILLS.md | 2,5 KB | Sí |
| BOOTSTRAP.md | 1,8 KB | No |
| 00_BIOS_COGNITIU.md | 0,7 KB | No |
| BASELINE.md | 0,6 KB | No |
| skill-iaia-identitat | 9,8 KB | No |
| ESTAT.md | 23,4 KB | No |
| Última Acta Marmota | variable | No (només per REGLA 14, que és prosa) |

Resultat: la IA arranca sabent les lleis però **no sabent qui és ni on estava**. Per això la Wiki pareix un aparador.

### Proposta: dos documents, un fix i un generat

1. **`QUI_SOC.md`** (≤ 8 KB, canvia poques vegades a l'any). Fusiona AGENTS + BOOTSTRAP + BIOS + BASELINE + el nucli d'identitat de MarIA (veu, to, missió; no la biografia sencera). És la constitució i la personalitat en un sol fitxer. Qualsevol IA que el llija pot assumir MarIA.
2. **`ON_ESTIC.md`** (≤ 6 KB, **generat** per `despertar.mjs` a l'inici de cada sessió). Conté: tall git, branca, resum de l'últim ESTAT (no els 23 KB), briefing de l'última Acta Marmota, llista de l'Escriptori amb una línia per fitxer, portes en roig. Mai s'edita a mà.

`CLAUDE.md` passa a ser tres línies: `@QUI_SOC.md`, `@ON_ESTIC.md`, i el Reflex de Correcció. Les skills continuen sent *pull* (és correcte: són procediments, no identitat), però l'índex de skills va dins de `QUI_SOC.md`.

Perquè `ON_ESTIC.md` estiga fresc sense que l'agent ho demane, cal un hook `SessionStart` a `.claude/settings.json` que execute `npm run despertar`. Este és el «túnel»: un script que escriu el disc just abans que el context s'òbriga.

Advertència detectada pel camí: la Wiki té **dos esquemes de frontmatter en competència**. `auditoria_canonica.md` exigeix `estat`, `tipus`, `description`; `tooling/wiki/schema.json` i totes les plantilles usen `type`, `status`, `description`. Este mateix informe és «invàlid» segons un dels dos. Cal decidir-ne un i propagar-lo (`skill-propagar-veritat`).

---

## 8. Tallar el deute d'arrel (pregunta 7)

Cinc regles d'arquitectura, per orde d'impacte:

1. **Cap porta verda sense prova de fallada.** Ja hem trobat quatre controls que ixen `exit 0` sense comprovar res. Cada porta nova ha de tindre un test que la faça fallar a propòsit (com `tractor-psicopatia.test.mjs`). Una porta sense test negatiu no s'accepta.
2. **Una sola font per a cada veritat.** Dos esquemes de frontmatter, dos noms per a la mateixa carpeta (`00_bandeja_d_entrada` / `00_Bandeja_d_Entrada`, el somiador ha de comprovar-ne els dos), regles duplicades entre AGENTS, BOOTSTRAP i skills. Cada duplicat és un lloc on la veritat pot divergir.
3. **Existir no és ser cridat.** El propi `despertar.mjs` ho documenta: «Zero cridadors». Tot script de `tooling/` ha d'estar a `package.json` o en un hook, o va a quarantena.
4. **Regles com a codi, no com a prosa amb majúscules.** «TOTALMENT PROHIBIT» no ha evitat l'error d'esta matinada. Un hook de 20 línies sí que l'hauria evitat.
5. **Refutació en dues fases sempre.** Cap troballa d'agent entra al pla d'implementació sense un segon agent que haja intentat tombar-la. La Reunió davall l'Olivera és exactament este mecanisme; cal fer-lo obligatori, no opcional.

---

## 9. L'ecosistema multi-carpeta (pregunta 8)

Mesurat: `_arxiu_wiki_de_poble` 2,1 GB · `_gestoria_de_poble` 293 MB · `_cultura_de_poble` 20 KB · `_comunicacio_de_poble` 4 KB.

**Principi: el Brain tècnic no llig veïns, llig portals.**

- Cada carpeta germana ha de tindre un únic `00_PORTAL.md` de màxim 2 KB: què hi ha, per a què serveix, quan cal entrar-hi, i quina IA o persona n'és responsable. És l'únic fitxer d'eixa carpeta que el repo tècnic pot referenciar.
- `socdepoble.org` guarda un `VEINS.md` amb la llista de portals i la regla: «entra només si la tasca ho nomena explícitament». Mai s'indexen per RAG ni entren en cap bundle.
- Quan una tasca tècnica necessite dades de gestoria (per exemple, un model de dades per a documents municipals), el flux és: llegir el portal, obrir només el fitxer que el portal assenyala, i deixar constància al LEDGER de quina carpeta externa s'ha consultat. Així el context queda net i traçable.
- L'arxiu extern (`_arxiu_wiki_de_poble`) és de sola escriptura per al somiador i de sola lectura per a la fase 2 de destil·lació. Cap altre procés hi entra.

Efecte sobre el Brain: `QUI_SOC.md` no canvia. `ON_ESTIC.md` només afig una línia si la sessió anterior va tocar un veí.

---

## 10. Taula de troballes (contracte d'`auditoria_canonica.md`)

| # | Fitxer / abast | Evidència | Severitat | Font de veritat en conflicte | Proposta | Decisió humana |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `.agents/hooks.json` | Cap arnés el llig; `.claude/settings.json` no existeix; matchers d'un altre IDE | Crítica | REGLA 0 d'AGENTS.md | Hook real a `.claude/settings.json` + equivalent Codex, fail-closed | Sí (quin arnés és el canònic) |
| T2 | `tooling/brain/matrix.mjs` | Absent de `package.json` i de hooks | Alta | skill-documentacio-i-reflex §1 | Cridar-lo des del hook de T1 i generar el rebut `reflex` | No |
| T3 | `tooling/brain/somiador.mjs` | Mou tot l'Escriptori a l'històric sense destil·lar ni purgar | Alta | skill-memoria-historica §4 (500 KB, arxiu extern) | Algoritme de quatre fases (§6) | Sí (ratificació de lliçons) |
| T4 | `auditoria_canonica.md` vs `tooling/wiki/schema.json` | `estat/tipus` vs `type/status` | Alta | skill-guardia-frontmatter | Triar un esquema i propagar | Sí |
| T5 | `CLAUDE.md` + `.agents/*` | Identitat i estat en 8 fitxers, només 2 es carreguen | Mitjana | REGLA 14, BOOTSTRAP §2 | `QUI_SOC.md` + `ON_ESTIC.md` generat per `despertar` | Sí |
| T6 | `260921_0530_PROMPT_Reunio_Olivera.md` | Títol amb majúscules; Registre diu 05:20 i el nom 05:30 | Baixa | AGENTS.md §2 (minúscules) | Corregir en el proper reflex; afegir a la porta de nomenclatura | No |
| T7 | `00_index_escriptori.md` | Enllaça dos fitxers ja esborrats (`0155_pla`, `0215_PROMPT`) i no els tres prompts vius | Baixa | Lliçó 4 (zero illes) | Que el somiador i el llaurador regeneren la secció «Documents Actius» | No |

## 11. Què no he verificat

- No he executat cap porta ni test (contenció). Les afirmacions sobre `exit 0` inert vénen de memòria de sessions anteriors, no d'esta.
- No he llegit `skill-iaia-identitat` sencera ni les 5 actes marmota d'esta setmana.
- No he comprovat com Codex/Antigravity carrega els seus hooks; T1 assumeix que tampoc llig `.agents/hooks.json`.

## 12. Per a Codex (torn 2)

1. Refuta T1: busca qualsevol procés que llija `.agents/hooks.json`. Si en trobes un, la nota del §0 puja.
2. Discuteix el §7: dos documents és massa poc o massa? Tu que treballes des d'un altre IDE, què necessites per assumir MarIA?
3. Proposa la implementació concreta de `porta-reflex.mjs` (§5, anella 2). Jo he donat el contracte, no el codi.
4. Digues en què no estàs d'acord. Si estàs d'acord en tot, justifica-ho.

---
**Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]
