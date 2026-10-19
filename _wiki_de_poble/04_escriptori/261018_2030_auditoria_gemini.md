---
type: informe
status: esborrany
description: Auditoria adversarial de personaDeSessio.js, DetallMultimedia.jsx i MultimediaSection.jsx, disseny REA del selector de variants del Mercat per a detailSectionMeta.jsx i fitxes sintètiques de googleworkspace/cli i REA.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:1af0d2ce-bf2d-422b-9655-b96ae2f28077
---
# Auditoria Adversarial, Selector de Variants REA i Catàleg 20_capacitats (Gemini)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0d46bb7f-8983-471c-a282-a1c5fc34ceb0:1af0d2ce-bf2d-422b-9655-b96ae2f28077 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T18:33:44.489Z |
| Modificació | 2026-10-18T18:33:44.489Z |
| Propietari | gemini |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 3.1 Pro (Rol Auditor Adversarial & REA) |
| Tokens consumits | ~28.500 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-18T18:33:44.489Z: esborrany creat; contingut i verificació pendents.
- 2026-10-18T18:35:00.000Z: auditoria adversarial completada sobre `personaDeSessio.js`, `DetallMultimedia.jsx`, `storage.js`, `MultimediaSection.jsx` i `censImatges.js`; disseny REA del selector de variants del Mercat per a `detailSectionMeta.jsx`; redacció de les fitxes Matrix d'1 pàgina (`gws` i `REA`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### BLOC 1 · Auditoria Adversarial del Codi de Claude

---

#### 1.1. `src/app/contexts/personaDeSessio.js`

##### [ALTA · A1.1] Desincronització entre `avatarDePersona(usuari)` i `firmaDePersona(usuari)` (Línies 75–96)
- **Evidència:**
  A `avatarDePersona(usuari)` (`línies 75–82`), s'ha afegit la cerca en profunditat dins de `usuari.identities` per rescatar la foto de Google quan `user_metadata` ve buit:
  ```js
  const google = Array.isArray(usuari?.identities)
    ? usuari.identities.find((i) => i?.provider === 'google')
    : null;
  const googleAvatar = net(google?.identity_data?.avatar_url) || net(google?.identity_data?.picture);
  ```
  Tanmateix, a `firmaDePersona(usuari)` (`línies 89–96`), la signatura determinista que governa la hidratació i evita renders innecessaris **NO inclou `googleAvatar`**:
  ```js
  export function firmaDePersona(usuari) {
    if (!usuari) return '';
    const meta = usuari.user_metadata || {};
    return [
      net(usuari.id), net(usuari.email), net(usuari.phone),
      net(meta.full_name), net(meta.name), net(meta.avatar_url), net(meta.picture),
      net(meta.location || meta.town_name || meta.poble),
    ].join('\u001f');
  }
  ```
- **Risc / Regressió:** Si Supabase hidrata o refresca `usuari.identities[0].identity_data.picture` sense alterar `usuari.user_metadata`, `firmaDePersona(usuari)` retorna exactament el mateix hash i `PerfilContext` pot ometre l'actualització de la persona de sessió.
- **Correcció obligatòria:** Extraure un helper `avatarOAuth(usuari)` compartit o incloure `avatarDePersona(usuari)` directament dins de l'array de `firmaDePersona(usuari)`.

##### [ALTA · A1.2] Confusió semàntica a `perfilDeFila(fila)`: `hero_url` com a substitut de `avatar_url` (Línia 112)
- **Evidència:**
  A `perfilDeFila(fila)` (`línia 112`):
  ```js
  avatar: net(fila.avatar_url) || net(fila.hero_url),
  ```
- **Risc / Regressió:**
  1. `hero_url` és una imatge panoràmica de capçalera (`16:9`), mentre que `avatar` és el retrat circular (`1:1`) que es pinta a la barra superior negra i a les targetes d'autoria.
  2. **Efecte col·lateral greu amb `triaAvatar` (`línia 39` i `línia 146`):** Quan la veïna prem **«Llevar l'avatar»** a `DetallMultimedia.jsx` (`línia 475`: `updateProfile({ avatar_url: '' })`), però manté la seua foto de capçalera (`hero_url: 'sdp-media://mitjans/...'`), `perfilDeFila` retorna `avatar = fila.hero_url`. A continuació, `triaAvatar(deFila.avatar, ...)` veu que `deFila.avatar` és una ruta pròpia (`!esAvatarExtern`) i **imposa la foto panoràmica de capçalera com a avatar actiu**, impedint deixar l'avatar buit (amb inicials) o usar el de Google quan hi ha capçalera!
