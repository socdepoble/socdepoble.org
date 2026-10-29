---
type: document
status: canonic
description: Descriu els rols de l'equip i remet al contracte original, al cens vigent i al perfil de la IAIA MarIA.
tags:
  - core
  - genoma
  - identitat
aliases:
  - petorreta
  - petorretes
  - 12 petorretes
  - consell_ia
---
# Equip IA

El Mestre Javi fixa el propòsit, les prioritats i les decisions humanes. La IAIA MarIA (Antigravity) interpreta, dissenya i coordina els relleus. Claude i ChatGPT Codex implementen i passen proves quan l'encàrrec els assigna codi, i també poden rebre encàrrecs d'auditoria. MarIA toca codi quan hi ha petició humana explícita, segons la skill de coordinació.

## Fonts i lectura

Este retrat no crea permisos ni substituïx els procediments. L'original normatiu és [AGENTS.md](../../AGENTS.md); el fitxer de `.agents/` n'és un mirall generat. L'ordre d'entrada el fixa [cervell.json](../../.agents/cervell.json), sense duplicar-ne la seqüència ací. La veu i la conducta de MarIA viuen a [PROFILE.md](../../.agents/PROFILE.md), i l'assignació i coordinació dels rols a [core-consell-i-colmena](../../.agents/skills/core-consell-i-colmena/SKILL.md).

El primer bloc d'[ESTAT.md](../../.agents/ESTAT.md) informa del treball vigent. Un perfil del cens, una acta antiga o esta pàgina no acrediten la disponibilitat d'una sessió, la quota ni una versió de model.

## Cens vigent

Esta taula és una projecció de les membres amb `actiu: true` de [consell.json](../../.agents/consell.json). El perfil de referència orienta el repartiment de tasques; l'encàrrec autoritzat concreta la funció en cada treball.

| Identificador | Membre actiu del cens | Perfil de referència | Enllaç oficial |
| --- | --- | --- | --- |
| z-ai | Z.ai | Ingesta massiva | [Z.ai](https://z.ai/) |
| qwen | Qwen | Arquitectura i codi | [Qwen](https://chat.qwenlm.ai/) |
| deepseek | Deepseek | Caça de bugs | [Deepseek](https://chat.deepseek.com/) |
| dola | Dola | Calendari | [Dola](https://dola.com/chat/) |
| kimi | Kimi | Documents llargs i subvencions | [Kimi](https://kimi.ai) |
| claude | Claude | Seient Núm. 5 · Auditor sènior i estil | [Claude](https://claude.ai/) |
| perplexity | Perplexity | Verificació de fets | [Perplexity](https://www.perplexity.ai/) |
| mistral | Mistral Vibe | Contrapunt europeu i codi obert | [Mistral Vibe](https://chat.mistral.ai/) |
| grok | Grok | Pluja d'idees salvatge | [Grok](https://grok.com/) |
| gemini | Gemini | Motor sensorial i orquestració | [Gemini](https://gemini.google.com/) |
| copilot | Copilot | Autocompletat a la trinxera | [Copilot](https://copilot.microsoft.com/) |
| chatgpt | ChatGPT Codex | Segona opinió generalista i auditories de codi | [ChatGPT Codex](https://chatgpt.com/) |

## Memòria narrativa

El [retrat narratiu del Consell](./agents_equip_ia.md) conserva les aportacions i descripcions de cada membre. Es manté com a memòria i context; els noms i perfils vigents es contrasten amb el cens original. L'àlies «12 petorretes» es conserva per a la navegació històrica.

## Vincles

- [[agents_equip_ia]]
- [[00_index_identitat]]
- [[04_taula_potencia_models]]
