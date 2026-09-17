---
tipus: document
estat: canonic
description: Separa l'arquitectura implementada de les decisions vigents i de la visió tècnica futura.
tags:
  - maquina
aliases:
  - Arquitectura tècnica
---
# Arquitectura tècnica unificada

Este document és un mapa explicatiu, no una autorització d'execució. Quan discrepe amb el repositori, prevalen `AGENTS.md`, `.agents/`, el codi i les proves. Cada afirmació usa un nivell d'evidència:

- **Implementat:** existeix al codi o a la configuració actual i es pot verificar.
- **Contracte:** decisió vigent que tot canvi nou ha de respectar.
- **Futur:** hipòtesi o línia d'investigació; no es pot usar com si ja funcionara.

## 1. Arquitectura implementada

La base actual de `socdepoble.org` és una aplicació web React construïda amb Vite. Les dependències declarades inclouen Lucide. La capa `src/data/` delega el backend al host o a implementacions mock. Cada garantia concreta s'ha de demostrar amb una prova.

```mermaid
flowchart LR
    UI["React · src/sections"] --> CFG["Configuració compartida · src/config"]
    UI --> DATA["Accés a dades · src/data"]
    DATA --> REMOTE["Backend Injectat (Sollutia) o Mock"]
```

Contractes de localització del codi:

1. Una funció específica d'una secció viu en `src/sections/<seccio>/`.
2. La configuració transversal viu en `src/config/`.
3. La lectura, escriptura i fallback de dades viuen en `src/data/`.
4. Una capacitat offline només es declara operativa quan té prova de desconnexió, persistència i recuperació.
5. El Baseline 2022 és el sòl de compatibilitat; una API disponible al baseline s'usa directament, sense detecció ni fallback (vegeu `.agents/BASELINE.md`).

## 2. Estat de les tecnologies descentralitzades

La descentralització, el P2P i la resiliència rural formen part de la visió de [[el_projecte]]. No formen part automàticament de l'estat implementat.

| Capacitat | Estat en esta baseline | Condició per promoure-la |
|---|---|---|
| Persistència local amb Dexie | Futur; no és dependència actual | Tests per flux i política de migració |
| Supabase amb fallback local | Futur | Tests d'error, reconciliació i pèrdua de xarxa |
| PWA/Workbox | Futur; no és dependència actual | Prova instal·lable i d'actualització en dispositiu objectiu |
| Y.js o un altre CRDT | Futur; no és dependència actual | ADR, prototip, proves de convergència i límits de GC |
| WebRTC/P2P remot | Futur | Signaling, identitat, xifratge, NAT i proves multi-dispositiu |
| OPFS | Futur | Compatibilitat Safari, migració i fallback |
| PowerSync | Futur; no és dependència actual | ADR i integració demostrable |
| LoRa/Meshtastic, drons o satèl·lit | Recerca | Prototip físic, pressupost, legalitat i model d'amenaça |
| Xifrat homomòrfic o postquàntic | Recerca | Cas d'ús, revisió criptogràfica i implementació auditada |

No existeixen en esta baseline `MassiveFusionEngine`, `sync-wiki-crdt.js`, `dron_link_protocol.js` ni una malla Y.js operativa. Els noms històrics poden orientar un experiment, però no són API, control de seguretat ni criteri d'acceptació.

## 3. Contracte de la Wiki

La Wiki és un vault de Markdown governat per fitxers, Git i l'Acte Reflex; no és una base CRDT.

```mermaid
flowchart LR
    RULES["AGENTS + .agents"] --> OPEN["Reflex open"]
    OPEN --> CTX["Petorreta + manifest selectiu"]
    CTX --> SEAL["seal · lease limitada"]
    SEAL --> MUT["mutador amb rebut"]
    MUT --> AUDIT["auditoria + prova + restauració"]
    AUDIT --> CONSUME["consume"]
```

