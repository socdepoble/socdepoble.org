---
type: informe
status: esborrany
description: 'Informe de Claude del pla 261025_0045: Dialeg amb un sol scroll, finestres de la barra adaptatives, píndoles de proporció, G-P11-01 i la reforma IDEA-22 de Connectar.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_08793431-2505-4da7-8248-15e373802748:9765298a-ee84-4e98-84a5-3ea65f1c8d0c
---
# Implementació Claude · diàlegs sense doble scroll, retall compacte, G-P11-01 i Connectar B2B (pla 261025_0045)

**Dictamen: les cinc tasques estan al codi, amb proves. Són les quatre del pla 261025_0045 i la reforma de Connectar (IDEA-22) que el Mestre hi va afegir a mig torn.** Una revisió adversarial de 10 agents va confirmar 10 troballes, i totes estan aplicades. T1-T3 s'han mesurat en un navegador real, al catàleg de disseny.

**Hi ha commit: `1c110f954f6e9191ff04ffeaa8e32a0821149267`, decidit pel Mestre al xat.** Va sobre `47eb2fa00`, a `backup-notes-publish`, amb l'arbre `bf1751a4`: 38 camins, `--no-verify`. No s'ha fet cap push. La migració nova `2610250100_seguiments_des_d_entitat.sql` **NO està aplicada**: l'aplica el Mestre, mai un agent.

`npm run test:precommit` passa: Vitest 153 fitxers / 2.999 proves en 28,9 s, i node 259/259. L'ordre sencera tarda uns 32 s de rellotge.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_08793431-2505-4da7-8248-15e373802748:9765298a-ee84-4e98-84a5-3ea65f1c8d0c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (servidor de desenvolupament `:3340`, mode llavor, per al navegador) |
| Creació | 2026-10-24T23:27:01.466Z |
| Modificació | 2026-10-25T00:50:00Z |
| Propietari | Claude (torn `torn_08793431-2505-4da7-8248-15e373802748`, abast `code`) |
| Aprovació humana | Prompt del Mestre al xat: pla i prompt 261025_0045, amb la T5 (IDEA-22) afegida a mig torn. No implica aprovació de commit, migració ni desplegament. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (constructor). Ajuda: 1 subagent per al backend B2B i 1 workflow de revisió amb 5 revisors i 5 verificadors. |
| Tokens consumits | Subagents: ~0,37 M (backend) i ~1,60 M (revisió). El fil principal no exposa el recompte. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

He llegit sencers el pla i el prompt canònics de 261025_0045, i també la troballa G-P11-01 de [[261025_0031_auditoria_codex]], abans de tocar codi.

La seqüència documental ha sigut aquesta:
- torn propi `torn_08793431`, obert i vigent fins a 2026-10-25T20:54Z;
- `document.mjs context` i `create` de la ruta `auditoria`;
- el pla 0045 vinculat amb `document.mjs plan` (hash `08400bd6…`).

La porta Olivera ix amb 0. Claude no escriu `.agents/` (ESTAT, LEDGER): eixe relleu és de MarIA.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-25 00:45-01:00.** Lectura del pla i del prompt; implementació de T1-T4.
- **Mig torn.** El Mestre afig la T5 (IDEA-22): el frontend el fa Claude, i el backend un subagent amb un contracte tancat.
- **01:27.** Esborrany creat des de la plantilla viva.
- **01:30-01:45.** Comprovació en navegador de T1-T3. Ajust de la T3: a 1280×800 hi havia 113 px de scroll i en mòbil 220 px.
- **01:45-02:00.** Revisió adversarial: 5 dimensions, cadascuna amb un verificador que intenta refutar. Resultat: 10 troballes confirmades i 5 rebutjades.
- **02:00-02:10.** Aplicades les 10, segona comprovació en navegador, bateria sencera i `test:precommit`.
- **2026-10-25T00:10Z.** Informe complet. Relleu de Claude afegit a les files IDEA-21, IDEA-22 i P1-11 del [[03_llibre_mestre_tasques_i_idees]].
- **2026-10-25 02:15-02:45.** El Mestre demana preparar el commit.
  - Arbre exacte `bf1751a4`, muntat amb índex temporal i llista explícita de 38 camins, sense `DesignSection.jsx`.
  - Assaig en una còpia congelada amb repositori propi (alternates) i un commit de prova sobre el pare real:
    - Vitest sencer: 1.272 fitxers / 21.947 proves, 0 fallades.
    - `test:node`: 1.031 proves, 0 fallades. Cal copiar-hi `.claude/settings.json`, que el git ignora.
    - `lint`: 0.
    - `test:precommit`: 39,4 s.
