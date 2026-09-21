---
type: pla
status: actiu
description: Pla d'implementació per a resoldre les troballes de l'auditoria del Brain de Codex (Dictamen del Consell).
---
# Resolució del Dictamen del Consell (Auditoria del Brain)

El Consell (Codex) ens ha donat un 4/10 i ha detectat diverses fallades estructurals crítiques degudes a la recent reestructuració ràpida. Aquest pla detalla com arreglarem cadascuna de les "Troballes prioritàries" (P1 i P2) de forma segura i compatible amb l'esquema.

## Canvis Proposats per la IAIA MarIA

### 1. Core Brain & Somiador (P1)
Corregir l'esborrat cec i els problemes de col·lisió del Somiador.
- **[MODIFY] `tooling/brain/despertar.mjs`**: Eliminar la crida cega a `somiador.mjs` a l'inici. "Despertar" només ha d'observar i documentar el que hi ha a l'escriptori generant `ON_ESTIC.md`. L'arxivament es farà manualment quan la tasca s'haja completat realment.
- **[MODIFY] `tooling/brain/somiador.mjs`**: Afegir una comprovació abans de moure arxius (`fs.existsSync(dest)`) per llançar un error i aturar l'execució en cas de col·lisió de noms (per no sobreescriure mai sessions arxivades antigues amb el mateix nom).

### 2. Catàleg de Skills & Identitat (P1 / P2)
Reconciliar els noms de les carpetes amb el `name` intern dels frontmatters, i llevar el "número màgic" 16.
- **[MODIFY] `tooling/brain/cataleg_skills.mjs`**: Eliminar la comprovació rígida de `if (skills.length !== 16)`. El nombre d'skills pot créixer o minvar.
- **[MODIFY] `.agents/skills/**/SKILL.md` (múltiples arxius)**: Actualitzar el camp `name` de tots els frontmatters de les skills perquè coincidisca exactament amb el nom de la nova carpeta (ex: de `skill-iaia-identitat` a `core-identitat`).

### 3. Reflex & Validadors (P1)
El Reflex està bloquejat perquè demana un camp que l'esquema nou prohibeix.
- **[MODIFY] `tooling/wiki/reflex_petorreta.mjs`**: Canviar l'exigència de `tipus: petorreta` per l'exigència de `type: petorreta`, per alinear-se amb l'schema.json (que només admet `type`).
- **[MODIFY] `tooling/wiki/lib/prompt_sgq.mjs`**: Desactivar o relaxar la comprovació estricta de seccions `## Cos canònic`, ja que la nova plantilla simplificada no en fa ús.

### 4. Seguretat i RAG Públic (P1)
Evitar que el RAG públic incorpore documents confidencials interns dels agents.
- **[MODIFY] `tooling/wiki/core/build_rag_index.mjs`**: Eliminar l'excepció explícita que permetia indexar `.agents`. (Canviar `if (e.name.startsWith('.') && e.name !== '.agents')` per un bloqueig total de directoris ocults). També afegir un filtre per ometre qualsevol arxiu el frontmatter del qual tinga `status: arxivat`.

### 5. Neteja Semàntica Global (Tags) (P1)
L'inventari ha detectat tags invàlids en 25 documents de la wiki.
- **[NEW] `scripts/migrar_tags.mjs` (Script temporal)**: Crear i executar un script autònom que recorrerà tots els `.md`, detectarà tags fora de l'enum oficial (`tooling/wiki/schema.json`), els traduirà al tag vàlid més proper o els eliminarà, i guardarà els arxius de forma segura. Això repararà els 29 usos de tags prohibits.

### 6. Prevenció de Putrefacció del Graf (Enllaços Trencats) (P2)
Com has assenyalat encertadament, si canviem noms i l'índex no s'actualitza, l'índex no serveix per a res i la navegació es trenca.
- **[NEW] `tooling/wiki/tractor-enllacos-trencats.mjs`**: Crearem un "tractor" (script) que s'executarà automàticament durant el `Despertar` (o com a hook) que revisarà tots els enllaços Markdown `[[...]]` de la wiki. Si detecta un enllaç mort, avisarà immediatament o el posarà en una llista de tasques perquè es resolga abans de començar la faena.
*(Nota: L'índex de plantilles ja ha estat corregit manualment per a la sessió actual).*

## Pla de Verificació

1. Executaré `node tooling/brain/cataleg_skills.mjs --check` i m'asseguraré que retorna exit 0 i regenera el manifest correctament.
2. Executaré `node tooling/wiki/entropia_zero_router.mjs` per garantir que el validador global ho accepta tot sense errors de taxonomia ni de schema.
3. Executaré l'script de construcció del RAG `node tooling/wiki/core/build_rag_index.mjs` per confirmar que no processa els `.agents` ni arxius trencats.
