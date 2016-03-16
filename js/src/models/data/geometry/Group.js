/*Group.js
 * path object
 * extends Duplicar node (for the time being)
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/geometry/GeometryNode',
  'utils/TrigFunc',
  'models/data/properties/PFloat',
  'models/data/properties/PPoint',



], function(_, paper, GeometryNode, TrigFunc, PFloat, PPoint) {

  var Group = GeometryNode.extend({

    defaults: _.extend({}, GeometryNode.prototype.defaults, {

      name: 'group',
      type: 'geometry',
      points: null,
      open: false,

    }),

    initialize: function(attributes, options) {
      GeometryNode.prototype.initialize.apply(this, arguments);
      this.resetProperties();
      this.get('scalingDelta').setValue({
        x: 1,
        y: 1,
        operator: 'set'
      });
      var geom = new paper.Group();
      this.set('geom', geom);
      geom.data.instance = this;
      this.get('fillColor').setNoColor(true);
      this.get('strokeColor').setNoColor(true);
      this.get('strokeWidth').setValue(1);
      // this.centerUI.fillColor = 'blue';
      // this.center = geom.position;
      var ui_group = new paper.Group();
      var targetLayer = paper.project.layers.filter(function(layer) {
        return layer.name === 'ui_layer';
      })[0];
      targetLayer.addChild(ui_group);
      this.set('bbox', ui_group);
      this.createBBox();
      this.geometryGenerator = options.geometryGenerator;
    },


    toJSON: function() {
      var data = GeometryNode.prototype.toJSON.call(this);
      for (var i = 0; i < this.children.length; i++) {
        data.children.push(this.children[i].toJSON());
      }
      return data;
    },



    parseJSON: function(data, manager) {

      var childClone = this.children.slice(0, this.children.length);
      var dataClone = data.children.slice(0, data.children.length);


      for (var i = 0; i < this.children.length; i++) {
        var target_id = this.children[i].get('id');
        var target_data = _.find(data.children, function(item) {
          return item.id == target_id;
        });
        //if the child currently exists in the group
        if (target_data) {
          this.children[i].parseJSON(target_data);
          childClone = _.filter(childClone, function(child) {
            return child.get('id') != target_id;
          });
          dataClone = _.filter(dataClone, function(data) {
            return data.id != target_id;
          });
        }
      }


      //remove children not in JSON
      for (var j = 0; j < childClone.length; j++) {

        var currentFuture = this.futureStates[this.futureStates.length - 1];
        var currentPast = this.previousStates[this.previousStates.length - 1];
        if (currentFuture) {
          var targetFuture = _.find(currentFuture.children, function(item) {
            return item.id == childClone[j].get('id');
          });
          if (targetFuture) {
            targetFuture.futureStates = childClone[j].futureStates;
            targetFuture.previousStates = childClone[j].previousStates;
          }
        }
        if (currentPast) {
          var targetPast = _.find(currentPast.children, function(item) {
            return item.id == childClone[j].get('id');
          });
          if (targetPast) {
            targetPast.futureStates = childClone[j].futureStates;
            targetPast.previousStates = childClone[j].previousStates;
          }
        }

        var removed = this.removeChildNode(childClone[j]);
        removed.deleteSelf();
      }

      //addChildren in JSON that didn't already exist
      for (var k = 0; k < dataClone.length; k++) {
        var newChild = this.geometryGenerator.getTargetClass(dataClone[k].name);
        newChild.parseJSON(dataClone[k]);
        newChild.previousStates = dataClone[k].previousStates;
        newChild.futureStates = dataClone[k].futureStates;
        this.insertChild(dataClone[k].zIndex, newChild);
        newChild.trigger('modified', newChild);
      }

      GeometryNode.prototype.parseJSON.call(this, data, manager);

    },



    parseInheritorJSON: function(data, manager) {
      for (var i = 0; i < this.children.length; i++) {
        var c_data = data.children[i];
        var child = this.children[i];
        child.parseInheritorJSON(c_data, manager);
      }
    },



    getById: function(id) {
      if (this.get('id') == id) {
        return this;
      } else {
        for (var i = 0; i < this.children.length; i++) {
          var match = this.children[i].getById(id);
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
      for (var i = this.children.length - 1; i >= 0; i--) {
        deleted.push.apply(deleted, this.children[i].deleteAllChildren());
        var d = this.removeChildNode(this.children[i]);
        deleted.push(d.deleteSelf());

      }
      return deleted;
    },

    deleteSelf: function() {
      var data = GeometryNode.prototype.deleteSelf.call(this);
      this.children.length = 0;
      return data;
    },

    create: function() {
      var instance = new this.constructor();
      var value = this.getValue();
      instance.setValue(value);
      for (var i = 0; i < this.children.length; i++) {
        var clone = this.children[i].create();
        instance.addChildNode(clone);
      }
      return instance;
    },

    insertChild: function(index, child, registerUndo) {
      GeometryNode.prototype.insertChild.call(this, index, child, registerUndo);
      this.get('geom').insertChild(index, child.get('geom'));
      this.get('bbox').insertChild(index, child.get('bbox'));
      this.center = this.get('geom').position;
      this.createBBox();
      this.createSelectionClone();
      this.listenTo(child, 'modified', this.modified);
      this.trigger('modified', this);
    },

    removeChildNode: function(node, registerUndo) {
      var removed = GeometryNode.prototype.removeChildNode.call(this, node, registerUndo);
      if (removed) {
        removed.get('geom').remove();
        this.center = this.get('geom').position;
        this.createBBox();
        this.createSelectionClone();
        this.stopListening(removed);

        this.trigger('modified', this);
        return removed;
      }
    },

    ungroup: function() {
      var childClone = this.children.slice(0, this.children.length);
      var removedChildren = [];
      for (var i = 0; i < childClone.length; i++) {
        removedChildren.push(this.removeChildNode(childClone[i]));
      }
      return removedChildren;
    },

    setValue: function(data, registerUndo) {
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
        for (var i = 0; i < this.children.length; i++) {
          this.children[i].setValue(style_data, registerUndo);
        }

      }
      GeometryNode.prototype.setValue.call(this, data, registerUndo);
    },

    //returns all non-group children
    getInstanceChildren: function(list) {
      if (!list) {
        list = [];
      }
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].get('type') !== 'group') {
          list.push(this.children[i]);
        } else {
          this.children[i].getInstanceChildren(list);
        }

      }
      return list;
    },


    getChild: function(child) {
      if (child === this) {
        return this;
      }
      for (var i = 0; i < this.children.length; i++) {
        var m = this.children[i].getChild(child);
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


    hasChild: function(child, top, last) {
      if (!top) {
        if (this === child) {
          return last;
        }
      }
      for (var i = 0; i < this.children.length; i++) {
        var child_found = this.children[i].hasChild(child, false, this);
        if (child_found) {
          return child_found;
        }
      }
    },

    getRange: function() {
      return this.children.length;
    },



    toggleOpen: function(item) {
      if ((this === item || this.hasChild(item)) && !this.get('open')) {
        this.set('open', true);

        return [this];
      }


    },

    toggleClosed: function(item) {
      if ((this === item || this.hasChild(item) || item.nodeParent === this.nodeParent) && this.get('open')) {
        this.set('open', false);

        return [this];
      }

    },

    closeAllChildren: function() {
      this.toggleClosed(this);
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].closeAllChildren();
      }
    },


    reset: function() {

      if (this.get('rendered')) {

        GeometryNode.prototype.reset.apply(this, arguments);
        for (var i = 0; i < this.renderQueue.length; i++) {
          if (this.renderQueue[i] && !this.renderQueue[i].deleted) {
            this.renderQueue[i].reset();
          }
        }

      }

    },



    render: function() {

      if (!this.get('rendered')) {
        for (var i = 0; i < this.renderQueue.length; i++) {
          if (this.renderQueue[i] && !this.renderQueue[i].deleted) {
            this.renderQueue[i].render();
          }
        }
        this.createBBox();
        GeometryNode.prototype.render.apply(this, arguments);



      }
    },

    renderStyle: function() {

    },

    renderSelection: function() {
      var selected = this.get('selected').getValue();
      var constraint_selected = this.get('constraintSelected').getValue();
      var selection_clone = this.get('selection_clone');
      var bbox = this.get('bbox').children.filter(function(child) {
        return child.name == 'bbox';
      })[0];
      if (constraint_selected) {
        selection_clone.visible = true;
        selection_clone.strokeColor = this.get(constraint_selected + '_color');

      } else {
        selection_clone.visible = false;

      }

      if (selected) {


        bbox.selectedColor = this.getSelectionColor();
        bbox.selected = (constraint_selected) ? false : true;
        bbox.visible = (constraint_selected) ? false : true;
      } else {
        bbox.selected = false;
        bbox.visible = false;
      }
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


    createBBox: function() {
      var ui_group = this.get('bbox');
      var bboxes = ui_group.children.filter(function(child) {
        return child.name == 'bbox';
      });
      var geom = this.get('geom');
      var size = new paper.Size(geom.bounds.width, geom.bounds.height);
      var bbox;
      if (size.isZero()) {
        size = new paper.Size(1, 1);
      }
      if (bboxes.length < 1) {


        bbox = new paper.Path.Rectangle(geom.bounds.topLeft, size);

        bbox.data.instance = this;
        bbox.name = 'bbox';
        ui_group.addChild(bbox);
      } else {
        bbox = bboxes[0];
        var bounds = bbox.bounds;
        bbox.scale(size.width / bounds.width, size.height / bounds.height);
      }


    },


  });

  return Group;
});