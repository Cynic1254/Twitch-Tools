//@ts-check

import { TwitchAuth } from "./OAuth";
import { TwitchSocket } from "./Websockets";

document.addEventListener("DOMContentLoaded", async () => {
    const websocket = new TwitchSocket(
        new TwitchAuth(
            "fipq3q036ooy0les1ab2nvung6g9ya",
            new Set(["user:read:chat"]),
            window.location.href
        )
    );

    const chatElement = document.getElementById("chat");
    const userID = new Promise(async (resolve, reject) => {
        fetch("https://api.twitch.tv/helix/users", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${await websocket.token.GetAccessToken()}`,
                "Client-Id": "fipq3q036ooy0les1ab2nvung6g9ya",
                "Content-Type": "application/json",
            },
        })
            .then(async (response) => {
                const data = await response.json();
                resolve(data.data[0].id);
            })
            .catch((error) => {
                reject(error);
            });
    });

    if (chatElement) {
        chatElement.append("Hello Chat");
        websocket.SubscribeToEvent(
            "channel.chat.message",
            "1",
            { broadcaster_user_id: await userID, user_id: await userID },
            (object) => {
                chatElement.append("Got message");
            }
        );
    }
});
