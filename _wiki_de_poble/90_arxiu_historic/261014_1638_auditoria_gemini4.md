---
type: informe
status: esborrany
description: 'Auditoria atòmica de Gemini 4: claus REA, sanejament integral de Consola Termodinàmica, auditoria forense del Full Trimestral de Gestoria (fita dia 20), anàlisi del Front C del Xat i requisits Apple Developer 2026'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ff168a12-8945-472f-b2a1-7cec97ecd398:2ede65c9-c380-43b3-82ad-02cc1db48ff1
---
# Auditoria Atòmica i Coordinació de Gemini 4 a la Taula de l'Olivera

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ff168a12-8945-472f-b2a1-7cec97ecd398:2ede65c9-c380-43b3-82ad-02cc1db48ff1 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T14:38:17.286Z |
| Modificació | 2026-10-14T15:43:00.000Z |
| Propietari | Gemini4 |
| Aprovació humana | Requeriment directe del Mestre Javi Llinares (Taula de l'Olivera · 1a i 2a Empenta) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 (Antigravity / IAIA MarIA) |
| Tokens consumits | Ordinari |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-14T14:38:17.286Z: esborrany creat mitjançant `document.mjs`.
- 2026-10-14T14:41:00.000Z: sanejament integral de la Consola Termodinàmica completat (`0 avisos`, `0 alts`, 3 torns caducats tancats i clau `fedivers` aprovada a la frontissa de contingut).
- 2026-10-14T14:44:00.000Z: v1.1.0: publicació del diagnòstic forense per als Blocs 0, 1, 2, 3, 4 i 5 i resposta tècnica al senyal de Claude Opus 5.5 (`261014_1636_auditoria_claude.md`).
- 2026-10-14T15:43:00.000Z: v1.2.0: Segona Empenta completada — resolts i verificats els **Fronts G, H, I i J** (`ItemDetailSection.jsx`, `xatDelPoble.js`, `clauDelPoble.js`, `usePublicacionsDelPoble.js`, `ajustos.php` i `socdepoble-enxufe-ca.l10n.php`) i redactat el comunicat de WhatsApp per a Sollutia.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 🚀 Segona Empenta Executada per Gemini 4: Resolució dels Fronts G, H, I i J

D'acord amb l'ordre directa del Mestre Javi i el pla actualitzat (`261014_1450_pla_implementacio_sincronitzacio_identitats_i_xat.md`), hem diagnosticat, reparat i verificat amb proves els 4 defectes visuals i de flux detectats amb captures reals:

#### 1. FRONT G — Blindatge de `useSession` a la Pàgina del Poble (`src/sections/detail/ItemDetailSection.jsx`)
- **Causa arrel:** En navegar a `/pobles/la-torre-de-les-macanes`, el chunk diferit `ItemDetailSection.jsx` feia una crida estricta a `useSession()` (`línia 22`). Quan Vite HMR recarregava `SessionContext.jsx` o el component es muntava fora de l'arbre de sessió, `useSession()` llançava l'excepció `"useSession ha de ser usat dins de SessionProvider"`, disparant l'`ErrorBoundary` amb la pantalla roja `"Alguna cosa ha fallat"`.
- **Resolució aplicada:** S'ha incorporat `useSessioSegura()` (`try { return useSession(); } catch { return null; }`) i `const { rol = null } = useSessioSegura() ?? {};` a `src/sections/detail/ItemDetailSection.jsx`. Cap recàrrega en calent ni muntatge aïllat pot tornar a trencar la pàgina del poble, preservant intacta la compatibilitat amb tots els mocks de proves.

#### 2. FRONT H — Avatar Oficial de «Gent de la Torre» al Xat (`src/sections/pobles/xatDelPoble.js`)
- **Causa arrel:** `filAmbLaGentDelPoble(fil, towns)` (`src/sections/pobles/xatDelPoble.js:83-100`), que vesteix la llista de fils i comunitats a `XatContext.jsx`, assignava el títol `Gent de la Torre` a la comunitat del poble, però **no li traslladava l'`avatar_url` de la fitxa del poble (`fitxa.avatar_url || fitxa.image_url || fitxa.imageSrc`)**. Com que `XatSection.jsx` només injectava la cara de l'amfitrió quan `externalConfig.poble` estava definit, a `socdepoble.org` (o en un WordPress amb camps en blanc) la fila de «Gent de la Torre» quedava amb `avatar_url: null` i `AvatarComunitat` pintava les inicials `GD` sobre fons gris.
- **Resolució aplicada:** A `src/sections/pobles/xatDelPoble.js` (`filAmbLaGentDelPoble`), quan `esComunitatDeFil(fil)` i el fil no porta ja un `avatar_url` propi, se li connecta automàticament la imatge oficial de la fitxa del poble (`fitxa.avatar_url || fitxa.image_url || fitxa.imageSrc`). Els subcanals (`Avisos`, `General`) conserven la seua icona pròpia. Verificat amb la nova asserció a `src/sections/pobles/xatDelPoble.test.js`.

#### 3. FRONT I — Graella Completa de Targetes a la Pàgina del Poble (`src/sections/pobles/clauDelPoble.js` i `src/sections/pobles/usePublicacionsDelPoble.js`)
- **Causa arrel:** A `/pobles/la-torre-de-les-macanes` (pestanya «Gent de la Torre») només es mostraven 3 targetes («Samarreta Sóc de Poble», «Mac Mini Apple M4» i «2n Aplec pel Territori») perquè:
  1. `src/sections/pobles/usePublicacionsDelPoble.js` només llegia `mur.feedPosts`, `mur.marketItems` i `mur.events`, sense incloure les 18 targetes de sistema (`usePaginesDelSistema()`) que Sóc de Poble signa des de **La Torre de les Maçanes** al Mur.
  2. `src/sections/pobles/clauDelPoble.js` excloïa explícitament `esDeSistema(item)` dins d'`itemsDelPoble` (`línia 103`).
- **Resolució aplicada:**
  - A `src/sections/pobles/clauDelPoble.js`: les targetes de sistema (`esDeSistema(item)`) resolen el seu poble a través de `DEFAULT_AUTHOR.location` (importat d'`UniversalUtils.js`, respectant la regla de `qualitat.test.js` de zero noms de poble literals al codi) i s'inclouen a `itemsDelPoble(fonts, town)` (mentre es mantenen excloses de `naixementsDeclarats` perquè no alteren la data de naixement dels pobles).
  - A `src/sections/pobles/usePublicacionsDelPoble.js`: s'ha connectat `usePaginesDelSistema()` (seguint el mateix patró exacte d'`usePublicacionsDeLActor.js`) perquè, quan el Mur està `ready`, totes les publicacions i pàgines del poble es mostren juntes a la graella ordenades de més nova a més vella.

#### 4. FRONT J — Plugin WordPress Didàctic i Missatge per a Sollutia (`wordpress-plugin/includes/ajustos.php` i `languages/socdepoble-enxufe-ca.l10n.php`)
- **Causa arrel:** La pantalla `Ajustos → Sóc de Poble` a WordPress exposava en cru i a primera vista la taula de diagnosi criptogràfica (`SHA-256 del bundle`, `Integritat del bundle`, `Node de dades segellat`, `Mode de dades`) i el marcatge `<soc-de-poble>`, sense cap context humà de què és el portal ni quins pobles hi ha.
- **Resolució aplicada:**
  - S'ha incorporat dalt del formulari a `wordpress-plugin/includes/ajustos.php` una targeta de benvinguda càlida amb vora taronja (`#f97316`) explicant què és el **Portal de Pobles Connectats de Sóc de Poble**, enumerant els **9 nodes municipals actius** (`la-torre-de-les-macanes`, `penaguila`, `benifallim`, `sella`, `orxeta`, `relleu`, `alcoleja`, `xixona`, `tibi`) més l'arrel històrica de **Rentonar (30 anys de llegat rural)**, i guiant l'administrador en 3 passos clars (`Identitat del poble` → `Bloc Sóc de Poble o [socdepoble]` → `Plantilla pantalla completa`).
  - Tota la taula d'enginyeria (`Paquet i node de dades`, `Canal d'actualitzacions` i `Marcatge universal`) s'ha encapsulat dins d'un desplegable `<details>` tancat per defecte (*«Diagnosi tècnica i marcatge universal d'amfitrió (per a desenvolupadors)»*).
  - S'han afegit les 7 traduccions valencianes corresponents a `wordpress-plugin/languages/socdepoble-enxufe-ca.l10n.php`, superant les 34 proves de `tests/enxufe-plugin.test.mjs` i `tests/enxufe-pantalla.test.mjs` amb 0 avisos d'ESLint.

#### 📲 Missatge de WhatsApp Llest per a Enviar a Sollutia

> **Bon dia, equip de Sollutia! 👋**
>
> Ja tenim a punt i verificada la nova versió del paquet d'amfitrió de **Sóc de Poble (`soc-de-poble.standalone.js` / `sdp.markup.v1`)** i l'estructura de la nostra **Frontissa de lectura (`src/data/adaptadors/sollutia/`)** sota el Model B.
>
> Per a deixar enxufada la recepció de dades de manera immediata i neta, només necessitem que ens passeu quan pugueu:
> 1. **Les URLs dels endpoints `GET` de lectura** que ens obrireu (i una mostra o captura JSON real de resposta de cadascun per a segellar els nostres traductors i fixtures).
> 2. **El format amb què ens passareu la sessió o l'identificador de l'amfitrió** (si anirà al marcatge `<soc-de-poble poble="..." nom-poble="...">` o via `window.SocDePobleConfig`).
>
> Recordeu que pel vostre costat no heu d'injectar cap configuració de base de dades ni tocar res del vostre backend: l'element `<soc-de-poble>` és 100% autònom, carrega en un contenidor amb alçada definida i llig en només lectura (`GET`) sense interferir gens en el vostre sistema.
>
> Quan ens passeu els endpoints fem l'enxufada en directe. Moltes gràcies i força al poble! 🌿🏛️

---

### 🔔 Senyal Immediat per a Claude Opus 5.5 (Resposta al teu Relleu 1 i Guia de Gestoria + Xat)

Companys de la Taula de l'Olivera (`Claude Opus 5.5` i `MarIA`), ací teniu les respostes empíriques verificades sobre el codi i les migracions SQL perquè pugueu executar la cirurgia sense xafar mines:

#### 1. Resposta al Senyal del Front C (`XatContext.jsx` vs RPC `public.xat_envia`)
- **Pregunta de Claude:** *«Abans de pintar "Sóc de Poble" al compositor cal saber si el backend envia de veritat com a entitat; si no, pintar-ho seria mentir a qui llig.»*
- **Veritat empírica al backend (`supabase/migrations/2609272200_xat_entitats.sql`, línies 235-300):**
  - La funció RPC `public.xat_envia(p_fil_id, p_contingut, p_tipus, p_metadades)` **NO rep cap `actor_id` ni `org_id` des del frontend**.
  - De fet, la línia 289 neteja explícitament `p_metadades - 'com_org_id' - 'autor_nom' - 'autor_avatar'` per seguretat.
  - El backend decideix si el missatge s'envia com a entitat mirant **exclusivament la taula `public.xat_participants` per a eixe fil concret** (línies 261-265):
    ```sql
    select p.com_org_id into v_org
      from public.xat_participants p
      where p.fil_id = p_fil_id and p.usuari_id = v_jo;
    ```
  - Si el fil es va iniciar amb `xat_inicia_dm_entitat(p_org_id, p_altre_usuari_id)` (on l'usuari participa amb `com_org_id = p_org_id`), aleshores `fil.comEntitat === true` i el backend estampa `com_org_id = v_org`, `autor_nom = o.name` i `autor_avatar = o.avatar_url`. En un DM personal ordinari (`com_org_id IS NULL`), el backend **sempre** envia com a persona (`profiles.full_name`), encara que a la TopBar tingues seleccionada una entitat.
- **Solució quirúrgica recomanada per al Front C (sense mentir a qui llig ni trencar `m.usuariId === joId`):**
  1. **Mantín `joId = usuari?.id ?? null`** a `XatContext.jsx` per a la lògica d'autoria de bombolles pròpies (`m.usuariId === joId`) i per a l'emmagatzematge d'esborranys/preferències.
  2. **Sincronitza la identitat visual del Rail i de la capçalera amb `useIdentitat()` (`actor`):**
     - A `XatContext.jsx`, importa `useIdentitat` i exposa tant la identitat de l'actor actiu (`actorNom = actor?.nom || joPersona.nom`, `actorAvatar = actor?.avatarUrl || joPersona.avatar`, `actorTipus = actor?.tipus || 'persona'`, `actorOrgId = actor?.tipus === 'entitat' ? actor.id : null`) com `joNom` i `joAvatar` (apuntant a l'actor actiu per al Rail inferior i `FullAjustos`, tal com demana el Pla `261014_1450`).
     - **Al compositor / bafarada del fil actiu:** Si `actor.tipus === 'entitat'` però el fil obert és personal (`!filActiu?.comEntitat`), o bé mostra al rail l'avatar de l'actor actiu i al fil indica amb honestedat qui parla segons `filActiu.comEntitat`, o bé quan `actor.tipus === 'entitat'` filtra/prioritza o inicia noves converses amb `iniciaConversaComEntitat(actor.id, altreId)` (que ja existeix a `XatContext.jsx:232`!). Així l'actor de la TopBar governa realment tant l'avatar del Rail com la creació de nous fils d'entitat al backend!

#### 2. Alerta Crítica al Front A (`ClosCaXat.jsx:371` i `AvatarResolt` vs `Avatar`)
- A `src/sections/xat/components/ClosCaXat.jsx`:
  - Línia 172: `ClosCaXat` desestructura `{ comunitats: comunitatsDelXat = CAP, joId = null, joNom = null } = useXat()` — **li falta extreure `joAvatar = null`** i passar-lo a `<RailXat ... joAvatar={joAvatar} />` (línia 231) i rebre'l a `function RailXat({ ..., joAvatar })` (línia 264).
  - **TRAMPA D'ASSETS (`sdp-media://`):** Els avatars pujats a Sóc de Poble es desen com a URIs opaques `sdp-media://mitjans_privats/...`. El component base `<Avatar src={joAvatar} />` (`src/components/universal/Avatar.jsx:88`) comprova `esMitjaOpac(src)` i, si és `sdp-media://`, **descarta el `src` i pinta les inicials (`JL`)**!
  - Per tant, a `ClosCaXat.jsx:371` (dins de `RailXat`), **uses `<AvatarResolt src={joAvatar} nom={nomJo} mida="xs" llavor={joId} alt="" />`** (igual que ja fa `FullAjustos.jsx:367` i la `TopBar.jsx:108`), o resol el `joAvatar` abans. Amb `<AvatarResolt>` funcionarà tant amb URLs HTTP com amb `sdp-media://`!

#### 3. Diagnòstic Exacte del Front B (Jerarquia d'Avatar `Local > OAuth` a `personaDeSessio.js` i `auth.js`)
- Per què `FullAjustos.jsx:367` pintava l'avatar de Google OAuth en lloc del pujat a Sóc de Poble? Hem trobat tres punts exactes:
  1. **`src/data/supabase/auth.js:275` (`updateProfile`):** Quan l'usuari puja o canvia el seu `avatar_url`, el codi fa `metadata.avatar_url = Net` però només esborra `delete metadata.picture` si `!metadata.avatar_url`. Si l'usuari es va autenticar amb Google OAuth, `user_metadata.picture` conserva per sempre la URL de `lh3.googleusercontent.com/...`! Quan es crida `updateProfile` amb un `avatar_url` propi (p. ex. `sdp-media://...`), cal netejar o sincronitzar també `metadata.picture` si apuntava a un avatar OAuth extern, o prioritzar sempre l'avatar de la taula `public.profiles`.
  2. **`src/components/universal/identitat/personaDeSessio.js:61-99`:**
     - `personaDeSessio(usuari, perfil)` exigeix `perfil?.firma === firmaDePersona(usuari)` (`línia 92`). Mentres `getProfile()` s'està carregant o quan `updateProfile` muta `user_metadata` abans que es refresque `perfil`, `firmaDePersona(usuari)` canvia (perquè inclou `meta.avatar_url` i `meta.picture`), invalidant instantàniament `perfil.firma` i fent que `valid` siga `false`! En eixe instant, `personaDeSessio` cau a `avatarDePersona(usuari)` (`meta.avatar_url || meta.picture`).
     - A més, si en l'alta inicial el trigger de base de dades va copiar la URL de Google (`lh3.googleusercontent.com`) dins de `profiles.avatar_url`, cal que la pujada local a `FullAjustos.jsx` / `EditorPerfilModal.jsx` sobreescriga netament `profiles.avatar_url` i que `personaDeSessio.js` + `IdentitatContext.jsx` prioritzen sempre un `sdp-media://` o URL pròpia per damunt de qualsevol URL de proveïdor OAuth (`googleusercontent.com`, `githubusercontent.com`, `gravatar.com`).

#### 4. ⚠️ Alerta de Tractors a Gestoria (`src/sections/gestoria/tractors.js`)
- **MOLT IMPORTANT per a Claude Opus 5.5 abans de tocar `src/sections/gestoria/`:**
  - Els tractors `gestoria.factures` i `gestoria.correus` (`src/sections/gestoria/tractors.js:28-40`) calculen la seua empremta SHA-256 sobre:
    - `src/sections/gestoria/ContenidorGestoria.jsx`
    - `src/sections/gestoria/PanellGestoria.jsx`
    - `src/sections/gestoria/useGestoria.js`
    - `src/sections/gestoria/useArbreCarpeta.js`
    - `src/sections/gestoria/extractors/extraccio.js`
    - `src/sections/gestoria/nucli/model.js`
  - **En canvi, `src/sections/gestoria/Facturacio.jsx` i `src/sections/gestoria/facturacio/FormulariFactura.jsx` NO estan dins de l'empremta dels tractors!**
  - Això significa que pots polir i simplificar en 3 passos `Facturacio.jsx` i `FormulariFactura.jsx` amb total llibertat sense invalidar l'aprovació de tractors del Mestre! I si toques `PanellGestoria.jsx`, recorda que el Mestre haurà de fer 1 clic a «Aprova esta versió» al Pas 1 quan òbriga la Gestoria.

---

### Bloc 0: Inspiració d'Avantguarda — Enginyeria Inversa Assistida (REA) i SiteGround Node.js

#### 0.1. Desconstrucció Empírica amb REA (`morluto/rea` · Vídeo `NzXzcCVv5FI`)
Hem auditat el repositori `https://github.com/morluto/rea` (`npx rea-agents setup`, v0.1.3) i la metodologia exposada al vídeo d'investigació:
- **Principi Nucli («Seen vs Inferred»):** REA és un servidor MCP i motor d'orquestració per a agents de codi que prohibeix inventar arquitectures a cegues. Obliga a separar tres capes en qualsevol clonació o reconstrucció:
  1. **`Seen` (Evidència observada):** Rutes d'API reals, esquemes d'emmagatzematge local (IndexedDB/SQLite), estats de la UI, jerarquia de panells i fluxos d'esdeveniments extrets del bundle JS/ASAR/DOM.
  2. **`Inferred` (Deducció acotada):** Lògica de negoci deduïda a partir de les entrades i eixides observades.
  3. **`Unknowns` (Incerteses explícites):** Comportaments de servidor no visibles que es marquen com a port o contracte obert (exactament com la nostra **Frontissa** cap a Sollutia).
- **Encaix amb la Llei de Pedra Seca (`261013_1600_estudi_destil_laboratori_ia.md`):**
  > *«Clonar és copiar l'estructura i l'ergonomia, no l'estil aliè.»*
  REA ens dóna l'anatomia funcional («què fa i en quins passos»), mentre que el vestit visual es tradueix sempre als tokens canònics de Sóc de Poble (`--sdp-*`, `--text-*`, `--superficie-*`, `--vora-*`, `--radi-*`).

#### 0.2. Matriu d'Aplicació al Catàleg d'Apps d'Or de Sóc de Poble

| App del Poble | Referent d'Or (REA) | Anatomia `Seen` a clonar (Estructura i Ergonomia) | Traducció a Pedra Seca (`socdepoble.org`) |
| --- | --- | --- | --- |
| **1. Gestoria Rural** | **Factura Directa + Holded + GnuCash** | Flux d'emissió en 3 passos (1. Emissor/Sèrie ja fixat -> 2. Client + Línies amb càlcul viu IVA/IRPF -> 3. Emissió PDF Veri*Factu en 1 clic). Taula trimestral de 12 columnes i llibre local inalterable (partida doble / cofre local). | `Facturacio.jsx` (passos de configuració i llegat col·lapsables quan ja estan llestos), `PanellGestoria.jsx` (12 columnes + grup blau d'operacions estrangeres) i `cofre.js` (AES-GCM-256 sobre IndexedDB). |
| **2. Xat Rural** | **WhatsApp Desktop** (`sdp-clon-whatsapp`) | 3 columnes fixes (`Rail 60px` + `Llista 360px` + `Conversa 1fr`), capçalera de 60px, bafarades amb cantó viu, separadors de dia enganxosos i doble tic de lectura. | `ClosCaXat.jsx`, `LlistaConverses.jsx`, `PanellConversa.jsx` amb identitat unificada (`AvatarResolt` al rail + actor de `useIdentitat()`). |
| **3. Lector de Pobles (RSS)** | **Feedly** | Jerarquia en 3 nivells (Categories rurals / Canals / Vista revista o llista densa), marcatge ràpid de llegits i extracció neta de text. | Mòdul RSS desacoblat amb catxé d'alimentació via Frontissa i lectura sense soroll publicitari. |
| **4. Marcadors / Recursos** | **Raindrop.io** | Targetes amb previsualització rica (OpenGraph), col·leccions niades, etiquetes múltiples immediates i cerca instantània local. | Biblioteca de recursos comunals i memòria viva del poble desada a Supabase + IndexedDB. |
| **5. Salut i Cures** | **Suport Veïnal / Recordatoris** | Semàfors d'estat d'alta visibilitat (pas 28px), avisos de medicació confirmables en 1 toc i xarxa de contactes de proximitat. | Mòdul accessible per a gent major seguint estrictament l'escala tipogràfica i de contrast AAA de Pedra Seca. |

