/*InitializationNode.js
* upon evaluation, create a new instance of the prototype associated with this node
*/

define([
		'jquery',
		'underscore',
		'models/behaviors/actions/BaseNode'
		],

	function($, _, BaseNode) {

		var InitializeNode = BaseNode.extend({
			name: 'initialize',
			type: 'procedure',
		
			/*evaluate
			* calls subsequent procedure in block
			*/
			constructor: function(){
				BaseNode.apply(this,arguments);
			},

			setPrototype: function(prototype){
				this.proto_node = prototype;
			},

			evaluate: function(data){
				if(data.proto_node){
					var instance = data.proto_node.createInstance();
					if (this.next) {
						this.next.evaluate({instance:instance});
					return true;
				}
				return false;
				}
			},
		});

		return InitializeNode;
	});