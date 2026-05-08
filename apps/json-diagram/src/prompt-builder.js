"use strict";

const { getPreset } = require("@repo/shared");

function buildGenerationPrompt(diagram) {
  const preset = getPreset(diagram.style.preset);
  const lines = [];

  lines.push(`Create a ${diagram.meta.diagramType} diagram.`);
  lines.push(`Title: ${diagram.meta.title}.`);
  lines.push(`Use preset: ${preset.id} (${preset.label}).`);
  lines.push(`Layout: ${diagram.style.layout}.`);
  lines.push(`Line style: ${diagram.style.lineStyle}.`);
  lines.push(`Node shape: ${diagram.style.nodeShape}.`);
  lines.push(`Visual keywords: ${preset.promptKeywords.join(", ")}.`);
  lines.push("Preserve the exact layer count and node names.");
  lines.push("Do not add extra nodes or relations.");
  lines.push("Layers:");

  for (const layer of diagram.structure.layers) {
    const nodeNames = layer.nodes.map((node) => node.name).join(", ");
    lines.push(`- ${layer.name}: ${nodeNames}`);
  }

  if (diagram.relations.length > 0) {
    lines.push("Relations:");
    for (const relation of diagram.relations) {
      lines.push(`- ${relation.from} -> ${relation.to}`);
    }
  }

  return lines.join("\n");
}

module.exports = {
  buildGenerationPrompt
};
