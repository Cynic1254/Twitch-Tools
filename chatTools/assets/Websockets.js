//@ts-check

import { TwitchAuth } from "./OAuth";

export class TwitchSocket {
    /**
     * @param {TwitchAuth} token
     * @param {String} clientID
     */
    constructor(token, clientID) {
        this.#client_id = clientID;
        this.#websocket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

        this.#session_id = new Promise((resolve, reject) => {
            this.#promise_resolve = resolve;
        });

        this.#websocket.onmessage = this.#OnMessage.bind(this);
        this.#websocket.onclose = this.#OnClose.bind(this);

        this.token = token;
    }

    /**
     * @param {string | URL} ReconnectURL
     */
    Reconnect(ReconnectURL) {
        console.log("message timeout, reconnecting...");
        this.#oldSocket = this.#websocket;
        this.#websocket = new WebSocket(ReconnectURL);
        this.#websocket.onmessage = this.#OnMessage.bind(this);
        this.#websocket.onclose = this.#OnClose.bind(this);
    }

    /**
     * @param {number} newTime
     */
    #ResetTimeout(newTime) {
        clearTimeout(this.#timeOutId);
        // @ts-ignore
        this.#timeOutId = setTimeout(
            this.Reconnect.bind(this),
            newTime,
            "wss://eventsub.wss.twitch.tv/ws"
        );
    }

    /**
     * @param {string} message_id
     * @returns {boolean}
     */
    #ProcessMessage(message_id) {
        if (this.#messages.has(message_id)) {
            return false;
        }

        this.#messages.add(message_id);
        setTimeout(() => {
            this.#messages.delete(message_id);
        }, 10 * 1000);
        return true;
    }

    /**
     * @param {MessageEvent} event
     */
    #OnMessage(event) {
        var message = JSON.parse(event.data);

        console.log("Receiving message: ", message);

        if (this.#ProcessMessage(message.metadata.message_id)) {
            switch (message.metadata.message_type) {
                case "session_welcome":
                    this.#promise_resolve(message.payload.session.id);
                    this.keepalive_timeout =
                        (message.payload.session.keepalive_timeout_seconds +
                            5) *
                        1000;

                    if (this.#oldSocket != null) {
                        console.log(
                            "Received session welcome... closing old socket..."
                        );
                        this.#oldSocket.close();
                    }

                    this.#ResetTimeout(this.keepalive_timeout);
                    break;

                case "session_keepalive":
                    this.#ResetTimeout(this.keepalive_timeout);
                    break;

                case "notification":
                    const callback = this.#events.get(
                        message.payload.subscription.id
                    );

                    if (callback) {
                        callback(message.payload.event);
                    }

                    this.#ResetTimeout(this.keepalive_timeout);
                    break;

                case "session_reconnect":
                    this.Reconnect(message.payload.session.reconnect_url);
                    break;
                default:
                    console.warn(
                        "received invalid message, message type is: ",
                        message.metadata.message_type
                    );
                    break;
            }
        }
    }

    /**
     * @param {CloseEvent} event
     */
    #OnClose(event) {
        console.log(
            `Connection closed with reason: ${event.reason}, Code: ${event.code}`
        );

        clearTimeout(this.#timeOutId);
    }

    /**
     * subscribe to a specific event on this websocket
     * @param {String} event Name of the Event to subscribe to
     * @param {String} version Version of the event to subscribe to
     * @param {Object} options object containing event data
     * @param {(arg0: object) => void} callback
     * @returns {Promise<string>}
     */
    async SubscribeToEvent(event, version, options, callback) {
        return new Promise((resolve, reject) => {
            this.#session_id.then(async (session_id_in) => {
                fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${await this.token.GetAccessToken()}`,
                        "Client-Id": this.#client_id,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type: event,
                        version: version,
                        condition: options,
                        transport: {
                            method: "websocket",
                            session_id: session_id_in,
                        },
                    }),
                }).then(async (response) => {
                    if (response.status == 202) {
                        var id = (await response.json()).data[0].id;

                        this.#events.set(id, callback);

                        resolve(id);
                        return;
                    }

                    console.error(
                        "Creating subscription failed: ",
                        response.status
                    );
                    reject(`Creating subscription failed: ${response.status}`);
                });
            });
        });
    }

    /**
     * @param {string} event_id
     */
    async DeleteEvent(event_id) {
        fetch(
            `https://api.twitch.tv/helix/eventsub/subscriptions?id=${event_id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${await this.token.GetAccessToken()}`,
                    "Client-Id": this.#client_id,
                    "Content-Type": "application/json",
                },
            }
        ).then((response) => {
            if (response.status != 204) {
                console.error(
                    "Creating subscription failed: ",
                    response.status
                );
            }
        });
    }

    /**
     * @type {WebSocket}
     */
    #websocket;
    /**
     * @type {WebSocket}
     */
    #oldSocket;
    /**
     * @type {Promise<string>}
     */
    #session_id;
    /**
     * @type {(value: string | PromiseLike<string>) => void}
     */
    #promise_resolve;
    /**
     * @type {number}
     */
    keepalive_timeout;
    /**
     * @type {number}
     */
    #timeOutId;
    /**
     * @type {TwitchAuth}
     */
    token;
    /**
     * @type {string}
     */
    #client_id;

    /**
     * @type {Map<string, (arg0: object) => void>}
     */
    #events = new Map();

    /**
     * @type {Set<string>}
     */
    #messages = new Set();
}
