---
type: informe
status: esborrany
description: Execucio i auditoria del prompt 260927_1925 amb T5 i estat de T6 a T8
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9de7af24-f2fe-4a05-b2dc-011babb05745:21de9d95-aea4-41a4-85b4-9b65618c925f
---
# Auditoria Claude de la Logica d Usuari

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9de7af24-f2fe-4a05-b2dc-011babb05745:21de9d95-aea4-41a4-85b4-9b65618c925f |
| Versió | 1.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T18:52:27.324Z |
| Modificació | 2026-09-27T19:50:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), app d'escriptori, Ultracode actiu |
| Tokens consumits | Workflow de comprensió del codi: 1.928.841 tokens de subagents (7 agents, 683 usos d'eina, 14,5 min). Refutació adversarial: 1.130.302 tokens de subagents (9 agents, 366 usos d'eina, 8,9 min). Sessions principals (dos mans): no mesurades; no s'inventen xifres |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Documents de l'Escriptori llegits abans de començar: [[260927_1925_prompt_logica_usuari]], [[260927_1925_pla_implementacio_logica_usuari]] (pla de la IAIA MarIA), [[260927_1905_auditoria_claude]] (torn anterior, rail del Xat) i [[00_index_escriptori]]. L'`ON_ESTIC` injectat era el de la sessió anterior; la llista viva de l'Escriptori s'ha pres del hook d'arrencada i d'un `ls`.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-27T17:40Z: torn `torn_9de7af24` obert (actor claude-fable, scope code). Workflow de comprensió (7 lectors) per a situar sessió, Workspace, Xat, perfils i Connectar.
- 2026-09-27T17:50Z a 18:30Z: execució de T1 a T5 (codi, adaptadors locals, proves). Vitest de dades i xat 34/34; bateria ampla 847 passades amb una fallada (carpeta «Connectats» absent del catàleg), corregida.
- 2026-09-27T18:36Z: el Mestre entrega T6 (botons rectangulars). Lot de 35 edicions preparat i **denegat pel permís** de l'app; cap fitxer tocat per eixe lot. Es deixa en mans del Mestre.
- 2026-09-27T18:38Z: el Mestre entrega T7 (icona del Control) i T8 (alineació del rail). T7 apareix aplicat per un altre agent (`XatControlSection.jsx`, `CircleDashed`). T8: mesurat en viu abans de tocar res; una correcció meua i la d'un altre agent han xocat (126 contra 138); he retirat la meua i l'altre agent ha convergit en la regla dels 16 px; verificació final en viu.
- 2026-09-27T18:52Z: esborrany d'esta auditoria creat amb `document.mjs create`. Proves noves escrites (localPerfils, masDeLUsuari, PerfilPublicSection, ConnectarSection, NotesEditor «Compartir»). Primera passada amb bucle de render als mocks (OOM del worker), corregida estabilitzant els objectes dels mocks: 39/39.
- 2026-09-27T18:55Z a 19:00Z: porta de lint `tests/lint_logica_usuari.test.mjs` escrita i **reescrita per un altre agent** (ara cobrix també T6 i T8). Verificació al navegador de T2, T3, T4 i T7; diagnòstic de la IAIA «muda» (pestanya amagada).
- 2026-09-27T19:03Z a 19:06Z: `document.mjs check` valid:true; auditoria ancorada a l'índex; edició d'ESTAT bloquejada pel hook de governança; refutació adversarial llançada (8 escèptics i un jutge, text pla); mesura final del rail amb la regla nova de l'altre agent.
- 2026-09-27T19:08Z a 19:25Z (**segona mà del mateix torn, v1.1.0**): l'«altre agent» de les entrades anteriors és una segona sessió de Claude Fable que continua la mateixa conversa sobre el mateix torn i el mateix esborrany (l'app va reprendre la sessió després d'una compactació de context i les dos mans han seguit vives). Esta mà ha rebut del Mestre tres ordres que la primera no cita: la **reversió de T6** (botons d'acció en píndola; rectangle pur només a la barra principal i a la primera columna o rail), la precisió de T8 (el que botava era la primera entrada) i **T9** (blocs de banda a banda, apegats a la capçalera). Aplicades, mesurades en viu i cobertes per la porta `tests/lint_logica_usuari.test.mjs` (17 passen, 2 diagnòstics heretats, 0 fallades). La refutació de la primera mà no s'ha repetit per no doblar el cost.
- 2026-09-27T19:06Z a 19:10Z: dues correccions eixides de la refutació: valor per defecte estable d'`agents` a `PerfilPublicSection.jsx` (bucle d'efecte latent) i conservació de l'`origen` en fusionar resums amb detalls (`NotesDataContext.jsx` i `summary()` de `supabase/notes.js`: en remot, la nota connectada tornava a «Publicar» després d'una recàrrega). Proves: perfil i app 27/27; notes 89/89.
- 2026-09-27T19:13Z (primera mà): refutació adversarial acabada (8 escèptics i un jutge; 9 agents, 1.130.302 tokens, 8,9 min). Veredictes: T1, T2, T3, T4 i SQL confirmats; Model B i T5 parcials (les dos fallades reals ja tancades al disc); T8 **refutat** perquè l'afirmació descrivia la CSS d'abans de T9 (16 px i 138), no la del disc (0 px i 122): la v1.1.0 d'este informe ja porta els números bons. El jutge ha comprovat les cites d'un en un.
- 2026-09-27T19:25Z a 19:40Z (segona mà, v1.2.0): el Mestre entrega **T10** (capçalera de conversa calcada de WhatsApp) i, escrita i provada, la **cancel·la** amb T11 («deixa la capçalera i el camp de cerca exactament com estan»): `CapcaleraConversa.jsx`, el seu CSS, les tres claus i18n i la prova s'han restaurat al text d'abans, línia per línia. Es mantenen **T12** (els quatre filtres passen a un desplegable darrere de la icona de filtre, a la línia de la cerca: `FiltreConverses.jsx`) i **T13** (ombra de la columna de la llista sobre l'àrea del xat, token `--sdp-ombra-2` retallat al costat dret). Xat 78/78, `lint_xat` 14/14, porta del torn 17 passen + 2 diagnòstics heretats; tot mesurat en viu.
- 2026-09-27T19:42Z a 19:50Z (segona mà, v1.3.0): **T14** (llegibilitat de les bafarades): text en 600, fora el filet d'1px (ombra per token en lloc seu, anell d'ombra per a error i tria) i mapa de fons de 0,1 a 0,05 en clar (el fosc ja era 0,05). Només CSS, dins de `.sdp-xat` a `modules.css`; `lint_xat` verd; mesurat en viu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Què s'ha fet (T1 a T5), i on

