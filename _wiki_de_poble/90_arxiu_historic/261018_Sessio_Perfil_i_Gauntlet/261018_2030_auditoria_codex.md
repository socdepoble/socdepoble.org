---
type: informe
status: esborrany
description: Auditoria de la protecció relacional de mitjans, migració WebP i paquet WordPress, i identitat canònica de productes i variants.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9c42437b-2615-43f5-8256-7e4cef2f84ce:4f31802b-da85-48c7-b252-a95fce49ec65
---
# Auditoria Backend, Supabase i integritat de dades

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9c42437b-2615-43f5-8256-7e4cef2f84ce:4f31802b-da85-48c7-b252-a95fce49ec65 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T18:32:37.925Z |
| Modificació | 2026-10-18T20:44:00+02:00 |
| Propietari | Codex |
| Aprovació humana | Auditoria i informe encarregats explícitament; implementació no executada |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (GPT-6) amb tres subagents de lectura |
| Tokens consumits | No disponibles amb precisió en esta sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-18: auditoria encarregada directament pel Mestre; torn `torn_9c42437b-2615-43f5-8256-7e4cef2f84ce`, abast documental.
- Llegits íntegrament el prompt i el pla 2000. Relleu provisional publicat en este mateix informe durant la investigació. Referència Git local: `1e6ffece`, amb canvis concurrents previs que formen part del codi inspeccionat.
- Incorporada la revisió del pla de les 20:34: galeria completa incrustada en el gestor, separada per actor persona, empresa/grup o agent IA. Gemini 2030 s’ha llegit primer com a esborrany i després íntegrament amb conclusions; s’incorpora el contrast de la secció 4.1, sense atribuir consens no confirmat. Llegida també l’ampliació d’enquadrament de les 20:36.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i abast

**El model proposat és viable, però la protecció relacional encara no està implementada. No és segur activar l’esborrat confiant només en la UI ni llevar `uploads/` abans de migrar les referències.** El producte únic ja existix en la llavor del Mercat; falta donar identitat estable a les variants i garantir el mateix subjecte en les comparticions.

Sóc de Poble continua el treball rural del Rentonar amb un client modular: Supabase és la font de veritat darrere de `backendPort.js`; WordPress i Sollutia són amfitrions. Les propostes següents respecten eixa frontera i no introduïxen backend a WordPress ni escriptures a l’API de Sollutia.

Este torn entrega disseny, evidència i criteris d’acceptació. No modifica producte, migracions, mitjans ni dades remotes. Les línies citades corresponen al codi local inspeccionat i poden variar amb el treball concurrent.

### Resum prioritzat

| ID | Severitat i evidència | Impacte, mandat afectat i proposta |
|---|---|---|
| R1 | **P1** · `src/data/supabase/storage.js:569–589`; `src/sections/profile/DetallMultimedia.jsx:459–496,631–643` | La foto pròpia passa directament a `storage.remove`. L’avís és genèric; no comprova publicacions. Contradiu la protecció relacional de la fase 5. Afegir consulta autoritativa i esborrat transaccional protegit. |
| R2 | **P1** · `supabase/migrations/2609200300_blindatge_storage_i_contingut.sql:49–72` | Les polítiques d’escriptura comproven propietat de ruta, no referències. Un client pot ometre el diàleg. Tancar DELETE directe i sobreescriptura dels objectes gestionats; purga només pel servei autoritzat. |
| R3 | **P1** · `src/config/assetResolver.js:136–167`; `src/hooks/useResolvedAsset.js:83–94`; `vite.standalone.config.js:47–57` | Les rutes locals encara apunten al paquet WP. No existix `mediaResolver.js`. Excloure fotos abans de publicar i verificar el mapa d’àlies genera 404. Integrar el mapa amb els resolutors existents. |
| R4 | **P2** · inventari WP i empaquetador; `tooling/media/optimitzar_webp.mjs:434–463,527–540` | El tractor només convertix localment. Excloure `uploads/` deixa un ZIP estimat de **39,44 MB**, no 2–4 MB. Cal migració CDN i tractar també els altres mitjans pesants. |
| R5 | **P2** · `tooling/media/optimitzar_webp.mjs:55–69,434–453`; `src/data/supabase/storage.js:292–300` | Ni totes les pujades són WebP ni tots els motors conserven EXIF/qualitat 84. Establir perfil explícit de conversió i comprovació de bytes/metadades. |
| R6 | **P1** · `src/sections/mercat/marketSeed.js:50`; `src/data/mapejadorSeccions.js:51,92`; prova del mapejador `:70` | Variants sense id estable; el sanejador elimina camps com SKU. Afegir sols camps a la UI els perdria en publicar. Evolucionar esquema, mapejador i prova de lectura/escriptura junts. |
| R7 | **P1** · `src/sections/notes/NotesContext.jsx:345,394`; `src/sections/mur/TargetaDelMur.jsx:123,129`; `src/config/navigation.js:339` | Una compartició conserva `origen`, però el Mur calcula el subjecte amb l’id de la compartició. Del flux s’inferix una conversa separada de la del producte. Resoldre la connexió al node original en totes les superfícies. |
| R8 | **P2** · `src/sections/detail/detailSectionMeta.jsx:265,298–336`; `marketSeed.js:59,65` | Targetes/botons repetits, sense acció de cabàs ni bloqueig per variant esgotada; imatges opaques descartades i foto Verda fora del carrusel. Selector per id, resolució pel port i una sola acció validada. |
| R9 | **P2** · `src/data/supabase/storage.js:409–484,545–552`; `src/sections/multimedia/MultimediaContext.jsx:23,45–50` | La biblioteca actual llista usuari/poble actiu i llegat públic, amb límit de 1.000 entrades per prefix; no és un àlbum complet per actor. L’arxiu també filtra fotos vives `sdp-media://`. Cal llistat paginat per titular i resoldre mitjans opacs. |

