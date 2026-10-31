---
type: norma
status: esborrany
description: Proposta de servei de traducció i contracte observat en Ronda 1
---
# ADR-2026-14 — Servei lliure de traducció sobirana

## Estat

**Esborrany, no vigent.** Proposta pendent de decisió humana i de verificació
de desplegament. No consta cap acta ni signatura del Mestre que aprove esta ADR.
El proveïdor (Apertium, LibreTranslate, DeepL o MyMemory) i el consentiment de
cada canal els decidix el Mestre; este document no els tria.
Data de contrast: 31-10-2026, Ronda 1 `dea840764`.

## Context i implementació observada

El client `src/data/traductor.js` usa la RPC/funció de traducció del servidor
quan està configurada, i `src/data/traductorLliure.js` proporciona el transport
alternatiu. El hook `useTraduccioPagina.js` coordina els fragments i la memòria
cau de cada pàgina. L'existència del codi no acredita un servei remot desplegat
ni la disponibilitat, quota o condicions actuals d'un proveïdor.

Apertium i LibreTranslate són opcions per a un servei lliure autogestionat.
MyMemory és un servei extern diferent: no es presenta com a motor lliure propi.
L'ús d'un proveïdor extern envia els fragments a eixe proveïdor; cap afirmació
de sobirania pot ocultar este recorregut. Cal verificar els consentiments i
l'abast de les dades abans d'habilitar-lo en cada canal.

## Contracte temporal i límits observats

- `traductor.js`: límit client de 40 s per a la crida al servidor.
- `traductorLliure.js`: 12 s per crida i 30 s per lot.
- MyMemory: fragments de fins a 450 **bytes UTF-8**, no 450 caràcters.
- `wordpress-plugin/includes/traduccio.php`: la petició DeepL té límit de 15 s.

Estos límits corresponen a peces diferents. No són una garantia de temps de
resposta del servei remot. Les proves locals usen respostes injectades.

## Proposta pendent

Desplegar i operar un servei Apertium o LibreTranslate propi, fixar-ne origen,
política de dades, pressupost, llengües i disponibilitat, i publicar evidència
d'una prova d'integració abans de presentar-lo com a actiu. Cal mantindre el
text original i un error explícit quan la traducció no està disponible.

## Canals i privacitat

La presència del hook web i del plugin WordPress no demostra activació general
en tots els canals. Una ruta pública no es pot declarar privada pel seu nom:
l'abast real depén de la configuració i dels controls de cada vista. Cap fragment privat ha d'enviar-se per inferència.

## Decisió i validació pendents

El Mestre ha de resoldre el proveïdor i el desplegament. Després cal assajar
els canals web i WordPress amb xarxa real autoritzada, revisar consentiment,
errors, límits i cancel·lació, i anotar l'acta de decisió i les proves.
Este document no tanca P2-13 ni substituïx eixa aprovació.

## Vincles

- [[00_index]]
- [[00_index_maquina]]
