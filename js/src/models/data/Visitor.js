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
			prototypeRoot: null
		},

		initialize: function() {
			var prototypeRoot = new Instance();
			prototypeRoot.set('type', 'root');
			this.set('prototypeRoot', prototypeRoot);
		},

		/* addPrototype
		 *adds a new prototype according to its parent
		 */
		addPrototype: function(prototype) {
			var protoParent = prototype.get('proto_node');
			if (protoParent) {
				protoParent.addChildNode(prototype);
			} else {
				var root = this.get('prototypeRoot');
				root.addChildNode(prototype);
			}
		},

		/*resetPrototypes
		 * resets the prototypes recursively.
		 * Called before visiting the root node
		 */
		resetPrototypes: function(children) {
			var prototypes;
			if (!children) {
				prototypes = this.get('prototypeRoot').children;
			} else {
				prototypes = children;
			}
			for (var i = 0; i < prototypes.length; i++) {
				prototypes[i].reset();
				this.resetPrototypes(prototypes[i].children);
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
			console.log("visit instance", node.type, node.name);

			var edgesRendered = node.edgesRendered();
			if (edgesRendered) {
				node.render();
			}

			this.visitChildren(node);
		}

	});

	return Visitor;


});