//@ts-check

import { TwitchAuth } from "./OAuth.js";

export class Badge {
    /**
     * @type {String} set_id
     */
    set_id;
    /**
     * @type {String} id
     */
    id;

    /**
     * @type {String} image_url_1x
     */
    image_url_1x;
    /**
     * @type {String} image_url_2x
     */
    image_url_2x;
    /**
     * @type {String} image_url_4x
     */
    image_url_4x;
}

export class Badges {
    /**
     * @param {String} broadcaster
     * @param {TwitchAuth} token
     * @param {String} client_id
     */
    constructor(broadcaster, token, client_id) {
        if (!Badges.globalBadges) {
            Badges.globalBadges = new Promise(async (resolve, reject) => {
                var returnObject = new Map();

                fetch("https://api.twitch.tv/helix/chat/badges/global", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await token.GetAccessToken()}`,
                        "Client-Id": client_id,
                    },
                })
                    .then(async (response) => {
                        var data = (await response.json()).data;

                        data.forEach((set) => {
                            var badges = new Map();

                            set.versions.forEach((badgeData) => {
                                var badge = new Badge();
                                badge.id = badgeData.id;
                                badge.set_id = set.set_id;
                                badge.image_url_1x = badgeData.image_url_1x;
                                badge.image_url_2x = badgeData.image_url_2x;
                                badge.image_url_4x = badgeData.image_url_4x;

                                badges.set(badgeData.id, badge);
                            });

                            returnObject.set(set.set_id, badges);
                        });

                        resolve(returnObject);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        }

        this.localBadges = new Promise(async (resolve, reject) => {
            var returnObject = new Map();

            fetch(
                `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcaster}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${await token.GetAccessToken()}`,
                        "Client-Id": client_id,
                    },
                }
            )
                .then(async (response) => {
                    var data = (await response.json()).data;

                    data.forEach((set) => {
                        var badges = new Map();

                        set.versions.forEach((badgeData) => {
                            var badge = new Badge();
                            badge.id = badgeData.id;
                            badge.set_id = set.set_id;
                            badge.image_url_1x = badgeData.image_url_1x;
                            badge.image_url_2x = badgeData.image_url_2x;
                            badge.image_url_4x = badgeData.image_url_4x;

                            badges.set(badgeData.id, badge);
                        });

                        returnObject.set(set.set_id, badges);
                    });

                    resolve(returnObject);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    async GetBadge(set_id, id) {
        console.log(`finding badge: ${id}, from set: ${set_id}`);

        if ((await this.localBadges).has(set_id)) {
            console.log(`found set in localbadges...`);
            if ((await this.localBadges).get(set_id).has(id)) {
                console.log(`found badge in localbadges...`);
                return (await this.localBadges).get(set_id).get(id);
            }
        }

        return (await Badges.globalBadges).get(set_id).get(id);
    }

    /**
     * @param {Promise<Map<String, Map<String, Badge>>>} localBadges
     */
    localBadges;
    /**
     * @param {Promise<Map<String, Map<String, Badge>>>} globalBadges
     */
    static globalBadges;
}
