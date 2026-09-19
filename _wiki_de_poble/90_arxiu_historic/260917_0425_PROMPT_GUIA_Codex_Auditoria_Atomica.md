---
type: petorreta
status: actiu
description: Auditoria Atòmica de deute tècnic, skills duplicades i tractors.
tags:
  - govern
---

# Petorreta — Auditoria Atòmica (Fase 0 - CODEX)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917-CODEX |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 04:25 |
| Modificació | 2026-09-17 04:25 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-17 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- Accés directe de lectura a l'espai de treball `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`.

## Consell convocat

ChatGPT (Codex / o1) amb **esforç MÀXIM**.

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'espai de treball al que tens accés.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al teu entorn.

## Informe d'avanç

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [socdepoble.blogspot.com](http://socdepoble.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble.

Estem a punt d'iniciar el desenvolupament del Bloc de Notes Universal a 3 columnes. No obstant això, abans d'afegir complexitat, necessitem una purga destructiva de l'arquitectura de regles i validacions (Skills i Tractors) i del codi fantasma acumulat.

**[ATENCIÓ: NO DISSENYES EL BLOC DE NOTES]**: Tu (Codex) ja has analitzat i proposat l'arquitectura lògica del Bloc de Notes en la sessió anterior. No gastes ni un sol token en redissenyar-lo ni en pensar com implementar-lo. La teua missió ara és *exclusivament* auditar les skills, els tractors i el codi existent per netejar la casa.

## Situació i dades opaques

Ignorem si els tractors (`tooling/gates/`) estan operant d'acord amb les `skills` actuals. Ignorem si hi ha `skills` duplicades per amnèsia d'altres IA.

## Missió

1. **Les Skills i Regles:** Llig la carpeta `.agents/skills/` i la carpeta `_wiki_de_poble/`. Busca contradiccions, skills duplicades per a fusionar i regles que es contradiuen.
2. **Els Tractors (Portes de Validació):** Llig `tooling/gates/`. Verifica si fan el que diuen les skills i si hi ha forats de seguretat.
3. **Codi Fantasma i Deute:** Llig `src/components/PedraSeca/` i `src/components/layout/`. Busca codi mort, components obsolets o patrons que violen l'especificació de Pedra Seca.

## Eixida esperada

Genera un **"Informe d'Auditoria Atòmica"** estructurat en Markdown que contingui:
- [FUSIÓ DE SKILLS]: Quines skills hem de combinar o eliminar.
- [VULNERABILITATS ALS TRACTORS]: Quins tractors estan mal dissenyats o no validen bé.
- [PURGA DE CODI]: Quins fitxers i components exactes hem d'esborrar.

## Incògnites

- No s'analitza la integració del backend en aquest prompt.

## Bateria de veritat

- [ ] He citat només rutes reals en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
