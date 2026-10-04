---
type: document
status: canonic
description: Investigació Disseny d'Animacions
reflex: sdp:torn_8196cc8e-f53a-441c-9151-c484c7f43bd6:6fa4fb12-dcec-46f9-8da1-b1d1f128c81a
---
# Investigació: Sistema de Disseny (Emil Kowalski & Impeccable)

**Data**: 2026-10-04
**Origen**: Vídeo compartit pel Mestre sobre "10,000 prompts" i l'optimització de Claude Code amb skills de disseny.

## Les referències
El vídeo i el Mestre fan referència a dos *skill sets* essencials per a elevar el disseny i evitar l'anomenat "AI slop" (disseny genèric generat per IA):

1. **Emil Kowalski's Design Skills**:
   - Centrades en l'enginyeria de disseny, el "bon gust" i sobretot les micro-interaccions i l'animació.
   - Estableixen regles d'easing, timings perfectes (ex: sota 300ms) i feedback visual immediat.
   - Són altament recomanables per perfeccionar la UX i polir detalls que les IAs solen obviar.

2. **Impeccable (per Paul Bakaus)**:
   - Funciona com un "Director de Disseny" implacable per a Claude.
   - Afegeix regles estrictes sobre **tipografia, espaiat i composició**.
   - Executa 60+ "detector rules" deterministes per assegurar que el que la IA genera manté una cohesió perfecta i no trenca les regles estètiques.
   - Obliga l'agent a entendre el propòsit i les constriccions abans de llançar-se a escriure CSS cec.

3. **Taste (Skill addicional)**:
   - Una skill que proporciona referències visuals bones i ajuda l'agent a tenir un criteri estètic superior, lluitant contra la mitjania algorítmica.

## Proposta d'Adaptació a Sóc de Poble (Pedra Seca)
El nostre sistema de disseny ja compta amb les fundacions: **Pedra Seca**, amb les seues variables i l'estil Bruguera/Berlanga. L'adaptació no requereix instal·lar paquets cecs de tercers, sinó **destil·lar la seua saviesa i injectar-la en els nostres tractors i skills (`core-identitat-visual`, `sdp-pedra-seca`)**.

**Passos a seguir en futures sessions**:
1. **Analitzar la font**: Revisar el codi obert d'Impeccable i els prompts de Kowalski.
2. **Extreure les "Detector Rules"**: Quines regles deterministes d'espaiat i tipografia podem incloure directament a `.agents/skills/sdp-pedra-seca/SKILL.md`? (ex: "Sempre usa `clamp()` per a capçaleres per evitar el desbordament en mòbils", com l'H2 de la UniversalPage).
3. **Mecànica d'Auditoria**: Incorporar una "avaluació de Taste" (bon gust i contrast) als nostres processos d'auditoria automàtica de la IA.

**Estat**: Presentat a Claude com a directriu de "Director de Disseny" per a la Passada 7. Pendent d'estudi tècnic profund per a la seua parametrització dins del repositori.
