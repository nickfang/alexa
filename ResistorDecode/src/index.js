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

var CARD_TITLE = "Resistor Assistant.";
var PARALLEL = "parallel";
var SERIES = "series";

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

// unlike intents,
function clearSessionAttributes() {
   return { "decodedResistor" : NaN,
            "slots": {
               "resistorA": {
                  "name": "resistorA"
               },
               "resistorB": {
                  "name": "resistorB"
               },
               "orientation": {
                  "name": "orientation"
               }
            }
          };

}

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
   console.log("onSessionStarted(): requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
   session.attributes = clearSessionAttributes();
}

// Called when the user invokes the skill without specifying what they want.
function onLaunch(launchRequest, session, callback) {
   console.log("onLaunch(): requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

   getWelcomeResponse(callback);
}

// Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
   console.log("onIntent(): requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

   var intent = intentRequest.intent;
   var intentName = intentRequest.intent.name;
   console.log("intent: " + intentName);

   switch (intentName)  {
      case "calculateResistanceIntent":
         calculateResistanceIntent(intent, session, callback);
         break;
      case "getResistorResponseIntent":
         getResistorResponseIntent(intent, session, callback);
         break;
      case "getOrientationResponseIntent":
         getOrientationResponseIntent(intent, session, callback);
         break;
      case "getResistorDecodeIntent":
         getResistorDecodeIntent(intent, session, callback);
         break;
      case "getColorInfoIntent":
         getColorInfoIntent(intent, session, callback);
         break;
      case "AMAZON.StartOverIntent":
         getWelcomeResponse(callback);
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
         console.log("onIntent(): unknown intent: " + intentName);
         handleFinishSessionRequest(intent, session, callback);
   }
}

// Called when the user ends the session.
// is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
   console.log("onSessionEnded(): requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
}

// --------------------------------------------------------------------------------------------------------------------

function handleGetHelpRequest(intent, session, callback) {
   // Do not edit the help dialogue.  This has been created by the Alexa team to demonstrate best practices.

   var speechOutput = "You can say three colors to decode a resistor, say one color to get it's value and multiplier, or " +
                      "you can ask for the equivalent resistance of two resistors in parallel or series.  " +
                      "If you decode a resistor and then provide only one resistor value for calculating the " +
                      "equivalent resistance, the decoded resistor value will be used for the calculation.  ";
   var repromptText = "Would you like to decode a resistor or calculate an equivalent resistance? ";
   var shouldEndSession = false;
   callback(session.attributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
   // End session with custon closing statement when the user wants to quit the game
   callback(session.attributes, buildSpeechletResponseWithoutCard(CARD_TITLE, "Goodbye, I hope you got what you needed!", "", true));
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
   var sessionAttributes = clearSessionAttributes();
   var speechOutput = "Hi, I am your resistor assistant.  Please say help, if you need it.  ";
   var repromptText = "Please state the three color bands on your resistor or " +
                      "two resistors and their orientation to calculate an equivalent resistance. ";
   var shouldEndSession = false;

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
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
   return color + output + ".";
}

function isColorInvalid(color) {
   if (typeof resistorColors[color] === 'undefined') {
      return true;
   }
   return false;
}

// This function corrects for any pronunciation that the user wants to use that we account for in the slot values LIST_OF_ORIENTATIONS.
function correctForOrientationPronunciation(orientation) {
   switch (orientation) {
      case "parallel":
         return PARALLEL;
      case "series":
         return SERIES;
      default:
         console.log("correctForOrientationPronunciation(): Invalid orientation value: " + orientation.value);
         return "";
   }
}

function isResistorValueValid(resistor) {
   // console.log("isResistorValueValid: " + JSON.stringify(resistor));
   // check that the resistance isn't 0, and that we were passed a value through the intent.
   // check that this was in response to a reprompt.  If we don't have any other information in sessionAttributes, respond with help.
   if (resistor) {
      if (resistor.value) {
         if (!isNaN(parseInt(resistor.value))) {
            return true;
         }
         console.log("isResistorValueValid(): Invalid resistor value. " + JSON.stringify(resistor));
         return false;
      }
      console.log("isResistorValueValid(): Resistor value was not in the intent. " + JSON.stringify(resistor));
      return false;
   }
   console.log("isResistorValueValid(): Resistor was not in the intent. " + JSON.stringify(resistor));
   return false;
}

function isOrientationValueValid(orientation) {
   // console.log("isOrientationValueValid: " + JSON.stringify(orientation));
   if (orientation) {
      if (orientation.value) {
         return correctForOrientationPronunciation(orientation.value);
      }
      console.log("isOrientationValueValid(): Orientation value was not in the intent. " + JSON.stringify(orientation));
      return "";
   }
   console.log("isOrientaitonValueValid(): Orientation was not in the intent" + JSON.stringify(orientation));
   return "";
}

function calculateResistanceIntent(intent, session, callback) {
   console.log("calculateResistanceIntent: " + JSON.stringify(intent));

   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var repromptText = "";
   var resistorA = NaN;
   var resistorB = NaN;
   var orientation = "";
   var resistance = NaN;
   var repromptFor =  { "resistorA": false,
                        "resistorB": false,
                        "orientation": false };

   // Intent structure if resistorB isn't stated.
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

   // Intent has precedence over sessionAttributes.

   // if the orientation is not passed in with the intent, check that we already have one in session.attributes
   // store orientation in sessionAttributes so that if we need to prompt for something else, it will be stored.
   // it should always be stored as either SERIES or PARALLEL.
   orientation = isOrientationValueValid(intent.slots.orientation);
   if (orientation) {
      sessionAttributes.slots.orientation.value = orientation;
   } else if (sessionAttributes.slots.orientation.value) {
      orientation = sessionAttributes.slots.orientation.value;
   } else {
      repromptFor.orientation = true;
   }

   // whenever a single resistor is passed in, it is passed in on resistorB.
   if (isResistorValueValid(intent.slots.resistorA)) {
      resistorA = parseInt(intent.slots.resistorA.value);
      sessionAttributes.slots.resistorA.value = resistorA;
   } else if (isResistorValueValid(intent.slots.resistorB) && !sessionAttributes.slots.resistorA.value) {
      // if there is no resistorA, but there is a resistorB, move the value of resistorB to resistorA
      resistorA = parseInt(intent.slots.resistorB.value);
      sessionAttributes.slots.resistorA.value = resistorA;
      // delete the value for resistorB since we need to check if there is a decodeResistor.
      delete intent.slots.resistorB.value;
   } else if (sessionAttributes.slots.resistorA.value) {
      resistorA = sessionAttributes.slots.resistorA.value;
   } else {
      repromptFor.resistorA = true;
   }

   if (isResistorValueValid(intent.slots.resistorB)) {
      resistorB = parseInt(intent.slots.resistorB.value);
      sessionAttributes.slots.resistorB.value = resistorB;
   } else if (sessionAttributes.slots.resistorB.value) {
      resistorB = sessionAttributes.slots.resistorB.value;
   } else if (sessionAttributes.decodedResistor && !repromptFor.resistorA) {
      resistorB = sessionAttributes.decodedResistor;
   } else {
      repromptFor.resistorB = true;
   }

   console.log("calculateResistanceIntent(): " + repromptFor.orientation + ", " + repromptFor.resistorA + ", " + repromptFor.resistorB);
   if (repromptFor.orientation && repromptFor.resistorA && repromptFor.resistorB) {
      console.log("Someting is very wrong.  Somehow we got to this intent with no slots in the intent filled.");
      session.attributes = sessionAttributes;
      handleGetHelpRequest(intent, session, callback);
   }
   if (repromptFor.orientation && !repromptFor.resistorA && !repromptFor.resistorB) {
      speechOutput = "Please say series or parallel to find the equivalent resistance of " + resistorA + " ohms and " + resistorB + " ohms.";
      repromptText = "Would you like series or parallel?";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false))
   }
   if (repromptFor.orientation && !repromptFor.resistorA && repromptFor.resistorB) {
      speechOutput = "Please say an orientation and another resistor value to use with " + resistorA + ".";
      repromptText = "What orientation and other resistor value would you like to use?";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false));
   }
   if (!repromptFor.orientation && repromptFor.resistorA && repromptFor.resistorB) {
      speechOutput = "Please say the two resistor values you would like to find the " + orientation + " resistance of";
      if (sessionAttributes.decodedResistor) {
         speechOutput += ", or say one resistor value to use the resistor you just decoded. ";
      } else {
         speechOutput += ". ";
      }
      repromptText = "What resistor values would you like to use?";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false));
   }
   if (!repromptFor.orientation && !repromptFor.resistorA && repromptFor.resistorB) {
      speechOutput = "Please say the resistor value you would like to use to find the " + orientation + " resistance with " + resistorA + ".";
      repromptText = "What resistor value would you like to use?";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, repromptText, false));
   }
   if (repromptFor.resistorA && !repromptFor.resistorB) {
      console.log("Something is very wrong.  We should never have a resistorB without a resistorA at this point.");
   }

   if (!repromptFor.orientation && !repromptFor.resistorA && !repromptFor.resistorA) {
      switch (correctForOrientationPronunciation(orientation)) {
         case PARALLEL:
            resistance = (resistorA * resistorB) / (resistorA + resistorB);
            break;
         case SERIES:
            resistance = resistorA + resistorB;
            break;
         default:
            console.log("Something is very wrong, but remember: Don't Panic and always carry a towel.  ");
            console.log(orientation + " caused something bad to happen in correctForOrientationPronunciation().");
            break;
      }
      console.log("\nresistorA:" + resistorA + "\nresistorB:" + resistorB + "\norientation:" + orientation + "\nresistance:" + resistance);
      sessionAttributes = clearSessionAttributes();

      // TODO: adjust number of decimal places depending on the size of resistance
      speechOutput = "The calculated resistance of " + resistorA + " and " + resistorB + " in " + orientation + " is " + resistance.toFixed(2) + ".  " +
                     "I'm ready to decode a resistor or calculate an equivalent resistance. ";
      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
   } else {
      console.log("calculateResistanceIntent(): At the end of the function without reprompt or calculating resistance.  Something needs to be fixed!  " +
                  "sessionAttributes: " + JSON.stringify(sessionAttributes));
      speechOutput = "I'm sorry, I experienced a technical difficulty.  Please try your request again. ";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
   }

}