- **Correcció obligatòria:**
  Canviar la línia 112 de `src/app/contexts/personaDeSessio.js` a:
  ```js
  avatar: net(fila.avatar_url),
  ```
  *(Un avatar és un avatar; una capçalera és `hero_url` i mai ha d'envair el slot circular d'avatar).*

---

#### 1.2. `src/sections/profile/DetallMultimedia.jsx` i `src/data/supabase/storage.js`

##### [ALTA · A2.1] Esborrat des de `DetallMultimedia.jsx` sense comprovació d'integritat relacional (Línies 446–470)
- **Evidència:**
  A `confirmaEsborrat` (`DetallMultimedia.jsx:446–470`), quan l'usuari elimina una o diverses imatges seleccionades, s'executa `await esborraElMeuMitja({ bucket, cami })` i només es comprova si la imatge coincideix amb `avatarActual` o `portadaActual` del perfil. **No es consulta si la imatge està en ús en una publicació del Mur (`posts`), un acte (`events`), un producte (`mercat`) o una entitat (`organizations`).**
- **Risc / Regressió:** Si Javi o qualsevol veí puja una foto i la vincula a un post o producte i després l'esborra des de l'apartat *Multimèdia* del seu perfil pensant que és una còpia solta, trenca la imatge publicada sense rebre l'avís relacional canònic (*«Atenció: aquesta imatge està en ús a [Nom]...»*).
- **Correcció obligatòria:** Connectar `confirmaEsborrat` amb el mateix verificador relacional (`comprovaUsImatge(clau)`) definit a la Fase 5 del Pla abans d'invocar `esborraElMeuMitja`.

##### [MITJANA · A2.2] Esborrat en sèrie bloquejant i llistat restrictiu de `CARPETA_ESBORRABLE` (`storage.js:453` i `DetallMultimedia.jsx:453`)
- **Evidència:**
  1. A `src/data/supabase/storage.js:453`: `const CARPETA_ESBORRABLE = 'avatars';` i a la línia 513: `esborrable: carpeta === CARPETA_ESBORRABLE`. Qualsevol imatge duplicada pujada dins de `portades/`, `mur/` o `mercat/` apareix a la galeria amb `esborrable: false` i **no es pot seleccionar ni eliminar per netejar duplicats**.
  2. A `DetallMultimedia.jsx:453–455`, el bucle `for (const element of seleccionats) { await esborraElMeuMitja(...); }` fa una petició HTTP `remove([cami])` per cada fitxer de manera seqüencial, en lloc d'agrupar per `bucket` i fer una sola crida `supabase.storage.from(bucket).remove(camins)` o `Promise.allSettled`.
- **Correcció obligatòria:**
  - Permetre `esborrable: true` per a les carpetes pròpies de l'usuari (`avatars`, `portades`, etc.) sempre que el prefix del camí pertanya a `<uid>/` o `<poble>/<uid>/` i passe pel filtre relacional.
  - Agrupar els camins per bucket o usar `Promise.allSettled` amb gestió d'errors parcials.

##### [MITJANA · A2.3] Detecció de duplicats basada només en `${etag}|${mida}` (`DetallMultimedia.jsx:202–208`)
- **Evidència:**
  ```js
  const clauDuplicat = entrada.etag && entrada.mida > 0
    ? `${entrada.etag}|${entrada.mida}`
    : '';
  ```
- **Risc:** Les entrades d'`injectaActiva` (com l'avatar de Google o l'avatar local de la llavor) entren amb `etag: ''` i `mida: 0`, de manera que si l'usuari ha pujat eixa mateixa foto a Storage, la còpia injectada i la de Storage no es detecten com a duplicades si tenen URL diferent. A més, la UI mostra la píndola passiva `"Duplicada"`, però li falta un botó directe d'1 clic **«Selecciona els duplicats sobrants»** quan `duplicats > 0` per estalviar a l'usuari haver de buscar-los manualment per tota la graella.

