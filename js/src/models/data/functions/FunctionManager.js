/* FunctionManager.js
 * class for managing function creation, storage and lookup
 */

define([
	'underscore',
	'backbone',
	'models/data/functions/FunctionNode',
	'models/data/functions/ParameterNode',
	'utils/Utils'
], function(_, Backbone, FunctionNode, ParameterNode, Utils) {
	//datastructure to store path functions

	var functioncount = 0;

	var FunctionManager = Backbone.Model.extend({
		defaults: {},


		initialize: function() {
			this.functions = [];
			
		},

		createFunction: function(name, childList) {
			var f = new FunctionNode();
			f.set('f_name', 'function:' + functioncount);
			functioncount++;
			var centers = {x:0,y:0};
			for (var i = 0; i < childList.length; i++) {
				//this.convert(paramList[i]);
				//f.addParameter(paramList[i]);
				f.addChildNode(childList[i]);
				childList[i].hide();
				var center = childList[i].accessProperty('center');
				centers.x+=center.x;
				centers.y+=center.y;
			}
			centers.x/=childList.length;
			centers.y/=childList.length;
			var data = {translation_delta:centers};
			f.modifyProperty(data);
			this.functions.push(f);
		},

		toggleOpenFunctions: function(currentNode, func) {
			currentNode.close();
			var children = func.open();
			return {toSelect:children, currentNode:func, lists:func.lists};
		},

		toggleClosedFunctions: function(currentNode, rootNode) {
				var nCurrent;
				var parent = currentNode.close();
				var toSelect = currentNode;
				if (parent) {
					console.log('setting current to parent');
					nCurrent = parent;
				}
				else{
					nCurrent = rootNode;
				}
				nCurrent.open();
				return {currentNode:nCurrent, toSelect:toSelect};
			
		},

		closeAllFunctions: function() {
			for (var i = 0; i < this.functions.length; i++) {
				this.functions[i].close();
			}
		},

		convert: function(instance) {
			for (var k in ParameterNode) {
				if (ParameterNode.hasOwnProperty(k)) {
					instance[k] = ParameterNode[k];
				}
			}
			instance.hide();
		}

	});
	return FunctionManager;
});