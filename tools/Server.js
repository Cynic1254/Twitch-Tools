// @ts-check

const path = require("path");
const FileSystem = require("fs");
const { Trie } = require("./trie");
const http = require("http");

/**
 * @typedef {(req: http.IncomingMessage, res: http.ServerResponse, searchResult: InstanceType<Trie<Response>['ResponseObject']>) => void} Response
 */

class Subdomain {
    /**
     *
     * @param {Server} server
     */
    constructor(server) {
        this.routes.Insert(
            Array("SubdomainRedirect"),
            RedirectSubdomain(server, "/SubdomainRedirect/")
        ).mayFailHere = true;
    }

    /**
     * @type {Trie<Response>}
     */
    routes = new Trie();

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    HandleCall(req, res) {
        if (!req.url) {
            console.log(`No URL provided`);

            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        const parsedURL = new URL(req.url, `http://${req.headers.host}`);
        console.log(`finding path: ${parsedURL.pathname}...`);

        let result = this.routes.Find(
            parsedURL.pathname.split("/").filter(Boolean)
        );

        if (result.valid) {
            console.log("Route found...");

            // @ts-ignore
            result.response(req, res, result);
            return;
        }

        // Handle 404 Not Found
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
        return;
    }
}

class FileServer extends Subdomain {
    /**
     * @param {Server} server
     */
    constructor(server) {
        super(server);
    }

    /**
     * @type {Trie<String>}
     */
    #allowedPaths = new Trie();

    /**
     *
     * @param {String[]} Segments
     * @param {String} Path
     */
    AddNewPath(Segments, Path) {
        const node = this.#allowedPaths.Insert(Segments, Path);
        node.mayFailHere = true;
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    HandleCall(req, res) {
        if (!req.url) {
            console.log(`No URL provided`);

            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        const parsedURL = new URL(req.url, `http://${req.headers.host}`);
        console.log(`finding path: ${parsedURL.pathname}...`);

        let result = this.#allowedPaths.Find(
            parsedURL.pathname.split("/").filter(Boolean)
        );

        if (result.valid) {
            console.log("Route found...");

            // @ts-ignore
            this.#Response(req, res, result);
            return;
        }

        // Handle 404 Not Found
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
        return;
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     * @param {InstanceType<Trie<String>['ResponseObject']>} result
     */
    #Response(req, res, result) {
        if (!result.response || !result.restPath) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        let filePath = path.join(
            result.response,
            "/",
            result.restPath.join("/")
        );

        if (!path.isAbsolute(filePath)) {
            console.log(`filePath isn't absolute: ${filePath}`);
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain");
            res.end("Server Error");
            return;
        }

        if (filePath.startsWith(result.response)) {
            console.log(`found file, serving ${filePath}...`);
            ServeFile(filePath)(req, res);
            return;
        }

        console.log(
            `file pointed outside of allowed folder, path is ${filePath}, allowed path is ${result.response}, ignoring...`
        );
        // Handle 404 Not Found
        res.statusCode = 403;
        res.setHeader("Content-Type", "text/plain");
        res.end("403 Forbidden");
        return;
    }
}

class Server {
    /**
     * @param {string} rootDomain
     * @param {number} port
     */
    constructor(rootDomain, port) {
        this.#rootDomain = rootDomain;
        this.#port = port;

        // assign loopback at root of trie so we can just ignore different rootDomain formats
        this.subdomains.fallback = this.subdomains;
        this.subdomains.Insert(new Array(), new Subdomain(this));

        this.#server.on("error", (err) => {
            console.error(`error occured: ${err.name}, ${err.message}`);
        });
    }

    /**
     * get the default subdomain (the domain requests get send to if no matching domain is found)
     * @returns Subdomain
     */
    DefaultDomain() {
        let defaultDomain = this.subdomains.Find(new Array()).response;
        if (!defaultDomain) {
            throw new Error(`No DefaultDomain present`);
        }
        return defaultDomain;
    }

    /**
     * @param {() => void} callback
     */
    Start(callback) {
        this.#server.listen(this.#port, this.#rootDomain, () => {
            console.log(
                `Server listening on: http://${this.#rootDomain}:${this.#port}`
            );
            callback();
        });
    }

    /**
     * @type {Trie<Subdomain>}
     */
    subdomains = new Trie();

    /**
     * @type {String}
     */
    #rootDomain;
    /**
     * @type {number}
     */
    #port = -1;

    /**
     * @type {http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>}
     */
    #server = http.createServer((req, res) => {
        if (!req.url) {
            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        console.log(`handling request at: ${req.headers.host}${req.url}`);

        let host = req.headers.host;

        if (!host) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 hostname not valid");
            return;
        }

        let domains = host.split(".").reverse();

        let result = this.subdomains.Find(domains);

        if (result.valid) {
            // console.log(`found match at: ${result.foundPath}`);

            // @ts-ignore
            result.response.HandleCall(req, res);
            return;
        }

        // Handle 404 Not Found
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
        return;
    });
}

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

    // console.log(
    //     `registering new callback for file: ${AbsolutePath}, with fileType" ${Type}`
    // );

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    return (req, res) => {
        FileSystem.readFile(AbsolutePath, (err, data) => {
            if (err) {
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

/**
 *
 * @param {Server} Server server to get subdomains from
 * @param {string} path the path the request uses
 * @returns Response
 */
function RedirectSubdomain(Server, path = "/") {
    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    return (req, res, unused) => {
        if (!req.url) {
            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        if (!req.url.startsWith(path)) {
            // Handle 404 Not Found
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("404 Not Found");
            return;
        }

        console.log(`Redirect url: ${req.url}`);
        let url = new URL(`http://${req.headers.host}${req.url}`);
        console.log(`pathname: ${url.pathname}`);
        let host = url.pathname.slice(path.length).split("/");

        let result = Server.subdomains.Find(host, true, true);

        if (result.valid) {
            // @ts-ignore
            req.url = "/" + result.restPath.join("/") + url.search + url.hash;

            console.log(`constructed new url: ${req.url}`);

            // @ts-ignore
            result.response.HandleCall(req, res);
            return;
        }

        // Handle 404 Not Found
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("404 Not Found");
        return;
    };
}

module.exports = {
    Subdomain,
    FileServer,
    Server,
    ServeFile,
    RedirectSubdomain,
};
