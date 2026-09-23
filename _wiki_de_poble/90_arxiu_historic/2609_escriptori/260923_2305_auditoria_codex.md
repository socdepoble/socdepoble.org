---
type: informe
status: esborrany
description: "Auditoria actualitzada de Sollutia i fortificació, amb codi concret de política de confiança, host, Frontissa i consola amb targetes Pedra Seca."
tags: [auditoria, codex, sollutia, fortificacio]
visibility: private
reflex: sdp:torn_959b7cde-5d01-40a0-a3b8-35e1d69d4c05:88debe5e-2441-424f-9b9a-c5263a4574bb
---
# Auditoria Codex — Fortificació, Sollutia i Consola Termodinàmica

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260923-2305 |
| Versió | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T23:12:40+02:00 |
| Modificació | 2026-09-23T23:58:40+02:00 |
| Propietari | Codex / Agents Locals |
| Plantilla | auditoria_canonica.md v2.0.0; prompt_local.md v2.3.0 llegit íntegrament |
| Ruta | auditoria |
| Rebut | sdp:torn_959b7cde-5d01-40a0-a3b8-35e1d69d4c05:88debe5e-2441-424f-9b9a-c5263a4574bb |
| Tall d'evidència | HEAD f03affcb33121e024f508a35ec6a50816311d731 i arbre de treball brut; hashes en Verificació |
| Aprovació humana | Auditoria, propostes de codi dins de l'informe i rèplica documental autoritzades pel prompt; producte en AFK |
| requires_human_decision | false per completar l'auditoria; el consens conjunt per implementar no es presumix |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles. Estimats: no calculats. |

## Acte reflex

Llegits íntegrament AGENTS, Genotip, índex mestre, BOOTSTRAP, protocol, plantilla local i plantilla d'auditoria retornada pel circuit documental. Aplicades les skills locals sdp-workflow i wiki-documentacio-i-reflex; consultada wiki-busca-skills i fonts tècniques oficials. Llegides les auditories prèvies de Claude/Codex i el pla compartit. No s'ha llegit `.env`, no s'ha ingerit l'arxiu històric ni s'ha generat bundle. El torn documental és `torn_959b7cde-5d01-40a0-a3b8-35e1d69d4c05`.

L'entrega conté **codi proposat**, provat només on s'indica. No s'ha aplicat a producte, scripts de control, SQL ni dependències. Els temporals de verificació s'han mantingut fora del repositori. L'actualització de relleu ESTAT/LEDGER seguix el circuit de lease i executor; no s'usa el forat auditat per escriure governança.

## Historial

- v1, 23:12–23:21: diagnòstic F1–F8 i rèplica inicial al pla.
- v2, este torn: revisió del disc després de canvis aliens entre tandes; incorpora el nou encàrrec de targetes, independència i codi de configuració dinàmica. **Substituïx el dictamen factual de v1 quan parla de client absent, comodí Supabase viu, scripts no seguits per Git o segell trencat.** El diagnòstic global continua obert per raons actuals detallades davall.

## Troballes

### Dictamen actual

**Model B parcial; no hi ha evidència suficient per encendre trànsit real ni declarar el Brain fortificat.** S'han corregit parts dels problemes antics, però les reparacions no tanquen les garanties. Supabase SdP pot preparar-se en canari independentment de l'API Sollutia. El flux de negoci és React → backendPort → Supabase SdP; la Frontissa és una font externa de lectura, no el backend de tota la UI.

### Estat revisat, amb reproduccions

| ID / prioritat | Evidència del disc actual | Acció per tancar |
| --- | --- | --- |
| R1 / P1 · C3–C4 | `tooling/gates/mutation-policy.mjs:20–31`: el punt i coma ara es denega. Però `knownRead` retorna true per `git diff --output /tmp/sdp-audit-marker`, `npm run porta:baseline`, `node tooling/gates/segella.mjs --update`, script inexistent i executor amb arguments incorrectes. Ordres passades com a dades, **mai executades**. | Operacions enumerades, executable/argv/cwd canònic i execució sense shell. Denegar flags que escriuen; separar comprovació, documentació i executor amb lease. El nom `porta` no prova que siga lectura. |
| R2 / P1 · Frontissa | `src/data/adaptadors/sollutia/client.js:10–39` **ja existix**. En doble de fetch, `llig('https://other.invalid/export', {q:'sample'})` envia GET allí; usa issuer com a base, no consulta RECURSOS, no tradueix, no envia token, no fixa redirect ni timeout. | Client de catàleg tancat i política explícita, codi davall. No denominar-lo «client absent». Falla l'ADR §3 i §4 encara que la porta estiga verda. |
| R3 / P1 · SanejaConfig | `src/PedraSecaEmbed.jsx:160–220`: el comodí `.supabase.co` **ja està retirat**. La VM DEV=false rebutja `alien.supabase.co`, però accepta `socdepoble.sollutia.com` com a **supabaseUrl**, per compartir llista entre servicis. També conserva URL amb userinfo al sanititzador; altres capes poden rebutjar-la. | Pin de projecte/clau únic al transport, confiança per rol, rebutjar userinfo/rutes inadequades, no una llista comuna. No afirmar que l'exemple de userinfo arriba a xarxa: només s'ha provat la conservació al sanejador. |
| R4 / P1 · Host | `src/host.js:127–158`: `configura` ara només desestructura auth i no injecta backend. Però ignora silenciosament la propietat backend, `arrenca` encara conserva qualsevol implementació prèvia i la prosa anuncia Model A. `src/main.jsx:27` crida arrenca sense await abans de renderitzar. | Rebutjar claus desconegudes, composició interna de l'adaptador SdP i bootstrap esperat abans de muntar. Provar Model B funcionalment, no només un freeze estructural. |
| R5 / P1 · Auth | `runtimePolicy.js:62–94` i `public/auth/callback.html`: hostname no fixa el port i els dominis codificats no es revoquen amb parentOrigins buit. `main.jsx` usa emissor/audiència diferents dels defaults de runtimePolicy. | Origen complet i una sola política. JWT decodificat no és signatura verificada. Provar emissor, aud, sub, exp i signatura contra Supabase real. |
| R6 / P1 abans de canari | `src/data/supabase/runtime.js` resol config per crida; el pin de `config.js:getClient` no protegix eixe REST. `auth.js:renova` i `oauthRelay.js:bescanvia` tenen transports propis. L'alta Google nova no acredita el tenant requerit per `handle_new_user`. | Mateix pin per REST/SDK/Auth/Storage, redirects denegats, abort i canari d'alta nova/renovació; no baixar claims ni RLS per fer-ho funcionar. |
| R7 / P1 certificació C1–C9 | `segella.mjs` ara passa amb hash 69100848…; tres scripts crítics figuren `A` en l'índex, no `??`. `doctor --ci` encara falla per symlink, baseline, corpus i bytes fora de HEAD. | No repetir «segell trencat» ni «fitxers inexistents al Git» com a actuals. Revisar i commitar conjuntament control, tests i evidències en fase autoritzada; CI i protecció remota verificades. |
| R8 / P2 · documents | Catàleg divergeix de manifest/índex, SCC detecta enllaços trencats i symlink `05_skills_superadmin`. Prompt visible v2.3.0 i router 2.2.0. | Reparació acotada de projeccions, enllaços i versions; no arxivar ni abaixar portes a cegues. |
| R9 / P2 · consola | `ConsolaSection.jsx` encara usa Pestanyes. `consola-iaia.mjs` exposa 18 skills, 38 rebuts, 0 entrades de consum, crèdits null; no hi ha cens d'artefactes ni persistència de sessions. `resumConsums` compta registres com sessions. | Patch exacte UI davall, cens definit i instrumentació real abans de presentar qualificacions diàries. |