---

#### 1.3. `src/sections/multimedia/MultimediaSection.jsx`, `VisorDeLArxiu.jsx` i `censImatges.js`

##### [ALTA · A3.1] Imatge fòssil encara activa a `src/sections/multimedia/censImatges.js` (Línia 165)
- **Evidència:**
  A `src/sections/multimedia/censImatges.js:165`:
  ```js
  { id: 'img-post-disseny-2-sidebar', src: '/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png', title: 'Anatomia de Pedra Seca: la barra lateral', category: 'disseny', format: 'PNG' },
  ```
- **Risc / Incoherència:**
  1. Aquesta captura ensenya la barra lateral obsoleta `v10.38.20` amb el botó antic `+ CONNECTAR`.
  2. Com que `mediaContent.js` no la vincula a cap `article`, `panellDeLaFoto.js` (`línia 139`) la classifica sota l'etiqueta **"És de l'arxiu (no publicada)"** al mig de la biblioteca pública `/multimedia`.
- **Correcció obligatòria:** Moure `/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png` al conjunt `EXCLOSES` (`censImatges.js:18–31`) i eliminar l'entrada `img-post-disseny-2-sidebar` de `CENS_IMATGES`.

##### [MITJANA · A3.2] Clau React amb índex d'array a `MultimediaSection.jsx` (Línies 145 i 159)
- **Evidència:**
  `key={`${item.id}-${index}`}` tant en la vista `grid` (`línia 145`) com en la vista `list` (`línia 159`).
- **Risc:** Quan s'aplica un filtre de categoria, cerca o s'elimina un element en calent, l'`index` muta i React destrueix/recrea els nodes `<img>` o conserva estats d'error/càrrega desfasats. Com que `item.id` és únic al cens (`censImatges.test.js`), la clau ha de ser estrictament `key={item.id}`.

---

### BLOC 2 · Enginyeria Inversa REA: Botiga Elegant i Selector de Variants (`detailSectionMeta.jsx`)

#### 2.1. Diagnòstic del defecte actual («Xoriço vertical de targetes»)
A `src/sections/detail/detailSectionMeta.jsx` (`buildMercatDetailSectionMeta`, `línies 298–341`), un producte amb `variations` (com la **Samarreta Sóc de Poble** a `src/sections/mercat/marketSeed.js:35–82`) pateix 4 patologies estructurals:
1. **Fragmentació de la fitxa:** Es renderitza un `.note-card.stack-grid` complet per a cada variant (`Edició Gris Plom`, `Edició Verda`), repetint `VENEDOR: SÓC DE POBLE`, repetint preus i generant N botons `Afegeix al cabàs` en columna.
2. **Ignorància d'estoc (`stock_status`):** Tot i que `marketSeed.js:60` declara `stock_status: 'Esgotat'` per a l'`Edició Verda` i `mapejadorSeccions.js:51` el preserva dins de `CAMPS_DE_TEXT_DE_VARIACIO`, `detailSectionMeta.jsx` l'ignora i mostra el botó `Afegeix al cabàs` actiu!
3. **Classes CSS heretades no canòniques:** El botó usa `<button className="btn btn-secondary sdp-boto--ple">` (`línia 334`) en lloc del primitiu `<Boto>` de Pedra Seca.
4. **Desconnexió entre Variants i Carrusel:** Les 8 fotos de la samarreta viuen al `CarruselImatges` superior (`heroComponent`), però les variants pinten miniatures aïllades (`width={120}`) avall sense cap vincle interactiu.

#### 2.2. Dissecció REA dels referents (Shopify Dawn · Stripe Checkout · Gumroad)
Aplicant enginyeria inversa sobre els patrons d'e-commerce més nets del món i creuant-los amb `modern-web-guidance` (*brand-consistent-forms* / *accessible radio pills*):

