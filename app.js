var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started on localhost:2000");

var SOCKET_LIST = {};
var MATCH_LIST = {};

var Entity = function(){
    var self = {
        x:250,
        y:250,
        xv:0,
        yv:0,
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.xv;
        self.y += self.yv;
    }
    self.getDistance = function(pt){
      return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}

plat = [];
plat.push({
  x:0,
  y:450,
  w:500,
  h:20
});
plat.push({
  x: 200,
  y: 300,
  w: 150,
  h: 50
});

var Player = function(id, user, roomID){
    var self = Entity();
    self.id = id;
    self.user = user;
    self.roomID = roomID;
    self.waiting = false;
    self.w = 18;
    self.h = 26;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouse = {};
    self.mouseAngle = 0;
    self.chargeAngle = 0;
    self.speed = 6;
    self.jumpHeight = 10;
    self.onG = false;
    self.grav = 0.5;
    self.dt = 0;

    self.bar = {
      charge: false,
      count: 0,
      col: "yellow",
      w: 50,
      h: 10,
      cx: self.x - 5,
      cy: self.y + 25,
      cw: 0,
      ch: 20
    }

    self.wpn = {
      x:self.x + 5,
      y:self.y - 10,
      attack: false,
      w: 40,
      h: 4,
      dash: 22.5,
      xv: 0,
      yv: 0
    }

    self.points = [];
    self.angle2 = 0;
    self.x2 = 0;
    self.y2 = 0;

    var super_update = self.update;
    self.update = function(){
      self.mouseUpdate();
      if(self.wpn.attack == false)
        self.updateSpeed();
      self.attackCheck();
      self.collisionCheck();
    }

    self.mouseUpdate = function(){
      self.mouseAngle = Math.atan2(self.mouse.y - self.y, self.mouse.x - self.x);
    }

    self.attackCheck = function(){
      if(self.pressingAttack && !self.wpn.attack){
        self.bar.charge = true;
        self.chargeAngle = self.mouseAngle
        if(self.bar.count < 50)
          self.bar.count++;
        else {
          self.bar.col = "blue"
        }
      }
      else{
        if(self.bar.count == 50 || self.wpn.attack == true){
          self.wpn.attack = true;
          self.dash();
          self.bar.count = self.bar.count - 10;
        }
        else if(self.bar.count < 50){
          self.bar.count = 0;
        }
        if(self.bar.count < 0){
          self.wpn.attack = false;
          self.bar.count = 0;
          self.xv = 0;
          self.yv = 0;
          self.wpn.xv = 0;
          self.wpn.yv = 0;

        }
        self.bar.col = "yellow";
        self.bar.charge = false;
      }
    }

    self.dash = function(){
      self.xv = self.wpn.dash * Math.cos(self.chargeAngle);
      self.yv = self.wpn.dash * Math.sin(self.chargeAngle);
      self.mouseAngle = self.chargeAngle;
    }

    self.updateSpeed = function(){
      //speed update
      if(self.pressingLeft){
        self.xv = -self.speed;
      }
      if(self.pressingRight){
        self.xv = self.speed;
      }
      if(self.onG){
        self.xv *= 0.7;
      }
      else {
        self.xv *= 0.5;
        self.yv += self.grav;
      }
      if(self.pressingUp && self.onG){
        self.yv = -self.jumpHeight;
      }
      if(!self.pressingUp && self.yv < -3){
        self.yv = -3;
      }
      if(self.pressingDown && self.yv < 5 && !self.onG){
        self.yv = 8;
      }
      // Adding crouching is hard
      /*else if(self.pressingDown && self.onG){
        self.h = 18;
        self.xv *= 0.8;
      }
      else{
        self.h = 26;
      }*/
    }


    self.collisionCheck = function(){
      oldx = self.x;
      oldy = self.y;
      self.x += self.xv
      self.y += self.yv

      self.onG = false;
      for(i = 0; i < plat.length; i++){
        if(self.collision(i)){
          //onG
          if(oldy + self.h <= plat[i].y && self.yv > 0){
            self.y = plat[i].y - self.h;
            self.onG = true;
            self.yv = self.grav;
          }
          //onC
          else if(oldy >= plat[i].y + plat[i].h){
            self.y = plat[i].y+plat[i].h;
            if(self.yv < 0){
              self.yv = 0;
            }
          }
          // left hit
          else if(oldx + self.w <= plat[i].x){
      			self.x = plat[i].x - self.w;
      			if(self.xv > 0){
      				self.xv = 0;
      			}
      		}
          // right hit
          else if(oldx >= plat[i].x + plat[i].w){
      			self.x = plat[i].x + plat[i].w;
      			if(self.xv < 0){
      				self.xv = 0;
      			}
      		}
        }
      }
      self.wpn.x = self.x + 10;
      self.wpn.y = self.y + 10;

      if(self.wpn.attack){
        self.points = []
        self.points.push({
          x: self.wpn.x,
          y: self.wpn.y
        })
        if(self.angle2 == 0){
          if(Math.PI/2 >= Math.abs(self.mouseAngle)){
            //Q1
            if(self.mouseAngle <= 0){
              self.angle2 = Math.PI/2 + self.mouseAngle;
              self.x2 = self.wpn.h * Math.cos(self.angle2);
              self.y2 = self.wpn.h * Math.sin(self.angle2);
            }
            //Q4
            else{
              self.angle2 = Math.PI/2 - self.mouseAngle;
              self.x2 = -(self.wpn.h * Math.cos(self.angle2));
              self.y2 = (self.wpn.h * Math.sin(self.angle2));
            }
          }
          else{
            //Q2
            if(self.mouseAngle < 0){
              self.angle2 = -(Math.PI/2 + self.mouseAngle);
              self.x2 = (self.wpn.h * Math.cos(self.angle2));
              self.y2 = -(self.wpn.h * Math.sin(self.angle2));
            }
            //Q3
            else{
              self.angle2 = -(Math.PI/2 - self.mouseAngle);
              self.x2 = -(self.wpn.h * Math.cos(self.angle2));
              self.y2 = -(self.wpn.h * Math.sin(self.angle2));
            }
          }
        }
        for (j = 0; j < 6; j++){
          self.points.push({
            x: self.wpn.x + j/5 *(self.wpn.w * Math.cos(self.mouseAngle)),
            y: self.wpn.y + j/5 *(self.wpn.w * Math.sin(self.mouseAngle))
          });
          self.points.push({
            x: self.wpn.x + j/5 *(self.wpn.w * Math.cos(self.mouseAngle)) + self.x2,
            y: self.wpn.y + j/5 *(self.wpn.w * Math.sin(self.mouseAngle)) + self.y2
          });
        }
        for (var i in Player.list){
          var p = Player.list[i];
          var l = 0;
          if(self.id !== p.id){
            for (var j in self.points){
              if(p.x < self.points[j].x && p.x + p.w > self.points[j].x &&
                p.y < self.points[j].y && p.y + p.h > self.points[j].y){
                  matchDone(self.roomID, self.id);
                  return;
                }
            }
          }
        }
      }
      else{
        self.angle2 = 0;
        self.points = [];
        self.x2 = 0;
        self.y2 = 0;
      }
    }

    self.collision = function(i){
    	return (self.x>plat[i].x - self.w && self.x<plat[i].x+plat[i].w &&
    		self.y + self.h >plat[i].y && self.y <plat[i].y+plat[i].h);
    }
    Player.list[id] = self;
    return self;
}

Player.list = {};


Player.onConnect = function(socket, username, roomID){
    i = idFind(socket);
    var player = Player(i, username, roomID);
    MATCH_LIST[roomID].players.push(player);
    player.waiting = true;
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId == 'attack')
            player.pressingAttack = data.state;
        else if(data.inputId == 'mouseAngle')
            player.mouse = data.state
    });
}