Totes les propostes són inferències d’enginyeria sobre evidència local. `requires_human_decision: false` per al diagnòstic i estos contractes, que desenvolupen el mandat. No equivalen a migracions aprovades o desplegades. Les decisions de producte residuals s’expliciten al final.

### 1. Contracte de protecció: `comprovaUsImatge(id/url)`

#### 1.1 Fonts reals que s’han de consultar

**No hi ha taules independents `posts`, `events` o `mercat` en les migracions inspeccionades.** No s’ha de construir una consulta contra noms conceptuals que no existixen.

| Domini visible | Persistència real i cobertura mínima |
|---|---|
| Mur, Mercat i Agenda editorials | `app_content(tenant_id,key,payload)`, amb claus `feedPosts`, `marketItems`, `events`; elements i arrays interiors. |
| Publicacions de veïns | `section_submissions`, seccions `mur`, `mercat`, `events`, `multimedia`, `notes`, amb `payload`. |
| Persona | `profiles.avatar_url`, `hero_url`, `presentacio_html`; inventariar també referències pròpies conservades en metadades d’Auth, sense retornar-les al client. |
| Empresa/grup | `organizations.logo_url`, `hero_url`, `presentacio_html`. |
| Notes, esborranys i paperera restaurable | `notes.hero_image`, `logo_image`, `content`; incloure contingut recuperable mentre es conserve. |
| Catàleg multimèdia, pobles i agents | `app_content` amb `mediaItems`, `towns`, `agents` i altres claus que admeten mitjans; llavors, cens i manifest del paquet com a fonts de sistema. |
| Xat i historial | `xat_fils.imatge_url`; inventariar qualsevol adjunt històric de `xat_missatges.metadades` i text ric si existix. El flux actual `xat_envia` escriu metadades buides (`2610081543_xat_consentiment_i_metadades.sql`), fet que no prova que no hi haja llegat. Revisar `app_content_historial` per a versions restaurables. |

Evidència d’estructura: migració inicial `2609080000_initial_schema.sql:34–95`; notes `2609140000_schema_notes.sql:5–23`; perfil/organitzacions `2609261500_identitat_perfil_f1.sql:38–138`; historial `2610101900_personalitzacio_superadmin.sql:80`.

En JSON cal cobrir, segons cada esquema, `image`, `image_url`, `imageSrc`, `src`, avatars, logos, `images[]` i `variations[].image`. La migració `2610072230_mur_imatges_propies.sql:141–161` ja enumera part d’estos camps. El contingut ric necessita extracció dels atributs reals admesos (`src`, `srcset`, enllaços d’adjunts i altres fonts si el sanejador les permet). No usar només `payload::text LIKE '%nom%'`: una coincidència parcial pot ser falsa i l’absència no garantix cobertura.

#### 1.2 Identitat del mitjà i normalització

La identitat lògica serà `mediaId`. La identitat d’un objecte físic és **node/proveïdor + bucket + path exacte**, no el nom de fitxer ni la URL visible. Un mitjà pot tindre original, WebP i miniatures; eliminar el mitjà requerix comprovar totes les derivades.

Entrades admeses: `mediaId` registrat, referència `sdp-media://...`, URL pública/signada/de transformació d’un origen configurat, o ruta local amb àlies registrat. L’adaptador extraurà bucket/path amb un parser estricte; rebutjarà travessies, barres codificades ambigües, origen alié i doble descodificació. Eliminarà token/query només després de reconéixer la ruta del proveïdor. **No convertir tot el path a minúscules**: els objectes poden distingir caixa. No confondre la còpia pública i la privada encara que compartisquen nom.

Una URL externa, un `data:` o un fitxer local sense registre no és «lliure». És `no_gestionada`; no habilita purga de Storage. Una referència invàlida és un error de validació. Els àlies migrats retenen el mateix `mediaId` quan canvia el format.

#### 1.3 API neutral proposada

Afegir una capacitat opcional separada, per exemple `integritatMitjans`, a `contracte.js`, `backendPort.js` i al kit de conformitat. No afegir un mètode obligatori a `mitjans` que deixe invàlids adaptadors que només saben pujar. La UI consulta capacitats; en un adaptador sense integritat, desactiva l’esborrat remot.

