---
type: document
status: esborrany
description: Reparacions documentals acotades i prototips de graf i permisos modulars per contrastar a l’Olivera.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_13664aa9-acde-475b-8e65-d0f84b2564c9:c53ef2d0-cb74-461c-8e95-9b13afa65010
---
# Pla verificable de l’auditoria independent

**Estat del Pla:** aprovat dins de l’abast explícit de l’encàrrec; expansió de producció només proposada.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_13664aa9-acde-475b-8e65-d0f84b2564c9:c53ef2d0-cb74-461c-8e95-9b13afa65010 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T15:10:06.279Z |
| Modificació | 2026-09-24T15:10:06.279Z |
| Propietari | codex |
| Aprovació humana | Encàrrec explícit d’auditoria i propostes/codi; alta de Javi només preparada per resposta expressa |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats: no disponibles; estimats: no calculats |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-24: pla escrit abans de les reparacions i dels prototips. Auditoria independent; cap informe de Fable emprat per formar les conclusions.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

1. Reparar exclusivament sis referències a `03_consola_termodinamica` que apunten a un fitxer mogut: el destí verificat és `02_saber/03_consola_termodinamica/00_portada`. Fitxers: `01_ser/00_index_identitat.md`, `02_saber/el_projecte.md` i `02_saber/protocols_tecnics/{a11y_seo_trellat,contingencia_offline,futur_adaptacio,index_trellat}.md`. Conservar àlies i tot el cos restant.
2. Ancorar l’acta existent `260924_1445_ACTA_MARMOTA_consola_termodinamica.md` a l’índex de l’escriptori, sense canviar-la ni reanomenar-la.
3. Materialitzar a `04_escriptori/02_investigacio_ia/260924_1706_prototips_codex/` dos prototips aïllats: graf dirigit amb orfes, inaccessibles i duplicats exactes; resolució d’accions de mòdul separant disponibilitat, autorització i estat. Proves Node natives; cap dependència nova. No importar-los a l’app ni substituir les portes existents durant l’auditoria.
4. Informe de les 22 skills físiques, mapa d’integració i migració gradual de 32 mètodes obligatoris a capacitats per domini. Alta de Javi preparada, sense compte nou ni dades fictícies.
5. Registrar proves i límits a l’auditoria, actualitzar ESTAT i LEDGER i executar tancament en mode lectura.

Criteris: cap esborrat; graf mesurable sense llegir arxiu històric; autoenllaços i cicles sense arrel detectats; accions desconegudes/denegades no s’habiliten; cap botó ni píxel de l’app modificat.

Alternatives descartades: una nova framework de plugins afegiria cost sense resoldre el contracte; una fusió massiva de documents per semblança arriscaria perdre excepcions. Es proposa consolidar després els motors existents sobre un únic snapshot, amb migració revisable.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Executar les proves natives dels prototips, `tractor-orfandat.mjs` abans/després i `document.mjs check` per als dos lliurables. Registrar també proves seleccionades de backend, sessions, Workspace, corpus i exportació pública. Tancament amb `--check --turn-id`; si falla per deute o concurrència, comunicar-ho sense resegellar-lo.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Arbre compartit amb canvis previs: verificar contingut abans de cada substitució i preservar-lo. La nota és judici d’enginyeria amb rúbrica, no certificació de producció. Els prototips són demostració executable; no activen serveis, cobraments ni publicació. Les fusions de skills i les migracions de dades es lliuren com a proposta per al contrast posterior.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
