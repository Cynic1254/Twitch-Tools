const path = require("path");
const app = require("../tools/Server");

class ChatServer extends app.Subdomain {
    constructor(server) {
        super(server);

        this.routes.Insert(
            Array(),
            app.ServeFile(path.join(__dirname, "./assets/chat.html"))
        );

        this.routes.Insert(
            Array("assets", "chatLocal"),
            app.ServeFile(path.join(__dirname, "./assets/chatLocal.js"))
        );

        this.routes.Insert(
            Array("assets", "Websockets"),
            app.ServeFile(path.join(__dirname, "./assets/Websockets.js"))
        );

        this.routes.Insert(
            Array("assets", "OAuth"),
            app.ServeFile(path.join(__dirname, "./assets/OAuth.js"))
        );

        this.routes.Insert(
            Array("assets", "Badges"),
            app.ServeFile(path.join(__dirname, "./assets/Badges.js"))
        );
    }
}

module.exports = {
    ChatServer,
};
