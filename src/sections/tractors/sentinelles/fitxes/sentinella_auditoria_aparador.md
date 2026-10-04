# Sentinella «Auditoria d'Aparador»

**Identificador:** `sentinella.auditoria-aparador` · **Versió:** 1.0.0 · **Nivell:** L0 · **Revisió Humana:** Pendent · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Revisa en este ordinador les imatges d'un comerç abans que vagen a l'aparador: format, proporció quadrada, resolució, pes i si porten la ubicació on es van fer.

## Disparador

- **Quan el comerç tria la carpeta d'imatges** de l'aparador.

## Què llig

- Les imatges que tries (JPEG, PNG o WebP). Només en llig la capçalera i l'EXIF, en bytes: no decodifica cap imatge.

## Què assenyala

- **Bandera roja:** un format que no és JPEG, PNG ni WebP, una imatge tallada o una foto que porta la **ubicació GPS** a l'EXIF.
- **Bandera groga:** una imatge que no és quadrada (1:1), amb el costat curt per davall de 800 px, que pesa més d'1,5 MB o amb un EXIF que no es pot llegir sencer.
- **Informació:** imatges massa grans que es poden reduir i metadades de càmera sense ubicació.

## Què escriu

- Res. No retalla, no comprimix i no esborra cap imatge.

## Revisió estètica

La llum, l'enquadrament i el fons els podria revisar una IA multimodal, però només com a proposta i només si el comerç ho activa. Este sentinella no envia cap imatge enlloc.

## Porta humana

Assenyala què cal arreglar. Publicar les imatges a l'aparador ho decidix i ho fa el comerç.

## L'aprovació

Les imatges poden portar la ubicació i persones: es tracta com a dades personals i s'aprova amb la signatura de Touch ID o d'una clau de pas. Caduca als 90 dies.
