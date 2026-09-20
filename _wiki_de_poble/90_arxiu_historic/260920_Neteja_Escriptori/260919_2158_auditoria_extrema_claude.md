---
type: informe
status: esborrany
description: Auditoria extrema de fonaments, enxufabilitat, defectes ocults i estrès teòric de 10.000 usuaris, amb evidència executada.
tags:
  - arquitectura
  - seguretat
  - escriptori
---

# Auditoria extrema — fonaments, enxufabilitat i 10.000 usuaris

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260919-EXTREMA-CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:58 |
| Modificació | 26-09-19 21:58 |
| Agent redactor | Claude (Cowork) |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |
| Entrada | `260919_2136_PROMPT_auditoria_extrema.md` i arbre local |
| Tall de referència | `214f5c7c65bdc011c2d7e2f93f73d50438f9fa21` + 124 canvis locals no confirmats |
| Contenció | Zero fitxers de codi tocats. L'únic fitxer escrit és aquest document. |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_2136_PROMPT_auditoria_extrema]]
- [[260919_2154_auditoria_extrema_codex]]

---

## 1 · Resposta al Mestre, primer i sense envoltori

Heu preguntat tres coses. Les responc en tres frases i després les demostre.

**¿Hi ha alguna cosa fonamental que calga canviar ARA?** Sí, i només una és de veritat radical: el
contracte del backend (`src/data/contracte.js:2-35`) és un bloc de **32 mètodes obligatoris tot-o-res**.
Mentre siga així, cada funcionalitat nova trenca tots els enxufes existents i la «base immutable amb
endolls» és impossible per construcció, per molt ben escrit que estiga la resta. Això es corregix en
una vesprada i canvia els pròxims cinc anys.

**¿La base està preparada per a créixer a base d'enxufes?** Per al **backend**, quasi: hi ha una
frontera real, declarada i vigilada per una porta mecànica. Per a **funcionalitats** (una secció nova,
un mòdul nou), no: no existix cap sistema de mòduls. Afegir una secció obliga a tocar com a mínim nou
llocs a mà, repartits per tot l'arbre. Ho detalle al §4.

**¿Reventarà amb 10.000 usuaris?** No «reventarà» de sobte: es degradarà de pressa i en silenci.
El sostre no és el navegador ni React — és el **sondeig cada 25 segons de tots els usuaris connectats**
i un **mur que mai passa de 50 publicacions**. El Mur amb 10.000 veïns no és lent: està trencat, i ho
està ja ara amb 3.

I una quarta cosa que no heu preguntat i que és la més urgent de totes: **l'artefacte que hi ha
construït ara mateix al disc no pot connectar amb cap servidor**, i **la cadena de portes fa tres dies
que no arriba ni a la tercera passa**. La casa està molt ben pensada i la porta d'entrada està tapiada.

---

## 2 · Mètode, i què val i què no val d'aquesta auditoria

Perquè el que llegiu tinga el pes exacte que li toca, i ni un gram més:

**Què he fet de veritat.** He llegit l'arbre natiu (226 fitxers a `src/`, 22.031 línies de JS/JSX,
14 migracions SQL, 43 portes). He **executat** 30 portes mecàniques de només lectura, el linter, la
bateria de proves i he inspeccionat els artefactes reals de `dist/` i `wordpress-plugin/dist/`. He
**reproduït en un banc de proves aïllat** el comportament del sanejador amb el mòdul real del projecte.

**Què no he fet.** No he tocat cap línia de codi (§Registre). No he executat cap porta que puga
escriure (`--baseline`, `teixidor`, `tancament`, `saneja-callback`, `build-previ`): les 13 portes
escriptores queden fora del recompte i ho dic perquè el meu «19 de 30» no es confonga amb un «19 de 48».
No he pogut consultar cap base de dades real: **tot el que dic de RLS es dedueix del text de les
migracions, no de l'estat efectiu de Postgres.** Això és una limitació greu i li dedique el §5.C3.

**El tall.** He pres l'empremta md5 de tot `src/`, `tooling/` i `supabase/` a l'inici i al final. Durant
l'auditoria només ha canviat `src/components/PedraSeca/molecules/PillToggle.jsx` (un altre agent
treballant en paral·lel). No el cite enlloc. **Totes les cites d'aquest document estan verificades
contra el mateix tall.**

