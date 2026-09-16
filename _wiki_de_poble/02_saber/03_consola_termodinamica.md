---
tipus: document
estat: canonic
description: Separa els controls de salut implementats de les mètriques conceptuals i prohibix fabricar percentatges sense evidència.
tags:
  - core
  - genoma
  - identitat
---
# Consola Termodinàmica

La Consola és un contracte de mesura i decisió, no una pantalla màgica ni un
permís d'autocuració. Una mètrica només és operativa si té fórmula, font,
denominador, scope, timestamp i prova reproduïble. Si falta una peça, el valor
correcte és `N/A`, no `100%` ni una estimació optimista.

## Estat verificat de la baseline

| Senyal | Estat | Autoritat i límit |
|---|---|---|
| Integritat de frontmatter i graf operatiu | Implementada | `autoneteja_wiki.mjs`; audita, planifica i falla de forma tancada. |
| Gate abans del commit | Implementat localment | `pre-commit.mjs` + Reflex; no és durable fins versionar hooks i CI. |
| Índex/ontologia derivats | Implementats | `compiler/`; són cache regenerable, no font de veritat. |
| “IT” de tres components del CLI | Retirat com a porta | `sdp check` falla tancat perquè combinava proxies incomplets i podia donar puntuació a un corpus buit. El codi legacy només és material d'estudi; no representa el [[index_trellat|marc humà complet]]. |
| Accessibilitat, Web Vitals i RAM del dispositiu de referència | Sense telemetria integrada | Necessiten navegador/dispositiu, corpus de casos i resultats conservats. |
| Resiliència offline funcional | Sense índex integral | Un snapshot de fitxers no prova que les funcions de la PWA continuen tenint sentit sense xarxa. |
| Tombstones CRDT | No aplicable a la baseline | No hi ha motor CRDT actiu; no s'inventa una càrrega percentual. |
| Panell web de salut i ritual setmanal | Futur | No hi ha pipeline que els alimente de manera verificable. |

## Fonts de veritat

Les portes mecàniques vigents són:

1. `wiki:test` per a regressions del parser, Autoneteja i Reflex;
2. `wiki:audit:strict` per a schema, contingut i graf operatiu;
3. `precommit:sdp` sobre l'arbre Git preparat;
4. CI i protecció de branca quan s'hagen versionat i activat;
5. decisió humana per a riscos, semàntica i canvis de governança.

El fitxer `scripts/rules/trellat-rules.json` conté pressupostos i llindars de
disseny. Que un número aparega allí no prova que existisca l'instrument que el
mesura. En particular, `itOptimal: 90`, `ramMbMaxBaseline: 1200` o
`tombstonePercentMax: 70` són hipòtesis de control fins que una prova documente
origen i validesa.

## Contracte per promoure una mètrica

Cada mesura nova ha de registrar:

- pregunta o decisió que resol;
- fórmula, unitat, numerador i denominador;
- font, versió del codi i dispositiu;
- scope, exclusions i període;
- llindar justificat i responsable;
- prova d'èxit, fallada i recuperació;
- format JSON estable i historial comparable.

Una mètrica consultiva no activa mutacions. Si un llindar ha de bloquejar o
curar, necessita una regla de governança, regressió negativa, Reflex, rollback
i una eixida que explique exactament què ha fallat.

## Sinapsis

- [[index_trellat|Índex de Trellat]]
- [[auditoria_canonica]]
- [[MOTOR_OFFLINE]]
- [[00_arquitectura_tecnica_unificada]]


**Ancoratge de Seguretat:** [[00_index_identitat]]

## Sinapsis Entrants (Autogenerat)

- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[03_consola_termodinamica]]
- [[03_consola_termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md]] — [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[03_Co...
- [[core_registre_automillora|00_SER_Brain_Identitat/CORE_Registre_Automillora.md]] — | 260707_1000 | 260707_1100 | 23h              | 4       | Exigència Matemàti...
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — Assistència de la Ment Colmena per processar dades. La [[03_Consola_Termodina...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[03_Consola_Termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md...
- [[identitat|01_SABER_Cultura_Coneixement/Identitat.md]] — [[03_Consola_Termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md...
- [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — [[03_consola_termodinamica]]
- [[auditoria_canonica|02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md]] — [[03_Consola_Termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md...
- [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — [[03_consola_termodinamica]]
- [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — [[03_consola_termodinamica]]
- [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[03_consola_termodinamica]]

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
