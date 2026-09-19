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
| CR | Resiliència de sincronització | Escenaris de fallada superats sobre el total executat; només quan existisca un motor real. |

## Contracte de mesura

Cada valor ha de registrar:

- numerador i denominador;
- scope i versió del codi;
- període o instant de la prova;
- ferramenta i configuració;
- incidències excloses i motiu;
- enllaç a l’evidència reproduïble.

Si una dimensió és `N/A`, l’IT global també és `N/A`. No es posa a zero ni es renormalitzen els pesos silenciosament. En l’estat actual, CR no es pot puntuar com a resiliència CRDT perquè [[MOTOR_OFFLINE]] continua en estat `futur`.

## Interpretació orientativa

| IT | Lectura |
|---|---|
| 90–100 | Evidència forta en l’scope mesurat; no equival a perfecció global. |
| 70–89 | Hi ha marge de millora identificable. |
| 0–69 | Cal revisar dimensions i riscos abans de continuar amb canvis relacionats. |
| N/A | Falten dades; està prohibit substituir-les per una estimació. |

Estos intervals no activen automàticament `SDP-LOCK`. Les portes efectives són `wiki:audit:strict`, `precommit:sdp`, els tests, el Reflex i les decisions de `03_GOVERNAR`.

## Procediment

1. Definix la decisió que ha d’ajudar a prendre l’índex.
2. Fixa scope, període, denominadors i proves abans de mirar el resultat.
3. Executa les comprovacions canòniques i conserva els resultats, no només la puntuació.
4. Publica les quatre dimensions separades junt amb l’IT.
5. No compares sessions amb scopes o instruments diferents.

No hi ha cap `npm run log-session` actiu ni un `session-logger.js` operatiu. Els scripts homònims de l’arxiu són històrics i no poden presentar-se com automatització vigent.

## Taxonomia

L’IT no crea etiquetes de frontmatter. L’esquema v2 només admet `estat`, `tipus`, `description` i, opcionalment, `aliases` i `revisat`. La classificació principal prové del pilar 4+2, el `tipus` i els enllaços.

## Sinapsis

- [[auditoria_canonica]]
- [[a11y_seo_trellat]]
- [[MOTOR_OFFLINE]]
- [[03_consola_termodinamica]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — Ancorat...
- [[03_consola_termodinamica|00_SER_Brain_Identitat/03_Consola_Termodinamica.md]] — | “IT” de tres components del CLI | Retirat com a porta | sdp check falla tan...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[index_trellat]]
- [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — [[00_index|00_INDEX.md]] — [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/i...
- [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — Si una ...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
