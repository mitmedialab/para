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

      initialize: function() {
        this.listenTo(this, "change:selected", this.modifySelection);
        this.xscalar = 10;
        this.yscalar = 10;
        this.points = [];
        this.points.push({x:0,y:0});
        this.points.push({x:1,y:0});
      },
    
      getValue: function(index,range){
        var coef = TrigFunc.Lagrange(this.points);
        console.log('coefficients=',coef);
       var expr = String(coef[0]);
        for(var i=1;i<coef.length;i++){
          var order= 'Math.pow(x,'+String(i)+')*'+String(coef[i])+'+';
          console.log('order=',order);
          expr = order.concat(expr);
        }
        var val;
        console.log("expresion=",expr);
        var x  = index/range;
        var result = eval(expr)*range;
        console.log('x', x);
        console.log('result',result);
        return result;
      }


    });

    return ListFunction;

  });