```ts
// Especificació proposada; encara no implementada.
comprovaUsImatge(idORef, { actor, signal } = {}, config = {})
  -> Promise<ComprovacioUs>

type ComprovacioUs = {
  estat: 'en_us' | 'lliure' | 'incomplet' | 'no_gestionada';
  mediaId: string | null;
  ref: string | null;                  // estable; mai URL signada
  revisio: string | null;              // opaca; canvia quan canvien els usos
  cobertura: { completa: boolean; versio: string };
  usosVisibles: Array<{
    tipus: 'publicacio' | 'perfil' | 'organitzacio' | 'nota' | 'sistema' | 'xat';
    id: string;
    titol: string;
    href: string | null;
    camps: string[];
    potSubstituir: boolean;
  }>;
  teUsosNoVisibles: boolean;
  cursor: string | null;               // paginació dels detalls, no del recompte d’integritat
  potDemanarEsborrat: boolean;
};
```

- El servidor obté usuari i permisos de la sessió; `actor` és una selecció a validar, mai autoritat aportada pel client. Abans de consultar usos, verifica que pot gestionar el recurs. Sense permís retorna un error neutral sense confirmar-ne l’existència.
- La cerca d’usos és global per a l’objecte, inclosos altres pobles i referències no llegibles. No es limita al material carregat al navegador ni a les files visibles per RLS de l’usuari.
- Només s’exposen títols, rutes i ids que el lector pot veure. Per a altres usos, com a màxim un booleà; cap compte exacte, títol privat ni ruta interna. Si una RPC usa `SECURITY DEFINER`, ha de fer explícitament eixes comprovacions: el bypass de RLS no és un permís per divulgar.
- `lliure` exigeix cobertura reconciliada i zero usos, visibles o ocults. Una consulta fallida, un parser incomplet, truncament o backfill inacabat no es convertix en `lliure`. Errors de xarxa/permisos rebutgen amb codis neutrals; el client conserva la imatge.
- `potDemanarEsborrat` també requerix titularitat, estat actiu i absència de protecció de sistema. És orientatiu: es revalida en executar.

Al diàleg: «Esta imatge està en ús a [títol]. Pots substituir-la o conservar-la». Per a usos ocults: «També està en ús en contingut al qual no tens accés». `incomplet`: «No hem pogut comprovar tots els usos; la foto es conserva». La deduplicació passa pel mateix contracte per a cada objecte; mateix hash/ETag no significa mateix conjunt de referències.

#### 1.4 Registre i garantia d’esborrat

Proposta de model, sense crear encara taules:

| Peça | Invariants |
|---|---|
| `media_assets` | `id` estable, estat `active/pending_delete/deleted`, revisió, protecció de sistema, titularitat i creador separats. El creador no provoca `ON DELETE CASCADE` si queden usos públics després d’una baixa. |
| Objectes/derivades del mitjà | FK a asset, rol de derivada, node/bucket/path únic, MIME real, SHA-256, dimensions i bytes. Paths immutables; cap reutilització després d’esborrar. |
| Referències tipades | Enllaços amb FK real a `profiles`, `organizations`, `notes`, `section_submissions`, etc., i FK restrictiva a asset; únics per propietari/camp/posició. No confiar en una parella lliure `entity_type/entity_id` sense integritat del destí. |
| Referències d’`app_content` | FK al contenidor `(tenant_id,key)` més id estable de l’element. Trigger/servei valida existència i unicitat dins del JSON i sincronitza referències en cada canvi; una FK al contenidor sola no basta. |
| Cua de purga | Ampliar `private.purga_storage_pendent` amb asset/generació, request id, estat, intents, error segur i reintent; no crear un segon sistema independent. |

Hi ha precedent de cua a `2609261500_identitat_perfil_f1.sql:917–927` i una redefinició posterior de la baixa a `2609282100_xat_de_pagina.sql:748–760`. El booleà `referenciat` és una fotografia puntual, limitada a organitzacions i publicacions; `ON CONFLICT DO NOTHING` tampoc el refresca. **No consumir eixes files com si foren autoritzacions actuals.** Reconciliar-les, migrar també la baixa de comptes al protocol nou i conservar en quarantena les ambigües. `supabase/README.md:442–450` confirma que falta el consumidor de la cua en la implementació documentada.

Flux d’execució proposat:

