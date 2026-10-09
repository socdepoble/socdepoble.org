---
type: document
status: actiu
description: "Algoritme de pobles nous a partir de la Viquipèdia, Wikidata i Commons: passos, fonts, llicències, límits, formes capturades i fase 3."
---
# Adaptador de la Viquipèdia per a pobles nous

Quan un habitant registra un poble que encara no és a `/pobles`, el sistema en pot proposar la fitxa sense que ningú l'escriga a mà: el nom de la gent («Gent de…», l'H1), el nom del poble (l'H2), l'entradilla, la província, la comarca i les tres fotos (panoràmica, avatar i reserva). L'enllaç del botó del xat no es guarda: es deriva de l'id.

Esta carpeta és la lectura de Wikimedia. L'algoritme viu a `src/sections/pobles/pobleDeViquipedia.js` i la regla dels noms a `src/sections/pobles/nomsDelPoble.js`.

## Estat

- **Fase 1, feta.** `nomDeLaGent(nom)` i `slugDelPoble(nom)`, purs i provats. Ja és la regla de la targeta, l'H1 i la barra taronja (F3, 261009): `PoblesSection.jsx`, `detailSectionMeta.jsx` i `elementDeSeccio.js` prenen `author` de la fitxa i, si no en porta, `nomDeLaGent`. La targeta també fa servir `wikipedia_title` per a l'enllaç a l'article i el `copyright` de la fitxa, si en porta.
- **Fase 2, feta.** El client de Wikimedia, els traductors, l'algoritme i les proves, amb captures reals del 261009. Res d'això escriu enlloc ni s'executa sol: és una funció que algú ha de cridar.
- **Fase 3, pendent.** Persistir la proposta, el disparador de l'onboarding i l'aprovació del tractor. Vegeu [Què queda](#què-queda-fase-3).

## L'algoritme, pas a pas

`pobleDeViquipedia(nom, { provincia, llig, signal })` no llança mai i sempre torna un DTO tancat i congelat.

1. **Neteja el nom** (text pla, com a molt 120 caràcters). Si no en trau cap slug vàlid, torna `sense-article` sense preguntar res.
2. **Cerca el municipi a Wikidata**: `list=search` amb `srsearch=<nom> haswbstatement:P31=Q2074737`. `Q2074737` és «municipi d'Espanya», el P31 que porten la Torre i Sella a les captures.
3. **Tria el candidat** (`triaMunicipi`): ha de ser municipi i tindre la mateixa etiqueta en català, sense diacrítics, majúscules ni l'article del davant («la Torre de les Maçanes» = «La Torre de les Maçanes»). Si es dona la província, el prefix del codi INE (P772) hi ha de casar. Si en queden dos o cap, no s'endevina.
4. **Si la cerca no troba res**, prova el títol de la Viquipèdia, però només el dona per bo si l'article existix, no és una desambiguació i el seu element de Wikidata passa el pas 3. Cobrix un índex de cerca que va tard; mai es refia d'un títol pelat («Sella» és una desambiguació).
5. **Llig l'article** enllaçat (`sitelinks.cawiki`): l'extracte de la introducció en text pla, la imatge de la pàgina, la llista de fitxers i les coordenades. Si l'article no apunta al mateix element, no se'n pren res.
6. **Llig les etiquetes de P131** per a la comarca i la província. La província ix primer del codi INE (03 Alacant, 12 Castelló, 46 València) i, si no, de l'etiqueta «província de…».
7. **Pregunta a Commons** per les fotos candidates (com a molt 8): la de Wikidata (P18), la de la pàgina i les de l'article, totes en una petició (o més, si els títols no caben en 512 caràcters). Abans es descarten pel nom i per l'extensió els escuts, les banderes, els mapes, els logotips, les icones i tot el que no és JPEG, PNG o WebP. L'escut (P94) no es demana mai.
8. **Tria les tres fotos** (`triaImatges`). Només valen les fotos ràster, de 1000 px d'amplada o més, amb llicència lliure (CC0, domini públic, CC BY, CC BY-SA; mai NC ni ND) i sense `Restrictions`.
   - **Panoràmica**: apaïsada (proporció d'1,3 a 3). Té preferència la de Wikidata, després la de la pàgina, i a igualtat la de més resolució.
   - **Avatar**: la foto més quadrada (0,8 a 1,25) que no siga la panoràmica. Si no n'hi ha cap, la mateixa panoràmica. Mai l'escut: l'avatar de «Gent de…» no ha de semblar l'Ajuntament.
   - **Reserva**: una altra apaïsada, amb un fitxer i un sha1 diferents dels de la panoràmica. Si no n'hi ha, `null`.
9. **Talla l'entradilla** (`entradillaDe`): el primer paràgraf i com a molt `MAXIM_LEMA` (256) caràcters de veres. Si no hi cap, es talla a l'última fi de frase dins del límit; si no n'hi ha, a l'última paraula sencera amb «…». Res d'`Intl.Segmenter`.

### El DTO

| Camp | D'on ix |
| --- | --- |
| `estat` | `complet` (municipi, entradilla i les tres fotos distintes que demana l'ordre), `parcial` (municipi però falta text, una foto, comarca o un pas ha fallat; també quan l'avatar és la mateixa panoràmica), `sense-article` (cap municipi verificat), `no-disponible` (xarxa, Wikimedia o cancel·lació) |
| `id` | `slugDelPoble(title)`, la clau de `/pobles/<id>` |
| `title` | l'etiqueta catalana de Wikidata, amb majúscula inicial (l'H2) |
| `author` | `nomDeLaGent(title)` (l'H1 i la caputxa): «Gent de la Torre de les Maçanes» |
| `content` | l'entradilla, en text pla |
| `provincia`, `comarca` | el codi INE i les etiquetes de P131 |
| `population` | P1082 preferent, si no la més recent: «749 hab» |
| `lat`, `lng` | P625, si no les de l'article; quatre decimals, com la llavor |
| `wikidata_id`, `wikipedia_title` | l'element i l'article verificats |
| `copyright` | «Text: Viquipèdia (CC BY-SA 4.0)» i, si hi ha fotos, «Imatges: Wikimedia Commons (vegeu els crèdits)» |
| `imatges` | `{ hero, avatar, reserva }` (`hero` és la panoràmica, el `heroImage` de la Pàgina; el nom de la variant 16:9 de Pedra Seca és només del Lector), cadascuna `{ src, fitxer, amplada, alcada, autor, llicencia, llicenciaUrl, fontUrl }` o `null` |
| `chat` | `rutaXatDePagina(objecteDe(poble, 'pobles'))`, el mateix camí que el botó del xat de la Pàgina del poble. És per a la previsualització: no s'ha de guardar |

En `sense-article` i `no-disponible` no hi ha cap text inventat: només el nom tal com s'ha escrit, l'id, l'autor derivat, la província que haja donat qui crida i l'enllaç del xat. La interfície cau a les imatges de reserva de sempre (`resolveTownImageUrl`, `assetResolver.js`).

Si `autor` és `null`, Commons no en dona cap: la interfície ha de remetre a `fontUrl`, que sempre apunta a la pàgina del fitxer.

## Fonts i llicències

- **Text**: Viquipèdia en català, CC BY-SA 4.0. Cal citar l'article: `wikipedia_title` en fa l'enllaç. No admet la NC de `COPYRIGHT_SDP` (`editorial.js`), i per això el DTO porta el seu `copyright`.
- **Fotos**: Wikimedia Commons, cada una amb la seua llicència. CC BY i CC BY-SA demanen autor, llicència i enllaç a la font per foto: és el que porta cada imatge del DTO, i el que haurà de pintar l'H3 de crèdits de la Pàgina del poble (fase 3).
- **Dades**: Wikidata, CC0.

## Etiqueta amb Wikimedia

El client (`client.js`) compon damunt de la Frontissa (`../sollutia/creaFrontissa.js`), sense tocar-la:

- **Identificació**: capçalera `Api-User-Agent: SocDePoble/1.0 (https://socdepoble.org/projecte)`. El navegador no deixa canviar `User-Agent`.
- **Sense credencials ni redireccions**: GET amb `credentials: 'omit'` i `redirect: 'error'`, i només els paràmetres del catàleg.
- **En sèrie**: una sola petició viva i 250 ms de respir entre una i la següent. Les crides iguals simultànies comparteixen una sola petició, i el que ja s'ha llegit es guarda per a la sessió (100 entrades).
- **`maxlag=5`** a totes les peticions.
- **Reintents**: només per a 429, 503, `maxlag` i errors de xarxa, com a molt 3, a 1, 2 i 4 s més un atzar de fins a 250 ms. El `Retry-After` del servidor (fins a 10 s) para la cua sencera, no només la petició que l'ha rebut. Mai es reintenta un 4xx, un `TIMEOUT`, una cancel·lació ni una forma invàlida.
- **Temps i mida fitats** per la Frontissa: 8 s per intent (el rellotge no comença fins que és el torn), i de 64 KiB a 1 MiB segons el recurs.
- **Baseline 2022**: `AbortController` i `setTimeout`; res d'`AbortSignal.timeout` ni `AbortSignal.any`.

Una proposta normal fa cinc peticions: cerca, element, article, etiquetes i fitxers.

## Què s'ha observat (captures del 261009)

Les captures són a `tests/frontissa/fixtures/viquipedia/`, fetes amb el navegador integrat amb GET de només lectura. Cada fitxer porta `captureId`, `capturedAt`, `url` i `body` tal com el va servir Wikimedia. `recursos.test.js` en comprova l'empremta (sha256 del JSON canònic, calculada al navegador en capturar-lo).

- **Forma 2 (`formatversion=2`)**: UTF-8 sense escapar, `pages` com a llista i booleans de veres (`missing: true`, `batchcomplete: true`).
- **Viquipèdia**: els fitxers de l'article arriben amb el prefix traduït («Fitxer:…»), la imatge de pàgina amb guions baixos («El_riu251.jpg») i la desambiguació com a `pageprops.disambiguation: ""`. Un títol inexistent dona `missing: true` sense `pageid`.
- **Wikidata**: l'etiqueta porta l'article en minúscula («la Torre de les Maçanes»), però el títol de l'article no. Les quantitats són text amb signe («+749»). La població té una declaració preferent (2025). P131 barreja la comarca i la província en un ordre que no és fix.
- **Commons**: `thumburl` ve ara de `thumb.wikimedia.org` amb mides normalitzades (es demanen 1600 px i se serveix la de 1920 px), i de `upload.wikimedia.org` quan l'original ja és més menut. Totes les URL porten paràmetres `utm_*`: el traductor els lleva, i la imatge es carrega igual (comprovat). `Artist` és HTML i pot faltar (el mapa de localització no en porta).
- **`maxlag`** (forçat amb `maxlag=-1`): HTTP **200**, no 503, amb `{"error":{"code":"maxlag",…}}`, `Retry-After: 5` i `MediaWiki-API-Error: maxlag`. El client el reconeix per la capçalera.
- **`Content-Length`** és la mida comprimida (798 bytes per a un cos de 2087). La Frontissa compta els bytes de veres en llegir.
- **CORS** des de l'origen de l'app (`http://localhost:3340`), amb `Api-User-Agent`: la *preflight* passa i les tres APIs responen 200. `Retry-After` i `MediaWiki-API-Error` es poden llegir des de l'altre origen.

Què en trau l'algoritme amb les captures:

- **La Torre de les Maçanes**: `parcial`. La foto de Wikidata (`El riu251.jpg`) només fa 600 px i no hi entra; la panoràmica i l'avatar són `Torre Gran (Torremanzanas) 3.jpg` (CC BY-SA 3.0 es, Relleu). No hi ha reserva: una sola foto distinta de les tres.
- **Sella**: `parcial`. El municipi de la Marina Baixa (Q985137, article «Sella (Marina Baixa)»), no la desambiguació. La foto de Wikidata (`Sella-Panorama.jpg`, 9428×2538) és massa estreta per a la capçalera; la panoràmica és l'ermita. No hi ha reserva.
- **Un nom inexistent**: `sense-article`, amb dos peticions.

Molts pobles menuts no tindran tres fotos lliures a l'article. La categoria de Commons (P373) no les dona fàcilment: la de la Torre només té subcategories al primer nivell, i recórrer-les multiplica les peticions.

## On pot córrer

- **Web** (`socdepoble.org` i el servidor de desenvolupament): sí. La CSP permet `connect-src https:` i `img-src https:` (`index.html`).
- **App nativa**: no. `connect-src` només admet el backend (`vite.natiu.config.js`). Hi donaria `no-disponible`.
- **WordPress**: depén de la CSP de l'amfitrió, que no coneixem.

Els mòduls no depenen del DOM: el mateix codi podria córrer en una Edge Function si el Mestre ho decidix.

## Fitxers

- `client.js`: el catàleg (cinc recursos en tres orígens), la cua, els reintents, la deduplicació i la memòria.
- `recursos.js`: els traductors a DTO tancats.
- `../../../sections/pobles/pobleDeViquipedia.js`: l'algoritme i les seues funcions pures.
- `../../../sections/pobles/nomsDelPoble.js`: `nomDeLaGent` i `slugDelPoble`.
- `tests/frontissa/fixtures/viquipedia/*.json`: les 15 captures.

Proves, sense xarxa:

```
npx vitest run src/sections/pobles/nomsDelPoble.test.js src/sections/pobles/pobleDeViquipedia.test.js src/data/adaptadors
```

Per a refer una captura: el mateix GET des del navegador, el cos sencer al fitxer i la nova empremta a `EMPREMTES` de `recursos.test.js`. Si canvia la forma, el traductor primer.

## Què queda: fase 3

Res d'això s'ha de fer sense les decisions de baix.

1. **Persistir la proposta.** Avui ningú no pot escriure un poble: les fitxes viuen a `app_content(tenant, 'towns')`, que només té polítiques de lectura. Caldrà:
   - una capacitat opcional del port, `propostaPoble` (`proposaPoble(dto, config) → { id, estat }`), al contracte, a `backendPort.js` i al kit de conformitat;
   - una RPC `proposa_poble` que valide al servidor (sessió, slug, llargàries, orígens de les imatges i de les URL de llicència) i que limite les propostes per usuari;
   - una **ADR** (AGENTS §8): és un canvi de contracte del backend.
2. **El disparador.** Quan existisca el selector de poble a l'onboarding: si el slug no casa amb cap poble, cridar `pobleDeViquipedia`, ensenyar la previsualització amb la targeta de sempre i deixar que l'habitant corregisca «Gent de…», la província i la comarca abans de proposar res.
3. **L'aprovació del tractor.** La lliçó 261002 demana un document del flux i l'aprovació explícita del Mestre a la Wiki abans que cap tractor automàtic siga efectiu. El document l'ha de fer MarIA.
4. **L'H3 de crèdits de les fotos.** La Pàgina del poble ha de pintar l'autor, la llicència i l'enllaç a la font de cada imatge. La integració dels noms, l'enllaç amb `wikipedia_title` i el `copyright` propi ja són fets (F3, 261009).

### Decisions obertes del Mestre

- **On s'executa**: al navegador de qui registra el poble (només web), en una Edge Function o com a acció d'administració a la Consola.
- **Moderació**: es publica directament o queda `pendent` fins que un superadmin l'aprova.
- **Les fotos**: copiar-les al nostre Storage (privacitat dels visitants i independència de Commons, però avui la targeta no pinta `sdp-media://`) o enllaçar-les a Wikimedia (cada visitant demana la imatge a un tercer, contra l'esperit de la Decisió 3).
- **L'avatar**: confirmar que no pot ser l'escut municipal, i si val la mateixa panoràmica quan no n'hi ha cap de quadrada (avui el DTO queda `parcial`).
- **La reserva**: només un recanvi quan falla la panoràmica (sense cap canvi visual) o la segona diapositiva d'un carrusel al detall.
- **L'amplada mínima per rol**: avui els 1000 px de la panoràmica valen també per a l'avatar i la reserva. Un llindar més baix (per exemple, 600 px per a la reserva) donaria la reserva a la Torre (`El riu251.jpg`, 600×450, domini públic), però depén de la decisió anterior: com a recanvi de la capçalera, una foto de 600 px s'hi veuria borrosa.
- **L'H1 dels pobles nous**: el nom sencer («Gent de la Torre de les Maçanes») o un de curt que tria l'habitant («Gent de la Torre»).

## Vincles

- [[00_index]]
