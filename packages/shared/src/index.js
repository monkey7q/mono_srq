"use strict";

const DIAGRAM_TYPES = ["layered_architecture"];
const LAYOUTS = ["top_to_bottom", "left_to_right"];
const LINE_STYLES = ["straight", "orthogonal"];
const NODE_SHAPES = ["rounded_rect", "rect"];

const DEFAULT_PRESET_ID = "architecture_storyboard";

const PRESETS = {
  architecture_storyboard: {
    id: "architecture_storyboard",
    label: "Architecture Storyboard",
    layout: "top_to_bottom",
    lineStyle: "straight",
    nodeShape: "rounded_rect",
    palette: {
      background: "#ffffff",
      title: "#0f172a",
      text: "#334155",
      layerBands: ["#2f855a", "#2b6cb0", "#6b46c1", "#c05621"],
      border: "#cbd5e1",
    },
    promptKeywords: [
      "clean architecture storyboard infographic",
      "white canvas with rounded sectional bands",
      "soft scientific presentation style",
      "minimal outline icons and thin strokes",
      "clear top-to-bottom narrative flow",
    ],
    visualRules: {
      canvas: "bright white background with generous whitespace",
      layout:
        "stack layers vertically as large rounded horizontal bands with one band per layer",
      cards:
        "inside each layer, place nodes in tidy white cards with thin colored borders and soft shadows",
      iconography:
        "use simple outline icons, restrained decoration, and presentation-grade typography",
      arrows:
        "use sparse downward connectors and only show dependencies between layers",
    },
  },
};

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

function createValidationError(message, details) {
  const error = new Error(message);
  error.name = "DiagramValidationError";
  error.details = details;
  return error;
}

function getPreset(presetId) {
  return PRESETS[presetId] || null;
}

function listPresets() {
  return Object.values(PRESETS);
}

function validatePromptInput(input) {
  const prompt = normalizeText(input && input.prompt);
  const diagramType =
    normalizeText(input && input.diagramType) || "layered_architecture";
  const presetId =
    normalizeText(input && input.presetId) || DEFAULT_PRESET_ID;
  const issues = [];

  if (!prompt) {
    issues.push("Prompt is required.");
  }
  if (prompt.length > 600) {
    issues.push("Prompt must be 600 characters or fewer.");
  }
  if (prompt && prompt.length < 12) {
    issues.push(
      "Prompt is too short to describe a useful architecture diagram.",
    );
  }
  if (!DIAGRAM_TYPES.includes(diagramType)) {
    issues.push("Unsupported diagram type.");
  }
  if (!PRESETS[presetId]) {
    issues.push("Unknown preset.");
  }

  return {
    ok: issues.length === 0,
    issues,
    value: {
      prompt,
      diagramType,
      presetId,
    },
  };
}

function ensureEnum(value, allowed, field, errors) {
  if (!allowed.includes(value)) {
    errors.push(`${field} must be one of: ${allowed.join(", ")}`);
  }
}

function sanitizeNode(node, layerId, errors) {
  const id = normalizeText(node && node.id);
  const name = normalizeText(node && node.name);

  if (!id) {
    errors.push(`Layer "${layerId}" contains a node without an id.`);
  }
  if (!name) {
    errors.push(`Layer "${layerId}" contains a node without a name.`);
  }

  return {
    id: id || `node_${Math.random().toString(16).slice(2, 8)}`,
    name: name || "Unnamed Node",
    summary: normalizeText(node && node.summary),
  };
}

function sanitizeLayer(layer, errors) {
  const id = normalizeText(layer && layer.id);
  const name = normalizeText(layer && layer.name);
  const nodes = Array.isArray(layer && layer.nodes) ? layer.nodes : [];

  if (!id) {
    errors.push("Each layer needs an id.");
  }
  if (!name) {
    errors.push(`Layer "${id || "unknown"}" needs a name.`);
  }
  if (nodes.length === 0) {
    errors.push(
      `Layer "${id || name || "unknown"}" must contain at least one node.`,
    );
  }

  const sanitizedNodes = nodes.map((node) =>
    sanitizeNode(node, id || name || "unknown", errors),
  );

  return {
    id: id || `layer_${Math.random().toString(16).slice(2, 8)}`,
    name: name || "Unnamed Layer",
    nodes: dedupeById(sanitizedNodes, errors, "node"),
  };
}

