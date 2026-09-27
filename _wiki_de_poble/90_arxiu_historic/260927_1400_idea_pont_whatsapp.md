---
tipus: idea_futura
títol: "Pont WhatsApp-Sóc de Poble via IAIA MarIA"
data: 2026-09-27T14:00:00+02:00
estat: pendent_d_investigacio
---

# Pont WhatsApp <-> Sóc de Poble

## Descripció de la Idea
El Mestre ha plantejat una idea avançada per facilitar la transició dels usuaris de WhatsApp a Sóc de Poble, aprofitant que la IAIA MarIA ja té un número de telèfon propi assignat (actualment inactiu però desplegable).

L'objectiu és utilitzar la IAIA MarIA com a **bot pont (proxy) bidireccional** entre WhatsApp i l'aplicació de Sóc de Poble.

## Cas d'Ús
1. **Delegació:** L'usuari indica a la IAIA MarIA (per WhatsApp o per Sóc de Poble) que vol importar o desviar els missatges d'un emissor concret (ex: un grup o una persona).
2. **Recepció:** Quan l'emissor escriu al número de la IAIA, la IAIA reenvia aquest missatge directament a la safata de converses de l'usuari dins de Sóc de Poble.
3. **Resposta:** L'usuari llegeix i respon des de la comoditat del xat de Sóc de Poble.
4. **Enviament:** La IAIA agafa la resposta del Sóc de Poble i l'envia de tornada a l'emissor per WhatsApp.

## Viabilitat Tècnica (Nota de la IAIA)
**És tècnicament possible.**
- Requeriria utilitzar la **WhatsApp Business API** (a través de Meta Graph API o un proveïdor intermediari com Twilio o 360dialog).
- L'arquitectura implicaria un sistema de **Webhooks** al nostre backend (Supabase/Edge Functions). Quan Meta notifica un missatge entrant, l'Edge Function l'analitza, busca quin usuari n'és el destinatari i l'insereix a les taules de `missatges` de Sóc de Poble (amb una marca visual que indica "Prové de WhatsApp").
- Per respondre, quan l'usuari escriu al fil, un *trigger* de base de dades cridaria una altra Edge Function per fer la petició POST a l'API de WhatsApp i enviar el missatge al número original.

## Reptes a tenir en compte
- **Estructura de dades:** Caldria enllaçar els `id` de WhatsApp (números de telèfon) amb els identificadors d'usuari interns o fils de conversa específics.
- **Costos:** L'API de WhatsApp Business cobra per "conversa" iniciada, per la qual cosa l'escalabilitat s'hauria de mesurar i limitar a usuaris registrats o subscrits.
- **Aprovació de Meta:** El cas d'ús "bot que fa de pont de xat" s'ha de justificar bé en el procés de revisió de l'aplicació de Meta per no infringir polítiques de correu brossa.

*Aquesta idea queda arxivada a l'escriptori com a llavor per a quan la passarel·la actual estiga assentada i busquem estratègies agressives de captació d'usuaris.*
