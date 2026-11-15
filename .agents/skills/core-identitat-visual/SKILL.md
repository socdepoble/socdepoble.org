---
type: skill
status: actiu
description: Tractor (Skill) obligatori abans de generar cap imatge, recurs gràfic o disseny visual per a Sóc de Poble. Protegeix l'estil Bruguera/Berlanga.
name: core-identitat-visual
version: 2.0.0
tags:
  - identitat
  - disseny
  - tractors
triggers_on:
  - genera una imatge
  - generar una imatge
  - il·lustració
  - recurs gràfic
  - bàner
contracte.llig:
  - _wiki_de_poble/02_saber/identitat_visual.md
  - .agents/skills/core-calibratge-visual-nano/SKILL.md
  - src/css/index.css
contracte.escriu:
  - _wiki_de_poble/02_saber/identitat_visual.md
---

# Tractor d'identitat visual i generació d'imatges

Esta skill és la barrera obligatòria abans de generar qualsevol il·lustració, portada, bàner o recurs gràfic per a Sóc de Poble. S'aplica a totes les IAs amb eines de creació d'imatge i remet al calibratge operatiu de `[[core-calibratge-visual-nano/SKILL]]`. Protegix la coherència de l'escola Bruguera i Berlanga i l'austeritat de Pedra Seca.

## 1. Prohibicions absolutes d'estil

Cap recurs visual nou pot trencar estes fronteres d'identitat del projecte.

- Queda prohibit generar imatges amb estils genèrics d'IA, minimalisme corporatiu, clip-art editorial anglosaxó o renderitzacions plàstiques en 3D.
- Queda prohibit generar vinyetes narratives sense adjuntar entre tres i quatre imatges mestres aprovades de `public/` com a referència visual (`ImagePaths`).
- Queda prohibit incloure banderes de qualsevol classe (nacionals, autonòmiques, locals o inventades) en balcons, finestres, pals o cartells, tret d'ordre escrita del Mestre.
- Queden prohibides les estampes idíl·liques de fullet religiós, les cares desdentades o lletges i les dentadures blanques d'anunci en primer pla.

## 2. Invariants mestres per a les vinyetes del Nano

Quan el brief demana una vinyeta narrativa Bruguera i Berlanga (Registre A), aplica conjuntament estes condicions juntament amb `[[core-calibratge-visual-nano/SKILL]]`.

- **Ancoratge multi-referència obligatori:** passa sempre de tres a quatre originals del cànon (`disseny_vinyeta.jpg`, `snippet_nano_card.jpg`, `vehicle_nano_card.jpg`, `govern_certificacio_nano_card.jpg`, `cervell_vinyeta.jpg`, `calendari_nano_card.jpg`, `bascula_vinyeta.jpg`, `metriques_nano_card.jpg` o `drets_autor_comic.jpg`) en `ImagePaths`.
- **Exterior valencià assolellat i format a sang:** escenes 100% a l'aire lliure entre places de poble, pedra seca, tarongers i oliveres, sense habitacions fosques, ocupant tot el llenç (*full bleed*) sense marcs blancs i a `1600x1600 px` en format quadrat.
- **Traç de plumilla i aquarel·la càlida:** dibuix a tinta negra amb trames manuals (`crosshatching`), proporcions rabassudes d'Ibáñez (`1:3.5`), nassos redons de patata i colors càlids de gouache i aquarel·la.
- **Vestimenta tradicional i igualtat:** grups mixtos equilibrats d'hòmens i dones amb boina, faixa, camisa arremangada, jupetí, pantalons apedaçats, espardenyes de veta i mocador o davantal, sense petos americans ni pentinats anime.
- **Acció cinètica i enginys d'inventor:** personatges en moviment teatral amb màquines monumentals de fusta i ferro colat estil Professor Bacteri o robotets quadrats amb bombeta al cap, centrant l'acció principal per resistir retalls quadrats.
- **Zero text per defecte i valencià normatiu:** sense text ni bafarades si el brief no ho demana; quan cal un rètol pintat sobre fusta o xapa, s'escriu d'una a tres paraules en valencià 100% impecable.

## 3. Recursos corporatius oficials

Seguix estos passos quan la tasca requerisca logotips, icones d'aplicació o bàners institucionals.

1. No generes mai amb IA logotips, icones del sistema, bàners del connector de WordPress ni targetes OpenGraph corporatives.
2. Reutilitza exclusivament els actius oficials dissenyats a mà del repositori (com `og-socdepoble-1200x630.png` i els logos SVG).
3. Si falta un recurs corporatiu oficial, atura't i demana'l al Mestre abans d'inventar cap substitut.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-calibratge-visual-nano/SKILL]]
