/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var DistributeBehavior = BaseBehavior.extend({
      paper: null,
      name: 'linear',
      type: 'distribution',

     
      update: function() {
       // console.log("distribution update");
        this.clearScaffolds();
        this.distribute();


      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {
       //console.log("distributing instances");
        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];
              var num = child.instances.length;

              var pointA = child.instances[0].position;
              var pointB = child.instances[child.instances.length - 1].position;
              if(TrigFunc.equals(pointA,pointB)){
                child.instances[child.instances.length - 1].position.x+=40;
                child.instances[child.instances.length - 1].position.y+=40;
                pointB = child.instances[child.instances.length - 1].position;
              }
              var selected = child.getFirstSelectedInstance();
              
               /* var scaffoldLine =  new paper.Path();
    
              
                 scaffoldLine.strokeColor = '#83E779';
                scaffoldLine.add(new paper.Point(pointA.x,pointA.y));
                scaffoldLine.add(new paper.Point(pointB.x,pointB.y));
                this.scaffold.push(scaffoldLine);
                var pointAC = new paper.Path.Circle(new paper.Point(pointA.x,pointA.y),5);
                 var pointBC = new paper.Path.Circle(new paper.Point(pointB.x,pointB.y),5);
                pointAC.fillColor =  '#83E779';
                pointBC.fillColor =  '#FF0000';
                this.scaffold.push(pointAC);
                this.scaffold.push(pointBC);*/

         

           
              var xDiff = (pointB.x - pointA.x) / (num-1);
              var yDiff = (pointB.y - pointA.y) / (num-1);
              var dist = TrigFunc.distance(pointA,{x:pointA.x+xDiff,y:pointA.y+yDiff});
              if(selected){
                if(selected.index === 1){
                  this.checkDistanceIncrement(child.instances[0],selected.instance,dist,child);
                }
                else if(selected.index==child.instances.length-2){
                  this.checkDistanceDecrement(child.instances[0],selected.instance,dist,child);

                }
              }
           
              for (var i = 1; i < num-1; i++) {
                //console.log(location);
                var x = pointA.x + xDiff * i;
                var y = pointA.y + yDiff * i;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                  }
                });
              }

              for(var j=0;j<child.instances.length;j++){
               // console.log('conditional check at '+ j);

                var result = this.checkConditions(child.instances[j]);
               
                child.instances[j].visible=result;
                // console.log("visible="+result);
               
              }


              /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/
            }
          }
        }

      },

      checkDistance: function(start,selected,tDist,child){

          var dist = TrigFunc.distance(start.position,selected.position);
         // console.log("num copies="+this.copyNum);
          if(dist<tDist+20){
           this.copyNum++;
          //  console.log("incrementing copy");
          }
          else if(dist>tDist+20){
             this.copyNum--;
          //   console.log("decrementing copy");
          
          }
         // console.log('selected Distance ='+dist);
          //console.log('target Distance ='+tDist);


      }


    });

    return DistributeBehavior;
  });