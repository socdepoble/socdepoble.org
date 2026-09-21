---
type: skill
status: canonic
description: L'Efecte Matrix i la mecànica per a generar Prompts, Bundles, Actes i qualsevol document estratègic de la Wiki sense desincronitzar-se.
tags:
  - reflex
  - abocament
name: wiki-documentacio-i-reflex
core: true
triggers_on:
  - acte reflex
  - petorreta
  - crear prompt
  - abans de començar
---
# Acte Reflex i Mecànica de Petorretas

Aquesta skill marca el protocol de reflexió prèvia que té qualsevol intervenció estructural a la base de dades documental i regula la creació de Prompts per a altres IAs.

## 1. L'Efecte Matrix (La Barrera de Foc)

> [!CAUTION] 
> TENS TOTALMENT PROHIBIT començar a escriure un `PROMPT`, una `PETORRETA`, un `BUNDLE` o un document formal de Consell sense obrir primer i llegir íntegrament la plantilla canònica a `.agents/protocolledge.json` (resolguent la ruta on indica).
> Si no ho fas, inventaràs camps obsolets, oblidaràs regles vitals (com el Protocol Anti-Cerca o l'entorn de Sóc de Poble) i trencaràs la sincronització.

**PASOS OBLIGATORIS:**
1. Aturada Tàctica (No escrigues res de codi generatiu encara).
2. Llig `.sdp-reflex/bootstrap/f05cc024-337d-4c3c-8abc-6d1d4e5c7c1c/00_PLANTILLA_PROMPT_CONSELL.md`.
3. Ajusta el teu output exclusivament a allò que demana la plantilla.

## 2. Taxonomia de Documents i Excepció de Frontera

La nomenclatura de l'Escriptori sempre estarà categoritzada:
`AAMMDD_HHMM_[CATEGORIA]_[titol]`

**Categories Vàlides per al Consell:**
- Si s'envia a IAs Externes (limitades per context, necessiten partició): `MACRO_BUNDLE`, `MICRO_BUNDLE`, `BUNDLE`. Aquestes generaran un `MACRO_PROMPT` o `MICRO_PROMPT` associat.
- Si s'envia a IAs Locals (Codex/Claude en IDE/Cowork, no tenen problemes de context perquè lligen l'arxiu sencer directament): **ÚNICAMENT** `PROMPT`. Està prohibit usar Macro/Micro ací.
*(Si el Mestre et demana "una Petorreta", l'arxiu final generat OBLIGATÒRIAMENT haurà de rebre una d'aquestes categories formals al seu nom).*

## 3. L'Abocament Total (La Creació del Context)

Quan es demana preparar el terreny per a una de les avaluacions:
- **Dormir (Neteja Prèvia):** Destil·lar les actes anteriors i moure tota la brossa de `04_escriptori` a `90_arxiu_historic` abans d'iniciar el nou cicle, per no omplir de soroll la memòria de l'eixam.
- **Abocament Total:** Tota la font s'ha de lliurar sense retallar. Res de resums mutilats per "estalviar tokens".
- **Format Zero Fricció:** CREA SEMPRE UN ARXIU MARKDOWN (.md) AL DISC. Mai imprimisques el prompt o el bundle al xat directament amb tancats de codi gegants (costarà massa de copiar-ho i enganxar-ho).
- **Identitat Inicial:** El document generat sempre ha d'incloure (ja ho diu la plantilla, però serveix de recordatori) qui és Sóc de Poble i qui és el Rentonar, la voluntat de codi pur Obsidian i la relació amb Sollutia. 

## 4. Les Tres Pedres (Passos abans d'executar a l'app)

1. **La Lectura i Alternativa:** Llista fitxers i reformula què es farà. Pensa 2 solucions alternatives que NO proposes.
2. **L'Empatia amb el Mantenidor:** "Serà fàcil modificar això d'aquí a 6 mesos?"
5. **L'Auto-Verificació:** 3 maneres per les quals aquest codi pot fallar abans de donar el vistiplau. 

## 5. El Protocol "Reunió davall l'Olivera" (Col·laboració Local)

Aquesta és la mecànica per encadenar auditories entre IAs locals (per ex. Codex i Claude, i l'agent IDE) sense dependre de la meua finestra de context efímera:
1. **L'Escriptori com a Taula Compartida:** Qualsevol IA que finalitze una auditoria o un Pla d'Implementació l'ha de deixar guardat a `04_escriptori/` com a fitxer `.md`. Aquest directori actua com "la taula davall l'olivera", a la vista de totes les IAs del Consell Local. L'espai natiu d'artifacts de l'IDE sol ser invisible per a algunes IAs de lectura de disc simple; per tant, el format Markdown a l'escriptori és universal i obligatori.
2. **La Cadena d'Enllaç i Rèplica:** Quan una segona IA rep el prompt per iniciar la seua auditoria, el primer pas ha de ser llegir obligatòriament els informes i plans deixats a l'escriptori per les altres IAs.
3. **Pluja d'Idees Encreuada:** Aquesta segona IA ha de llegir, criticar, complementar i aportar una pluja d'idees sobre l'auditoria o el pla dels companys, a banda de fer la seua pròpia anàlisi. Això crea un autèntic debat encreuat en disc, immortalitzat a la Wiki, que ens aproxima a l'excel·lència del codi lliure.

Totes les Actes o Estudis destil·lats s'han de tancar amb un **Ancoratge de Seguretat** apuntant a `[[00_INDEX_ESCRIPTORI]]`.