function buildCalculateResistanceIntent(resistorA, resistorB, orientation) {
   console.log("buildCalculateResistanceIntent(): resistorA:" + resistorA + ", resistorB:" + resistorB + ", orientation:" + orientation);
   var intent =   { "name": "calculateResistanceIntent",
                     "slots": {
                       "resistorA": {
                           "name": "resistorA"
                        },
                        "resistorB": {
                           "name": "resistorB"
                        },
                        "orientation": {
                           "name": "orientation"
                        }
                     }
                  };

   // if there is no value for a slot, it is passed from the alexa app missing.
   // the intent expects the values to be strings.
   if (resistorA) {
      intent.slots.resistorA.value = resistorA.toString();
   }
   if (resistorB) {
      intent.slots.resistorB.value = resistorB.toString();
   }
   if (orientation) {
      intent.slots.orientation.value = orientation;
   }
   return intent;
}

// this should only be called if we need one more resistor value, so we should always deal with resistorB.
function getResistorResponseIntent(intent, session, callback) {
   console.log("getResistorResponseIntent(): " + JSON.stringify(intent));

   var sessionAttributes = session.attributes;
   var speechOutput = ""
   var resistorA = NaN;
   var resistorB = NaN;
   var orientation = "";

   if (isResistorValueValid(intent.slots.resistorB)) {
      resistorB = parseInt(intent.slots.resistorB.value);
   } else {
      speechOutput = "I do not understand the resistor value you are trying to say.";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
   }

   intent = buildCalculateResistanceIntent(resistorA, resistorB, orientation);
   session.attributes = sessionAttributes;
   calculateResistanceIntent(intent, session, callback);
}

