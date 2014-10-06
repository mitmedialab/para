require.config({
    baseUrl : "../js/src",
    paths : {
        "jquery" : "../../bower_components/jquery/dist/jquery",
        "jquery-cookie" : "../../bower_components/jquery-cookie/jquery.cookie"
    }
});

require(["utils/analytics", "jquery"], function (analytics, $) {
    "use strict";

    analytics.submit();
    
    $(function () {
        $("#btn-doit").on("click", function () {
            analytics.log("did it", $("#text-data").val());
        });
        $("#btn-submit").on("click", function () {
            analytics.submit();
        });
    });
});
