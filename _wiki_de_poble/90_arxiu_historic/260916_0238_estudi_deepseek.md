---
tipus: document
estat: esborrany
description: Estudi Deepseek — Auditoria Extrema v2 (Bundle 1.4MB)
---
# Estudi Deepseek — Auditoria Extrema v2 (Bundle 1.4MB)
Data: 2026-09-16
Nota: **4.0 / 10**

## 1. Resultats Globals
Deepseek s'ha pres l'auditoria molt seriosament i s'ha centrat en vectors d'atac específics de la implementació JavaScript, clavant un 4/10 molt pedagògic. Confirma la vulnerabilitat crítica de la fuita de sessió (el Singleton de Supabase) que va trobar Gemini, i afegeix troballes espectaculars sobre com enganyar el nostre sanititzador.

## 2. Punts Crítics i Feus Nous

1. **[ALT] Bypass de DOMPurify (XSS per SVG)**: Ha detectat que la nostra expressió regular d'URIs permeses (`ALLOWED_URI_REGEXP`) accepta `data:image/` de forma global. Això significa que un atacant pot fer un enllaç `<a href="data:image/svg+xml,<svg onload=alert(1)>">` i DOMPurify el deixarà passar. En fer-hi clic, l'usuari executaria JavaScript maliciós. És un bypass clàssic però perillós.
2. **[ALT] Open Redirect Protocol-Relative (`//`)**: La mateixa expressió regular permet enllaços que comencen per `//` (com `//pirata.com`). En el context web, això carrega el domini extern.
3. **[ALT] Popup OAuth Trencat en Producció**: Coincideix amb Grok en l'error del `targetOrigin` del `postMessage` a `oauthRelay.js`, però Deepseek ens dóna la solució exacta: hem de llegir l'`sdp_origin` de la query i usar-lo per dirigir el missatge a la pestanya parenta, en comptes de fer servir l'origen del propi relé.
4. **[MITJÀ] Forat en `setBackendImplementation`**: Aquesta funció de `backendPort.js` accepta un paràmetre `force` per saltar-se el bloqueig de seguretat de l'arquitectura. Està pensat per a tests, però està lliurement exportat. Si hi hagués un XSS, un atacant podria cridar eixa funció i substituir tot el backend. Cal restringir l'ús de `force` únicament a l'entorn de desenvolupament (`import.meta.env.DEV`).

## 3. Conclusió
Deepseek consolida les troballes anteriors i tanca els últims forats microscòpics de la nostra frontera de sanejament de text i comunicacions de relé. Una anàlisi impecable.
