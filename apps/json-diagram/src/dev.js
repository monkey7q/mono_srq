"use strict";

const { runPipeline } = require("./index");

const sampleInput = {
  prompt: "请生成一个电商平台的分层技术架构图，包含接入层、应用层和数据层。",
  diagramType: "layered_architecture",
  presetId: "enterprise_blueprint",
};

(async () => {
  const result = await runPipeline(sampleInput);

  if (!result.ok) {
    console.error("Pipeline failed:");
    console.error(result.errors);
    process.exitCode = 1;
    return;
  }

  console.log("Pipeline succeeded.\n");
  console.log("Provider:");
  console.log(JSON.stringify(result.provider, null, 2));
  console.log("\nNormalized input:");
  console.log(JSON.stringify(result.input, null, 2));
  console.log("\nDiagram JSON:");
  console.log(JSON.stringify(result.diagram, null, 2));
  console.log("\nGeneration prompt:");
  console.log(result.generationPrompt);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