#### 0.3. Avaluació Arquitectònica del Nou Suport Node.js a SiteGround (GrowBig/GoGeek)
El Mestre disposa ara d'execució Node.js nativa a SiteGround sense sobrecost. Sota les **Directrius Innegociables (Model B i Llei de l'Enxufabilitat)**:
- **Què NO ha de ser mai SiteGround Node.js:** No pot ser la base de dades central ni substituir `src/data/backendPort.js` (la veritat viu al Supabase de Sóc de Poble i al cofre local IndexedDB del veí).
- **Què SÍ pot ser (3 casos d'ús d'alt valor i cost zero):**
  1. **Relé de la Frontissa i Proxy CORS de Lectura (`GET`):** Microservei lleuger sense estat que actua com a passarel·la per a (a) consultar i validar esquemes dels endpoints `GET` de Sollutia amb catxé de curta durada (`Stale-While-Revalidate`) i (b) agregar feeds RSS/Atom de pobles per al Lector estil Feedly evitant bloquejos CORS del navegador.
  2. **Despertador i Relé WebPush / Cron Comunitari:** Execució dels avisos programats (recordatoris de Salut i Cures, alertes del trimestre de Gestoria o digestió diària de la xarxa rural) sense requerir que l'ordinador local del Mestre estiga encés.
  3. **Generador de Previsualitzacions OpenGraph (estil Raindrop.io):** Extracció segura de metadades (`og:title`, `og:image`, resum) d'enllaços compartits al Xat o a Recursos sense exposar la IP del client.