- **2026-10-25 02:47.** Commit `1c110f954` amb `--no-verify`, per decisió del Mestre al xat, amb la guarda de l'arbre exacte. L'error de post-commit «active.json ENOENT» és inofensiu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1 · Què s'ha fet, per tasca

**T1 · `<Dialeg>` sense doble scroll** (`components.css`)
- **Causa.** El `<dialog>` porta de sèrie `overflow: auto`. A més, el marc heretava el `max-height` sencer dins d'una caixa 2 px més menuda (la vora, amb `box-sizing: border-box`). Per això el diàleg feia el seu propi scroll de 2 px al costat del del cos.
- **Canvi.**
  - Obert i amb marc, el diàleg és una columna flex.
  - El marc i el cos s'encongixen (`min-height: 0`) i només fa scroll el cos.
  - La capçalera, la descripció i el peu no s'encongixen.
- **Després de la revisió.** El `<dialog>` porta `overflow-y: auto`, no `hidden`, només com a reserva de pantalla molt curta: si la capçalera i el peu ja no hi caben, el peu continua abastable. Mesurat, el diàleg no desborda mai en el cas normal.
- **Atenció.** Gemini va verificar `overflow: hidden` a les 01:05. Ara és `overflow-y: auto`, per la troballa R-6 de la revisió.

**T2 · Finestres de la barra adaptatives** (`Dialeg.jsx`, `modules.css`, `SelectorVisibilitat.jsx`)
- **Pujada.**
  - Si el cos d'una finestra `lloc="barra"` desborda davall de les barres, la finestra puja dalt (`sdp-dialeg--barra-amunt`) i pren l'alçada de la pantalla.
  - Es mesura en obrir-se i en canviar la mida de la finestra.
  - Es queda dalt fins que es tanca, sense salts.
  - Només en escriptori, i mai en l'encastat (revisió, R-4).
- **`SelectorVisibilitat`.** Passa a mida g. Després de la revisió (R-8), en escriptori fa 896 px de veres: `:where(dialog)` la tallava a 40rem.
- **Mesurat a 1280×800.** Les tres variants fan entre 590 i 653 px d'alt i ni el diàleg ni el cos fan scroll.

**T3 · Selector compacte de proporcions** (`DialegEnquadrament.jsx`, `modules.css`)
- **Què canvia.**
  - En el mode senzill amb més d'una forma (la capçalera), les nou formes són píndoles d'un sol toc: ràdios natius dins d'un `fieldset role="radiogroup"`.
  - Les etiquetes són curtes: «1:1», «16:9», «Orig.». El nom sencer arriba per `aria-label`.
  - Hi ha una sola línia de didàctica amb `aria-live="polite"`, i el diàleg és de mida m.
- **Mesurat en navegador, zero scroll en les 9 formes:**
  - a 1280×800, amb una fila de píndoles i un visor de 288 px;
  - a 375×812, amb dues files i el peu en una fila (abans, tres botons apilats de ~200 px).
- **Sòl del visor (R-5 i R-9).** El visor té un sòl de 10rem. A 1280×600, el visor es queda en 160 px i fa scroll el cos (97 px): la foto no desapareix.
- **Gemini.** La G21-01 (52 px de scroll residual) està resolta.

**T4 · G-P11-01** (`organizations.js`)
- La memòria de columnes absents del directori ara és per URL de servidor i caduca als 5 minuts. Abans era un `Set` global.
- Proves noves:
  - un host antic no bloqueja un host nou;
  - dos hosts alhora amb `allSettled`;
  - la caducitat, amb rellotge fals.

**T5 · IDEA-22, Connectar** (`ConnectarSection.jsx`, `BlocRelacio.jsx`, `useSeguiment.js`, `BlocFormarPart.jsx`, `Seguidors.jsx`, 5 diccionaris)
- **Fora «Actues com a …, però les connexions són personals».**
- **Selector «Connectar com a».**
  - Ix al camí de la relació, que ara es diu «Connexió directa».
  - Dona a triar la persona o una organització que **administres** (owner o admin). Un membre no hi parla en nom de ningú.
  - Reusa `SelectorDeVariacions`, les píndoles de tria única del Mercat.
  - Per defecte, l'actor de la sessió si és una organització que administres. Triar-ne un altre no canvia l'actor global.
  - El port rep `{ tipus, id, com }`.
