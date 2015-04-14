define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Arrow',
  'models/data/paperUI/ConstraintWheel',
  'models/data/paperUI/ConstraintHandles',
  'models/data/paperUI/PositionDelimiter',
  'models/data/paperUI/ScaleDelimiter',
  'models/data/paperUI/RotationDelimiter',
], function(_, paper, Backbone, Arrow, ConstraintWheel, ConstraintHandles, PositionDelimiter, ScaleDelimiter, RotationDelimiter) {

  var Constraint = Backbone.Model.extend({

    defaults: {
      // properties
      references: null,
      relatives: null,
      ref_type: 'shape',
      rel_type: 'shape',
      ref_prop: 'position_xy',
      rel_prop: 'position_xy', 
      expression: '',
      type: '=',

      // UI
      arrow: null,
      proxy: null,  
      ref_handle: null,
      rel_handle: null, 
      
      // derived state
      constraintFuncs: null
    },

    initialize: function() {
      this.set('arrow', new Arrow({constraint: this}));
      this.set('proxy', new paper.Path());
      this.set('ref_handle', new ConstraintHandles({constraint: this, side: 'ref'}));
      this.set('rel_handle', new ConstraintHandles({constraint: this, side: 'rel'}));
    },

    setSelection: function( instance, type ) {
      if ( this.get('references') && this.get('relatives') ) {
        console.log('[ERROR] References and relatives already set.');
      }
      instance = instance[0];
      instance.set('selected', false);
      if ( this.get('relatives') ) {
        this.set('references', instance);
        this.set('ref_type', type);

        // create proxy with important logic // TODO: maybe class it?
        var relatives = this.get('relatives');
        var references = this.get('references');
        var rel_geom = relatives.get('geom');
        var ref_geom = references.get('geom');
        var proxy =  rel_geom.clone();
        proxy.bringToFront();
        proxy.visible = false;
        proxy.show = function() { 
          relatives.set('visible', false);  
          proxy.visible = true; 
        }
        proxy.hide = function() { 
          relatives.set('visible', true);
          proxy.visible = false; 
        }
        proxy.reset = function() {
          proxy.position = rel_geom.position;
          proxy.matrix = rel_geom.matrix;
        }
        proxy.matchProperty = function( ref_prop, rel_prop ) {
          var refPropValue, relPropValue;
          var ref_prop_doub = ( ref_prop.split('_')[1] && ref_prop.split('_')[1] == 'xy' );
          var rel_prop_doub = ( rel_prop.split('_')[1] && rel_prop.split('_')[1] == 'xy' );
          var propSwitch = function( prop, side ) {
            var propValue, geom;
            if ( side == 'ref' ) { geom = ref_geom; }
            if ( side == 'rel' ) { geom = proxy; } 
            switch ( prop ) {
              case 'scale_x':
                propValue = geom.bounds.width;
                break;
              case 'scale_y':
                propValue = geom.bounds.height;
                break;
              case 'scale_xy':
                propValue = {x: geom.bounds.width, y: geom.bounds.height};
                break;
              case 'position_x':
                propValue = geom.position.x;
                break;
              case 'position_y':
                propValue = geom.position.y;
                break;
              case 'position_xy':
                propValue = {x: geom.position.x, y: geom.position.y};
                break;
              case 'rotation':
                propValue = geom.rotation;
                break;
            }
          }
          refPropValue = propSwitch( ref_prop, 'ref' );
          relPropValue = propSwitch( rel_prop, 'rel' );

          /*          
          ref_prop_strip = ref_prop.split('_')[0];
          rel_prop_strip = rel_prop.split('_')[0];
          var convert_factor = propConvMap[ref_prop_strip + ':' + rel_prop_strip];
          var conversion, offset;

          if ( ref_prop_doub && rel_prop_doub ) {
            conversion = {x: refPropValue.x * convertFactor, y: refPropValue.y * convertFactor};
            offset = {x: relPropValue.x - conversion.x, y: relPropValue.y - conversion.y};    
          } else if ( ref_prop_doub ) {
            conversion = refPropValue.x * convertFactor + refPropValue.y * convertFactor;
            offset = relPropValue - conversion;
          } else if ( rel_prop_doub ) {
            conversion = {x: refPropValue * convertFactor, y: refPropValue * convertFactor};
            offset = {x: relPropValue.x - conversion, y: relPropValue.y - conversion};
          } else {
            conversion = refPropValue * convertFactor;
            offset = relPropValue - convertFactor;
          }
          */


          // set expression
        }

        this.set('proxy', proxy);
        return true;
      }
      this.set('relatives', instance);
      this.set('rel_type', type);
      return false;
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
