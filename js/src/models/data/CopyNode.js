/*CopyNode.js
* upon evaluation, create a deep copy of the prototype node and 
* add copy as a sibling to the prototype on the tree
*/

define([
		'jquery',
		'underscore',
		'backbone'

	],

	function($, _, BaseNode) {

		var CopyNode = BaseNode({
			name: 'copy',
			type: 'instantiation',
		
			/*evaluate
			* calls subsequent procedure in block
			*/
			constructor: function(){
				this.protoNode = null;
				BaseNode.apply(this,arguments);
			},

			setPrototype: function(prototype){
				this.protoNode = prototype;
			},

			evaluate: function(){
				if(this.protoNode){
					var copy = this.protoNode.clone();
					this.protoNode.nodeParent.addChild(copy);
					this.protoNode = null;
					BaseNode.prototype.evaluate.apply(this,arguments);
				}
			},
		});

		return CopyNode;
	});