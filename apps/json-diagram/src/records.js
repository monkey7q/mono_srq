"use strict";

const { DEFAULT_PRESET_ID, normalizeText } = require("@repo/shared");
const { prisma } = require("./db");

function buildRecordTitle(inputPrompt, fallbackTitle) {
  const preferred = normalizeText(fallbackTitle);
  if (preferred && preferred !== "Untitled Diagram") {
    return preferred.slice(0, 80);
  }

  const promptTitle = normalizeText(inputPrompt);
  if (!promptTitle) {
    return "Untitled Record";
  }

  return promptTitle.slice(0, 80);
}

function serializeRecord(record) {
  return {
    id: record.id,
    title: record.title,
    inputPrompt: record.inputPrompt,
    diagramType: record.diagramType,
    presetId: record.presetId,
    provider: record.provider,
    diagramJson: record.diagramJson,
    generationPrompt: record.generationPrompt,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function serializeRecordSummary(record) {
  return {
    id: record.id,
    title: record.title,
    presetId: record.presetId,
    provider: record.provider,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildPersistencePayload(input) {
  return {
    title: buildRecordTitle(input.inputPrompt, input.title),
    inputPrompt: normalizeText(input.inputPrompt),
    diagramType: normalizeText(input.diagramType) || "layered_architecture",
    presetId: normalizeText(input.presetId) || DEFAULT_PRESET_ID,
    provider: normalizeText(input.provider) || "deepseek",
    diagramJson: String(input.diagramJson || ""),
    generationPrompt: String(input.generationPrompt || ""),
    status: normalizeText(input.status) || "generated",
  };
}

async function listRecords() {
  const records = await prisma.generationRecord.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map(serializeRecordSummary);
}

async function getRecordById(id) {
  const record = await prisma.generationRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return null;
  }

  return serializeRecord(record);
}

async function createRecord(input) {
  const payload = buildPersistencePayload(input);
  const record = await prisma.generationRecord.create({
    data: payload,
  });

  return serializeRecord(record);
}

async function updateRecord(id, input) {
  const payload = buildPersistencePayload(input);
  const record = await prisma.generationRecord.update({
    where: { id },
    data: payload,
  });

  return serializeRecord(record);
}

module.exports = {
  createRecord,
  getRecordById,
  listRecords,
  updateRecord,
};
