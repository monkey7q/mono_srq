"use strict";

const { parseDiagram } = require("@repo/shared");
const { buildGenerationPrompt } = require("./prompt-builder");

function normalizeInputDiagramJson(diagramJson) {
  if (typeof diagramJson === "string") {
    return JSON.parse(diagramJson);
  }

  if (diagramJson && typeof diagramJson === "object") {
    return diagramJson;
  }

  throw new Error("diagramJson must be a JSON string or object.");
}

function regenerateFromDiagramJson(diagramJson) {
  const parsed = normalizeInputDiagramJson(diagramJson);
  const diagram = parseDiagram(parsed);

  return {
    diagram,
    generationPrompt: buildGenerationPrompt(diagram),
  };
}

module.exports = {
  regenerateFromDiagramJson,
};