No s'afirma que R1 siga una intrusió ja ocorreguda ni que R3 expose credencials sense control de configuració. Les proves demostren decisions errònies dels validadors. L'allowlist no és confinament del sistema operatiu. `requires_human_decision:false` per estes correccions dins de l'abast descrit; una ADR offline, un canvi de titularitat o obrir producció són decisions separades.

### C1–C9 al tall actual

| Control | Resultat verificat / límit |
| --- | --- |
| C1 origen/executor | Lease, claim i hashes passen fixtures. Segell actual vàlid; no autentica qui tinga els mateixos permisos. |
| C2 transacció | Lock, CAS, pending i replay coberts per proves locals. No s'afirma seguretat davant procés privilegiat. |
| C3 pre-hook | Reparació parcial: operadors bloquejats, mutacions encara acceptades com lectures (R1). |
| C4 clients | No acreditats activació real, timeout i fail-closed de cada client. R1 afecta validador compartit. |
| C5 Git | Suites de hooks passen. No s'ha fet commit de prova en este repositori. |
| C6 índex/CI | Scripts ara staged; no és commit ni CI remota verificada. Evitar publicació parcial. |
| C7 graf/rutes | Fixtures passen, corpus real roig per symlink i enllaços. |
| C8 CLI/I/O | Proves locals verdes; l'allowlist continua massa ampla i no cobreix totes les lectures útils. |
| C9 cens/durabilitat | doctor detecta divergències i 29 fitxers del corpus no versionats; canvis durables fora de HEAD. |

123/123 és la suma de les set suites de fortificació/documentals (109) i backend_consolidacio (14). No són les 82 Vitest citades per Claude ni una prova del backend remot.

### Què falta per activar Supabase real

1. Projecte **de SdP** identificat amb URL/clau pública i titularitat/operador clars; dataMode remote i tenant vàlid. No s'han llegit secrets per donar-ho per fet.
2. Aplicar i contrastar les 17 migracions sobre un canari aïllat i revisar esquema efectiu/RLS. No hi ha `supabase/config.toml` que acredite un stack local configurat; el compose del bot no alça Supabase.
3. Tancar R3–R6 en un mateix canvi coherent: SPA, embed, runtime, SDK, renovació, OAuth i relé. Verificar callbacks exactes i sessió externa acceptada pel servidor.
4. Provar dos usuaris i dos tenants: alta password i Google **nova**, membresia, login/refresh/logout, notes crear/llegir/editar, revision antiga → conflicte 409, denegació d'accés creuat/anon, storage privat, xat i RPC administratives denegades a usuari normal. Recarregar per demostrar persistència real.
5. Captura real redaccionada, endpoint, token/audiència i CORS acordats amb Sollutia abans d'activar Frontissa. Sense contracte, queda desactivada; no impedix provar Supabase SdP pel seu compte.
6. Build web i embed, proves de transport/contracte, doctor i CI del mateix commit; canari abans de producció. Portes verdes estàtiques no substituïxen este circuit.

### Rèplica a Claude i al pla de MarIA

Llegits els dos documents complets. Mantinc l'acord sobre la necessitat d'una sola política i proves negatives; **actualitze** els diagnòstics que els canvis del disc han deixat antics. A7 de Claude continua sense justificar el verd: hostname no equival a origen. A2 no són tres papers incompatibles: allotjament SPA, incrustació, operador de Supabase i API externa són dimensions diferents. B2/B3 descrivien risc de publicació parcial, no una CI remota fallida observada.

El pla conserva propostes de MarIA que ja han quedat superades: client absent, coma de shell com a únic problema i resegellar com a forma de sanejar. Cal substituir-les pels R1–R9 i pels blocs de codi d'esta v2; no afegir una segona porta Frontissa que duplique `tractor-adaptadors`. El pla ha d'exigir resource↔fixture↔captura i transport real de prova.

Ordre recomanat: (1) consens documental sobre v2; (2) R1 i durabilitat del Brain; (3) política/composició Model B; (4) canari Supabase; (5) Frontissa quan hi haja contracte; (6) patch UI amb font de cens i després instrumentació de sessió; (7) portes/CI/evidència final. La UI pot preparar-se en paral·lel conceptualment, però el seu estat verd no certifica el backend. **No marque consens en nom de Claude ni de MarIA i no implemente en este torn.**


### Disseny concret: governança, presa de corrent i Frontissa

**Resolució de la contradicció.** Cal separar quatre responsabilitats. Firebase pot servir la SPA i els assets; una pàgina de Sollutia pot incrustar el component; Sollutia pot operar una instància Supabase de titularitat SdP; i una API pròpia de Sollutia pot aportar dades només en lectura. Poden coexistir. El que s'exclou en Model B és que l'amfitrió substituïsca en calent el backend autoritatiu. El paràgraf arqueològic de LEDGER no revoca l'ADR. Propose afegir una entrada aclaridora, sense reescriure història, i substituir §8 per esta formulació en una fase de governança autoritzada:

> SdP conserva la titularitat, els contractes de dades i la capacitat d'exportació del seu backend Supabase. Sollutia pot operar-lo i allotjar una pàgina que incruste el component; l'allotjament de la SPA és una decisió de desplegament independent. Les APIs pròpies de Sollutia s'usen només en lectura mitjançant la Frontissa. L'amfitrió no selecciona l'adaptador de dades ni els destins de credencials.

Esta és una proposta coherent amb B; **no acredita** qui té hui el compte, el domini, les còpies o els permisos d'operació. S'han de concretar amb Sollutia. L'ADR també ha d'unificar «acceptada» i «pendent de signatura» i deixar de citar línies de codi projectat com si existiren.

**Independència futura.** Conservar `backendPort.js` com a contracte, els DTO de negoci i les capacitats opcionals; seleccionar l'adaptador des de la composició interna del desplegament. Hui només Supabase SdP. Canviar de proveïdor requerix un adaptador nou que passe el mateix contracte, migració de dades i un desplegament revisat; no requerix canviar la UI. No confondre açò amb obrir `window.SocDePoble.configura({ backend })` a codi de tercers.

