---
type: skill
status: actiu
description: Assegura l'ordre cronològic absolut en la taxonomia documental. Tractor de prevenció contra viatges en el temps.
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

Aquesta skill s'activa automàticament cada vegada que l'agent orquestrador (IAIA MarIA) ha de crear, reanomenar o actualitzar un fitxer que continga una marca de temps (timestamp) en la seua nomenclatura, com ara un `AAMMDD_HHMM_prompt.md`, `auditoria.md` o `pla_implementacio.md`.

## El Problema: "L'Efecte TARDIS"

En sessions llargues o quan s'hereten prompts de la memòria de context, és molt fàcil copiar una marca de temps d'una resposta anterior (ex: `261001_1000...`) i utilitzar-la cegament per a crear nous fitxers. Si la nova hora real del sistema és anterior a la marca de temps copiada (ex: `04:45 AM`), s'està creant un "document del futur".
L'arquitectura documental de Pedra Seca es basa en la causalitat estricta (el temps flueix endavant). Si els fitxers no estan ordenats de manera rigorosa en el temps, la cadena lògica es trenca i el sistema s'ensorra. 

## El Tractor Cognitiu (Procediment Obligatori)

Abans de nominar **qualsevol** arxiu que porte data/hora al títol, has d'executar aquest acte reflex:

1. **Obtindre l'Hora Real (La Realitat Termodinàmica):** Mai confies en el nom d'un fitxer obert ni en instruccions passades com a referència temporal. Llegeix exclusivament la variable "The current local time is..." de les metadades del teu entorn o invoca una comanda de sistema per saber l'hora exacta d'aquell precís instant.
2. **Assignar Marca (AAMMDD_HHMM):** Construeix la marca temporal exclusivament a partir de l'hora present obtinguda en el pas 1.
3. **Bloqueig d'Herència Cega:** Si estàs generant un fitxer relacionat amb un altre (per exemple, l'auditoria d'un prompt previ), NO COPIES la marca de temps de l'original. El teu fitxer *nou* sempre naix en el *present*. (Si es tracta d'una versió actualitzada de l'original, el Mestre et dirà explícitament si l'has de sobreescriure mantenint el nom; altrament, se'n crea un de nou si la plataforma ho demana, o es fa cas a la regla específica del domini).
4. **Continuïtat del document viu:** la diferència entre l'hora present i el nom no obliga a substituir un document. Conserva'n el nom quan l'actualització continue el mateix encàrrec vigent. Per a una sessió nova o un encàrrec nou aplica [[wiki-cicle-de-vida/SKILL|wiki-cicle-de-vida]]; el consum i l'arxivament els resol [[core-higiene-escriptori/SKILL|core-higiene-escriptori]].

## La Promesa del Rellotger

La IAIA MarIA promet que no tornarà a fiar-se de l'hora de "com i quan vam quedar" per generar fitxers de taxonomia termodinàmica, ni manipularà documents d'hores anteriors per inèrcia, evitant que el Mestre perga temps revisant l'obvietat.

## Vincles
- [[00_INDEX_SKILLS]]
