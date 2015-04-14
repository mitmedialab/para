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
      var geom = (this.get('side') == 'ref') ? this.get('constraint').get('references').get('geom') : this.get('constraint').get('proxy');

      if ( !geom ) { 
        console.log('[ERROR] Cannot draw constraint handles without instance.');
        return;
      }

      // TODO: Handles for stroke/fill/weight

      // green bounding box
      var bounds = geom.bounds;
      var delbox = new paper.Path.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
      delbox.strokeColor = '#A5FF00';
      delbox.fillColor = null;
      delbox.name = 'delbox';

      // corners on box, superficial
      var corners = [];
      for ( var i = 0; i < 9; i++ ) {
        var corner = new paper.Path.Circle( bounds.x + (i % 3) / 2.0 * bounds.width, bounds.y + Math.floor(i / 3) / 2.0 * bounds.height, 3, 3 );
        corner.strokeColor = '#A5FF00';
        corner.fillColor = 'white';
        corners.push(corner);
        corner.name = 'corner';
      }

      // center cross 
      var cross_v = new paper.Path.Line({from: [bounds.center.x, bounds.center.y - 15], to: [bounds.center.x, bounds.center.y + 15]});
      var cross_h = new paper.Path.Line({from: [bounds.center.x - 15, bounds.center.y], to: [bounds.center.x + 15, bounds.center.y]});
      cross_v.name = 'position_x';
      cross_h.name = 'position_y';
      cross_v.strokeColor = cross_h.strokeColor = 'black';
      cross_v.strokeWidth = cross_h.strokeWidth = 2;

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

      var handles = new paper.Group([
        delbox,
        corners[0], corners[1], corners[2], corners[3], corners[4], corners[5], corners[6], corners[7], corners[8],
        cross_v,
        cross_h,
        yarrow,
        xarrow,
        xyarrow,
        rotator
      ]);

      for ( var i = 0; i < handles.children.length; i++ ) {
        handles.children[i].originalStroke = handles.children[i].strokeColor;
        handles.children[i].originalFill = handles.children[i].fillColor;
        handles.children[i].active = false;
        if ( handles.children[i].name != 'delbox' && handles.children[i].name != 'corner' ) { handles.children[i].type = 'handle'; }
      }

      this.set('geometry', handles);
      
      if ( !this.initial ) {
        cross_h.strokeColor = 'red';
        cross_v.strokeColor = 'red';
        cross_h.active = true;
        cross_v.active = true;
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

      var yarrow = geometry.children['scale_y'];
      var xarrow = geometry.children['scale_x'];
      var xyarrow = geometry.children['scale_xy'];
      var rotator = geometry.children['rotation'];
      yarrow.position = corners[1].position;
      xarrow.position = corners[3].position;
      xyarrow.position = corners[0].position;
      rotator.position = new paper.Point( corners[8].bounds.x + 10, corners[8].bounds.y + 10 );

      var cross_v = geometry.children['position_x'];
      var cross_h = geometry.children['position_y'];
      cross_v.position = object_geom.position;
      cross_h.position = object_geom.position;
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
        if ( target.name == 'delbox' || target.name == 'corner' ) { return; }
        if ( (target.name == 'scale_x' || target.name == 'scale_y') && geometry.children['scale_xy'].active ) { return; }
        if ( (target.name == 'scale_x' && geometry.children['scale_y'].active) || (target.name == 'scale_y' && geometry.children['scale_x'].active) ) {
          target = geometry.children['scale_xy'];
        }

        for ( var i = 0; i < geometry.children.length; i++ ) {
          var child = geometry.children[i];
          if ( child.name == 'delbox' || child.name == 'corner' ) { continue; }
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
        //proxy.matchProperty( constraint.get('ref_prop'), constraint.get('rel_prop') );  
      } else {
        applyClick( rel_target, rel_geom, 'rel' );
        constraint.get('proxy').reset();
        constraint.get('rel_handle').redraw();
        //proxy.matchProperty( constraint.get('ref_prop'), constraint.get('rel_prop') );  
      }

    },

    onMouseUp: function( event ) {
      
    },

    onClick: function( event ) {
    
    },

    onMouseEnter: function( event ) {
      if ( event.modifiers.shift ) { return; }

      var target = event.target;
      if ( target.name == 'delbox' || target.name == 'corner' ) { return; }

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
      if ( target.name == 'delbox' || target.name == 'corner' ) { return; }

      if ( !target.active ) {
        target.strokeColor = target.originalStroke;
        target.fillColor = target.originalFill;
      } else {
        target.strokeColor = '#ff0000';
        target.fillColor = '#ff0000';
      }
    }
  });

  return ConstraintHandles;
});
