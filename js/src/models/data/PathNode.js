/*PathNode.js
* base class for path object
* extends GeometryNode
*/

define(
	[
		"models/GeometryNode"

	], 

	function(GeometryNode){
	
	//constructor
 		function PathNode(node, name) {
 			GeometryNode.call(this,node,name);
 			this.type="path";
 			this
 		
    	}
	

		PathNode.prototype = Object.create(GeometryNode.prototype );
	
	/*================ SceneNode method defintions ================*/

		

		return(PathNode);

	}
);