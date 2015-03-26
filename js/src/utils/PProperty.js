/*PProperty.js
 * constrainable value in para
 * essentially a wrapper class for cjs functionality
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
			//this.storage =  val;
			if (operator) {
				this.set('operator', operator);
			}
			
		},
		getValue: function() {
			/*if(this.storage instanceof Function){
				console.log("function storage=",this.storage);
			}*/
			return this._val.get();
		},

		setValue: function(val) {
			this._val.set(val);
		},		

		//no toJSON required

	});

	return PProperty;
});