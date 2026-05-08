"use strict";

const { listPresets } = require("@repo/shared");

console.log("Build check passed.");
console.log(`Available presets: ${listPresets().map((preset) => preset.id).join(", ")}`);
