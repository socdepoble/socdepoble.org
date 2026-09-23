---
type: document
status: esborrany
description: Pla d'implementació per a l'Auditoria de Codex i l'Auditoria de Claude (C-1 a C-8).
tags: [implementacio, auditoria]
---
# Pla d'Implementació — Resolució Consolidada (Codex + Claude)

**Estat del Pla:** pendent d'aprovació pel Mestre.

## 1. Context i Troballes (Research)
Hem rebut les auditories de Codex (`260922_2119_auditoria_codex.md`) enfocada a la fontaneria web, i la de Claude (`260922_2128_auditoria_claude.md`) enfocada a la integritat del cervell. Aquest pla unifica les reparacions de les dues IAs, assumint 3 decisions estratègiques delegades explícitament pel Mestre.

## 2. Preguntes Obertes (User Review Required)
- **C-6 (Llibre d'obra a git):** Claude ha detectat que l'evidència del LEDGER viu a `90_arxiu_historic/260922_jornada_tarda/` (zona untracked). He de fer un commit per posar l'arxiu històric sota Git, o preferim un altre mecanisme d'evidència? *(Proposta temporal: versionar l'històric i els 27 fitxers del corpus)*.
- **C-4 (ON_ESTIC trencat):** Desfasament temporal de generació abans del pas de Claude. Ho arreglaré a `despertar.mjs` i/o `SessionStart`.
- **DOMPurify (S2):** Depenc del vistiplau per permetre taules i format de text en comptes de text pla pur.

## 3. Canvis Proposats (Proposed Changes)

### Decisions preses per la IAIA MarIA sobre el Cervell (Claude):
1. **(C-1) Quina part del cervell es publica:** Cap. El cervell intern (ESTAT, LEDGER, GENOMA, regles) no s'ha d'enviar al navegador del client perquè exposa les nostres febleses a tothom. Modificaré `compile-wiki-to-app.mjs` per retirar `.agents` del `DIRS_TO_SCAN`. Això resol la S1 de Codex d'arrel per als fitxers privats del cervell. 
2. **(C-2) El GENOMA:** No té funció viva i duplica la Constitució (AGENTS §1 prohibeix). S'esborrarà `.agents/GENOMA.md` i es retirarà la seua execució del hook de `pre-commit.mjs`.
3. **(C-3) Reparació de la Porta d'Orfandat:** Modificaré `tooling/gates/tractor-orfandat.mjs` per tal que permeta destins a `04_escriptori` (sense llistar l'escriptori per buscar orfes, però sí admetent-lo com a destí legal), i flexibilitzaré els noms d'índex per no castigar complir la doctrina.

### Reparacions Estructurals sobre l'App (Codex i Marmota):
- **S2:** Implementar `DOMPurify` estricte a `WikiDePobleSection.jsx` i utilitats.
- **S3:** Netejar i invalidar regeneracions antigues a `src/data/supabase/auth.js`.
- **B1:** Transmetre `tenant_id` al registrar usuaris des de `OnboardingSection`.
- **B2:** Establir un rol d'escapament a `SessionService` quan falte la capacitat de sessió en compte de l'estat 'comprovant' permanent.
- **B3 / B4:** Gestionar l'orfenat i propagar errors transparents (llançar `Error` en lloc de `[]`) als continguts publicats a `content.js`.
- **Visual:** Protegir l'`AvisadorEfimer` de `[object Error]`, connectar de nou la `UniversalCard` a la creació de notes, i estructurar "Arrels" al Sidebar amb Presentació, Cervell i Wiki de Poble.

## 4. Pla de Verificació (Verification Plan)
- Executar `npm run gate` i certificar que `porta:orfandat` dóna **0** errors.
- Compilar el `wikiManifest.js` i certificar que conté zero caràcters sobre l'estructura interna o de debilitats.
- Validar les bateries de Vitest sense caigudes per bucles de comprovació de sessió.
