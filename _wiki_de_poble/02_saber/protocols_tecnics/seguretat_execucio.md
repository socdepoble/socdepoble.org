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

## Naturalesa i autoritat

Esta pàgina és una **fitxa consultiva** de `03_actuar`. No és una skill instal·lada ni una font de permisos. La normativa està en `03_govern`, les capacitats dels agents en `.agents` i la privacitat en [[llei_05_privacitat]]. `04_ARXIU_Documents_Historics` i `05_Escriptori_Soc_de_Poble` són zones de cicle de vida, no pilars d'autoritat.

## Dos plans de seguretat

Cal separar:

1. **Seguretat del producte:** xifratge, claus, integritat, sincronització, recuperació i contenció d'errors.
2. **Seguretat de l'agent:** abast mínim, Petorreta, rebut, verificació, backup i reversió abans de mutar fitxers o dades.

Un control d'un pla no substituïx l'altre.

## Xifratge local i claus

Les dades sensibles persistides en IndexedDB o OPFS han d'usar primitives de Web Crypto adequades al model d'amenaça.

- Deriva claus de contrasenya o PIN amb sal aleatòria, paràmetres versionats i un KDF disponible i revisat; `PBKDF2` és un mínim de compatibilitat, no una garantia universal.
- Usa xifratge autenticat, com AES-GCM, amb un nonce únic per operació.
- No guardes claus, PIN, tokens ni material de recuperació en text pla o en logs.
- La biometria pot desbloquejar una clau protegida per la plataforma; no s'ha de tractar com si fora directament material criptogràfic.
- Documenta rotació, pèrdua de clau i recuperació abans d'activar el control.

## Integritat de manifests i actualitzacions

Un manifest de build o sincronització ha d'identificar el contingut que valida:

- identificador de build i versió de format;
- hash per artefacte o arrel verificable;
- versió mínima compatible;
- signatura amb una clau de publicació protegida quan el model d'amenaça ho exigix.

La verificació ha de ser fail closed davant una signatura, versió o hash invàlid. La data és metadada informativa i no substituïx el hash. Ed25519 és una opció quan la cadena de publicació i el client la suporten; no es declara implementada sense prova.

## Circuit breaker de sincronització

Davant corrupció, error criptogràfic, incompatibilitat de manifest o fallada repetida:

1. atura la sincronització afectada;
2. preserva l'estat local sense sobreescriure la còpia bona;
3. informa amb un missatge tranquil i accionable;
4. registra un error tècnic mínim, sense dades personals;
5. oferix reintent o recuperació només després de validar precondicions.

No ocultes una fallada d'auditoria darrere d'un estat «perfecte».

## Recuperació

Quan existisquen snapshots verificables, l'ordre segur és:

1. immobilitzar l'estat i identificar origen i versió;
2. validar integritat, compatibilitat i disponibilitat de claus;
3. restaurar en un espai temporal o transacció;
4. verificar invariants abans del canvi atòmic;
5. reconciliar dades locals i remotes sense perdre conflictes;
6. generar un registre tècnic redaccionat i provar la reversió.

Una còpia no és un backup fins que la restauració s'ha comprovat.

## Reflex per a efectes laterals

Cap agent escriu, mou, elimina, sincronitza, restaura o commita perquè esta fitxa ho recomane. El flux obligatori és:

1. `open` amb intenció, risc, operacions i scopes mínims;
2. lectura de les regles impreses;
3. Petorreta i manifest de context **selectiu** dins del bootstrap reservat, mai una Mega-Petorreta ni el vault complet;
4. `seal` per obtindre el rebut signat;
5. verificació del rebut en cada mutador i comprovació de targets, estat Git, hashes i termini;
6. backup, mutació reversible, proves i consum del rebut.

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

## Sinapsis

- [[llei_05_privacitat]]
- [[MOTOR_OFFLINE]]
- [[self_repair]]
- [[doc_governanca]]
- [[auditoria_canonica]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

