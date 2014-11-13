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
		* geom functions. Called before visiting the root node
		*/
		resetGeomFunctions: function(){
			var geomF = this.get('geomFunctions');
			for(var i=0;i<geomF.length;i++){
				geomF[i].reset();
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

			switch (node.name) {
				case 'geometry':
					this.visitGeometry(node, departureNode);
					break;
				case 'path':
					this.visitPath(node, departureNode);
					break;
				case 'block':
					this.visitBlock(node, departureNode);
					break;
				case 'instance':
					this.visitInstance(node, departureNode);
					break;
				default:
					//catch unsupported type
					throw 'unsupported type in parse tree';
			}

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
			//console.log("visit instance",node.type, node.name);
			if (departureNode) {
			//console.log("departure node exists");

				var edge = node.getEdge(departureNode);
				if (edge) {
					var data = {};
					if (edge.contains('translation')) {
						data.translation = departureNode.getTranslation();
					}
					if (edge.contains('rotation')) {
						data.translation = departureNode.getRotation();
					}
					if (edge.contains('scaling')) {
						data.translation = departureNode.getScaling();
					}
					if (edge.contains('fillColor')) {
						data.fillColor = departureNode.getFillColor();
					}
					if (edge.contains('strokeColor')) {
						data.strokeColor = departureNode.getStrokeColor();
					}
					if (edge.contains('strokeWidth')) {
						data.strokeWidth = departureNode.getStrokeWidth();
					}

					node.update(data);
				}

			}
			var edgesRendered = node.edgesRendered();
			//console.log("edges Rendered=",edgesRendered);
			if (edgesRendered) {
				node.render();
				node.set('rendered', true);
			}

			this.visitChildren(node);
		}

	});

	return Visitor;


});