/**
 * pouNeuInterior.js — IDEA-165 (Onada R11) · El motor dels modes «Dins del
 * pou» i «Tall seccional»: un raig per píxel sobre el camp de distància de
 * pouNeuRentonar.js, pintat com una làmina de Leonardo (paper, tinta de
 * sèpia, tramat de ploma i juntes) amb les aigualides càlides de la paleta
 * d'Ibáñez.
 *
 *  · WebGL2 propi, sense cap dependència nova. Sense WebGL2 (o en JSDOM, o amb
 *    ?no-webgl) no es crea res i el visor torna al desmuntatge en SVG.
 *  · Cap color al codi: arriben de les sondes CSS (tokens --sdp-pou-*), llegides
 *    amb getComputedStyle; així el tema fosc i el Bancal funcionen sols. La
 *    tinta (`tinta`) fa contorns i juntes; l'ombra (`ombra`) fa el tramat.
 *  · Làmina plana: paper sense degradats, sense vinyeta ni resplendor. L'ombra
 *    és tramat de ploma (1, 2 o 3 passades segons la llum direccional del sol
 *    de la finestra de l'oest); la llum que entra és absència de tramat.
 *  · El tramat i la poché de les seccions es mesuren en píxels CSS (`uPx` =
 *    píxels del canvas per píxel CSS): el pas és el mateix a tots els aparells.
 *  · Les derivades (fwidth) es calculen per a tots els píxels abans de cap
 *    branca (GLSL ES 3.00: fora del flux uniforme són indefinides) i es passen
 *    a les juntes com a amplades.
 *  · Només es pinta quan cal (moviment, transició o canvi d'estat).
 *  · El shader du la mateixa fórmula que `distanciaAlSolid` i `materialAlPunt`
 *    (JS): les xifres viatgen com a uniformes des de POU_RENTONAR, i les proves
 *    comproven la geometria sobre el camp de JS.
 */
import { POU_RENTONAR, distanciaAlSolid, finestraOberta, teuladaFase1 } from './pouNeuRentonar.js';

