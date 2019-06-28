"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("../util/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}
var sgMail = _config["default"].sendgridInit(); // Sendgrid

function sendDonorThankYouEmail(donorInfo) {
  // Send donor thank-you email
  // Takes in donorInfo object with "email", "firstName" fields
  var msg = {
    to: donorInfo.email,
    from: "duet@giveduet.org",
    templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
    dynamic_template_data: {
      name: donorInfo.firstName } };



  sgMail.
  send(msg).
  then(function () {
    console.log("Donation confirmation sent ".concat(donorInfo.email, " to successfully."));
  })["catch"](
  function (error) {
    console.error(error.toString());
  });
}function

sendTypeformErrorEmail(_x) {return _sendTypeformErrorEmail.apply(this, arguments);}function _sendTypeformErrorEmail() {_sendTypeformErrorEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(typeformErrorInfo) {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            msg = {
              to: "duet.giving@gmail.com",
              from: "duet.giving@gmail.com",
              templateId: "d-6ecc5d7df32c4528b8527c248a212552",
              dynamic_template_data: {
                formTitle: typeformErrorInfo.formTitle,
                eventId: typeformErrorInfo.eventId,
                error: typeformErrorInfo.err } };


            sgMail.
            send(msg).
            then(function () {
              console.log("Sendgrid error message delived successfully.");
            })["catch"](
            function (error) {
              console.error(error.toString());
            });case 2:case "end":return _context.stop();}}}, _callee);}));return _sendTypeformErrorEmail.apply(this, arguments);}function


sendStoreNotificationEmail(_x2) {return _sendStoreNotificationEmail.apply(this, arguments);}function _sendStoreNotificationEmail() {_sendStoreNotificationEmail = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(storeNotificationInfo) {var msg;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
            msg = {
              to: storeNotificationInfo.recipientList,
              from: "duet@giveduet.org",
              templateId: "d-435a092f0be54b07b5135799ac7dfb01",
              dynamic_template_data: {
                storeName: storeNotificationInfo.name,
                items: storeNotificationInfo.updatedItems } };



            sgMail.
            sendMultiple(msg).
            then(function () {
              console.log("Message delivered to ".concat(storeNotificationInfo.name, " at ").concat(storeNotificationInfo.email, " successfully."));
            })["catch"](
            function (error) {
              console.error("Error: " + error.toString());
              return;
            });case 2:case "end":return _context2.stop();}}}, _callee2);}));return _sendStoreNotificationEmail.apply(this, arguments);}var _default =


{
  sendDonorThankYouEmail: sendDonorThankYouEmail,
  sendStoreNotificationEmail: sendStoreNotificationEmail,
  sendTypeformErrorEmail: sendTypeformErrorEmail };exports["default"] = _default;