//@ts-check

export const useTestEnv = false;

export const token = "fipq3q036ooy0les1ab2nvung6g9ya";
export const websocket_url = useTestEnv
    ? "ws://localhost:8080/ws"
    : "wss://eventsub.wss.twitch.tv/ws";
export const api_url = "https://api.twitch.tv/helix";
export const eventsub_url = useTestEnv
    ? `http://localhost:8080/eventsub/subscriptions`
    : `${api_url}/eventsub/subscriptions`;

/**
 * @template Key
 * @template Value
 */
export class BetterMap extends Map {
    /**
     * @param {Key} key
     * @param {Value} defaultValue
     *
     * @returns {Value}
     */
    getOrCreate(key, defaultValue) {
        if (!this.has(key)) {
            this.set(key, defaultValue);
        }
        return this.get(key);
    }
}