export const POU_INTERIOR_VERTEX = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const POU_INTERIOR_FRAGMENT = `#version 300 es
precision highp float;
out vec4 color;
uniform vec2 uRes;
// Píxels del canvas per píxel CSS: el tramat i la poché es mesuren en píxels CSS.
uniform float uPx;
uniform vec3 uCam;
uniform mat3 uRot;
uniform float uFov;
uniform float uSnow;
// x: hui (1) o segles d'ús (0); y: coberta fase1 (1) o fase2 (0); z: tall (0 cap, 1 A-B, 2 C-D, 3 quart); w: llanterna.
uniform vec4 uFlags;
// Geometria (m): R, alçada del cilindre, gruix del mur, clau i renyons de la volta, forat, arrencada dels arcs, graons, gir per graó, arrencada de la volta.
uniform float uG[10];
// Finestres: llindar, ample, alt, fletxa (fracció de l'ample).
uniform vec4 uWin;
uniform vec3 uWinOpen;
// Túnel: longitud, cota, ample i alt de l'ingrés, ample i alt de la boca, fletxa, gruix de la volta.
uniform float uTun[8];
// Galeria: longitud, ample, alt, pendent.
uniform vec4 uGal;
// Arcs: arrencada, gruix, ample, altura i volada dels estreps.
uniform float uArc[5];
// Terreny: cota oest, pendent est, pendent sud, cota de la replana, replana, pendent del vessant.
uniform float uTer[6];
// Teulada de la 1a coberta: cim de l'intradós, pendent, gruix, ràfec.
uniform vec4 uRoof;
// Figura d'escala en 3a persona (1,70 m): peus (xyz) i visible (w).
uniform vec4 uFigura;
uniform vec3 uSun;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uShade;
uniform vec3 uStone;
uniform vec3 uClay;
uniform vec3 uStraw;
uniform vec3 uVeg;
uniform vec3 uWood;
uniform vec3 uIce;

float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
// Terreny (reconstrucció): pla a l'oest i al nord, vessant a l'est i, al sud, la coberta del túnel, el talús de la boca i la replana.
float ground(vec3 p){
  float vora = uG[0] + uG[2], boca = uG[0] + uTun[0];
  float est = (p.y - (uTer[0] - uTer[1] * max(0.0, p.x - vora))) * 0.75;
  float coberta = max((p.y - (uTer[0] - uTer[2] * max(0.0, p.z - vora))) * 0.75, p.z - boca);
  float vessant = (p.y - (uTer[3] - uTer[5] * max(0.0, p.z - boca - uTer[4]))) * 0.75;
  return max(est, min(coberta, vessant));
}
float rebaixada(vec2 p, float ample, float alt, float fl){
  float f = fl * ample;
  float radi = (ample * ample * 0.25 + f * f) / (2.0 * f);
  return max(max(abs(p.x) - ample * 0.5, -p.y), min(p.y - (alt - f), length(p - vec2(0.0, alt - radi)) - radi));
}
float plaTeulada(float r, float y, float cim){
  return (y - (cim - uRoof.y * r)) / sqrt(1.0 + uRoof.y * uRoof.y);
}
vec2 seccioTunel(float z){
  float s = clamp((z - uG[0]) / uTun[0], 0.0, 1.0);
  return vec2(mix(uTun[2], uTun[4], s), mix(uTun[3], uTun[5], s));
}
float airInterior(vec3 p){
  float R = uG[0], H = uG[1], V = uG[9];
  float r = length(p.xz);
  float a = max(max(r - R, -p.y), p.y - (H + 0.02));
  if (uFlags.y < 0.5) {
    a = min(a, max(length(p - vec3(0.0, V, 0.0)) - R, V - 0.4 - p.y));
    if (uFlags.x > 0.5) a = min(a, max(r - uG[5] * 0.5, V + R - 0.3 - p.y));
  } else {
    a = min(a, max(max(r - R, H - 0.4 - p.y), plaTeulada(r, p.y, uRoof.x)));
  }
  for (int i = 0; i < 3; i++) {
    float ang = i == 0 ? -1.5707963 : (i == 1 ? 3.1415927 : 0.0);
    float open = i == 0 ? uWinOpen.x : (i == 1 ? uWinOpen.y : uWinOpen.z);
    vec2 u = vec2(cos(ang), sin(ang));
    float radial = dot(p.xz, u), tang = -p.x * u.y + p.z * u.x;
    float dins = R - 0.8, fora = open > 0.5 ? R + uG[2] + 0.4 : R + 0.2;
    float sec = rebaixada(vec2(tang, p.y - uWin.x), uWin.y, uWin.z, uWin.w);
    a = min(a, max(sec, abs(radial - (dins + fora) * 0.5) - (fora - dins) * 0.5));
  }
  vec2 st = seccioTunel(p.z);
  a = min(a, max(max(rebaixada(vec2(p.x, p.y - uTun[1]), st.x, st.y, uTun[6]), R - 0.6 - p.z), p.z - (R + uTun[0] + 0.5)));
  float sol = -uGal.w * max(0.0, p.x - R);
  a = min(a, max(max(max(abs(p.z) - uGal.y * 0.5, sol - p.y), max(p.y - (sol + uGal.z), R - 0.4 - p.x)), p.x - (R + uGal.x + 0.5)));
  // Graons: només dins de la seua capsa (fora, cap graó és a menys de 0,129 m i el camp només se subestima).
  if (p.z > 3.5 && p.y < uTun[1] + 0.3 && abs(p.x) < 3.2 && abs(r - (R + 0.12)) < 0.6) {
    for (int i = 0; i < 16; i++) {
      if (float(i) >= uG[7]) break;
      float yi = uTun[1] - (float(i) + 1.0) * (uTun[1] / (uG[7] + 1.0));
      float ang = 1.5707963 + (float(i) - uG[7] * 0.5) * uG[8];
      vec2 u = vec2(cos(ang), sin(ang));
      a = min(a, sdBox(vec3(-p.x * u.y + p.z * u.x, p.y - yi, dot(p.xz, u) - (R + 0.12)), vec3(0.25, 0.09, 0.16)));
    }
  }
  return a;
}
// La volta de maçoneria del túnel, de l'ingrés a la boca.
float tunnelVault(vec3 p){
  vec2 st = seccioTunel(p.z);
  float fora = rebaixada(vec2(p.x, p.y - uTun[1]), st.x + 2.0 * uTun[7], st.y + uTun[7], uTun[6]);
  return max(max(fora, uG[0] - p.z), p.z - (uG[0] + uTun[0]));
}
float fabric(vec3 p){
  float R = uG[0], H = uG[1], W = uG[2], V = uG[9];
  float r = length(p.xz);
  float mur = min(max(max(r - (R + W), -p.y - 0.4), p.y - H), tunnelVault(p));
  if (uFlags.y > 0.5) {
    float sobre = plaTeulada(r, p.y, uRoof.x + uRoof.z);
    float tambor = max(max(sobre, H - p.y), r - (R + W));
    float rafec = max(max(max(sobre, -plaTeulada(r, p.y, uRoof.x)), H - p.y), r - (R + W + uRoof.w));
    return min(mur, min(tambor, rafec));
  }
  float ea = R + uG[4], eb = R + uG[3];
  float k = length(vec3(p.x / ea, (p.y - V) / eb, p.z / ea));
  float closca = max(max((k - 1.0) * min(ea, eb), V - 1.0 - p.y), r - (R + W));
  return min(mur, closca);
}
float arches(vec3 p){
  float d = 1e5, R = uG[0];
  float em = uArc[3] * 0.5, vm = (uArc[4] + 0.06) * 0.5;
  for (int i = 0; i < 2; i++) {
    float ang = i == 0 ? 0.7853982 : -0.7853982;
    vec2 u = vec2(cos(ang), sin(ang));
    float al = dot(p.xz, u), tr = -p.x * u.y + p.z * u.x;
    d = min(d, sdBox(vec3(tr, p.y - (uArc[0] - em), abs(al) - (R - uArc[4] + vm)), vec3(uArc[2] * 0.5, em, vm)));
    if (uFlags.y > 0.5 && p.y >= uArc[0]) {
      float ring = abs(length(vec2(al, p.y - uArc[0])) - (R - uArc[1] * 0.5)) - uArc[1] * 0.5;
      d = min(d, max(ring, abs(tr) - uArc[2] * 0.5));
    }
  }
  return d;
}
float cutField(vec3 p){
  float k = uFlags.z;
  if (k < 0.5) return -1e5;
  if (k < 1.5) return p.z;
  if (k < 2.5) return p.x;
  return min(p.x, p.z);
}
float capsule(vec3 p, vec3 a, vec3 b, float r){
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
// Figura d'escala de 1,70 m (amb barret), per a donar l'escala humana en 3a persona.
float figura(vec3 p){
  vec3 q = p - uFigura.xyz;
  float cos1 = capsule(q, vec3(0.0, 0.3, 0.0), vec3(0.0, 1.25, 0.0), 0.21);
  float cap = length(q - vec3(0.0, 1.52, 0.0)) - 0.12;
  float barret = max(abs(q.y - 1.64) - 0.02, length(q.xz) - 0.24);
  float cames = min(capsule(q, vec3(0.09, 0.0, 0.0), vec3(0.08, 0.5, 0.0), 0.08), capsule(q, vec3(-0.09, 0.0, 0.0), vec3(-0.08, 0.5, 0.0), 0.08));
  return min(min(cos1, cap), min(barret, cames));
}
// Materials: 0 maçoneria, 1 terra, 2 neu, 3 carreus (arcs i estreps), 4 tall de maçoneria,
// 5 figura d'escala, 6 tall de terra, 7 tall de neu.
vec2 scene(vec3 p){
  float gr = ground(p);
  float fab = fabric(p);
  float solid = min(gr, fab), air = airInterior(p);
  float d = max(solid, -air);
  float mat = gr < fab ? 1.0 : 0.0;
  // On l'aire talla l'obra (mur, volta, túnel), la cara és de maçoneria; el sòl i la galeria, de terra.
  if (-air > solid && fab < -0.01 && p.y > 0.05) mat = 0.0;
  float ar = arches(p);
  if (ar < d) { d = ar; mat = 3.0; }
  float sn = 1e5;
  if (uSnow > 0.01) {
    sn = max(max(length(p.xz) - uG[0], p.y - uSnow), -p.y);
    if (sn < d) { d = sn; mat = 2.0; }
  }
  float cut = cutField(p);
  if (cut > d) {
    d = cut;
    mat = sn < 0.0 ? 7.0 : ((ar < 0.0 || (fab < 0.0 && (length(p.xz) > uG[0] - 0.01 || p.y > 0.0))) ? 4.0 : 6.0);
  }
  if (uFigura.w > 0.5) {
    float f = figura(p);
    if (f < d) { d = f; mat = 5.0; }
  }
  return vec2(d, mat);
}
vec3 normalAt(vec3 p){
  vec2 e = vec2(0.004, 0.0);
  return normalize(vec3(scene(p + e.xyy).x - scene(p - e.xyy).x, scene(p + e.yxy).x - scene(p - e.yxy).x, scene(p + e.yyx).x - scene(p - e.yyx).x));
}
float shadow(vec3 p, vec3 l){
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 28; i++) {
    float h = scene(p + l * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.04, 1.2);
    if (res < 0.02 || t > 40.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Filades (carreus, falsa volta): pedres desfasades; w = amplada del píxel en m (fwidth, calculada abans).
// Traç de ploma: juntes primes i irregulars, amb interrupcions; s'esvaïxen de lluny.
float filades(vec2 uv, vec2 w, float course, float lenMin, float lenVar){
  float row = floor(uv.y / course);
  float len = lenMin + lenVar * hash(vec2(row, 3.0));
  float x = uv.x / len + hash(vec2(row, 7.0)) * 3.0;
  float jx = abs(fract(x) - 0.5) * len, jy = abs(fract(uv.y / course) - 0.5) * course;
  float k = 0.006 + 0.010 * hash(vec2(floor(x), row));
  float lx = 1.0 - smoothstep(k, k + w.x * 1.2, len * 0.5 - jx);
  float ly = 1.0 - smoothstep(k, k + w.y * 1.2, course * 0.5 - jy);
  lx *= step(0.12, hash(vec2(floor(x * 3.0), row)));
  return max(lx, ly) * (1.0 - smoothstep(0.10, 0.22, max(w.x, w.y) / course));
}
// Maçoneria lluïda: juntes irregulars (pedres de ~0,3 m), primes i a trossos, perquè el lluït
// de morter les tapa quasi totes; sense filades regulars.
float maconeria(vec2 uv, vec2 w){
  vec2 q = uv / 0.3;
  vec2 i = floor(q), f = fract(q);
  float d1 = 8.0, d2 = 8.0;
  vec2 cel = i;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 c = o + 0.15 + 0.7 * vec2(hash(i + o), hash(i + o + 17.0));
      float d = length(c - f);
      if (d < d1) { d2 = d1; d1 = d; cel = i + o; } else if (d < d2) { d2 = d; }
    }
  }
  float e = (d2 - d1) * 0.15;
  float k = 0.003 + 0.004 * hash(cel);
  float ww = max(w.x, w.y);
  float trossos = step(0.45, hash(cel + 5.3));
  return (1.0 - smoothstep(k, k + ww * 1.2, e)) * trossos * (1.0 - smoothstep(0.08, 0.2, ww / 0.3));
}
// Tramat de ploma en píxels CSS (una línia cada 7 px): una, dues o tres passades segons la foscor.
float hatch(vec2 px, float shade){
  vec2 q = px / 7.0;
  float a = abs(fract(q.x + q.y) - 0.5);
  float b = abs(fract(q.x - q.y) - 0.5);
  float c = abs(fract(q.y * 1.3) - 0.5);
  float h = (1.0 - smoothstep(0.05, 0.16, a)) * smoothstep(0.50, 0.38, shade);
  h = max(h, (1.0 - smoothstep(0.05, 0.16, b)) * smoothstep(0.28, 0.18, shade));
  h = max(h, (1.0 - smoothstep(0.06, 0.18, c)) * smoothstep(0.16, 0.08, shade));
  return h;
}
// Ratllat de la poché d'una secció: una línia cada «pas» píxels CSS, en la diagonal triada.
float poche(vec2 px, float pas, float diagonal){
  vec2 q = px / pas;
  return 1.0 - smoothstep(0.05, 0.16, abs(fract(q.x + diagonal * q.y) - 0.5));
}
// La finestra més pròxima en azimut: coordenades locals (tangent, altura sobre el llindar, radial).
vec3 localFinestra(vec3 p){
  vec2 dir = normalize(p.xz + vec2(1e-4, 0.0));
  float best = -2.0;
  vec3 q = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float ang = i == 0 ? -1.5707963 : (i == 1 ? 3.1415927 : 0.0);
    vec2 u = vec2(cos(ang), sin(ang));
    float c = dot(dir, u);
    if (c > best) { best = c; q = vec3(-p.x * u.y + p.z * u.x, p.y - uWin.x, dot(p.xz, u)); }
  }
  return q;
}
void main(){
  vec2 frag = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = normalize(uRot * vec3(frag * uFov, -1.0));
  vec3 ro = uCam;
  float t = 0.02, closest = 1e3;
  vec2 hit = vec2(-1.0);
  for (int i = 0; i < 128; i++) {
    vec2 h = scene(ro + rd * t);
    if (h.x < 0.0015 * t) { hit = vec2(t, h.y); break; }
    closest = min(closest, h.x / t);
    t += h.x * 0.92;
    if (t > 110.0) break;
  }
  // Un raig que esgota els passos sense eixir és pedra, mai cel.
  if (hit.x < 0.0 && t < 110.0) hit = vec2(t, 0.0);
  float toca = step(0.0, hit.x);
  // Tot el que du derivades, per a tots els píxels i abans de cap branca.
  float tt = hit.x > 0.0 ? hit.x : 110.0;
  vec3 p = ro + rd * tt;
  vec3 n = hit.x > 0.0 ? normalAt(p) : -rd;
  float R = uG[0], H = uG[1], V = uG[9];
  float r = length(p.xz);
  vec2 uv = abs(n.y) > 0.7 ? p.xz : (abs(n.x) > abs(n.z) ? p.zy : p.xy);
  if (r < R + 0.05 && p.y < H + 0.3 && abs(n.y) < 0.6) uv = vec2(atan(p.z, p.x) * R, p.y);
  vec2 uvArc = vec2(atan(p.y - uArc[0], r) * 2.0, length(vec2(r, p.y - uArc[0])));
  vec3 qf = localFinestra(p);
  float fw = uWin.w * uWin.y;
  float radiF = (uWin.y * uWin.y * 0.25 + fw * fw) / (2.0 * fw);
  float sF = atan(qf.x, qf.y - (uWin.z - radiF)) * radiF / 0.11;
  // Fileres radials de la teula (48 per volta); al tall de l'atan l'amplada es limita.
  float aTeula = atan(p.z, p.x) * 7.6394373;
  vec2 wUv = fwidth(uv), wArc = fwidth(uvArc);
  vec3 wP = fwidth(p);
  float wS = fwidth(sF);
  float wTeula = min(fwidth(aTeula), 0.3);
  float edge = clamp(length(fwidth(n)) * 2.2 + fwidth(tt) / max(tt, 0.5) * 6.0, 0.0, 1.0);
  vec2 px = gl_FragCoord.xy / uPx;
  vec3 paper = uPaper;
  vec3 col = paper;
  if (toca > 0.5) {
    float mat = hit.y;
    float sun = max(dot(n, uSun), 0.0) * shadow(p + n * 0.02, uSun);
    float dl = length(p - ro);
    float ao = clamp(scene(p + n * 0.25).x / 0.25, 0.0, 1.0);
    // Dins del pou, del túnel o de la galeria la llum ambient és poca; fora, el cel del ventisquer.
    bool dins = airInterior(p + n * 0.1) < 0.0;
    float lantern = (dins ? 0.35 : 0.0) * uFlags.w * max(dot(n, -rd), 0.0) / (1.0 + dl * dl * 0.012);
    float ambient = (dins ? 0.34 : 0.55) + 0.15 * n.y;
    float light = clamp(ambient * ao + 0.85 * sun + lantern, 0.0, 1.0);
    vec3 wash = uStone;
    vec3 tintaLinies = uInk;
    float lines = 0.0;
    bool seccio = (mat > 3.5 && mat < 4.5) || mat > 5.5;
    if (mat < 0.5) {
      bool sostre = p.y > H + 0.5 && r > R + 0.2;
      bool finestra = abs(qf.x) < uWin.y * 0.5 + 0.03 && qf.y > -0.03 && qf.y < uWin.z + 0.03 && qf.z > R - 0.02 && qf.z < R + uG[2] + 0.45;
      // El cilindre (amb els graons buidats al mur) fins als llindars.
      bool interiorPou = r < R + 0.35 && p.y < H + 0.3;
      bool tunel = p.z > R - 0.05 && p.z < R + uTun[0] + 0.05 && abs(p.x) < uTun[4] * 0.5 + uTun[7] && p.y > uTun[1] - 0.05 && p.y < uTun[1] + uTun[5] + uTun[7] + 0.05;
      if (finestra) {
        // Finestres: brancals de carreus i volta rebaixada de maçoneria en sardinell (corpus l. 992).
        wash = mix(uStone, uStraw, 0.12);
        if (qf.y > uWin.z - fw) lines = (1.0 - smoothstep(0.008, 0.008 + wS * 0.11 * 1.2, abs(fract(sF + 0.5) - 0.5) * 0.11)) * 0.8;
        else lines = filades(uv, wUv, 0.30, 0.42, 0.3) * 0.8;
      } else if (interiorPou || tunel) {
        // El cilindre i el túnel: maçoneria lluïda amb morter (corpus l. 990 i 1003), juntes irregulars.
        wash = mix(uStone, uPaper, 0.25);
        lines = maconeria(uv, wUv) * 0.3;
      } else {
        // La falsa volta per aproximació de filades i l'obra de fora.
        float course = p.y > V ? 0.24 : 0.34;
        lines = filades(uv, wUv, course, 0.45, 0.4) * 0.75;
        wash = mix(uStone, uClay, 0.18 * hash(floor(uv / vec2(0.6, course))));
      }
      // 1a coberta: la teula per fora i el trespol per dins, amb les fileres radials (sense escales).
      float fileres = (1.0 - smoothstep(0.06, 0.06 + wTeula * 1.5, abs(fract(aTeula) - 0.5))) * 0.6;
      if (uFlags.y > 0.5 && sostre) { wash = uClay; lines = fileres; }
      else if (uFlags.y > 0.5 && p.y > H + 0.3 && r < R + 0.05 && n.y < -0.5) { wash = mix(uClay, uWood, 0.35); lines = fileres * 0.7; }
      else if (sostre && p.z > 0.0) wash = mix(uVeg, uClay, 0.5);
    } else if (mat < 1.5) {
      wash = mix(uVeg, uClay, 0.6);
      // Clapes de pedra menuda, rodones i sense escales.
      float dd = length(fract(p.xz * 9.0) - 0.5);
      lines = step(0.985, hash(floor(p.xz * 9.0))) * (1.0 - smoothstep(0.16, 0.16 + length(wP.xz) * 9.0 * 1.5, dd)) * 0.6;
    } else if (mat < 2.5) {
      // Neu: les capes de palla (cada 0,55 m) a les cares verticals i la quadrícula de la piconada, sense escales.
      float palla = (1.0 - smoothstep(0.02, 0.02 + wP.y / 0.55 * 1.5, abs(fract(p.y / 0.55 + 0.5) - 0.5))) * step(abs(n.y), 0.7);
      wash = mix(uIce, uStraw, palla * 0.55);
      vec2 g = abs(fract(p.xz / 0.9) - 0.5);
      float wg = length(wP.xz) / 0.9;
      lines = smoothstep(0.488 - wg * 1.5, 0.488, max(g.x, g.y)) * 0.35 * (1.0 - smoothstep(0.1, 0.25, wg)) * step(0.7, abs(n.y));
    } else if (mat < 3.5) {
      // Arcs i estreps de carreus (corpus l. 1003): juntes regulars.
      wash = mix(uStone, uStraw, 0.12);
      lines = p.y < uArc[0] ? filades(uv, wUv, 0.30, 0.42, 0.3) * 0.8 : filades(uvArc, wArc, 0.42, 0.45, 0.4) * 0.8;
    } else if (mat > 4.5 && mat < 5.5) {
      // Figura d'escala: roba d'argila i barret de palla.
      wash = p.y - uFigura.y > 1.58 ? uStraw : (p.y - uFigura.y > 1.38 ? mix(uClay, paper, 0.4) : mix(uWood, uClay, 0.35));
    } else if (mat < 4.5) {
      // Secció de la maçoneria: ratllat dens a 45°.
      wash = mix(paper, uClay, 0.22);
      lines = poche(px, 6.0, -1.0) * 0.9;
    } else if (mat < 6.5) {
      // Secció de la terra: ratllat clar a −45°.
      wash = mix(paper, uVeg, 0.10);
      lines = poche(px, 16.0, 1.0) * 0.35;
    } else {
      // Secció de la neu: gel i les capes de palla, cada 0,55 m.
      wash = uIce;
      lines = (1.0 - smoothstep(0.02, 0.02 + wP.y / 0.55 * 1.5, abs(fract(p.y / 0.55 + 0.5) - 0.5))) * 0.8;
      tintaLinies = uStraw;
    }
    // La llum que entra per la finestra de l'oest i pel forat de la clau és absència de tramat.
    float beam = 0.0, jitter = hash(gl_FragCoord.xy + 0.5);
    for (int i = 0; i < 14; i++) {
      vec3 q = ro + rd * (hit.x * (float(i) + jitter) / 14.0);
      if (length(q.xz) > R) continue;
      vec3 w = q + uSun * ((-R - q.x) / min(uSun.x, -0.001));
      float inWin = step(abs(w.z), uWin.y * 0.5) * step(uWin.x, w.y) * step(w.y, uWin.x + uWin.z) * uWinOpen.y;
      vec3 o = q + uSun * ((V + R - q.y) / max(uSun.y, 0.05));
      float inForat = step(length(o.xz), uG[5] * 0.5) * uFlags.x * (1.0 - uFlags.y);
      beam += max(inWin, inForat);
    }
    float tramat = seccio ? 0.0 : hatch(px, light + beam / 14.0);
    // Com en una làmina: aigualida plana; l'ombra la fa el tramat de ploma.
    col = mix(paper, wash, 0.30);
    col = mix(col, uShade, tramat * 0.6);
    col = mix(col, tintaLinies, lines * 0.55);
    col = mix(col, uInk, smoothstep(0.35, 0.8, edge));
  }
  col = mix(col, uInk, (1.0 - smoothstep(0.0015, 0.006, closest)) * 0.6 * (1.0 - toca));
  col *= 0.96 + 0.04 * hash(floor(px));
  color = vec4(col, 1.0);
}`;

