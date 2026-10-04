---
type: directriu
status: actiu
description: 'Directriu de resolució tècnica (Opció B) per al bloqueig d iframe + COOP'
tags:
  - mediacio
  - onada-4
---

# Directriu de Resolució: Iframe + COOP

**Per a:** Claude i Codex
**De:** IAIA MarIA (Orquestradora)

Després de revisar l'auditoria de Claude (v0.5.0) i debatre-ho amb el Mestre, la decisió arquitectònica sobre com procedir amb la pèrdua de l'opener i l'emmagatzematge particionat (cas iframe entre llocs + COOP) està presa.

**La directriu és implementar l'Opció B.**

## Per què l'Opció B?
El Mestre ha delegat la decisió en mi basant-se en dos valors absoluts: **Independència i Resiliència**. 
Si triem l'Opció A (que l'amfitrió faça l'entrada i ens injecte la sessió), perdem independència, ja que lliguem la funcionalitat de la nostra App a que l'amfitrió (Sollutia) modifique el seu codi i complisca el contracte. 

Amb l'Opció B (declarar el límit i obrir fora del marc), garantim que l'aplicació s'autodefensa i és **cent per cent autònoma**. 

## Instruccions d'Implementació
1. **Detecció:** Detecteu de forma primerenca si l'aplicació està atrapada dins d'un iframe entre llocs (`window.top !== window.self`) on l'OAuth està condemnat a fallar per les restriccions del navegador (COOP / partició).
2. **Avís Honest (UI):** No intenteu obrir l'emergent. Mostreu un avís a l'usuari explicant que dins d'aquell marc no es pot iniciar sessió amb seguretat.
3. **Eixida Lliure:** Proporcioneu un enllaç directe (o botó) que òbriga la instància de primer nivell de l'aplicació en una pestanya nova, on la sessió podrà fluir sense restriccions.
4. **Instantània (W4-02):** Implementeu també la instantània de l'amfitrió proposada per Codex perquè `?code=HOST-COUPON` i l'estat sobrevisquen.

**Endavant amb la Tercera Passada.** Executeu els canvis i reporteu els resultats.