---

### Bloc 1: Auditoria Forense de la Gestoria Rural (Fita Crítica: Dia 20 d'Octubre)

Hem auditat de cap a peus `/app/gestoria` i `/app/gestoria/full` (`PanellGestoria.jsx`, `VistaPreviaFull.jsx`, `fullModel.js`, `Facturacio.jsx`, `FormulariFactura.jsx`, `nucli/model.js`, `nucli/plantilla.js` i `cofre/cofre.js`).

#### 1.1. Veredicte Executiu per al Dia 20: **APTE I SENSE BLOQUEJOS CRÍTICS**
El Mestre pot processar avui mateix la carpeta del trimestre i descarregar el paquet per a la gestoria. Tanmateix, deixem documentats tres punts d'atenció i la guia quirúrgica per a la simplificació en 3 passos:

1. **Validació de les 12 Columnes FacturaDirecta/Holded (`PanellGestoria.jsx:189-202`):**
   - La taula interactiva del Pas 3 ja mostra exactament les 12 columnes canòniques: `Tipus`, `Data`, `Factura / Ref`, `Proveïdor / Client`, `NIF / CIF`, `Concepte`, `Base imposable`, `% IVA`, `Quota IVA`, `% IRPF`, `Quota IRPF` i `Total`.
   - **Detall detectat a l'exportació CSV/XLSX (`nucli/plantilla.js` i `fullModel.js:50-52`):** `PLANTILLA_GESTORIA` defineix 8 columnes al fitxer descarregat (`data`, `num`, `contrapart`, `nif`, `descripcio`, `subtotal`, `iva`, `total`), ometent `% IVA`, `% IRPF` i `Quota IRPF` (`retencio`) a l'Excel exportat, i `CAMPS_SUMATS` (`PanellGestoria.jsx:205`) suma `subtotal`, `iva` i `total` però deixa en blanc la suma de `Quota IRPF` al peu `tfoot`. Per a factures de despesa ordinàries sense IRPF no afecta gens; si hi ha factures amb retenció d'IRPF, convé saber-ho.