- L'esquema únic de frontmatter és `tooling/wiki/schema.json`.
- El graf operatiu usa els quatre pilars `00_SER`, `01_SABER`, `02_ACTUAR` i `03_GOVERNAR`.
- `04_ARXIU` i `05_Escriptori` són zones de cicle de vida, no pilars nous.
- Els paquets massius i les Mega-Petorretas viuen fora del vault, en `_arxiu_wiki_de_poble/`.
- Un orfe amb contingut no s'elimina ni es mou automàticament. Només un fitxer físicament buit, sense arestes i amb pla reversible pot entrar en quarantena.
- El protocol autoritatiu és `.agents/PROTOCOL_PETORRETA.md`; esta pàgina només l'explica.

## 4. Arquitectura cognitiva

L'agent no carrega tot l'historial ni tota la Wiki. Comença per l'autoritat mínima i amplia el context segons la tasca:

1. `AGENTS.md` i les normes `.agents/` aplicables.
2. Codi, proves i configuració que acrediten l'estat real.
3. Pàgines canòniques estrictament relacionades.
4. Arxiu o documentació de proveïdor només quan la pregunta ho requerix.

El manifest de context registra `path`, `reason`, `classification` i `role`. Una afirmació sense font, fórmula o prova és una hipòtesi; una mètrica sense denominador i finestra temporal no és una mètrica operativa.

## 5. Criteris per a madurar una tecnologia futura

Una idea passa de **Futur** a **Implementat** només quan té:

1. un problema i un propietari explícits;
2. una decisió d'arquitectura amb alternatives i cost de reversió;
3. codi localitzable i configuració reproduïble;
4. proves d'èxit, fallada i recuperació en el dispositiu objectiu;
5. model de dades, privacitat i amenaces;
6. observabilitat amb fórmules i llindars justificats;
7. documentació actualitzada en la mateixa operació.

Fins que es complisquen els set punts, Antigravity ha de dir «proposat» o «no verificat», mai «curat», «blindat» o «100% operatiu».

## Relacions

- [[00_index|Índex de la Wiki]]
- [[02_genotip|Genotip cognitiu]]
- [[PROTOCOL_PETORRETA|Petorretas i context selectiu]]
- [[sdp_lock|Límits de seguretat]]
- [[00_visio_i_pilars|Visió i pilars]]

### Skills Operatives (Autosanació i Execució)
- [[auditoria_canonica]]
- [[MOTOR_OFFLINE]]
- [[a11y_seo_trellat]]
- [[futur_adaptacio]]
- [[index_trellat]]
- [[seguretat_execucio]]
- [[self_repair]]
- [[successio_lazaro_execucio]]

### Eines d'Obsidian (Plugins i Workflow)
- [[homepage]]
- [[plugins]]


**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[00_bios|00_SER_Brain_Identitat/00_BIOS.md]] — Les fonts mecàniques són [[00_arquitectura_tecnica_unificada]],
- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — | 02 ACTUAR | Màquina tècnica, skills, scripts, plantilles | [[00_arquitectur...
- [[02_genotip|00_SER_Brain_Identitat/02_GENOTIP.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[03_consola_termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md]] — [[00_arquitectura_tecnica_unificada]]
- [[00_visio_i_pilars|01_SABER_Cultura_Coneixement/00_visio_i_pilars.md]] — Mapeig Col·lectiu de Recursos: Geolocalització d'informació vital. → [[00_arq...
- [[arquitectura_sistema_nervios|01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Sistema_Nervios.md]] — [[00_arquitectura_tecnica_unificada]]: React/Vite, persistència local parcial,
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[00_index|00_INDEX.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maqu...
- [[00_plantilles|02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_acta_unica|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_brainstorming|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_branding|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_creador_skills|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_doc_to_app|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_modo_produccion|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_planificacio|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[plantilla_skill_trellat|02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[homepage|02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Homepage.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[plugins|02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Plugins.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura...
- [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — [[00_arquitectura_tecnica_unificada]]
- [[auditoria_canonica|02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[00_arquitectura_tecnica_unificada]]
- [[seguretat_execucio|02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[self_repair|02_ACTUAR_Maquina_Tecnica/skills/self_repair.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md]] — Relacionat: [[00_arquitectura_tecnica_unificada]], [[00_index]]
- [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — [[00_arquitectura_tecnica_unificada]]

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
