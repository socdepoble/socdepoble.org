---
type: document
status: esborrany
description: Pla d'implementació del panell de la Gestoria amb SEO.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:b9eb13ce-bf52-47ef-aa64-77766f1186dd
---
# Pla Implementació Gestoria Small Businesses

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:b9eb13ce-bf52-47ef-aa64-77766f1186dd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T22:45:26.765Z |
| Modificació | 2026-10-01T22:45:26.765Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini Pro |
| Tokens consumits | ~5500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-01T22:45:26.765Z: esborrany creat; contingut i verificació pendents.
2026-10-01T22:45:30.000Z: document emplenat per MarIA (Gemini Pro) amb l'estratègia dels 15 empleats IA de gestoria, la cascada visual (SKILL_VISUAL_LEARNING) i l'enfortiment del SEO.
<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
Hem ingerit dos informes estratègics destil·lats per Google Notebook LM i peticions de l'usuari:
1. **Aprenentatge Visual i Cascada Nemònica:** Una guia per a construir aplicacions web interactives HTML/JS autònomes que permeten aprendre conceptes complexos mitjançant codi fonètic i un algoritme de repàs espaiat (estil Anki). S'ha d'encapsular com a skill mestra (`SKILL_VISUAL_LEARNING_ANTIGRAVITY`).
2. **15 Empleats de IA (Small Businesses):** L'adaptació de l'ecosistema del paquet *Cowork* cap a Antigravity amb Gemini Pro, orquestrant 15 eines a través d'esquemes JSON (Tool Schemas) i el protocol de Workspace local. Els 5 dominis a atacar són: Comptabilitat, Màrqueting, Vendes, Atenció al Client i Operacions.
3. **Peticions addicionals:** Millorar massivament el SEO (OpenGraph i Meta Tags) per a `gentdelatorre.net` i `socdepoble.org` per a previsualitzacions excel·lents a WhatsApp.

### 2. Preguntes Obertes (User Review Required)
- **A Claude i Codex (Auditores locals):** Com integrem la interfície d'aprenentatge del Quiz (la cascada visual HTML/JS) dins l'estructura de la Gestoria, perquè servisca per formar els usuaris en la pròpia gestoria? Caldrà encastar-la en un Iframe?
- Com dissenyarem el flux *Human-In-The-Loop (HITL)* perquè les interfícies de l'Editor Universal aproven les decisions dels 15 empleats digitals de manera orgànica abans d'executar-les?

### 3. Canvis Proposats (Proposed Changes)

#### [Acció: NEW] `.antigravity/workspace_rules.json`
Establiment del protocol del workspace local. 
```json
{
  "workspace_context": {
    "company_name": "Sóc de Poble",
    "architecture": "15 Digital Employees Suite",
    "primary_agent": "Business_Operations_Orchestrator"
  },
  "enabled_domains": [
    "email_communication",
    "sales_commercial",
    "customer_support",
    "internal_operations",
    "marketing_promotion"
  ],
  "execution_mode": "Autonomous_with_HITL_validation",
  "system_instruction": "Actua com l'Agent Coordinador Principal de Sóc de Poble. El teu objectiu és interpretar les sol·licituds operatives i executar dinàmicament les 15 habilitats digitals mitjançant crides a funcions."
}
```

#### [Acció: NEW] `.agents/skills/core-visual-learning/SKILL.md`
Declaració de l'habilitat `SKILL_VISUAL_LEARNING_ANTIGRAVITY` que orquestrarà el funcionament i generació de codi font de les aplicacions formatives per al producte (fases 1 a 5 segons el document de mapes visuals).

#### [Acció: NEW] `.agents/tools/small_businesses_tools.json`
Catàleg local amb el llistat estandarditzat dels 15 endpoints JSON Tool Schemas, desglossats pels 5 dominis corporatius (ex. `execute_sales_workflow`, `execute_operations_workflow`, etc.) perquè el motor orquestrador els consumisca.

#### [Acció: MODIFY] Interfície Front-end de la Gestoria (Pendent d'assignar fitxer)
Modificació de les vistes principals de gestió corporativa per injectar-hi el *Human-in-the-Loop Validation Protocol*. Tot esborrany d'email, pressupost o balanç financer es renderitzarà ací i no es tramitarà fins que el *Mestre* ho aprove.

#### [Acció: MODIFY] Optimització SEO (OpenGraph i Meta Tags)
Implementar les metaetiquetes estructurades de SEO i OpenGraph per garantir que en compartir l'URL per WhatsApp, Telegram o xarxes socials, la previsualització ("social card") de **gentdelatorre.net** i **socdepoble.org** es veja completa, professional i esplendorosa. Això requerirà revisar tant les plantilles de WordPress com el SEO intern de l'SPA.

### 4. Correccions prèvies a l'activació (Defectes Trobats)
En la revisió de Codex s'han superat 166 proves de SEO, navegació i panell, però s'han detectat dos defectes que s'han de solucionar de forma bloquejant abans d'activar el mòdul de Gestoria:
1. **Privacitat de Gestoria:** La futura ruta de Gestoria s'està considerant indexable per defecte. Cal afegir-hi el corresponent `noindex` o barrera d'autenticació SEO perquè els robots no la pugen rastrejar, ja que és un mòdul privat.
2. **Herència d'imatge:** Una imatge específica de pàgina està heretant incorrectament les dimensions i el text alternatiu (`alt`) del logotip de l'aplicació. Cal corregir aquesta superposició.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Validar que el fitxer `.antigravity/workspace_rules.json` siga detectat per l'orquestrador.
2. Comprovar la propagació i lectura correcta del `small_businesses_tools.json` dins del context d'execució.
3. Llançar un component Visual Learning a prova d'aïllament (sandbox) per verificar la lògica de reintents d'Anki.
4. Passar el Linter/Test automàtic en Vite de l'app de Gestoria amb el panell HITL afegit.
5. Comprovar les metaetiquetes OpenGraph renderitzades (p. ex. via un linter SEO o curl) per assegurar la previsualització de WhatsApp per a gentdelatorre.net i socdepoble.org.
<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Disrupció de Routing SPA:** Si l'app autònoma HTML/JS dels Mapes Visuals entra en conflicte amb l'enrutador React, caldrà aïllar-la amb micro-frontends o *iframes*.
- **Desbordament de Tool Calling:** Mantenir els 15 esquemes JSON contínuament a la finestra de context podria desbordar o confondre Claude/Codex. Haurem de segmentar les eines en rutes més aïllades.
<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
