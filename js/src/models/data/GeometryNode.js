/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
    'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior',
  'models/data/Instance'

], function($,_, SceneNode,CopyBehavior,DistributeBehavior, Instance) {
  //paperjs group object
 
  var GeometryNode = SceneNode.extend({

  
    visible: true,
    scaleVal: 1,
    position: 0,
    rotation: 0,
    anchors: [],
    instances: [],
    group_literal: null,
    defaults: _.extend({}, SceneNode.prototype.defaults, {
    }),


    constructor: function() {

      SceneNode.apply(this, arguments);
    },

    //creates 1 instance upon initialization
    initialize: function() {
      var instance =  this.createInstance();
      this.instances.push(instance);

    },

    //adds listeners to child node and calls super
     addChildNode: function(node) {
       this.listenTo(node,'change:mouseUpInstance',this.mouseUpInstance);
       SceneNode.prototype.addChildNode(this, arguments);

      },

      //removes listeners from child node and calls super
      removeChildNode: function(node) {
          this.stopListening(node);
          SceneNode.prototype.removeChildNode(this, arguments);
      },

    //overrides SceneNode update function
    /* should either recive a delta object containing changes made to the properties
    * of this object- ie a mouse move on the position, OR
    *should recieve an array of instances from its parent, which has been updated and is now updating the child
    *... i think.
    */
    update: function(data) {
       if(data){
           
           
            if(data.delta){
              this.updateProperties(data.delta);
            }
            else if(data.instances){
              for(var k=0;k>this.instances.length;k++){
            this.instances[k].clear();
              }
            }

            /*
         

          for(var i=0;i<d_instances.length;i++){
            for(var j=0;j>this.instances.length;j++){
              this.instances[j].update(data[i]);
            }

            this.instances.update();
          }
        }*/

       if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
                  this.children[z].update({delta:null,instances:this.instances});
                  }
              }
          }
        }
    },

    /*updates all properties according to delta 
    * TODO: incorporate all properties in dynamic format
    * right now for simplicity, only handles position
    */
    updateProperties: function(delta){
      this.position.add(delta);

    },


    //creates and stores an instance which is identical to this path 
    createInstance: function(anchor,copy,parentInstance) {
      
      var instance = new Instance(this);
      //if indicated, copy parameters over from the copy argument
        if(copy){
          instance.copyParameter(copy);
        }
        
      
        //add event listeners for change events
      this.listenTo(instance, 'change:mouseUpInstance', function(){console.log("")});
      this.listenTo(instance, 'change:anchorInit', this.anchorUpdated);



      //set instance as anchor if indicated
      if(anchor){
        instance.isAnchor(true);
      }
      for(var i=0;i<this.children.length;i++){
        this.children[i].createInstance(false,null,instance);
      }
     

      return instance;

    },



    //creates a specified number of instances, with option to clear existing instances
    createInstances: function(num, clear) {
      if (clear) {
        this.deleteInstances();
      }
      for (var i = 0; i < num; i++) {
        // console.log('creating instance number:'+ i);
       var instance = this.createInstance();
       this.instances.splice(this.instances.length-2,0,instance);
      }
      return this.instances;

    },

    //deletes specified number of instances avoiding start and end if possible
    deleteInstances: function(num, clear) {
      var toRemove = this.instances.length - num;
      if (toRemove >= 1) {
        for (var i = this.instances.length - 1; i >= toRemove; i--) {
          var clearedInstance = this.instances.splice(i,1);
          clearedInstance.clear();
          this.stopListening(clearedInstance);
          clearedInstance = null;
          
        }
      }
      if (clear) {
        this.instances = [];
      }
    },

    //converts an instance into a prototype and adds it to the scene graph as its own object
    bakeInstance: function(instance) {

    },

    
 //clears all anchors from array
    removeAnchors: function(){
      for(var i =0;i<this.anchors.length;i++){
        this.anchors[i].isAnchor(false);
      }
      this.anchors = [];
    },

    //called when instance is toggled to or from an anchor
    anchorUpdated: function(instance){
      
      if(instance.anchor){
        this.anchors.push(instance);
      }
      else{
        this.anchors.splice($.inArray(instance,this.anchors),1);
      }
      console.log('num of anchors='+this.anchors.length);
     if(this.anchors.length==2){
      if(!_.has(this,'copyNum')){
        console.log('no behavior, assigning copy and distribute');
      var copyBehavior = new CopyBehavior();
      var distributeBehavior = new DistributeBehavior();
      distributeBehavior.initialize();
      copyBehavior.setCopyNum(10);
      this.extendBehavior(distributeBehavior,'update');
      this.extendBehavior(copyBehavior,'update');
      this.update();
      }
     }

    },

    //event callback for when instance recieves a mouseup event
    mouseUpInstance: function(instance) {

     }




   

  });

  return GeometryNode;

});