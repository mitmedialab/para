/*Geometry.js
* base class for geometry object
* extends SceneNode
*/

define(
	[
		"models/SceneNode"

	], 

	function(SceneNode){
	
	//constructor
 		function GeometryNode(node, name) {
 			SceneNode.call(this,node,name);
 			this.type="geom";
 		
    	}
	

		GeometryNode.prototype = Object.create( SceneNode.prototype );
	
	/*================ GeometryNode method defintions ================*/


		return(GeometryNode);

	}
);