1. `demanaEsborratImatge({mediaId,revisio,idempotencyKey}, config)` autentica i revalida permisos. La clau es vincula a actor, operació, asset i hash d’arguments; reutilitzar-la amb arguments diferents és conflicte.
2. En una transacció, bloqueja l’asset amb `FOR UPDATE`, rellegix estat/revisió i consulta usos actuals després del bloqueig. Qualsevol nou ús o cobertura incompleta retorna conflicte i refresca el diàleg.
3. **Totes** les vies d’alta, substitució, importació i restauració de referències bloquegen el mateix asset i comproven `active`. Cal ordre de bloqueig consistent per a contenidors i assets, i reintent de deadlock/serialització. Una FK sola no impedix referenciar un asset que canvia a `pending_delete`.
4. Amb zero usos, escriu `pending_delete` i el treball de purga en la mateixa transacció. A partir d’ací no s’admeten referències noves. L’API torna «esborrat pendent», no èxit físic.
5. Un servei de servidor consumix la cua i usa **Storage API** per eliminar les derivades. Reintenta idempotentment davant de caigudes; confirma `deleted` només després de verificar l’absència dels objectes. Un 403 o error de xarxa no equival a 404. No s’executa cap DELETE SQL sobre `storage.objects`.
6. Revocar l’esborrat directe dels objectes gestionats per rols de navegador i impedir `UPDATE/upsert/move` que sobreescriguen paths immutables. La credencial de servei només viu al servidor. Una cancel·lació/restauració requerix invalidar la generació del treball; no reactivar un asset mentre el worker antic encara el pot esborrar.

Això resol la carrera «comprove → un altre publica → esborre». PostgreSQL documenta els bloquejos de fila i els conflictes entre escriptors; el protocol complet ací és una proposta pròpia. [Bloquejos de PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).

