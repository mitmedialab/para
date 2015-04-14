define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Delimiter'
], function(_, paper, Backbone, Delimiter) {

  var ScaleDelimiter = Delimiter.extend({
    initialize: function(data) {
      Delimiter.prototype.initialize.apply(this, arguments);
      this.draw();
      this.change = 1;
    },

    draw: function() {
      var side_extend = ( this.get('side') == 'ref' ? 'references' : 'relatives' );
      var geom_bounds = this.get('constraint').get(side_extend).get('geom').bounds;
      var start, end;
      if ( this.get('axis') == 'x' ) {
        start = new paper.Point( geom_bounds.x - .2 * geom_bounds.width, geom_bounds.y - .1 * geom_bounds.height );
        end = new paper.Point( geom_bounds.x + 1.2 * geom_bounds.width, geom_bounds.y - .1 * geom_bounds.height );
      } 
      else if ( this.get('axis') == 'y' ) {
        start = new paper.Point( geom_bounds.x + 1.1 * geom_bounds.width, geom_bounds.y - .2 * geom_bounds.height);
        end = new paper.Point( geom_bounds.x + 1.1 * geom_bounds.width, geom_bounds.y + 1.2 * geom_bounds.height ); 
      }
      var vector = end.subtract(start).normalize(10);
      var arrowLine = new paper.Path.Line( start, end );
      arrowLine.dashArray = this.dashArray;
      arrowLine.data.instance = this;

      var startArrow = new paper.Path([
        start.add(vector.rotate(-45)),
        start,
        start.add(vector.rotate(45))
      ]);
      startArrow.data.instance = this;

      var endArrow = new paper.Path([
        end.add(vector.rotate(135)),
        end,
        end.add(vector.rotate(-135))
      ]); 
      endArrow.data.instance = this;

      var full_geom = new paper.Group([
        startArrow,
        arrowLine,
        endArrow
      ]);
      full_geom.strokeColor = this.defaultStroke;
      full_geom.strokeWidth = this.defaultWidth;
      //full_geom.fillColor = this.defaultFill;
      //full_geom.dashArray = this.dashArray;
      full_geom.changeScale = 1;
      this.set('geom', full_geom);
    },

    update: function( fromSide, axis, amount ) {
      // unscale
      var geom = this.get('geom');
      if ( this.get('axis') == 'x' ) {
        geom.scale( 1 / (this['rel_change']['x'] * this['rel_change']['y']), 1 );
      } else {
        geom.scale( 1 / (this['rel_change']['x'] * this['rel_change']['y']), 1 );
      }

      if ( fromSide == 'ref' ) {
        var refProp = this.get('constraint').get('ref_prop');
        this['rel_change'][axis] = 1 + (amount / this.changeFactor[axis]); 
      }
      if ( fromSide == 'rel' ) {
        var refProp = this.get('constraint').get('ref_prop');
        this['rel_change'] = amount;
        this.changeFactor['x'] = (this['ref_change']['x']) / (this['rel_change']['x'] - 1);
        if ( refProp == 'position') {
          this.changeFactor['y'] = (this['ref_change']['y']) / (this['rel_change']['y'] - 1);
        }
      }
      if ( this.get('axis') == 'x' ) {
        geom.scale( this['rel_change']['x'] * this['rel_change']['y'], 1 );
      } else {
        geom.scale( 1, this['rel_change']['x'] * this['rel_change']['y'] );
      }
    },

    addListeners: function() {
      var geom = this.get('geom');
      geom.onMouseEnter = this.onMouseEnter.bind(this);
      geom.onMouseLeave = this.onMouseLeave.bind(this);
      geom.onMouseDown = this.onMouseDown.bind(this);
      geom.onMouseUp = this.onMouseUp.bind(this);
    },

    onMouseEnter: function(event) {
      var geom = this.get('geom');
      if ( this.dragging ) { return; }

      if ( !this.get('active') ) {
        geom.strokeColor = this.tentativeStroke;
        geom.fillColor = this.tentativeFill;
      } else {
        geom.strokeColor = this.defaultStroke;
        geom.fillColor = this.defaultFill;
      }
    },

    onMouseLeave: function(event) {
      var geom = this.get('geom');
      if ( this.dragging ) { return; }
      
      if ( !this.get('active') ) {
        geom.strokeColor = this.defaultStroke;
        geom.fillColor = this.defaultFill;
      } else {
        geom.strokeColor = this.activeStroke;
        geom.fillColor = this.activeFill;
      }
    },

    onMouseDown: function(event) {
      var geom = this.get('geom');
      geom.downPoint = event.point;
    },

    onMouseUp: function(event) {
      var geom = this.get('geom');
      if ( !geom.downPoint.equals(event.point) ) {
        this.change = geom.changeScale;

        if ( !this.get('active') ) {
          geom.strokeColor = this.defaultStroke;
          geom.fillColor = this.defaultFill;
        }
      } else {
        if ( this.get('active') ) {
          this.set('active', false);
          geom.strokeColor = this.defaultStroke;
          geom.fillColor = this.defaultFill;
          this.get('constraint').updateExpression( this.get('side'), this.get('axis'), this.change, 'add' );
        } else {
          this.set('active', true);
          geom.strokeColor = this.activeStroke;
          geom.fillColor = this.activeFill;
          this.get('constraint').updateExpression( this.get('side'), this.get('axis'), this.change, 'remove' );
        }
      }
    }
  });

  return ScaleDelimiter;

});
