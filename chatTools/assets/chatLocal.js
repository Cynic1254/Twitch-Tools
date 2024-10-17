import { TwitchAuth } from "./OAuth";
import { TwitchSocket } from "./Websockets";
import { Badges, Badge } from "./Badges";

const token = "fipq3q036ooy0les1ab2nvung6g9ya";
const auth = new TwitchAuth(
    token,
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
    const websocket = new TwitchSocket(auth, token);

    const userID = new Promise(async (resolve, reject) => {
        fetch("https://api.twitch.tv/helix/users", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${await websocket.token.GetAccessToken()}`,
                "Client-Id": token,
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

    var badges = new Badges(await userID, auth, token);

    websocket.SubscribeToEvent(
        "channel.chat.message",
        "1",
        { broadcaster_user_id: await userID, user_id: await userID },
        (object) => {
            var chatElement = document.getElementById("chat");

            if (chatElement) {
                var row = chatElement.insertRow(-1);
                row.id = object.message_id;
                row.classList.add("ChatMessage");
                row.style.color = object.color;

                CreateChatter(object, row.insertCell(-1), badges);

                var messageCell = row.insertCell(-1);
                messageCell.innerText = object.message.text;
                messageCell.classList.add("Message");
            }
        }
    );
});
