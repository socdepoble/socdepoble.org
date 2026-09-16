---
tipus: protocol
estat: canonic
description: Defineix els bloquejos fail-closed reals que impedixen confondre una auditoria incompleta amb un sistema saludable.
tags:
  - maquina
---
# SDP-LOCK — bloqueig de protecció verificable

`SDP-LOCK` no és un dimoni global ni una bandera mística. És el principi comú
pel qual cada gate torna codi no-zero i fa zero mutacions quan no pot demostrar
les seues precondicions.

## Triggers implementats

Una operació concreta queda bloquejada quan es dona almenys una condició:

1. falta una lease del Reflex, ha caducat o no inclou operació/scope/pla;
2. canvien regles, HEAD, context, snapshot, índex preparat o hashes després del
   segellat;
3. hi ha YAML invàlid, schema fora de v2, contingut operatiu buit, orfes,
   placeholders, enllaços no resolts o ambigus;
4. un path travessa [[el_projecte|el projecte]], un ancestre és symlink, apareix un hardlink o
   l'índex Git conté symlink/gitlink;
5. falla un lock, CAS, backup, escriptura atòmica o verificació posterior;
6. l'arbre Git preparat no és exactament l'arbre auditat o el commit no té el
   pare esperat.

Els percentatges UDR, bateria, tombstones CRDT, “SSI”, IFT o snapshots OPFS no
són triggers implementats en esta baseline. Poden inspirar una futura regla,
però necessiten instrument, fórmula i regressions abans de bloquejar res.

## Alliberament

No hi ha bypass d'emergència. Cal corregir la causa, repetir el diagnòstic i,
si l'estat ha canviat, obrir i segellar una Petorreta nova. En Autoneteja, una
restauració usa el manifest i els hashes exactes del lot; en Git, el rebut es
consumix només després de validar arbre i pare del commit.

El límit honest continua sent el mateix: un procés amb el mateix usuari pot
ometre hooks o llegir la clau local. CI, protecció de branca i revisió humana
són necessaris per a fer durable el control.


**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — Ancoratge de Seguretat: ...
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — 4. un path travessa [[el...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — Etiquetes: [[graf]]
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — Categoria: [[maquina]]
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[sdp_lock|Límits de seguretat]]
- [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]] — [[00_index|00_INDEX.md]] — [[sdp_lock|02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md]]...
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — actual. El contracte executiu detallat és [[sdp_lock]].

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
