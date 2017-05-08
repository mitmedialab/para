/*SVGNode.js
 * imported svg object
 * extends PathNode
 */


define([
  'underscore',
  'models/data/geometry/Group',
  'models/data/geometry/PathNode',
  'models/data/geometry/GeometryNode',
  'utils/TrigFunc',
  'models/data/properties/PPoint',
  'paper',
  'models/data/properties/PFloat',
  'models/data/properties/PColor'


], function(_, Group, PathNode, GeometryNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var SVGNode = Group.extend({

    defaults: _.extend({}, Group.prototype.defaults, {

      name: 'svg',
      type: 'geometry',

    }),


    initialize: function(data) {
      Group.prototype.initialize.apply(this, arguments);
      this.get('strokeWidth').setValue(1);
      this.get('fillColor').setValue({
        h: 1,
        s: 0,
        b: 0
      });
      this.get('strokeColor').setValue({
        h: 1,
        s: 0,
        b: 0
      });
      this.set('geom', null);
    },

    toJSON: function(noUndoCache) {
      var data = GeometryNode.prototype.toJSON.call(this, noUndoCache);
      data.svg_data = this.svg_data;
      return data;
    },

    parseJSON: function(data, manager) {
      if (!this.get('geom')) {
        var geom = new paper.Group();
        var item = geom.importSVG(data.svg_data);
        item.position.x = 0;
        item.position.y = 0;
        this.changeGeomInheritance(item, data.svg_data);
      }
      return GeometryNode.prototype.parseJSON.call(this, data, manager);
    },

    deleteSelf: function() {
      var geom = this.get('geom');
      if (geom) {
        geom.remove();
        this.setDataNull(geom);
      }
      return GeometryNode.prototype.deleteSelf.call(this);
    },

    setValue: function(data, registerUndo) {
      GeometryNode.prototype.setValue.call(this, data, registerUndo);
    },


    changeGeomInheritance: function(geom, data) {


      if (this.get('geom')) {
        var ok = (geom && geom.insertBelow(this.get('geom')));
        if (ok) {

          this.get('geom').remove();
        }
        this.setDataNull(this.get('geom'));
        this.set('geom', null);

      }

      geom.applyMatrix = false;
      this.set('geom', geom);

      this.setData(geom);
      this.createBBox();
      this.svg_data = data;
    },

    setData: function(geom) {
      geom.data.instance = this;
      geom.data.geom = true;
      geom.data.nodetype = this.get('name');
      if (geom.children) {
        for (var i = 0; i < geom.children.length; i++) {
          this.setData(geom.children[i]);
        }
      }
    },

    setDataNull: function(geom) {
      geom.data.instance = null;
      if (geom.children) {
        for (var i = 0; i < geom.children.length; i++) {
          this.setDataNull(geom.children[i]);
        }
      }
    },

    toggleOpen: function() {
      return;
    },

    toggleClosed: function() {
      return;
    },

    transformSelf: function() {
      GeometryNode.prototype.transformSelf.call(this);
    },
   


    create: function(noInheritor) {
      var instance = this.geometryGenerator.getTargetClass(this.get('name'));
      var value = this.getValue();
      instance.setValue(value);
      var g_clone = this.getShapeClone(true);
      instance.changeGeomInheritance(g_clone);
      instance.set('rendered', true);
      instance.createBBox();
      instance.svg_data = this.svg_data;
      return instance;
    },


    renderStyle: function(geom) {
            var value = this.getValue();

      this._visible = this.get('visible');
      geom.visible = this._visible;
    this._fillColor = value.fillColor;
      this._strokeColor = value.strokeColor;
      this._strokeWidth = value.strokeWidth;
      this._visible = this.get('visible');
      if (!this._fillColor.noColor) {
        if (!geom.fillColor) {
          geom.fillColor = new paper.Color(0, 0, 0);
        }

        geom.fillColor.hue = this._fillColor.h;
        console.log("hue for", this.get('name'), value.fillColor);
        geom.fillColor.saturation = this._fillColor.s;
        geom.fillColor.lightness = this._fillColor.l;
        geom.fillColor.alpha = this._fillColor.a;

      } else {
        geom.fillColor = undefined;
      }
      if (!this._strokeColor.noColor) {
        if (!geom.strokeColor) {
          geom.strokeColor = new paper.Color(0, 0, 0);
        }
        geom.strokeColor.hue = TrigFunc.wrap(this._strokeColor.h, 0, 360);
        geom.strokeColor.saturation = this._strokeColor.s;
        geom.strokeColor.lightness = this._strokeColor.l;
        geom.strokeColor.alpha = this._strokeColor.a;
        geom.strokeColor.alpha = this._strokeColor.a;
      } else {
        geom.strokeColor = undefined;
      }

      if (!this.get('inFocus')) {
        geom.opacity = 0.5;
      } else {
        geom.opacity = this.get('fillColor').getValue().a;
      }
      geom.blendMode = this.get('blendMode_map')[this.get('blendMode').getValue()];

    },


    getValueFor: function(property_name) {
      var property = this.get(property_name);
      return this.getValue()[property_name];
    },

    renderSelection: function(geom) {
      Group.prototype.renderSelection.call(this, geom);

    },


  });
  return SVGNode;
});