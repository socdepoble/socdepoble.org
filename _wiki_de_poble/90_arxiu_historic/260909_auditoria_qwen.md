---
tipus: document
estat: esborrany
description: "🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Qwen)"
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Qwen)

**Dictamen executiu**
L'anàlisi de Qwen s'ha centrat de forma profunda en la resiliència del codi d'autenticació (GoTrue) i l'alineació legal amb les directives de l'Agència Espanyola de Protecció de Dades (AEPD) per a 2024-2026.

## Troballes Crítiques i Normatives
1. **Paret de Galetes (Cookie Wall)**: L'AEPD prohibeix bloquejar l'accés sense consentiment. L'arquitectura actual, al dependre completament de Supabase a l'arrencada (`supabaseBackend.js`), podria carregar recursos i autenticació abans d'obtindre un consentiment, la qual cosa violaria la norma. Tanmateix, l'aplicació no usa cookies d'analítica, pel que això aplica als _tokens_ d'autenticació (tractament necessari).
2. **Race Conditions en `onAuthStateChange`**: Qwen alerta d'un problema conegut en Supabase GoTrue on múltiples crides o recàrregues asíncrones de sessió causen expulsions ("Sortides fantasma") degut a que el `role` o la sessió triguen a sincronitzar-se. Si falla la xarxa, el client pot esborrar la sessió local.
3. **Mancança de Fallback**: `supabaseBackend.js` i `backendPort.js` depenen síncronament de Supabase en l'arrencada, el que pot causar pantalles blanques si hi ha talls de cobertura al poble.
4. **Visió Legal i Online-First**: Les promeses "Online-First" a la web, sense un fallback transparent offline, podrien ser considerades enganyoses sota el marc RGPD/LSSI-CE, confirmant la necessitat de modificar el text legal cap a una definició realista d'"Online-First".
