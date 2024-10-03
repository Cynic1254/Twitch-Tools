//@ts-check

class TwitchSocket {
    constructor() {
        this.#websocket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

        this.#websocket.onmessage = this.#OnMessage;
    }

    /**
     * @param {string | URL} ReconnectURL
     */
    Reconnect(ReconnectURL) {
        this.#oldSocket = this.#websocket;
        this.#websocket = new WebSocket(ReconnectURL);
        this.#websocket.onmessage = this.#OnMessage;
        this.#websocket.onclose = this.#OnClose;
    }

    /**
     * @param {number} newTime
     */
    #ResetTimeout(newTime) {
        clearTimeout(this.#timeOutId);
        this.#timeOutId = setTimeout(this.Reconnect, newTime);
    }

    /**
     * @param {MessageEvent} event
     */
    #OnMessage(event) {
        var message = JSON.parse(event.data);

        console.log("Receiving message: ", message);

        switch (message.metadata.message_type) {
            case "session_welcome":
                this.#session_id = message.payload.session.id;
                this.keepalive_timeout =
                    message.payload.session.keepalive_timeout_seconds * 1000;

                if (this.#oldSocket != null) {
                    this.#oldSocket.close();
                }

                this.#ResetTimeout(this.keepalive_timeout);
                break;

            case "session_keepalive":
                this.#ResetTimeout(this.keepalive_timeout);
                break;

            case "notification":
                this.onNotification(message);
                this.#ResetTimeout(this.keepalive_timeout);
                break;

            case "session_reconnect":
                this.Reconnect(message.payload.session.reconnect_url);
                break;
            default:
                console.log(
                    "received invalid message, message type is: ",
                    message.metadata.message_type
                );
                break;
        }
    }

    /**
     * @param {CloseEvent} event
     */
    #OnClose(event) {
        console.log(
            `Connection closed with reason: ${event.reason}, Code: ${event.code}`
        );
    }

    /**
     * subscribe to a specific event on this websocket
     * @param {String} event Name of the Event to subscribe to
     * @param {String} version Version of the event to subscribe to
     * @param {Object} options object containing event data
     */
    SubscribeToEvent(event, version, options) {
        fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
            method: "POST",
            headers: {},
            body: JSON.stringify({}),
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
     * @type {String}
     */
    #session_id = "";
    /**
     * @type {number}
     */
    keepalive_timeout;
    /**
     * @type {string | number | NodeJS.Timeout | undefined}
     */
    #timeOutId;
    /**
     * @type {(arg0: object) => void}
     */
    onNotification;
}
