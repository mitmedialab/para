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

  var BehaviorManagerModel = Backbone.Model.extend({


    initialize: function(event_bus) {
      this.event_bus = event_bus;
      this.listenTo(this.event_bus, 'openMenu', this.openMenu);
    },

    newBehavior: function(node) {

     var behaviorNode = new BehaviorNode();
      behaviorNode.addChildNode(node);
      this.event_bus.trigger('nodeAdded', behaviorNode);
      var copyBehavior = new CopyBehavior();
      copyBehavior.setCopyNum(2);
      behaviorNode.extendBehavior(copyBehavior, 'update');
      behaviorNode.update([{}]);
      this.event_bus.trigger('rootRender');

      this.event_bus.trigger('moveDownNode', node.instance_literals[1]);

      console.log('currentNode=behaviorNode' + this.currentNode == behaviorNode);

    }



  });
  return BehaviorManagerModel;

});