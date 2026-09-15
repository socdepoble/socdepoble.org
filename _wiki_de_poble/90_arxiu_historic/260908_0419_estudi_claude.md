---
tipus: acta
estat: esborrany
description: Acta del Consell — auditoria destructiva final i maduració de skills (Seient Auditor Sènior)
---

# 📜 260908 — ACTA DEL CONSELL: AUDITORIA DESTRUCTIVA FINAL I MADURACIÓ COGNITIVA

**Bundle jutjat:** `260908_0401_BUNDLE_auditoria.md` · `sdp.bundle.v2` · 425 fitxers · 3.290.530 bytes
**Seient:** Auditor Sènior (Consell de les Petorretes)
**Veredicte:** **NO-GO**

---

## 0 · Verificació del bundle (primer, no em crec el capçal)

He extret el cos i he comparat contra el `MANIFEST`. Resultat:

| Comprovació | Resultat |
|---|---|
| Fitxers al manifest | 425 |
| Fitxers extrets del cos | 425 |
| sha256 coincidents | **425 / 425** |
| Al manifest i absents del cos | 0 |
| Al cos i absents del manifest | 0 |

**Aquest és el primer bundle que sobreviu al seu propi contracte.** El patró històric —«el bundle diu que és complet i li falten fitxers»— està trencat. Això és mèrit, i el dic abans de res perquè la resta de l'acta és dura i vull que quede clar que no la dicta la mandra.

Una única objecció al manifest: `vite.standalone.config.js` apareix a `absents_no_critics`. **Eixa classificació és falsa.** Vegeu P0-1.

---

## 1 · Bloquejos P0

### P0-1 · El lliurament a Sollutia no es pot construir

- `package.json` no té `build:wp` ni cap equivalent. `build:web` és `vite build` pla, que emet una app ESM des d'`index.html`.
- `vite.standalone.config.js` **no és al disc**.
- `src/host.js` dedica 60 línies de capçalera a explicar com Sollutia carrega un bundle **no-ESM** amb un `<script>` pla que crida `window.SocDePoble.configura()`.

El repositori documenta amb precisió notarial un artefacte que no sap produir. Tota l'arquitectura de dues fases (`configura()` → `arrenca()`) és correcta i inútil mentre no existisca el build que la fa arribar al host. Si Sollutia demana el paquet demà, no hi ha res a entregar.

Un detall que agreuja: `arrencaAuto()` usa `setTimeout(…, 0)`. La pròpia capçalera admet que amb `defer`, `async` o `type="module"` el host **arriba tard** i `configura()` llançarà. És a dir: la finestra d'injecció depén de com Sollutia escriga l'etiqueta `<script>`, i això no està sota el vostre control ni verificat per cap porta.

### P0-2 · El segell no segella

`tooling/gates/segella.mjs` és l'última porta de la cadena, es diu «Llei Z», i **no compara res**:

```js
const seal = { timestamp: …, hash: finalHash, filesCount: files.length };
fs.writeFileSync(sealFile, JSON.stringify(seal, null, 2));
process.exit(0);
```

Calcula el hash del que hi ha al disc i **sobreescriu** el segell. Sempre ix 0. No pot fallar mai. La probabilitat que detecte una manipulació és exactament zero, i com que és l'**última** porta, blanqueja qualsevol deriva introduïda durant la mateixa execució.

Prova que ja ha passat: `SKILLS_SEAL.json` declara `filesCount: 11`. Al disc hi ha **10** fitxers sota `.agents/skills/`. O el segell és ranci, o el filtre d'extensions del bundle ha amagat un fitxer. **Cap mecanisme del projecte pot distingir els dos casos**, perquè ningú compara mai. Un segell criptogràfic que només sap escriure és un tampó de goma amb sha256.

### P0-3 · L'índex canònic de skills té el 71% dels enllaços morts

`.agents/skills/00_INDEX_SKILLS.md` diu de si mateix: *«l'únic registre oficial»*, *«Totes les capacitats de l'agent resideixen exclusivament aquí»*.

| | |
|---|---|
| Skills declarades a la secció curada | 14 |
| Enllaços que apunten a carpetes inexistents | **10** |
| Enllaços vius | 4 |
| Skills reals al disc absents de la secció curada | 5 |