Player.onDisconnect = function(socket){
  i = idFind(socket)
  delete Player.list[i];
}

Player.update = function(roomID){
    var pack = [];
    var room = MATCH_LIST[roomID].players;
      for(i = 0; i < room.length; i++){
        var player = room[i];
        player.update();
        pack.push({
            id: player.id,
            x:player.x,
            y:player.y,
            w:player.w,
            h:player.h,
            user:player.user,
            mouseAngle:player.mouseAngle,
            bar: player.bar,
            wpn: player.wpn,
            roomID: player.roomID,
        });
      }
    return pack;
}

/*var Match = function(u1, u2){
  var self = {
    id : Math.random(),
    u1 : u1,
    u2 : u2,
    finish : false,
  }
  u1.gameID = self.id;
  u2.gameID = self.id;
  u1.waiting = false;
  u2.waiting = false;
  console.log('game made');

  self.matchStart = function(){
    u1.x = 20;
    u1.y = 40;
    u2.x = 400;
    u2.y = 40;
  }

  self.gameCheck = function(){
    if(!SOCKET_LIST[u1.id]){
      console.log("u1 disconnect");
      self.gameWon(u2);
    }
    if(!SOCKET_LIST[u2.id]){
      console.log("u2 disconnect");
      self.gameWon(u1);
    }
  }

  self.gameWon = function(user){
    console.log(user.user + " has won the match!");
    Match.Complete(self.id);
  }


  self.matchStart();
  Match.list[self.id] = self;
  return self;
}

Match.list = {};

Match.Complete = function(id){
  mt = Match.list[id];
  if(SOCKET_LIST[mt.u1.id]){
    SOCKET_LIST[mt.u1.id].emit('Complete');
    delete Player.list[mt.u1.id];
  }
  if(SOCKET_LIST[mt.u2.id]){
    SOCKET_LIST[mt.u2.id].emit('Complete');
    delete Player.list[mt.u2.id];
  }
  delete Match.list[id];
}
*/

