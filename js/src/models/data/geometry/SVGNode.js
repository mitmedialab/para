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
    render: function() {
      if (!this.get('rendered')) {
        var geom = this.get('geom');
        this.transformSelf();
        this.renderStyle(geom);
        this.renderSelection(geom);

        this.set('rendered', true);
      }
    },


    reset: function() {
      GeometryNode.prototype.reset.apply(this, arguments);

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

    getShapeClone: function() {
      return PathNode.prototype.getShapeClone.call(this);
    },


    renderStyle: function(geom) {
      this._visible = this.get('visible');
      geom.visible = this._visible;
      if (!this.get('inFocus')) {
        geom.opacity = 0.5;
      } else {
        geom.opacity = 1;
      }
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