---
type: document
status: esborrany
description: Estratègia d'onboarding per a usuaris no registrats amb un xat simulat
tags:
  - saber
visibility: private
reflex: sdp:torn_f7f04f6a-c286-449e-a999-f61d450419a1:3f0447ef-5931-4a55-96d0-3671c8d00026
---
# Onboarding Fake Chat (La Il·lusió)

**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

<!-- SDP:SECTION brainstorming.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f7f04f6a-c286-449e-a999-f61d450419a1:3f0447ef-5931-4a55-96d0-3671c8d00026 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T10:10:25.509Z |
| Modificació | 2026-09-29T10:10:25.509Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/brainstorming.md (v2.0.0) |
| Model IA | MarIA |
| Tokens consumits | Mesura no disponible |

<!-- SDP:SECTION brainstorming.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/brainstorming.md; SHA-256 a3f04b3519d11ec97c049b004f018989389e2a29d2f47298445153511b7fbc82. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION brainstorming.s3 -->
## Historial

2026-09-29T10:10:25.509Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION brainstorming.s4 -->
## Contingut

### Problema o Oportunitat
Quan un usuari no registrat ("foraster") entra a l'aplicació per primera vegada, es troba amb una pàgina buida o un simple botó de "Connectar" / "Entrar per buscar persones". Això oculta l'essència del projecte: Sóc de Poble és un clon d'un xat modern. Si no hi ha vida, l'usuari no entén de què va la plataforma i pot marxar sense ni tan sols registrar-se. Necessitem un efecte "WOW" inicial que mostre la plataforma viva sense necessitat d'estar registrat.

### Exploració d'Idees: La Il·lusió del Xat
- **Crear un "Fake Xat" (La Il·lusió):** En lloc de mostrar el xat buit per a usuaris no autenticats, pintem per damunt una capa o component "Mock" (Fictici).
- Aquest component mostrarà una llista de converses falses pre-emplenades (per exemple, amb els nostres agents d'IA, "Sóc de Poble" i la "IAIA MarIA").
- **Interactivitat Limitada (Efecte Cebo):** El xat pareix 100% autèntic. Quan l'usuari fa clic en una d'eixes converses, s'obri la vista de missatges normal i pot inclús intentar escriure, però l'Agent respondrà automàticament (o eixirà un diàleg emergint del propi xat): *"Hola, estem en proves! No puc parlar amb tu si no et registres. Entra per parlar amb mi."*
- Aquesta opció és completament independent de la lògica de base de dades. Només és una capa UI (`FakeChatOnboarding.jsx`) que es destrueix o s'amaga completament quan detecta que hi ha una sessió activa.

### Avantatges d'esta aproximació (Model B / Enxufabilitat)
1. **No toca el backend:** Zero lògica complexa de seguretat o permisos forasters a Supabase.
2. **Alta conversió:** Genera curiositat i demostra immediatament l'experiència d'usuari de l'app.
3. **Fàcil de mantenir:** Com que aprofita els components visuals existents del xat però amb dades dures (mock), només cal injectar l'estat local inicial en aquesta vista.

### Següents Passos
1. Validat pel Mestre com a idea mestra pel futur proper.
2. Es dissenyarà quan finalitze l'Auditoria de Fortificació actual de Codex.

<!-- SDP:SECTION brainstorming.s5 -->
## Verificació

- **Aprovació:** La idea ha estat confirmada i està a l'espera de priorització en el Full de Ruta (després de consolidar l'Onada Final).

<!-- SDP:SECTION brainstorming.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
