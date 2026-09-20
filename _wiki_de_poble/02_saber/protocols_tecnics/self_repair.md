---
type: document
status: canonic
description: Reunix criteris consultius de reparació segura, contenció d'errors i resiliència local sense autoexecució.
tags:
  - maquina
aliases:
  - Self Repair
  - SDP Stop
---
# Autoreparació i contenció d'errors

## Naturalesa i límit

Esta és una **fitxa de coneixement**, no una skill executable. Les regles i capacitats dels agents viuen en `.agents`; la Wiki no pot concedir permisos. «Autoreparació» significa diagnosticar, contindre i preparar una reparació verificable, no modificar el sistema per iniciativa pròpia.

En el mapa 4+2, la implementació pertany a `03_actuar`, la norma a `03_govern` i les actes temporals a `05_Escriptori_Soc_de_Poble`. Els paquets massius i forenses romanen fora del vault.

## Reflex mental SDP

El patró històric **Stop–Observe–State–Propose** continua sent útil:

1. **Stop:** atura l'acció que podria ampliar el dany.
2. **Observe:** reproduïx i arreplega evidència en mode lectura.
3. **State:** fixa l'estat conegut, el hash, l'abast i els criteris d'acceptació.
4. **Propose:** formula el canvi mínim, les proves i la reversió.

`Propose` no és `Proceed`: la proposta no autoritza l'escriptura.

## Reparació de dades o documents

1. Audita en sec i distingix error real, avís i informació exclosa.
2. Selecciona només fonts rellevants; no carregues tota la Wiki, actes massives ni Mega-Petorretas.
3. Classifica l'operació, els targets i el risc.
4. Per a qualsevol efecte lateral, usa `.agents/PROTOCOL_PETORRETA.md`: `open`, lectura de regles, Petorreta i manifest selectiu al bootstrap, `seal`, rebut, verificació i consum.
5. En mutacions de dades, exigix snapshot, pla immutable, backup durable, comprovació CAS, escriptura atòmica i verificació posterior.
6. Si canvia l'estat durant l'operació, falla de manera tancada i recalcula; no declares èxit parcial com a salut perfecta.

Cap rebut pot reutilitzar-se per a rutes o operacions no declarades. Els canvis massius, purgues, restauracions, esquema, `.agents` o `03_GOVERNAR` són risc alt.

## Contenció d'errors de la interfície

- Compartimenta widgets independents amb `ErrorBoundary` o un mecanisme equivalent.
- Un error d'un avatar, mapa o reproductor no ha de tombar la vista completa.
- Oferix un missatge tranquil, una acció de reintent accessible i una àrea tàctil mínima coherent amb les normes d'accessibilitat.
- Registra només la informació tècnica mínima, local i redaccionada; mai contingut personal, claus o tokens.
- Les llistes i tasques asíncrones han de tindre cancel·lació, timeout i fallback.

La telemetria externa no s'incorpora per defecte. Qualsevol canvi en este criteri requerix anàlisi de privacitat i governança, no una decisió implícita d'esta fitxa.

## Mode offline «Mas Cau»

Quan la xarxa falla, l'aplicació ha de degradar-se amb calma:

- mantindre lectura des de dades seed, snapshot o persistència local quan siga possible;
- posar en cua només operacions idempotents i mostrar-ne l'estat real;
- limitar reintents amb backoff i evitar sincronització agressiva;
- reconciliar conflictes de manera explícita en tornar la connexió;
- preservar la privacitat i no prometre P2P, xifratge o recuperació que el codi no implemente i les proves no demostren.

Este comportament de producte no activa cap reparació del repositori.

## Criteris d'acceptació d'una reparació

- causa reproduïda o incertesa declarada;
- delta mínim i dins de l'abast;
- proves proporcionals al risc;
- cap regressió en mode offline o accessibilitat;
- logs sense dades sensibles;
- backup i restauració comprovats quan hi ha dades;
- rebut consumit després de l'operació correcta.

## Annex històric resolt

Els antics frontmatters v1 incrustats, `pre_commit_trellat.mjs` com a autoritat, l'«SDP-LOCK» automàtic i el P2P promés s'han retirat del contracte vigent. Es conserven únicament com a idees de disseny que requerixen implementació i proves abans de convertir-se en funcionalitat.

## Sinapsis

- [[anatomia_cognitiva|Cingulat Anterior]]
- [[MOTOR_OFFLINE]]
- [[seguretat_execucio]]
- [[doc_governanca]]
- [[llei_05_privacitat]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

