---
tipus: document
estat: esborrany
description: "🛡️ DICTAM DEL CONSELL — FASE 4: SUPABASE I TIPTAP"
---
# 🛡️ DICTAM DEL CONSELL — FASE 4: SUPABASE I TIPTAP

> **Nota de recepció:** el bundle `260913_0420_BUNDLE_auditoria.md` **no ha arribat per este canal**. L'anàlisi es fonamenta en l'estat descrit a la petorreta (Fase 3 tancada, contracte de Caixa Única, símptomes reportats). Tota hipòtesi sobre codi concret és **verificable contra el bundle**; si es reenvia, el Consell afinarà amb línies exactes.

---

## 0. Triage del bug "No hi ha sessió" (abans de tocar res)

El missatge és un **literal nostre**, no un error de Supabase (Supabase no emet text en català). Orde de probabilitat:

1. **El flux de perfil injecta un servei mock** en lloc del client real d'Auth — la pròpia petorreta ho sospita. On mirar: quin servei consumeix la pantalla d'edició de perfil.
2. **Dues instàncies de client Supabase** (dos `createClient`): una persisteix la sessió i l'altra no, o es llig la sessió abans que la restauració asíncrona del token resolga.
3. RLS de Storage absent → descartat com a causa d'este missatge (donaria error de política, no "no hi ha sessió").

**Acció 4.1 (≈1h):** cercar el literal de l'error; comptar instàncies de client; garantir `persistSession: true` i **esperar sempre `getSession()`** abans de qualsevol pujada.

---

## 1. Qüestió 1 — Sessió i Storage sense trencar el plugin

### Principi: Ports i Adaptadors (inversió de dependències)

Supabase pertany a la **capa host** (socdepoble.org). La closca pertany al **core endollable**. La frontissa entre ambdós és un **port** (interfície) que l'host injecta:

```ts
// core/editor/ports.ts — RES de Supabase ací
export interface MediaPort {
  uploadAsset(file: File, scope: 'avatar' | 'content'): Promise<{ url: string }>
  removeAsset?(url: string): Promise<void>
}

export class MediaPortError extends Error {
  constructor(public code: 'NO_SESSION' | 'NETWORK' | 'QUOTA') { super(code) }
}
```

### Regles d'or

1. **Un sol client Supabase** a tota l'app, creat al bootstrap, injectat via context. Elimina la divergència d'estat de sessió de soca-rel.
2. **Cap import de `@supabase/*` sota el paquet de la closca.** Gate de CI (grep o import-linter). El mock no s'elimina: es disciplina — queda darrere de la mateixa interfície per a demos/Storybook, mai cablejat al codi productiu.
3. **La "sessió" no és un concepte de la closca.** Si el port no s'injecta, les ordres multimèdia simplement no apareixen. Si s'injecta i falla amb `NO_SESSION`, la closca només tradueix l'error a UX ("Cal iniciar sessió"), amb botó a login. Mai una excepció silenciosa — i menys per a la gent major.
4. **Online-First honest:** sense cues offline ni reintents automàtics. Error de xarxa → missatge clar i reintent manual.

### Adaptador i Storage