- **Cap missatge al xat com a entitat.** Revisió, R-1: el xat personal diria quina persona l'administra, i el servidor no ho torna mai. Es diu abans del clic («Com a {entitat}, no li enviarem cap missatge al xat…») i després («Has connectat {entitat} amb {nom}…»).
- **Canviar de barret a mitja acció** no escriu el resultat vell en el barret nou, i el missatge és el del clic (R-2 i R-3).
- **Fora el muntatge de `BlocAdministrarOrganitzacio`.** Administrar és del Perfil, a «Membres i connexions». Qui l'administra hi té un botó «Gestionar {nom}».
- **Sense xat privat ja no hi ha carreró.** L'estat `sense-xat` porta un botó al xat de la pàgina de l'entitat (`rutaXatDePagina`, el canal de «Comentar»). Sense directori no hi ha nom de confiança i els textos no en porten: «Obrir el xat de l'entitat». El títol de l'URL no ix mai.
- **Llistes del veïnat connectat.** Una fila d'entitat diu «Nom (entitat)», i l'ajuda diu «persona o entitat».
- **Backend (subagent, verificat).**
  - Migració `2610250100`: `seguidor_entitat`, `p_com`, SDP-SEG-007 i `qui_em_segueix.seguidor_tipus`.
  - La quota la compta la persona que actua.
  - El pany de la persona va abans que el de l'entitat.
  - La porta 007 es mira abans de les que depenen de l'entitat, perquè qui no l'administra no en pot sondejar res.
  - Adaptadors remot i local, contracte (`comDelContracte`) i un cas nou del kit.
  - Proves: 21 proves estàtiques noves de la migració i casos nous als dos adaptadors.

### 2 · Revisió adversarial (10 confirmades, totes aplicades)

| # | Sev. | On | Què passava | Arreglament |
| --- | --- | --- | --- | --- |
| R-1 | mitjana | `useSeguiment.js` | Com a entitat, l'avís ixia del xat personal de qui l'administra, i revelava la persona que el servidor amaga. | Com a entitat no s'envia cap missatge; s'avisa abans i després. |
| R-2 | mitjana | `useSeguiment.js` | El text de l'avís es llegia després de l'`await`: si el barret canviava a mitja acció, eixia el text de l'altre actor. | El text i el barret es fixen en fer clic. |
| R-3 | baixa | `useSeguiment.js` | Una acció que acabava tard sobreescrivia la lectura del barret nou i el bloc es quedava en «Comprovant…». | Només escriu la clau vigent (`clauRef`). Una prova de mutació confirma que la prova ho caça. |
| R-4 | alta | `Dialeg.jsx` | En l'encastat, la regla de pujar guanyava a la capa modal i la finestra perdia títol i peu. | `ambBarra` exclou el mode local. Té prova, també amb mutació. |
| R-5, R-9 | alta / mitjana | `modules.css` | El visor de la T3 no tenia sòl: en una pantalla curta la foto quedava a 0 px. | `max(10rem, …)` en escriptori i en mòbil. |
| R-6 | mitjana | `components.css` | `overflow: hidden` deixava el peu inabastable quan les parts fixes no hi cabien. | `overflow-y: auto` com a reserva. |
| R-7 | baixa | `modules.css` | El `min-height: 0` nou del cos desfeia la reserva del diàleg d'impressió. | `min-height: auto` al cos d'impressió (prova actualitzada a posta). |
| R-8 | baixa | `modules.css` | La mida g de `SelectorVisibilitat` quedava tallada a 40rem. | `max-width: none` en escriptori. |
| R-0 | baixa | migració 2610250100 | Si es purga el compte de qui va fer el seguiment d'una entitat, la fila cau en cascada i `primer` torna a ser `true`. La capçalera prometia «per sempre». | Amb R-1 ja no ix cap avís des d'una entitat. La capçalera s'ha corregit. La pèrdua de la fila és una decisió pendent (§4). |

**Rebutjades** (els verificadors les han refutades):
- `qui_em_segueix` filtraria una entitat de visibilitat «membres»: només la veu la banda que l'entitat ha triat seguir.
- El kit no comprova `tipus` ni `com` en `estatSeguiment`: és un forat de cobertura, no un defecte. Queda proposat.
- L'avís des del xat personal seria una decisió de disseny: ho rebutja una dimensió, però ho confirma l'altra (R-1) i s'ha aplicat.
- El selector s'oferiria sense comprovar el servidor: sense la migració de base, tampoc el seguiment personal funciona.
- Una cursa a `organizations.js`, en la represa de la columna absent: és d'abans d'este torn.

