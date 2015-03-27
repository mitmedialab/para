define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Arrow',
  'models/data/paperUI/ConstraintWheel',
  'models/data/paperUI/PositionDelimiter',
  'models/data/paperUI/ScaleDelimiter',
  'models/data/paperUI/RotationDelimiter',
], function(_, paper, Backbone, Arrow, ConstraintWheel, PositionDelimiter, ScaleDelimiter, RotationDelimiter) {

  var Constraint = Backbone.Model.extend({

    defaults: {
      // properties
      references: null,
      relatives: null,
      ref_prop: 'position',
      rel_prop: 'position',
      expression: '',
      type: '=',

      // UI
      arrow: null,     
      ref_wheel: null,
      rel_wheel: null, 
      ref_delimiters: [],
      rel_delimiters: [],
      
      // derived state
      constraintFuncs: null
    },

    initialize: function() {
      this.createArrow();
      this.listenTo(this, 'change:references', this.relativesChange);
    },

    relativesChange: function() {
      if ( !this.get('ref_wheel') || !this.get('rel_wheel') ) {
        this.createWheels();
      }
    },

    createArrow: function() {
      var arrow = new Arrow( {constraint: this} );
      this.set('arrow', arrow);
    },

    createWheels: function() {
      var ref_wheel = new ConstraintWheel( {side: 'ref', constraint: this} );
      var rel_wheel = new ConstraintWheel( {side: 'rel', constraint: this} );
      this.set('ref_wheel', ref_wheel);
      this.set('rel_wheel', rel_wheel);
      this.trigger('wheelsDrawn');
    },

    createDelimiters: function() {
      var ref_prop = this.get('ref_prop');
      var rel_prop = this.get('rel_prop');

      if (!ref_prop || !rel_prop) {
        console.log('[ERROR] Reference property or relative property not defined for delimiters.');
      }

      var drawDelimitersForSide = function( side ) {
        var axes = ['x', 'y'];
        var prop = ( side == 'ref' ? ref_prop : rel_prop );
        switch ( prop ) {
          case 'position':
            for ( var i = 0; i < axes.length; i++ ) {
              var pos_delimiter = new PositionDelimiter( {side: side, axis: axes[i], constraint: this} );
              this.get(side + '_delimiters').push(pos_delimiter);
            }
            break;
          case 'scale':
            for ( var i = 0; i < axes.length; i++ ) {
              var scale_delimiter = new ScaleDelimiter( {side: side, axis: axes[i], constraint: this} );
              this.get(side + '_delimiters').push(scale_delimiter);
            }
            break;
          case 'rotation':
            rot_delimiter = new RotationDelimiter( {side: side, constraint: this} );
            this.get(side + '_delimiters').push(rot_delimiter);
            break;
          case 'weight':
            // TODO: make weight delimiter
            break;
          case 'fill':
            // TODO: make fill delimiter
            break;
          case 'stroke':
            // TODO: make stroke delimiter
            break;
        }
      }

      drawDelimitersForSide = drawDelimitersForSide.bind(this);
      drawDelimitersForSide( 'ref' );

      if ( ref_prop != rel_prop ) {
        drawDelimitersForSide( 'rel' );
      }

      this.trigger('delimitersDrawn');     
    },

    clearDelimiters: function() {
      var ref_delimiters = this.get('ref_delimiters');
      var rel_delimiters = this.get('rel_delimiters');
      for ( var i = 0; i < ref_delimiters.length; i++ ) {
        ref_delimiters[i].remove();
      }
      for ( var i = 0; i < rel_delimiters.length; i++ ) {
        rel_delimiters[i].remove();
      }
      this.set('ref_delimiters', []);
      this.set('rel_delimiters', []);
    },

    create: function() {
      var ref_prop = this.get('ref_prop');
      var rel_prop = this.get('rel_prop');
      var references = this.get('references');
      var relatives = this.get('relatives');
      var expression = this.get('expression');
      expression = expression.split(';');

      if (!ref_prop || !rel_prop || !references || !relatives || !expression) {
        console.log('[ERROR] All fields not defined for constraint creation.');
        return;
      }

      var refPropAccess = Utils.getPropConstraintFromList( references, ref_prop );
      var relPropAccess = Utils.getPropConstraintFromList( relatives, rel_prop );
  
      if ( rel_prop == 'position' || rel_prop == 'scale' ) {
        var constraintF_x = function() {
          var x = refPropAccess.x.getValue();
          var y = refPropAccess.y.getValue();

          var evaluation = eval( expression[0] );
          rel_prop.x.setValue( evaluation );
          return evaluation;
        }

        var constraintF_y = function() {
          var x = refPropAccess.x.getValue();
          var y = refPropAccess.y.getValue();

          var evaluation = eval( expression[1] );
          rel_prop.y.setValue( evaluation );
          return evaluation;
        }

        rel_prop.x.setConstraint(constraintF_x);
        rel_prop.y.setConstraint(constraintF_y);
        constraintFuncs.push(constraintF_x);
        constraintFuncs.push(constraintF_y);
      } else {
        var constraintF = function() {
          var x = refPropAccess.getValue();

          var evaluation = eval( expression[0] );
          rel_prop.setValue( evaluation );
          return evaluation;
        }
        rel_prop.setConstraint(constraintF);
        constraintFuncs.push(constraintF);
      }
    },

    update: function() {
      constraintFuncs = [];
      create();
    },

    updateExpression: function( side, axis, change, addOrRemove ) {
      var ref_prop = this.get('ref_prop');
      var rel_prop = this.get('rel_prop');
      var expr = this.get('expression').split(';');
      var axis_expr_map = {'x': 0, 'y': 1};

      if ( ref_prop == rel_prop ) {
        if ( ref_prop == 'position' ) {
          var changeString = ( change == 0 ? '' : (' + ' + change.toString()) );
          var new_delim_exp = ('(' + axis + changeString + ')');
          expr[axis_expr_map[axis]] = new_delim_exp;             
        }
        else if ( ref_prop == 'scale' ) {
          var changeString = ( change == 1 ? '' : (' * ' + change.toString()) );
          var new_delim_exp = ('(' + axis + changeString + ')');
          expr[axis_expr_map[axis]] = new_delim_exp;
        }
        else if ( ref_prop == 'rotation' ) { 
          var changeString = ( change == 0 ? '' : (' + ' + change.toString()) );
          var new_delim_exp = ('(' + 'x' + changeString + ')');
          expr[0] = new_delim_exp;
        }
      } else {
        
      }
      var new_expr = this.mergeExprSplit( expr );
      this.setExpression( new_expr );
    },

    mergeExprSplit: function( exprSplit ) {
      var exprString = '';
      for ( var i = 0; i < (exprSplit.length - 1); i++ ) {
        exprString += (exprSplit[i] + ';');
      }
      exprString += exprSplit[exprSplit.length - 1];
      return exprString;
    },

    setExpression: function( expression ) {
      /*
      if ( delimiterExprMatch( expression, this.get('ref_prop'), this.get('rel_prop') ) {
        // show delimiters and select if not already
      } else {
        // turn off delimiters
      }*/
      console.log( 'Expression set: ', expression );
      this.set('expression', expression);
    }, 

    remove: function() {
      // remove all paper UI elements
      // trigger nullification / deletion of all references
    },

    reset: function() {
      var arrow = this.get('arrow');
      this.clear().set(this.defaults);
      this.set('arrow', arrow);
    }

  });

  return Constraint;
});
