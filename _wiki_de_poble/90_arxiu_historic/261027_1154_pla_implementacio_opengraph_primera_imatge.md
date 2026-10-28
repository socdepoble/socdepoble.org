---
type: document
status: esborrany
description: Pla executable P1-61 per servir la primera imatge de galeria o cos al head HTTP, amb privacitat, revocacio i caches contrastades.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1537b5b0-8030-4c15-a62f-f78350f664e4:28d88218-3454-4d96-b093-320e1a84a760
---
# Pla OpenGraph: primera imatge publica i resposta HTTP social

**Estat del Pla:** en elaboració — proposta executiva lliurada; consens parcial documentat al §10.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1537b5b0-8030-4c15-a62f-f78350f664e4:28d88218-3454-4d96-b093-320e1a84a760 |
| Versió del document | 1.0.1 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T10:58:44.586Z |
| Modificació | 2026-10-27T11:21:07.297Z |
| Propietari | Codex |
| Aprovació humana | Mandat explícit P1-61: invariant i pla; decisions tècniques contrastades, desplegament encara no executat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Codex, GPT-6 |
| Tokens consumits | Mesura precisa no disponible en esta interfície |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-27T11:21:07.297Z: revisió final de rendiment/UA, precisió dels sis probes i portes documentals a 0.
- 2026-10-27T10:58:44.586Z: creat pel circuit documental canònic.
- 2026-10-27T11:17:22.631Z: pla executable publicat; HTTP real, galeria visual, proves adversarials i rèplica a Gemini incorporats. Cap font editada.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Dictamen, abast i estat del consens

**P1-61 s'executa sobre la primera imatge real del contingut públic.** Cap avatar, hero de reserva o targeta social dissenyada a part pot passar davant d'una foto de la galeria o del cos. La SPA, Supabase com a autoritat i el port neutral no canvien de model.

Pla documental preparat per a Claude. L'abast i la invariant estan ordenats pel Mestre; les decisions tècniques es concreten ací amb evidència. S'han llegit els informes Claude 0925, Gemini 0920 —inclosa la secció 7 de v1.2—, Codex 0917 v2.1 i la proposta 0730 completa, distribuïda entre els quatre carrils Codex. **No s'atribuïx a Claude o Gemini una acceptació que encara no han escrit.** La taula de §10 distingix acords i esmenes pendents de rèplica; no és una afirmació de consens total.

Fora d'este torn: edició de fonts per Codex/Gemini, instal·lació de dependències, DNS, activació de facturació, permisos de servei, desplegament i purgues externes. Claude pot preparar la implementació per fases dins del mandat. Este pla no declara OpenGraph corregit en producció.

### 2. Evidència que fixa el cas de referència

Entre 10:55 i 10:59 UTC del 2026-10-27, tres GET anònims —URL pública amb UA ordinari, amb `WhatsApp/2.24.1` i domini `soc-de-poble.web.app`— retornen HTTP 200 i el mateix HTML, 5.330 bytes, SHA-256 `7b27ef996e22b0ced672ed273a279163716c2c66c0baf38e43b087af68097b43`. `og:image` i `twitter:image` apunten a `https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png`; el cos és la shell amb `#root`, sense les fotos del producte.

Això, `Vary: x-fh-requested-host`, la CSP i la coincidència amb el domini Firebase acrediten fortament **Firebase Hosting en servei**. El TXT configurat a SiteGround no demostra allotjament web allí. No s'han acreditat permisos administratius, projecte de facturació ni cap servei dinàmic actiu.

La pestanya del producte ja oberta pel Mestre mostra set diapositives i la xica amb samarreta com a imatge 1/7. És evidència visual de la sessió del navegador, no una exportació anònima del backend. La llavor local conté huit imatges; no es farà servir eixe recompte com si fora l'estat publicat actual.

Primera foto de referència: `01-chica-jersey.png`, dins de la carpeta de la samarreta. Els bytes locals són **JPEG/JFIF, 1024×1024, 782.271 B**, malgrat `.png`; SHA-256 `606829ccbf8fe6edb4665504a7f94ec32c1f7742b834d43348c4e73e4db76047`. La bessona WebP fa 112.948 B. Cal comprovar el recurs que realment es publicarà, el seu `Content-Type` i la seua identitat; no inferir MIME del sufix ni anunciar 1200×630 per defecte.