### 3 · Decisions de l'executor (el Mestre les pot girar)

- **D-1.** «Orig.» és l'etiqueta curta que fixa el prompt. El nom sencer és a l'`aria-label` i a la didàctica.
- **D-2.** En mòbil, el peu en una fila només per al retallador senzill.
- **D-3.** `SelectorVisibilitat` en mida g de veres (896 px en escriptori).
- **D-4.** «Connectar com a» reusa `SelectorDeVariacions`: cap peça nova ni cap espècimen nou.
- **D-5.** Com a entitat, cap missatge al xat (R-1). Si el Mestre en vol un, cal un fil iniciat per l'entitat (`xat_participants.com_org_id`), que avui no existix. El xat d'entitats de 2609272200 només deixa que l'entitat responga.
- **D-6.** «Escriu-li» i la còpia «A les teues notes» continuen sent de la persona.
- **D-7.** `BlocAdministrarOrganitzacio.jsx` i el seu test queden al disc, orfes. Esborrar-los és decisió del Mestre.
- **D-8.** Sense directori, textos sense nom.
- **D-9.** Les files d'entitat diuen «(entitat)», sense enllaç (abans tampoc n'hi havia).
- **D-10.** «Entre persones» passa a «Connexió directa».

### 4 · Decisions pendents del Mestre (backend B2B)

1. **Una entitat pot seguir una persona que l'administra**, també la que actua. El CHECK només impedix que una entitat se seguisca a ella mateixa.
2. **Si la persona que va fer l'última alta es dona de baixa**, el seguiment de l'entitat desapareix (cascada de `seguidor`). Hi ha dues alternatives:
   - passar la fila a una altra persona que l'administre;
   - fer `seguidor` nul·lable amb `on delete set null`.
3. **L'exportació (2610241410) no s'ha tocat.** Els seguiments fets com a entitat hi eixen com a «a qui seguixes», i `total_seguidors` compta també les entitats.
4. **No s'ha de tornar a aplicar mai 2610241430 després de 2610250100.** Tornaria a crear les signatures `(text, uuid)` i PostgREST no podria triar (PGRST203). Ho diuen la capçalera i el README.
5. **No hi ha cap llista «a qui seguix l'entitat».** Es mira destí a destí.
6. **Ordre d'aplicació:**
   1. 2610241430 (encara NO aplicada);
   2. 2610242320;
   3. 2610250100;
   4. després, publicar el client amb `com`.

   Sense la migració nova, una crida amb `com` dona NO-DISPONIBLE.
7. **No fet:** el punt 2 de la directiva IDEA-22 al Llibre (àudios 01:14-01:16), la dualitat entitat/persona propietària al destí («La Figuera» i «Sofía»). No era al prompt 0045.
8. **No fet:** G21-02 de Gemini (les píndoles també a la branca T46 de les Notes). Fora de l'abast de la T3, que era el mode senzill.

### 5 · Una altra mà a l'arbre

- `src/sections/disseny/DesignSection.jsx`: algú ha llevat `onConnect={false}` (01:20:45).
- `src/data/supabase/seguiments.test.js`: algú hi ha afegit `tipus: 'persona'` en 3 línies (01:23). El subagent n'ha conservat la versió.

No és d'este torn: no s'ha tocat. Tampoc s'ha tocat el pla nou de MarIA `261025_0200_*` (maquetació editorial), que és per a un torn nou.

### 6 · Fitxers del torn (38 camins, cap de `.agents/`)

**Codi i proves:**
- `src/components/PedraSeca/organismes/Dialeg.jsx` i el seu test;
- `src/components/universal/SelectorVisibilitat.jsx`;
- `src/components/universal/enquadrament/DialegEnquadrament.jsx` i el test `senzill`;
- `src/components/universal/DocumentPrintPreview.capes.test.js`;
- `src/css/components.css`, `src/css/modules.css` i `src/css/dialegUnScroll.capes.test.js` (nou);
- `src/data/supabase/organizations.js` i el test `directori`;
- `src/sections/connectar/`: `ConnectarSection.jsx`, `BlocRelacio.jsx`, `useSeguiment.js`, `organitzacio/BlocFormarPart.jsx` i els dos tests de la secció;
- `src/sections/profile/Seguidors.jsx` i el seu test;
- `src/sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx`;
- `src/config/idiomes/{ca,es,en,eu,gl}.js`.