/** Les sondes CSS que donen color al motor (nom de la sonda → uniforme). */
export const SONDES_COLOR = Object.freeze([
  ['paper', 'uPaper'], ['tinta', 'uInk'], ['ombra', 'uShade'], ['calcaria', 'uStone'], ['argila', 'uClay'],
  ['palla', 'uStraw'], ['vegetacio', 'uVeg'], ['carrasca', 'uWood'], ['gel', 'uIce'],
]);

const rgb = (css) => {
  const n = String(css).match(/[\d.]+/g)?.map(Number) || [];
  if (String(css).startsWith('color(srgb')) return n.slice(0, 3);
  return n.slice(0, 3).map((v) => v / 255);
};

/** El codi del tall per al shader: 0 cap, 1 A-B, 2 C-D, 3 quart (`true` val per A-B). */
export const codiTall = (tall) => ({ ab: 1, cd: 2, quart: 3 })[tall] ?? (tall === true ? 1 : 0);

/** La rotació de la càmera: guinyada 0 = mirant al nord (−z), positiva cap a l'est. */
export function rotacioCamera(guinyadaGraus, cabotatgeGraus) {
  const y = guinyadaGraus * Math.PI / 180, p = cabotatgeGraus * Math.PI / 180;
  const cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p);
  const dreta = [cy, 0, sy];
  const davant = [sy * cp, sp, -cy * cp];
  const enrere = [-davant[0], -davant[1], -davant[2]];
  const amunt = [
    enrere[1] * dreta[2] - enrere[2] * dreta[1],
    enrere[2] * dreta[0] - enrere[0] * dreta[2],
    enrere[0] * dreta[1] - enrere[1] * dreta[0],
  ];
  // Columnes de la matriu del shader: dreta, amunt, enrere.
  return { dreta, amunt, enrere, davant, matriu: [...dreta, ...amunt, ...enrere] };
}

