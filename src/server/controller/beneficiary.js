// Imports
import beneficiaryHelpers from "../util/beneficiaryHelpers.js";
import matchingHelpers from "../util/matchingHelpers.js";
import fbHelpers from "../util/fbHelpers.js";
import errorHandler from "../util/errorHandler.js";

// Get needs for either 1 or all beneficiaries
async function getBeneficiary(req, res) {
  try {
    // Specify ID or username
    // e.g. /api/beneficiaries/123, or /api/beneficiaries/user123
    if (req.params && req.params.idOrUsername) {
      let beneficiaryObj;
      const isId = /^\d+$/.test(req.params.idOrUsername); // contains only digits --> must be an ID
      if (isId) {
        console.log(`getBeneficiaryNeeds: getting beneficiary by ID: ${req.params.idOrUsername}`);
        beneficiaryObj = await beneficiaryHelpers.getBeneficiaryById(req.params.idOrUsername, {withNeeds: true});
      }
      else {
        console.log(`getBeneficiaryNeeds: getting beneficiary by username: ${req.params.idOrUsername}`);
        beneficiaryObj = await beneficiaryHelpers.getBeneficiaryByUsername(req.params.idOrUsername, {withNeeds: true});
      }
      if (!beneficiaryObj) {
        return res.status(404).json({
          msg: "Beneficiary does not exist"
        });
      }
      return res.json(beneficiaryObj);
    }
    // No beneficiary ID specified --> get all beneficiary info and needs
    // e.g. /api/beneficiary
    console.log(`getBeneficiaryNeeds: getting all beneficiaries`);
    const allBeneficiaryObjs = await beneficiaryHelpers.getAllBeneficiaries({withNeeds: true});
    if (!allBeneficiaryObjs) {
      return res.json({
        msg: "No beneficiaries exist"
      });
    }
    return res.json(allBeneficiaryObjs);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/getBeneficiaryNeeds");
    return res.status(500).send();
  }
}

// Get 1 matched beneficiary, and N other beneficiaries (for carousel)
async function getBeneficiaryMatch(req, res) {
  try {
    // note: if req.query.numAdditionalBeneficiaries is undefined, then this will return all additional beneficiaries
    const matchedAndAdditionalBeneficiaries = await matchingHelpers.getMatchedAndAdditionalBeneficiaries(req.query.numAdditionalBeneficiaries);
    matchingHelpers.logBeneficiaryMatchInDB(matchedAndAdditionalBeneficiaries.matchedBeneficiary.beneficiaryId);
    return res.json(matchedAndAdditionalBeneficiaries);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/getBeneficiaryMatch");
    return res.status(500).send();
  }
}

async function getBeneficiaryScores(req, res) {
  try {
    if (req.body.baselineScore && 
      req.body.totalEurDonatedWeight && 
      req.body.recentEurDonatedWeight &&
      req.body.minItemPriceWeight) {
      // use custom weights
      const scoreWeights = req.body;
      console.log('getBeneficiaryScores: getting beneficiary scores with custom weights...');
      const beneficiaryScores = await matchingHelpers.getBeneficiaryScores(scoreWeights);
      return res.json(beneficiaryScores);
    } 
    // use weights from env vars
    console.log('getBeneficiaryScores: getting beneficiary scores with custom weights...');
    const beneficiaryScores = await matchingHelpers.getBeneficiaryScores();
    return res.json(beneficiaryScores);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/getBeneficiaryScores");
    return res.status(500).send();
  }
}

async function makeFBAnnouncementToVisibleBeneficiaries(req, res) {
  try {
    const { messageTemplates } = req.body;
    // check to make sure all languages are accounted for
    if (!messageTemplates.en || !messageTemplates.fa || !messageTemplates.ar) {
      console.log(`Tried to make FB announcement, but not all languages were included! messageTemplates: ${JSON.stringify(messageTemplates)}`);
      return res.sendStatus(400);
    }
    await fbHelpers.sendFBMessageToAllVisibleBeneficiaries(messageTemplates);
    console.log(`Successfully made FB announcement using messageTemplates: ${JSON.stringify(messageTemplates)}`);
    return res.sendStatus(200);
  } catch (err) {
    errorHandler.handleError(err, "beneficiary/makeFBAnnouncementToVisibleBeneficiaries");
    return res.sendStatus(500);
  }
}

export default { 
  getBeneficiary,
  getBeneficiaryMatch,
  getBeneficiaryScores,
  makeFBAnnouncementToVisibleBeneficiaries
};