var DEBUG = true;

function idFind(socket){
  for(var i in SOCKET_LIST){
    if(socket.id == SOCKET_LIST[i].id){
      return i;
    }
  }
}

function matchFind(socket){
  // need to have waiting for game and game start
  // maybe split into two different objects?
  var i = 0;
  while(MATCH_LIST[i]){
    if(MATCH_LIST[i] && MATCH_LIST[i].length < 2){
      socket.join(i.toString());
      MATCH_LIST[i].ready = true;
      return i;
    }
    i++;
  }
  socket.join(i.toString());
  MATCH_LIST[i] = io.sockets.adapter.rooms[i.toString()];
  MATCH_LIST[i].players = [];
  MATCH_LIST[i].ready = false;
  return i;
}

function matchDisconnect(socket){
  // call match win for other player
  id = idFind(socket);
  if(Player.list[id]){
    roomID = Player.list[id].roomID;
    for(i = 0; i < MATCH_LIST[roomID].players.length; i++){
      if(MATCH_LIST[roomID].players[i].id == id){
        MATCH_LIST[roomID].players.splice(i,1);
        break;
      }
    }
    if(MATCH_LIST[roomID].players.length == 0){
      delete MATCH_LIST[roomID];
      return;
    }
    matchDone(roomID, MATCH_LIST[roomID].players[0].id);
    console.log("Match Disconnect Successful!");
  }
}

function matchDone(id, winID){
  //delete players, match, and send Complete emit to all users
  var match = MATCH_LIST[id];
  for(i = 0; i < match.players.length; i++){
    var player = match.players[i];
    if(player.id == winID){
      console.log(player.user + " has won!");
      //do whatever you want for a win
    }
    SOCKET_LIST[player.id].leave(id);
    SOCKET_LIST[player.id].emit('Complete');
    delete Player.list[player.id];
  }
  delete MATCH_LIST[id];
}

function matchStart(id){
  // implement some waiting feature (for a 3/2/1 countdown)
  match = MATCH_LIST[id];
  match.ready = false;
  //match.wait = true;
  match.players[0].x = 20;
  match.players[0].y = 200;
  match.players[1].x = 460;
  match.players[1].y = 200;
  Player.update(id);
  i = 0;
  /*setTimeout(function(){
    match.wait = false;
    return;
  }, 5000);*/
}


var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  //var room = io.sockets.adapter.rooms['d']; for room info

  // It's got beef with changing the socket.id
  var i = 0;
  while(SOCKET_LIST[i]){
    i++;
  }
  SOCKET_LIST[i] = socket;
  console.log(i);

  socket.on('PlayNow',function(data){
    var roomname = matchFind(socket);
    if(data.username != ''){
      Player.onConnect(socket, data.username, roomname.toString());
    }
    else{
      Player.onConnect(socket, 'Unknown', roomname.toString());
    }
    console.log(MATCH_LIST);
    if(MATCH_LIST[roomname].ready == true){
      matchStart(roomname);
    }
    socket.emit('PlayResponse', {success: true});
  });

  socket.on('disconnect', function(){
    matchDisconnect(socket);
    Player.onDisconnect(socket);
    id = idFind(socket);
    delete SOCKET_LIST[id];
    console.log("All other disconnects successful!");
  });
  socket.on('sendMsgToServer', function(data){
    var id = idFind(socket);
    var player = Player.list[id];
    if(data != '')
      io.to(player.roomID).emit('addToChat',player.user + ': ' + data);
  });
  socket.on('evalServer', function(data){
    if(!DEBUG)
      return;
    var res = eval(data);
    socket.emit('evalAnswer',res);
  });

});

var now = Date.now();
var delta = now - lastUpdate;
var lastUpdate = now;

setInterval(function(){
  //optimize push for plat, only push once on game start
  for(var i in MATCH_LIST){
    
    var pack = {
      player: Player.update(i),
      plat:plat,
    }
    io.to(i).emit('newPositions', pack);
    
    //if(!MATCH_LIST[i].wait)
    //  Player.update(i);
  }

},1000/60);

/*var now = Date.now();
var delta = now - lastUpdate;
var lastUpdate = now;

setInterval(function(){
  now = Date.now();
  delta = now - lastUpdate;
  lastUpdate = now;
  for(var i in MATCH_LIST){
    var pack = {
      player: MATCH_LIST[i].players,
      plat:plat,
      delta:delta,
    }
    io.to(i).emit('newPositions', pack);
  }
},1000/10);*/