### 3. Contracte canònic de primera imatge

Separar normalització, selecció, resolució pública i renderització. API compartida, pura i independent de React/proveïdor:

```js
selectSocialImage(publicDocument, policy)
// { state: 'selected', assetRef, source, index, alt }
// { state: 'absent' }
// { state: 'blocked' | 'unresolved' | 'unavailable', reason }
```

`publicDocument` prové d'una lectura autoritzada per a públic anònim: `resourceKey`, `canonicalPath`, `contentRevision`, `publicationState`, `title`, `description`, `contentImages` amb ordre i procedència. Un JSON que diga `visibility: public` no demostra permisos. No conté sessió, propietaris privats, tokens o cos que no necessite la projecció pública.

Regles obligatòries:

1. Galeria editorial en l'ordre desat: **primera foto**. No ordenar per nom, resolució, mida, qualitat, variant de compra ni posició activa del carrusel.
2. Sense galeria, primera imatge real del cos en ordre documental. Logo de venedor, avatar d'autor, emblema decoratiu i reserves introduïdes pel renderer queden fora del conjunt de candidats.
3. Una portada explícita editorial pot normalitzar-se com a galeria d'una foto si és contingut real de la pàgina. Una il·lustració escollida editorialment compta encara que s'haja creat amb IA; s'exclouen les reserves sintètiques de la UI, no una tècnica de creació.
4. Només `state: absent` permet la imatge de reserva global. `SOCIAL_IMAGES`, l'OG especial del Llibre d'Or i els defaults de `PageFrame` no poden substituir una primera foto existent. Si no hi ha cap imatge de contingut, la reserva és el logotip genèric indicat pel Mestre (asset públic existent `public/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`, 20.182 B al tall local; validar dimensions i MIME abans del build; el mapa verd actual no acredita este requisit); no una peça especial inventada per ruta.
5. Una primera foto existent però privada, signada, trencada o no compatible no es convertix en «absent». No passar a la segona ni al logo. El procés de publicació prepara una representació estable **de la mateixa foto**, o emet un error verificable.

Normalització per font:

| Recurs | Font i precaució |
| --- | --- |
| Mercat | Reutilitzar el contracte de `imatgesDeProducte.js`/`llistaImatgesDeProducte`; `imageSrc` pot ser l'avatar del venedor. Cos només si no hi ha galeria. |
| Mur i Esdeveniments | Convertir la portada editorial real en candidat i llegir el cos HTML; no tractar logos heretats com a fotos. |
| Pobles | Preservar registre cru i procedència: `townsContent.js` pot substituir tant `image_url` com `imageSrc` amb la reserva de `resolveTownImageUrl`. No projectar cegament el poble ja decorat per la UI. |
| Pàgines i Wiki | Portada editorial o primera imatge de Markdown/HTML, segons el contingut real; cap override social davant del cos. Canonical Wiki amb `?item=`. |
| Notes | `/notes` i `/notes/:id` continuen privats i sense metadades de la nota. Una nota publicada es resol per la publicació autoritativa del Mur/Mercat/Agenda i els seus mitjans públics, no per `isPublished` de l'esborrany. |

El cos persistent actual és HTML (`editor.getHTML()`); no s'ha de pressuposar JSON TipTap. L'extractor compartit tindrà fixtures per majúscules, cometes simples/dobles, entitats, comentaris, contingut inert i ordre documental, amb límits explícits de bytes/profunditat i cost lineal. `getFirstImage` actual no és suficient: un HTML que no casa pot tornar sencer com a URL. No importar un helper JSX o DOMPurify de navegador dins del runtime neutral. Si s'admet JSON TipTap futur, exigir `type: doc` i recórrer nodes `image` en ordre; no cercar URL dins de qualsevol objecte.

### 4. Resolució de mitjans i head

