// This app decodes resistor values from the colors on the resistor.

// resistor values, multipliers and tolerances by color.
var resistorColors = {
      "black": [0, 1, NaN],
      "brown": [1, 10, 0.01],
      "red": [2, 100, 0.02],
      "orange": [3, 1000, NaN],
      "yellow": [4, 10000, 0.05],
      "green": [5, 100000, 0.005],
      "blue": [6, 1000000, 0.0025],
      "violet": [7, 10000000, 0.001],
      "purple": [7, 10000000, 0.001],
      "grey": [8, NaN, 0.0005],
      "white": [9, NaN, NaN],
      "gold": [NaN, 1/10, 0.05],
      "silver": [NaN, 1/100, 0.1]
   };

var CARD_TITLE = "Resistor Information.";

// Route the incoming request based on type (DecodeIntent, ColorIntent, RandomIntent).
// The JSON body of the request is provided in the event parameter.

exports.handler = function (event, context) {
   try{
      console.log("event.session.application.applicationId=" + event.session.application.applicationId);

      if (event.session.application.applicationId !== "amzn1.ask.skill.b9dfb5cb-1a3a-42b8-90ac-78b16f165df2") {
         context.fail("Invalid Application ID");
      }

      if (event.session.new) {
         onSessionStarted({requestId: event.request.requestId}, event.session);
      }

      function callback(sessionAttributes, speechletResponse) {
         context.succeed(buildResponse(sessionAttributes, speechletResponse));
      }

      if (event.request.type === "LaunchRequest") {
         onLaunch(event.request, event.session, callback);
      } else if (event.request.type == "IntentRequest") {
         onIntent(event.request, event.session, callback);
      } else if (event.request.type === "SessionEndedRequest") {
         onSessionEnded(event.request, event.session);
         context.succeed();
      }
   } catch (e) {
      context.fail("Exception: " + e);
   }
};

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
   console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);

   // TODO: Add any needed session init logic here
   // initialize lastResistor to 0 so we know if there was a
   session.attributes = {  "orientation"  : "",
                           "resistorA"    : NaN,
                           "resistorB"    : NaN,
                           "lastResistor" : NaN
                        };
}

// Called when the user invokes the skill without specifying what they want.
function onLaunch(launchRequest, session, callback) {
   console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

   getWelcomeResponse(callback);
}

// Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
   console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

   var intent = intentRequest.intent;
   var intentName = intentRequest.intent.name;

   // handle yes/no intent after the user has been prompted
   if (session.attributes && session.attributes.userPromptedToContinue) {
      delete session.attributes.userPromptedToContinue;
      if ("AMAZON.NoIntent" == intentName) {
         handleFinishSessionRequest(intent, session, callback);
      } else if ("AMAZON.YesIntent" === intentName) {
         handleRepeatRequest(intent, session, callback);
      }
   }

   switch (intentName)  {
      case "CalculateResistanceIntent":
         calculateResistance(intent, session, callback);
         break;
      case "GetResistorResponseIntent":
         calculateResistance(intent, session, callback);
         break;
      case "GetOrientationResponseIntent":
         calculateResistance(intent, session, callback);
         break;
      case "GetResistorDecodeIntent":
         getResistorDecodeIntent(intent, session, callback);
         break;
      case "GetColorInfoIntent":
         getColorInfoIntent(intent, session, callback);
         break;
      // case "GetRandomInfoIntent":
      //    getColorInfoIntent(intent, session, callback);
      //    break;
      case "AMAZON.StartOverIntent":
         getWelcomeResponse(intent, session, callback);
         break;
      case "AMAZON.HelpIntent":
         handleGetHelpRequest(intent, session, callback);
         break;
      case "AMAZON.StopIntent":
         handleFinishSessionRequest(intent, session, callback);
         break;
      case "AMAZON.CancelIntent":
         handleFinishSessionRequest(intent, session, callback);
         break;
      default:
   }
}

// Called when the user ends the session.
// is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
   console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);

   // TODO: Add any cleanup logic here
}

// --------------------------------------------------------------------------------------------------------------------

// TODO:  figure out what to do with this.
function handleRepeatRequest(intent, session, callback) {
   // Repeate the previous speechOutput and repromptText from the session attributes if available else start a new game session
   if (!session.attributes || !session.attributes.speechOutput) {
      getWelcomeResponse(callback);
   } else {
      callback(session.attributes, buildSpeechletResponseWithoutCard(CARD_TITLE, session.attributes.speechOutput, session.attributes.repromptText, false));
   }
}

function handleGetHelpRequest(intent, session, callback) {
   // Do not edit the help dialogue.  This has been created by the Alexa team to demonstrate best practices.

   var speechOutput = "You can say three colors to decode a resistor, one color to get it's value and multiplier or ask for a random color definition.";
   var repromptText = "Do you have your resistor?  I'm ready.";
   var shouldEndSession = false;
   callback(session.attributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
   // End session witha custon closing statement when the user wants to quit the game
   callback(session.attributes, buildSpeechletResponseWithoutCard(CARD_TITLE, "I hope you got what you needed!", "", true));
}

// --------------------------------------------------------------------------------------------------------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
   return {
      outputSpeech: {
         type: "PlainText",
         text: output
      },
      card: {
         type: "Simple",
         title: title,
         content: output
      },
      reprompt: {
         outputSpeech: {
            type: "PlainText",
            text: repromptText
         }
      },
      shouldEndSession: shouldEndSession
   };
}

