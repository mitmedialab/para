/* LayersView.js
 * controls updates to the property menu
 */

define([
	'jquery',
	'underscore',
	'paper',
	'backbone',
	'handlebars',
	"text!html/params_ui.html"

], function($, _, paper, Backbone, Handlebars, ui) {

	var ParametersView = Backbone.View.extend({
	
		events: {
			'mousedown.filled': 'argumentClicked',
		},

		initialize: function(obj) {
			this.activeParam = null;
			this.$el.prepend(ui);
			this.setElement(this.$('#layer-palette'));
			var id = this.model.get('id');
			this.$el.attr('id', 'layer_' + id); //;
			this.$el.css({
				visibility: 'visible'
			});
			this.setPosition();
			this.tsource = this.$('#layerTemplate').html();
			this.template = Handlebars.default.compile(this.tsource);
			this.listenTo(this.model, "change:showLayers", this.showLayers);
			this.listenTo(this.model, "change:translation_delta", this.setPosition);
			this.listenTo(this.model, 'change:f_parameters', this.updateParameters);
		},

		createFunctionPalette: function(instance) {

		},

		createStandardPalette: function(instance) {


		},


		setLayerActive: function(instanceId, layerId) {

		},

		updateParameters: function() {
			var parameters = this.model.get('f_parameters');
			var contexts = [];

			for (var i = 0; i < parameters.length; i++) {
				var filled = parameters[i].get('f_argument') ? 'active' : 'inactive';
				var visible = 'active';	//parameters[i].get('visible') ? 'active' : 'inactive';
				var id = parameters[i].get('id');
				var context = {
					name: parameters[i].get('param_name'),
					visible_active: visible,
					filled_active: filled,
					param_id: id
				};
				contexts.push(context);
			}
			var data = {
				layer: contexts
			};
			var html = this.template(data);
			$('#layers').html(html);
		},

		argumentClicked: function(event) {
			
			var paramId = $(event.target).parent().attr('id');
			
			if(this.model.requestArgument(paramId)){
				$(event.target).attr('id','active');
			}
		},

		setPosition: function() {

			var position = this.model.getValueFor('translation_delta');
			var x = (position.x + 50).toString() + 'px';
			var y = position.y.toString() + 'px';
			this.$el.css({
				left: x,
				top: y
			});
		},

		showLayers: function() {
			if(this.model.get('name')!=='root'){
			var visibility = this.model.get('showLayers');

			this.$el.css({
				visibility: visibility
			});
			}
			else{
				this.$el.css({
				visibility: 'hidden'
			});
			}
		}


	});
	return ParametersView;
});