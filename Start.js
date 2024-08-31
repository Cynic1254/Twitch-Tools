// @ts-check
const path = require("path");
const app = require("./tools/Server");

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

defaultDomain.routes.PrintTree("root");

serverApp.Start(() => {});
