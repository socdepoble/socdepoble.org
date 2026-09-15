---
tipus: document
estat: esborrany
description: "🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Perplexity)"
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA TÈCNICA (Perplexity)

**Dictamen executiu**
El sistema té una base arquitectònica coherent: React SPA + Supabase + port de backend injectable + model Online-First estricte. No cal introduir IndexedDB, cues Outbox, Service Workers de negoci ni patrons Online-First.

Els riscos més importants són:
1. La pàgina legal està resolta com a contingut estàtic del frontend i pot quedar desalineada amb l’esquema real de dades i les noves migracions.
2. Hi ha una incoherència entre el model legal declarat i el directori intern de membres del poble.
3. La càrrega remota ignora deliberadament les pàgines locals en mode remote, cosa que pot ocultar o desactualitzar el contingut legal.
4. El sistema conserva deute tècnic de disseny, CSS orfe i estils inline, però aquests problemes no s’han de barrejar amb la reparació urgent de la pàgina legal.
5. Ja existeixen correccions importants d’autenticació, RLS, xat i injecció de backend; cal protegir-les amb proves de regressió abans de continuar refactoritzant.

## Evidència arquitectònica
- **Model de dades**: La font remota és Supabase PostgreSQL. RLS activat, funcions SECURITY DEFINER amb search_path restringit.
- **Separació de responsabilitats**: React components ↓ backendPort.js ↓ host.js / implementació injectable ↓ Supabase o backend de Sollutia. Cap component de React hauria d’importar directament `supabaseBackend.js`.
- **Online-First**: La capa de persistència està documentada com a Online-First estricte. No s’han de crear cues locals de negoci ni persistir dades de contingut en localStorage.

## Problema de la pàgina legal
### Causa principal
El recorregut `/legal` utilitza `<TextRoute pageKey="legal" />`. Aquesta ruta depén de `useCoreContent()` i de la resolució de `pageCopy`. 
En mode remot, `loadCoreContent()` a `supabaseBackend.js` (o l'arxiu equivalent) pot retornar un `pageCopy` buit o desactualitzat respecte a `seed`, i per tant `TextRoute` pot fallar en trobar `pageCopy.legal`.

### Causa secundària: contingut legal obsolet
Les migracions del xat han introduït una nova realitat de privacitat: el sistema pot exposar el nom i l’identificador dels membres del mateix poble (funció `membresdelpoble`). Això contradiu el text legal anterior ("les dades personals mai es comparteixen sense consentiment").

### Causa terciària: llengua i SEO
L’aplicació fixa el document en valencià i utilitza `useSEO`. La pàgina legal ha de proporcionar explícitament aquests camps.

## Solució proposada
### P0 — Reparar la resolució del contingut
Cal fer que `loadCoreContent()` sempre retorne una font coherent per a les pàgines legals. Conservar el contingut canònic del frontend com a fallback segur, també en mode remot.
Exemple: `const pageCopy = seed.pages.reduce(...)` per garantir el fallback.

### P0 — Fer explícit el contracte de pageCopy
Eliminar objectes buits i garantir una forma única afegint una funció `normalizePageCopy(pages)`.

### P0 — Evitar una pàgina legal buida
`TextRoute` no hauria de fallar silenciosament. Ha de mostrar un `<UniversalPage>` de fallback si no troba la pàgina, però sense mostrar l'error cru a l'usuari.

### P0 — Actualitzar el contingut legal
La redacció ha de canviar per reflectir que es comparteixen dades amb membres del mateix poble.
Proposta: *"Per facilitar les converses entre persones del mateix poble, el sistema pot mostrar el nom públic o identificador de membres del mateix poble. Aquesta informació només és accessible a persones autenticades que formen part del mateix poble."*

## Millores sistèmiques prioritzades
- **P0 Legal**: `pageCopy` pot arribar buit en remot. Normalitzar i garantir fallback canònic.
- **P0 Privacitat**: El directori de membres modifica el tractament real. Actualitzar el text legal.
- **P0 Auth**: Mantindre `identitat.js` com a únic lector i escriptor de tokens.
- **P0 RLS**: El xat ha tingut polítiques circulars. Mantindre migracions obligatòries.
- **P1 Backend**: Provar injecció (fase de configuració i segellat).
- **P2 CSS**: Netejar classes orfes gradualment sense bloquejar el pegat legal.

## Decisió final
La reparació crítica és restablir el contracte de contingut de `pageCopy`, garantir la resolució de `/legal` en tots els modes i alinear el text legal amb el directori de membres. La resta de deutes s'han de tractar després en canvis xicotets.
