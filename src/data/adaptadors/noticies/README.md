---
type: document
status: actiu
description: "Fonts del Lector de notícies: el catàleg del sistema (els referents del §23), les fonts personals, el client del servei de notícies del poble, el contracte sdp.noticies.v1 (amb l'estat i les imatges), els motius d'error, la privacitat de veres i el que decidix el Mestre."
---
# Fonts del Lector de notícies

T5 (P1-07, 261024), T5b (ordre del Mestre, 261024), la passada del Lector de 261024 (troballes R5, D-08 de Codex, G2-03 de Gemini) i la passada final del Lector (troballes R6 del servei, L-01 a L-13, 261024). Esta carpeta porta notícies de veres a `/app/lector` sense trencar la regla del Lector (`src/apps/lector/fontNoticies.js`): **el navegador del veí no toca mai l'origen d'una font**, ni per a l'XML ni per a les imatges. Els feeds i les seues imatges els llig el servei de notícies del poble, una funció del backend segellat (`supabase/functions/noticies/`), i el navegador només li demana un feed pel seu id, una font personal per la seua adreça, o una imatge que el servei ja ha vist en un feed.

## Les fonts del sistema: els referents del §23

Ordre del Mestre (261024): les fonts amb què comença el Lector són **exactament** els referents de coneixement obert del §23 del text legal («Agraïments a la comunitat divulgadora i de codi obert», `src/sections/text/legalContent.js`). Totes en castellà (`llengua: 'es'`), comprovades el 261024 amb l'agent honest del servei i **amb GET**, com les demana el servei (200, adreça final, sense redireccions). Un HEAD no basta (R6 L-06): el de Jon Hernández deia 200 mentre tot GET rebia un 304 buit.

| Id | Nom | Categoria | Feed | Lloc |
| --- | --- | --- | --- | --- |
| `emowe` | Emowe (Marcos) | `coneixement` | `https://emowe.com/rss.xml` (el feed que anuncia la web; `/feed/` és 404) | `https://emowe.com` |
| `ayudawp` | Fernando Tellado · AyudaWP | `coneixement` | `https://ayudawp.com/feed/` | `https://ayudawp.com` |
| `xavier-mitjana` | Xavier Mitjana · IA en Acción | `coneixement` | `https://iaenaccion.com/feed/` | `https://iaenaccion.com` |
| `jon-hernandez` | Jon Hernández | `coneixement` | `https://www.jonhernandez.education/feed/atom/` (Atom, 19 KB; el `/feed/` de RSS respon a tot GET sense condicions un 304 sense cos, la memòria cau de la seua web, R6 L-06) | `https://www.jonhernandez.education` |
| `migue-baena` | Migue Baena | `videos` | `https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A` (Atom, «Migue Baena IA») | `https://www.youtube.com/@MigueBaenaIA` |
| `ben-cord` | Ben Cord (Benjamín Cordero) | `videos` | `https://www.youtube.com/feeds/videos.xml?channel_id=UCpq8lHHliCS3oBt-gfL0bKQ` (Atom, «Benjamín Cordero») | `https://www.youtube.com/@bencord` |

Dos categories: `coneixement` («Coneixement obert», icona `BookOpen`) per als blogs i `videos` («Vídeos per a aprendre», icona `Sprout`) per als canals, totes dues de la llista tancada `ICONES_CATEGORIA` del nucli del Lector. Els feeds de vídeo són l'única adreça del catàleg amb consulta: `cataleg.test.js` només admet `www.youtube.com/feeds/videos.xml` amb un sol paràmetre `channel_id` d'un canal (`^UC[A-Za-z0-9_-]{22}$`); per a qualsevol altre host, cap consulta.