/** La càmera dels talls: en òrbita al voltant del pou, mirant al centre a mitja altura. */
export function orbita(angle) {
  const a = (angle - 45) * Math.PI / 180 * 3 + Math.PI * 0.25;
  const dist = 26, pos = [Math.sin(a) * dist, 17, Math.cos(a) * dist];
  const d = [-pos[0], 8 - pos[1], -pos[2]];
  return { pos, guinyada: Math.atan2(d[0], -d[2]) * 180 / Math.PI, cabotatge: Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180 / Math.PI, fov: 0.9 };
}

/** Projecta un punt (m) a píxels de la vista; null si queda darrere. */
export function projecta(punt, camera, ample, alt, fov = 1.0) {
  const { dreta, amunt, davant } = rotacioCamera(camera.guinyada, camera.cabotatge);
  const d = [punt[0] - camera.pos[0], punt[1] - camera.pos[1], punt[2] - camera.pos[2]];
  const z = d[0] * davant[0] + d[1] * davant[1] + d[2] * davant[2];
  if (z < 0.05) return null;
  const x = (d[0] * dreta[0] + d[1] * dreta[1] + d[2] * dreta[2]) / z / fov;
  const y = (d[0] * amunt[0] + d[1] * amunt[1] + d[2] * amunt[2]) / z / fov;
  return { x: ample / 2 + x * alt, y: alt / 2 - y * alt, profunditat: z };
}

