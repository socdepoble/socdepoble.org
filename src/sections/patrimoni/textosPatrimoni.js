/* Onada R9 (carril C5) · El traductor de les tres pàgines de patrimoni (banc de llavors, rutes i arbres): les
   claus són als 5 diccionaris (src/config/idiomes, bloc «patrimoni.font/llavors/rutes/arbres»); la reserva en
   valencià només es veu fora de l'app. `{nom}` i semblants es reemplacen sense interpretar-los com a patró. */
export function traductorPatrimoni(t) {
  return (clau, reserva, valors = null) => {
    let text = typeof t === 'function' ? t(clau, reserva) : reserva;
    if (typeof text !== 'string' || !text) text = reserva;
    if (valors) for (const [nom, valor] of Object.entries(valors)) text = text.split(`{${nom}}`).join(String(valor));
    return text;
  };
}