**Refutació.** Tres hipòtesis meues han caigut en comprovar-les i no apareixen com a troballes: que
`promoteToPublic` barrejava formes d'error incompatibles (no: `handleError` retorna un objecte amb
`error` truthy i la guarda funciona); que el doble `JSON.stringify` dels esborranys corrompia el
sessionStorage (no: fa el viatge d'anada i tornada correctament); i que la porta de persistència només
vigilava `localStorage` tal com diu el comentari de `src/config/storage.js:55-57` (**el comentari és
obsolet**: `tooling/gates/tractor-persistencia.mjs` vigila les dues capes des de fa temps). Ho pose
perquè sapieu que el filtre ha funcionat.

---

## 3 · Què hi ha realment ací davall

### 3.1 · Els CRDT no existixen

El prompt em demana auditar «els CRDT». **No n'hi ha cap.** Cerca exhaustiva a `src/`, `tooling/` i
`supabase/` de `crdt`, `yjs`, `automerge`, `loro` i `operational transform`: zero resultats en codi.
L'única cosa que hi ha és:

- **Notes**: bloqueig optimista per número de revisió (`src/data/supabase/notes.js:56`, amb
  `&revision=eq.N` a la petició) i un trigger que l'incrementa (`supabase/migrations/260914_0000_schema_notes.sql:36`).
  És correcte i és **l'oposat d'un CRDT**: en compte de fusionar, rebutja amb un 409.
- **Xat**: últim que escriu guanya, sense fusió de cap tipus.
- **La resta**: no hi ha concurrència perquè no hi ha escriptura compartida.

Això no és un defecte — un CRDT per a aquest producte seria sobreenginyeria. El defecte és que **la
documentació i el llenguatge del projecte donen per fet que hi és**. Si demà arriba un relleu i llig
«els CRDT», buscarà durant dies una cosa que no existix. Que quede escrit: *la política de concurrència
de Sóc de Poble és revisió optimista a Notes i last-write-wins a la resta.*

### 3.2 · El que hi ha és bo i cal dir-ho

Abans de la llista negra, tres coses que estan objectivament ben fetes i que **no s'han de tocar**:

1. **`src/data/identitat.js`** — la font única de sessió. La capçalera (línies 9-50) documenta el
   «Cisma de la Sessió» amb un detall forense que no he vist quasi mai en codi de producció. La decisió
   de tindre les tres peces (jwt, refresh, user) a la mateixa capa efímera és correcta i valenta.
2. **`src/PedraSecaEmbed.jsx`** — el cicle de vida del Custom Element (P0-1 a P0-8) resol problemes
   reals i difícils: shadow root que sobreviu a moviments de DOM, full d'estils compartit via
   `adoptedStyleSheets`, avisos que no s'apaguen als germans, restitució del fons de l'amfitrió.
3. **Les migracions SQL.** Les funcions `security definer` porten `set search_path = ''`, els
   `revoke ... from public, anon` hi són, i el rate-limit del xat
   (`supabase/migrations/260908_xat_v2_correccions.sql:387-416`) usa `pg_advisory_xact_lock` en compte
   de confiar en RLS. Això és ofici.

La qualitat del pensament és alta. El problema no és el pensament: és **tot el que hi ha entre el
pensament i l'usuari**.

### 3.3 · El mapa honest

```
  navegador
    └── <soc-de-poble>  shadow DOM tancat      PedraSecaEmbed.jsx
         └── host.js    fase 1 config / fase 2 segellat     ← LA frontera real
              └── backendPort.js   32 mètodes obligatoris + 4 capacitats
                   ├── supabase/config.js   →  supabase-js   (xat, storage, realtime)
                   └── supabase/runtime.js  →  fetch cru     (contingut, notes, auth)
                                                 ↑ DOS transports diferents
  Postgres
    ├── app_content        clau → blob JSON   (towns, agents, pages, feedPosts…)   LECTURA
    ├── section_submissions   fila per publicació   ← sempre limit=50
    ├── notes              fila per nota, RLS per propietari
    └── xat_*              fils, participants, missatges, lectures
```

Dues coses d'aquest mapa mereixen subratllat:

**Hi ha dos transports HTTP cap al mateix servidor.** `src/data/supabase/config.js:49-52` crea un
client `supabase-js` amb la capçalera `Authorization` **fixada en el moment de la creació**;
`src/data/supabase/runtime.js:61` fa `fetch` cru i llig el jwt **fresc a cada petició**
(`runtime.js:38-41`). Tenen garanties distintes: el `fetch` cru té temps d'espera de 12 s i reintent
automàtic en 401 (`runtime.js:64-66`); el client `supabase-js` no té ni l'un ni l'altre i depén d'un
`resetClient()` disparat per l'esdeveniment `sdp:auth-change` (`config.js:58-60`). El xat i les
imatges viatgen pel camí sense reintent; el contingut i les notes, pel camí amb reintent. **Això no és
una decisió: és una sedimentació.**

**`app_content` és un magatzem de blobs.** Cada clau és una fila i el `payload` és l'array sencer
(`src/data/supabase/runtime.js:96-108`). Avui només es llig, mai s'escriu des del client — així que no
hi ha contenció d'escriptura. Però fixa un sostre: **no es pot paginar, no es pot filtrar, no es pot
indexar per element i no es pot aplicar RLS per element.** Mentre siguen dades de llavor és acceptable.
El dia que un poble vullga editar el seu propi catàleg des de dins, aquesta taula s'ha de partir. És
un deute conegut, no una bomba.

---

## 4 · Missió 1 · ¿Es pot créixer amb endolls sense trencar la base?

Resposta curta: **la porta està feta, però només en dona una i és de mida única.**

### 4.1 · El que sí que funciona

`src/host.js` separa configuració i segellat en dues fases. La finestra d'injecció existix de veritat
(el comentari de `PedraSecaEmbed.jsx:337-341` explica per què abans era de zero mil·lisegons) i hi ha
una porta mecànica que ho vigila (`tooling/gates/tractor-enxufe.mjs`, **executada i en verd**: E1 cap
mòdul importa la implementació fora del port, E2 el contracte no divergix, E3 el segellat no viu dins
del cicle de vida, E4 una sola superfície global). Aquesta part de la «Llei de l'Enxufabilitat» és
real i està demostrada.

### 4.2 · El defecte fonamental, i és aquest

`src/data/contracte.js:2-35` declara **`CONTRACTE_NUCLI` amb 32 mètodes**. `src/host.js:157-160`:

```js
const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !acceptats.includes(k));
if (pendentsNucli.length > 0) {
  throw new Error(`[host] Injecció de backend incompleta. Falten...`);
}
```

Traducció: **per a endollar res, has d'implementar-ho tot.** I la conseqüència que mata el somni:
**cada funcionalitat nova que afig un mètode al nucli invalida, en el moment del `git push`, tots els
backends que ja funcionaven.** Sollutia es queda fora fins que torne a implementar el mètode nou —
encara que el seu producte no tinga ni vullga tindre eixa funcionalitat.

Això és exactament el contrari d'una base immutable amb endolls. És una base que canvia de forma cada
vegada que creix.

**I el remei ja està escrit, dos línies més avall.** `contracte.js:37-59` declara `CAPACITATS`
(`admin`, `sessio`, `mitjans`, `agenda`) i `backendPort.js:44-47` declara `teCapacitat()`. Això sí que
és arquitectura d'endolls: opcional, interrogable, degradable. El comentari de `contracte.js:47-49`
ho diu amb totes les lletres: *«No és nucli a posta: un backend sense Storage seguix sent vàlid i la
interfície cau cap a data URL.»* El patró correcte existix, està documentat, i **només cobrix 4 dels
36 mètodes**.

**El canvi radical que demaneu és aquest, i és el més barat de tots els que apareixen en aquest
document:** buidar `CONTRACTE_NUCLI` fins a deixar-hi només el que cap client pot no tindre —
raonablement `getCurrentUser`, `getDefaultUserId`, `getBackendConfigurat`, `getRuntimeDataMode` — i
moure la resta a `CAPACITATS` agrupades per domini (`mur`, `notes`, `xat`, `identitat`, `organitzacions`,
`admin`, `mitjans`, `agenda`). Cada secció pregunta per la seua capacitat abans de pintar-se i es
degrada si no hi és. A partir d'eixe dia, **afegir una funcionalitat és afegir una capacitat, i cap
enxufe existent se n'assabenta.** És una tarda de faena i és la diferència entre un producte que pot
durar i un que no.

### 4.3 · Per a funcionalitats no hi ha enxufe de cap mena

Afegir una secció nova avui obliga a editar, a mà i sense que res ho comprove:

| # | Fitxer | Què |
| --- | --- | --- |
| 1 | `src/config/sections.js:10` | `SECTION_ORDER` |
| 2 | `src/config/sections.js:11-32` | `SECTIONS` |
| 3 | `src/app/App.jsx:17-39` | el `lazy()` |
| 4 | `src/app/App.jsx:594-623` | la `<Route>` |
| 5 | `src/app/App.jsx:488-501` | el Provider, **niat a mà** dins d'una piràmide de 6 nivells |
| 6 | `src/data/contracte.js` | els mètodes nous (i trenca tots els enxufes, §4.2) |
| 7 | `src/data/backendPort.js:58-125` | un `asseguraMetode` per mètode |
| 8 | `src/data/supabase/*.js` | la implementació |
| 9 | `src/config/i18n.js` | les etiquetes |

Nou llocs, i cap porta mecànica comprova que els nou estiguen fets. Oblidar-ne un dona una pantalla en
blanc sense error. **[SUPÒSIT]** Un registre declaratiu únic (un array de descriptors amb `id`, `path`,
`carrega`, `Provider`, `capacitat`) reduiria els nou a un, i faria que la porta puga comprovar-ho.
No ho he prototipat, per contenció.

---

## 5 · Missió 2 · Defectes ocults, per gravetat

Numere `C##` per a no col·lidir amb els `F##` de Codex. On coincidim ho dic.

### C1 · P0 · Les fotos de les notes s'esborren soles al primer desat automàtic

**El defecte més greu que he trobat, i és nou: afecta codi escrit avui mateix**
(`SdpImageNodeView.jsx` i `useResolvedAsset.js` encara no estan ni al control de versions).

La cadena:

1. L'usuari inserix una foto. `uploadToStorage` la puja i torna una **referència opaca**
   `sdp-media://mitjans_privats/...` (`src/data/supabase/storage.js:123`).
2. TipTap la guarda com a `src` del node imatge; `SdpImageNodeView.jsx:8` la resol per a pintar-la.
   **En pantalla es veu perfecta.**
3. 600 ms després salta el desat automàtic: `NotesContext.jsx:153` → `netejaCamp('content', …)` →
   `sanitizeHtml()`.
4. El ganxo `afterSanitizeAttributes` de `src/utils/sanitize.js:40` crida `esFontImatgeSegura(src)`,
   que **retorna `false` per a `sdp-media://`** perquè només accepta `data:image/`, l'origen propi i
   la llista `origensMitjans` (`sanitize.js:107-121`).
5. `sanitize.js:42-46` lleva el `src` i marca `data-sdp-bloquejada="1"`.

**Comprovat, no deduït.** Carregant el mòdul real del projecte en un banc jsdom aïllat:

```
entrada : <img src="sdp-media://mitjans_privats/t/u/notes/abc.webp" alt="foto" class="sdp-imatge-cos">
eixida  : <img alt="foto" data-sdp-bloquejada="1" loading="lazy" decoding="async" referrerpolicy="no-referrer">
```

El que arriba a Postgres és una imatge sense origen. El fitxer es queda orfe al bucket. **L'usuari no
veu cap error**: la foto és a la pantalla fins que recarrega.

La imatge de portada cau pel mateix forat i encara més net: `NotesContext.jsx:17` fa
`esFontImatgeSegura(value) ? value : ''`, així que desar `heroImage` com a `sdp-media://…` **desa
literalment cadena buida**. Això converteix en codi mort la branca de `NotesContext.jsx:177`
(`finalHeroImage.startsWith('sdp-media://mitjans_privats/')`), que no pot ser certa mai.

*Direcció de correcció (no aplicada):* `esFontImatgeSegura` i el ganxo d'imatges han de reconéixer
l'esquema `sdp-media://` com a origen propi, amb validació de bucket. És un canvi d'unes poques línies
en un sol fitxer, però **necessita una prova que el fixe**, perquè és exactament el tipus de regressió
que ja ha passat una vegada.

### C2 · P0 · El que hi ha construït al disc no pot connectar amb cap servidor

`dist/` es va construir hui a les 18:11. Dins de `dist/assets/index-HrPYUmqS.js` hi ha literalment:

```
supabaseUrl:""
```

I al bundle autònom de WordPress, el mateix. Cap dels dos porta cap domini `*.supabase.co`. La causa
és directa: `.env` només declara `VITE_TENANT_ID` i `.env.local` només `VITE_DATA_MODE`. Com que
`src/main.jsx:26-27` fa `import.meta.env.VITE_SUPABASE_URL || ''`, Vite substituïx per cadena buida en
temps de compilació i **el client naix sense backend**. `getResolvedConfig` torna
`hasSupabaseConfig: false` i tots els proveïdors cauen a `status: 'error'`.

I ara la part que fa mal: **hi ha un aturador que hauria d'haver-ho parat i no ho fa.**
`vite.config.js:15` crida `validatePublicCredentials(supabaseUrl, anonKey)`. La primera cosa que fa
eixa funció és `src/config/publicCredentials.js:6-8`:

```js
if (!supabaseUrl || !anonKey) {
  return; // Si no hi ha credencials explícites, deleguem en la configuració per defecte.
}
```

**L'«ATURADOR CRÍTIC» no atura el cas de no tindre credencials: només el de tindre'n de roïnes.** És
el patró que ja hem vist més vegades en aquesta casa: un control que ix verd perquè no comprova res.
I té una conseqüència operativa immediata — si el desplegament de producció no injecta les variables
per l'entorn del proveïdor, el `npm run build` acaba amb èxit i publica una aplicació morta.

### C3 · P0 operatiu · La cadena de portes fa dies que no arriba a la tercera passa

`tooling/gates/run-portes.mjs` executa 48 passes **en sèrie i s'atura a la primera que falla**
(`run-portes.mjs:100-103`). He mesurat l'estat real:

- **Passa 3 de 48, «Linter»: falla.** `npm run lint` → *357 problems (1 error, 356 warnings)*, eixida 1.
  L'error és una sola variable sense usar a `tooling/wiki/tractor-frontera-auth.mjs:47`.
- Per tant, **les 45 passes següents no s'executen mai**. Ni en el hook de `pre-commit`
  (`.husky/pre-commit:5`), ni a CI (`.github/workflows/sdp_lock_ci.yml` i `wiki-integrity.yml`, les
  dues fan `npm run gate`).

Executant a mà les 30 portes de només lectura: **19 verdes, 11 roges.** Roges: Cens, Doctrina (10
camins citats que no existixen), Tokens, Cromàtic, Crom, Esquemes, SCC, Persistència, Cadena, Utilitats
SDP, Inline-Styles. I les proves: **2 fallen de 47**.

Cap d'aquestes onze és greu per si mateixa. **La suma sí que ho és**, i per una raó concreta: el
sistema immunitari sencer d'aquest projecte — el que li dona el seu valor diferencial — està
**desconnectat**, i ho està d'una manera que no es veu, perquè la cadena mor per una advertència de
linter abans d'arribar a les portes que de veritat vigilen seguretat, persistència i disseny. La Porta
RLS, la de Persistència i les proves unitàries són a les posicions 44, 40 i 48. **En condicions reals
no s'han executat des de fa dies.**

Un afegit important: **corregisc la meua pròpia memòria d'auditories anteriors.** Constava que les
lleis R3 i R5 de la Porta RLS eren inerts. Ja no ho són: `tooling/gates/tractor-rls.mjs:169-183` i
`229-236` estan implementades i la porta ix verda de veritat. El commit `214f5c7c` ho va arreglar.

### C4 · P1 · Cada desplegament trenca totes les sessions obertes

Tres fets que, junts, fan una cosa lletja:

1. `src/app/App.jsx:17-39` carrega 22 seccions amb `lazy()` **sense cap reintent**.
2. Existix el reintent — `ambReintent()` a `src/sections/disseny/cataleg/detailRegistry.jsx:3-27`,
   que recarrega la pàgina una vegada quan el `import()` falla — però **només s'aplica al catàleg de
   disseny**, la part menys crítica de l'aplicació.
3. `vercel.json:12-17` reescriu **tota** ruta no trobada cap a `/index.html`.

Escena: publiqueu una versió nova. Els fitxers antics amb resum criptogràfic al nom desapareixen. Una
veïna que tenia la pestanya oberta toca «Mur». El navegador demana `/assets/MurSection-ABC123.js`, ja
no existix, i Vercel **li torna `index.html` amb un 200 OK**. El navegador intenta interpretar HTML
com a JavaScript i peta amb un error de sintaxi il·legible. `RouteErrorBoundary`
(`App.jsx:524-552`) pinta «Hi ha hagut un problema» i el botó «Intentar de nou» no arregla res, perquè
el mòdul continua sense existir.

L'única xarxa que hi ha és `src/host.js:73-77`, que escolta `vite:preloadError`... i només fa
`console.error`. **Amb 10.000 usuaris connectats, desplegar és avariar 10.000 sessions alhora.**

### C5 · P1 · Arrencada: dotze peticions abans de pintar res, i dos són el catàleg sencer

`src/app/App.jsx:488-501` munta **tots** els proveïdors de dades de manera incondicional, siga quina
siga la ruta. I cadascun carrega en muntar-se, no en entrar a la secció.

El cost exacte per a un usuari identificat, comptat mètode a mètode:

| Proveïdor | Crida | Peticions |
| --- | --- | --- |
| `CoreContentProvider` | `loadCoreContent` | 1 |
| `MurProvider` | `loadMur` → `loadAppData` | 3 |
| `MultimediaProvider` | `loadMultimedia` → `loadAppData` | 3 |
| `NotesDataProvider` | `loadNotes` | 3 |
| `XatProvider` | `loadFils` (RPC) | 1 |
| `SessionProvider` | `elMeuRol` | 1 |
| | | **12** |

El detall que més crida l'atenció és `src/data/supabase/content.js:76-81`:

```js
export async function loadMur(...)        { const data = await loadAppData(...); return { feedPosts, events, marketItems }; }
export async function loadMultimedia(...) { const data = await loadAppData(...); return { mediaItems }; }
```

Les dues funcions descarreguen **`app_content` sencer, més 50 publicacions, més 50 notes**, i després
en tiren el 80 %. I es fan les dues, sempre, encara que l'usuari entre al Xat i no òbriga mai ni el
Mur ni Multimèdia. **És la mateixa descàrrega feta dos vegades per a llançar-ne la major part.**

Hi ha a més una incoherència que provocarà un error difícil de reproduir: `MurContext.jsx:41` i
`NotesDataContext.jsx:85` depenen de `generacio` (el comptador de canvi de sessió), però
`MultimediaContext.jsx:38` **no**. En canviar de sessió, Multimèdia es queda amb les dades de l'usuari
anterior fins que alguna altra cosa el desperte.

### C6 · P1 · El Mur té un sostre dur de 50 publicacions i ningú ho sap

`src/data/supabase/content.js:21` i `notes.js:21-22`:

```
/rest/v1/section_submissions?select=*&...&order=created_at.desc&limit=50
```

No és paginació. **És truncament silenciós.** La publicació número 51 d'un poble deixa d'existir per a
tothom. No hi ha «carregar-ne més», no hi ha compensació, no hi ha avís. Les notes tenen el mateix
`limit=50` per usuari. Coincidix amb F11 de Codex, i afig: el mateix patró es repetix al padró del
poble — `membres_del_poble` té `p_limit integer default 100`
(`supabase/migrations/260908_xat_v2_membres.sql:35-38`) i `src/data/supabase/xat.js:160` **no li'n passa
cap**, així que el veí 101 no apareix mai al selector per a obrir conversa.

Per a un poble de 200 ànimes és invisible. Per a 10.000, el producte **no funciona**, i falla per la
banda pitjor: sense error.

### C7 · P1 · Un sol registre de la base de dades pot tancar les altes de tota la plataforma

`supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:42-86`. El trigger `handle_new_user`
s'executa en cada alta i comença així:

```sql
select valor::uuid into v_tenant from private.ajustos where clau = 'poble_per_defecte';
if v_tenant is null then raise exception 'SDP-REG-001: Poble no resolt...';
if not exists (select 1 from public.towns t where t.id = v_tenant and t.is_open = true)
  then raise exception 'SDP-REG-003: ...';
```

Una excepció dins d'un trigger **avorta la transacció**: l'alta falla amb un 500 genèric. Per tant,
si algú lleva la fila `poble_per_defecte`, o posa `is_open = false` al poble, o el poble s'esborra,
**cap persona del món pot registrar-se a Sóc de Poble**, i el missatge que rep l'usuari no diu per què.

És un disseny defensiu correcte en intenció (impedir que el client falsifique el seu poble) amb un
mode de fallada de tot-o-res. El mateix trigger inserix a `public.profiles` **sense `on conflict`**
(línies 64-72), mentre que la inserció a `town_memberships` sí que en porta: una asimetria que no
sembla volguda.

I una conseqüència d'abast més ample: **totes les altes van al mateix poble.** La secció «Pobles»
existix, el `tenant_id` travessa tot el model de dades, però el moment de l'alta és mono-tenant per
construcció. La multi-tenància és real a la base de dades i **no està cablejada al registre**.

### C8 · P1 · L'escriptura de l'usuari no sobreviu a tancar la pestanya

`src/sections/notes/GlobalSaveManager.js` fa el desat en segon pla: acumulació 600 ms, cua serialitzada
per nota, revisió optimista. Ben pensat. Però:

- Si el desat falla per xarxa, `GlobalSaveManager.js:66` mostra *«El canvi no ha arribat al servidor.
  Reintenta-ho.»* i **el descarta de la cua. No hi ha reintent, ni cua persistent, ni indicador
  d'estat.**
- L'única xarxa de seguretat són els esborranys de `NotesContext.jsx:90`, que van a **`sessionStorage`**
  via `setEfimer`. Sobreviuen a recarregar la pàgina. **No sobreviuen a tancar-la.**
- `setEfimer` s'empassa `QuotaExceededError` en silenci (`src/config/storage.js:70`). En superar la
  quota, els esborranys deixen de guardar-se **sense cap senyal**.

El contracte escrit a `src/config/storage.js:5-8` diu, literalment: *«Només identitat i preferències.
Res que puga créixer.»* Els esborranys de notes són HTML arbitrari amb imatges: creixen per definició.
La porta de persistència vigila l'accés **directe** a `sessionStorage` (i ho fa bé, confirmat en
execució), però **no pot vigilar què passa a través de `setEfimer`**, que és la porta legítima. El
contracte està escrit i no està mecanitzat.

