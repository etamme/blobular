var Food = function(context) {
  this.context = context;
  this.x = Math.floor(Math.random() * (this.context.width - 30));;
  this.y = Math.floor(Math.random() * (this.context.height - 30));;
  this.eaten = false;
}; Food.prototype = {
  draw: function() {
    this.context.fillStyle = 'gray';
    this.context.fillRect(this.x, this.y, 10, 10);
  },

  update: function() {
    //respawn eaten food elswhere
    if (this.eaten==true) {
      this.x = Math.floor(Math.random() * (this.context.width - 30));;
      this.y = Math.floor(Math.random() * (this.context.height - 30));;
      this.eaten = false;
    }
  }
}

var Circle = function(context,color,human) {
  this.context = context;
  this.radius = 20;
  this.human = human || false;
  this.reset(color);
  //this.x_velocity=Math.floor((Math.random() > 0.5 ? -1 : 1)*this.max_velocity-(this.max_velocity/2));
  //this.y_velocity=Math.floor((Math.random() > 0.5 ? -1 : 1)*this.max_velocity-(this.max_velocity/2));
  //this.x = Math.floor(Math.random() * (this.context.width - 30));;
  //this.y = Math.floor(Math.random() * (this.context.height - 30));;

}; Circle.prototype = {


  reset: function(color) {

    if(this.color)
      color=this.color;

    this.radius = 20;
    if(color=='red'){
      this.x = this.radius;
      this.y = this.radius;
    }else if(color=='green'){
      this.x = this.context.width - this.radius;
      this.y = this.radius;
    }else if(color=='yellow'){
      this.x = this.context.width - this.radius;
      this.y = this.context.height - this.radius;
    }else if(color=='blue'){
      this.x = this.radius;
      this.y = this.context.height - this.radius;
    }
    this.max_velocity=5;
    this.y_velocity = 0;
    this.x_velocity = 0;
    this.decay= 10 * (this.y_velocity>this.x_velocity ? this.y_velocity:this.x_velocity);
    this.frameskip=10;
    this.frameskip_renew=10;
    this.color = color || this.randomColor();
    this.eaten = false;
    this.next_x = 0;
    this.next_y = 0;

  },

  draw: function() {
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    this.context.fillStyle = this.color;
    this.context.fill();
    this.context.lineWidth = 2;
    this.context.strokeStyle = '#003300';
    this.context.stroke();

    this.context.fillStyle = 'black';
    this.context.textAlign = "center";

    if(this.radius > Math.floor(Math.sqrt(Math.pow(this.context.height,2)+Math.pow(this.context.width,2)))){
      this.context.font = "100px Arial";
      this.context.fillText("EPIC WIN!", this.x, this.y);
    } else {
      if(false){
        this.context.font = "15px Arial";
        this.context.fillText("vx:"+this.x_velocity+" vy:"+this.y_velocity, this.x, this.y);
        this.context.fillText("mass:"+this.radius, this.x, this.y+15);
      }
    }
  },

  updateState: function(newState) {
    this.next_x = newState['x'];
    this.next_y = newState['y'];
  },

  update: function(food,entities) {
    if(this.eaten==false) {
      // do collision dectection with food
      for (var i=0; i < food.length; i++) {
        if(this.collisionWith(food[i])) {
          food[i].eaten=true;
          this.radius++;
        }
      }
      // do collision detection with player entities
      for (var id in entities) {
        var entity = entities[id];
        if (entity.eaten == false) {
          // we are cheking if the CENTER of the entity is within our radius,
          //so we are half covering them
          if(this.collisionWith(entity)) {
            // we can only eat other entities if we are 20% larger
            if(this.radius>entity.radius*1.2){
              entity.eaten = true;
              // this is how you get huge
              this.radius+=(entity.radius/2);
            }
          }
        }
      }

      // update coordinates based on velocity
      this.y += this.y_velocity;
      this.x += this.x_velocity;

      // screen edge bounce checks and position readjustment
      if (this.y < 0) {
        this.y_velocity = this.y_velocity * -1;
        this.y = 0 - this.y;
      } else if (this.y > (this.context.height - 30)) {
        this.y_velocity = this.y_velocity * -1;
        this.y = (this.context.height - 30) - (this.y - (this.context.height - 30));
      }
      if (this.x < 0) {
        this.x_velocity = this.x_velocity * -1;
        this.x = 0 - this.x;
      } else if (this.x > this.context.width) {
        this.x_velocity = this.x_velocity * -1;
        this.x = this.context.width - (this.x - this.context.width);
      }
      // reduce our velocity
      if(!this.frameskip){
        this.frameskip=this.frameskip_renew;
        if(this.y_velocity!=0){
          if(this.y_velocity>0)
            this.y_velocity--;
          else
            this.y_velocity++;
        }
        if(this.x_velocity!=0){
          if(this.x_velocity>0)
            this.x_velocity--;
          else
            this.x_velocity++;
        }
      } else {
        this.frameskip--;
      }


      var ycoef = this.y_velocity > 0 ? 1:-1;
      var xcoef = this.x_velocity > 0 ? 1:-1;
      if(ycoef * this.y_velocity <= this.max_velocity/2 && xcoef * this.x_velocity <= this.max_velocity/2) {
        if (!this.human) {
          this.x_velocity = Math.floor((Math.random() > 0.5 ? -1 : 1)*this.max_velocity-(this.max_velocity/2));
        } else {
          this.x_velocity+=this.next_x;
          this.next_x=0;
        }

        if (!this.human) {
          this.y_velocity = Math.floor((Math.random() > 0.5 ? -1 : 1)*this.max_velocity-(this.max_velocity/2));
        } else {
          this.y_velocity=this.next_y;
          this.next_y=0;
        }

      }
    } else {
      // effectively wipe the entity off the screen on next draw
      this.x=0;
      this.y=0;
      this.radius=0;
    }
  },

  collisionWith: function(shape) {
    return (Math.pow((shape.x - this.x),2) + Math.pow((shape.y - this.y),2))
      < Math.pow(this.radius,2)
  },

  // pilfered from stackoverflow
  randomColor: function() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
}
