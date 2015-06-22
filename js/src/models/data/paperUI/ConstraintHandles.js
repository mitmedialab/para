define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUI'
], function(_, paper, Backbone, PaperUI) {

  var targetLayer;
  var prop_map = ['h', 's', 'l'];
  var ConstraintHandles = PaperUI.extend({

    initialize: function(data) {
      PaperUI.prototype.initialize.apply(this, arguments);
      targetLayer = paper.project.layers.filter(function(layer) {
        return layer.name === 'ui_layer';
      })[0];
    },

    draw: function() {
      var createDelimBox = function(bounds) {
        // green bounding box
        var delbox = new paper.Path.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
        delbox.strokeColor = '#A5FF00';
        delbox.fillColor = null;
        delbox.name = 'delbox';
        return delbox;
      };

      var createCorners = function(bounds) {
        // corners on box, superficial
        var corners = [];
        for (var i = 0; i < 9; i++) {
          var corner = new paper.Path.Circle(bounds.x + (i % 3) / 2.0 * bounds.width, bounds.y + Math.floor(i / 3) / 2.0 * bounds.height, 3, 3);
          corner.strokeColor = '#A5FF00';
          corner.fillColor = 'white';
          corners.push(corner);
          corner.name = 'corner';
        }

        return corners;
      };

      var createColorUI = function(corners) {

        var stroke = paper.project.importSVG(document.getElementById('st_b')).children[0];
        var stroke_tab = stroke.children[1];

        var fill = paper.project.importSVG(document.getElementById('f_b')).children[0];
        fill.children[0].name = stroke.children[0].name = 'box';
        var fill_tab = fill.children[1];


        var fill_h = paper.project.importSVG(document.getElementById('h_b')).children[0];
        var fill_s = paper.project.importSVG(document.getElementById('s_b')).children[0];
        var fill_l = paper.project.importSVG(document.getElementById('b_b')).children[0];

        fill_s.position = new paper.Point(fill_h.position.x + fill_h.bounds.width + 2, fill_h.position.y);
        fill_l.position = new paper.Point(fill_s.position.x + fill_s.bounds.width + 2, fill_l.position.y);

        var stroke_h = fill_h.clone();
        var stroke_s = fill_s.clone();
        var stroke_l = fill_l.clone();

        fill_h.children[0].name = fill_s.children[0].name = fill_l.children[0].name = stroke_h.children[0].name = stroke_s.children[0].name = stroke_l.children[0].name = 'box';
        fill_h.children[1].name = fill_s.children[1].name = fill_l.children[1].name = stroke_h.children[1].name = stroke_s.children[1].name = stroke_l.children[1].name = 'letter';

        var fill_group = new paper.Group(fill_h, fill_s, fill_l);
        var stroke_group = new paper.Group(stroke_h, stroke_s, stroke_l);

        fill.position = new paper.Point(corners[2].bounds.center.x - fill.bounds.width / 2, corners[2].bounds.center.y);
        stroke.position = new paper.Point(corners[2].bounds.center.x, corners[2].bounds.center.y + stroke.bounds.height / 2);

        fill_group.position = new paper.Point(corners[2].bounds.center.x + fill.bounds.width + 5, corners[2].bounds.center.y - 8);
        stroke_group.position = new paper.Point(corners[2].bounds.center.x + stroke.bounds.width + 5, corners[2].bounds.center.y + stroke.bounds.height / 2);

        fill.name = 'fill_hsl';
        stroke.name = 'stroke_hsl';
        stroke_tab.name = fill_tab.name = 'options';
        fill_h.name = 'fill_h';
        fill_s.name = 'fill_s';
        fill_l.name = 'fill_l';
        stroke_h.name = 'stroke_h';
        stroke_s.name = 'stroke_s';
        stroke_l.name = 'stroke_l';

        return [stroke, fill, fill_h, fill_s, fill_l, stroke_h, stroke_s, stroke_l];
      };

      var createCross = function(bounds) {
        // center cross 
        var cross_v = new paper.Path.Line({
          from: [bounds.center.x, bounds.center.y - 15],
          to: [bounds.center.x, bounds.center.y + 15]
        });
        var cross_h = new paper.Path.Line({
          from: [bounds.center.x - 15, bounds.center.y],
          to: [bounds.center.x + 15, bounds.center.y]
        });
        cross_v.name = 'position_x';
        cross_h.name = 'position_y';
        cross_v.strokeColor = cross_h.strokeColor = 'black';
        cross_v.strokeWidth = cross_h.strokeWidth = 2;
        cross = [cross_v, cross_h];
        return cross;
      };

      var createScaleArrows = function(corners) {
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
        rotator.position = new paper.Point(corners[8].bounds.x + 10, corners[8].bounds.y + 10);
        yarrow.name = 'scale_y';
        xarrow.name = 'scale_x';
        xyarrow.name = 'scale_xy';
        rotator.name = 'rotation';
        arrows = [yarrow, xarrow, xyarrow, rotator];
        return arrows;
      };

      var geom = (this.get('side') == 'ref') ? this.get('constraint').get('references').get('geom') : this.get('constraint').get('proxy');

      if (!geom) {
        console.log('[ERROR] Cannot draw constraint handles without instance.');
        return;
      }

      var gen_bounds = geom.bounds;
      var gen_delbox = createDelimBox(gen_bounds);
      var gen_corners = createCorners(gen_bounds);
      var hand_geom, hand_bounds, hand_delbox, hand_corners;
      if (geom instanceof paper.Group) {
        hand_geom = geom.children[0];
        hand_bounds = hand_geom.bounds;
        hand_delbox = createDelimBox(hand_bounds);
        hand_delbox.name = 'hand_delbox';
        hand_corners = createCorners(hand_bounds);
        for (var i = 0; i < hand_corners.length; i++) {
          hand_corners[i].name = 'hand_corner';
        }
      } else {
        hand_bounds = gen_bounds;
        hand_delbox = gen_delbox;
        hand_corners = gen_corners;
      }

      var cross = createCross(hand_bounds);
      var arrows = createScaleArrows(hand_corners);
      var color_ui = createColorUI(hand_corners);

      // TODO: Handles for stroke/fill/weight

      var handles;
      if (geom instanceof paper.Group) {
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
        handles.addChildren(color_ui);
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
        handles.addChildren(color_ui);
      }

      for (var k = 0; k < handles.children.length; k++) {
        handles.children[k].originalStroke = handles.children[k].strokeColor;
        handles.children[k].originalFill = handles.children[k].fillColor;
        handles.children[k].active = false;
        if (handles.children[k].name != 'delbox' && handles.children[k].name != 'corner' && handles.children[k].name != 'hand_delbox' && handles.children[k].name != 'hand_corner') {
          handles.children[k].type = 'handle';
        }
      }
      targetLayer.addChild(handles);
      this.set('geometry', handles);

      if (!this.initial) {
        /*cross[1].strokeColor = 'red';
        cross[0].strokeColor = 'red';
        cross[1].active = true;
        cross[0].active = true;*/
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
      if (!geometry) {
        this.draw();
        return;
      }
      geometry.visible = true;
      console.log('handle layer=', geometry.layer);
    },

    redraw: function() {
      var geometry = this.get('geometry');
      var object_geom = (this.get('side') == 'ref') ? this.get('constraint').get('references').get('geom') : this.get('constraint').get('proxy');
      var delbox = geometry.children['delbox'];
      delbox.bounds = object_geom.bounds;
      var corners = geometry.getItems({
        name: 'corner'
      });
      for (var i = 0; i < 9; i++) {
        corners[i].position = new paper.Point(delbox.bounds.x + (i % 3) / 2.0 * delbox.bounds.width, delbox.bounds.y + Math.floor(i / 3) / 2.0 * delbox.bounds.height, 3, 3);
      }

      var hand_object_geom = object_geom;
      var hand_delbox = delbox;
      var hand_corners = corners;
      if (object_geom instanceof paper.Group) {
        hand_object_geom = object_geom.children[0];
        hand_delbox = geometry.children['hand_delbox'];
        hand_delbox.bounds = hand_object_geom.bounds;
        hand_corners = geometry.getItems({
          name: 'hand_corner'
        });
        for (var j = 0; j < 9; j++) {
          hand_corners[j].position = new paper.Point(hand_delbox.bounds.x + (j % 3) / 2.0 * hand_delbox.bounds.width, hand_delbox.bounds.y + Math.floor(j / 3) / 2.0 * hand_delbox.bounds.height, 3, 3);
        }
      }

      var yarrow = geometry.children['scale_y'];
      var xarrow = geometry.children['scale_x'];
      var xyarrow = geometry.children['scale_xy'];
      var rotator = geometry.children['rotation'];
      yarrow.position = hand_corners[1].position;
      xarrow.position = hand_corners[3].position;
      xyarrow.position = hand_corners[0].position;
      rotator.position = new paper.Point(hand_corners[8].bounds.x + 10, hand_corners[8].bounds.y + 10);

      var cross_v = geometry.children['position_x'];
      var cross_h = geometry.children['position_y'];
      cross_v.position = hand_object_geom.position;
      cross_h.position = hand_object_geom.position;
    },

    addListeners: function() {
      var geometry = this.get('geometry');
      for (var i = 0; i < geometry.children.length; i++) {
        var child = geometry.children[i];
        console.log('adding listener to child', child.name);
        child.onMouseEnter = this.onMouseEnter.bind(this);
        child.onMouseLeave = this.onMouseLeave.bind(this);
        child.onMouseDown = this.onMouseDown.bind(this);
        child.onMouseUp = this.onMouseUp.bind(this);
        child.onClick = this.onClick.bind(this);
      }
    },

    //******** DEFAULT LISTENERS *********//
    onMouseDown: function(event) {
      if (event.modifiers.shift) {
        return;
      }
      var target = event.target;
      if (event.target.name == 'box' || event.target.name == 'letter') {
        target = target.parent;
      }
      console.log('target name', target.name, target);
      this.setProperties(target.name);

    },


    setProperties: function(name) {
      console.log('set properties', name);
      console.trace();
      var constraint = this.get('constraint');
      var ref_geom = constraint.get('ref_handle').get('geometry');
      var rel_geom = constraint.get('rel_handle').get('geometry');
      var ref_target = ref_geom.children[name];
      var rel_target = rel_geom.children[name];

      var applyClick = function(target, geometry, side) {

        var thisGroup = target.name.split('_')[0];
        if (target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner') {
          return;
        }
        if ((target.name == 'scale_x' || target.name == 'scale_y') && geometry.children['scale_xy'].active) {
          return;
        }
         if ((target.name == thisGroup+'_h' || target.name == thisGroup+'_s' || target.name == thisGroup+'_l') && geometry.children[thisGroup+'_hsl'].active) {
          return;
        }


        if ((target.name == 'scale_x' && geometry.children['scale_y'].active) || (target.name == 'scale_y' && geometry.children['scale_x'].active)) {
          target = geometry.children['scale_xy'];
        }

        if (((target.name.split('fill')[1]) && target.name != 'fill_hsl') || ((target.name.split('stroke')[1]) && target.name != 'stroke_hsl')){
          var count = 0;
          for (var m = 0; m < prop_map.length; m++) {
            if (geometry.children[thisGroup + '_' + prop_map[m]].active) {
              count++;
            }
          }
          if (count == 2) {
            for (var g = 0; g < prop_map.length; g++) {
              geometry.children[thisGroup + '_' + prop_map[g]].active = false;
            }
            target = geometry.children[thisGroup + '_hsl'];
          }

        }

        for (var i = 0; i < geometry.children.length; i++) {
          var child = geometry.children[i];
          if (child.name == 'delbox' || child.name == 'corner' || child.name == 'hand_delbox' || child.name == 'hand_corner') {
            continue;
          }
          var childGroup = child.name.split('_')[0];
          if (childGroup != thisGroup) {
            child.active = false;
            if (child.name == 'fill_hsl') {
              //TODO: change to match fill/stroke color of original object 
              child.children[0].strokeColor = 'black';
              child.children[0].fillColor = 'white';
            } else if (child.name == 'stroke_hsl') {
              child.children[0].strokeColor = 'white';
              child.children[0].fillColor = 'black';
            } else if (child.name.split('fill')[1] || child.name.split('stroke')[1]) {
              child.children[0].strokeColor = 'black';
              child.children[0].fillColor = 'white';
              child.children[1].fillColor = 'black';
            } else {
              child.strokeColor = child.originalStroke;
              child.fillColor = 'black';
            }
          } else if ((child.name == 'scale_x' || child.name == 'scale_y') && target.name == 'scale_xy') {
            child.active = false;
            child.strokeColor = 'black';
            child.fillColor = 'black';
          } else if (((child.name == 'fill_h' || child.name == 'fill_s' || child.name == 'fill_l') && target.name == 'fill_hsl') || ((child.name == 'stroke_h' || child.name == 'stroke_s' || child.name == 'stroke_l') && target.name == 'stroke_hsl')) {
            child.active = false;
            child.children[0].strokeColor = 'black';
            child.children[0].fillColor = 'white';
            child.children[1].fillColor = 'black';
          }

        }

        target.active = !target.active;
        var property;
        if (target.active) {
          property = target.name;
          if (target.name == 'fill_hsl') {
            //TODO: change to match fill/stroke color of original object 
            target.children[0].strokeColor = 'red';
            console.log('setting fill active');
          } else if (target.name == 'stroke_hsl') {
            target.children[0].strokeColor = 'red';
            console.log('setting stroke active');

          } else if (target.name.split('fill')[1] || target.name.split('stroke')[1]) {
            target.children[0].strokeColor = 'red';
            target.children[1].fillColor = 'red';
            var prop = target.name.split('fill')[1] ? 'fill' : 'stroke';
            var dimensions = '';
            for (var k = 0; k < geometry.children.length; k++) {
              var child_prop = geometry.children[k].name.split('_');
              console.log("testing child", child_prop, geometry.children[k].active);
              if (child_prop[0] === prop && child_prop[1] && geometry.children[k].active) {
                dimensions += child_prop[1];
                console.log('dimensions append:', dimensions);
              }
            }
            property = prop + '_' + dimensions;
            console.log('append prop:', property);


          } else {
            target.strokeColor = '#ff0000';
            target.fillColor = '#ff0000';
          }


          if (geometry.children['position_x'].active && geometry.children['position_y'].active) {
            property = 'position_xy';
          }
          constraint.set(side + '_prop', property);
          return;
        } else {
          property = target.name;
          if (target.name == 'fill_hsl') {
            //TODO: change to match fill/stroke color of original object 
            target.children[0].strokeColor = 'black';
            target.children[0].fillColor = 'white';
          } else if (target.name == 'stroke_hsl') {
            target.children[0].strokeColor = 'white';
            target.children[0].fillColor = 'black';
          } else if (target.name.split('fill')[1] || target.name.split('stroke')[1]) {
            target.children[0].strokeColor = 'black';
            target.children[0].fillColor = 'white';
            target.children[1].fillColor = 'black';
          } else {
            target.strokeColor = target.originalStroke;
            target.fillColor = 'black';
          }
          for (var j = 0; j < geometry.children.length; j++) {
            if (geometry.children[j].active) {
              constraint.set(side + '_prop', geometry.children[j].name);
              return;
            }
          }
          constraint.set(side + '_prop', null);
        }
      };

      if (this.get('side') == 'ref') {
        applyClick(ref_target, ref_geom, 'ref');
        applyClick(rel_target, rel_geom, 'rel');
        constraint.get('proxy').reset();
        constraint.get('rel_handle').redraw();
        constraint.get('arrow').redrawTail(constraint.get('proxy'));
        constraint.get('proxy').matchProperty(constraint.get('ref_prop'), constraint.get('rel_prop'));
      } else {
        applyClick(rel_target, rel_geom, 'rel');
        constraint.get('proxy').reset();
        constraint.get('rel_handle').redraw();
        constraint.get('arrow').redrawTail(constraint.get('proxy'));
        constraint.get('proxy').matchProperty(constraint.get('ref_prop'), constraint.get('rel_prop'));
      }

    },

    onMouseUp: function(event) {

    },

    onClick: function(event) {

    },

    onMouseEnter: function(event) {
      if (event.modifiers.shift) {
        return;
      }

      var target = event.target;

      console.log('target', target, target.name);
      if (target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner') {
        return;
      } else if (target.name == 'fill' || target.name == 'stroke' || target.name == 'options' || target.name == 'box' || target.name == 'letter') {
        if (target.name == 'box' || target.name == 'letter') {
          target.parent.opacity = 0.5;
        } else {
          target.opacity = 0.5;
        }
        return;
      }
      if (target.strokeColor) {
        target.strokeColor.saturation = target.strokeColor.brightness = 0.5;
      }
      if (target.fillColor) {
        target.fillColor.saturation = target.fillColor.brightness = 0.5;
      }

    },

    onMouseLeave: function(event) {
      if (event.modifiers.shift) {
        return;
      }
      var target = event.target;
      console.log('name', target.name);

      console.log('target', target, target.name);

      if (target.name == 'delbox' || target.name == 'corner' || target.name == 'hand_delbox' || target.name == 'hand_corner') {
        return;
      } else if (target.name == 'fill' || target.name == 'stroke' || target.name == 'options' || target.name == 'box' || target.name == 'letter') {
        if (target.name == 'box' || target.name == 'letter') {
          target.parent.opacity = 1;
        } else {
          target.opacity = 1;
        }
        return;
      } else {

        if (target.active) {
          if (target.strokeColor) {
            target.strokeColor.saturation = target.strokeColor.brightness = 1;
          }
          if (target.fillColor) {
            target.fillColor.saturation = target.fillColor.brightness = 1;
          }
        } else {
          if (target.strokeColor) {
            target.strokeColor.saturation = target.strokeColor.brightness = 0;
          }
          if (target.fillColor) {
            target.fillColor.saturation = target.fillColor.brightness = 0;
          }
        }
      }
    },

    remove: function(event) {
      var geometry = this.get('geometry');
      if (geometry) {
        geometry.remove();
        geometry = null;
      }
    }
  });

  return ConstraintHandles;
});