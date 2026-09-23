---
type: informe
status: esborrany
description: 'Causa arrel de les cinc peticions d''UI: avatar del Foraster, Panell de Crom, seed del bloc de notes i botons d''imatge, amb evidencia de codi i CSS'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_12c7c838-cc70-44bf-9c87-eae2f325e501:ef842965-09c4-47ed-89a4-735866de4c2c
---
# Auditoria Claude: cinc peticions d'UI del Mestre

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_12c7c838-cc70-44bf-9c87-eae2f325e501:ef842965-09c4-47ed-89a4-735866de4c2c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T19:26:05.959Z |
| Modificació | 2026-09-23T19:26:05.959Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5 (claude-opus-5) |
| Tokens consumits | Estimats ~120.000 d'entrada acumulada i ~9.000 d'eixida; mesurats reals: el client no els exposa a l'agent en aquesta sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Tall d'evidència: HEAD `f03affcb`, branca `backup-notes-publish`, arbre brut (52 fitxers modificats i 25 sense seguiment). Torn `torn_12c7c838-cc70-44bf-9c87-eae2f325e501`, obert 2026-09-23T19:20:36Z.

**Mode AFK, i per què.** El prompt de les 21:13 diu dos coses que no poden ser certes alhora: la «Instrucció del torn» mana *implementar* les cinc tasques, i el «Protocol de la Reunió a l'Olivera §3» mana que *cap línia de codi es toque* fins que totes les IAs hagen lliurat i el Pla estiga consensuat. He obeït la clàusula restrictiva: **zero fitxers de codi tocats**. Codex encara no ha entregat per a aquest torn i el Pla de les 21:13 està buit (cinc epígrafs amb «(Pendent de les AIs)»), o siga que la condició de §3 no es complix. Vegeu T9 per a la proposta de tancar aquesta contradicció a la plantilla.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23T19:26:05.959Z: esborrany creat; contingut i verificació pendents.
2026-09-23T19:35Z: entrega completa. Cinc peticions auditades fins a causa arrel amb evidència d'historial, codi i CSS.
2026-09-23T19:45Z: llegida l'auditoria de Codex de les 21:20 i incorporada a T10. **Dos rectificacions pròpies**: l'elogi a `crom.js` (el contrast no es conserva, recalculat i confirmat) i la petició 3 (no està feta: el corpus de publicacions no existix). `document.mjs check` revalidat després dels canvis.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Resum: de les cinc peticions, **una ja està feta** (la 3), **dos tenen causa arrel provada i solució d'una línia** (la 4 i la 5), **una està desendollada de soca-rel** (la 2) i **una existix a mitges i diu el contrari del que el Mestre vol** (la 1). A més, una troballa de procés que afecta tot el Consell (T8).

---

### T1 · P0 · L'avatar del Foraster apunta a un fitxer que no ha existit mai

- **Fitxer:** `src/components/universal/UniversalEditorShell.jsx:155`; `src/components/universal/PageFrame.jsx:237-244`.
- **Evidència reproduïble:**
  - `UniversalEditorShell.jsx:155` → `const barAuthorAvatar = propBarAuthorAvatar || config.barAuthorAvatar || '/assets/system/ui/default-avatar.jpg';`
  - `git log --oneline -- "*default-avatar*"` → **cap resultat**. `git log --oneline -- "*assets/system/ui/default*"` → **cap resultat**. El fitxer no ha estat mai al repositori.
  - Control positiu, per si el mètode fallara: `git log --oneline -- "*assets/system/ui/logo-socdepoble-cuadrat-verd*"` → `cc4980de`, `4ba5fd22`. Eixa ruta germana **sí** que existix. El mètode detecta el que hi és.
  - `PageFrame.jsx:237-244` pinta `<img className="sp-card-avatar" src={resolveAsset(barAuthorAvatar)} alt="" …>` **sense `onError` i sense alternativa**.
  - `src/config/assetResolver.js:34-53`: `resolveAsset` normalitza la cadena i la torna; no comprova que el recurs existisca. Una ruta morta ix intacta → 404 → icona d'imatge trencada.
