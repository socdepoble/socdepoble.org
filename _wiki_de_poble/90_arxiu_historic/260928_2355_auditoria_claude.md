---
type: informe
status: esborrany
description: Implementació i verificació de T61 a T71 (navegació, blau actiu, Xat calcat de WhatsApp, comunitats i xat de pàgina, cerca global, emoticona del perfil i Connectar) amb valoració arquitectònica.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_55aca329-9a08-4046-87d4-c82e02ae7536:da0f6e25-70e4-4758-9b64-9d3c5d8518fe
---
# Auditoria i implementació de l'Onada Final T61-T71

Informe del torn `torn_55aca329` (code) sobre el prompt [[../90_arxiu_historic/260928_1910_prompt_claude_onada_final]] i el pla [[../90_arxiu_historic/260928_1910_pla_implementacio_claude_onada_final]]: què s'ha fet, com s'ha verificat, què queda obert i la valoració arquitectònica que demanava el prompt.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_55aca329-9a08-4046-87d4-c82e02ae7536:da0f6e25-70e4-4758-9b64-9d3c5d8518fe |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-28T21:54:01.757Z |
| Modificació | 2026-09-28T23:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), director i 44 subagents |
| Tokens consumits | Subagents 13,31 M (recompte de l'arnés: mapa 2,56 M, onada 1 2,62 M, onada 2 4,69 M, 3A 1,66 M, 3B 1,77 M); fil principal no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-28T21:54:01.757Z: esborrany creat amb rebut.
- 2026-09-29, 01:20 (hora local): v1.0.0 amb el contingut complet, després de les onades 1, 2, 3A i 3B i de la verificació final.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Mètode

- El prompt s'ha acceptat: porta el Pla d'Implementació i les seccions de la plantilla. El títol deia «T61-T69», però en llistava onze (T61-T71). S'han fet totes onze.
- Base de partida: `npx vitest run src`, 189 fitxers i 2.163/2.163.
- Cinc workflows amb propietat de fitxers disjunta (no hi ha worktrees: l'arbre porta molts canvis sense commit):
  - un mapa de només lectura (8 lectors i un crític de cobertura);
  - l'onada 1 (5 tasques);
  - l'onada 2 (7 tasques);
  - la 3A (columna de llista del Xat);
  - la 3B (rail, vistes i catàleg).
- Cada implementació ha passat per un revisor adversarial; a la 3A i a la 3B n'hi havia dos, un de correcció i un de fidelitat a les captures. Els defectes confirmats s'han corregit en una segona passada.
  - Mitjans trobats i corregits: 1 a T62, 3 a la migració del xat de pàgina, 3 a les entrades de Comentar, 6 a la 3A i 1 a la 3B.
  - Baixos: queden els que es declaren a «Límits».
- Les onze captures de WhatsApp Desktop que el Mestre va desar a `01_produccio/` han sigut la referència visual. Els subagents les han llegides directament.

### Decisions del Mestre (28-09, al xat)

1. **T68:** calc literal de WhatsApp. El «…» es queda i porta «Seleccionar xats». El «+» obri el diàleg «Nova conversa».
2. **Rail:** Telefonades, Novetats, Contingut multimèdia i Destacats entren NOMÉS visualment, amb vistes «En construcció».
3. **T62, abast:** blau a la 1a i a la 2a columna.
4. **T62, color:** a la 1a columna, blau fort `--sdp-secondary-600`, amb text i icona blancs (7,20:1).
5. **T62, marcador:** blanc de 3 px, perquè l'actiu no depenga només del color (WCAG 1.4.1).
6. **T70:** la barra taronja del Xat és el component canònic. El dia sense hora compleix la regla §10 i es tanca sense codi.
7. **T65:** la nota de benvinguda continua editable, però signa sempre «Sóc de Poble».
8. **T63:** en llavor es queden la IAIA i la Comunitat «Sóc de Poble» (Avisos + General). Fora les persones i els grups inventats.

### Decisions del director (documentades, reversibles)

- **Novetats:** continua obrint el Control del xat (`/control-xat`). És una ordre anterior del Mestre (27-09) i l'única entrada del rail que ja funcionava.
- **T61:** a `/el-meu-perfil` no s'encén cap entrada de la barra. Els perfils públics i `/realitat` no s'han tocat: queden com a pregunta.
- **T66:** columna `profiles.icon` (text, admet null, CHECK de 16 caràcters) només per a la persona.
- **T63.2:** les pàgines de text amb xat comú són una llista TANCADA, `PAGINES_AMB_XAT`, amb les 13 pàgines públiques del menú. Ha de confirmar-la el Mestre.
- **Comentar:** a una persona o a la IAIA és el missatge directe. Les notes, carpetes, categories i etiquetes no tenen xat comú.
- **Sense xat:** on no n'hi ha, el botó Comentar es queda i avisa, en lloc d'amagar-se (Llei del Píxel).

### Per tasca

- **T61 · fals actiu de Pobles.**
  - La causa era una dada: T27 va penjar `/el-meu-perfil` de les subrutes de Pobles (`src/config/sections.js`).
  - S'ha llevat, i el comentari de T27 ho explica.
  - Proves noves: `sections.test.js` (contracte), `RouterContext.navlink.test.jsx` (la frontera del prefix) i `App.test.jsx`. Aquesta última comprova, amb sessió, que no s'encén cap entrada, i conserva les de `/pobles`, `/poblacio` i `/control-xat`.
- **T62 · actiu blau.**
  - **2a columna:** les fitxes actives de llistat tenen fons `--sdp-accio-subtil`, vora de 3 px en `--sdp-accio` i text fosc. Afecta Perfil, Disseny, Wiki, Admin, Publicacions i Connexions.
  - **1a columna de crom** (arbres, rail del Xat i rails plegats): la fila activa té fons `--sdp-crom-seleccio-fons` (blau fort), text i icona en `--sdp-crom-seleccio-text` (blanc) i un marcador blanc de 3 px.
  - Hi ha dos tokens nous, i un tercer, `-vora`, per a l'arrel del rail plegat.
  - La barra CONTROL i les capçaleres conserven el taronja (`--sdp-crom-actiu-*`).
  - La prova `src/css/navegacio-secundaria.capes.test.js` (51+ asserts) verifica tokens, xifres de contrast, que no hi haja hex i que el marcador no desplace res.
- **T63.1 · llavor del Xat.**
  - Fora Pepa, Vicent, Maria, Toni i la Comissió de Festes: persones, fils i 43 missatges.
  - Queden la IAIA, la Comunitat «Sóc de Poble» (subjecte: la Pàgina Universal de l'entitat) amb «Avisos» (canal) i «General» (grup), i el padró Javi, Sóc de Poble i la IAIA.
  - També s'ha retirat `MEMBRE_ADMIN_PILOT`.
- **T63.2 i T67 · Comentar obri el Xat comú de la Pàgina Universal.**
  - Contracte: la capacitat OPCIONAL `xatDePagina` (el nucli de 32 mètodes no es toca). La regla única és `subjecteDeXat`, a `src/data/contracte.js`.
  - Una entitat o un poble fan de Comunitat, amb Avisos i General. Un element (publicació, producte, acte, mitjà o pàgina de la llista) fa de grup.
  - En llavor i en local, `localXat.obriFilDePagina`.
  - En remot, la migració `2609282100_xat_de_pagina.sql`, NO aplicada:
    - obrir no et fa participant: es llig sense entrar i s'entra en escriure;
    - en un fil de pàgina cadascú només veu la seua fila de participant;
    - la visibilitat de l'organització es torna a comprovar també per als participants;
    - la baixa d'un compte no purga els fils de pàgina.
  - Totes les entrades de Comentar (Mur, Mercat, Pobles, detall, publicacions, connexions → l'ORIGINAL, perfils, actes, directori) passen un objecte tipat.
  - La barra blava diu «Comentar al xat comú» o «Comentar per missatge directe».
  - El Xat llig `?sobre=`, obri el fil i mostra «Sobre: …», el recompte de participants i l'avís «Escrius al xat públic de …».
- **T64 · Galeria/Cronologia centrada**, amb la classe existent `.sdp-pindola--centrada`, sense CSS nou.
- **T65 · autoria de la benvinguda.**
  - `autoriaDeNota` torna «Sóc de Poble» (derivat de `DEFAULT_AUTHOR`) per a `n1`, la còpia de prova i l'estat buit.
  - La nota continua editable.
- **T66 · emoticona del perfil.**
  - Migració `2609282035_perfil_emoticona.sql`, no aplicada.
  - Llistes blanques de `auth.js` i `localPerfils.js`, i `perfilCamps` amb la validació `emojiSol`.
  - Botó de la Barra Taronja cablejat a `PerfilEditor`, amb quarantena si la columna no existix.
  - La fitxa pública la mostra en lectura.
  - T66b: focus de l'avís i estat buit en lectura.
- **T67, T68 i T69 · Xat calcat de WhatsApp.**
  - **Capçalera:** «…» a l'esquerra, amb «Seleccionar xats», i «+» a la dreta.
  - **Selecció de converses:** amb «Marcar com a llegides».
  - **Diàleg «Nova conversa»:**
    - cercador;
    - «Nou grup» i «Nova comunitat», amb un panell honest que diu que naixen d'una Pàgina Universal;
    - «Contactes freqüents»;
    - «(Tu)»;
    - el padró per lletres.
  - **Cercador global:** en fer focus, la llista vertical de 8 filtres. En escriure, els resultats per Converses, Persones i Missatges amb el motor pur `cercaXat.js`, que reutilitza `indexCerca.js`.
  - **Fila de comunitat:** avatar quadrat apilat, xebró i «Avisos, General». La fitxa de comunitat porta «Grups als quals pertanys» i «+ Afegir grup».
  - **Rail:** amb les seccions «Més» i «Comunitats» i el peu «Tu» + llapis.
  - **Vistes:** Comunitats, i Telefonades, Contingut multimèdia i Destacats «En construcció».
  - **Catàleg:** espècimens de tot el que és nou.
  - La «capçalera blava estranya» de T69 no s'ha reproduït. No hi ha cap camí de codi que l'obriga en fer focus: el que es veia era la barra blava del document per defecte de la columna dreta.
- **T70 · barra taronja del Xat.** No hi ha cap fantasma: la munta el component canònic `BarraTaronja.jsx`. La font de «L'Ànima de la IAIA» és un dia sol (`pageContent.js`), i per §10 es pinta sense hora. Tancada sense codi, per decisió del Mestre.
- **T71 · Connectar.**
  - **Intern:** accés directe de només lectura.
    - A la llista, `ConnexioFitxa` porta la imatge, el títol, l'autor i la data de l'ORIGINAL.
    - En obrir-la, `ConnexioDetall` mostra la Pàgina Universal original. També per a les pàgines de text, amb `paginaDeText.js`: exigix `pageKey` i exclou `/disseny`.
    - Mai Foraster ni placeholders.
  - **Extern:** base del bookmarklet amb `contingutExtern.js`.
    - Només `http(s)`, sense tallar res en silenci.
    - L'element nou és editable, a «Connectats», i només es crea amb un clic.
    - Al Mur es COMPARTIX citant l'origen, sense imatges de tercers.
  - T71b: tall per punts de codi i autoria de l'original, no de la URL.

### Valoració arquitectònica (tasca conceptual del prompt)

**Xat com a espai de comentaris de la Pàgina Universal.**

L'enfocament és coherent: un objecte, un fil i sense comentaris niats. Encaixa amb el Model B, perquè és una capacitat opcional que un node sense ella declara amb un avís honest. També encaixa amb el Fedivers:

- `subjecte_uri` és l'identificador d'objecte d'ActivityPub;
- el xat d'una pàgina és la seua col·lecció de respostes;
- una comunitat és un actor Group.

Perquè no es gire en contra, cal complir sis condicions:

1. **Llegir sense entrar.** Ja està a la migració.
2. **Moderació mínima** (amagar, expulsar, tancar, denunciar, «eixir del fil») abans d'obrir-ho a tot el poble. No existix.
3. **Fils de pàgina sota «Comunitats»** i no a la safata privada. Està fet per a les comunitats; els grups d'element, de moment, van a la llista.
4. **Una clau canònica estable.** Està fet: la llista tancada i les rutes derivades pel servidor.
5. **Desplegar F0, `xat_entitats` i `2609282100`, en eixe ordre**, abans de cap client que ho necessite.
6. **Propagar la doctrina a `sdp-universal-page` §33.** Proposta a «Límits».

**Cerca global.** Un sol motor pur, amb dues lents: `/cerca`, que ho indexa tot, i el Xat (converses, persones i missatges carregats). Els missatges no carregats necessiten una capacitat opcional del servidor: una FTS subjecta a les RLS de participant, mai un índex compartit de missatges privats. Els filtres de mitjans quedaran buits fins que el client envie adjunts, i ho diuen amb un avís honest.

### Troballes fora d'abast (deute detectat)

- **`config.js:50`, canvi extern.** A les 23:51:35, durant el torn, un altre actor va canviar `await candidate.realtime?.setAuth?.(jwt)` per `candidate.realtime?.setAuth?.(jwt).catch(() => {})`.
  - Quan `setAuth` no torna cap promesa, la crida peta: 6 roges a `src/data/supabase/config.test.js`.
  - No el toca cap agent d'aquest torn. La còpia `config.js.bak` (14:54) conté la línia anterior.
  - Pegat d'una línia que conserva la intenció: `if (jwt) Promise.resolve(candidate.realtime?.setAuth?.(jwt)).catch(() => {});`.
- **Ajustos personals visibles als grups F0.** `xat_participants` té `grant select` de taula. En un grup normal, qualsevol participant veu els ajustos personals dels altres (silenciat, arxivat, fixat, etiqueta, llegit fins a). Cal una migració amb permisos per columna o una RPC de roster.
- **Emojis als arbres.** Els glifs emoji de l'arbre del Disseny conserven el color a la fila activa blava. Les icones SVG sí que passen a blanc.
- **Fons actiu en fosc.** A la 2a columna, el fons actiu es distingix poc del fons de la llista (1,25:1). L'estat el porta la vora (4,01:1).
- **`useLocalSandbox.js`.** Desa amb la clau `${key}:${id}` i llig `drafts[initial.id]`. No verificat.
- **Servidor del 3340.** Va caure durant la 3A, mentre un subagent verificava al navegador compartit. Es va tornar a engegar amb la configuració `vite-dev`. A partir de la 3B, cap subagent ha usat el navegador.

### Retroalimentació de la plantilla prompt_local

- **Llista de tasques.** El títol i el frontmatter han de dir la mateixa llista que el cos: «T61-T69» contra onze tasques.
- **Xifra de proves.** «Tots els 2.163 tests» era certa a l'inici. Convé escriure «tota la suite en verd (base: N)» perquè la xifra no quede vella a mig torn.
- **Captures.** Quan el Mestre adjunta captures, el prompt n'hauria de nomenar la ruta. Ací es van trobar a `01_produccio/` per un crític, no per l'encàrrec.

## Proposta d'Automillora

1. **Una decisió visual es pregunta amb evidència, al principi.** Sis preguntes al Mestre, tres d'elles amb la mesura en viu, van estalviar onades senceres de refer.
2. **Dos revisors per a la UI.** A la 3A i a la 3B, el de fidelitat va trobar defectes que el de correcció no veia (megàfon, eix, alineació, focus), i viceversa.
3. **El navegador és un recurs compartit.** Un subagent no l'ha de fer servir: el servidor pot caure i la pestanya del Mestre queda bruta. La verificació visual la fa el director en una pestanya nova.
4. **L'emulació de mida del navegador desquadra els clics.** Per a provar interaccions reals, cal la mida real del panell. L'emulació només serveix per a captures.
5. **Un contracte de dades fixat abans d'una onada paral·lela.** El «contracte del Xat» va permetre que la llavor, les dades i la UI avançaren alhora sense trepitjar-se.
6. **L'arbre concurrent necessita un senyal.** Un canvi extern (`config.js`) va trencar la suite a mitja nit. Una marca «editant» o una nota a l'Escriptori evitaria culpar un torn d'un roig que no és seu.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src` (base, abans del torn) | 189 fitxers, 2.163/2.163 |
| `npx vitest run src` (després de l'onada 2) | 202 fitxers, 2.492/2.492 |
| `npx vitest run src` (després de la 3A, segons el corrector) | 209 fitxers, 2.540/2.540 |
| `npx vitest run src` (final, 01:12) | 212 fitxers, **2.617/2.623**; les 6 roges són totes de `src/data/supabase/config.test.js`, pel canvi extern de `config.js:50` (vegeu «Troballes») |
| `node --test` lint_xat, lint_logica_usuari, migracio-xat-de-pagina, migracio-perfil-emoticona, xat_f0_migracio, action-contrast | 120 verdes, 0 roges, 1 diagnòstic heretat (classes òrfenes de `PageFrame.jsx`, anterior al torn) |
| Navegador, /multimedia | La píndola Galeria/Cronologia està centrada |
| Navegador, /disseny | 1a columna: fons #00599d, text i icona blancs. 2a columna: fons #f1f8ff, vora de 3 px #0984E3, text fosc |
| Navegador, llavor, Foraster: connectar /ia i obrir-la a /notes | La pàgina original, amb imatge, títol, etiquetes i copyright. Barra «Sóc de Poble · La Torre de les Maçanes · 11/08/26». Cap camp editable ni ploma. Fitxa de llista amb imatge real i «De Sóc de Poble» |
| Navegador, /xat (llavor) | Fila de comunitat «Sóc de Poble» (quadrada, «Avisos, General», xebró, 1 no llegit), «…» i «+». Diàleg «Nova conversa» amb l'estructura de la captura. Focus al cercador amb clic real: llista vertical de 8 filtres |
| Navegador, pestanya nova, /xat?vista=comunitats i ?vista=telefonades | Rail amb Més, Comunitats i el peu Tu. Fila activa #00599d, text blanc i marcador `::before` de 3 px blanc. Vista Comunitats com la captura. Telefonades «En construcció». Cap error de consola |
| Navegador, /constitucio → Comentar | «Comentar al xat comú» obri el grup «Constitució» amb «Sobre: Constitució · 1 participant» i l'avís «Escrius al xat públic de «Constitució»» |
| T61 amb sessió | Només amb proves d'integració (App.test.jsx): el navegador no té sessió de proves |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### No s'ha pogut fer (i per què)

- **Governança.** ESTAT, LEDGER i `tancament.mjs --close` no s'han pogut fer: el hook bloqueja `.agents/` i `tooling/`, i el segell és divergent («Origen no acreditat»). El relleu d'ESTAT i LEDGER va a continuació, per a qui tinga la lease.
- **Porta F8** (`tooling/gates/tractor-fitxa-gestor.mjs:43` i `:114`). Exigix literalment `--sdp-accent-text` a la fitxa activa, i ixirà roja fins que s'aplique el pegat. Línia 114: `{ 'border-left-color': 'var(--sdp-accent-text)' }` → `{ 'border-left-color': 'var(--sdp-accio)' }`. Línia 43: el comentari ha de dir `--sdp-accio (T62)`.
- **Portes no executades.** `design_guard`, `tractor-crom`, `tractor-cromatic` i `tractor-rls` no estan a la llista permesa del hook. S'han verificat llegint-ne el codi i replicant-ne la lògica en proves.
- **Migracions no aplicades:** `2609281500` (lema i entradilla de 256), `2609282035` (emoticona) i `2609282100` (xat de pàgina, que depén de F0 i de `xat_entitats`).

### Instruccions per a les migracions (T66)

1. **Local**, amb el contenidor de `tests/integration/local-auth-chat.mjs`:
   - `docker exec -i supabase_db_socdepoble.org psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/migrations/2609281500_lema_entradilla_256.sql`
   - després, el mateix amb `2609282035_perfil_emoticona.sql`.
   - Verificar els CHECK (`lema <= 256`, `icon <= 16`) i `has_column_privilege('authenticated','public.profiles','icon','UPDATE')`.
2. **Producció**, per l'SQL Editor del panell: cada fitxer SENCER i UNA vegada, en el mateix ordre. Primer, una còpia i la consulta dels CHECK.
3. **Ordre obligatori:** les migracions van abans de publicar el client. Si no, els lemes de 121 a 256 caràcters reben l'error genèric i l'emoticona queda en quarantena al dispositiu.
4. **No feu `supabase db push`** mentre el registre remot no estiga quadrat: tornaria a executar migracions velles no idempotents. Després de psql o de l'SQL Editor, cal fer `supabase migration repair … --status applied`.
5. **No verificat:** al repo no hi ha `supabase/config.toml`.

### Decisions que queden per al Mestre

1. **`PAGINES_AMB_XAT`:** confirmar o retallar la llista de pàgines de text amb xat comú (13 pàgines públiques del menú).
2. **Perfils públics i `/realitat`:** han de continuar encenent Pobles i «L'ànima de la iaia»? (T61 no els ha tocat.)
3. **`config.js:50`:** aplicar el pegat d'una línia o avisar l'actor que el va canviar.
4. **Traduccions:** revisar els textos es, en, eu i gl de les claus noves del Xat i de les Notes (esborranys, sobretot eu).
5. **Deute de T66:** organitzacions i agents sense emoticona al servidor; `notes.icon` i `publish_date` sense columna; la baixa no retira `icon` ni `copyright`.
6. **Obrir el xat de pàgina a tot el poble:** abans cal la moderació, «eixir del fil», les polítiques de `realtime.messages` i `url_publica_node`.

### Text proposat per a les skills (governança; per a qui puga segellar)

- **`sdp-universal-page` §32-33:** «Un trio d'icones centrat compost per «Traductor», «Comentar» i «Compartir». *Regla del Botó Comentar (T63.2):* No obri cap fil de comentaris davall de la targeta. Obri (o crea) el Xat comú de la Pàgina Universal: un grup per a un element (publicació, producte, acte, mitjà o pàgina de `PAGINES_AMB_XAT`) o la Comunitat d'una entitat, un grup o un poble. Per a una persona o una IA és el missatge directe. Les notes, carpetes, categories i etiquetes no en tenen. On no hi ha xat, el botó es queda i avisa. Regla: `subjecteDeXat` (`src/data/contracte.js`); ruta: `rutaXatDePagina` (`src/config/objecteConnectable.js`).»
- **`sdp-pedra-seca` §2:** «`--sdp-crom-seleccio-fons` / `--sdp-crom-seleccio-text` (Blau 600 amb text Blanc; 7,20:1), amb un marcador blanc de 3 px: element actiu de la navegació secundària sobre crom (1a columna, rail del Xat, rails plegats). Quan el fons d'un element actiu és blau, el text i la icona són blancs (Mestre, 260928). `--sdp-crom-actiu-*` queda reservat a la barra CONTROL i a les capçaleres.»
- **`sdp-app-grid-shell`:** el rail del Xat porta les seccions plegables «Més» i «Comunitats» i el peu «Tu» + llapis. Novetats obri el Control del xat.

### Relleu per a ESTAT i LEDGER (text per a copiar amb lease)

```markdown
## ESTAT_ACTUAL · 2026-09-29 01:20 · Claude (Opus 5.5) · Onada Final T61–T71
- Torn `torn_55aca329` (code). Auditoria [[260928_2355_auditoria_claude]].
- Fet: T61 (Pobles fora de /el-meu-perfil), T62 (blau a la 1a i a la 2a columna, blau fort amb text blanc i marcador de 3 px), T63 (llavor neta, comunitat SdP, Comentar → xat comú amb migració 2609282100 no aplicada), T64, T65, T66 (profiles.icon, migració 2609282035 no aplicada), T67–T69 (Xat calcat de WhatsApp: «…», diàleg Nova conversa, cerca amb filtres, comunitats, rail i vistes), T70 (sense codi, §10), T71 (Connectar: intern en lectura, base de l'extern).
- Proves: vitest 212 fitxers, 2.617/2.623; 6 roges a config.test.js per un canvi extern a config.js:50 (pegat a l'auditoria). node:test 120/120 i 1 diagnòstic heretat.
- Pendent: pegat F8, aplicar migracions (lema → emoticona; F0 → xat_entitats → xat_de_pagina), PAGINES_AMB_XAT, doctrina de les skills, tancament i commit.
```

```markdown
260929 | torn | code | Onada Final T61–T71 implementada; 2.617/2.623, 6 roges externes
```

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/260928_1910_prompt_claude_onada_final]]
- [[../90_arxiu_historic/260928_1910_pla_implementacio_claude_onada_final]]
