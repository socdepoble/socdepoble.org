---
type: investigacio
status: esborrany
description: Notes sobre 4 plugins per optimitzar Claude Code i eines d'IA.
tags:
  - ia
  - eines
  - claude
visibility: private
---
# Investigació: 4 Plugins per a Claude Code

Aquest document recull 4 connectors/plugins esmentats en un vídeo d'Instagram per optimitzar el rendiment, el consum de tokens i l'eficiència de Claude Code (i eines d'IA similars). 

Hem d'investigar la seua viabilitat per integrar-los a l'arquitectura de Sóc de Poble.

## Llista de Plugins a Investigar

1. **Ponytail**
   - **Funció:** Optimitza les respostes de Claude Code per reduir el consum de tokens.
   - **Promesa:** Redueix el consum més d'un 50% sense perdre precisió, evitant que la IA perda context revisant els mateixos arxius una i altra vegada innecessàriament.
   - **Aplicabilitat SDP:** Clau per a l'eficiència termodinàmica del sistema (estalvi de crèdits/tokens).

2. **Omni-Route**
   - **Funció:** Connecta Claude Code amb més de 300 proveïdors d'IA gratuïts (o de pagament).
   - **Promesa:** Quan s'arriba al límit d'un model, canvia automàticament al següent disponible.
   - **Aplicabilitat SDP:** Molt interessant per mantenir un "Bucle Adversarial" infinit sense preocupar-nos pels límits horaris de les APIs.

3. **Graphify**
   - **Funció:** Converteix el codi en un mapa de coneixement (Knowledge Graph).
   - **Promesa:** Permet a l'agent entendre molt millor les relacions del projecte sense haver de rellegir els arxius constantment.
   - **Aplicabilitat SDP:** S'alinea perfectament amb la nostra necessitat de cartografiar el codi de la Wiki i la Gestoria (ajudaria als "Lectors" a tindre un mapa mental fix).

4. **Agent Skills**
   - **Funció:** Un paquet de 24 habilitats (skills) per a agents.
   - **Promesa:** Creat per un ex-director d'enginyeria d'IA de Google, dóna habilitats prefabricades per planificar, programar, provar i publicar, en lloc de dependre de prompts solts.
   - **Aplicabilitat SDP:** Sona exactament com el sistema de `.agents/skills` que ja estem construint nosaltres mateixos (Tractors, Olivera, Reflex). Potser podem extraure patrons de disseny o copiar algunes d'aquestes habilitats per al nostre repositori.

## Accions Següents
- [ ] Cercar documentació de `Ponytail` i `Omni-Route` per veure si es poden integrar als nostres scripts locals.
- [ ] Estudiar el repositori de `Agent Skills` per fer "enginyeria inversa" i adaptar-ho al nostre propi sistema de *skills* (Trellat).
