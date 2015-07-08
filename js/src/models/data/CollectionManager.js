/*Collection Manager
 * manager that keeps track of all lists and duplicators
 */


define([
	'underscore',
	'backbone',
	'models/data/ConstrainableList',
	'views/CollectionView',


], function(_, Backbone, ConstrainableList, CollectionView) {


	//stores para lists
	var lists;
	var collectionView;

	var CollectionManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			var collectionView = new CollectionView({
				el: '#collectionToolbar',
				model: this
			});
		}
	});
	return CollectionManager;
});