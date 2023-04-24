import ws from "ws";
const {Server} = ws;
import {v4 as uuid} from "uuid";
import {writeFile, readFileSync, existsSync} from "fs";
const clients = {};
const rooms = [];
const log = existsSync('log') && readFileSync('log', 'utf-8');
const messages = log ? JSON.parse(log) : [];

const wss = new Server({port: 3000});
wss.on("connection", (ws) => {
    const id = uuid();
    clients[id] = ws;
    rooms[id] = {name: "", roomID: ""};

    console.log(`Client ${id} connected`);
    ws.send(JSON.stringify(messages));

    ws.on('message',
    function (message){
      console.log(`Server recive message: ${message}`);
      const data = JSON.parse(message);
      messages.push(data);

      if(data.type == "connect"){
        rooms[id].roomID = data.roomID;
        rooms[id].name = data.name;

        for(const sid in clients){
          if(rooms[sid].roomID==rooms[id].roomID){
            clients[sid].send(JSON.stringify({type: "connect", name: rooms[id].name}));
          }
        }
      }
      else{
        for(const sid in clients){
          if(rooms[sid].roomID==rooms[id].roomID){
            clients[sid].send(JSON.stringify([data]))
          }
        }
      }
    }
  )

  
  ws.on('close',
    function(){
      delete clients[id];
      delete rooms[id];
      console.log(`Client ${id} disconnected`);
    }
  )
})

process.on('SIGINT', () => {
    wss.close();
    writeFile('log', JSON.stringify(messages), err => {
        if (err) {
            console.log(err);
        }
        process.exit();
    })
})