/* LayersView.js
 * controls updates to the property menu
 */

define([
	'jquery',
	'underscore',
	'paper',
	'backbone',
	'handlebars',
	"text!html/layers_ui.html"

], function($, _, paper, Backbone, Handlebars, ui) {

	var LayersView = Backbone.View.extend({

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
			
			//this.tool = new paper.Tool();
			//this.tool.parent = this;
			//this.tool.name = 'layer_tool';
			//this.tool.attach('mouseup', this.mouseUp);
			//$('body').bind('mouseup', this.mouseUp);

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
			//console.log('argument clicked',this.activeParam);
			//this.tool.activate();
		},

		/*mouseUp: function(event) {
			console.log('mouse up',this.parent.activeParam);

			if (this.parent.activeParam!==null) {
				console.log('layer mouse up');
				var mainTool = paper.tools.filter(function(item) {
					return item.name === 'canvas_tool';
				})[0];
				mainTool.activate();
				this.parent.activeParam = null;
			}
		},*/

		setPosition: function() {

			var position = this.model.accessProperty('translation_delta');
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
	return LayersView;
});