// @ts-check
const path = require("path");
const app = require("./tools/Server");
const chat = require("./chatTools/chatServer");

const serverApp = new app.Server("localhost", 3000);
const defaultDomain = serverApp.DefaultDomain();

defaultDomain.routes.Insert(
    new Array(),
    app.ServeFile(path.join(__dirname, "/HelloWorld.html"))
);

defaultDomain.routes.Insert(
    new Array("favicon.ico"),
    app.ServeFile(path.join(__dirname, "assets/images/favicon.ico"))
);

const FileDomain = new app.FileServer(serverApp);
FileDomain.AddNewPath(Array(), path.join(__dirname, "./assets"));

serverApp.subdomains.Insert(Array("file"), FileDomain);

const chatDomain = new chat.ChatServer(serverApp);

serverApp.subdomains.Insert(Array(), chatDomain);

serverApp.Start(() => {});