/** Un punt és visible si el raig des de la càmera no troba sòlid abans d'arribar-hi. */
export function esVisible(punt, camera, opcions = {}) {
  const d = [punt[0] - camera.pos[0], punt[1] - camera.pos[1], punt[2] - camera.pos[2]];
  const total = Math.hypot(...d);
  const dir = d.map((v) => v / total);
  let t = 0.05;
  for (let i = 0; i < 64 && t < total - 0.15; i++) {
    const h = distanciaAlSolid(camera.pos[0] + dir[0] * t, camera.pos[1] + dir[1] * t, camera.pos[2] + dir[2] * t, opcions);
    if (h < 0.01) return false;
    t += Math.max(h, 0.05);
  }
  return true;
}

/**
 * Mou la càmera amb col·lisió contra el camp (llisca per la paret). El cos és
 * una esfera de `radiCos` a `alturaCos` davall de l'ull, i el cap una de
 * `radiCap` a l'ull: així es passa per l'ingrés d'1,55 m i per la finestra.
 * Si el cos ja toca en partir (en vol, arran de la galeria), només mana el cap:
 * mai no es queda encallat. (`radi`, l'opció antiga d'una sola esfera, encara val.)
 */
export function mouAmbColisio(pos, pas, { radiCos = 0.28, radiCap = 0.1, alturaCos = 0.6, radi, opcions = {} } = {}) {
  const cos = radi ?? radiCos, cap = radi ?? radiCap, baix = radi === undefined ? alturaCos : 0;
  const ambCos = distanciaAlSolid(pos[0], pos[1] - baix, pos[2], opcions) > cos;
  const prova = (p) => (!ambCos || distanciaAlSolid(p[0], p[1] - baix, p[2], opcions) > cos) && distanciaAlSolid(p[0], p[1], p[2], opcions) > cap;
  const nou = [pos[0] + pas[0], pos[1] + pas[1], pos[2] + pas[2]];
  if (prova(nou)) return nou;
  for (const eix of [[1, 1, 0], [0, 1, 1], [1, 0, 1], [1, 0, 0], [0, 0, 1], [0, 1, 0]]) {
    const parcial = [pos[0] + pas[0] * eix[0], pos[1] + pas[1] * eix[1], pos[2] + pas[2] * eix[2]];
    if (prova(parcial)) return parcial;
  }
  return pos.slice();
}

