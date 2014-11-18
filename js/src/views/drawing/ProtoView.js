/* ProtoView.js 
 * view for displaying
 * prototypes created by user
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars'

], function($, _, Backbone, Handlebars) {
	var template, source, prototypes;
	;
	var ProtoView = Backbone.View.extend({
		//
		initialize: function() {
			source = $('#protoTemplate').html();
			template = Handlebars.default.compile(source);
			this.listenTo(this.model, 'prototypeCreated', this.addPrototype);
			prototypes= [];
			
		},

		events: {

		},

		addPrototype: function(protoParams) {
		
			console.log('adding prototype');
			var p = protoParams.get('geom').clone();
			var hScale = 75/p.bounds.height;
			console.log('hScale',hScale);
			console.log('height',p.bounds.height);
			p.scale(hScale);
			console.log('height',p.bounds.height);
		
			p.position.x = 50;
			p.position.y= 37;
			
			p.data.instance = null;

			console.log('p',p);
			var psvg = p.exportSVG({asString:true});
			p.remove();

	
			var data = {
				label: 'foo',
				name: 'bar',
				svgsrc: psvg
			};
			prototypes.push(data);
			var html = template({
				proto: prototypes
			});
			$('#proto-menu').html(html);
		}


	});
	return ProtoView;
});