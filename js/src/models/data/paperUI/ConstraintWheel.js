define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUIItem',
], function(_, paper, Backbone, PaperUIItem) {

  var ConstraintWheel = PaperUIItem.extend({

    initialize: function(data) {
      PaperUIItem.prototype.initialize.apply(this, arguments);
      this.draw();
      this.listenTo( this.get('constraint'), 'wheelsDrawn', this.addMouseListeners );
    },

    draw: function() {
      // Import SVG
      var paperSVG = paper.project.importSVG($('#constraint-wheel-box').get(0));
      paperSVG.scale( 0.4, paperSVG.bounds.center );

      var constraintArrow = this.get('constraint').get('arrow');
      var arrTail = constraintArrow.get('tail');
      var arrHead = constraintArrow.get('head');
      var vector = arrHead.subtract(arrTail);
      var wheelLoc;

      if ( this.get('side') == 'rel' ) {
        wheelLoc = arrTail.add(vector.multiply(0.3));
      } else {
        wheelLoc = arrHead.add(vector.multiply(-0.3));
      }
      var translation = wheelLoc.subtract(paperSVG.bounds.center);

      paperSVG.translate( translation.x, translation.y );
      var wheel = paperSVG.children[0];
      for ( var i = 0; i < wheel.children.length; i++ ) {
        wheel.children[i].originalStroke = wheel.children[i].strokeColor;
        wheel.children[i].originalFill = wheel.children[i].fillColor;
        wheel.children[i].data.instance = this;
      }
      
      this.set('geom', wheel);
    },

    addMouseListeners: function() {
      var geom = this.get('geom');
      if ( this.get('side') == 'ref' ) {
        this.onClick({
          target: {
            parent: [],
            name: 'position'
          }    
        });
      }
      geom.onMouseEnter = this.onMouseEnter.bind(this);
      geom.onMouseLeave = this.onMouseLeave.bind(this);
      geom.onClick = this.onClick.bind(this);
    },

    onMouseEnter: function(event) {
      var target = event.target;
      if ( target.parent instanceof paper.Group && target.parent.name != 'constraint-wheel') {
        target = target.parent;
      }
      if (!target.active) {
        target.strokeColor = '#ff7777';
        target.fillColor = '#ff7777';
      }
    },

    onMouseLeave: function(event) {
      var target = event.target;
      if ( target.parent instanceof paper.Group && target.parent.name != 'constraint-wheel') {
        target = target.parent;
      }
      if (!target.active) {
        target.strokeColor = target.originalStroke;
        target.fillColor = target.originalFill;
      }
    },

    onClick: function(event) {
      var constraint = this.get('constraint');
      var target = event.target;
      if ( target.parent instanceof paper.Group && target.parent.name != 'constraint-wheel') {
        target = target.parent;
      }
      var selectTargetForWheel = function( geom, target_name ) {
        for ( var i = 0; i < geom.children.length; i++ ) {
          geom.children[i].strokeColor = geom.children[i].originalStroke;
          geom.children[i].fillColor = geom.children[i].originalFill;
          geom.children[i].active = false;
        }
        geom.children[target_name].strokeColor = '#ff0000';
        geom.children[target_name].fillColor = '#ff0000';
        geom.children[target_name].active = true;
      }
  
      var wheel_geom = this.get('geom');
      selectTargetForWheel( wheel_geom, target.name );
      constraint.set('rel_prop', target.name);

      if ( this.get('side') == 'ref' ) {
        var rel_wheel_geom = constraint.get('rel_wheel').get('geom');
        selectTargetForWheel( rel_wheel_geom, target.name );
        constraint.set('ref_prop', target.name);
      }

      constraint.clearDelimiters();
      constraint.createDelimiters();
      // TODO: Add delimiter switch
    },

  });

  return ConstraintWheel;
});
