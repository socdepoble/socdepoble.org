---
type: informe
status: esborrany
description: 'Informe de la implementació de T39 a T47 amb workflows multiagent: canvis, proves, portes, decisions preses i decisions pendents del Mestre.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ecbe13bd-0e46-4440-a822-99378a3f2648:ab603e4a-68ba-41c3-af7c-bdc34fb5d91c
---
# Auditoria d'implementació T39-T47 (Claude Ultra Code)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ecbe13bd-0e46-4440-a822-99378a3f2648:ab603e4a-68ba-41c3-af7c-bdc34fb5d91c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-28T06:11:31.262Z |
| Modificació | 2026-09-28T07:25:00.000Z |
| Propietari | agent-local (Claude Code, orquestrador del torn) |
| Aprovació humana | pendent (el pla T39-T47 venia «aprovat»; este informe espera revisió del Mestre) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5): orquestrador i 58 subagents en 9 workflows |
| Tokens consumits | ≈ 19,5 M (≈ 18,7 M dels subagents segons els workflows + ≈ 0,8 M de l'orquestrador) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-28 02:30 · Obert el torn `torn_ecbe13bd-0e46-4440-a822-99378a3f2648` (scope code). Llegits el pla i el prompt de l'Escriptori, l'Acta Marmota [[260928_0230_ACTA_MARMOTA_marato_t39_t45]] i les skills sdp-pedra-seca, sdp-universal-editor, sdp-universal-page i sdp-app-grid-shell.
- Exploració en només lectura (9 agents: un per tasca i un de convencions). Van detectar que el prompt i el pla del **disc** (modificats a les 02:44) ja eren T39-**T47** i amb una T43 ampliada; el text enganxat al xat era anterior. **Mana el disc.**
- Investigació a fons de T47 (3 lents amb proves de reproducció que fallaven) i de la T43 ampliada (2 lents).
- Onada 1 (T42, T44, T45), via de l'editor en sèrie (T47a → T47b → T40+T41 → T39 → T46) i via de connexions (T43a → T43b), cada tasca amb implementació, revisió adversarial i correcció.
- Dues rondes de poliment de troballes baixes verificades i una integració final: portes, tres revisors transversals (dades i privacitat, accessibilitat i Pedra Seca, integració i honestedat), QA visual al navegador, verificador adversarial (21 troballes confirmades, 5 refutades) i tres correctors amb fitxers disjunts.
- 2026-09-28 09:22 · Suite sencera i portes finals. Informe redactat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Què s'ha implementat (per tasca)

**T47 · Autodesament «com Google Docs» (incidència crítica).** Causes verificades amb proves que fallaven abans:
- (C1) el lema del Perfil (l'entradilla) té un límit de 120 caràcters (perfilCamps + CHECK de BD); un text més llarg feia un toast i es perdia en eixir;
- (C2) React 18 neteja els efectes passius d'un arbre esborrat de pare a fill: PerfilScope es donava per mort abans que la closca buidara la cua i el desat s'avortava en silenci;
- (C3) el cos TipTap no desava en blur;
- (C4) una resposta tardana de l'H2 tornava enrere l'entradilla a la vista;
- (C5) una organització no desava res si faltava la columna `copyright` del select.

Solució:
- **Nucli nou `src/data/autodesament/`:** esborrany síncron en memòria i a IndexedDB abans de cap petició; cua que sobreviu al desmuntatge; reintents només per a errors temporals; quarantena per columna absent; errors de validació persistents i en línia amb comptador, amb les accions «Retallar a 120» i «Tornar al que hi ha desat».
- **Tancament i conflictes:** guarda d'àmbit per persona i sessió; control de conflicte entre dispositius (valor base); fusió per camp entre pestanyes; eixida de sessió que intenta enviar i avisa si queda text sense confirmar.
- **Closca i Perfil:** flush de desmuntatge en `useLayoutEffect`; la ploma d'estat (`EstatDesament`) a la barra taronja, amb el detall accessible; `guardarCampPerfil` fusiona només la columna escrita.
- **Notes (`GlobalSaveManager`):** funcions renovades a cada enqueue, reintent amb retrocés, represa en carregar, quarantena de columnes opcionals (`columnesOpcionals.js`: `icon`, `publish_date`), reserva en memòria si IndexedDB falla i retirada sense pèrdua en arxivar o enviar a la paperera.
- **Regressions:** `PerfilEditor.autodesament`, `UniversalEditorShell.autodesament` i `autodesament.lentc.perfil`.

**T40 + T41 · Barra taronja.** Una sola finestra flotant de barra (`Dialeg lloc="barra"`) per al calendari i per a la visibilitat.
- **Calendari:** `src/utils/calendari.js` i l'organisme `CalendariMes` (NavegacioMes, GraellaMes) extrets de la Consola amb DOM idèntic. `SelectorDataHora` porta dia i hora, i la data es desa a `publishDate` (Notes).
- **Visibilitat:** `SelectorVisibilitat` amb targetes «Pública/Privada» (GrupOpcions de T44), obert per la bola del món i pel botó PUBLICAR, que ja no publica directament. Els textos per consumidor són honestos (una nota publicada no es pot retirar del Mur i la privada queda bloquejada amb el motiu), i diu «Publicaràs com a {actor}».
- **Identitat:** l'avatar i el selector d'identitat surten de la barra taronja; la identitat només es canvia a la barra negra.
- **Autoria del Mur:** la publicació signa amb l'actor real (mai amb un correu). Sense data triada no es torna a datar la publicació en republicar-la.

**T39 · Drets d'autor.**
- `CopyrightPage` és una vista a pantalla completa dins de la columna de l'editor. La closca s'amaga però continua muntada, així que TipTap i l'autodesament no es perden.
- Catàleg didàctic de llicències amb exemples de poble (`drets/llicencies.js`).
- L'acceptació irrevocable de CC0 i el límit de 256 caràcters es conserven.
- Herència des del Perfil (`drets/herencia.js`): la llicència de la fitxa és la de sèrie de les notes noves, amb un mirall local per identitat.
- El Mur i el detall mostren els drets triats en lloc del text fix.

**T42 · Vista d'impressió.** El diàleg fa 90vh (i 90dvh dins de `@supports`). L'únic scroll és el del document; el diàleg només fa de reserva en pantalles curtes. L'avís passa a ser la descripció accessible del diàleg, i la casella és la de Pedra Seca. Verificat per mesura: 0/0/0 de desbordament en cinc mides.

**T43 · Connexions i identitat.**
- **Connectar universal:** tot «Connectar» porta un objecte tipat (`objecteConnectable.js`): persones, entitats, pobles, publicacions, agenda, pàgines, Wiki i avisos. Es respecta `onConnect={false}`.
- **Visibilitat granulada honesta:** Privada; Persones concretes (enviament per xat, que no és un permís); Grups de xat; Tot el poble (la gent registrada, no Internet). Els destinataris mai viatgen al payload públic.
- **Administrar una organització** (capacitat opcional `reclamacions`): en llavor és immediat; en remot es fa una petició (`sollicita_reclamacio`).
- **Correu opcional de l'entitat** (capacitat opcional `contacteOrganitzacio`): el correu privat només el veuen owner i admin; el públic és opt-in; el correu del creador només el veu la persona titular.
- **Barra negra:** components `identitat/`, el calaix fora del header, i una entitat mai mostra la foto de la persona. Desapareixen l'estil inline i les classes òrfenes d'App.jsx.
- **CSS:** ConnectarSection.css s'ha migrat a tokens.

**T44 · /realitat.** Targetes visuals per nivell amb una variant nova i genèrica de `GrupOpcions` (`aspecte="targetes"`, opció `desactivada`). Tauler d'estat lligat a la IAIA i acompanyants en targetes. Els textos són honestos amb el moviment reduït i el nivell desat queda limitat a 0-3.

**T45 · /cerca.** Causa arrel de codi: la cerca no consultava mai el padró de persones. Ara el padró (`membres_del_poble`) i les identitats pròpies hi entren.
- Cerca amb plegat d'accents, lògica AND i rànquing.
- Filtres per tipus amb recomptes, i `?q=&tipus=` a l'URL.
- Estats inicial, carregant, buit i error per font.
- Organisme `ResultatCerca`.
- En remot, les persones sense fitxa llegible porten «Escriu-li» en lloc d'un enllaç trencat.

**T46 · Enquadrament.**
- `DialegEnquadrament`: visor canvas amb arrossegar i pessic, zoom i posició amb lliscadors accessibles.
- Formats 1:1 (de sèrie), Original, 4:3 i 16:9.
- L'enquadrament es cou dins de l'arxiu abans de pujar-lo; es conserva la transparència.
- Funciona per al Hero i, per tant, per a ItemMedia. El Perfil en queda exclòs, per ordre.

### 2. Decisions preses per l'orquestrador (amb trellat, dins de l'ordre aprovada)

1. Mana la versió del disc del prompt i del pla (T47 i la T43 ampliada).
2. La finestra flotant unificada és `Dialeg lloc="barra"` i no un popover. Un panell absolut dins de la barra queda retallat pel contenidor (`overflow`, `container-type`), i la barra no es veu en mòbil.
3. Tot el CSS nou va en blocs `@layer components` marcats de `src/css/modules.css`. Un `.css` nou dins de `src/sections|components|app` trenca la llei dura V3.
4. Cap migració aplicada. El codi funciona sense les columnes noves (quarantena), i l'SQL queda proposat a la secció 4.
5. El lema continua en 120 caràcters: el text no es perd, es mostra en línia amb comptador.
6. La data de publicació només existix a Notes; el Perfil no en té.
7. Una nota publicada no es pot fer privada perquè no hi ha mètode per a retirar-la; es diu així, sense prometre-ho.
8. `onConnect={false}` amaga el botó (PublicacioDetall, Disseny). La fitxa pública i la Wiki passen a ser connectables.
9. Es manté la regla de la llavor: tota persona amb sessió és propietària de l'entitat pilot.
10. En eixir de la sessió: intent final d'enviar, avís si queda text sense confirmar i «Eixir igualment» per a oblidar-lo.

### 3. Decisions pendents del Mestre (`requires_human_decision: true`)

1. **T36 · proves roges.** `UniversalEditorShell.accions.test.jsx` espera botons `disabled` i un avís permanent. El codi posterior a l'ESTAT de les 01:50 els pinta vius amb la classe `accio-inoperativa` i un avís de 5 s. No s'ha tocat. Cal dir quin comportament és el bo.
2. **Mòbil del Bloc de Notes.** T38 amaga la barra taronja a ≤720 px, i amb ella la icona de la ploma i el calendari. La regió viva ja s'ha tret de la barra, de manera que el lector la sent. Opcions: estendre l'excepció del Perfil o moure la data i la ploma a la barra d'eines.
3. **Eixida en un ordinador compartit.** Ara avisa i, amb «Eixir igualment», oblida el text sense confirmar. Cal confirmar la política.
4. **Padró i fitxa privada.** `membres_del_poble` llista tothom encara que tinga `is_public=false`. Cal decidir si una fitxa privada amaga la persona del padró (migració) o si es reescriuen els textos.
5. **Retirar una nota del Mur.** Caldria una capacitat opcional nova al port; la BD ja ho permet.
6. **Entorn.** `VITE_TENANT_ID` (.env) no casa amb el poble de `supabase/seed.sql`, i per això en remot la cerca i el contingut estan buits. `.env.local` porta `VITE_DATA_MODE=seed`.
7. **Doble ploma.** La Feather de l'emoticona buida (T23) i la ploma d'estat de desament (T47) volen dir coses diferents. Cal canviar-ne una i actualitzar la skill sdp-universal-editor §1.
8. **Fitxers morts que el hook no deixa esborrar:** `src/sections/connectar/ConnectarSection.css` (buit), `src/sections/profile/SelectorIdentitat.jsx` amb la seua prova, i les regles `.perfil-selector*` de PerfilShell.css.
9. **Skills desfasades** (ruta de governança):
   - sdp-universal-editor §2.1 diu «vista dins del frame» i §2.3 diu «data a la zona del títol»;
   - sdp-universal-page §B necessita el quart botó «Enquadrar» (el text proposat és a l'informe de T46).
10. **Contrast heretat:** text blanc sobre `--sdp-accio` a 3,87:1 (píndoles de /cerca, `.sdp-copyright-selector`, botonera). Àrea tàctil de `Casella` i de `.sdp-copyright-selector` (24 px). `:where(dialog)` talla a 40rem tots els diàlegs de mida g.
11. **Contingut antic.** Les publicacions anteriors a T39 no tenen `copyright` i mostren «© Sóc de Poble / Fet per la IAIA i Nano Banana».
12. **Mode incrustat.** La reinjecció horària de la sessió de l'amfitrió compta com a entrada nova i remunta Notes. El text no es perd. La correcció és a `identitat.js` i necessita ordre.
13. **Barra negra.** Ara l'avatar passa per `esFontImatgeSegura`, i les fotos de sessió d'orígens tercers (per exemple Google) es mostren com a inicials. Guanya privacitat, però és un canvi visible.
14. **Herència de drets entre dispositius.** Ara és per dispositiu. Per a tots els dispositius cal un getProfile en crear la nota o portar el copyright a la sessió.
15. **Traducció.** Cal revisar la versió basca (eu) del subtítol de /realitat.

### 4. SQL proposat (NO aplicat; cap fitxer a `supabase/`)

- Aplicar les migracions ja redactades `2609272100_notes_origen.sql` (sense ella, en remot no es guarda cap connexió) i `2609262232_copyright_editor.sql`.
- `alter table public.notes add column if not exists publish_date timestamptz;`
- `alter table public.notes add column if not exists icon text not null default '' constraint notes_icon_llargaria check (char_length(icon) <= 16);`, i després afegir `icon` a SUMMARY_COLUMNS.
- Opcional:
  - pujar el lema a 300 caràcters (`profiles_lema_llargaria` i el CHECK en línia d'`organizations`, més `create_organization`);
  - correu d'organització (`contact_email`, `public_email` i les RPC `contacte_organitzacio` i `desa_contacte_organitzacio`);
  - RPC `perfil_public`;
  - audiència real i cercles (T43);
  - `cover_image` o `hero_enquadrament` (T46).
- El text complet de cada proposta és als informes dels workflows d'este torn. Es pot reproduir a petició.

### 5. Troballes baixes conegudes (no bloquejants)

- **Calendari:** cada dia és una parada de tabulador i el canvi de mes no s'anuncia. En un portàtil de 768 px cal scroll per arribar a l'hora.
- **Enquadrament en mòbil:** a 375×812 la foto i els lliscadors no caben alhora.
- **Regions vives:** algunes són sorolloses (el comptador de CopyrightPage i l'estat de desament).
- **Botons amb `carregant`:** perden el focus (patró heretat de `Boto`).
- **Textos no normatius** a Connectar: «Simular Guardat», «en base al», «posts».
- **Claus i18n:** `section.connectar.simulat` i `section.connectar.desat` no estan definides (funciona la reserva en valencià).
- **Ruta de la connexió per defecte:** es llig de `window.location`. Amb el basename de l'embed o amb MemoryRouter no és la de l'app. Canviar-ho trenca 37 fitxers de proves que simulen RouterContext.
- **`nomDePersona`:** pot mostrar el correu com a nom a la barra negra si la persona no té nom.
- **Deute preexistent:** `h1-multiple` de DocumentPrintPreview, 14 px de `.sdp-classificacio-botonera`, `PerfilShell.css` pinta blau tot `.sdp-boto`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Vitest (`npx vitest run src`, 09:21).** 169 fitxers i 1.802 proves: 1.799 verdes i 3 roges. Les 3 roges són les de T36 (secció 3.1), preexistents i no tocades. A l'inici del torn n'hi havia 118 fitxers i 1.252 proves.
- **`node --test tests/lint-sessio.test.mjs`** (ESLint amb avisos sobre la llista de fitxers de la sessió, ampliada amb tots els de T39-T47): «Lint net».
- **Altres proves de `node --test`:**
  - `lint_logica_usuari`: 17 verdes i 2 todo preexistents;
  - `lint_xat`, `tractor-inline-styles`, `tractor-importacions`, `pedra-debt`, `design-contracts`, `action-contrast`: totes verdes.
- **`node tooling/gates/design_guard.mjs --arrel=src`:**
  - Resultat: exit 1, 539 fitxers, 29 crítics.
  - Cap identitat nova ve de T39-T47.
  - Continua roig per tres identitats de deute conegut: h1 de DocumentPrintPreview, 14 px de la botonera, i h1 del mock de la Wiki.
  - Baixa respecte de l'inici: 70 → 29 crítics, inline-style 17 → 4, raw-color 20 → 17. La llei dura `text-container` d'App.jsx desapareix.
- **Contracte i RLS:** `tractor-enxufe.mjs` E1-E4 verd (capacitats noves opcionals, contracte quadrat). `tractor-rls.mjs` verd.
- **QA visual (subagents, pestanyes de fons, sense tocar la del Mestre):**
  - Rutes: /notes, /realitat, /cerca, /pobles → /connectar i els espècimens nous de /disseny.
  - Mides i temes: 1280×800 i 375×812, clar i fosc.
  - Resultat: cap desbordament horitzontal, cap error a la consola, diàlegs que es tanquen amb Esc, la X o Cancel·lar i retornen el focus, i dies del calendari de 44×44.
  - La vista d'impressió i l'enquadrament es van mesurar abans i després.
- **Revisió adversarial per tasca i transversal:** 21 troballes confirmades a la integració (6 altes), totes corregides amb una prova que les fixa; 5 refutades.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Tancament del torn.** No s'han pogut actualitzar `.agents/ESTAT.md` ni `.agents/LEDGER.md`, ni executar `tooling/gates/tancament.mjs`. El hook bloqueja les rutes de governança, i `executor-mutacio` exigix un segell previ vàlid, però el segell és divergent des d'abans del torn (`segell-auto`: «Origen no acreditat»). Cal que el Mestre o MarIA reconcilien el segell i tanquen el torn `torn_ecbe13bd-0e46-4440-a822-99378a3f2648`.
- **Fora de les proves automàtiques:**
  - no s'ha provat res amb sessió real ni amb backend remot: publicar de veres, quarantenes reals, reclamacions, correu d'entitat;
  - /el-meu-perfil redirigix a /registre sense credencials, i no se n'ha introduït cap;
  - tampoc s'ha provat en mòbil físic, Safari 16 ni Firefox 100.
- **Portes no executades.** `tractor-vocabulari`, `tractor-tokens`, `tractor-cataleg`, `tractor-crom` i `tractor-pedra-seca` no es poden executar directament (hook). S'han revisat per lectura i per les proves de `node --test` que els embolcallen, però estes proven el motor, no l'arbre sencer.
- **Sense commit.** A l'arbre hi conviuen canvis d'este torn i canvis anteriors (T33-T38) sense commit.
- **Memòria de l'agent.** Escriure a la memòria persistent de l'agent (fora del repositori) està bloquejat pel hook. Les lliçons queden ací, a la Proposta d'Automillora.

### Proposta d'Automillora

1. **Portes per a agents.** Afegir a `READ_NODE_COMMANDS` (o com a scripts `porta:*`) `eslint` sobre fitxers concrets i els tractors de vocabulari, tokens, catàleg, crom i pedra-seca. Tots els agents del torn van topar amb el bloqueig i van haver de verificar a mà.
2. **Congelar el prompt en enganxar-lo.** Quan un prompt s'enganxa al xat, cal registrar-ne l'SHA a l'Escriptori, o bé que MarIA en faça versions noves amb un nom nou. El 260928 el text enganxat (T39-T46) i el del disc (T39-T47) divergien.
3. **Obra en paral·lel sobre CSS compartit.** Convertir en procediment de skill (`core-edicio-segura`) el pas de pre-crear un bloc CSS marcat per tasca a `modules.css` abans d'obrir agents en paral·lel. Ha evitat conflictes en un fitxer que han tocat 9 tasques.
4. **Relleu per a agents sense lease.** Donar a l'orquestrador un camí amb lease per a ESTAT, LEDGER i tancament, o un script de relleu que el hook admeta. Sense ell, cap torn d'agent pot tancar-se sol.
5. **Skills que descriuen conductes que el codi no té.** sdp-universal-editor §2.1 i §2.3 i sdp-universal-page §B van enganyar els exploradors. Proposta: una porta que compare les afirmacions verificables de les skills amb el codi, o un camp `verificat_amb:` a cada regla.
6. **Memòria de l'agent.** Permetre al hook l'escriptura a la memòria de l'agent (`~/.claude/projects/<projecte>/memory/`), o documentar-ne l'alternativa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260928_0230_ACTA_MARMOTA_marato_t39_t45]]
