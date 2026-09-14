---
tipus: petorreta
estat: esborrany
description: Disseny UX/UI i Arquitectura per al Mode Administrador (Offline/Local)
---
# 🛡️ PETORRETA AL CONSELL: MODE ADMINISTRADOR I DISSENY UX

## Context Actual (La Neteja està feta)
El sistema ha passat per una cirurgia extrema (Fase 2 d'Auditoria). Hem esmicolat el monòlit `UniversalElements.jsx` en components UI atòmics, hem podat el CSS orfe mitjançant AST, i hem solucionat tots els errors crítics P0 (incloses les fuites de sessió a les galetes). El *build* de Vite ara compila de forma neta i ultra-ràpida. Estem sobre una base de codi totalment sanejada.

Bundle aparellat: `260910_2208_BUNDLE_admin.md`

## El Problema i la Visió: La "Segona Plantilla" Universal
Fins ara hem actuat directament sobre el codi. Ara, el Mestre (usuari principal) vol poder **"registrar-se en mode offline"** o com a superadministrador local per a prendre el control de l'aplicació des de dins de la mateixa interfície d'usuari.

Però la visió és molt més ambiciosa: ens hem adonat que l'arquitectura que hem creat per al **Bloc de Notes** (amb la seua barra lateral de carpetes, subcarpetes, categories i etiquetes, i la seua zona de contingut) és excepcionalment robusta. Aquesta estructura no hauria de servir només per a notes. **Volem convertir el "Bloc de Notes" en una Plantilla Universal de Gestió**.
Si ho fem bé, aquesta mateixa interfície flexible ens servirà per a gestionar qualsevol cosa: usuaris, empreses, grups, i fins i tot un programa de gestoria complet, simplement canviant la semàntica i els camps.

## Instrucció Principal

Vull que actues com un Arquitecte de Sistemes i UX/UI. Tenint en compte que estem construint sobre React (Vite) i que utilitzem exclusivament Vanilla CSS sota les lleis de disseny visual "Pedra Seca":

1. **Abstracció del Bloc de Notes:** Analitza l'actual estructura de Notes (NotesSection, NotesSidebar, etc.) que veuràs al Bundle. Com podem refactoritzar i abstreure aquesta arquitectura perquè es convertisca en la nostra "Segona Plantilla" (UniversalManagerShell)? Ha de ser tan flexible que ens permeta instanciar un gestor d'usuaris, un gestor d'etiquetes o una gestoria sencera només passant-li una configuració.
2. **Dissenya el Flux d'Accés Offline i Administració:** Com hauria de ser l'experiència per a "registrar-se/iniciar sessió" en mode desenvolupament/offline i assumir el rol de Superadministrador? Aquest administrador aterraria en un Panell de Control basat en la nova "Plantilla Universal" per gestionar el sistema (Sóc de Poble com a empresa).
3. **Proposta Tècnica i de Codi:** Proposa l'estructura dels nous fitxers i l'esbós dels components clau necessaris per a aconseguir aquesta abstracció. Inclou exemples de l'API de React per a aquest `UniversalManager`.

`EXECUTA: Analitza l'actual Bloc de Notes adjunt al Bundle, dissenya l'abstracció cap a un Gestor Universal i entrega el model conceptual i tècnic per a construir el Mode Administrador utilitzant aquesta nova eina.`

## Tancament Obligatori
- No inventes dades; basa't en l'arquitectura de `socdepoble.org` que veuràs al Bundle.
- Utilitza exclusivament Vanilla CSS, aplicant els tokens de disseny `sdp-` existents.
- Respon de manera directa, sense preàmbuls comercials (No yapping).

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/PLANTILLA_ISO_SDP.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->
