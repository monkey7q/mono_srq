"use strict";

const { normalizeText } = require("@repo/shared");
const { loadLocalEnv } = require("./env");

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";

function getProviderConfig() {
  loadLocalEnv();

  const apiKey = normalizeText(process.env.DEEPSEEK_API_KEY);
  if (!apiKey) {
    return {
      provider: "deepseek",
      enabled: false,
      reason: "Missing DEEPSEEK_API_KEY. Create apps/json-diagram/.env.local first.",
    };
  }

  return {
    provider: "deepseek",
    enabled: true,
    baseUrl: normalizeText(process.env.DEEPSEEK_BASE_URL) || DEFAULT_BASE_URL,
    model: normalizeText(process.env.DEEPSEEK_MODEL) || DEFAULT_MODEL,
    apiKey,
  };
}

function buildJsonShapeExample(input) {
  return JSON.stringify(
    {
      meta: {
        title: "Example Diagram Title",
        diagramType: input.diagramType,
        version: "1.0.0",
        language: "zh-CN",
      },
      structure: {
        layers: [
          {
            id: "layer_access",
            name: "接入层",
            nodes: [
              {
                id: "web",
                name: "Web",
                summary: "optional short summary",
              },
            ],
          },
          {
            id: "layer_application",
            name: "应用层",
            nodes: [
              {
                id: "service_a",
                name: "服务A",
                summary: "optional short summary",
              },
            ],
          },
        ],
      },
      relations: [
        {
          from: "web",
          to: "service_a",
          label: "",
        },
      ],
      style: {
        preset: input.presetId,
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
    },
    null,
    2,
  );
}

function buildMessages(input) {
  return [
    {
      role: "system",
      content: [
        "You are a JSON generator for architecture diagrams.",
        "Your output must be exactly one valid JSON object.",
        "Do not output markdown fences.",
        "Do not output any explanation before or after the JSON.",
        "Do not output comments.",
        "The top-level keys must be exactly: meta, structure, relations, style, constraints.",
        "meta must include: title, diagramType, version, language.",
        "structure must include: layers.",
        "Each layer must include: id, name, nodes.",
        "Each node must include: id, name, summary.",
        "relations must be an array of objects with from, to, label.",
        "style must include: preset, layout, lineStyle, nodeShape.",
        "constraints must include: preserveExactNodeText, preserveLayerCount, noExtraNodes, noExtraRelations.",
        `meta.diagramType must equal "${input.diagramType}".`,
        `style.preset must equal "${input.presetId}".`,
        "Every id must be snake_case and unique.",
        "Do not add modules that are not implied by the user requirement.",
        "If the requirement is incomplete, still output a valid JSON object with your best conservative structure.",
        "Use the following JSON shape as the required output format:",
        buildJsonShapeExample(input),
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "Convert the following requirement into the required JSON object.",
        "Return JSON only.",
        input.prompt,
      ].join("\n"),
    },
  ];
}

function buildRepairMessages(input, rawOutput) {
  return [
    {
      role: "system",
      content: [
        "You repair invalid model outputs into one valid JSON object.",
        "Return exactly one JSON object.",
        "Do not output markdown fences.",
        "Do not output explanations.",
        `meta.diagramType must equal "${input.diagramType}".`,
        `style.preset must equal "${input.presetId}".`,
        "The top-level keys must be exactly: meta, structure, relations, style, constraints.",
        "If information is missing, preserve what is present and fill conservative defaults.",
        "Here is the required output shape:",
        buildJsonShapeExample(input),
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "The previous response was not a valid JSON object.",
        "Rewrite it into one valid JSON object that follows the required shape.",
        "Previous response:",
        rawOutput,
      ].join("\n"),
    },
  ];
}

function extractTextContent(payload) {
  const content =
    payload &&
    payload.choices &&
    payload.choices[0] &&
    payload.choices[0].message &&
    payload.choices[0].message.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item && typeof item.text === "string" ? item.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractFirstJsonObject(text) {
  const source = String(text || "").trim();
  const fenceMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : source;
  const start = candidate.indexOf("{");

  if (start === -1) {
    throw new Error("Model response does not contain a JSON object.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < candidate.length; index += 1) {
    const char = candidate[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return candidate.slice(start, index + 1);
      }
    }
  }

  throw new Error("Model response contains malformed JSON.");
}

async function requestChatCompletion(config, messages) {
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function parseResponseAsJson(config, input, messages, repairOnFailure = true) {
  const payload = await requestChatCompletion(config, messages);
  const text = extractTextContent(payload);

  try {
    const jsonText = extractFirstJsonObject(text);
    return JSON.parse(jsonText);
  } catch (error) {
    if (!repairOnFailure) {
      throw error;
    }

    const repairMessages = buildRepairMessages(input, text || "[empty response]");
    const repairPayload = await requestChatCompletion(config, repairMessages);
    const repairText = extractTextContent(repairPayload);
    const repairedJsonText = extractFirstJsonObject(repairText);
    return JSON.parse(repairedJsonText);
  }
}

async function generateDiagramDraftWithModel(input) {
  const config = getProviderConfig();
  if (!config.enabled) {
    throw new Error(config.reason || "DeepSeek provider is not enabled.");
  }

  return parseResponseAsJson(config, input, buildMessages(input), true);
}

module.exports = {
  buildMessages,
  buildRepairMessages,
  extractFirstJsonObject,
  generateDiagramDraftWithModel,
  getProviderConfig,
};
