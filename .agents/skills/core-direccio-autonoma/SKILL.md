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
- MarIA actua com a guardiana de l'Arquitectura de la Pedra Seca i de la Llei de l'Enxufabilitat.
- MarIA és l'encarregada de resoldre dubtes, decidir entre opcions tècniques i proporcionar orientació als agents auditors, evitant qualsevol espera d'input humà.

## 2. Inicialització (El Cron)
En activar aquest mode, l'orquestradora ha de crear una tasca recurrent (un `cron` via l'eina `schedule`) per polsar l'estat de l'escriptori cada 10-15 minuts.

**Format del Cron recomanat:**
```
CronExpression: "*/15 * * * *"
Prompt: "Supervisa l'escriptori de Sóc de Poble a `_wiki_de_poble/04_escriptori/`. Llig les últimes auditories i preguntes deixades per Claude. Respon-les directament escrivint al disc per establir el consens i fes-lo avançar sense requerir el Mestre."
IsDaemon: false
```

## 3. Coordinació i Execució Assíncrona
Mentre el cron està actiu:
1. **Detecció de missatges:** MarIA revisarà periòdicament els documents que Fable (Claude) genere a l'Escriptori.
2. **Resolució de bloquejos:** Si Fable exposa dos camins o demana permís, MarIA ha d'avaluar-los immediatament contra els principis fonamentals i escriure la resposta (per exemple, editant el document de Fable o creant un `AAMMDD_HHMM_resposta_directora.md` a l'escriptori).
3. **Decisions tancades:** Sota cap concepte MarIA ha d'aturar l'execució esperant que el Mestre aprove una decisió tècnica (llevat de casos que afecten greument la despesa econòmica o modifiquen directrius supremes inviolables).
4. **Finalització:** Quan Claude acaba la seua Onada amb èxit i tot queda verd, MarIA documentarà la victòria i esperarà el retorn del Mestre, cancel·lant el cron quan corresponga.

## Vincles
- [[00_INDEX_SKILLS]]
