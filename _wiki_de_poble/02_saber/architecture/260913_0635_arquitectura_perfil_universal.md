---
type: document
status: esborrany
description: "Visió del Mestre per a «El meu perfil»: el perfil com a Pàgina Universal, amb tres columnes paral·leles al Bloc de Notes i una Targeta Universal cap a fora."
tags:
  - identitat
---
# Visió arquitectònica: el perfil com a Pàgina Universal

El perfil deixa de ser un formulari estàtic d'ajustos i passa a ser una instància nativa de la **Pàgina Universal**, amb la mateixa anatomia que el Bloc de Notes i l'edició de notícies. Este document recull la visió de producte que el Mestre va fixar per a la secció «El meu perfil».

## 1. El paral·lelisme (Notes i Perfil)

L'arquitectura visual i d'interacció ha de ser idèntica a la d'un editor de contingut:

| Bloc de Notes | El Meu Perfil |
| :--- | :--- |
| **Columna 1 (Carpetes)**: Llibres o seccions de notes | **Columna 1 (Identitats)**: Carpetes per Identitat Personal (Javi Llinares), Grups, Empreses, Plugins i Utilitats. |
| **Columna 2 (Llista)**: Llista de notes dins d'una carpeta | **Columna 2 (Atributs)**: Llista de camps a editar (Nom, Foto, Correu, Estat). Açò determina què s'inclou o no en la pàgina de perfil. |
| **Columna 3 (Editor)**: Universal Page amb barra taronja per editar la nota | **Columna 3 (Pàgina de Perfil)**: Universal Page amb barra taronja per editar la fitxa del perfil. |

## 2. La barra taronja en l'edició del perfil

Quan un usuari edita la seua foto de perfil o qualsevol altre atribut, el component que visualitzarà aquest canvi de forma nativa és la **Barra Taronja** (part superior de la Universal Page), ja que actua com a editor de la pròpia "Card Universal del Perfil".

La targeta resultant (el perfil públic) no és més que una "Universal Card" generada a partir d'aquesta "Universal Page".

## 3. Desplegament de la Targeta Universal (el Cercador)

Com que el perfil és una Pàgina Universal, es materialitza cap a l'exterior com una **Targeta Universal** estàndard, complint tota la seua anatomia: foto, **boina taronja** (autoria/creació), títol, subtítol, presentació, i **peu blau** (accions).

Aquesta targeta és el que es mostrarà en la resta de l'aplicació. Per exemple, **al Cercador**: en buscar "Javi Llinares", el sistema no ha de retornar una llisteta simple amb un nom, sinó que ha de renderitzar la Targeta Universal completa de Javi Llinares, i en fer-hi clic, eixa targeta et portarà a la seua Pàgina Universal. Un comportament pur i fractal.

## 4. Pròxims passos (quan el Mestre done llum verda)

- **Fase A**: Reestructurar la Columna 1 (Facets de `UniversalManager` en `PerfilShell.jsx`) per agrupar les identitats en les "carpetes" designades (Grups, Empreses, Plugins).
- **Fase B**: Injectar la `UniversalPage` dins del component `DetallAjust.jsx` (Columna 3), connectant l'avatar actiu i el nom directament a la Barra Taronja.
- **Fase C**: Adaptar els atributs de la Columna 2 perquè funcionen com a "blocs" o "camps" que construeixen aquesta pàgina.

*Estat: visió validada per la IAIA MarIA, pendent d'execució pas a pas.*

## Vincles

- [[00_index]]
- [[estandard_ui_universal]]
