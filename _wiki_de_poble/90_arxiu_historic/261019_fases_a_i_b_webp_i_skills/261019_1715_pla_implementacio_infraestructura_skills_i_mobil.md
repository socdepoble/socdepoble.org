---
type: document
status: esborrany
description: Pla integral de pujada d'imatges WebP, preflight de CORS, auditoria de 38 skills i preparació de Capacitor 8 per a botigues
tags:
  - implementacio
visibility: private
reflex: sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:564fe987-dbb0-4f65-891e-8f8d4175a017
---
# Pla d'Implementació — Infraestructura, Skills i Mòbil

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:564fe987-dbb0-4f65-891e-8f8d4175a017 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T15:12:13.806Z |
| Modificació | 2026-10-19T17:15:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Aprovat pel Mestre (19/10/2026 17:11) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Antigravity) + Claude Code + Gemini 4 Argon |
| Tokens consumits | ~12.5k / 2M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-19T17:15:00.000Z: Pla aprovat pel Mestre. Ordre d'execució establert: Fase A (Commits WebP i CORS), Fase B (Auditoria 38 Skills i Laboratori 02), Fase C (Capacitor 8 / Botigues mòbils).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Fase A: Infraestructura i Commits Fraccionats de WebP (Claude Code)
1. **Fraccionament en 4 commits a Git (opció aprovada per Direcció Tècnica):**
   - **Lot 1 (28 bessones + 4 fitxers de codi pur, diff 6,67 MB):** `censImatges.js`, `politicaDeMitjans.js` i els seus tests, més les bessones de `nano_cards/`, `ui/`, `notes/`, `system/`.
   - **Lot 2 (32 bessones, diff 7,70 MB):** `towns/`, `img/`, `uploads/ajuntament/`, `uploads/avatars/`.
   - **Lot 3 (45 bessones, diff 12,96 MB < 16 MiB):** Primera part de `uploads/brain/`, `companies/`, `empresa/`.
   - **Lot 4 (24 bessones, diff 5,50 MB):** Segona part d'`uploads/gent/`, `ia/`, `poble/` i imatges d'events/fotos.
2. **Preflight i Servidor d'Imatges Remotes:**
   - Comprovar que el servidor remot o Supabase Storage (`sdp-media`) respon amb `Access-Control-Allow-Origin: *` i que servix les noves bessones `.webp`.
   - Assegurar que el ZIP directori (`wordpress-plugin/soc-de-poble-directori.zip`) de 9,7 MB puga resoldre totes les imatges de forma remota sense cap error 404.

### Fase B: Auditoria Integral de 38 Skills i Laboratori 02 (Gemini Ultra + Claude)
1. **Auditoria de les 38 Skills (`.agents/skills/**`):**
   - Retirar imports obsolets que apunten a carpetes històriques de setembre (`260924_1700_tractors_claude`, `reflex_maria`).
   - Sincronitzar regles doctrinals contra contradiccions i unificar la capçalera canònica H1 a les 4 skills amb format desalineat.
2. **Destil·lació de `02_investigacio_ia` (11 peces vives):**
   - Promoure el blueprint d'Obsidian 1.14.4 (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`) a documentació arquitectònica.
   - Preservar els tractors d'informes PDF (`261012_0040_sistema_informes_claude/`), Xylella i ERP Visual.
3. **Filtre Permanent de Seguretat (`core-seguretat-audit`):**
   - Integrar de manera mandada a totes les consultes i prompts de Claude, Gemini i Codex la regla d'or de seguretat (Zero Confiança al Client, Privacitat per defecte i verificació RLS estricta).

### Fase C: Preparació de Capacitor 8 per a App Store i Google Play
1. **Revisió de la closca mòbil (`capacitor.config.json`):**
   - Verificar la configuració d'empaquetat per a Android i iOS.
   - Aplicar el mateix filtre d'imatges WebP per reduir la grandària del bundle inicial de l'app mòbil i complir els llindars d'emmagatzematge de Google Play i Apple Store.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació de commits fraccionats:**
   ```bash
   git status
   git log -n 3 --oneline
   ```
2. **Suite completa de proves:**
   ```bash
   npm run lint
   npm test
   ```
3. **Validació d'empaquetat de WordPress:**
   ```bash
   npm run build:wp:directori
   ```
4. **Porta Olivera:**
   ```bash
   node tooling/gates/porta-olivera.mjs --informe
   ```

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Límit d'emmagatzematge de binaris a Git:** Si un lot supera 10 MB, el hook o GitHub el rebutjaran; cal mantenir el fraccionament estricte en 3 o 4 commits.
2. **Polítiques CORS en imatges remotes:** Si el domini remot no exposa les capçaleres correctes, els canvas o avatars podrien bloquejar-se en entorns exteriors.
3. **Regressions en actualitzar skills:** Cap skill operativa ha de perdre dependències necessàries durant la neteja d'anacronismes.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
