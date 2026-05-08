"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { runPipeline } = require("../src");
const { normalizeDiagram, validatePromptInput } = require("@repo/shared");

test("validatePromptInput rejects short input", () => {
  const result = validatePromptInput({
    prompt: "太短",
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint"
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.length > 0);
});

test("normalizeDiagram rejects relations to missing nodes", () => {
  const result = normalizeDiagram({
    meta: {
      diagramType: "layered_architecture"
    },
    structure: {
      layers: [
        {
          id: "layer_1",
          name: "Layer 1",
          nodes: [{ id: "node_1", name: "Node 1" }]
        }
      ]
    },
    relations: [{ from: "node_1", to: "missing_node" }],
    style: {
      preset: "enterprise_blueprint"
    },
    constraints: {}
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("missing node")));
});

test("runPipeline produces a valid diagram and prompt", () => {
  const result = runPipeline({
    prompt: "请生成一个电商平台的分层技术架构图，包含接入层、应用层和数据层。",
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint"
  });

  assert.equal(result.ok, true);
  assert.equal(result.diagram.meta.diagramType, "layered_architecture");
  assert.ok(result.diagram.structure.layers.length >= 3);
  assert.match(result.generationPrompt, /Layers:/);
});
