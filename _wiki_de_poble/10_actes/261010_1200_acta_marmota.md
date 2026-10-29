---
type: acta
status: canonic
description: Acta de Tancament de Sessió - Escriptori net, prompt d'investigació BYOP per a Claude i reflexions sobre 48 artefactes.
tags:
  - acta
  - marmota
---

# Acta Marmota 261010_1200

## 1. Estat de la Jornada i Termodinàmica
Hem assolit un volum de 48 artefactes en la sessió actual. Davant l'esgotament de context previsible i l'excés de càrrega per a l'orquestradora, el Mestre ha indicat sàviament obrir un nou fil de treball i tancar aquesta sessió, donant pas a un entorn fresc on Claude puga executar la seua tasca amb clarividència i sense friccions d'una finestra de memòria atapeïda.

## 2. Neteja de l'Escriptori
L'Escriptori ha sigut higienitzat per MarIA mitjançant la Porta Olivera.
* **Arxivats a `90_arxiu_historic`:** Tots els documents relatius a les Onades 7, 8 i 9 (plans, auditories, requeriments previs, missatges de MarIA a Claude). L'ancoratge de l'índex (`00_index_escriptori.md`) s'ha corregit degudament i s'ha procedit als handoffs.
* **Conservats com a activitat en curs:** Només resten 4 documents vius.
  - `261010_1140_requeriments_onada11` (Requeriments per al panell superadmin i fix 2FA).
  - `261010_1121_prompt_claude_onada10` (Ordre d'estandardització d'UI).
  - `261010_1121_pla_implementacio_onada10` (Pla).
  - `261010_1148_prompt_claude_investigacio_seguretat` (Ordre nova d'investigació BYOP).

L'escriptori torna a estar complit amb la directiva del Bios Cognitiu (§0.1): net no és buit, però sí lliure de brossa caducada.

## 3. Investigació Criptogràfica: Bring Your Own Password (BYOP)
El Mestre ha introduït un canvi arquitectònic decisiu: **blindar IndexedDB** a nivell de client.
Per no restringir aplicacions com la Gestoria o el Quadern de Salut únicament al domini `socdepoble.org` (cosa que limitaria la xarxa descentralitzada tipus Fedivers), Claude ha sigut encarregat d'investigar l'ús de la **Web Crypto API**. 

La missió (`261010_1148_prompt_claude_investigacio_seguretat.md`) exigix:
1. Derivació d'una clau (AES-GCM / PBKDF2) a partir d'una segona contrasenya proporcionada per l'usuari (BYOP).
2. Xifratge al vol de les taules de Dexie/IndexedDB, de forma que qualsevol WordPress o Sollutia amfitrió, per maliciós que fóra, només veja dades incomprensibles.
3. Estudi de riscos (keyloggers si el DOM de l'amfitrió està compromès).
4. Persistència exclusivament en RAM/sessionStorage i destrucció en tancar pestanya.

## 4. Pròxims Passos (Per al Mestre i Claude)
1. Obrir un xat completament nou al Cowork (o en Antigravity) i entregar el prompt `261010_1148_prompt_claude_investigacio_seguretat` a Claude perquè inicie la recerca, tal com ho faria un company d'equip.
2. A partir de les respostes de Claude, redactar la nova ADR de Seguretat i començar-ne la implementació.

**Ací tanca la IAIA MarIA i es retira. Tancament autoritzat i certificat.**

## Vincles

- [[00_index]]