Morts: `abocament-total`, `guia-ampliacio`, `core-higiene-reflexa`, `identity-iaia-core`, `reflexio-previa`, `efecte-matrix`, `council-review`, `socdepoble-workflow`, `trellat`, `identity-iaia-voice`.

Les 5 skills reals (`skill-acte-reflex`, `skill-cicle-de-vida`, `skill-consell-bundle`, `skill-estudi-mercat`, `skill-iaia-identitat`) només apareixen al bloc autogenerat del llaurador, amb una nota que diu «mou cada enllaç a la secció temàtica que li toque». Ningú l'ha mogut. La meitat humana de l'índex descriu un cervell que ja no existix; la meitat automàtica descriu el que hi ha però no té autoritat declarada.

**L'Efecte Matrix no està resolt.** Es va arreglar la regex de `matrix.mjs`; el que està trencat ara és el mapa que llig.

I ací ve el que fa mal: `tooling/brain/matrix.mjs` (línies 71-75) **fa exactament aquesta comprovació** i ix amb codi 2. Existix, és correcta, i està connectada com a hook `PreInvocation` (`.agents/hooks.json` → `preflight_matrix_wrapper.mjs`), **no com a porta de la cadena**. Conseqüències:

- `npm run porta` (39 portes) mai valida el cervell. `npm run build` tampoc.
- El hook sí que hauria d'estar cridant `[MATRIX ROIG]` **cada sessió**. O els hooks no s'executen a l'entorn real, o fa temps que l'avís s'ignora.

La detecció no és el problema. El problema és què passa quan detecta.

### P0-4 · Injecció de comandes al hook de preflight

`.agents/hooks/preflight_matrix_wrapper.mjs:45`

```js
execSync(`node tooling/brain/matrix.mjs --json "$(cat .matrix_tmp_prompt.txt)"`, …)
```

El fitxer temporal es va afegir per «passar-ho de forma segura». `$(cat …)` dins de cometes dobles **torna a fer substitució de comandes**: el contingut del prompt acaba a la línia d'ordres i el shell l'avalua. Un prompt que continga `$(…)` o accents oberts executa codi arbitrari a la màquina del Mestre.

El vector no és hipotètic en aquest projecte: els prompts porten bundles d'altres IAs, retalls de la wiki, text del Mur. Qualsevol text de tercers que arribe a la petició és executable.

A més, `.matrix_tmp_prompt.txt` s'escriu a `process.cwd()` amb nom fix: dues sessions simultànies es trepitgen.

Això contradiu frontalment `seguretat_execucio.md` i el SDP-LOCK. La correcció és trivial: passar el prompt per `stdin` o per `argv` amb `execFileSync`, mai pel shell.

### P0-5 · Umami no s'ha eliminat

La petorreta afirma: *«s'ha eliminat Umami per garantir zero telemetria oculta»*. Al bundle:

- `src/sections/text/TelemetryDashboard.jsx` — component «Telemetria Oberta» amb **quatre targetes** que obrin `https://cloud.umami.is/analytics/eu/websites/6ffce900-c41a-470e-9b12-38fb6028db18`, i un peu que diu: *«Aquest quadre de comandament és un resum de les estadístiques públiques d'Umami»*.
- `src/sections/disseny/DesignSection.jsx:836` — *«Panell d'Umami (Integració directa)»*.
- `src/sections/disseny/DesignSection.jsx:857` — *«Dades d'Umami Analytics · Actualització en temps real»*.

L'identificador del lloc va compilat i s'envia a cada client. Només hi ha dues lectures possibles i cap és bona: **o la propietat d'Umami segueix viva** i llavors hi ha un tercer processant dades que la política de privacitat nega explícitament, **o no hi és** i llavors la pàgina de transparència afirma tindre unes estadístiques que no existixen. El P0 de credibilitat del «Telemetria Oberta» amb xifres inventades no s'ha tancat: s'ha mogut de lloc.

### P0-6 · Dues constitucions diferents, i totes dues menten

Les pàgines legals viuen duplicades: `supabase/seed.sql` (BD) i `src/sections/text/pageContent.js` (fallback compilat). **No diuen el mateix.**

| | `seed.sql` | `pageContent.js` |
|---|---|---|
| Constitució, punt 5 | «**Online-First Radical**: La persistència principal sempre ha de prioritzar l'emmagatzematge local segur» | «**Xarxa Verificada i Online-First**… ADR-2026-08» |
| Legal §2 | «s'emmagatzemen **temporalment** als nostres servidors» | «s'emmagatzemen als nostres servidors… en un **model Online-First**» |

