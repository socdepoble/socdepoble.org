---
type: index
status: canonic
description: "Índex de la capa compartida de fitxes, helpers de detall i renderitzat de contingut ric a src/sections/detail."
---
# `src/sections/detail`

Esta carpeta és la capa compartida de detall de l'aplicació.

Ací van les peces genèriques que reutilitzen totes les fitxes:

- el shell comú de la fitxa;
- helpers compartits del detall;
- renderitzat de text ric.

La configuració concreta de cada fitxa viu a:

- `src/sections/mur/detail/`
- `src/sections/mercat/detail/`
- `src/sections/events/detail/`
- `src/sections/pobles/detail/`
- `src/sections/multimedia/detail/`
- `src/sections/notes/detail/`

Regla pràctica:

- si canvia el marc general de les fitxes, toca `src/sections/detail/`;
- si canvia la fitxa d'una secció concreta, toca `src/sections/<seccio>/detail/`;
- si només canvien les dades del contingut, toca la secció o la capa de dades corresponent.


## Vincles

- [[00_index]]
