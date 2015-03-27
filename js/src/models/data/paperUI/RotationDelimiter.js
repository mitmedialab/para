define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Delimiter',
  'utils/Utils'
], function(_, paper, Backbone, Delimiter, Utils) {

  var RotationDelimiter = Delimiter.extend({
    initialize: function(data) {
      Delimiter.prototype.initialize.apply(this, arguments);
      this.draw();
      this.change = 0;
    },

    draw: function() {
      var side_extend = ( this.get('side') == 'ref' ? 'references' : 'relatives' );
      var geom = this.get('constraint').get(side_extend).get('geom');
      var rotation = this.get('constraint').get(side_extend).get('rotation_delta').getValue();;
      console.log('rotation', rotation);
      var geom_bounds = geom.bounds;

      var circle_center = geom_bounds.center;
      var circle_radius = 1.1 * Utils.max( geom.bounds.width / 2, geom.bounds.height / 2 );
      var bound_circle = new paper.Path.Circle({
        center: circle_center,
        radius: circle_radius 
      });
      bound_circle.dashArray = this.dashArray;
      bound_circle.data.instance = this;

      var arrow_vec = new paper.Point(10, 0);
      var top_point = circle_center.subtract( new paper.Point(0, circle_radius) );
      var bottom_point = circle_center.add( new paper.Point(0, circle_radius) );
      var top_arrow = new paper.Path([
        top_point.add(arrow_vec.rotate(135)),
        top_point,
        top_point.add(arrow_vec.rotate(-135))
      ]);
      top_arrow.data.instance = this;

      var bottom_arrow = new paper.Path([
        bottom_point.add(arrow_vec.rotate(-135)),
        bottom_point,
        bottom_point.add(arrow_vec.rotate(135))
      ]);
      bottom_arrow.data.instance = this;

      var full_geom = new paper.Group([
        bound_circle,
        top_arrow,
        bottom_arrow
      ]);
      full_geom.rotate( rotation, circle_center );
      full_geom.strokeColor = this.defaultStroke;
      full_geom.strokeWidth = this.defaultWidth;
      full_geom.scale(1.2);
      full_geom.data.instance = this;
      full_geom.changeRotation = 0;

      this.set('geom', full_geom);
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
      } else {
        geom.strokeColor = this.defaultStroke;
      }
    },

    onMouseLeave: function(event) {
      var geom = this.get('geom');
      if ( this.dragging ) { return; }

      if ( !this.get('active') ) {
        geom.strokeColor = this.defaultStroke;
      } else {
        geom.strokeColor = this.activeStroke;
      }
    },

    onMouseDown: function(event) {
      var geom = this.get('geom');
      geom.downPoint = event.point;
    },

    onMouseUp: function(event) {
      var geom = this.get('geom');
      if ( !geom.downPoint.equals(event.point) ) {
        this.change = geom.changeRotation;

        if ( !this.get('active') ) {
          geom.strokeColor = this.defaultStroke;
        }
      } else {
        if ( this.get('active') ) {
          this.set('active', false);
          geom.strokeColor = this.defaultStroke;
          this.get('constraint').updateExpression( this.get('side'), 'x', this.change, 'add' );
        } else {
          this.set('active', true);
          geom.strokeColor = this.activeStroke;
          this.get('constraint').updateExpression( this.get('side'), 'x', this.change, 'remove' );
        }
      }
    }

  });

  return RotationDelimiter;

});