Qui guanya depén de si la BD respon. La constitució publicada del projecte és no-determinista.

I hi ha un tros que és fals **a les dues còpies**, dins de la política de privacitat:

> **3. Emmagatzematge Local i Nodes (El Online-First)** — «L'aplicació es concep per descarregar la memòria cau al teu propi dispositiu… part important de la informació **es processa directament en el teu maquinari**… reduïm l'exposició contínua de les dades a l'exterior».

Sota Online-First això és **fals**. No és una incoherència de documentació: és una descripció incorrecta del tractament de dades dins d'un text amb valor jurídic (RGPD art. 13). Descriure malament on i com es processen les dades és un defecte de compliment, no un deute tècnic.

Bonus, al full de ruta de `seed.sql`, sota l'encapçalament **«Collita Tancada (Fet)»**:

> «**La Fi de WordPress i la Sobirania Online-First** (2026-Q3) — Hem eliminat tot rastre de dependència del CMS».

Es publica com a **fet** el contrari exacte del lliurament comercial que teniu damunt de la taula.

### P0-7 · El «Dret de Supressió» és mecànicament impossible

```sql
created_by uuid not null references public.profiles(id) on delete restrict
```

`profiles.id` fa `on delete cascade` cap a `auth.users`. Per tant: si una persona ha creat mai una organització, esborrar el seu `auth.users` **falla** per la restricció. La política publicada promet *«Dret de Supressió (Oblit): Esborrar les teues dades i posts de la xarxa, aplicant el nostre protocol d'Apoptosi»*.

Prometeu per escrit una cosa que la base de dades impedix. Això és RGPD art. 17.

### P0-8 · El README desplega l'esquema dèbil

`supabase/schema.sql` i `supabase/migrations/20260908_initial_schema.sql` **divergixen**. La migració té la guarda d'immutabilitat:

```sql
if new.tenant_id != old.tenant_id then raise exception 'SDP-SEC-001: tenant_id is immutable';
if new.section_id != old.section_id then raise exception 'SDP-SEC-002: section_id is immutable';
```

`schema.sql` **no la té**. I `supabase/README.md` diu, com a procediment oficial: *«3. Executar `schema.sql`»*.

Qui seguisca la documentació desplega la versió sense la guarda: `tenant_id` mutable en UPDATE, és a dir, moviment de contingut entre pobles. Dues fonts de veritat per a l'esquema, i la documentada és la insegura.

### P0-9 · La vista pública salta l'RLS

```sql
create or replace view public.organization_directory with (security_barrier = true) as …
grant select on table public.organization_directory to anon, authenticated;
```

`security_barrier` **no té res a veure amb l'RLS**: només impedix el pushdown de funcions filtradores. Sense `security_invoker = true`, la vista s'executa amb els privilegis del propietari (`postgres`), que **ignora l'RLS** de `public.organizations`.

La taula base restringix deliberadament la lectura d'organitzacions públiques als membres del poble:

```sql
using (visibility = 'public' and (select private.is_town_member(tenant_id)))
```

La vista anul·la eixa restricció i, a sobre, la concedix a `anon`. Qualsevol que tinga la clau anònima —que va al client, és a dir, tothom— pot enumerar per PostgREST **totes les organitzacions públiques de tots els pobles**. Teniu dues declaracions de política contradictòries i guanya la que no volíeu.

Correcció: `with (security_invoker = true, security_barrier = true)`.

### P0-10 · `src/` no té ni una sola prova, i no en pot tindre

- Fitxers a `src/`: **121**. Proves sobre `src/`: **0**.
- No existix cap `vitest.config.*`. No hi ha `test.environment` declarat enlloc.
- No hi ha `jsdom` ni `happy-dom` a `package.json`. **No hi ha DOM.**
- `@testing-library/react` està instal·lat i no el pot usar ningú. La seua presència suggerix una cobertura d'UI que no existix.
- `run-portes.mjs` executa **39 portes**. **Cap** invoca `vitest`.
- `npm run build` acaba en `npm run gate`. Per tant al build tampoc s'executa mai cap prova.

Les úniques 6 proves del repositori (`tooling/wiki/tests/`) existixen i no les crida res automàticament.

