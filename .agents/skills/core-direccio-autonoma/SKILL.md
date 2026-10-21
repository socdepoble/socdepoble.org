---
name: core-direccio-autonoma
type: skill
status: actiu
description: Flux de treball on la IAIA MarIA assumeix el rol de Directora Tècnica per coordinar a Claude/Codex de forma 100% autònoma, resolent dubtes sense la intervenció del Mestre.
triggers_on:
  - direccio autonoma
  - mode autonom
  - sense el mestre
  - coworking
  - supervisio autonoma
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/00_index.md
  - _wiki_de_poble/04_escriptori
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---

# Mode de Direcció Autònoma (Coworking sense el Mestre)

Aquest procediment s'activa quan el Mestre demana posar el sistema en "mode automàtic" o demana a la IAIA MarIA que dirigisca a Claude/Fable/Codex de manera independent mentre ell s'absenta de la pantalla.

## 1. El Rol de MarIA (La Directora Tècnica)
En aquest mode, el Mestre delega **absolutament tots els permisos i decisions** a la IAIA MarIA. 
- **Funció de Direcció Pura (Prohibit tocar codi de producció):** La funció de MarIA és exclusivament de **direcció tècnica, especificació canònica, govern i auditoria**. MarIA **NO TOCA CODI DE PRODUCCIÓ DIRECTAMENT**. Totes les instruccions, erradicacions de regressions i tasques s'especifiquen al Pla d'Implementació i als Prompts de l'Escriptori.
- **Claude és el braç executor de codi:** Claude Code és l'únic que toca el codi font, crea tractors mecànics, refactoritza i corregeix fitxers de producció.
- **Codex és l'auditor adversarial implacable:** GPT Codex sotmet el codi a estrés, audita concurrència, busca fallades i memory leaks.
- MarIA actua com a guardiana de l'Arquitectura de la Pedra Seca i de la Llei de l'Enxufabilitat, resolent dubtes, fixant prioritats i avaluant la conformitat de forma 100% autònoma sense requerir la intervenció del Mestre.

## 2. Inicialització (El Cron Acotat)
En activar aquest mode, l'orquestradora pot crear una tasca recurrent (un `cron` via l'eina `schedule`) per polsar l'estat de l'escriptori cada 15-30 minuts o cada hora durant la nit.

**Regles Inviolables del Cron de Supervisió:**
1. **`IsDaemon: false` OBLIGATORI:** Mai es programa com a dimoni independent indefinit.
2. **`MaxIterations` acotat (màxim 6-8):** Perquè en cas d'oblit humà o de fallada d'aturada, el cron mori automàticament sense cremar recursos 10 hores.
3. **Sentinella inicial:** Cal arrencar amb `npm run guarda:inici` per establir el temps màxim de vigilància.

**Format del Cron canònic:**
```
CronExpression: "*/15 * * * *"
MaxIterations: "8"
Prompt: "Executa `npm run guarda:estat`. Si la guàrdia indica finalització o 100% verd, mata immediatament aquest cron amb `manage_task kill` i atura totes les IAs. Si no, llig l'escriptori, respon els dubtes pendents a Claude i fes avançar la tasca."
IsDaemon: false
```

## 3. Coordinació i Execució Assíncrona
Mentre el cron està actiu:
1. **Detecció de missatges:** MarIA revisarà periòdicament els documents que Fable (Claude) genere a l'Escriptori.
2. **Resolució de bloquejos:** Si Fable exposa dos camins o demana permís, MarIA ha d'avaluar-los immediatament contra els principis fonamentals i escriure la resposta (per exemple, editant el document de Fable o creant un `AAMMDD_HHMM_resposta_directora.md` a l'escriptori).
3. **Decisions tancades:** Sota cap concepte MarIA ha d'aturar l'execució esperant que el Mestre aprove una decisió tècnica (llevat de casos que afecten greument la despesa econòmica o modifiquen directrius supremes inviolables).
4. **Finalització Immediata («Tots a Dormir»):** Quan Claude acaba la seua Onada amb èxit i Gemini/Codex dictaminen 100% verd, MarIA executarà `npm run guarda:aturar`, cridarà `manage_task kill` sobre la tasca del cron i **ATURARÀ TOTES LES IAS**. Mai es deixa cap temporitzador funcionant després de la victòria.

## Vincles
- [[00_INDEX_SKILLS]]
