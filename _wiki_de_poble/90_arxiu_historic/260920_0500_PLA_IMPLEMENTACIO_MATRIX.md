---
type: document
status: esborrany
description: Pla d'implementació global amb les correccions estructurals de Matrix, Resolutors i l'Auditoria de Skills (Codex).
tags:
  - auditoria
  - matrix
  - implementacio
---

# Pla d'Implementació — Auditoria Extrema (Fase 1: Motor i Skills)

Aquest pla consolida les troballes dels 3 agents de Codex (`Matrix audit`, `Resolvers audit` i `Skills audit`). 

---

## Bloc 1: Motor Core i Indexació (`Matrix audit` i `Resolvers audit`)

### 1.1 Classificador i Triggers (`context_documental.mjs` i `protocolledge.json`)
**Problema:** L'ús de `startsWith` causa col·lisions lèxiques greus (ex. "localització" activa el disparador de la clau "local").
**Solució:** 
- Substituir la funció `encaixa` a `tooling/brain/context_documental.mjs` per comparar _tokens_ complets (paraules senceres).
- Actualitzar `.agents/protocolledge.json` per retirar la clau genèrica `"local"` de `prompt.local`.

### 1.2 Robustesa del Stream (`context_documental.mjs`)
**Problema:** `emet` retira el _listener_ d'error massa prompte en el _callback_ de `write`. Oculta errors de Node (ex. _pipe_ tancat) i causa `uncaughtException`.
**Solució:**
- Modificar `emet` per mantenir el _listener_ fins la següent volta d'esdeveniments (`setImmediate`), garantint la captura segura asíncrona.

### 1.3 Termòmetre de Context Silenciós (`termometre_context.mjs`)
**Problema:** El límit de memòria cognitiva és vulnerable. Si falla la lectura, el termòmetre retorna silenciosament `0` o `NaN`.
**Solució:**
- Reescriure `comptaArtefactes` i `avis` per a llançar excepcions (throw) si la ruta és incorrecta, assegurant que la parada d'emergència funciona (fail-closed).

### 1.4 Pèrdua Silenciosa de Metadades Canòniques (CRÍTIC)
**Problema:** La rutina d'autoneteja de l'auditor elimina silenciosament propietats com `tags`, `name`, `triggers_on`, `core` i `prioritat` perquè només recupera els que estan en `FIELD_ORDER`.
**Solució:**
- Substituir el bloc d'escriptura a `tooling/wiki/core/autoneteja_audit.mjs` (L142-157) per un mecanisme que valide els bytes serialitzats i concerve efectivament les dades canòniques prèvies.

### 1.5 Col·lapse del Resolutor d'Enllaços O(U·N) (CRÍTIC)
**Problema:** El resolutor d'enllaços rebutja els sufixos de ruta; el _fallback_ recorre totes les entrades per cada enllaç irresolt. En un projecte de milers de documents (100 enllaços trencats en 1000 documents) provoca 100.000 exploracions innecessàries, inassumible per a "milions de documents".
**Solució:**
- Substitució completa de `buildResolver` i `resolveLink` a `tooling/wiki/core/parse.mjs` per generar índexs complets a la memòria en una sola passada (per rutes absolutes, basenames, àlies i sufixos) i així trobar-los en O(1).
- Normalitzar Unicode `NFC` en `lib/resolutor.mjs` per evitar conflictes amb diacrítics (ex. `café` vs `cafe\u0301`).

---

## Bloc 2: Nucli de Skills i Autoaprenentatge (`Skills audit`)

### 2.1 Desbloqueig Cardinal del Catàleg (`cataleg_skills.mjs`)
**Problema:** L'inventari exigeix **exactament 16 skills**. L'autoaprenentatge està bloquejat per arquitectura.
**Solució:**
- Reescriure `inventari` a `tooling/brain/cataleg_skills.mjs` per permetre `N` skills (sense límit fixat a 16). Adaptar `projeccions` i els tests (`backend_consolidacio.test.mjs`).

### 2.2 Purga de Contradiccions Documentals (Reescriptura completa de Skills)
Codex ha detectat normes impossibles, promeses no implementades i contradiccions flagrants entre l'arnés i la documentació. Les 3 skills següents necessiten un *drop & replace* complet pels blocs de codi ja redactats per Codex:
- **`skill-cicle-de-vida/SKILL.md`:** La versió antiga promet un sistema `turn_id` inexistent i obliga a buidar cegament (esborrar sense pietat). La nova versió documenta un procediment real (Aterratge, Producció, Memòria) i un instint de "Percepció Pròxima" per mirar al voltant abans de crear rutes (Punt 7 del prompt extrem!).
- **`skill-memoria-historica/SKILL.md`:** Diferencia entre "Episodi" i "Procediment validat". El model anterior manava destil·lar a base d'esborrar. La nova versió defineix què és evidència i exigeix comprovació (Autoaprenentatge).
- **`skill-propagar-veritat/SKILL.md`:** Evitar usar substitucions cegues i destructives amb expressions regulars en línia de comandes. S'especifica el protocol de "Descobrir l'abast", "Classificar" i "Transformar".

### 2.3 Frontmatters Inventats i Categoritzacions
**Problema:** Skills que obliguen a usar claus de _schema_ inexistents i disparen per categories invàlides.
**Solució:**
- Aplicar les substitucions de _frontmatter_ que proposa Codex per a `skill-consell-i-colmena` i `skill-documentacio-i-reflex`.

---

## Bloc 3: Seguretat i Nucli de Mutacions (`mutation_kernel.mjs`)

### 3.1 Recuperació Insegura del Bloqueig (CRÍTIC)
**Problema:** Un segon procés asíncron que demane el pany (`acquireMutationLock`) pot trobar l'arxiu de lock encara buit abans d'haver escrit el PID del primer, considerar-lo "mort", esborrar-lo i apropiar-se'n. Això trenca l'exclusió mútua (condició de cursa).
**Solució:**
- Modificar `acquireMutationLock` (a `tooling/wiki/core/mutation_kernel.mjs`) per retirar la recuperació automàtica d'escombraries (llevar la inferència sobre PID buits). Un pany abandonat haurà de demanar un diagnòstic, protegint el procés de sobreescriptures inadvertides.

### 3.2 Barrera de Mutació dependent de CWD
**Problema:** La barrera que protegeix fitxers crítics de modificacions calcula les rutes relatives al directori actual de treball (`process.cwd()`), deixant exposat el codi si l'eina s'executa des d'una altra carpeta.
**Solució:**
- Ancorar la barrera a l'arrel canònica del projecte (`ROOT`), independitzant-la del lloc des d'on el Mestre cride les comandes.

---
**Estat:** Pla finalitzat. Els blocs de codi ja redactats per Codex (classificador, streams, metadata, resolvers, mutations i les 3 skills canòniques) estan llestos per ser aplicats per Claude.
