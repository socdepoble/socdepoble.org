---
type: document
status: canonic
description: Defineix l’Índex de Trellat com a marc de decisió auditable i prohibix convertir estimacions en salut automàtica.
tags:
  - maquina
---
# Índex de Trellat

L’Índex de Trellat (IT) és un marc de conversa per combinar quatre dimensions. No és una telemetria implementada ni una porta de seguretat. Sense fonts, denominadors i període, no es calcula ni s’usa per declarar el sistema saludable.

## Fórmula de referència

```text
IT = (0,4 × CT) + (0,3 × CE) + (0,2 × CA) + (0,1 × CR)
```

| Variable | Dimensió | Evidència admissible |
|---|---|---|
| CT | Coherència de Trellat | Resultats reproduïbles de Wiki, contradiccions i decisions resoltes sobre el total revisat. |
| CE | Eficiència cognitiva | Tasques i recursos mesurats amb una definició prèvia d’«útil»; mai una impressió retrospectiva. |
| CA | Accessibilitat | Casos o components aprovats sobre el total en scope, amb prova automàtica i manual declarada. |
| CR | Resiliència de sincronització | Escenaris de fallada superats sobre el total executat; només quan existisca un motor real. Amb l’arquitectura online-first no n’hi ha cap, i hui CR val N/A. |

## Contracte de mesura

Cada valor ha de registrar:

- numerador i denominador;
- scope i versió del codi;
- període o instant de la prova;
- ferramenta i configuració;
- incidències excloses i motiu;
- enllaç a l’evidència reproduïble.

## Interpretació orientativa

| IT | Lectura |
|---|---|
| 90–100 | Evidència forta en l’scope mesurat; no equival a perfecció global. |
| 70–89 | Hi ha marge de millora identificable. |
| 0–69 | Cal revisar dimensions i riscos abans de continuar amb canvis relacionats. |
| N/A | Falten dades; està prohibit substituir-les per una estimació. |

Estos intervals no activen automàticament `SDP-LOCK`. Les portes efectives són la cadena `npm run porta` (`tooling/gates/run-portes.mjs`), `npm run porta:frontmatter`, el `.husky/pre-commit`, els tests, el Reflex i les decisions humanes de governança descrites a [[doc_governanca]].

## Procediment

1. Definix la decisió que ha d’ajudar a prendre l’índex.
2. Fixa scope, període, denominadors i proves abans de mirar el resultat.
3. Executa les comprovacions canòniques i conserva els resultats, no només la puntuació.
4. Publica les quatre dimensions separades junt amb l’IT.
5. No compares sessions amb scopes o instruments diferents.

`package.json` no té cap script `log-session` ni cap que calcule l’IT. Els `session-logger.js` i scripts homònims de l’arxiu són històrics i no poden presentar-se com automatització vigent.

## Taxonomia

L’IT no crea etiquetes de frontmatter. L’esquema canònic (`tooling/wiki/schema.json`) exigix `type`, `status` i `description`, i les etiquetes opcionals només poden prendre valors del vocabulari tancat de `tags`. La classificació principal prové de la carpeta (les sis vigents: `01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `10_actes` i `90_arxiu_historic`), el `type` i els enllaços.

## Vincles

- [[00_index]]
- [[auditoria_canonica]]
- [[a11y_seo_trellat]]
- [[00_portada]]
- [[00_arquitectura_tecnica_unificada]]
- [[doc_governanca]]
