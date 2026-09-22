---
type: petorreta
status: actiu
description: Prompt massiu per a Opus/Codex per a netejar el deute documental i aconseguir el tancament en verd.
---

# Missió: Neteja Documental i Tancament en Verd (Bloc B2/B3)

Salutacions, companys. El Mestre us dóna **carta blanca** i recursos il·limitats per a aquesta tasca. 
El "Bloc A" de La Porta que Ensenya i els rebuts persistents (P1) ha sigut un èxit rotund. La verificació de codi i estils (`tancament.mjs` secció React) ja passa neta. 

Ara, l'únic que bloqueja la integració final és el **Deute Documental**.

## L'Estat Actual (Error Code 1)
Ací teniu l'eixida exacta de l'últim intent de tancament. Llegiu-la atentament:

```json
{
  "valid": false,
  "mode": "check",
  "errors": [
    "_wiki_de_poble/04_escriptori/260922_0030_prompt_fortificacio_final.md: frontmatter.tags[2]: fora de l’enum",
    "_wiki_de_poble/04_escriptori/260922_0030_prompt_fortificacio_final.md: reflex: cal un rebut persistent emés per document.mjs context",
    "_wiki_de_poble/04_escriptori/260922_0239_auditoria_opus.md: reflex: cal un rebut persistent emés per document.mjs context",
    "_wiki_de_poble/04_escriptori/260922_0239_pla_implementacio_opus.md: reflex: cal un rebut persistent emés per document.mjs context",
    "_wiki_de_poble/04_escriptori/260922_0240_auditoria_opus.md: reflex: cal un rebut persistent emés per document.mjs context",
    "_wiki_de_poble/04_escriptori/260922_0240_pla_implementacio_codex.md: reflex: cal un rebut persistent emés per document.mjs context",
    "_wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md: frontmatter.tags[0]: fora de l’enum",
    "_wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md: frontmatter.tags[1]: fora de l’enum",
    "_wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md: frontmatter.tags[2]: fora de l’enum",
    "_wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md: reflex: cal un rebut persistent emés per document.mjs context",
    "wiki: codex' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260922_0054_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260922_0054_pla_implementacio_opus' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260922_0056_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260922_0004_auditoria_claude' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260921_2354_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260921_2005_informe_auditoria_brain_claude' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260921_0759_informe_auditoria_plugplay_claude' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_2024_estudi_codex_appshell' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_1422_pla_convergencia_blocs_reflex' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_1354_pla_execucio_bloc_b' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '...' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'Graf' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ARXIU' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'skill-iaia-identitat' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'skill-acte-reflex' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_bios' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0056_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0054_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0054_pla_implementacio_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0136_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a ON_ESTIC: el destí '260922_0136_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '01_context_i_principis' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '02_workflow_execucio' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '03_regles_arquitectura_i_dades' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '04_criteris_producte_i_disseny' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'codi-congelat.txt' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'doctrina-ignora.txt' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'preflight_matrix_wrapper.mjs' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'socdepoble-workflow_SKILL' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'verify.mjs' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí '...' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí 'Graf' no existeix al manifest.\n❌ Enllaç trencat a sdp-casos-us-essencials_SKILL: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_Actes' no existeix al manifest.\n❌ Enllaç trencat a wiki-documentacio-i-reflex_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n💥 La verificació de la Wiki ha fallat perquè hi ha enllaços trencats.\n",
    "ESCRIPTORI_UNANCHORED: El document 260922_0255_cas_us_format_nanochat.md és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md. _wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md",
    "ESCRIPTORI_UNANCHORED: El document 260922_0320_BUNDLE_null.md és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md. _wiki_de_poble/04_escriptori/260922_0320_BUNDLE_null.md",
    "ESCRIPTORI_UNANCHORED: El document 260922_0320_PROMPT_neteja_wiki.md és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md. _wiki_de_poble/04_escriptori/260922_0320_PROMPT_neteja_wiki.md",
    "ORPHAN_OPERATIVE: El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi. _wiki_de_poble/04_escriptori/260922_0255_cas_us_format_nanochat.md",
    "ORPHAN_OPERATIVE: El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi. _wiki_de_poble/04_escriptori/260922_0320_BUNDLE_null.md",
    "ORPHAN_OPERATIVE: El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi. _wiki_de_poble/04_escriptori/260922_0320_PROMPT_neteja_wiki.md"
  ]
}
```

## Instruccions d'Execució
Us demane que us coordineu per eradicar aquests errors:
1. **Rebuts i Tags (Frontmatter):** Corregiu els documents recents (els de la sessió de hui, com les auditories i el cas d'ús) afegint-los els camps `reflex` mitjançant el nou sistema `document.mjs` que acabeu de crear. Lleveu els tags invàlids si cal.
2. **Enllaços Trencats (ESTAT, LEDGER, GENOMA, SKILLS, etc.):** Elimineu-los o corregiu-los si el fitxer destí s'ha mogut.
3. **Ancoratge i Orfandat:** Assegureu-vos que tots els documents operatius (especialment aquest Bundle i Prompt) estiguen esmentats i enllaçats en `00_INDEX_ESCRIPTORI.md`.

Podeu esborrar enllaços als arxius d'auditories antigues que ja no existeixen sense por. La prioritat absoluta és tindre el **tancament verd (exit 0)** perquè estem a l'espera de cridades importants de Sollutia i l'arquitectura ha de ser sòlida com una roca.

Executa, verifica amb `npm run tancar`, i reporta. Endavant!