- Sense Internet però amb xarxa local: preparar i assajar una instància Supabase pròpia en LAN, assets/fonts locals, HTTPS local de confiança i autenticació disponible sense Google ni serveis externs. És la via de menys canvi respecte del model online actual; no és automàtica ni està operativa hui.
- Sense cap servidor accessible: cal una ADR de contingència amb persistència asíncrona local, còpia prèvia, autenticació local acotada, outbox, idempotència, revisions/conflictes i sincronització. No activar escriptures locals silencioses quan falle una petició online. L'antic outbox es va retirar: no existeix esta capacitat ara.
- «Dos vesprades» sols es pot prometre després d'un assaig cronometrat de restauració en una segona infraestructura. Exportar esquema, dades, RLS, funcions, identitats i fitxers de Storage; conservar UUID i mapes d'objectes. Una còpia de PostgreSQL **no inclou** els objectes de Storage. [Guia oficial de restauració pròpia](https://supabase.com/docs/guides/self-hosting/restore-from-platform), [límits dels backups](https://supabase.com/docs/guides/platform/backups).

#### A. Configuració dinàmica de confiança

Publicar un document JSON **públic, sense secrets**, versionat i amb caducitat, en una URL HTTPS exacta controlada per SdP, fixada al desplegament (`VITE_POLICY_URL`). Eixa arrel de confiança no prové de l'HTML amfitrió, del JWT, de la query ni del mateix recurs que vol autoritzar-se. L'administració de Sollutia pot proposar dominis; només el circuit autoritzat de configuració SdP els publica. El navegador no disposa de cap `addAllowedOrigin()`.

El document conté `schema`, `entorn`, `version`, `expiresAt`, `backend: {adapter:'supabase-sdp', supabaseUrl, supabaseAnonKey}`, `auth:{issuer,audiences,parentOrigins}`, `assetsOrigins`, `botApiUrl`, `oauthRelayUrl` i `frontissa:null | {baseUrl,origins,audience}`. Les llistes poden ser buides; els camps opcionals de servei són `null`, no dominis inventats. Orígens separats per finalitat i emissor exacte amb la seua ruta. No publicar `service_role` ni secrets. Validar la clau amb `validatePublicCredentials`, que ja existix.

Esta solució permet canviar orígens autoritzats **entre arrencades**, sense recompilar React. No canvia de projecte durant una sessió. Una revocació urgent requerix revocar sessions al servidor i tornar a arrancar clients; `Object.freeze` no revoca permisos remots. Configuració expirada o indisponible falla tancada; el paquet LAN ha de portar el seu desplegament propi. Si el JSON ha de viatjar per infraestructura no fiable, cal una signatura verificada amb clau pública ancorada en el paquet i protecció de rollback; no acceptar una clau rebuda dins del mateix JSON. Amb HTTPS d'un servei SdP controlat, no afegisc eixa criptografia sense necessitat.

**Límit d'amenaça:** un Web Component compartix el context JavaScript de l'amfitrió. Shadow DOM no és una frontera contra l'amfitrió maliciós, que pot interceptar `fetch`. Si el proveïdor del HTML no és de confiança, usar iframe d'origen SdP amb `postMessage` estricte i CSP adequada. La validació de configuració no corregix un host compromés.

Fitxer proposat `src/config/confianca.js` (codi complet):

```js
// Proposta src/config/confianca.js. No s'ha instal·lat en src.
const copia = value => JSON.parse(JSON.stringify(value));
const congela = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(congela);
    Object.freeze(value);
  }
  return value;
};
export function urlSegura(value, { dev = false } = {}) {
  if (typeof value !== 'string' || value !== value.trim() || /[\s\\]/.test(value))
    throw new Error('URL invàlida');
  const u = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  if (u.username || u.password || u.hash ||
      !(u.protocol === 'https:' || (dev && loopback && u.protocol === 'http:')))
    throw new Error('URL no autoritzada');
  return u;
}
export function normalitzaPolitica(raw, { entorn, dev = false, now = Date.now() }) {
  const p = copia(raw);
  if (p.schema !== 'sdp.runtime.v1' || p.entorn !== entorn ||
      !Number.isSafeInteger(p.version) || p.version < 1 ||
      !Number.isFinite(Date.parse(p.expiresAt)) || Date.parse(p.expiresAt) <= now)
    throw new Error('Política invàlida o caducada');
  const url = value => urlSegura(value, { dev });
  const origen = value => {
    const u = url(value);
    if (u.pathname !== '/' || u.search) throw new Error('Cal un origen sense ruta');
    return u.origin;
  };
  const llista = values => {
    if (!Array.isArray(values)) throw new Error('Cal una llista explícita');
    return [...new Set(values.map(origen))];
  };
  if (p.backend?.adapter !== 'supabase-sdp') throw new Error('Adaptador no admés pel Model B');
  p.backend.supabaseUrl = origen(p.backend.supabaseUrl);
  if (typeof p.backend.supabaseAnonKey !== 'string' || !p.backend.supabaseAnonKey)
    throw new Error('Falta clau pública');
  if (!p.auth || !Array.isArray(p.auth.audiences) || !p.auth.audiences.length ||
      !p.auth.audiences.every(x => typeof x === 'string' && x.length > 0))
    throw new Error('Audiències invàlides');
  const issuer = url(p.auth.issuer);
  if (issuer.search) throw new Error('Emissor amb query');
  // iss és un identificador exacte: no es lleva una barra final.
  p.auth.parentOrigins = llista(p.auth.parentOrigins);
  p.assetsOrigins = llista(p.assetsOrigins);
  for (const name of ['botApiUrl', 'oauthRelayUrl']) {
    if (p[name] !== null) p[name] = url(p[name]).href;
  }
  if (p.frontissa !== null) {
    const f = p.frontissa;
    f.origins = llista(f.origins);
    const base = url(f.baseUrl);
    if (base.search || !base.pathname.endsWith('/') || !f.origins.includes(base.origin))
      throw new Error('Base de Frontissa invàlida');
    f.baseUrl = base.href;
    if (typeof f.audience !== 'string' || !f.audience) throw new Error('Falta audiència de Frontissa');
  }
  return congela(p);
}
export async function carregaPolitica({ url, entorn, dev = false, fetchImpl = fetch }) {
  // url és un literal del desplegament o VITE_POLICY_URL; MAI un atribut del host.
  const fixed = urlSegura(url, { dev }).href;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetchImpl(fixed, {
      method: 'GET', credentials: 'omit', redirect: 'error',
      cache: 'no-store', signal: ac.signal, headers: { Accept: 'application/json' }
    });
    if (!r.ok || !r.headers.get('content-type')?.includes('application/json'))
      throw new Error('Configuració indisponible');
    const text = await r.text();
    if (text.length > 65536) throw new Error('Política massa gran');
    return normalitzaPolitica(JSON.parse(text), { entorn, dev });
  } finally { clearTimeout(timer); }
}
```

#### B. Composició interna, sense backend injectable

Fitxer proposat `src/data/composicio.js`:

```js
import { carregaPolitica } from '../config/confianca.js';
import { validatePublicCredentials } from '../config/publicCredentials.js';
let preparant;
let politica;
export function preparaDesplegament() {
  return preparant ||= carregaPolitica({
    url: import.meta.env.VITE_POLICY_URL,
    entorn: import.meta.env.MODE,
    dev: import.meta.env.DEV
  }).then(p => {
    validatePublicCredentials(p.backend.supabaseUrl, p.backend.supabaseAnonKey);
    politica = p;
    return p;
  });
}
export function getPolitica() {
  if (!politica) throw new Error('Desplegament encara no preparat');
  return politica;
}
export async function carregaBackendSdp() {
  await preparaDesplegament();
  // Punt de substitució propi, revisat en build; cap import basat en input del host.
  return import('./supabase/index.js');
}
```

En `host.js`, afegir `import { preparaDesplegament, carregaBackendSdp } from './data/composicio.js';` i substituir **només** `configura` i `arrenca` pels blocs següents. Conservar `quanLlest`, el relé, la cua i l'API de sessió. Eliminar la prosa que recomana Model A.

```js
export function configura(config = {}) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('Arrencada ja iniciada');
  if (!config || typeof config !== 'object' || Array.isArray(config) ||
      Object.keys(config).some(k => k !== 'auth')) throw new Error('Configuració de host desconeguda');
  setRuntimePolicy(config); // Comprova coincidència amb la política SdP; no l'amplia.
  return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
}
export function arrenca() {
  if (arrencada) return arrencada;
  fase = FASE.ARRENCANT;
  _segellat = true;
  arrencada = (async () => {
    await preparaDesplegament();
    getRuntimePolicy();
    const impl = await carregaBackendSdp();
    setBackendImplementation(impl); // Sempre l'adaptador intern, encara que el port tinguera un valor previ.
    freezeImplementation();
    defineCustomElement();
    fase = FASE.SEGELLAT;
    const resultat = { fase, backend: Object.keys(getBackendImplementation()) };
    resolveLlest?.(resultat);
    return resultat;
  })().catch(error => {
    // Després de congelar no simulem un reintent configurable: requereix recàrrega.
    fase = 'error';
    rejectLlest?.(error);
    throw error;
  });
  return arrencada;
}
```

Substitució completa de `src/config/runtimePolicy.js`:

```js
import { getPolitica } from '../data/composicio.js';
let policy = null;
export function setRuntimePolicy(config = {}) {
  if (policy) throw new Error('Política ja fixada');
  if (!config || Object.keys(config).some(k => k !== 'auth')) throw new Error('Configuració no permesa');
  const p = getPolitica();
  if (config.auth !== undefined) {
    const a = config.auth;
    if (!a || typeof a !== 'object' || Array.isArray(a)) throw new Error('Auth invàlida');
    for (const [k, v] of Object.entries(a)) {
      if (!['issuer', 'audiences', 'parentOrigins'].includes(k) || JSON.stringify(v) !== JSON.stringify(p.auth[k]))
        throw new Error('El host no pot ampliar la confiança');
    }
  }
  policy = Object.freeze({ backend: p.backend, auth: p.auth });
  return policy;
}
export function getRuntimePolicy(noAutoFreeze = false) {
  return policy || (noAutoFreeze ? null : setRuntimePolicy());
}
export function esOrigenPermes(origin) {
  return typeof origin === 'string' && getRuntimePolicy().auth.parentOrigins.includes(origin);
}
```

`public/auth/callback.html` ha de consumir la mateixa llista publicada o un derivat generat d'eixa versió. **No basta** canviar runtimePolicy i deixar el callback antic: `https://sollutia.cat:444` ha de fallar als dos. Mantindre comprovació de `event.source`, estat/nonce OAuth i verificació real del token en servidor; comparar claims al navegador no verifica signatures.

**Connexió obligatòria de les entrades:** `main.jsx` ha de fer `await preparaDesplegament(); configura(); exposaGlobal(); await arrenca();` **abans** de `createRoot(...).render(...)`. Fer `init` asíncrona i capturar l'error amb un estat visible. Llevar el fallback d'emissor `VITE_APP_ISSUER` divergent. `embed.jsx` ha d'esperar `preparaDesplegament()` abans d'`exposaGlobal()` i d'`init()`; després conserva el mode manual i `arrencaAuto`. Així el global no anuncia `ready` abans de disposar de política. Els errors de bootstrap s'han de mostrar amb `textContent`, sense posar tokens ni JSON de configuració a logs. Estes connexions formen part de la mateixa implementació; aplicar només `host.js` seria insuficient.

#### C. SanejaConfig i destí únic de credencials

Exportar la funció següent des d'un mòdul compartit `src/config/sanejaConfig.js` i usar-la tant a la SPA com al Web Component. Eliminar la versió local de `PedraSecaEmbed.jsx`; no mantindre dos sanejadors. Els atributs són preferències i context de tenant, mai autoritat per triar backend. Una discrepància s'explica com a error; no es transforma en un fallback silenciós.

```js
import { getPolitica } from '../data/composicio.js';
import { urlSegura } from './confianca.js';
const PRESENTACIO = ['basePath','pluginUrl','fontsHref','routerType','basename',
  'tenantId','language','themeMode','manageDocumentHead','version'];
export function sanejaConfig(cru = {}) {
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) throw new Error('Config invàlida');
  const p = getPolitica();
  const fix = {
    supabaseUrl: p.backend.supabaseUrl, supabaseAnonKey: p.backend.supabaseAnonKey,
    botApiUrl: p.botApiUrl, oauthRelayUrl: p.oauthRelayUrl,
    sollutiaIssuer: p.auth.issuer, dataMode: 'remote'
  };
  for (const [k, v] of Object.entries(fix)) {
    if (Object.hasOwn(cru, k) && cru[k] !== undefined && cru[k] !== v)
      throw new Error(`Configuració incompatible: ${k}`);
  }
  const net = Object.fromEntries(PRESENTACIO.filter(k => Object.hasOwn(cru, k)).map(k => [k, cru[k]]));
  for (const k of ['basePath','basename']) {
    if (net[k] !== undefined && (typeof net[k] !== 'string' ||
        !/^\/(?!\/)[^\\?#]*$/.test(net[k]) || net[k].includes('..')))
      throw new Error(`Ruta invàlida: ${k}`);
  }
  for (const k of ['pluginUrl','fontsHref']) {
    if (net[k] === undefined) continue;
    if (typeof net[k] !== 'string' || /[\s\\]/.test(net[k]) || net[k].startsWith('//'))
      throw new Error(`URL invàlida: ${k}`);
    const u = urlSegura(new URL(net[k], window.location.origin).href, { dev: import.meta.env.DEV });
    if (!p.assetsOrigins.includes(u.origin)) throw new Error(`Origen d'assets invàlid: ${k}`);
    net[k] = u.href;
  }
  if (net.routerType !== undefined && !['browser','hash','memory'].includes(net.routerType))
    throw new Error('Router invàlid');
  return Object.freeze({ ...net, ...fix });
}
```

A més, `src/data/supabase/runtime.js:getResolvedConfig` és la barrera comuna del transport: canviar-ne la resolució d'URL/clau per este bloc al principi i conservar la resta (`tenantId`, validació pública, mitjans i retorn). **Rebutjar també ací** configuració divergent encara que algú no passe per `sanejaConfig`:

```js
const fixed = getPolitica().backend; // importar getPolitica des de ../composicio.js
for (const key of ['supabaseUrl', 'supabaseAnonKey']) {
  if (config[key] !== undefined && config[key] !== fixed[key])
    throw new Error(`Backend divergent: ${key}`);
}
const { supabaseUrl, supabaseAnonKey } = fixed;
```

Al mateix canvi, forçar `dataMode:'remote'` per producció i usar eixa mateixa resolució en `getClient`, `renova`, `bescanvia`, Storage i Realtime. En `renova`/`bescanvia`: `redirect:'error'`, abort/timeout i mateix destí; no reintentar automàticament un codi OAuth consumible. Revisar els valors antics de `config` construïts a `main.jsx` i `embed.jsx`: llevar-ne les credencials/URLs d'entorn, o substituir-los pels valors de `getPolitica`, perquè el guard nou els rebutjarà si divergen. És un canvi atòmic d'integració, no un pegat aïllat al sanititzador.

#### D. Frontissa GET amb catàleg tancat

`issuer` identifica qui emet tokens; **no és** la base d'una API de recursos. El client rep `frontissa.baseUrl` i un token amb audiència adequada. `credentials:'omit'` evita credencials implícites, però no elimina un `Authorization` explícit; per això el token no es pren automàticament de la sessió Supabase. Les redireccions s'han de denegar **abans** de seguir-les. [RequestInit, MDN](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit). L'allowlist i la prohibició de redireccions també són recomanacions d'OWASP per transports de servidor; en el navegador este defecte és una eixida a destí arbitrari, no el denomine SSRF sense backend intermediari. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

Substitució proposada de `client.js`:

```js
// Proposta src/data/adaptadors/sollutia/client.js.
export const ESCRIPTURES_PERMESES = Object.freeze([]);
export function creaClientSollutia({ policy, recursos, tokenPerAudiencia, fetchImpl = fetch }) {
  const config = policy.frontissa;
  // El catàleg és codi revisat del paquet; no ve d'atributs ni d'un JSON remot.
  const registre = Object.freeze(Object.fromEntries(Object.entries(recursos).map(([id, r]) =>
    [id, Object.freeze({ ...r, queryKeys: Object.freeze([...(r.queryKeys || [])]) })])));
  return Object.freeze({
    async llig(id, params = {}, { signal } = {}) {
      if (!config || !Object.hasOwn(registre, id)) throw new Error('Recurs inhabilitat');
      const r = registre[id];
      if (!r.capturaSha256 || !/^[a-f0-9]{64}$/.test(r.capturaSha256) ||
          !r.fixture || !r.contractVersion || typeof r.traductor !== 'function' ||
          typeof r.path !== 'string' || !r.path || /(^\/|[:\\?#%]|(?:^|\/)\.\.(?:\/|$))/.test(r.path))
        throw new Error('Contracte de recurs incomplet');
      const base = new URL(config.baseUrl);
      const endpoint = new URL(r.path, base);
      if (endpoint.origin !== base.origin || !endpoint.pathname.startsWith(base.pathname) ||
          !config.origins.includes(endpoint.origin)) throw new Error('Destí no permés');
      for (const [key, value] of Object.entries(params)) {
        if (!r.queryKeys.includes(key) || !['string', 'number', 'boolean'].includes(typeof value) ||
            (typeof value === 'number' && !Number.isFinite(value))) throw new Error('Paràmetre invàlid');
        endpoint.searchParams.set(key, String(value));
      }
      const ac = new AbortController();
      const abort = () => ac.abort();
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) ac.abort();
      const timer = setTimeout(abort, 12000);
      try {
        if (ac.signal.aborted) throw new DOMException('Cancel·lat', 'AbortError');
        // Este proveïdor ha de retornar un token per a Sollutia, no reutilitzar el JWT SdP.
        const token = await tokenPerAudiencia(config.audience, { signal: ac.signal });
        if (ac.signal.aborted) throw new DOMException('Cancel·lat', 'AbortError');
        if (typeof token !== 'string' || !token || /[\r\n]/.test(token)) throw new Error('Falta token de Frontissa');
        const response = await fetchImpl(endpoint.href, {
          method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store',
          referrerPolicy: 'no-referrer', signal: ac.signal,
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Frontissa HTTP ${response.status}`);
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new Error('Resposta no JSON');
        return r.traductor(await response.json());
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      }
    }
  });
}
```

**Integració exacta:** exportar el client creat des d'un mòdul de composició només després de carregar política; els consumidors criden `client.llig('perfil', params, {signal})`, mai `llig(url)`. `tokenPerAudiencia` és un port d'autenticació pendent d'acord real amb Sollutia: ha de respectar `signal`; si no hi ha proveïdor de token adequat, la composició deixa `frontissa:null`. No invente un bescanvi ni un endpoint.

`recursos.js` de producció ha de quedar inicialment `export const RECURSOS = Object.freeze({});` fins que existisca captura real. Quan arribe, cada entrada inclourà `path` relatiu, `queryKeys`, `contractVersion`, `capturaSha256`, `fixture` i `traductor`. El traductor projectarà exclusivament els camps acordats (`id`, `display_name`, etc.), sense `...payload`. La porta ha de comprovar el hash contra la captura redaccionada, validar la fixture i exercitar el transport; un string amb 64 hexadecimals per si sol **no** acredita una captura. El model actual de `perfil` sense estos camps fallarà tancat amb este client, deliberadament.

Proves exigibles: desconegut/prototype, ruta absoluta, canvi d'origen, path traversal, paràmetre desconegut i contracte incomplet → zero fetch; token absent → zero fetch; resposta mal formada → error del traductor; 307/308 → cap petició al segon servidor; cancel·lació prèvia/durant resposta; absència de cookies; únic verb GET. `ESCRIPTURES_PERMESES` congelat i buit és declaratiu; la garantia real és no exposar cap mètode d'escriptura i tindre permisos de servidor només de lectura.

### Consola: codi exacte, dades honestes i criteris d'acceptació

**Decisió de disseny:** reutilitzar `UniversalCard` exportada pel barrel PedraSeca, amb `hasFooter={false}` i `body` React. No usar `UniversalIndicatorCard` per allotjar taules: és un `<button>` i no admet botons/taules interactives dins. Cap nova paleta, ombra, vora ni radi de targeta. El CSS afegit només organitza la graella i centra Refrescar. Una modificació de `.sp-card` es propagarà a les quatre targetes.

La vista mostra entradilla, instantània, Refrescar centrat, càrrega documental i quatre resums visibles alhora. Els `<details>` oculten només les taules llargues, no l'estat; no queda una pestanya inicial buida. Es conserva el diàleg de fonts, cancel·lació, errors i última instantània bona. Es lleva `useSEO` de `ConsolaPanells`: la pàgina contenidora ja gestiona el títol i la mateixa peça s'incrusta a la Wiki.

**Apèndix UI-1: patch exacte contra el tall auditat**. S'ha generat en temporal sense aplicar-lo a `src`. Els panells de detall existents es reutilitzen. «Sessions» passa a «Registres de consum»: actualment cada línia es compta com una sessió, però pot haver-hi diverses mesures de la mateixa sessió.

```diff
--- a/src/sections/consola/ConsolaSection.jsx
+++ b/src/sections/consola/ConsolaSection.jsx
@@ -2,7 +2,7 @@
 import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
 import { UniversalPage } from '../../components/universal/UniversalPage';
 import {
-  Alerta, Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
+  Alerta, Boto, Dialeg, Taula, UniversalCard, Insignia, EstatBuit, Carregant, Progres
 } from '../../components/PedraSeca';
 import { useSEO } from '../../hooks/useSEO';
 import { useUIActions, useUIState } from '../../app/contexts/UIContext';
@@ -39,11 +39,11 @@
       <div className="sdp-consola__resum">
         <Xifra etiqueta="Tòkens d'entrada" valor={n(total.entrada)} />
         <Xifra etiqueta="Tòkens d'eixida" valor={n(total.eixida)} />
-        <Xifra etiqueta="Sessions" valor={n(consums.length)} />
+        <Xifra etiqueta="Registres de consum" valor={n(consums.length)} />
       </div>
       <Taula titol="Consum de tòkens per agent" densa>
         <thead>
-          <tr><th scope="col">Agent</th><th scope="col">Sessions</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
+          <tr><th scope="col">Agent</th><th scope="col">Registres</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
         </thead>
         <tbody>
           {perAgent.map((a) => (
@@ -158,99 +158,124 @@
 /* ── Secció ─────────────────────────────────────────────────────────────── */
 
 export function ConsolaPanells() {
-  const { t } = useUIActions();
   const { locale } = useUIState();
-  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
+  const [estat, setEstat] = useState('loading');
   const [dades, setDades] = useState(null);
   const [error, setError] = useState(null);
   const [rebutObert, setRebutObert] = useState(null);
-  const enCurs = useRef(null);                      // AbortController de la càrrega viva
-
-  const titol = t('section.consola.title', 'Consola Termodinàmica');
-  const lead = t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.");
-  useSEO({ title: titol, description: lead });
-
-  /* Una sola càrrega viva: refrescar cancel·la l'anterior i desmuntar cancel·la l'última. */
+  const enCurs = useRef(null);
+
   const carrega = useCallback(() => {
     enCurs.current?.abort();
     const ac = new AbortController();
     enCurs.current = ac;
     setEstat('loading');
+    setError(null);
     carregaConsola(ac.signal)
-      .then((d) => { if (ac.signal.aborted) return; setDades(d); setError(null); setEstat(d ? 'ready' : 'absent'); })
-      .catch((e) => { if (ac.signal.aborted) return; setError(e); setEstat('error'); });
+      .then((d) => {
+        if (ac.signal.aborted) return;
+        setDades(d);
+        setEstat(d ? 'ready' : 'absent');
+      })
+      .catch((e) => {
+        if (ac.signal.aborted) return;
+        setError(e);
+        setEstat('error');
+      });
   }, []);
-
   useEffect(() => {
     carrega();
     return () => enCurs.current?.abort();
   }, [carrega]);
 
-  const pestanyes = dades ? [
-    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} locale={locale} /> },
-    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
-    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt, contingut: <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} /> },
-    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle, contingut: <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
-  ] : [];
-
-  const missatgeError = error?.message || String(error);
+  const inventari = dades ? resumSkills(dades.skills) : null;
+  const termometria = dades?.termometria;
+  const mesurat = Number.isSafeInteger(termometria?.artefactesActius)
+    && termometria.artefactesActius >= 0;
+  const recompte = mesurat ? termometria.artefactesActius : null;
+  const llindar = 150;
+  const estatSenseDades = estat === 'loading' ? 'Llegint…'
+    : estat === 'absent' ? 'No disponible en este entorn'
+      : 'No s’ha pogut llegir';
+  const panells = [
+    { id: 'consums', titol: 'Consums', Icona: Activity,
+      resum: dades ? (dades.consums.length ? `${dades.consums.length} registres` : 'Sense mesura de tòkens') : estatSenseDades,
+      contingut: dades && <PanellConsums consums={dades.consums} locale={locale} /> },
+    { id: 'credits', titol: 'Crèdits', Icona: Coins,
+      resum: dades ? (dades.credits?.length ? `${dades.credits.length} proveïdors` : 'Saldo desconegut') : estatSenseDades,
+      contingut: dades && <PanellCredits credits={dades.credits?.length ? dades.credits : null} /> },
+    { id: 'rebuts', titol: 'Rebuts', Icona: Receipt,
+      resum: dades ? `${dades.rebuts.length} rebuts de lectura` : estatSenseDades,
+      contingut: dades && <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} /> },
+    { id: 'skills', titol: 'Skills', Icona: Puzzle,
+      resum: inventari ? `${inventari.total} skills · ${inventari.orfes.length} orfes · ${inventari.fantasmes.length} fantasmes` : estatSenseDades,
+      contingut: dades && <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
+  ];
 
   return (
     <>
       <div className="sdp-consola">
+        <div className="sdp-consola__entradilla">
+          <h2>El pols del cervell</h2>
+          <p>La Consola Termodinàmica reunix els consums, els crèdits, els rebuts
+            i l’inventari de skills. Ens ajuda a detectar saturació i a preparar
+            l’Acta Marmota amb evidències del treball fet.</p>
+          <p>El seguiment diari i per sessió ha de relacionar hora, acció,
+            resultat i consum mesurat. Ara es mostren les fonts disponibles;
+            l’absència de dades no significa consum zero ni bon rendiment.</p>
+          <p className="sdp-consola__instantania" role="status">
+            {dades?.generat ? `Instantània: ${dataLocal(dades.generat, locale)} · ${dades.immunitari.operacions} operacions immunitàries`
+              : 'Instantània encara no disponible.'}
+          </p>
+        </div>
         <div className="sdp-consola__capcal">
-          {dades?.generat ? (
-            <p className="sdp-consola__instantania">
-              Instantània: {dataLocal(dades.generat, locale)} · {dades.immunitari.operacions} operacions immunitàries
-            </p>
-          ) : null}
-          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={carrega}>
-            Refrescar
-          </Boto>
+          <Boto varietat="secundari" icona={RefreshCw}
+            carregant={estat === 'loading'} onClick={carrega}>Refrescar</Boto>
         </div>
-
-        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}
-
-        {estat === 'absent' ? (
-          <EstatBuit titol="Consola no disponible en este entorn">
-            El servidor no exposa <Mono>/__iaia/consola.json</Mono>. La consola només existix al servidor
-            de desenvolupament (plugin <Mono>sdp:consola-iaia</Mono>).
-          </EstatBuit>
-        ) : null}
-
-        {estat === 'error' && !dades ? (
-          <EstatBuit titol="No s'ha pogut llegir la consola">
-            <pre className="sdp-consola__mono">{missatgeError}</pre>
-          </EstatBuit>
-        ) : null}
-
-        {estat === 'error' && dades ? (
-          <Alerta to="error" titol="No s'ha pogut refrescar">
-            Es mostra l'última instantània bona. <Mono>{missatgeError}</Mono>
-          </Alerta>
-        ) : null}
-
-        {dades ? <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} /> : null}
+        {estat === 'loading' && !dades && <Carregant etiqueta="Llegint l’estat de l’eixam…" />}
+        {estat === 'absent' && <Alerta to="info" titol="Consola no disponible">
+          Esta font només es publica al servidor local de desenvolupament.
+        </Alerta>}
+        {estat === 'error' && <Alerta to="error" titol="No s’ha pogut refrescar">
+          {dades ? 'Es conserva l’última instantània bona. ' : ''}
+          {error?.message || 'Torna a provar-ho amb Refrescar.'}
+        </Alerta>}
+        <UniversalCard title="Càrrega documental" headingLevel="h2" hasFooter={false}
+          body={mesurat ? <>
+            <p>{recompte} artefactes actius · avís per damunt de {llindar}.</p>
+            <Progres etiqueta="Artefactes actius respecte del llindar d’avís"
+              valor={Math.min(recompte, llindar)} max={llindar} />
+            {recompte > llindar && <Alerta to="avis" titol="Revisem la saturació">
+              Hi ha {recompte - llindar} artefactes per damunt del llindar.
+              Cal revisar rellevància i context; no s’arxiva res automàticament.
+            </Alerta>}
+            <p>{termometria.abast}</p>
+          </> : <p>Recompte d’artefactes actius encara no disponible. Les skills
+            i els rebuts no són una mesura de la grandària del context.</p>} />
+        <div className="sdp-consola__graella">
+          {panells.map(({ id, titol, Icona, resum, contingut }) => (
+            <UniversalCard key={id} title={titol} headingLevel="h2"
+              icon={<Icona aria-hidden="true" />} hasFooter={false}
+              body={<>
+                <p>{resum}</p>
+                {contingut && <details>
+                  <summary>Veure detall de {titol.toLocaleLowerCase(locale)}</summary>
+                  {contingut}
+                </details>}
+              </>} />
+          ))}
+        </div>
       </div>
-
-      <Dialeg
-        obert={rebutObert !== null}
-        onTanca={() => setRebutObert(null)}
-        titol="Fonts llegides senceres"
+      <Dialeg obert={rebutObert !== null} onTanca={() => setRebutObert(null)}
+        titol="Fonts llegides senceres" mida="g"
         descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
-        mida="g"
-        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
-      >
-        {rebutObert ? (
-          <Taula titol="Fonts del rebut" densa>
-            <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
-            <tbody>
-              {rebutObert.fonts.map((f) => (
-                <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
-              ))}
-            </tbody>
-          </Taula>
-        ) : null}
+        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}>
+        {rebutObert && <Taula titol="Fonts del rebut" densa>
+          <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
+          <tbody>{rebutObert.fonts.map((f) => (
+            <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
+          ))}</tbody>
+        </Taula>}
       </Dialeg>
     </>
   );
```

Afegir estes regles **dins de la capa `components`**, al bloc de la consola de `src/css/components.css`. Reemplaçar el bloc existent de `.sdp-consola__capcal` pel primer bloc; les xifres deixen de dibuixar un estil alternatiu de targeta. La superfície de targeta continua exclusivament en `.sp-card`.

```css
.sdp-consola__capcal {
  display: flex;
  justify-content: center;
  margin-block: var(--sdp-space-4) var(--sdp-space-6);
}
.sdp-consola__graella {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--sdp-space-4);
  margin-top: var(--sdp-space-4);
}
.sdp-consola__graella > .sp-card { min-width: 0; }
.sdp-consola__entradilla { margin-bottom: var(--sdp-space-4); }
.sdp-consola__xifra {
  display: flex;
  flex-direction: column;
  gap: var(--sdp-space-1);
  text-align: center;
}
```

**Apèndix UI-2: contracte del recompte.** El nombre de skills no és el nombre d'artefactes ni el context consumit per un model. Definició proposta visible: fitxers Markdown de govern i Wiki operativa, sense arxiu històric, runtime, zones humanes, laboratori ni symlinks. El llindar 150 és un avís demanat pel Mestre, no una llei física ni un motiu per esborrar. Les comprovacions són `>150`, no `>=150`; la barra es limita a 100% i el text conserva el recompte real.

Codi proposat per `tooling/vite/termometria.mjs`:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
const DIRECTORIS = ['.agents/skills', '.agents/rules',
  '_wiki_de_poble/01_ser', '_wiki_de_poble/02_saber',
  '_wiki_de_poble/03_actuar', '_wiki_de_poble/04_escriptori'];
const EXCLOSOS = new Set(['01_produccio','02_investigacio_ia','00_bandeja_d_entrada']);
export async function recullTermometria(root) {
  let n = 0;
  async function visita(rel) {
    const abs = path.join(root, rel);
    const stat = await fs.lstat(abs);
    if (stat.isSymbolicLink()) throw new Error(`Cens ambigu: ${rel}`);
    if (stat.isFile()) { if (rel.endsWith('.md')) n++; return; }
    if (!stat.isDirectory()) return;
    for (const entry of await fs.readdir(abs, { withFileTypes: true })) {
      if (EXCLOSOS.has(entry.name)) continue;
      await visita(path.join(rel, entry.name));
    }
  }
  await visita('AGENTS.md');
  for (const dir of DIRECTORIS) await visita(dir);
  return {
    artefactesActius: n,
    abast: 'Markdown de govern i Wiki operativa; exclou històric, runtime, producció humana i laboratori.'
  };
}
```

En `consola-iaia.mjs`, importar esta funció i fer asíncron el callback de middleware existent. **Conservar primer la guarda GET/loopback** i després substituir `res.end(JSON.stringify(recullConsola()))` per:

```js
try {
  let termometria = null;
  try { termometria = await recullTermometria(PROJECT_DIR); }
  catch (error) { console.warn('[consola] Cens no disponible:', error.message); }
  res.end(JSON.stringify({ ...recullConsola(), termometria }));
} catch {
  res.statusCode = 500;
  res.end(JSON.stringify({ error: 'No es pot llegir la consola' }));
}
```

En `consolaContent.js:normalitza`, abans del `return` final, afegir:

```js
const termometria = b.termometria == null ? null : {
  artefactesActius: numero(objecte(b.termometria, 'termometria').artefactesActius,
    'termometria.artefactesActius', true),
  abast: text(b.termometria.abast, 'termometria.abast')
};
```

I afegir `termometria` a l'objecte retornat. Sense estes dos connexions, la UI diu «no disponible» i **no fingix** tindre un sensor. No execute el nou cens sobre producció ni publique rutes del cervell. El middleware continua local i només de desenvolupament; el guard de superadmin de React no substituïx una autorització de servidor si algun dia s'exposa remotament.

**Persistència per dia i sessió (fase explícita, encara absent).** El GET actual només agrega fitxers; no registra cap instantània ni cronologia d'accions. No es pot dir que ja és una base de dades. Propose reutilitzar el diari estructurat local com a font d'esdeveniments, amb un únic escriptor del runtime i `eventId` únic; hora ISO UTC, zona de presentació Europe/Madrid, `sessionId/turn_id`, agent, acció enumerada, resultat, duració mesurada i comptadors de tokens opcionals. Separar `mesurat`, `estimat` i `desconegut`; no convertir «desconegut» en 0. No guardar prompts, respostes, JWT, PII ni claus. El botó Refrescar és una lectura: no ha de crear més registres de rendiment cada vegada que es prem.

Contracte concret d'un esdeveniment (exemple sintètic, no telemetria observada):

```json
{"schema":"sdp.telemetria.v1","eventId":"exemple-unic","t":"2026-09-23T21:00:00Z","sessionId":"sessio-exemple","agent":"codex","accio":"auditoria","resultat":"completat","duradaMs":1200,"tokens":{"tipus":"desconegut","entrada":null,"eixida":null}}
```

El recollidor validarà l'esquema, deduplicarà per eventId i agregarà per dia i sessionId. Els productors són `obrir_torn`, portes, execució autoritzada i tancament; un registre de tancament conserva el hash de l'evidència i el resultat real de les portes. Incorporar l'escriptor mitjançant l'executor de governança amb lease i proves de concurrència, no des d'una ruta POST oberta del navegador. La UI posterior afegirà filtre diari/sessió i export de resum per a Marmota. Qualificar rendiment exigix criteris coneguts (èxits, fallades, reobertures, temps i consum mesurat), no una puntuació inventada a partir de 18 skills.

Acceptació visual/funcional després del consens: 320/768/1440 px, text llarg, teclat i focus del diàleg; 4 targetes visibles des del primer render; càrrega, 404, 500, refresc fallit amb dades prèvies; recompte absent/0/150/151; dades sense consums o sense crèdits; mateixa peça dins de Wiki i `/consola`, sense doble SEO; zero modificació de permisos. Cal provar esta UI amb una sessió autoritzada o un harness de components; no desactivar RequireAuth per passar la prova.

### Rèplica final a la segona passada de Claude (rebuda durant el tancament)

Llegits els nous blocs C i D i el diàleg final. Acordem separar papers de governança, retirar el Model A públic, projectar DTO explícit i usar components existents. No certifique encara els seus fragments com a aplicables sense estes esmenes:

1. **La guarda de shell retorna abans.** La frase nova de Claude que els prefixos «tornen true després» de rebutjar metacaràcters no correspon a l'ordre real: `if (/[&|;<>$…]/.test(cmd)) return false` talla l'execució. La prova actual denega el punt i coma. El problema viu és R1 (arguments mutadors sense metacaràcters), no un bypass posterior del return.
2. **Frontissa D2:** millora origen/redirect però seguix sense aplicar RECURSOS, captura, fixture ni traductor, sense token i sense avortament previ; el listener no es retira. No complix encara ADR §3–4. El fragment nou de `runtimePolicy` també usa `frontissa` sense mostrar-la en la signatura destructurada. El client de catàleg d'esta v2 resol el contracte local; el token real continua pendent.
3. **Selector D2:** `import('./local/index.js')` apunta a un mòdul inexistent. Vite pot resoldre imports literals dinàmics durant build, encara que no es trie el proveïdor local. No publicar eixa entrada fins que l'adaptador existisca i passe el contracte; tampoc conservar injeccions prèvies a arrenca. Escriure 32 mètodes no resol migració, identitat ni reconciliació offline.
4. **SanejaConfig D3:** el fallback `propi` accepta el domini del document per a bot i relé, encara que no estiga autoritzat; dins d'un Web Component eixe domini és el de l'amfitrió. Això contradiu el pin anunciat. Validar només origin tampoc fixa la ruta d'un issuer ni exclou userinfo. La configuració dinàmica és possible si ve d'una arrel de confiança SdP prèviament fixada, no del host; la proposta d'esta v2 explica eixa frontera.
5. **Cens C4:** comptar tots els fitxers `.agents`, inclòs runtime, no mesura automàticament context llegit. El límit de profunditat i `catch { return 0 }` poden declarar un nombre baix quan falta lectura. Preferisc un abast operatiu explícit i estat desconegut davant errors, sense autoarxivat. La sèrie de rebuts per dia és útil si s'etiqueta «rebuts presents al diari»: un dia sense entrades no acredita zero activitat si el diari és parcial.
6. **UI C6:** la seua alternativa de UniversalIndicatorCard + diàleg és vàlida per a resums clicables; no li atribuisc el problema de botons ni taules dins del botó perquè els trasllada al diàleg. La meua UniversalCard conserva el detall en la mateixa pàgina, sense capçal d'autor ni peu d'accions; la seua amplària màxima existent és un límit visual a comprovar, no una incompatibilitat semàntica. No barrejar els dos redissenys. En el seu codi l'entradilla llarga viu només en ConsolaSection i no apareix quan s'incrusta ConsolaPanells a la Wiki; les targetes tampoc apareixen fins que hi ha dades. Evitar dos diàlegs oberts alhora per a panell i rebut sense verificar focus/inert. Mantindre «registres» en lloc de «sessions» mentre no hi haja sessionId.

El pla compartit ha rebut també una exigència de Live Preview de NotesSection durant este torn. La conserve intacta com a aportació aliena; **no l'he auditat ni l'afirme consensuada**, perquè no forma part del text d'encàrrec adjunt d'esta auditoria. MarIA ha de consolidar el pla ampliat i les dos alternatives de consola abans d'implementar.

### Millora contínua de la plantilla

- Fixar SHA de HEAD, estat brut i hashes de fonts; «HEAD 23:05» és ambigu en treball concurrent.
- Incloure rutes exactes de pla, auditories i controls C1–C9 actius; no exigir la seua lectura després d'arxivar-los.
- Separar autorització documental, canari, implementació i desplegament; l'aprovat genèric no anul·la l'ordre AFK.
- Generar rebuts amb `document.mjs`, sense `sdp:torn_manual_2305`; sincronitzar router 2.2.0 amb plantilla 2.3.0.
- Distingir prova estàtica, mock, navegador, CI i backend real. Substituir «portes inviolables» per garanties amb límits verificats.
- Indicar qui consolida el consens i com es registra una nova revisió que modifica troballes anteriors.
- Definir «artefacte actiu», «sessió», «registre de consum» i política de retenció abans de demanar gràfics o puntuacions.

Alternatives descartades: obrir un backend arbitrari al host per «ser modular»; inventar endpoints Sollutia; afegir una altra biblioteca de targetes; muntar una base de dades paral·lela només per maquillar la consola. La composició interna i les targetes existents deixen menys peces a mantindre.

## Verificació

| Prova d'este torn | Resultat |
| --- | --- |
| `node --test tests/fortificacio.test.mjs tests/documental.test.mjs tests/porta-reflex.test.mjs tests/hooks-local.test.mjs tests/security-chain.test.mjs tests/verificador-scc.test.mjs tests/git-hooks.test.mjs tests/backend_consolidacio.test.mjs` | **123/123**, zero fallades; 8,13 s. |
| `knownRead` en memòria | Semicolon denegat; `git diff --output /tmp/sdp-audit-marker`, baseline i scripts arbitraris acceptats. Cap ordre adversarial executada. |
| Client actual amb fetch substituït | Accepta URL absoluta aliena i retorna payload cru; zero peticions reals. |
| SanejaConfig actual, funció literal en VM DEV=false | Rebutja supabase alié; accepta domini d'un altre rol com a supabaseUrl i conserva userinfo al filtre. |
| `tractor-adaptadors.mjs` | Verd; continua sense detectar el client permissiu. |
| `segella.mjs` | Verd, 69100848…; esta auditoria no ha executat cap reconciliació. |
| `reflex_petorreta.mjs doctor --ci` | Roig: symlink, baseline divergent, 29 fitxers del corpus i canvis durables fora de HEAD. |
| Recollidor actual | 18 skills, 38 rebuts, 0 consums, crèdits null; absència de camp termometria. |
| Navegador `localhost:3340/consola` | Redirigix a `/registre?tornar=%2Fconsola`. Cap login ni canvi de permisos. |
| Codi proposat de confiança/Frontissa en temporal | **19 comprovacions passen**: orígens/esquema/caducitat, congelació, recurs/params, DTO, opcions de fetch i avortament previ. Són dobles, no canari. |
| Patch JSX proposat | Parser Babel amb JSX: sintaxi correcta. No s'ha muntat ni validat visualment la proposta. |
| Contracte d'auditoria i pla | Tots dos `valid:true`; pla vinculat al torn documental. |

No s'ha tornat a executar la suite Vitest sencera ni build de producte, perquè no s'ha aplicat codi. No es reutilitza el «82/82» de Claude com si fora una prova d'esta v2. Les propostes no són un PR provat; les seues connexions de bootstrap i contracte indiquen exactament què ha de provar la fase d'implementació.

Hashes SHA-256 del tall inspeccionat (cap d'estos fitxers s'ha modificat per Codex en este torn):

```text
src/host.js a4fee84fcc8e26862cfb47865389d7293723ddc23afbdc6c66997ba648101e3a
src/data/adaptadors/sollutia/client.js ea95e3029af758672c1f5584302b32f09ce3baddcd22e485e304e3eded4f50f2
src/PedraSecaEmbed.jsx 4358731f5a55a9cf7dc796f10ac33eef3510ba48f367cdc64b922c7f345ee747
src/sections/consola/ConsolaSection.jsx 997dac7bf89ebc684aca570430ae95b1f8387fde34852a98065145263ddd068f
tooling/gates/mutation-policy.mjs fb99eef371d890abda441372a401a7680319e055128497683f8b33e497ea781f
```

## Límits

Mode AFK: codi de producte/control intacte; només entrega documental, pla i relleu de sessió. No hi ha captura real Sollutia, token acordat, autenticació remota verificada, migracions aplicades, RLS provada en servidor ni comprovació de protecció de branca. No s'ha provat l'operació offline. «100% independents» és un objectiu que requerix titularitat i assaig de portabilitat, no una propietat que done un fitxer host.js.

Les propostes de codi tenen dependències explícites entre elles. El client resta inhabilitat sense contracte i la UI no inventa dades quan falta la font. La composició no es pot aplicar a host sense adaptar main/embed i transports. Tres fallades que la implementació ha de prevenir: publicació parcial de política, curses d'arrencada i una captura antiga incompatible amb el servidor.

**Tancament executat:** `valid:false`, `state:planned`. Passen plantilles, autoritat, LEDGER i segell; fallen skills, Wiki i SCC. El primer check final també detecta el pla modificat concurrentment i `src/sections/text/pageContent.js` fora de l'abast documental: no són canvis de producte executats per este Codex. No s'han revertit ni s'ha canviat l'abast a code per silenciar-los. Registres ESTAT/LEDGER actualitzats amb executor i lease consumida `b5a08b72-0dc3-43e9-a5fe-b6651179e8a8`; transacció `52044eb2-77ce-4d44-bf8e-f4a34358d72a`, hash de segell conservat 69100848…. No és una reconciliació de regles.

**Incidència addicional R10 / P2:** `reserveBootstrap()` copia automàticament `prompt_consell.md`, però `assertBootstrapPair()` exigix exactament els dos fitxers declarats. El primer seal ha fallat amb tres entrades; comprovada la causa en el codi, s'ha conservat la còpia mecànica en temporal i el segon seal ha passat amb la parella exacta. No s'ha modificat el validador ni s'ha esborrat cap document de l'escriptori. Cal alinear bootstrap i protocol en la futura reparació.

El tancament global continua condicionat al deute real de skills/Wiki/SCC; no s'abaixen portes per donar verd a una auditoria. L'Acta Marmota global de final de conversa continua pendent. El nom del fitxer conserva l'hora termodinàmica demanada pel Mestre, encara que la revisió es lliure després.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2305_pla_implementacio_fortificacio_sollutia]]
- [[260923_2305_auditoria_claude]]
- [[260923_2305_prompt_fortificacio_sollutia]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
