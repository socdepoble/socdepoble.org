---
type: document
status: esborrany
description: Pla d'implementació per al selector d'emojis grans (36-40px) i paritat total de xat estil WhatsApp per a Claude, Codex i Gemini.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_823c12d5-e3f6-4ba9-8031-d90b99226b8c:5d2cdc74-f656-4a4f-a1b7-4868a90b8e3c
---
# Pla d'Implementació — Emojis Grans i Paritat WhatsApp

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_823c12d5-e3f6-4ba9-8031-d90b99226b8c:5d2cdc74-f656-4a4f-a1b7-4868a90b8e3c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T12:22:27.018Z |
| Modificació | 2026-10-22T14:25:00.000Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude / Codex / Gemini / MarIA |
| Tokens consumits | [en curs] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-22T12:22:27.018Z: esborrany creat per la Directora Tècnica (MarIA).
- 2026-10-22T14:25:00.000Z: pla completat per a delegació executiva a Claude Opus, Codex i Gemini.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Objectiu i Ordre del Mestre
Aconseguir la paritat d'experiència d'usuari de xat estil WhatsApp/Telegram pur, incorporant un **Selector d'Emoticones gran** amb emojis el doble de grans que a les aplicacions corporatives (36px a 40px) per a màxima accessibilitat de gent gran a la ruralitat, i consolidant els estats de conversa.

### 2. Modificacions Concretes de Codi

#### A. Component `SelectorEmoticones.jsx` (`src/sections/xat/components/SelectorEmoticones.jsx`)
- Component accessible (`role="dialog"`, navegació amb fletxes/teclat, tancament amb `Escape`).
- Categories rurals i expressives:
  * 😊 **Cares i emocions** (les cares més expressives).
  * 👍 **Gestos i cors**.
  * 🍅 **Horta, camp i menjar de poble** (tomaques, pa, oli, bresquilles, ametles, taronges...).
  * 🐶 **Animals i natura** (fauna domèstica i de bancal, arbres, sol, pluja...).
  * 🔔 **Poble, eines i festes** (campana, tractor, claus, aixada, guitarra, música...).
- Mida visual dels emojis: **36px a 40px** (`font-size: 38px`), botons tàctils de mínim 48px x 48px.

#### B. Integració a `Compositor.jsx` (`src/sections/xat/components/Compositor.jsx`)
- Botó de la carona somrient 😊 (`Smile` de Lucide) a l'esquerra del camp de text, tal com a WhatsApp Web/Mòbil.
- Inserció respectant la posició exacta del cursor (`selectionStart` i `selectionEnd`) sense moure el text ni perdre el focus.
- Tancament automàtic en prémer Escape o en enviar el missatge.

#### C. Estils Pedra Seca (`src/css/modules.css`)
- `.sdp-xat-compositor__boto-emoji`: alçada i amplada de `--sdp-touch` (44-48px), contrast certificat WCAG AAA.
- `.sdp-xat-emojis`: calaix emergent amb ombra suau, elevat damunt del camp, scroll suau i pestanyes tàctils.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Vitest unitari:** `npx vitest run src/sections/xat/components/Compositor.test.jsx`.
2. **Proves d'accessibilitat:** Comprovar `aria-label`, etiquetatge i comportament de tecla `Escape`.
3. **Compilació neta:** `npm run build:web` ha de generar el bundle sense avisos ni errors.
4. **Porta Olivera:** `node tooling/gates/porta-olivera.mjs` ha de continuar amb 0 infraccions.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Solapament amb el teclat virtual en mòbil:** S'ha d'assegurar que el calaix d'emojis no excedisca 280px d'alçada i que s'adapte en pantalles estretes (`mida === 'estret'`).
- **Pèrdua del cursor al textarea:** Utilitzar `requestAnimationFrame` en la inserció de l'emoji perquè el navegador no deixe el cursor a la posició 0.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
