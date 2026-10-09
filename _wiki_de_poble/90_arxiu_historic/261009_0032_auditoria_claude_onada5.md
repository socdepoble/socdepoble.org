---
type: informe
status: esborrany
description: 'Informe de Claude sobre l''Onada 5: routing i OG, barra inferior, caputxa i pàgina de Pobles, algoritme de Wikipedia i 404 de obri_fil_de_pagina'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6824c7a3-38fb-4dd1-9918-e257f8a9aa7e:8d98914e-f047-48f0-89b6-6a887bf86390
---
# Auditoria i lliurament de l'Onada 5 (UX de Pobles, barra inferior, Wikipedia i RPC del xat)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6824c7a3-38fb-4dd1-9918-e257f8a9aa7e:8d98914e-f047-48f0-89b6-6a887bf86390 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T22:31:12.465Z |
| Modificació | 2026-10-09T00:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5-5 (Claude Code, escriptori) |
| Tokens consumits | ≈6,8 M als subagents de quatre workflows (lectura 1,84 M; Gestoria 1,27 M; implementació 3,28 M; plugin 0,44 M). El fil principal no s'ha mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-08T22:31:12.465Z: esborrany creat; contingut i verificació pendents.
2026-10-09T00:20:00.000Z: troballes, verificació i límits complets; lliurament de l'Onada 5.

### Canal viu (relleu de progrés)