function getOrientationResponseIntent(intent, session, callback) {
   console.log("getOrientationResponseIntent(): " + JSON.stringify(intent));

   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var resistorA = NaN;
   var resistorB = NaN;
   var orientation = "";

   // when we store orientation in the sessionAttributes, it should always be either PARALLEL or SERIES.
   orientation = isOrientationValueValid(intent.slots.orientation);
   if (!orientation) {
      speechOutput = "I do not understand the orientation that you are trying to say.";
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
   }

   intent = buildCalculateResistanceIntent(resistorA, resistorB, orientation);
   session.attributes = sessionAttributes;
   calculateResistanceIntent(intent, session, callback);
}

function getResistorDecodeIntent(intent, session, callback) {
   console.log("getResistorDecodeIntent(): " + JSON.stringify(intent));

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
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
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
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
   }

   // TODO: reject black black black and other special invalid color combinations.

   var resistorValue = (resistorColors[firstColor][0] * 10 + resistorColors[secondColor][0]) * resistorColors[thirdColor][1];
   var resistorOutput = "";
   var tempResistorValue;

   // if ((resistorValue >=.))
   if ((resistorValue >= 1000) && (resistorValue < 999999)) {
      tempResistorValue = resistorValue / 1000;
      resistorOutput = tempResistorValue + " kila-ohms.";
   } else if ((resistorValue >= 1000000) && (resistorValue < 999999999)) {
      tempResistorValue = resistorValue / 1000000;
      resistorOutput = tempResistorValue + " meg-ohms.";
   } else if ((resistorValue >= 1000000000) && (resistorValue < 999999999999)) {
      tempResistorValue = resistorValue / 1000000000;
      resistorOutput = tempResistorValue + " giga-ohms.";
   } else {
      resistorOutput = resistorValue + " ohms";
      // make ohms singular if there is only 1.
      if (resistorValue == "1") {
         resistorOutput = resistorOutput.slice(0,-1);
      }
   }

   speechOutput = "The value of the resistor is " + resistorOutput +
                  ".  Please state another resistor value and an orientation to find the equivalent resistance";
   // console.log(speechOutput);
   // console.log("decodedResistor: " + resistorValue);
   sessionAttributes.decodedResistor = resistorValue;

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
}

function getColorInfoIntent(intent, session, callback) {
   console.log("getColorInfoIntent(): " + JSON.stringify(intent));
   // This intent doesn't change the sessionAttributes, so just pass back what is already there.
   var sessionAttributes = session.attributes;
   var speechOutput = "";
   var color = intent.slots.color.value;

   if (isColorInvalid(color)) {
      speechOutput = color + " is not a valid color.  Please state a valid color. ";
   }
   if (speechOutput !== "") {
      callback(sessionAttributes, buildSpeechletResponseWithoutCard(CARD_TITLE, speechOutput, "", false));
   }

   speechOutput = getColorInfo(color) + "  Please state the three color bands to decode your resistor's value.  ";

   callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", false));
}