Açò importa més ací que en cap altre projecte, perquè la vostra usuària tipus escriu des d'un bancal
amb cobertura roïna. El comentari de `NotesDataContext.jsx:130-132` ho diu amb eixes paraules exactes.
**L'arquitectura reconeix el problema i no el resol.** Coincidix amb F04 de Codex.

### C9 · P2 · Un WebSocket obert a una publicació que està desactivada a posta

`src/sections/xat/XatContext.jsx:266` obri un canal Realtime de Supabase per al fil actiu. La migració
`supabase/migrations/260908_xat_v2_correccions.sql:350-375` deixa el bloc que hi afegiria
`xat_missatges` **comentat**, i el comentari és exemplar:

> *«Mentre no hi estiguen, qualsevol subscripció Realtime es connecta, no dona cap error i no rep res
> mai: el pitjor mode de fallada que hi ha.»*

És exactament el que passa. Cada persona amb una conversa oberta manté una connexió WebSocket contra
els límits de connexions concurrents de Supabase **a canvi de zero missatges**. Amb 10.000 usuaris
és un dels primers recursos que s'esgotarà, i s'esgotarà sense donar cap servei.

Hi ha a més una fuita de canals al mateix bloc: `connectaRealtime()` (línies 260-298) fa el
`unsubscribe` de manera síncrona però l'assignació de la subscripció nova arriba dins d'un `.then()`
(línia 293-296). Si es crida dos vegades de pressa — i es crida, en cada canvi de visibilitat de la
pestanya (línia 338) — la primera subscripció es perd sense donar-se de baixa.

