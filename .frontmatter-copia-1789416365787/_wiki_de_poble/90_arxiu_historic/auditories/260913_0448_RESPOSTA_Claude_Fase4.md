# 🛡️ RESPOSTA DEL CONSELL — FASE 4

## 0. Contradiccions, primer

**El bundle sí que hi és, però quasi ningú el llegirà.** El fitxer pujat fa 3,3 MB / 71.288 línies / 514 fitxers. Al context de l'IA només hi arriba la capçalera (la petorreta). Qualsevol membre del Consell que no llija del disc et contestarà a cegues i dirà que "falta el bundle". Convé que la petorreta ho diga explícitament.

**`@supabase/supabase-js` està a `dependencies` i només s'usa per a Realtime** (`getSupabaseClient`, línia ~26994). Tota la resta és `fetch` a mà. Per a Storage tens dues eixides coherents i una d'incoherent: usar el client que ja pagues, o traure'l i fer-ho a mà com la resta. Tindre'l per a WebSockets i escriure un uploader manual al costat és la tercera.

**Storage no existix.** No hi ha cap crida a `/storage/v1` en tot el repositori. La pregunta 1 no és "com integrem Storage", és "com el creem".

---

## 1. El repte de Supabase i Storage

### 1.1 «No hi ha sessió» no és mock vs auth real

El camí és aquest:

```
updateProfile() → getCurrentUser() → usuariDeSessio()   [identitat.js]
   ├── jwt de sessionStorage?  no → null
   ├── caducitatJwt(jwt) <= Date.now()? sí → null
   └── null → throw new Error('No hi ha sessió.')
```

El `throw` és **abans** de qualsevol `fetch`. I resulta que `request()` ja té el reintent bo: 401 → `refreshSession()` → repeteix. Eixe camí no s'executa mai perquè el port et talla abans d'eixir de casa. Tens el refresc construït i no el crides al punt exacte on falla.

Tres causes concurrents:

1. El token de Supabase caduca a l'hora. Passada l'hora, `usuariDeSessio()` torna `null` encara que el `refresh_token` siga perfectament vàlid.
2. La sessió viu a `sessionStorage`. Pestanya nova = sense sessió. Correcte contra la sessió fantasma, dur amb l'usuari.
3. `SessionContext` guarda l'usuari en estat de React. La interfície et pinta dins mentre el port diu que estàs fora. És la sessió fantasma al revés: abans mentia el magatzem, ara menteix la pantalla.

**Correcció mínima**, sense arquitectura nova:

```js
// backendPort.js — una porta, i totes les escriptures la creuen
export async function asseguraSessio(config = {}) {
  let u = getCurrentUser();
  if (u) return u;
  const ok = await refrescaSessio(config).catch(() => false);
  return ok ? getCurrentUser() : null;
}
```

```js
export async function updateProfile(updates, config = {}) {
  const user = await asseguraSessio(config);
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar.');
  ...
```

I que `SessionContext` pose un temporitzador sobre `exp` per despintar l'usuari quan toca, en compte d'esperar que l'usuari descobrisca el desajust pujant una foto.

### 1.2 El problema de fons: base64 dins del token

El que fa hui `useHeroImageHandler`:

```
fitxer → compressImage(600px, webp, 0.8) → data:image/webp;base64,...
       → onSaveField('heroImage', dataUrl)
       → updateProfile → PUT /auth/v1/user { data: { avatar_url: "data:..." } }
                       → PATCH /rest/v1/profiles
```

`user_metadata` **viatja dins del JWT**. Una foto de 600 px en webp fa 40–120 KB; en base64, 55–160 KB. Eixe text va a cada capçalera `Authorization` de cada petició, per sempre, i a més duplicat a `profiles.avatar_url`. Per a connexions rurals això no és deute estètic: és amplada de banda cremada en cada clic.

### 1.3 Arquitectura proposada

**L'UES no ha de saber què és Supabase, i ja no ho sap.** Rep `onSaveField`. No es toca. El que s'afig és una **capacitat**, no una dependència:

```js
<UniversalEditorShell
  onSaveField={...}
  onUploadImage={pujaMitja}   // opcional. Si no ve, comportament actual.
/>
```

- `useHeroImageHandler`: comprimir sempre; si hi ha `onUploadImage`, pujar i desar la **URL**; si no, data URL. Cap regressió per als hostes que no la passen.
- La implementació viu a la Frontissa: `src/data/frontissa/supabase/mitjans.js`, germà de `notes.js`. Un sol fitxer sap què és un bucket.
- Al backend cal un **`requestBinari()`** germà de `request()`: l'actual fa `JSON.stringify(body)` i no pot pujar un `Blob`. Ha de dur el mateix reintent 401 → refresc, o repetiràs el bug d'avui amb roba nova.
- Bucket privat, ruta `<uid>/<nom>`, i política a `storage.objects`:

```sql
create policy "mitjans propis" on storage.objects for insert to authenticated
  with check (bucket_id = 'mitjans' and (storage.foldername(name))[1] = auth.uid()::text);
```

### 1.4 ⚠️ P0 que farà perdre una nit sencera

`src/utils/sanitize.js` bloqueja tota `IMG` amb `src` que no siga `/`, `./`, `data:image/` o `window.location.origin`. Les URL de Storage són `https://<ref>.supabase.co/storage/v1/...` → **altre origen → `src` esborrat i `data-sdp-bloquejada="1"`**.

