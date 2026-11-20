/** R32.15. Structural file validators, bounded scans and no I/O or decoder. */
const fail = () => { throw Object.assign(new TypeError('El contenidor multimèdia és invàlid o està incomplet.'), { code: 'format', codi: 'contenidor-media-invalid' }); };
const must = value => { if (!value) fail(); };
const str = (b, p, n) => { let out = ''; for (let i = p; i < p + n; i++) out += String.fromCharCode(b[i]); return out; };
const u16 = (b, p) => b[p] * 256 + b[p + 1];
const u32 = (b, p) => b[p] * 0x1000000 + b[p + 1] * 65536 + b[p + 2] * 256 + b[p + 3];
const le32 = (b, p) => b[p] + b[p + 1] * 256 + b[p + 2] * 65536 + b[p + 3] * 0x1000000;
const OGG_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value << 24;
  for (let bit = 0; bit < 8; bit++) crc = (crc << 1) ^ (crc < 0 ? 0x04c11db7 : 0);
  return crc >>> 0;
});

export function validaOggMedia(b) {
  const streams = new Map(); let dataStarted = false, activeStreams = 0;
  for (let p = 0; p < b.length;) {
    must(p + 27 <= b.length && str(b, p, 4) === 'OggS' && b[p + 4] === 0 && !(b[p + 5] & 0xf8));
    const flags = b[p + 5], count = b[p + 26], header = p + 27 + count;
    must(header <= b.length);
    let size = 0; for (let i = 0; i < count; i++) size += b[p + 27 + i];
    const end = header + size; must(end <= b.length);
    let crc = 0;
    for (let i = p; i < end; i++) crc = ((crc << 8) ^ OGG_TABLE[((crc >>> 24) ^ (i >= p + 22 && i < p + 26 ? 0 : b[i])) & 255]) >>> 0;
    must(crc === le32(b, p + 22));
    const serial = le32(b, p + 14), sequence = le32(b, p + 18);
    let state = streams.get(serial);
    if (!state) {
      if (dataStarted) { must(activeStreams === 0); dataStarted = false; }
      must(streams.size < 4096 && (flags & 2) && !(flags & 1) && sequence === 0 && count > 0 && size > 0);
      state = { sequence: 0, pending: false, eos: false, packets: 0, granule: -1n }; streams.set(serial, state); activeStreams++;
    } else must(!(flags & 2));
    if (!(flags & 2)) dataStarted = true;
    must(!state.eos && sequence === state.sequence && Boolean(flags & 1) === state.pending);
    let complete = 0;
    for (let i = 0; i < count; i++) { state.pending = b[p + 27 + i] === 255; if (!state.pending) complete++; }
    let granule = 0n; for (let i = 7; i >= 0; i--) granule = granule * 256n + BigInt(b[p + 6 + i]);
    const unknown = granule === 0xffffffffffffffffn;
    must(unknown === (complete === 0));
    if (!unknown) { must(granule <= 0x7fffffffffffffffn && granule >= state.granule); state.granule = granule; }
    state.packets += complete;
    if (flags & 4) { must(!state.pending && state.packets > 0 && !unknown); state.eos = true; activeStreams--; }
    state.sequence = (state.sequence + 1) >>> 0;
    p = end;
  }
  must(streams.size > 0); for (const state of streams.values()) must(state.eos && !state.pending);
}

function boxes(b, start, end) {
  const result = [];
  for (let p = start; p < end;) {
    must(p + 8 <= end); let length = u32(b, p), header = 8;
    const type = str(b, p + 4, 4);
    if (length === 1) { must(p + 16 <= end); length = u32(b, p + 8) * 0x100000000 + u32(b, p + 12); header = 16; }
    must(Number.isSafeInteger(length) && length >= header && length <= end - p);
    must(result.length < 200000); result.push({ type, s: p + header, e: p + length }); p += length;
  }
  return result;
}
const full = (b, box, versions = [0]) => { must(box.e - box.s >= 4 && versions.includes(b[box.s])); return { version: b[box.s], flags: b[box.s + 1] * 65536 + b[box.s + 2] * 256 + b[box.s + 3], at: box.s + 4 }; };
const KNOWN_PROPERTIES = new Set(['ispe', 'pixi', 'av1C', 'colr', 'clap', 'irot', 'imir', 'pasp', 'auxC']);