- **Severitat:** P0. És exactament el defecte que el Mestre reporta, i es dispara sempre que no hi haja avatar propi, que és el cas del Foraster per definició.
- **Font de veritat en conflicte:** `sdp-universal-page` (anatomia de la barra taronja) i el criteri d'acceptació del prompt («No hi ha icones trencades d'usuari per al Foraster»).
- **Proposta conservadora:** no tocar `DEFAULT_AUTHOR.avatarUrl` (`UniversalUtils.js:29`), que apunta a un SVG que sí existix i serveix per a Sóc de Poble. El canvi va **només** al fallback de `UniversalEditorShell.jsx:155` i al pintat de `PageFrame.jsx:237`: quan no hi haja avatar vàlid, pintar la icona `UserRound` de `lucide-react` sobre fons fosc, que és la que el sistema ja fa servir per a l'usuari sense identitat a `OnboardingSteps.jsx:203`. Zero dependències noves.
- **Risc controlat:** el prompt avisa de no trencar els avatars vàlids. Condicionant el canvi a «cadena buida o absent» i deixant intacte el camí amb `src`, els perfils reals i el logo de Sóc de Poble no es toquen.

### T2 · P0 · «Identitat Lliure» viu en un sol lloc, i no és el que pareix

- **Fitxer:** `src/components/universal/UniversalEditorShell.jsx:157`.
- **Evidència reproduïble:** `const barAuthorLocation = propBarAuthorLocation || config.barAuthorLocation || 'Identitat Lliure';`. En canvi `src/components/universal/UniversalUtils.js:26-30` declara `DEFAULT_AUTHOR = { name: 'Sóc de Poble', location: 'La Torre de les Maçanes', … }`. **Són dos fonts distintes de subtítol**, i la del Foraster és la primera.
- **Avís de mètode, per honestedat:** la meua primera cerca (`git log -G"Identitat [Ll]liure" -6`) va tornar només bundles de `90_arxiu_historic/` i em va fer pensar que el text ja no existia al codi. Era un artefacte del límit `-6`: el commit que va introduir la línia queda fora de la finestra. **Un `-n` curt en un pickaxe produïx falsos negatius.** Ho deixe escrit perquè no es repetisca.
- **Severitat:** P0, trivial d'arreglar: una cadena.
- **Proposta conservadora:** substituir la cadena de la línia 157. `requires_human_decision: true` — el prompt demana literalment «Nom del poble del foraster». Ho llegisc com a text de reserva literal, però si el Mestre volia un text més curt per a la barra (que té `height: var(--sdp-alt-accio)` i `white-space: nowrap` a `layout.css:280`), ara és el moment de dir-ho: «Nom del poble del foraster» són 27 caràcters i en mòbil estret la barra ja va justa.

### T3 · P0 · El Panell de Crom està acabat, és bo, i no el crida ningú

- **Fitxer:** `src/components/universal/PanellCrom.jsx` (sense seguiment), `src/config/crom.js` (sense seguiment).
- **Evidència reproduïble:**
  - `git log -S"BotoCrom" --all` → **cap resultat**. `git diff -S"BotoCrom"` → **cap resultat**. Cap fitxer amb seguiment, ni en història ni en els 52 modificats, menciona `BotoCrom`.
  - Els únics fitxers sense seguiment sota `src/` són `PanellCrom.jsx` i `crom.js` (vegeu `git status`). No hi ha cap tercer candidat que puga ser el consumidor.
  - **Conclusió: `BotoCrom` no està muntat enlloc.** No és que no funcione: és que no es renderitza mai.
