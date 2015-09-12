/*Group.js
 * path object
 * extends Duplicator node (for the time being)
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
  'utils/PFloat',
  'utils/PPoint',



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

    },

    parseJSON: function(data) {
      this.deleteAllChildren();
      Instance.prototype.parseJSON.call(this, data);
      for (var i = 0; i < data.children.length; i++) {
        var name = data.children[i].name;
        var child = this.getTargetClass(name);
        child.parseJSON(data.children[i]);
        this.addMember(child);
      }
      return this;
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
        deleted.push(this.members[i].deleteSelf());
        this.removeMember(this.members[i]);
      }
      return deleted;
    },

    deleteSelf: function() {
      this.members.length = 0;
      return Instance.prototype.deleteSelf.call(this);
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

      this.get('memberCount').setValue(memberCount);
    },

    removeMember: function(data) {
      this.toggleOpen();
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
      this.toggleClosed();
      return member;

    },

    setValue: function(data) {
      Instance.prototype.setValue.call(this, data);
    },

    getMember: function(member) {

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


    accessMemberGeom: function() {
      var geom_list = [];
      for (var i = 0; i < this.members.length; i++) {
        geom_list.push.apply(geom_list, this.members[i].accessMemberGeom());
      }
      return geom_list;
    },


    toggleOpen: function(item) {
      if ((this === item || this.hasMember(item)) && !this.get('open')) {
        this.inverseTransformRecurse([]);
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].transformSelf();
        }
        this.set('open', true);

        return [this];
      }


    },

    toggleClosed: function(item) {
      console.log('calling toggle closed', item.get('name'));
      if ((this === item || this.hasMember(item) || item.nodeParent === this.nodeParent) && this.get('open')) {
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].inverseTransformSelf();
        }
        this.transformRecurse([]);
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
      var point_list = [];
      for (var i = 0; i < this.members.length; i++) {
        point_list.push(this.members[i].get('geom').position);
      }
      var centroid = TrigFunc.centroid(point_list);
      return centroid;
    },


    compile: function() {
      if (this.members.length > 0) {
        this.members[0].compile();
      }

    },

    render: function() {
      this.renderSelection(this.get('geom'));
    },

    inverseTransformRecurse: function(geom_list) {

      geom_list.push.apply(geom_list, this.accessMemberGeom());

      if (this.nodeParent && this.nodeParent.get('name') === 'group') {
        this.nodeParent.inverseTransformRecurse(geom_list);

      }

      this.inverseTransformSelf();
      //console.log('parent inverse transformation', this._invertedMatrix.translation, this._invertedMatrix.rotation, this._invertedMatrix.scaling);
      //debugger;

      for (var j = 0; j < geom_list.length; j++) {
        //console.log('geom position before parent inversion', geom_list[j].position, geom_list[j].data.instance.get('id'));

        geom_list[j].transform(this._invertedMatrix);
        //console.log('geom position after parent inversion', geom_list[j].position, geom_list[j].data.instance.get('id'));
        //debugger;
      }

      for (var k = 0; k < this.members.length; k++) {
        //console.log('geom position before individual inversion', this.members[k].get('geom').position, this.members[k].get('id'));

        this.members[k].inverseTransformSelf();
        //console.log('geom position after individual inversion', this.members[k].get('geom').position, this.members[k].get('id'));
        //debugger;
      }

    },


    transformRecurse: function(geom_list) {
      for (var i = 0; i < this.members.length; i++) {
        // console.log('geom position before individual transform', this.members[i].get('geom').position, this.members[i].get('id'));

        geom_list.push.apply(geom_list, this.members[i].transformSelf());
        //console.log('geom position after individual transform', this.members[i].get('geom').position, this.members[i].get('id'));
        //debugger;
      }

      this.transformSelf();
      //console.log('parent transformation', this._matrix.translation, this._matrix.rotation, this._matrix.scaling);
      // debugger;
      for (var j = 0; j < geom_list.length; j++) {
        //console.log('geom position before parent transform', geom_list[j].position, geom_list[j].data.instance.get('id'));

        geom_list[j].transform(this._matrix);
        // console.log('geom position after parent transform', geom_list[j].position, geom_list[j].data.instance.get('id'));
        //debugger;
      }
      if (this.nodeParent && this.nodeParent.get('name') === 'group') {
        this.nodeParent.transformRecurse(geom_list);
      }
    },



    transformSelf: function(exclude) {

      this._matrix.reset();
      var value = this.getValue();
      var scalingDelta, rotationDelta, translationDelta;

      scalingDelta = value.scalingDelta;
      rotationDelta = value.rotationDelta;
      translationDelta = value.translationDelta;
      var center = this.calculateGroupCentroid();
      this.center = center;
      this._matrix.translate(translationDelta.x, translationDelta.y);
      this._matrix.rotate(rotationDelta, new paper.Point(center.x, center.y));
      this._matrix.scale(scalingDelta.x, scalingDelta.y, new paper.Point(center.x, center.y));
      return [];
    },

    inverseTransformSelf: function() {
      this._invertedMatrix = this._matrix.inverted();
      return [];
    },

  
    renderSelection: function(geom) {
      var selected = this.get('selected').getValue();
      var constraint_selected = this.get('constraintSelected').getValue();
      var selection_clone = this.get('selection_clone');
      var bbox = this.get('bbox');
      if (!bbox) {

        bbox = new paper.Path.Rectangle(geom.position, new paper.Size(geom.bounds.width, geom.bounds.height));
        bbox.data.instance = this;
        this.set('bbox', bbox);
        var targetLayer = paper.project.layers.filter(function(layer) {
          return layer.name === 'ui_layer';
        })[0];
        targetLayer.addChild(bbox);


      } else {
        bbox.scale(geom.bounds.width / bbox.bounds.width, geom.bounds.height / bbox.bounds.height);
        bbox.position = geom.position;



      }
      if (constraint_selected) {
        if (!selection_clone) {
          this.createSelectionClone();
          selection_clone = this.get('selection_clone');
        }
        selection_clone.visible = true;
        selection_clone.strokeColor = this.get(constraint_selected + '_color');
        selection_clone.scale(geom.bounds.width / selection_clone.bounds.width, geom.bounds.height / selection_clone.bounds.height);
        selection_clone.position = geom.position;
        bbox.selected = false;

      } else {
        if (selection_clone) {
          selection_clone.visible = false;
        }

        bbox.selectedColor = this.getSelectionColor();
        bbox.selected = this.get('selected').getValue();
        bbox.visible = this.get('selected').getValue();
        if (this.get('open')) {
          bbox.strokeColor = new paper.Color(255, 0, 0, 0.5);
          bbox.strokeWidth = 1;
          bbox.visible = true;
        }
      }
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