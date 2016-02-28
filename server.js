'use strict';

var port = process.env.PORT || 8000;
var request = require('superagent');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var TELEGRAM_TOKEN = '208718946:AAF77zqxA-PKZemeSkFZg48Wd21IfsNfM7k';


var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(bodyParser.json());

app.post('/' + TELEGRAM_TOKEN, function (req, res) {
    console.log(req.body);
    var message = req.body.message;

    var responseText = "Wohin sollen die Ameisen gehen?";

    switch (message.text) {
        case 'Norden':
            io.sockets.emit('go north');
            responseText = "Die Ameisen werden nach Norden gehen";
            break;
        case 'Süden':
            io.sockets.emit('go south');
            responseText = "Die Ameisen werden nach Süden gehen";
            break;
        case 'Osten':
            io.sockets.emit('go east');
            responseText = "Die Ameisen werden nach osten gehen";
            break;
        case 'Westen':
            io.sockets.emit('go west');
            responseText = "Die Ameisen werden nach Westen gehen";
            break;
        case 'frei lassen':
            io.sockets.emit('go random');
            responseText = "Die Ameisen werden sich zufällig bewegen";
            break;
    }

    if (req.body)

        var customKeyboard = {
            "keyboard": [
                [
                    'Norden',
                ],
                [
                    'Westen',
                    'Osten',
                ],
                [
                    'Süden',
                ],
                [
                    'frei lassen'
                ]
            ],
            "one_time_keyboard": false,
            "resize_keyboard": true
        }



    var chatId = req.body.message.chat.id;

    var url = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage';
    //var responseText = "Hi " + firstName + ". Toll, dass du dich für Mode interessierst 😊 Hier findest du bestimmt neue Ideen.\n\nBist du männlich oder weiblich?"
    url = url + "?chat_id=" + chatId + "&text=" + encodeURIComponent(responseText) + "&reply_markup=" + encodeURIComponent(JSON.stringify(customKeyboard));

    request.get(url).end(function (ajaxErr, ajaxRes) {
        if (ajaxErr) {
            console.log("error: " + ajaxErr);
            res.sendStatus(500);
        }
        res.sendStatus(200);
    }); //request end
    
    
});

server.listen(port, function () {
    var addr = server.address();
    console.log('     server listening on http://' + addr.address + ':' + addr.port);
});

io.on('connection', function (socket) {
    console.log('new client connected');
});