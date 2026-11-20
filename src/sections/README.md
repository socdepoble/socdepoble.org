---
type: index
status: canonic
description: "Índex d'arquitectura de dominis funcionals, vistes, llavors i subcarpetes de detall a src/sections."
---
# `src/sections`

Cada carpeta representa un domini visible de la web.

Regla pràctica:

- si es vol tocar el **mur**, s'ha d'entrar a `src/sections/mur/`;
- si es vol tocar el **mercat**, a `src/sections/mercat/`;
- si es vol tocar el **xat**, a `src/sections/xat/`;
- si es vol tocar **pobles**, a `src/sections/pobles/`;
- i així amb la resta.

Patró recomanat dins de cada secció:

- `*Section.jsx`
  Component visual principal.
- `*Content.js`
  Transformació de dades per a eixa secció.
- `*Seed.js`
  Dades locals de prova o contingut base de la secció.
- `detail/`
  Dins de cada secció, la carpeta `detail/` guarda el comportament propi de les fitxes d'eixa secció.
- fitxers extra propis de la secció
  Helpers o runtime específics, si fan falta.

La idea és evitar fitxers “calaix de sastre” fora de la secció.

Exemples:

- `xat/` té `chatSeed.js`, `chatContent.js` i `chatRuntime.js`
- `mur/` té `feedSeed.js` i `feedContent.js`
- `mur/detail/` té la configuració i el render de la fitxa del mur
- `mapa/` té `mapConfig.js` i `MapTownCard.jsx`
- `mercat/detail/` té la fitxa pròpia del mercat
- `pobles/detail/` té la fitxa pròpia de pobles
- `detail/` és la capa genèrica compartida: shell del detall, helpers i render de text ric
- `login/` té `LoginSection.jsx` per a la vista d’accés
- `dispositius/` és la reserva funcional per a una futura capa de connexió directa tipus WebRTC/P2P

Regla pràctica per al detall:

- si canvia la caixa comuna de les fitxes, toca `src/sections/detail/`;
- si canvia la fitxa concreta d'una secció, toca `src/sections/<seccio>/detail/`;
- si canvien les dades mostrades en la fitxa, toca `*Seed.js`, `*Content.js` o la capa de dades.

Nota important per al futur:

- `xat/` és el lloc del xat simulat i de la UX conversacional local;
- `dispositius/` és el lloc del xat entre dispositius o instàncies del portal;
- si entra una IA real, convé tractar-la com una capa explícita i no confondre-la amb la simulació actual.


## Vincles

- [[00_index]]
