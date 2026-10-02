# Tractor «Gestoria · Full trimestral de factures»

**Identificador:** `gestoria.factures` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, la carpeta de factures que tu tries, et proposa el full trimestral per a la gestoria (les huit columnes de sempre) i t'avisa de les factures que podrien faltar. No escriu res fins que aproves la proposta.

## Pas a pas

1. **Comprova la teua aprovació.** Abans de tocar cap fitxer calcula l'empremta SHA-256 del seu codi, d'esta fitxa i del seu manifest, i la compara amb la versió que has aprovat. Si no coincidixen, s'atura i no llig res.
2. **Tu tries la carpeta.** El navegador obri el selector de carpetes del sistema. El tractor només veu la carpeta que tries (per exemple `_gestoria_de_poble/02_Facturacio`) i res més del disc.
3. **Classifica els documents del trimestre** (carpetes `AAAA_nT`): factures en PDF, CSV de factura del proveïdor, rebuts de pagament (que no són factures), extractes, fulls de càlcul, imatges i duplicats.
4. **Aprén dels trimestres anteriors.** Llig els fulls `AAAA-FACTURACIO-…csv` que ja vas lliurar per a saber el titular, la teua sèrie de factures emeses, els proveïdors habituals i cada quant facturen.
5. **Extrau els camps de cada factura.** Primer de les fonts estructurades (el CSV del proveïdor), després del text del PDF. Cada camp porta un nivell de confiança; el que no troba queda «pendent» perquè el completes tu.
6. **Audita el trimestre.** Avisa de proveïdors mensuals o bimestrals sense factura quan tocava, de proveïdors habituals absents (és un indici, no una prova), de rebuts sense la seua factura, de duplicats, d'IVA que no quadra o que passa del 21 %, de NIF amb el control incorrecte, de dates fora del trimestre, de retencions d'IRPF i de factures en una altra moneda (dòlars, lliures…), que han de passar a euros abans d'entrar al full.
7. **Et mostra la proposta** amb el mateix format que lliures a la gestoria. Pots corregir qualsevol camp abans de continuar.
8. **Només quan aproves la proposta** (la segona aprovació, la de l'operació concreta) genera el CSV i l'XLSX amb la plantilla de sempre de la gestoria. En Chrome, si ho demanes, els desa a la carpeta del trimestre; en Safari i Firefox es descarreguen.
9. **Si vols, et prepara el correu per a la gestoria** (la tercera aprovació): obri la redacció de Gmail amb el destinatari, l'assumpte i el text que tu escrius (l'adjunt es descarrega al costat perquè l'arrossegues, ja que Gmail no admet adjunts per l'adreça), et dona un esborrany `.eml` amb l'adjunt per a Mail o Outlook, o obri el menú de compartir del sistema on el navegador ho permet. L'enviament el fas tu: el tractor mai prem «Envia».

## Què llig

- Els fitxers de la carpeta que tries, i només eixos.

## Què escriu

- Res durant l'anàlisi.
- Després d'aprovar la proposta: `AAAA-FACTURACIO-<titular>_-_nT.csv` i `AAAA-FACTURACIO-<titular>_-_nT.xlsx`, descarregats o dins de la carpeta del trimestre.

## Què no fa mai

- No envia res per la xarxa. El mòdul no conté cap crida de xarxa, i una prova automàtica ho vigila a cada canvi. L'única eixida possible és la que tu inicies: obrir la redacció de Gmail en una pestanya nova, amb el destinatari, l'assumpte i el text del correu a l'adreça, sense l'adjunt ni cap dada de les factures.
- No envia cap correu: només prepara l'esborrany.
- No puja res a Supabase, a Sollutia, a cap núvol ni a cap model d'IA remot.
- No guarda les teues factures al navegador: tot viu en memòria i desapareix en tancar la pestanya o en prémer «Desenxufa».
- No esborra, no mou i no reanomena cap fitxer teu. L'única excepció és el full del mateix trimestre: si ja existix a la carpeta, només el substituïx després que confirmes «Sí, substituïx-lo» en un diàleg que t'avisa que l'anterior es perd.

## Límits honestos

- L'extracció de text dels PDF la fa un lector mínim propi, sense dependències. Funciona amb els PDF generats per màquina (la majoria de proveïdors). Les fotos i els PDF escanejats queden pendents de completar a mà.
- Sense una exportació del correu, la detecció de factures absents es basa només en la carpeta i en l'historial: el panell ho diu com «correu no revisat», mai com «complet».
- Els avisos són indicis per a revisar, no veredictes fiscals. La paraula final és teua i de la teua gestoria.

## Com es desenxufa

«Desenxufa» buida la memòria i oblida la carpeta. Revocar l'aprovació al panell de Tractors bloqueja el tractor a l'instant.

## L'aprovació

Aproves esta versió exacta: el panell en mostra l'empremta curta. Si canvia una sola línia del codi, del manifest o d'esta fitxa, l'aprovació deixa de valdre i el tractor torna a «pendent». L'aprovació caduca als 90 dies. El nivell exigit és la signatura amb Touch ID o amb una clau de pas (WebAuthn): el gest biomètric només el pots fer tu, i la confirmació escrita no basta per a un tractor amb dades personals. Cal obrir la Wiki a `http://localhost:3340`, perquè el navegador només permet signar en un context segur.

**Què protegix i què no.** L'aprovació d'este navegador evita que el tractor s'execute per accident o amb una versió que no has llegit, i el selector de carpetes del sistema exigix un gest teu. No és una barrera contra un programa que ja controle este navegador o el teu perfil: un programa així podria registrar-hi una clau pròpia. Per a un tractor que execute un agent fora del navegador, la clau de confiança ha d'estar fixada en una ruta protegida del repositori (amb lease) i l'ha de verificar un executor que l'agent no puga modificar.
