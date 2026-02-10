export const createMockRequest = (data = {}) => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        method: 'POST',
        ...data,
    };
};
export const createMockResponse = () => {
    const res = {
        _status: 200,
        _json: undefined,
        headersSent: false,
        status: function (code) {
            this._status = code;
            return this;
        },
        json: function (data) {
            this._json = data;
            return this;
        },
        end: function () {
            return this;
        },
        sendStatus: function (code) {
            this._status = code;
            return this;
        },
        send: function (data) {
            this._json = data;
            return this;
        },
    };
    return res;
};
export const createMockNext = () => {
    return (() => { });
};
