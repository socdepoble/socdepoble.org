---
type: skill
name: core-higiene-escriptori
prioritat: 1
description: Usa-la abans de crear un prompt, una petorreta, un pla o una auditoria, i quan l'Escriptori estiga brut o el Mestre demane netejar-lo. L'orquestradora el neteja en el mateix torn amb la porta Olivera.
status: actiu
tags: [govern]
triggers_on:
  - petorreta
  - prompt per a
  - crear prompt
  - pla d'implementació
  - escriptori brut
  - escriptori net
  - neteja l'escriptori
  - higiene
  - classificacio de documents de treball
version: 3.1.0
---

# Higiene de l'Escriptori

Definició única (AGENTS §0.1): l'Escriptori està net quan `npm run porta:olivera` ix amb 0. Vol dir Safata d'Entrada buida, cada document solt del primer nivell ancorat a `00_index_escriptori.md`, cap àncora a un document absent i cap document de torn consumit fora de «## Activitat en curs». Net no vol dir buit (AGENTS §12).

## Qui la fa

L'orquestradora (MarIA) o el Mestre. Claude i Codex no poden moure fitxers. La neteja es fa abans d'escriure el prompt o el pla, no dins del prompt.

## Procediment: reflexiona → observa → actua → verifica → informa

0. **L'Acte Reflex Pre-Arxivament (L'Aturada de Seguretat):** Abans de fer l'acció d'arxivar cap fitxer o netejar l'Escriptori, és obligatori fer-te esta pregunta: *«Hi ha alguna tasca pendent? Algú altre (un altre agent com Codex/Claude o el Mestre) encara necessita llegir aquest informe o prompt?»*. Fes un cop d'ull ràpid al context. Si hi ha un flux pendent que requereix el fitxer (ex: «llança-li-ho a Codex quan acabe Claude»), atura't absolutament. No arxives res fins que la dependència siga resolta.
1. **Observa:** `npm run porta:olivera`. És el mode informe: no llig stdin ni mou res. El mode hook necessita `--hook` i un payload.
2. **Decidix el que viu:** tot document que ha de continuar s'ancora a `00_index_escriptori.md` davall d'una capçalera `## Activitat en curs`. La porta el conserva siga del dia que siga, i l'informe llista els declarats vius.
3. **Actua:**
   - Consumits de jornades anteriors: `npm run olivera:arxiva`.
   - Consumits d'avui: `node tooling/gates/porta-olivera.mjs --arxiva --nom FITXER.md`, primer amb `--sec` per a vore què mouria. Per nom només ixen documents solts del primer nivell amb categoria de torn.
   - Amb rebut de torn: després del trasllat, `node tooling/wiki/document.mjs handoff --turn-id ID --file ORIGEN --to DESTÍ`.
   - Àncores a documents absents (`- [[nom]]` sense `/` que no és a la taula): si el document és a l'arxiu, lleva la línia; si viu en una subcarpeta, escriu `[[02_investigacio_ia/nom]]`; si és una acta, `[[../10_actes/nom]]`.
   - Safata d'Entrada: classifica o arxiva cada element fins que quede buida.
4. **Verifica:** `npm run porta:olivera` ix amb 0 i `npm run porta:orfandat` no puja orfes.
5. **Informa:** una línia al Mestre amb el que has mogut, el que has conservat i per què.

## Límits

`01_produccio/` i `02_investigacio_ia/` queden fora: la porta només veu el primer nivell de l'Escriptori. `--arxiva` trasllada i mai sobreescriu ni esborra. Pares i preguntes al Mestre només si caldria tocar `01_produccio/` o `02_investigacio_ia/`, esborrar un fitxer, o si la mateixa acció falla dues vegades (AGENTS §10).

## Lliçons del Mestre

- **260929 · La neteja és acció de l'orquestradora.** Quan l'Escriptori està brut, MarIA l'arxiva amb la porta, verifica el verd i després escriu el prompt.
- **260924 · Arxivar i despenjar l'àncora són un sol acte.** `--arxiva` fa les dues coses en la mateixa passada.
- **260924 · Una àncora pot ser l'únic fil que sosté un document.** Abans de llevar-la, mira on viu el fitxer.
- **260930 · L'Acte Reflex Pre-Arxivament.** Mai més arxives un informe acabat de generar si saps que el següent pas era enviar-lo a un altre agent (ex. Codex). Si ho fas, li furtaràs el document mentre el llig. L'orquestradora no tanca la porta de la sala fins que tots els obrers n'han eixit.

## Vincles
- [[00_INDEX_SKILLS]]

## Preflight mecànic de convocatòries

`document.mjs context` i `create` per a `prompt.local` o `prompt.consell` comproven la taula abans d'emetre un rebut nou. Si fallen, resol la classificació amb la porta; el rebut no substituïx la higiene. Les auditories poden documentar una taula bruta. Un document solt creat pel circuit queda declarat viu a «## Activitat en curs» fins que l'orquestradora decidisca el seu relleu.

Una prova de diagnosi etiquetada `[DEFECTE]` pot passar perquè reproduïx el defecte: registra-la com a deute confirmat, no com a reparació. L'informe d'higiene ha de comprovar una taula i un índex existents; zero documents sobre una arrel absent no és verd.
