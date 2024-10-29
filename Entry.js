//@ts-check

const express = require("express");
const FileSystem = require("fs");
const path = require("path");

const app = express();
const port = 80;

app.get(
    "/chat",
    ServeFile(path.join(__dirname, "./chatTools/assets/chat.html"))
);

app.get(
    "/favicon.ico",
    ServeFile(path.join(__dirname, "./assets/images/favicon.ico"))
);

app.use(
    "/chat/assets/",
    express.static(path.join(__dirname, "./chatTools/assets"))
);

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

/**
 * @param {String} AbsolutePath
 * @param {String | null} contentType
 */
function ServeFile(AbsolutePath, contentType = null) {
    if (!path.isAbsolute(AbsolutePath)) {
        throw new Error(
            `filePath isn't absolute, requests won't work correctly: ${AbsolutePath}`
        );
    }

    let fileExt = path.extname(AbsolutePath);
    /**
     * @type {String | null}
     */
    let Type = contentType;

    if (!Type) {
        switch (fileExt) {
            case ".js":
                Type = "text/javascript";
                break;
            case ".css":
                Type = "text/css";
                break;
            case ".html":
                Type = "text/html";
                break;
            case ".json":
                Type = "application/json";
                break;
            case ".png":
                Type = "image/png";
                break;
            case ".jpg":
                Type = "image/jpg";
                break;
            case ".ico":
                Type = "image/x-icon";
                break;
            case ".svg":
                Type = "image/svg+xml";
                break;
            default:
                console.log(`couldn't infer filetype assuming plaintext...`);
                Type = "text/plain";
                break;
        }
    }

    return (req, res) => {
        FileSystem.readFile(AbsolutePath, (err, data) => {
            if (err) {
                console.log(AbsolutePath);
                console.log(err.message);
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end("Server Error");
                return;
            }

            console.log(`Serving ${AbsolutePath}, as ${Type}...`);

            res.statusCode = 200;
            res.setHeader("Content-Type", Type);
            res.end(data);
            return;
        });
    };
}
