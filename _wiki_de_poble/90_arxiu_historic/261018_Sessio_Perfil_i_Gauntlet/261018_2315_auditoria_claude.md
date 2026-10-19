---
type: informe
status: esborrany
description: 'Informe de Claude Code sobre el relleu frontend del Pla 2000: selector de variants del Mercat, enquadrament de l''avatar i Multimèdia per actor, amb proves i comprovació visual.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7fc20280-109a-449c-bf03-44468881020d:3640bf15-673a-48fa-bead-18c921139321
---
# Auditoria Claude · Relleu frontend del Pla 2000: Mercat, avatar i Multimèdia per actor

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7fc20280-109a-449c-bf03-44468881020d:3640bf15-673a-48fa-bead-18c921139321 |
| Versió del document | 1.4.0 |
| Entorn | entorn-dev-local (`localhost:3340`; comprovació visual amb l'accés pilot, mode llavor) |
| Creació | 2026-10-18T21:16:41.564Z |
| Modificació | 2026-10-19T11:30:00.000Z |
| Propietari | claude |
| Aprovació humana | aprovat (relleu del Mestre al xat de Claude Code, 18-10-2026 ≈20:50: «Tens el relleu absolut per a executar la implementació frontend segons el Pla 2000») |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, app d'escriptori) com a orquestrador, amb un workflow de subagents: 3 franges de fitxers disjunts, un integrador, una revisió adversarial (3 lents, 2 escèptics per troballa) i un reparador |
| Tokens consumits | ≈6,75 M en subagents, més el fil principal (no mesurat amb precisió). Escaneig de seguretat (§4): 81 investigadors i un panell de 48 vots; després, 7 revisors de pegats (≈1,3 M) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-18 (≈20:50): relleu del Mestre al xat amb quatre punts: Mercat, avatar, Multimèdia per actor i `personaDeSessio.js`. Abans d'implementar, lectura del Pla i del Prompt 2000 (versions de les 20:39 i 20:40) i dels informes [[261018_2030_auditoria_codex]] (amb el §4.1) i [[261018_2030_auditoria_gemini]].
- 2026-10-18 (20:55): punt 4 fet per l'orquestrador.
- 2026-10-18 (20:57–23:00): workflow de tres franges (Mercat; avatar; Multimèdia i cens), integració, revisió adversarial (20 troballes, 17 confirmades) i reparació.
- 2026-10-18 (≈22:45): correcció del Mestre a mig torn: fora el punt volat davant del poble. La barra i la targeta queden «impecables»; el Mestre mana no tocar-les més.
- 2026-10-18 (23:00–23:15): comprovació al navegador, correcció d'un defecte visual del visor dins del Perfil i suite completa. Lectura de les auditories creuades [[261018_2256_auditoria_codex_creuada_claude_i_superadministracio]] i [[261018_2300_auditoria_creuada_claude_i_superadmin_gemini]].
- 2026-10-18 (23:20–23:55): ordre del Mestre al xat sobre F1: «lleva la línia dels 10 MB de davall del cercle, amb una prop opcional a UniversalEditorShell que conserve l'avís de pujada». Aplicada, passada per una revisió adversarial (2 lents; 10 troballes menors confirmades, i aplicades les que tocaven el canvi) i verificada al navegador.
- 2026-10-18 (22:05) a 2026-10-19 (02:55): ordre del Mestre al xat, «claude-security» amb escaneig profund de perfil, multimèdia, Mercat, capa de Supabase i amfitrió, i «Suggest patches» verificats amb la suite, sense commits. Delegació de Direcció Autònoma de la IAIA MarIA per a la nit. Escaneig `high` (22:05–23:21), informe renderitzat i segellat, set pegats amb revisió adversarial i suite completa. El resultat és el §4.
- 2026-10-19 (12:15–12:30): ordre del Mestre al xat: «Aplica a l'arbre els 6 pegats de client verificats» (F03, F04, F05, F06, F11 i F14) i passa la suite, sense commit. El pegat SQL (F01) i F10 es queden a `pegats/` per a revisar-los amb el Consell abans de tocar el servidor. Aplicats a les 12:16 i verificats a l'arbre real (§4 i Verificació).
- 2026-10-19 (13:15–13:30): el Consell (Gemini i Codex) ratifica els 6 pegats de client. Ordre del Mestre al xat: «Aplica a l'arbre R1_R2_R4 i R3, sense commit, i passa la suite completa». Aplicats a les 13:16 i verificats a l'arbre real.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Balanç per punt (demanat · fet · pendent)

| Punt | Fet en codi (verificat) | Pendent o fora del codi |
| --- | --- | --- |
| **1 · Mercat** | `src/sections/detail/detailSectionMeta.jsx` i peces noves (`src/sections/mercat/SelectorDeVariacions.jsx`, `variacionsDeProducte.js`):<br>· Un sol node, amb carrusel de les 8 fotos («1 / 8»), H2 i descripció una sola vegada.<br>· Fora la llista de targetes per variant.<br>· Selector de píndoles (`role="radiogroup"` sobre ràdios natius: les fletxes funcionen).<br>· Selecció per `id` estable (`gris-plom`, `verda-pi` a `marketSeed.js`; `mapejadorSeccions.js` conserva un `id` curt i segur, amb prova d'escriptura i lectura).<br>· «Esgotat» ve de `stock_status`: la píndola està marcada però es pot triar, i aleshores el botó únic queda desactivat («Esgotat · no es pot afegir al cabàs»).<br>· `sdp-media://` es resol pel port abans del filtre i mai es pinta cru.<br>· Regió viva amb nom, preu i estat. | El botó no fa res, com abans: no hi ha backend de cabàs (`onAfegeixAlCabas` és opcional i no el passa ningú). Cal regenerar `supabase/seed.sql` (`npm run db:seed:generate`) perquè la Samarreta remota porte els `id` de variant. El carrusel no salta a la foto de la variant. Les claus i18n `section.mercat.*` encara no existixen (cauen al valencià). |
| **2 · Avatar** | `PerfilEditor.jsx`, `useEnquadramentAvatar.jsx`, `useImatgeDeFitxa.jsx`, `DialegEnquadrament` (només props opcionals) i `PageFrame.jsx`:<br>· Davall del cercle no queden [Avatar] ni [Llevar l’avatar].<br>· El cercle és el botó («Ajusta o canvia l’avatar»): obri `DialegEnquadrament` amb la foto actual.<br>· Zoom amb lliscador, roda i +/−; desplaçament amb arrossegament i fletxes.<br>· Dins del diàleg: «Canviar foto», els formats, «Llevar avatar» (amb la confirmació de sempre) i «Guardar enquadre» (puja el retall de 400×400 pel camí de sempre).<br>· Sense foto, el cercle buit obri el selector.<br>· Escape tanca el diàleg i torna el focus al cercle (comprovat al navegador). | Resolt (F1, 23:55): davall del cercle ja no es veu cap línia de formats. |
| **3 · Multimèdia per actor** | `DetallMultimedia.jsx`, `perfilModel.js`, `PerfilShell.jsx`, `VisorDeLArxiu.jsx` (props opcionals):<br>· Apartat «Multimèdia» per a la persona, l'organització i l'agent que es poden editar.<br>· Titularitat només per identificadors explícits: `ownerUserId`; `author_org_id`; `author_agent_id`, que el mapejador ara despulla si ve del client (correcció de la revisió).<br>· Clicar una miniatura obri el visor sencer (EXIF, resolució, data) amb «Posa com a logotip/avatar» i «Posa com a capçalera», cadascun a la columna de la seua mena.<br>· L'esborrat continua tancat per `integritatMitjans`, i una organització o un agent no en tenen mai. | Els agents no tenen cap camp d'autoria al backend: només mostren les imatges de la seua fitxa. La foto de Google no s'obri al visor (`VisorImatges` no té `referrerPolicy`). |
| **4 · `personaDeSessio.js`** | `perfilDeFila` pren només `avatar_url`; la prova de l'altra sessió s'ha invertit. | El retorn a la foto de Google des d'`identities` continua obert (F2). |
| **5 · Cens** (rol de Claude al Pla 2000) | `censImatges.js`: `2-sidebar.png` passa a EXCLOSES (fòssil), igual que les 9 targetes socials (OG) de La Torre. `censImatges.test.js`, que fallava a HEAD, ja passa. `MultimediaSection.jsx`: `key={item.id}` (Gemini A3.2). | — |

**Correcció del Mestre a mig torn (≈22:45).** Fora el `::before` amb «· » i el bloc de regles del Perfil a `src/css/components.css`. Dins del Perfil manen les regles globals de sempre: el poble, net i directe davall del nom. La prova és `src/sections/profile/PerfilShell.nomPoble.test.jsx`. El Mestre l'ha validat i ha manat no tocar més la barra ni la targeta. Comprovat després del workflow: cap regla pròpia del Perfil, i `BarraTaronja.jsx` i `UniversalCard.jsx` sense cap canvi.

**Correcció de Claude després de mirar-ho al navegador.**
- Problema: dins del Perfil, els botons d'icona del crom del visor (tancar, reduir, ampliar, informació) no tenien icona visible. El farcit de `:where(.perfil-pagina) .sdp-boto` (`PerfilShell.css`) els deixava l'SVG amb 0 px d'ample; a `/multimedia` es veien bé.
- Correcció: `.sdp-visor .sdp-visor__boto { padding: 0; }` a `src/css/modules.css`, amb prova a `src/css/relleuPla2000.capes.test.js`. Comprovat: l'SVG torna a fer 20 px.

### 2. Troballes obertes (contracte d'informe)

**F1 · La línia dels 10 MB davall del cercle de l'avatar** · **resolta** (ordre del Mestre, 23:20).
- Canvi:
  - `src/components/universal/UniversalEditorShell.jsx` té una prop opcional nova, `ajudaNomesEnPujada`. Per defecte és `false` i el DOM queda literal, comprovat contra la còpia de HEAD.
  - Amb la prop, cap ranura no pinta la línia visible en repòs: el mateix text queda només per al lector de pantalla (`.sdp-nomes-lector`), lligat al botó amb `aria-describedby`. Mentre la imatge puja, torna la línia visible «Encara s’està desant la imatge…».
  - `PerfilEditor.jsx` la passa només amb el cercle de l'avatar (persona i agent IA). L'organització no canvia.
- Proves:
  - `UniversalEditorShell.consumidors.test.jsx`: el DOM literal sense la prop (també amb ajuda buida), la descripció només per al lector i l'avís visible de cada ranura mentre puja.
  - `PerfilEditor.test.jsx`: el contracte per mena.
  - `PerfilEditor.imatges.test.jsx`: les expectatives actualitzades a propòsit, i l'organització amb la línia visible.
- Navegador: davall del cercle només hi ha [Capçalera]; la descripció existix (1×1 px, «PNG, JPEG o WebP, fins a 10 MB.»).
- Queda de la revisió, preexistent: l'avís de pujada de la capçalera no és una regió viva (`role="status"`); passava igual abans.

**F2 · Després de «Llevar avatar», la foto de Google pot tornar** · severitat **mitjana**. Coincidix amb Codex creuada §5 i Gemini creuada F6 (A1.1).
- Abast: `src/app/contexts/personaDeSessio.js:75-81` (`avatarDePersona`, `identities.google`), canvi de l'altra sessió de les 20:14.
- Evidència: `actualitzaUsuariSessio` lleva `avatar_url` i `picture` però conserva `identities`. La sonda de Codex amb `identity_data.picture` torna la foto de Google. A més, `firmaDePersona` no inclou eixa font, i `i.provider` no porta l'encadenament opcional.
- Font de veritat: «esborrar vol dir inicials» (`identitat.persistencia.test.js:220-232`) i la mateixa raó del punt 4.
- Proposta: o es lleva el retorn a `identities`, o es distingix «no triat» de «retirat expressament».
- `requires_human_decision: true`: no forma part del punt 4, i és de l'altra sessió.

**F3 · Risc latent quan es declare `integritatMitjans`** · severitat **alta, latent**. Coincidix amb Gemini creuada F3.a i Codex creuada §4.1.
- Abast: `src/sections/profile/DetallMultimedia.jsx` (`CAPACITAT_INTEGRITAT`, `confirmaEsborrat`) i `DetallMultimedia.test.jsx`.
- Evidència: avui no es pot esborrar res. Però si algú declara la capacitat al contracte, l'esborrat s'activa i crida `esborraElMeuMitja` sense cap `comprovaUsImatge`. Les proves que activen la capacitat ho fan amb un mock sense `comprovaUsImatge`: proven la bandera, no la integritat.
- Font de veritat: punt 3 del relleu («cap esborrat directe fins que el contracte de backend estiga actiu») i el contracte de Codex (§1.3–§1.4).
- Proposta (regla per a demà): no declarar `integritatMitjans` fins que, en el mateix canvi, (a) `confirmaEsborrat` cride `comprovaUsImatge` i només esborre amb `estat === 'lliure'`, (b) l'esborrat passe per l'operació protegida del servidor i (c) es tanque el DELETE directe del Storage (R2 de Codex).
- `requires_human_decision: false`.

**F4 · Miniatura de «La fitxa»: la capçalera abans que l'avatar** · severitat **mitjana**. Decisió del Mestre.
- Abast: `src/sections/profile/perfilModel.js` i `PerfilShell.jsx:82` (`doc.heroImage || avatar`).
- Evidència: és un canvi de MarIA de les 19:41 per al logotip del Rentonar, registrat a `.agents/ESTAT.md`. No el va fer este workflow, i contradiu el comentari §11 («La fitxa es queda amb l'avatar de qui és»).
- Proposta: no s'ha tocat, perquè el Mestre ha donat la targeta per bona. Si es vol només per a les organitzacions, es pot limitar a elles.
- `requires_human_decision: true`.

**F5 · Directori fantasma `socdepoble.org/~/`** · severitat **baixa**. Troballa G1 de Gemini creuada.
- Evidència: `~/Downloads/Default/{Cache,Code Cache}`, 20 KB, creat a les 22:17 en plena revisió del workflow. És gairebé segur la memòria cau d'un Chromium sense interfície llançat per un agent de Claude amb `~` literal. `git status` el mostra com a `?? ~/`.
- Proposta: el Mestre l'esborra (Claude no fa esborrats definitius) abans de qualsevol commit: `rm -rf "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/~"`.
- `requires_human_decision: true`.

**F6 · El paquet v1.1.6 no porta este treball** · severitat **mitjana**. Confirmat per Codex amb els bytes del ZIP.
- Proposta: no distribuir-lo com a estable. Fer una versió nova traçable després de confirmar el conjunt.
- `requires_human_decision: true`.

**F7 · La galeria de la persona inclou les fotos que ha pujat per a una organització o un agent** · severitat **baixa**. Troballa F2/F4 de la revisió del workflow.
- Evidència: el llistat del Storage és per carpeta d'usuari, i no sap per a qui es va pujar la foto.
- Proposta: es resol amb el `llistaMitjansActor` de Codex (titularitat al servidor).
- `requires_human_decision: true`.

### 3. Contrast amb les auditories creuades (22:56 i 23:00)

| Troballa | Posició de Claude |
| --- | --- |
| Codex F1 / Gemini 1.2-B (textos d'alta i legals) | D'acord. Les correccions de text i la política de publicació (Codex §3.3 recomana privat amb «Publicar») són decisions del Mestre. Claude no les ha tocades. |
| Codex F3 / Gemini F3.a | D'acord: és F3 d'este informe, amb la regla per a demà. |
| Codex F5 (bytes del ZIP) | D'acord: és F6 d'este informe. |
| Codex F6 / Gemini F6 (A1.1) | D'acord: és F2 d'este informe. |
| Gemini F10 / Codex F10 (botons blaus) | Mitigat dins del visor (`modules.css`). Al Perfil, ho decidix el Mestre. |
| Gemini G1 (`~/`) | Confirmat: és F5 d'este informe. |
| Panell de superadministració i commutador de rols | Fora d'este relleu: és la feina de demà, i les dues propostes (Codex §7 i Gemini BLOC 2) en són la base. |

### 4. Escaneig de seguretat (claude-security 0.12.0) i pegats

**Informe sencer:** [CLAUDE-SECURITY-RESULTS.md](02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/CLAUDE-SECURITY-RESULTS.md), amb el JSONL, el SARIF i el segell de revisió `CLAUDE-SECURITY-REVISION-1e6ffecee3e1-dirty.json` (`verification.status: verified`).

**Pegats:** [pegats/PEGATS.md](02_investigacio_ia/CLAUDE-SECURITY-20261018-220519/pegats/PEGATS.md). Tota la carpeta queda fora de git (`.gitignore` amb `*`).

**L'escaneig.**
- Abast:
  - `src/sections/profile`, `multimedia`, `mercat` i `detail`;
  - `src/data/supabase` i l'adaptador de Sollutia;
  - `backendPort.js`, `contracte.js`, `identitat.js`, `identitatsSeed.js` i `oauthRelay.js`;
  - `host.js`, `PedraSecaEmbed.jsx` i `sanitize.js`;
  - `supabase/migrations` i `supabase/snippets`.
- Paràmetres: intensitat `high`, focus «attack-surface», revisió `1e6ffece` amb l'arbre brut.
- Inventari: 257 fitxers en 11 components.
- Investigació: 81 investigadors, tots tornats.
- Verificació: un panell de 3 lents per candidat (accessibilitat, impacte i defenses), en una sola volta.
- Lectura: 129 dels 169 fitxers de component llegits fins a una conclusió. Els 40 restants són sobretot proves deixades de fons, i trams de migracions i fragments només cercats.

**Resultat: 14 troballes verificades.** Cap no és crítica ni alta: 7 són mitjanes i 7 baixes. Cap no s'ha demostrat executant res: totes surten de la lectura.

| Id | Severitat | On | Què | Pegat |
| --- | --- | --- | --- | --- |
| F1 | mitjana | `2610181915:22` | `contact_email` amb SELECT per a anon i authenticated: el correu de cada organització pública es llig sense compte. | F01 (migració 2610190100) |
| F2 | mitjana | `2609130500:17` | «mitjans llegir»: qualsevol anònim llista tot el bucket públic. | F01 (migració 2610190110) |
| F3 | mitjana | `targetaDeProducte.js:60` | Un camp objecte al payload d'un producte tomba el Mercat. | F03 |
| F4 | mitjana | `detailHelpers.jsx:5` | ReDoS quadràtic a `getFirstImage`. | F04 |
| F5 | mitjana | `storage.js:334` | `resolveAsset`: un `avatar_url` amb segments de punts desvia un POST autenticat. | F05 |
| F6 | mitjana | `PerfilPublicSection.jsx:232` | Una organització d'un altre poble amb el slug «socdepoble» es registra com el projecte. | F06 |
| F7 | mitjana | `mediaContent.js:62` | Un títol objecte al Mur tomba l'aplicació sencera, perquè el proveïdor és damunt de la frontera d'error. | F03 |
| F8 | baixa | `2610181915:68` | `contacte_organitzacio` dona el correu d'entrada de la propietària a qualsevol administradora. | F01 (migració 2610190100) |
| F9 | baixa | `MultimediaSection.jsx:40` | Un títol objecte tomba `/multimedia`. | F03 |
| F10 | baixa | `auth.js:779` | CSRF d'entrada amb un enllaç de recuperació d'un altre compte. | **Cap**: decisió autònoma, vegeu davall |
| F11 | baixa | `origenImatges.js:50` | Un veí fa passar la seua foto per obra de la IAIA. | F11 |
| F12 | baixa | `detailRichText.jsx:12` | Detecció d'HTML quadràtica. | F04 |
| F13 | baixa | `2610181915:56` | El mateix que F8, vist des de la lectura del correu. | F01 (migració 2610190100) |
| F14 | baixa | `detailSectionMeta.jsx:372` | La fitxa de compra mostra el `seller` del payload abans que l'`author_name` del servidor. | F14 |

**Aplicació (ordre del Mestre, 19-10-2026, 12:16).**
- **Aplicats a l'arbre, sense commit:** els 6 pegats de client (F03, F04, F05, F06, F11 i F14).
  - Abans, `git apply --check`: cap fitxer tocat no havia canviat des de la fotografia de la nit.
  - Després, els 20 fitxers resultants són byte a byte la versió verificada.
- **Es queden a `pegats/` per al Consell, abans de tocar el servidor:**
  - `F01_F02_F08_F13_migracions_de_seguretat.patch`: cap migració al repositori, ni executada;
  - F10, que no té pegat.

**Pegats: set fitxers, cap commit.**
- **Per què a mà.** El job «Suggest patches» del plugin rebutja un informe pres sobre un arbre brut, i només oferix fer commit o stash i tornar a escanejar. El BIOS no deixa fer cap de les dues coses a Claude. Per això s'han fet a mà, en dues còpies de l'arbre de treball al directori temporal de la sessió.
- **Proves.** Cada pegat porta proves noves que fallen sense ell (comprovat traient-lo) i passa les suites de les carpetes que toca, tot sol damunt de la base.
- **Revisió adversarial.** Un revisor independent i només de lectura per pegat, amb una ronda de revisió:
  - F04, F05, F06, F14 i el SQL: PASS, amb millores incorporades: l'espai final a F05; l'espai dur i dos llocs més a F14; les fronteres restrictives al SQL.
  - F03/F07/F09: rebutjat a la primera ronda per tres vies (`sectionId` a `/cerca`, un títol numèric a EventCard i les etiquetes al filtre del Mur). La segona versió les tanca.
  - F11: rebutjat a la primera ronda per dues vies (`srcDelPort` i el `seller` de `fotosDelMercat`). La segona versió les tanca.
- **Verificació conjunta.** Aplicats tots set damunt de la base neta, el resultat és byte a byte la còpia verificada.
- **Arbre real.** `git apply --check` dels set contra l'arbre real, en verd; cap dels fitxers que toquen no havia canviat des de la fotografia.

**El que no porta pegat:**
- **F10.** La correcció és un pas visible nou a «Definix la contrasenya nova», i la Llei del Píxel no deixa fer un redisseny sense ordre del Mestre. La proposta de disseny és a PEGATS.md. `requires_human_decision: true`.
- **La segona línia de F5 al servidor (CHECK de `profiles.avatar_url`).** Preparada i descartada: el trigger d'alta copia l'`avatar_url` de GoTrue, i un valor fora de forma faria fallar el registre.
- **Les recomanacions de servidor**, a PEGATS.md:
  - `seller` forçat pel trigger;
  - el slug `socdepoble` reservat;
  - límits de tipus i de llargària;
  - `section_id` de la columna;
  - `full_name` sense espais Unicode;
  - 2610181915 corregida a la font si encara no s'ha aplicat.

**Troballes noves dels revisors, fora de l'escaneig i sense verificar pel panell.**
- La més seriosa és un ReDoS al Cercador (`indexCerca.js:152-158` · `textPla`): `/<[^>]*>/g` amb 160.000 '<' tarda 15,8 s per a tothom que obri `/cerca`.
- **Ja té pegat (19-10, 12:58).** Una sessió pròpia ha deixat a `pegats/` els pegats `R1_R2_R4_text_pla_en_temps_lineal.patch` (`textPla`, `stripMarkdownImages` i `connexions.js`) i `R3_imatges_de_la_presentacio_en_temps_lineal.patch` (`DetallMultimedia.jsx`).
  - Estat: aplicats a l'arbre per ordre del Mestre (13:16), sense commit.
  - Revisió adversarial: PASS.
  - Verificació independent de Claude: vegeu Verificació.
- **Observacions obertes, sense pegat:**
  - `esCorreu` (`indexCerca.js:45`, i les seues còpies a `autoriaNota.js` i `certificacions.js`): quadràtica, però avui només rep noms de 120 caràcters com a molt.
  - La deduplicació d'`imatgesDeLaPresentacio`, també quadràtica.
- La resta, a PEGATS.md.

**Decisions autònomes d'esta nit (delegació del Mestre):**
1. La carpeta de l'escaneig, a `02_investigacio_ia/` amb el nom del plugin.
2. Intensitat `high` i focus «attack-surface».
3. Cap escaneig abans del reconeixement explícit del temps i dels tokens.
4. Els pegats, a mà i fora de l'arbre.
5. Cap Docker ni cap descàrrega: el SQL no s'ha executat, només s'ha verificat amb proves estàtiques i revisió.
6. F10 sense pegat, i el CHECK de servidor descartat.
7. Cap commit, cap migració aplicada i cap document de l'Escriptori mogut.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació (des de `socdepoble.org`) | Resultat |
| --- | --- |
| Suite completa `npx vitest run` (23:00–23:12) | 1.135 fitxers passats, 1 fallat i 6 omesos; 19.574 proves passades, 1 fallada i 89 omeses. La fallada és `PerfilEditor.imatges.test.jsx`, que la suite va llegir mentre Claude tenia una prova editada que després va desfer (F1). |
| Tornada a passar després de desfer-ho i de la correcció del visor: `npx vitest run src/sections/profile src/css src/sections/multimedia src/components/universal/PageFrame` | **109/109 fitxers, 1.596/1.596 proves.** |
| Després de la prop `ajudaNomesEnPujada` (F1): `npx vitest run src/components/universal src/sections/profile` | **183/183 fitxers, 2.602/2.602 proves.** ESLint net. |
| Integrador del workflow, suite completa abans de la revisió | 1.135 fitxers passats i 6 omesos; 19.558 proves passades, 89 omeses, 0 fallades. |
| `node --test` de les migracions i del lint (4 fitxers) | 56 proves: 54 passades, 0 fallades, 2 `todo` que ja hi eren. |
| ESLint `--max-warnings=0` sobre els fitxers JS/JSX del conjunt | 0 missatges (integrador i reparador; i els fitxers tocats després per Claude). |
| Portes de només lectura (vocabulari, estils en línia, `design_guard`, tokens, importacions, TDZ) | Cap violació nova als fitxers del conjunt. Les vermelles ja ho eren abans. |
| Navegador · Mercat (`/mercat/samarreta-socdepoble`, 1440 px) | Carrusel «1 / 8», H2, selector «Edició Gris Plom / Edició Verda · Esgotat». Triar la Verda canvia la foto, la descripció i la insígnia, i desactiva el botó «Esgotat · no es pot afegir al cabàs». |
| Navegador · Avatar | El cercle «Ajusta o canvia l’avatar» obri «Retalla la foto» amb la foto actual: lliscador, «Canviar foto», «Llevar avatar», formats, «Restablir», «Cancel·lar» i «Guardar enquadre». Escape torna el focus al cercle. No s'hi ha desat res. |
| Navegador · Multimèdia de Sóc de Poble | Text de titularitat, la foto del logotip, el visor amb les metadades i les accions de logotip i capçalera, sense «Elimina». Icones del crom visibles després de la correcció. |
| Porta Olivera abans de l'informe | Exit 0. |
| §4 · Escaneig claude-security (`render_report.py`) | `verification.status: verified`. 46 candidats, 16 un cop deduplicats, 48 vots i 14 troballes amb quòrum. El netejador de credencials no hi va trobar cap valor. |
| §4 · Pegats aplicats tots junts: suite completa `npx vitest run` en una còpia fora de l'arbre (base + els set pegats) | 1.138 fitxers passats, 4 fallats i 9 omesos; 19.579 proves passades, 3 fallades i 102 omeses. Els 4 fitxers fallats (`qualitat.alergens`, `qualitat.classesOrfes`, `paginaDeText`, `laParroquia`) fallen igual a la còpia sense pegats: hi falten `LICENSE` i fitxers de `_wiki_de_poble`, que no s'hi van copiar. |
| §4 · ESLint `src tooling scripts tests --max-warnings=0` amb els set pegats | Exit 0. |
| §4 · `node --test` de les migracions i del lint (7 fitxers) amb els set pegats | 133 proves: 131 passades, 0 fallades i 2 `todo` que ja hi eren. |
| §4 · Cada pegat sol, damunt de la base | F01: 963 proves. F03: 2.367. F04: 1.163. F05: 980. F06: 1.503. F11: 2.002. F14: 1.228. Totes passades, ESLint net als fitxers tocats, i en desfer el pegat la còpia torna a ser idèntica a la base. |
| §4 · `git apply --check` dels set pegats contra l'arbre real | Tots en verd. Cap fitxer tocat no havia canviat des de la fotografia, i l'arbre no s'ha modificat. |
| §4 · Aplicació dels 6 pegats de client a l'arbre real (19-10, 12:16) | `git apply` net de tots sis. Els 20 fitxers resultants són idèntics als de la còpia verificada. |
| §4 · Suite completa `npx vitest run` a l'arbre real, amb els 6 pegats (12:17–12:27) | **1.144 fitxers passats i 6 omesos; 19.638 proves passades i 89 omeses; cap fallada.** Inclou el treball sense commit dels altres agents en eixe moment. |
| §4 · ESLint `src tooling scripts tests --max-warnings=0` a l'arbre real | Exit 0. |
| §4 · `node --test tests/lint_logica_usuari.test.mjs` a l'arbre real | 19 proves: 17 passades, 0 fallades i 2 `todo` que ja hi eren. |
| §4 · Pegats R1_R2_R4 i R3 (ReDoS fora de l'escaneig), verificats per Claude a les 13:00-13:12 | `git apply --check` contra l'arbre real (amb els 6 F aplicats): tots dos s'apliquen, i cap no hi és aplicat. Dins d'una còpia de l'arbre viu, amb només les proves noves, fallen 14 de 20: `/cerca` tarda 25 s a indexar una publicació d'atac i `textPla`, 35 s. Amb el codi, 20 de 20 en verd. ESLint complet: exit 0. Suite completa: 1.147 fitxers passats; els 6 que fallen (`qualitat.classesOrfes` i cinc `tests/laboratori-*`) fallen igual sense els pegats, perquè la còpia no porta `.git` ni tot `.agents`. |
| §4 · Aplicació de R1_R2_R4 i R3 a l'arbre real (19-10, 13:16) | `git apply` net de tots dos. Els 8 fitxers resultants són idèntics als de la còpia verificada. |
| §4 · Suite completa `npx vitest run` a l'arbre real, amb els 8 pegats (13:17–13:28) | **1.148 fitxers passats i 6 omesos; 19.658 proves passades i 89 omeses; cap fallada.** ESLint complet: exit 0. |

No verificat: cap flux contra el Supabase remot, cap pujada real de retall al Storage i cap compra. Les migracions de seguretat no s'han executat contra cap base de dades.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense accés al Supabase remot. Cap migració, fragment ni regeneració de `seed.sql`. Cap commit, release ni desplegament.
- L'arbre és compartit: este informe no certifica els canvis d'altres agents (MarIA, Gemini, Codex) ni els posteriors a les 23:15.
- La barra taronja i la targeta del Perfil no s'han tocat després de la validació del Mestre.
- Claude no escriu a `.agents/` (ESTAT, LEDGER) ni mou documents de l'Escriptori. El tancament del torn `torn_7fc20280-109a-449c-bf03-44468881020d` és de MarIA o del Mestre.
- Cap cron ni cap tasca programada creats.
- §4: l'escaneig és una lectura de codi, i el panell vota sobre l'abast declarat. No és una prova d'absència de vulnerabilitats fora d'eixe abast ni dels 40 fitxers que els investigadors no van llegir sencers. L'arbre porta aplicats, sense commit, els 6 pegats de client (des del 19-10 a les 12:16) i els dos de ReDoS, R1_R2_R4 i R3 (des de les 13:16). El pegat SQL (F01) i F10 esperen la revisió del Consell, i cap migració de seguretat no és al repositori ni s'ha executat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2000_prompt_claude_gemini_capacitats_matrix_i_poda]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [[261018_2030_auditoria_codex]]
- [[261018_2030_auditoria_gemini]]
- [[261018_2045_auditoria_claude]]
- [[261018_2256_auditoria_codex_creuada_claude_i_superadministracio]]
- [[261018_2300_auditoria_creuada_claude_i_superadmin_gemini]]
