// Intent structure if one of the resistor values isn't stated.
var sessionAttributes = {  "orientation"  : "",
                           "resistorA"    : NaN,
                           "resistorB"    : NaN,
                           "lastResistor" : NaN
                        };

console.log(sessionAttributes);
console.log(sessionAttributes.orientation);
console.log(sessionAttributes.resistorA);
console.log(sessionAttributes.lastResistor);
if (sessionAttributes.orientation) {
   console.log("orientation: " + sessionAttributes.orientation);
} else {
   console.log("orientaiton: invalid");
}
if (sessionAttributes.resistorA) {
   console.log("resistorA: " + sessionAttributes.resistorA);
} else {
   console.log("resistorA: invalid")    ;
}
sessionAttributes.value = "parallel";
console.log(sessionAttributes);

console.log("\n----------------------------------------------------------------------------------\n");
var intent = {
      "name": "CalculateResistance",
      "slots": {
         "resistor1": {
            "name": "resistorA",
            "value": "100" },
         "resistor2": {
            "name": "resistorB" },
         "orientation1": {
            "name": "orientation",
            "value": "para" },
         "orientation2": {
            "name": "orientation",
            "value": "series" },
         "orientation3": {
            "name": "orientation" }
      }
   }
console.log(intent);
validateResistor(intent.slots.resistor1);
validateResistor(intent.slots.resistor2);
validateResistor(intent.slots.resistor3);
validateOrientation(intent.slots.orientation);
validateOrientation(intent.slots.orientation1);
validateOrientation(intent.slots.orientation2);
validateOrientation(intent.slots.orientation3);



function validateResistor(resistor) {
   console.log("\nvalidateResistor");
   console.log(resistor);// check that the resistance isn't 0, and that we were passed a value through the intent.
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

function validateOrientation(orientation) {
   console.log("\nvalidateOrientation");
   console.log(orientation);
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
}

console.log("\n----------------------------------------------------------------------------------\n");
intent = { "name": "calcualteResistanceIntent",
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
console.log(intent);
console.log("\n");
intent.slots.resistorA.value = 100;
intent.slots.orientation.value = "parallel";
console.log(intent);