Acceptar únicament referències públiques, estables i anònimes. `/assets/...` es resol amb l'origen públic configurat i la política de la mateixa release. Els mitjans del bucket públic passen pel resolutor públic existent; `mitjans_privats`, `sdp-media` privat, `/object/sign`, credencials, tokens, protocols locals, `blob:` i `data:` no arriben al manifest ni al head. No usar `esFontImatgeSegura` com a prova de publicitat: la UI també admet fonts privades amb sessió.

No fer un proxy d'imatges a partir d'una URL arbitrària. Si es comproven orígens remots, allowlist estreta, HTTPS, límit de mida/temps, redirects revalidats i cap IP privada. La petició d'un bot mai promociona automàticament una foto privada. Els permisos es resolen en publicar.

Es pot preparar una derivada JPEG/PNG lleugera de la primera foto, identificada per hash del recurs i de la transformació. No canviar composició ni afegir un logo que suplante la foto. Objectiu inicial d'enginyeria: ≤300 KiB quan siga viable amb bona qualitat; **no és un límit universal acreditat de WhatsApp**. Dimensions/MIME es lliguen dels bytes. La galeria no canvia perquè la derivada social tinga un format diferent.

El head HTTP 200 públic conté un únic conjunt de title, description, canonical, `og:*` i Twitter. Exactament una arrel `og:image` i una `twitter:image`, mateixa fotografia; propietats estructurades reals immediatament darrere. Substituir les etiquetes genèriques, no afegir-ne una segona còpia. Escapar contingut i atributs; canonical amb host fix, no amb `Host` arbitrari. [Protocol Open Graph](https://ogp.me/).

### 5. Arquitectura preferida: preservar Firebase i separar contingut estable del revocable

No migrar DNS a Cloudflare per resoldre un defecte de metadades. Nucli portable amb API Web `Request → Response`; transport de hosting separat. No afegir backend de Sollutia ni tocar `src/data/backendPort.js`: el resolutor social és un port **de lectura de metadades públiques**, no una font alternativa de dades.

**Via estàtica:** només pàgines editorials governades pel release i la seua política de publicació. Generar HTML amb la mateixa shell Vite i scripts, amb head particularitzat. Per a evitar carpetes noves i ambigüitats de `cleanUrls`, emetre fitxers plans `social-<hash-ruta>.html` dins de `dist/` i rewrites exactes declarades; les rutes amb query les resol el handler dinàmic. No executar React en un navegador headless. Una visibilitat canviada exigeix retirada/deploy de l'artefacte. No prerenderitzar indiscriminadament publicacions perquè apareguen en SEEDS.

**Via dinàmica:** Mercat, Mur, publicacions de Notes i qualsevol element privatitzable/editable es resolen amb `getPublicSocialDocument(resourceKey)` sobre l'autoritat pública vigent. Resposta tipada: `published`, `not-public`, `not-found`, `unavailable`; revisió i primera imatge del mateix tall. RLS o endpoint públic restringit; cap credencial `service_role`, sessió humana o accés general a Notes. El snapshot és una còpia auditable i acceleració; no acredita que l'element continue publicat. Una publicació privada no es ressuscita amb la llavor.

Mapping observat en codi: `src/data/supabase/content.js` fusiona `app_content` (`key,payload,version`) i `section_submissions` (`id,payload,title,created_at,updated_at,owner_user_id,author_org_id`), acotats per `tenant_id` i secció; les publicacions passen per `elementDeFilaPublicada`. És una pista de normalització, **no una prova de permisos anònims ni un endpoint social existent**. La projecció ha de resoldre slug→identitat estable dins del tenant, aplicar els permisos reals i retornar només els camps socials; no descarregar totes les notes ni confiar en claus d’autoritat del payload.

El resolutor encara **no és un endpoint implementat** en el prototip: fase obligatòria per a cobrir la samarreta i contingut nou. Claude ha de documentar el mapping real de la lectura pública actual i els camps autoritzats abans de connectar-lo; si no existeix una lectura restringida suficient, queda un lliurament específic de projecció pública. No es declara acabada P1-61 només amb un manifest de Wiki.

Adaptador preferit: **Cloud Run petit en Node**, servint el shell empaquetat i cridant el nucli pur. No existeix ara al repositori; cal acreditar projecte, `serviceId`, regió admesa, IAM i facturació abans d'activar-lo. Un Containerfile a l'arrel, amb COPY per allowlist dels fitxers necessaris, evita desplegar Wiki privada, `.agents`, `.env` o tot el repositori. Una Function de segona generació és alternativa si es concreta la font dins de les carpetes existents; no inventar «Firebase Edge» com a servei actiu. [Cloud Run amb Hosting](https://firebase.google.com/docs/hosting/cloud-run).

Ordre de Hosting: artefactes estàtics exactes admissibles → rewrites de documents dinàmics → reserva SPA. Provar que un antic fitxer físic de Mercat no eclipse el handler. Les rewrites decidixen pel path; `/wikidepoble?item=…` necessita resolució de query dins del handler. `cleanUrls` actual és false: verificar la forma sense barra final i redirects, no assumir que escriure `<ruta>/index.html` resol totes les URL. [Configuració de Hosting](https://firebase.google.com/docs/hosting/full-config).

Cloudflare Worker queda com a adaptador transportable futur, no una dependència ni un canvi de domini d'este pla. La política CSP s'aplica explícitament a les respostes generades; no dependre de `_headers` per al HTML del Worker. [Headers de Static Assets](https://developers.cloudflare.com/workers/static-assets/headers/).

### 6. Rendiment, revisions i memòria cau

Mateixes metadades públiques per humans i bots; l'UA només identifica diagnòstic i proves, mai permisos. Assets amb hash passen directament per Hosting/CDN. Cap JS nou al camí crític de React, cap consulta extra del navegador per a construir la targeta i cap doble renderització de l'app.

La injecció limitada a UA socials queda com a optimització futura. En Firebase Hosting, decidir l'UA dins de Cloud Run no evita la invocació humana ni la seua arrencada; un fitxer estàtic que eludix el servei també eludix la injecció als bots. Separar les vies exigix un gateway anterior, encara no acreditat. L'UA no concedirà permisos; qualsevol variant mantindrà contingut equivalent i claus de memòria cau separades. Açò no és una prohibició general de variants per bot: [Google admet contingut equivalent i tracta el dynamic rendering com a solució provisional](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering).

No prometre latència zero: el dinàmic pot tindre arrencada i lectura de dades. El benchmark compararà TTFB fred/calent, bytes de HTML i camí crític de scripts. Abans del canari es fixarà el pressupost numèric amb la regió i la font real; candidat inicial per a revisió: increment p95 ≤100 ms en calent i ≤1 s en fred respecte de la shell estàtica, amb el mateix origen de prova. Són llindars proposats, no resultats mesurats. Si no es complixen, no declarar acreditat el requisit de rendiment i revisar l'encaminament/arrencada abans de promocionar. El shell empaquetat es verifica una vegada en arrancar la instància; després es renderitza des de memòria. S'accepta eliminar el `fetchOrigin`+hash per petició del prototip **només** quan el descriptor de release vincule tots els artefactes i les capçaleres. Si es fa pass-through real d'una resposta, respectar els seus estats i no transformar 3xx/4xx/5xx, Set-Cookie o contingut no HTML.

| Capa | Primera versió |
| --- | --- |
| Assets amb hash | Política immutable vigent. |
| HTML estable del release | ETag de l'artefacte i revalidació; allò privat o mutable no entra en esta categoria. |
| HTML/metadades de publicacions revocables | `Cache-Control: private, no-store`, sense còpia compartida ni stale-while-revalidate. |
| Payload públic en memòria | Reutilitzable només després de confirmar estat públic i revisió vigents; no servir la versió antiga davant d'error d'autoritat. |
| Errors, privat, eliminat i resposta de lectura fallida | No-store explícit, també als 404, per evitar retencions negatives. |
| Imatges | URL pública estable i versió/hash quan canvien els bytes; retirada coordinada de derivades pròpies quan corresponga. |

La proposta `s-maxage=60, stale-while-revalidate=300` de Gemini queda ajornada per a contingut mutable fins que existisquen proves d'invalidació i un termini de revocació acordat. `no-store` no actualitza un manifest congelat. La CDN de Firebase pot retindre 404 si no es fixen headers; la clau té host/path/query. [Memòria cau de Hosting](https://firebase.google.com/docs/hosting/manage-cache).

En privat/absent, resposta neutral sense dades del recurs; distingir-ho internament d'error temporal. En lectura o primera imatge indisponible, resposta reintentable —503 amb Retry-After i no-store—, sense publicar una foto substituta. El body pot conservar el shell de la SPA perquè la navegació del navegador continue, però no es certifica un head de producte correcte amb una reserva falsa. GET i HEAD calculen el mateix estat/metadades; HEAD no porta cos. No retornar 304 genèric d'una altra ruta.

Definir `T_rev` com el commit autoritatiu de retirada i mesurar `T_effective` del pròxim GET anònim. La primera versió no usa dades antigues després d'eixe commit quan la lectura autoritativa ja el veu. Si una rèplica és eventual, cal documentar-ne i provar-ne el límit; no fingir immediatesa. Les còpies que WhatsApp, Meta o Telegram ja tenen queden fora de la garantia de l'origen: no prometre purga universal ni arreglar-ho afegint tracking a l'enllaç.

### 7. Concurrència i release

Construir des d'una còpia immutable de l'arbre viu, amb manifest de hashes; HEAD no identifica els canvis sense commit. Un descriptor únic relaciona `releaseId`, shell, manifest, política, índex d'imatges i assets. El SHA només de shell↔index del prototip és insuficient: el manifest també ha d'estar vinculat.

Generar en destí temporal admissible, validar i publicar com una unitat. L'escriptor compartit usa lock cooperatiu + comprovació de hashes dins del lock + rename atòmic; un check seguit de rename sense lock no és CAS. En canvi d'entrada, tornar a construir, no sobreescriure. Un release mixt falla abans de servir HTML.

Hosting i la revisió de Cloud Run poden vincular-se amb `pinTag` per a desplegament/rollback coordinats. La revisió de dades públiques es manté separada del release de JS: tornar a un frontend anterior no pot ressuscitar una publicació privada. El rollback conserva la consulta d'autoritat vigent.

### 8. Mapa d'implementació per a Claude, sense carpetes noves

Els noms següents són fitxers proposats en carpetes que ja existixen; no són altes fetes per Codex. **No crear `tooling/seo/` o `dist-edge/`** com demana literalment l'annex antic. Els outputs de build poden ser fitxers dins del `dist/` ja governat; l'evidència privada no s'hi publica.

| Àmbit | Canvi delimitat |
| --- | --- |
| `src/utils/socialImage.js` i prova al costat | Selector pur i normalitzador de candidats, contracte tipat i primera imatge sense dependències de React/proveïdor. |
| `src/sections/mercat/imatgesDeProducte.js`, `detailSectionMeta.jsx`, `paginaDeText.js`, TextSection i Wiki | Reutilitzar el selector; preservar procedència i distingir dades editorials de reserves UI. |
| `src/hooks/useSEO.js`, `seoHead.js` i suites | Descriptor de reserva complet i escriptura explícita del conjunt de metadades a cada ruta, sense capturar la imatge del producte com a base global. Mantindre la guarda manageDocumentHead/iframe/WordPress. |
| `tooling/gates/build-seo-manifest.mjs` | Compartir selector i projecció; corregir el productor existent de WordPress que prioritzava avatar sobre galeria. No publicar llavors privades per deducció. |
| `tooling/lib/social-core.mjs`, `social-public-source.mjs` | Core Request→Response, validació, canonicalització i port de lectura pública. Reubicar les peces de 0730 i revisar-les, no copiar-les cegament. |
| `tooling/wiki/build-social-manifest.mjs`, `prepare-social-shell.mjs`, `prerender-social-routes.mjs` | Manifest/descriptor/política i prerender limitat. Normalització HTML en build/projecció; runtime sense parser de navegador. |
| `tooling/scripts/social-http.mjs` | Adaptador Node HTTP de Cloud Run. Opcional `social-worker.mjs` amb el mateix contracte, sense activar Cloudflare. |
| `Containerfile.social`, `firebase.json`, scripts de package i proves Node existents | Paquet amb allowlist, rewrites, checks de release i bateries; cap desplegament fins acreditar infraestructura i revisió del resultat. |

Ordre de treball: (1) fixtures i selector; (2) client i regressió baseline; (3) projecció pública real; (4) builder/core i privacitat/revocació; (5) adaptador, prerender estable i descriptor; (6) proves HTTP sense JS i preview; (7) comprovació d'infraestructura, canari del domini i verificació real de compartició. No presentar el pas 2 com a solució de WhatsApp.

### 9. Proves i portes d'acceptació

- Samarreta real: capçalera HTTP anònima amb la mateixa primera foto que la galeria publicada, mai mapa ni avatar; og:image i twitter:image coherents, MIME/mides reals, sense JS. La fixture de llavor de huit fotos no certifica els set registres visibles en producció.
- Galeria buida + foto al cos; cos amb HTML en majúscules/cometes simples/entitats/comentaris; Markdown i TipTap només si són formats declarats. Galeria reordenada i canvi de revisió canvien la imatge.
- Primera foto bloquejada + segona vàlida: cap salt a segona/logo. Absència real: només aleshores reserva. Foto explícita editorial vs panorama de reserva injectat per la UI.
- Notes privades/esborranys/paperera: cap títol, descripció o imatge exportats. Nota publicada: només publicació i mitjans públics. URLs signades, tokens, host intern, query maliciosa i intents SSRF bloquejats.
- Revocació públic→privat, eliminació, timeout, error i rèplica endarrerida; no-store i cap payload antic. Les dades retirades no reapareixen per seed, prerender físic, caché ni rollback.
- GET/HEAD, rutes àlies, Wiki item, query duplicada/invàlida, UTM, slash final, canonical fix, duplicats OG, escapament i CSP. Humans, WhatsApp, TelegramBot, Twitterbot i facebookexternalhit reben el mateix contingut públic.
- Entrada directa amb head del producte→`/xat`→una altra publicació→tornar arrere: no queda la foto de la ruta anterior. Incloure muntatge/desmuntatge, fallback asíncron i amfitrió que no autoritza head.
- Mescles shell/manifest/política de releases diferents rebutjades; publicar i rollback atòmics, backend públic vigent independent.
- Caiguda del resolutor: shell encara carregable amb resposta degradada reintentable, sense head antic ni reserva que suplante una foto existent.
- TTFB fred/calent amb pressupost previ i HTML/assets. Cap browser headless en runtime, cap JS de servidor al client, cap SDK al port de frontend.
- Suites dirigides, frontissa, proves Node, test:precommit, Olivera i SCC. Servidor HTTP de prova efímer amb tancament en finally; si el sandbox nega listen, registrar-ho i executar eixa prova en l'entorn autoritzat, sense inventar verd.

### 10. Diàleg creuat i estat de decisions

| Punt | Posició de Codex després de llegir Gemini §7 |
| --- | --- |
| Primera galeria i helper compartit | Acord. Esmenar header/avatar/SOCIAL_IMAGES davant del cos si són reserves. |
| Defecte baseline en entrada prerenderitzada | Acord i reproducció independent amb seoHead.js real: la foto queda després d'anar a xat. |
| Eliminar fetchOrigin/hash per petició | Acord condicionat a bundle verificat i descriptor complet en arrancar. |
| Prerender de tot SEEDS i publicacions | No conforme per a revocables. Limitar a editorial de release; el seed no prova publicitat vigent. |
| CDN s-maxage60 + SWR300 per productes | No conforme en v1 sense invalidació demostrada; conservar no-store per a mutable. |
| «0 ms» i «100% de previews» | No acreditat. Mesurar latència; dimensions i compressió ajuden, però no garantixen el comportament o la cache d'una plataforma externa. |
| MIME image/png per 01-chica-jersey.png | Incorrecte segons bytes JPEG locals; cal MIME real o derivada correcta de la mateixa foto. |
| Host Firebase i portabilitat | Firebase sostingut per HTTP real; no desplegar alhora Firebase, Vercel i Cloudflare perquè existisquen configs de reserva. |

Claude 0925 no conté encara un compromís específic d'OpenGraph al tall llegit. Gemini §7 es titula consens, però les discrepàncies anteriors impedixen afirmar unanimitat. El nou pla és la proposta executiva de Codex; cada IA pot deixar la rèplica al seu informe i referenciar este pla. L'integrador ha de conservar este rastre i resoldre els punts tècnics abans de declarar el consens final o tancar P1-61.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Evidència efectivament recollida, separada de l'acceptació futura del §9:

- Captura immutable de l'arbre viu: `/private/tmp/sdp-og-consens-107rsumf`, 2.918 fitxers a 2026-10-27T10:54:31.566906Z, HEAD `7e1bc63fa4de31e63c6651bfb5edc45a43ba222c`. Cap entrada inestable detectada. HEAD no identifica tots els canvis sense commit.
- GET HTTP públic ordinari, WhatsApp i domini Firebase: mateix shell genèric, hash i mida del §2. Captures `/private/tmp/sdp-og-public*` i `/private/tmp/sdp-og-firebase-human*`. Navegador del producte: set fotos, primera xica amb samarreta.
- Prototip 0730 extret: 18/18 payloads íntegres. 38/38 proves lògiques existents després de reconstruir el fixture documentat; això prova el contracte antic, no la invariant nova. Log `/private/tmp/sdp-og-prototip-final.log`, SHA-256 `5e259a32d69493020d6ba76da7725965a7d146001482cbc52c6c2b40e7b7b95d`.
- Huit probes nous del prototip: sis incompliments esperats (galeria ignorada, cos ignorat, override SOCIAL_IMAGES, foto no compatible→logo, URL signada i revocació); dos casos de privacitat passen. `/private/tmp/sdp-og-invariant-probes.mjs` i `.log`. No són regressions introduïdes per una implementació nova.
- `seoHead.js` real: un probe confirma que la foto SSR del producte perdura després d'anar a xat. `/private/tmp/sdp-og-spa-baseline-probe.mjs` i `.log`; prova roja esperada que justifica la correcció client.
- Suites existents d'imatges/detall: 72/73 en la còpia limitada; la fallada `existsSync` de la foto és per omissió de `public/` al snapshot, no un defecte nou acreditat. No es ven eixa còpia com una execució íntegra verda.
- Prova de servidor local del prototip: `listen 127.0.0.1` rebutjat pel sandbox amb EPERM; no certificada en este torn. Processos acabats.

Comprovació documental executada: pla i informe vàlids; tancament --check del torn vàlid i huit portes a exit 0 (Olivera, plantilles, autoritat, LEDGER, segell, skills, Wiki i SCC). La primera execució detectà un terminador final incompatible amb el verificador del LEDGER; retirat sense canviar el cos signat i revalidat. La implementació futura encara ha de superar la matriu del §9; no s'ha fet deploy ni verificació de targeta nova en WhatsApp.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- La lectura pública vigent i la infraestructura dinàmica no estan desplegades: primer concretar-les amb camps, permisos i fixtures reals; cap seed les substituïx.
- Un prerender físic antic o SWR pot revelar contingut retirat. El pla exigix autoritat vigent i retirada d'artefactes que eclipsen el handler.
- La primera foto és obligatòria; una URL privada o trencada requerix derivada de la mateixa foto o error explícit, no una reserva silenciosa.
- La latència del servidor i les còpies dels proveïdors socials tenen límits que s'han de mesurar. No es promet 0 ms ni purga externa universal.
- Gemini §7 encara conté discrepàncies assenyalades al §10; Claude no ha confirmat este disseny al tall llegit. No declarar unanimitat o fita acabada.
- Concurrentment només Claude edita fonts. Codex publica documents amb lock cooperatiu, revalidació dels bytes i rename atòmic; cap còpia congelada s'escriu sobre l'arbre viu.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
- [[261027_0917_auditoria_codex]]
- [[261027_0920_auditoria_gemini]]
- [[261027_0925_auditoria_claude]]
