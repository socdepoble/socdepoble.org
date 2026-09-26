---
type: document
status: canonic
description: Descriu controls tècnics de seguretat i recuperació sense substituir la privacitat ni autoritzar mutacions.
tags:
  - maquina
aliases:
  - Seguretat d'execució
---
# Seguretat d'execució

Fitxa consultiva que separa la seguretat del producte (claus, integritat, errors de xarxa i recuperació) de la seguretat de l’agent quan toca fitxers o dades. Descriu controls, però no concedix cap permís: tota mutació passa pel Reflex de Petorreta.

## Naturalesa i autoritat

Esta pàgina és una **fitxa consultiva** de `02_saber`. No és una skill instal·lada ni una font de permisos. L’autoritat executiva viu a `AGENTS.md` i `.agents/` (skills i `PROTOCOL_PETORRETA.md`), i la privacitat a [[llei_05_privacitat]]. `04_escriptori`, `10_actes` i `90_arxiu_historic` són zones de cicle de vida, no fonts d’autoritat.

## Dos plans de seguretat

Cal separar:

1. **Seguretat del producte:** autenticació i RLS del servidor, xifratge, claus, integritat, recuperació i contenció d'errors.
2. **Seguretat de l'agent:** abast mínim, Petorreta, rebut, verificació, backup i reversió abans de mutar fitxers o dades.

Un control d'un pla no substituïx l'altre.

## Xifratge local i claus

L’arquitectura és online-first ([[ADR-2026-08-ONLINE-FIRST]]): les dades compartides i privades viuen al Supabase de Sóc de Poble, protegides per autenticació de servidor i RLS, i la memòria cau del navegador és opcional i no autoritativa. Si alguna vegada cal guardar al navegador una dada sensible, s'ha de protegir amb primitives de Web Crypto adequades al model d'amenaça.

- Deriva claus de contrasenya o PIN amb sal aleatòria, paràmetres versionats i un KDF disponible i revisat; `PBKDF2` és un mínim de compatibilitat, no una garantia universal.
- Usa xifratge autenticat, com AES-GCM, amb un nonce únic per operació.
- No guardes claus, PIN, tokens ni material de recuperació en text pla o en logs.
- La biometria pot desbloquejar una clau protegida per la plataforma; no s'ha de tractar com si fora directament material criptogràfic.
- Documenta rotació, pèrdua de clau i recuperació abans d'activar el control.

## Integritat de manifests i actualitzacions

Un manifest de build o d’actualització ha d'identificar el contingut que valida:

- identificador de build i versió de format;
- hash per artefacte o arrel verificable;
- versió mínima compatible;
- signatura amb una clau de publicació protegida quan el model d'amenaça ho exigix.

La verificació ha de ser fail closed davant una signatura, versió o hash invàlid. La data és metadada informativa i no substituïx el hash. Ed25519 és una opció quan la cadena de publicació i el client la suporten; no es declara implementada sense prova.

## Circuit breaker de xarxa i integracions

Davant corrupció, error criptogràfic, incompatibilitat de manifest o fallada repetida d’una crida al servidor o a la Frontissa de Sollutia (només lectura per GET, segons l’[[ADR-2026-09-SOLLUTIA-MODEL-B]]):

1. atura l’operació afectada;
2. conserva l’última còpia bona sense sobreescriure-la amb una resposta invàlida;
3. informa amb un error de xarxa honest, tranquil i accionable;
4. registra un error tècnic mínim, sense dades personals;
5. oferix reintent o recuperació només després de validar precondicions.

No ocultes una fallada d'auditoria darrere d'un estat «perfecte».

## Recuperació

Quan existisquen snapshots verificables, l'ordre segur és:

1. immobilitzar l'estat i identificar origen i versió;
2. validar integritat, compatibilitat i disponibilitat de claus;
3. restaurar en un espai temporal o transacció;
4. verificar invariants abans del canvi atòmic;
5. confirmar que el Supabase de Sóc de Poble torna a ser l’única font de veritat, sense perdre registres ni conflictes;
6. generar un registre tècnic redaccionat i provar la reversió.

Una còpia no és un backup fins que la restauració s'ha comprovat.

## Reflex per a efectes laterals

Cap agent escriu, mou, elimina, sincronitza, restaura o commita perquè esta fitxa ho recomane. Tot efecte lateral seguix el Reflex de Petorreta (`open → Petorreta i manifest selectiu → seal → rebut verificat i consumit`), l’autoritat del qual és `.agents/PROTOCOL_PETORRETA.md`; la seua expressió cognitiva és la llei 3 del [[02_genotip]].

Canvis de seguretat, privacitat, esquema, restauració o més de cinc fitxers són risc alt i requerixen decisió humana explícita.

## Eixida consultiva

```json
{
  "ok": true,
  "control": "encrypt|verify|recover|break",
  "evidence": [],
  "warnings": [],
  "proposed_actions": [],
  "receipt_required": false
}
```

Esta eixida és un diagnòstic. Només un rebut vigent pot autoritzar una operació concreta.

## Vincles

- [[00_index]]
- [[llei_05_privacitat]]
- [[self_repair]]
- [[doc_governanca]]
- [[auditoria_canonica]]
- [[00_arquitectura_tecnica_unificada]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[02_genotip]]
