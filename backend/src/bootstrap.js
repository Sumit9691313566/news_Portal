import dotenv from "dotenv";

// 🔥 ENV LOADS FIRST — BEFORE ANY IMPORT
dotenv.config();

console.log("🌱 ENV Loaded at bootstrap");

await import("./server.js");