### C10 · P2 · Cada imatge privada és una petició de firma, i caduquen en una hora

`src/data/supabase/storage.js:150` genera una URL firmada de 3.600 s **cada vegada que es demana**.
`src/hooks/useResolvedAsset.js:29` la demana **en cada muntatge del component**, sense memòria cau ni
deduplicació. Una nota amb 20 fotos són 20 peticions de firma cada vegada que es pinta. I passada una
hora amb la pàgina oberta, totes les imatges es trenquen sense que res les renove.

### C11 · P2 · Quatre proveïdors es donen d'alta i de baixa d'un esdeveniment en cada repintada

`src/app/contexts/useRecarregaExterna.jsx:19` té `[onRefresh]` com a dependència, i els quatre
proveïdors li passen una funció fletxa creada de nou en cada render
(`CoreContentContext.jsx:68`, `MurContext.jsx:64`, `MultimediaContext.jsx:63`,
`NotesDataContext.jsx:156`). El resultat és `addEventListener`/`removeEventListener` en cada repintada
de cada proveïdor. No hi ha fuita — la neteja s'executa — però és treball pur perdut en el camí calent.

### C12 · P2 · Fuites lentes i estat mort

- `GlobalSaveManager.js:7` — `knownRevisions` és un `Map` d'un singleton de mòdul que **no es buida
  mai**, ni en tancar sessió. Creix amb cada nota editada durant tota la vida de la pestanya.
