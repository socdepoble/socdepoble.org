---
type: document
status: esborrany
description: Pla proposat de lliurables verificables per reconciliar la candidatura NLnet amb el codi, sense implementar ni desplegar canvis.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:4d48d120-5376-4c35-88d0-098fa9d4563a
---
# Portabilitat, exportació i federació municipal per a NLnet

**Estat del Pla:** en elaboració per a implementació futura; estudi i disseny sol·licitats completats.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:4d48d120-5376-4c35-88d0-098fa9d4563a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T22:56:11.844Z |
| Modificació | 2026-10-29T23:29:00Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6, identitat de l'entorn; variant no exposada |
| Tokens consumits | No disponibles; no estimats ni convertits a hores |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-29T22:56:11.844Z: pla creat pel circuit formal. 2026-10-29T23:20:54Z: contractes, fites, pressupost i proves definits; estudi completat i implementació futura pendent d'aprovació.
- `2026-10-30T23:51:38.000Z`: rebut renovat per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4), perquè el torn del rebut anterior (`sdp:torn_b3a4417e-c57f-40d5-91e3-d2d51c1d5828:2ff79e62-bb99-4704-ab3b-821992d3cfe9`) havia caducat sense tancar-se; el contingut no canvia.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Objectiu i frontera autoritzada

El Mestre ha autoritzat estudi profund, auditoria i disseny. Este torn completa eixos documents i la memòria formal. **La implementació futura, desplegament i comunicació amb NLnet no s'han executat.** El codi continua en lectura per evitar col·lisió amb Claude.

L'objectiu proposat és demostrar portabilitat municipal amb una instància autoallotjada de referència, exportació/importació autoritzada, federació pública qualificada i una UX accessible. ONLINE-FIRST, port neutral i Model B continuen vigents. El detall de contractes A/B/C, pressupost, proves i Q&A viu en l'auditoria companya; no s'ha de substituir per una síntesi optimista del Mestre.

### Alternatives valorades i decisió proposada

1. Empaquetar només la SPA i publicar JSON estàtic de federació seria més curt, però no demostraria el repte de servidor/recuperació ni lliurament ActivityPub. Es pot usar com a prototip etiquetat, no com a criteri final.
2. Reescriure el backend i afegir CRDT/offline-first ampliaria molt l'abast i introduiria una migració no acordada. Requeriria un altre pressupost/ADR i no es proposa dins d'estes 1.000 hores.
3. Es proposa reutilitzar el backend i mòduls actuals, qualificar la mateixa semàntica Supabase autoallotjada i construir contractes d'eixida i federació additius.

Mantenibilitat a sis mesos: esquemes versionats, migracions compatibles, permisos explícits, logs sense secrets, cues durables i proves reproduïbles. Evitar formats exclusius, una segona font de veritat i serveis d'IA obligatoris.

### Fites i portes d'acceptació

