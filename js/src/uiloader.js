define(["text!html/ui.html", "jquery"], function (ui, $) {
    $("body").prepend(ui);
    require(["app"], function (app) {
        app();
    });
});
