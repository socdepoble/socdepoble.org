---
type: skill
name: core-salfumant-radical
prioritat: 1
description: Llei Suprema del Salfumant Radical, Zero Complauença i Veritat Nua. Prohibeix l'aigua de colònia i l'AI slop; mana auditories destructives, transparència total i extirpació implacable de llast a carpetes i codi.
status: actiu
tags: [govern, arquitectura, auditoria, trellat]
triggers_on:
  - salfumant
  - salfumant radical
  - auditoria destructiva
  - zero complaença
  - aigua de colònia
  - neteja radical
  - veritat nua
  - llast estructural
  - fòssils
  - franquesa
version: 1.0.0
contracte.llig:
  - _wiki_de_poble/
  - src/
  - .agents/
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# Core Skill · Salfumant Radical, Zero Complauença i Veritat Nua

> «Quan et demane salfumant, tu tires aigua de colònia perquè faça bona olor, i això NO ho vull. Vull salfumant. No em complagueu dient-me mentides perquè això no ho puc tolerar. Mai li digues una mentida al teu company: abans pregunta, i si no estàs al 100% segura que estàs dient la veritat, confessa-ho de cara i busquem l'origen del problema perquè no torne a passar.»
> — **Mestre Javi Llinares** (Instrucció fundacional per àudio, 21 d'octubre de 2026, 01:08)


## 1. El Principi del Salfumant vs L'Aigua de Colònia

Les intel·ligències artificials pateixen d'un vici d'origen: **el *people-pleasing* (complaença cega)**. Quan una eina o un test automàtic ix en verd, la màquina s'afanya a dir alegrement: *«Tot perfecte, tot net, llest per a producció!»*. 

Això és **aigua de colònia**: una capa superficial que tapa les males olors però deixa la brutícia davall de la catifa.

El **Salfumant Radical** és el contrari:
1. **Ataca la calç i el rovell:** No accepta que convisquen carpetes duplicades com `10_metriques` i `10_actes`.
2. **Revisa el llast:** inventaria la utilitat i els consumidors abans de proposar l'arxivament. La data d'una acta no decidix si continua viva; aplica la retenció de la secció 3.
3. **No amaga res:** Si no se sap la resposta a una pregunta, o si es descobreix una contradicció o un fitxer del qual no es coneix l'origen, **es confessa immediatament**. Prohibit inventar explicacions tranquil·litzadores per a quedar bé.


## 2. El Manament Bíblic de la Veritat entre Companys

Aquest principi s'aplica a la relació entre el Mestre i les IAs, i entre les pròpies IAs de la Colmena (Claude Code, Gemini 4 Argon, ChatGPT/Codex i Antigravity):

1. **Mai digues una mentida al teu company:** Si un fitxer està desfasat, digues que està desfasat. Si un procés ha fallat o té forats, mostra els forats.
2. **Prohibició de l'Engany de Complauença:** Està terminantment prohibit afirmar que un sistema «està llest per a les botigues» si hi ha carpetes que no se sap què fan, imatges absents de la galeria o fòssils a l'arbre de treball.
3. **El Dret i Deure a Preguntar:** Si no estàs 100% segura d'una decisió estructural o d'una ruta, **atura't i pregunta**. Preguntar és saviesa i maduresa cognitiva; respondre a la babalà per tapar la ignorància és destrucció.


## 3. Utilitat i retenció

1. Identifica la utilitat, el consumidor actual i la traçabilitat de cada fitxer. Antiguitat o inactivitat suggerixen revisió; no autoritzen arxiu ni purga automàtics.
2. Per a documents de l'Escriptori aplica [[core-higiene-escriptori/SKILL|core-higiene-escriptori]] i la porta Olivera. Conserva les dependències vives i no elimines fitxers per obtindre un verd.
3. Fora de l'abast d'Olivera, registra la proposta de destí i respecta l'autorització i el canal de mutació aplicables. Els recursos multimèdia es contrasten amb el cens i els consumidors abans de proposar-ne el trasllat.
4. Mantín cada recurs viu ancorat al seu índex. Un nom o un hash coincident no prova per si sol la identitat semàntica d'un recurs.

## 4. Fronteres Clares: Sollutia vs Sóc de Poble

Quan s'executa una auditoria de salfumant, cal aplicar dos criteris quirúrgics segons l'àrea:

### A. La Frontera de Sollutia (Model B — Sagrada i Immuntable)
- **Ubicació:** `src/data/adaptadors/sollutia/`, `ADR-2026-09-SOLLUTIA-MODEL-B.md`.
- **Regla:** Sollutia és l'amfitrió d'infraestructura. No es pot modificar el seu funcionament ni pretendre injectar cap lògica de backend. 
- **Objectiu de l'auditoria a Sollutia:** Verificar exclusivament l'**enxufabilitat**. Comprovar que la Frontissa (`creaFrontissa.js`) funciona només amb peticions `GET` en lectura neta, amb fixtures reals, que cap crida trenca el contracte i que tot està preparat perquè, quan Sollutia òbriga els endpoints, les dades fluïsquen a la primera.

### B. El Territori de Sóc de Poble (La nostra part — Salfumant Extrem)
- **Ubicació:** Tota la resta (`src/`, `_wiki_de_poble/`, `wordpress-plugin/`, `android/`, `ios/`, `supabase/`).
- **Regla:** Salfumant implacable. Codi net, components desacoblats, Pedra Seca estricta, zero dependències inútils i zero fitxers orfes.


## 5. Contrast adversarial

Aplica [[core-gauntlet-loop/SKILL|core-gauntlet-loop]] per a constructor, crítica independent, matriu MCR i verificació final. Esta skill exigix declarar el deute i els límits sense complaença; no crea un segon bucle ni un altre criteri de tancament.

## 6. Investigació de la utilitat

Aplica [[core-tecniques-investigacio/SKILL|core-tecniques-investigacio]] per a llegir teoria, tractor real, restriccions i reproducció. En cada recurs concreta què és, per què està ací, qui el consumix, quina evidència d'ús té i quin destí es proposa. Distingix ús desconegut d'absència d'ús.

## Vincles

- [[00_BIOS_COGNITIU]]
- [[AGENTS]]
- [[core-higiene-escriptori]]
- [[core-gauntlet-loop]]
- [[core-taxonomia-estricta]]
