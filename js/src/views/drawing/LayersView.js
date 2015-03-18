/* LayersView.js
 * controls updates to the property menu
 */

define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	"text!html/layers_ui.html"

], function($, _, Backbone, Handlebars, ui) {

	var LayersView = Backbone.View.extend({
		initialize: function(obj) {

			this.$el.prepend(ui);
			this.setElement(this.$('#layer-palette'));
			var id = this.model.get('id');
			this.$el.attr('id','layer_'+id);//;
			this.$el.css({
        		visibility: 'hidden'
      		});
      		this.setPosition();
			console.log('view el',this.el);
			this.tsource = this.$('#layerTemplate').html();
			this.template =  Handlebars.default.compile(this.tsource);
			this.listenTo(this.model, "change:showLayers", this.showLayers);
			this.listenTo(this.model, "change:translation_delta", this.setPosition);
			this.listenTo(this.model, 'change:f_parameters', this.updateParameters);


		},

		createFunctionPalette:function(instance){
			
		},

		createStandardPalette:function(instance){


		},


		setLayerActive: function(instanceId, layerId){

		},

		updateParameters: function(){
			console.log('adding parameter');
			var parameters = this.model.get('f_parameters');
			var f_arguments = this.model.get('f_arguments');
			var contexts = [];

 			for(var i=0;i<parameters.length;i++){
 				var filled = f_arguments.length>i?'active':'inactive';
 				var visible = parameters[i].get('visible')?'active':'inactive';
 				var context = {
 					name:parameters[i].get('param_name'),
 					visible_active: visible,
 					filled_active: filled
 				};
 				contexts.push(context);
 			}
      		var data = {layer:contexts};
      		var html = this.template(data);
      		console.log('html',html,data);
      		$('#layers').html(html);
		},

		setPosition: function(){
			
			var position = this.model.accessProperty('translation_delta');
			var x = (position.x+50).toString()+'px';
			var y = position.y.toString()+'px';
				this.$el.css({
        		left:x,
        		top:y
      		});
		},

		showLayers: function(){
			console.log('show layers');
			var visibility = this.model.get('showLayers');
		
			this.$el.css({
        		visibility: visibility
      		});
		}


	});
	return LayersView;
});