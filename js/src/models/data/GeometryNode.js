/*GeometryNode.js
* base class for geometry object
* extends SceneNode
*/

define([ 
  'underscore',
  'models/data/SceneNode',

], function( _, SceneNode) {
  
  var GeometryNode = SceneNode.extend({
  	 defaults:_.extend({}, (new SceneNode).attributes,  {
           x: 0,
           y: 0,
           type: 'geom',
           width: 0,
           height:0,
           strokeColor:'black',
           fillColor: 'white'
          }),
  	initialize: function(){
  		//call the super constructor
  		SceneNode.prototype.initialize.call(this);

  	},

  	draw: function(){

  	}



  });

  return GeometryNode;

});