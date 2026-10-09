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

### Cofre xifrat de la Gestoria (Onada 6, 261009)

Per ordre del Mestre del 261009, la Gestoria té un cofre xifrat al navegador, sense xarxa (`src/sections/gestoria/cofre/`), amb WebCrypto natiu i cap dependència.

**Estat a 261009 (integració de l'Onada 6): el cofre està endollat a l'Històric.** La vista `/app/gestoria/historic` es pinta sencera darrere del cofre i hi desa, xifrada a la col·lecció `historic`, la configuració de la persona: les classificacions manuals, les regles, els paràmetres i escenaris de simulació i les suposicions. Els moviments del banc no es desen: es lligen en memòria i es tornen a llegir dels extractes. En bloquejar-se el cofre (el botó, l'autobloqueig, una altra pestanya o eixir de la vista), l'Històric buida de la memòria la configuració desxifrada i la lectura del banc. L'app té un sol cofre (`cofreDeLaGestoria`). El llibre de factures Veri*Factu (`sdp-facturacio`) i el perfil fiscal (`sdp-gestoria-perfil`, amb el NIF i els comptes) continuen **en clar** a IndexedDB: queden per a una fase 2, que necessita índexs HMAC per a les claus úniques del port. Fins aleshores, no es pot dir que les factures o el perfil fiscal estiguen xifrats. El disseny és este:

- **KDF:** PBKDF2-HMAC-SHA-256 de 600.000 iteracions, sal aleatòria de 16 B i paràmetres versionats `{ v: 1, kdf, iter, sal }`. La frase es normalitza en NFC. Argon2id o WebAuthn PRF serien una v2 dins del mateix camp de versió.
- **Claus:** una DEK AES-GCM-256 aleatòria, embolcallada amb AES-KW dues vegades: per la KEK de la frase de pas i per la KEK d'un codi de recuperació de 128 bits. La DEK de treball es desembolcalla no extraïble i viu només en memòria. Cap clau no s'exporta en clar.
- **Registres:** IV aleatori de 12 B per xifrat, AAD `sdp.gestoria.cofre.v1|<col·lecció>|<id>`, ids opacs (UUID v4) i text en clar farcit a múltiples de 4 KiB. Un registre manipulat o canviat de lloc no es desxifra.
- **Bloqueig:** botó «Bloqueja», 10 minuts sense activitat, la pestanya amagada més de 5 minuts i `pagehide`. Bloquejar descarta la clau i avisa qui tinga dades desxifrades.
- **Context segur obligatori:** sense `isSecureContext` o sense `crypto.subtle`, el cofre no s'obri. Per http a la xarxa local no funciona, a propòsit.
- **Rotació de la clau de les dades:** un codi nou, una recuperació amb el codi i un canvi de frase amb la casella de sospita creen una DEK nova. Tots els registres es tornen a xifrar en una sola transacció i es fa un codi nou. Des d'eixe moment, la frase i els codis retirats no obrin res del que hi ha ara ni del que s'hi guarde després, encara que algú tinga una còpia o una instantània anterior del perfil. Un registre que ja no es podia llegir es deixa com estava i es compta.
- **Canvi de frase sense rotació:** només torna a embolcallar la DEK (cal la frase vigent). Les dades no es toquen i el codi continua valent. Una còpia o una instantània d'abans continua obrint-se amb la frase vella i, amb la DEK d'aleshores, també obriria les files d'ara si algú les robara. Per això, si hi ha sospita, cal marcar la casella.
- **Còpies anteriors:** el que ja era dins d'una còpia xifrada o d'una instantània antiga s'obri sempre amb la frase i el codi d'aleshores. Cap rotació pot canviar un fitxer que ja ha eixit. Una còpia que es perd o es filtra s'ha de tractar com a exposada amb aquells secrets.
- **Diverses pestanyes:** la sessió recorda la meta amb què es va obrir. Si una altra pestanya canvia la frase, el codi o la clau, la primera escriptura o el primer desxifrat que falle ho detecta dins de la transacció: la sessió es bloqueja i dona `COFRE_CANVIAT`. Mai no s'escriu un registre amb una clau caducada. No hi ha cap canal entre pestanyes: un bloqueig manual en una pestanya no bloqueja les altres.
- **Pèrdua i recuperació:** el codi es mostra una sola vegada, en base32 i en grups de 4, i s'ha d'apuntar en paper. Si el cofre es bloqueja abans de confirmar-lo, eixe codi es perd: la porta ho diu i, en tornar a obrir, demana fer-ne un altre. Recuperar amb el codi obliga a posar una frase nova i rota la clau. Si es perden la frase i el codi, el cofre no es pot obrir: ningú no té cap porta del darrere. Els fitxers d'origen (N43, PDF) continuen al disc.
- **Còpia:** la còpia de seguretat ix xifrada (paràmetres, DEK embolcallada i registres). En importar-la, es verifica sencera abans d'escriure res. L'exportació en clar demana una confirmació explícita i la frase vigent.
- **Frase de pas:** com a mínim 12 caràcters o 4 paraules, 5 caràcters diferents i res previsible: les seqüències i les repeticions (`123456789012`, `aaa bbb ccc ddd`) es refusen. És un mínim de compatibilitat, no una mesura d'entropia.

Límits:

- El xifratge al navegador no protegix del codi del mateix origen mentre el cofre és obert (la SPA, l'HMR de Vite i les dependències), ni d'un programa maliciós o un registrador de tecles a l'ordinador.
- Sí que protegix la còpia del perfil del navegador, les còpies de seguretat del sistema i l'accés amb el cofre bloquejat, mentre la frase i el codi d'aquella còpia no s'hagen filtrat. Si s'han filtrat i després s'ha rotat la clau, les files d'ara ja no s'obrin amb ells, però el que ja era dins de la còpia vella, sí.
- Qui puga escriure a l'IndexedDB del perfil no pot llegir res, però sí esborrar registres o tornar-ne un a una versió anterior del mateix lloc, que es desxifraria bé. L'AAD lliga el lloc, no la versió. Un comptador o un índex xifrat de cada col·lecció seria una v2.
- PBKDF2 resistix pitjor les GPU que Argon2id: per això cal una frase llarga.

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