**Backend:**
- `src/data/{contracte,localSeguiments}.js`, `src/data/conformitat/kit.js` i `src/data/supabase/seguiments.js`, amb els seus tests;
- `src/data/supabase/{conformitat.test.js, seguiments.migracio.test.js, seguimentsEntitat.migracio.test.js}`;
- `supabase/README.md`;
- `supabase/migrations/2610250100_seguiments_des_d_entitat.sql`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat al directori del repositori, en este torn, després dels últims canvis:

- **`npx vitest run src`**: 1.256 fitxers passen i 2 fallen; 21.603 proves passen i 3 fallen. Les 3 fallades són d'abans del torn:
  - `censImatges` ×2, per les fotos `iaia_maria_avatar_mobil.*` d'una altra mà, sense seguiment a git;
  - `App.appsLocals` `/app/lector` en remot, que també falla en un HEAD net amb qualsevol URL de servidor.
- **`npm run test:precommit`**: Vitest 153 fitxers / 2.999 proves, 0 fallades, en 28,93 s; node 259 / 0 fallades.
- **Proves de dades, Connectar i Perfil** (`npx vitest run src/data src/sections/connectar src/sections/profile`): 197 fitxers / 3.424 proves verdes, abans dels arreglaments de la revisió. Després, Connectar + CSS + impressió + Dialeg: 43 fitxers / 720 proves verdes.
- **Migracions**: `node --test tests/migracio-*.test.mjs` dona 162/162, i amb `tractor-rls-realtime` 164/164. `node tooling/gates/tractor-rls.mjs` diu «Zero fantasmes i zero forats (59 fitxers sql)».
- **`npx eslint --max-warnings=0`** sobre els 34 fitxers JS del torn: exit 0.
- **Proves de mutació.** Les proves noves de R-3 i R-4 fallen si es desfà l'arreglament i passen amb ell. El codi s'ha restaurat i comprovat.
- **Navegador** (panell integrat, `http://localhost:3340/disseny`, espècimens `superposicions-enquadrament` i `superposicions-visibilitat`):
  - **1280×800.** Al retallador, el diàleg 696/696 i el cos 515/515, sense scroll en les 9 formes. A la visibilitat, el diàleg fa 896 px d'ample i ni el diàleg ni el cos fan scroll.
  - **375×812.** El diàleg 700/700 i el cos 497/497, sense scroll en les 9 formes; el peu va en una fila.
  - **1280×600.** El visor es queda en 160 px, el cos fa scroll de 97 px i el peu continua a la vista.
- **Porta Olivera**: exit 0. Només hi ha els avisos de sediment de l'índex, que ja hi eren.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Commit `1c110f954`, sense push.** L'informe, el Llibre i l'índex no hi entren: són per al commit de documents de MarIA.
- **Migració 2610250100 NO aplicada.** Les proves de la migració són estàtiques: res no s'ha provat contra cap base de dades.
- **/connectar no s'ha vist en el navegador.** El mode llavor no té identitats que administren organitzacions. Les proves de Connectar simulen el port.
- **Navegador.** Només el panell integrat (Chromium). Safari 16 no s'ha provat en viu. Els valors CSS són Baseline 2022: `max()`, `min()` i `calc()`; cap `:has()` ni `dvh` nou.
- **Textos en eu, en, es i gl.** Els ha escrit Claude i demanen una revisió nativa, sobretot l'ordre de les frases basques amb «…: {nom}».
- **El kit de conformitat no comprova `tipus` ni `com`** en `estatSeguiment` ni en `deixaDeSeguir`. És un forat de cobertura, no un defecte.
- **Retroalimentació de la plantilla.** La ruta `auditoria` no té cap secció per a «decisions pendents del Mestre», ni per a «canvis d'altres mans». Les dues apareixen a cada informe d'implementació. Proposta per a MarIA: una secció opcional per a cadascuna.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]]
- [[261025_0045_prompt_claude_usabilitat_i_disseny_dialegs_sense_doble_scroll]]
- [[261025_0031_auditoria_codex]]
- [[261024_2230_auditoria_gemini]]
- [[261024_2315_implementacio_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
