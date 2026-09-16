---
tipus: skill
estat: canonic
description: Defineix com experimentar amb IA local i RAG sense convertir prototips futurs en garanties del sistema.
tags:
  - maquina
  - skills
---
# Adaptació futura amb veto de Baseline

Este document governa experiments; no afirma que WebNN, IA integrada al navegador o un RAG local estiguen implementats. Cap experiment es promociona a arquitectura activa sense codi, proves i fallback verificables.

## Principis

1. **Compatibilitat abans que novetat.** La funció essencial continua disponible sense acceleració d’IA, sense una API experimental i sense descarregar un model.
2. **Detecció de capacitats.** Es comprova en temps d’execució la disponibilitat real; no es deduïx pel navegador, la marca o l’any del dispositiu.
3. **Descàrrega consentida.** Pes, consum i privacitat s’expliquen abans de descarregar models o corpus.
4. **Veto de Baseline.** Una millora que degrade arrencada, memòria, bateria o interacció en el dispositiu de referència del Baseline 2022 queda fora del camí principal.
5. **Proveïdor substituïble.** Cap API comercial o experimental es converteix en font de veritat ni en requisit d’arrencada.

## IA local i Web Workers

Les tasques costoses han d’executar-se fora del fil principal quan la plataforma ho permeta, amb cancel·lació, límits de memòria i degradació segura. Dir «silenciós» no basta: cal mesurar bloqueig del fil principal, temps, memòria i bateria sobre un escenari reproduïble.

Un Worker evita bloquejos de UI, però no reduïx automàticament el cost total. S’ha de poder interrompre quan la pestanya queda en segon pla o l’usuari abandona la tasca.

## RAG local

- El corpus es selecciona; no s’injecta tota la Wiki ni els arxius massius.
- Cada resposta mostra les fonts recuperades i diferencia text font d’inferència.
- La jerarquia de [[doc_governanca]] resol conflictes; un `.md` qualsevol no és dogma per ser Markdown.
- Mirrors, arxiu i vendors no poden sobreescriure normes operatives.
- Contingut privat o sensible no entra en embeddings ni telemetria sense base jurídica i control humà.
- La cerca textual simple és el fallback. Una base vectorial només s’accepta si millora una bateria de consultes definida.

## Escala de maduresa

1. **Hipòtesi:** cas d’ús, risc, pressupost i alternativa sense IA.
2. **Prototip aïllat:** dades de prova, cap escriptura canònica i cap dependència del flux principal.
3. **Canari:** dispositius declarats, conjunt de consultes, mètriques i comparació amb el fallback.
4. **Promoció:** tests, privacitat, rollback i documentació actualitzada.

Qualsevol experiment que haja de modificar coneixement, configuració o codi seguix el Reflex de Petorreta. Els antics `migracio_v5.js` i altres scripts arxivats no són mecanismes d’activació.

## Criteris d’acceptació

- El build i el flux principal funcionen amb la capacitat desactivada.
- No hi ha descàrregues ocultes ni transmissió de corpus no declarada.
- El dispositiu de referència del Baseline 2022 manté els pressupostos acordats amb dades de prova.
- Les respostes RAG són traçables a fragments concrets.
- Hi ha cancel·lació, fallback i rollback provats.

## Sinapsis

- [[03_consola_termodinamica]]
- [[MOTOR_OFFLINE]]
- [[doc_governanca]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** skills (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]
**Ancoratge de Seguretat:** [[00_index]]


---

**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — Anc...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — Eti...
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — Cat...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[futur_adaptacio]]
- [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — [[00_index|00_INDEX.md]] — [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills...
- [[MOTOR_OFFLINE|02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md]] — [[futur_adaptacio]]
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[futur_adaptacio|02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md]] — La ...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
