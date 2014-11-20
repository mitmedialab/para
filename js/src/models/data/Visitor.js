/*Visitor.js
 * external tree visitor base implementation
 * used to traverse parse tree and build scenegraph of
 * instances for display to user
 */

define([
	'underscore',
	'backbone',
	'models/data/Instance'


], function(_, Backbone, Instance) {
	//datastructure to store path functions
	//TODO: make linked list eventually


	var Visitor = Backbone.Model.extend({
		defaults: {
			geomFunctions: [],
		},
		/* addGeomFunction
		*adds a new geomFunction
		*/
		addGeomFunction: function(geom) {
			var geomF = this.get('geomFunctions');
			geomF.push(geom);
			this.set({
				geomFunctions: geomF
			});
		},
		/*resetGeomFunctions
		* resets the instances stored by the 
		* geom functions and recursively resets their children. 
		* Called before visiting the root node
		*/
		resetGeomFunctions: function(children){
			var geomF;
			if(!children){
				geomF = this.get('geomFunctions');
			}
			else{
				geomF = children;
			}
			for(var i=0;i<geomF.length;i++){
				geomF[i].reset();
				this.resetGeomFunctions(geomF[i].children);
			}
		},


		/*visit
		 *
		 */
		visit: function(node, departureNode) {
			node.set({
				visited: true
			});
			//check to see if node is root (has no departure)

			
				
			this.visitInstance(node, departureNode);
			
		},

		visitChildren: function(node) {
			//console.log("visiting node children for ", node.type);
			var children = node.children;
			for (var i = 0; i < children.length; i++) {
				children[i].visit(this, node);
			}
		},

		visitGeometry: function(node) {
			this.visitChildren();
		},

		visitPath: function(node) {

		},

		visitBlock: function(node) {
			var geometry = node.children[0].visit(this, node);
		},

		/* visitInstance
		 * called for visit to instance node
		 * determines if node
		 */
		visitInstance: function(node, departureNode) {
			console.log("visit instance",node.type, node.name);
		
			var edgesRendered = node.edgesRendered();
			if (edgesRendered) {
				node.render();
			}

			this.visitChildren(node);
		}

	});

	return Visitor;


});