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
    var luis = 'https://api.projectoxford.ai/luis/v1/application?id=2e8a97e5-faba-477c-be44-8b4897f0b814&subscription-key=a355a2fb68f54990811ac58b0c39d442&q=';
    request
        .get(luis + message.text)
        .end(function (err, luisRes) {
        res.sendStatus(200);
        if (err || !luisRes.ok) {
            console.log('Oh no! error');
        } else {
            console.log('yay got ' + JSON.stringify(luisRes.body));
            var luisAnswer = luisRes.body;
            var intent = getHighestIntent(luisAnswer.intents);
            if (intent.score < 0.5 || luisAnswer.entities.length == 0) {
                sendTelegramUpdate("I didn't understand you", message.chat.id);
            } else if (intent.intent === 'setInterestForArea') {
                var directions = getDirectionsFromEntities(luisAnswer.entities);
                console.log(directions);
                if (directions.length === 0) {
                    sendTelegramUpdate("I didn't understand you", message.chat.id);
                } else {
                    sendDirectionsToClients(directions, message.chat.id);
                }
            } else {
                sendTelegramUpdate("I didn't understand you", message.chat.id);
            }
        }
    });
});

function getHighestIntent(intents) {
    var maxScore = 0;
    var bestIntent;
    intents.forEach(function (intent) {
        if (intent.score >= maxScore) {
            bestIntent = intent;
            maxScore = intent.score;
        }
    });
    return bestIntent;
}

function sendDirectionsToClients(directions, chatId) {
    directions.forEach(function (direction) {
        switch (direction) {
            case 'north':
                io.sockets.emit('go north');
                sendTelegramUpdate('The interest in the north changed', chatId);
                break;
            case 'south':
                io.sockets.emit('go south');
                sendTelegramUpdate('The interest in the south changed', chatId);
                break;
            case 'east':
                io.sockets.emit('go east');
                sendTelegramUpdate('The interest in the east changed', chatId);
                break;
            case 'west':
                io.sockets.emit('go west');
                sendTelegramUpdate('The interest in the west changed', chatId);
                break;
            case 'random':
                io.sockets.emit('go random');
                sendTelegramUpdate('The ants are free', chatId);
                break;
        }
    });

}

function sendTelegramUpdate(message, chatId) {
    console.log('sned message', message, chatId);
    var url = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage';
    //var responseText = "Hi " + firstName + ". Toll, dass du dich für Mode interessierst 😊 Hier findest du bestimmt neue Ideen.\n\nBist du männlich oder weiblich?"
    url = url + "?chat_id=" + chatId + "&text=" + encodeURIComponent(message);

    request.get(url).end(function (ajaxErr, ajaxRes) {
        if (ajaxErr) {
            console.log("error: " + ajaxErr);
        }
        else {
            console.log('sent message to user', message);
        }
    }); //request end
}

function getDirectionsFromEntities(entities) {
    var directions = [];
    entities.forEach(function (entity) {

        console.log(entity, entity.type == 'GoT', entity.score, entity.score > 0.7);
        if (entity.type == 'direction' && entity.score > 0.7) {
            directions.push(entity.entity);
        } else if (entity.type.toLowerCase() == 'got' && entity.score > 0.7) {
            directions = ['south'];
        } else if (entity.type == 'freedom' && entity.score > 0.7) {
            directions = ['random'];
        }
    });
    return directions;
}

server.listen(port, function () {
    var addr = server.address();
    console.log('server listening on http://' + addr.address + ':' + addr.port);
});

io.on('connection', function (socket) {
    console.log('new client connected');
});