# Sentinella «Triturador Financer · Trituradora de Documents Locals»

**Identificador:** `sentinella.triturador-financer` · **Versió:** 1.0.0 · **Nivell:** L0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig en lot, només en este ordinador, els extractes del banc i el full trimestral de factures que tries, proposa els assentaments que falten i assenyala les discrepàncies d'IVA, tot pendent d'«Aprovar» a la Gestoria.

## Disparador

- **Quan deixes un lot de fitxers** a la carpeta del trimestre i els tries amb el selector del sistema.

## Què llig

- Extractes en **Norma 43** (`.n43`, `.c43`, `.aeb` o un `.txt` que ho siga, també amb BOM o tot seguit sense salts de línia, com els llig la Gestoria).
- Els CSV i els textos es descodifiquen com a la Gestoria: UTF-8, UTF-16 o windows-1252 (el que desa Excel a Windows), sense perdre els accents.
- El **CSV de moviments del banc** (data, data valor, concepte, import i saldo).
- El **full trimestral CSV** que proposa el tractor «Gestoria · Full trimestral de factures».
- Els **PDF no els llig**: són del tractor de factures, amb la seua aprovació i la seua signatura. Si en tries algun, t'ho diu.

## Com treballa

1. Comprova l'aprovació d'esta versió exacta abans de llegir res.
2. Classifica cada fitxer pel format i el llig amb els mòduls purs de la Gestoria (Norma 43, CSV del banc, full trimestral), els mateixos que fa servir el tractor de factures.
3. Fusiona la Norma 43 amb el CSV del banc per a saber el comerç de les compres amb targeta.
4. Concilia els moviments amb les factures del full i revisa l'IVA de cada factura.
5. Et mostra les propostes: moviments sense factura (assentaments proposats), factures sense pagament i discrepàncies d'IVA.

## Què escriu

- Res. No anota, no mou i no esborra cap fitxer. Les propostes queden pendents d'«Aprovar» a la Gestoria.

## Porta humana

Cada assentament i cada discrepància d'IVA els aproves tu a la Gestoria. Cap pagament ni cap enviament ix d'ací.

## Límits honestos

- La conciliació proposa parelles per regles (número de factura citat, rebut SEPA, import i dates); una parella de confiança mitjana s'ha de mirar.
- Si el banc envia un format que no és Norma 43 ni el CSV conegut, el fitxer queda com a «no reconegut».

## L'aprovació

Tracta dades personals i financeres: s'aprova amb la signatura de Touch ID o d'una clau de pas. L'empremta cobrix també els mòduls de la Gestoria que fa servir: si en canvia un, cal tornar a aprovar. Caduca als 90 dies.
