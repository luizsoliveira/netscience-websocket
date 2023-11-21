//Setting Express
const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const csv = require("csvtojson");

// Call the express framework
// Thanks @Farias-sys
const cors = require('cors')
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:81")
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    app.use(cors())
    next()
})

//Setting Socket.io
const { Server } = require("socket.io");
const io = new Server(httpServer,{
  cors: {
    origin: ["http://localhost:7000", "http://localhost:80", "http://localhost:81"]     
  }
});

//Setting the filesystem libraries
const fs = require('fs');
const fileUtils = require('./fileUtils');
var path = require('path')

// Generic settings for Express server
var favicon = require('serve-favicon')
app.use(express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// Demo routes for the HTML pages
app.get('/task', (req, res) => {
  res.sendFile(__dirname + '/pages/editor.html');
});

app.get('/task_simple', (req, res) => {
  res.sendFile(__dirname + '/pages/simple.html');
});

// Route that returns a segment of stdout file
app.get('/websocket/stdout_segment/:taskId/:begin/:end', (req, res) => {
    const filename = `/var/tasks/${req.params.taskId}/stdout.log`
    lines = fileUtils.getRangeOfLines(filename, req.params.begin, req.params.end)
    res.send(lines)

});

// Route that returns a file inside a namespace
app.get('/websocket/dataset/:taskId', (req, res) => {
  const filename = `/var/tasks/${req.params.taskId}/DATASET.csv`

  if (fs.existsSync(filename)) {

    // Convert a csv file with csvtojson
    csv()
    .fromFile(filename)
    .then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
      res.send(jsonArrayObj); 
    })
  } else {
    //Dataset is not ready yet
    res.send({})
  }

  
});

// Route that returns a file inside a namespace
// Not used yet
app.get('/websocket/dataset/csv/:taskId', (req, res) => {
  const filename = `/var/tasks/${req.params.taskId}/DATASET.csv`

  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, 'utf8');
    res.send(data.toString());    
  } else {
    //Dataset is not ready yet
    res.send({})
  }
 
});

/*
 Meta route for websockets based in namespace
*/
//io.of(/^\/file_monitor-\w+$/).on("connection", (socket) => {
io.of(/^\/websocket\/stdout_monitor-[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).on("connection", (socket) => {
    const namespace = socket.nsp.name;
    const taskId = namespace.split('stdout_monitor-', 2)[1]

    if (taskId == null || taskId == undefined) {
      console.warn('Aborting. TaskId is a obligatory parameter.')
      return
    }

    const filename = `/var/tasks/${taskId}/stdout.log`

    console.log(`someone connected to file monitor namespace: ${namespace} taskId: ${taskId}`);

    socket.on('hello', (msg) => {
      console.log(`Ping received on the server`)
      const numberOfLines = fileUtils.getNumberOfLines(filename)
      socket.emit('lastLine', numberOfLines);

    })

    //Creating listener that will monitor the file changes
    fs.watchFile(filename, {persistent:true, interval: 1000}, function(data) {
        const numberOfLines = fileUtils.getNumberOfLines(filename)
        //console.log(`File update detected: ${filename} numberLines: ${numberOfLines}`)
        socket.emit('lastLine', numberOfLines);

    });

  });

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});