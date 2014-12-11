/*BaseNode.js
base class for all low-level behaviors
keeps track of next and previous behaviors*/

define([
		'jquery',
		'underscore',
		'models/data/SceneNode'

	],

	function($, _, SceneNode) {

		var BaseNode = SceneNode.extend({
			name: 'base',
			type: 'procedure',
			end: 'end',
			isObject: false,


			constructor: function() {
				//next behavior
				this.next = null;

				//previous behavior
				this.prev = null;
				SceneNode.apply(this, arguments);

			},

			/*addChildNode
			 *overrides super method
			 * only allows each procedural node to have one child
			 * otherwise attempts to add the node as a child to it's first child
			 * (in effect adding the procedure to the end of the procedural chain) */
			addChildNode: function(node) {
				if (this.children.length === 0) {
					//console.log("no children, adding child");
					this.next = node;
					node.prev = this;
					var child = SceneNode.prototype.addChildNode.apply(this, arguments);
					return child;
				} else {
					//console.log("has child, getting next child");
					this.getChildAt(0).addChildNode(node);
				}
			},

			/*insertChildNode
			 * inserts in child node as first procedure following this
			 * adds former child node (if any) as a child of the inserted node
			 */
			insertChildNode: function(node) {
				if (this.children.length === 0) {
					this.addChildNode(node);
				} else {
					var child = this.removeChildAt(0);
					node.addChildNode(child);
					this.addChildNode(node);
				}
			},

			/*passback
			 * function to pass data back up the procedure chain
			 */
			passback: function(data) {
				if (this.prev) {
					this.prev.passback(data);
					return true;
				}
				return false;
			},

			/*evaluate
			 * calls subsequent procedure in block
			 */
			evaluate: function(data) {
				//console.log("evaluating:", this.name);
				if (this.next) {
					this.next.evaluate(data);
					return true;
				}
				return false;
			},


			/*resetObjects
			 * calls reset objects on children. May not be needed
			 */
			resetObjects: function() {
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].resetObjects();
				}

			},

			/*render
			 * renders children, may not be needed
			 */
			render: function(data) {
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].render(data);
				}

			},

			/*updateOrigin
			* updates origin of parent node, may not be needed
			*/
			updateOrigin: function(){

			}


		});

		return BaseNode;
	});