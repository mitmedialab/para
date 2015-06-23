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
				this.removeAllInheritors();
				PConstraint.prototype.deleteSelf.call(this, arguments);
			},
			

			addInheritor: function(inheritor) {
				this.inheritors.push(inheritor);
				this.listenTo(inheritor, 'modified', this.propertyModified);

			},

			removeInheritor: function(inheritor) {
			
				var index = _.indexOf(this.inheritors, inheritor);
				if(index>-1){
					inheritor.deleteSelf();
					this.inheritors.splice(index, 1);
					return true;
				}
				else{
					return false;
				}

			},

			removeAllInheritors: function(){
				for(var i=0;i<this.inheritors.length;i++){
					this.inheritors[i].deleteSelf();
				}
				this.inheritors = [];
			},

			propertyModified: function(event) {
				console.log('triggering inheritor modified');
				this.trigger('modified', this);
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
				console.log('calling set value for InheritorCollection for', this.instance_parent.get('id'));
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
					this.removeInheritor(this.inheritors[this.inheritors.length - 1]);
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

			//returns actual inheritors themselves rather than constraint values
			accessProperty: function() {
				if (!this.isSelfConstrained()) {
					return this.inheritors;

				} else {
					return this.getSelfConstraint().accessProperty;
				}
			},

			//overrides PConstraint modifyProperty method
			modifyProperty: function(data) {
				console.log('modify property for inheritors', data);
				if (data.inheritors) {
					this.setValue(data);
				}
			}

		});

		return InheritorCollection;
	});