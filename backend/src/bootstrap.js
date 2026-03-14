import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Load backend/.env reliably even when the process is started from repo root.
dotenv.config({ path: envPath });

console.log("ENV Loaded at bootstrap");

await import("./server.js");
