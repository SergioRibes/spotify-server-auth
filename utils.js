import fs from 'fs';
import path from "path";

export function loadConfigToEnv(jsonData) {
    const envData = [];

    for (const [key, value] of Object.entries(jsonData)) {
        envData.push(`${key}=${value}`);
    }

    fs.writeFileSync("auth.env", envData.join("\n") + "\n", "utf8", (err) => {
        if (err) {
            console.log("Error writing to .env file:", err);
        } else {
            console.log("Environment variables loaded to process.env and stored in .env file successfully!");
        }
    })
}

export function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

function parseEnvFile(envContent) {
    return envContent
        .split("\n")
        .filter(line => line.trim && !line.startsWith("#"))
        .reduce((acc, line) => {
            const [key, ...value] = line.split("=");
            acc[key.trim()] = value.join("=").trim();
            return acc;
        }, {});
}

export function updateEnvFile(accessToken, refreshToken) {

    let envContent = "";
    const envPath = path.resolve("auth.env");

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");

        const envVariables = parseEnvFile(envContent);

        envVariables["access_token"] = accessToken;
        envVariables["refresh_token"] = refreshToken;

        const updatedEnvContent = Object.entries(envVariables)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        fs.writeFileSync(envPath, updatedEnvContent, "utf8");
    } else {
        console.log(`${envPath} does not exist!`)
    }
}

