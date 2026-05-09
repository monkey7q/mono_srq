"use strict";

const {
  listPresets,
  normalizeDiagram,
  validatePromptInput,
} = require("@repo/shared");
const { generateDiagramDraftWithModel, getProviderConfig } = require("./model-client");
const { buildGenerationPrompt } = require("./prompt-builder");

async function runPipeline(input) {
  const inputValidation = validatePromptInput(input);
  if (!inputValidation.ok) {
    return {
      ok: false,
      stage: "input",
      errors: inputValidation.issues,
    };
  }

  const provider = getProviderConfig();
  let draft;

  try {
    draft = await generateDiagramDraftWithModel(inputValidation.value);
  } catch (error) {
    return {
      ok: false,
      stage: "model",
      errors: [error.message],
      provider,
    };
  }

  const diagramValidation = normalizeDiagram(draft);
  if (!diagramValidation.ok) {
    return {
      ok: false,
      stage: "diagram",
      errors: diagramValidation.errors,
      draft,
      provider,
    };
  }

  return {
    ok: true,
    input: inputValidation.value,
    diagram: diagramValidation.value,
    generationPrompt: buildGenerationPrompt(diagramValidation.value),
    presets: listPresets(),
    provider,
  };
}

module.exports = {
  runPipeline,
};