function dedupeById(items, errors, label) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`Duplicate ${label} id "${item.id}" was removed.`);
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

function normalizeDiagram(input) {
  const errors = [];
  const meta = input && typeof input.meta === "object" ? input.meta : {};
  const structure =
    input && typeof input.structure === "object" ? input.structure : {};
  const style = input && typeof input.style === "object" ? input.style : {};
  const constraints =
    input && typeof input.constraints === "object" ? input.constraints : {};

  const diagramType = normalizeText(meta.diagramType) || "layered_architecture";
  ensureEnum(diagramType, DIAGRAM_TYPES, "meta.diagramType", errors);

  const presetId = normalizeText(style.preset) || DEFAULT_PRESET_ID;
  const preset = getPreset(presetId);
  if (!preset) {
    errors.push(`style.preset "${presetId}" is not supported.`);
  }

  const layers = Array.isArray(structure.layers) ? structure.layers : [];
  if (layers.length === 0) {
    errors.push("structure.layers must contain at least one layer.");
  }

  const sanitizedLayers = dedupeById(
    layers.map((layer) => sanitizeLayer(layer, errors)),
    errors,
    "layer",
  );

  const knownNodeIds = new Set(
    sanitizedLayers.flatMap((layer) => layer.nodes.map((node) => node.id)),
  );

  const relationsInput = Array.isArray(input && input.relations)
    ? input.relations
    : [];
  const relations = [];

  for (const relation of relationsInput) {
    const from = normalizeText(relation && relation.from);
    const to = normalizeText(relation && relation.to);

    if (!from || !to) {
      errors.push("Each relation must include both from and to.");
      continue;
    }
    if (!knownNodeIds.has(from) || !knownNodeIds.has(to)) {
      errors.push(`Relation "${from}" -> "${to}" points to a missing node.`);
      continue;
    }

    relations.push({
      from,
      to,
      label: normalizeText(relation && relation.label),
    });
  }

  const layout =
    normalizeText(style.layout) || (preset && preset.layout) || "top_to_bottom";
  const lineStyle =
    normalizeText(style.lineStyle) ||
    (preset && preset.lineStyle) ||
    "straight";
  const nodeShape =
    normalizeText(style.nodeShape) ||
    (preset && preset.nodeShape) ||
    "rounded_rect";

  ensureEnum(layout, LAYOUTS, "style.layout", errors);
  ensureEnum(lineStyle, LINE_STYLES, "style.lineStyle", errors);
  ensureEnum(nodeShape, NODE_SHAPES, "style.nodeShape", errors);

  const value = {
    meta: {
      title: normalizeText(meta.title) || "Untitled Diagram",
      diagramType,
      version: normalizeText(meta.version) || "1.0.0",
      language: normalizeText(meta.language) || "zh-CN",
    },
    structure: {
      layers: sanitizedLayers,
    },
    relations,
    style: {
      preset: presetId,
      layout,
      lineStyle,
      nodeShape,
    },
    constraints: {
      preserveExactNodeText: constraints.preserveExactNodeText !== false,
      preserveLayerCount: constraints.preserveLayerCount !== false,
      noExtraNodes: constraints.noExtraNodes !== false,
      noExtraRelations: constraints.noExtraRelations !== false,
    },
  };

  return {
    ok: errors.length === 0,
    errors,
    value,
  };
}

function parseDiagram(input) {
  const result = normalizeDiagram(input);
  if (!result.ok) {
    throw createValidationError("Diagram validation failed.", result.errors);
  }
  return result.value;
}

module.exports = {
  DEFAULT_PRESET_ID,
  DIAGRAM_TYPES,
  PRESETS,
  createValidationError,
  getPreset,
  listPresets,
  normalizeDiagram,
  normalizeText,
  parseDiagram,
  validatePromptInput,
};