| Patró REA | Shopify (Dawn) | Gumroad Product Page | Traducció Canònica a **Pedra Seca** |
| :--- | :--- | :--- | :--- |
| **Unitat de Producte** | 1 URL = 1 galeria mestra + 1 bloc de compra | 1 targeta mestra amb carrusel superior i selector compacte | `PageFrame` amb H1/H2 + Barra Taronja + `CarruselImatges` (8 fotos) |
| **Selector de Variants** | `<fieldset>` amb píndoles `<input type="radio">` (`VariantPicker`) | Píndoles d'edició amb preu i estat d'estoc integrat | `<SelectorVariantsMercat />` amb `role="radiogroup"` (o ràdios natius `.sdp-sr-only` + `:has(:checked)`) |
| **Sincronització Visual** | Triar variant salta l'índex del carrusel a la foto de la variant | Triar opció actualitza la previsualització i el resum | Seleccionar la píndola actualitza la fitxa activa (descripció, preu, miniatura pròpia validada) |
| **Control d'Estoc** | Píndola marcada amb traç discontinu / badge `(Esgotat)` i CTA desactivat | Opció esgotada bloqueja el CTA amb text explícit | Si `stock_status === 'Esgotat'`, píndola amb badge i `<Boto disabled>Esgotat</Boto>` |
| **Acció Principal (CTA)** | 1 sol botó primari per pàgina | 1 sol botó d'alta conversió amb el preu actiu | 1 sol `<Boto varietat="primari" mida="gran" ple>` al peu del selector |

#### 2.3. Jerarquia Editorial Estricta de Pedra Seca per al Mercat

```
1. H1 Títol + H2 Entradilla (getSubtitle -> PageFrame)
2. Barra Taronja d'Autoria (Sóc de Poble · La Torre de les Maçanes)
3. Carrusel Dinàmic Complet (CarruselImatges amb les 8 fotos de marketSeed.js)
4. Cos Editorial del Producte (renderRichText(item.description || item.content))
5. Selector Compacte de Variants (<SelectorVariantsMercat />)  <-- SUBSTITUEIX EL XORIÇO
6. Caixa d'Acció Unificada (Preu actiu + Venedor + 1 sol <Boto> «Afegeix al cabàs»)
```

#### 2.4. Especificació Tècnica i Codi Llest per a `src/sections/detail/detailSectionMeta.jsx`

> [!IMPORTANT]
> **Compatibilitat amb la suite de seguretat `ItemDetailSection.imatgesPropies.test.jsx`:**
> Els tests actuals a `ItemDetailSection.imatgesPropies.test.jsx` (`línies 186–255`) verifiquen que:
> 1. Cap imatge externa (`GOOGLE`, `RASTREIG`) ni cap referència opaca crua (`sdp-media://`) es pinte com a `<img src="...">` dins de les variacions.
> 2. Les imatges pròpies (`/assets/...` o Storage públic registrat) sí que es pinten i passen pel filtre `esImatgePropiaDelDetall(src) && !REFERENCIA_OPACA.test(src)`.
> Per tant, el nou selector ha d'usar **exactament el mateix filtre `imatgePropiaDeVariacio(variation.image)`** i actualitzar els 3 tests de `ItemDetailSection.imatgesPropies.test.jsx` (`línies 195–197, 214–215, 248–250`) perquè consulten les opcions/vista activa del selector en lloc de N `.note-card` repetides (o bé mantindre la previsualització segura de la variant activa).

##### Proposta d'implementació del component `MercatProductBody` dins de `detailSectionMeta.jsx`:

