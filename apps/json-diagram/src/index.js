"use strict";
//以下四个函数分别对应mvp的四个主流程
const {
  listPresets,
  normalizeDiagram,
  validatePromptInput,
} = require("@repo/shared");
const { generateDiagramDraft } = require("./mock-llm");
const { buildGenerationPrompt } = require("./prompt-builder");

function runPipeline(input) {
  const inputValidation = validatePromptInput(input);
  if (!inputValidation.ok) {
    return {
      ok: false,
      stage: "input",
      errors: inputValidation.issues,
    };
  }

  const draft = generateDiagramDraft(inputValidation.value);
  const diagramValidation = normalizeDiagram(draft);
  if (!diagramValidation.ok) {
    return {
      ok: false,
      stage: "diagram",
      errors: diagramValidation.errors,
      draft,
    };
  }

  return {
    ok: true,
    input: inputValidation.value,
    diagram: diagramValidation.value,
    generationPrompt: buildGenerationPrompt(diagramValidation.value),
    presets: listPresets(),
  };
}

module.exports = {
  runPipeline,
};
