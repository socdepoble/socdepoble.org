---
type: document
status: esborrany
description: Pla per incorporar la pujada del logotip d'avatar idèntic a Claude, la lògica de targetes pròpies a Notes Personals i l'auditoria del xat.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_9364bf5b-fc4e-4d30-8484-52277e3c7079:5dbb62a8-4765-49e8-ae81-d600966c5d56
---
# Avatar, Targetes i Auditoria Extrema

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9364bf5b-fc4e-4d30-8484-52277e3c7079:5dbb62a8-4765-49e8-ae81-d600966c5d56 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T10:00:31.981Z |
| Modificació | 2026-10-08T10:00:31.981Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-08T10:00:31.981Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Els canvis principals del pla es resumeixen en:
1. Independitzar els botons de pujada: un botó específic per a `Capçalera` i un altre per a `Avatar` o `Logotip`, per evitar confusions (actualment hi ha conflicte en pujar imatges).
2. Construir l'experiència de pujada per a qualsevol imatge (siga capçalera o avatar) calcant exactament la modal de Claude de forma modular: senzilla, arrossegar per reposicionar, slider de zoom amb - i +, i botons Restablir/Cancel·lar/Guardar.
3. Incloure un avís o control clar si l'usuari intenta pujar un arxiu molt pesat (ex. més de 10 MB) que faça fallar el servidor o el navegador.
4. Corregir la lògica de la secció `Notes Personals` perquè l'usuari hi puga vore totes les publicacions que ha creat al Mur, Mercat, etc. en els corresponents apartats.
5. Eliminar el camp obligatori "Empresa mare" del formulari de creació d'una nova organització.
6. Executar una auditoria extrema al xat.

### 1. Context i Troballes (Research)
- L'editor actual permet pujar la imatge de capçalera (ex. pomes), però falta l'opció "Penjar logotip" per a l'avatar que sí que hi era a la versió antiga.
- La nova modal ha de ser fidel al disseny de Claude: un cercle on es puga moure la imatge, fer zoom i guardar.
- A `Notes Personals`, les targetes creades pel mateix usuari i publicades (Mur) no es mostren correctament; per exemple, Sóc de Poble només veu "Nota sense títol" en comptes de la llista dels seus propis posts.

### 2. Preguntes Obertes (User Review Required)
- L'edició d'un post des de Notes Personals és un camp d'esborrany separat, o edita directament la publicació pública?

### 3. Canvis Proposats (Proposed Changes)

#### [Acció: MODIFY] `src/features/...` (Editor de Perfil)
- Separar clarament l'acció amb dos botons: "Capçalera" i "Avatar" / "Logotip".  Així l'usuari entén ràpidament què està canviant i no hi ha conflictes.
- Implementar la nova modal calcant l'experiència de Claude per arrossegar ('drag') i fer zoom, i fer-la independent: cada imatge puja i es retalla per separat de forma modular. 
- Implementar validació prèvia a la pujada: mostrar un avís d'error amigable a l'usuari si l'arxiu pesa massa i la càrrega fallarà.

#### [Acció: MODIFY] `src/features/...` (Notes Personals)
- Modificar el selector/query de Notes Personals perquè reculla efectivament les publicacions creades per l'usuari als murs, presentant-les amb les seues *cards* corresponents.

#### [Acció: MODIFY] `src/features/...` (Formulari de Nova Organització)
- Eliminar el camp "Empresa mare" (obligatori) de la modal de creació de nova organització, o amagar-lo per a grups, atès que un grup no té per què dependre d'una empresa. Mantenir l'UX senzilla.

#### [Acció: NEW] Auditoria Extrema del Xat
- S'efectuarà una auditoria extrema (adversarial) per a trobar forats en el xat (seguretat, lògica i UI) abans de l'entrada dels betatesters, de manera que quan s'aborde, funcione perfectament.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Provar de pujar un logotip d'avatar, arrossegar, fer zoom i guardar, observant que s'aplica al perfil correctament i s'assembla a Claude.
- Crear una publicació i revisar que apareix dins les seues pròpies Notes Personals.
- Revisió lliure de forats del xat durant l'auditoria extrema.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Tindre dos sistemes per tractar imatges (capçaleres panoràmiques i avatars circulars). Cal simplificar i reciclar la mateixa modal.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
