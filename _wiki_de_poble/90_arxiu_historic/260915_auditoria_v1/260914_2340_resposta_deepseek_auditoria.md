---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: Deepseek"
---
# 🛡️ Auditoria del Bundle — 260914_2308_BUNDLE_auditoria (Deepseek)

He llegit el bundle sencer (529 fitxers, 3,37 MB). No puc verificar les sumes SHA256 perquè el manifest està minificat en una sola línia i el cos s'ha tallat abans del final del `tractor-vocabulari.mjs`, però **sí que puc auditar el contingut**. Vaig al gra.

---

## Veredicte general

**El bundle està en bon estat estructural, però arrossega una fractura doctrinal greu que cap porta detecta: el projecte es descriu simultàniament com a *Offline-First* i *Online-First*, i les dues versions conviuen a la Wiki, al codi i a les skills.**

No és un problema de qualitat del codi. És un problema de **coherència de context**: una IA nova que arranque llegint el bundle traurà una conclusió diferent segons quin fitxer òbriga primer.

---

## 1. Fractura doctrinal: Offline-First vs Online-First

Això és el més important del bundle. Hi ha **dues realitats oposades** declarades com a canòniques:

**Banda Online-First (la que el LEDGER diu que és vigent):**
- `_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` — "Supabase com a font de veritat, cap garantia de reconciliació offline"
- `src/ARCHITECTURE.md` — "El sistema és estrictament Online-First"
- `src/data/SELF-DESCRIBE.md` — "El Frontend és un Terminal Estúpid"
- `.agents/BOOTSTRAP.md` — "El sistema és 100% Online"
- `src/GLOSSARI.md` — "Offline-First... s'ha extirpat completament"

**Banda Offline-First (la que sobreviu a la Wiki i a les skills):**
- `_wiki_de_poble/02_saber/codex_huma/arquitectura_sistema_nervios.md` — descriu Y.js/CRDT/WebRTC com a arquitectura
- `_wiki_de_poble/02_saber/skills/contingencia_offline.md` — "Motor Offline i Resiliència" com a skill activa
- `_wiki_de_poble/01_ser/03_equip_ia.md` — menciona "CRDT/P2P" com a part del projecte
- `src/sections/dispositius/devicesRuntime.js` — implementa BroadcastChannel "P2P" entre dispositius
- `.agents/skills/pedra-seca/SKILL.md` — "L'objectiu és aconseguir consistència visual total de tipus 'Aplicació Nativa/Offline'"

**Impacte:** Una IA que arranque llegint `.agents/BOOTSTRAP.md` (ordre oficial) i després òbriga `arquitectura_sistema_nervios.md` es trobarà dues lleis contradictòries. La resposta serà inventar-se una tercera via. **Això és el que va passar amb el cisma A10 — i ha tornat a passar amb l'Offline-First.**

**Recomanació (prioritat màxima):** Un ADR únic, signat, que diga: *"A data de 260914, Sóc de Poble és Online-First estricte. CRDT, Y.js, WebRTC, OPFS i P2P són recerca futura, no arquitectura activa. Tota la Wiki que els descriga com a vigents s'ha de reetiquetar com a `estat: esborrany` o `estat: historic`."* I després passar `tractor-doctrina-maquinari` per a forçar-ho mecànicament.

---

## 2. El sistema de disseny Pedra Seca té tres contradiccions internes

**2.1. Zero Tailwind vs Tailwind instal·lat**

- `.agents/skills/pedra-seca/SKILL.md` diu "ZERO Tailwind CSS... ESLint bloquejarà el commit"
- `package.json` **no té Tailwind** com a dependència — però `src/ARQUITECTURE.md` i `estandard_ui_universal.md` diuen "Tailwind està instal·lat i importat"
- `estandard_ui_universal.md` admet: "no hi ha una prohibició absoluta de Tailwind"

La doctrina diu una cosa, el codi en diu una altra, i la wiki intermèdia en diu una tercera. **El `tractor-antitailwind` atrapa l'ús, però no la contradicció doctrinal.**

**2.2. `--sdp-canon-*` citat per components**

`tractor-tokens.mjs` (T5) prohibix que components citen `--sdp-canon-taronja` o `--sdp-canon-blau`. Però `src/config/design-tokens.json` diu que són "les constants de marca i els mínims físics". Si cap component els pot citar, **la capa 0 només existix per a la rampa d'`index.css`**. Açò és correcte com a disseny, però la documentació de `design-tokens.json` no ho diu i convida a citar-los.

**2.3. `UniversalManager` deprecated però encara importat**

