#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(walk(fullPath));
    else results.push(fullPath);
  });

  return results;
}

function replace() {
  const repoRoot = process.cwd();
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

replace();
