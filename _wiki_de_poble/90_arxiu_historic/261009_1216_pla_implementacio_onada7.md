---
type: document
status: esborrany
description: Pla per a refactoritzar 5 mòduls en plugins per a resoldre la restricció de pes del nucli
tags:
  - implementacio
visibility: private
reflex: sdp:torn_4d1d44af-8286-4322-9e8c-ffd703d67657:697bff2b-a955-448a-b654-997507594099
---
# Pla de l'Onada 7: Arquitectura sdp.modul.v1

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4d1d44af-8286-4322-9e8c-ffd703d67657:697bff2b-a955-448a-b654-997507594099 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T10:02:53.029Z |
| Modificació | 2026-10-09T10:02:53.029Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (MarIA) |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-09T10:02:53.029Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

L'objectiu principal de l'Onada 7 és alleugerir el nucli de l'aplicació, el qual actualment supera el límit estricte de 1.59MB imposat per les directives de rendiment i eficiència termodinàmica.

S'aplicarà una refactorització profunda extraient cinc funcionalitats importants del nucli i convertint-les en connectors autònoms sota la nova arquitectura `sdp.modul.v1`:
1. **Gestoria:** Tot el panell d'administració, la caixa forta (Cofre) i l'històric.
2. **Rebost:** La gestió de l'inventari i productes de llarga durada.
3. **Salut (Consola):** Les eines de diagnòstic, auditoria (mapa consola) i laboratori.
4. **RSS / Mur:** La sincronització i visualització de notícies i avisos asíncrons.
5. **TPV (Loiverse Clon):** La interfície de venda en mode bar i mode botiga.

Cada un d'aquests mòduls s'empaquetarà com un connector dinàmic separat que només es carregarà quan l'usuari el sol·licite o accedisca a la seua ruta específica, aprimant significativament el `main.jsx` i el pes total descarregat en l'arrencada de Sóc de Poble.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Reducció de Pes:** El procés de *build* (`npm run build`) ha de generar un _bundle_ principal inferior al límit innegociable de 1.59MB.
2. **Càrrega Diferida Funcional:** Es verificarà que l'accés a les rutes de Gestoria, TPV, Rebost, etc., carrega el connector dinàmic correctament i sense errors d'hidratació.
3. **Independència del Nucli:** Els mòduls extrets no han de deixar codi residual ni dependències (com llibreries específiques de criptografia o formats complexos) encadenades al *bundle* del nucli.
4. **Validació Tècnica:** La suite de tests haurà de continuar completament verda després de la mutació arquitectònica.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Parpelleig o Latència (FOUC / Suspense):** La càrrega sota demanda pot induir petits retards. S'haurà d'implementar un `Suspense` bonic, idealment utilitzant patrons de Pedra Seca, perquè la interacció siga impecable.
2. **Dependències Redundants:** Si Vite no optimitza correctament l'extracció, podríem acabar duplican codi comú entre plugins (com la maquinària de components de Pedra Seca). Caldrà assegurar-se de configurar Vite correctament per al tractament d'aquests paquets externs.
3. **Pèrdua de Funcionalitats en Passos de Props:** Separar els mòduls del context global del nucli pot desconnectar l'estat o l'accés als recursos globals si no es fa seguint un bon disseny de la interfície de cada plugin (`sdp.modul.v1`).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
