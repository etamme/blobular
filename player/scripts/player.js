var Player = function(options) {
  options = (!options) ? {} : options;

  var colors = ['red','green','blue','yellow'];
  // init defaults
  this.id = options.guuid || this.guid();
  this.index = Math.floor((Math.random()*100)%4);
  this.color_index = Math.floor((Math.random()*100)%4);
  this.server = options.server || 'yourWSserver';
  this.color = options.color || colors[this.color_index];

  // discover the canvas
  this.canvas = document.getElementById(options.viewport || "viewport");
  this.context = this.canvas.getContext("2d");

  // init canvas dimensions and add to context
  this.canvas.height = this.context.height =  200;
  this.canvas.width = this.context.width = 200;

  // next move storage
  this.nextMove = { 'x':0, 'y':0};

  this.ua = new SIP.UA({
  uri: this.id+'@yourdomain.com',
  wsServers: ['ws://'+this.server],
  authorizationUser: '',
  password: '',
  traceSip: true,
  register: false
});

}; Player.prototype = {

  up: function() {
    this.nextMove['y']--;
  },
  down: function() {
    this.nextMove['y']++;
  },
  left: function() {
    this.nextMove['x']--;
  },
  right: function() {
    this.nextMove['x']++;
  },

  draw: function() {
      this.context.clearRect(0, 0, this.width, this.height);
      var context = this.context;
      var centerX = this.canvas.width / 2;
      var centerY = this.canvas.height / 2;
      var radius = 70;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = this.color;
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#003300';
      context.stroke();
  },

  sendMove: function() {
    var update = {'remote_app_command':{'gamePlayer': { 'server_app_id': 849, 'team_color': this.color, 'player_id': this.id, 'move': this.nextMove, 'server': this.server}}};
    // send our move
    this.ua.message('blobserver@yourdomain.com',JSON.stringify(update));
    // reset our move
    this.nextMove={ 'x':0, 'y':0};
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

