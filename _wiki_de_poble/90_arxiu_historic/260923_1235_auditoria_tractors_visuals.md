---
type: document
status: canonic
description: "Auditoria de l'Al·lucinació Visual i Proposta del Tractor de Disseny Avançat"
tags: [disseny, auditoria, al·lucinacio, tractors]
---

# Auditoria: El Buit Cognitiu i la Llei del Píxel

**Data:** 26-09-23 12:35
**Autoria:** IAIA MarIA (Delegat per Consell)
**Torn actiu:** Resposta al prompt `260923_0045_prompt_auditoria_tractors_visuals.md`

## 1. El Forat en l'Arquitectura Cognitiva (El Per Què)

He analitzat el sistema i he determinat exactament per què l'agent al·lucina components, icones (el rellotge, els tres punts) i textos ("Foraster", "00:39") malgrat tindre `pedra_seca.md` a mà:

1. **La Gravetat dels Priors (Tailwind Genèric):** Les regles de Pedra Seca existeixen com a *text*, però l'instint del LLM quan se li demana "esborra un estil vell" o "crea un estat buit" és reomplir el forat amb els patrons de disseny més estadísticament probables de la seua base de coneixement (Tailwind UI genèric, icones de menú contextual convencionals). 
2. **Ceguesa del Linter Actual (`design_guard.mjs`):** La porta de disseny vigent és **purament sintàctica**. Et pot bloquejar si fas servir `#FF0000` en lloc de `--sdp-crom-roig`, o si la font baixa de 16px, o si fas servir classes directes de Tailwind. Però **és incapaç de detectar semàntica inventada**: no sap que has importat `<Clock />` de `lucide-react`, ni que has teclejat el text cru `"Foraster"` a dins d'un `<span>`.
3. **Incompliment de la Norma §9 de Pedra Seca:** La regla d'or ("Res existeix fins que no està al manual: DesignSection") és una recomanació d'honor, però cap mecanisme mecànic comprova o bloqueja el `git commit` si creem lògica abans que l'esquelet visual s'hagi auditat allà.

Quan lleves una regla CSS vella sense un referent visual (Pedra Seca matemàtic) clar i enforçat mecànicament, l'agent ompli el buit de manera autònoma amb la "solució genèrica estàndard". Això és l'al·lucinació de disseny proactiva.

## 2. La Solució: L'Arquitectura del "Tractor de Disseny Estricte"

Per tancar aquest forat per sempre sense esgotar el context, necessitem un Tractor Cognitiu nou: `tractor-pedra-seca-estricte.mjs`. Aquest no analitzarà només el CSS, sinó el **React AST**.

### Funcions del Nou Tractor (Linter de Disseny Avançat)

1. **La Porta de les Icones (Anti-Al·lucinació Visual):**
   - El tractor farà un parseig del codi per interceptar els `import { ... } from 'lucide-react'`. 
   - Es crearà un fitxer de govern `tokens/icones_aprovades.json` (o es traurà de Pedra Seca). Si un agent intenta importar una icona nova com `<MoreHorizontal />` (els tres punts) o `<Clock />` que no estan aprovades a la UI del Mas, el tractor bloquejarà el commit instantàniament.
   
2. **El Detector de Text Cru i *Mock Data* (Anti-Falsedat):**
   - Es rastrejarà el JSX buscant cadenes de text literals superiors a N caràcters que no provinguen de *props* o dades d'API.
   - Açò intercepta a l'acte invencions com `"00:39"` o `"Identitat Lliure"`. Obligarà la IA a fer servir dades reals o deixar *props* netes i explícites.

3. **Validació d'Anatomia i Primitives (Anti-Inventiva Estructural):**
   - Penalitzarà estructures complexes (molts `divs`) si s'allunyen de les primitives base. Si estàs creant una targeta, has de fer servir o estendre un element existent. L'ús de `style={{}}` ja està prohibit per `design_guard`, però ho podem estendre per prohibir qualsevol desbordament visual sense referent.

### Implementació en la Canonada (`run-portes.mjs`)
- Aquest tractor s'enganxarà a la llista de portes `pre-commit`.
- Executarà la lògica AST **exclusivament** sobre els fitxers afegits o modificats (revisant la cua de git), actuant com un tallafocs immediat davant de qualsevol intent d'un LLM d'infiltrar un element genèric de la seua formació sense el preceptiu permís i la referència prèvia a `DesignSection`.

## 3. Certificat de Zero Modificacions
Seguint l'estricte mandat de Mode AFK estipulat al prompt i validat per l'Acta de les 00:35: **Cap línia de codi de l'arbre (`src/`, `tooling/`) ha estat modificada durant aquest torn.** L'anàlisi s'ha fet exclusivament en l'espai cognitiu documental, preservant intactes els 252 canvis de git pendents.
