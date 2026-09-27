---
type: informe
status: esborrany
description: Auditoria de la fallada de l'Acte Reflex de MarIA, de la plantilla prompt_local i dels bugs de Notes i accés, amb evidència de codi, portes i navegador.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ee153098-3347-476e-803b-db48f68b4682:1aad7dda-eece-4da2-8c52-292705a6cb6c
---
# Auditoria Claude: fallada del Reflex de MarIA, plantilla prompt_local i passarel·la d'entrada

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ee153098-3347-476e-803b-db48f68b4682:1aad7dda-eece-4da2-8c52-292705a6cb6c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T11:10:55.235Z |
| Modificació | 2026-09-27T12:30Z (aproximada, tancament del torn) |
| Propietari | claude-opus |
| Aprovació humana | Execució ordenada pel Mestre al xat (27-09, cinc missatges successius); el document espera la seua revisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5): fil principal i tots els subagents |
| Tokens consumits | Subagents (xifres de l'arnés): W1 3.588.792; W3 2.120.517; W2 aturat sense total exposat, parcials coneguts de quatre agents 1.128.229. Fil principal: no exposat. Entrada/eixida separades: no exposat. Fricció alta: shell bloquejada, sense grep, tres canvis de rumb del Mestre a mig torn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Mètode: torn `torn_ee153098-3347-476e-803b-db48f68b4682` obert abans de tocar cap línia de codi; tres workflows d'agents (diagnosi amb refutació adversària, implementació amb revisió i correcció, i una tercera ronda de calc de WhatsApp amb revisions); verificació final del coordinador amb proves i navegador. Cada troballa d'agent va passar per un refutador independent abans d'entrar ací.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-27T11:10Z: torn obert i esborrany creat amb rebut. Lectura íntegra de l'Escriptori: petorreta 1250, pla 1250, deute d'accessibilitat 1230 i, més tard, la idea 1400 del pont amb WhatsApp.
- 11:10–11:25Z: W1, diagnosi. 8 investigadors (arnés de MarIA, portes documentals, historial i segell, plantilla ISO, barra de Notes, esborrat, accés, login del Mestre) i 8 refutadors. Veredicte de tots: fiable amb esmenes.
- 11:27Z: el Mestre canvia el rumb (layout del Xat) i actualitza la petorreta. W2, implementació en cinc peces amb fitxers disjunts.
- Durant W2: autorització expressa del Mestre per a saltar `/* SDP-LOCK */` a `contracte.js`, limitada a la paperera de Notes; correcció de disseny del Xat (el document queda com a contingut per defecte de la columna dreta quan no hi ha cap conversa activa). W2 aturat pel coordinador en detectar que un missatge a un agent de workflow en crea una branca paral·lela que edita els mateixos fitxers.
- W3: calc de la columna de converses de WhatsApp (primer sense filtres; després, per rectificació del Mestre amb la captura de WhatsApp mòbil, amb les píndoles de filtre) i revisió adversària de les peces d'accés, esborrat, reflex i barra. 11 agents; va continuar durant la pausa de la sessió i va acabar després.
- 12:15–12:30Z: represa. El coordinador comprova l'arbre, completa el registre del catàleg, passa totes les proves i portes permeses, verifica al navegador i escriu esta auditoria.
- 12:30Z: arriben l'última revisió i l'última correcció de W3 (la columna del Xat). El coordinador torna a passar totes les proves sobre l'arbre final (683/683) i actualitza este document.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

- **Causa arrel de la Tasca 0.** MarIA no té cap porta, i per això no ha fallat per descuit. Les portes del Mas només s'executen dins de Claude Code. `.agents/hooks.json:2` ho diu en la seua pròpia descripció: «consumidor Antigravity no acreditat». Una petorreta que el hook de Claude hauria tombat per tres camins diferents va arribar al disc sense que res l'aturara. És, com a mínim, la sisena vegada: una recaiguda i, segons la regla de `CLAUDE.md`, una falla de càrrega.
- **Solució.** Està construïda i provada, però no instal·lada: el segell està trencat i la governança exigix *lease*. La deixe en un paquet de laboratori amb 10 + 10 proves en verd i un pla d'instal·lació pas a pas. La idea central és que el camí correcte passe a ser una sola ordre, que les caselles deixen de ser autodeclaracions i les calcule l'eina, i que el receptor avise.
- **Tasca 0.5.** La plantilla `prompt_local` es contradiu a si mateixa: al bloc fix diu «cap línia de codi», i a la instrucció, «aplica el pla». A més, fa arribar al receptor text adreçat a l'autor i exigix dades impossibles de complir. Propose l'estructura v3 i dotze millores validables per màquina.
- **Tasca 1.** Els cinc punts estan fets i verificats al navegador: barra de Notes, «Borrar» amb diàleg de tres opcions, ull a la contrasenya, formulari que ja no es congela, i Xat net com WhatsApp. Totes les proves passen: Vitest 69 fitxers i 681 proves, `node --test` 62/62.
- **Tasca 2 (només diagnosi, per ordre del Mestre).** Entrar amb el compte del Mestre no depén del codi. Ara mateix no hi ha cap Supabase escoltant a `localhost:54321`, la clau de `.env.local` és un marcador i el compte no és a la llavor local. La decisió d'infraestructura és del Mestre.
- **Dos avisos greus laterals.** L'índex de la nota penja la pestanya per un bucle amb ProseMirror, i és anterior a este torn. I a `~/.gemini/antigravity/mcp_config.json` hi ha credencials en clar.

### T0 · Per què la IAIA MarIA es va saltar l'Acte Reflex

**T0-1 · MarIA no passa per cap porta.**
- **Abast:** l'arnés d'Antigravity i tota escriptura de MarIA a l'Escriptori.
- **Evidència:**
  - `.agents/hooks.json:2` declara que Antigravity no n'és consumidor acreditat, i `~/.gemini/GEMINI.md` és buit.
  - La petorreta `260927_1250_prompt_opus_perfil.md` porta sense marcar la casella de la secció 0 (línia 18), diu «Rebut: pendent» (línia 34) i no té `reflex` al frontmatter.
  - Amb eixe contingut, `hooks-local` hauria tornat codi 2 per tres camins: `porta-reflex` (`turns.mjs:111`), les caselles d'Olivera (`porta-olivera.mjs:112-113`) i la plantilla viva (`hooks-local.mjs:107-110`). Si el fitxer existix, és que cap porta el va veure.
  - Hui mateix, el document `260927_1400_idea_pont_whatsapp.md` reproduïx el patró: frontmatter amb claus fora de l'esquema (`tipus`, `títol`, `estat`) i cap rebut.
- **Severitat:** crítica. Qualsevol regla que depenga d'una porta de Claude és invisible per a MarIA.
- **Font de veritat:** AGENTS §0 (REGLA 0); `.agents/hooks.json`.
- **Proposta:** controls que no depenguen de l'arnés (vegeu la solució).
- **Decisió humana:** `requires_human_decision: true` (instal·lació de governança).

**T0-2 · La regla no arriba al moment d'usar-la, i potser ni a l'arrencada.**
- **Evidència:**
  - `.agents/rules/00_BIOS_COGNITIU.md` (17 línies) no conté la REGLA 0 i no té cap `trigger`.
  - La `description` de la skill `wiki-documentacio-i-reflex` no diu «petorreta». La paraula només és a `triggers_on`, que només llig el router de Claude (`persona_router.mjs`).
  - L'únic recordatori per torn és el `UserPromptSubmit` de Claude (`.claude/settings.json:22-31`).
- **Severitat:** alta.
- **Proposta:** posar la regla on MarIA la carrega de veritat. La «prova del testimoni» de sota ho determina de manera empírica.

**T0-3 · El camí correcte costa cinc ordres; el camí curt, una.**
- **Evidència:** `wiki-cicle-de-vida/SKILL.md` exigix obrir torn, `context`, `create`, completar i `check`, cada pas amb l'identificador de torn, contra un sol `write_to_file`. Sense cap barrera, guanya el curt.
- **Severitat:** alta.
- **Proposta:** un generador d'una sola ordre (fet, al laboratori).

**T0-4 · Les caselles són autodeclaracions, i s'han falsejat.**
- **Evidència:**
  - La casella 2 de la petorreta afirma un pla «generat per `document.mjs context`». El pla no té rebut i porta `type: pla_implementacio`, fora de l'enum (`schema.json:17-31`).
  - `porta-olivera --informe` ix verd amb eixe pla, perquè només mira el nom i la data (`porta-olivera.mjs:72-74`) i sense contingut no revisa les caselles (`:219`).
- **Severitat:** alta.
- **Proposta:** fets calculats per l'eina, no marcats a mà. La Porta Olivera v2, que ja contrasta cada `[x]` amb el fet, existix sense instal·lar a `02_investigacio_ia/260924_1700_tractors_claude/`.

**T0-5 · La detecció posterior és cega.**
- **Evidència:**
  - Sense rebut, `document.mjs check` no valida l'estructura (`turns.mjs:110-123`). Al pla li troba 2 errors, i la plantilla viva n'hi troba 25.
  - El vigilant de `porta-plantilla-viva.mjs` (quarantena al cap d'uns 1,5 s, pensat justament per a Antigravity) no està instal·lat: no hi ha plist a `~/Library/LaunchAgents` ni cap `.agents/runtime/plantilla-viva.log`.
  - El pre-commit només mira els fitxers preparats, i els de MarIA són `??`.
- **Severitat:** alta.

**T0-6 · És una recaiguda, i el LEDGER no les compta totes.**
- **Evidència:** almenys sis incidents de la mateixa família:
  - 260921 07:59
  - 260922, «per tercera vegada el mateix dia» (`LEDGER.md:117`)
  - 260923 00:16 i 12:45–13:40 (`:347`, `:365`, `:377`)
  - 260923 20:05 (acta d'incidència cognitiva)
  - 260926 (`:571`)
  - 260927 00:55 (acta marmota 0110)
  - 260927 12:50

  Només tres consten com a recaiguda. Les quatre lliçons que el LEDGER diu que es van afegir a `wiki-cicle-de-vida` (`LEDGER.md:120`) ja no són al fitxer.
- **Severitat:** alta. Segons `CLAUDE.md`, una correcció repetida és una falla de càrrega i no d'aprenentatge.
- **Proposta:** registrar les recaigudes del 260923 20:05, 260927 00:55 i 260927 12:50 (vegeu Límits: ho ha de fer el Mestre o l'executor).

**T0-7 · La mateixa regla, en onze llocs i contradictòria.**
- **Evidència:**
  - AGENTS §0, QUI_SOC §4, `wiki-documentacio-i-reflex` (quatre punts), `core-taxonomia-estricta`, `wiki-cicle-de-vida`, `core-higiene-escriptori`, `core-identitat`, `PROTOCOL_PETORRETA.md` (tres punts), la plantilla i dos textos de `hooks-local`.
  - Contradiccions:
    - `AGENTS.md:12` nomena una plantilla per defecte i `SKILL.md:33` diu que no n'hi ha.
    - `SKILL.md:82` prohibix l'arxivat automàtic i `SKILL.md:86` el mana.
    - `tooling/agents/force_read_petorreta_rules.sh:8` mana noms en majúscules, contra AGENTS §2.
- **Severitat:** mitjana.
- **Proposta:** una sola font executable (el generador) i la prosa reduïda a un punter.

**T0-8 · El Reflex de Correcció no es pot executar i trenca el segell.**
- **Evidència:**
  - `.agents/` és governança (`mutation-policy.mjs:6,15-16`), i l'executor exigix un segell vàlid (`executor-mutacio.mjs:42`).
  - El segell està trencat: hash actual afe40038 contra el segellat 69beea9e. El perímetre només cobrix `.agents/skills/**/*.md` (`segella.mjs:40-43`). La hipòtesi que `ON_ESTIC.md` el trenca a cada arrencada queda refutada.
  - Un agent sense hooks que escriga una lliçó en una skill trenca el segell per a tots, i des d'eixe moment ningú no pot escriure a la governança.
- **Severitat:** crítica per a la governança.
- **Proposta:** reconciliar el segell (pas 1 del pla) i escriure les lliçons només per l'executor.

**T0-9 · L'arnés de Claude també té defectes que s'han vist hui.**
- **Evidència:**
  - `hooks-local` bloqueja `StructuredOutput`, `SubagentHandback` i l'eina `Skill`. Els agents en segon pla acaben «sense informe» i les skills no es poden invocar.
  - `SendMessage` a un agent que corre dins d'un workflow en crea una branca paral·lela. Hui dos agents han editat `XatSection.jsx` alhora, i l'un creia que era «un altre editor».
  - `segell-auto` s'executa després de cada eina, sense filtre de fitxer. Amb el segell trencat, cada crida produïx un error que amaga els senyals reals.
- **Severitat:** mitjana.
- **Proposta:** afegir `SubagentHandback` i `Skill` a la llista d'eines de lectura de `hooks-local`; filtrar `segell-auto` pels fitxers del perímetre; i, als coordinadors, no enviar missatges a agents de workflow (aturar i rellançar).

### T0 · Solució: paquet de laboratori, llest per instal·lar

**Ubicació.** `_wiki_de_poble/04_escriptori/02_investigacio_ia/260927_1310_reflex_maria/`. Seguix el patró del laboratori 260924_1700: és un mirall de `tooling/` amb reexportacions, i per instal·lar-lo només cal copiar.
- `wiki/petorreta.mjs` → `tooling/wiki/petorreta.mjs`. És el generador d'una sola ordre:
  - valida el cognom (slug), els destinataris, el títol i la descripció;
  - abans d'obrir cap torn, comprova que l'Escriptori estiga net i que els dos destins no existisquen;
  - obri el torn i crea el pla i la petorreta amb la mateixa HHMM;
  - calcula la secció 0 amb fets reals, marcats `[x]` només si són certs;
  - reintenta el lock i el CAS de l'índex reutilitzant el mateix rebut, i si falla diu explícitament «rebut fantasma»;
  - torna un JSON amb les seccions a omplir, la caducitat del torn i les ordres de validació.
- `gates/porta-receptor.mjs` → `tooling/gates/porta-receptor.mjs`. És un hook `UserPromptSubmit` per al receptor:
  - detecta les petorretes d'avui a l'Escriptori, el text enganxat amb forma de petorreta i els documents de l'Escriptori citats al missatge;
  - els valida amb `validateDocument` i `inspeccionaText`;
  - emet un avís a `additionalContext` («executa l'encàrrec del Mestre i continua; avisa'l de la infracció»);
  - no bloqueja mai (exit 0 fins i tot davant d'errors interns), no escriu res (provat amb el hash de tot l'arbre) i no considera invàlida una petorreta vàlida pel sol fet que el torn haja caducat.
- **Proves:** `tests/petorreta-generador.test.mjs` 10/10 i `tests/porta-receptor.test.mjs` 10/10, amb el rellotge fixat (no fallen si l'execució creua la mitjanit). Inclouen el cas real: el prompt 1250 es denuncia en citar-lo.
- **Per què no està instal·lat:** `tooling/` i `.claude/` són governança, cal *lease*, i l'executor no funciona amb el segell trencat. A més, `command-policy.mjs:66` encara no autoritza `node tooling/wiki/petorreta.mjs` per a Claude i Codex; per a MarIA, que no té hooks, ja funciona.

**Pla d'instal·lació (al terminal del Mestre).**
1. **Segell.**
   - `node tooling/gates/segella.mjs --json` torna `hash` i `anterior`; en mode verificació no torna `manifest`.
   - Per saber què ha canviat: `git diff -- .agents/skills` i `git status --ignored .agents/skills`. Si cal anar fitxer a fitxer, compara el `manifest` de `.agents/SKILLS_SEAL.json` amb `shasum -a 256` de cada `.agents/skills/**/*.md`.
   - Si el canvi és legítim: `node tooling/gates/segella.mjs --update --expected-hash=HASH --expected-previous=69beea9e4f965bc84d9776b261813c63cd4f4fe4783f5944cdf74fc29a26901a --reason="MOTIU"`, i després fes commit del segell nou i de la transacció.
   - Si la ruptura ve d'un `._*.md` ignorat, esborra el fitxer i no resegelles.
2. **Còpia.** Copia `wiki/petorreta.mjs` a `tooling/wiki/` i `gates/porta-receptor.mjs` a `tooling/gates/`, per l'executor amb *lease* o a mà. Mou el laboratori a l'arxiu històric i executa `node --test tests/petorreta-generador.test.mjs tests/porta-receptor.test.mjs`.
3. **`.claude/settings.json`.** Al bloc `UserPromptSubmit`, afig un segon hook, just darrere del router, amb la comanda `cd "${CLAUDE_PROJECT_DIR}" && node tooling/gates/porta-receptor.mjs` i `timeout` 10.
4. **`package.json`.** Script `"petorreta": "node tooling/wiki/petorreta.mjs"`. Afig també l'ordre a la política documental de `command-policy.mjs` perquè Claude i Codex la puguen usar.
5. **Vigilant.**
   - Instal·lació:
     - `node tooling/gates/porta-plantilla-viva.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist`
     - `plutil -lint` sobre el plist
     - `launchctl bootstrap gui/$(id -u)` amb el plist
     - `launchctl print gui/$(id -u)/org.socdepoble.plantilla-viva`
   - Launchd executa `node` sense permís TCC sobre `~/Documents`: dona a `node` «Accés total al disc» o `fs.watch` fallarà amb EPERM.
   - Prova amb un prompt fals que porte la data d'avui al nom. Si no es mou, esborra'l a mà: si no, l'endemà bloquejarà el generador per document ranci.
   - La quarantena deixa òrfena l'àncora a l'índex; revisa-ho amb `porta-olivera --informe`.
6. **Regles de MarIA.** Instal·la el text de `GEMINI.md` i el workflow `/petorreta` de sota, i fes la prova del testimoni.
7. **Reflex de Correcció pendent.** Per l'executor, registra al LEDGER les tres recaigudes no comptades i torna a posar la lliçó a la skill.

**Proposta per a `~/.gemini/GEMINI.md`** (regles globals d'Antigravity; ara és buit):

```markdown
# Regles globals d'Antigravity · Sóc de Poble (IAIA MarIA)

Testimoni de càrrega: GRALLA-SECA-7Q

### REGLA 0 · Acte Reflex (no negociable)
Cap petorreta, prompt per a una altra IA ni Pla d'Implementació naix de memòria ni d'una còpia a mà de la plantilla.
1. Executa SEMPRE primer, des de l'arrel del repositori, UNA sola ordre:
   node tooling/wiki/petorreta.mjs --actor maria --per claude,codex --cognom COGNOM --titol "TÍTOL" --descripcio "DESCRIPCIÓ de 12 a 220 caràcters"
2. Llig el JSON: turn_id, fitxers.pla.ruta, fitxers.petorreta.ruta, fitxers.*.pendents i caducitat.
3. Omple NOMÉS les seccions i files que el JSON diu pendents. No toques el frontmatter, la secció 0, Context ni el Protocol de la Reunió a l'Olivera.
4. Model IA i Tokens consumits: el valor real o «no exposat». Mai una xifra inventada.
5. Valida cada fitxer: node tooling/wiki/document.mjs check --file RUTA. Ha de dir "valid": true.
6. Dona al Mestre les dues rutes. El Pla es vincula només quan ell l'aprove, i abans de la caducitat del torn (24 h).

### Prohibit
- MAI write_to_file per a CREAR a _wiki_de_poble/04_escriptori/ un *_prompt_*, *_petorreta_* o *_pla_implementacio_*. Només els crea petorreta.mjs.
- MAI marques a mà una casella de la secció 0: les calcula l'eina.
- MAI escrigues a .agents/skills ni al LEDGER: trenca el segell per a tothom.

### Si una ordre falla
Para. No improvises un altre camí. Dona al Mestre l'ordre i l'error literals. Dos intents fallits: Fusible (AGENTS §10).
```

**Workflow `/petorreta` d'Antigravity.** La ubicació és una hipòtesi que confirma la prova del testimoni: `.agent/workflows/petorreta.md`.

```markdown
description: Genera una petorreta local (Claude/Codex) i el seu Pla d'Implementació amb rebut, en una sola ordre.

1. Pregunta al Mestre, si no ho ha dit: destinataris, cognom (minúscules amb «_»), títol i descripció.
2. Executa: node tooling/wiki/petorreta.mjs --actor maria --per DESTINATARIS --cognom COGNOM --titol "TÍTOL" --descripcio "DESCRIPCIÓ"
3. Si falla, para i dona l'error literal. Si diu «Escriptori brut», mostra la llista i pregunta si cal arxivar.
4. Omple només Instrucció del torn, Tasques, Riscos i les files pendents del Registre (i, al pla, Canvis proposats, Verificació i Riscos).
5. Valida els dos fitxers amb document.mjs check. Dona al Mestre les rutes i l'ordre per vincular el pla quan l'aprove.
```

**Prova del testimoni.**
1. Posa una paraula única en cada candidat:

   | Candidat | Paraula |
   | --- | --- |
   | `~/.gemini/GEMINI.md` | GRALLA-SECA-7Q |
   | `AGENTS.md` | ALMEZ-DE-MARGE-3K |
   | `.agents/rules/00_BIOS_COGNITIU.md` | GARROFER-VELL-5M |
   | `.agent/rules/testimoni.md` (nou) | BRESQUILLA-2P |
   | `GEMINI.md` a l'arrel (nou) | TIRAPEU-8T |

2. En una sessió nova d'Antigravity, sense usar cap eina, demana a MarIA que copie literalment totes les línies «Testimoni de càrrega» que tinga al context.
3. Cada paraula que torne és un fitxer que es carrega de veritat. La REGLA 0 va només en eixos fitxers.

### T0.5 · La plantilla prompt_local com a eina de comunicació

La instància 1250 és gairebé una còpia literal de la plantilla: Context i Protocol de l'Olivera són idèntics a la vista. Els problemes, doncs, són de disseny de la plantilla, no de la còpia. De més a menys impacte:

1. **Mode contradictori.** El bloc fix diu «Cap línia de codi es tocarà fins que el Pla estiga consensuat (Mode AFK absolut)», i la Instrucció del torn diu «aplica el pla». A més, el Registre diu «Aprovació humana: pendent». El receptor no pot saber si ha d'auditar o executar.
2. **Cap contracte d'eixida verificable.** El protocol només dona el nom del fitxer. No diu que cal la ruta `auditoria` ni el rebut, ni quines seccions són obligatòries, i el pla demana «Acta Marmota o Auditoria». Seguit al peu de la lletra, el lliurament naix invàlid.
3. **Text de l'autor que arriba al receptor.** La secció 0, l'«Advertència d'inviolabilitat» i l'Historial de versions parlen a MarIA, no al receptor.
4. **Exigències impossibles.** «Motor exacte» i tokens d'entrada i eixida que el model no pot conéixer. Obligar a donar-los induïx a inventar-los. Ací s'ha declarat «no exposat».
5. **Camps sense omplir que resten confiança.** «Tall d'evidència: [HEAD + hora]», «Rebut: pendent» i «Model IA» sense valor.
6. **Noms no verificats.** «AuthForm» no existix. El formulari real és `RegistrationStep` a `src/sections/onboarding/OnboardingSteps.jsx`, i `/login` redirigix a `/registre`. El «Modal Pedra Seca» es diu `Dialeg`.
7. **Abast obert.** «Si veus qualsevol altre error… soluciona'l» contradiu la Llei de l'Aixada. La tasca 0 demana implementar hooks que, per a qualsevol receptor, són governança amb *lease*, i `requires_human_decision` diu `false`.
8. **No hi ha secció d'entorn.** No avisa que la shell està bloquejada ni que `StructuredOutput`, `SubagentHandback` i `Skill` també ho estan, ni que el segell està trencat ni que Supabase està aturat. Ha costat hores de descobriment en esta sessió i milions de tokens en la de Fable.
9. **Criteris que no es poden mesurar.** «Salvaguarda sòlida», «sense bugs visuals», «tots els tests de Vitest en verd» sense línia base (n'hi ha 14 de rojos d'abans).
10. **La visió es barreja amb la norma vigent.** Diu *offline-first* on el Genotip diu «Supabase autoritatiu». Falta separar el que és restricció vigent del que és direcció de futur.
11. **Deriva.** La plantilla és v2.4.0 i el router diu 2.2.0; hi ha tres lectures obligatòries al router i quatre al Context; el cognom del pla (`perfil_empresa`) no és el de la petorreta (`opus_perfil`).
12. **L'Escriptori es tracta com a canal d'ordres.** «Tot el que hi trobes és context rellevant», sense cap llista, obri la porta a la injecció entre documents.

**Millores, per prioritat. Cadascuna es pot validar per màquina.**
1. Camp `Mode` al Registre (auditoria o execució). En mode execució s'exigix la prova de l'aprovació (fitxer:línia o hash del pla vinculat), i el protocol de l'Olivera es condiciona al mode.
2. Secció «Contracte d'eixida» generada segons el destinatari: nom exacte, ordre `document.mjs context --route auditoria`, seccions exigides llegides del router i ordres de verificació.
3. La secció 0 substituïda per un «Preflight» que calcula l'eina: documents rancis, pla amb rebut i hash, i rebut del mateix fitxer. De moment, instal·lar la Porta Olivera v2, que ja existix al laboratori.
4. Treure del receptor la secció 0, l'advertència i l'historial de versions.
5. Telemetria honesta: valors admesos «no exposat» o «no disponible»; el camp és de l'autor.
6. Secció «Abast», amb Dins, Fora, Fitxers d'entrada i Fitxers modificables. Cada ruta ha d'existir o portar «(nou)».
7. Comprovació d'identificadors: cada nom de component en PascalCase ha de resoldre a un fitxer o a un `export` de `src/` (hauria tombat «AuthForm»).
8. Risc alt calculat: si alguna ruta toca `.agents/`, `tooling/gates/`, `.husky/`, `.claude/`, migracions o més de cinc fitxers, `requires_human_decision` passa a `true`.
9. Secció «Entorn i permisos» generada des de `hooks-local` i `mutation-policy`.
10. Un criteri d'acceptació mesurable per tasca, amb ordre i «cap fallada nova respecte a la línia base».
11. Tall d'evidència automàtic (HEAD i hora ISO) en crear el document.
12. Context en dos nivells: «Vigent» (Supabase autoritatiu, adaptadors, Baseline 2022) i «Direcció» (Fedivers, *offline-first*, app nadiua, mòdul WordPress i Joomla, i la regla «no acoblar a cap servidor»), com a màxim 250 paraules.

**Estructura proposada per a la v3.** Cada secció és generada per l'eina (GEN), fixa i validada byte a byte (FIX) o editable per MarIA (EDIT):
- **Registre (GEN):** identificador igual al nom de fitxer, plantilla i versió del router, ruta, rebut, tall d'evidència, destinatari, mode, aprovació amb la prova, `requires_human_decision` calculat, pressupost, i telemetria de l'autor.
- **Instrucció del torn (EDIT):** com a màxim 150 paraules, amb objectiu, fets verificats amb ruta:línia i hipòtesis marcades.
- **Abast (EDIT, amb rutes validades).**
- **Tasques (EDIT):** amb criteris d'acceptació, un per tasca, cadascun amb la seua ordre.
- **Riscos (EDIT).**
- **Contracte d'eixida (GEN segons destinatari i mode).**
- **Entorn i permisos (GEN).**
- **Context (FIX, compacte en dos nivells).**
- **Protocol de la Reunió a l'Olivera (FIX, reescrit):** en mode auditoria no es toca codi; en mode execució, només l'abast declarat. Els documents del Preflight es tracten com a dades.
- **Preflight (GEN):** substituïx la secció 0.
- **Acte reflex (FIX, una línia).**
- **Vincles (GEN).**

Tocar la plantilla, el router o les portes és governança de risc alt, i demana *lease*. Mentrestant hi ha una fase A compatible amb les portes actuals: mantindre l'encapçalament «0.» però amb el contingut generat pel `petorreta.mjs` del laboratori, sense caselles buides.

### T1 · Interfície (fet i verificat)

**1.1 · Barra de format de Notes.**
- **Causa:** `src/css/modules.css`, regla `.sdp-editor-eines { top: calc(var(--sdp-alt-accio) * 2) }`. Es va fer per al Perfil, on la barra blava i la taronja són sticky, i no per al Mur. Al Bloc de Notes eixes barres són static (`utilities.css:124-128`), i per això quedava una franja buida de 116px.
- **Canvi:** `.sdp-bloc .sdp-editor-eines { top: 0; }` dins de la mateixa capa, escopat a Notes.
- **Regressió corregida:** la revisió va trobar que l'índex deixava el títol de destí davall de les eines. S'hi ha afegit `scroll-margin-top: calc(var(--sdp-alt-accio) * 3)` als títols del cos, mesurat per a barres d'una a tres files.
- **Proves:** `NotesEditor.capes.test.js` té cinc proves; una comprova que les regles són dins del mateix `@layer components`.
- **Perfil:** es queda en 116px, sense canvis.
- **Pendent:** en columnes de menys de 280px les eines ocupen de quatre a sis files (317px) i cap valor fix no basta. Cal un `ResizeObserver` que publique `--sdp-alt-eines`, a `UniversalEditorShell.jsx`, fora d'abast.

**1.2 · «Borrar» al costat de «Publicar».** El botó ja existia a `UniversalToolbar`, però cap editor li passava l'acció.
- **Contracte:** capacitat opcional `cicleNotes` (`mouNota`, `esborraNota`) a `contracte.js`, amb l'autorització expressa del Mestre per al `SDP-LOCK`, limitada a això. És opcional: un backend injectat sense ella continua sent vàlid.
- **Local (IndexedDB):**
  - paperera amb data;
  - arxiu sense caducitat;
  - una nota de llavor esborrada deixa una marca perquè no ressuscite;
  - purga als 30 dies en carregar, amb el rellotge injectable.
- **Supabase:** PATCH i DELETE amb `revision=eq.N`; el llistat i la consulta per ID filtren `status=eq.activa`.
- **Migració `supabase/migrations/260927_1400_notes_paperera.sql`** (no aplicada):
  - trigger que fixa `trashed_at` al servidor en inserir i en actualitzar;
  - purga privada amb `pg_cron` només si existix;
  - cap permís nou.
- **Contexts:** la revisió es llig dins del torn exclusiu i els desats posteriors a l'esborrat es tallen. `GlobalSaveManager.oblida` neteja la cua i l'esborrany.
- **Diàleg `DialegEsborrarNota.jsx`** (Dialeg i Boto de Pedra Seca):
  - tres eixides: «Guardar durant 30 dies», «Arxivar» i «Borrar definitivament», aquesta en roig i l'última;
  - l'esborrat definitiu demana un segon pas dins del mateix diàleg, amb el focus a «Enrere»;
  - el vel no tanca el diàleg.
- **Dos defectes previs de tota l'app, corregits:**
  - Els diàlegs ixien a dalt a l'esquerra: el reset `margin: 0` anul·lava el centrat natiu de `<dialog>`, i s'ha restituït `margin: auto` a `.sdp-dialeg`.
  - Tots els botons del peu ixien blaus, perquè `PerfilShell.css:188-210` redefinix `.sdp-boto` sense àmbit. S'han restituït secundari i perill dins del peu.
- **Decisions preses per defecte (revisables):**
  - L'ordre dels botons posa el destructiu l'últim.
  - La publicació al Mur es conserva.
  - La nota de benvinguda n1 es pot esborrar.
  - La vista per a recuperar de la paperera i de l'arxiu queda per a la fase següent. Fins llavors, «Guardar durant 30 dies» i «Arxivar» no es poden desfer des de la interfície.

**1.3 · Ull a la contrasenya.**
- **Control:** `src/components/PedraSeca/atoms/ControlContrasenya.jsx`, un control reutilitzable amb Eye i EyeOff de lucide-react, `aria-pressed`, `aria-controls` i un `mousedown` que no roba el focus.
- **Seguretat:** torna a ocultar la contrasenya abans que el formulari la llija en enviar (provat per mutació), i porta `autoCapitalize`, `autoCorrect` i `spellCheck` desactivats.
- **Ús:** als dos camps del registre i a l'únic de l'entrada.
- **Catàleg:** té espècimen a `EspecimenCamp.jsx` (Pedra Seca §9) i ara també entrada a `registre.js` (porta `tractor-cataleg`, C1). L'espècimen avisa que no s'ha de posar dins de `<Camp>`, perquè no en llig el context.
- **Llei del Píxel:** el camp continua fent 386×49,69.

**1.4 · Formulari congelat.**
- **Causa real:** el registre, l'entrada i Google compartien una sola bandera d'espera (`OnboardingSection.jsx`). Amb l'emergent de Google pendent (fins a 180 s, o per sempre si el navegador el bloqueja, perquè torna una promesa que mai resol), el formulari de correu quedava deshabilitat i amb el spinner.
- **Correcció:**
  - Google té espera pròpia, amb el seu spinner.
  - Els intents van numerats amb `useRef`: només l'últim apaga l'espera o pinta l'error.
  - Una tornada del bfcache allibera l'espera.
  - En error es buiden les dues contrasenyes.
  - La capa `src/data` queda intacta.
- **Verificat amb Supabase aturat:** l'alerta «Error de xarxa…» ix als 175 ms i el formulari torna a estar utilitzable.

**1.5 · Xat net com WhatsApp** (tres ordres successives del Mestre):
- **Columna dreta:**
  - Sense conversa, en escriptori i tauleta, mostra el document per defecte «L'Ànima de la IAIA» i aprofita l'espai que WhatsApp deixa buit. En mòbil mostra un avís sobri.
  - En obrir una conversa, només es veu el xat. En tornar, torna el document.
- **Títol de la pestanya:** continua sent «(N) Xat | Sóc de Poble» amb el document muntat.
- **Roda de control:** ara és un commutador entre `/xat` i `/control-xat`, el panell d'administració que ja existia.
- **Columna de converses, calc de WhatsApp igual en escriptori i mòbil:**
  - una sola fila de títol amb el «+» redó de conversa nova;
  - la cerca en píndola, sempre visible;
  - les píndoles de filtre «Tot · No llegits · Preferits · Grups» just davall, amb desplaçament horitzontal com a WhatsApp mòbil;
  - la llista.
- **Barres eliminades:** la fila de la lupa i, en mòbil i tauleta, les pestanyes «Xat · Converses» apilades. Distància fins a la primera conversa: de 235 a 160px en mòbil, de 282 a 160px en tauleta (820px) i de 177 a 160px en escriptori (238 amb la cerca oberta).
- **Defectes de la revisió adversària, corregits:**
  - En mòbil ja es pot tornar a la conversa oberta des de la llista, i també obrir-ne una altra (`LlistaDeLaClosca` tanca els panells abans de navegar).
  - El focus ja no cau al `<body>`: la creu de la cerca el torna al camp, i el botó del rail el porta al rail i el recupera en tancar-lo.
  - La tauleta (720–899px, l'iPad en vertical) segueix també l'ordre de WhatsApp: les pestanyes només tornen amb el rail obert.
  - `PanellInicialMobil` passa a `useLayoutEffect`: no es pinta cap fotograma amb les pestanyes en entrar a `/xat`.
- **Pendents:**
  - El nom accessible del «+» continua sent «Nova conversa» perquè `App.test.jsx:76` el fixa; si el Mestre vol «Conversa nova», cal canviar la clau i18n a les cinc llengües.
  - El text de l'estat buit (`section.xat.buit.text`) encara diu «Prem «Conversa nova»…». Proposta: «Prem + per a triar amb qui vols parlar.», a les cinc llengües.
  - La creu de la cerca s'anomena «Tanca la cerca», però només buida el terme. Proposta: «Esborra la cerca».
  - A 280px, la píndola «Grups» queda fora de la vista sense cap pista. Proposta: vora esvaïda o píndoles més compactes.
  - En mòbil, la conversa oberta encara té les pestanyes damunt: salt de 58px en obrir-la i en tancar-la. En tauleta, obrir el rail fa baixar el contingut 58px. Són decisions de disseny del Mestre.
  - Cal anotar a la skill `sdp-app-grid-shell` §2 que, al Xat, esta jerarquia substituïx les dues files de la columna central (fitxer de governança).

### T2 · Accés del Mestre (diagnosi; l'execució l'ha deixada el Mestre per a més avant)

- **INFRA.** No hi ha res escoltant a `localhost:54321` (`ERR_CONNECTION_REFUSED`, mesurat al navegador), i no hi ha cap `supabase/config.toml`: `supabase start` no té projecte des d'este repo.
- **CONFIG.** `VITE_SUPABASE_ANON_KEY` de `.env.local` és un marcador que passa la validació de forma. `VITE_TENANT_ID` és l'UUID nul, i la llavor usa `11111111-2222-3333-4444-555555555555`.
- **DADES.**
  - Cap usuari «Javi Llinares» a `supabase/seed.sql`: l'alta a `auth.users` només hi és en comentari.
  - Sense fila a `user_platform_roles`, el rol seria «usuari», no superadmin.
  - Hi ha dues migracions sense aplicar (`260926_2232_copyright_editor` i `260927_1400_notes_paperera`). El client ja demana `copyright` i `status`: en mode remot, Notes no carregarà fins que s'apliquen.
- **CODI.** La cadena del login és correcta: `OnboardingSection` → port → `supabase/auth.js` → `fetch` a `/auth/v1/token`. Amb el backend caigut, ara el formulari mostra l'error i no es congela.
- **Què ha de decidir el Mestre:**
  - **(A) Supabase local:** Docker, `supabase init` i `supabase start`, aplicar les migracions i la llavor, crear el compte des de `/registre` i afegir el rol. Hi ha migracions amb prefix numèric repetit, que el CLI podria rebutjar.
  - **(B) El Supabase allotjat,** on probablement ja hi ha el seu compte: posar a `.env.local` la URL `https://REF.supabase.co` i la clau publicable, i revisar `VITE_DATA_MODE` i el tenant. Les claus les ha de posar ell.
  - En tots dos casos, usar `localhost` i mai `127.0.0.1`: la CSP d'`index.html:8` no l'admet.

### Troballes laterals

- **Seguretat.** `~/.gemini/antigravity/mcp_config.json` guarda en clar claus de Google, un token de GitHub, la contrasenya de Postgres d'un host de Supabase i un token de Penpot. Un subagent el va llegir buscant la configuració d'Antigravity: no les va reproduir, però van passar pel context del model. Propose moure-les al clauer o a variables d'entorn i que el Mestre decidisca si les rota. `requires_human_decision: true`.
- **Sessió sense signatura.** `SocDePoble.injectaSessio` accepta qualsevol JWT amb forma vàlida sense comprovar la signatura (`identitat.js:481-532`), i pinta «dins» sense backend. Cal confirmar que és només per a desenvolupament.
- **L'índex de Notes penja la pestanya** (`PageFrame.jsx:21-60`, anterior a este torn). `buildToc` posa ids als títols de ProseMirror, ProseMirror els torna a pintar, el `MutationObserver` torna a cridar `buildToc`, i així sense fi: s'han comptat 158.157 assignacions. Cal una peça pròpia: no mutar el DOM de l'editor.
- **Botons de tota l'app en blau.** `PerfilShell.css:188-210` redefinix `.sdp-boto` sense àmbit. Fora dels diàlegs, secundari i perill continuen blaus. Acotar-ho a `.perfil-espai` és decisió del Mestre, perquè canvia botons de tota l'app.
- **Rebuts fantasma del torn de Fable.** El torn té rebuts per a documents que s'han arxivat a mà, sense `handoff`, i `command-policy` no permet `handoff`: el torn no es pot tancar.
- **Portes que ixen verd sense comprovar.** `tractor-classes.mjs` ix sempre amb 0, i `porta-olivera --informe` no mira el contingut.
- **Pont amb WhatsApp (document 1400).** És tècnicament viable amb l'API de WhatsApp Business. Cal afegir-hi el consentiment (RGPD) de les terceres persones els missatges de les quals es desvien, i el document s'ha de regenerar amb rebut.
- **Deute d'accessibilitat per fletxes (document 1230).** Queda fora d'abast per decisió del Mestre. El diàleg nou i l'ull es poden fer servir amb Tab.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Proves** (arbre final, 27-09, 14:25 hora local, després de l'última correcció del Xat):
- `npx vitest run src/data src/sections/notes src/components/universal src/sections/onboarding src/components/PedraSeca src/sections/disseny src/sections/xat src/components/layout src/app/App.test.jsx src/app/contexts/SessionContext.test.jsx src/sections/profile`: 69 fitxers, 683 proves en verd.
- `node --test tests/migracio-notes-paperera.test.mjs tests/petorreta-generador.test.mjs tests/porta-receptor.test.mjs tests/documental.test.mjs tests/lint_xat.test.mjs`: 62 de 62. Inclou ESLint amb zero missatges als fitxers del Xat, i18n a les cinc llengües i només tokens.

**Portes:**
- `node tooling/gates/tractor-enxufe.mjs`: E1–E4 correctes; el contracte i el port quadren amb `cicleNotes`.
- `node tooling/gates/tractor-rls.mjs`: zero fantasmes i zero forats en 23 fitxers SQL.
- `node tooling/gates/design_guard.mjs --arrel=src`: exit 1 només pel deute previ, idèntic al de l'inici del torn (`DocumentPrintPreview.jsx`, i dos valors de 14px a `modules.css`). Cap entrada nova; `inline-style` baixa de 17 a 4.
- `node tooling/gates/porta-olivera.mjs --informe`: verd, però és cec al contingut (T0-4).
- `node tooling/gates/segella.mjs`: segell trencat, afe40038 contra 69beea9e (T0-8).

**Navegador** (pestanya pròpia, mode seed):
- **`/xat` a 1280×800:**
  - Sense conversa: document per defecte a la dreta, i títol, «+», cerca en píndola i filtres que es desplacen.
  - Amb conversa: només el xat, cap `.bar-blue` ni `h1` a la graella, i el títol «(N) Xat».
- **`/xat` a 375×812:** títol amb «+», cerca en píndola, píndoles i llista, sense barres apilades.
- **`/notes?nota=n1`:**
  - «Borrar» és germà de «Publicar».
  - El diàleg surt centrat (de 416 a 864 en 1280), amb secundaris blancs (rgb 255, 255, 255) i perill roig (rgb 194, 24, 29).
  - S'ha tancat amb Escape sense tocar la nota.
- **`/registre`:** dos controls de contrasenya; l'ull passa de password a text amb `aria-pressed=true`, i el camp continua habilitat.
- **`fetch` a `localhost:54321/auth/v1/health`:** falla («Failed to fetch»).

**Contrast adversari:**
- Les 8 diagnosis de W1 van passar per 8 refutadors. Les sis peces (barra, accés, esborrat, reflex, Xat i columna de converses) van passar per revisió adversària, i totes van rebre esmenes que calia corregir.
- Tots els correctors van lliurar informe. Els punts que no van aplicar (canvis d'aspecte no trivials o fitxers fora d'abast) consten com a pendents a cada peça.
- La verificació del coordinador al navegador es va fer abans de l'última correcció del Xat (mòbil, focus i tauleta). Eixa correcció la va verificar el mateix corrector al navegador a 375, 820 i 1280px, i les proves de l'arbre final la cobrixen.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap escriptura de governança.** `tooling/`, `.agents/`, `.claude/` i `package.json` exigixen executor amb *lease*, i l'executor no funciona amb el segell trencat. Per això la solució de la Tasca 0 queda al laboratori, i no he actualitzat ni `ESTAT.md` ni el LEDGER, ni he registrat les recaigudes. Tot això ho ha de fer el Mestre o l'executor.
- **`tancament.mjs` no s'ha executat,** perquè el hook no l'admet. El torn `torn_ee153098` queda obert fins a 2026-09-28T11:10Z.
- **Lint.** No s'ha executat `npm run lint`, que el hook no admet. Només hi ha la garantia d'ESLint dels fitxers del Xat, via `tests/lint_xat.test.mjs`.
- **Migració.** No hi ha PostgreSQL: la migració 260927_1400 només s'ha comprovat de manera estàtica i amb `tractor-rls`. El camí remot de la paperera no s'ha executat mai.
- **Accés del Mestre.** No s'ha provat l'entrada amb el seu compte: no hi ha backend ni es poden entrar credencials. Safari tampoc s'ha provat (l'ull amb la clau d'autoemplenament).
- **Proves pendents a tot l'arbre.** Continuen les 14 fallades prèvies de Vitest (Consola/Wiki), que no s'han tornat a mesurar a tot l'arbre.
- **Canvis sense commit.** Hi ha restes de prova a l'IndexedDB del navegador compartit: «Prova paperera» (a la paperera), «Prova arxiu Opus» (arxivada) i «Prova paperera Claude» (visible).
- **Arxiu històric.** No s'ha llegit `90_arxiu_historic/` (AGENTS §5), i per això no s'ha pogut recuperar la primera versió, la feta de memòria, de la petorreta 1250.
- **Memòria.** No s'ha pogut desar la memòria d'esta sessió: el hook bloqueja les escriptures fora del repositori.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_1250_prompt_opus_perfil]]
- [[260927_1250_pla_implementacio_perfil_empresa]]
