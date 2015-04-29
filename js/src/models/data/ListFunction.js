/*ListFunction.js
 * function which determines how a constraint value should change for an index of a member in a list
 */

define([
    'underscore',
    'backbone',
    'utils/PFloat',
    'utils/PBool',
    'utils/TrigFunc',
    'paper'
  ],

  function(_, Backbone, PFloat, PBool, TrigFunc, paper) {
    var ListFunction = Backbone.Model.extend({
      defaults: {
        name: 'list_function'
      },

      initialize:function(){
          this.listenTo(this, "change:selected", this.modifySelection);
          this.scalar = 1;
          var p1 = new paper.Point(0,1);
          var h1 = new paper.Point(this.scalar*0.25,1);
          var p2 = new paper.Point(this.scalar,1);
          var h2 = new paper.Point(this.scalar*0.75,1);
          this.curve = new paper.Curve(p1,h1,p2,h2);
      },

      getValue: function(index,range) {
        var ratio = index/range;
        var point = this.curve.getPointAt(ratio*this.scalar);
        var val = point.y;
        console.log('value found', val,val/this.scalar*range);
        return val/this.scalar*range;
      },

    });

    return ListFunction;

  });