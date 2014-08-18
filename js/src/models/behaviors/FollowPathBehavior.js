/*FollowPathBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();
    var FollowPathBehavior = BaseBehavior.extend({
      name: 'followpath',
      type: 'distribution',
      constructor: function(pathChild) {
        this.pathChild = pathChild;
        this.finalPath = null;
        this.startAngle = 0;
        this.location = 0;
      },

      update: function(data) {
        //console.log('follow path update'+ this.name);
      // console.log('number of target instances for follow path=' + this.instances.length);
        var zeroedPath = this.pathChild.getLiteral().clone();

        zeroedPath.position.x = 0;
        zeroedPath.position.y = 0;
        
        var num = this.instances.length;
        var pA = new paper.Point(this.instances[0].delta.x,this.instances[0].delta.y);
        var pB = new paper.Point(this.instances[num-1].delta.x,this.instances[num-1].delta.y);
        var nA= zeroedPath.getNearestPoint(pA);
        var nB = zeroedPath.getNearestPoint(pB);
       
        console.log('num='+num);
           console.log('pA,pB');
        console.log(pA);
        console.log(pB);
        console.log('na,nB');
        console.log(nA);
        console.log(nB);

        var aOffset = zeroedPath.getOffsetOf(nA);
        var bOffset = zeroedPath.getOffsetOf(nB);

        console.log('aOffset='+aOffset+', bOffset='+bOffset);
        var defaultLength = zeroedPath.length;
        if(!zeroedPath.closed){
          if(bOffset<=aOffset){
          bOffset=aOffset+1;
        }
        if(aOffset>=bOffset){
          aOffset=bOffset-1;
        }
        if(aOffset<=0 && bOffset>=defaultLength){
          this.finalPath = zeroedPath;
        }
        else if(aOffset>0 && bOffset>=defaultLength){
          this.finalPath = zeroedPath.split(aOffset);
          zeroedPath.remove();
        }
        else if(aOffset<=0 && bOffset<defaultLength){
          var tail  = zeroedPath.split(bOffset);
          tail.remove();
          this.finalPath = zeroedPath;
        }
        else{
          var tail  = zeroedPath.split(bOffset);
          tail.remove();
          this.finalPath = zeroedPath.split(aOffset);
          zeroedPath.remove();
        }
      }
      else{
        zeroedPath.split(aOffset);
        var offset2 = zeroedPath.getOffsetOf(nB);
        //console.log(offset2);
        var tail = zeroedPath.split(offset2);
        //console.log(zeroedPath.length);
        //console.log(tail.length);
          this.finalPath = zeroedPath;
          tail.remove();

      }

        /*console.log('final path =');
        console.log(this.finalPath);
        console.log('defaltLength='+this.finalPath.length);*/
        var maxDist =this.finalPath.length/(num-1);
        //console.log('maxDist='+maxDist);
        this.finalPath.flatten(maxDist);
        //console.log('num of segments='+this.finalPath.segments.length);
        this.startPos = nA;
        this.endPos = nB;
      },


      calculate: function(data, index) {
        this.followPath(index);
      
        if (index === 0 || index === this.instances.length - 1) {
          this.instances[index].anchor = true;
        } else {
           
          this.instances[index].anchor = false;
        }
       
      },

      clean: function(data) {
        this.finalPath.remove();
        this.finalPath = null;

      },

      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(index) {
        var instance = this.instances[index];
        var start = this.finalPath.segments[index].point;

        if(index===0){
          start = this.startPos;
        }
        else if(index===this.instances.length-1){
          start = this.endPos;
        }
         var distance = this.finalPath.getOffsetOf(start);
        var normal = this.finalPath.getNormalAt(distance);
       // if(index-1>-1){
        //  end = this.rPath.segments[this.startIndex+index+1].point;
        /*}
        else{
          end = this.finalPath.segments[this.finalPath.segments.length-1].point;
        }*/
        
      
        var angle = normal.angle;
        console.log("normal");
        console.log(normal.angle)
        console.log(normal.quadrant);
       var  magnitude=100;
       
      /* console.log('placement point for:'+index);
        console.log(normal);
        console.log(angle);
        console.log(normal.quadrant);
        console.log('===============');*/
        var difference = {
          x: start.x,
          y: start.y
        };
        instance.update({
          delta: difference
        });
       
         instance.update({
          rotation: {
            angle: angle
          }
        });

      



      }


    });

    return FollowPathBehavior;
  });