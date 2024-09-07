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
    }
}

module.exports = {
    ChatServer,
};