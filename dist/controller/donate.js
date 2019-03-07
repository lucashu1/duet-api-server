"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _config = _interopRequireDefault(require("./../config/config.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var conn = _config.default.dbInitConnect();

function fulfillNeed(req, res) {
  var body = req.body;
  if (body.itemId) {
    // set item to fulfilled
    conn.execute(
    "UPDATE items SET is_fulfilled=true WHERE item_id=?",
    [body.itemId],
    function (err) {
      if (err) {
        console.log(err);
      } else {
        // add entry into donations table
        conn.execute(
        "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donor_phone,donation_amt_usd) " +
        " VALUES (NOW(),?,?,?,?,?)",
        [
        body.firstName,
        body.lastName,
        body.email,
        body.phoneNumber,
        body.amount],

        function (err) {
          if (err) {
            console.log(err);
          } else {
            res.status(200).send();
          }
        });

      }
    });

  }
}var _default =

{ fulfillNeed: fulfillNeed };exports.default = _default;