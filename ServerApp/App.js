// @ts-check

const http = require("http");
const url = require("url");

/**
 * @typedef {(req: http.IncomingMessage, res: http.ServerResponse) => void} Response
 */

/**
 *
 */
class Server {
    constructor() {}

    /**
     * @type {Map<String, Response>}
     */
    routes = new Map();

    /**
     * starts the server on the specified port
     * @param {number} port
     * @param {() => void} callback
     */
    Start(port, callback) {
        this.#server.listen(port, () => {
            console.log("Server running at http://localhost:${port}/");
            callback();
        });
    }

    /**
     * @type {http.Server}
     */
    #server = http.createServer((req, res) => {
        console.log("handling request");

        if (!req.url) {
            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        const parsedURL = new URL(req.url, `http://${req.headers.host}`);

        console.log("path:", parsedURL.pathname);

        if (this.routes.has(parsedURL.pathname)) {
            console.log("found...");
            // @ts-ignore
            this.routes.get(parsedURL.pathname)(req, res);
            return;
        }

        // Handle 404 Not Found
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
        return;
    });
}

module.exports = {
    Server,
};
