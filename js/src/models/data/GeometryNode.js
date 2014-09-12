/*GeometryNode.js
 * base class for geometry object in scene node.
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
  'models/data/Instance',
  'models/PaperManager',
  'models/data/Condition',
  'models/behaviors/CopyBehavior',
  'utils/TrigFunc'



], function($, _, SceneNode, Instance, PaperManager, Condition, CopyBehavior, TrigFunc) {
  var paper = PaperManager.getPaperInstance();

  Function.prototype.clone = function() {
    var that = this;
    var temp = function temporary() {
      return that.apply(this, arguments);
    };
    for (var key in this) {
      if (this.hasOwnProperty(key)) {
        temp[key] = this[key];
      }
    }
    return temp;
  };

  var GeometryNode = SceneNode.extend({

    type: 'geometry',
    /* constructor 
     * instances: array for storing instances of this object
     * scaffolds: array for scaffold objects (helper information and paths)
     * instance_literals: array that stores instances that are created at render
     * upperLeft: default origin of this, used for geometric transforms
     */
    constructor: function() {
      this.scaffold= false;
      this.instances = [];
      this.scaffolds = [];
      this.instance_literals = [];
      this.behaviors = [];
      this.originalMethods = [];
      this.conditions = [];
      this.upperLeft = {
        x: 0,
        y: 0
      };

      this.center = {
        x: 0,
        y: 0
      };
      this.childCenter = -1;


      SceneNode.apply(this, arguments);
    },


    /* initialization
     * creates one instance by default
     */
    initialize: function(data) {
      if (!data) {
        this.createInstance();
      } else {
        var dInstances = data.instances;
        this.scaffold= data.scaffold;
        for (var i = 0; i < dInstances.length; i++) {
          var instance = this.createInstance();
          instance.parseJSON(dInstances[i]);
        }
      }

     /* var copyBehavior = new CopyBehavior();
      this.addBehavior(copyBehavior,['update'],'last');
      this.setCopyNum(1); */
    },

    setOriginByChild: function(index) {
      this.childCenter = index;

    },

    /* addChildNode
     * extends SceneNode addChildNode
     * adds child and resets origin to upperLeft of all child instances
     * moves children relative to this new origin
     */
    addChildNode: function(node) {
      SceneNode.prototype.addChildNode.apply(this, arguments);
      //do not change origin if this is the root node
      if (this.type !== 'root') {
        this.addChildOrigin();
      }
    },

    /* addChildOrigin
     * adds child and resets origin to upperLeft of all child instances
     * moves children relative to this new origin
     */
    addChildOrigin: function() {
      var childUL = this.getChildrenUpperLeft();
      var xDiff = childUL.x - this.upperLeft.x;
      var yDiff = childUL.y - this.upperLeft.y;

      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].increment({
          delta: {
            x: xDiff,
            y: yDiff
          }
        });
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].increment({
          delta: {
            x: -xDiff,
            y: -yDiff
          }
        });
      }
      //reset upper left position
      this.getUpperLeft();
    },


    /* updateOrigin
     * similar to above, but called on an update
     * increments the parent instances by child origin and
     * moves all child instances relative to the parent
     */
    updateOrigin: function() {
      var childUL = this.getChildrenCenter();
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].increment({
          delta: childUL
        });

      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].increment({
          delta: {
            x: -childUL.x,
            y: -childUL.y
          }
        });
      }

    },


    /*increment
     * increments all instances by a delta
     */
    increment: function(delta) {
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].increment(delta);
      }
    },


    bringToFront: function() {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].bringToFront();
      }
    },


    /* getUpperLeft
     * returns the current cumulative upper left origin by
     * iterating over the origins of all the instances
     */
    getUpperLeft: function() {
      var relPos = this.instances[0].getUpperLeft();
      var left = relPos.x;
      var top = relPos.y;

      for (var i = 1; i < this.instances.length; i++) {
        var rp = this.instances[i].getUpperLeft();
        var l = rp.x;
        var t = rp.y;
        left = l < left ? l : left;
        top = t < top ? t : top;

      }
      this.upperLeft = {
        x: left,
        y: top
      };

      return this.upperLeft;
    },

    /* getChildrenUpperLeft
     * gets the cumulative upper left of all children
     * should be 0,0 if children are positioned relatively
     */
    getChildrenUpperLeft: function() {
      if (this.children.length === 0) {
        return {
          x: 0,
          y: 0
        };
      } else {
        var relPos = this.children[0].getUpperLeft();
        var left = relPos.x;
        var top = relPos.y;
        for (var i = 0; i < this.children.length; i++) {
          var rp = this.children[i].getUpperLeft();
          var l = rp.x;
          var t = rp.y;
          left = l < left ? l : left;
          top = t < top ? t : top;

        }

        return {
          x: left,
          y: top
        };
      }

    },

    /* getCenter
     * returns the current cumulative center origin by
     * iterating over the origins of all the instances
     */
    getCenter: function() {


      var relPos = [];
      for (var i = 0; i < this.instances.length; i++) {
        var rp = this.instances[i].getCenter();
        relPos.push(rp);

      }
      this.center = TrigFunc.average(relPos);


      return this.center;
    },

    /* getChildrenCenter
     * gets the cumulative center of all children
     *
     */
    getChildrenCenter: function() {
      if (this.childCenter > -1) {
        return this.children[this.childCenter].getCenter();

      } else {
        if (this.children.length === 0) {
          return {
            x: 0,
            y: 0
          };
        } else {
          var relPos = [];
          for (var i = 0; i < this.children.length; i++) {
            var rp = this.children[i].getCenter();
            relPos.push(rp);
          }

          return TrigFunc.average(relPos);
        }
      }

    },


    /* exportJSON
     * returns this node as a JSON object
     * TODO: create an export JSON method for Behaviors
     */
    exportJSON: function(data) {
      var jdata;
      if (!data) {
        this.set({
          type: this.type,
          name: this.name
        });
        jdata = this.toJSON();
      } else {
        jdata = data;
      }

      var jInstances = [];
      var children = [];
      var lInstances = [];
      var behaviors = [];
      for (var i = 0; i < this.instances.length; i++) {

        jInstances.push(this.instances[i].exportJSON());
      }
      for (var k = 0; k < this.children.length; k++) {

        children.push(this.children[k].exportJSON());
      }
      for (var m = 0; m < this.behaviors.length; m++) {
        var b = this.behaviors[m].behavior.exportJSON();
        //TODO: Fix this hack
        if (this.behaviors[m].behavior.type === 'copy') {
          b.copyNum = this.instances.length;
        }
        var jconditions = [];
        var jconstraints = [];
        for (var f = 0; f < this.conditions.length; f++) {
          //constraints.push(this.constrants[i].exportJSON());
        }
        /*for (var g= 0; g < this.constraints.length; g++) {
          //constraints.push(this.constrants[i].exportJSON());
        }*/


        b.conditions = jconditions;
        b.constraints = jconstraints;

        behaviors.push(b);
      }
      jdata.instances = jInstances;
      jdata.instance_literals = lInstances;
      jdata.children = children;
      jdata.behaviors = behaviors;
      jdata.scaffold=this.scaffold;
      return jdata;
    },



    /*createInstance
     * creates a new instance and pushes it into the instance array
     * optionally creates an instance as a clone of an existing one
     */
    createInstance: function(data, index) {
      var instance;
      if (data) {
        instance = data.clone();
      } else {
        instance = new Instance();
      }
      instance.nodeParent = this;
      if (!index) {
        this.instances.push(instance);
        instance.index = this.instances.length - 1;
      } else {
        this.instances.splice(index, 0, instance);
        for (var i = 0; i < this.instances.length; i++) {
          this.instances[i].index = i;
        }
      }

      this.getUpperLeft();
      return instance;

    },


    createInstanceAt: function(data, index) {
      return this.createInstance(data, index);
    },

    removeInstanceAt: function(index) {
      this.getUpperLeft();
      this.instances.splice(index, 1);
    },

    getInstancesofParent: function(index) {
      var iInstances = [];
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].instanceParentIndex === index) {
          iInstances.push(this.instances[i]);
        }
      }
      return iInstances;
    },


    //updates instances according to data and the passes the updated instances to child function
    update: function(data) {
      this.loop(data);

    },

    loop: function(data) {
      ////console.log("loop geom");

      for (var j = 0; j < this.instances.length; j++) {
        this.calculate(data, j);
      }
      this.clean(data);

    },

    calculate: function(data, index) {
      ////console.log("geom calculate for index:" + index);
      for (var i = 0; i < data.length; i++) {
        var instance = this.instances[index];
        instance.update(data[i]);

      }
    },

    clean: function(data) {
      ////console.log("clean geom");
      for (var k = 0; k < this.children.length; k++) {
        this.children[k].update([{}]);
      }
      if (this.nodeParent !== null && this.nodeParent.type !== 'root') {
        this.nodeParent.updateOrigin();
      }
    },


    updateSelected: function(data) {
      //console.log('update selected');

      for (var j = 0; j < this.instances.length; j++) {
        if (this.instances[j].selected) {
          //console.log("updating selected instance at"+j);
          for (var i = 0; i < data.length; i++) {
            var instance = this.instances[j];
            instance.increment(data[i]);


          }
        }
      }



    },


    reset: function() {
      for (var j = 0; j < this.instances.length; j++) {
        this.instances[j].reset();
      }
    },

    /*sets focus to this instance and unfocuses all siblings*/
    focus: function() {

      var siblings = this.getSiblings();
      for (var i = 0; i < siblings.length; i++) {
        siblings[0].unfocus();
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].focus();
      }
    },

    /* unfocuses this by setting  stroke color to grey */
    unfocus: function() {
      this.instance_literals[0].strokeColor = 'red';
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].unfocus();
      }
    },

    /*shows or hides all instances*/
    setVisible: function(v) {
      for (var j = 0; j < this.instances.length; j++) {
        this.instances[j].visible = v;
      }

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].setVisible(v);
      }
    },


    clearObjects: function() {
      this.instance_literals = [];

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].clearObjects();
      }

    },

    /*renders geometry
     * if data is provided, creates a temporary instance array with updated values according to data
     *  otherwise just renders its children with its permanent instances
     * copies the render signature from the data and concats it with the
     *index of the instance used to render the path
     */
    render: function(data, currentNode) {
      //first create array of new instances that contain propogated updated data

      console.log('render: '+this.type);
      if (data) {
        for (var j = 0; j < this.instances.length; j++) {
          for (var i = 0; i < data.length; i++) {
            var u_instance = this.instances[j].clone();
            this.instances[j].instanceParentIndex = i;
            if (data[i].renderSignature) {
              u_instance.renderSignature = data[i].renderSignature.slice(0);
            }
            u_instance.renderSignature.push(j);
            u_instance.instanceParentIndex = j;

            u_instance.render(data[i]);

            if (this.nodeParent == currentNode) {
              u_instance.selected = this.instances[j].selected;
              u_instance.anchor = this.instances[j].anchor;
            } else {
              u_instance.selected = data[i].selected;
              u_instance.anchor = data[i].anchor;
            }

            this.instance_literals.push(u_instance);


          }
        }

        for (var k = 0; k < this.children.length; k++) {

          this.children[k].render(this.instance_literals, currentNode);
        }
      } else {

        for (var f = 0; f < this.instances.length; f++) {
          this.instances[f].render({});
        }
        for (var f = 0; f < this.children.length; f++) {

          this.children[f].render(this.instances, currentNode);
        }
      }
      if (this.childOrigin > -1) {
        this.children[this.childOrigin].bringToFront();
      }

    },

    setSelection: function(currentNode, instanceParent) {
      if (this == currentNode) {
        return;
      } else {
        this.selectByInstanceParent(instanceParent);
        if (this.nodeParent !== null) {
          this.nodeParent.setSelection(currentNode);
        }
      }
    },


    deleteChildren: function() {
      for (var i = this.children.length - 1; i >= 0; i--) {
        this.children[i].deleteNode();
      }
    },

    deleteNode: function() {

      for (var i = this.children.length - 1; i >= 0; i--) {
        this.children[i].clearObjects();
        this.children[i].deleteNode();
      }
      this.clearObjects();
      this.nodeParent.removeChildNode(this);
    },

    //selects according render signature
    selectByValue: function(index, value, path, currentNode) {
      var sIndexes = [];
      console.log('index',index,'value',value,'currentNode',currentNode==this);

      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].containsPath(path)) {
          var results = this.children[i].selectByValue(index, value, path, currentNode);

          if (this != currentNode) {
            for (var j = 0; j < results.length; j++) {
              if (results[j].length > 0) {
                var last = results[j].length - 1;
                this.instances[results[j][last]].selected = true;


                results[j].pop();
                if (results[j].length > 0) {
                  sIndexes.push(results[j]);
                }
              }
            }
          }

        }
      }
      return sIndexes;
    },

    //selects or deselects all path instances
    selectAll: function() {
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].selected = true;
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].selectAll();
      }


    },

    //selects or deselects all path instances
    deselectAll: function() {
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].selected = false;
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].deselectAll();
      }
    },

    //returns first selected instance
    getFirstSelectedInstance: function() {
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].selected) {
          return this.instances[i];

        }
      }
      return null;

    },

    //checks to see if path literal is contained by any children
    containsPath: function(path) {
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].containsPath(path)) {
          return true;
        }
      }
      return false;
    },

    //checks to see if behavior type has been added to this instance
    containsBehaviorType: function(type) {
      var indexes = [];
      for (var i = 0; i < this.behaviors.length; i++) {
        if (this.behaviors[i].behavior.type === type) {

          indexes.push(i);
        }
      }
      if (indexes.length > 0) {
        return indexes;
      }
      return false;
    },

    //returns first behavior that matches name
    getBehaviorByName: function(name) {
      for (var i = 0; i < this.behaviors.length; i++) {
        if (this.behaviors[i].behavior.name === name) {
          return this.behaviors[i].behavior;
        }
      }
      return null;
    },

    getBehaviorByType: function(type) {
      return _.filter(this.behaviors, function(behavior) {
        return behavior.behavior.type === type;
      });
    },

    //checks by name to see if behavior type has been added to this instance
    containsBehaviorName: function(name) {
      var indexes = [];
      for (var i = 0; i < this.behaviors.length; i++) {
        if (this.behaviors[i].behavior.name === name) {
          indexes.push(i);
        }
      }
      if (indexes.length > 0) {
        return indexes;
      }
      return false;


    },

    /* placeholder functions for leftOf, rightOf geometric checks */
    instanceSide: function(instance) {
      return -1;
    },

    checkIntersection: function() {
      for (var i = 0; i < this.children.length; i++) {
        var intersection = this.children[i].checkIntersection();
        if (intersection !== null) {
          return intersection;

        }
      }
    },

    clearScaffolds: function() {
      for (var j = 0; j < this.scaffolds.length; j++) {
        this.scaffolds[j].remove();

      }
      this.scaffolds = [];

    },

    addScaffold: function(scaffold) {
      this.scaffolds.push(scaffold);

    },

    addBehavior: function(behavior, methods, index) {
      _.defaults(this, behavior);

      if (index) {
        if (index === 'last') {
          this.behaviors.push({
            behavior: behavior,
            methods: methods
          });
        } else {
          this.behaviors.splice(index, 0, {
            behavior: behavior,
            methods: methods
          });

        }
      } else {
        this.behaviors.splice(this.behaviors.length - 2, 0, {
          behavior: behavior,
          methods: methods
        });
      }
      for (var i = 0; i < methods.length; i++) {
        this.override(methods[i]);
      }
    },

    removeBehavior: function(name) {

      var toRemove = _.filter(this.behaviors, function(behavior) {
        return behavior.behavior.name === name;
      });
      //console.log(toRemove);
      this.behaviors = _.filter(this.behaviors, function(behavior) {
        return behavior.behavior.name !== name;
      });

      for (var i = 0; i < toRemove.length; i++) {
        //TODO: fix this hack- will remove user defined rotation
        if (toRemove[i].behavior.type === 'distribution') {
          this.distributionReset();
        }
        var methods = toRemove[i].methods;
        for (var j = 0; j < methods.length; j++) {
          this.override(methods[j]);
        }
      }
    },

    override: function(methodName) {
      if (!this.methodOverriden(methodName)) {
        this.originalMethods.push({
          name: methodName,
          method: this[methodName].clone()
        });
      }
      var applicableBehaviors = this.getBehaviorsWithMethod(methodName);
      this[methodName] = this.getOriginal(methodName);

      for (var i = 0; i < applicableBehaviors.length; i++) {
        var extraBehavior = applicableBehaviors[i].behavior[methodName];
        var composed = this.before(extraBehavior);
        this[methodName] = composed(this[methodName]);
      }
    },

    methodOverriden: function(methodName) {
      for (var i = 0; i < this.originalMethods.length; i++) {
        if (this.originalMethods[i].name === methodName) {
          return true;
        }
      }
      return false;
    },

    getOriginal: function(methodName) {
      for (var i = 0; i < this.originalMethods.length; i++) {
        if (this.originalMethods[i].name === methodName) {
          return this.originalMethods[i].method.clone();
        }
      }
      return null;
    },

    getBehaviorsWithMethod: function(methodName) {
      return _.filter(this.behaviors, function(behavior) {
        var found = $.inArray(methodName, behavior.methods);
        return found !== -1;
      });
    },

    before: function(extraBehavior) {
      return function(original) {
        return function() {
          extraBehavior.apply(this, arguments);
          return original.apply(this, arguments);
        };
      };
    },



    addConstraint: function(constraint) {

    },

    addCondition: function(propA, operator, targetB, propB) {
      var condition = new Condition(propA, operator, targetB, propB);
      this.conditions.push(condition);
    },

    checkConditions: function(instance) {
      for (var i = 0; i < this.conditions.length; i++) {
        if (!this.conditions[i].evaluate(instance)) {
          return false;
        }
      }
      return true;
    },

    checkConstraints: function(constraint, instance) {

    },



  });

  return GeometryNode;

});