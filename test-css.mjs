import fs from 'fs';
import css from 'css';
const files = ['src/css/base.css', 'src/css/sdp.css', 'src/css/layout.css', 'src/css/components.css', 'src/css/modules.css', 'src/css/utilities.css', 'src/css/index.css'];
for (const f of files) {
  try {
    css.parse(fs.readFileSync(f, 'utf8'), { source: f });
    console.log(f, 'OK');
  } catch (e) {
    console.error(f, 'ERROR', e.message);
  }
}
