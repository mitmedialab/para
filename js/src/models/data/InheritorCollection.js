/*InheritorCollection.js
constrainable property that stores an instance's inheritors
*/

define([
		'underscore',
		'utils/PConstraint',
		'utils/PFloat'
	],

	function(_, PConstraint, PFloat) {

		var InheritorCollection = PConstraint.extend({
			
			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'InheritorCollection'
			}),


			constructor: function(instance_parent) {
				PConstraint.apply(this, arguments);
				this.inheritors = [];
				this.set('operator', 'set');
				this.instance_parent = instance_parent;
			},


			deleteSelf: function(){
				this.stopListening();
				this.removeAllInheritors();
			},
			

			addInheritor: function(inheritor) {
				this.inheritors.push(inheritor);

			},

			toJSON: function(){
				var inheritor_list = [];
				for(var i=0;i<this.inheritors.length;i++){
					inheritor_list.push(this.inheritors[i].get('id'));
				}
				return inheritor_list;
			},

			parseJSON: function(data,proto, manager){
				for(var i=0;i<data.length;i++){
					var instance = manager.getById(data[i]);
					this.inheritors.push(instance);
					instance.set('proto_node', proto);
				}
			},

			removeInheritor: function(inheritor) {
			
				var index = _.indexOf(this.inheritors, inheritor);
				if(index>-1){
					
					return this.inheritors.splice(index, 1)[0];
				}
				else{
					return false;
				}

			},

			removeAllInheritors: function(){
				
				this.inheritors = [];
			},

			isConstrained: function() {
				var data = {};
				data.self = this.isSelfConstrained();
				data.inheritors = [];
				for (var i = 0; i < this.inheritors.length; i++) {
					data.inheritors.push(this.inheritors[i].isConstrained().self);
				}
				return data;
			},

			getConstraint: function() {
				var data = {};
				data.self = this.getSelfConstraint();
				data.inheritors = [];
				for (var i = 0; i < this.inheritors.length; i++) {
					data.inheritors.push(this.inheritors[i].getConstraint().self);
				}
				return data;
			},

			getSelfConstraint: function() {
				return this;
			},

			setValue: function(data) {
				var inheritor_data = data.inheritors;
				for (var i = 0; i < inheritor_data.length; i++) {
					var inheritor;
					if (this.inheritors.length <= i) {
						inheritor = this.instance_parent.create();
					} else {
						inheritor = this.inheritors[i];
					}
					inheritor.setValue(inheritor_data[i]);
				}

				//TODO: will need error handling for when inheritors that are constraining other objects are removed
				var difference = this.inheritors.length - inheritor_data.length;
				for (var j = 0; j < difference; j++) {
					var inheritor = this.removeInheritor(this.inheritors[this.inheritors.length - 1]);
					inheritor.deleteSelf();
				}

			},

			getValue: function() {
				if (!this.isSelfConstrained()) {
					var inheritor_values = [];
					for (var i = 0; i < this.inheritors.length; i++) {
						inheritor_values.push(this.inheritors[i].getValue());
					}
					return {
						inheritors: inheritor_values
					};
				} else {
					return this.getSelfConstraint().getValue();
				}
			},

			


		});

		return InheritorCollection;
	});