- `src/components/universal/manager/UniversalManager.jsx` — "@deprecated Usa `UniversalWorkspace`"
- Però `tractor-fitxa-gestor.mjs` encara el vigila com a superfície
- I `src/sections/admin/AdminSection.jsx` l'importa

No és un error — és deute tècnic legítim — però el `registre.js` del catàleg no el marca com a `obsolet`, així que un agent nou el tractarà com a canònic.

---

## 3. Rutes: tres fonts de veritat simultànies

`tractor-rutes-web.mjs` és una bona porta, però detecta problemes que **no s'han resolt**:

- `src/app/App.jsx` — taula de `<Route>` real
- `src/config/sections.js` — taula de seccions de navegació
- `src/config/navigation.js` — prefixos d'ítem per a detall

El bundle mostra que `navigation.js` encara construïx prefixos com `/${sectionId}` quan `sections.js` pot tindre un path distint. **W3 (item-fora-de-llista) hauria d'estar fallant.**

A més: `SEARCH_SECTION` existeix a `sections.js` però `SearchSection` no té `<Route>` explícit a `App.jsx` — es resol per `path="*"`. Això vol dir que `/cerca` no és canònica; la canònica és qualsevol ruta desconeguda que caiga al `SearchSection`. **És una fragilitat, no un error.**

---

## 4. Seguretat: punts que m'han cridat l'atenció

**4.1. `supabase/seed.sql` encara conté dades reals?**

El bundle inclou un `tractor-llavor.mjs` que verifica que `seed.sql` **no** continga "Javi Llinares". Però el `seed.sql` del bundle **sí que conté** `"seller": "Mestre Poble"` i referències a "Sóc de Poble" com a entitat. No és una violació de la llei (el nom és un àlies), però **l'auditoria hauria de confirmar que la llavor és 100% sintètica**.

**4.2. `service_role` a `tractor-rls.mjs`**

El propi tractor prohibix `service_role` al codi. Però `supabase/migrations/260908_0000_initial_schema.sql` i les migracions posteriors **no contenen la paraula `service_role`** — bé. El risc està controlat.

**4.3. `src/data/oauthRelay.js`**

Aquest fitxer és el més sensible del bundle. Implementa PKCE, valida origen, i té un "circuit breaker" d'intents. **Està ben fet.** L'única cosa que em preocupa: el `state` es guarda a `sessionStorage` sota `sdp:oauth:state`, però **no es neteja després de bescanviar el codi** en tots els camins. Hauria de fer-se un `delEfimer('sdp:oauth:state')` a `bescanvia()`.

---

## 5. Coses que estan bé (i cal dir-ho)

No tot és problema. Coses que m'han agradat:

1. **`tractor-fitxa-gestor.mjs`** — és una porta extraordinàriament ben pensada. El contracte tancat, el pressupost vertical, la prohibició de `renderItem`... és exactament el que cal per a evitar que cada consumidor pinta la seua versió de la fitxa.
2. **`tractor-crom.mjs`** — la idea de separar `--sdp-crom-*` de la resta de tokens és correcta. La TopBar i la SideBar han de ser immutables.
3. **`reflex_petorreta.mjs`** i el protocol P-01 a P-12 — el sistema de lease, claim i consum és sòlid.
4. **`src/data/frontissa/`** — la capa anticorrupció està ben dissenyada. El `traductor.js` amb `creaTraductor()` i `valida()` és net.
5. **`farcell.mjs`** — la verificació de completitud del bundle és exactament el que faltava.

---

## 6. Recomanacions prioritzades

| Prioritat | Acció | Justificació |
|---|---|---|
| **P0** | Unificar la doctrina Offline/Online en un sol ADR i forçar `tractor-doctrina-maquinari` a vigilar-ho | És la fractura més greu i afecta cada decisió nova |
| **P0** | Executar `tractor-rutes-web.mjs` i resoldre W1–W5 | El bundle diu que hauria de fallar; si no falla, la porta no funciona |
| **P1** | Eliminar `UniversalManager.jsx` o marcar-lo `estat: obsolet` al registre | Evita que agents nous l'usen |
| **P1** | Decidir si `--sdp-canon-*` s'ha de poder citar o no, i alinear la documentació | La contradicció actual confon |
| **P2** | Afegir `delEfimer('sdp:oauth:state')` a `bescanvia()` d'`oauthRelay.js` | Higiene de seguretat menor |
| **P2** | Verificar que `seed.sql` és 100% sintètic | El tractor-llavor ja ho vigila, però el bundle no ho confirma |
| **P3** | Afegir `estat: obsolet` a `registre.js` per a components deprecated | Millora la qualitat del catàleg |
