---
type: document
status: esborrany
description: Actualització del pla per connectar Tauler i Full Trimestral sense OCR.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_33788a4e-9495-4037-919b-1b5672b5034d:c49ca0b0-e0ce-457f-8a0e-1d4f5b203df3
---
# Pla Gestoria V2 (Corregit per Autòpsia)

**Estat del Pla:** [aprovat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_33788a4e-9495-4037-919b-1b5672b5034d:c49ca0b0-e0ce-457f-8a0e-1d4f5b203df3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T12:03:58.239Z |
| Modificació | 2026-10-12T12:03:58.239Z |
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

2026-10-12T12:03:58.239Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

L'autòpsia prèvia ha revelat deficiències en l'enfocament inicial. Les modificacions exactes seran:
1. **Connexió Shell-Tauler i Elevació d'Estat:** La proposta del Full viu tancada dins de `PanellGestoria`, de manera que la closca no té d'on traure les factures només tocant la línia 152. Cal elevar o transmetre aquest estat. El cablejat mínim necessari afecta 5 fitxers: `targetesTauler.js`, `useGestoria.js`, `PanellGestoria.jsx`, `ContenidorGestoria.jsx` i `ShellGestoria.jsx`.
2. **Sincronització de Trimestre:** El Tauler calcula per defecte el trimestre actual (4T), però el Full prepara el 3T. Si no es passa el paràmetre `periode` explícitament al Tauler des del Full, el 303 eixirà buit. Aquest paràmetre s'ha d'afegir a la comunicació.
3. **Tractors afectats:** Modificar la closca i el Tauler alterarà l'empremta dels tractors `gestoria.tauler`, `gestoria.factures`, `gestoria.correus` i `gestoria.historic`. Les seues aprovacions tornaran a "pendent" i exigiran la signatura Touch ID del Mestre.
4. **Gestió de PDFs/PNGs:** Prohibit integrar OCR o dependències externes. Els PDFs ja s'extrauen; per a les fotos de factures s'ha d'usar el flux de "factura fotografiada, cal completar-la a mà" via el botó "Afig una despesa".

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Verificar que les targetes del Tauler reben efectivament l'array de `factures` i desapareix l'avís "El Tauler encara no rep les factures del full trimestral".
- Validar que l'extracció manual d'imatges és fluïda.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Pèrdua de signatures:** En tocar els tractors, s'invalidarà la seua signatura criptogràfica (Touch ID). S'avisa al Mestre.
- **Falses alarmes superades:** No hi ha risc de data límit; el 3T es tanca el 20 d'octubre, no hui dia 12. Tampoc intentarem llegir `_comunicacio_de_poble` perquè exigiria aprovar un tractor sencer nou.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
