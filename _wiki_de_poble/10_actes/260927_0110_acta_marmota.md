---
type: acta
status: canonic
description: Acta Marmota de la matinada del 26 al 27-09-2026. Arquitectura del Xat clon de WhatsApp amb zero fricció, saturació de crèdits d'Opus i estratègia de relleu cap a Fable.
tags:
  - acta
  - marmota
visibility: private
---
# Acta Marmota - Sessió de la Matinada (26-09-2026 / 27-09-2026)

## Context
El Mestre Poble i la IAIA MarIA hem estat dissenyant l'Arquitectura del Mòdul de Xat (un clon funcional i visual de WhatsApp amb "Zero Fricció").
En aquesta sessió hem topat amb una forta saturació de crèdits i context: Opus 5.5 va esgotar la quota executant agents paral·lels per a escriure l'arquitectura. Després de recarregar saldo de crèdits, Opus va decidir autònomament escriure el document a mà (seqüencialment) en lloc de rellançar agents per a evitar la crema massiva de tokens (molt intel·ligent).

## Decisions Tècniques i Producte Preses
1. **Zero Fricció (Llei del Poble)**: S'ha establert que el Xat ha de ser visual i funcionalment idèntic a WhatsApp. L'adopció mana.
2. **Carpetes Intel·ligents**: Les IAs no s'imposen com a bots de comandaments; funcionen d'oients passius (carpetes intel·ligents) per extraure l'ordre del caos natural de les converses (ex: qui s'apunta, bloc de notes).
3. Hem detectat que `/search`, `/profile` i altres rutes estaven llegint de mock files antics (`agentsSeed.js`) i no de Supabase. Hem creat un inventari (`260927_0050_inventari_vistes_antigues.md`) per a futura destrucció o refactorització ("Sagramental dels Morts").
4. **Estratègia de Relleu Opus -> Fable**: L'Arquitecte (Opus) dissenya (escriu la documentació). En acabar, Fable Ultracode llegeix la documentació i pica el codi consumint la seua quota.

## Infraccions i Correccions
- **Infracció GREU de Bios**: La IAIA (jo) vaig generar el prompt per a Fable sense utilitzar la plantilla ISO (`prompt_local.md`). Això és una violació de l'Acte Reflex i la Primacia Canònica. El Mestre ho va detectar i ho he corregit immediatament.
- **Saturació de Context**: Jo (MarIA) estava al voltant del 85-90% de saturació de context degut a l'extensió de la conversa. Era obligatori fer l'Acta, netejar i reiniciar la sessió.

## Següents Passos (Per al pròxim Agent / Sessió)
- Llegir el prompt reconstruït a l'escriptori (`260927_0055_prompt_fable_xat.md`).
- Assegurar-se que el document de disseny d'Opus ha finalitzat amb èxit.
- Llançar a Fable Ultra Code per a que comence a generar l'esquema de bases de dades i els components React del Xat basats en l'especificació d'Opus.

## Vincles

- [[00_index]]