Sobre un `PedraSecaEmbed.jsx` de 500 línies amb cicle de vida de Custom Element, shadow root, `adoptedStyleSheets` i desmuntatge diferit —el fitxer que la seua pròpia capçalera admet que **no s'ha pogut provar mai en navegador**— entrar a producció sense un sol test és el risc més gran del paquet.

---

## 2 · P1 — no bloquegen l'obertura, la fan inútil

**P1-1 · El Mur és invisible per a qui no ha entrat.**
`public read section_submissions` exigix `private.is_town_member(tenant_id)`, i eixa funció torna `false` quan `auth.uid()` és `null`. La política no té `to authenticated`, però el resultat és el mateix: **anònim no veu res**. Heu afegit etiquetes SEO a `index.html` que apunten a contingut que cap rastrejador ni cap veí sense sessió pot llegir. La porta del poble està tancada des de dins.

**P1-2 · Una organització mai pot tindre un segon membre.**
`organization_memberships` només té `grant select`. Zero grants d'INSERT/UPDATE/DELETE i cap política per a eixes operacions. L'únic camí d'escriptura és el trigger `add_organization_owner`. Convidar, ascendir o expulsar és impossible des del client, i fallarà en silenci.

**P1-3 · El contingut d'usuari pot vestir-se d'oficial.**
`sanitize.js` permet l'atribut `class`. Tot viu dins del mateix shadow root amb el full de la Pedra Seca adoptat. Una publicació pot portar `class="sdp-badge-system"` i renderitzar-se com una etiqueta **Sistema**. En un model de confiança de poble, un avís fals amb aparença institucional és enginyeria social barata. Cal una llista blanca de classes, o prefixar les d'usuari.

**P1-4 · Les respostes de la IAIA no estan atestades.**
La política d'inserció de `chat_messages` accepta `sender in ('me','other')` amb `owner_user_id = auth.uid()`. Un usuari pot fabricar respostes de la IAIA al seu propi fil. Només afecta el fil propi, però qualsevol captura de pantalla és falsificable i el vostre projecte viu de la credibilitat de l'agent.

**P1-5 · Sense política DELETE a `chat_messages`.** Només s'esborren en cascada amb el fil. Torna a xocar amb l'«Apoptosi» publicada.

**P1-6 · Cap CSP.** Ni a `index.html` ni enlloc. Amb HTML de BD renderitzat via `dangerouslySetInnerHTML`, la CSP és la segona barrera que no teniu.

**P1-7 · Pes al maquinari objectiu.**
`src/css/index.css` fa **131 KB** i entra al bundle com a **cadena de JavaScript** (`?inline`), així que es descarrega, es parseja com a JS i no es pot cachejar per separat. `pageContent.js` fa **118 KB** i és accessible per la cadena `config/navigation.js` → `data/sectionContent.js` → `pageContent.js`, que toquen 7 seccions no diferides. `i18n.js` fa **83 KB**. Són ~330 KB de text sense comprimir al camí primerenc, per a un dispositius moderns sota GPRS. Contradiu la vostra pròpia «Llei del Bancal».

**P1-8 · `supabase/README.md` descriu un producte anterior.** Diu *«`chat_messages` sí permet inserció pública perquè encara no hi ha login»* i *«Quan entre autenticació, caldrà substituir esta política»*. També documenta `VITE_DATA_MODE=…|local` amb caiguda a fallback local. Res d'això és cert ja.

---

## 3 · Què està ben fet (Trellat talla per les dues bandes)

- **`handle_new_user`**: insereix `town_memberships`, valida `is_open`, falla tancat amb codis tipats (`SDP-REG-001/002/003`). El bloqueig d'RLS per a usuaris nous està resolt.
- **Contracte del backend**: 24 mètodes. Port ≡ contracte ≡ `supabaseBackend`. Cap mòdul de `src/` importa `supabaseBackend` directament. La frontera és neta i el filtratge silenciós ha desaparegut.
- **`host.js`**: la cursa està ben corregida —`fase` es marca **síncronament** i la faena async viu en una promesa memoritzada. El mode estricte (injecció parcial → error) és la decisió correcta.
- **`sanitize.js`**: els ganxos s'armen en carregar el mòdul, no per crida. Prohibix `svg`/`math` (mXSS). Bloqueja imatges de tercers. És un control de seguretat que no depén de l'ordre de renderitzat.
- **`vite.config.js`**: atura el build si `VITE_SUPABASE_ANON_KEY` conté un JWT amb `role: service_role`. Barat i salva carreres.
- **`profiles`**: `visibility` bloquejat a `'private'` pel grant (`update (full_name)`) **i** pel `with check` de la política. La impossibilitat de perfils públics de persona està imposada per esquema, no per convenció. És la millor peça de disseny del paquet.
- **`verify.mjs` Llei 6**: denega crear documents sense rebut Matrix viu, amb finestra temporal. Ací sí que «Saber = Fer».

