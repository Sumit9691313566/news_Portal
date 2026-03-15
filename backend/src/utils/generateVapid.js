import webpush from "web-push";
import fs from "fs";
import path from "path";

const keys = webpush.generateVAPIDKeys();
const out = {
  publicKey: keys.publicKey,
  privateKey: keys.privateKey,
};

const dest = path.resolve(process.cwd(), "vapid-keys.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2), { encoding: "utf8" });
console.log("VAPID keys generated and written to:", dest);
console.log(JSON.stringify(out, null, 2));

// Friendly .env snippet
console.log("---- Add these to your backend .env ----");
console.log(`VAPID_PUBLIC_KEY=${out.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${out.privateKey}`);
console.log("VAPID_CONTACT=mailto:you@yourdomain.com");
