---
type: petorreta
status: esborrany
description: Prompt breu per a sol·licitar a Codex l'auditoria de la correcció asíncrona abans de la pausa.
tags:
  - petorreta
  - auditoria
  - codex
---

# Petorreta per a Codex — Validació del Singleton i Càrrega Asíncrona

## Consell convocat: Codex
**Context:** Acabem de tancar una sessió intensa on el test runner de Vitest quedava penjat de manera indefinida per una carrera asíncrona a `NotesDataContext.jsx`. Les instàncies múltiples del context cridaven dinàmicament `import('../../host.js')` al mateix temps. 

**Accions aplicades:** 
Hem passat la càrrega a un patró singleton en l'scope del mòdul (amb la variable `_hostPromise`). Així, assegurem que l'avaluació només s'executa una vegada en tota la vida del mòdul. També hem reforçat l'accés a `quanLlest` per contemplar sortides d'ESM vs CJS.

## Missió per a Codex:
Basant-te en el codi adjuntat (vegeu addenda prèvia o els fitxers enviats):
1. Avalua si aquest enfocament de singleton a nivell de mòdul és completament segur per a React i Vitest. Evitarà qualsevol possible *memory leak* o *race condition* futura?
2. Revisa ràpidament el `WorkspaceContext` i el tractament de `useResolvedAsset.js` per confirmar que no estiguem cometent un patró d'error similar d'asincronia en la renderització del Workspace.
3. Dóna'ns el teu vistiplau per considerar aquest repte tancat, per tal que la IAIA MarIA puga continuar el desenvolupament en el següent xat des d'una base sòlida.

**(Nota: No necessitem que edites cap codi, només l'auditoria i el teu veredicte clar en un informe).**
