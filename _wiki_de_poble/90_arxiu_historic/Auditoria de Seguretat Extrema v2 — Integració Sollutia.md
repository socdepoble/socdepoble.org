---
tipus: document
estat: esborrany
description: AUDITORIA DE SEGURETAT EXTREMA v2 — Integració Sollutia
tags:
  - disseny
  - identitat
---
\n# AUDITORIA DE SEGURETAT EXTREMA v2 — Integració Sollutia

**Identificador:** SDP-AUDIT-202609160146
**Bundle verificat:** `260916_0146_BUNDLE_auditoria.md` (sentinella `<<<FI_DEL_BUNDLE>>>` present, línia 75116)
**Fitxers al manifest:** 541 · **Fitxers extrets:** 541 · **Codi verificat amb SHA-256:** 391/391 fitxers de codi OK
**Agent redactor:** Perplexity (Consell de la Petorreta)
**Propietari:** Sóc de Poble (Javi Llinares)

---

## Veredicte executiu

El codi font de Sóc de Poble està construït amb una disciplina de seguretat notablement superior a la mitjana. Hi ha una arquitectura de defenses en profunditat clara: sanejament HTML centralitzat amb DOMPurify, segellat de backend en dues fases, OAuth amb PKCE, RLS estricta a Supabase, i un sistema de portes estàtiques (`tractor-*`) que audita el codi abans de cada build.

**No s'han trobat vulnerabilitats crítiques d'execució remota (RCE), fuites de secrets hardcoded, o forats d'SSRF de servidor.** L'adaptador de Sollutia és deliberadament read-only i bloquejat per contracte. El Web Component `PedraSecaEmbed.jsx` tanca la finestra d'injecció de backend amb un pany de dues fases.

S'han identificat **un bloc de defectes CSP d'alta severitat** (CSP permissiu amb `'unsafe-inline'` i absència de `connect-src` restringit), **una observació moderada** (deute de supply-chain al build), i **diverses incògnites** que requereixen verificació en el context de desplegament real.

---

## Troballes crítiques reals

### T1 · CSP permet `'unsafe-inline'` i `https:` obert a `script-src`

**Fitxer:** `index.html:8`

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' https: data: blob:;
  style-src 'self' 'unsafe-inline' https:;
  script-src 'self' 'unsafe-inline' https:;
  object-src 'none'; base-uri 'self';">
```

**Risc:** La directiva `script-src 'self' 'unsafe-inline' https:` desactiva la protecció CSP contra XSS de tres maneres simultànies:

1. **`'unsafe-inline'`** permet executar qualsevol `<script>` inline o atribut `onclick` injectat. Si es troba una via d'XSS (i n'hi ha diverses amb `dangerouslySetInnerHTML`), el CSP no la bloquejarà.
2. **`https:` (wildcard)** permet carregar scripts des de **qualsevol origen HTTPS**. Un CDN compromès, un subdomini capturat, o qualsevol servei HTTPS pot injectar JavaScript al context de l'aplicació.
3. **`default-src 'self' https: data: blob:`** fa que `connect-src` caiga a aquest fallback, permetent peticions XHR/fetch a qualsevol origen HTTPS — via potencial d'exfiltració de dades, incloent el JWT de `sessionStorage`.

Aquesta mateixa directiva també afecta `style-src`, on `'unsafe-inline'` permetria exfiltració CSS via atributs `style` (tot i que DOMPurify bloqueja `style` a `FORBID_ATTR` a `src/utils/sanitize.js:87`).

El comentari a `index.html:9` indica que `'unsafe-inline'` és temporal per al Grid del Shadow DOM i el Pull-to-refresh. Açò és una deute tècnica de seguretat activa.

**Impacte:** Alt. El CSP és l'última línia de defensa. Amb `script-src 'unsafe-inline' https:`, qualsevol XSS que escape al sanejador de DOMPurify tindrà via lliure per executar codi, robar tokens de `sessionStorage`, i exfiltrar dades a qualsevol servidor HTTPS.

**Recomanació:**
- Restringir `script-src` a `'self'` + nonces per a scripts inline legítims.
- Afegir `connect-src 'self' https://*.supabase.co https://auth.socdepoble.org <origen-sollutia>` al CSP.
- Restringir `default-src` a `'self'` + llistes d'origen específiques.
- Revisar si el Grid del Shadow DOM pot usar un nonce en lloc de `'unsafe-inline'`.

---

## Troballes moderades

### T2 · `new Function()` al constructor del manifest SEO (deute de supply-chain)

**Fitxer:** `tooling/gates/build-seo-manifest.mjs:58`

```javascript
const context = {};
new Function('context', codiAvaluat)(context);
```

