/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
    'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior',

], function($,_, SceneNode,CopyBehavior,DistributeBehavior) {

  var GeometryNode = SceneNode.extend({

    
    visible: true,
    scaleVal: 1,
    position: 0,
    rotation: 0,
    anchors: [],
    defaults: _.extend({}, SceneNode.prototype.defaults, {
    }),


    constructor: function() {

      SceneNode.apply(this, arguments);
      //console.log("number of nodes="+SceneNode.numNodeInstances);
    },


    initialize: function() {
    
    },


    setup: function(data){

    },
    //overrides SceneNode update function
    update: function() {
      //console.log('updating Geom method called');
      SceneNode.prototype.update.apply(this, arguments);
    },

    
 //clears all anchors from array
    removeAnchors: function(){
      for(var i =0;i<this.anchors.length;i++){
        this.anchors[i].isAnchor(false);
      }
      this.anchors = [];
    },

    anchorUpdated: function(instance){
      
      if(instance.anchor){
        this.anchors.push(instance);
      }
      else{
        this.anchors.splice($.inArray(instance,this.anchors),1);
      }
      console.log("num of anchors="+this.anchors.length);
     if(this.anchors.length==2){
      if(!_.has(this,'copyNum')){
        console.log('no behavior, assigning copy and distribute');
      var copyBehavior = new CopyBehavior();
      var distributeBehavior = new DistributeBehavior();
      distributeBehavior.initialize();
      copyBehavior.setCopyNum(10);
      this.extendBehavior(distributeBehavior,'update');
      this.extendBehavior(copyBehavior,'update');
      this.update();
      }
     }

    }




   

  });

  return GeometryNode;

});