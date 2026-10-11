---
type: document
status: esborrany
description: Pla per analitzar i millorar la subvenció del FICIV amb Claude
tags:
  - implementacio
visibility: private
reflex: sdp:torn_39e9e0e0-9f43-4a07-aa77-4a250239504f:a774d566-0bb9-4dbc-aba7-517f2df6093d
---
# Pla Implementació FICIV

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_39e9e0e0-9f43-4a07-aa77-4a250239504f:a774d566-0bb9-4dbc-aba7-517f2df6093d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T11:14:56.118Z |
| Modificació | 2026-10-11T11:14:56.118Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-11T11:14:56.118Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Objectius Generals
L'objectiu d'aquest pla és ajudar a Carmen Chaves, subdirectora del FICIV (Festival Internacional de Cine Infantil de València), a preparar, polir i optimitzar la seua sol·licitud de subvenció. Ens enfrontem a un entramat burocràtic (`convocatoriafes202629661cas.pdf`, `nota-informativa-festivalescas26.pdf`) que dificulta l'obtenció d'aquesta vital ajuda.

### Accions per a Claude
1. **Analitzar la Burocràcia:** Claude ha d'estudiar detingudament les bases i el sistema d'autobaremació (`01 AUTOBAREMO FESTIVALES_CAS.pdf`) per extreure les regles del joc de la institució.
2. **Revisar l'Esborrany de Carmen:** Es llegiran i avaluaran els documents que ella ha redactat (`Memoria actuación 2026.pdf` i `HojademéritosFiciv2026.pdf`), assenyalant què sobra, què falta, i oferint consells per millorar la puntuació.
3. **Pla Pressupostari (Hoja de cálculo):** Convertir el PDF `00 Ficha Presupuestaria FES CIN JOR CON GOY ASO_CAS_signed.pdf` (una espècie de pla pressupostari) a un format tabular/Excel, permetent projectar diferents escenaris econòmics per optar a la subvenció amb màxima seguretat.
4. **Resolució de Documents Administratius:** Donar indicacions clares sobre com emplenar l'`00 ANEXO ANNEX I - SOL FEST CCLUB JOR CON GOY ASO 14651-01.pdf` i qualsevol altre document en blanc de la carpeta `A presentar`.

### Rol de MarIA
MarIA subministra aquest pla i la carpeta a Claude via el `prompt_claude_ficiv.md`, i farà el seguiment del resultat de l'auditoria per traslladar-lo al Mestre.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Claude generarà un informe d'auditoria detallat on es verificaran:
1. Punts forts i febles de la memòria de Carmen comparada amb l'autobarem.
2. Una estructura tabular per al pla pressupostari que acomplisca els criteris tècnics.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Els documents institucionals solen ser confusos de forma intencionada per a dificultar el tràmit; pot caldre una lectura molt minuciosa.
- Perdre el context o desviar-se del to institucional que requereix aquest tipus de procediment.
- Com que els PDFs són pesats i nombrosos, la IA que els analitze pot perdre context; per això s'han preparat indicacions estrictes.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
