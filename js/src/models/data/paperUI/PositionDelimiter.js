define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Delimiter'
], function(_, paper, Backbone, Delimiter) {

  var dist = {x: 'width', y: 'height'};
  var ax_inverse = {x: 'y', y: 'x'};
  var PositionDelimiter = Delimiter.extend({

    initialize: function(data) {
      Delimiter.prototype.initialize.apply(this, arguments);
      this.draw();
      this.change = 0;
    },

    draw: function() {
      var side_extend = ( this.get('side') == 'ref' ? 'references' : 'relatives' );
      var axis = this.get('axis');
      var i_axis = ax_inverse[axis];
      var center = this.get('constraint').get(side_extend).get('geom').bounds.center;
      this.originalValue = center[axis];
     
      // start experimental 
      this.origin = center[axis];
      this.ref_change = {'x': 0, 'y': 0};
      this.rel_change = {'x': 0, 'y': 0};
      if ( this.get('constraint').get('ref_prop') == 'scale' ) {
        this.changeFactor = {'x': 180, 'y': 180};
      }
      if ( this.get('constraint').get('ref_prop') == 'rotation' ) {
        this.changeFactor = {'x': 1, 'y': 1};
      }
      // end experimental

      var start = new paper.Point(center);
      var end = new paper.Point(center); 
      start[i_axis] = paper.view.bounds[i_axis] - 10 * paper.view.bounds[dist[i_axis]];
      end[i_axis] = paper.view.bounds[i_axis] + 10 * paper.view.bounds[dist[i_axis]];

      path = new paper.Path.Line( start, end );
      path.strokeColor = this.defaultStroke;
      path.strokeWidth = this.defaultWidth;
      path.fillColor = this.defaultFill;
      path.dashArray = this.dashArray;

      path.data.instance = this;
      this.set('geom', path);
    },

    update: function( fromSide, axis, amount ) {
      if ( fromSide == 'ref' ) {
        var refProp = this.get('constraint').get('ref_prop');
        this['ref_change'][axis] = amount;
        if ( refProp == 'scale' ) {
          this['rel_change'][axis] = this.changeFactor[axis] * (amount - 1);
        }
        if ( refProp == 'rotation' ) {
          this['rel_change'][axis] = this.changeFactor[axis] * amount; 
        }
      }
      if ( fromSide == 'rel' ) {
        var refProp = this.get('constraint').get('ref_prop');
        var noramlize = amount / (this['rel_change']['x'] + this['rel_change']['y']);
        this['rel_change']['x'] *= normalize;
        this['rel_change']['y'] *= normalize;
        if ( refProp == 'scale' ) {
          this.changeFactor['x'] = this['rel_change']['x'] / (this['ref_change']['x'] - 1);
          this.changeFactor['y'] = this['rel_change']['y'] / (this['ref_change']['y'] - 1); 
        }
        if ( refProp == 'rotation' ) {
          this.changeFactor['x'] = this['rel_change']['x'] / this['ref_change']['x'];
          this.changeFactor['y'] = this['rel_change']['y'] / this['ref_change']['y'];
        }
      }

      var geom = this.get('geom');
      geom.position[this.get('axis')] = this['origin'] + this['rel_change']['x'] + this['rel_change']['y'];
    },

    addListeners: function() {
      var geom = this.get('geom');
      geom.onMouseEnter = this.onMouseEnter.bind(this);
      geom.onMouseLeave = this.onMouseLeave.bind(this);
      geom.onMouseDown = this.onMouseDown.bind(this);
      geom.onMouseUp = this.onMouseUp.bind(this);
    },

    onMouseEnter: function(event) {
      var target = event.target;
      if ( this.dragging ) { return; }

      if ( !this.get('active') ) {
        target.strokeColor = this.tentativeStroke;
        target.fillColor = this.tentativeFill;
      } else {
        target.strokeColor = this.defaultStroke;
        target.fillColor = this.defaultFill;
      }
    },

    onMouseLeave: function(event) {
      var target = event.target;
      if ( this.dragging ) { return; }

      if ( !this.get('active') ) {
        target.strokeColor = this.defaultStroke;
        target.fillColor = this.defaultFill;
      } else {
        target.strokeColor = this.activeStroke;
        target.fillColor = this.activeFill;
      }
    },

    onMouseDown: function(event) {
      var target = event.target;
      target.downPoint = event.point;
    },

    onMouseUp: function(event) {
      var target = event.target;
      if ( !target.downPoint.equals(event.point) ) {
        this.change = target.position[this.get('axis')] - this.originalValue;
        if ( !this.get('active') ) {
          target.strokeColor = this.defaultStroke;
          target.fillColor = this.defaultFill;
        }
      } else {
        if ( this.get('active') ) {
          this.set('active', false);
          target.strokeColor = this.defaultStroke;
          target.fillColor = this.defaultFill;
          this.get('constraint').updateExpression( this.get('side'), this.get('axis'), this.change, 'add' ); 
        } else {
          this.set('active', true);
          target.strokeColor = this.activeStroke;
          target.fillColor = this.activeFill;
          this.get('constraint').updateExpression( this.get('side'), this.get('axis'), this.change, 'remove' ); 
        }
      }
    }
  });

  return PositionDelimiter;

});
