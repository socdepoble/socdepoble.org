---
type: document
status: esborrany
description: Fases, fitxers, proves negatives i criteris de relleu per corregir les fallades verificades del Cervell.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_4dd02076-f9b4-4588-a25b-3badd681cf62:bba81d39-0daf-4a67-acb2-fee4ad272a63
---
# Pla de reconstrucció del contracte cognitiu i documental

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4dd02076-f9b4-4588-a25b-3badd681cf62:bba81d39-0daf-4a67-acb2-fee4ad272a63 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T04:44:22.156Z |
| Modificació | 2026-09-22T04:44:22.156Z |
| Propietari | codex |
| Aprovació humana | pendent |

## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 10570e52098d2166ea54a6085580c3a0e1dee75c35f5090a2cda493aedf9e197. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T04:44:22.156Z: pla elaborat des de l’auditoria local; implementació encara no executada.

## Canvis proposats

Estat: **proposta concreta, no implementada**. `requires_human_decision: false` per elaborar aquest pla, segons l’encàrrec. Responsable suggerit: agent implementador del Cervell; revisió d’una altra IA després de cada fase. No cal ampliar abast a UI, dependències ni backend.

### Fase 1 · Entrada i autoritat (C01–C04)

Modificar `AGENTS.md`, el seu mirall `.agents/AGENTS.md`, `.agents/BOOTSTRAP.md`, `.agents/PROTOCOL_PETORRETA.md`, els documents afectats de `01_ser`, `00_index.md`, `02_saber/00_index_identitat.md` i `successio_lazaro_execucio.md` en un canvi coherent.

- Mantindre AGENTS arrel com a contracte principal; el mirall ha de ser generat i comprovat, no coeditat.
- Corregir rutes amb destinacions comprovades, eliminar instruccions actives sobre ubicacions retirades i mantindre redireccions històriques explícites.
- Fixar separació entre identitat, normes, procediments i evidència. Una lectura històrica no adquireix autoritat per ser la més recent.
- Documentar rebut documental versus lease per risc alt. Preservar límits de protecció i permisos reals.
- Resoldre terminologia online en una decisió única referenciada; no fer substitucions cegues sobre història.

Eixida exigida: una persona pot localitzar el procediment correcte des de dos punts d’entrada, sense buscar noms desapareguts. Cap moviment físic de carpetes.

### Fase 2 · Generació fidel i contracte versionat (C05–C08)

Modificar `tooling/wiki/document.mjs`, `tooling/documental/core.mjs`, `turns.mjs`, `.agents/protocolledge.json`, plantilles i proves documentals.

- Identificadors estables per a seccions; blocs normatius i camps editorials distingits.
- `create` instancia context i instruccions obligatòries; els camps de tasca, criteris i evidències continuen explícits.
- Versió immutable del contracte vinculada al rebut. Els documents existents es validen contra aquella versió; una revisió nova requereix migració explícita.
- Resolver la ruta abans de carregar plantilles independents; una porta global continua comprovant-les totes.
- No confondre hash íntegre amb comprensió, autorització o qualitat semàntica.

Ordre intern: incorporar compatibilitat i proves abans de canviar bytes de plantilles. Eixida exigida: prompt nou vàlid que conserva Olivera i lectura inicial, i document antic verificable després d’un canvi compatible.

### Fase 3 · Regularització i cicle de vida (C09–C10)

Inventariar els set documents amb incidències; conservar originals i registrar-los com a importació o revisió, mai fabricar una lectura anterior. Revisar ruta específica per a actes i promoció a història: el rebut ha de preservar identitat i ruta de cada revisió. Definir què queda actiu, qui l’usa i quan pot arxivar-se; no fer una neteja massiva.

Separar en `core-memoria-historica` i `wiki-cicle-de-vida` coneixement històric i passos executables. Llevar rutes absolutes de màquines personals dels procediments. La producció humana continua protegida.

### Fase 4 · Relleu i diagnosi completa (C11–C12)

Modificar `.agents/ESTAT.md`, `tooling/brain/despertar.mjs` i documentar ON_ESTIC com a derivat. Estat actual: objectiu, següent acció, bloquejos, proves, responsable per rol i enllaços. Diari separat, sense truncament arbitrari per a obtindre vigència.

Afegir al runner de portes un mode de diagnosi acumulada per a comprovacions independents declarades de lectura. Mantindre eixida no-zero si alguna falla; no convertir el diagnòstic en autorització de publicació.

### Fase 5 · Successió assajada

En clon temporal net, sense fitxers locals ocults ni context de xat: llegir AGENTS i l’índex, localitzar estat, generar prompt, validar, executar prova negativa, crear acta, tancar torn i reprendre’l en una sessió neta. Verificar què necessita Node/dependències locals i què necessita credencials. Documentar accés per rol i recuperació sense copiar secrets. Un altre operador repeteix el recorregut; anotar bloquejos reals.


## Verificació

| Prova | Acceptació |
| --- | --- |
| Rutes d’arrencada i mapa taxonòmic | Totes resolen al disc amb caixa exacta; cap ruta activa retirada. |
| Supressió d’una regla Olivera en prompt | La validació falla amb missatge específic. |
| Edició compatible d’una plantilla | Document antic continua verificable amb el seu contracte; nous documents usen el nou. |
| Plantilla branding absent | Ruta auditoria usable; diagnòstic global identifica branding. |
| Rebut inventat, caducat o de fitxer diferent | Rebutjat; no abaixar les 45 proves existents. |
| Promoció d’acta | Historial de ruta verificable i enllaços actualitzats, sense perdre rebut. |
| Canvi d’estat nou | ON_ESTIC reflecteix la següent acció vigent, no els primers 1.500 caràcters. |
| Diverses portes roges | Diagnosi mostra totes les independents i retorna error. |
| Portes documentals i tancament | Validació individual, conjunta i tancament explícit amb registre durable. |
| Clon net | Mateix resultat documental sense dependre del runtime no versionat del portàtil. |

Executar les proves del canvi i les portes pertinents una vegada completada cada fase; repetir només si canvien els inputs. Cap verd local es presenta com a CI superada. La comprovació final de publicació continua sent bloquejant.


## Riscos

El risc major és invalidar documents mentre es canvia el contracte: implantar primer compatibilitat immutable. En arbre compartit, fixar hashes dels fitxers objectiu i aturar l’escriptura si canvien concurrentment. Fer fases petites; reversió per patch o commit de cada fase preservant aportacions alienes, mai reset global.

No editar `01_produccio`, no executar el Somiador ni desplaçar arxius antics per maquillar les portes. La successió humana requereix verificar accessos i responsables existents; no inventar-los. No afegir dependències ni publicar en aquesta reestructuració.

Alternatives descartades: migració física de tota la taxonomia i relaxació de les validacions per fer desaparèixer errors. El pla reutilitza les sis carpetes reals i les comprovacions demostrades.


## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260922_0643_auditoria_codex]]
