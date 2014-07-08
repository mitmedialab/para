/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode'

], function($,_, SceneNode) {

  var GeometryNode = SceneNode.extend({

    
    visible: true,
    scaleAmt: 1,
    position: 0,
    rotation: 0,
    anchors: [],
    defaults: _.extend({}, SceneNode.prototype.defaults, {
      x: 0,
      y: 0,
      type: 'geom',
      width: 0,
      height: 0,
      strokeColor: 'black',
      fillColor: 'white',
      weight: 1,   
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

    remove: function() {
      this.path.remove();
      this.visible = false;

    },

    setPosition: function(position){
      this.position = position;
      this.data.position = position;
      //console.log(position);
    },

    //rotate
    rotate: function(theta){
      this.rotation = this.rotation+theta;
      this.data.rotate(theta);
    },

    //resets rotation to 0
    resetRotation: function(){
      this.data.rotate(0-this.rotation);
      this.rotation=0;
    },

    //scale 
    scale: function(s){
      this.scaleAmt=s;
      this.data.scale(s);
    },

    //resets scale to 1
    resetScale: function(){
      var rscale = 1/this.scaleAmt;
      this.data.scale(rscale);
      console.log('scale='+rscale);
      this.scaleAmt = 1;
    },

    resetStrokeColor: function(){
      this.data.strokeColor = 'black';
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
    }




   

  });

  return GeometryNode;

});