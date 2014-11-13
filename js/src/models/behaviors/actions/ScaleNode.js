/* RotateNode.js
 * procedure that controls relative rotation coordinates
 */
define([
    'models/behaviors/actions/RotateNode',
    'models/behaviors/actions/TransformationNode',

    'utils/PPoint'

  ],

  function(RotateNode, TransformationNode, PPoint) {

    var ScaleNode = RotateNode.extend({
      name: 'scale',
      type: 'transformation',

      /* evaluate
       * updates the rotation of the each instance in the instance list
       * with specified origin
       */
      evaluate: function() {
        for (var i = 0; i < this.instances.length; i++) {
          var instance = this.instances[i].instance;

          //set origin based on origin state
          var origin;
          if (this.relativeOrigin) {
            origin = instance.position;
          } else {
            origin = this.origin;
          }

          var expression = this.instances[i].expression;
          if (expression) {
            //special case for expression entered by user
          } else {
            instance.update({
              scale: {
                delta: this.delta,
                x: origin.x,
                y: origin.y
              }
            });
          }

        }
        TransformationNode.prototype.evaluate.apply(this,arguments);
      }
    });

    return ScaleNode;
  });