- `IdentitatContext.jsx:11` — `memberships` és sempre `[]`; `setMemberships` no es crida enlloc.
  Estat mort que dona aparença de validació.
- `IdentitatContext.jsx:22-25` — la comprovació que la persona pertany de veritat a l'entitat que diu
  representar **està comentada** (línia 24). Qui edite la preferència a l'emmagatzematge del navegador
  actua com eixa entitat **a la interfície**. Si RLS aguanta al servidor és cosmètic; si algun dia
  algú confia en `actorId` per a una decisió d'escriptura, deixa de ser-ho. Un `// TODO` comentat en
  una ruta d'autorització és deute perillós.
- `src/data/identitat.js:120` — `usuariDeSessio()` crida `purgaLlegat()` **cada vegada**, i això fa
  una expressió regular sobre `document.cookie` i una lectura d'emmagatzematge local. És una migració
  d'una sola vegada executant-se per sempre en un camí calent.

### C13 · P2 · Els dos forats que queden a les portes de seguretat

La Porta RLS ix verda. Cal saber què vol dir exactament eixe verd:

1. **És anàlisi de text, no de base de dades.** `tooling/gates/tractor-rls.mjs` llig els fitxers
   `.sql` i no es connecta mai a Postgres. No sap quines migracions s'han aplicat de veritat, ni en
   quin ordre, ni si algú ha tocat una política des del panell de Supabase. **La seguretat d'aquest
   projecte viu íntegrament a RLS, i res comprova l'estat efectiu de RLS.** Aquest és el forat
   estructural més gran del sistema immunitari.
