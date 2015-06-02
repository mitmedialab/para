define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUI'
], function(_, paper, Backbone, PaperUI) {
  
  var ConstraintHandles = PaperUI.extend({
    
    initialize: function(data) {
      PaperUI.prototype.initialize.apply(this, arguments);
    },

    draw: function() {
      var createDelimBox = function( bounds ) {
        // green bounding box
        var delbox = new paper.Path.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
        delbox.strokeColor = '#A5FF00';
        delbox.fillColor = null;
        delbox.name = 'delbox';
        return delbox;
      }

      var createCorners = function( bounds ) {
        // corners on box, superficial
        var corners = [];
        for ( var i = 0; i < 9; i++ ) {
          var corner = new paper.Path.Circle( bounds.x + (i % 3) / 2.0 * bounds.width, bounds.y + Math.floor(i / 3) / 2.0 * bounds.height, 3, 3 );
          corner.strokeColor = '#A5FF00';
          corner.fillColor = 'white';
          corners.push(corner);
          corner.name = 'corner';
        }
        return corners;
      }

      var createCross = function( bounds ) {
        // center cross 
        var cross_v = new paper.Path.Line({from: [bounds.center.x, bounds.center.y - 15], to: [bounds.center.x, bounds.center.y + 15]});
        var cross_h = new paper.Path.Line({from: [bounds.center.x - 15, bounds.center.y], to: [bounds.center.x + 15, bounds.center.y]});
        cross_v.name = 'position_x';
        cross_h.name = 'position_y';
        cross_v.strokeColor = cross_h.strokeColor = 'black';
        cross_v.strokeWidth = cross_h.strokeWidth = 2;
        cross = [cross_v, cross_h];
        return cross;
      }

      var createScaleArrows = function( corners ) {
        // svg arrows
        var yarrow = paper.project.importSVG(document.getElementById('yarrow')).children[0];
        var xarrow = yarrow.clone();
        xarrow.rotate(90);
        var xyarrow = yarrow.clone();
        xyarrow.rotate(-45);
        yarrow.position = corners[1].bounds.center;
        xarrow.position = corners[3].bounds.center;
        xyarrow.position = corners[0].bounds.center;
        var rotator = paper.project.importSVG(document.getElementById('rotator')).children[0];
        rotator.position = new paper.Point( corners[8].bounds.x + 10, corners[8].bounds.y + 10 );
        yarrow.name = 'scale_y';
        xarrow.name = 'scale_x';
        xyarrow.name = 'scale_xy';
        rotator.name = 'rotation';
        arrows = [yarrow, xarrow, xyarrow, rotator];
        return arrows;
      }

      var geom = (this.get('side') == 'ref') ? this.get('constraint').get('references').get('geom') : this.get('constraint').get('proxy');

      if ( !geom ) { 
        console.log('[ERROR] Cannot draw constraint handles without instance.');
        return;
      }
  
      var gen_bounds = geom.bounds;
      var gen_delbox = createDelimBox(gen_bounds);
      var gen_corners = createCorners(gen_bounds);

      if ( geom instanceof paper.Group ) {
        hand_geom = geom.children[0];
        hand_bounds = hand_geom.bounds;
        hand_delbox = createDelimBox(hand_bounds);
        hand_delbox.name = 'hand_delbox';
        hand_corners = createCorners(hand_bounds);
        for ( var i = 0; i < hand_corners.length; i++ ) { hand_corners[i].name = 'hand_corner'; }
      } else {
        hand_bounds = gen_bounds;
        hand_delbox = gen_delbox;
        hand_corners = gen_corners;
      }

      var cross = createCross(hand_bounds);
      var arrows = createScaleArrows(hand_corners);


      // TODO: Handles for stroke/fill/weight

      var handles;
      if ( geom instanceof paper.Group ) {
        handles = new paper.Group([
          gen_delbox,
          gen_corners[0], gen_corners[1], gen_corners[2], gen_corners[3], gen_corners[4], gen_corners[5], gen_corners[6], gen_corners[7], gen_corners[8],
          hand_delbox,
          hand_corners[0], hand_corners[1], hand_corners[2], hand_corners[3], hand_corners[4], hand_corners[5], hand_corners[6], hand_corners[7], hand_corners[8],
          cross[0],
          cross[1],
          arrows[0],
          arrows[1],
          arrows[2],
          arrows[3]
        ]);
      } else {
        handles = new paper.Group([
          gen_delbox,
          gen_corners[0], gen_corners[1], gen_corners[2], gen_corners[3], gen_corners[4], gen_corners[5], gen_corners[6], gen_corners[7], gen_corners[8],
          cross[0],
          cross[1],
          arrows[0],
          arrows[1],
          arrows[2],
          arrows[3]
        ]);
      }

      for ( var i = 0; i < handles.children.length; i++ ) {
        handles.children[i].originalStroke = handles.children[i].strokeColor;
        handles.children[i].originalFill = handles.children[i].fillColor;
        handles.children[i].active = false;
        if ( handles.children[i].name != 'delbox' && handles.children[i].name != 'corner' && handles.children[i].name != 'hand_delbox' && handles.children[i].name != 'hand_corner' ) { handles.children[i].type = 'handle'; }
      }

      this.set('geometry', handles);
      
      if ( !this.initial ) {
        cross[1].strokeColor = 'red';
        cross[0].strokeColor = 'red';
        cross[1].active = true;
        cross[0].active = true;
        this.addListeners();
        this.initial = true;
      }
    },

    hide: function() {
      var geometry = this.get('geometry');
      geometry.visible = false;
    },

    show: function() {
      var geometry = this.get('geometry');
      if ( !geometry ) { 
        this.draw(); 
        return;
      }
      geometry.visible = true;
    },

    redraw: function() {
      var geometry = this.get('geometry');
      var object_geom = (this.get('side') == 'ref') ? this.get('constraint').get('references').get('geom') : this.get('constraint').get('proxy');
      var delbox = geometry.children['delbox'];
      delbox.bounds = object_geom.bounds;
      var corners = geometry.getItems({name: 'corner'});
      for ( var i = 0; i < 9; i++ ) {
        corners[i].position = new paper.Point(delbox.bounds.x + (i % 3) / 2.0 * delbox.bounds.width, delbox.bounds.y + Math.floor(i / 3) / 2.0 * delbox.bounds.height, 3, 3 );
      }
      
      var hand_object_geom = object_geom;
      var hand_delbox = delbox;
      var hand_corners = corners;
      if ( object_geom instanceof paper.Group ) {
        hand_object_geom = object_geom.children[0];
        hand_delbox = geometry.children['hand_delbox'];
        hand_delbox.bounds = hand_object_geom.bounds;
        hand_corners = geometry.getItems({name: 'hand_corner'});
        for ( var i = 0; i < 9; i++ ) {
          hand_corners[i].position = new paper.Point(hand_delbox.bounds.x + (i % 3) / 2.0 * hand_delbox.bounds.width, hand_delbox.bounds.y + Math.floor(i / 3) / 2.0 * hand_delbox.bounds.height, 3, 3);
        }
      }

      var yarrow = geometry.children['scale_y'];
      var xarrow = geometry.children['scale_x'];
      var xyarrow = geometry.children['scale_xy'];
      var rotator = geometry.children['rotation'];
      yarrow.position = hand_corners[1].position;
      xarrow.position = hand_corners[3].position;
      xyarrow.position = hand_corners[0].position;
      rotator.position = new paper.Point( hand_corners[8].bounds.x + 10, hand_corners[8].bounds.y + 10 );

      var cross_v = geometry.children['position_x'];
      var cross_h = geometry.children['position_y'];
      cross_v.position = hand_object_geom.position;
      cross_h.position = hand_object_geom.position;
    },

    addListeners: function() {
      var geometry = this.get('geometry');
      geometry.onMouseEnter = this.onMouseEnter.bind(this);
      geometry.onMouseLeave = this.onMouseLeave.bind(this);
      geometry.onMouseDown = this.onMouseDown.bind(this);
      geometry.onMouseUp = this.onMouseUp.bind(this);
      geometry.onClick = this.onClick.bind(this);
    },

    //******** DEFAULT LISTENERS *********//
    onMouseDown: function( event ) {
      if ( event.modifiers.shift ) { return; }

      var constraint = this.get('constraint');
      var ref_geom = constraint.get('ref_handle').get('geometry');
      var rel_geom = constraint.get('rel_handle').get('geometry');
      var ref_target = ref_geom.children[event.target.name];
      var rel_target = rel_geom.children[event.target.name];
      
      var applyClick = function( target, geometry, side ) {
      
        var thisGroup = target.name.split('_')[0];
        if ( target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner' ) { return; }
        if ( (target.name == 'scale_x' || target.name == 'scale_y') && geometry.children['scale_xy'].active ) { return; }
        if ( (target.name == 'scale_x' && geometry.children['scale_y'].active) || (target.name == 'scale_y' && geometry.children['scale_x'].active) ) {
          target = geometry.children['scale_xy'];
        }

        for ( var i = 0; i < geometry.children.length; i++ ) {
          var child = geometry.children[i];
          if ( child.name == 'delbox' || child.name == 'corner' || child.name == 'hand_delbox' || child.name == 'hand_corner' ) { continue; }
          var childGroup = child.name.split('_')[0];
          if ( childGroup != thisGroup ) { 
            child.active = false;
            child.strokeColor = child.originalStroke;
            child.fillColor = child.originalFill;
          } else if ( (child.name == 'scale_x' || child.name == 'scale_y') && target.name == 'scale_xy' ) {
            child.active = false;
            child.strokeColor = child.originalStroke;
            child.fillColor = child.originalFill;
          } 
        }

        target.active = !target.active;

        if ( target.active ) { 
          var property = target.name;
          target.strokeColor = '#ff0000';
          target.fillColor = '#ff0000';
          if ( geometry.children['position_x'].active && geometry.children['position_y'].active ) { property = 'position_xy'; } 
          constraint.set(side + '_prop', property);
          return;
        } else {
          for ( var j = 0; j < geometry.children.length; j++ ) {
            if ( geometry.children[j].active ) {
              constraint.set(side + '_prop', geometry.children[j].name);
              return; 
            }
          }
          constraint.set(side + '_prop', null);
        }
      }

      if ( this.get('side') == 'ref' ) {
        applyClick( ref_target, ref_geom, 'ref' );
        applyClick( rel_target, rel_geom, 'rel' );
        constraint.get('proxy').reset();
        constraint.get('rel_handle').redraw();
        constraint.get('arrow').redrawTail(constraint.get('proxy'));
        constraint.get('proxy').matchProperty( constraint.get('ref_prop'), constraint.get('rel_prop') );  
      } else {
        applyClick( rel_target, rel_geom, 'rel' );
        constraint.get('proxy').reset();
        constraint.get('rel_handle').redraw();
        constraint.get('arrow').redrawTail(constraint.get('proxy'));
        constraint.get('proxy').matchProperty( constraint.get('ref_prop'), constraint.get('rel_prop') );  
      }

    },

    onMouseUp: function( event ) {
      
    },

    onClick: function( event ) {
    
    },

    onMouseEnter: function( event ) {
      if ( event.modifiers.shift ) { return; }

      var target = event.target;
      if ( target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner' ) { return; }

      if ( !target.active ) {
        target.strokeColor = '#ff0000';
        target.fillColor = '#ff0000';
      } else {
        target.strokeColor = target.originalStroke;
        target.fillColor = target.originalFill;
      }
    },

    onMouseLeave: function( event ) {
      if ( event.modifiers.shift ) { return; }

      var target = event.target;
      if ( target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner' ) { return; }

      if ( !target.active ) {
        target.strokeColor = target.originalStroke;
        target.fillColor = target.originalFill;
      } else {
        target.strokeColor = '#ff0000';
        target.fillColor = '#ff0000';
      }
    },

    remove: function( event ) {
      var geometry = this.get('geometry');
      if ( geometry ) {
        geometry.remove();
        geometry = null;
      }
    }
  });

  return ConstraintHandles;
});
