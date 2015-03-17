/*ParameterNode.js
instance that acts as a parameter for a function and can be used to transfer its effects to other instances*/

define([
	'underscore',
	'paper',
	'models/data/Instance',


], function(_, paper, Instance) {
	var ParameterNode = Instance.extend({

		defaults: _.extend({}, Instance.prototype.defaults, {
			name: 'parameter',
			userParams: null
		}),

		initialize: function(data) {},
	});



	

	return ParameterNode;
});