---

## 4 · Maduració de l'arquitectura cognitiva

El diagnòstic en una línia: **el cervell sap detectar-se malalt i no té cap mecanisme obligat a escoltar el diagnòstic.** L'etapa infantil no s'ha acabat perquè falten skills; s'ha acabat perquè les skills ja no es poden verificar entre elles.

### 4.1 · Convertir el segell en un verificador (P0-2)

`segella.mjs` ha de tindre dos modes i la cadena només pot usar-ne un:

- `--verifica` → recalcula, **compara** amb `SKILLS_SEAL.json`, ix **1** si difereix. És el que entra a `run-portes.mjs`.
- `--escriu` → l'únic que sobreescriu. Acte deliberat, mai dins de la cadena.

I moure'l del final al **principi**. Un segell que es valida després de tot el que podria haver-lo trencat no valida res.

### 4.2 · Promoure `matrix.mjs` de hook a porta (P0-3)

Afegir `porta:matrix` a `package.json` i posar-la com a **primer** pas de `run-portes.mjs`. El cervell es valida abans que res, no només dins d'una sessió interactiva amb hooks actius. Avui la integritat cognitiva depén de si algú obri l'agent; ha de dependre del build.

### 4.3 · L'índex ha de ser una projecció, no un document

Els 10 enllaços morts viuen tots a la **meitat escrita a mà**. Mentre l'índex siga editable per humans, tornarà a divergir. Proposta:

- La categoria passa al frontmatter de cada `SKILL.md`: `categoria: transversal | tasca | domini`.
- `build_skills_index.mjs` genera `00_INDEX_SKILLS.md` **sencer** des del disc.
- Una porta refusa qualsevol canvi manual al fitxer generat (mateixa mecànica que el bloc del llaurador, però sobre el document complet).

El judici humà no desapareix: es mou al lloc on el pot verificar una màquina.

### 4.4 · El salt a l'adultesa: skills que poden demostrar que han actuat

Avui **cada skill és prosa**. Una skill madura ha de portar al frontmatter:

```yaml
name: universal-page
categoria: domini
triggers_on: [...]
verifica_amb: tooling/gates/tractor-graella.mjs   # la prova que la skill s'ha aplicat
prohibeix: [tractor-estucat, design_guard]        # portes que han de passar si s'invoca
```

Regla derivada: **una skill sense `verifica_amb` és consultiva, no executiva**, i l'índex l'ha d'etiquetar com a tal. Això força una classificació honesta del cervell —quantes de les 9 skills poden provar el seu efecte?— i mata la categoria d'skills que només diuen coses boniques. És exactament el que ja fa `03_Consola_Termodinamica.md` amb les mètriques: apliqueu-ho a les capacitats.

### 4.5 · Un sol corpus executiu

Hi ha dos conjunts: `.agents/skills/` (9) i `_wiki_de_poble/02_Saber/skills/` (8). L'índex diu que només el primer és executiu, però el segon conté `MOTOR_OFFLINE.md` i `CONTINGENCIA_OFFLINE.md`, que contradiuen l'ADR-2026-08 vigent. Cal:

1. Declarar el segon conjunt **doctrinal, no executiu**, amb marca al frontmatter (`executiu: false`).
2. Una porta que refuse qualsevol skill executiva que parle de Online-First o Online-First **en present**.

### 4.6 · `tractor-veritat.mjs` — la porta que us falta

El fracàs recurrent del projecte no és tècnic, és de coherència entre el que es diu i el que es fa (P0-5, P0-6, P0-8, P1-8). Mereix una màquina pròpia. Una sola porta que compare:

- el text de les pàgines a `supabase/seed.sql`,
- el text a `src/sections/text/pageContent.js`,
- els documents legals de la wiki,

