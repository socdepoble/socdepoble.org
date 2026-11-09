/* Només una marca d'opt-in i el seu àmbit opac: mai testimonis,
   endpoints, missatges ni credencials. Exclusiva del WebView propi. */
const CLAU = 'sdp.push.optin.v1';
export function memoriaConsentimentPush(storage = () => globalThis.localStorage) {
  return Object.freeze({
    llegeix() {
      try {
        const value = storage()?.getItem(CLAU);
        return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null;
      } catch { return null; }
    },
    desa(ambit) {
      if (typeof ambit !== 'string' || !ambit || ambit.length > 200) throw new TypeError('Àmbit de push invàlid');
      const target = storage();
      if (!target) throw new Error('No es pot conservar el consentiment');
      target.setItem(CLAU, ambit);
    },
    oblida() { storage()?.removeItem(CLAU); }
  });
}