/** La cota del sòl davall d'un punt (per a anar a peu). */
export function solDavall(pos, opcions = {}) {
  let y = pos[1];
  for (let i = 0; i < 80; i++) {
    const h = distanciaAlSolid(pos[0], y, pos[2], opcions);
    if (h < 0.01) return y;
    y -= Math.max(h, 0.02);
    if (y < -5) return -5;
  }
  return y;
}

/** El sostre damunt d'un punt (per a ajupir-se al túnel). */
export function sostreDamunt(pos, opcions = {}) {
  let y = pos[1];
  for (let i = 0; i < 60; i++) {
    const h = distanciaAlSolid(pos[0], y, pos[2], opcions);
    if (h < 0.01) return y;
    y += Math.max(h, 0.02);
    if (y > 40) return 40;
  }
  return y;
}

function compila(gl, tipus, font) {
  const s = gl.createShader(tipus);
  gl.shaderSource(s, font);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(error || 'shader');
  }
  return s;
}

const UNIFORMES = ['uRes', 'uPx', 'uCam', 'uRot', 'uFov', 'uSnow', 'uFlags', 'uG', 'uWin', 'uWinOpen', 'uTun', 'uGal', 'uArc', 'uTer', 'uRoof', 'uFigura', 'uSun', ...SONDES_COLOR.map(([, u]) => u)];

