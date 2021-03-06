import currencyHelpers from "../util/currencyHelpers.js";
import errorHandler from "../util/errorHandler.js";

// Update currency rates
async function updateCurrencyRates(req, res) {
  try {
    await currencyHelpers.updateCurrencyRates();
    return res.status(200).send();
  } catch (err) {
    errorHandler.handleError(err, "currency/updateCurrencyRates");
    return res.status(500).send();
  }
}

// Get currency rates in openexchangerates format
async function getCurrencyRates(req, res) {
  try {
    const currencyRates = await currencyHelpers.getCurrencyRates();
    return res.json(currencyRates);
  } catch (err) {
    errorHandler.handleError(err, "currency/getCurrencyRates");
    return res.status(500).send();
  }
}

export default {
  // routes
  getCurrencyRates,

  // test routes
  updateCurrencyRates,
}