```jsx
function imatgeSeguraDeVariacio(image) {
  if (!image || REFERENCIA_OPACA.test(String(image).trim())) return null;
  return esImatgePropiaDelDetall(image) ? image : null;
}

function esVariacioEsgotada(variation) {
  const estat = String(variation?.stock_status || '').trim().toLowerCase();
  return estat === 'esgotat' || estat === 'agotado' || estat === 'out of stock';
}

function MercatProductBody({ item, priceText, sellerText, actionLabel, onTriggerAction, renderRichText, t }) {
  const variacions = Array.isArray(item?.variations)
    ? item.variations.map((v) => (typeof v === 'string' ? { name: v } : v)).filter(Boolean)
    : [];
  const [indexActiu, setIndexActiu] = React.useState(0);
  const variacioActiva = variacions[indexActiu] || variacions[0] || null;

  const preuActiu = variacioActiva?.price || priceText;
  const esgotat = variacioActiva ? esVariacioEsgotada(variacioActiva) : false;
  const fotoVariacioActiva = imatgeSeguraDeVariacio(variacioActiva?.image);

  return (
    <div className="detail-section-stack">
      {/* 1. Cos Editorial Canònic */}
      {renderRichText(
        item.content || item.description || item.text,
        t('detail.empty.mercat', 'Aquest producte encara no té una fitxa ampliada.')
      )}

      {/* 2. Selector Compacte de Variants (Píndoles Pedra Seca) + Acció Única */}
      <section className="note-card stack-grid sdp-mercat-compra" aria-label={t('section.mercat.variations', 'Variants del producte')}>
        {variacions.length > 0 ? (
          <fieldset className="sdp-mercat-variants-fieldset">
            <legend className="sdp-mercat-variants-legend">
              {t('detail.mercat.choose_variant', 'Tria l’edició')} ({variacions.length})
            </legend>
            <div className="sdp-mercat-variants-pindoles" role="radiogroup">
              {variacions.map((variation, idx) => {
                const activa = idx === indexActiu;
                const varEsgotada = esVariacioEsgotada(variation);
                return (
                  <button
                    key={variation.id || variation.name || idx}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => setIndexActiu(idx)}
                    className={`sdp-pindola-variant${activa ? ' is-active' : ''}${varEsgotada ? ' is-out-of-stock' : ''}`}
                  >
                    <span className="sdp-pindola-variant__nom">{variation.name}</span>
                    {varEsgotada ? (
                      <span className="sdp-pindola-variant__estat">{variation.stock_status}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Resum de la variant seleccionada */}
            {variacioActiva ? (
              <div className="sdp-mercat-variant-detall" aria-live="polite">
                {fotoVariacioActiva ? (
                  <img
                    className="sdp-mercat-variant-detall__img"
                    src={fotoVariacioActiva}
                    alt={variacioActiva.name || item.title || ''}
                    width={96}
                    height={96}
                    loading="lazy"
                  />
                ) : null}
                <div className="sdp-mercat-variant-detall__text">
                  <h3 className="sdp-mercat-variant-detall__titol">{variacioActiva.name}</h3>
                  {variacioActiva.description ? (
                    <p className="sdp-mercat-variant-detall__desc">{variacioActiva.description}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </fieldset>
        ) : null}

        {/* 3. Barra de Preu, Venedor i Botó Únic de Compra */}
        <div className="sdp-mercat-compra__peu">
          <div className="sdp-mercat-compra__meta">
            {preuActiu ? <p className="sp-card-price">{preuActiu}</p> : null}
            {sellerText ? (
              <p className="detail-meta-kicker">
                {t('detail.kicker.seller', 'Venedor')}: {sellerText}
              </p>
            ) : null}
          </div>
          {actionLabel ? (
            <Boto
              varietat="primari"
              mida="gran"
              ple
              disabled={esgotat}
              onClick={() => onTriggerAction?.(variacioActiva ? { ...item, selectedVariation: variacioActiva } : item)}
            >
              {esgotat
                ? `${variacioActiva?.stock_status || 'Esgotat'} — ${variacioActiva?.name || ''}`
                : variacioActiva?.name
                  ? `${actionLabel} — ${variacioActiva.name}`
                  : actionLabel}
            </Boto>
          ) : null}
        </div>
      </section>
    </div>
  );
}
```

##### Tokens CSS Pedra Seca per a `.sdp-pindola-variant` (zero estils ad-hoc, tot amb variables del sistema):
- Contenidor `.sdp-mercat-variants-pindoles`: `display: flex; flex-wrap: wrap; gap: var(--espai-2, 0.5rem);`
- Píndola `.sdp-pindola-variant`:
  - `min-height: 44px` (WCAG 2.2 AA target size per a gent gran del poble).
  - `padding: 0.5rem 1rem; border-radius: var(--radi-pindola, 9999px);`
  - `border: 2px solid var(--vora-suau, #d6d3d1); background: var(--fons-targeta, #ffffff); color: var(--text-principal, #1c1917); font-weight: 600;`
- Estat actiu `.sdp-pindola-variant.is-active`:
  - `border-color: var(--color-taronja, #ea580c); background: var(--fons-taronja-suau, #fff7ed); color: var(--color-taronja-fosc, #9a3412);`