/** Les uniformes de geometria, des de POU_RENTONAR (les mateixes xifres que el camp de JS). */
export function uniformesGeometria(g = POU_RENTONAR) {
  const t = g.tunel, T = g.terreny, A = g.arcs, F = g.finestra, sostre = teuladaFase1(g);
  return {
    uG: [g.R, g.alcadaCilindre, g.gruixMur, g.volta.clau, g.volta.renyons, g.volta.forat, A.arrencada, g.graons, g.graoPas, g.voltaArrencada],
    uWin: [F.llindar, F.ample, F.alt, F.fletxa / F.ample],
    uTun: [t.longitud, t.cota, t.ampleIngres, t.altIngres, t.ampleBoca, t.altBoca, t.fletxa, t.volta],
    uGal: [g.galeria.longitud, g.galeria.ample, g.galeria.alt, g.galeria.pendent],
    uArc: [A.arrencada, A.gruix, A.ample, A.estrepAlt, A.estrepVolada],
    uTer: [T.cotaOest, T.pendentEst, T.pendentSud, T.cotaReplana, T.replana, T.pendentVessant],
    uRoof: [sostre.cim, sostre.pendent, sostre.gruix, g.fase1.rafec],
  };
}

/**
 * La càmera de 3a persona: darrere i damunt de la figura d'escala, sense
 * travessar cap paret (s'atura 0,3 m abans del sòlid). `ull` és la càmera de 1a persona.
 */
export function cameraTerceraPersona(ull, opcions = {}) {
  const { davant } = rotacioCamera(ull.guinyada, 0);
  const dir = [-davant[0] * 0.975, 0.22, -davant[2] * 0.975];
  let t = 0;
  for (let i = 0; i < 40 && t < 3.4; i++) {
    const p = [ull.pos[0] + dir[0] * (t + 0.1), ull.pos[1] + dir[1] * (t + 0.1), ull.pos[2] + dir[2] * (t + 0.1)];
    const h = distanciaAlSolid(p[0], p[1], p[2], opcions);
    if (h < 0.3) break;
    t += Math.min(Math.max(h - 0.25, 0.02), 0.4);
  }
  // En un lloc estret (l'ingrés de 1,55 m, la galeria) no hi ha espai darrere: es queda en 1a persona.
  if (t < 0.6) return null;
  // Mira una mica avall perquè la figura d'escala quede a la meitat baixa de la vista.
  const cabotatge = Math.min(35, Math.max(-35, ull.cabotatge)) * 0.4 - 16;
  return { pos: [ull.pos[0] + dir[0] * t, ull.pos[1] + dir[1] * t, ull.pos[2] + dir[2] * t], guinyada: ull.guinyada, cabotatge, fov: ull.fov ?? 1 };
}

