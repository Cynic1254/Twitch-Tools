// @ts-check
const app = require("./ServerApp/App");
const fileSystem = require("fs");
const path = require("path");

const serverApp = new app.Server();

serverApp.routes.set("/HelloWorld", (req, res) => {
    fileSystem.readFile(
        path.join(__dirname, "HelloWorld.html"),
        (err, data) => {
            if (err) {
                console.log(err.message);
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end("Server Error");
            } else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                res.end(data);
            }
        }
    );
});

serverApp.Start(3000, () => {});