function buildSpeechletResponseWithoutCard(title, output, repromptText, shouldEndSession) {
   return {
      outputSpeech: {
         type: "PlainText",
         text: output
      },
      reprompt: {
         outputSpeech: {
            type: "PlainText",
            text: repromptText
         }
      },
      shouldEndSession: shouldEndSession
   };
}

function buildResponse(sessionAttributes, speechletResponse) {
   return {
      version: "1.0",
      sessionAttributes: sessionAttributes,
      response: speechletResponse
   };
}

// --------------------------------------------------------------------------------------------------------------------

function getWelcomeResponse(callback) {
   var sessionAttributes = {lastResistor: NaN},
      speechOutput = "I'm ready.",
      shouldEndSession = false;

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "What would you like to decode?", shouldEndSession));
}

function getColorInfo(color) {
   var output = "";
   if (!isNaN(resistorColors[color][0])) {
      output += " is a value of " + resistorColors[color][0];
   }
   if (!isNaN(resistorColors[color][1])) {
      if (output === "") {
         output = " is a multiplier of " + resistorColors[color][1];
      } else {
         output += " and a multiplier of " + resistorColors[color][1];
      }
   }
   return color + output;
}

function isColorInvalid(color) {
   if (typeof resistorColors[color] === 'undefined') {
      return true;
   }
   return false;
}

function isResistorValueValid(resistor) {
   // check that the resistance isn't 0, and that we were passed a value through the intent.
   // check that this was in response to a reprompt.  If we don't have any other information in sessionAttributes, respond with help.
   if (resistor) {
      if (resistor.value) {
         if (!isNaN(parseInt(resistor.value))) {
            return true;
         }
         console.log("Invalid resistor value: " + resistor.value);
         return false;
      }
      console.log("Resistor value was not in the intent.")
      return false;
   }
   console.log("Resistor was not in the intent")
   return false;
}

function isOrientationValueValid(orientation) {
   if (orientation) {
      if (orientation.value) {
         switch(orientation.value) {
            case "parallel":
            case "series":
               return true;
            default:
               console.log("Invalid orientation value: " + orientation.value);
               return false;
         }
      }
      console.log("Orientation value was not in the intent.");
      return false;
   }
   console.log("Orientation was not in the intent");
   return false;
}

function calculateResistance(intent, session, callback) {
   console.log("calculateResistance: " + JSON.stringify(intent));

   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var resistorA = NaN;
   var resistorB = NaN;
   var orientation = "";
   var resistance = NaN;

   // Intent structure if one of the resistor values isn't stated.
   // "intent": {
   //    "name": "CalculateResistance",
   //    "slots": {
   //      "resistorA": {
   //        "name": "resistorA",
   //        "value": "100"
   //      },
   //      "resistorB": {
   //        "name": "resistorB"
   //      },
   //      "orientation": {
   //        "name": "orientation",
   //        "value": "parallel"
   //      }
   //    }
   //  }

   if (!isOrientationValueValid(intent.slots.orientation)) {
      speechOutput = "Please select series or parallel for your orientation.  " + orientation + " is not allowed.";
      repromptText = "Would you like series or parallel?";
      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false))
   } else if (!isResistorValueValid(intent.slots.resistorA)) {

   }


   // if there is only one resistor value, see if there is a lastResistor
   if (isResistorValueValid(resistorA) && !isResistorValueValid(resistorB)) {
      if (resistorAIsInt) {
         if (sessionAttributes.lastResistor) {
            resistorB = sessionAttributes.lastResistor;
         } else {
         sessionAttributes.lastResistor = intent.slots.resistorA.value;
         speechOutput = "I need resistor B to calculate the " + orientation + " resistance.";
         repromptText = "Please provide resistorB";
         callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false))
         }
      }
   } else if (!resistorAPresent && resistorBPresent) {
      if (resistorBIsInt) {
         if (sessionAttributes.lastResistor) {
            resistorA = sessionAttributes.lastResistor;
         } else {
            sessionAttributes.lastResistor = intent.slots.resistorB.value;
            speechOutput = "I need resistor A to calculate the " + orientation + " resistance.";
            repromptText = "Please provide resistorA";
            callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false))
         }
      }
   }


   // if !isNaN(sessionAttributes.lastResistor) {
   //    if (resistorAIsInt && !resistorBIsInt) {
   //       resistorB = sessionAttributes.lastResistor;
   //    } else if (!resistorAIsInt && resistorBIsInt) {
   //       resistorA = sessionAttributes.lastResistor;
   //    }

   // }


   // if there's no last resistor, ask for a second resistance
   if (resistorAIsInt) {
      resistorA = parseInt(intent.slots.resistorA.value);
   }
   if (resistorBIsInt) {
      resistorB = parseInt(intent.slots.resistorB.value);
   }

   if (orientation == "parallel") {
      resistance = (resistorA * resistorB) / (resistorA + resistorB);
   } else if (orientation == "series") {
      resistance = resistorA + resistorB;
   } else

   console.log("\nresistorA:" + resistorA + "\nresistorB:" + resistorB + "\norientation:" + orientation + "\nresistance:" + resistance);

   // TODO: adjust number of decimal places depending on the size of resistance
   speechOutput = "The calculated resistance is " + resistance.toFixed(4);
   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
   // check that the orientation is either series, parallel or some prounciation of those.
   // check that this was in response to a reprompt.  If we don't have any other information in sessionAttributes, respond with help.

}

