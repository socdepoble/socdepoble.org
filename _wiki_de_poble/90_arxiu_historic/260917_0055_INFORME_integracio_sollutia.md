---
type: document
status: esborrany
description: Informe d'Integració i Enxufabilitat (Sollutia)
---
# Informe d'Integració i Enxufabilitat (Sollutia)

Aquest document defineix el contracte d'integració tècnica entre l'aplicació amfitriona (**Sollutia**) i l'aplicació incrustada (**Sóc de Poble**) mitjançant un Iframe segur i comunicació per `postMessage`.

---

## 1. Què necessitem de Sollutia (Prerequisits)

Per tal que el pont de comunicació accepte les ordres de Sollutia de manera segura, necessitem que ens proporcionen:

1. **Llista de Dominis d'Incrustació:** Els URLs exactes des d'on s'incrustarà el nostre iframe (ex: `https://app.sollutia.cat`, `https://admin.sollutia.cat`). Aquests s'afegiran a la nostra llista blanca estricta (`ORIGENS_AMFITRIO_PERMESOS`). Qualsevol altre origen serà bloquejat automàticament.
2. **Estructura del JWT (Opcional):** Si el token de sessió que ens passaran conté "claims" (camps) personalitzats que hem de llegir per a gestionar permisos o rols específics dins de Sóc de Poble.

---

## 2. Com incrustar Sóc de Poble

L'equip de Sollutia només ha d'afegir un `<iframe>` apuntant a la URL de producció de Sóc de Poble en la seua plataforma:

```html
<iframe src="https://socdepoble.org" width="100%" height="100%" frameborder="0"></iframe>
```

> [!IMPORTANT]
> **Política de Seguretat (CSP)**
> Sóc de Poble verifica per software l'origen de l'iframe, però per a una protecció ferma contra atacs de *clickjacking*, el servidor que hostatja Sóc de Poble o el mateix Sollutia (si serveix els encapçalaments de proxy) hauria d'enviar la capçalera HTTP `Content-Security-Policy: frame-ancestors 'self' https://sollutia.cat https://app.sollutia.cat`. Això evita que dominis maliciosos ens emmarquen en obert.

---

## 3. Protocol de Comunicació (postMessage)

El pont de comunicació és asíncron i validat per les dues bandes. Sóc de Poble ignorarà qualsevol missatge que no provinga del pare directe i d'un origen autoritzat.

### 3.1. El Handshake inicial (`SDP_READY`)
Sóc de Poble enviarà un missatge al pare tan prompte com estiga carregat i preparat per a rebre ordres.

**El que rebrà Sollutia:**
```json
{
  "type": "SDP_READY",
  "estat": {
    "fase": "segellat",
    "configurable": false,
    "contracte": ["..."],
    "implementat": ["..."]
  }
}
```
*Sollutia ha d'esperar aquest missatge abans d'enviar cap comanda.*

### 3.2. Injecció de Sessió (Login SSO)
Quan l'usuari fa login a Sollutia, Sollutia ha de passar-nos la sessió perquè l'usuari estiga logat també a Sóc de Poble de forma transparent (Zero Fricció).

**El que ha d'enviar Sollutia:**
```javascript
const iframe = document.querySelector('iframe').contentWindow;
iframe.postMessage({
  type: 'SDP_HOST_CMD',
  cmd: 'injectaSessio',
  requestId: 'req-1234', // Opcional, per correlacionar la resposta
  payload: {
    sessio: {
      access_token: 'eyJhbGci...', // JWT vàlid
      user: {
        id: 'uuid-de-l-usuari',
        // ... resta de dades
      }
    },
    opcions: {
      // Opcional: l'issuer exacte del JWT si no coincideix amb l'origen de la pàgina
      // Si s'omet, Sóc de Poble n'esperarà un JWT signat amb emissor = origen actual.
      emissorEsperat: 'https://api.sollutia.cat' 
    }
  }
}, 'https://socdepoble.org'); // Important: sempre targetOrigin estricte
```

**La nostra resposta (`SDP_HOST_ACK`):**
```json
{
  "type": "SDP_HOST_ACK",
  "cmd": "injectaSessio",
  "requestId": "req-1234",
  "ok": true,
  "result": null,
  "error": null
}
```
*(Si `ok` és `false`, el camp `error` contindrà el motiu, per exemple "Sessió invàlida o rebutjada").*

### 3.3. Expulsió de Sessió (Logout)
Quan l'usuari tanca la sessió a Sollutia, ens han d'avisar per tancar-la també a Sóc de Poble.

**El que ha d'enviar Sollutia:**
```javascript
iframe.postMessage({
  type: 'SDP_HOST_CMD',
  cmd: 'expulsaSessio',
  requestId: 'req-5678'
}, 'https://socdepoble.org');
```

**La nostra resposta:**
```json
{
  "type": "SDP_HOST_ACK",
  "cmd": "expulsaSessio",
  "requestId": "req-5678",
  "ok": true
}
```

---

## 4. Consideracions Especials

- **Segellat Automàtic:** Com que anem via iframe, Sóc de Poble s'auto-segella per defecte amb la seua pròpia implementació del backend (Supabase). Sollutia només ha de preocupar-se de gestionar la identitat via `injectaSessio`. La comanda `configura` no és necessària ni aplicable en aquest model d'incrustació per seguretat.
- **Fail-Closed:** Si un payload de sessió està mal format o el token està caducat, Sóc de Poble rebutjarà la injecció silenciosament, mantindrà l'estat d'usuari desconnectat i retornarà `ok: false`.
- **Seguretat del JWT:** 
  > **⚠️ NOTA DE SEGURETAT (JWT):**  
  > El client de Sóc de Poble (l'Iframe) descodifica el JWT per a mostrar la interfície d'usuari de forma optimista, comprovant la caducitat, l'emissor i el UUID. **La verificació criptogràfica de la signatura JWT no ocorre mai al client frontend per seguretat**. La responsabilitat de verificar la integritat i signatura del JWT recau exclusivament en l'API/Backend que reba les peticions HTTP amb eixe token. Sollutia s'ha d'assegurar que els tokens estiguen signats per un emissor de confiança.
