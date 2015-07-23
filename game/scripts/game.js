var Game = function(options) {
  options = (!options) ? {} : options;

  // init defaults
  this.fps = options.fps || 50;
  this.height = options.height || 576;
  this.width = options.width || 1024;
  this.playerCount = options.entities || 4;
  this.foodDensity = options.food || "sparse";
  this.serverStats = {};

  // discover the canvas
  this.canvas = document.getElementById(options.viewport || "viewport");
  this.context = this.canvas.getContext("2d");

  // init canvas dimensions and add to context
  this.canvas.height = this.context.height =  this.height;
  this.canvas.width = this.context.width = this.width;

  // add click listener
  this.canvas.addEventListener('click', this.restart.bind(this));

  // init arrays for game state
  this.entities = {};
  this.entityIds = [];
  this.food = [];

  this.ua = new SIP.UA({
    uri: 'gameserver@yourdomain.com',
    wsServers: ['ws://yourWSserver'],
    authorizationUser: '',
    password: '',
    traceSip: true
  });

  this.ua.on('message', this.updateState.bind(this));

  // fixed number and colors of blobs - to use tunable params
  // use the block below
  var colors = ['red','green','blue','yellow'];
  this.PlayerCount=4;
  for (i = this.playerCount; i; i--)
    this.addCircle(colors[i-1],true);

  // start game based on tunable params
  //  for (i = this.playerCount; i; i--)
  //  this.addCircle();

  // Calculate food count based on density relative to canvas
  // factor determined by percentage of defaults
  var factor = (this.foodDensity == "sparse") ? 0.0384 : 0.09;
  var count = (this.height+this.width) * factor;
  for (i = Math.floor(count); i; i--)
    this.addFood();

  this.connect();
}; Game.prototype = {

  // connect to server
  connect: function() {
    var options = {
        media: {
            constraints: {
                audio: true,
                video: false
            }
        }
    };
    // connect to blobserver to get updates about player game state
    this.session = this.ua.invite("sip:blobserver@yourdomain.com",options);  
  },

  disconnect: function() {
    var options = {
    'all': true
    };
    
    this.session.bye();
    this.ua.unregister(options);
  },

  restart: function(e){
    var x = e.pageX,
        y = e.pageY;
    console.log("x:"+x+" y:"+y);

    if (y > 25 && y < 125 && x > this.width/2-75 && x < this.width/2+75) {
      //this.disconnect();
      //this.connect();
      var _this = this;
      this.entityIds.forEach(function(e, idx, arr) {
       _this.entities[e].reset();
      });
    }
  },


  draw: function() {
    this.context.clearRect(0, 0, this.width, this.height);
    // draw food first so it z indexes below players
    for (var i=0; i < this.food.length; i++) {
      this.food[i].draw();
    }

    this.context.fillStyle= "black"; 
    this.context.globalAlpha=0.5; // Half opacity
    var ypos=0;
    this.context.fillRect(this.width/2-225,ypos,450,this.height);
    this.context.globalAlpha=1; 
    ypos+=80
    for (var color in this.serverStats){
      this.context.fillStyle=color;
      this.context.strokeStyle='black';
      this.context.font="20px Arial";
      for (var server in this.serverStats[color]){
        ypos+=20;
        this.context.fillText(JSON.stringify(server+":"+this.serverStats[color][server]),this.width/2,ypos);
      }
      ypos+=20
    }


    // sort the entities by size so they get z indexed properly
    var _this = this;
    this.entityIds.sort(function(a,b){
        return _this.entities[a].radius - _this.entities[b].radius;
    });
    this.entityIds.forEach(function(e, idx, arr) {
        _this.entities[e].draw();
    });
    this.context.fillStyle= "black"; 
    this.context.strokeRect(this.width/2-75,25,150,50);
    this.context.globalAlpha=1; 
    this.context.fillStyle= "white"; 
    this.context.font="20px Arial";
    this.context.fillText("restart game",this.width/2,55);

   },

  updateState: function(message) {
    var _this = this;

    // Move structure
    // {"yellow":{"move":{"x":0,"y":0},"servers":{"some.server1":2, "some.server2":5}},"blue":{"move":{"x":0,"y":0},"servers":{"some.server1":2, "some.server2":5}}}
    var state = JSON.parse(message.body);
    for (var color in state) {
        _this.serverStats[color]=state[color].servers;
        _this.entities[color].updateState(state[color]["move"]);
    }
  },

  update: function() {
    // update players first b/c collision detection will happen here
    // and food will be marked as eaten so it can be respawned upon
    // calling food update
    var _this = this;
    this.entityIds.forEach(function(e, idx, arr) {
      _this.entities[e].update(_this.food,_this.entities);
    });
    for (var i=0; i < this.food.length; i++) {
      this.food[i].update();
    }
  },

  run: function() {
    var _this = this,
        loops = 0,
        skipTicks = 1000 / this.fps,
        maxFrameSkip = 10,
        nextGameTick = (new Date).getTime();

    return function() {
      loops = 0;
      while ((new Date).getTime() > nextGameTick) {
        _this.update();
        nextGameTick += skipTicks;
        loops++;
      }
      _this.draw();
    }
  },

  addFood: function() {
    this.food.push(new Food(this.context));
  },

  addCircle: function(color,human) {
    var _human = human || false;
    var uuid = color || this.guid();
    this.entityIds.push(uuid);
    this.entities[uuid] = new Circle(this.context,color,_human);
  },

  guid: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
    }
}

