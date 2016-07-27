define([
  // ...
], function() {

  var ProductionDebug = {

    FORCE_INSERT_LIST_TOPLEVEL: false

  };

  var DevDebug = {

    FORCE_INSERT_LIST_TOPLEVEL: true

  };

  window.Debug = DevDebug;
  return window.Debug;
});
