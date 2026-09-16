---
tipus: norma
estat: canonic
description: La privacitat és per defecte.
tags:
  - govern
---
# LLEI 05 Privacitat

## 1. Principi

La privacitat és per defecte.

[[el_projecte|Sóc de Poble]] no recull, sincronitza, exposa ni conserva dades personals sense necessitat clara, context comprensible i base legítima.

## 2. Consentiment Invisible però Real

No es faran banners inútils.

El consentiment s’explica en el moment exacte de l’acció:

- “Aquesta foto es guardarà al teu dispositiu.”
- “Aquest missatge es compartirà amb el grup del poble.”
- “Aquesta dada quedarà només en local.”
- “Aquesta dada se sincronitzarà quan torne la connexió.”

Si la persona no pot entendre-ho, el flux està mal dissenyat.

## 3. Dret d’Oblit

Quan una persona demana l’esborrat:

1. S’elimina la dada de tots els magatzems que la implementació vigent declare.
2. S’elimina qualsevol còpia local vinculada.
3. Si hi ha sincronització real, es genera una ordre de purga verificable.
4. Si en el futur s'adopten OPFS o CRDT, el seu disseny ha d'impedir que les dades personals queden llegibles en còpies o tombstones.
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

Activa SDP-LOCK si:

- hi ha dades personals sense base clara
- es vol enviar informació sensible a una IA externa
- es detecta una còpia no xifrada
- es demana una purga destructiva sense confirmació
- hi ha contradicció entre tècnica i privacitat

## Sinapsis

- [[doc_governanca]]
- [[seguretat_execucio]]
- [[02_genotip]]


**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — A...
- [[02_genotip|00_SER_Brain_Identitat/02_GENOTIP.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — [...
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — [...
- [[govern|01_SABER_Cultura_Coneixement/Govern.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — C...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — E...
- [[seguretat_execucio|02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md]] — Esta pàgina és una fitxa consultiva de 02_ACTUAR_Maquina_Tecnica. No és una s...
- [[self_repair|02_ACTUAR_Maquina_Tecnica/skills/self_repair.md]] — [[llei_05_privacitat]]
- [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md]] — [[llei_05_privacitat]]
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — [...
- [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — [[00_index|00_INDEX.md]] — [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
