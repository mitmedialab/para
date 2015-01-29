/*ListNode.js
 * class for collections of user created objects
 */

define([
  'jquery',
  'underscore',
  'models/data/Instance'

], function($,_, Instance) {
 
  var ListNode = Instance.extend({
    name: 'group',
    type: 'geometry',
  
  initialize: function() {
    Instance.prototype.initialize.apply(this, arguments);

  },

  add: function(data){
    if(data instanceof Array){
      for(var i=0;i<data.length;i++){
        this.addChildNode(data[i]);
      }
    }
    else{ 
       this.addChildNode(data);
    }
  },

  remove: function(data){
   if(data instanceof Array){
      for(var i=0;i<data.length;i++){
        this.removeChildNode(data[i]);
      }
    }
    else{ 
       this.removeChildNode(data);
    }
  },

  render: function(data){
    console.log('list data',data);
  }

  });

  return ListNode;


});