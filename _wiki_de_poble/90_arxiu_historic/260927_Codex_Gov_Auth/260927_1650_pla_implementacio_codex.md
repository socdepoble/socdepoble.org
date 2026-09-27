---
type: document
status: esborrany
description: Reparació del hook de lectura, capçaleres accessibles i estabilització de login i organitzacions amb Model B.
tags: [implementacio]
reflex: sdp:torn_12049509-c4ff-451a-af3c-d759d1fe3b77:fd2f0a90-203e-490b-9556-20d72af11413
---
# Pla d'Implementació (Torn Codex Ultra)

## Objectius
1. **Governança i Seguretat (Reparació del Segell):** El sistema de hooks (especialment `tooling/gates/mutation-policy.mjs`) està bloquejant operacions de lectura legítimes (com el retorn d'informes de subagents i eines d'exploració), cosa que provoca pèrdues massives de tokens (1.27M en l'última sessió de Fable). Cal obrir els permisos de lectura sense trencar la política de mutació i restaurar el Segell.
2. **Deute Tècnic UX (Botons de Replegar):** Estandarditzar l'àrea de clic ("hit area") dels botons de replegar panells laterals. Tota la pastilla (icona + text + icona tancar) ha de ser clicable a Xat, Disseny i Wiki. Excepció: Bloc de Notes i Carpetes.
3. **Flux d'Usuari Registrat:** Implementar o revisar el flux d'autenticació i registre amb Supabase. El sistema ha de permetre entrar com a usuari registrat.
4. **Creació d'Entitats (Empreses i Grups):** Desenvolupar el flux complet perquè un usuari pugui donar d'alta "Empreses" i "Grups" dins de l'aplicació, respectant la hipermodularitat i el disseny de Pedra Seca.

## Arquitectura (Model B i Enxufabilitat)
- Les trucades de registre, login i creació d'empreses s'han de fer a través de serveis aïllats que es connecten a Supabase (Model B), de manera que el component de React no sàpiga mai quina base de dades s'usa.
- Les vistes de formulari s'han d'alinear estèticament amb la resta de formularis de l'aplicació.

## Tasques per a Codex
- [x] **T1:** Revisar `tooling/gates/mutation-policy.mjs` per afegir permisos de lectura (`SubagentHandback`, `Skill`, `ListSkills`, `ls`, `grep`) als agents d'exploració i silenciar els falsos positius de `segell-auto`.
- [x] **T2:** Refactoritzar els components de les capçaleres de panell lateral (ex: `RailXat`) perquè tota la fila sigui interactiva (`onClick`).
- [x] **T3:** Implementar / completar la vista de Login i Registre.
- [x] **T4:** Crear les vistes i serveis per a la creació de Grups i Empreses.


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-2026-09-27-CODEX |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27 16:50 |
| Modificació | 2026-09-27 16:56 |
| Propietari | Codex |
| Aprovació humana | Execució explícita T1–T4 en este xat |
| Model IA | GPT-6 / Codex; variant no verificable |
| Tokens consumits | No disponibles en l’arnés; no estimats |

## Acte reflex

Plantilla pla.implementacio llegida íntegrament i rebut persistent obtingut. Cos original del pla conservat. El rebut acredita procedència; l’autorització és la instrucció explícita de l’usuari.

## Historial

- 2026-09-27: pla inicial de MarIA; Codex incorpora metadades i consens tècnic després de la inspecció paral·lela.

## Canvis proposats

Consens estabilitzat abans d’editar codi crític:

1. T1: política amb llista explícita d’eines de lectura i retorn; parser conservador de comandes simples; el post-hook omet només lectures pures. Redireccions, substitucions, eines opaques i escriptures mantenen restriccions. Executor, claims i leases vigents.
2. T2: opció explícita de capçalera com a botó a AppGridColumn/UniversalWorkspace, activada només a Xat, Disseny i Wiki. Notes i Carpetes mantenen el comportament actual.
3. T3: conservar port d’autenticació i formulari existents, rebutjar respostes de login sense sessió vàlida i ignorar resultats antics. Cobrir entrada per correu, errors, confirmació i retorn a ruta protegida.
4. T4: estabilitzar PerfilShell/DialegNovaOrganitzacio/PerfilContext amb servei neutral, validació de resposta i prevenció de duplicats. El contracte vigent obliga el grup a pertànyer a una empresa administrada; no es canvia l’esquema.

Alternatives descartades: obrir la shell sencera (perdria el límit de mutació) i duplicar fluxos d’organitzacions/router (augmentaria manteniment i acoblament).

## Verificació

Proves positives i negatives dels hooks; proves de components, auth i entitats; lint; build web/WP; portes Model B, navegació local i tancament documental. Fallades prèvies es distingixen de regressions.

## Riscos

- Classificar shell amb efectes com lectura: parser restrictiu i casos adversos.
- Resultats asíncrons d’una sessió antiga: guardes abans d’actualitzar UI.
- Duplicar organitzacions o anunciar èxit buit: contracte de resposta, actualització idempotent i bloqueig d’enviament.
- Treball alié sense commit: conservar els canvis inicials, sense neteja ni publicació.

## Vincles

- [[00_index_escriptori]]
- [[260927_1650_prompt_codex]]
