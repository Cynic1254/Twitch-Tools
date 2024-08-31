// @ts-check

/**
 * @template T
 */
class Trie {
    constructor() {}

    /**
     *
     * @param {string[]} segments path of the new action
     * @param {T} action action to execute at path end
     */
    Insert(segments, action) {
        let node = this;

        for (const segment of segments) {
            if (!node.#children.get(segment)) {
                node.#children.set(segment, new Trie());
            }
            // @ts-ignore
            node = node.#children.get(segment);
        }

        node.#action = action;
    }

    /**
     * Insert a node at a specific path, This allows the trie to reference back on itself, in case a node already exists the new node will not be inserted
     * @param {string[]} segments path of the new node to be inserted
     * @param {Trie<T>} newNode node to insert
     */
    CreateLink(segments, newNode) {
        let node = this;

        for (const segment of segments.slice(0, -1)) {
            if (!node.#children.get(segment)) {
                node.#children.set(segment, new Trie());
            }

            //@ts-ignore
            node = node.children.get(segment);
        }

        if (!node.#children.get(segments[segments.length - 1])) {
            node.#children.set(segments[segments.length - 1], newNode);
        }
    }

    /**
     * finds the action at the specified path
     * @param {string[]} segments
     * @param {boolean} allowFallback Should the fallback be used if the current segment can't be found in the node? this allows path that look like this: \/\<node name>\/*\/\<node name>
     * @returns {InstanceType<Trie<T>['ResponseObject']>}
     */
    Find(segments, allowFallback = true) {
        console.log(
            `attempting to find node at: ${segments}, with ${segments.length} segments`
        );

        /**
         * @type {Trie<T>}
         */
        let node = this;
        /**
         * @type {String[]}
         */
        let foundPath = new Array();
        let restPath = segments;

        for (const segment of segments) {
            if (!node.#children.get(segment)) {
                if (allowFallback && node.fallback) {
                    console.log(
                        `couldn't find segment: ${segment}, using fallback...`
                    );

                    foundPath.push(segment);
                    restPath.shift();

                    node = node.fallback;
                    continue;
                }
                if (this.mayFailHere) {
                    console.log(
                        `path ended, but may fail here so returning current node with segment: ${segment}`
                    );
                    return new this.ResponseObject(
                        true,
                        foundPath,
                        node.#action,
                        restPath
                    );
                }

                console.log(`No path found returning empty ResponseObject`);
                return new this.ResponseObject();
            }

            foundPath.push(segment);
            restPath.shift();

            // @ts-ignore
            node = node.#children.get(segment);
        }

        console.log(`found path, returning ResponseObject`);
        return new this.ResponseObject(true, foundPath, node.#action, restPath);
    }

    /**
     * the children of this node
     * @type {Map<String, Trie<T>>}
     */
    #children = new Map();
    /**
     * action to return if path ends at this node
     * @type {T | null}
     */
    #action = null;
    /**
     * fallback node to use if path fails at this node
     * @type {Trie<T> | null}
     */
    fallback = null;
    /**
     * whether or not the Find function may fail here and return the action
     * @type {boolean}
     */
    mayFailHere = false;

    ResponseObject = class {
        /**
         * @param {boolean} valid is the object valid (was a result found?)
         * @param {String[] | null} foundPath path that was found to reach the object
         * @param {T | null} response response object
         * @param {String[] | null} restPath in case the object exited early, the unused path strings
         */
        constructor(
            valid = false,
            foundPath = null,
            response = null,
            restPath = null
        ) {
            this.valid = valid;
            this.foundPath = foundPath;
            this.response = response;
            this.restPath = restPath;
        }

        /**
         * @type {boolean}
         */
        valid = false;

        /**
         * @type {String[] | null}
         */
        foundPath;

        /**
         * @type {String[] | null}
         */
        restPath;

        /**
         * @type {T | null}
         */
        response;

        /**
         * boolean conversion
         */
        [Symbol.toPrimitive](hint) {
            if (hint === "boolean") {
                return this.valid;
            }
        }
    };

    /**
     *
     * @param {string} name name of object
     */
    PrintTree(name) {
        console.log(`${name}: has action: ${this.#action != null}`);

        for (const object of this.#children) {
            object[1].PrintTree(object[0]);
        }
    }
}

module.exports = {
    Trie,
};
