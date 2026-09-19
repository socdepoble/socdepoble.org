---
type: document
status: esborrany
description: "Visió Arquitectònica: El Perfil com a Pàgina Universal"
tags:
  - identitat
---
\n# Visió Arquitectònica: El Perfil com a Pàgina Universal

Aquest document recull la visió de producte establida pel Mestre per a la secció "El meu perfil". El perfil deixa de ser un formulari estàtic d'ajustos per a convertir-se en una instància nativa de la **Pàgina Universal**, establint un paral·lelisme directe amb el Bloc de Notes i l'edició de notícies.

## 1. El Paral·lelisme (Notes vs. Perfil)

L'arquitectura visual i d'interacció ha de ser idèntica a la d'un editor de contingut:

| Bloc de Notes | El Meu Perfil |
| :--- | :--- |
| **Columna 1 (Carpetes)**: Llibres o seccions de notes | **Columna 1 (Identitats)**: Carpetes per Identitat Personal (Javi Llinares), Grups, Empreses, Plugins i Utilitats. |
| **Columna 2 (Llista)**: Llista de notes dins d'una carpeta | **Columna 2 (Atributs)**: Llista de camps a editar (Nom, Foto, Correu, Estat). Açò determina què s'inclou o no en la pàgina de perfil. |
| **Columna 3 (Editor)**: Universal Page amb barra taronja per editar la nota | **Columna 3 (Pàgina de Perfil)**: Universal Page amb barra taronja per editar la fitxa del perfil. |

## 2. La Barra Taronja en l'Edició de Perfil

Quan un usuari edita la seua foto de perfil o qualsevol altre atribut, el component que visualitzarà aquest canvi de forma nativa és la **Barra Taronja** (part superior de la Universal Page), ja que actua com a editor de la pròpia "Card Universal del Perfil". 

La targeta resultant (el perfil públic) no és més que una "Universal Card" generada a partir d'aquesta "Universal Page".

## 3. Desplegament de la Targeta Universal (El Cercador)

Com que el perfil és una Pàgina Universal, es materialitza cap a l'exterior com una **Targeta Universal** estàndard, complint tota la seua anatomia: foto, **boina taronja** (autoria/creació), títol, subtítol, presentació, i **peu blau** (accions).

Aquesta targeta és el que es mostrarà en la resta de l'aplicació. Per exemple, **al Cercador**: en buscar "Javi Llinares", el sistema no ha de retornar una llisteta simple amb un nom, sinó que ha de renderitzar la Targeta Universal completa de Javi Llinares, i en fer-hi clic, eixa targeta et portarà a la seua Pàgina Universal. Un comportament pur i fractal.

## 4. Pròxims Passos (Quan el Mestre done llum verda)

- **Fase A**: Reestructurar la Columna 1 (Facets de `UniversalManager` en `PerfilShell.jsx`) per agrupar les identitats en les "carpetes" designades (Grups, Empreses, Plugins).
- **Fase B**: Injectar la `UniversalPage` dins del component `DetallAjust.jsx` (Columna 3), connectant l'avatar actiu i el nom directament a la Barra Taronja.
- **Fase C**: Adaptar els atributs de la Columna 2 perquè funcionen com a "blocs" o "camps" que construeixen aquesta pàgina.

---
*Estat: Visió validada per la IAIA MarIA. Pendent d'execució pas a pas.*
