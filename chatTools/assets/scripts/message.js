//@ts-check

import * as Global from "./globals.js";
import { TwitchAuth } from "./OAuth.js";

class Emote {
    /**
     * @typedef {{ id: string; emote_set_id: string; owner_id: string; format: ["animated", "static"] | ["static", "animated"]; }} JsonEmote
     */

    /**
     *
     * @param {JsonEmote} emote
     * @param {TwitchAuth} Token
     * @returns {Promise<Emote>}
     */
    static GetEmote(emote, Token) {
        return new Promise((resolve, reject) => {
            if (this.#emotes.has(emote.owner_id)) {
                // @ts-ignore
                if (this.#emotes.get(emote.owner_id).has(emote.id)) {
                    // @ts-ignore
                    resolve(this.#emotes.get(emote.owner_id).get(emote.id));
                    return;
                }
            }

            return (async () => {
                var URL =
                    emote.owner_id == "0"
                        ? `${Global.api_url}/chat/emotes/global`
                        : `${Global.api_url}/chat/emotes?broadcaster_id=${emote.owner_id}`;

                fetch(URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await Token.GetAccessToken()}`,
                        "Client-Id": Global.token,
                        "Content-Type": "application/json",
                    },
                })
                    .then(async (response) => {
                        var object = await response.json();

                        resolve(
                            this.#emotes
                                .getOrCreate(
                                    emote.owner_id,
                                    new Global.BetterMap()
                                )
                                .set(
                                    emote.id,
                                    new Emote(emote, object.template)
                                )
                                .get(emote.id)
                        );
                        return;
                    })
                    .catch((error) => {
                        reject(error);
                    });
            })();
        });
    }

    /**
     * @private
     * @param {JsonEmote} emote
     * @param {string} template
     */
    constructor(emote, template) {
        this.id = emote.id;
        this.emote_set_id = emote.emote_set_id;
        this.owner_id = emote.owner_id;
        this.format = emote.format;

        this.template = template.replace(/{{(.*?)}}/g, (_, key) => {
            switch (key) {
                case "id":
                    return emote.id;
                case "format":
                    if (emote.format.includes("animated")) {
                        return "animated";
                    }
                    return "static";
                case "scale":
                    return "{{scale}}";
                case "theme_mode":
                    return "light";
                default:
                    return "undefined";
            }
        });
    }

    GetURL(scale = "1.0") {
        return this.template.replace("{{scale}}", scale);
    }

    /**
     * @type {string}
     */
    id;

    /**
     * @type {string}
     */
    emote_set_id;

    /**
     * @type {string}
     */
    owner_id;

    /**
     * @type {["animated", "static"] | ["static", "animated"]}
     */
    format;

    /**
     * @type {string}
     */
    template;

    /**
     * @type {Global.BetterMap<string, Global.BetterMap<string, Emote>>}
     */
    static #emotes = new Global.BetterMap();
}

class Fragment {
    /**
     * @typedef {{ type: string; text: string; cheermote: { prefix: string; bits: number; tier: number; }; emote: { id: string; emote_set_id: string; owner_id: string; format: ["animated", "static"] | ["static", "animated"]; }; }} FragmentJSON
     */

    /**
     * @param {FragmentJSON} fragment
     * @param {TwitchAuth} Token
     */
    constructor(fragment, Token) {
        this.type = fragment.type;
        this.text = fragment.text;
        this.cheermote = fragment.cheermote;
        if (fragment.type == "emote") {
            this.emote = Emote.GetEmote(fragment.emote, Token);
        }
    }

    /**
     *
     * @returns
     */
    ToDiv() {
        switch (this.type) {
            case "text":
                var div = document.createElement("span");
                div.appendChild(document.createTextNode(this.text));
                div.classList.add("text");
                return div;
            case "cheermote":
                var div = document.createElement("span");
                div.appendChild(
                    document.createTextNode(`cheermote:${this.text}`)
                );
                div.classList.add("cheermote");
                return div;
            case "emote":
                var image = document.createElement("img");
                image.classList.add("emote");
                (async () => {
                    image.src = (await this.emote).GetURL();
                })();

                return image;
            case "mention":
                var div = document.createElement("span");
                div.appendChild(
                    document.createTextNode(`mention:${this.text}`)
                );
                div.classList.add("mention");
                return div;
            default:
                var div = document.createElement("span");
                div.appendChild(document.createTextNode(`Undefined`));
                div.classList.add("mention");
                return div;
        }
    }

    /**
     * @type {string}
     */
    type;
    /**
     * @type {string}
     */
    text;

    /**
     * @typedef {object} Cheermote
     * @property {string} prefix
     * @property {number} bits
     * @property {number} tier
     */

    /**
     * @type {Cheermote}
     */
    cheermote;

    /**
     * @type {Promise<Emote>}
     */
    emote;
    /**
     * @typedef {object} Mention
     * @property {string} user_id
     * @property {string} user_name
     * @property {string} user_login
     */

    /**
     * @type {Mention}
     */
    mention;
}

export class ChatMessage {
    /**
     * @param {TwitchAuth} Token
     * @param {{ message: { fragments: FragmentJSON[]; }; message_id: string; }} message
     */
    constructor(message, Token) {
        message.message.fragments.forEach(
            (/** @type {FragmentJSON} */ fragment) => {
                this.#fragments.push(new Fragment(fragment, Token));
            }
        );

        this.#messageID = message.message_id;
    }

    ToDiv() {
        var div = document.createElement("div");
        this.#fragments.forEach((fragment) => {
            div.appendChild(fragment.ToDiv());
        });

        div.classList.add("Message");
        div.id = this.#messageID;

        return div;
    }

    /**
     * @type {string}
     */
    #messageID;
    /**
     * @type {Array<Fragment>}
     */
    #fragments = new Array();
}
