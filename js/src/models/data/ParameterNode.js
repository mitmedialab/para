/*ParameterNode.js
instance that acts as a parameter for a function and can be used to transfer its effects to other instances*/

define([
	'underscore',
	'backbone'


], function(_, paper, Backbone) {
	var ParameterNode = Backbone.Model.extend({

		defaults: {
			type: 'parameter',
			userParams: null,
			param_name: '',
		},

		setName: function(name) {
			this.set('param_name', name);
		},

		renderStyle: function(){
			console.log('rendering style of param')
		}
	});

	return ParameterNode;
});