**Risc:** S'avalua codi transformat de `src/config/sections.js` amb `new Function()`. L'input és un fitxer del propi repositori (no entrada d'usuari), per tant el risc directe és baix. No obstant això, aquest patró és un vector d'injecció de codi si el fitxer font és compromès o modificat per una persona amb accés d'escriptura. És una eina de build (Node.js), no s'executa al navegador.

**Impacte:** Baix-moderat. Només en temps de build. No afecta l'usuari final directament, però comprometria el pipeline de CI/CD si `sections.js` és manipulat.

**Recomanació:** Reemplaçar `new Function()` per un parser estàtic (AST amb `@babel/parser`, que ja és al `devDependencies`) o per `import()` dinàmic amb un mòdul temporal.

---

## Incògnites (requereixen verificació en context de desplegament)

### I1 · Atributs HTML del Web Component permeten redirigir `supabase-url` (BLOQUEJANT per a integració)

**Fitxer:** `src/PedraSecaEmbed.jsx:136-146` (atributs observats), `src/PedraSecaEmbed.jsx:151-175` (`sanejaConfig`), `src/data/supabase/runtime.js:38-52` (`buildHeaders`)

El custom element `<soc-de-poble>` accepta atributs HTML com `supabase-url`, `supabase-anon-key`, `bot-api-url`. Aquests es processen a `sanejaConfig()`, que valida URLs bloquejant `//` (protocol-relative) i requerint protocol `https:` o `http:`. No obstant això, **permet `http:` i qualsevol origen `https:`**.

Si un editor de contingut WordPress, o qualsevol persona amb accés a inserir HTML al DOM de l'amfitrió, pot afegir l'atribut `supabase-url="https://atacant.com"` a l'element `<soc-de-poble>`, el JWT de l'usuari (guardat a `sessionStorage`) s'enviarà com a `Authorization: Bearer ${jwt}` a aquesta URL maliciosa via `src/data/supabase/runtime.js:40`.

**La pregunta clau:** qui pot controlar els atributs HTML de `<soc-de-poble>` en el context de Sollutia? Si només administradors de confiança poden inserir el bloc/shortcode, el risc és baix. Si qualsevol editor o usuari amb permisos de contingut pot afegir l'element, això és una fuita de token. **Aquesta incògnita és bloquejant per a la integració amb Sollutia** fins que es verifique la frontera de confiança del host.

**Recomanació:** Independentment del context, rebutjar `http:` fora de localhost/dev i aplicar una allowlist d'origens permesos per a `supabaseUrl` i `botApiUrl` dins de `sanejaConfig()`, en lloc d'acceptar qualsevol `https:`.

### I2 · Configuració de Supabase al panell (no auditable al bundle)

RLS Realtime, límits de GoTrue (brute-force protection), i configuració d'URLs de redirecció depenen del panell de Supabase, que no està al bundle. El codi envia `captcha_token: null` a `src/data/supabase/auth.js:130` en el flux de Magic Link. Si CAPTCHA no està activat al panell de Supabase, no hi ha protecció contra automatització d'enviaments de Magic Link.

### I3 · Llista blanca d'origens de Sollutia incompleta

**Fitxer:** `public/auth/callback.html:73-81`

`ORIGENS_PERMESOS` té `'https://socdepoble.sollutia.com'` afegit, però els comentaris indiquen que cada WordPress on s'incrusta el component necessita el seu origen exacte registrat. Aquesta llista ha d'omplir-se abans del desplegament real. Fins que no estiga completa, l'entrada amb Google només funciona als dominis propis i en local.

### I4 · Bypass de fitxers prohibits del manifest

El manifest declara `fitxers_prohibits: ["DOC_Logos_Oficials.md", "Soci_Sollutia.md", "all_ai_responses.md", "legalContent.js", "perfil_psiquiatric.md"]`. No obstant això, el bundle conté `_wiki_de_poble/02_saber/soci_sollutia.md` i `_wiki_de_poble/02_saber/doc_logos_oficials.md`. La prohibició és per nom de basename amb majúscules (`Soci_Sollutia.md`), però els fitxers reals usen minúscules (`soci_sollutia.md`), el que suggereix un bypass per diferència de casing o per canvi de ruta.

Després d'inspeccionar el contingut: `soci_sollutia.md` és documentació sobre la relació amb Sollutia (sense secrets ni dades sensibles), i `doc_logos_oficials.md` descriu regles d'ús de logos amb rutes placeholder (sense assets reals). No hi ha fuita de dades, però la prohibició del manifest no s'està complint.

---

## Àrees verificades com a segures

| Àrea | Fitxer:linia | Avaluació |
| --- | --- | --- |
| Sanejament HTML | `src/utils/sanitize.js:71-87` | DOMPurify amb llista blanca estricta, ganxos per bloquejar imatges externes, `rel=noopener noreferrer nofollow` en enllaços. Gate estàtic `tractor-innerhtml.mjs` obligatori. |
| XSS — `dangerouslySetInnerHTML` | `src/sections/detail/PageDetailSection.jsx:60`, `detailRichText.jsx:8`, `TextSection.jsx:40`, `UniversalEditorShell.jsx:47` | Tots els punts d'injecció HTML passen per `sanitizeHtml()`. Cap HTML cru sense sanejar. |
| OAuth PKCE | `src/data/oauthRelay.js:140-175` | Flux PKCE complet, `code_verifier` mai ix de la pestanya, `state` validat per igualtat estricta. Flux implícit explícitament suprimit. |
| Relé d'autenticació | `public/auth/callback.html:72-175` | Llista blanca d'origens amb comparació `===` (no `startsWith`). `sdp_path` validat amb regex `^(/$|\/[a-zA-Z0-9\-\/]*)?$`. Comentaris de seguretat explícits sobre redirector obert. |
| `postMessage` origin check | `src/data/oauthRelay.js:197` | Validació estricta: `e.origin !== origenRelay && !(import.meta.env?.DEV && e.origin !== window.location.origin)`. En producció només accepta l'origen del relé. |
| Segellat de backend | `src/host.js:175`, `src/data/backendPort.js:32-34` | Dues fases: configuració → segellat. `Object.freeze(currentImpl)` després de `arrenca()`. Injecció tardana llança excepció. Únic `window.SocDePoble` global amb `writable:false, configurable:false`. |
| Adaptador Sollutia | `src/data/adaptadors/sollutia/client.js:16,30,41` | Read-only per construcció: `method: 'GET'`, `credentials: 'omit'`, `Authorization: Bearer ${token}`. `escriu()` sempre falla (`ESCRIPTURES_PERMESES = Object.freeze([])`). `baseUrl` ha de ser HTTPS. |
| Supabase RLS | `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:25,44,112` | `SECURITY DEFINER` amb `search_path = ''` a totes les funcions. Cap política de `profiles` inclou `anon`. `handle_new_user()` ignora metadata del client i llig `poble_per_defecte` de `private.ajustos`. |
| Rate limiting (xat) | `supabase/migrations/260908_xat_v2_correccions.sql:387,397,416` | `pg_advisory_xact_lock` atòmic, 15 missatges/5s per usuari. |
| Emmagatzematge de tokens | `src/data/identitat.js:58-135`, `src/config/storage.js:1-72` | JWT i refresh_token a `sessionStorage` (no `localStorage`). Funció `purgaLlegat()` esborra tokens antics de cookies i localStorage al primer carregament. |
| Detecció de clau service_role | `vite.config.js:9-18` | El build llança excepció si `VITE_SUPABASE_ANON_KEY` conté un JWT amb `role: service_role`. |
| `sanejaConfig` URL validation | `src/PedraSecaEmbed.jsx:151-175` | Bloqueja URLs protocol-relative (`//`), valida protocol. *(Però accepta qualsevol `https:` — vegeu Incògnita I1)* |
| `innerHTML` al fallback d'arrencada | `src/host.js:201` | Ús d'`innerHTML` només en el camí d'error de boot. El missatge d'error s'injecta via `textContent`, no via concatenació HTML. Segur. |
| Consentiments RGPD | `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:10-40` | Taula independent amb RLS, IP hasheada, només `authenticated`. |

---

## Integritat del bundle

| Comprovació | Resultat |
| --- | --- |
| Sentinella `<<<FI_DEL_BUNDLE>>>` | Present (línia 75116) |
| Fitxers declarats al manifest | 541 |
| Fitxers extrets | 541 (cap sense bloc de codi) |
| SHA-256 de fitxers de codi (.js, .jsx, .ts, .tsx, .sql, .php, .css, .html) | **391/391 verificats OK** |
| SHA-256 de fitxers .json | 3 fitxers no verificats per hash; la diferència és d'1 byte i compatible amb newline final d'extracció; no afecta cap fitxer de codi executable |
| SHA-256 de fitxers .md | 0 mismatches (tots verificats després de corregir l'extractor per fences niades) |
| Fitxers prohibits presents al bundle | 2 (`soci_sollutia.md`, `doc_logos_oficials.md`) — bypass per casing. Sense dades sensibles. |

---

## Nota de seguretat

# 7.5 / 10

**Justificació:** L'arquitectura base és sòlida i ben pensada (DOMPurify centralitzat, PKCE, RLS estricta, backend segellat, adaptador Sollutia read-only). Però el CSP amb `'unsafe-inline'` i `https:` wildcard a `script-src` desactiva la capa de defensa més important contra XSS, i l'absència de `connect-src` permetria exfiltració de dades. A més, la Incògnita I1 (redirecció d'endpoints per atributs HTML) és bloquejant per a la integració amb Sollutia. Si es confirma que editors no fiables poden tocar els atributs del component, la nota baixaria a 6.5–7.0. La nota puja a 8.5/10 si es corregeix T1 i es confirma que I1 no és explotable.

**No s'han trobat:** tokens hardcoded, secrets al codi, SQL injection (totes les queries van per PostgREST amb RLS), prototype pollution, ni vulnerabilitats en el segellat del Web Component. No hi ha SSRF de servidor; sí risc condicional de redirecció client-side d'endpoints per configuració (vegeu Incògnita I1).

---

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada com a tal o moguda a Incògnites?
- [x] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`? *(No verificable: el tooling no s'executa en aquest entorn)*

---

*Auditoria realitzada per Perplexity — Consell de la Petorreta. Pedra Seca = Sistema de Disseny (UI Kit).*
