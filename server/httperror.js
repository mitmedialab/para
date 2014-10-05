(function () {
    "use strict";

    var HTTPError = function (message, status) {
        if (!(this instanceof HTTPError)) {
            return new HTTPError(message, status);
        }

        this.message = message;
        this.status = status;
    };

    HTTPError.prototype.toString = function () {
        return this.message;
    };

    module.exports = HTTPError;

}());
