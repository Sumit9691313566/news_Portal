import dns from "node:dns";
import dotenv from "dotenv";

// Use stable public resolvers so MongoDB SRV lookup works on restrictive networks.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ENV loads before any runtime imports.
dotenv.config();

console.log("ENV Loaded at bootstrap");

await import("./server.js");
