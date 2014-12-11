/*BlockNode.js
abstraction for managing block statement of procedure nodes
*/

define([
		'models/behaviors/actions/BaseNode',
	],

	function(BaseNode) {

		var BlockNode = BaseNode.extend({
			 name: 'block',
     		type: 'procedure',

			constructor: function() {
				//array for keeping track of procedure nodes
				this.statements = [];
				this.last = null;
				this.returnStatement = null;
				BaseNode.apply(this, arguments);

			},

			addStatement: function(node){
				if(this.last){
					this.last.next = node;
					node.prev = this.last;
				}
				else{
					this.first = node;
					this.next = node;
					node.prev = this;
				}
				this.statements.push(node);
				this.last = node;

			},

			addReturn: function(node) {
    			this.returnStatement = node;
    		},

			removeLastStatement: function(){
				this.statements.pop();
				if(this.statements.length>0){
					this.last = this.statements[this.statements.length-1];
				}
			},

			removeFirstStatement: function(){
				this.statements.shift();
				if(this.statements.length>0){
					this.first = this.statements[0];
				}
			},

			evaluate: function(data){
				if(this.first){
					this.first.evaluate(data);
					return false;
				}
				return false;
			},

			/* update
			 * finds geometry descendants and then
			 * evaluates procedure for each descendant
			 * then calls update for each child
			 */
			update: function(data) {
				//console.log("updating:", this.name);
				var geomDes = this.findGeometryDescendants();
				for (var i = 0; i < geomDes.length; i++) {
					this.evaluate({protoNode:geomDes[i]});
				}

				for (var k = 0; k < this.children.length; k++) {
					this.children[k].update(data);
				}
			},


			/* findGeometryDescendants
			 * walks the tree and finds the closest geometry decendant to
			 * then returns that child and all its siblings
			 */
			findGeometryDescendants: function() {
				if (this.children.length > 0) {
					//console.log("for type", this.name,this.children);
					var currentChild = this.children[0];
					//console.log("currentChild.type=",currentChild.type);
					while (currentChild.type!=='geometry') {
						currentChild = currentChild.children[0];
					}

					var geomChildren = currentChild.nodeParent.children;
					return geomChildren;
				}
				return null;
			}
			
		});

		return BlockNode;
	});