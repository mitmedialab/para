/*CollectionView
 * mananges the UI for the collection elements
 */


define([
	'jquery',
	'underscore',
	'backbone',
	'utils/analytics'

], function($, _, Backbone, analytics) {


	var CollectionView = Backbone.View.extend({


		initialize: function() {

		},


		events: {
			'click' : 'clickEvent'
		},

		enable: function(type) {
			$('#' + type).removeAttr('disabled');

		},

		disable: function(type){
          $('#' + type).attr('disabled', true);

		},

		clickEvent: function(target){
			console.log('click event on target',target);
		}

	});
	return CollectionView;
});