import dotenv from "dotenv";

// ENV loads before any runtime imports.
dotenv.config();

console.log("ENV Loaded at bootstrap");

await import("./server.js");
