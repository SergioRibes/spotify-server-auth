import dotenv from "dotenv";
import express from "express";
import qs from "qs";
import axios from "axios";

import { generateRandomString, loadConfigToEnv, updateEnvFile } from "./utils.js";

const app = express();

[".env", "auth.env"].forEach((path) => dotenv.config({ path }));

async function spotifyAuthenticate(code) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authToken = Buffer.from(`${clientId}:${clientSecret}`, "utf-8").toString("base64");

    try {
        const token_url = 'https://accounts.spotify.com/api/token';
        const data = qs.stringify({
            'code': code,
            'redirect_uri': process.env.SPOTIFY_REDIRECT_URI,
            'grant_type': 'authorization_code'
        });

        const response = await axios.post(token_url, data, {
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            json: true
        })
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

//define first route
app.get("/", (req, res) => { });


//define second route
app.get("/login", (req, res) => {
    if ("refresh_token" in process.env) {
        console.log("Authorization already provided. Generating new refresh_token...");
        console.log(`http://localhost:${process.env.PORT}/refresh_token?` +
            qs.stringify({
                refresh_token: process.env["refresh_token"]
            }));
        res.redirect(`http://localhost:${process.env.PORT}/refresh_token?` +
            qs.stringify({
                refresh_token: process.env["refresh_token"]
            }));
    } else {
        console.log("Starting Spotify Login Authorization Page...");
        const state = generateRandomString(16);
        res.redirect("https://accounts.spotify.com/authorize?" +
            qs.stringify({
                response_type: "code",
                client_id: process.env.SPOTIFY_CLIENT_ID,
                scope: process.env.SPOTIFY_SCOPES,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                state: state,
            }));
    }
});

app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect("/#" + qs.stringify({
            error: "state_mismatch"
        }))
    } else {
        const tokens = await spotifyAuthenticate(code) || null;
        if (tokens)
            loadConfigToEnv(tokens);
        res.json({ message: "Successfull Authentication" });
    }


})

//define third route
app.get("/refresh_token", async (req, res) => {
    let refreshToken = req.query.refresh_token;
    const refreshUrl = "https://accounts.spotify.com/api/token";
    const data = qs.stringify({
        refresh_token: refreshToken,
        grant_type: "refresh_token"
    });

    const clientB64 = new Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")

    const response = await axios.post(refreshUrl, data, {
        headers: {
            content_type: "aplication/x-www-form-urlencoded",
            Authorization: "Basic " + clientB64
        },
        json: true
    });

    process.env["access_token"] = response.data.access_token;
    process.env["refresh_token"] = response.data.refresh_token || refreshToken;

    updateEnvFile(
        process.env["access_token"],
        process.env["refresh_token"]
    )

    res.json({
        message: "Refresh token updated with success."
    })
});

// run server
app.listen(8080, function (error) {
    if (error) console.log(error);
    console.log("Server listening on Port 8080");
})
