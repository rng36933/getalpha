import fs from "node:fs";
import path from "node:path";

async function replace() {
  const repoRoot = process.cwd();

  const walk = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const fullPath = path.resolve(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) results = results.concat(walk(fullPath));
      else results.push(fullPath);
    });

    return results;
  };

  const files = walk(repoRoot).filter((f) => /\.(tsx|ts|css)$/.test(f));
  const old = "#5b8cff";
  const replacement = "#f2c94c";

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes(old)) {
      fs.writeFileSync(file, content.split(old).join(replacement), "utf8");
      console.log("Replaced in", file);
    }
  });
}

void replace();