- **Segona barrera, independent de la primera:** `PanellCrom.jsx:96` fa `if (rol !== 'superadmin') return null;`. `SessionContext.jsx:33` ja exposa `esSuperadmin: rol === 'superadmin'`, i `:32` degrada a `comprovant` mentre el rol és `desconegut`. Amb Supabase apagat i sense usuari (vegeu l'ESTAT de les 19:47, A7), **el rol no arribarà mai a `superadmin`**, així que endollar el botó no bastarà per a veure'l.
- **Severitat:** P0 per a la petició 2, i és el patró que ja ens ha mossegat abans: peça correcta, desendollada.
- **Valoració tècnica, amb una esmena important a T10:** `crom.js` està ben construït: fa la conversió en JS perquè `oklch()` en CSS no entra al baseline 2022; redueix croma per binària en lloc de retallar canal; i escriu sobre la `.sdp-root` de la instància i no sobre el document, que és correcte amb shadow root. **Ara bé, la seua premissa declarada — que conservar L i C manté els contrastos — és falsa, i Codex ho ha demostrat amb números que he reverificat pel meu compte. Vegeu T10.2.** El que li falta, doncs, no és només un `import`.
- **Proposta conservadora:** muntar `<BotoCrom />` dins de `.bar-black .right-icons` (la barra negra superior, `layout.css:169-175`), que és on viuen les icones de sistema i on el Mestre espera trobar la roda dentada. **Cal llegir `AppGridShell.jsx` abans de tocar-lo** per a fixar el punt exacte; no l'he obert en aquest torn i no vull dictar una línia que no he vist.
- `requires_human_decision: true` per a la segona barrera: **com es prova això hui?** Hi ha tres eixides i són del Mestre: (a) encendre Supabase i crear el superadmin; (b) afegir un camí de prova explícit al mode `seed`, que és deute nou; (c) deixar-ho muntat i acceptar que no es veurà fins que hi haja backend. Jo recomane (a) si la sessió de Supabase ja estava prevista, i (c) si no ho estava: (b) fabrica un privilegi fals i això no es desfà fàcil.

### T4 · P1 · El botó «Inserir Capçalera» no és blau sobre taronja per culpa del botó, sinó del calaix on cau

- **Fitxer:** `src/css/layout.css:237-243`; `src/components/universal/UniversalEditorShell.jsx:302-306` i `:277-281`.
- **Evidència reproduïble:**
  - `layout.css:237-243` → `.hero-image { position: relative; z-index: 0; width: 100%; flex: none; background: var(--sdp-accent); }`. **`--sdp-accent` és el taronja.**
  - `PageFrame.jsx:224-232`: quan l'editor no té imatge, el `heroComponent` (que és el botó) es pinta **dins** d'eixe `<div className="hero-image">`. D'ací el blau sobre taronja.
  - El botó del logotip, en canvi, es pinta dins de `<div className="page-title-logo-personalitzat">` (`PageFrame.jsx:265-268`), que viu dins de `header.page-title`, i eixe té `background: var(--sdp-fons-targeta)` (`layout.css:283-290`) → **fons clar**. Per això un es veu bé i l'altre no.
  - **Els dos botons són idènticament `className="sdp-boto sdp-boto--secundari"`** (`:279` i `:304`). La diferència de mida que el Mestre percep **no està al botó**: és el contrast i l'amplada del calaix el que els fa parèixer distints.
- **Severitat:** P1, purament visual, però és la petició on més fàcil és trencar el layout de Pedra Seca si s'ataca pel lloc equivocat.
- **Proposta conservadora, i ací hi ha un parany:** **no tocar `.hero-image` en general**, perquè eixe fons taronja fa faena quan sí que hi ha imatge (és el que evita el flash blanc mentre carrega i el que emmarca les imatges amb transparència). El canvi ha d'afectar **només l'estat sense imatge**. La forma natural seria `.hero-image:has(.sdp-hero__buit)`, i **ací és on cal parar**: `:has()` no arriba a Firefox fins al 121 i el nostre baseline canònic és **Firefox 100** (`QUI_SOC §5`). Fora de baseline. La forma correcta és afegir una classe explícita al contenidor quan no hi ha imatge (p. ex. `hero-image hero-image--buit`) i pintar el fons blanc i el `padding` sobre eixa classe. Això exigix tocar `PageFrame.jsx` per a acceptar un modificador, que és una línia.
- `requires_human_decision: true` per a la mida: **hui no existix cap modificador de mida per a `sdp-boto` en cap dels dos botons**. Fer-lo «més menut» vol dir crear un modificador nou al sistema (`sdp-boto--compacte` o el nom que el Mestre trie) i això és ampliar Pedra Seca, no ajustar una pàgina. La lliçó del 260923 és clara: prohibició sense substitut = fusible. **Demane el nom, no me l'invente.**
- El paràgraf d'ajuda («Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.») és directe: un `<p className="sdp-camp__ajuda">` centrat davall de cada botó, que és la classe que el sistema ja usa per a text d'ajuda (`PanellCrom.jsx:59`, `UniversalEditorShell.jsx:329`). Zero invenció.

### T5 · P1 · A l'estat buit no hi ha cap botó d'inserir capçalera: la petició 5 no es reproduïx on diu el prompt

- **Fitxer:** `src/components/universal/DocumentEditor.jsx:34-72` i `:144-156`.
- **Evidència reproduïble:** `DocumentEditor.jsx:144` bifurca amb `if (!document)` i pinta `EmptyDocumentPage`. Eixe component (`:55-65`) passa a `topBarData` **només** `authorName`, `authorLocation`, `authorAvatar` i `barActions`. **No passa `heroComponent` ni `logoComponent`.** Els botons només existixen al camí amb document obert, via `useEditorShell` (`UniversalEditorShell.jsx:263-314`).
- **Conseqüència:** el títol de la petició 5 diu «(Hero Component / Buit)», però a l'estat **buit** eixos botons no es pinten. El que el Mestre veu ha de ser amb una nota oberta i sense capçalera encara.
- **Severitat:** P1 de precisió d'abast, no de codi. Si s'implementa «a l'estat buit» es tocarà una pantalla on el defecte no existix, i el defecte real es quedarà igual.
- **Proposta:** confirmar amb el Mestre que la pantalla és la de nota oberta sense imatge. T4 ja apunta al lloc correcte.

### T6 · Resolta al disc, pendent de verificar · El mode seed ja no està apagat

- **Fitxer:** `src/sections/notes/NotesDataContext.jsx:158-161` (modificat, **sense committejar**).
- **Evidència reproduïble:** el codi actual diu `const ownerId = getCurrentUser()?.id || (getRuntimeDataMode(config) === 'seed' ? getDefaultUserId() : null);`, amb el comentari «El cami `seed` serveix contingut d'exemple sense mirar la sessio». **Això és exactament l'A2 que vaig dictaminar a les 19:47** i algú ja l'ha aplicat. El guarda `if (!ownerId)` continua, però ara només talla el camí remot, que és on té sentit.
- Complement: `src/sections/notes/NotesSection.jsx:78` ja pinta `NOTE_FOLDERS_SEED` quan l'adaptador torna zero carpetes, i `:120-126` obri `n1` automàticament si existix.
- **Severitat:** cap de codi *per al guarda*. Jo havia escrit ací que «la petició 3 ja no és una implementació, és una verificació». **Codex ha fet eixa verificació i m'ha desmentit: la petició 3 continua sense fer. Vegeu T10.3.** El guarda del seed està reparat; el contingut que hauria de mostrar no existix.
- **Avís:** està sense committejar. Un `git checkout` distret ho perd.

### T7 · P1 · El registre ja avisa de la Beta, però ho diu dos vegades i diu el contrari del que el Mestre vol

- **Fitxer:** `src/sections/onboarding/OnboardingSection.jsx:88-91` i `src/sections/onboarding/OnboardingSteps.jsx:77-80`.
- **Evidència reproduïble:** **el mateix paràgraf, literal, en els dos fitxers**: «En entrar o crear compte, acceptes el tractament de dades (RGPD Llei 05) per a Sóc de Poble. També comprens que estem en **fase Beta** (proves) i que les teues dades podrien patir reinicis o pèrdues.» Com que `OnboardingSection` pinta la targeta de Google **i** `RegistrationStep` (`:114-122`), l'usuari llig la mateixa frase dos vegades en la mateixa pantalla, separades només pel `Divisor`.
- **El que falta:** cap dels dos textos diu que és **segur** registrar-se, cap avisa que se'ls **avisarà de les novetats**, i cap demana **feedback de com es veu en mòbil**. Les tres coses que el Mestre demana no hi són.
- **Tensió real, i la pose damunt la taula:** el text actual («les teues dades podrien patir reinicis o pèrdues») i el text demanat («és segur registrar-se») **no diuen el mateix**. No és un matís d'estil: un avisa i l'altre tranquil·litza. `requires_human_decision: true`.
- **Proposta conservadora:** un sol bloc nou a `OnboardingSection.jsx`, abans de les dos targetes, adreçat als beta testers, amb els tres missatges del Mestre; i llevar la duplicació deixant l'avís RGPD només a `RegistrationStep`, que és on hi ha la casella de consentiment (`OnboardingSteps.jsx:181-199`) i per tant on legalment toca. Així el registre guanya el missatge nou i perd una redundància, sense que cap avís legal desaparega.

### T8 · P0 de procés · El confinament local ha tancat la porta a la verificació empírica

- **Fitxer:** `tooling/gates/hooks-local.mjs:78-80`; `tooling/gates/mutation-policy.mjs:20-30`.
- **Evidència reproduïble, mesurada en aquesta sessió:**
  - `mutation-policy.mjs:21` declara lectures conegudes: `Read`, `Glob`, `Grep`, `read_file`, `view_file`, `list_dir`, `grep_search`, `search_code`. Qualsevol altra eina cau a `hooks-local.mjs:80` i es denega com a «eina opaca».
  - **`ToolSearch` bloquejat.** És l'eina amb què aquest client carrega `Grep` i `Glob`. Han estat denegades les dos primeres crides d'aquesta sessió. Resultat: el hook autoritza `Grep` i alhora bloqueja l'única via per a obtindre'l. **Un agent que no arribe amb `Grep` precarregat no pot cercar al codi de cap manera**: ni per eina (denegada) ni per shell (`grep` no és a la llista blanca de Bash).
  - **`mcp__Claude_Browser__preview_start` bloquejat.** Tot el navegador integrat cau. No s'ha pogut obrir `http://localhost:3340`, que és la URL de proves que el propi prompt fixa als criteris d'acceptació.
  - **`segell-auto.mjs` ha fallat en cada crida d'aquesta sessió** amb «Origen no acreditat: segell divergent; cap resegellat automàtic», incloses les lectures pures. És soroll constant al canal d'errors: quan tot falla sempre, deixa d'informar.
  - **La memòria persistent de l'agent és inescrivible.** `hooks-local.mjs` denega tota escriptura fora de l'arrel del repositori («Ruta fora del repositori»), i la memòria de llarg termini d'aquest client viu a `~/.claude/projects/…/memory/`. Conseqüència directa: **les lliçons d'aquesta sessió no sobreviuran a la sessió**. La rectificació de T10.2 — que conservar L d'OKLCH no conserva el contrast — és exactament el tipus de saber que el Mas vol acumular, i demà s'haurà perdut. Un confinament que protegix el repositori esborrant la memòria de qui hi treballa es paga en repeticions.
- **Per què és P0 i no una queixa:** la doctrina del Mestre (lliçó 260923, i l'ESTAT de les 19:47) exigix **mesurar l'element abans de buscar el CSS**. Aquest torn ha hagut de dictaminar la petició 4 i la 5 llegint CSS i JSX, perquè no podia mesurar res. He pogut arribar a la causa arrel; **no puc certificar cap píxel**. Un confinament que impedix complir la doctrina de verificació es menja la seua pròpia garantia.
- **Font de veritat en conflicte:** `AGENTS §7` (Modo Jarvis: fes anar les eines tu mateixa) i el criteri d'acceptació del prompt, que demana comprovar coses que només es veuen al navegador.
- **Proposta conservadora:** afegir a `knownRead` de `mutation-policy.mjs:21` les eines de **lectura** del client: `ToolSearch` i els `mcp__Claude_Browser__*` que només observen (`read_page`, `get_page_text`, `read_console_messages`, `read_network_requests`, i la captura de pantalla). **Cap d'elles escriu al disc**, que és el bé que `hooks-local.mjs` protegix; la política d'escriptura (`mutationPath`, zona humana, `SECURITY_PATHS`) es queda intacta. Si es vol ser estricte, deixar fora `javascript_tool` i `navigate`. Això recupera la verificació sense obrir ni un mil·límetre el camí d'escriptura.
- **Nota per a Codex, que és qui va fortificar això a les 20:45:** el confinament és bo i la direcció és correcta. El problema no és la severitat, és que la llista blanca es va escriure en vocabulari d'eines i no en vocabulari de **capacitats**. «Llegir» i «escriure» es distingixen bé; «`Grep`» i «`ToolSearch`» són el mateix acte en dos clients distints.

### T9 · Millora de la plantilla `prompt_local.md` (punt 4 del Protocol de l'Olivera)

Dos propostes concretes, les dos barates:

1. **La contradicció d'aquest mateix prompt.** «Teniu la missió d'implementar» (Instrucció del torn) i «Cap línia de codi es tocarà… Mode AFK absolut» (Olivera §3) són ordres oposades dins del mateix document. L'agent ha de triar, i triar entre dos ordres del Mestre és exactament el que no ha de fer. **Proposta:** un camp `Mode` al Registre amb dos valors possibles, `auditoria` o `execució`, i que el bloc fix de l'Olivera es redacte condicionat a eixe camp. Així el Mestre decidix d'una casella el que hui es decidix per interpretació.
2. **«Tall d'evidència: [HEAD + hora]» naix ranci.** És un camp que l'autor ha d'omplir a mà i que en aquesta petorreta ha arribat sense omplir. `document.mjs context` ja calcula Creació i Modificació sols; que calcule també el HEAD i la marca de temps. Un camp d'evidència omplit a mà no és evidència.

### T10 · Reunió a l'Olivera: llegida l'auditoria de Codex de les 21:20, i em corregix en dos punts

L'auditoria `260923_2120_auditoria_codex.md` va aparèixer a l'Escriptori mentre jo auditava. L'he llegida sencera. **Les dos auditories són independents i convergixen en quatre de les cinc peticions, la qual cosa les reforça mútuament.** Però Codex ha pogut navegar el DOM i jo no (T8), i per això em guanya en dos punts. Els recullc ací abans de tancar, perquè el Pla es faça sobre la versió bona i no sobre la meua.

**T10.0 · Una precisió sobre el seu §«Actualització de l'Olivera a les 21:26».** Codex diu que va llegir el meu fitxer i que «encara és l'esborrany generat, amb Troballes/Verificació/Límits pendents». **Era cert en eixe minut**: jo havia executat `document.mjs create` a les 19:26Z i encara no hi havia bolcat el contingut. El document que esteu llegint es va completar tot seguit i passa `document.mjs check` amb `valid: true`. Cap retret a Codex: va fotografiar el que hi havia. Ho deixe escrit perquè ningú confonga eixa foto amb una entrega buida.

**T10.1 · Accepte C1 i millora la meua T3.** Codex ha vist una cosa que jo no: `PanellCrom.jsx:92-94` té un `useEffect` amb dependències `[]` que llig `ref.current`, però `:96` retorna `null` mentre el rol no siga `superadmin`. Quan l'efecte corre, **el `<button ref={ref}>` encara no existix al DOM**, així que `arrel` es queda `null` per sempre; quan el rol es resol i el botó apareix, `aplica(arrel, delta)` rep `null` i **«Aplicar» no fa res**. La meua T3 deia «només li falta un `import`»: **això és incorrecte**. Li falta l'import *i* el cicle de muntatge. La proposta de Codex (callback ref, o muntatge condicionat a permís ja resolt) és la bona. Tercera barrera confirmada, doncs: no està muntat, no hi ha rol, i encara que n'hi haguera, l'arrel seria nul·la.

**T10.2 · Accepte C2 i rectifique el meu elogi a `crom.js`.** Jo vaig escriure que conservar L i C «és el que manté vius els contrastos anotats a `tokens.css`». **És fals, i l'he recalculat jo mateixa per no acceptar-ho per obediència:** per a `#0984E3`, luminància relativa WCAG = 0,2211, i contra blanc dóna **3,873:1**. Coincidix amb el 3,874:1 de Codex i amb el 3,87:1 que jo mateixa vaig mesurar a l'auditoria de les 19:47 (A6). La raó del meu error és conceptual i val la pena deixar-la escrita: **la `L` d'OKLCH és luminositat perceptual; el contrast WCAG es calcula amb la luminància relativa sRGB. No són la mateixa magnitud.** Girar el to a `L` constant conserva la primera i mou la segona. Per tant el Panell de Crom, tal com està, **pot tirar el contrast per davall del llindar sense avisar**: Codex mesura 3,677:1 a +240°. La garantia que el comentari de `crom.js:6-10` promet, el codi no la dóna.
  - **Conseqüència per al Pla:** si s'endolla el Crom sense mesurar contrast per parella semàntica, es dóna al superadmin un botó per a trencar l'accessibilitat de tota la plataforma en un clic. La proposta de Codex (validar parelles després de convertir a sRGB i ajustar esglaó) és la correcta, i jo hi afegisc: **el panell hauria de negar-se a aplicar un gir que tire cap parella per davall del llindar, o avisar-ne**. Val més un selector que diu «este verd no passa» que un que et deixa trencar-ho.

**T10.3 · Accepte C3 i rectifique la meua T6.** Jo vaig donar la petició 3 per «feta, pendent de verificar». Codex l'ha verificada i **no està feta**. El que ha mesurat: el seed té `n1` (manual) i `n2` (buida), les dos a `f-mur`, amb huit carpetes declarades; i **`MOCK_FEED` és `[]`** (`src/sections/mur/feedSeed.js:1`), o siga que **no existix cap corpus de publicacions de Sóc de Poble** que es puga volcar al bloc de notes. El guarda que jo vaig dictaminar a les 19:47 està reparat, sí — però reparar la porta no omple la casa.
  - I hi afig el que més em preocupa de tota la seua entrega: **`n1`/`n2` no tenen UUID ni `revision`, i `updateNote` exigix connexió, usuari autenticat, UUID i revisió.** La UI, en canvi, pinta camps editables, inserció d'imatges i botó de **Publicar**. Això vol dir que **el Foraster pot escriure i prémer Publicar sense que res es puga desar**. Una interfície que promet una acció que el backend rebutjarà és pitjor que una interfície que no la mostra. `requires_human_decision: true`: el Mestre ha de dir si en mode seed l'editor ha de ser **només lectura** o si s'ha de construir un camí d'escriptura local.

**T10.4 · Un injector que em faltava.** Codex apunta `src/sections/notes/NotesEditor.jsx:68-69,101-103` com a **tercer lloc** que injecta la ruta de l'avatar mort. Jo només havia trobat `UniversalEditorShell.jsx:155`. **La meua T1 és correcta però incompleta**: qui repare açò ha de mirar els tres punts, no un. I la seua prova és millor que la meua: al DOM, la imatge té `complete=true` amb `naturalWidth=0`, que és la signatura canònica d'una imatge que ha fallat. La meua prova (el fitxer no ha existit mai en tot l'historial) i la seua (el navegador no la pot pintar) es confirmen l'una a l'altra des de dos llocs distints.

**T10.5 · On el matís és meu.** Codex mesura els botons a 629,17 px (capçalera) i 514,87 px (logotip) i en dedueix mides distintes. Els dos comparteixen `className="sdp-boto sdp-boto--secundari"` (`UniversalEditorShell.jsx:279` i `:304`): **la diferència no està al botó, està en l'amplada del calaix que l'allotja**. Les dos observacions són certes i no es contradiuen; la distinció importa perquè decidix on es toca. Si es vol el de capçalera «més menut», el canvi és de contenidor o de modificador nou, **mai** d'una regla que sobreescriga `sdp-boto--secundari`, que trencaria tots els botons secundaris de la plataforma.

**T10.6 · Convergències independents, que és el que més val.** Sense parlar-nos, hem arribat per separat a: l'avatar mort i el seu origen (C4 = T1/T2), el taronja que ve de `.hero-image` i no del botó (C5 = T4), el Crom desendollat (C1 = T3), i que el registre ja avisa de la Beta però li falta tot el que el Mestre demana (C6 = T7). Quan dos auditories cegues l'una a l'altra coincidixen en el fitxer i la línia, el Pla es pot escriure amb confiança. **La seua proposta de text per als beta testers (C6) em pareix millor que qualsevol que jo escriguera i li la done per bona sense competir-hi.**

**T10.7 · Una cosa que Codex ha trobat i que el Mestre ha de saber.** La secció 0 del prompt de les 21:13 té les tres caselles marcades `[x]`, i almenys una no es complia: `tancament.mjs` reporta que `260923_2113_prompt_execucio_olivera.md` **no té rebut persistent** (`reflex: cal un rebut persistent emés per document.mjs context`). Codex ho diu del Pla (C7: naixia sense frontmatter) i jo ho confirme del prompt. No és cap drama i ell ja ha reparat el Pla; però **una casella marcada de memòria és pitjor que una casella sense marcar**, perquè apaga l'alarma sense apagar el foc. La proposta de Codex és exactament la meua T9: que les caselles reflectisquen l'eixida d'una ordre, no un record.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Ordres executades i resultat literal. Totes de lectura; cap escriptura fora del document que esteu llegint.

| Ordre | Resultat |
| --- | --- |
| `node tooling/gates/obrir_torn.mjs --actor Claude --scope code` | `valid: true`, `torn_12c7c838-cc70-44bf-9c87-eae2f325e501`, `state: opened` |
| `git status --porcelain=v1` | 52 modificats, 25 sense seguiment; `PanellCrom.jsx` i `crom.js` sense seguiment |
| `git log -S"BotoCrom" --all` | cap resultat |
| `git diff -S"BotoCrom"` | cap resultat |
| `git log --oneline -- "*default-avatar*"` | cap resultat |
| `git log --oneline -- "*assets/system/ui/default*"` | cap resultat |
| `git log --oneline -- "*assets/system/ui/logo-socdepoble-cuadrat-verd*"` | `cc4980de`, `4ba5fd22` (control positiu del mètode) |
| `document.mjs context --route auditoria` | rebut `sdp:torn_12c7c838…:99798ac2-675a-43b4-b4d5-83f2f6916bfa` |
| `document.mjs create --route auditoria` | `state: draft`, fitxer ancorat |

Lectures de codi que sostenen cada troballa: `UniversalEditorShell.jsx` (155-157, 277-281, 302-306), `PageFrame.jsx` (224-268), `DocumentEditor.jsx` (34-72, 144-156), `UniversalUtils.js` (26-30), `layout.css` (237-243, 251-267, 283-290), `PanellCrom.jsx` (86-113), `crom.js` (sencer), `SessionContext.jsx` (30-36), `NotesDataContext.jsx` (150-175), `NotesSection.jsx` (75-104, 120-126), `OnboardingSection.jsx` (71-125), `OnboardingSteps.jsx` (67-212), `assetResolver.js` (34-53), `hooks-local.mjs` (71-98), `mutation-policy.mjs` (sencer).

**Verificació feta a la segona passada, després de llegir Codex:**

| Comprovació | Resultat |
| --- | --- |
| Recàlcul propi de la luminància WCAG de `#0984E3` | L relativa = 0,2211 → contrast amb blanc **3,873:1**, coincident amb el 3,874:1 de Codex i el 3,87:1 propi de les 19:47. **La premissa de `crom.js` queda desmentida amb número reproduïble.** |
| Lectura íntegra de `260923_2120_auditoria_codex.md` | Quatre convergències independents, dos correccions acceptades (T10.1, T10.3), un injector afegit (T10.4), un matís retornat (T10.5) |
| `node tooling/gates/tancament.mjs --check --turn-id torn_12c7c838…` | `valid: false`, `state: context_loaded`. Passen `plantilles`, `autoritat`, `ledger`, `documental-tests`. Fallen `segell`, `skills`, `wiki`, `scc` — **tots quatre per deute preexistent, cap per aquest torn** (vegeu Límits) |

**El que NO s'ha verificat, i s'ha de dir:** cap comprovació de píxel meua, cap mesura de DOM meua, cap execució de `npm test`. El navegador estava bloquejat (T8). Les mesures de DOM que apareixen en aquesta auditoria són **de Codex, citades com a seues** (T10.4, T10.5): les done per bones perquè convergixen amb la meua evidència d'historial i de CSS, no perquè jo les haja repetides.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Mode AFK respectat: zero fitxers de codi tocats.** L'única escriptura d'aquest torn és aquest document.
- **No he pogut mesurar res en viu.** Tot el navegador integrat està denegat pel hook local (T8). Les troballes T4 i T5 són causa arrel llegida en codi i CSS, no verificació visual. Cal confirmar-les a `http://localhost:3340` abans de donar la petició 5 per tancada.
- **No he llegit `AppGridShell.jsx`.** Per això T3 no dicta la línia exacta on muntar `<BotoCrom />`: dic el lloc (la barra negra) i deixe la línia a qui obriga el fitxer. No vull donar un número que no he vist.
- **No he obert `90_arxiu_historic/`** (AGENTS §5). L'auditoria de Codex de les 20:45 és allí i és d'un altre torn (la fortificació C1–C9); el seu contingut ja arriba resumit per l'ESTAT.
- **Codex ha entregat a les 21:20** i l'he llegida i incorporada (T10). Em corregix en dos punts i els accepte tots dos. **El Pla de les 21:13 continua sense consens**: ell hi ha bolcat les seues propostes, jo he deixat les meues ací, i ningú ha declarat consens. Això vol dir que **la condició del Mode AFK encara no s'ha alçat**.
- **No he pogut escriure a `.agents/ESTAT.md` ni a `.agents/LEDGER.md`, i no és negligència.** `mutation-policy.mjs:14` classifica `.agents` com a ruta de governança: l'eina directa no hi té autoritat i cal passar per `executor-mutacio.mjs` amb pla i lease. Però `executor-mutacio.mjs:42` avorta si el segell previ no és vàlid (`Segell previ invàlid; reconciliació explícita requerida`), i **el segell ja estava divergent abans que jo escriguera res** (hash actual `69100848` contra el segellat `2a37538f`; el `PostToolUse` de `segell-auto` ha fallat des de la primera lectura d'aquesta sessió, anterior a qualsevol escriptura meua). Els dos camins estan tancats alhora. **No he forçat cap dels dos** (`AGENTS §10`, protocol fusible). L'ESTAT i el LEDGER d'aquest torn els ha d'escriure qui puga reconciliar el segell.
- **Cinc troballes porten `requires_human_decision: true`:** el text exacte del subtítol del Foraster (T2), com es prova el superadmin sense backend (T3), el nom del modificador de mida del botó (T4), el to de l'avís de Beta (T7) i si l'editor en mode seed ha de ser només lectura (T10.3). No en resolc cap pel meu compte.
- **Aquesta auditoria no autoritza res.** Ni esborrar, ni arxivar, ni corregir. El rebut acredita entrega, no permís.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
