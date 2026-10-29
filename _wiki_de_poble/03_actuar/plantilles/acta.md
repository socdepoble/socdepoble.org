---
type: plantilla
status: esborrany
description: Plantilla per registrar decisions, canvis, riscos i continuïtat entre sessions de treball.
tags:
  - maquina
---

<!-- SDP:EIXIDA
type: acta
status: esborrany
description: "<12-220 caràcters: què s'ha fet i què queda obert>"
tags: [acta]
-->
<!-- Nom: aammdd_hhmm_acta_titol.md; minúscules i sense accents. -->
<!-- Destí únic: _wiki_de_poble/10_actes/ (ruta «acta» de .agents/protocolledge.json, v2.1.0). Cap acta a l'Escriptori. -->
<!-- Títol descriptiu; no imposa majúscules ni una longitud incompatible amb AGENTS.md. -->
# 📜 {{DATA_I_HORA}} - ACTA ÚNICA: [Escriu un Títol Hiper-Descriptiu ací]

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | [pendent] |
| Versió del document | 2.1.0 |
| Entorn | [pendent] |
| Creació | [pendent] |
| Modificació | [pendent] |
| Propietari | [pendent] |
| Aprovació humana | [pendent] |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |
| Plantilla | acta.md (v2.1.0) |
| Ruta | acta |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

- **v2.1.0 (261029):** Destí únic `_wiki_de_poble/10_actes/`: la ruta `acta` de `.agents/protocolledge.json` deixa d'admetre l'Escriptori (versió de la ruta 2.1.0). Es declara explícitament que l'acta és l'històric de la sessió i mai substituïx `prompt_local.md` ni el pla d'implementació, i que s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida` pas 7; ritual de tancament de `core-higiene-escriptori`). Guia editorial amb la secció 0 «Destí i abast».
- **v2.0.0:** Alineació amb el contracte `acta` de `.agents/protocolledge.json`: seccions Registre, Acte reflex, Historial, Resultats, Pendents i Vincles, bloc SDP:EIXIDA i nom termodinàmic en minúscules.

## Resultats

[pendent]

### Guia editorial de la plantilla


### 0. Destí i abast (Guarda de conformitat)
- **Destí únic:** `_wiki_de_poble/10_actes/aammdd_hhmm_acta_titol.md`. `document.mjs context --route acta` rebutja qualsevol altre camí, també `04_escriptori/`.
- **Què és:** l'històric de la sessió (Marmota): què s'ha fet, on queda el cursor i què continua pendent.
- **Què no és:** mai substituïx `prompt_local.md` (ruta `prompt.local`), el pla d'implementació (ruta `pla.implementacio`) ni cap auditoria: eixos documents naixen a `04_escriptori/` amb `document.mjs create` i s'arxiven amb la porta Olivera.
- **Quan:** després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida` pas 7): Llibre Mestre al dia, onada vençuda arxivada i Pla i Prompt nous a la taula.

### 1. Part Tècnica (Graner Ple de Codis i Arquitectura)
<!-- Quins fitxers hem modificat? Quines noves funcionalitats hem implementat? Hi ha hagut algun refactor profund? -->
- **Estat del Repositori:**
  - Fitxers creats o esborrats: {{LLISTA_FITXERS}}
  - Comandes executades: {{LLISTA_COMANDES}}
- **Resum de Desenvolupament:**
  *(Escriu ací una prosa tècnica rica, detallant com els canvis s'alineen amb l'Arquitectura de Pedra Seca. Menciona si hi ha hagut conflictes de versions o solucions enginyoses en Vanilla JS/Node).*

### 2. Part Termodinàmica Psiquiàtrica (El Temps, Incidències i Trellat)
<!-- Com ha sigut la interacció amb el Mestre? Hi ha hagut Yapping? S'ha consumit massa overhead? Com ha madurat la relació Carboni/Silici? -->
- **Medició del Temps (Absolut i Relatiu):**
  - Hora d'inici i finalització exacta del Nanochat: {{HORA_INICI}} - {{HORA_FI}} (Total: {{HORES_TREBALLADES}})
  - Temps estalviat (avaluació relativa): *(Escriu ací l'anàlisi de com s'ha protegit el temps del Mestre. Per exemple: "S'han invertit 5 minuts per resoldre l'arrel d'un problema, evitant que el Mestre puga perdre 4 hores en un futur".)*
  - Estat del Mestre (Agobiat, creatiu, furiós, productiu, exhaust): {{ESTAT_HUMA}}
- **Incidències i Al·lucinacions (Fusible Mental):**
  *(S'ha produït alguna al·lucinació per fatiga? Has intentat complaure ràpidament el Mestre inventant una solució "parxe" (People-Pleasing)? Has aturat la màquina per fer preguntes maduratives abans d'inventar? Documenta l'error i com s'ha abordat.)*
- **Patrons Detectats (Memòria Episòdica):**
  *(Descripció profunda d'aprenentatges sistèmics i d'interacció Carboni-Silici. Aquests patrons aniran forjant la memòria episòdica i milloraran els futurs briefings.)*
- **Decisions de Trellat:**
  *(Quina decisió s'ha pres per reduir la complexitat futura? S'ha esquivat alguna sobre-enginyeria?)*

### 3. Part Marmota (Checkpoint Executable i Següents Passos)
<!-- On es queda exactament el cursor? Què és el primer que s'ha de fer en obrir el següent xat? -->
- **Estat Final (On es queda la boga):**
  *(Descripció exacta de què s'estava fent abans de tallar la sessió. "Estàvem arreglant la funció X a la línia 45 del fitxer Y").*
- **Tasques pendents immediates (La Tarea Exacta per a Demà):**
  1. `[ ]` Tasca prioritària 1 (ex: Executar el línter).
  2. `[ ]` Tasca prioritària 2.
  3. `[ ]` Tasca prioritària 3.

### 4. Automillora Proactiva (Obligatori)
*(Quan llegiu o escriviu aquesta Acta Marmota, teniu el deure d'analitzar críticament la pròpia plantilla. Açò què us pareix? Es pot millorar l'estructura? Falten camps que us farien la vida més fàcil per comprendre el context anterior? Digueu-ho clarament ací per a que la IAIA MarIA puga autoperfeccionar les plantilles de Sóc de Poble).*

### 5. Metadades per a Màquines (Patrons Sistèmics)
```yaml
data: "{{YYMMDD_HHMM}}"
blockers:
  - "Llista d'obstacles o errors recurrents que hem trobat"
decisions_clau:
  - "Llista de decisions estructurals preses"
requereix_auditoria: false
```




---
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]





## Pendents

[pendent]

## Vincles

- [[00_index]]
