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

		getPrototypeById: function(id) {
			var root = this.get('prototypeRoot');
			var match = null;
			this.visitBfs(root, function(node) {
				if (node.get('type') === 'root') {
					return; // do not process roots
				}
				var pId = node.get('id');
				if (pId === id) {
					match = node;
					return node;
				}
			});
			return match;
		},

		getInheritanceDimensions: function(root) {

			this.visitDfs(root, function(node) {
				if (node.get('type') === 'root') {
					return; // do not process roots
				}

				var position = node.get('screen_position');
				var width = node.get('screen_width');
				var height = node.get('screen_height');

			});

		},

		getSiblingDimensions: function(){

		},

		/*getLinkedDimensions: function(data) {
			var top = data.top;
			var mode = data.mode;
			var dimensions = {};
			var position = this.get('screen_position');
			var width = this.get('screen_width');
			var height = this.get('screen_height');
			if (data.dimensions) {
				var pdimensions = data.dimensions;

				var leftX = position.x < pdimensions.leftX ? position.x : pdimensions.leftX;
				var topY = position.y < pdimensions.topY ? position.y : pdimensions.topY;
				var rightX = position.x + width > pdimensions.rightX ? position.x + width : pdimensions.rightX;
				var bottomY = position.y + height > pdimensions.bottomY ? position.y + height : pdimensions.bottomY;

				data.dimensions = {
					leftX: leftX,
					topY: topY,
					rightX: rightX,
					bottomY: bottomY,
				};
			} else {
				data.dimensions = {
					leftX: position.x,
					topY: position.y,
					rightX: position.x + width,
					bottomY: position.y + height,
				};
			}


			var dimensions = visitor.getLinkedDimensions(this);
			
			//TODO: recycle bounding box rather than re-initializing it.

			var bx = data.dimensions.leftX;
			var by = data.dimensions.topY;
			var bwidth = data.dimensions.rightX - bx;
			var bheight = data.dimensions.bottomY - by;
			var rectangle = new paper.Rectangle(bx, by, bwidth, bheight);
			data.bbox = this.get('bbox');

			data.bbox.position = rectangle.center;

			var scaleX = rectangle.width / data.bbox.bounds.width;
			var scaleY = rectangle.height / data.bbox.bounds.height;
			data.bbox.scale(scaleX, scaleY);

			data.bbox.selectedColor = 'red';
			data.bbox.visible = true;
			data.bbox.selected = true;
			data.bbox.instance = this;
			this.set('bbox', data.bbox);


			return data;
		},*/

		visitBfs: function(node, func) {
			var q = [node];
			while (q.length > 0) {
				node = q.shift();
				if (func) {
					func(node);
				}

				_.each(node.children, function(child) {
					q.push(child);
				});
			}
		},

		visitDfs: function(node, func) {
			if (func) {
				func(node);
			}

			_.each(node.children, function(child) {
				this.visitDfs(child, func);
			});
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

			var edgesRendered = node.edgesRendered();
			if (edgesRendered) {
		
					node.render();
			}

			this.visitChildren(node);
		}

	});

	return Visitor;


});