---
type: norma
status: canonic
description: "Llei de privacitat per defecte: minimització, consentiment en el moment de l'acció, dret d'oblit, cura de la gent major i anonimització abans de parlar amb IAs externes."
tags:
  - govern
---
# Llei 05 · Privacitat

A Sóc de Poble la privacitat és l'estat per defecte, no una opció que cal buscar. Només es guarda el que fa falta, s'explica en el moment de l'acció i s'esborra de veritat quan la persona ho demana.

## 1. Principi

La privacitat és per defecte.

[[el_projecte|Sóc de Poble]] no recull, sincronitza, exposa ni conserva dades personals sense necessitat clara, context comprensible i base legítima.

## 2. Consentiment Invisible però Real

No es faran banners inútils.

El consentiment s’explica en el moment exacte de l’acció:

- “Aquesta foto es publicarà al mur del poble.”
- “Aquest missatge es compartirà amb el grup del poble.”
- “Aquesta preferència només es guarda en aquest navegador.”
- “Sense connexió no podem guardar-ho: torna-ho a provar quan tingues xarxa.”

Si la persona no pot entendre-ho, el flux està mal dissenyat.

## 3. Dret d’Oblit

Quan una persona demana l’esborrat:

1. S’elimina la dada de tots els magatzems que la implementació vigent declare, començant pel Supabase de Sóc de Poble, que n'és la font de veritat.
2. S’elimina qualsevol còpia local vinculada (cache del navegador o preferències).
3. Si la dada s'ha replicat en un altre servei, es genera una ordre de purga verificable.
4. Cap cache ni tombstone pot deixar llegibles dades personals; la cache local és opcional i no autoritativa ([[ADR-2026-08-ONLINE-FIRST]]).
5. Es registra l’acció sense conservar el contingut eliminat.

## 4. Minimització

Només es guarden les dades estrictament necessàries.

Prohibit guardar:

- dades “per si de cas”
- identificadors personals no justificats
- ubicacions precises sense necessitat
- converses privades en logs d’auditoria
- dades sensibles dins prompts enviats a IAs externes

## 5. Dades de Gent Major

Qualsevol flux per a gent major ha de ser:

- explícit
- reversible
- llegible
- sense engany visual
- sense caselles premarcades
- sense patrons foscos

## 6. Sortida a IAs Externes

Abans d’enviar context a una IA externa:

1. elimina dades personals
2. elimina telèfons, adreces i identificadors
3. substitueix noms per rols si no són necessaris
4. adjunta només el fragment imprescindible
5. registra que s’ha fet anonimització

## 7. SDP-LOCK Legal

Qualsevol d'estes condicions obliga a aturar l'operació i demanar decisió humana, segons el principi fail-closed de [[sdp_lock]]:

- hi ha dades personals sense base clara
- es vol enviar informació sensible a una IA externa
- es detecta una còpia no xifrada
- es demana una purga destructiva sense confirmació
- hi ha contradicció entre tècnica i privacitat

## Vincles

- [[00_index]]
- [[doc_governanca]]
- [[seguretat_execucio]]
- [[02_genotip]]
- [[sdp_lock]]
- [[ADR-2026-08-ONLINE-FIRST]]