- `assertSession()` dins l'adaptador → si null, llança `MediaPortError('NO_SESSION')`.
- Buckets separats: `avatars` i `content`. Conveni de rutes: `avatars/{uid}/profile-{hash}.jpg`, `content/{docId}/{hash}.jpg`. Polítiques: escriptura per a `authenticated` restringida a la carpeta pròpia (`auth.uid() = (storage.foldername(name))[1]`).
- **URLs públiques** (el contingut de l'associació és públic); signed URLs només si algun dia cal protegir esborranys — decisió diferible.
- Redimensionat d'avatar al client (canvas, ~512px, jpeg 0.85) abans de pujar: respecte a l'amplà de banda rural.
- **Mai base64 dins del JSON del document** — només referències URL. El protocol de commit amb `visibilitychange` continua lleuger.

Punt clau: la pujada d'avatar és una **característica de l'host** (pantalla de perfil), no de l'editor. El mateix adaptador servirà després les imatges de contingut dins TipTap.

---

## 2. Qüestió 2 — TipTap ric sense col·lapse de la Caixa Única

### 2.1 Motor obert: del StarterKit tancat a un registre

`useUniversalRichText` passa de tancat a **configurable** (les extensions es fixen a la creació de l'Editor, així que la llista final es computa abans d'instanciar-lo):

```ts
useUniversalRichText({
  content, onCommit,
  extensions?: Extensions,   // ampliable per l'host
  media?: MediaPort,         // absent => ordres multimèdia ocultes
})
```

### 2.2 Slash Menu

- Via `@tiptap/suggestion` (utilitat oficial, lleugera; navegació amb fletxes i Enter de sèrie) + **component React propi**. **Ni tippy ni floating-ui**: portal ancorat al `clientRect` del suggeriment basta.
- El portal es munta **al `document.body`**, fora del `ues-scroll`, per a no patir retall per `overflow`. Tots els estils sota prefix `ues-slash-*` al full propi de la closca — **cap Tailwind, cap estil global**.
- Les ordres són un registre declaratiu:

```ts
{ id: 'hr',    title: 'Divisor', action: ({ editor, range }) => editor.chain().focus()
    .deleteRange(range).setHorizontalRule().run() },
{ id: 'image', title: 'Imatge',  requires: 'media', action: async ({ editor, range, media }) =>
    /* file picker → media.uploadAsset → setImage({ src: url }) */ },
```

### 2.3 Nodes nous i higiene CSS

| Node | Dependència | Regla de la Caixa Única |
|---|---|---|
| Divisor | HorizontalRule (de sèrie o extensió oficial) | marges proporcionals, cap alçada fixa |
| Imatge | `@tiptap/extension-image` | `.ues-content img { max-width: 100%; height: auto }` |
| Vídeo/Embed | **node custom mínim** (~40 línies, zero deps) | `aspect-ratio: 16/9; max-width: 100%`; overlay del NodeView en selecció perquè l'iframe no es "menge" els clics |
| Placeholder | `@tiptap/extension-placeholder` | text d'ajuda: *Escriu "/" per insertar…* |

**Prohibides alçades fixes en px** dins de nodes embed: són la via curta al col·lapse del `ues-scroll`.

### 2.4 Seguretat dels embeds

- **Allowlist de proveïdors** (ex.: youtube-nocookie, vimeo) validada abans d'inserir; només `https`; `loading="lazy"`.
- Al JSON només `src` i `provider`; l'schema de TipTap descarta la resta en enganxar HTML.
- Bloquejar `javascript:` a qualsevol URL d'imatge/embed.

---

## 3. Roadmap Fase 4

| Sub-fase | Contingut | Gate |
|---|---|---|
| 4.1 | Triage sessió (literal, instàncies, mock al perfil) | Avatar puja E2E amb sessió real |
| 4.2 | `MediaPort` + adaptador Supabase + client únic | `grep '@supabase' core/editor/` → 0 resultats |
| 4.3 | `useUniversalRichText` configurable | Sense config extra, comportament idèntic a Fase 3 |
| 4.4 | Slash Menu + Divisor + Placeholder | Menú no retallat; sobreviu a resize |
| 4.5 | Imatge via `MediaPort` | Pujada real; sense sessió → missatge + login |
| 4.6 | Embed vídeo amb allowlist | Test aspect-ratio + validació de dominis |

**Ordre estricte:** 4.1 i 4.2 abans de tocar TipTap. El bug de sessió és de l'host; no el barregem amb el refactor del motor.

## 4. Criteris d'acceptació (Caixa Única intacta)

1. L'editor munta **sense port** (mode demo) sense pantalla blanca ni crash.
2. Pujada sense sessió → UX graceful, cap excepció no capturada.
3. El commit amb `visibilitychange` **serialitza imatges i embeds** (test de regressió amb JSON resultant).
4. Cap estil de la closca fora del prefix `ues-`.

## 5. Riscos

| Risc | Mitigació |
|---|---|
| Clients Supabase duplicats | Instància única + gate de lint |
| XSS via URLs d'usuari | Allowlist + https + validació d'esquema |
| Col·lapse CSS (menu/embed) | Prefix `ues-`, aspect-ratio, tests de retall |
| Dades personals (avatar) | Pujada voluntària pròpia; `removeAsset` de l'avatar substituït (minimització) |

---

## Decisió del Consell

**APROVEM:** arquitectura Port/Adapter amb client Supabase únic a la capa host; slash menu amb `@tiptap/suggestion` + portal propi i zero dependències extra; embed com a node custom. **REBUTJEM:** qualsevol import directe de Supabase a la closca, cues offline, o llibreries de posicionament/embed per a açò. Risc destructiu: inexistent (tot és additiu) — no s'activa SDP-LOCK.

*Pendent: reenviar el bundle per a precisió a nivell de línia abans d'executar 4.1.*
