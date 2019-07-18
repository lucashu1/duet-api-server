import sendgridHelpers from "./sendgridHelpers.js";

// Standard error handler: console log, and send us an email
function handleError(err, functionName = false) {
  err = JSON.stringify(err);
  try {
    if (functionName) {
      console.log("Error in " + functionName + ": " + err);
      sendgridHelpers.sendErrorEmail(err, functionName);
    }
    else {
      console.log(err);
      sendgridHelpers.sendErrorEmail(err, "unknownFunction");
    }
  } catch (err) {
    console.log("Error in errorHandler/handleError (lol): " + err);
  }
};

export default {
  handleError
};