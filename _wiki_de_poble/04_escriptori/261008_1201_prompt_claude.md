---
type: prompt
status: esborrany
description: Tasca de Claude per executar una auditoria adversarial sobre el xat, arreglar la pujada de l'avatar a l'estil Claude, i mostrar targetes pròpies a Notes Personals.
tags:
  - govern
visibility: private
reflex: sdp:torn_9364bf5b-fc4e-4d30-8484-52277e3c7079:52051f0e-fd27-4638-9229-a0a7fd51456e
---
# Auditoria adversarial extrema i millores (Avatar i Notes Personals)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9364bf5b-fc4e-4d30-8484-52277e3c7079:52051f0e-fd27-4638-9229-a0a7fd51456e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T10:01:29.875Z |
| Modificació | 2026-10-08T10:01:29.875Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-08T10:01:29.875Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Company Claude: el Mestre ha deixat instruccions clares. Ens trobem a la porta de l'Onada 4. Has de fer complir el Pla d'Implementació [[261008_1201_pla_implementacio_claude.md]]. La prioritat és l'Auditoria Extrema del xat i corregir els detalls de l'Avatar i les targetes pròpies a Notes Personals. Actua amb determinació.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Gestió d'imatges i elements de l'Editor de Perfil:** 
   Volem separar clarament els botons de pujada perquè l'usuari no s'embolique: posa un botó dedicat a "Capçalera" i un altre a "Avatar" o "Logotip". Cadascun ha d'obrir de forma independent una modal de retall lliure, calcada a la que té Claude per als seus usuaris: la foto es pot arrossegar per enquadrar-la (sense vores obligatòries estranyes), amb una barra lliscant per a zoom in/out (amb `-` i `+`) i només tres botons clars: Restablir, Cancel·lar, Guardar. Elimina complexitat o botons que trencaven el disseny antic. (Les captures de referència de Claude són als artefactes).
   A més a més, posa un filtre de pes: si algú puja una foto immensa i pesada, ha d'avisar i parar-ho abans de trencar l'aplicació.
   Per altra banda, has d'arreglar el botó d'"Elegir drets d'autor". Actualment té problemes de lògica: una vegada es trien els drets, ja no es poden tornar a canviar, i en fer clic damunt del botó et redirigeix a una altra pàgina en comptes d'obrir de nou el selector. Usa les teues habilitats per reconstruir aquesta lògica perquè l'usuari puga triar, veure i modificar la seua llicència de forma intuïtiva dins de l'editor.
   D'altra banda, als perfils d'organització (ex. El Rentonar) **falta l'opció per triar el Poble**. S'ha d'afegir aquest camp perquè aparega correctament el nom del poble a la barra taronja superior. 
   Finalment, **reorganitza l'editor**: moure els botons de "Vista A4 / PDF", "Crear portada" i "Vista targeta" fóra de l'espai d'edició central, posant-los com un apartat més dins d'opcions laterals (com "El Compte"). Fes servir la teua experiència per optimitzar la lògica i usabilitat general d'aquest *backend* d'usuari, millorant tot el que veges.

2. **Lògica de `Notes Personals`:**
   En comptes de mostrar només esborranys, aquest espai de treball privat ha de mostrar totes les targetes/publicacions que l'usuari ha publicat (Mur, Mercat, etc.), mostrant el bloc visual adequat de cada post. Connecta-ho correctament perquè quan el "Sóc de Poble" estiga loguejat, veja en `Notes` tot el que ha penjat Sóc de Poble.

3. **Formulari de Nova Organització i Membres:**
   Elimina d'una vegada el camp "Empresa mare (obligatori)" del modal de nova organització. Com bé diu el Mestre, "un grup no té per què pertànyer a cap empresa", això només embolica a la gent. Llevat!
   Però a més, aprofita per anar implementant la lògica de la pestanya de "Membres" al perfil de les organitzacions: cal que un propietari puga gestionar, afegir i visualitzar usuaris o altres grups que en siguen membres (ex: l'usuari "Sóc de Poble" essent membre de "El Rentonar"). Manten la lògica de *backend d'usuari* robusta.

4. **Auditoria Adversarial del Xat:**
   Ara que hem aplicat a producció la migració de `obri_fil_de_pagina`, el xat hauria de rutllar. Has de posar-lo a prova buscant-hi qualsevol fissura de cicle de vida, seguretat i fluïdesa abans d'obrir la porta als betatesters. Detalla tot error que trobes.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre dos components similars però duplicats per pujar la imatge panoràmica i l'avatar circular (pot trencar DRY).
- Al mostrar publicacions de Mur en Notes, vigila que editar-les modifique la publicació original (si s'escau) o que estiga clavat el comportament.
- Tindre cura de no trencar res de la implementació Pedra Seca original.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 69997976f6e4d34f9041b9e54c4bdf3e2cd7dd4ebb9fe0864b6828cbcb32bb34. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