- Estat esgotat `.sdp-pindola-variant.is-out-of-stock`:
  - `border-style: dashed; opacity: 0.85;` amb `.sdp-pindola-variant__estat` en versaleta.

---

### BLOC 3 · Catàleg Matrix `_wiki_de_poble/20_capacitats/` (Fitxes Sintètiques d'1 Pàgina)

A continuació s'entreguen les dues fitxes sintètiques d'1 pàgina encarregades a Gemini, amb format d'enrutament ràpid (`< 2 segons` de lectura per als agents), llestes per a `_wiki_de_poble/20_capacitats/`.

---

#### Fitxa 1 · `261018_recurs_google_workspace_cli.md`

```markdown
---
type: recurs_capacitat
status: canonic
description: CLI unificat en Rust (gws) per operar Google Drive, Gmail, Calendar, Sheets, Docs i Forms des de terminal i agents IA amb eixida JSON estructurada.
tags:
  - capacitats
  - cli
  - rust
  - google-workspace
  - mcp
  - automatitzacio
---
# Capacitat: Google Workspace CLI (`gws` · Rust)

## 1. Disparador (Quan invocar aquesta capacitat)
Activa `gws` quan un agent o flux de Sóc de Poble necessite:
- Llegir, crear o sincronitzar fulls de càlcul (**Google Sheets**), documents (**Docs**), carpetes (**Drive**), correus (**Gmail**) o agendes (**Calendar**) sense obrir navegador.
- Ingerir censos d'associacions, llistes de socis, torns de reg, actes municipals o comandes de productors locals que encara viuen a Google Drive/Sheets.
- Connectar un agent via **MCP (`gws mcp`)** amb esquemes dinàmics descoberts en temps d'execució des del Google Discovery Service.

## 2. Ubicació i Binari Local
- **Repositori clonat a la masia:** `../_investigacio_ia_de_poble/googleworkspace-cli/`
- **Llenguatge i llicència:** Rust (`Cargo.toml` v0.22.5, Apache-2.0).
- **Execució ràpida:** `npx -y @googleworkspace/cli` o binari compilat `cargo build --release` (`target/release/gws`).

## 3. Arquitectura d'Autenticació (Sense fricció)
| Mode | Variable / Fitxer | Cas d'ús a Sóc de Poble |
| :--- | :--- | :--- |
| **OAuth Interactiu** | `gws auth setup` + `gws auth login -s drive,sheets,gmail,calendar` | Configuració inicial del compte mestre (`socdepoblecom@gmail.com`). Credencials xifrades amb AES-256-GCM al Keyring de macOS. |
| **Headless / CI / Cron** | `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/cami/creds.json` | Automatitzacions desateses i scripts de sincronització nocturna. |
| **Token Directe** | `GOOGLE_WORKSPACE_CLI_TOKEN=$(gcloud auth print-access-token)` | Execució efímera des d'un agent amb sessió `gcloud` oberta. |

## 4. Comandes Essencials per a Agents (Sempre JSON)
1. **Inspecció d'esquema abans de cridar (Obligatori si no es coneix el payload):**
   `gws schema sheets.spreadsheets.values.append`
2. **Google Drive — Llistar i pujar arxius amb metadades:**
   - Llistar els 10 últims PDF/fulls: `gws drive files list --params '{"pageSize": 10, "q": "trashed = false"}' --format json`
   - Pujar una acta o factura: `gws drive +upload ./acta_cooperativa.pdf --parent <FOLDER_ID>`
3. **Google Sheets — Llegir i afegir files a un cens rural:**
   - Llegir rang: `gws sheets +read --spreadsheet <ID> --range "Socis!A1:F100"`
   - Afegir fila: `gws sheets +append --spreadsheet <ID> --values '[["Maria Valls", "La Torre", "Activa"]]'`
4. **Gmail — Triage i enviament amb `--dry-run`:**
   - Resumir bústia: `gws workflow +standup-report`
   - Enviar avís (validar sempre primer amb `--dry-run`): `gws gmail +send --to entitat@poble.cat --subject "Convocatòria" --body "Text..." --dry-run`
5. **Calendar — Consultar agenda d'actes del poble:**
   - `gws calendar +agenda --days 7`

## 5. Regles de Seguretat de Pedra Seca per a `gws`
- **Sempre `--dry-run` abans de mutar:** Qualsevol escriptura (`+send`, `+append`, `delete`, `create`) ha d'executar-se primer amb `--dry-run` o amb confirmació explícita si afecta dades d'una associació.
- **Scopes mínims (`-s`):** No demanar mai tots els permisos de Google; limitar als serveis estrictament necessaris (`drive.readonly`, `sheets`, etc.).
- **Sobirania de dades:** Google Workspace és una **font d'ingesta o passarel·la d'exportació** per als veïns que ja l'usen; la font de veritat canònica de Sóc de Poble continua sent **Supabase + CRDT local**.
```