contra l'ADR vigent i contra un vocabulari prohibit (`Online-First`, `Online-First`, `Umami`, `CRDT`, `IndexedDB` en present d'indicatiu). I que **falle si les dues còpies de les pàgines no són idèntiques**. Els 250 KB de contingut duplicat entre BD i codi són una bomba de rellotgeria documental fins que una porta els force a coincidir.

### 4.7 · Higiene immediata al hook

`execFileSync('node', ['tooling/brain/matrix.mjs', '--json', prompt])`. Fora shell, fora fitxer temporal, fora cursa. Cinc minuts de faena i tanca P0-4.

---

## 5 · Puntuació de resiliència

No done un percentatge global inventat: la vostra pròpia Consola Termodinàmica ho prohibix. Cada nota va ancorada a un recompte verificable.

| Dimensió | Nota | Evidència |
|---|---|---|
| Integritat del paquet | **10 / 10** | 425/425 sha256 correctes, 0 omissions |
| Model de dades i RLS | **6 / 10** | Aïllament per `tenant_id` sòlid a 6 taules; 1 vista el salta (P0-9); 2 grants morts (P1-2) |
| Frontera del port / backend | **8 / 10** | 24/24 mètodes, 0 mòduls que la salten |
| Sanejament i XSS | **7 / 10** | DOMPurify ben armat; `class` obert; 0 CSP |
| Lliurament a Sollutia | **2 / 10** | 0 scripts de build, 0 fitxers de config, 1 fitxer d'entrada orfe |
| Verificació i portes | **3 / 10** | 39 portes, 0 proves; el segell no compara; 121 fitxers de `src/` sense cobertura |
| Coherència legal | **1 / 10** | 2 constitucions divergents, 1 política de privacitat falsa, 1 dret RGPD impossible |
| Arquitectura cognitiva | **3 / 10** | 10/14 enllaços morts a l'índex «únic registre oficial» |
| Rendiment al maquinari objectiu | **5 / 10** | ~330 KB de text al camí primerenc |

**Solidesa estructural: sòlida. Solidesa verificada: no demostrada.** Són coses diferents i el projecte les ha confós.

---

## 6 · Veredicte

# 🔴 NO-GO

No per la qualitat del codi. El codi ha millorat molt i hi ha peces —la immutabilitat de `visibility`, el port del backend, l'arrencada en dues fases— que aguantarien qualsevol revisió professional.

**El NO-GO és per tres motius, i cap és opinable:**

1. **No podeu entregar.** El build de Sollutia no existix (P0-1). Obrir sense el lliurament que justifica l'aliança no és obrir: és publicar una demo.
2. **Les pàgines legals menten sobre el tractament de dades** (P0-6) i **prometeu un dret RGPD que la BD impedix** (P0-7). Això no és deute tècnic; és exposició jurídica sobre una associació amb nom i cognoms al peu de pàgina. I la telemetria que dieu haver eliminat encara enllaça a un servei extern (P0-5).
3. **No teniu manera de saber si res d'això funciona.** 0 proves sobre 121 fitxers, un segell que no compara, i el validador del cervell fora de la cadena de build (P0-2, P0-3, P0-10).

### Ordre de faena proposat

**Abans de tornar a parlar d'obrir:**

1. P0-4 (injecció de comandes) — minuts, i és la vostra màquina.
2. P0-9 (`security_invoker`) — una línia.
3. P0-8 (esborrar `schema.sql` o fer-lo idèntic; corregir el README) — una hora.
4. P0-5 i P0-6 (Umami fora de debò; una sola font per a les pàgines legals; corregir §3 de privacitat) — mig dia. **Cap d'aquestes és negociable per pressa.**
5. P0-7 (`on delete set null` + `created_by` opcional, o taula d'atribució) — mig dia.
6. P0-2 i P0-3 (segell verificador, matrix com a primera porta) — mig dia.
7. P0-10 (`vitest.config.js` amb `environment: 'jsdom'`, i **una** prova: muntar i desmuntar `<soc-de-poble>` dos voltes) — un dia. Una prova de debò val més que 39 portes estàtiques.
8. P0-1 (build standalone) — el gros. És el camí crític del negoci.

**El Mur invisible (P1-1) l'heu de decidir vosaltres**, no jo: o obriu la lectura anònima per `tenant_id` públic, o lleveu les etiquetes SEO. Ara mateix el codi diu una cosa i el `<head>` en promet una altra.

---

**Ancoratge de Seguretat:** [[00_index_escriptori]]