export function validaAvifMedia(b) {
  let fileType, meta, idat, primary, properties, associations;
  const media = [], locations = new Map(), items = new Map(), references = new Map();
  let animated = false, movie = false;
  for (const box of boxes(b, 0, b.length)) {
    const { type, s, e } = box;
    if (type === 'ftyp') {
      must(!fileType && s === (u32(b, 0) === 1 ? 16 : 8) && e - s >= 8 && (e - s) % 4 === 0);
      const brands = [str(b, s, 4)]; for (let at = s + 8; at < e; at += 4) brands.push(str(b, at, 4));
      must(brands.includes('avif') || brands.includes('avis')); animated = brands[0] === 'avis'; fileType = box;
    } else if (type === 'meta') { must(fileType && !meta); meta = box; }
    else if (type === 'mdat') { must(fileType && e > s); media.push(box); }
    else if (type === 'moov') {
      must(fileType && !movie); const children = boxes(b, s, e);
      must(children.some(v => v.type === 'mvhd' && v.e - v.s >= 100) && children.some(v => v.type === 'trak'));
      for (const track of children.filter(v => v.type === 'trak')) {
        const parts = boxes(b, track.s, track.e);
        must(parts.some(v => v.type === 'tkhd' && v.e - v.s >= 84) && parts.some(v => v.type === 'mdia' && boxes(b, v.s, v.e).length >= 3));
      }
      movie = true;
    } else must(['free', 'skip', 'wide'].includes(type));
  }
  must(fileType && meta && (!animated || movie));
  const fm = full(b, meta); must(fm.flags === 0);
  let handler = false, itemInfo = false;
  for (const box of boxes(b, fm.at, meta.e)) {
    const { type, s, e } = box;
    if (type === 'hdlr') { const f = full(b, box); must(!handler && f.flags === 0 && e - s >= 24 && str(b, s + 8, 4) === 'pict'); handler = true; }
    else if (type === 'pitm') { const f = full(b, box, [0, 1]); must(primary === undefined && f.flags === 0 && e - f.at === (f.version ? 4 : 2)); primary = f.version ? u32(b, f.at) : u16(b, f.at); must(primary > 0); }
    else if (type === 'idat') { must(!idat && e > s); idat = box; }
    else if (type === 'iinf') {
      const f = full(b, box, [0, 1]); must(!itemInfo && f.flags === 0 && f.at + (f.version ? 4 : 2) <= e); itemInfo = true;
      const count = f.version ? u32(b, f.at) : u16(b, f.at), entries = boxes(b, f.at + (f.version ? 4 : 2), e);
      must(count > 0 && entries.length === count);
      for (const entry of entries) {
        must(entry.type === 'infe'); const v = full(b, entry, [2, 3]), width = v.version === 3 ? 4 : 2;
        must((v.flags & ~1) === 0 && v.at + width + 7 <= entry.e); // Gauntlet v1.2.13 · HEIF admet el bit 1 (ítem amagat: Exif/XMP d'ImageIO)
        const id = width === 4 ? u32(b, v.at) : u16(b, v.at);
        must(id > 0 && !items.has(id) && u16(b, v.at + width) === 0);
        must(b.subarray(v.at + width + 6, entry.e).includes(0)); items.set(id, str(b, v.at + width + 2, 4));
      }
    } else if (type === 'iloc') {
      must(locations.size === 0); const f = full(b, box, [0, 1, 2]); must(f.flags === 0 && f.at + 4 <= e);
      const offsetSize = b[f.at] >> 4, lengthSize = b[f.at] & 15, baseSize = b[f.at + 1] >> 4, indexSize = f.version ? b[f.at + 1] & 15 : 0;
      must([offsetSize, lengthSize, baseSize, indexSize].every(v => v <= 8) && (f.version > 0 || (b[f.at + 1] & 15) === 0));
      let at = f.at + 2;
      const number = width => { must(at + width <= e); let n = 0; for (let i = 0; i < width; i++) n = n * 256 + b[at++]; must(Number.isSafeInteger(n)); return n; };
      const count = number(f.version === 2 ? 4 : 2); must(count > 0 && count <= 200000);
      for (let i = 0; i < count; i++) {
        const id = number(f.version === 2 ? 4 : 2), method = f.version ? number(2) : 0;
        must(id > 0 && !locations.has(id) && (method === 0 || method === 1) && number(2) === 0);
        const base = number(baseSize), extents = [], n = number(2); must(n > 0);
        for (let j = 0; j < n; j++) {
          if (indexSize) number(indexSize);
          const start = base + number(offsetSize), length = number(lengthSize);
          must(Number.isSafeInteger(start) && length > 0 && Number.isSafeInteger(start + length)); extents.push({ start, length });
        }
        locations.set(id, { method, extents });
      }
      must(at === e);
    } else if (type === 'iprp') {
      must(!properties); const parts = boxes(b, s, e), ipco = parts.find(v => v.type === 'ipco'), ipma = parts.filter(v => v.type === 'ipma');
      must(ipco && parts.filter(v => v.type === 'ipco').length === 1 && ipma.length > 0 && parts.every(v => v.type === 'ipco' || v.type === 'ipma'));
      properties = boxes(b, ipco.s, ipco.e); associations = new Map();
      for (const property of properties) {
        if (property.type === 'ispe') { const f = full(b, property); must(f.flags === 0 && property.e - f.at === 8 && u32(b, f.at) > 0 && u32(b, f.at + 4) > 0 && u32(b, f.at) * u32(b, f.at + 4) <= 100000000); }
        if (property.type === 'av1C') must(property.e - property.s >= 4 && b[property.s] === 0x81 && (b[property.s + 1] >> 5) <= 2 && !(b[property.s + 3] & 0xe0) && ((b[property.s + 3] & 0x10) || !(b[property.s + 3] & 15)) && (!(b[property.s + 2] & 0x20) || (b[property.s + 2] & 0x40) && (b[property.s + 1] >> 5) === 2));
        if (property.type === 'pixi') { const f = full(b, property); const n = b[f.at]; must(f.flags === 0 && n >= 1 && n <= 4 && f.at + 1 + n === property.e); for (let i = 0; i < n; i++) must([8, 10, 12].includes(b[f.at + 1 + i])); }
        if (property.type === 'irot') must(property.e - property.s === 1 && !(b[property.s] & 0xfc));
        if (property.type === 'imir') must(property.e - property.s === 1 && !(b[property.s] & 0xfe));
        if (property.type === 'pasp') must(property.e - property.s === 8 && u32(b, property.s) > 0 && u32(b, property.s + 4) > 0);
        if (property.type === 'clap') {
          must(property.e - property.s === 32 && u32(b, property.s) > 0 && u32(b, property.s + 8) > 0);
          for (const offset of [4, 12, 20, 28]) must(u32(b, property.s + offset) > 0);
        }
        if (property.type === 'auxC') { const f = full(b, property); must(f.flags === 0 && f.at < property.e && b.subarray(f.at, property.e).indexOf(0) > 0); }
        if (property.type === 'colr') {
          must(property.e - property.s >= 4); const type = str(b, property.s, 4);
          if (type === 'nclx') must(property.e - property.s === 11 && !(b[property.e - 1] & 0x7f));
          else if (type === 'nclc') must(property.e - property.s === 10);
          else {
            must((type === 'rICC' || type === 'prof') && property.e - property.s >= 136);
            const start = property.s + 4, length = property.e - start, count = u32(b, start + 128);
            must(u32(b, start) === length && str(b, start + 36, 4) === 'acsp' && count <= (length - 132) / 12);
            for (let i = 0; i < count; i++) { const at = start + 132 + i * 12, offset = u32(b, at + 4), size = u32(b, at + 8); must(offset >= 132 + count * 12 && offset + size <= length); }
          }
        }

      }
      for (const part of ipma) {
        const f = full(b, part, [0, 1]); must(f.flags <= 1 && f.at + 4 <= part.e); let at = f.at + 4;
        const count = u32(b, f.at); must(count <= 200000);
        for (let i = 0; i < count; i++) {
          const width = f.version ? 4 : 2; must(at + width + 1 <= part.e);
          const id = width === 4 ? u32(b, at) : u16(b, at); at += width; must(id > 0 && !associations.has(id));
          const n = b[at++], indices = new Set();
          for (let j = 0; j < n; j++) {
            const size = f.flags ? 2 : 1; must(at + size <= part.e); const value = size === 2 ? u16(b, at) : b[at]; at += size;
            const index = value & (size === 2 ? 0x7fff : 0x7f), essential = value & (size === 2 ? 0x8000 : 0x80);
            must(index <= properties.length && (!index || !indices.has(index)));
            if (index) { indices.add(index); must(!essential || KNOWN_PROPERTIES.has(properties[index - 1].type)); }
          }
          associations.set(id, indices);
        }
        must(at === part.e);
      }
    } else if (type === 'iref') {
      const f = full(b, box, [0, 1]); must(f.flags === 0);
      for (const entry of boxes(b, f.at, e)) {
        const width = f.version ? 4 : 2; must(entry.e - entry.s >= width + 2);
        let at = entry.s, id = width === 4 ? u32(b, at) : u16(b, at); at += width;
        const count = u16(b, at); at += 2; must(at + count * width === entry.e);
        const targets = []; for (let i = 0; i < count; i++, at += width) targets.push(width === 4 ? u32(b, at) : u16(b, at));
        const key = `${id}:${entry.type}`; must(!references.has(key)); references.set(key, { id, targets, type: entry.type });
      }
    } else must(['free', 'skip', 'dinf', 'grpl'].includes(type));
  }
  must(handler && primary !== undefined && items.has(primary) && properties && associations && locations.has(primary));
  // Fixed-size byte buckets give O(bytes/256 + extents) interval lookup.
  // At most 29 nonempty mdat boxes can touch one boundary bucket (box>=9B).
  const owners = new Uint32Array(Math.ceil(b.length / 256)), boundaries = new Map();
  for (let i = 0; i < media.length; i++) {
    const area = media[i], first = Math.floor(area.s / 256), last = Math.floor((area.e - 1) / 256);
    if (last > first + 1) owners.fill(i + 1, first + 1, last);
    for (const bucket of first === last ? [first] : [first, last]) {
      if (!boundaries.has(bucket)) boundaries.set(bucket, []);
      boundaries.get(bucket).push(area);
    }
  }
  const inMedia = extent => {
    const bucket = Math.floor(extent.start / 256), index = owners[bucket];
    const areas = index ? [media[index - 1]] : boundaries.get(bucket) ?? [];
    return areas.some(area => extent.start >= area.s && extent.start + extent.length <= area.e);
  };
  for (const [id, location] of locations) {
    must(items.has(id));
    for (const extent of location.extents) {
      must(location.method ? idat && extent.start + extent.length <= idat.e - idat.s : inMedia(extent));
    }
  }
  for (const id of associations.keys()) must(items.has(id));
  for (const reference of references.values()) must(items.has(reference.id) && reference.targets.every(id => items.has(id)));
  const associated = id => [...(associations.get(id) ?? [])].map(index => properties[index - 1]);
  for (const [id, type] of items) if (type === 'av01') {
    const props = associated(id); must(locations.has(id) && props.filter(v => v.type === 'ispe').length === 1 && props.filter(v => v.type === 'av1C').length === 1);
  }
  if (items.get(primary) === 'grid') {
    const location = locations.get(primary); must(location.extents.reduce((sum, v) => sum + v.length, 0) <= 12);
    const bytes = []; for (const extent of location.extents) { const start = extent.start + (location.method ? idat.s : 0); for (let at = start; at < start + extent.length; at++) bytes.push(b[at]); }
    must(bytes[0] === 0 && bytes[1] <= 1 && bytes.length === (bytes[1] ? 12 : 8));
    const tiles = references.get(`${primary}:dimg`), n = (bytes[2] + 1) * (bytes[3] + 1);
    must(tiles && tiles.targets.length === n && tiles.targets.every(id => items.get(id) === 'av01'));
    const width = bytes[1] ? u32(bytes, 4) : u16(bytes, 4), height = bytes[1] ? u32(bytes, 8) : u16(bytes, 6);
    const ispe = associated(primary).filter(v => v.type === 'ispe'); must(ispe.length === 1 && u32(b, ispe[0].s + 4) === width && u32(b, ispe[0].s + 8) === height);
  } else must(items.get(primary) === 'av01');
}
