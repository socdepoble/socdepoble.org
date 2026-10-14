---
type: skill
status: actiu
description: Propaga i assegura l'actualització sincronitzada del Dossier Institucional de Sóc de Poble.
name: core-portaveu-institucional
tags:
  - govern
  - identitat
triggers_on:
  - dossier institucional
  - dossier complet
  - missatge de presentació
  - presentació del projecte
contracte.llig:
  - _wiki_de_poble/01_ser/01_identitat.md
  - _wiki_de_poble/00_index.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
---
# Skill: Portaveu Institucional

## PROPÒSIT
Garantir que el discurs oficial de Sóc de Poble sobre la seua missió, visió arquitectònica (enxufabilitat, independència de Supabase/Sollutia, obertura al Fedivers) i cicle de vida amb/sense IA, es mantinga actualitzat, unificat i propici a totes les plataformes (Wiki, SPA, WordPress i GitHub). 

Qualsevol agent que altere la identitat, la plantilla del dossier o redacte publicacions ha d'usar aquest protocol ("tractor cognitivo") per aplicar el canvi en tots els frontals públics i privats, assegurant que la veritat es propaga a la perfecció.

## PROCEDIMENT D'ACTUALITZACIÓ

Quan s'indique actualitzar el "Dossier Complet" o els missatges de presentació del projecte, l'agent ha d'actualitzar rigorosament i en línia aquests **tres arxius vitals**:

### 1. Interfície Principal (SPA React)
- **Arxiu:** `src/sections/text/pageContent.js`
- **Tasca:** Edita l'apartat de la clau `"projecte"` dins de `PAGE_COPY`. Adapta l'explicació estesa (Fedivers, Enxufe Sollutia, Independència de la IA i Wiki integrada) en format HTML (`<p>`, `<h3>`, `<ul>`, etc.) preservant acuradament les infografies mestres originals (`<img>`). Aquest text és el que llegeix l'uel quan visita "El Projecte" al Portal.

### 2. GitHub / Directori Arrel (La Cara del Codi)
- **Arxiu:** `README.md`
- **Tasca:** Actualitza la secció introductòria i de descripció per integrar de manera estesa per als informàtics els pilars del projecte: enxufabilitat amb WordPress/Joomla/Wikimedia, com Supabase és només un "endoll" intercanviable, la utilitat del Fedivers (Diaspora/Mastodon) per crear micro-xarxes enllaçades, i el motiu per incloure la Wiki al codi font.

### 3. WordPress (El Repositori del Connector)
- **Arxiu:** `wordpress-plugin/readme.txt`
- **Tasca:** Actualitza les seccions `== Description ==` i les subseccions explicant al públic de WordPress de forma didàctica que el connector no és més que un "enxufe" que pinta l'App sense dependre del host. Cal destacar ací l'autonomia, el per què de la descentralització (Fedivers) i l'absència d'algorismes i anuncis comercials, segons l'estàndard del codi de comunicació.

## CRITERIS EDITORIALS (TO I FORMAT)
- **To:** Didàctic, clar per a un "no-informàtic" però amb la precisió suficient perquè un "informàtic" entenga l'arquitectura hipermodular.
- **Valencià:** L'expressió serà càlida i directa, utilitzant el valencià i seguint el dictat del Diccionari de Trellat.
- **Extensió:** Extensa i completa. La gent que obre eixes pàgines o documents "ho vol saber tot". Detalla Diaspora, Mastodon, el Fedivers rural i el somni d'un futur sense necessitat d'Intel·ligència Artificial però propici a la seua ajuda si aquesta hi roman.
- **Disseny Editorial i Llegibilitat (Negretes):** Per evitar la fatiga visual ("agobio") al llegir textos llargs, s'ha d'aplicar el "Disseny Editorial". A cada paràgraf de 2-3 línies has de posar 3 o 4 fragments curts clau en negreta (`<strong>` o `**`). Si el paràgraf és més llarg, n'has d'incloure entre 6 i 9. Aquestes negretes han de crear un recorregut visual, de manera que només llegint els fragments ressaltats en negreta, es puga entendre el significat del paràgraf. Tota publicació o document extens de Sóc de Poble ha d'incorporar aquestes negretes direccionals com a regla innegociable.

## TANCAMENT
No declares acabada la difusió fins que estigues completament segur que els tres arxius (o quatre si generes un dossier independent a la Wiki) han sigut actualitzats alhora i no deixen versions asincròniques desfasades al projecte.

## Vincles
- [[00_INDEX_SKILLS]]