El dia que passes de base64 a Storage, totes les imatges desapareixeran del text ric i la culpa semblarà del TipTap. Cal afegir l'origen de Supabase a l'allowlist del ganxo, **llegit de la config**, no escrit a mà.

### 1.5 Ordre

1. `asseguraSessio()` + reintent → arregla el símptoma d'avui.
2. Allowlist de `sanitize.js` → abans de pujar res, no després.
3. `requestBinari()` + `frontissa/supabase/mitjans.js` + bucket i polítiques.
4. `onUploadImage` a l'UES.
5. Buidat dels avatars base64 ja desats a `user_metadata`. Si no es fa, els tokens inflats sobreviuen la migració.

---

## 2. El repte de TipTap ric

### 2.1 El que ja tens i no cal comprar

`HorizontalRule` ve dins de l'StarterKit. El divisor no necessita cap dependència: `editor.chain().focus().setHorizontalRule().run()`. Comprova-ho abans d'instal·lar res.

### 2.2 Riscos concrets, per ordre de mordent

**Preact.** El projecte compila amb `@preact/preset-vite`. El `ReactRenderer` de `@tiptap/react` i les receptes oficials amb portals no els donaria per bons sense provar-los. És el primer que has de verificar, perquè condiciona tota la resta.

**La Caixa Única retallarà el menú.** `.ues-scroll` té `overflow-y: auto` i `.ues-root` té `isolation: isolate`. Un popup `position: absolute` dins del canvas queda tallat pel contenidor amb scroll, i l'aïllament impedix que cap `z-index` el rescate des de fora. Regla dura:

> El menú Slash és `position: fixed`, muntat fora de `.ues-root`, posicionat amb `editor.view.coordsAtPos()`, i es tanca amb l'esdeveniment `scroll` de `.ues-scroll`. Mai fill de `.ues-canvas`.

Amb això no et cal `tippy.js`: són unes trenta línies pròpies contra una llibreria de posicionament a mantindre deu anys. `@tiptap/suggestion` sí que compensa (el disparador `/`, la navegació amb fletxes i el filtratge no són trivials).

**Col·lapse d'alçada.** `.ues-canvas .ProseMirror { flex: 1 1 auto }`. Un node de bloc nou sense alçada declarada pot replegar el flex en el primer pintat. Tot node nou porta `aspect-ratio` o `min-height` en tokens.

**Embeds i DOMPurify.** El que TipTap pinta en edició no passa pel sanejador, però el que es llig al Mur sí. Un `<iframe>` morirà en lectura. Decidix ara: o **enllaç enriquit** (targeta amb miniatura pròpia, sense iframe de tercers) — que és el Trellat i esvita el far extern que el mateix `sanitize.js` combat —, o obris DOMPurify a una llista blanca de dominis. El Consell recomana la primera.

### 2.3 Forma modular

```
richText/
  extensions/
    index.js          → exporta extensionsBase i extensionsRiques
    slash.js          → @tiptap/suggestion, sense UI
    imatge.js
  UniversalSlashMenu.jsx   → germà, no fill de UniversalRichTextContent
  useUniversalRichText.js  → nou paràmetre { extensions }, per defecte StarterKit
```

`UniversalRichTextContent` es queda com està: quatre línies. Qui vol el menú, el munta al costat. Notes demana les riques; cap altre hoste canvia.

El `onInsertImage` del menú Slash ha de ser **la mateixa capacitat** que el hero de §1.3. Una sola porta de pujada per a tota l'aplicació, o en tindràs dues i només una amb polítiques.

### 2.4 Dos defectes al motor actual, abans d'afegir-hi pes

**Doble destrucció.** A `useUniversalRichText`:

```js
useEffect(() => () => {
  if (editor && !editor.isDestroyed && editor.view) editor.view.destroy();
}, [editor]);
```

`useEditor` ja destruïx l'editor en desmuntar, i això destruïx la vista. Aquesta neteja extra sobra i, amb node views (imatges, embeds), petarà. Amb l'StarterKit pelat no es nota; amb extensions riques, sí.

**Sincronització de contingut.** `editor.commands.setContent(content || '', false)` amb TipTap 3.31. Verifica la signatura d'aquesta versió: si el segon argument posicional ja no suprimix l'`onUpdate`, cada canvi de nota dispararà un desat automàtic amb el contingut que acabes de carregar. És l'origen clàssic dels desats fantasma en canviar d'element, i encaixa amb el que es va perseguir a la Fase 3.

### 2.5 Codi mort a l'UES

`labels`, `copyright`, `logoComponent` i `barActions` es calculen i no es pinten enlloc: el hoste (`NotesEditor`) passa el seu propi `topBar`. Abans d'afegir cap propietat de Fase 4, o es renderitzen o es lleven. Una closca amb propietats que no fan res és una closca que ningú sabrà endollar d'ací a sis mesos.

---

## Veredicte

Fase 4 no és "afegir Storage i extensions". És **tancar el cicle de vida de la sessió** (§1.1), **traure les imatges de dins del token** (§1.2) i **obrir l'allowlist abans de necessitar-la** (§1.4). El TipTap ric és la part fàcil: el que el pot tombar és la Caixa Única, i el contracte per no tombar-la cap en una regla.
