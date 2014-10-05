(function () {
    "use strict";

    var redis = require("redis"),
        config = require("./config");

    var redisClient = null;

    // var _connectErrorHandler = function () {
    //     console.error("Error conencting to redis, exiting");
    //     process.exit(-1);
    // };

    var options = {
        "enable_offline_queue" : false,
        "retry_max_delay" : 10000 // 10 seconds
    };

    if (config.redisServer && config.redisServer.host && config.redisServer.port) {
        redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, options);
    } else if (config.redisServer && config.redisServer.socket) {
        redisClient = redis.createClient(config.redisServer.socket, options);
    }

    redisClient.on("ready", function () {
        console.log("redis ready");
    });

    redisClient.on("error", function (err) {
        console.log("redis error: ", err);
    });

    var log = function (submissions, userID, ip, cb) {
        try {
            var toLog = {},
                submissionKeys = Object.keys(submissions),
                receivedTime = (new Date()).getTime();

            submissionKeys.forEach(function (k) {
                var submission = submissions[k];

                submission.events.forEach(function (e) {
                    var prefix = submission.session + ":" + e.id + ":";

                    toLog[prefix + "name"] = e.name;
                    toLog[prefix + "data"] = e.data;
                    toLog[prefix + "time"] = e.time;
                    toLog[prefix + "ip"] = ip;
                    toLog[prefix + "receivedTime"] = receivedTime;

                });
            });

            console.log("logging for %s\n%s", userID, JSON.stringify(toLog, null, "  "));

            redisClient.hmset(userID, toLog, cb);

        } catch (e) {
            cb(e);
        }
    };

    exports.log = log;

}());
