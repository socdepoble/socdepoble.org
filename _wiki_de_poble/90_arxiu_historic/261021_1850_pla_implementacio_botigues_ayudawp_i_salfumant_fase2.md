---
type: document
status: esborrany
description: Pla per a desplegament oficial a botigues Google/Apple/WordPress.org, assimilacio AyudaWP i poda Salfumant Fase 2
tags:
  - implementacio
visibility: private
reflex: sdp:torn_4400d512-c727-4114-a441-0e66a1e1fc53:a099ef4f-3571-45fe-b89d-7fe248bf45bf
---
# Pla Botigues, AyudaWP i Salfumant Fase 2

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4400d512-c727-4114-a441-0e66a1e1fc53:a099ef4f-3571-45fe-b89d-7fe248bf45bf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T16:47:39.861Z |
| Modificació | 2026-10-21T16:50:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | ant-gemini-2.5-pro / claude-3-7-sonnet |
| Tokens consumits | ~15.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-21T16:50:00: pla aprovat per autoritat del Mestre Javi Llinares. Objectiu central: Desplegament oficial i 100% legal a les botigues (Google Play, Apple App Store, directori oficial WordPress.org), assimilació del tractor AyudaWP / Fernando Tellado i execució de la poda de Salfumant Radical Fase 2 (~120 MB estalviats).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Directiva Suprema del Mestre: Res d'APKs solts per WhatsApp
El Mestre ha donat instrucció taxativa: **no s'enviaran bundles ni APKs manuals per WhatsApp als beta testers**. L'objectiu és la publicació **oficial, legal i impecable a les botigues**:
- Directori oficial de WordPress.org per al connector web.
- Google Play Store (Closed/Internal Testing oficial) per a Android.
- Apple App Store (TestFlight) per a iOS.

### 2. Canvis Concrets per Mòduls

#### Mòdul A · Versió v1.1.9 del Connector WordPress (`P0-13` / `P0-16`)
- Actualitzar `Version: 1.1.9` a `wordpress-plugin/socdepoble-enxufe.php` i `wordpress-plugin/readme.txt`.
- Eliminar la carpeta paràsita `wordpress-plugin/supabase/`.
- Executar la compilació i l'empaquetat (`node tooling/scripts/empaqueta.mjs`).
- Dipositar els dos ZIPs a `_builds_de_poble/wordpress/`:
  1. `wordpress_enxufe_v1.1.9.zip` (per a Sollutia i `gentdelatorre.net`).
  2. `wordpress_directori_v1.1.9.zip` (<10 MB, sense actualitzador extern, 0 errors a Plugin Check).

#### Mòdul B · Poda Salfumant Radical Fase 2 (`P0-14`)
- **Carpeta `assets/img/` a l'arrel de Git (8,8 MB):** Els 14 PNGs tenen el mateix SHA-256 que `public/assets/`. Moure a `../_multimedia_de_poble/quarantena_arrel_assets/` i retirar de Git amb `git rm -r assets/img/`.
- **Fotos duplicades a `public/` (114,98 MB estalviats):**
  - Eliminar les dues orfes de `public/assets/uploads/` amb 0 referències (1,31 MB): `nano_mercat_llaurador_1774197050578.png` i `post_fira_artesania_1774198229727.png`.
  - Migrar les 128 imatges raster que ja tenen bessona WebP: actualitzar referències a `src/config/censImatges.js` i `media_registry.json` cap a `.webp` i evacuar els rasters originals a `../_multimedia_de_poble/originals_raster_public/`.
- **Vistes mortes del Lector:** Eliminar `src/apps/lector/vistes/Carpetes.jsx` i `src/apps/lector/vistes/Fonts.jsx` (0 imports a prod i tests).

#### Mòdul C · Tractor Cognitiu `sdp-vigilant-tellado` (Fernando Tellado / AyudaWP)
- Crear el tractor canònic a `.agents/skills/sdp-vigilant-tellado/SKILL.md` traduint les 6 regles Tellado (`VIG-01` a `VIG-06`) basades en el plugin *Vigilante* d'AyudaWP i el checklist de 77 punts.

#### Mòdul D · Sincronització Nativa per a Botigues Mòbils
- Recompilar bundle natiu: `npm run build:natiu`.
- Sincronitzar mòbils: `npx cap sync ios` i `npx cap sync android`.
- Garantir que el paquet d'iOS no porte cap referència antiga a «conta» ni iframes recursius.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests:** `npm test` ha de mantindre les 20.403 proves 100% en verd.
2. **Proves d'Empaquetat:** `node --test tests/enxufe-empaqueta.test.mjs` i `node --test tests/enxufe-plugin.test.mjs` 100% verdes amb la v1.1.9.
3. **Reducció de Pes:** `du -sh public/` ha de baixar de 157 MB a ~42 MB (−115 MB).
4. **Porta Olivera:** `npm run porta:olivera` ha d'emetre codi 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Totes les evacuacions d'actius i imatges es fan cap a carpetes satèl·lit exteriors (`_multimedia_de_poble/`), mai amb esborrat destructiu irreversible.
- La Frontissa de Sollutia (`src/data/adaptadors/sollutia/`) és sagrada i intocable.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