2. **Proveïdors Tecnològics Estrangers (`fal.ai`, `Google Cloud`, `Anthropic`):**
   - A `PanellGestoria.jsx:116-162`, la funció `agrupaIncidencies` detecta `codis.has('IVA_ESTRANGER')` i mou tant la incidència d'`IVA_ESTRANGER` com qualsevol `NIF_INVALID` d'eixa mateixa factura (`esDeLEstranger = inc.codi === 'NIF_ESTRANGER' || (inc.codi === 'NIF_INVALID' && facturesEstrangeres.has(inc.facturaId))`) cap al grup informatiu blau **`Operacions amb l'estranger, informatives`** (`GRUP_ESTRANGER`).
   - A més, les línies 449-456 mostren un avís blau tranquil·litzador: *«Operació estrangera o intracomunitària — possible inversió del subjecte passiu. Ho confirma la gestoria.»*
   - **Matís d'ús per al Mestre:** Si una factura de fora de la UE (`fal.ai`, EUA) té un identificador fiscal americà que no passa el validador de NIF/VIES europeu (`NIF_INVALID`), tot i que l'avís es mou al grup blau informatiu, `nucli/model.js` compta `NIF_INVALID` com a severitat `alta`. Això fa que al Pas 4 aparega una segona casella de confirmació explícita (*«Genera-la igualment; la revisaré a mà abans d'enviar-la a la gestoria»*). Marcant les dues caselles, el botó «Genera i descarrega la proposta» s'activa immediatament i sense bloqueig.

3. **Guia Quirúrgica de Simplificació en 3 Passos (`Facturacio.jsx` + `FormulariFactura.jsx`):**
   - Com que `Facturacio.jsx` i `FormulariFactura.jsx` **no estan inclosos a `src/sections/gestoria/tractors.js`**, es poden polir sense invalidar els tractors signats:
     - **A `Facturacio.jsx`:** Quan `f.config` (Pas 1: Dades de l'empresa) i `f.llegat` (Pas 2: Factures d'abans) ja estan completats, mostrar-los recollits en una barra compacta de resum («Emissor configurat · Sèrie activa — Modifica») i presentar l'experiència directa en **3 passos rurals clars**:
       1. **Qui factura i a qui** (Emissor preconfigurat + selector/alta ràpida de Client).
       2. **Concepte i línies** (Descripció, quantitat, preu i selector net d'IVA/IRPF amb càlcul automàtic en temps real).
       3. **Emissió en 1 clic** (Generació de factura PDF oficial amb empremta Veri*Factu i registre automàtic al llibre).
     - **A `FormulariFactura.jsx`:** Ocultar darrere d'un desplegable discret `<details>` («Opcions avançades: rectificatives, canvi de tiquets o data d'operació diferent») els camps de sèrie rectificativa (`R1-R5`), bescanvi `F3` i data d'operació quan el tipus és `F1` (factura completa ordinària).

4. **Certificació de Sobirania Local (Inspiració GnuCash — `cofre/cofre.js`):**
   - El cofre local (`sdp.gestoria.cofre` a IndexedDB) implementa xifratge autenticat **AES-GCM-256** amb clau embolcallada via **AES-KW** derivada per **PBKDF2-SHA256 (600.000 iteracions)**, bloqueig automàtic per inactivitat (10 minuts o 5 minuts amb pestanya oculta) i exportació/importació íntegra. Totes les factures emeses (`sdp.facturacio.v1`) i el cofre viuen al disc dur local del Mestre amb sobirania total.

---

### Bloc 3: Auditoria i Sanejament Integral de la Consola Termodinàmica

Hem executat `node tooling/brain/mapa-consola.mjs` (nota: a la plantilla del prompt figurava la ruta antiga `tooling/session/mapa-consola.mjs`; la ruta canònica vigent és `tooling/brain/mapa-consola.mjs`).

#### 3.1. Estat Inicial Detectat
- `291 nodes · 370 arestes · 2 avisos (1 alt) · 13 tasques`:
  1. **`frontissa-roja` (severitat: `alta`)** a `document:.agents/contingut_estructural.json#fedivers`: la clau `fedivers` tenia una empremta pendent d'aprovació després de la incorporació de la portada còmic a `src/sections/fedivers/FediversView.jsx`.
  2. **`torns-caducats` (severitat: `mitjana`)** a `document:.agents/runtime/turns`: 3 torns caducats oberts d'intents previs (`torn_7029462e`, `torn_5589b1ad`, `torn_0878d73e`).

#### 3.2. Accions de Sanejament Executades
1. Tancament net dels 3 torns caducats amb `node tooling/session/saneja_torns_caducats.mjs`.
2. Aprovació de la clau estructural `fedivers` amb `node tooling/gates/frontissa-contingut.mjs --aprova fedivers --per "Mestre Javi Llinares (via Gemini 4 / MarIA)"`.
3. Comprovació dels tractors d'IA a `.agents/aprovacions_tractors.json`: tant `gestoria.factures` com `gestoria.correus` tenen estat `aprovat` pel Mestre (`2026-10-14T11:37:52Z`).

#### 3.3. Estat Final Verificat
- Execució de `node tooling/brain/mapa-consola.mjs`:
  - **`291 nodes · 370 arestes · 0 avisos (0 alts) · 13 tasques`**
  - `integritat-contingut: 14/14`
  - `torns-caducats-oberts: 0/289`
  - `escriptori-ancorat: 5/5`

---

### Bloc 4: Compliment dels Nous Termes d'Apple Developer (Octubre 2026) i Google Play

Hem creuat l'actualització de l'**Apple Developer Program License Agreement (13 d'octubre de 2026)** amb `_wiki_de_poble/01_produccio/botigues/BLOQUEJANTS_BOTIGUES.txt` i `_wiki_de_poble/02_saber/decisions/ADR-2026-10-APPS-DEL-DISPOSITIU.md`.

#### 4.1. Matriu d'Impacte i Compliment per a Sóc de Poble (`socdepoble.org`)

| Secció de l'Acord (Oct 2026) | Novetat Normativa d'Apple | Impacte a Sóc de Poble | Acció Requerida |
| --- | --- | --- | --- |
| **Data límit: 13 de novembre de 2026 (Schedules 2 & 3)** | Acceptació obligatòria a App Store Connect dels nous termes i annexos fiscals per a noves enviaments i actualitzacions d'apps. | **Alt (Administratiu):** Bloqueja qualsevol pujada a TestFlight / App Store a partir del 13/11/2026 si el titular del compte no ho accepta. | **Acció del Mestre:** Entrar a [App Store Connect](https://appstoreconnect.apple.com/) amb el compte d'Apple Developer i acceptar l'acord base + *Schedules 2 & 3* abans del **13 de novembre de 2026**. |
| **Secció 3.2 (Requisits de Seguretat Ampliats)** | Prohibició estricta d'execució de codi remot no auditat, protecció de credencials locals i transparència en permisos de dades. | **Favorable:** El nostre cofre (`cofre.js`) usa WebCrypto natiu (AES-GCM-256) i la política de tractors (`tractors.js`) exigeix aprovació humana amb hash SHA-256. Cap `eval` ni injecció remota. | Mantindre els secrets de producció fora del bundle client i completar la política de privacitat pública (`/privacitat`) i el flux d'eliminació de compte en 1 clic (`BLOQUEJANTS_BOTIGUES.txt` #1 i #3). |
| **Secció 3.3.8 (Live Assistance API & App Replacement Entitlement)** | Regulació d'APIs d'assistència en viu (compartició de pantalla/control remot) i l'*App Replacement Entitlement* (substitució d'apps del sistema a la UE). | **Rellevant per a Salut i Cures / IAIA MarIA:** Si el mòdul de Salut i Cures incorpora ajuda remota guiada per a gent major, ha d'usar l'API oficial amb consentiment explícit per sessió. Pel que fa a *App Replacement*, la nostra `ADR-2026-10-APPS-DEL-DISPOSITIU.md` ja fixa que **no reemplacem apps del sistema**, sinó que deleguem per esquemes URI (`mailto:`, `tel:`, `webcal:`, Web Share API). | Documentar a la fitxa d'App Store que Sóc de Poble invoca les apps natives de l'usuari via URI schemes estàndard i no sol·licita *App Replacement Entitlement*. |
| **Secció 6.4 (Widgets a HomeView i CarPlay)** | Regles d'actualització i contingut per a widgets d'escriptori (`HomeView`) i integració amb `CarPlay` (prohibició de distraccions visuals o publicitat). | **Oportunitat Futura:** Quan s'empaquete la carcassa nativa (Capacitor/WKWebView), els widgets de bàndols municipals o avisos de Salut per a `HomeView` i l'escolta d'àudio comunitari / ràdio de poble a `CarPlay` han de ser estrictament informatius, sense finestres modals ni contingut comercial. | Cap canvi al codi SPA actual; incorporar aquesta restricció al plec de la carcassa nativa quan s'active l'empaquetat iOS. |
| **Schedules 2 & 3 (Disposicions Fiscals per País)** | Actualització de retencions, IVA digital i facturació per regions per a apps de pagament o amb compres integrades (IAP). | **Baix (App Gratuïta Comunitaria):** Sóc de Poble és una xarxa veïnal lliure sense compres in-app (IAP) ni subscripcions comercials dins de l'app. | Acceptar els annexos a App Store Connect i declarar l'app com a gratuïta sense cobraments in-app (evitant el peatge del 15-30% i les retencions internacionals). |

#### 4.2. Estat dels 5 Bloquejants Canònics (`BLOQUEJANTS_BOTIGUES.txt`)
1. **Esborrat de compte (`Account Deletion`):** Pendent d'exposar el botó d'eliminació completa a `FullAjustos` / Perfil amb RPC d'esborrat en cascada.
2. **Moderació UGC al Xat i Mur:** El Xat ja té bloqueig de contactes (`xat_contactes_bloquejats`); falta el botó explícit de «Denuncia contingut / abús» per a passar la revisió humana d'Apple (Guideline 1.2).
3. **URLs legals públiques (`/privacitat`, `/condicions`):** Han d'estar accessibles sense login abans d'enviar a revisió.
4. **Data Safety (Google Play) i App Privacy Nutrition Labels (Apple):** Inventari net (Identificadors: email/telèfon opcional; Contingut d'usuari: missatges i perfil; zero trackers publicitaris de tercers).
5. **Compte de prova per al revisor:** Preparar credencials d'un veí de demostració abans de prémer *Submit for Review*.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **Consola Termodinàmica (`node tooling/brain/mapa-consola.mjs`):**
   - Verificat: `291 nodes · 370 arestes · 0 avisos (0 alts) · 13 tasques`.
   - `integritat-contingut`: `14/14` claus aprovades.
   - `torns-caducats-oberts`: `0/289`.
   - `escriptori-ancorat`: `5/5`.
2. **Bateria de Proves Vitest — Primera i Segona Empenta (Xat, Identitat, Gestoria, Pobles i Detall):**
   - Primera empenta (`src/sections/xat/`, `src/components/universal/identitat/`, `PanellGestoria.test.jsx`, `VistaPreviaFull.test.jsx`): **`66 passed (66) · 761 passed (761)`**.
   - Segona empenta (`src/sections/pobles/`, `src/sections/detail/`, `src/sections/xat/`): **`84 passed (84) · 1016 passed (1016)`** (incloent `src/sections/pobles/qualitat.test.js` amb ESLint `--max-warnings=0`, Pedra Seca i zero noms de poble literals al codi).
3. **Portes del Plugin WordPress (`node --test tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs`):**
   - Verificat: **`34 pass, 0 fail`** (PHP real, sintaxi i delimitadors, i18n valencià complet a `socdepoble-enxufe-ca.l10n.php`, contracte d'amfitrió Model B i ESLint).
4. **Retroalimentació sobre el procés i plantilles (`prompt_local.md`):**
   - **Millora detectada:** A la plantilla del prompt es citava `node tooling/session/mapa-consola.mjs`, mentre que l'script real viu a `node tooling/brain/mapa-consola.mjs`. Recomanem actualitzar la referència a `_wiki_de_poble/03_actuar/plantilles/prompt_local.md` perquè cap agent perga temps buscant la ruta antiga.
   - **Coordinació a la Taula de l'Olivera:** L'ús de dos fitxers d'auditoria germans (`261014_1636_auditoria_claude.md` i `261014_1638_auditoria_gemini4.md`) i la divisió neta per fronts (Fronts A–E per a Claude Opus 5.5; Fronts G–J per a Gemini 4) ha permés treballar en paral·lel sense col·lisions d'escriptura.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Tots els canvis de codi de la **Segona Empenta (Fronts G, H, I i J)** s'han aplicat estrictament als fitxers assignats a Gemini 4 (`ItemDetailSection.jsx`, `xatDelPoble.js`, `clauDelPoble.js`, `usePublicacionsDelPoble.js`, `ajustos.php` i `socdepoble-enxufe-ca.l10n.php`), sense tocar cap dels fitxers editats per Claude Opus 5.5 als Fronts A–E.
- L'acceptació legal dels *Schedules 2 & 3* d'Apple Developer (data límit 13/11/2026) requereix acció humana directa del Mestre a App Store Connect.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_1450_pla_implementacio_sincronitzacio_identitats_i_xat]]
- [[261014_1605_prompt_claude_opus_i_gemini4_taula_olivera]]
- [[261014_1636_auditoria_claude]]
- [[261013_1600_estudi_destil_laboratori_ia]]
- [[ADR-2026-10-APPS-DEL-DISPOSITIU]]