Totes **se seguixen per defecte** (l'estat de la persona només guarda les que ha deixat de seguir, `noSeguides`) i la persona en pot apagar qualsevol des de l'arbre de fonts del Lector (R6 L-13): al diàleg «Gestiona les fonts» (la capçalera de la columna de l'arbre, un interruptor per font del catàleg) o al detall de la font triada a l'arbre («Deixa de seguir-la» i «Torna a seguir-la»). La pàgina antiga `/app/lector/fonts` ja no hi és: porta a `/app/lector/noticies`. L'elecció es desa al magatzem local del Lector i, des del T5b, **una font apagada ja no es demana al servei**: el servei no sap res d'ella. Tornar-la a encendre la demana en la ronda següent, sense tornar a carregar tot el Lector.

### Candidats territorials verificats 261024, no actius (decisió del Mestre)

Les deu fonts territorials del T5 ixen del catàleg actiu i de `fonts.json`. Es van verificar el 261024 (200, RSS o Atom, també amb l'agent honest) i queden ací per si el Mestre les vol tornar a encendre, una per una:

| Id | Nom | Feed | Llengua |
| --- | --- | --- | --- |
| `apunt` | À Punt | `https://www.apuntmedia.es/rss/` | ca |
| `lamarina-plaza` | La Marina Plaza | `https://lamarina.eldiario.es/feed/` | es |
| `mallata` | Mallata | `https://mallata.com/feed/` | ca (sense comprovar a l'atribut del feed) |
| `dival` | Diputació de València | `https://www.dival.es/va/rss.xml` | ca |
| `ajuntament-agullent` | Ajuntament d'Agullent | `https://www.agullent.es/va/rss.xml` | ca |
| `ajuntament-ontinyent` | Ajuntament d'Ontinyent | `https://www.ontinyent.es/va/rss.xml` | ca |
| `ajuntament-morella` | Ajuntament de Morella | `https://www.morella.net/feed/` | ca (sense comprovar) |
| `ajuntament-pego` | Ajuntament de Pego | `https://pego.org/feed/` | ca (sense comprovar) |
| `aemet-avisos-cv` | AEMET · Avisos a la Comunitat Valenciana | `https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAC77_RSS.xml` | es |
| `valencia-fruits` | Valencia Fruits | `https://valenciafruits.com/feed/` | es (sense comprovar) |

`cataleg.test.js` vigila que cap d'estos hosts siga al catàleg actiu.

## Les fonts personals

La persona pot afegir les seues fonts al Lector (`fontsPersonals.js` · `afigFontPersonal`: des del Snippet Curador del Bloc, o des de «Afig una font» al diàleg «Gestiona les fonts») i llevar-les («Lleva» a «Les teues fonts» del mateix diàleg, o «Lleva la font» al detall de la font). Viuen només en el seu dispositiu, al magatzem del Lector. Des del T5b **es lligen pel mateix servei de notícies del poble, mai pel navegador**: `fontRemota.js` les pren del registre de fonts personals, les posa al port com una font més (id `meva-…`, descripció «Una font que has afegit tu.») i les demana amb `servei.feedPersonal(url, { signal })`, amb la mateixa ronda (12 s), la mateixa memòria (10 min, només les bones) i les mateixes caigudes. Si el servei no en sap (`feedPersonal` absent, una prova o un servei antic), les personals queden «Pendent del connector», com abans.

**Apagades per defecte** (D-08 de Codex, 261024): el servei només les llig si el Mestre posa `SDP_NOTICIES_PERSONALS=1` a la funció **i** l'entorn té resoledor de noms. El navegador ho sap per l'estat del servei (`estat().personals`, de `GET /fonts`): si és fals, `feedPersonal` rebutja amb el motiu `personals-off` **sense enviar cap adreça** (R5-01: l'interruptor ja arriba al navegador). Quan estan enceses, el client les envia d'una en una (el servei n'admet una alhora per connexió).

## Les peces

| Peça | Què fa |
| --- | --- |
| `cataleg.js` | Les categories i les fonts del sistema (`{ id, nom, categoriaId, descripcio, lloc, feed, llengua }`). L'únic lloc del frontend amb les adreces dels feeds del sistema, i només com a dada. `fontsPerAlLector()` les dona sense `feed` ni `llengua`. Les constants es diuen encara `FONTS_TERRITORIALS` i `CATEGORIES_TERRITORIALS` (el nom del T5). |
| `client.js` | `creaServeiNoticies({ apiOrigin })` → `{ fonts(), estat(), feed(id, { signal }), feedPersonal(url, { signal }), imatge(urlOriginal), video(enllac) }`. `fonts()` és el catàleg (cap xarxa). `estat()` pregunta `GET <origen>/functions/v1/noticies/fonts`: una resposta definitiva val tota la sessió de pàgina, una de passada, 30 o 60 s (vegeu «L'estat del servei»). `feed()` demana `GET …/feed?font=<id>` i `feedPersonal()`, `GET …/feed?url=<adreça>`, tots per la Frontissa (`../sollutia/creaFrontissa.js`, sense tocar-la): sense credencials ni redireccions, un sol paràmetre, 8 s (5 s l'estat) i 3 MiB com a molt, només JSON i un DTO tancat. `imatge()` i `video()` són pures: cap xarxa. |
| `supabase/functions/noticies/` | La funció: `gestor.js` (pur i provat), `index.ts` (l'embolcall de `Deno.serve`) i `fonts.json` (la llista blanca del servei, en paritat amb `cataleg.js`). |

Qui la munta és la plataforma, no l'app: `src/apps/plataforma/fontServeis.js` (que només importa `RutaApps.jsx`) crea el servei amb l'origen del backend de la capa del paquet (`capaDelPaquet().supabaseUrl`, mai el d'un canal de l'amfitrió), **un sol client per origen i sessió de pàgina** (cada muntatge del Lector rep el mateix: l'estat i la cua de les personals són de la sessió), i el passa a `ProveidorApp`. El Lector el llig amb `useServeiNoticies()` de l'API pública i en fa un adaptador del seu port (`src/apps/lector/fontRemota.js`). L'app continua sense xarxa i sense cap adreça al codi (Model B; `frontera.test.js`).

Només el rep una app interna i pública de la llista `APPS_AMB_NOTICIES` (hui, `lector`). Un mòdul (`sdp.modul.v1`) o una app externa no el reben. Amb un paquet sense backend remot (`dataMode` `seed` o `local`) o amb un origen que no és https, no hi ha servei i el Lector diu «Encara no hi ha cap font connectada», com fins ara.

## L'estat del servei (definitiu per sessió, de passada per uns segons)

Gemini G2-03 (261024): amb la funció sense desplegar, el Lector feia sis peticions fallides per pàgina. Per això la primera crida a `estat()` (o el primer feed) pregunta `GET …/fonts` i se'n queda el resultat. R6 L-01 (Lector final): **només es guarda per a tota la sessió de la pàgina una resposta definitiva**; abans es guardava també una fallada de passada, i una connexió que queia una vegada (la cobertura del poble, un 503, un 429) apagava el Lector, o les fonts personals, fins que es tornava a carregar la pàgina (a l'app, fins que es tancava), i «Torna-ho a provar» no enviava res.

| Resposta de `/fonts` | `estat()` | Quant val | Què passa amb els feeds |
| --- | --- | --- | --- |
| 200 del contracte | `{ disponible: true, personals }` (`personals` només si el servei diu exactament `true`) | tota la sessió | ixen |
| 404 que **no** és un error del servei (sense la forma `sdp_noticies_*`: la funció no hi és) | `{ disponible: false, personals: false }` | tota la sessió | cap ix: `feed()` i `feedPersonal()` rebutgen tot d'una amb `servidor`, sense petició |
| la xarxa no arriba amb el dispositiu en línia (un fetch sense resposta: una connexió que cau, un 404 sense CORS) | `{ disponible: false, personals: false }` | 30 s (60 s si l'anterior també havia fallat) | cap ix mentre val (`servidor`); després, el feed següent torna a preguntar |
| un 404 del servei, 5xx, 429, 5 s sense resposta o un sobre que no casa | `{ disponible: true, personals: false }` | 30 s (60 s si l'anterior també havia fallat) | els del sistema ixen; cap adreça personal (`personals-off`) mentre val; després es torna a preguntar |
| la xarxa no arriba i el dispositiu diu que està fora de línia (`navigator.onLine` fals) | `{ disponible: false, personals: false }`, motiu `sense-connexio` | gens | quan torna la xarxa, el Lector torna a demanar i es pregunta de nou |

Així, com a molt una petició fallida per ronda (no sis), i cap fallada de passada dura més d'un minut. El «Torna-ho a provar» dins de l'espera no envia res (el resultat encara val); passada l'espera, sí. Les constants són `ESPERA_ESTAT_MS` i `ESPERA_ESTAT_MAXIMA_MS` de `client.js`.

## Les imatges i els vídeos

- `imatge(urlOriginal)` → `'<origen>/functions/v1/noticies/imatge?u=<adreça>'` per a una adreça https neta (sense usuari ni port, com a molt 2048 caràcters, sense fragment), o `null`. Pura: no fa cap petició. R6 L-08: només fa l'adreça quan **l'últim estat conegut diu que el servei hi és** (`estat().disponible`); si encara no se sap, o diu que no (la funció sense desplegar, la xarxa que no arriba), `null`, i la fila mostra la icona sense cap petició condemnada a fallar. Quines imatges servix el servei ho diuen les seues regles (vegeu baix).
- `video(enllac)` → `{ proveidor: 'youtube', id, incrustacio, enllac }` per a `https://www.youtube.com/watch?v=<id>` (un sol `v`), `https://youtu.be/<id>` o `https://www.youtube.com/shorts/<id>` (R6 L-03: un sol tram després de `/shorts/`, cap camí de més; 12 dels 15 vídeos de Migue Baena són Shorts), amb un id d'11 caràcters; si no, `null`. `incrustacio` és `INCRUSTACIO_YOUTUBE` + id, el domini sense galetes de YouTube (l'únic lloc del codi amb eixa adreça); `enllac`, l'enllaç net, sense cap altre paràmetre (ni el temps ni el `si` de compartir, que rastreja).

Mostrar-les al Lector (i a quina CSP) és de l'app i del Mestre, no d'esta carpeta.

## El contracte sdp.noticies.v1

- `GET <base>/fonts` → `200 { categories, fonts, personals }`, sense les adreces dels feeds; `personals` diu si el servei llig fonts personals (cert només amb `SDP_NOTICIES_PERSONALS=1` i resoledor).
- `GET <base>/feed?font=<id>` → `200 { font, xml, obtingut, obsoleta }`: `xml` és el feed en UTF-8, `obtingut` l'instant ISO de la baixada i `obsoleta` si és la còpia de reserva (fins a 24 h) perquè l'origen ara no respon.
- `GET <base>/feed?url=<adreça https>` → `200 { url, xml, obtingut, obsoleta }`, la font personal (`url` és l'adreça normalitzada, sense fragment; `obtingut` és l'hora de la petició, R5-05). `Cache-Control: private, max-age=300`.
- `GET <base>/imatge?u=<adreça https>` → `200` amb els bytes d'una imatge (`image/jpeg`, `png`, `webp`, `gif` o `avif`) d'un host del catàleg o dels seus CDN (o, amb l'interruptor encés, d'una de fora vista en un feed), `Cache-Control: public, max-age=86400`, cap galeta.
- Error → `{ code: 'sdp_noticies_<codi>', message, data: { status } }`, la forma de WP REST. L'adreça demanada no torna mai en un error.

| Codi | HTTP | Motiu al Lector |
| --- | --- | --- |
| `ruta`, `font_desconeguda` | 404 | `servidor` |
| `metode` | 405 | `servidor` |
| `peticio` (també `url` amb les personals apagades) | 400 | `servidor` |
| `limit` (la finestra per connexió) i `ocupat` (massa baixades alhora) | 429 | `limit` |
| `adreca_vetada` (una adreça de fora que el servei no llig) | 422 | `adreca` |
| `personals_sense_dns` (enceses, però sense resoledor: es tanquen) | 503 | `servidor` |
| `origen_temps` | 504 | `temps` |
| `origen_buit` (un 304 a una petició sense condicions: la memòria cau de la web de la font no dona el feed, R6 L-06) | 504 | `temps` (mai `font`: la font no ha enviat res que no es llija) |
| `origen_caigut`, `origen_format`, `origen_mida` | 502 | `font` |
| `imatge_desconeguda` (cap feed recent no l'ha portada) | 404 | (una imatge, no un feed) |
| `imatge_sense_dns` (una imatge de fora del catàleg, sense resoledor) | 503 | (una imatge) |
| `imatge_de_fora` (una imatge de fora del catàleg amb l'interruptor apagat, R6 L-12) | 403 | (una imatge) |
| `intern` | 500 | `servidor` |

A més, al client: 8 s sense resposta d'un feed és `temps`; un feed que no arriba enlloc (sense xarxa, o una resposta sense CORS) és `sense-connexio`; qualsevol resposta que no casa amb el contracte, 401, 403 o un altre 5xx és `servidor`. Quan és la pregunta de l'estat (`/fonts`) la que no arriba, el motiu dels feeds és `servidor` si el dispositiu diu que està en línia i `sense-connexio` si diu que no (R6 L-01 i L-13; vegeu «L'estat del servei»). Una adreça personal que no és https neta (sense usuari ni port, com a molt 2048 caràcters) no ix del navegador: motiu `adreca` (R5-08: cap font contactada, no `font`). La Frontissa, a més, no deixa eixir cap valor de consulta de més de 512 caràcters (`creaFrontissa.js`, sense tocar-la): una adreça personal més llarga tampoc no ix (`adreca`). Sense servei, `servidor`; amb les personals apagades, `personals-off`. Els motius són els de `MOTIUS_NOTICIES` (`sense-connexio`, `temps`, `servidor`, `font`, `limit`, `adreca`, `personals-off`), els mateixos que entén el port del Lector.

## Les regles del servei

- Fonts del sistema: l'únic que entra és un id de la llista blanca. Cap adreça de la consulta.
- A l'origen: GET amb l'agent honest `SocDePoble/1.0 (+https://socdepoble.org/projecte)`, cap galeta ni capçalera de qui demana, 6 s per a tot l'intercanvi, com a molt 2 redireccions (manuals); 2 MiB un feed del sistema, 512 KiB un de personal, 1 MiB una imatge.
- El text passa a UTF-8: primer el BOM (mana sobre la capçalera, R5-06), després la capçalera, després el pròleg; també ISO-8859-1 i windows-1252. L'arrel ha de ser `rss`, `feed` o `RDF`. Cap `<!ENTITY>`. Ningú no rep res que no siga un feed.
- Memòria cau de la instància: fresca 15 min, de reserva fins a 24 h. `Cache-Control: public, max-age=300` a les bones del sistema, `private, max-age=300` a les personals, `public, max-age=86400` a les imatges i `no-store` als errors.
- CORS `*` sense credencials.
- El límit per connexió (R5-03): la connexió és `cf-connecting-ip`; si no, l'**últim** salt de `x-forwarded-for` (el del proxy de la plataforma; els d'abans els pot escriure qualsevol); si no, l'adreça remota. Una IPv6 compta per la seua /64. 120 peticions cada 10 min per a `/fonts` i `/feed`, 60 per a les personals (a banda) i 600 per a les imatges (a banda: una pàgina en porta moltes).
- La taula de finestres plena (R6 L-05): abans, amb 5000 finestres vives, una connexió nova esperava (429) fins a 10 min, i n'hi havia prou amb una /48 d'IPv6 (5000 /64 distintes) per a deixar fora tots els visitants nous. Ara, (1) amb la taula **mig plena**, una IPv6 compta per la seua /48 (la xarxa d'un lloc sencer: la inundació d'una /48 és una sola connexió, i es talla al límit); i (2) amb la taula plena, una connexió nova fa lloc traient la finestra viva **menys gastada**, que mai és una que ja ha arribat al límit (ningú no buida el límit d'una connexió tallada omplint la taula). Només si totes les vives són al límit (una sobrecàrrega de veres), la nova espera (429) fins que vença la més vella.
- Les baixades personals alhora (R5-02): com a molt 4 en tota la instància i 1 per connexió; si no, 429 `ocupat` amb `Retry-After`.
- Les baixades d'imatges alhora (R6 L-02): com a molt 8 en tota la instància; la resta **espera el seu torn** en una cua (com a molt 64, i 6 s), en lloc de rebre 429 tot d'una (el navegador no torna a demanar mai una `<img>` que falla, i una sola llista de Ben Cord o Migue Baena en demana 15). Només si la cua és plena, o el torn no arriba en 6 s, 429 `ocupat`. Dues peticions de la mateixa imatge comparteixen la baixada, i una memòria menuda dels bytes (64 imatges, 8 MiB, 15 min) fa que una imatge repetida no torne a l'origen.

### Les fonts personals contra el SSRF (`gestor.js`)

Una adreça qualsevol podria fer que el servei demanara una cosa de la seua xarxa interna (SSRF). Per això, en mode `?url=`:

- **Apagades per defecte**: només `SDP_NOTICIES_PERSONALS='1'` les encén (abans, tot menys `'0'`). Apagades, `url` és un paràmetre que no s'admet (`peticio`).
- **Sense resoledor, tancades** (D-08): si l'entorn no té `Deno.resolveDns`, `?url=` respon 503 `personals_sense_dns` i `/fonts` diu `personals: false`. Mai «sense resoledor, és pública».
- L'adreça: només `https:`; port buit (443); cap usuari ni contrasenya; com a molt 2048 caràcters; el fragment se'n va.
- El host ha de ser un nom DNS amb un punt com a mínim, d'etiquetes netes, i mai una IP literal: el parser WHATWG ja convertix `2130706433`, `0x7f000001`, `0177.0.0.1` o `127.1` en quatre xifres, que no passen, i una IPv6 porta claudàtors (`[::1]`). Cap nom local: `localhost` i `*.localhost`, `*.local`, `*.internal`, `*.arpa` (amb `*.home.arpa`), `*.localdomain`, `*.lan`, `*.home`, `*.corp`, `*.intranet`, `*.test`, `*.invalid`, ni un nom acabat en punt. Mai el host del projecte (el de `SUPABASE_URL`) ni el de la petició mateixa.
- El nom es resol (A i AAAA) i cap resposta pot ser privada (10/8, 172.16/12, 192.168/16), de bucle (127/8, `::1`), d'enllaç local (169.254/16, amb 169.254.169.254, i `fe80::/10`), CGNAT (100.64/10), ULA (`fc00::/7`), 0.0.0.0/8, multidifusió, reservada o de documentació (també `3fff::/20` i 192.88.99/24), de traducció (`64:ff9b:1::/48`, `::ffff:0:0:0/96`) o de protocol (`2001::/23`, amb Teredo) (R5-07), i tampoc dins d'una IPv6 que porta una IPv4 (`::ffff:…`, NAT64 `64:ff9b::/96`, 6to4). Si el nom no es pot resoldre, no es baixa res (`origen_caigut`); una resposta privada és `adreca_vetada`. La resolució entra dins dels 6 s.
- Cada redirecció (manual, com a molt 2) torna a passar totes les regles, resolució inclosa.
- Memòria cau **per connexió** i adreça normalitzada (R5-05): una altra connexió no rep mai la còpia d'una altra (es torna a baixar) ni sap si algú l'havia demanada (`obtingut` és l'hora de la petició). Fitada: 64 entrades i 16 M caràcters com a molt; la més vella se'n va; res no hi dura més de 24 h.

### Les imatges contra el SSRF (`gestor.js`)

- **Els hosts aprovats**: el host del feed de cada font del catàleg i els CDN d'imatges de les fonts (`CDN_IMATGES`: `i.ytimg.com` i `i1`–`i4.ytimg.com`, on YouTube posa les miniatures dels dos canals; comprovats el 261024 amb un GET dels feeds). D'un host aprovat es servix qualsevol imatge, **encara que esta instància no l'haja vista** en un feed (R6 L-08: una notícia desada «per a després» conserva la miniatura quan la instància es recicla o el feed ja no la porta), i el seu nom no es resol (com els hosts del catàleg, els aprova el Mestre). `gestor.test.js` porta la instantània de `CDN_IMATGES`: un CDN nou la posa en roig.
- **Els hosts de fora, apagats per defecte** (R6 L-12): sense `SDP_NOTICIES_IMATGES_EXTERNES=1`, una imatge d'un altre host és 403 `imatge_de_fora`, sense resoldre ni baixar res, encara que haja eixit en un feed; una redirecció des d'un host aprovat cap a un de fora, també. El motiu és el mateix risc residual de les personals (el DNS rebinding, vegeu baix). Hui, les sis fonts del catàleg porten les miniatures al seu host (AyudaWP) o a `i*.ytimg.com` (els dos canals): l'interruptor apagat no en lleva cap.
- **Encés l'interruptor**, una imatge de fora només es servix si ha eixit les últimes 24 h en un feed **del sistema** que esta instància ha baixat, o en una font **personal d'esta mateixa connexió** (R6 L-11: les imatges d'una font personal es recorden per empremta i adreça, com la seua còpia, i ningú no pot saber, demanant-ne una, si una altra connexió ha llegit eixa font); qualsevol altra, 404 `imatge_desconeguda`, sense cap petició. El nom es resol (sense resoledor, 503 `imatge_sense_dns`).
- **Quines s'han vist** (R6 L-09): les dels `enclosure` d'imatge (RSS i `link rel="enclosure"` d'Atom), `media:thumbnail`, `media:content` d'imatge, `itunes:image` i la primera `<img>` de cada contingut (`description`, `content:encoded`, `content`, `summary`, en CDATA o escapat), triades i resoltes **com les tria i resol el nucli del Lector**: una relativa o de protocol relatiu (`/wp-content/…`, `//cdn…`) contra l'enllaç de l'element, o el del canal, o el lloc de la font; la primera `<img>` que es resol (fora de les de dins d'un `<noscript>`, un `<script>`, un `<svg>`…). Si la que tria és http, el Lector no la demana i no es guarda. `paritat.test.js` passa el nucli i el servei pels mateixos feeds (les fixtures del nucli i els casos relatius).
- Les mateixes regles del nom que les personals, per a tots els hosts. Cada redirecció torna a passar-ho tot.
- El tipus declarat ha de ser `image/jpeg`, `png`, `webp`, `gif` o `avif` (cap SVG), i els primers bytes ho han de dir (la signatura mana i és el tipus que s'envia). 1 MiB, 6 s, `nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, `Cross-Origin-Resource-Policy: cross-origin`, cap galeta.
- La memòria dels bytes i la baixada compartida són de tothom només per a les imatges d'un feed del sistema (tothom llig els mateixos); qualsevol altra (una d'una font personal, o d'un host aprovat sense haver-la vista) va per connexió: una resposta ràpida no ha de dir a ningú què ha demanat una altra.

### La privacitat, sense dir-ne més del que és (R5-04)

- **El gestor** no escriu mai a la consola ni guarda cap IP: per al límit en guarda una empremta HMAC-SHA-256 amb una clau aleatòria de 32 bytes que naix amb la instància (no es pot exportar, no ix d'ella). Sense la clau, l'empremta no torna a la IP, i dues instàncies no en fan la mateixa. Les finestres vençudes s'esborren a cada petició: una empremta dura la seua finestra (10 min) i, com a molt, fins a la petició següent que arriba a la mateixa instància. La clau dura el que dura la instància.
- **La memòria personal** sí que lliga, dins de la instància i com a molt 24 h, l'empremta d'una connexió amb les adreces que ha demanat (és el que fa que només ella en reba la còpia), amb les imatges d'eixes fonts (R6 L-11) i, 15 min com a molt, amb els bytes de les imatges que no són d'un feed del sistema. No ix d'ella ni es registra.
- **La plataforma sí que registra.** Supabase (com qualsevol allotjament) guarda els seus registres d'accés: l'adreça de la petició amb la consulta (`?url=<adreça personal>`, `?u=<imatge>`) i la IP de qui la fa, amb la retenció de la plataforma. Que el gestor no registre res no impedix això. Per això el text del Lector no pot dir que «ningú no sap quines adreces demanes»: ho sap el servei mentre les llig, i els registres de la plataforma. Una adreça personal viatja a la consulta perquè la Frontissa només fa GET.

**Risc residual (el Mestre l'ha de tancar abans d'encendre les personals).** Encara amb resolució, entre la comprovació i la baixada el nom pot canviar de resposta (DNS rebinding): el `fetch` de Deno torna a resoldre i no es pot fixar la IP sense trencar el TLS. Ho fiten que només es torna un document que siga un feed (arrel `rss`, `feed` o `RDF`) de 512 KiB com a molt, que la funció no porta cap secret, i el límit de baixades alhora; però no ho tanquen. El que ho tanca és **un egrés aïllat a la plataforma** (que la funció només puga eixir a Internet pública, mai a la xarxa interna ni a les metadades), i això és del Mestre: fins llavors, `SDP_NOTICIES_PERSONALS` es queda sense posar. Les imatges de fora del catàleg porten el mateix risc: per això estan apagades per defecte (R6 L-12, `SDP_NOTICIES_IMATGES_EXTERNES`) i s'encenen en les mateixes condicions que les personals (i, enceses, queden fitades a les adreces que han eixit en un feed, a imatges de 1 MiB i a tipus d'imatge amb signatura). Els hosts aprovats (el catàleg i `CDN_IMATGES`) no es resolen: la confiança ve de l'aprovació del Mestre.

## El Lector quan les fonts no responen

`fontRemota.js` demana els feeds com a molt 4 alhora, amb un termini de 12 s per a tota la ronda (les que arriben tard compten com a `temps`). Desa 10 min els feeds que han anat bé, mai els que han fallat. Si una ronda nova comença, avorta la vella. Si cauen algunes fonts, la resta es veu i el detall avisa «Alguna font no ha contestat». Si cauen totes les que se seguixen, el detall diu «Ara mateix no arriben les notícies», amb el motiu en paraules de la gent, «Torna-ho a provar» i quatre portes a la resta del poble: el Mur, l'Agenda, el Mercat i els Pobles. Quan el dispositiu torna a tindre xarxa, el Lector les torna a demanar soles. Una font apagada no compta: ni es demana ni és una caiguda. Sense la funció desplegada, tot això passa amb **una sola** petició fallida (l'estat): per a tota la sessió si la plataforma respon un 404 que el navegador pot llegir, o una cada 30–60 s, quan el Lector torna a demanar, si el navegador el veu com una xarxa que no arriba (un 404 sense CORS: R6 L-01).

## El que decidix el Mestre

- **Aprovar els hosts un per un** (`cataleg.test.js` en porta la instantània: un host nou la posa en roig): `emowe.com`, `ayudawp.com`, `iaenaccion.com`, `www.jonhernandez.education` i `www.youtube.com`. I els CDN d'imatges (`CDN_IMATGES`, R6 L-08 i L-12; `gestor.test.js` en porta la instantània): `i.ytimg.com`, `i1.ytimg.com`, `i2.ytimg.com`, `i3.ytimg.com` i `i4.ytimg.com`.
- **Jon Hernández: el feed és `https://www.jonhernandez.education/feed/atom/`** (R6 L-06). El `/feed/` de l'encàrrec respon a tot GET sense condicions 304 i cap byte (`x-proxy-cache: HIT`, comprovat amb GET i l'agent honest el 261024, dues vegades), encara que HEAD diga 200: és la memòria cau de la seua web. El servei ho diu ara `origen_buit` (504, «temps» al Lector) i no «font». La substitució la va fer la implementació, no el Mestre: l'ha de confirmar, o avisar l'autor perquè arregle el `/feed/`.
- **Emowe: el feed és `https://emowe.com/rss.xml`, no `/feed/`** (R5-10). L'encàrrec del T5b deia `https://emowe.com/feed/`, que va respondre 404 a la comprovació HEAD del T5b (261024); el feed que anuncia la web és `/rss.xml`, comprovat amb l'agent honest el 261024 (200, sense redireccions; en la passada final, amb GET). La substitució la va fer la implementació, no el Mestre: l'ha de confirmar.
- Desplegar la funció (`supabase/README.md`, «Funció `noticies` (lector territorial)») i, després, encendre el Lector en producció (`VITE_SDP_APP_LECTOR=1` i l'entorn del manifest).
- **Les fonts personals estan apagades** (D-08). Encendre-les (`SDP_NOTICIES_PERSONALS=1`) és decisió del Mestre i només després de tancar el DNS rebinding amb un egrés aïllat de la plataforma (vegeu el risc residual) i de comprovar que el runtime té `Deno.resolveDns` (si no el té, es queden tancades soles). I obrir la destinació del Snippet Curador sense la llavor (`destinacioEnllac`, hui només amb `VITE_SDP_LECTOR_LLAVOR=1`, correcció SN-R1; D-06): sense ella, en producció ningú no pot afegir una font personal.
- Les imatges: si el Lector les mostra a través del servei (`imatge()`), la CSP del web i de les natives ha d'admetre l'origen del backend a `img-src`, i el text de privacitat del Lector ha de dir que les imatges passen pel servei. La memòria de les imatges vistes és de cada instància; les dels hosts aprovats no en depenen (R6 L-08). **Encendre les imatges de fora del catàleg** (`SDP_NOTICIES_IMATGES_EXTERNES=1`) és decisió del Mestre, en les mateixes condicions que les personals (l'egrés aïllat).
- La política de contingut (l'article sencer o el resum i l'enllaç) i si tornen les candidates territorials.
- Els terminis de la memòria cau i els límits (120, 60 i 600 cada 10 min; 4 personals alhora i 1 per connexió; 8 imatges alhora, amb una cua de 64 i 6 s; la memòria de 64 imatges i 8 MiB; l'espera de 30–60 s d'un estat de passada al client; l'agregació de les IPv6 per /48 amb la taula mig plena). Darrere d'una sola IP (CGNAT, la wifi de l'ajuntament) tot un poble compartix el límit i la baixada personal d'una en una.

## Vincles

- [[00_index]]