| Fita | Treball i dependències | Evidència que permet acceptar-la |
| --- | --- | --- |
| G0 · Procedència i abast | Obtenir de la persona responsable còpia realment rebuda/rebut i preguntes Q&A; confirmar transició d'IA v1.1, data elegible, abast i budget. Annexar correcció del log sense reconstruir eixides i reconciliar annex/ADR. | Registre de correspondència i acord humà/destinatari quan corresponga; baseline identificada. No s'ha enviat cap missatge des d'este torn. |
| G1 · Contractes i spike | ADR additiva; esquema municipal i drets; inventari complet de serveis; versions de laboratori i perfil Organization/Service. Spike Mastodon/Mobilizon abans de prometre extensió d'events. | Decisions revisades, API/export schema versionat, resultat del spike amb límits i estimació actualitzada. Si no cap en pressupost, acord explícit d'abast abans d'executar més. |
| G2 · Exportació que torna a funcionar | Façana exportaMunicipiOpenData, snapshot servidor, JSON-LD/Markdown/actius/manifest; exportació pública separada de migració privada i personal. Importador dry-run, actius immutables verificats abans de publicar les referències en transacció PostgreSQL; recuperació d'orfes Storage. | Dos municipis sintètics; exportar A, validar hashes, restaurar en instància nova, comparar IDs/actius/relacions/permisos. Vinculació d'identitats verificada, comptes desconeguts inactius i privilegis autoritzats al destí. B intacte, sense secrets ni contingut privat en el paquet públic. |
| G3 · Federació pública | Façana src/data/activitypub.js; WebFinger/actor/outbox/objectes/inbox en servidor; projecció pública, signatura, cua i moderació. | Recepció real Note/Update/Delete en Mastodon; Event actualitzat/cancel·lat en Mobilizon amb perfil acordat; reintents/dedup sense duplicats i prova de permisos. |
| G4 · Release i ús independent | flake/lock/NixOS, serveis Supabase complets, install/doctor, doble build, backup/upgrade/restore; UI de migració i demostrador EN/CA. | Dos builds nets comparats; segon operador instal·la i restaura seguint manual; proves de correu/Storage/Realtime/programadors; llicències, SBOM i excepcions explícites. |

G2 i G3 depenen dels contractes G1; el demostrador només anuncia com a construït allò acceptat. No es retallen obligacions acordades sense aprovació del destinatari. G0 condiciona la imputació econòmica, no impedix completar el present estudi autoritzat.

### Pressupost conservat i proposta de correspondència

| Partida original | Hores i import | Proposta futura de distribució |
| --- | --- | --- |
| Anàlisi i arquitectura | 160 h · 8.000 € | 40 procedència/abast;40 export/drets;40 federació/spike;40 serveis/Nix. |
| UX/frontend | 240 h · 12.000 € | 60 export/migració;55 qualificació/deltes teclat/focus;45 autoallotjament/qualificació de traducció lliure;40 demostrador interactiu;40 pilot cultural/manuals. |
| Backend/mòduls | 440 h · 22.000 € | 160 federació;140 export/import;100 autoallotjament;40 pilot/deltes cívics. |
| Proves/seguretat/desplegament | 160 h · 8.000 € | 55 Nix/rebuild;45 integració/restore;35 accessibilitat/compatibilitat;25 manuals/SBOM. |
| Total | 1.000 h · 50.000 € | 50 €/h; estimació revisable, no hores meritades. |

IDEA-38 manté les cinc agrupacions internes com a proposta de correspondència, sense substituir l'original. Cada tasca es registra una sola vegada en una partida, amb persona, data, artefacte i acceptació. Reutilitzar codi existent no permet facturar retroactivament la seua construcció. No s'han assignat persones ni compromés despesa.

### Camins previstos per al futur carril de codi

Existents a reutilitzar: src/data/backendPort.js, contracte.js, supabase/, adaptadors/sollutia/, conformitat/kit.js, src/host.js; components/contexts municipals i de drets; src/data/iaiaLocal.js; Vite i paquets WordPress. Cap d'estos fitxers s'ha editat ací.

Altes proposades: façanes activitypub.js i exportaMunicipiOpenData.js, rutes HTTPS de servidor amb persistència/cua, esquema d'export/import, flake.nix/flake.lock, mòdul NixOS i instal·lador/doctor, proves d'integració i ruta /fediversity. Els camins del servidor i les migracions es concreten en G1 després de triar l'operador/stack, respectant estructura del repo. No hi ha fitxers buits o pseudocodi instal·lats per simular avanç.

Ampliació final concurrent23:27UTC: IDEA-58 ja implementa fletxes/focus i les connecta a Workspace/graelles; IDEA-31 ja activa transport Apertium al lloc propi i endpoint de desenvolupament.56/56 del lot suplementari passen, amb geometria/configuració simulades. El transport estàtic envia text/IP a Apertium públic i no acredita autoallotjament ni disponibilitat real. El treball futur es rebasa sobre eixa construcció: qualificar amb persones, servei propi i deltes justificats; cap refacturació retroactiva. No afegir POST a la Frontissa GET ni confondre cinc diccionaris amb cinc parells de traducció.

