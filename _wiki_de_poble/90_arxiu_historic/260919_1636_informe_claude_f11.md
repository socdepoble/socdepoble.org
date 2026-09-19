# Informe Claude: Arquitectura de mitjans (F11)

Entesos els termes: auditoria en lectura, sense tocar cap línia, sense cerca web, i tota afirmació citada com `ruta:línies`. Comence per verificar el diagnòstic F11 abans d'acceptar-lo.

He verificat el codi abans de acceptar el dictamen. **F11 és cert**, però el dilema tal com està plantejat parteix d'una premissa que el codi no sosté. Això canvia la resposta.

---

## 1. Estat verificat

**Abast de la lectura:** no hi ha cap stack local de Supabase (`supabase/config.toml` no existix, cap contenidor actiu). La "base de dades local" auditable és la declarativa: `supabase/migrations/`. **[SUPÒSIT]** no he pogut confirmar l'estat realment aplicat a Sollutia — la mateixa llacuna que Codex ja registra a `_wiki_de_poble/04_escriptori/260919_1600_estudi_codex.md:355`.

### F11 confirmat, i pitjor del que diu el report

El bucket té **dues portes obertes independents**:

| Porta | Cita | Efecte |
| --- | --- | --- |
| Bandera `public = true` | `supabase/migrations/260913_0500_bucket_mitjans.sql:8-14` | Habilita la ruta `/object/public/…`, que **no passa per RLS** |
| Política `select to anon` | `supabase/migrations/260913_0500_bucket_mitjans.sql:19-20` | Obri la ruta d'API autenticada a l'anònim |

Tancar-ne una sense l'altra no tanca res. I hi ha un detall que val la pena mirar-se bé:

```
-- 4. Protegir el bucket 'mitjans' de lectura anònima per SQL, delegar a Storage
drop policy if exists "Lectura lliure mitjans" on storage.objects;
update storage.buckets set public = true where id = 'mitjans';
```
— `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:57-59`

Una migració titulada *auditoria RLS fixes* que diu que protegix el bucket i, a la línia següent, **reafirma `public = true`**. És el mateix patró que ja tenim fitxat: un control que declara una cosa i en fa una altra. Recomane tractar-lo com a defecte propi, no com a part de F11.

### La premissa del dilema és falsa

> *"totes les funcions `getPublicUrl` deixaran de funcionar, trencant la càrrega directa de tots els mitjans actuals (fins i tot els públics)"*

Això no es sosté. **`anon` no pot llegir `profiles` en absolut:**

- `supabase/migrations/260912_1500_correccio_privacitat_perfils.sql:12` — `REVOKE SELECT … FROM anon`
- `supabase/migrations/260914_0100_auditoria_rls_fixes.sql:55` — `revoke all … from anon`
- `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:98` — llança excepció si cap política de `profiles` inclou `anon`

I el `grant` d'`organizations` a `anon` **no inclou cap columna de logo**: `id, tenant_id, slug, name, kind, parent_organization_id, lema, description, visibility, created_at, updated_at` (`supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:65-69`). La vista `organization_directory` tampoc en té (`supabase/migrations/260908_0000_initial_schema.sql:700-714`).

**Conclusió:** avui l'única superfície realment pública que consumix una URL de `mitjans` és `app_content` (el mur), que sí que és llegible per `anon` (`supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:28-35`). Els avatars només es mostren a usuaris amb sessió — excepte quan viatgen copiats dins d'una publicació al mur (`src/sections/connectar/ConnectarSection.jsx:56,71`).

El "cost de trencar-ho tot" de l'Opció B és molt menor del que es temia. Però hi ha un cost real que ningú ha comptat.

### El defecte estructural sota F11

El sistema **persistix URLs absolutes com si foren dades**. Tres llocs:

1. **Dins de l'HTML de la nota.** L'editor puja i injecta la URL retornada com a `src` d'un node imatge: `src/components/universal/richText/extensions/index.js:110-119`. Eixe HTML es desa a `notes.content`.
2. **Dins del JSONB públic.** `publishNote` copia la cadena `coverImage` al payload del mur (`src/sections/notes/NotesContext.jsx:178`), que acaba a `app_content.payload jsonb` — un blob opac sense esquema (`supabase/migrations/260908_0000_initial_schema.sql:34-41`).
3. **A columnes de text** (`notes.hero_image`, `profiles.avatar_url`).

