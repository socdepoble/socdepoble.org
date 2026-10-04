# Sentinella «Estructural · Permisos i Connexió Universal»

**Identificador:** `sentinella.estructural` · **Versió:** 1.0.0 · **Nivell:** L0 · **Revisió Humana:** Pendent · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Contrasta la sessió, el perfil i les pertinences d'una persona amb un contracte propi derivat de les migracions de la base de dades, i et proposa la reparació (`completa_la_meua_alta`) sense aplicar-la.

## Disparador

- **En arrencar la sessió**, amb la instantània de connexió que veu l'app.
- **Capa estàtica al pre-commit:** una prova comprova que cada fet del contracte continua escrit a les migracions. Si una migració el canvia, la prova cau abans que el sentinella diga una cosa falsa.
- **Informes de nit** (RLS, migracions i secrets del paquet): es calculen en obrir el Tauler l'endemà, no depenen de cap dimoni engegat.

## Què llig

- La instantània de connexió que tries, en JSON: la sessió, el perfil, les pertinences, els pobles i, si n'hi ha, la incidència d'alta.

## Què escriu

- Res. Les banderes i l'informe es mostren a la pantalla i desapareixen amb la memòria.

## Què comprova

1. La sessió porta un usuari vàlid i no ha caducat.
2. Hi ha perfil, és el de l'usuari de la sessió, és privat i el nom fa entre 1 i 120 caràcters.
3. La persona pertany almenys a un poble, sense pertinences d'altri ni repetides, i el poble de la configuració és un dels seus. Si el poble de la configuració està tancat, no proposa la crida amb eixe poble (no hi unix ningú): avisa que cal reobrir-lo o canviar la configuració, i proposa `completa_la_meua_alta()` sense poble, que només unix al poble per defecte si n'hi ha un d'obert.
4. Les incidències d'alta, el consentiment de privacitat i la baixa demanada.

## Porta humana

El sentinella proposa; la persona decidix. La reparació `completa_la_meua_alta` la crida la persona des de l'app, amb la sessió iniciada, després de llegir l'avís. El sentinella no crida cap funció del servidor.

## Què no fa mai

- No es connecta a cap servidor ni envia res per la xarxa.
- No repara res: només ho proposa.
- No guarda la instantània enlloc.

## L'aprovació

Com que tracta dades personals (la sessió i el perfil), s'aprova amb la signatura de Touch ID o d'una clau de pas; la confirmació escrita no basta. Qualsevol canvi en el codi, en el manifest o en esta fitxa invalida l'aprovació. Caduca als 90 dies.
