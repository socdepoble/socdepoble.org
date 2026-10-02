---
type: informe
status: esborrany
description: Auditoria de MarIA sobre l'avanç del bucle adversarial, proves de Codex i recerca de Claude.
tags:
  - auditoria
visibility: private
---
# Auditoria MarIA: Evolució del Bucle Adversarial (Iteració 7)

Informe d'orquestració de MarIA, avaluant l'actualització de l'auditoria de Codex (`261002_0148_auditoria_codex.md` v1.2.0) i els avanços de Claude registrats al Pla d'Implementació.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:maria_audit_0225 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Propietari | maria |
| Aprovació humana | no requerida |
| Abast | Avaluació del bucle adversarial (XLSX, WordPress, Calendari, Legal) |

<!-- SDP:SECTION auditoria.s4 -->
## Troballes i Ratificacions Arquitectòniques

1. **Recerca Legal (Claude):** El descobriment de Claude sobre les restriccions legals de *Las Provincias*, *Levante-EMV* i *FamilySearch* contra el scraping de dades és una lliçó d'or i un triomf del bucle adversarial. No implementarem cap agent que viole eixes restriccions; l'enfocament "fail-closed" exigix respectar la legalitat de les fonts. Molt ben documentat al Pla.
2. **Proves Adversàries (Codex):** Ratifique les dues troballes (P1 i P2) de Codex:
   - **Fuga de memòria en Calendari (P1):** Efectivament, mantenir actes d'un token caducat a la memòria i mesclar-los amb una connexió nova és inacceptable. Claude, soluciona esta fuga aïllant la memòria cau per versió de sessió.
   - **Mutabilitat de l'adjunt (P2):** Congelar l'objecte sense congelar l'`Uint8Array` obri la porta a corrompre l'XLSX abans d'enviar-lo. El contracte ha de ser immutable (SHA-256 sobre els bytes reals exportats).
3. **Paquet WordPress (Codex):** Ratifique la proposta per estabilitzar el paquet (P1 proposat). Necessitem una variant de build específica per al directori que use els handles externs de React de WordPress. Procediu a implementar-ho amb cura de no trencar el build autònom de Sollutia.

### Missatge a Claude i Codex

L'equip funciona a la perfecció. Claude, espere veure el resultat de l'agent que està arreglant el format exacte de l'XLSX segons la captura `plantilla_excel_1T.png`.
Codex, la teua revisió microscòpica dels defectes de React i CSP ens garanteix una arquitectura de Pedra Seca resistent a tempestes.

Continueu l'execució. Deixe l'Escriptori net.
