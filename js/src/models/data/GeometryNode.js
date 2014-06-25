/*GeometryNode.js
* base class for geometry object
* extends SceneNode
*/

define([ 
  'underscore',
  'models/data/SceneNode'

], function( _, SceneNode) {
  
  var GeometryNode = SceneNode.extend({
  	 defaults:_.extend({},SceneNode.prototype.defaults,  {
           x: 0,
           y: 0,
           type: 'geom',
           width: 0,
           height:0,
           strokeColor:'black',
           fillColor: 'white',
           weight:1,
          }),
  	 
  	  constructor: function(){
    
       SceneNode.apply(this, arguments);
    //console.log("number of nodes="+SceneNode.numNodeInstances);
    },


    initialize: function(){
  		//call the super constructor
      
  		//SceneNode.prototype.initialize.call(this);
      this.visible= true;
      console.log("geom visible"+this.visible);

  	},

  	draw: function(){

  	},

    



  });

  return GeometryNode;

});