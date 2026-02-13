// server.js
const express = require('express');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ----------------------
// LOAD ENV
// ----------------------
require('dotenv').config();

// ----------------------
// AUTO-GENERATE HWID
// ----------------------
function generateHWID() {
    const sysInfo = [
        os.hostname(),
        os.platform(),
        os.arch(),
        os.cpus()[0].model,
        os.totalmem().toString()
    ].join('-');
    return crypto.createHash('sha256').update(sysInfo).digest('hex');
}

const HWID = generateHWID();
console.log("Generated HWID:", HWID);

// ----------------------
// LICENSE VALIDATION
// ----------------------
const LICENSE_KEY = process.env.LICENSE_KEY;
const DISCORD_ID = process.env.DISCORD_ID;

if (!LICENSE_KEY || !DISCORD_ID) {
    console.error("Missing LICENSE_KEY or DISCORD_ID in .env. Server cannot start.");
    process.exit(1);
}

// Node <18 compatibility for fetch
let fetch;
try {
    fetch = global.fetch || require('node-fetch');
} catch {
    console.error("node-fetch not installed. Run: npm i node-fetch@2");
    process.exit(1);
}

async function validateLicense(key, discordId, hwid) {
    try {
        
        const response = await fetch("https://license.noxxbot.com/api/validate", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, discordId, hwid }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.warn(`[LICENSE] Validation request failed: ${text}`);
            return null; // network/server error
        }

        const data = await response.json();
        return data.success === true;
    } catch (err) {
        console.warn("[LICENSE] Validation request error:", err);
        return null; // network/server error
    }
}

// ----------------------
// START EXPRESS SERVER AFTER LICENSE CHECK
// ----------------------
(async () => {
    const isValid = await validateLicense(LICENSE_KEY, DISCORD_ID, HWID);

    if (isValid === false) {
        console.error("[LICENSE] License is invalid! Server will not start.");
        process.exit(1);
    } else if (isValid === null) {
        console.warn("[LICENSE] License server unreachable, starting server anyway...");
    } else {
        console.log("[LICENSE] License validated ✅");

        const app = express();

        // Serve static files from current directory
        app.use(express.static(path.join(__dirname, '.')));

        // Optional fallback to index.html
        app.use((req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        const PORT = 2820;
        app.listen(PORT, '127.0.0.1', () => {
            console.log(`🚀 Cat Bot Web running at http://127.0.0.1:${PORT}`);
        });
    }
})();
