(function () {
    "use strict";

    var COOKIE_KEY = "para-userid";

    var config = require("./config"),
        logger = require("./logger"),
        HTTPError = require("./httperror");

    var connect = require("connect"),
        morgan = require("morgan"),
        bodyParser = require("body-parser"),
        cookieParser = require("cookie-parser"),
        serveStatic = require("serve-static");

    var app = connect();

    app.use(morgan(config.logFormat));

    // First, make sure requests to "/log" are POSTs. If not, don't bother
    // parsing cookies or body.
    app.use("/log", function (req, res, next) {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return next(new HTTPError("Requests to /log must be POSTs", 405));
        }
        return next();
    });

    app.use("/log", cookieParser());
    app.use("/log", bodyParser.json());

    app.use("/log", function (req, res, next) {
        if (!(req.cookies[COOKIE_KEY] && typeof(req.body) === "object")) {
            return next(new HTTPError("Request parameters missing", 400));
        }

        logger.log(req.body, req.cookies[COOKIE_KEY], req.socket.address().address, function (err) {
            if (err) {
                return next(new HTTPError("Server error", 500));
            } else {
                res.setHeader("Content-type", "text/plain");
                res.end("ok");
                return next();
            }
        });
    });


    app.use("/", serveStatic(config.staticPath, {"index": ["index.html", "index.htm"]}));

    module.exports = app;

}());
