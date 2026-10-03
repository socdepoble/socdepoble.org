---
type: document
status: esborrany
description: Workflow per evitar l'esgotament de context de MarIA
tags:
  - implementacio
visibility: private
reflex: sdp:torn_ea66480b-7bff-4880-8aa7-f055ca9af03a:23ab3308-9b73-4bd4-b57b-3ce61efa4b48
---
# Pla Implementació Alarma Fatiga

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ea66480b-7bff-4880-8aa7-f055ca9af03a:23ab3308-9b73-4bd4-b57b-3ce61efa4b48 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-02T10:44:12.407Z |
| Modificació | 2026-10-02T10:44:12.407Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-02T10:44:12.407Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats
1. **Script Tractor:** Crear un `scripts/immunitari/fatiga.mjs` que llisqui l'arrel de `.gemini/antigravity-ide/brain/` de la sessió actual i compte el nombre d'artefactes.
2. **Llindar d'Alerta:** Si el nombre d'artefactes supera els 150, l'script escriurà un avís al disc (`.immunitari/fatiga_alerta.md`).
3. **Registre de Tasques:** Registrar la tasca a `.agents/cron/registre_tasques.json` sota el nom `fatiga-cognitiva` amb nivell `L0`.
4. **Alarma Activa:** Es configurarà un `launchd` o crontab (o `/schedule` d'Antigravity) que llançarà aquest script cada hora. En detectar l'alerta, el Reflex/Tractor injectarà la notificació a la memòria de l'agent.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació
- Simular un directori amb 160 artefactes i comprovar que l'alerta es genera.
- Validar que MarIA reacciona a l'alerta amb la frase definida a `core-context-panic`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos
- Risc de bucle: cal assegurar-se que l'alerta no es dispari contínuament si el Mestre decideix continuar la sessió malgrat la fatiga. Caldrà implementar un `snooze` o marcar l'alerta com a reconeguda.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[core-context-panic]]