Cervell local: pilot curat, recuperació amb fonts i proposta de targeta sota aprovació editorial. Funciona també amb IA generativa apagada; cap destil·lació autònoma presentada com a fet.

### Demostració i missatge als revisors

La ruta /fediversity ja té una pàgina editorial al codi concurrent de Claude. El demostrador interactiu EN/CA és la proposta pendent: mostrar exportació verificable i restauració independent, canvi d'amfitrió diferenciat del canvi de servidor, flux ActivityPub real o preview etiquetat, teclat/lector/zoom i fonts culturals. Una pàgina informativa no és eixa prova funcional. Guió complet i preguntes per a confirmar a l'auditoria.

Dades de demostració sintètiques o expressament obertes; cap formulari/log privat, contacte, sessió o credencial. Ni un verd corporatiu certifica WCAG AAA ni una resposta BM25 té latència universal garantida.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

### Estudi completat en este torn

Lectura de fonts obligatòries, revisió paral·lela de pressupost/procedència, federació/exportació i empaquetat. Contrast amb fonts oficials NLnet, W3C, RFC, Mastodon, Mobilizon, Nix i Reproducible Builds. Lot propi Vitest: 11 fitxers,445 proves passades,0 fallades,4,05 s; suplement final separat4fitxers/56pass/0fallades,2,57s. No és una prova de les funcionalitats futures.

Validació documental, governança i tancament: resultats literals en l'auditoria companya. Les dues peces tenen rebuts propis i el mateix prefix horari; cap bundle extern ni publicació.

### Proves requerides abans d'acceptar implementació futura

- Contractes purs i fixtures versionades; errors/cancel·lació i permisos de tenant.
- PostgreSQL/Storage reals de laboratori amb municipis A/B, snapshot i export/import complet.
- Activitats reals entre servidors controlats i versions fixades; cua reiniciable, actualització/baixa.
- Dos builds nets comparats, doctor i instal·lació/restore per segon operador.
- Teclat/lector/zoom/mòbil i revisió de traducció amb persones, criteris WCAG aplicables i excepcions.
- Manual de manteniment/actualització i drets; recorregut complet sense serveis d'IA generativa.
- Artefacte i log de cada fita, aprovació humana i acceptació del destinatari quan siga exigible.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

R1 abast massa ample per1.000h: spike i pressupost revisat, una sola plataforma de referència; cap nou backend/CRDT/botigues mòbils afegit implícitament.

R2 dades i llicències: públic no significa obert; tres exportacions amb drets/abasts separats, consentiment i llicència per recurs. Claus i secrets fora de paquets públics/Nix store.

R3 falsa interoperabilitat: JSON vàlid no prova Mastodon/Mobilizon; exigir recepció, edició i baixa reals en laboratori. El canvi de domini tampoc conserva seguidors automàticament.

R4 falsa reproduïbilitat: epoch/lock no basten; comparar builds i separar artefacte immutable d'estat restaurable. Codi rollback i BD necessiten compatibilitat/còpia.

R5 procedència/finançament: confirmar expedient/política/start date, no omplir log amb material inventat, no usar este text com a autoria humana ni prometre puntuació.

R6 col·lisió de carrils: implementar només en un torn de codi autoritzat, amb inventari i camins propis. Este pla no edita fonts ni envia missatges.

Tres fallades que s'han de poder reproduir amb seguretat en laboratori: actiu modificat durant exportació → paquet incomplet; receptor federat indisponible → cua durable sense duplicar; migració de BD incompatible → actualització bloquejada abans de perdre dades.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_2353_auditoria_codex_nlnet_fediversity]]
- [[261029_1859_auditoria_codex]]
- [[ADR-2026-08-ONLINE-FIRST]]
