(function () {
    "use strict";

    var connect = require("connect"),
        morgan = require("morgan"),
        bodyParser = require("body-parser"),
        cookieParser = require("cookie-parser"),
        serveStatic = require("serve-static"),
        finalhandler = require("finalhandler"),
        resolve = require("path").resolve;

    var app = connect();

    var bp = bodyParser.urlencoded({extended: false}),
        cp = cookieParser();



    app.use(morgan("dev"));

    app.use("/log", function (req, res, next) {
        if (req.method !== "POST") {
            return next();
        }

        bp(req, res, function () {
            cp(req, res, function () {
                res.setHeader("Content-type", "text/plain");
                res.end("Your body:\n" + JSON.stringify(req.body, null, "  ") +
                    "\nYour cookies:\n" + JSON.stringify(req.cookies, null, "  ") + "\n");
            });
        });
    });

    var serve = serveStatic(resolve(__dirname, "..", "build"), {"index": ["index.html", "index.htm"]});

    app.use("/", function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
    });

    module.exports = app;

}());
