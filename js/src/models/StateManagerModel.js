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
  	currentNode,
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
        this.listenTo(toolCollection,'shapeAdded',this.shapeAdded);
        this.listenTo(toolCollection,'shapeSelected',this.shapeSelected);
        rootNode = new SceneNode({name:'root'});
        currentNode = rootNode;


  	},

  	setState: function(state){
  		this.set('state',state);
  		toolCollection.get(this.get('state')).reset();
  		//console.log(this.get('state'));
  		//this.trigger('change:update');
  	},

  	//returns currently selected object as JSON object. If nothing is selected, returns the root object
  	getSelected: function(){
  		//console.log('attempting to get selected'+rootNode.getChildAt(0));
  		//currentNode = rootNode.getChildAt(0);
  		return currentNode.toJSON();
  		
  	},


//broken
  	updateSelected: function(data){
  		//console.log("updating selected");

  		if(currentNode){
  			//console.log(currentNode.get('fill'));
  			//check if multiple objects are selected
  			if(currentNode instanceof SceneNode){
  				 //console.log("not an array");

  				//update currently selected to correspond with user changes
  				for(var k in data){
  					console.log(k);
  					if(currentNode.hasOwnProperty(k)){
  						currentNode.set(k,data[k]);
  					}
  				}
  				  //console.log(currentNode.get('fill'));
  			}
  		}

  	},

  	shapeAdded: function(shape){
  		//console.log("adding shape");
  		//console.log(shape.toJSON());

  		rootNode.addChildNode(shape);
  		//console.log("adding shape to root")
  		//console.log(shape.toJSON());
  		currentNode = shape;

  		//this.trigger('updateView');
  		//console.log('path added to root:'+shape);
  		//console.log('num children for root node ='+rootNode.getNumChildren());
  		//console.log('num children for shape node ='+shape.getNumChildren());

  	},

  	shapeSelected: function(shape){
  		currentNode = shape.nodeParent;

  		//this.trigger('updateView');
  		//console.log('path added to root:'+shape);
  		//console.log('num children for root node ='+rootNode.getNumChildren());
  		//console.log('num children for shape node ='+shape.getNumChildren());

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
     },


 	toolMouseMove : function(event) {
       	var selectedTool = toolCollection.get(this.get('state'));
       	selectedTool.mouseMove(event);
       //	this.trigger('change:update');
     }






  });

  return StateManagerModel;

});