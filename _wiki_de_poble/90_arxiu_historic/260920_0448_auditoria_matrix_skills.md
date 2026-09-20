---
type: informe
status: esborrany
description: Auditoria de Matrix, resolucio documental, skills, autoaprenentatge i continuitat de Soc de Poble.
tags:
  - arquitectura
  - skills
---
# Auditoria de Matrix i del sistema de skills

## Registre

| Camp | Valor |
|---|---|
| Identificador | SDP-AUDIT-260920-0448 |
| Data de tall | 20-09-2026, 04:48 CEST |
| Agent auditor | Codex |
| Commit de referència | 5ad62b43fcd43a9e98309e507a35aeb1b496cd02 |
| Estat del directori | Amb canvis preexistents; no és una fotografia immutable |
| Intervenció | Lectura i reproduccions en memòria |
| Aprovació de propostes | Pendent |
| Requisit de volum confirmat | Milions de documents |
| Autonomia confirmada | Promoció automàtica de procediments de baix risc; regles i permisos reservats a persones |
| Destí suggerit | _wiki_de_poble/04_escriptori/260920_0448_auditoria_matrix_skills.md |


## 1. Abast i límits de l’evidència
S’han revisat íntegrament les 16 skills, l’índex i les instruccions de .agents; el motor Matrix real i les seues dependències directes; els resolutors; i els camins relacionats de migració, bloqueig, validació, indexació i tancament.
Les rutes del prompt estan desactualitzades. El motor existent és [tooling/brain/matrix.mjs](/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs). No existixen tooling/wiki/matrix.mjs ni tooling/wiki/resolvers/ en el checkout inspeccionat.
No s’ha auditat cada component del frontend ni verificat el backend desplegat. Tampoc s’ha fet una prova de càrrega amb milions de documents. Per tant, este informe no certifica la seguretat o la capacitat de tota la web.
S’ha respectat la prohibició de consultar fonts externes. La proposta d’aprenentatge és una arquitectura raonada; no és una revisió bibliogràfica actualitzada de l’estat de l’art.

### Comprovacions executades
| Comprovació | Resultat |
|---|---|
| Catàleg de skills, --check | Correcte: 16 identificadors i projeccions concordants |
| Frontmatter estricte de .agents | Falla: F3=4, F4=4, F5=1, F7=11 |
| Metadades d’este informe, tractor real amb document virtual | Correctes: F1–F8=0 |
| Migració de metadades, en memòria | Reproduïda desaparició de camps vàlids |
| Recuperació concurrent de bloqueig, amb I/O simulat | Dos propietaris concedits |
| Mateixa carrera sense recuperació automàtica | Un propietari; segon procés rebutjat |
| Resolució de sufixos | Discrepància reproduïda entre resolutors |
| Unicode compost/descompost | Discrepància reproduïda |
| Classificació de «localització» | Selecciona incorrectament el protocol local |
| Escriptura a un Writable que falla | Rebuig seguit d’error no capturat |
| Termòmetre amb error de lectura | Retorna zero i permet continuar |

No s’han executat les bateries que creen fixtures al disc ni la cadena global de portes.

## 2. Troballes prioritàries

**F01 — P1: la migració pot eliminar metadades vàlides sense advertir-ho**
canonicalFrontmatter() retorna status i type, però el serialitzador rep un ordre que busca estat i tipus. A més, la canonicalització descarta altres propietats admeses com tags, name, triggers_on, core i prioritat. La reproducció va confirmar la seua eliminació silenciosa.
Decisió recomanada: bloquejar qualsevol serialització que perda dades canòniques i unificar parser, esquema, canonicalització i serialització.

**F02 — P1: recuperar un bloqueig «mort» pot llevar-ne un de viu**
Després de crear el fitxer amb wx, hi ha un interval abans d’escriure el PID. Un segon procés amb recoverStale:true pot llegir-lo buit, considerar-lo abandonat, eliminar-lo i adquirir-ne un altre, creant una carrera.
Decisió recomanada: retirar la recuperació automàtica. Un bloqueig abandonat ha de provocar un diagnòstic, no l'eliminació automàtica per part d'un altre procés.

**F03 — P1: la barrera de mutació depén del directori des del qual s’executa**
La tanca calcula rutes relatives a process.cwd(). Executar des d'un altre directori invalida la llista de fitxers protegits.
Decisió recomanada: usar l’arrel canònica i impedir que el motor modifique les seues pròpies regles.

**F04 — P1: el graf pot declarar orfe un document que té un enllaç vàlid**
El resolutor rebutja destins amb / abans de buscar per sufix. També causa 100.000 visites innecessàries per 100 enllaços irresolts.
Decisió recomanada: Refactoritzar l'indexador de memòria.

**F05 — P2: Matrix confon prefixos lèxics amb intencions**
El matcher de `context_documental.mjs` causa col·lisions (`startsWith`). També amaga errors del `Writable` i el termòmetre empassa errors de lectura del fs.

**F06 — P1 operatiu: la informació carregable conté taxonomies incompatibles**
L'arquitectura té discrepàncies reals (ex. `10_actes` vs `12_actes`). No és "Alzheimer" de la IA, sinó contradiccions injectades pel mateix sistema en regles antigues.

**F07 — P1 de governança: les skills no formen encara un contracte coherent**
Contradiccions directes en autoritat, destins, cicle de vida, i validacions de metadades i disseny.
Decisió recomanada: Netejar les skills falses i reescriure el nucli de cicle de vida i memòria.

**F08 — P2: els verificadors no certifiquen el mateix contracte**
Diferents fitxers comproven diferents claus (`schema.json` vs `cataleg_skills.mjs`).

**F09 — P1 per al requisit de milions: la cerca reconstruïx i reté índexs globals**
El `matrix.mjs` carrega l'índex complet de forma sincrònica, fet inassumible per a escalat.

**F10 — P1 per a l’autonomia: aprendre, arxivar i ampliar permisos estan barrejats**
Somiador actua de passafitxers. L'autoaprenentatge (catalog limit to 16) està bloquejat.

## 3. Blocs de correcció immediata

### B01. Impedir la pèrdua de metadades serialitzades
(Codi referenciat al Pla d'Implementació, fitxer `tooling/wiki/core/autoneteja_audit.mjs`)

### B02. Retirar la recuperació insegura del bloqueig
(Codi referenciat al Pla d'Implementació, fitxer `tooling/wiki/core/mutation_kernel.mjs`)
