import fs from 'fs';
import postcss from 'postcss';

const cssStr = fs.readFileSync('src/css/index.css', 'utf8');
postcss().process(cssStr, { from: 'src/css/index.css' }).then(result => {
  console.log("Postcss parsed index.css successfully");
}).catch(err => {
  console.error("Postcss error:", err);
});
