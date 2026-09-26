---
type: document
status: canonic
description: Separa els controls de salut implementats de les mètriques conceptuals i prohibix fabricar percentatges sense evidència.
tags:
  - core
  - genoma
  - identitat
---
# Consola Termodinàmica

La Consola és un contracte de mesura i decisió, no una pantalla màgica ni un permís d'autocuració. Una mètrica només és operativa si té fórmula, font, denominador, abast, data i prova reproduïble. Si falta una peça, el valor correcte és `N/A`, no `100%` ni una estimació optimista.

## Estat verificat de la baseline

| Senyal | Estat | Autoritat i límit |
|---|---|---|
| Integritat de frontmatter i graf operatiu | Implementada | `tractor-frontmatter.mjs` (`npm run porta:frontmatter`) valida contra `tooling/wiki/schema.json`; `porta:scc`, `porta:orfandat` i `porta:teixit` vigilen el graf; `autoneteja_wiki.mjs` audita i planifica migracions reversibles. |
| Porta abans del commit | Versionada | `.husky/pre-commit` executa primer la frontissa de contingut, la taxonomia i la plantilla viva, i després `git-staged.mjs`. La CI i la protecció de branca encara no estan acreditades. |
| Índex/ontologia derivats | Implementats | `compile-wiki-to-app.mjs`, `npm run rag:build` i `npm run slugs:build`; són memòria cau regenerable, no font de veritat. |
| “IT” de tres components del CLI | Retirat com a porta | `sdp check` falla tancat perquè combinava proxies incomplets i podia donar puntuació a un corpus buit. El codi antic només és material d'estudi; no representa el [[index_trellat|marc humà complet]]. |
| Accessibilitat i Web Vitals | Sense telemetria integrada | Necessiten navegador real, corpus de casos i resultats conservats. La doctrina del dispositiu de referència (A10) es va retirar amb l'[[ADR-2026-08-ONLINE-FIRST]]. |
| Resiliència sense connexió | Fora d'abast | L'arquitectura és online-first: l'ADR-2026-08 retira la PWA i el mode offline. El comportament esperat és un error de xarxa honest, no un índex de resiliència. |
| Tombstones CRDT | No aplicable | No hi ha motor CRDT actiu ([[arquitectura_sistema_nervios]] el descriu com a visió futura); no s'inventa una càrrega percentual. |
| Panell web de salut i ritual setmanal | Futur | No hi ha canonada que els alimente de manera verificable. |

## Fonts de veritat

Les portes mecàniques vigents són:

1. `npm run porta` (`tooling/gates/run-portes.mjs`), la cadena agregativa, que s'atura a la primera porta que falla;
2. `npm run porta:frontmatter` i `npm run porta:documents` per a esquema, contingut i contracte documental, amb `npm run test:documental` per a les seues regressions;
3. `.husky/pre-commit` sobre l'arbre Git preparat;
4. CI i protecció de branca quan s'hagen versionat i activat;
5. decisió humana per a riscos, semàntica i canvis de governança.

Els pressupostos de `tooling/wiki/rules/trellat-rules.json` (`itOptimal: 90`, `ramMbMaxBaseline: 1200`, `tombstonePercentMax: 70`) són hipòtesis de control sense instrument que les mesure. El fitxer continua viu perquè `npm run rag:build` en llig les paraules buides. Que un número aparega en una configuració no prova que existisca l'instrument que el mesura: cap llindar té valor de porta fins que una prova en documente l'origen i la validesa.

## Contracte per promoure una mètrica

Cada mesura nova ha de registrar:

- pregunta o decisió que resol;
- fórmula, unitat, numerador i denominador;
- font, versió del codi i dispositiu;
- abast, exclusions i període;
- llindar justificat i responsable;
- prova d'èxit, fallada i recuperació;
- format JSON estable i historial comparable.

Una mètrica consultiva no activa mutacions. Si un llindar ha de bloquejar o curar, necessita una regla de governança, regressió negativa, Reflex, marxa arrere i una eixida que explique exactament què ha fallat.

## La carpeta de la Consola

La Consola té dos funcions que es complementen: la **Salut**, que és este document (si funciona i amb quina prova), i el **Mapa** (què hi ha i qui crida qui). El Mapa s'ha estudiat a partir del «Mapa de mis agentes» d'Emowe.

- [[01_fluxos_skills]]: qui crida qui i qui llig el que un altre deixa.
- [[02_calendari]]: què corre sol, quan, i si continua viu.
- [[03_inventari_skills]]: cens i semàfor de les skills.
- [[04_contracte_de_dades]]: el JSON que llegirà la Consola i els camps que falten.
- [[05_actors_i_salut]]: actors, candats, frontissa de contingut i primeres mètriques de salut.

## Vincles

- [[index_trellat]]
- [[auditoria_canonica]]
- [[00_arquitectura_tecnica_unificada]]
- [[00_index_identitat]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[arquitectura_sistema_nervios]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[04_contracte_de_dades]]
- [[05_actors_i_salut]]
