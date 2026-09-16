---
tipus: protocol
estat: esborrany
description: Conserva com a proposta futura l'homologació de peces pures sense contradir la carcassa React/Vite actual.
tags:
  - govern
---
# Forja a Core — proposta futura

Este protocol **no està implementat en la baseline actual**. No existixen
`src/forja/` ni `src/core/`, i tampoc hi ha una comanda operativa
`npm run porta`. Per tant, cap agent pot usar este document per a
moure components, rebutjar React o declarar una homologació superada.

La decisió canònica vigent és la de [[doc_governanca]] i
ESTANDARD_Pedra_Seca: React/Vite és la carcassa productiva legítima. El codi
es localitza en `src/sections/`, `src/components/`, `src/config/` i `src/data/`.

## Hipòtesi que es conserva

En el futur pot ser útil extraure una peça a JavaScript o Web Components purs
quan un cas d'ús real necessite reutilització fora de React. La promoció seria
optativa i incremental; no una reescriptura general per decret.

Abans d'activar este protocol caldria:

1. una ADR que definisca el problema, la frontera i el cost de mantindre dos
   models de components;
2. crear les rutes reals i adaptar les regles d'agents;
3. implementar una prova reproduïble al Baseline 2022 (Safari/iOS 16);
4. definir compatibilitat, accessibilitat i funcionament offline mesurables;
5. integrar el gate en CI i demostrar-lo amb una regressió negativa;
6. establir un rollback i una política que impedisca duplicar components.

## Criteris candidats d'homologació

Només després de l'activació anterior, una peça candidata podria exigir:

- cap dependència UI injustificada;
- CSS basat en tokens `--sp-*`;
- HTML semàntic, focus visible i objectius tàctils verificats;
- prova offline en l'scope declarat;
- zero imports creuats que trenquen la frontera acordada;
- informe generat per proves, no un JSON escrit manualment.

## Sinapsis

- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]


**Ancoratge de Seguretat:** [[00_index]]


---

**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — Ancoratge d...
- [[00_bios|00_SER_Brain_Identitat/00_BIOS.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — [[00_INDEX_...
- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[00_bios]] és una redirecció històrica i [[forja_to_core]] una proposta
- [[govern|01_SABER_Cultura_Coneixement/Govern.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — Categoria: ...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — Etiquetes: ...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — [[00_arquit...
- [[auditoria_canonica|02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md]] — [[forja_to_core]]
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — La decisió ...
- [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md]] — [[00_index|00_INDEX.md]] — [[forja_to_core|03_GOVERNAR_Normativa_Regles/FORJA...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