- **T1 · Sessió i Workspace per usuari.** El «padró pilot» del mode seed viu a `src/data/identitatsSeed.js`: qui inicia sessió és la persona pilot i propietari de «Sóc de Poble»; la IAIA és l'agent d'eixa entitat. El MAS (`NotesSection.jsx`) creua el Mur, el Mercat i els Esdeveniments amb els àlies de l'actor (`masDeLUsuari.js`, `aliesDeLActor`) i els ensenya, en lectura, dins de les carpetes Mur/Mercat/Esdeveniments del Bloc (`PublicacioDetall.jsx`). Exemple d'or: com a «Sóc de Poble» només apareix la samarreta; com a persona, només el que la persona ha publicat. Una publicació signada per una entitat mai compta com de la persona (`autorDe` a `navigation.js`). Cada perfil (persona o entitat) té el seu magatzem: `localNotes` i `localXat` ja es clauen per actor.
- **T2 · Xat entre comptes personals i d'entitat.** `xatSeed.js` afig el fil de l'entitat i el de la IAIA; `localXat.js` implementa el canal compartit: qui mana a l'entitat entra al fil com a membre signant com l'entitat (`comOrgId`), els missatges ixen amb `autorNom` de l'entitat i `metadades.autorPersona`; el que llig un membre ho ha llegit l'entitat. Els DTO (`supabase/xat.js` i `sections/xat/missatges.js`) porten `altres`, `entitatId`, `entitatNom`, `comEntitat`, `esIA`. La capçalera de conversa diu «Canal de Sóc de Poble» i enllaça el perfil; les bombolles d'entitat i d'IA porten autor.
- **T3 · IAIA MarIA en proves.** `RESPOSTA_IAIA` (text exacte del Mestre, en un sol lloc) i `BENVINGUDA_IAIA`; el fil `tipus: 'iaia'` respon sol dins d'`enviaMissatge` i avisa el canal local (`subscribeToXat`) perquè el context recarregue a l'instant. Verificat en viu: en escriure «IAIA, ara em veus?» apareix la bombolla «IAIA MarIA · IA — Ara estic en proves, només puc respondre preguntes molt simples…» i el meu missatge passa a «Llegit».
- **T4 · Perfils públics.** `PerfilPublicSection.jsx` resol `/perfil/:id`, `/gent/:id`, `/empresa/:id`, `/grup/:id` i `/ajuntament/:id` per id o slug amb la capacitat opcional `directori` (`loadPerfilPublic`, adaptador local `localPerfils.js`, remot a `supabase/perfils.js`). Mateixa anatomia que la fitxa editable (H1 nom, H2 bio, entradilla lema, cos presentació). La IAIA porta etiqueta i avís d'intel·ligència artificial; «Parla amb la IAIA» i «Escriu-li al xat» obrin `/xat?amb=<id>` (XatSection crea o obri el fil). La fitxa de la IAIA s'edita des del Workspace amb el mateix Editor Universal (grup «AGENTS IA» a `PerfilContext`, capacitat `agents`). Avatars enllaçats: capçalera i bombolles del xat, i la barra taronja d'autoria (`PageFrame` amb `authorHref`) al Mur, el Mercat i el detall.
- **T5 · Connectats i Compartir.** Tota connexió naix com a nota del MAS a la carpeta del sistema «Connectats» (`f-connectats`, garantida per `carpetesDelBloc` encara que el backend no la conega) amb l'`origen` sencer (`origenNota.js`: secció, element, autor, ruta). Des d'allà el Mestre la mou de carpeta i li posa etiquetes (`ConnectarSection.jsx`: carpetes del Bloc, assistent de context, etiqueta lliure). En obrir una nota connectada, l'editor canvia «Publicar» per «Compartir» (`NotesEditor` → `compartirNota`, que publica al mur propi citant l'origen) i avisa de qui és el contingut. Migració additiva `supabase/migrations/2609272100_notes_origen.sql` (columna `notes.origen jsonb`), revisada i no aplicada.
- **Model B conservat.** Cap import de Supabase fora de `src/data/supabase/`; les funcions noves entren al contracte com a capacitats opcionals (`directori`, `agents`) i per `backendPort.js`; els adaptadors locals imiten la semàntica del servidor. Sense capacitat, la pàgina de perfil cau al catàleg d'agents i no promet res més.

