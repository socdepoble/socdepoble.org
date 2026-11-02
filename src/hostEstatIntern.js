/* P1-71 / T-06 · L'arrencada pertany al document, no a cada versió d'host.js.
   Sense dependències de la interfície: HMR pot reavaluar host per Notes o
   PedraSecaEmbed, però la promesa segellada, les esperes i el mode manual
   continuen sent els mateixos. No és cap API de window.SocDePoble. */
export const FASE = Object.freeze({ CONFIGURABLE: 'configurable', ARRENCANT: 'arrencant', SEGELLAT: 'segellat' });

export const estatArrencada = {
  fase: FASE.CONFIGURABLE,
  arrencada: null,
  resolveLlest: null,
  rejectLlest: null,
  promesaLlest: null,
  esperes: new Set(),
  _segellat: false,
  _deferArrenca: false,
  // L'última arrencada ha fallat; quanLlest consumix un sol reintent.
  arrencadaFallida: false,
  backendExtern: false
};

export function creaPromesaLlest() {
  estatArrencada.promesaLlest = new Promise((resolve, reject) => {
    estatArrencada.resolveLlest = resolve;
    estatArrencada.rejectLlest = reject;
  });
  estatArrencada.promesaLlest.catch(() => {}); // Pot fallar abans que arribe cap oient.
}
creaPromesaLlest();
