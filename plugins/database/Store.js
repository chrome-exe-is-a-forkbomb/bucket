module.exports = class Store {
    constructor(client) {
        this.db      = require('./models/index');
        this._client = client;
    };

    /**
     * Registering the DB properties to simple objects using the native
     * node.js "get".
     */

    get users() {
        return this.db.User
    };
    get guilds() {
        return this.db.Guild
    };
    get backups() {
        return this.db.backups
    };

    /**
     *  -- Fetch Methods -- 
     *  they're used to fetch information without using
     *  a lot of properties.properties.properties. It make the code looks more
     *  beauty and easier to understand.
     */

    async fetchGuild(id) {
        const fetch = await this.guilds.findByPk(id);
        return fetch;
    };
    async fetchUser(id) {
        return await this.users.findByPk(ID);
    };
    /**
     * -- Get Info Methods --
     * It help us to take informations from MariaDB
     * and make the code easier to understand.
     */
    async getProfile(userID) {
        return await this.fetchUser(userID).profile;
    };
};