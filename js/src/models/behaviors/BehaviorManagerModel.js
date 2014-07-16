/*BehaviorManagerModel.js
 *model that manages assignment of behaviors*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/BehaviorNode',
  'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior'

], function($, _, Backbone, BehaviorNode, CopyBehavior, DistributeBehavior) {
var nameVal = 0;
  var BehaviorManagerModel = Backbone.Model.extend({


    initialize: function(event_bus) {
      this.event_bus = event_bus;
      this.listenTo(this.event_bus, 'openMenu', this.openMenu);
    },

    newBehavior: function(node,type) {
      console.log("type="+type);
     var behaviorNode = new BehaviorNode();
       behaviorNode.name = "Behavior_"+nameVal;
            nameVal++;
      behaviorNode.addChildNode(node);
      this.event_bus.trigger('nodeAdded', behaviorNode);
      if(type ==='copy'){
        console.log("creating copy behavior");
        var copyBehavior = new CopyBehavior();
        copyBehavior.setCopyNum(2);
        behaviorNode.extendBehavior(copyBehavior, 'update');
        behaviorNode.update([{}]);
      }
      else if(type==='linear'){
         console.log("creating linear behavior");
        var copyBehavior = new CopyBehavior();
        copyBehavior.setCopyNum(5);
        behaviorNode.extendBehavior(copyBehavior, 'update');
        behaviorNode.update([{}]);
        var linearBehavior = new DistributeBehavior();
        behaviorNode.extendBehavior(linearBehavior, 'update');
        behaviorNode.update([{}]);
      }
      else if(type=='radial'){
      }
      behaviorNode.update([{}]);
      this.event_bus.trigger('rootRender');

      this.event_bus.trigger('moveDownNode', node.instance_literals[1]);

      console.log('currentNode=behaviorNode' + this.currentNode == behaviorNode);

    }



  });
  return BehaviorManagerModel;

});