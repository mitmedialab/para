/*GeometryNode.js
 * base class for geometry object in scene node.
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
  'models/data/Condition',
  'models/behaviors/CopyBehavior',
  'utils/TrigFunc',
  'paper'



], function($, _, SceneNode, Condition, CopyBehavior, TrigFunc, paper) {

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
    name: 'geometry',
    type: 'geometry',

     defaults: _.extend({}, SceneNode.prototype.defaults, {
      instances:null,
    }),

  
    /* initialization
     *
     */
    initialize: function(data) {
      this.set('instances',[]);
      SceneNode.prototype.initialize.apply(this, arguments);

    },

    clone: function(){
      return SceneNode.prototype.clone.apply(this,arguments);
    },

    /* run
    * TODO: will eventually return a compilation of instances
    * from all child nodes
    */
    run: function(){

    },

    /* reset
    * TODO: will eventually reset all child nodes?
    */
    reset: function(){

    },

    undoRedo: function(data){
      if(this.type!='root'){
       
        this.scaffold = data.scaffold;
      
        this.upperLeft = $.extend(true, {}, data.upperLeft);
        this.center = $.extend(true, {}, data.center);
        this.childCenter = data.childCenter;
      }

      if(this.children.length>data.children.length){
        var diff = this.children.length-data.children.length;

        for(var k=0;k<diff;k++){
          this.children[this.children.length-1].deleteNode();

        }
      }
      else if(this.children.length<data.children.length){
        var diff = data.children.length-this.children.length;

        var missingChildren = data.children.slice(diff-1,data.children.length);
        console.log('missingChildren',missingChildren); 
        this.trigger('parseJSON',this, missingChildren);
        

      }

    
      if (data.children.length > 0) {
        for(var j=0;j<data.children.length;j++){
          this.children[j].undoRedo(data.children[j]);
        }
      }




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
     */
    updateOrigin: function() {
      this.childUL = this.getChildrenCenter();
    
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].increment({
          delta: {
            x: -this.childUL.x,
            y: -this.childUL.y
          }
        });
      }

    },

    bringToFront: function() {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].bringToFront();
      }
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

      
      var children = [];
      var behaviors = [];
     
     
      for (var k = 0; k < this.children.length; k++) {

        children.push(this.children[k].exportJSON());
      }

      jdata.children = children;
      jdata.behaviors = behaviors;
      jdata.scaffold = this.scaffold;
      jdata.upperLeft = $.extend(true, {}, this.upperLeft);
      jdata.center = $.extend(true, {}, this.center);
      jdata.childCenter = this.childCenter;
      return jdata;
    },



    update: function(data) {
       for (var k = 0; k < this.children.length; k++) {
        this.children[k].update([{}]);
      }
       if (this.nodeParent !== null && this.nodeParent.type !== 'root') {
        this.nodeParent.updateOrigin();
      }
    },


    updateSelected: function(data) {

    },


 
   
    /*shows or hides all instances*/
    setVisible: function(v) {
    
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].setVisible(v);
      }
    },


    resetObjects: function() {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].resetObjects();
      }

    },

    clearObjects: function() {

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].clearObjects();
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

   

    //selects or deselects all paths
    selectAll: function() {
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].selectAll();
      }


    },

    //selects or deselects all paths
    deselectAll: function() {
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].deselectAll();
      }
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



    checkIntersection: function() {
      for (var i = 0; i < this.children.length; i++) {
        var intersection = this.children[i].checkIntersection();
        if (intersection !== null) {
          return intersection;

        }
      }
    },


 

 



  });

  return GeometryNode;

});