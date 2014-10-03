define(["jquery", "jquery-cookie"], function ($) {
    "use strict";

    var MAX_BUFFERED_EVENTS = 10,
        MAX_BUFFERED_WAIT = 100000, // 100 seconds
        COOKIE_KEY = "para-userid",
        COOKIE_EXPIRATION = 365, // 1 year
        FAILED_KEY = "para-failed-submissions",
        PENDING_KEY = "para-pending-submissions",
        LOG_URL = "/log";

    var _eventBuffer = [],
        _submitTimer = null,
        _userID = null,
        _sessionID = null;

    var _createID = function () {
        var r, t;

        t = (new Date()).getTime();

        try {
            if (window.crypto) {
                var u = new Uint32Array(1);
                window.crypto.getRandomValues(u);
                r = u[0];
            }
        } catch (e) { }

        if (!r) {
            // Get a number between 0 and 2^32
            /*jshint bitwise: false */
            r = Math.floor(Math.random() * (1 << 30) * 4);
            /*jshint bitwise: true */
        }

        return t + "-" + r;
    };

    var _start = function () {
        _userID = $.cookie(COOKIE_KEY) || _createID();
        _sessionID = _createID();

        console.log("starting analytics for user %s with session ID %s", _userID, _sessionID);

        // If we have pending submits left from last time, then they are probably failed.
        // So, we simply move them to failed to try again. Server will remove dupes.
        var pending = _thaw(PENDING_KEY),
            failed = _thaw(FAILED_KEY),
            pendingKeys = Object.keys(pending);
        pendingKeys.forEach(function (k) {
            failed[k] = pending[k];
        });
        _freeze(FAILED_KEY, failed);

        // Always set the cookie or update the expiration of the existing cookie
        $.cookie(COOKIE_KEY, _userID, { expires: COOKIE_EXPIRATION, path: "/"});

        // Set up handlers to force submission at opportune times.
        $(window).bind("beforeunload", function () {
            log("close");
            submit();
        });
        $(window).bind("blur", submit);

        // Create a start event and immediately submit it (along with any prior failed submits)
        log("start", {"user-agent": window.navigator.userAgent});
        submit();
    };

    var log = function (name, data) {
        var time = new Date(),
            event,
            dataString;

        try {
            dataString = JSON.stringify(data);
        } catch (e) {
            console.warn("Unable to stringify data for log. Logging error instead.", e);
            dataString = JSON.stringify({"error" : String(e)});
        }

        event = {id: _createID(), name: name, data: dataString, time: time.getTime()};

        _eventBuffer.push(event);

        if (_eventBuffer.length >= MAX_BUFFERED_EVENTS) {
            submit();
        } else {
            if (_submitTimer) {
                clearTimeout(_submitTimer);
            }
            _submitTimer = setTimeout(submit, MAX_BUFFERED_WAIT);
        }
    };

    var _thaw = function (collection) {
        var result;

        try {
            result = JSON.parse(localStorage.getItem(collection) || {});
        } catch (e) { }
        
        if (typeof(result) !== "object") {
            result = {};
        }
        localStorage.removeItem(collection);
        return result;
    };

    var _freeze = function (collection, value) {
        try {
            localStorage.setItem(collection, JSON.stringify(value));
        } catch (e) { }
    };

    var submit = function (events) {
        if (_submitTimer) {
            clearTimeout(_submitTimer);
            _submitTimer = null;
        }

        // We'll re-submit any failed submissions
        var submission = _thaw(FAILED_KEY);

        // Create new submission for events in buffer
        if (_eventBuffer.length > 0) {
            var submissionID = _createID();
            submission[submissionID] = {
                time: (new Date()).getTime(),
                session: _sessionID,
                events: _eventBuffer
            };
            _eventBuffer = [];
        }

        var submissionKeys = Object.keys(submission);

        if (submissionKeys.length > 0) {
            // Add current submission to pending local storage
            var pending = _thaw(PENDING_KEY);
            submissionKeys.forEach(function (k) {
                pending[k] = submission[k];
            });
            _freeze(PENDING_KEY, pending);

            // Actually send submissions to server
            $.ajax(LOG_URL, {
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(submission),
                dataType: "text"
            })
            .done(function () {
                // Submissions arrived at server, so remove them from pending local storage
                var pending = _thaw(PENDING_KEY);
                submissionKeys.forEach(function (k) {
                    delete pending[k];
                });
                _freeze(PENDING_KEY, pending);
            })
            .fail(function (xhr, err) {
                // Submissions did not arrive at server. So, add them to failed local storage
                // and we'll hopefully try again later.
                var failed = _thaw(FAILED_KEY);
                submissionKeys.forEach(function (k) {
                    failed[k] = submission[k];
                });
                _freeze(FAILED_KEY, failed);

                if (!_submitTimer) {
                    _submitTimer = setTimeout(submit, MAX_BUFFERED_WAIT);
                }
            });

        }
    };

    // initialize logging
    _start();

    // return public interface
    return {
        log : log,
        submit : submit
    };
});