Això té una conseqüència letal per a l'Opció B: **una URL firmada caduca, i tu l'has escrita dins d'HTML i dins de JSONB**. Passat el TTL, les imatges moren als dos llocs, i no hi ha esquema per a reescriure-les al JSONB. `createSignedUrl` no apareix ni una vegada al repositori; `getPublicUrl` està al contracte (`src/data/contracte.js:50-53`).

### Dos forats col·laterals

- **El tenant no existix a la ruta.** La convenció és `${user.id}/${carpeta}/${uuid}.${ext}` (`src/data/supabase/storage.js:108`). El manament *"fitxers del seu tenant"* **no és expressable en RLS** amb aquesta disposició. Caldria un segment de tenant o un join — i `private.is_town_member(uuid)` ja existix i ja està concedida a `anon` (`supabase/migrations/260908_0000_initial_schema.sql:447`).
- **Superfície d'escriptura minúscula.** Només dos punts pugen a `mitjans`: `carpeta:'notes'` (`src/sections/notes/NotesEditor.jsx:15`) i `carpeta='avatars'` (`src/sections/profile/PerfilContext.jsx:201-204`). Tot passa pel port (`src/data/backendPort.js:106-107`). El coll d'ampolla per a arreglar-ho és d'un sol fitxer.

---

## 2. DAFO

### Opció A — Bucket nou `mitjans_privats`, `mitjans` segueix públic

| Fortaleses | Debilitats |
| --- | --- |
| Canvi més xicotet; `getPublicUrl` intacte per als avatars | **Talla per l'eix equivocat.** La privacitat ací no és un *tipus de fitxer*, és un *estat del cicle de vida* |
| Aïllament físic: un error de política en un bucket no contamina l'altre | Publicar una nota exigix **copiar o moure l'objecte** entre buckets — operació nova, no atòmica amb el desat de la fila |
| Cap refactor de render immediat | Un avatar és privat fins que l'usuari publica al mur (`ConnectarSection.jsx:71`): el model "avatars = públics" ja és una fuita acceptada per defecte |
| | Segueix persistint URLs absolutes: el deute estructural queda intacte |

| Oportunitats | Amenaces |
| --- | --- |
| Desplegable en un dia; tapa el sagnat de F11 ràpidament | **Deriva de classificació:** cada funcionalitat nova haurà de decidir bucket a mà, i una decisió errònia és una fuita silenciosa |
| | Duplicació d'objectes en publicar: dos fitxers, dos cicles de vida, esborrats orfes |
| | Institucionalitza que "públic" siga el valor per defecte d'una branca |

### Opció B — `mitjans` privat del tot + URLs firmades pertot

| Fortaleses | Debilitats |
| --- | --- |
| Model mental net: res és públic sense autorització | **No és implementable tal com està enunciada.** Les URLs viuen dins d'HTML persistit i de JSONB públic: firmar-les és escriure caducitat a la base de dades |
| Un sol bucket, una sola política | El mur és llegit per `anon`, que **per definició no pot demanar cap firma** |
| | Cost ocult al bundle standalone de WordPress: la resolució asíncrona per cada `<img>` en un context sense sessió no té resposta |

| Oportunitats | Amenaces |
| --- | --- |
| Si s'hi afig indirecció, es converix en l'Opció C | **Imatges mortes en massa** passat el TTL, sense manera de reescriure el JSONB |
| | Tokens de firma filtrats a `app_content.payload`, que és llegible per qualsevol |
| | El mur públic i el SEO queden inutilitzables |

### Opció C — Privacitat per cicle de vida + referència opaca (proposta)

Tres peces:

1. **Referència opaca, no URL.** Es persistix `{bucket, ruta}` o un identificador de mitjà. Mai una URL absoluta. La resolució passa a ser un mètode del contracte.
2. **Dos buckets per *estat*, no per *tipus*.** `mitjans-privats` (privat, destí per defecte de **tota** pujada) i `mitjans` (públic, **només** objectes promoguts). Publicar és una **promoció explícita** — exactament el criteri d'acceptació que el mateix Codex demana a `260919_1600_estudi_codex.md:200`.
3. **Ruta amb tenant:** `{tenant_id}/{user_id}/{carpeta}/{uuid}.{ext}`, amb RLS sobre `private.is_town_member()`.

