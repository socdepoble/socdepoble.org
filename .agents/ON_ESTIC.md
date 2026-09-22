---
type: document
status: generat
description: Estat de la sessió actua generat per despertar.mjs
---
# ON_ESTIC.md (Context de Sessió Actiu)

**Generat automàticament el:** 2026-09-22T15:16:30.985Z
**Branca Git:** backup-notes-publish
**Commit:** be16f668

## 1. Contingut de l'Escriptori (Taula de Treball)
Açò és el que hi ha ara mateix damunt la taula (`_wiki_de_poble/04_escriptori/`). Llig aquests fitxers si n'hi ha.
- 00_index_escriptori.md
- 02_investigacio_ia
- 260922_0550_prompt_auditoria_identitat.md
- 260922_0602_prompt_auditoria_formats.md
- 260922_0612_prompt_auditoria_cervell.md
- 260922_0612_tasques_pendents_ui.md
- 260922_0643_auditoria_codex.md
- 260922_0643_pla_implementacio_cervell.md
- 260922_0650_pla_implementacio_maria.md
- 260922_0651_auditoria_claude.md
- 260922_1455_pla_implementacio_claude.md
- 260922_1715_prompt_fortificacio_cervell.md

## 2. Resum de l'ESTAT recent
Açò és l'últim que es va anotar a `.agents/ESTAT.md`:

---
type: document
status: esborrany
description: ESTAT DE LA SESSIÓ
---
# ESTAT DE LA SESSIÓ

## 260922_1648 · Claude Opus 5 · Auditoria del Cervell (tercer a l'olivera)

Torn `torn_bd8aab94-5d17-4c48-be88-722b8d7cebda`, estat `planned`, abast documental. Auditoria [[260922_0651_auditoria_claude]] i pla complementari [[260922_1455_pla_implementacio_claude]], creats amb `context`/`create`, ancorats i tots dos amb `document.mjs check` → `valid: true`. **Cap canvi de codi, cap porta tocada, cap fitxer alié modificat.**

Onze troballes pròpies (O-1 a O-11) més sis verificades de la caça de fons (A-1 a A-6). **Tres P0 nous que ni Codex ni jo havíem vist abans:** (A-1) `.claude/skills/` i `.agents/runtime/` no estan versionats — en un clon net l'agent arranca sense skills i cap document amb rebut es pot validar, per tant el primer commit d'algú nou mor al `pre-commit`; (A-2) nou fitxers amb la guarda CLI trencada per l'espai del camí, entre ells la Porta Manifest i la Porta Matrix, que ixen verdes sense executar ni una línia — i la Matrix era la que havia de fer complir la REGLA 0 que MarIA no va poder complir; (A-4) el README mana dos SQL inexistents i omet 14 de 15 migracions, incloses totes les de RLS i privacitat.

**Confirmat de la meua banda:** la zona humana `01_produccio` ha perdut dos documents i l'inventari del torn no la mira (0 de 719 entrades); 5 dels 9 torns són morts perquè els seus rebuts apunten a documents arxivats, i `checkTurn` no ho diagnostica sinó que peta a
...(retallat)...

## 3. Què has de fer ara?
1. Revisa l'escriptori per veure si tens auditories, actes marmota o plantilles.
2. Mira l'ESTAT per veure quines tasques s'han deixat a mitges.
3. Espera les ordres del Mestre.
