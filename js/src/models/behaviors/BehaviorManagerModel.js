/*BehaviorManagerModel.js
 *model that manages assignment of behaviors*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/BehaviorNode',
  'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior',
  'models/behaviors/RadialDistributeBehavior'

], function($, _, Backbone, BehaviorNode, CopyBehavior, DistributeBehavior, RadialDistributeBehavior) {
  var nameVal = 0;
  var BehaviorManagerModel = Backbone.Model.extend({


    initialize: function(event_bus) {
      this.event_bus = event_bus;
      this.listenTo(this.event_bus, 'openMenu', this.openMenu);
      this.listenTo(this.event_bus, 'sendTestObj', this.testObj);
      this.conditional_line=null;
      this.test= true;
    },

    newBehavior: function(node, type) {
      console.log('node=' + node);
      var nodeParent = node.nodeParent;
      var behaviorNode;
      if(nodeParent.type=='behavior'){
        behaviorNode = node.nodeParent;
        console.log('parent is a behavior node');
      }
      else{
         behaviorNode  = new BehaviorNode();
      behaviorNode.name = 'Behavior_' + nameVal;
      nameVal++;
      behaviorNode.addChildNode(node);
      this.event_bus.trigger('nodeAdded', behaviorNode);
        console.log('no behavior parent, creating one');
      }
      console.log('behaviors='+behaviorNode.behaviors);
      if (type === 'copy') {
        //console.log('creating copy behavior');
        var copyBehavior = new CopyBehavior();
        copyBehavior.setCopyNum(2);
        behaviorNode.extendBehavior(copyBehavior, ['update']);
        behaviorNode.update([{}]);
      } else if (type === 'linear') {
        //console.log('creating linear behavior');
        var containsCopy=behaviorNode.containsBehaviorType('copy');
        console.log('contains copy='+containsCopy); 
        if (containsCopy===false) {
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(3);
          behaviorNode.extendBehavior(copyBehavior, ['update']);
          behaviorNode.update([{}]);
          console.log('copytype=' +copyBehavior.type);

        }
        var linearBehavior = new DistributeBehavior();
        if(this.test){
          linearBehavior.addCondition(null,'rightOf',this.conditional_line,null);
          this.test=false;
        }
         console.log('lineartype=' +linearBehavior.type);
        behaviorNode.extendBehavior(linearBehavior, ['update']);
        behaviorNode.update([{}]);
      } else if (type == 'radial') {
       // console.log('creating  radial behavior');

        if (!behaviorNode.containsBehaviorType('copy')) {
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(20);
          behaviorNode.extendBehavior(copyBehavior, ['update']);
          behaviorNode.update([{}]);

        }
        var radialBehavior = new RadialDistributeBehavior();
        behaviorNode.extendBehavior(radialBehavior, ['update']);
        behaviorNode.update([{}]);
      }
      behaviorNode.update([{}]);
      this.event_bus.trigger('rootRender');

      this.event_bus.trigger('moveDownNode', node.instance_literals[1]);

      

    },

    testObj: function(tO){
      console.log("test object is set");
      this.conditional_line= tO;
    }





  });
  return BehaviorManagerModel;

});