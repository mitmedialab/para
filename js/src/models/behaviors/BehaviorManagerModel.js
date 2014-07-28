/*BehaviorManagerModel.js
 *model that manages assignment of behaviors*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/BehaviorNode',
  'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior',
  'models/behaviors/RadialDistributeBehavior',
  'models/behaviors/FollowPathBehavior'

], function($, _, Backbone, BehaviorNode, CopyBehavior, DistributeBehavior, RadialDistributeBehavior, FollowPathBehavior) {
  var nameVal = 0;
  var BehaviorManagerModel = Backbone.Model.extend({


    initialize: function(event_bus) {
      this.event_bus = event_bus;
      this.listenTo(this.event_bus, 'openMenu', this.openMenu);
      this.listenTo(this.event_bus, 'sendTestObj', this.testObj);
      this.listenTo(this.event_bus, 'newBehavior', this.newBehavior);
      this.conditional_line=null;
      this.test= true;
    },

    newBehavior: function(nodes, type) {
      //console.log("total num of nodes="+nodes.length);
      //console.log(nodes);
      var nodeParent = nodes[0].nodeParent;
      var behaviorNode;
      if(nodeParent.type=='behavior'){
        behaviorNode = nodes[0].nodeParent;
        //console.log('parent is a behavior node');
      }
      else{
         behaviorNode  = new BehaviorNode();
      behaviorNode.name = 'Behavior_' + nameVal;
      nameVal++;
      for(var i=0;i<nodes.length;i++){
        behaviorNode.addChildNode(nodes[i]);
      }
        
      }
      this.event_bus.trigger('nodeAdded', behaviorNode);

      //console.log('behaviors='+behaviorNode.behaviors);

      if (type === 'copy') {
        //console.log('creating copy behavior');
        var copyBehavior = new CopyBehavior();
        copyBehavior.setCopyNum(2);
        behaviorNode.extendBehavior(copyBehavior, ['update']);
        behaviorNode.update([{}]);
      } else{
          var containsCopy=behaviorNode.containsBehaviorType('copy');
          if (containsCopy===false) {
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(3);
          behaviorNode.extendBehavior(copyBehavior, ['update']);
          behaviorNode.update([{}]);
          console.log('copytype=' +copyBehavior.type);

        }
       if (type === 'linear') {
     
      
        
        
        var linearBehavior = new DistributeBehavior();
       
          //linearBehavior.addCondition(null,'leftOf',this.conditional_line,null);
         // this.test=false;
        
        // console.log('lineartype=' +linearBehavior.type);
        behaviorNode.extendBehavior(linearBehavior, ['update']);
        behaviorNode.update([{}]);
      } else if (type == 'radial') {
       behaviorNode.copyNum = 10;
       

        var radialBehavior = new RadialDistributeBehavior();
        behaviorNode.extendBehavior(radialBehavior, ['update']);
        behaviorNode.update([{}]);
      }
      else if (type == 'followPath') {
        console.log('follow path behavior called');
        behaviorNode.exclude(0);
        behaviorNode.copyNum = 3;
        var followPathBehavior = new FollowPathBehavior(nodes[0]);
        behaviorNode.extendBehavior(followPathBehavior, ['update']);
      }
    }
    

      behaviorNode.update([{}]);
      this.event_bus.trigger('rootRender');

      this.event_bus.trigger('moveDownNode', nodes[0].instance_literals[1]);

      

    },

    testObj: function(tO){
    // console.log('test object is set');
      this.conditional_line= tO;
    }





  });
  return BehaviorManagerModel;

});