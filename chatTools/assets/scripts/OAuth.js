// @ts-check

export class TwitchAuth {
    /**
     * @param {string} client_id
     * @param {Set<string>} scope
     * @param {string} redirectURI
     */
    constructor(client_id, scope, redirectURI) {
        this.client_id = client_id;
        this.#scope = scope;
        if (redirectURI) {
            this.redirect_uri = redirectURI;
        } else {
            this.redirect_uri = window.location.href;
        }
    }

    /**
     * @returns {Promise<string>}
     */
    async GetAccessToken() {
        return new Promise(async (resolve, reject) => {
            if (this.#token && (await this.Validate())) {
                resolve(this.#token);
                return;
            }

            this.#token = localStorage.getItem("TwitchAuth::Token");
            if (this.#token && (await this.Validate())) {
                resolve(this.#token);
                return;
            }

            const HashParams = new URLSearchParams(
                document.location.hash.slice(1)
            );
            if (new URL(document.location.href).searchParams.has("error")) {
                throw new Error("fuck");
            }

            HashParams.forEach((Element) => {
                console.log(Element);
            });

            this.#token = HashParams.get("access_token");
            if (this.#token && (await this.Validate())) {
                console.log("token stored");
                localStorage.setItem("TwitchAuth::Token", this.#token);
                resolve(this.#token);
                return;
            }

            this.GetNewToken();

            reject("All token locations failed to retrieve");
            return;
        });
    }

    /**
     * @returns {Promise<boolean>}
     */
    async Validate() {
        return new Promise((resolve, reject) => {
            fetch("https://id.twitch.tv/oauth2/validate", {
                headers: {
                    Authorization: `Bearer ${this.#token}`,
                },
            })
                .then(async (response) => {
                    if (response.status == 401) {
                        resolve(false);
                        return;
                    }

                    /**
                     * @type {Array<string>}
                     */
                    const currentScope = (await response.json()).scopes;
                    if (
                        !currentScope.every((scope) => this.#scope.has(scope))
                    ) {
                        this.GetNewToken();
                    }

                    resolve(true);
                    return;
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }

    /**
     * @return {never}
     */
    GetNewToken() {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${
            this.client_id
        }&redirect_uri=${
            this.redirect_uri
        }&response_type=token&scope=${encodeURIComponent(
            Array.from(this.#scope).join("+")
        )}`;

        throw new Error("HI UwU");
    }

    GetScope() {
        return this.#scope;
    }

    /**
     * Set the required scope for the Oauth, preferibly this shoul be set before accessing the token since afterwards the user will need to revalidate.
     * @param {Iterable<string> | ArrayLike<string>} scope
     */
    SetScope(scope) {
        this.#scope = new Set(
            Array.from(scope).map((scope) => scope.replace("/[.:]/g", ":"))
        );
    }

    /**
     * @param {string} scope
     */
    AddScope(scope) {
        this.#scope.add(scope.replace("/[.:]/g", ":"));
    }

    /**
     * @type {string}
     */
    client_id;
    /**
     * @type {Set<string>}
     */
    #scope;
    /**
     * @type {string}
     */
    redirect_uri;

    /**
     * @type {string | null}
     */
    #token;
}
