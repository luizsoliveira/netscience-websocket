//Setting Express
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

//Setting Socket.io
const { Server } = require("socket.io");
const io = new Server(server);

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
app.get('/stdout_segment/:taskId/:begin/:end', (req, res) => {
    const filename = `/var/tasks/${req.params.taskId}/stdout.log`
    lines = fileUtils.getRangeOfLines(filename, req.params.begin, req.params.end)
    res.send(lines)

});

/*
 Meta route for websockets based in namespace
*/
//io.of(/^\/file_monitor-\w+$/).on("connection", (socket) => {
io.of(/^\/stdout_monitor-[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).on("connection", (socket) => {
    const namespace = socket.nsp;
    const taskId = namespace.name.split('stdout_monitor-', 2)[1]

    if (taskId == null || taskId == undefined) {
      return
    }

    const filename = `/var/tasks/${taskId}/stdout.log`

    console.log(`someone connected to file monitor namespace: ${namespace.name} taskId: ${taskId}`);

    //Detecting that the client is ready to receive the existent number of lines of the file
    const numberOfLines = fileUtils.getNumberOfLines(filename)
    socket.emit('file_update', {
        message: 'File changed',
        taskId: taskId,
        number_of_lines: numberOfLines
    });

    //Creating listener that will monitor the file changes
    fs.watchFile(filename, {persistent:true, interval: 4000}, function(data) {
        const numberOfLines = fileUtils.getNumberOfLines(filename)
        console.log(`File update detected: ${filename} numberLines: ${numberOfLines}`)
        socket.emit('file_update', {
            message: 'File changed',
            taskId: taskId,
            number_of_lines: numberOfLines
        });
    });

  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});