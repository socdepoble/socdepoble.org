---
type: document
status: actiu
description: "Font, derivació, comprovació i condicions de reutilització del nomenclàtor de l'INE (8.132 municipis a 1 de gener de 2026) que carrega el cercador de municipis de la fitxa."
---
# Nomenclàtor de municipis d'Espanya (INE, 1 de gener de 2026)

El fitxer `municipis_ine_2026_espanya.v1.json` és la llista oficial dels **8.132 municipis** de les **52 províncies** d'Espanya, derivada de la relació de l'Institut Nacional d'Estadística. L'App el carrega en un tros diferit (`import()` dinàmic de `src/sections/pobles/nomenclatorIne.js`) només quan la persona escriu al cercador de municipis de la seua fitxa: no pesa res al paquet d'entrada.

## Font

- **Organisme:** Instituto Nacional de Estadística (INE).
- **Publicació:** «Relación de municipios y sus códigos por provincias», relació a 1 de gener de 2026, fitxer «Municipios por provincia con sus códigos».
- **Pàgina:** https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177031&menu=ultiDatos&idp=1254734710990
- **Fitxer original:** https://www.ine.es/daco/daco42/codmun/26codmun.xlsx (318.222 B; SHA-256 `b4bea7c3cc1b295a73f7fa3ca68b2ef25c3a59833bd91ea5315ae25dcc1ca741`).
- **Data de referència:** 1 de gener de 2026.

## Derivació

- **Fitxer derivat:** `municipis_ine_2026_espanya.v1.json` (235.377 B; SHA-256 `0d50fbbc53f47efcba2c6c440b2fdb692ad9d3d6b1672a958e7615500054c67d`).
- **Forma:** columnes paral·leles `ine` (codi de 5 xifres: província + municipi), `nom`, `prov` (índex de `provincies`) i `variants`.
- **Nom visible:** la primera forma dels noms oficials bilingües («Alacant/Alicante» → «Alacant») i l'article al davant («Campello, el» → «El Campello»). El nom oficial sencer i l'altra forma es conserven a `variants`, i el cercador els llig.
- **Comprovació (10-11-2026):** els 8.132 codis coincidixen un a un amb els 52 fulls de l'original, cap codi es repetix, cada municipi és en el full de la seua província i el nom oficial de cada fila és al `nom` o a les `variants`.
- **Homònims:** 17 noms es repetixen en províncies diferents (Cabanes, Sada, Torrent, Arroyomolinos…). El selector els mostra amb la província entre parèntesis.

## Condicions de reutilització

- **Marc legal:** la reutilització de la informació del sector públic estatal es regix per la Llei 37/2007, de 16 de novembre, i el Reial decret 1495/2011.
- **Avís legal de l'INE:** https://www.ine.es/ss/Satellite?L=0&c=Page&cid=1254735849170&p=1254735849170&pagename=Ayuda%2FINELayout. Permet la reutilització, també comercial, de la informació que té l'INE com a font original amb aquestes condicions: no desnaturalitzar-ne el sentit, citar la font, indicar la data de l'última actualització i no suggerir que l'INE patrocina o avala la reutilització. Per a dades tractades proposa la cita «Elaboración propia con datos extraídos del sitio web del INE: www.ine.es».
- **Peu del web de l'INE:** el text declara el lloc i el seu contingut sota la llicència CC BY-SA 4.0, però l'enllaç d'eixe mateix text porta a la pàgina de CC BY 4.0 (contradicció observada pels verificadors de R16a el 10-11-2026). Amb quina llicència es redistribuïx este JSON derivat en un repositori públic (i si s'hi aplica el ShareAlike) és una decisió del Mestre que queda pendent.
- **Atribució a la interfície:** el cercador de municipis de la fitxa porta, en les 5 llengües, la cita (en valencià) «Font: elaboració pròpia amb dades de l’INE (www.ine.es), relació de municipis a 1 de gener de 2026.» (`section.onboarding.identitatPoble.fontIne`).

## Recompte per província

| Codi | Província (nom oficial de la font) | Municipis |
|---|---|---|
| `01` | Araba/Álava | 51 |
| `02` | Albacete | 87 |
| `03` | Alicante/Alacant | 141 |
| `04` | Almería | 103 |
| `05` | Ávila | 248 |
| `06` | Badajoz | 165 |
| `07` | Illes Balears | 67 |
| `08` | Barcelona | 311 |
| `09` | Burgos | 371 |
| `10` | Cáceres | 223 |
| `11` | Cádiz | 45 |
| `12` | Castellón/Castelló | 135 |
| `13` | Ciudad Real | 102 |
| `14` | Córdoba | 77 |
| `15` | A Coruña | 93 |
| `16` | Cuenca | 238 |
| `17` | Girona | 221 |
| `18` | Granada | 174 |
| `19` | Guadalajara | 288 |
| `20` | Gipuzkoa | 88 |
| `21` | Huelva | 80 |
| `22` | Huesca | 202 |
| `23` | Jaén | 97 |
| `24` | León | 211 |
| `25` | Lleida | 231 |
| `26` | La Rioja | 174 |
| `27` | Lugo | 67 |
| `28` | Madrid | 179 |
| `29` | Málaga | 103 |
| `30` | Murcia | 45 |
| `31` | Navarra | 272 |
| `32` | Ourense | 92 |
| `33` | Asturias | 78 |
| `34` | Palencia | 191 |
| `35` | Las Palmas | 34 |
| `36` | Pontevedra | 61 |
| `37` | Salamanca | 362 |
| `38` | Santa Cruz de Tenerife | 54 |
| `39` | Cantabria | 102 |
| `40` | Segovia | 209 |
| `41` | Sevilla | 106 |
| `42` | Soria | 183 |
| `43` | Tarragona | 184 |
| `44` | Teruel | 236 |
| `45` | Toledo | 204 |
| `46` | Valencia/València | 266 |
| `47` | Valladolid | 225 |
| `48` | Bizkaia | 113 |
| `49` | Zamora | 248 |
| `50` | Zaragoza | 293 |
| `51` | Ciudad Autónoma de Ceuta | 1 |
| `52` | Ciudad Autónoma de Melilla | 1 |
| **Total** | **52 províncies** | **8.132** |

## Vincles

- [[00_index]]