Supabase indica que les operacions físiques han de passar per la seua API; esborrar metadades SQL no elimina el blob. [Esquema de Storage](https://supabase.com/docs/guides/storage/schema/design). Les funcions amb privilegis elevats necessiten `search_path` segur i permisos d’execució restringits; aplicar `REVOKE` a `PUBLIC/anon` i concessió explícita al rol previst. [Funcions de base de dades](https://supabase.com/docs/guides/database/functions). La service key evita RLS i no pot arribar al client. [Control d’accés de Storage](https://supabase.com/docs/guides/storage/security/access-control).

**Substituir** és una operació sobre cada publicació autoritzada, amb revisió del document i validació del mitjà nou, que actualitza contingut i referències en la mateixa transacció. Mai eliminar el vell abans de confirmar el canvi. Si l’usuari no pot editar algun ús, no pot forçar-ne la desvinculació des de la biblioteca. Es pot oferir «llevar del meu àlbum» com a canvi de pertinença sense purgar l’objecte global.

#### 1.5 Migració i àlbums per actor

Primer instal·lar captura obligatòria de referències en totes les vies d’escriptura; després backfill amb checkpoints per fila/versió i conciliació final. Si no hi ha parser HTML fiable al servidor SQL, obligar a passar per un servei parser i restringir escriptura crua dels camps afectats. No activar la purga fins a reconciliar totes les fonts. Historial restaurable, contingut de sistema i versions empaquetades també retenen recursos o requerixen una comprovació explícita en restaurar.

Per a l’ampliació del pla de les 20:34: `llistaMitjansActor({actor,cursor,limit}, config)` ha de consultar titularitat explícita, no inferir-la pel nom, carpeta, e-mail o persona que va pujar el fitxer. Una foto pujada per Javi per a Rentonar té creador persona i titularitat d’entitat. La relació amb organització es valida amb membres/rols; la d’un agent IA amb el registre canònic i permisos d’administració. Si l’agent viu dins d’`app_content`, el seu id requerix la mateixa validació de contenidor que els productes.

Diferenciar propietat, ús i pertinença a àlbum. La biblioteca privada requerix autorització encara que algunes derivades siguen públiques. Paginar sense tall silenciós; incorporar els diversos pobles autoritzats i el llegat. El visor consumix metadades persistides i URL resolta pel port. Per a l’enquadrament afegit al pla a les 20:36, guardar coordenades d’enquadre per ús o una nova derivada immutable del mateix mitjà; no sobreescriure el blob compartit ni modificar les fotos d’altres publicacions. La vista `/multimedia` i la pestanya del perfil compartixen font de dades i visor, però els permisos es comproven al servidor.

### 2. WebP, Supabase Storage i paquet WordPress

#### 2.1 Mesura del problema

Mesura sobre `wordpress-plugin/dist/sdp-inventari.json`, 529 fitxers de l’artefacte existent. Compressió en memòria `deflateRawSync` nivell 9 i capçaleres equivalents a `wordpress-plugin/eines/empaqueta.mjs:128–187`; no s’ha generat un ZIP nou ni reconstruït el dist compartit. Exclou adaptador WP i JSON de manifest/inventari del paquet final.

| Conjunt | Fitxers | Bytes originals | ZIP estimat, bytes |
|---|---:|---:|---:|
| Inventari complet | 529 | 141.424.297 | 135.554.159 |
| Només `assets/uploads/` | 153 | 96.791.557 | 96.115.090 |
| Sense `assets/uploads/` | 376 | 44.632.740 | **39.439.069** |

Residus comprimits principals: `nano_cards` 13,07 MB; `ui` 6,30 MB; `towns` 5,79 MB; `fotos` 4,80 MB; `system` 2,15 MB; `events` 1,85 MB. JavaScript: aproximadament 1,63 MB. **2–4 MB continua sent un objectiu, no un resultat demostrat:** exigix tractar mitjans fora d’uploads i mesurar el ZIP final. MB en esta taula és decimal.

El cens actual de `public/` dona 219 imatges i 134.958.392 bytes, 125 candidates WebP; `uploads/` conté 142 imatges, només una WebP. La diferència respecte del dist prova que són fotografies de moments diferents.

#### 2.2 Contracte de conversió i resolució

Reutilitzar `npm run media:webp`; no duplicar el tractor. La conversió en sec real de `DSC00410.JPG` amb `maquinaria` dona **6.881.084 → 297.706 bytes**, 5184×3888 → 1600×1200, **95,67% menys**. No s’ha escrit la derivada. Este exemple no garantix ni un 96% per a totes les fotos ni un màxim universal de 80–100 KB.

Perfil de migració: WebP real, costat llarg màxim 1600 sense ampliar, orientació correcta, transparència preservada quan toque, bytes/dimensions/hash registrats. `maquinaria` usa qualitat 84 i conserva EXIF per a JPEG; el valor genèric del tractor és 80. PNG usa altres motors; `cwebp -metadata none`, `magick -strip`, canvas i el camí actual de sharp no garantixen EXIF. Per a fotos patrimonials, exigir motor amb metadades verificables o fallar explícitament. Conservar originals i metadades canòniques al lloc autoritzat; la política de GPS publicat no s’ha de deduir del fet que es conserve EXIF.

`uploadToStorage` encara puja el Blob rebut i admet JPEG/PNG/AVIF. La preparació compartida de fotos ha d’executar-se abans de tots els ingressos i verificar MIME/bytes resultants, també al servidor per a la garantia. No aplicar conversió a PDFs privats ni confondre SVG estructural, vídeo o animació amb fotografia. Si el tractor salta un fitxer perquè no estalvia, ja existix o hi ha col·lisió, registrar el cas; no inventar una derivada canviant-ne l’extensió.

Manifest de migració mínim:

```json
{
  "schemaVersion": 1,
  "legacyPath": "/assets/uploads/poble/foto.JPG",
  "mediaId": "identificador-estable-assignat",
  "ref": "sdp-media://mitjans/poble/actor/fotos/id-generacio.webp",
  "sha256": "empremta-dels-bytes-webp",
  "mime": "image/webp",
  "width": 1600,
  "height": 1200,
  "bytes": 297706,
  "exifPolicy": "preservacio-verificada",
  "verifiedAt": "instant-real-de-la-comprovacio-remota"
}
```

Els valors són il·lustratius, no dades pujades. El mapa antic→nou és exacte, versionat i permet rollback; no cal reescriure el mateix mitjà com una entitat diferent en cada taula.

Resolució: una façana, si es nomena `mediaResolver.js`, reutilitza `backendPort.resolveAsset`; l’SDK queda a l’adaptador Supabase. Retorn proposat: `{status,mediaId,ref,url,mime,width,height}`; `ref` persistible i `url` transitòria. Aplicar àlies **abans** de prefixar el domini/camí del plugin. `marketContent.js:10` resol durant la importació i `assetResolver.js:177–179` tracta HTML: cal cobrir també consumidors síncrons, HTML, CSS, `srcset` i rutes dinàmiques; un hook nou a soles no basta.

Objecte públic → URL pública de Storage/CDN; privat → via autenticada/signada, sense promoció implícita. URL nova/versionada per derivada, `upsert:false`. `getPublicUrl` construïx la URL però no acredita existència; verificar resposta, MIME i hash o bytes abans d’activar l’àlies. [Servir mitjans](https://supabase.com/docs/guides/storage/serving/downloads), [getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl).

Mantindre un placeholder mínim local. Si el CDN falla, mostrar eixe substitut; no recórrer a l’upload local exclòs. Respectar l’origen propi configurat a `runtime.js` i el sanejador, i comprovar CSP real de WordPress/Sollutia en canari. El domini del host no substituïx el del backend.

#### 2.3 Seqüència segura del build

1. Cens de referències i metadades → conversió en sec → producció no destructiva de derivades.
2. Pujada al destí autoritzat → comprovació remota de totes les derivades → publicació del manifest verificat.
3. Integració de resolutors i canari amb totes les superfícies; incloure anònim/autenticat i públic/privat.
4. Excloure el prefix relatiu exacte `assets/uploads/` en la còpia del build WP i en la retirada de restes. `PROPIS_DEL_LLOC.arrel` només compara primer nivell: afegir-hi literalment `assets/uploads` no funcionaria.
5. El build ordinari usa `emptyOutDir:false` (`vite.standalone.config.js:600–612`); comprovar que no arrossega fotos d’un build anterior. Preservar l’inventari com a autoritat de l’empaquetador.
6. Externalitzar/optimitzar els altres grups pesants mesurats, conservant icones, fonts i recursos mínims necessaris. Aplicar pressupost executable al ZIP final: objectiu 2–4 MB, límit del pla inferior a 5 MB, unitats explícites. L’avís actual de 10 MiB no és eixa porta.
7. Provar un build complet des de net i un incremental, sense cap `assets/uploads/` ni URL local morta. Rollback: manifest/refs anteriors i originals preservats fins a validació; cap purga massiva basada només en el cens.

### 3. Mercat: node únic i variants filles

#### 3.1 Què es pot validar hui

Sonda de llavor: **2 productes, 2 ids únics, 1 Samarreta, 2 variants i 8 fotos**. Ja s’ha de mantindre una sola card i una sola ruta. `TargetaDelMercat.jsx:64`, `targetaDeProducte.js:80` i `imatgesDeProducte.js:44` compartixen descriptor, URL i galeria.

No es pot declarar unicitat global garantida: `app_content` té PK del contenidor, però no dels ids interiors; `section_submissions` té PK UUID. La fusió de `content.js:166–180` i la deduplicació de `mapejadorSeccions.js:325` passen en memòria. Cal detectar ids repetits dins de JSON i col·lisions entre fonts al servidor, sense confondre dos productes legítims amb el mateix nom.

Les organitzacions sí tenen `UNIQUE(tenant_id,slug)`. El xat de pàgina té índex únic `(tenant,subjecte_tipus,subjecte_id,tipus)` i bloqueig transaccional (`2609282100_xat_de_pagina.sql:128,334`): conservar esta garantia. No s’ha trobat persistència operativa de reaccions de producte; no s’ha d’afirmar que ja compartixen comptadors.

#### 3.2 Esquema mínim compatible amb el selector

```json
{
  "id": "samarreta-socdepoble",
  "schemaVersion": 1,
  "priceMinor": 1500,
  "currency": "EUR",
  "variations": [
    {
      "id": "gris-plom",
      "name": "Edició Gris Plom",
      "availability": "available",
      "image": "referencia-publica-estable-de-gris"
    },
    {
      "id": "verda-pi",
      "name": "Edició Verda",
      "availability": "out_of_stock",
      "image": "referencia-publica-estable-de-verda"
    }
  ]
}
```

Forma proposada; les referències i la disponibilitat s’ompliran amb dades verificades. `variations[].id` és immutable i únic dins del producte, assignat una vegada; no es recalcula del nom ni de la posició. Mantindre el camp `variations` durant la transició evita una renomenada innecessària. `name` és etiqueta; disponibilitat és un enum tancat amb valor `unknown` per a llegat no interpretable. Preu enter en unitats menors i moneda explícita, amb override opcional de variant; no parsejar moneda traduïda durant una compra. No inventar quantitat d’estoc quan només es coneix «Esgotat».

Conservar `description` i SKU opcional si hi ha dades reals. Validar camps nous al mapejador, al servidor i en el recorregut complet desar→llegir. L’actual prova que descarta SKU s’ha d’actualitzar conjuntament, mantenint el rebuig de camps d’autoritat aliens. Afegir límits d’array, ids únics, enum, moneda i enters no negatius.

El selector manté `selectedVariantId`. Canviar selecció actualitza foto/preu/disponibilitat i un únic botó. La foto Verda no està entre les huit de la galeria: mostrar-la com a activa o incorporar-la una vegada a la galeria per identitat; no assumir que cada variant correspon a un índex actual. Resoldre `sdp-media://` amb el port abans de pintar.

Acció mínima: `afegeixAlCabas({productId,variantId,quantitat})`; clau del cabàs amb node/tenant, producte i variant. No confiar en preu o estoc aportats pel client. El detall actual no té handler de cabàs: un selector visual per si sol no implementa una compra.

#### 3.3 Integritat del graf i evolució de persistència

Ruta, compartir i comentaris utilitzen sempre el producte canònic, mai `variantId`. Una connexió pura és una aresta al producte original, sense còpia autoritativa del seu text/preu ni un subjecte nou. Cal una resolució única de `origen` per a Mercat, Mur, MAS i comparticions, validada contra l’entitat real; no navegar cegament a un id arbitrari dins d’un payload. La nota privada pot conservar la seua identitat pròpia, però no substituir la identitat pública del producte connectat.

Per a estoc/reserves/checkout, evolucionar a `products` i `product_variants`, no crear una publicació per variant. Requisits: PK estables, FK composta `(tenant_id,product_id)`, únic `(tenant_id,product_id,variant_key)`, SKU únic per comerciant quan existisca, preu/quantitat no negatius i transacció/idempotència per reserves. El registre d’àlies conserva els ids públics i subjectes de xat de les llavors durant la migració. `app_content.marketItems` passa a llavor o projecció, no segona autoritat.

Per al selector immediat basta l’esquema JSON validat. No cal desplegar un checkout ni una base de graf nova en este torn. El model relacional amb ids, FK i arestes explícites satisfà la propietat buscada d’Obsidian.

### 4. Ordre d’implementació i coordinació

1. **Backend:** inventari real remot i conciliació; contracte d’integritat separat; captura de refs i bloqueig de vies alternatives; migració de cua/baixes. Fins aleshores, conservar davant d’incertesa.
2. **Claude:** integrar consulta i estats del diàleg, àlbum per actor/visor compartit, selector per id i resolució de fotos opaques. L’avís no substituïx la garantia del servidor.
3. **Mitjans/WP:** tractor → CDN verificat → manifest → canari → exclusió i pressupost. No llevar `uploads/` abans d’este ordre.
4. **Mercat:** mapejador i esquema abans de desar variants noves; unificar subjecte original en comparticions; normalització SQL quan existisca necessitat d’inventari/comanda.
5. **Gemini:** revalidar permisos, identitat/sessió, carreres, absència de fuites de detalls privats, variants i renderització després de la implementació.

Decisions que requerixen criteri humà abans de desplegar la funcionalitat corresponent (`requires_human_decision: true`): política de conservació d’originals/versions restaurables i publicació de GPS; semàntica d’una obra derivada editable si es vol oferir separadament de compartir; comerç amb estoc real/reserves. No bloquegen l’entrega d’esta auditoria. Per al mandat vigent, compartir és referenciar i conservar és l’opció segura quan no es pot purgar.

Millora de la plantilla: mantindre les fonts canòniques completes però declarar un manifest de lectures per rol, versió/hash i data de tall; distingir «dissenyat», «implementat», «testat localment» i «verificat en remot». Els estudis Obsidian/REA d’interacció no certifiquen esquemes SQL. Una xifra de tests d’una sessió anterior tampoc prova la suite actual.

### 4.1 Contrast amb l’informe Gemini 2030 rebut durant el tancament

Coincidim en la manca de comprovació relacional i en la necessitat d’un selector amb una sola acció. Precisem abans de traslladar-ne el pseudocodi a producció:

- La signatura actual és `esborraElMeuMitja(ref, config)`, no un objecte `{bucket,cami}`. Les fonts persistents són les de la taula 1.1, no taules `posts/events/mercat`.
- No ampliar carpetes esborrables ni enviar un lot directe a Storage únicament amb una comprovació prèvia: conservar la frontera de titularitat per actor i la transacció/cua descrites ací. Un lot pot optimitzar el worker després de validar cada asset; paral·lelitzar no aporta integritat.
- El botó «Eliminar duplicats» ja existix al codi inspeccionat (`DetallMultimedia.jsx:528–539`). La proposta de detectar una còpia de Google per URL/absència d’ETag no pot justificar esborrat: requerix prova de contingut i d’usos.
- El selector proposat per Gemini usa índex d’array i descarta imatges opaques. Per al contracte de dades cal selecció per `variantId` estable i resolució de `sdp-media://` abans del filtre segur; no imprimir mai l’esquema opac cru en un `img`.
- L’afirmació de la secció «Límits» de Gemini que Codex està editant `src/` o creant `20_capacitats/` no descriu este torn: Codex només ha fet auditoria/documentació. Tampoc s’adopta «Supabase + CRDT local» de la fitxa gws com a nova font de veritat; es manté el Model B canònic.

Les altres troballes visuals/OAuth i les fitxes REA/gws corresponen als seus carrils; no es donen per validades en esta auditoria de dades. Este contrast no modifica el document de Gemini ni el codi de Claude.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Executada en este torn

| Comprovació | Resultat |
|---|---|
| Porta Olivera inicial | Exit 0; escriptori indexat, safata buida. Avisos previs de sediment de l’índex. Cap moviment de fitxers. |
| Vitest: Storage propi/privacitat, DetallMultimedia, MultimediaContext | **4 fitxers, 100 proves passades**, 16,31 s; repetides al tancament després del canvi concurrent del test: **100/100**, 3,50 s. |
| Vitest: mapejador, Mercat, targeta, connexió, xat de pàgina i carrusel | **6 fitxers, 103 proves passades**, 12,16 s. |
| Node: tractor WebP i convertidor | **29/29 passades**. |
| Node: standalone i empaquetador | **50/50 passades**; builds de prova en temporals amb `publicDir:false` i `envDir` buit, sense tocar dist compartit. |
| Sonda seed | 2 productes/ids únics, una Samarreta, dos variants sense id, huit fotos; Verda fora de galeria. |
| Conversió en sec de DSC00410.JPG | 297.706 B finals, 1600×1200, −95,67%; sense `--aplica`. |
| Inventari i compressió WP en memòria | 135.554.159 B estimats; sense uploads, 39.439.069 B. No és un ZIP final publicable. |

Total focal: **282 proves passades**. Les proves de producte usen fixtures/mocks i verifiquen el comportament actual, que inclou limitacions conegudes. No demostren que els contractes proposats existisquen, ni que les polítiques estiguen aplicades al Supabase remot. No s’ha executat tota la suite de l’aplicació.

Comandes reproduïbles, des de `socdepoble.org`:

```sh
node_modules/.bin/vitest run src/data/supabase/storage.mitjansPropis.test.js src/sections/profile/DetallMultimedia.test.jsx src/sections/multimedia/MultimediaContext.test.jsx src/data/supabase/storage.privacitat.test.js
npm run test:unit -- src/data/mapejadorSeccions.test.js src/sections/mercat/MercatSection.mateixProducte.test.jsx src/sections/mercat/TargetaDelMercat.test.jsx src/sections/notes/ConnexioDetall.test.jsx src/data/supabase/xat.pagina.test.js src/sections/detail/ItemDetailSection.carrusel.test.jsx
node --test tooling/media/optimitzar_webp.test.mjs tests/convertir-a-webp.test.mjs
node --test tests/standalone-build.test.mjs tests/enxufe-empaqueta.test.mjs
```

### Acceptació pendent de la implementació

- Consulta: cada font real, URL pública/signada/transformada i path amb caixa; zero usos real; origen alié; usuari sense permís; ús privat sense revelar títol; error o font parcial que conserva.
- Concurrència en BD real: publicació/attach simultani a purga; substitució A↔B; revisió canviada; contingut eliminat/restaurat; worker caigut, duplicat o resposta perduda; baixa de compte amb publicacions conservades; cap sobreescriptura del mateix path.
- Cobertura: JSON, HTML, historial, notes/paperera, sistema, organitzacions i agents; estat del backfill verificat, sense límits silenciosos ni escriptors antics fora del protocol.
- WebP: EXIF/orientació/transparència i MIME real; cap JPG/PNG de fotografia publicat fora del flux; objectes remots disponibles; cap URL signada persistida.
- WP: build net i incremental, uploads absent, inventari congruent, ZIP final dins del pressupost i cap 404 en perfils, Mur, Agenda, Mercat, Multimèdia i HTML/CSS; CSP dels amfitrions i accessos privats.
- Variants: ids únics, reordre/renom sense canviar selecció; lectura/escriptura sense pèrdua; variant esgotada; una card/un botó; foto Verda; mateix subjecte de comentari des de les quatre superfícies; preu/estoc verificats al servidor si hi ha compra.

### Tancament documental

`document.mjs check` de l’informe: **vàlid**. Primera execució i repetició final de `tancament.mjs`: **exit 1**. Olivera, plantilles, autoritat, LEDGER existent i compilador Wiki: exit 0; segell, catàleg de skills i SCC: exit 1. La repetició confirma resoltes les dos incidències de vinculació del pla; persistixen els altres impediments descrits ací.

El diagnòstic inicial compta 69 incidències `LINK_INVALID`, 302 `ESCRIPTORI_UNANCHORED` i 20 `ORPHAN_OPERATIVE`, sense cap error referit a este informe; també divergència de `.agents/manifest.yaml` i del segell. El torn s’ha vinculat després al pla vigent (SHA-256 `3fd431fac6d09024769dcc00898b656dfc97638e18d8a0b431d5610bf933b61f`), resolent l’omissió pròpia inicial de vinculació. El control de concurrència detecta `src/sections/profile/DetallMultimedia.test.jsx` canviat durant l’auditoria per treball alié; Codex no ha editat eixe fitxer.

El relleu està a ESTAT i a este informe. Falta formalitzar el relleu de LEDGER del torn; no s’ha alterat el llibre ni recalculat el segell de governança per fer passar la porta. L’executor de mutació exigix segell previ vàlid (`tooling/gates/executor-mutacio.mjs:42`), que la porta declara divergent. No es declara torn mecànicament tancat ni repositori globalment verd. L’entrega tècnica de l’auditoria està completada.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Inspecció de codi, migracions i artefacte locals. Sense connexió a la BD remota: no es certifiquen dades existents, RLS/GRANTs desplegats, buckets, duplicats ni disponibilitat CDN. No s’han llegit secrets.
- Lectura directa íntegra de prompt/pla 2000 (inclosa ampliació 20:34), pla/prompt 1605 i auditoria 1718, BIOS, genotip, índex mestre, taxonomia, plantilla i procediment documental; bloc actual d’ESTAT. Els dos estudis vius (destil i Obsidian) i l’índex complet d’escriptori s’han llegit íntegrament per un subagent i s’han incorporat les implicacions. No s’ha llegit l’arxiu històric automàticament ni es declara llegida tota la història d’ESTAT.
- Repositori compartit amb treball concurrent: este informe no certifica canvis posteriors. Gemini 2030 complet llegit i contrastat en 4.1; no s’han enviat missatges a altres xats ni s’ha atribuït aprovació als altres agents.
- No s’ha fet poda de la Wiki, cap pujada, eliminació, migració, release, commit o desplegament. Només informe, ancoratge, resum d’ESTAT i rebuts del torn; proves en temporals. Cap cron creat ni cap procés de seguiment deixat per este torn. Les automatitzacions alienes no s’han cancel·lat.
- Acta Marmota de jornada pendent de la coordinació del tancament; este informe deixa el relleu tècnic i no substituïx una certificació de producció.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2000_prompt_claude_gemini_capacitats_matrix_i_poda]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]]
- [[261018_1718_auditoria_perfil_public_multimedia_i_poble]]
- [[261018_2030_auditoria_gemini]]
