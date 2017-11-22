const SKILL_ID = 'amzn1.ask.skill.6c4d29d2-3a3a-4b90-8274-78846c5d5864';

const WELCOME_MSG = ''.concat(
    'Hi Olivia, how are you? Welcome to Body Tech Lemery. ',
    'Please ask me about the status of the daily sales, staff commissions, and expenses. ',
    'For example, simply say Ask Body Tech how much is the total sales today, or what are the expenses today?'
);
const REPROMPT_TEXT = 'Ask me where your package is by saying Where is order 12345?';

var mysalesforce = require('./mysalesforce');

/**
 * Load express/alexa framework
 */
var express = require('express');
var alexa = require('alexa-app');
var PORT = process.env.PORT || 3000;

var app = express();
var alexaApp = new alexa.app("universalcontainers");

alexaApp.express({
    expressApp: app,
    checkCert: false,
    debug: true
})

app.set("view engine", "jade");


/**
 * pre Handler
 * Executed before any event handlers. This is useful to setup new sessions, validate the applicationId, or do any other kind of validations.
 */

alexaApp.pre = function(request, response, type) {
  if (request.applicationId != SKILL_ID) {
    console.log('request.applicationId is: ' + request.applicationId);
    console.log('SKILL_ID is: ' + SKILL_ID);
    // fail ungracefully
    response.fail("Invalid applicationId");
  }
};


/**
 * Launch Handler
 */

alexaApp.launch(function(request, response) {
    response.say(WELCOME_MSG);
    response.card("Universal Containers", WELCOME_MSG);
});

/**
 * Order Tracking Intent
 */

alexaApp.intent("OrderTrackingIntent", {
        "slots": {
            "OrderId": "AMAZON.NUMBER"
        },
        "utterances": [
            "for status on order number {OrderId}",
            "about {OrderId}",
            "daily sales {OrderId}"
        ]
    },
    function(request, response) {

        response.reprompt("I didn't hear a valid order number. Please ask something like 'What is the status of order number 100?'");

        return mysalesforce.getOrderStatus(request.slot('OrderId')).then(function(output) {
              response.say(output.say);
              response.card(output.card);
        });

});

alexaApp.intent("AMAZON.HelpIntent", {}, function(request, response) {
    response.say("Here's some help. Try saying 'Ask Body Tech for status on order 100'");
    response.card({
        type: "Simple",
        title: "Universal Containers",
        content: "Valid syntax:\nAsk Universal Containers about 100\nAsk Universal Containers for status on order 100"
    });
});

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/universalcontainers");
