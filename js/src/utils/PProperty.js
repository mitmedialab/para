/*PProperty.js
 * object that represents a constrainable
 * property for an instance in Para
 *
 */

define([
	'underscore',
	'jquery',
	'backbone',
	'cjs'
], function(_, $, Backbone, cjs) {

	var PProperty = Backbone.Model.extend({
		/*constructor
		 * creates a new cjs based on the value passed in
		 */
		constructor: function(val, operator) {
			this._val = cjs(val);
			if (operator) {
				this.set('operator', operator);
			}
			
		},
		getValue: function() {
			return this._val.get();
		},

		setValue: function(val) {
			this._val.set(val);
		},

		

	});

	return PProperty;
});