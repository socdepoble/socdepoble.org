---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-11-02T17:30:33.232Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 4ee8d78c4

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 261102_1538 i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` s'ha tocat 3 h després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-11-02T15:38:00+01:00 · MarIA · Desplegament a Producció de la Marató Nocturna (70 Migracions Supabase, socdepoble.org amb Avisos Push del Xat actius, 7 Skills Resegellades, Botigues iOS i Android 1.0.0+2 PUBLICADES en Mode Jarvis) i Pla/Prompt 261102_1532 llestos amb Estalvi de Quota

- **Torn i ordre:** `torn_fad962dd-2cbf-457d-98d7-ee28c04f647f` (documents). Acta Marmota de tancament: [261102_1456_acta_marmota_produccio_b1_b12_avisos_xat_botigues_1_0_0_2_i_idea60](../_wiki_de_poble/10_actes/261102_1456_acta_marmota_produccio_b1_b12_avisos_xat_botigues_1_0_0_2_i_idea60.md).
- **Fet en Producció i Mode Jarvis (Blocs B1..B12 en viu):**
  1. **Supabase Producció (`70/70 migracions`):** Aplicades i verificades les 6 migracions SQL noves (`2611011500` → `2611020417`) amb `node tooling/gates/verifica-migracions-supabase.mjs` (`0 violacions`).
  2. **Avisos Push del Xat (`B8` en viu):** Generat parell de claus VAPID, configurats secrets a Supabase, desplegada l'Edge Function `notifica-xat` (`ACTIVE`), activat `push_xat_actiu = 'si'` a `private.ajustos`, compilada i desplegada `https://socdepoble.org` a Firebase Hosting i verificats els avisos push entre Chrome i Safari.
  3. **Skills Segellades (`42/42`):** Resegellades les 7 skills pendents a `.agents/SKILLS_SEAL.json` (`0 violacions`).
  4. **Botigues iOS i Android `1.0.0 (2)` (`1.0.0+2`) PUBLICADES:**
     - **🍏 iOS (`1.0.0 (2)`):** Compilat `../_builds_de_poble/ios/261102_socdepoble_1.0.0+2.xcarchive` i pujat i processat a **App Store Connect / TestFlight** (`Uploaded App · ** EXPORT SUCCEEDED **`).
     - **🤖 Android (`2 (1.0.0)` PUBLICADA A GOOGLE PLAY):** Desbloquejat el keystore oficial del 24 d'octubre `_oficina_de_poble/claus/upload-socdepoble.jks` (`SHA1: AC:5F:98:33:45:2A:C2:B3:30:E6:A4:8E:D4:1D:AA:C3:9D:E2:CC:6B`), custodiat a `.env.botigues.local`, re-signat `../_builds_de_poble/android/261102_socdepoble_1.0.0+2.aab` (`jar verified`) i **publicat en viu a Google Play Console (`Prova interna` · `19.486 dispositius Android compatibles`)** ([261102_1521_google_play_versio_2_publicada.png](../_wiki_de_poble/04_escriptori/01_produccio/261102_1521_google_play_versio_2_publicada.png)).
  5. **Pla i Prompt `261102_1532` preparats a l'Escriptori amb Protocol d'Estalvi Termodinàmic de Quota:**
     - Creats, validats i ancorats [261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre](../_wiki_de_poble/04_escriptori/261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md) i [261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre](../_wiki_de_poble/90_arxiu_historic/261102_1532_prompt_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md) per a la següent sessió (post-reinici del Mac), amb Claude en fil únic sense `Extra/Ultracode` ni subagents ([261102_1531_consum_claude_opus_ultracode_59_per_cent.png](../_wiki_de_poble/04_escriptori/01_produccio/261102_1531_consum_claude_opus_ultracode_59_per_cent.png)).

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
