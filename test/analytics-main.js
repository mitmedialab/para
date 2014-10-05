require.config({
    paths : {
        "jquery" : "../bower_components/jquery/dist/jquery",
        "jquery-cookie" : "../bower_components/jquery-cookie/jquery.cookie",
        "utils" : "../js/src/utils"
    }
});

require(["utils/analytics"], function (analytics) {
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
