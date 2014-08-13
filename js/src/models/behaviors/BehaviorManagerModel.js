/*BehaviorManagerModel.js
 *model that manages assignment of behaviors*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/BehaviorNode',
      'utils/TrigFunc',

  'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior',
  'models/behaviors/RadialDistributeBehavior',
  'models/behaviors/FollowPathBehavior'

], function($, _, Backbone, BehaviorNode, TrigFunc, CopyBehavior, DistributeBehavior, RadialDistributeBehavior, FollowPathBehavior) {
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

    newCondition: function(nodes,conditional_node){
      console.log("adding behavioral condition");
      conditional_node.instances[0].strokeColor = '#FF0000';
      conditional_node.instances[0].strokeWidth = 4;

      for(var i=0;i<nodes.length;i++){
              console.log(nodes[0]);

        nodes[0].addCondition(null,'color',conditional_node,null);
        nodes[0].update([{}]);

      }


      

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
        behaviorNode.extendBehaviorFirst(copyBehavior, ['update']);
        behaviorNode.update([{}]);
      } else{
          var containsCopy=behaviorNode.containsBehaviorType('copy');
          if (containsCopy===false) {
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(3);
          behaviorNode.extendBehaviorFirst(copyBehavior, ['update']);
          behaviorNode.update([{}]);
          console.log('copytype=' +copyBehavior.type);

        }
       if (type === 'linear') {
        var linearBehavior = new DistributeBehavior();
        nodes[0].addBehavior(linearBehavior);
         for(var j=0;j<nodes.length;j++){
          nodes[j].override('update',linearBehavior.update);
          nodes[j].override('calculate',linearBehavior.calculate);
          nodes[j].override('clean',linearBehavior.clean);
          nodes[j].update([{}]);
       }
      } else if (type == 'radial') {
       behaviorNode.copyNum = 10;
       

        var radialBehavior = new RadialDistributeBehavior();
       nodes[0].addBehavior(radialBehavior);
         for(var j=0;j<nodes.length;j++){
          nodes[j].override('update',radialBehavior.update);
          nodes[j].override('calculate',radialBehavior.calculate);
          nodes[j].override('clean',radialBehavior.clean);
          nodes[j].update([{}]);
       }
       
      }
      else if (type == 'followPath') {
        console.log('follow path behavior called');
        behaviorNode.exclude(0);
        behaviorNode.instances[0].position={x:nodes[0].instances[0].position.x,y:nodes[0].instances[0].position.y};
        nodes[0].instances[0].position={x:0,y:0};
        behaviorNode.copyNum = 4;
        var followPathBehavior=new FollowPathBehavior(nodes[0]);
        
       // nodes[1].extendBehaviorFirst(followPathBehavior, ['update']);
          // nodes[1].extendBehaviorFirst(followPathBehavior, ['calculate']);
        nodes[1].addBehavior(followPathBehavior);

        nodes[1].override('update',followPathBehavior.update);
        nodes[1].override('calculate',followPathBehavior.calculate);
        nodes[1].override('clean',followPathBehavior.clean);
      }
    }
    

      behaviorNode.update([{}]);
      this.event_bus.trigger('rootRender');

      this.event_bus.trigger('moveDownNode', nodes[0].instance_literals[1]);

      

    },

    testObj: function(tO){
    // console.log('test object is set');
      //this.conditional_line= tO;
    }





  });
  return BehaviorManagerModel;

});