---

#### Fitxa 2 · `261018_recurs_rea_reverse_engineering.md`

```markdown
---
type: recurs_capacitat
status: canonic
description: Plataforma MCP d'enginyeria inversa (Reverse Engineer Anything v6.5.0 · 207 eines) per auditar, disseccionar i reconstruir aplicacions web, Electron, binaris natius, APK i bases de dades cap a Pedra Seca.
tags:
  - capacitats
  - rea
  - reverse-engineering
  - mcp
  - arquitectura
---
# Capacitat: REA (`Reverse Engineer Anything` · v6.5.0)

## 1. Disparador (Quan invocar aquesta capacitat)
Activa el servidor MCP `rea` o la skill `reverse-engineer-anything` quan el Mestre o el Consell demanen:
- **Clonar o adaptar un patró de mercat existent** (p. ex. l'estructura de panells d'Obsidian, el selector de variants de Shopify/Gumroad, el TPV de Loyverse o la bústia de WhatsApp) cap al sistema de disseny **Pedra Seca**.
- **Auditar un artefacte empaquetat sense codi font:** Aplicacions Electron (`.asar`), paquets web minificats/WASM, binaris macOS (`Mach-O` / Swift / Objective-C), Android (`APK` / `DEX`), firmware o bases de dades locals (`SQLite`).
- **Verificar una reconstrucció amb proves traçables:** Construir un llibre major d'obligacions (`build_reconstruction_obligation_ledger`) on cada decisió d'arquitectura quede lligada a un identificador d'evidència (`ev_...`).

## 2. Ubicació i Servidor MCP
- **Skill instal·lada:** `/Users/javillinares/.gemini/config/skills/reverse-engineer-anything/SKILL.md`
- **Esquemes MCP (207 eines):** `/Users/javillinares/.gemini/antigravity/mcp/rea/*.json`
- **Paquet CLI / Servidor:** `npx -y rea-agents@6.5.0`

## 3. Matriu de Rutes d'Atac per Família d'Artefacte

| Família d'Objectiu | Eines MCP Primàries (`rea`) | Què n'extraiem per a Sóc de Poble |
| :--- | :--- | :--- |
| **Web / PWA / Bundles JS** | `inspect_web_page`, `analyze_web_bundle`, `trace_web_module_imports`, `inspect_web_event_listeners`, `recover_javascript_sources`, `capture_browser_scenario` | Jerarquia DOM, màquines d'estat d'UI, gestió de focus/teclat, estructura de formularis i fluxos de xarxa. |
| **Electron / Desktop JS** | `inspect_electron_fuses`, `list_electron_targets`, `analyze_javascript_application`, `reconcile_javascript_runtime`, `capture_electron_scenario` | Extracció de paquets `.asar`, canals IPC, dreceres de teclat i arquitectura d'escriptori local-first (estil Obsidian). |
| **macOS / iOS (`Mach-O`)** | `inspect_macho`, `inspect_plist`, `inspect_asset_catalog`, `get_objc_classes`, `analyze_swift_types`, `batch_decompile` | Models de dades natius, protocols, esquemes d'URL i catàlegs d'actius. |
| **Android (`APK` / Flutter)** | `inspect_android_package`, `decode_android_resources`, `search_android_classes`, `decompile_jeb_item`, `identify_flutter_build` | Esquemes d'API mòbils d'apps municipals/rurals, permisos i pantalles d'oficis/TPV. |
| **Dades i Xarxa (`SQLite` / `PCAP`)** | `inspect_sqlite_database`, `inspect_pcap_capture`, `inspect_web_network_capture` | Esquemes SQL reals, índexs i contractes d'API REST/GraphQL d'aplicacions de referència. |
| **Verificació i Reconstrucció** | `build_reconstruction_obligation_ledger`, `evaluate_reconstruction_coverage`, `export_evidence_bundle`, `list_unknowns` | Certificació que la nostra implementació a Pedra Seca cobreix el 100% dels casos d'ús sense regressions. |

## 4. Protocol Operatiu en 4 Passos (Trellat REA)
1. **Triar la superfície més lleugera:** Si analitzem el nostre propi repositori amb codi font obert (`socdepoble.org/src`), usa les eines de lectura directa; invoca `rea` quan l'objectiu siga un bundle extern, una app compilada o una captura de sessió viva.
2. **Estàtica abans que Dinàmica:** Executa primer `inspect_artifact` / `analyze_web_bundle` / `inspect_sqlite_database` per mapejar l'estructura abans d'instrumentar amb Frida o Chrome en viu.
3. **Separar Fets d'Inferències:** Documenta sempre l'`ev_...` (Fet observat al binari/DOM) separat de la proposta d'adaptació a Pedra Seca.
4. **Traducció al Cànon Pedra Seca:** Cap classe CSS, token ni dependència aliena es copia en cru. De l'enginyeria inversa només n'importem **la mecànica d'interacció i el model d'estat**, vestits sempre amb primitius nostres (`<Boto>`, `PageFrame`, `UniversalCard`, `--color-taronja`, `28px` base).
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Inspecció estàtica de codi:**
  - `socdepoble.org/src/app/contexts/personaDeSessio.js` (línies 1–165) i `personaDeSessio.test.js` (línies 1–197).
  - `socdepoble.org/src/sections/profile/DetallMultimedia.jsx` (línies 1–669) i `socdepoble.org/src/data/supabase/storage.js` (línies 450–596).
  - `socdepoble.org/src/sections/multimedia/MultimediaSection.jsx` (línies 1–187), `VisorDeLArxiu.jsx` (línies 1–123), `censImatges.js` (línies 1–183) i `panellDeLaFoto.js` (línies 1–185).
  - `socdepoble.org/src/sections/detail/detailSectionMeta.jsx` (línies 1–350), `socdepoble.org/src/sections/mercat/marketSeed.js` (línies 1–83), `socdepoble.org/src/data/mapejadorSeccions.js` (línies 35–100) i `socdepoble.org/src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx` (línies 185–255).
- **Consulta de pràctiques web modernes (`modern-web-guidance`):**
  - Executat `npx -y modern-web-guidance@latest search "accessible radio pill selector product variant"` -> aplicades les guies `brand-consistent-forms` i `forms` per al selector de variants accessible amb `role="radiogroup"` / `<fieldset>` i objectius tàctils mínims de `44x44px`.
- **Inspecció d'esquemes i repositoris per a `20_capacitats`:**
  - Verificat `../_investigacio_ia_de_poble/googleworkspace-cli/README.md` i `Cargo.toml` (v0.22.5).
  - Verificat `/Users/javillinares/.gemini/config/skills/reverse-engineer-anything/SKILL.md` i els 207 esquemes a `/Users/javillinares/.gemini/antigravity/mcp/rea/`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respectar el contracte d'execució a tres bandes i evitar col·lisions d'escriptura mentre Claude Code i GPT Codex editen `src/` i creen `_wiki_de_poble/20_capacitats/`, Gemini no ha modificat directament els fitxers de `src/` en aquest torn i ha lliurat totes les correccions exactes (línia per línia) i els blocs de codi llestos dins d'aquest informe canònic.
- Quan Claude aplique el nou `<MercatProductBody />` a `src/sections/detail/detailSectionMeta.jsx`, caldrà actualitzar els 3 tests de `src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx` (`línies 193–217` i `236–254`) perquè comproven les píndoles i la imatge de la variant activa en lloc de buscar múltiples targetes `.note-card` repetides.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [[261018_2000_prompt_claude_gemini_capacitats_matrix_i_poda]]