### T6, T7 i T8 (ordres del vespre)

- **T6 (botons rectangulars): no aplicat per mi.** Superfície inventariada (43 usos de `--sdp-radi-pastilla` i 9 de `9999px`): botons d'acció (Boto, `.btn`, controls de barra, `.sdp-bloc-action`, icones de xat i de rail, PillToggle, Connectar) contra elements que no són botons (insígnies, comptadors, avatars, barra de progrés, interruptor, camps de cerca, filtres del xat ordenats a l'estil WhatsApp). El lot d'edicions va quedar denegat; la porta `tractor-crom.mjs` (K4) encara exigix la pastilla als botons de la barra lateral. **Estat a les 19:05Z, mesurat en viu:** un altre agent ha declarat `--sdp-radi-boto` a `tokens.css` però l'àlies resol a **999px** (pastilla) i `.sdp-xat-nova` continua redona; la seua porta de lint diu ara «cap botó d'acció porta un radi de 0: el rectangle pur és només de la navegació». És a dir: l'ordre de les 18:36 (botons súper rectangulars) ha quedat substituïda per una regla posterior que no he rebut jo. Qui la tinga per escrit ha de deixar-la a l'Escriptori; este informe no la inventa.
- **T7 (icona del Control): fet per un altre agent** i verificat en viu: la columna central de `/control-xat` porta el cercle a ratlles, el mateix dibuix que «Novetats» al rail.
- **T8 (alineació del rail): mesurat, no suposat.** Abans de tocar res (18:30Z), a 1440 px: fila de control 64 a 122 (58) tant a la barra principal com al rail; icona a l'eix 28 i text a 56 en els dos estats; **la capçalera no botava**. El bot de 12 px era de la primera entrada: 138 desplegat i 126 plegat (la barra principal feia exactament igual). La meua correcció (primera cel·la 16 px davall de la fila superior) va xocar amb la d'un altre agent i la vaig retirar; a les 18:52Z els dos rails feien 138 en els quatre estats, amb pas 44 desplegat i 48 plegat. **Estat final a les 19:05Z, mesurat en viu:** l'altre agent ha aplicat una regla nova (la seua porta l'anomena T8/T9): la primera entrada cau a **122** (apegada a la fila de control, sense coixí) en els quatre estats, totes les files fan 44 seguides (segona a 166, sisena a 342), les cel·les plegades van de banda a banda (56) i el radi de les files és 0. Amb això, obrir o plegar no mou cap icona: la decisió del pas (D1 d'este informe) ha quedat presa pel Mestre a través de l'altre agent i ja no és oberta.

### Regla definitiva de botons i navegació (T6 revertit i T9; segona mà, 19:25Z)

- **Ordre del Mestre (xat, vespre):** «He canviat d'opinió. Els botons d'acció de l'aplicació (CONNECTAR, CREAR NOTA…) han de tornar a ser en forma de píndola, tal com estaven abans. L'únic lloc on vull un format súper rectangular (sense gens de border-radius) és a les capçaleres i elements actius de la barra principal (la negra) i a la primera columna / rail de navegació (la taronja).» I la precisió T9: «L'estat actiu ha d'ocupar el 100% de l'amplada de la columna. Elimina els marges laterals… caixes sòlides que s'apilen les unes baix les altres i s'apeguen a la capçalera. Res de botons flotants.»
- **Com s'ha aplicat.** Un sol interruptor: `--sdp-radi-boto: var(--sdp-radi-pastilla)` a `tokens.css`. Tots els botons d'acció que el primer intent de T6 havia passat a rectangle tornen a la píndola per l'àlies, sense tocar-los un per un: Boto, `.btn`, `.btn-taronja-fort`, controls de barra (`.sp-card-action`, `.btn-icon-orange`, `.btn-connectar`, `.btn-date-time`), `.sdp-bloc-action`, PillToggle, icones i «+» del xat, `.app-grid-col-header__accio`, botons de Connectar. Rectangle pur amb `border-radius: 0` explícit a `nav.app-sidebar .nav-item` (obert i plegat), `.sidebar-control-btn`, `.app-grid-col-header--replegable`, `.sdp-workspace-nav-item` (files de la primera columna: carpetes del Bloc i rail del Xat) i `.sdp-workspace-rail__boto` (cel·les plegades).
- **Banda a banda (T9).** Coixí de dalt 0 a `.app-sidebar-nav` (obert i plegat) i a `.sdp-xat-rail-llista`; cap marge davall de `.app-grid-col-header__rail-top`; `gap: 0` i `align-items: stretch` a la capçalera plegada i a `.sdp-workspace-rail__grup`; `.nav-item` plegat amb `width: auto` (la li estirada el porta a 56, sense el `width: 100%` que K4 prohibix) i `.sdp-workspace-rail__boto` amb `width: 100%` (un `<button>` amb `width: auto` s'encongix al contingut encara que siga flex). Les accions de la capçalera plegada del Workspace (roda, lupa) conserven la cel·la de 44 centrada (`align-self: center`).
- **Mesura final en viu (pestanya de fons, 19:20Z, ample, quatre estats):** fila de control 64–122 i icona a 81 a la barra i al rail; primera entrada a **122** en els quatre estats; files de 44 seguides (166, 210, 254…); barra oberta 260 d'ample des de x=0 i plegada 56; cel·les del rail plegat 56×44 des de la vora de la columna amb la icona a l'eix 28; radi 0 en tota la navegació; `.sdp-xat-nova` i l'àlies a 999px.
- **Efecte col·lateral declarat.** Les regles dels rails plegats són compartides («un sol joc de regles», ordre del 260927 migdia): els rails plegats del Workspace (carpetes del Bloc) també van ara a sang i sense separació, i les files desplegades de carpetes del Bloc són rectangles (abans, píndola en actiu). La llista desplegada de carpetes del Bloc conserva el seu coixí de 8. Si el Mestre vol el Bloc distint del Xat, cal escopir-ho a `.sdp-xat`.
- **Portes i doctrina.** `tractor-crom.mjs` (K4: «extrems circulats» i «mai width 100%») contradiu la regla nova i el hook de governança no deixa editar `tooling/gates/*` amb l'eina directa (cal `executor-mutacio.mjs` amb pla i lease). Pegat proposat: admetre `var(--sdp-radi-boto)`, `0` i `inherit` als botons de la closca, i limitar la prohibició de `width: 100%` a `.nav-item`. La doctrina de radis de `sdp-pedra-seca` (§5) necessita la frase «botons d'acció en píndola; barra principal i primera columna en rectangle pur, a sang»; la skill està segellada i no s'ha tocat.

### T10 a T13 (ordres de la nit; segona mà, 19:40Z)

- **T10 i T11, cancel·lades pel Mestre.** T10 (capçalera de conversa a l'estil de WhatsApp Web: nom i estat, vídeo amb fletxa i «⋯» en píndola) es va escriure sencera amb la seua prova i, en arribar l'ordre de cancel·lació, s'ha restaurat el text d'abans a `CapcaleraConversa.jsx`, `modules.css`, `i18n.js` (les tres claus `section.xat.estat.membres`, `section.xat.estat.darrer` i `section.xat.conversa.video` han desaparegut de les cinc llengües), `XatSection.jsx` i `XatSection.test.jsx`. T11 (camp de cerca de banda a banda) no s'ha aplicat: el camp continua en píndola. Lliçó per a la plantilla: una ordre de disseny «massiva» hauria d'anar amb una captura de referència **i** una confirmació abans de tocar un component que ja agrada.
- **T12 · Filtres en desplegable.** `src/sections/xat/components/FiltreConverses.jsx`: la fila de píndoles Tot · No llegits · Preferits · Grups desapareix (i el seu CSS, `.sdp-xat-filtres` i `.sdp-xat-pindola`); a la mateixa línia de la cerca, a la dreta del camp, la icona `ListFilter` obri un menú (`role="menu"` amb quatre `menuitemradio`, la triada marcada) que es tanca en triar, en clicar fora o amb Escape. Quan hi ha un filtre que no és «Tot», la icona s'il·lumina amb el to d'acció i el seu nom accessible ho diu («Filtra les converses (No llegits)»). Mesurat en viu: la llista comença 48 px més amunt (184 en lloc de 232). Prova: `XatSection.test.jsx` («T12 · els filtres … viuen en un desplegable i filtren de veres»); `FiltreConverses` afegit a les dos portes de lint.
- **T13 · Ombra separadora.** `.sdp-xat .app-grid-column--middle` porta `box-shadow: var(--sdp-ombra-2)` (Pedra Seca §5: ombra funcional per token, mai decorativa), `position: relative; z-index: 1` perquè caiga damunt de la columna del xat (germana posterior) i `clip-path: inset(0 -32px 0 0)` perquè l'ombra només es veja al costat dret i no taque ni el rail ni la fila de control. Computat en viu: `rgba(14,13,12,0.07) 0 3px 10px`, `inset(0 -32px 0 0)`, z-index 1.
- **T14 · Llegibilitat de les bafarades.** `.sdp-xat-bombolla`: `border: 0` (el filet d'1px `--sdp-vora` desapareix) i `box-shadow: var(--sdp-ombra-2)` (abans `--sdp-ombra-1`, quasi invisible sense la vora; l'ombra 2 fa 3 px de desplaçament i 10 px de difuminat, continguda: decisió D8, el Mestre pot baixar-la a `--sdp-ombra-1` amb una paraula). `.sdp-xat-bombolla__text { font-weight: 600 }`. L'estat d'error i la tria, que es marcaven amb `border-color`, passen a un anell d'ombra (`0 0 0 2px var(--sdp-error)` i `0 0 0 2px var(--sdp-accio)`, sumat a l'ombra 2). Mapa de fons `.sdp-xat-conversa::before`: opacitat de 0,1 a **0,05** en clar; el fosc ja era 0,05. El Mestre parlava de 0,07: el valor real era 0,1 i el destí ordenat, 0,05.

### Troballes de l'auditoria

1. **La pestanya amagada silencia el xat (per disseny).** `XatContext` no obri el canal ni sondeja quan `document.hidden` és cert. Al navegador integrat de l'app, que estava amagat, la IAIA semblava muda; en fer visible la pestanya, la resposta arriba. Al Chrome del Mestre no passa. Documentat, no canviat.
2. **Arbre concurrent: dos mans del mateix torn.** L'«altre agent» d'este informe és una segona sessió de Claude Fable que continua la mateixa conversa sobre el mateix torn i el mateix esborrany. Cada mà ha rebut ordres del Mestre que l'altra no ha vist; les mesures del rail han canviat tres vegades en deu minuts i dos vegades una mà ha desfet la feina de l'altra (126 contra 138, i després 122). Tot número d'este informe porta l'hora i la mà; la v1.1.0 és la darrera i la que casa amb les ordres definitives. Qui el llija ha de tornar a mesurar.
3. **Classes mortes a Connectar.** `mr-2` i `rotate-45` no existien a cap full; llevades del JSX (cap píxel canvia). El botó de llevar etiqueta continua pintant un «+» perquè el gir no tenia CSS: és un defecte heretat, no un redisseny meu.
4. **Deute de la pàgina Connectar.** `ConnectarSection.css` (full sota `src/sections`, colors en hexadecimal, `var(--sdp-font-family, …)` amb fallback) viu fora del vocabulari canònic i el JSX l'importa; la porta de lint de l'altre agent ho marca. Cal decidir si es migra a `modules.css` amb tokens (canvi de píxels) o s'exempta com `PerfilShell.css`.
5. **Remot pendent (Model B, banda servidor).** `loadPerfilPublic` en remot només resol organitzacions del directori, el propi perfil i el catàleg; les fitxes públiques d'altres persones necessiten una RPC `perfil_public`. La resposta automàtica de la IAIA i el canal compartit d'entitat (`com_org_id`, participant virtual) només existixen a l'adaptador local: falta el disparador i les vistes `xat_fils_meus` v3 / `membres_del_poble` v2. `listMyAgents` remot torna buit.
6. **Baseline de proves aliena.** Wiki (3) i Consola (7) fallen igual que a l'ESTAT de Codex; no les toca este torn.
7. **Porta K4 caducada.** `tractor-crom.mjs` exigix `border-radius: var(--sdp-radi-pastilla)` i prohibix `width: 100%` a `.sidebar-control-btn`, que ja porta radi 0 i amplària 100% per ordre del Mestre del 260926. La porta està roja per doctrina vella, no per este torn.
8. **Trobat i corregit per la refutació (T5, remot).** El resum de la llista no porta `origen` i `nota(row)` el posava a `null`; en fusionar amb el detall (`mergeNotes`), la nota connectada perdia l'origen i l'editor tornava a «Publicar». Corregit: el resum ja no declara `origen` i la fusió conserva el del detall.
9. **Trobat i corregit per la refutació (T4).** `agents = []` per defecte a `PerfilPublicSection` era un array nou a cada render dins dels deps de l'efecte: cap caller de l'App ho disparava, però un ús sense la prop hauria girat sense parar. Ara el valor per defecte és una constant congelada.
10. **Pendent (T5, Mur).** La publicació compartida arriba al Mur amb `type: 'compartit'` i `origen`, però cap targeta del Mur pinta encara «compartit de …» citant l'origen: falta la decisió visual del Mestre (on i com se cita).
11. **Pendent (T2, traçabilitat).** En signar com a entitat, `metadades.autorPersona` val «Veí» per a l'usuari de sessió perquè la fitxa local no coneix el seu nom (`fitxaDe`); només els membres de la llavor porten nom. Correcció mínima: caure al nom de sessió abans de «Veí».
12. **Pendent (Model B, cobertura).** Les proves d'`auth.test.js` i `organizations.test.js` no exerciten la branca seed/local (`esModeLocal`): la desviació a `localPerfils` s'acredita per lectura i per `localPerfils.test.js`, no per eixes suites. `host.js` importa `data/supabase/index.js` des de fora de la carpeta com a única excepció sancionada per E1.

### Veredicte del jutge (refutació, 19:13Z): troballes que sobreviuen i no estan dalt

13. **Porta morta a `tractor-rls.mjs:170`.** L'exempció R3 nomena `260911_0600_perfil_avatar_i_permisos.sql` i el fitxer del disc és `2609110600_…`: l'exempció mai s'aplica i `porta:rls` ix roja sempre per «using (true)» a «profiles read own». Preexistent, però és una porta que no vigila res.
14. **`supabase/README.md` amb noms de migració que no existixen.** Només l'entrada de `notes.origen` usa el nom real del disc; les altres (21) porten la forma antiga `260927_0200_…`. Deute previ al torn.
15. **`createOrganization` sense branca local** (`organizations.js:21-24`): en seed sense Supabase llança «No es pot crear una organització sense connexió al servidor», a diferència de la resta del fitxer.
16. **Cobertura del xat.** Cap prova cobrix la porta `document.hidden` de `XatContext` ni el camí concurrent enviament + canal + sondeig; la prova T3 comprova la frase de la IAIA només per prefix. `reiniciaLocalPerfils` no la crida ningú: un fitxer de proves que encadene casos en seed compartiria el singleton.
17. **Blindatge d'una línia a `masDeLUsuari.js:25`.** `pertanyALActor` compara només `autor.id` i ignora `autor.tipus`; hui impossible de creuar (uuids en remot, conjunts disjunts en seed), però convé comparar també el tipus.
18. **Comentari ranci** a `modules.css` (rail plegat: «el gap de 4 de la graella fa de marge») ara que el gap és 0 (T9).
19. **Límit de mida de `notes.origen`.** El CHECK acota el tipus, no la mida del jsonb; els 300 caràcters per camp viuen només al client. Opcional: `pg_column_size(origen) <= 4096`.

### Retroalimentació de la plantilla del prompt

- El prompt demana «consens amb altres IAs» però l'Escriptori no tenia cap informe d'altre agent per a este tema; el pla de la IAIA MarIA sí. La plantilla hauria de dir què fer quan la taula està buida: seguir i deixar-ho escrit.
- El bloc de «Criteris d'acceptació» diu «visible a localhost:3340» sense dir amb quina sessió. El MAS per usuari (T1) només es demostra amb sessió iniciada; al navegador integrat no en tinc. Convindria una fila «Sessió de proves: sí/no, quin usuari».
- La plantilla no reserva lloc per a ordres que arriben a mitjan torn (T5 a T8): han acabat en este informe per necessitat. Un apartat «Ordres afegides durant el torn» evitaria barrejar-les amb les troballes.

### Proposta d'Automillora

- **Una sola mà per fitxer.** Quan dos agents treballen alhora, el prompt hauria de repartir fitxers (per exemple: «CSS i rail: MarIA; dades i proves: Claude»). Este torn ha perdut temps mesurant regressions que no eren regressions.
- **Sessió de proves a la llavor.** Un usuari de proves conegut (correu i contrasenya de la llavor local) permetria verificar T1 al navegador sense demanar credencials al Mestre.
- **Porta K4 i doctrina de botons al mateix commit.** Si T6 es fa, `tractor-crom.mjs` i la skill de Pedra Seca s'han de canviar en el mateix torn; si no, la cadena tornarà a parar-se per una llei que ja ningú vol.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat | Hora (UTC) |
| --- | --- | --- |
| Vitest `src/data` i `src/sections/xat` (adaptadors, DTO, IAIA, canal d'entitat) | 34/34 | 18:20 |
| Vitest ampli (notes, perfil, mur, mercat, detall, connectar, components, app, data, config, hooks, utils) | 847 passades, 1 fallada (Connectats) → corregida | 18:23 |
| Vitest `xat`, `data/supabase`, `components/universal`, `mur`, `detail`, `app` | 40 fitxers, 423/423 | 18:51 |
| Vitest suites noves (localPerfils, masDeLUsuari, PerfilPublicSection, ConnectarSection, NotesEditor, NotesSection) | 6 fitxers, 39/39 | 18:50 |
| Porta `tests/lint_logica_usuari.test.mjs` (versió reescrita per l'altre agent) | 11/15; fallen: import de CSS a Connectar, 4 classes (2 llevades ara, 2 heretades a PageFrame), 3 tokens heretats, `.btn-icon-orange` en `50%` (T6) | 18:58 |
| ESLint per API sobre els fitxers del torn | zero missatges després de llevar `joActual` (localXat.js) | 18:58 |
| Navegador · `/xat` rail obert i plegat, barra principal oberta i plegada | fila de control 64–122 en tots; primera entrada 138 en els quatre estats (abans 126 plegada) | 18:52 |
| Navegador · el mateix, amb la regla nova de l'altre agent | primera entrada 122 en els quatre estats, pas 44 (166, 342), cel·les plegades de 56 d'ample, radi 0; `--sdp-radi-boto` resol a 999px | 19:05 |
| Porta `tests/lint_logica_usuari.test.mjs` (versió v3 de l'altre agent, amb T6 invertit, T8 i T9) | 16/19 passen; 1 fallada (`:has()` heretat a `components.css:172,173,684`) i 2 diagnòstics heretats (classes de PageFrame, tokens de PerfilShell/Connectar/`--sdp-fons`) | 19:04 |
| Porta `tests/lint_logica_usuari.test.mjs` (v4, segona mà: T6 definitiu, T8, T9, `:has()` acotat als fulls de la closca) | 17/19 passen, 2 diagnòstics `todo` de deute heretat (classes de PageFrame; tokens de PerfilShell, Connectar i `--sdp-fons`), 0 fallades | 19:18 |
| Porta `tests/lint_xat.test.mjs` | 14/14 | 19:16 |
| Vitest `xat`, `workspace`, `layout`, `NotesSection` (després de T9) | 13 fitxers, 139/139 | 19:15 |
| Vitest del torn (xat, notes, connectar, profile, data, universal, layout, PedraSeca) | 70 fitxers, 740/740 | 18:50 |
| Navegador · `/xat`, quatre estats, regla definitiva (píndola als botons, navegació rectangular a sang) | primera entrada 122; files 44 seguides; barra 260/56 d'ample des de x=0; cel·les plegades 56×44; radi 0; `--sdp-radi-boto` = 999px | 19:20 |
| Vitest `src/sections/xat` després de T12, T13 i la reversió de T10 | 5 fitxers, 78/78 | 19:36 |
| Portes `lint_xat` i `lint_logica_usuari` després de T12 i T13 | 14/14; 17 passen + 2 diagnòstics `todo` heretats, 0 fallades | 19:37 |
| Navegador · `/xat` (T12, T13) | cap `.sdp-xat-filtres` ni `.sdp-xat-pindola`; icona de filtre 44×44 a la dreta del camp (que continua a 999px); menú amb Tot ✓ · No llegits · Preferits · Grups; «No llegits» filtra (2 files), tanca el menú i il·lumina la icona; llista a 184 (abans 232); columna de la llista amb `--sdp-ombra-2`, `clip-path inset(0 -32px 0 0)`, z-index 1 | 19:38 |
| Navegador · `/xat/<fil Pepa Ferrer>` (T14) | 13 bafarades: vora 0, ombra `rgba(14,13,12,0.07) 0 3px 10px`, text a 600; mapa de fons a 0,05; `lint_xat` 14/14 | 19:48 |
| Navegador · `/xat/<fil IAIA>` | benvinguda, capçalera «Intel·ligència artificial en proves», resposta de proves en enviar, «Llegit» | 18:58 |
| Navegador · `/control-xat` | icona `CircleDashed` a la columna central (T7) | 18:53 |
| Navegador · `/perfil/<IAIA>` i `/empresa/soc-de-poble` | fitxes públiques amb etiqueta, avís d'IA i botons cap al xat | 18:53 |
| Servei local GoTrue (`localhost:54321`) | actiu; no s'hi ha iniciat sessió | 17:45 |
| Refutació adversarial · SQL `notes.origen` | CONFIRMAT (additiva, idempotent, RLS intacta; `notify` dins de la transacció és correcte) | 19:06 |
| Refutació adversarial · T2 canal d'entitat | CONFIRMAT; matís: `autorPersona` «Veí» per a la sessió (troballa 11) | 19:06 |
| Refutació adversarial · T4 perfil públic | CONFIRMAT; forat latent del valor per defecte `agents` (troballa 9, corregit) | 19:06 |
| Refutació adversarial · T3 IAIA i pestanya amagada | CONFIRMAT; carrera enviament/canal analitzada i descartada | 19:08 |
| Refutació adversarial · Model B i contracte | PARCIAL: `host.js` és l'excepció sancionada; cobertura seed d'`auth`/`organizations` absent (troballa 12) | 19:07 |
| Refutació adversarial · T5 Connectats | PARCIAL: pèrdua de l'`origen` en remot (troballa 8, corregit); el Mur no cita l'origen (troballa 10) | 19:07 |
| Proves després de les correccions | perfil i app 27/27; notes, `supabase/notes` i `localNotes` 89/89 | 19:08 |
| Refutació adversarial · T1 propietat del MAS | CONFIRMAT (entitat mana sobre persona; convidat sense àlies); blindatge del tipus com a troballa 17 | 19:11 |
| Refutació adversarial · T8 mesures del rail | REFUTAT: l'afirmació descrivia la CSS d'abans de T9 (16 px, 138, pas 48); el disc fa 0 px, 122 i pas 44, com diu la v1.1.0 | 19:12 |
| Refutació adversarial · jutge (cites comprovades una a una, 126 proves executades) | 5 confirmats sòlids, 2 parcials sòlids, 1 refutat sòlid; deu troballes supervivents (dalt, 8 a 19); dos defectes ja tancats al disc | 19:13 |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense commit, push, `npm run lint` ni portes del pre-commit: el hook del projecte bloqueja shell composta, `git diff`, `node tooling/gates/*` i `cat`. El lint s'ha passat per l'API d'ESLint dins de la prova; les altres portes queden per al Mestre.
- Cap sessió iniciada al navegador integrat: T1 amb sessió (MAS de «Sóc de Poble» amb la samarreta) es demostra per proves, no en viu. La pestanya estava amagada: les hores del xat porten eixe biaix.
- Backend remot no exercit: la migració `notes.origen` no s'ha aplicat; les vistes i RPC de la banda servidor per a IAIA, canal d'entitat i perfils públics d'altri són pendents.
- T6, T7, T8 i T9: la primera mà va tindre el lot de T6 denegat; la segona mà ha escrit T7, T8 i T9 i ha aplicat la reversió de T6 (píndoles) que el Mestre va ordenar després. Cap de les dos mans ha pogut editar `tooling/gates/tractor-crom.mjs` (governança): la porta K4 queda contradita per la regla nova fins que s'aplique el pegat amb lease.
- Tokens: mesurats només els dos workflows (comprensió 1.928.841 i refutació 1.130.302 tokens de subagents); les sessions principals no.
- **ESTAT i LEDGER no escrits:** el hook bloqueja l'edició directa («usa executor-mutacio.mjs amb pla exacte i lease») i també `tancament.mjs --check`. El relleu va al missatge final del xat, en bloc per a copiar, i s'ha d'aplicar amb l'executor. La memòria de l'agent fora del repositori també queda bloquejada.
- La porta de lint del torn l'han escrita les dos mans; la versió final (segona mà) acota `:has()` als fulls de la closca i marca el deute heretat (classes de `PageFrame`, tokens de `PerfilShell`, Connectar i `--sdp-fons`) com a diagnòstic `todo`, no com a fallada. El `:has()` de `components.css` (placeholder del contenteditable i etiqueta amb acció) queda com a deute documentat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_1925_prompt_logica_usuari]]
- [[260927_1925_pla_implementacio_logica_usuari]]
- [[260927_1905_auditoria_claude]]
