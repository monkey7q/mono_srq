"use strict";

const { getPreset } = require("@repo/shared");

function buildNodeToLayerMap(layers) {
  const nodeToLayer = new Map();

  for (const layer of layers) {
    for (const node of layer.nodes) {
      nodeToLayer.set(node.id, layer.name);
    }
  }

  return nodeToLayer;
}

function deriveLayerRelations(diagram) {
  const nodeToLayer = buildNodeToLayerMap(diagram.structure.layers);
  const seen = new Set();
  const result = [];

  for (const relation of diagram.relations) {
    const fromLayer = nodeToLayer.get(relation.from);
    const toLayer = nodeToLayer.get(relation.to);

    if (!fromLayer || !toLayer || fromLayer === toLayer) {
      continue;
    }

    const key = `${fromLayer} -> ${toLayer}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({ fromLayer, toLayer });
  }

  return result;
}

function buildGenerationPrompt(diagram) {
  const preset = getPreset(diagram.style.preset);
  const layerRelations = deriveLayerRelations(diagram);
  const lines = [];

  lines.push("Create a polished layered architecture infographic.");
  lines.push(`Diagram title: ${diagram.meta.title}.`);
  lines.push(`Diagram type: ${diagram.meta.diagramType}.`);
  lines.push(`Use the single fixed style preset: ${preset.label}.`);
  lines.push("");
  lines.push("Style rules (must follow closely):");
  lines.push(`- ${preset.visualRules.canvas}.`);
  lines.push(`- ${preset.visualRules.layout}.`);
  lines.push(`- ${preset.visualRules.cards}.`);
  lines.push(`- ${preset.visualRules.iconography}.`);
  lines.push(`- ${preset.visualRules.arrows}.`);
  lines.push(
    `- Use these visual keywords consistently: ${preset.promptKeywords.join(", ")}.`,
  );
  lines.push(
    "- Use a white presentation canvas, thin colored borders, muted shadows, clean Chinese-capable typography, and simple outline icons.",
  );
  lines.push(
    "- Avoid dark theme, neon effects, 3D rendering, isometric perspective, glossy gradients, noisy backgrounds, and decorative extra panels.",
  );
  lines.push("");
  lines.push("Structural rules (must preserve exactly):");
  lines.push("- Preserve the exact layer order and layer count.");
  lines.push("- Preserve the exact node names.");
  lines.push("- Do not add extra nodes, layers, captions, or legends.");
  lines.push("- Keep the composition clean and readable for an architecture review slide.");
  lines.push("");
  lines.push("Layers and nodes:");

  diagram.structure.layers.forEach((layer, index) => {
    const nodeNames = layer.nodes.map((node) => node.name).join(", ");
    lines.push(`${index + 1}. ${layer.name}: ${nodeNames}`);
  });

  if (layerRelations.length > 0) {
    lines.push("");
    lines.push("Mandatory layer dependencies:");
    for (const relation of layerRelations) {
      lines.push(`- ${relation.fromLayer} -> ${relation.toLayer}`);
    }
  } else {
    lines.push("");
    lines.push(
      "No explicit cross-layer dependency arrows are required beyond the top-to-bottom structure.",
    );
  }

  lines.push("");
  lines.push("Output intent:");
  lines.push(
    "- The final image should look like a clean, beautiful, single-style architecture storyboard rather than a generic flowchart.",
  );
  lines.push(
    "- Emphasize clear hierarchy bands and restrained inter-layer arrows over dense node-to-node wiring.",
  );

  return lines.join("\n");
}

module.exports = {
  buildGenerationPrompt,
  deriveLayerRelations,
};