| Fortaleses | Debilitats |
| --- | --- |
| Ataca la causa, no el símptoma: la base de dades deixa de guardar autoritat dins de cadenes de text | Refactor més ample: cal un component de resolució al Sistema de Disseny |
| **Privat per defecte**: una funcionalitat nova que s'oblide de classificar queda segura, no filtrada | La promoció ha de ser idempotent i reversible (despublicar) |
| `getPublicUrl` segueix servint el mur → SEO, `anon` i el bundle de WordPress intactes | Migració de dades obligatòria (però vegeu davall) |
| El manament del tenant passa a ser expressable en RLS | Dues polítiques a mantindre en compte |
| El contracte és l'únic punt de canvi: `CAPACITATS.mitjans` passa de `['uploadToStorage','getPublicUrl']` a upload + resol + promou (`src/data/contracte.js:50-53`) | |

| Oportunitats | Amenaces |
| --- | --- |
| **Sollutia queda més desacoblat, no menys**: cap URL de Supabase fossilitzada a les dades; canviar de proveïdor deixa de ser una reescriptura massiva | Si la promoció no és transaccional amb el desat de la fila, es publica una nota amb imatge inaccessible |
| Immunitza contra el forat de `import.meta.env` buit al standalone: la resolució va per configuració injectada (`src/data/supabase/runtime.js:30`), no per `VITE_*` | Requerix disciplina: qualsevol `getPublicUrl` nou fora del port reobri el forat (mecanitzable amb una porta) |
| Habilita després, sense tornar a trencar res: caducitat d'adjunts, quotes, antivirus, variants | |
| Despublicar passa a ser possible de veritat (avui la URL viu per sempre) | |

---

## 3. Recomanació

**Opció C.** Amb una precisió que canvia el càlcul de costos:

**La migració de dades no és un cost diferencial de C — és un cost que ja heu contret i que pagareu amb qualsevol de les tres opcions.** Hi ha URLs absolutes de `mitjans` congelades dins de `notes.content` i dins de `app_content.payload`. A i B també obliguen a reescriure-les. La diferència és que **C la paga una sola vegada i per sempre** (passa a referències opaques), mentre que B la deixa impagable (no pots reescriure tokens caducats dins d'un JSONB sense esquema) i A la deixa pendent per a la pròxima vegada.

Raons per ordre de pes:

1. **B, literalment, no es pot implementar.** El mur el llig `anon`, i `anon` no pot demanar una firma. Qualsevol intent seriós de B acaba inventant-se la indirecció de C — però amb pitjor posició de partida.
2. **A talla per l'eix equivocat.** `ConnectarSection.jsx:71` ja demostra que un avatar es torna públic en publicar. La privacitat d'un mitjà és un *estat*, no una *categoria*. Un model que ho classifica per tipus de fitxer garantix que algú ho classificarà malament.
3. **C inverteix el valor per defecte.** Avui l'error per omissió és *filtrar*. Amb C, l'error per omissió és *no veure's* — sorollós, detectable, no silenciós. Per a una plataforma que voleu regalar, això és la diferència entre que algú herete un sistema segur o una mina.
4. **La superfície de canvi és menuda i ja està centralitzada.** Dos punts de pujada, un port, un contracte. Els 27 `<img>` de 18 fitxers no s'han de tocar tots: els que renderitzen mitjans d'usuari són un subconjunt, i `resolveAsset` (`src/config/assetResolver.js:34`) ja és el lloc natural on encaixa la resolució.

**Ordre d'execució suggerit** (perquè cap pas deixe el sistema pitjor que ara):

1. Tancar el sagnat: bucket privat nou + les pujades de notes cap allà. F11 deixa de créixer.
2. Introduir la referència opaca al contracte i el component de resolució. Doble lectura temporal: si el valor persistit és una URL antiga, es serveix tal qual; si és una referència, es resol.
3. Migrar les dades existents (HTML i JSONB) a referències.
4. Implementar la promoció en publicar i revocar la doble lectura.
5. Afegir el segment de tenant i endurir les polítiques.
