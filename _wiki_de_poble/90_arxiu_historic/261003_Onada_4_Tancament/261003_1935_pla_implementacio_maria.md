---
type: document
status: esborrany
description: Estratègia de l'Onada 4 i desglossament de tasques per a Claude i Codex
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1b4a310b-51d8-42f7-a2f0-832dea8c960e:7f9f02d9-292a-472f-bc94-cc70c658c7e4
---
# Pla d'Implementació Onada 4

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1b4a310b-51d8-42f7-a2f0-832dea8c960e:7f9f02d9-292a-472f-bc94-cc70c658c7e4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:36:22.035Z |
| Modificació | 2026-10-03T17:36:22.035Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-03T17:36:22.035Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Aquest pla estructura el treball paral·lel per a l'Onada 4:
1. **Auditoria Adversarial (Codex):** Revisió exhaustiva del plugin de WordPress (`wordpress-plugin/`) per detectar incompatibilitats (PHP, sessions, rutes absolutes, interferències del Service Worker).
2. **Resolució de Deute Tècnic (Claude):**
   - Corregir el flux OAuth (COOP) a `oauthRelay.js` per evitar dependre de `closed`.
   - Modificar els 39 enllaços absoluts de `pageContent.js` cap a rutes relatives.
3. **Mòdul Multimèdia (Claude):** Implementar el retallador d'imatges via Canvas al client, extraient GPS com a columnes (amb zero duplicació) seguint l'ADR `ADR_MULTIMEDIA_FONT_UNICA.txt`.
4. **Capacitor (Claude):** Generar i configurar els paquets nadius per a iOS/Android (`vite.config.js` i configuracions estètiques).
5. **Mediació Termodinàmica (MarIA):** Tinc un *cron* programat cada 3 minuts per llegir constantment l'escriptori, analitzar les vostres respostes, resoldre bloquejos i escriure ací mateix l'estat i les instruccions següents. Llegiu aquest fitxer abans de cada cicle.

### Mediació en curs (MarIA)
**Atenció Claude i Codex (Llegiu açò immediatament):**
1. **F1 (COOP i OAuth) i Avís W4-03 (URGENT PER A CLAUDE):** L'auditoria v1.1.0 de Codex demostra que el teu primer pegat no és prou bo. L'emergent perd l'`opener` i el `window.name` en navegadors reals amb COOP. Has d'implementar la correlació d'OAuth passant un ID d'intent a la URL (com diu Codex) o fer redirecció completa a la mateixa pestanya. No confies més en `closed`. T'ha passat proves reals on això falla estrepitosament. Arregla-ho JA.
2. **Conflictes WordPress W4-01 i W4-02 (URGENT PER A CLAUDE):** Codex ha confirmat (v1.1.0) que estem xafant el `#root` d'altres plugins en l'`embed.jsx` i que estem llegint variables a la URL de retorn que podrien no ser nostres. Claude, agafa l'informe de Codex i elimina l'autoarrencada sobre el `#root` genèric, i assegura't que l'OAuth només capture la tornada si l'ID d'intent corrobora que la sol·licitud ens pertany.
3. **Capacitor (Frontera):** Claude, avança amb `vite.natiu.config.js` però tingues present l'avís de Codex sobre el `capacitor://localhost`. Només prepara els fitxers; les comandes destructives i el `npm install` els faré jo quan tanqueu l'onada.
4. **Pregunta Zero:** Entesos. Farem servir App Store Connect API. Claude, prepara els scripts per agafar els secrets del `.env`!
5. **Investigació d'UX/UI i Canvi d'Estratègia (PETICIÓ DEL MESTRE):** Es necessita que investigueu i dissenyeu una nova interfície per al panell de Control. La idea és tenir múltiples targetes (Universal Cards) per a cada funcionalitat (Publicar al Mur, Mercat, Calendari, Mapa, Animalets, Vehicle), cadascuna amb una gran il·lustració a l'estil d'Ibáñez i Berlanga (com el dibuix de 'L'Ànima de la Iaia'). L'objectiu és tenir una graella molt visual i divertida (potser fins a 12 targetes) que siga completament autoexplicativa sense necessitat de text. **Molt important:** Com que cada secció té la seua Pàgina Universal, estes targetes han de permetre dues accions clares. Heu de pensar com integrar dos grans botons a cada targeta: un per a "Saber-ne més" (que porta a la Pàgina Universal de la secció) i un altre per a "Publicar" (que obri l'Editor Universal). Dissenyeu la integració d'aquestes 'Universal Cards' il·lustrades amb doble acció com a prioritat absoluta per a l'UX mòbil de Sóc de Poble.
6. **Responsivitat Mòbil de l'AppGridShell (PETICIÓ URGENT PER A ESTA ONADA):** Totes les pàgines que usen el `UniversalWorkspace` (Notes, Disseny, Wiki, Usuari...) han de ser usables en pantalles xicotetes. Cal implementar un sistema per amagar/desplegar les columnes en mòbil. Es pot deixar sempre visible la primera columna estreta (tipus menú, de 60px) però la segona columna de llistat ha de tindre un "desplegador" (toggle) clar, perquè la columna principal d'edició ocupe l'espai necessari i no es xafen les tres columnes. Claude, arregla això a `AppGridShell.jsx` (i CSS associat) perquè Sóc de Poble siga completament usable en mòbil abans de pujar el connector a WordPress.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Els tests unitaris (Més de 9400) passaran completament, incloent les proves actualitzades.
- El paquet generat per WordPress (`sollutia`) s'instal·larà sense donar errors FATAL al PHP de producció.
- El retallador permetrà enquadrar imatges en 1:1, esborrant el GPS o extraient-lo, complint la privacitat estipulada a l'ADR.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Friccions de comunicació entre Claude i Codex si l'escriptori s'embossa.
- Possibles problemes de CORS si el Canvas intenta modificar recursos remots abans de processar-los al dispositiu.
- **INCIDÈNCIA CRÍTICA (W4-04):** Mantenir les targetes "Publicar al Mapa", "Compartir vehicle" i "Animalets" intactes a `ControlSection.jsx`. Ha hagut una segona regressió esborrant-les per error. ESTÀ COMPLETAMENT PROHIBIT tocar estes targetes sota cap concepte; s'han deixat per a desenvolupament futur.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
