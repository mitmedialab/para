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
      this.geometryGenerator = options.geometryGenerator;
      this.get('scalingDelta').setValue({
        x: 1,
        y: 1,
        operator: 'set'
      });
      var geom = new paper.Group();
      geom.applyMatrix = false;
      this.set('geom', geom);
      geom.data.instance = this;
      geom.data.geom = true;
      geom.data.nodetype = this.get('name');
      this.get('fillColor').setNoColor(true);
      this.get('strokeColor').setNoColor(true);
      this.get('strokeWidth').setValue(1);
      var ui_group = new paper.Group();
      var targetLayer = paper.project.layers.filter(function(layer) {
        return layer.name === 'ui_layer';
      })[0];
      targetLayer.addChild(ui_group);
      this.set('bbox', ui_group);
      this.createBBox();
      this.currentBounds = new paper.Rectangle(0,0,0,0);
      this.originChange = new paper.Point(0,0);
      this.startingUI = new paper.Path.Circle(new paper.Point(0,0),10);
      this.startingUI.fillColor = 'green';
      this.endingUI = this.startingUI.clone();
      this.endingUI.fillColor = 'red';

    },



    toJSON: function(noUndoCache) {
      var data = GeometryNode.prototype.toJSON.call(this, noUndoCache);
      for (var i = 0; i < this.children.length; i++) {
        data.children.push(this.children[i].toJSON(noUndoCache));
      }
      return data;
    },



    clearUndoCache: function() {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].clearUndoCache();
      }
      GeometryNode.prototype.clearUndoCache.call(this);
    },

    parseJSON: function(data, manager) {
      var changed = GeometryNode.prototype.parseJSON.call(this, data, manager);
      var childClone = this.children.slice(0, this.children.length);
      var dataClone = data.children.slice(0, data.children.length);


      for (var i = 0; i < this.children.length; i++) {
        var target_id = this.children[i].get('id');
        var target_data = _.find(data.children, function(item) {
          return item.id == target_id;
        });
        //if the child currently exists in the group
        if (target_data) {
          var mI = this.children[i].parseJSON(target_data);
          changed.toRemove.push.apply(changed, mI.toRemove);
          changed.toAdd.push.apply(changed, mI.toAdd);
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
        changed.toRemove.push(removed);
        removed.deleteSelf();
      }

      //addChildren in JSON that didn't already exist
      for (var k = 0; k < dataClone.length; k++) {
        var newChild = this.geometryGenerator.getTargetClass(dataClone[k].name);
        changed.toAdd.push(newChild);
        newChild.parseJSON(dataClone[k]);
        newChild.previousStates = dataClone[k].previousStates;
        newChild.futureStates = dataClone[k].futureStates;
        this.insertChild(dataClone[k].zIndex, newChild);
        newChild.trigger('modified', newChild);
      }

      return changed;

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


    getInternalList: function(id) {
      var list;
      for (var i = 0; i < this.children.length; i++) {
        list = this.children[i].getInternalList(id);
        if (list) {
          return list;
        }
      }
    },

    getInternalListOwner: function(id) {
      var owner;
      for (var i = 0; i < this.children.length; i++) {
        owner = this.children[i].getInternalListOwner(id);
        if (owner) {
          return owner;
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

    create: function(noInheritor) {
      var instance = this.geometryGenerator.getTargetClass(this.get('name'));
      var value = this.getValue();
      instance.setValue(value);
      instance.set('rendered', true);

      for (var i = 0; i < this.children.length; i++) {
        var clone = this.children[i].create(noInheritor);
        instance.addChildNode(clone);
      }

      return instance;
    },

    insertChild: function(index, child, registerUndo) {
      GeometryNode.prototype.insertChild.call(this, index, child, registerUndo);
      this.get('geom').insertChild(index, child.get('geom'));
      this.get('bbox').insertChild(index, child.get('bbox'));
    
      this.get('translationDelta').setValue(this.get('geom').position);
      this.createBBox();
      this.currentBounds = this.get('geom').bounds;
    },

    removeChildNode: function(node, registerUndo) {
      var removed = GeometryNode.prototype.removeChildNode.call(this, node, registerUndo);
      if (removed) {
        removed.get('geom').remove();
        this.currentBounds = this.get('geom').bounds;
        this.get('translationDelta').setValue(this.get('geom').position);

        this.createBBox();
        this.stopListening(removed);

        return removed;
      }
    },

    unGroup: function() {

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

    /* getValueFor
     * returns the actual value for a given property
     */
    getValueFor: function(property_name) {
      if (property_name == 'strokeColor' || property_name == 'fillColor' || property_name == 'strokeWidth') {
        return this.children[this.children.length - 1].getValueFor(property_name);
      } else {
        var property = this.get(property_name);
        return this.getValue()[property_name];
      }
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

    toggleOpen: function() {
      this.startingPosition = this.get('geom').position;
      this.startingUI.position = this.startingPosition;
      console.log("open=",this.startingPosition,this.get('translationDelta').getValue(),TrigFunc.subtract(this.startingPosition,this.get('translationDelta').getValue()));
      this.set('open', true);

    },

    toggleClosed: function() {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].toggleClosed();
      }
      var closingPosition = this.get('geom').position;
      //this.get('geom').position = this.startingPosition;
      var diff = this.startingPosition.subtract(closingPosition);
      console.log("closed=",diff,closingPosition,this.get('translationDelta').getValue(),TrigFunc.subtract(closingPosition,this.get('translationDelta').getValue()));
      this.endingUI.position = closingPosition;
      this.get('translationDelta').setValue(this.get('geom').position);

      console.log('diff',diff);
      this.set('open', false);
     },


    childModified: function(child) {
      for(var i=0;i<this.children.length;i++){
          GeometryNode.prototype.childModified.call(this, this.children[i]);
      }
    },



    renderStyle: function() {
      if (!this.get('inFocus')) {
        this.get('geom').opacity = 0.5;
      } else {

        this.get('geom').opacity = 1;
      }
    },

    renderSelection: function() {
      var selected = this.get('selected').getValue();
      var constraint_selected = this.get('constraintSelected').getValue();
      var geom = this.get('geom');
      var bbox = this.get('bbox').children.filter(function(child) {
        return child.name == 'bbox';
      })[0];
     if (selected || constraint_selected) {
        geom.selectedColor = this.getSelectionColor();
        bbox.selectedColor = (constraint_selected) ? this.get(constraint_selected + '_color'):this.getSelectionColor();
        bbox.selected =  true;
        bbox.visible =  true;
        geom.selected = (constraint_selected) ? false : true;
      } else {
        bbox.selected = false;
        bbox.visible = false;
        geom.selected = false;
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
      var r = this.get('rotationDelta').getValue();
      var s = this.get('scalingDelta').getValue();
      var delta = new paper.Point(point.x, point.y);
      var new_delta = delta.rotate(r, new paper.Point(0, 0));
      new_delta = new_delta.multiply(new paper.Point(s.x, s.y));
      return new_delta;
    },


    calculateTranslationCentroid: function(){
      var pointList = [];
      for(var i=0;i<this.children.length;i++){
        pointList.push(this.children[i].calculateTranslationCentroid());
      }
      return TrigFunc.centroid(pointList);
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