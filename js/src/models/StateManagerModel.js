/*StateManagerModel.js
*model that manages all base shapes*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/SceneNode',
  'models/tools/ToolCollection',
  'models/tools/PenToolModel',
  'models/tools/PolyToolModel',
  'models/tools/SelectToolModel'

], function($, _, Backbone,SceneNode, ToolCollection, PenToolModel,PolyToolModel,SelectToolModel) {
  var rootNode,
  	toolCollection,
  	penTool,
  	polyTool,
  	selectTool;


  var StateManagerModel = Backbone.Model.extend({

  	 defaults: {
    'state':  'selectTool',
  	},

  	initialize: function(){
        penTool = new PenToolModel({id:'penTool'});
        selectTool = new SelectToolModel({id:'selectTool'});
        polyTool = new PolyToolModel({id:'polyTool'});

        toolCollection = new ToolCollection([penTool,selectTool,polyTool]);
        toolCollection.on('change:shapeAdded',this.shapeAdded);
        rootNode = new SceneNode({name:'root'});

  	},

  	setState: function(state){
  		this.set('state',state);
  		toolCollection.get(this.get('state')).reset();
  		console.log(this.get('state'));
  		this.trigger('change:update');

  	},


  	shapeAdded: function(shape){
  		console.log('event triggered');
  		rootNode.addChildNode(shape);
  		console.log('path added to root:'+shape);
  		console.log('num children for root node ='+rootNode.getNumChildren());
  		console.log('num children for shape node ='+shape.getNumChildren());

  	},

//triggered by paper tool on a mouse down event
  	toolMouseDown : function(event) {
       	var selectedTool = toolCollection.get(this.get('state'));
       	selectedTool.mouseDown(event);
       	//this.trigger('change:update');
      
       },

   toolMouseUp : function(event) {
       	var selectedTool = toolCollection.get(this.get('state'));
       	selectedTool.mouseUp(event);
       	//this.trigger('change:update');
      
       },


 	toolMouseDrag : function(event) {
       	var selectedTool = toolCollection.get(this.get('state'));
       	selectedTool.mouseDrag(event);
       //	this.trigger('change:update');
     }






  });

  return StateManagerModel;

});