2. **La llei R5 és cega al rol.** `tractor-rls.mjs:229-236` comprova que existisca *alguna* política
   per a la taula i l'acció, **sense mirar a quin rol es concedix el permís**.
   `supabase/migrations/260914_0000_schema_notes.sql:50` fa `grant select on table public.notes to anon`
   mentre les quatre polítiques són `to authenticated`. Ací l'efecte és benigne (sense política, `anon`
   no veu res), però la porta diu «hi ha una política que ho limita» quan el que ha comprovat és una
   altra cosa. La llei no verifica el que declara verificar.
3. **R3 exempta `app_content`** (`tractor-rls.mjs:78`), que és precisament la taula on viuen `agents`
   — persones. La migració `260916_0600` va corregir la fuita amb `using (key <> 'agents')`, però
   l'exempció seguix allí: si algú reintroduïx `using (true)` en eixa taula, la porta continuarà verda.

### C14 · P2 · Zero observabilitat i zero proves on més falta fan

- **Cap telemetria.** Ni Sentry, ni cap registre remot, ni `sendBeacon`. `ErrorBoundary.jsx:12` i
  `RouteErrorBoundary` (`App.jsx:533`) només fan `console.error`. **Amb 10.000 usuaris, us
  n'assabentareu dels errors quan algú telefone.**
- **Les proves no toquen la capa de dades.** 12 fitxers de prova per a 191 fitxers font; 47 proves,
  2 fallant. Cap prova per a: `identitat.js`, `sessionService.js`, `backendPort.js`, `contracte.js`,
  `host.js`, `oauthRelay.js`, `sanitize.js`, i **cap dels 10 mòduls de `src/data/supabase/`**. El
  `sanitize.js` és l'única defensa contra XSS del producte i ningú comprova que faça el que diu —
  per això la troballa C1 ha pogut entrar sense que res s'immute.
- **CSP mínima.** `vercel.json:8` declara només `frame-ancestors`. Sense `default-src`, `script-src`
  ni `connect-src`, i sense `nosniff`, `Referrer-Policy` ni HSTS. Per a una aplicació que accepta HTML
  d'usuari i el saneja **al client**, la segona línia de defensa no existix.

### C15 · P3 · Coses que fan soroll i confonen el relleu

- `src/main.jsx` **no crida mai `exposaGlobal()`**. Només ho fa `src/embed.jsx:21`. És a dir:
  `window.SocDePoble` — tota l'API d'integració amb l'amfitrió — **no existix a l'aplicació web de
  producció**, només al bundle de WordPress. La Llei de l'Enxufabilitat només és operativa en una de
  les dues distribucions.
- El bundle autònom és **un únic fitxer IIFE d'1,76 MB** (`wordpress-plugin/dist/soc-de-poble.standalone.js`).
  `vite.standalone.config.js:46` força `formats: ['iife']`, que impedix qualsevol divisió de codi: TipTap,
  Supabase i les 22 seccions es descarreguen senceres abans de pintar res. A la web sí que està ben
  dividit (entrada 486 kB, `NotesSection` 484 kB diferit, Supabase 250 kB diferit).
- `sanitizeHtml` **destruïx el ratllat i el subratllat** (`<s>` i `<u>` no són a `ALLOWED_TAGS`,
  `sanitize.js:74-78`) i **lleva l'atribut `class`**, que és el que `extensions/index.js:146` posa a
  les imatges (`sdp-imatge-cos`). Comprovat en el banc de proves. Text amb format que l'usuari aplica
  i que desapareix en desar.
- 55 `console.*` i 10 `TODO/FIXME/HACK` a `src/`.
- El router està escrit a mà (`src/app/contexts/RouterContext.jsx`, 356 línies). Funciona i està bé
  fet. Però és infraestructura que el relleu haurà d'aprendre i mantindre, sense documentació externa,
  sense comunitat i **sense cap prova**. `useLocation().state` (línia 99) llig `window.history.state`
  directament: no és reactiu i, dins de `MemoryRouter`, llig l'estat de la pàgina amfitriona.

---

## 6 · Missió 3 · Estrès teòric amb 10.000 usuaris