- **00:32 · Arrencada.** Llegits el pla `261008_2345_pla_implementacio_onada5.md`, el prompt `261008_2345_prompt_claude_onada5.md`, l'acta `261008_2300_acta_marmota.md` i els canvis sense commit de MarIA a `detailSectionMeta.jsx`, `elementDeSeccio.js` i `townsSeed.js`, que es prenen com a punt de partida. Torn `torn_6824c7a3` obert amb abast `code`. Observat al navegador (375 px): barra inferior `Xat, Mur, ⚙, Pobles, Mercat`; a 600 px les cinc icones queden apinyades al centre. Caputxa de la card de La Torre: `Gent de La Torre / L'Alacantí`. En local l'app corre amb llavors i no fa cap crida RPC: el 404 de `obri_fil_de_pagina` és del Supabase remot. En marxa: workflow de lectura amb sis lectors, un per front, i un crític de conflictes.
- **00:40 · Relleu de MarIA rebut.** Rellegits el pla i el prompt: s'hi afig la tasca 7 (balanç de la Gestoria sobre les botigues: factura d'Apple i connexió a internet, Google Play i el plugin de WordPress davant del directori oficial). En marxa un segon workflow, independent i de només lectura: tres investigadors, cadascun amb el seu verificador adversarial. `90_arxiu_historic/` queda fora de la lectura (AGENTS §5).
- **00:55 · Mapa verificat i implementació en marxa.** El crític ha confirmat set de les huit afirmacions de càrrega i ha corregit l'altra (el predicat d'espera del detall). Troballa urgent de la línia base: `lead: item.entradilla || item.content` pintava l'HTML del cos com a entradilla a tot arreu i deixava dues proves roges a `ItemDetailSection.imatgesPropies.test.jsx`. En marxa sis paquets amb fitxers disjunts: A (barra i àlies `/chat`), B (hidratació del detall), C1 (targeta de Pobles), C2 (pàgina del Poble i reparació de la línia base), D (xat de pàgina: memòria d'absència i migració de convergència, no aplicada) i F (Viquipèdia amb captures reals). Després hi ha una integració, tres revisors adversarials i un corrector.
- **01:10 · Decisions del Mestre.** OG per defecte: la panoràmica verda `og-socdepoble-1200x630.png` (fet a `index.html`, amb una prova nova a `src/pwa/manifest.test.js` que llig l'IHDR: 8/8 en verd). URL copiables a WordPress: `#sdp=/ruta` amb `ruta-a-url="fragment"` (paquet E en marxa, perquè l'àlies `/chat` ja és a `App.jsx`).
- **01:25 · Regles externes verificades al navegador** (els agents tenien WebFetch bloquejat): Play exigix 12 persones durant 14 dies als comptes personals posteriors al 13-11-2023, i API 36 des del 31-08-2026. WordPress.org: ZIP de menys de 10 MB, directrius 1 (GPL per a codi, dades i imatges), 4 i 8. Apple: 99 USD per any, exempció per a entitats sense ànim de lucre, i regles 4.2, 4.8 i 1.2.
- **01:30 · Node remot reparat pel Mestre i verificat.** El Mestre ha executat a l'editor SQL `2609282100_xat_de_pagina.sql`, `2610042330_xat_pagina_iaia.sql` i `2610090100_convergencia_xat_de_pagina.sql`: «Success» a totes tres. Com que la convergència avorta amb `SDP-CONV-004/005/007` si falta qualsevol dependència, el seu èxit acredita la cadena sencera (F0, xat_entitats, la canònica `security definer` amb `search_path` buit i el CHECK de `/iaia`). Sonda sense efectes des de gentdelatorre.net, amb la clau anònima pública del plugin contra el projecte `adjl…supabase.co`: una RPC inexistent de control torna 404 `PGRST202`, i `obri_fil_de_pagina` torna 401 `42501` «permission denied for function». La funció ja és a la memòria cau de PostgREST i `anon` no la pot executar, tal com mana el `revoke`. El camí autenticat queda per provar amb la sessió del Mestre. El plugin instal·lat a gentdelatorre.net és el `1.0.0-dev` i encara no porta el codi de l'Onada 5.
- **01:40 · Plugin (paquet E) tancat.** WordPress emet `ruta-a-url="fragment"` només a la instància pròpia. El verificador va trobar tres proves roges a `tests/conformitat-amfitrio.test.mjs` (la bateria només admetia atributs universals); reparades per Claude: 36/36. Readme del plugin documentat (filtre `socdepoble_enxufe_ruta_a_url` i privacitat de la ruta al fragment): 53/53.
- **02:05 · Implementació tancada.** Sis paquets, integració de `nomDeLaGent`, tres revisors amb lents diferents (correcció, doctrina i ordre literal) i un corrector que ha acceptat les cinc troballes. Suite del workflow: 511/511 fitxers i 7.942 proves en verd; node 61/61. La migració aplicada continua byte a byte (8.839 B) i el `supabase/README.md` ja diu que les tres estan aplicades.
- **02:10 · Onada 6 al radar, sense actuar.** Anotades les tasques futures que MarIA ha afegit al pla (semàfors i informació en superfície a la Consola, dates reals de naixement, Agenda cap al Calendari a l'estil Google Calendar, neteja massiva amb un Cron).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Estat per tasca

| Tasca del prompt | Estat | On |
| --- | --- | --- |
| 1 · Slugs, URL directes i OG | Fet | `index.html`, `App.jsx` (àlies `/chat`), `ItemDetailSection.jsx` (espera en fred), plugin (`#sdp=`) |
| 2 · Ordre i espaiat de la barra | Fet | `App.jsx:126`, `layout.css` (cinc pistes iguals) |
| 3 · Caputxa i clics de la targeta | Fet | `PoblesSection.jsx` |
| 4 · Anatomia de la pàgina del poble | Fet en codi; parcial en dades vives | `elementDeSeccio.js`, `detailSectionMeta.jsx`, `i18n.js` |
| 5 · Algoritme de la Viquipèdia | Fases 1 i 2 fetes; fase 3 pendent de decisions | `src/data/adaptadors/viquipedia/`, `src/sections/pobles/` |
| 6 · 404 de `obri_fil_de_pagina` | Fet i aplicat pel Mestre | `2610090100_convergencia_xat_de_pagina.sql`, `xat.js` |
| 7 · Balanç de la Gestoria | Fet (informe) | Esta secció |

### 1 · Slugs, URL directes i imatge OG

- **Causa.** No hi havia cap router de hash: socdepoble.org navega per camí i, dins de WordPress, l'app navegava en memòria i no escrivia mai la ruta a la barra d'adreces (`politicaRouter.js:118-136`). A gentdelatorre.net qualsevol fragment aterrava a `/xat` perquè el plugin declara el poble. «chat» no era cap àlies de «xat».
- **Fet.** Àlies `/chat` → `/xat` i `/chat/:id` → `/xat/:id`, amb la consulta conservada (`RedireccioXat`, patró de `RedireccioIaia`). A WordPress, per ordre del Mestre, el plugin activa la clàusula dels slugs que ja existia: `ruta-a-url="fragment"`, filtrable amb `socdepoble_enxufe_ruta_a_url`, només a la instància pròpia, i el marcatge de referència no la porta. Els enllaços queden `gentdelatorre.net/#sdp=/xat` i `#sdp=/pobles/la-torre-de-les-macanes`.
- **Hidratació.** En entrar en fred a `/pobles/<slug>`, `/mur/<id>` o `/mercat/<id>` es pintava «Element no trobat» mentre el context carregava. Ara es pinta l'àtom `Carregant` de Pedra Seca, amb la regla de `useElementDeSeccio`: només `loading` compta com a càrrega.
- **OG.** `index.html` passa de `iaia_maria_portada.jpg` (1,4 MB) a `og-socdepoble-1200x630.png`, que és la mateixa `IMATGE_BASE` de `useSEO.js`, amb tipus, mides, alt i `twitter:image:alt`. El logotip quadrat és un SVG, que les xarxes no pinten.
- **Límits coneguts.** Els rastrejadors no executen JS: l'OG per pàgina (cada poble amb la seua imatge) demana prerenderitzar, fora d'onada. Un `#/chat` literal apegat dins de WordPress no es llig (protecció WP-R4); el canònic és `#sdp=/chat`. Un `/mur/<id>` posterior als 50 primers continua sense obrir-se per enllaç directe: cal un mètode de port nou, amb ADR.

### 2 · Barra inferior

- L'ordre ix d'un array explícit (`MOBILE_NAV_TRAILING`): ara és Xat, Mur, ⚙, Mercat i Pobles, coherent amb les quatre primeres de la barra lateral. Una prova nova lliga les dues barres.
- L'apinyament venia de `justify-content: center` amb `gap: clamp(8px, 3vw, 24px)`; només a ≤400 px hi havia `space-evenly`. Ara la barra és una graella de cinc pistes iguals (`grid-auto-columns: minmax(0, 1fr)`), sense px ni tokens nous. Mesurat al navegador: pas de 75 px a 375, 115 px a 600 i 195 px a 1000, amb el ⚙ al centre exacte en totes tres.
- Defaults aplicats: sense topall a la tauleta, i «Pobles fa d'espai especial» s'ha llegit només com a posició.

### 3 · Caputxa i clics de la targeta

- Caputxa: «Gent de la Torre» / «La Torre de les Maçanes». El clic porta a `rutaXatDePagina(objecteDe(poble,'pobles'))`, el mateix xat comú que «Comentar» i el botó de la pàgina (invariant T63.2). El cos i la foto porten a `/pobles/<id>`.
- El header i el vel de la targeta ja eren germans, sense interactius niats: no ha calgut tocar `UniversalCard` ni cap CSS. La pastilla de data continua portant al Calendari.
- Categorització de la targeta: Pobles (sistema), Alacant (categoria) i L'Alacantí (etiqueta).
- El pla deia «mur del Poble» i el prompt «pàgina del Poble»: no existix cap Mur filtrat per poble, i s'ha mantingut la pàgina.

### 4 · Pàgina del poble

- Logotip de Sóc de Poble, H1 «Gent de la Torre», etiquetes, copyright de la Viquipèdia, H2 «La Torre de les Maçanes», entradilla i, davall, el botó blau gros «Parlar amb la Gent de la Torre». Reutilitza `PortaDePagina` i `.sdp-pagina-accio`, sense cap component ni CSS nou. La barra taronja signa amb l'entitat i també porta al xat.
- **Defecte amagat reparat.** La branca dels pobles de `paginaDElement` preguntava `section.id === 'pobles'`, i cap meta porta `id`: no s'executava mai. Ara es detecta per `listPath`.
- **Regressió de la línia base reparada.** `lead: item.entradilla || item.content` pintava l'HTML del cos com a entradilla a `/mur`, `/notes`, l'agenda, multimèdia i les targetes incrustades. Ara el fallback només s'aplica als pobles. Les dues proves roges d'`ItemDetailSection.imatgesPropies.test.jsx` tornen a passar.
- Clau i18n nova `section.detail.pobles.parlarAmb` en cinc llengües. Les versions basca i gallega són propostes per revisar.
- Copyright: un text de la Viquipèdia és CC BY-SA, i posar-hi BY-NC-SA (el de sèrie) no és compatible. La pàgina ara diu el mateix que la targeta (`COPYRIGHT_VIQUIPEDIA`).
- Regla «Gent de / d'» unificada a `nomsDelPoble.js` per a la targeta, l'H1 i la barra, amb la contracció de l'article («Gent del Campello», «Gent dels Poblets») i l'elisió («Gent d'Orxeta»). Per als nou pobles de la llavor el resultat és idèntic.
- **Dades vives.** La fila `app_content 'towns'` del node remot encara diu «Gent de La Torre» i no porta `provincia`. En remot, l'H1, la caputxa i el botó diran «La» amb majúscula i no hi haurà etiqueta de categoria fins que el Mestre aplique la correcció de dades de més avall. La llavor SQL (`supabase/seed.sql`) ja està alineada i una prova de paritat ho vigila.

### 5 · Algoritme de la Viquipèdia

- **Fet (fases 1 i 2).** `nomsDelPoble.js` (nom de la gent i slug), `src/data/adaptadors/viquipedia/` (client damunt de `creaFrontissa`, traductors amb DTO tancats) i `pobleDeViquipedia.js`, que no llança mai i torna `{ estat, id, title, author, content, provincia, comarca, population, lat, lng, wikidata_id, wikipedia_title, copyright, imatges: { hero, avatar, reserva }, chat }`. L'H1, l'H2, l'entradilla i l'enllaç del xat es generen; no es guarden.
- **Respecte als límits.** Cua en sèrie amb 250 ms entre peticions, `maxlag=5`, reintents de 1, 2 i 4 s només per a 429, 503, maxlag i xarxa, `Retry-After` fitat a 10 s, deduplicació de crides i memòria de sessió. Capçalera `Api-User-Agent` (la preflight passa des de localhost als tres orígens).
- **Captures reals.** Quinze respostes de la Viquipèdia, Wikidata i Commons, desades a `tests/frontissa/fixtures/viquipedia/` amb el seu `captureId` i comprovades amb sha256. Cap forma inventada.
- **Desambiguació.** Es busca a Wikidata restringit a municipis d'Espanya (Q2074737, verificat) i per província. Sella tria «Sella (Marina Baixa)» i mai el títol pelat.
- **Les tres fotos.** Amb les dades reals, la Torre només té una foto lliure de ≥1000 px: l'avatar repetix la panoràmica i no hi ha reserva. L'estat ix `parcial`, no `complet`. Decisions obertes: el llindar per rol (la reserva de 600 px, «El riu251.jpg», en domini públic), si l'avatar pot ser la panoràmica i si la reserva és un recanvi o una segona foto de carrusel.
- **Fase 3, pendent.** Capacitat opcional del port `propostaPoble`, RPC `proposa_poble` amb validació al servidor i un límit per usuari (cal ADR, AGENTS §8), disparador quan existisca el selector de poble i aprovació del tractor a la Wiki (lliçó 261002). Tot està documentat a `src/data/adaptadors/viquipedia/README.md`.

### 6 · 404 de `obri_fil_de_pagina`

- **Causa.** Al node no hi havia la cadena del xat de pàgina. El client ja enviava els noms de l'única signatura que ha existit (`p_tenant_id`, `p_tipus`, `p_id`, `p_titol`).
- **Fet.** Migració de convergència `2610090100` que no redefinix res: avorta si falta qualsevol dependència (`SDP-CONV-004`), si la canònica no és `security definer` amb `search_path` buit (`SDP-CONV-005`) o si falta la correcció `/iaia` (`SDP-CONV-007`). Esborra sobrecàrregues sense CASCADE, torna a donar els permisos i recarrega PostgREST. Al client, memòria d'absència per càrrega (patró T48), sense cap canvi de píxel.
- **Aplicat pel Mestre el 261009** i verificat amb la sonda (401 `42501` en lloc de 404 `PGRST202`). La migració es conserva byte a byte i el README en registra l'aplicació.
- **Avís de doctrina.** 2609282100 obri els fils de pàgina a tot el poble sense la moderació que ella mateixa posa com a condició prèvia. En aplicar-la, el Mestre ha assumit este deute: cal la moderació mínima (denunciar, bloquejar i amagar) abans d'obrir un segon poble i abans de les botigues (Apple 1.2, Play UGC).

### 7 · Gestoria: estat de la publicació a les botigues

**Apple i connexió a internet.**
- Cap llibre de despeses de 2026 registra la quota d'Apple Developer. Al banc hi ha un únic càrrec candidat de 98,99 € el 2-2-2026 (APPLE.COM/BILL). És compatible amb la quota anual (99 USD, verificat a developer.apple.com), però el mateix concepte servix per a iCloud o l'App Store: només el rebut ho confirma. Si és la quota, la membresia caduca cap al 2-2-2027.
- La «factura d'Apple de març/abril» més probable és la F26 0001 de l'1-4-2026, que és una factura EMESA per la venda d'un MacBook Air, no cap quota. El fitxer `invoice.pdf` del 25-3 és d'Adobe Stock (49,99 €) i no està registrat al 1T.
- Internet: Lowi (fibra i mòbil, 29,95 € al mes) registrada de gener a maig. Falten els PDF de juny, juliol i agost, que el banc ja ha cobrat (amb pujada fins a 33,95 €). La de març està duplicada a les carpetes del 1T i del 2T. El termini del 3T és el 20-10.
- Contradicció de fons: un compte d'organització d'Apple exigix una entitat jurídica amb D-U-N-S, i els llibres i el text legal són d'una persona física. Si l'entitat és una associació sense ànim de lucre, Apple oferix exempció de la quota.

**Google Play.**
- Molt avançat en paper: la fitxa de Play Console està redactada camp per camp (Data safety, IARC, públic, esborrat i accés de revisors). En binari, res: ni Capacitor, ni `android/`, ni AAB, ni clau de pujada.
- Regles verificades: un compte personal posterior al 13-11-2023 necessita una prova tancada amb 12 persones durant 14 dies seguits, i des del 31-08-2026 les apps noves han d'apuntar a l'API 36.
- Camí crític: confirmar el tipus de compte; la lease de Capacitor; la moderació mínima; l'URL web d'esborrat del compte; les decisions legals (entitat titular igual a la de la política de privacitat, DSA); i un backend al dia (fet hui per al xat de pàgina). Estimació: finals d'octubre o primera setmana de novembre amb compte d'organització, i mitjan novembre amb compte personal.

**Plugin de WordPress.**
- El directori oficial admet ZIP de menys de 10 MB (verificat). La variant del directori fa 134 MB: el pes ve de les imatges de `public/` copiades senceres, amb duplicats exactes i fotos de 6-7 MB.
- La directriu 1 (verificada) exigix GPL o compatible per a codi, dades i imatges, i el contingut de sèrie és CC BY-NC-SA, que no ho és. La directriu 4 exigix font pública i mantinguda: el remot del readme no rep cap pujada des del 20-09.
- Proposta: dues edicions. Una lleugera per a WordPress.org, amb les imatges servides des del Supabase Storage de Sóc de Poble declarat com a servei (encaixa amb la directriu 8 i el Model B). Una de completa pel canal propi signat, que ja existix però té la clau pública buida.
- **Avís important.** El ZIP `socdepoble-enxufe-v1.0.6-261008_2036.zip`, que l'acta 261008_2300 presenta com a lliurament, no porta cap PHP: no s'instal·la com a plugin. El de les 23:30 porta restes i un dist `1.0.0-dev`. Gentdelatorre.net té instal·lat el `1.0.0-dev`. Cal refer la 1.0.6 amb l'empaquetador (MarIA) per a portar-hi l'Onada 5.

### Troballes laterals

- **Deute de l'Onada 4 que bloqueja el pre-commit.** `src/sections/profile/enquadramentAvatar.limits.test.jsx` importa `DialegCapcaleraAvatar.jsx`, que es va esborrar. `enquadramentAvatar.privacitat.test.jsx:153` crida `desaRetall` sense definir-la. Fan roig `qualitat.logotip.test.js` i `tests/lint-sessio.test.mjs`. No és de l'Onada 5, i no s'ha tocat.
- Les actes 261007_0025 (afirma que l'empaquetat complix els 10 MB) i 261008_2300 (presenta el ZIP 2036 com a lliurament) contenen afirmacions falses: les ha de corregir MarIA.
- La skill `core-empaquetat-wp` es contradiu sobre la destinació dels ZIP (§2 i §3) i no esmenta la variant del directori ni el límit de 10 MB.

### Correcció de dades per al node remot (l'aplica el Mestre)

Correcció de la fila viva dels pobles: «Gent de la Torre» i la província. Afegiu-hi el filtre del vostre `tenant_id` abans d'executar-la.

```sql
update public.app_content c
set payload = (
      select jsonb_agg(
               case
                 when t.e->>'id' = 'la-torre-de-les-macanes'
                   then t.e || '{"provincia":"Alacant","author":"Gent de la Torre","linkTo":"Gent de la Torre"}'::jsonb
                 when t.e->>'id' in ('penaguila','benifallim','sella','orxeta','relleu','alcoleja','xixona','tibi')
                   then t.e || '{"provincia":"Alacant"}'::jsonb
                 else t.e
               end
               order by t.ord)
      from jsonb_array_elements(c.payload) with ordinality as t(e, ord)
    ),
    updated_at = now()
where c.key = 'towns'
  and jsonb_typeof(c.payload) = 'array'
  and jsonb_array_length(c.payload) > 0;
```

### Accions pendents per responsable

- **Mestre:** aplicar la correcció de dades de dalt; provar amb la sessió iniciada la caputxa i el botó «Parlar amb…» quan el plugin porte l'Onada 5; mirar a Apple i a Play el tipus de compte, la caducitat i la quota; baixar les factures de Lowi de juny a agost i el rebut d'Apple de 98,99 €; decidir l'entitat titular, la llicència del contingut que viatja al plugin i la fase 3 de la Viquipèdia.
- **MarIA:** actualitzar ESTAT i LEDGER (ruta de governança, Claude no hi pot escriure), anotant que el Mestre ha aplicat la cadena del xat de pàgina i ha assumit el deute de moderació; refer el ZIP 1.0.6 amb l'empaquetador, amb l'entrada al changelog; corregir les dues actes; crear el document d'aprovació del tractor de la Viquipèdia (lliçó 261002); fer l'Acta Marmota; i encarregar la reparació de les proves del Perfil.
- **Claude, amb ordre:** moderació mínima, edició lleugera del plugin i fase 3 de la Viquipèdia.

### Retroalimentació de la plantilla prompt_local

- El camp «Model IA» del Registre venia omplert amb un model antic. Proposta: que `document.mjs create` el deixe `[pendent]` perquè l'òmpliga el receptor.
- El prompt no deia que el hook del projecte bloqueja WebFetch, WebSearch i les escriptures fora del repo per als agents. Una línia a la plantilla ho estalviaria; el navegador integrat sí que està permés.
- Pla i prompt es contradeien en un punt («mur del Poble» davant de «pàgina del Poble»). Una comprovació de paritat entre el pla i el prompt de la mateixa Trinitat ho evitaria.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves del workflow (suite final):** `npx vitest run` sobre `src/app`, `src/sections/detail`, `pobles`, `xat`, `mur`, `mercat`, `disseny`, `src/data`, `src/components`, `src/css` i `src/config`: 511/511 fitxers, 7.942 verdes, 0 roges i 2 omeses. Node: `migracio-xat-de-pagina` i `enxufe-plugin`, 61/61.
- **Proves de Claude després del workflow:** `node --test tests/migracio-xat-de-pagina.test.mjs tests/conformitat-amfitrio.test.mjs tests/enxufe-plugin.test.mjs` dona 77/77. `tests/enxufe-pantalla.test.mjs` i `tests/enxufe-empaqueta.test.mjs`, juntament amb `enxufe-plugin`, donen 53/53. `src/pwa/manifest.test.js` dona 8/8.
- **Suite completa de `src` (`npx vitest run src`, 261009):** 872 de 876 fitxers en verd i 1 omés. Hi ha 14.709 proves verdes, 2 roges i 8 omeses. Els tres fitxers rojos són els heretats del Perfil (troballes laterals): `qualitat.logotip`, `enquadramentAvatar.limits`, que no carrega, i `enquadramentAvatar.privacitat`. Cap fitxer de l'Onada 5 hi apareix.
- **Navegador (pestanya de fons, mai la del Mestre):** a 375 px, caputxa, enllaç del xat, vel, etiquetes i barra conformes. A 600 i 1000 px, pistes iguals i ⚙ centrat. A la pàgina del poble, l'anatomia completa, i el botó obri el fil `/xat/<id>?sobre=poble:la-torre-de-les-macanes` en mode llavor. L'àlies `/chat?vista=comunitats` porta a `/xat?vista=comunitats`.
- **Node remot:** sonda sense efectes amb la clau anònima pública. Control: 404 `PGRST202`. `obri_fil_de_pagina`: 401 `42501`.
- **Revisió adversarial:** tres revisors amb lents diferents van trobar cinc problemes reals: la deduplicació del client de Wikimedia, la guarda de Pedra Seca §8 pel nom `panoramica`, el README desfasat, la província absent a `seed.sql` i l'estat «complet» amb una sola foto. El corrector va reproduir cada problema amb una prova roja abans de corregir-lo.
- **Regles externes:** verificades a les fonts oficials (support.google.com, developer.android.com, developer.wordpress.org i developer.apple.com) el 261009.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Claude no ha fet cap commit ni cap mutació de git. El pre-commit fallarà per les tres proves heretades del Perfil fins que algú les repare.
- `.agents/ESTAT.md`, `.agents/LEDGER.md` i `tooling/` són rutes de governança: el hook bloqueja l'escriptura directa. L'ESTAT, el LEDGER i el tancament del torn (`tancament.mjs`) queden per a MarIA o el Mestre amb lease.
- No s'ha aplicat res a cap base de dades. L'únic contacte amb el node remot ha sigut la sonda de lectura, que no executa res.
- Les captures de la Viquipèdia i la verificació de regles externes s'han fet amb el navegador integrat, en una pestanya de fons i només amb GET públics.
- El camí autenticat de `obri_fil_de_pagina` no l'ha pogut provar Claude: no inicia sessions.
- No s'ha llegit `90_arxiu_historic/` (AGENTS §5). L'auditoria de botigues del 261008_1407 que hi ha arxivada no s'ha consultat.
- Les tasques de l'Onada 6 que MarIA ha afegit al pla estan anotades i no s'hi ha tocat res.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
