"use strict";

const { normalizeText } = require("@repo/shared");

function inferNodes(prompt) {
  const normalized = normalizeText(prompt).toLowerCase();

  if (normalized.includes("电商")) {
    return [
      {
        id: "access",
        name: "接入层",
        nodes: [
          { id: "web", name: "Web" },
          { id: "app", name: "App" }
        ]
      },
      {
        id: "application",
        name: "应用层",
        nodes: [
          { id: "user_center", name: "用户中心" },
          { id: "order_center", name: "订单中心" },
          { id: "payment_center", name: "支付中心" }
        ]
      },
      {
        id: "data",
        name: "数据层",
        nodes: [
          { id: "mysql", name: "MySQL" },
          { id: "redis", name: "Redis" }
        ]
      }
    ];
  }

  return [
    {
      id: "presentation",
      name: "表示层",
      nodes: [
        { id: "client", name: "Client" }
      ]
    },
    {
      id: "service",
      name: "服务层",
      nodes: [
        { id: "gateway", name: "Gateway" },
        { id: "service_core", name: "Service Core" }
      ]
    },
    {
      id: "data",
      name: "数据层",
      nodes: [
        { id: "database", name: "Database" }
      ]
    }
  ];
}

function buildRelations(layers) {
  const flatNodes = layers.flatMap((layer) => layer.nodes.map((node) => node.id));
  const relations = [];

  for (let index = 0; index < flatNodes.length - 1; index += 1) {
    relations.push({
      from: flatNodes[index],
      to: flatNodes[index + 1]
    });
  }

  return relations;
}

function generateDiagramDraft({ prompt, diagramType, presetId }) {
  const layers = inferNodes(prompt);

  return {
    meta: {
      title: normalizeText(prompt).slice(0, 40) || "Generated Diagram",
      diagramType,
      version: "1.0.0",
      language: "zh-CN"
    },
    structure: {
      layers
    },
    relations: buildRelations(layers),
    style: {
      preset: presetId
    },
    constraints: {
      preserveExactNodeText: true,
      preserveLayerCount: true,
      noExtraNodes: true,
      noExtraRelations: true
    }
  };
}

module.exports = {
  generateDiagramDraft
};
