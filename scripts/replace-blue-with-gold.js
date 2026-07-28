(async function replace() {
  const fs = require('fs');
  const path = require('path');

  const repoRoot = process.cwd();
  const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) results = results.concat(walk(file));
      else results.push(file);
    });
    return results;
  };

  const files = walk(repoRoot).filter((f) => /\.(tsx|ts|css)$/.test(f));
  const old = '#5b8cff';
  const replacement = '#f2c94c';
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(old)) {
      fs.writeFileSync(file, content.split(old).join(replacement), 'utf8');
      console.log('Replaced in', file);
    }
  });
})();
