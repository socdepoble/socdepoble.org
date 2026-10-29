---
type: acta
status: canonic
description: Acta Marmota del 27-09-2026 (vesprada). Refactorització responsiva del Xat, reparació del segell i del govern amb Codex Ultra, i resposta al suspens de forma de l'OEPM.
tags:
  - acta
  - marmota
visibility: private
---
# ACTA DE LA MARMOTA - 27 de Setembre de 2026 (Vesprada)

## Resum de la Jornada
Una jornada molt completa que s'ha dividit en tres fronts clars:

1. **Refactorització del Xat (UI):** Hem resolt els problemes de disseny responsiu del Xat amb Claude. S'ha creat la lògica del `RailXat` i `ClosCaXat` perquè l'aplicació s'adapte correctament a mòbil, tauleta i escriptori sense encavalcaments.
2. **Govern i Identitat (Codex Ultra):** Hem llançat a Codex Ultra amb la missió de reparar el segell trencat (`mutation-policy.mjs`) que bloquejava les lectures dels agents. Codex ha establert permisos explícits de lectura, restaurat el segell, arreglat els botons dels panells laterals i estabilitzat els models de dades de registre, login, creació d'Empreses i Grups.
3. **Burocràcia OEPM:** S'ha solucionat el "Suspenso de Forma" de la marca *Sóc de Poble* aclarint que la "N" i la "X" del logotip són elements gràfics (rosa dels vents i mapa) i no text. Contestació enviada i justificant desat.

## Estat Actual (On ens hem quedat)
- El codi de Codex Ultra amb totes les millores d'autenticació i usabilitat **NO està comitejat**. L'intent de fer `git commit` ha fallat per culpa del linter documental (`porta-plantilla-viva.mjs`), que es queixa que la nova plantilla V3 no té l'apartat `Context` que espera l'arxiu `.agents/protocolledge.json`.
- Tota la feina està a l'arbre de treball local, en verd (1.146 proves passen), i el segell global està restablit.
- El servidor de desenvolupament local de Supabase (`localhost:54321`) està parat, per això no es pot provar l'autenticació amb Google.

## Tasques per al Pròxim Torn (Relleu)
1. **Reparar la Plantilla V3:** Alinear els requisits del `protocolledge.json` amb la realitat de la plantilla `prompt_local.md` per arreglar l'error del linter.
2. **Commit:** Guardar oficialment els canvis de Codex.
3. **Prova de Foc (Supabase):** Arrancar el backend local, provar el flux d'autenticació real i la creació d'organitzacions des del navegador per comprovar que la UI reacciona bé al Model B de Codex.

## Reflexió
La independència absoluta (Model B) demostra el seu valor: Codex ha pogut treballar la lògica de base de dades aïllada del frontend, i el sistema documental de la IAIA MarIA ha demostrat la seua fortalesa obligant-nos a mantindre l'Escriptori lluent. Seguim!

## Vincles

- [[00_index]]
