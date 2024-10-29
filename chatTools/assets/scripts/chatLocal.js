//@ts-check

import { TwitchAuth } from "./OAuth.js";
import { TwitchSocket } from "./Websockets.js";
import { Badges, Badge } from "./Badges.js";
import { ChatMessage } from "./message.js";
import * as Global from "./globals.js";

const auth = new TwitchAuth(
    Global.token,
    new Set(["user:read:chat"]),
    window.location.href
);

function CreateChatter(object, element, badges) {
    const badge_ids = object.badges;
    const badgePromise = badge_ids.map(async (badge) => {
        const badgeURL = (await badges.GetBadge(badge.set_id, badge.id))
            .image_url_1x;

        var image = document.createElement("img");
        image.classList.add("badge");
        image.src = badgeURL;

        element.appendChild(image);
    });
    Promise.all(badgePromise).then(() => {
        element.appendChild(document.createTextNode(object.chatter_user_name));
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const websocket = new TwitchSocket(
        auth,
        Global.token,
        Global.websocket_url,
        Global.eventsub_url
    );

    const userID = new Promise(async (resolve, reject) => {
        fetch(`${Global.api_url}/users`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${await websocket.token.GetAccessToken()}`,
                "Client-Id": Global.token,
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

    var badges = new Badges(await userID, auth, Global.token);

    websocket.SubscribeToEvent(
        "channel.chat.message",
        "1",
        { broadcaster_user_id: await userID, user_id: await userID },
        (object) => {
            var chatElement = document.getElementById("chat");

            if (chatElement && chatElement instanceof HTMLTableElement) {
                var row = chatElement.insertRow(-1);
                row.id = object.message_id;
                row.classList.add("ChatMessage");
                row.style.color = object.color;

                CreateChatter(object, row.insertCell(-1), badges);

                var messageCell = row.insertCell(-1);
                messageCell.appendChild(new ChatMessage(object, auth).ToDiv());
                messageCell.classList.add("Message");
            }
        }
    );
});
