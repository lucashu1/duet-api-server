"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _refugeeHelpers = _interopRequireDefault(require("../util/refugeeHelpers.js"));
var _cluster = require("cluster");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

// Get needs for either 1 or all beneficiaries
function getNeeds(_x, _x2) {return _getNeeds.apply(this, arguments);}function _getNeeds() {_getNeeds = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {var beneficiaryObj, allBeneficiaryObjs;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (!

            req.query.beneficiary_id) {_context.next = 9;break;}_context.next = 3;return (
              _refugeeHelpers["default"].getSingleBeneficiaryInfoAndNeeds(req.query.beneficiary_id));case 3:beneficiaryObj = _context.sent;if (
            beneficiaryObj) {_context.next = 6;break;}return _context.abrupt("return",
            res.json({
              msg: "Beneficiary does not exist" }));case 6:


            res.json(beneficiaryObj);_context.next = 15;break;case 9:_context.next = 11;return (



              _refugeeHelpers["default"].getAllBeneficiariesInfoAndNeeds());case 11:allBeneficiaryObjs = _context.sent;if (
            allBeneficiaryObjs) {_context.next = 14;break;}return _context.abrupt("return",
            res.json({
              msg: "No beneficiaries exist" }));case 14:


            res.json(allBeneficiaryObjs);case 15:case "end":return _context.stop();}}}, _callee);}));return _getNeeds.apply(this, arguments);}var _default =



{
  getNeeds: getNeeds };exports["default"] = _default;