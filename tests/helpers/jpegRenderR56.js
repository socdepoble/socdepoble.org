/* Independent JPEG container oracle for R56's lossless public-metadata purge.
   It never imports the cleaner and never reads EXIF coordinate values. */
import { createHash } from 'node:crypto';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function jpegRenderR56Fingerprint(input) {
  const bytes = Buffer.from(input);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Error('JPEG SOI missing');
  const render = [bytes.subarray(0, 2)], icc = [];
  let position = 2, scans = 0, frame = null;
  for (;;) {
    const start = position;
    if (bytes[position++] !== 0xff) throw Error('JPEG marker expected');
    while (bytes[position] === 0xff) position++;
    const marker = bytes[position++];
    if (marker === 0xd9) {
      render.push(bytes.subarray(start, position));
      if (!scans || !frame) throw Error('JPEG frame or scan missing');
      return { renderSha256: sha(Buffer.concat(render)), iccSha256: sha(Buffer.concat(icc)), scans, ...frame };
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      render.push(bytes.subarray(start, position));
      continue;
    }
    if (position + 2 > bytes.length) throw Error('Truncated JPEG length');
    const length = bytes.readUInt16BE(position);
    const end = position + length;
    if (length < 2 || end > bytes.length) throw Error('Truncated JPEG segment');
    const payload = bytes.subarray(position + 2, end);
    const app = marker >= 0xe0 && marker <= 0xef;
    const color = (marker === 0xe0 && payload.subarray(0, 5).toString('latin1') === 'JFIF\0')
      || (marker === 0xe2 && payload.subarray(0, 12).toString('latin1') === 'ICC_PROFILE\0')
      || (marker === 0xee && payload.subarray(0, 5).toString('latin1') === 'Adobe');
    if (marker === 0xe2 && color) icc.push(bytes.subarray(start, end));
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (payload.length < 6) throw Error('Truncated JPEG frame');
      frame = { width: payload.readUInt16BE(3), height: payload.readUInt16BE(1) };
    }
    position = end;
    if (marker === 0xda) {
      scans++;
      for (;;) {
        const next = bytes.indexOf(0xff, position);
        if (next < 0 || next + 1 >= bytes.length) throw Error('Truncated JPEG scan');
        const code = bytes[next + 1];
        if (code === 0 || (code >= 0xd0 && code <= 0xd7)) position = next + 2;
        else { position = next; break; }
      }
      render.push(bytes.subarray(start, position));
    } else if ((!app && marker !== 0xfe) || color) render.push(bytes.subarray(start, end));
  }
}