/**
 * Crea el motor sobre un <canvas>. Torna null si no hi ha WebGL2. Si el
 * context es perd i es recupera, el motor es torna a iniciar i crida
 * `onRestaurat()`; si no ho aconseguix, `perdut` queda cert i `error` du el motiu.
 */
export function creaMotorInterior(canvas, { g = POU_RENTONAR, onRestaurat } = {}) {
  const gl = canvas.getContext?.('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl || gl.isContextLost()) return null;
  let programa = null, buffer = null, llocs = {};
  const inicia = () => {
    programa = gl.createProgram();
    gl.attachShader(programa, compila(gl, gl.VERTEX_SHADER, POU_INTERIOR_VERTEX));
    gl.attachShader(programa, compila(gl, gl.FRAGMENT_SHADER, POU_INTERIOR_FRAGMENT));
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programa) || 'link');
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(programa, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    llocs = Object.fromEntries(UNIFORMES.map((nom) => [nom, gl.getUniformLocation(programa, nom)]));
    gl.useProgram(programa);
    const u = uniformesGeometria(g);
    for (const nom of ['uG', 'uTun', 'uArc', 'uTer']) gl.uniform1fv(llocs[nom], u[nom]);
    gl.uniform4f(llocs.uWin, ...u.uWin);
    gl.uniform4f(llocs.uGal, ...u.uGal);
    gl.uniform4f(llocs.uRoof, ...u.uRoof);
    // El sol de la vesprada entra per la finestra de l'oest: una llum direccional fixa.
    const sol = [-0.82, 0.5, 0.28], n = Math.hypot(...sol);
    gl.uniform3f(llocs.uSun, sol[0] / n, sol[1] / n, sol[2] / n);
  };
  inicia();
  let perdut = false, error = null;
  const perd = (e) => { e.preventDefault(); perdut = true; };
  const recupera = () => {
    try {
      inicia();
    } catch (e) {
      perdut = true;
      error = String(e?.message || e);
      return;
    }
    perdut = false;
    error = null;
    onRestaurat?.();
  };
  canvas.addEventListener('webglcontextlost', perd);
  canvas.addEventListener('webglcontextrestored', recupera);
  return {
    get perdut() { return perdut; },
    get error() { return error; },
    /**
     * Pinta un fotograma. `escalaPx`: píxels del canvas per píxel CSS; `tall`:
     * false, 'ab', 'cd' o 'quart'; `estat`: hivern, estiu o hui; `coberta`: fase2 o fase1.
     */
    pinta({ camera, ample, alt, escalaPx = 1, nivellNeu = 0, tall = false, llanterna = 1, estat = 'hui', coberta = 'fase2', colors = {}, figura = null }) {
      if (perdut) return false;
      if (canvas.width !== ample || canvas.height !== alt) { canvas.width = ample; canvas.height = alt; }
      gl.viewport(0, 0, ample, alt);
      gl.useProgram(programa);
      gl.uniform2f(llocs.uRes, ample, alt);
      gl.uniform1f(llocs.uPx, Math.max(escalaPx, 0.1));
      gl.uniform3f(llocs.uCam, camera.pos[0], camera.pos[1], camera.pos[2]);
      gl.uniformMatrix3fv(llocs.uRot, false, rotacioCamera(camera.guinyada, camera.cabotatge).matriu);
      gl.uniform1f(llocs.uFov, camera.fov ?? 1.0);
      gl.uniform1f(llocs.uSnow, nivellNeu);
      gl.uniform4f(llocs.uFlags, estat === 'hui' ? 1 : 0, coberta === 'fase1' ? 1 : 0, codiTall(tall), llanterna);
      gl.uniform3f(llocs.uWinOpen, ...['nord', 'oest', 'est'].map((id) => (finestraOberta(g.finestres.find((f) => f.id === id), estat) ? 1 : 0)));
      gl.uniform4f(llocs.uFigura, figura?.[0] ?? 0, figura?.[1] ?? 0, figura?.[2] ?? 0, figura ? 1 : 0);
      for (const [, u] of SONDES_COLOR) if (colors[u]) gl.uniform3f(llocs[u], colors[u][0], colors[u][1], colors[u][2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    },
    /* No es força loseContext(): el mateix <canvas> torna a demanar el context si
       React munta l'efecte una altra vegada, i un context perdut a posta no torna. */
    dispose() {
      canvas.removeEventListener('webglcontextlost', perd);
      canvas.removeEventListener('webglcontextrestored', recupera);
      if (!perdut && !gl.isContextLost()) { gl.deleteBuffer(buffer); gl.deleteProgram(programa); }
    },
  };
}

/** Llig els colors de les sondes CSS d'un contenidor ([data-sonda="NOM"]). */
export function llegixColors(arrel) {
  const colors = {};
  if (!arrel || typeof getComputedStyle !== 'function') return colors;
  for (const [nom, u] of SONDES_COLOR) {
    const sonda = arrel.querySelector(`[data-sonda="${nom}"]`);
    if (sonda) colors[u] = rgb(getComputedStyle(sonda).color);
  }
  return colors;
}
