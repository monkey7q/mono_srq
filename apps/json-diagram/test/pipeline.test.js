"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { runPipeline } = require("../src");
const { normalizeDiagram, validatePromptInput } = require("@repo/shared");
const {
  buildMessages,
  buildRepairMessages,
  extractFirstJsonObject,
} = require("../src/model-client");
const { regenerateFromDiagramJson } = require("../src/regenerate");

test("validatePromptInput rejects short input", () => {
  const result = validatePromptInput({
    prompt: "太短",
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint",
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.length > 0);
});

test("normalizeDiagram rejects relations to missing nodes", () => {
  const result = normalizeDiagram({
    meta: {
      diagramType: "layered_architecture",
    },
    structure: {
      layers: [
        {
          id: "layer_1",
          name: "Layer 1",
          nodes: [{ id: "node_1", name: "Node 1" }],
        },
      ],
    },
    relations: [{ from: "node_1", to: "missing_node" }],
    style: {
      preset: "enterprise_blueprint",
    },
    constraints: {},
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("missing node")));
});

test("runPipeline returns model error when key is missing", async () => {
  const originalApiKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "";

  const result = await runPipeline({
    prompt: "请生成一个电商平台的分层技术架构图，包含接入层、应用层和数据层。",
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint",
  });

  assert.equal(result.ok, false);
  assert.equal(result.stage, "model");
  assert.equal(result.provider.provider, "deepseek");

  if (originalApiKey) {
    process.env.DEEPSEEK_API_KEY = originalApiKey;
  } else {
    delete process.env.DEEPSEEK_API_KEY;
  }
});

test("extractFirstJsonObject handles fenced output", () => {
  const jsonText = extractFirstJsonObject("```json\n{\"ok\":true,\"value\":1}\n```");
  assert.equal(jsonText, "{\"ok\":true,\"value\":1}");
});

test("buildMessages contains strict JSON-only instructions", () => {
  const messages = buildMessages({
    prompt: "生成一个三层技术架构图",
    diagramType: "layered_architecture",
    presetId: "enterprise_blueprint",
  });

  assert.match(messages[0].content, /exactly one valid JSON object/i);
  assert.match(messages[0].content, /meta, structure, relations, style, constraints/);
  assert.match(messages[0].content, /enterprise_blueprint/);
});

test("buildRepairMessages includes previous invalid output", () => {
  const messages = buildRepairMessages(
    {
      prompt: "生成一个三层技术架构图",
      diagramType: "layered_architecture",
      presetId: "enterprise_blueprint",
    },
    "Here is your answer: not json",
  );

  assert.match(messages[1].content, /not json/);
  assert.match(messages[0].content, /repair invalid model outputs/i);
});

test("regenerateFromDiagramJson rebuilds prompt from edited JSON", () => {
  const result = regenerateFromDiagramJson({
    meta: {
      title: "Payment Platform",
      diagramType: "layered_architecture",
      version: "1.0.0",
      language: "zh-CN",
    },
    structure: {
      layers: [
        {
          id: "access",
          name: "接入层",
          nodes: [{ id: "gateway", name: "API Gateway" }],
        },
        {
          id: "app",
          name: "应用层",
          nodes: [{ id: "payment_center", name: "支付中心" }],
        },
      ],
    },
    relations: [{ from: "gateway", to: "payment_center" }],
    style: {
      preset: "enterprise_blueprint",
      layout: "top_to_bottom",
      lineStyle: "straight",
      nodeShape: "rounded_rect",
    },
    constraints: {
      preserveExactNodeText: true,
      preserveLayerCount: true,
      noExtraNodes: true,
      noExtraRelations: true,
    },
  });

  assert.match(result.generationPrompt, /Payment Platform/);
  assert.match(result.generationPrompt, /gateway -> payment_center/i);
});
