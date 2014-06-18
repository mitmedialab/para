/*Geometry.js
* base class for geometry object
* extends SceneNode
*/

define(
	[
		"models/SceneNode",

	], 

	function(SceneNode){
	"use strict";
	var Backbone = require("backbone");
	var Underscore = require("underscore");
	//constructor
 		function GeometryNode(node, name) {
 			SceneNode.call(this,node,name);
 			this.type="geom";
 		
    	}
		//Underscore.extend(GeometryNode, Backbone.Events);

		GeometryNode.prototype = Object.create( SceneNode.prototype );
	
	/*================ GeometryNode method defintions ================*/


		return(GeometryNode);

	}
);