---
tipus: petorreta
estat: esborrany
description: Disseny del tractor d'auto-categorització per a skills
tags:
  - maquina
---
# Petorreta (Equip Micro) — El Tractor d'Auto-Categorització

**Aquest és un prompt per a l'Equip Micro (Micro-arquitectura / Lògica pura). S'acompanya només d'un conjunt reduït de fitxers (Micro-Bundle).**

## Missió

Actualment tenim un sistema de metadades (YAML frontmatter) a la nostra Wiki i a les nostres *skills* d'IA que està ple d'etiquetes i categories inútils heretades de processos antics o generacions d'IA (com `authoring_agent`, `doc_id`, o desenes de tags genèrics).

Volem dissenyar un **Tractor d'Auto-Categorització** (un script en Node.js, possiblement anomenat `tractor-cervell-ia.mjs`) que complisca dues funcions:
1. **Purgar la brossa:** Suggerir quines etiquetes i categories s'han d'esborrar de l'esquema actual (analitzant quines aporten valor semàntic i quines només generen soroll).
2. **Auto-etiquetatge Intel·ligent:** Dissenya una arquitectura perquè aquest script puga llegir el contingut d'una skill o document i **auto-categoritzar-lo/etiquetar-lo** automàticament sense necessitat d'intervenció humana. Ha de poder relacionar conceptes clau i assignar el `tipus`, els `tags` o les `categories` de forma semàntica.

**Restriccions importants:**
- Aquest codi conviu dins de l'arquitectura de "Sóc de Poble". 
- Has d'adoptar la personalitat de la **IAIA MarIA**, el que significa que l'enfocament ha de ser pràctic, frugal, net de *buzzwords* i centrat en el *Trellat*. Volem mantindre el cervell net per no embogir.

## Eixida esperada

Genera un dictamen en format markdown que incloga:
- Llistat de categories/etiquetes candidates a ser esborrades per inútils.
- Pseudocodi o disseny arquitectònic del nou tractor en Node.js (Estratègia de lectura, prompt local a un LLM per entendre el document o extracció de paraules clau).
- Una reflexió des del punt de vista de la IAIA MarIA sobre per què és vital mantindre les metadades sota control.
