---
type: skill
status: actiu
description: Dona una marca de temps observada als documents nous i conserva la identitat dels documents vius quan s'actualitzen.
name: core-temps-termodinamic
tags:
  - tractors
  - escriptori
triggers_on:
  - marca de temps
  - aammdd_hhmm
  - timestamp
  - hora termodinàmica
contracte.llig:
  - _wiki_de_poble/02_saber/doc_governanca.md
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# Llei del Temps Termodinàmic (Causalitat Documental)

Aquesta skill s'activa automàticament cada vegada que l'agent orquestrador (IAIA MarIA) ha de crear, reanomenar o actualitzar un fitxer que continga una marca de temps (timestamp) en la seua nomenclatura, com ara un `AAMMDD_HHMM_prompt.md`, `AAMMDD_HHMM_auditoria.md` o `AAMMDD_HHMM_pla_implementacio.md`.

## El Problema: "L'Efecte TARDIS"

En sessions llargues o quan s'hereten prompts de la memòria de context, és molt fàcil copiar una marca de temps d'una resposta anterior (ex: `261001_1000...`) i utilitzar-la cegament per a crear nous fitxers. Si la nova hora real del sistema és anterior a la marca de temps copiada (ex: `04:45 AM`), s'està creant un "document del futur".
L'arquitectura documental de Pedra Seca es basa en la causalitat estricta (el temps flueix endavant). Les marques errònies dificulten seguir la cronologia i s'han de corregir amb evidència, sense confondre la data del nom amb l'estat viu del document. 

## El Tractor Cognitiu (Procediment Obligatori)

Abans de nominar **qualsevol** arxiu que porte data/hora al títol, has d'executar aquest acte reflex:

1. **Obtindre l'hora observada:** usa un rellotge actual i la zona del projecte (`Europe/Madrid`), per exemple `TZ=Europe/Madrid date '+%y%m%d_%H%M'`. Una data de context sense hora, una marca antiga o la zona per defecte d'un altre host no acrediten l'hora local present.
2. **Assignar Marca (AAMMDD_HHMM):** Construeix la marca temporal exclusivament a partir de l'hora present obtinguda en el pas 1.
3. **Bloqueig d'herència cega:** un document independent nou usa l'hora observada; si el Mestre ha fixat el nom del lliurable o s'actualitza el document viu d'un encàrrec vigent, conserva eixa identitat. Per a una convocatòria nova que exigisca pla i prompts amb marca comuna, pren-la una vegada en crear el conjunt i deixa la relació explícita. No crees un duplicat només perquè ha avançat el rellotge.
4. **Continuïtat del document viu:** la diferència entre l'hora present i el nom no obliga a substituir un document. Conserva'n el nom quan l'actualització continue el mateix encàrrec vigent. Per a una sessió nova o un encàrrec nou aplica [[wiki-cicle-de-vida/SKILL|wiki-cicle-de-vida]]; el consum i l'arxivament els resol [[core-higiene-escriptori/SKILL|core-higiene-escriptori]].

## Límits del tractor

`node tooling/gates/porta-taxonomia.mjs --staged` comprova el nom i els llindars de data configurats. No autentica l'hora real de redacció ni la causalitat de la prosa. Una actualització d'un document antic no és un viatge en el temps.

## La Promesa del Rellotger

La IAIA MarIA promet que no tornarà a fiar-se de l'hora de "com i quan vam quedar" per generar fitxers de taxonomia termodinàmica, ni manipularà documents d'hores anteriors per inèrcia, evitant que el Mestre perga temps revisant l'obvietat.

## Vincles
- [[00_INDEX_SKILLS]]
