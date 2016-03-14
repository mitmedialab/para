/*Group.js
 * path object
 * extends Duplicar node (for the time being)
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/Instance',
  'models/data/geometry/PathNode',
  'models/data/geometry/RectNode',
  'models/data/geometry/EllipseNode',
  'models/data/geometry/PolygonNode',
  'utils/TrigFunc',
  'models/data/properties/PFloat',
  'models/data/properties/PPoint',



], function(_, paper, Instance, PathNode, RectNode, EllipseNode, PolygonNode, TrigFunc, PFloat, PPoint) {
  var init_lookup = {
    'path': PathNode,
    'ellipse': EllipseNode,
    'polygon': PolygonNode,
    'rectangle': RectNode,
  };
  var Group = Instance.extend({

    defaults: _.extend({}, Instance.prototype.defaults, {

      name: 'group',
      type: 'geometry',
      points: null,
      open: false,

    }),

    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);
      this.resetProperties();
      var memberCount = new PFloat(0);
      memberCount.setNull(false);
      this.set('memberCount', memberCount);
      this.get('scalingDelta').setValue({
        x: 1,
        y: 1,
        operator: 'set'
      });
      this.members = [];
      var geom = new paper.Group();
      this.set('geom', geom);
      geom.data.instance = this;
      this.get('fillColor').setNoColor(true);
      this.get('strokeColor').setNoColor(true);
      this.get('strokeWidth').setValue(1);
      this.centerUI.fillColor = 'blue';
      this.center = geom.position;
    },



    parseJSON: function(data, manager) {
      this.deleteAllChildren();
      Instance.prototype.parseJSON.call(this, data);
      for (var i = 0; i < data.children.length; i++) {
        var name = data.children[i].name;
        var child = this.getTargetClass(name);
        child.parseJSON(data.children[i], manager);
        this.addMember(child);
      }
      return this;
    },

    parseInheritorJSON: function(data, manager) {
      for (var i = 0; i < this.children.length; i++) {
        var c_data = data.children[i];
        var child = this.children[i];
        child.parseInheritorJSON(c_data, manager);
      }
    },

    /*returns new child instance based on string name
     */
    getTargetClass: function(name) {
      var target_class = init_lookup[name];
      var child = new target_class();
      return child;
    },

    getById: function(id) {
      if (this.get('id') == id) {
        return this;
      } else {
        for (var i = 0; i < this.members.length; i++) {
          var match = this.members[i].getById(id);
          if (match) {
            return match;
          }
        }
      }
    },


    /*deleteAllChildren
     * function which deletes all children
     */
    deleteAllChildren: function(deleted) {
      if (!deleted) {
        deleted = [];
      }
      for (var i = this.members.length - 1; i >= 0; i--) {
        deleted.push.apply(deleted, this.members[i].deleteAllChildren());
        var d = this.removeMember(this.members[i]);
        deleted.push(d.deleteSelf());

      }
      return deleted;
    },

    deleteSelf: function() {
      var data = Instance.prototype.deleteSelf.call(this);
      this.members.length = 0;
      return data;
    },

    create: function() {
      var instance = new this.constructor();
      var value = this.getValue();
      instance.setValue(value);
      for (var i = 0; i < this.members.length; i++) {
        var clone = this.members[i].create();
        instance.addMember(clone);
      }
      return instance;
    },

    addMember: function(clone, index) {

      if (index) {
        this.members.splice(index, 0, clone);
        this.insertChild(index, clone);
        this.get('geom').insertChild(index, clone.get('geom'));

        clone.get('zIndex').setValue(index);

      } else {
        this.members.push(clone);
        this.addChildNode(clone);
        this.get('geom').addChild(clone.get('geom'));
        clone.get('zIndex').setValue(this.members.length - 1);

      }
      var memberCount = {
        v: this.members.length,
        operator: 'set'
      };

      this.listenTo(clone, 'modified', this.modified);
      this.center = this.get('geom').position;

      this.get('memberCount').setValue(memberCount);
      this.createBBox();

      this.createSelectionClone();
    },

    removeMember: function(data) {
      this.toggleOpen(this);
      var index = $.inArray(data, this.members);
      var member;
      if (index > -1) {

        member = this.members.splice(index, 1)[0];
        var childIndex = member.get('geom').index;
        this.get('geom').removeChildren(childIndex, childIndex + 1);
        this.removeChildNode(member);
        var memberCount = {
          v: this.members.length,
          operator: 'set'
        };
        this.get('memberCount').setValue(memberCount);

      }
      this.stopListening(data);
      this.toggleClosed(this);
      this.center = this.get('geom').position;
      this.createBBox();
      this.createSelectionClone();
      return member;

    },

    ungroup: function() {
      var members = [];
      for (var i = 0; i < this.members.length; i++) {
        members.push(this.removeMember(this.members[i]));
      }
      return members;
    },

    setValue: function(data) {
      if (data.fillColor || data.strokeColor || data.strokeWidth) {
        var style_data = {};
        if (data.fillColor && !data.fillColor.noColor) {
          style_data.fillColor = data.fillColor;
        }
        if (data.strokeColor && !data.strokeColor.noColor) {
          style_data.strokeColor = data.strokeColor;
        }
        if (data.strokeWidth) {
          style_data.strokeWidth = data.strokeWidth;
        }
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].setValue(style_data);
        }

      }
      Instance.prototype.setValue.call(this, data);
    },

    getMember: function(member) {
      if (member === this) {
        return this;
      }
      for (var i = 0; i < this.members.length; i++) {
        var m = this.members[i].getMember(member);
        if (m) {
          if (this.get('open')) {
            return m;
          } else {
            return this;
          }
        }
      }
      return null;
    },
    hasMember: function(member, top, last) {
      if (!top) {
        if (this === member) {
          return last;
        }
      }
      for (var i = 0; i < this.members.length; i++) {
        var member_found = this.members[i].hasMember(member, false, this);
        if (member_found) {
          return member_found;
        }
      }
    },
    getRange: function() {
      return this.children.length;
    },

    accessMemberGeom: function() {
      var geom_list = [];
      for (var i = 0; i < this.members.length; i++) {
        geom_list.push.apply(geom_list, this.members[i].accessMemberGeom());
      }
      return geom_list;
    },


    toggleOpen: function(item) {
      if ((this === item || this.hasMember(item)) && !this.get('open')) {
        this.set('open', true);

        return [this];
      }


    },

    toggleClosed: function(item) {
      if ((this === item || this.hasMember(item) || item.nodeParent === this.nodeParent) && this.get('open')) {
        this.set('open', false);

        return [this];
      }

    },

    closeAllMembers: function() {
      this.toggleClosed(this);
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].closeAllMembers();


      }
    },



    calculateGroupCentroid: function() {
      if (this.members.length > 1) {
        var point_list = [];
        for (var i = 0; i < this.members.length; i++) {
          point_list.push(this.members[i]._matrix.translation);
        }
        var centroid = TrigFunc.centroid(point_list);
        return centroid;
      } else {
        if (this.members > 0) {
          return {
            x: this.members[0]._matrix.translation.x,
            y: this.members[0]._matrix.translation.y
          };
        }
      }
      return {
        x: 0,
        y: 0
      };
    },

    reset: function() {

      if (this.get('rendered')) {
        console.log('reset geom position =', this.get('geom').position, "bbox=", this.get('bbox').position, "sclone=", this.get('selection_clone').position);

        Instance.prototype.reset.apply(this, arguments);
        for (var i = 0; i < this.renderQueue.length; i++) {
          this.renderQueue[i].reset();
        }
        console.log('after reset geom position =', this.get('geom').position, "bbox=", this.get('bbox').position, "sclone=", this.get('selection_clone').position);

      }

    },


    render: function() {

      if (!this.get('rendered')) {
        console.log('render geom position =', this.get('geom').position, "bbox=", this.get('bbox').position, "sclone=", this.get('selection_clone').position);
        console.log( this.renderQueue);
        for (var i = 0; i < this.renderQueue.length; i++) {
          this.renderQueue[i].render();
        }
        this.renderQueue = [];

        Instance.prototype.render.apply(this, arguments);
        console.log('after render geom position =', this.get('geom').position, "bbox=", this.get('bbox').position, "sclone=", this.get('selection_clone').position);

      }
    },

    renderStyle: function() {

    },

    inverseTransformPoint: function(point) {
      var r = this.get('rotationDelta').getValue();
      var s = this.get('scalingDelta').getValue();
      var delta = new paper.Point(point.x, point.y);
      var new_delta = delta.rotate(-r, new paper.Point(0, 0));
      new_delta = new_delta.divide(new paper.Point(s.x, s.y));
      return new_delta;
    },

    transformPoint: function(point) {
      var translationDelta = this.get('translationDelta').getValue();
      var delta = new paper.Point(point.x, point.y);
      var new_delta = this._matrix.transform(delta);

      new_delta.x -= translationDelta.y;
      new_delta.y -= translationDelta.x;
      return new_delta;
    },

    transformSelf: function() {

      var m2 = new paper.Matrix();

      var value = this.getValue();
      var scalingDelta, rotationDelta, translationDelta;

      scalingDelta = value.scalingDelta;
      rotationDelta = value.rotationDelta;
      translationDelta = value.translationDelta;


      m2.translate(translationDelta.x, translationDelta.y);
      m2.rotate(rotationDelta, this.center.x, this.center.y);
      m2.scale(scalingDelta.x, scalingDelta.y, this.center.x, this.center.y);

      this._matrix = m2;

    },



    createSelectionClone: function() {
      if (this.get('selection_clone')) {
        this.get('selection_clone').remove();
        this.set('selection_clone', null);
      }
      var selection_clone = this.get('bbox').clone();
      var targetLayer = paper.project.layers.filter(function(layer) {
        return layer.name === 'ui_layer';
      })[0];
      targetLayer.addChild(selection_clone);
      selection_clone.data.instance = this;
      selection_clone.fillColor = null;
      selection_clone.strokeWidth = 3;
      selection_clone.selected = false;
      this.set('selection_clone', selection_clone);
    },



  });
  return Group;
});