### 6.1 · Què no serà el problema

Descarte tres sospitosos habituals amb evidència:

- **El navegador.** Preact amb `preact/compat`, `lazy()` per secció, memoïtzació raonable. Un client
  no sap quants altres n'hi ha.
- **La divisió de codi de la web.** Els números reals del `dist/` d'avui són correctes.
- **Contenció d'escriptura sobre `app_content`.** El client no hi escriu mai.

### 6.2 · El que sí que serà el problema, amb els números

**a) Ràfega d'entrada.** 12 peticions per usuari abans de pintar (§C5). Si els 10.000 entren repartits
en 60 s: **≈ 2.000 peticions/s de pic**, de les quals 20.000 descarreguen el catàleg sencer (dos per
usuari). PostgREST i el bloc de connexions de Supabase es saturen molt abans d'arribar-hi.

**b) El sondeig, que és el de veritat.** `XatContext.jsx:46` fixa `MS_LLISTA = 25000` i el temporitzador
s'arma a `XatContext.jsx:312` **per a tot usuari identificat amb la pestanya visible, estiga on estiga
dins de l'aplicació**.

> 10.000 usuaris ÷ 25 s = **400 peticions/s sostingudes, per sempre**, només per a refrescar una
> llista de converses que la majoria no està mirant.

Cada una és `xat_fils_meus`, que per a cada fil fa un `count(*)` sobre `xat_missatges`
(`260908_xat_v2_correccions.sql:231-242`) i un `left join lateral` per a l'últim missatge. No és una
consulta barata multiplicada per 400 cada segon.

**c) El fil obert.** `MS_FIL = 5000` (`XatContext.jsx:47`, armat a la línia 322) i cada volta torna
**fins a 200 missatges sencers** (`xat.js:75-78`). Si un 20 % té una conversa oberta:
**2.000 ÷ 5 s = 400 peticions/s més**, cada una movent fins a 200 files. És re-descarregar la mateixa
conversa 12 vegades per minut per a detectar un missatge nou.

**d) WebSockets inútils.** §C9. Un canal per conversa oberta contra una publicació desactivada.

**e) El coll d'ampolla que no és tècnic.** Amb `limit=50`, el Mur de 10.000 veïns mostra les últimes
50 publicacions. Amb `p_limit default 100`, el padró en mostra 100. **El producte deixa de funcionar
molt abans que el servidor deixe de respondre.**

### 6.3 · Mecanismes d'estabilització, per ordre de rendibilitat

1. **Muntar els proveïdors dins de la seua ruta**, no a l'arrel (`App.jsx:488-501`), i deixar que
   `loadMur` i `loadMultimedia` demanen només les seues claus en compte de `loadAppData` sencer.
   Divideix la ràfega d'entrada per un factor de 3 a 4 sense canviar cap contracte.
2. **Aturar el sondeig quan la secció no està a la pantalla.** Avui només s'atura amb la pestanya
   amagada (`XatContext.jsx:258`). Que el sondeig de fils viva dins de `XatSection` i no dins de
   `XatProvider` lleva de colp el 80 % de les 400 pet./s.
3. **Sondeig incremental.** `xat_missatges_del_fil` amb un paràmetre `desde timestamptz` i el client
   demanant només el que és posterior a l'últim missatge que té. Mateixa freqüència, una fracció de
   les dades.
4. **Decadència exponencial amb dispersió.** L'interval ha de créixer quan no hi ha novetats
   (25 s → 50 s → 120 s) i tornar a 25 s en haver-hi activitat, amb un desfasament aleatori inicial
   perquè 10.000 clients no s'alineen en la mateixa vora de segon. **Sense dispersió, un tall de xarxa
   de 30 s fa que els 10.000 tornen exactament alhora.**
5. **O Realtime de veritat, o llevar-lo.** Activar la publicació i comprovar RLS de Realtime al panell,
   o llevar la subscripció. El que no pot quedar-se és el tercer estat: obert i inútil.
6. **Paginació real** al Mur i al padró, amb cursor sobre `created_at`. És l'únic dels sis que
   requerix interfície nova.
7. **Cachejar el catàleg.** `app_content` canvia poques vegades al dia: una capçalera `Cache-Control`
   i `ETag` al davant lleven la major part de l'egress d'arrencada. **[SUPÒSIT]** — no he comprovat
   quines capçaleres emet PostgREST en aquesta instal·lació.

---

## 7 · Missió 4 · La nota, sense endolcir

### 7.1 · Per eixos

| Eix | Nota | Per què |
| --- | --- | --- |
| Intenció, documentació i cultura | **9,0** | Els comentaris forenses (`identitat.js`, `PedraSecaEmbed.jsx`, la migració del xat) són millors que els de la majoria de productes comercials. Açò és patrimoni. |
| Frontera i enxufabilitat del backend | **6,5** | La frontera existix, està aïllada i té porta mecànica. La penalització és el contracte tot-o-res (§4.2). |
| Seguretat del servidor (SQL/RLS) | **7,0** | `search_path` net, `revoke` sistemàtic, rate-limit atòmic, divulgació mínima al padró. Baixa perquè res comprova l'estat efectiu (§C13). |
| Seguretat del client | **5,0** | Sanejador únic i ben col·locat, però sense proves, amb un ganxo que destruïx dades legítimes (C1) i sense CSP real. |
| Model de dades i escalabilitat | **2,5** | Blobs, `limit=50`, sondeig de 25 s, sense paginació. El sostre no és lluny: ja hi som. |
| Durabilitat de l'escriptura de l'usuari | **3,0** | Sense cua persistent ni reintent, esborranys a `sessionStorage`, i les fotos s'esborren soles. |
| Resiliència operativa | **2,0** | Artefacte construït sense credencials, desplegaments que trenquen sessions, zero telemetria. |
| Xarxa de seguretat per al relleu | **3,0** | 47 proves, capa de dades a zero, i la cadena de portes morta a la tercera passa. |

### 7.2 · Nota global

# 4,3 / 10

I la lectura d'eixe número, que importa més que el número:

**No és un 4,3 de projecte mediocre. És un 7,5 de disseny multiplicat per un 2 d'execució operativa.**
El que li falta a Sóc de Poble no és talent ni criteri — n'hi ha de sobra i es veu en cada fitxer. El
que li falta és el tram final: que el que està pensat arribe intacte a la pantalla d'una senyora de
78 anys al bancal. Ara mateix hi ha un artefacte que no connecta, un sistema immunitari apagat per una
advertència de linter, i unes fotos que desapareixen soles.

**Al somni de resiliència extrema li falten tres coses, no tres-centes:**

1. Que el contracte deixe de ser tot-o-res (§4.2). Una vesprada.
2. Que la cadena de portes torne a executar-se de dalt a baix, i que la capa de dades tinga proves.
   Una setmana.
3. Que l'escriptura de l'usuari no es puga perdre mai: cua persistent, reintent, i un indicador honest
   de «desat / pendent / fallat». Una setmana.

Fetes eixes tres, aquesta arquitectura val un 7 llarg i **sí que es pot deixar en mans d'algú altre.**
Sense fer-les, la qualitat del pensament que hi ha invertit no arriba a l'usuari, i el dia que ni el
Mestre ni la IAIA estiguen, el relleu trobarà un sistema que li diu que tot està verd mentre no
comprova res.

---

## 8 · Pla proposat, per ordre d'execució

**Onada 0 — abans de qualsevol usuari real (hores)**

| | Acció | On |
| --- | --- | --- |
| 1 | Corregir el ganxo d'imatges perquè `sdp-media://` siga origen propi, **i escriure la prova** | `src/utils/sanitize.js:40`, `NotesContext.jsx:17` |
| 2 | Fer que `validatePublicCredentials` falle quan falten credencials | `src/config/publicCredentials.js:6-8` |
| 3 | Llevar la variable sense usar i tornar a passar la cadena sencera | `tooling/wiki/tractor-frontera-auth.mjs:47` |
| 4 | Aplicar `ambReintent` als 22 `lazy()` de l'aplicació | `src/app/App.jsx:17-39` |

**Onada 1 — el canvi radical (una vesprada)**

| | Acció | On |
| --- | --- | --- |
| 5 | Buidar `CONTRACTE_NUCLI` i repartir-lo en `CAPACITATS` per domini | `src/data/contracte.js` |
| 6 | Que cada secció interrogue `teCapacitat()` i es degrade | seccions |
| 7 | Ampliar `tractor-enxufe.mjs` amb una llei E5: cap mètode nou entra al nucli sense acta | `tooling/gates/` |

**Onada 2 — que aguante la gent (una setmana)**

| | Acció | On |
| --- | --- | --- |
| 8 | Proveïdors dins de la ruta; `loadMur`/`loadMultimedia` sense `loadAppData` | `App.jsx:488-501`, `content.js:76-81` |
| 9 | Sondeig dins de `XatSection`, incremental, amb decadència i dispersió | `XatContext.jsx:250-358` |
| 10 | Paginació per cursor al Mur i al padró; llevar els `limit=50` i el `default 100` | `content.js:21`, `xat.js:160` |
| 11 | Decidir Realtime: activar la publicació o llevar la subscripció | migració + `XatContext.jsx:266` |

**Onada 3 — que no es perda res i se sàpiga què passa (una setmana)**

| | Acció | On |
| --- | --- | --- |
| 12 | Cua d'escriptura persistent amb reintent i indicador d'estat | `GlobalSaveManager.js` |
| 13 | Proves per a `identitat`, `sessionService`, `backendPort`, `sanitize` i `supabase/*` | `src/` |
| 14 | Telemetria mínima d'errors amb consentiment | `ErrorBoundary.jsx`, `App.jsx:533` |
| 15 | CSP completa, `nosniff`, `Referrer-Policy` | `vercel.json` |
| 16 | Verificació de RLS **contra una base de dades real** a CI | `tooling/gates/tractor-rls.mjs` |

---

## 9 · Incògnites

- **No he pogut consultar cap Postgres.** Tot el que dic de RLS ix del text de les migracions. L'estat
  efectiu de la base de dades de producció és desconegut per a mi, i C13 diu que també ho és per a les
  portes.
- **Els números de l'estrès són aritmètica sobre constants llegides al codi**, no mesures. 400 pet./s
  ix de `MS_LLISTA = 25000` i de la premissa de 10.000 sessions visibles simultànies. Amb sessions
  reals (pestanyes amagades, mòbils suspesos) el número baixa; el mecanisme no canvia.
- **L'egress d'arrencada depén de la mida real de `app_content`**, que depén de la llavor de cada
  poble. No l'he mesurat. [SUPÒSIT]
- **No he provat el cicle de vida del Custom Element en un navegador real**, com ja advertix
  `src/host.js:63-69`. La meua revisió és estàtica.
- **L'arbre tenia 124 canvis locals no confirmats** en el moment del tall, i almenys un altre agent
  editava `src/` en paral·lel. Les cites estan verificades contra el tall; si algú ha tocat eixos
  fitxers després, caldrà tornar a comprovar-les.

---

## 10 · Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura. 226 fitxers de `src/`,
      14 migracions, 43 portes; 30 portes, el linter i les proves **executats**.
- [x] He citat correctament la ruta i les línies del codi original. Totes verificades contra el tall
      `214f5c7c` + canvis locals, amb empremta md5 a l'inici i al final.
- [x] Cap nom de fitxer, funció o variable inventat. On una cosa no existix (els CRDT) ho dic
      explícitament en compte d'auditar-la.
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites. Tres hipòtesis meues refutades
      apareixen al §2 en compte de com a troballes.
- [ ] **El document passa `tractor-frontmatter.mjs --estricte`.** No ho he pogut comprovar per
      contenció: eixa porta escriu a `.agents/deute/.frontmatter-deute.json`. El frontmatter s'ha
      redactat contra `tooling/wiki/schema.json` (`description` de 12-140 caràcters, `type` i `tags`
      dins dels enumerats, cap clau fora de l'esquema). **Que ho execute la IAIA MarIA.**
