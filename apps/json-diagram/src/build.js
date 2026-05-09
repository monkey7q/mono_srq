"use strict";

const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  path.join(__dirname, "..", "app", "layout.js"),
  path.join(__dirname, "..", "app", "page.js"),
  path.join(__dirname, "..", "app", "api", "pipeline", "route.js"),
  path.join(__dirname, "..", "app", "api", "presets", "route.js"),
  path.join(__dirname, "..", "app", "globals.css"),
  path.join(__dirname, "..", ".env.example"),
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required build asset: ${file}`);
    process.exit(1);
  }
}

console.log("Next.js workbench structure check passed.");
