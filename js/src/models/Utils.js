define([
    'underscore',
    'models/data/GeometryNode',

  ],
  function(_) {

    var Utils = {

      nodeMixin: function(to,from, methodName) {
        /*console.log("this=");
        console.log(this);
        console.log("from=");
        console.log(from);
          console.log("this.prototype=");
        console.log(this.prototype);
         //  console.log("GeometryNode.prototype=");*/
        //console.log(GeometryNode.prototype);
        console.log("to=");
        console.log(to);
        console.log("from=");
        console.log(from);
        console.log("methodName=");
        console.log(methodName);
      

       /* // we add those methods which exists on `from` but not on `to` to the latter
        _.defaults(to, from);

        // … and we do the same for events
         _.defaults(to.events, from.events);*/

        // we then extend `to`'s `update`
        Utils.extendMethod(to, from, methodName);

      },

      // Helper method to extend an already existing method
      extendMethod: function(to, from, methodName) {
         console.log("trying to extend methods")
        // if the method is defined on from ...
        if (!_.isUndefined(from[methodName])) {
          console.log("setting methods")
          var old = to[methodName];

          // ... we create a new function on to
          to[methodName] = function() {

           

            // and then call the method on `from`
            from[methodName].apply(this, arguments);

             // wherein we first call the method which exists on `to`
            var oldReturn = old.apply(this, arguments);

            // and then return the expected result,
            // i.e. what the method on `to` returns
            return oldReturn;

          };
        }

      }

    };

    return Utils;

  });