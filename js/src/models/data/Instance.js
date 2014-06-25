/*Instance.js
* used to store references of a shape object
*
*/

define([
'underscore',
'models/data/SceneNode'
], function(_, SceneNode){
	
	var Instance = SceneNode.extend({
		data:null,
		next:null,
		rotation:0,
		position:0,

		initialize: function(_data){
			this.data = _data;
			this.data.nodeParent= this;
			this.next = null;


			this.data.on('mouseup',function(){
        		this.nodeParent.updateInstances(this);
        	});
		},

		resetRotation: function(){
			this.data.rotate(0-this.rotation);
			this.rotation=0;
		},

		updateInstances: function(path){
			console.log('calling update instances from instance');
			this.trigger('change:updateInstances',path);
		},

		//provides the data to make this path correspond to its class definition
		update: function(_data){
			this.position = this.data.position;
			console.log("rotation before ="+this.rotation);
			this.data.detach('mouseup');
			this.data.remove();
			this.data = null;
			this.data = _data;
			console.log("rotation of new ="+this.data.rotation);
			this.data.nodeParent= this;
			this.data.on('mouseup',function(){
        		this.nodeParent.updateInstances(this);
        	});
			this.data.rotate(this.rotation);
			console.log("rotation of final="+this.data.rotation);
			this.data.position = this.position;

		},

		clear: function(){
			this.data.detach('mouseup');
			this.data.remove();
			this.data.nodeParent = null;
			this.next = null;
			this.position= null;
			this.rotation= null;
		}



	});

	return Instance;



});