function getResistorResponseIntent(intent, session, callback) {
   console.log("getResistorResponseIntent: " + JSON.stringify(intent));

   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var resistorValue = NaN;


}

function getOrientationResponseIntent(intent, session, callback) {
   console.log("getOrientationResponseIntent: " + JSON.stringify(intent));
   var sessionAttributes = session.attributes;

   if (isOrientationValueValid(intent.slots.orientation)){
      sessionAttributes.
   }
}

function getResistorDecodeIntent(intent, session, callback) {
   console.log("getResistorDecodeIntent: " + JSON.stringify(intent));

   // Set sessionAttributes to what it was and then change it later if applicable.
   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var firstColor = intent.slots.firstColor.value;
   var secondColor = intent.slots.secondColor.value;
   var thirdColor = intent.slots.thirdColor.value;

   // Check for invalid colors.
   if (isColorInvalid(firstColor)) {
      speechOutput = firstColor + " is not a valid color.";
   } else if (isColorInvalid(secondColor)) {
      speechOutput = secondColor + " is not a valid color.";
   } else if (isColorInvalid(thirdColor)) {
      speechOutput = thirdColor + " is not a valid color.";
   }
   // if speechOutput is not empty string, then there was some sort of error.
   if (speechOutput !== "") {
      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
   }

   // Check for impossible combinations.
   if (isNaN(resistorColors[firstColor][0])) {
      speechOutput = "The first color cannot be " + firstColor;
   } else if (isNaN(resistorColors[secondColor][0])) {
      speechOutput = "The second color cannot be " + secondColor;
   } else if (isNaN(resistorColors[thirdColor][1])) {
      speechOutput = "The third color cannot be " + thirdColor;
   }
   // if speechOutput is not empty string, then there was some sort of error.
   if (speechOutput !== "") {
      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
   }

   // TODO: black black black?

   var resistorValue = (resistorColors[firstColor][0] * 10 + resistorColors[secondColor][0]) * resistorColors[thirdColor][1];
   var resistorOutput = "";

   // if ((resistorValue >=.))
   if ((resistorValue >= 1000) && (resistorValue < 999999)) {
      resistorValue = resistorValue / 1000;
      resistorOutput = resistorValue + " kila-ohms.";
   } else if ((resistorValue >= 1000000) && (resistorValue < 999999999)) {
      resistorValue = resistorValue / 1000000;
      resistorOutput = resistorValue + " meg-ohms.";
   } else if ((resistorValue >= 1000000000) && (resistorValue < 999999999999)) {
      resistorValue = resistorValue / 1000000000;
      resistorOutput = resistorValue + " giga-ohms.";
   } else {
      resistorOutput = resistorValue + " ohms";
      // make ohms singular if there is only 1.
      if (resistorValue == "1") {
         resistorOutput = resistorOutput.slice(0,-1);
      }
   }

   speechOutput = "The value of the resistor is " + resistorOutput;
   console.log(speechOutput);

   sessionAttributes.lastResistor = resistorOutput;

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
}

function getColorInfoIntent(intent, session, callback) {
   console.log("getColorInfoIntent: " + JSON.stringify(intent));
   // This intent doesn't change the sessionAttributes, so just pass back what is already there.
   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var color = intent.slots.color.value;

   if (isColorInvalid(color)) {
      speechOutput = color + " is not a valid color.";
   }
   if (speechOutput !== "") {
      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
   }

   speechOutput = getColorInfo(color);

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
}

// function getRandomInfoIntent(intent, session, callback) {
//    console.log("getRandomInfoIntent: " + JSON.stringify(intent));

//    // This intent doesn't change the sessionAttributes so just pass back was is already there.
//    // TODO:  in a session don't repeat a color until all of them have been used.
//    var sessionAttributes = session.attributes;
//    var speechOutput = "";

//    var colorArray = Object.keys(resistorColors);
//    colorArray.splice(colorArray.indexOf("purple"), 1 /*number of items to remove*/);
//    var randomIndex = Math.floor(Math.random() * colorArray.length);

//    speechOutput = "Here is some random info. " + getColorInfo(colorArray[randomIndex]);

//    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));

// }