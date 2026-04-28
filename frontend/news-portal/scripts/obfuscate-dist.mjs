import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distAssetsDir = path.resolve(__dirname, "../dist/assets");

const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.2,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.08,
  disableConsoleOutput: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ["base64"],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: "function",
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

const shouldObfuscateFile = (filename) =>
  filename.endsWith(".js") && !filename.endsWith(".map");

const run = async () => {
  let files = [];

  try {
    files = await fs.readdir(distAssetsDir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.warn("Skipping obfuscation: dist/assets not found.");
      return;
    }
    throw error;
  }

  const targets = files.filter(shouldObfuscateFile);

  for (const file of targets) {
    const fullPath = path.join(distAssetsDir, file);
    const source = await fs.readFile(fullPath, "utf8");
    const obfuscated = JavaScriptObfuscator.obfuscate(
      source,
      {
        ...OBFUSCATION_OPTIONS,
        seed: file.length * 97,
      }
    ).getObfuscatedCode();
    await fs.writeFile(fullPath, obfuscated, "utf8");
  }

  console.log(`Obfuscated ${targets.length} build asset(s).`);
};

run().catch((error) => {
  console.error("Build obfuscation failed:", error);
  process.exit(1);
});
