"use strict";

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

function createClient() {
  return new PrismaClient();
}

const prisma = globalForPrisma.__jsonDiagramPrisma || createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__jsonDiagramPrisma = prisma;
}

module.exports = {
  prisma,
};
