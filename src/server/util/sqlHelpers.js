// Imports
require("dotenv").config();
import config from '../util/config.js';
import errorHandler from './errorHandler.js';

// -------------------- FACEBOOK MESSENGER -------------------- //

// Insert message into database
async function insertMessageIntoDB(message) {
  let source = message['source'];
  let sender = message['sender'];
  let recipient = message['recipient'];
  let content = message['content'];

  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "INSERT INTO messages (source, sender, recipient, message) VALUES (?,?,?,?)",
      [source, sender, recipient, content]
    );
    console.log("Successfully inserted message into database: %j", message);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelper/insertMessageIntoDB");
    throw err;
  }
}

// Get all info necessary to send a pickup notification
async function getFBMessengerInfoFromItemId(itemId) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "SELECT " +
      "items.name AS item_name, items.pickup_code, items.link, " +
      "beneficiaries.fb_psid, beneficiaries.first_name, beneficiaries.last_name, " +
      "stores.name AS store_name, " +
      "donor_fname, donor_lname, donor_country " +
      "FROM items " +
      "INNER JOIN beneficiaries ON items.beneficiary_id = beneficiaries.beneficiary_id " +
      "INNER JOIN stores ON items.store_id = stores.store_id " +
      "LEFT JOIN donations ON items.donation_id = donations.donation_id " +
      "WHERE items.item_id=?",
      [itemId]
    );
    if (rows.length === 0) {
      console.log("No rows found in getFBMessengerInfoFromItemId! Item ID: " + itemId);
      return null;
    }
    else {
      return rows[0];
    }
  } catch (err) {
    errorHandler.handleError(err, "sqlHelper/getFBMessengerInfoFromItemId");
    throw err;
  }
}

// -------------------- DONATIONS -------------------- //

async function insertDonationIntoDB(donationInfo) {
  // Insert donation info into DB, return insert ID
  let insertDonationQuery = "";
  let insertDonationValues = [];
  try {
    let conn = await config.dbInitConnectPromise();
    if (donationInfo.email) {
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donor_email,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?,?)";
      insertDonationValues = [
        donationInfo.firstName,
        donationInfo.lastName,
        donationInfo.email,
        donationInfo.amount,
        donationInfo.bankTransferFee,
        donationInfo.serviceFee,
        donationInfo.country
      ]
    } else {
      insertDonationQuery = "INSERT INTO donations (timestamp,donor_fname,donor_lname,donation_amt_usd,bank_transfer_fee_usd,service_fee_usd,donor_country) " +
        " VALUES (NOW(),?,?,?,?,?,?)";
      insertDonationValues = [
        donationInfo.firstName,
        donationInfo.lastName,
        donationInfo.amount,
        donationInfo.bankTransferFee,
        donationInfo.serviceFee,
        donationInfo.country
      ]
    }
    let [results, fields] = await conn.execute(insertDonationQuery, insertDonationValues);
    console.log("Successfully entered donation into DB: %j", donationInfo);
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/insertDonationIntoDB");
    throw err;
  }
}

async function markItemAsDonated(itemId, donationId) {
  // Mark item as donated, note that it requires store notification
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items " +
      "INNER JOIN stores USING(store_id) " +
      "SET status='PAID', " +
      "donation_id=?, " +
      "in_notification=CASE payment_method WHEN 'paypal' THEN 1 ELSE in_notification END " +
      "WHERE item_id=?",
      [donationId, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/markItemAsDoanted");
    throw err;
  }
}

// -------------------- TYPEFORM -------------------- //

async function insertItemFromTypeform(itemInfo) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "INSERT INTO items (name,size,price_euros,beneficiary_id,category_id,comment,status,store_id,link,in_notification) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?)",
      [itemInfo.itemNameEnglish,
      itemInfo.size,
      itemInfo.price,
      itemInfo.beneficiaryId,
      itemInfo.categoryId,
      itemInfo.comment,
      itemInfo.status,
      itemInfo.storeId,
      itemInfo.photoUrl,
      itemInfo.in_notification]
    );
    return results.insertId;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/insertItemFromTypeform");
    throw err;
  }
}

async function updateItemPickupCode(itemId, pickupCode) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET pickup_code=? WHERE item_id=?",
      [pickupCode, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemPickupCode");
    throw err;
  }
}

async function updateItemPhotoLink(itemId, photoUrl) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      "UPDATE items SET link=? WHERE item_id=?",
      [photoUrl, itemId]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemPhotoLink");
    throw err;
  }
}

async function getItemNameTranslation(language, itemName) {
  // Get name_english, category_id from itemName in given language
  try {
    let conn = await config.dbInitConnectPromise();
    let [matchedItemNames, fields] = await conn.query(
      "SELECT name_english, category_id FROM item_types WHERE ?? LIKE ?",
      ["name_" + language, "%" + itemName + "%"]
    );
    return matchedItemNames[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemNameTranslation");
    throw err;
  }
}

// -------------------- PAYPAL -------------------- //
async function getPayoutInfo(itemIds) {
  // Get stores' Payout info for list of items
  // Returns a list containing payout info for each store that we have to send a payout to
  try {
    let conn = await config.dbInitConnectPromise();
    let [rows, fields] = await conn.query(
      "SELECT stores.paypal AS paypal, " +
      "payouts.payment_amount AS payment_amount, " +
      "payouts.item_ids AS item_ids " +
      "FROM stores AS stores " +
      "INNER JOIN (" +
      "SELECT store_id, " +
      "SUM(price_euros) AS payment_amount, " +
      "GROUP_CONCAT(item_id) AS item_ids " +
      "FROM items " +
      "WHERE item_id IN (?) " +
      "GROUP BY store_id" +
      ") AS payouts " +
      "USING(store_id) " +
      "WHERE stores.payment_method = 'paypal'",
      [itemIds]);
    // convert item_ids from string to list
    rows.forEach(singleStoreResult => {
      singleStoreResult.item_ids = singleStoreResult.item_ids.split(",");
    });
    return rows;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getPayoutInfo");
    throw err;
  }
}

// -------------------- STORES -------------------- //
async function getStoreIdFromName(storeName) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query("SELECT store_id FROM stores WHERE name=?", [storeName]);
    return results[0].store_id;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreIdFromName");
    throw err;
  }
}

async function getStoreInfoFromEmail(email) {
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT store_id, name, email FROM stores WHERE email=?",
      [email]
    );
    if (results.length === 0) {
      return null;
    } else {
      return results[0];
    }
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoreInfoFromEmail");
    throw err;
  }
}

async function getStoresThatNeedNotification() {
  // Return a list of store objects that need notifying
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query("SELECT * from stores where needs_notification=1");
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getStoresThatNeedNotification");
    throw err;
  }
}

async function setStoreNotificationFlags(itemIds) {
  // Set store notification flag to 1 for all stores that interact with these items
  try {
    let conn = await config.dbInitConnectPromise();

    // Get list of all store IDs that need notification flag set
    let [storeIdResults, fields] = await conn.query(
      "SELECT store_id FROM items WHERE item_id IN (?)",
      [itemIds]);
    let storeIdsList = storeIdResults.map(storeIdResult => storeIdResult.store_id);

    // Set needs_notification to 1
    await conn.query(
      "UPDATE stores SET needs_notification=1 WHERE store_id IN (?) " +
      "AND payment_method='paypal'",
      [storeIdsList]);
    console.log(`Notification flag updated sucessfully for stores: ${storeIdsList}`)
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setStoreNotificationFlags");
    throw err;
  }
}

async function setSingleStoreNotificationFlag(storeId) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=1 where store_id=?",
      [storeId]
    );
    console.log("Set store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setSingleStoreNotificationFlag");
    throw err;
  }
}

async function unsetSingleStoreNotificationFlag(storeId) {
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=0 where store_id=?",
      [storeId]
    );
    console.log("Unset store notification flag for store " + storeId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/unsetSingleStoreNotificationFlag");
    throw err;
  }
}

async function resetAllStoreNotificationFlags() {
  // Reset all stores' notification flags
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query("UPDATE stores SET needs_notification=0");
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/resetAllStoreNotificationFlags");
    throw err;
  }
}

async function getItemsForNotificationEmail(store_id) {
  // Get items to notify the given store about
  try {
    let conn = await config.dbInitConnectPromise();
    let updatedItems = [];
    let [results, fields] = await conn.query(
      `SELECT * from items where store_id=? and in_notification=1`,
      [store_id]
    );
    if (results.length === 0) {
      console.log("sqlHelpers/getItemsForNotificationEmail: No items included in notification");
    }
    else {
      let item;
      results.forEach(function (obj) {
        item = {
          itemId: obj.item_id,
          itemImage: obj.link,
          itemName: obj.name,
          itemPrice: obj.price_euros,
        }
        updatedItems.push(item);
      });
    }
    return updatedItems;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsForNotificationEmail");
    throw err;
  }
}

// -------------------- ITEMS -------------------- //
let itemsQuery =
  "SELECT item_id, size, link, items.name, pickup_code, price_euros, " +
  "status, comment, store_id, icon_url, " +
  "stores.name as store_name, stores.google_maps as store_maps_link, " +
  "beneficiary_id, beneficiaries.first_name as beneficiary_first, beneficiaries.last_name as beneficiary_last, " +
  "family_image_url, has_family_photo, " +
  "donations.timestamp as donation_timestamp, donations.donor_email as donor_email, " +
  "donations.donor_fname as donor_first, donations.donor_lname as donor_last, donations.donor_country as donor_country " +
  "FROM items " +
  "INNER JOIN categories USING(category_id) " +
  "INNER JOIN stores USING(store_id) " +
  "INNER JOIN beneficiaries USING(beneficiary_id) " +
  "LEFT JOIN donations USING(donation_id)";

async function getItem(itemId) {
  // Get single item
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE item_id=?",
      [itemId]
    );
    if (results.length === 0) {
      return null;
    }
    else {
      return results[0];
    }
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItem");
    throw err;
  }
}

async function getItemsForStore(storeId) {
  // Get all items associated with this store
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE store_id=?",
      [storeId]
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsForStore");
    throw err;
  }
}

async function getAllItems() {
  // Get all items associated with this store
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery
    );
    if (results.length === 0) {
      return null;
    }
    else {
      return results;
    }
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getAllItems");
    throw err;
  }
}

async function getItemsWithStatus(status) {
  // Get all items associated with this store
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery + " WHERE status=?",
      [status]
    );
    if (results.length === 0) {
      return [];
    }
    else {
      return results;
    }
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getItemsWithStatus");
    throw err;
  }
}

async function updateItemStatus(newStatus, itemId) {
  try {
    let conn = await config.dbInitConnectPromise();
    if (newStatus === "PAID") {
      await conn.query(
        `UPDATE items SET status=?, in_notification=1 WHERE item_id = ?`,
        [newStatus, itemId]
      );
    } else {
      await conn.query(
        `UPDATE items SET status=? WHERE item_id = ?`,
        [newStatus, itemId]
      );
    }
    console.log("Successfully updated item status to " + newStatus + " for item " + itemId);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/updateItemStatus");
    throw err;
  }
}


async function setItemNotificationFlag(item_id) {
  // Mark single item as needing a notification
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=1 where item_id = ?`,
      [item_id]
    );
    console.log("Set notification flag for item " + item_id);
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/setItemNotificationFlag");
    throw err;
  }
}

async function unsetItemsNotificationFlag(item_ids) {
  // Mark all items in item_ids as no longer needing notification (after sending batch email)
  try {
    let conn = await config.dbInitConnectPromise();
    await conn.query(
      `UPDATE items SET in_notification=0 where item_id IN (?)`,
      [item_ids]
    );
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/unsetItemsNotificationFlag");
    throw err;
  }
}


// -------------------- BENEFICIARIES -------------------- //
let beneficiariesQuery = "SELECT beneficiary_id, first_name, last_name, story, " +
  "origin_city, origin_country, current_city, current_country, " +
  "family_image_url, has_family_photo, visible " +
  "FROM beneficiaries";

async function getBeneficiaryInfo(beneficiaryId) {
  // Get beneficiary info for 1 beneficiary
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      beneficiariesQuery +
      " WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    if (results.length === 0) {
      return null;
    }
    return results[0];
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getBeneficiaryInfo");
    throw err;
  }
}

async function getBeneficiaryNeeds(beneficiaryId) {
  // Get item needs for 1 beneficiary
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      itemsQuery +
      " WHERE beneficiary_id = ?",
      [beneficiaryId]
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getBeneficiaryInfo");
    throw err;
  }
}

// TODO: re-use itemsQuery?
async function getAllBeneficiaryInfoAndNeeds() {
  // Get beneficiary info and needs for all beneficiaries
  try {
    let conn = await config.dbInitConnectPromise();
    let [results, fields] = await conn.query(
      "SELECT beneficiary_id, first_name, last_name, story, " +
      "origin_city, origin_country, current_city, current_country, " +
      "family_image_url, has_family_photo, visible, " +
      "item_id, link, items.name, pickup_code, price_euros, comment, status, icon_url, " +
      "store_id, stores.name AS store_name, " +
      "donations.timestamp AS donation_timestamp, donor_fname, donor_lname, donor_country " +
      "FROM beneficiaries " +
      "INNER JOIN items USING(beneficiary_id) " + 
      "INNER JOIN categories USING(category_id) " +
      "INNER JOIN stores USING(store_id) " +
      "LEFT JOIN donations USING(donation_id) " +
      "ORDER BY beneficiary_id"
    );
    return results;
  } catch (err) {
    errorHandler.handleError(err, "sqlHelpers/getAllBeneficiaryInfoAndNeeds");
    throw err;
  }
}


export default {
  // FACEBOOK MESSENGER
  insertMessageIntoDB,
  getFBMessengerInfoFromItemId,

  // DONATIONS
  markItemAsDonated,
  insertDonationIntoDB,

  // TYPEFORM
  getItemNameTranslation,
  insertItemFromTypeform,
  updateItemPickupCode,
  updateItemPhotoLink,

  // PAYPAL
  getPayoutInfo,

  // STORES
  getStoreIdFromName,
  getStoreInfoFromEmail,
  getStoresThatNeedNotification,
  setStoreNotificationFlags,
  setSingleStoreNotificationFlag,
  unsetSingleStoreNotificationFlag,
  resetAllStoreNotificationFlags,
  getItemsForNotificationEmail,
  unsetItemsNotificationFlag,

  // ITEMS
  getItem,
  getItemsForStore,
  getAllItems,
  getItemsWithStatus,
  updateItemStatus,
  setItemNotificationFlag,
  unsetItemsNotificationFlag,

  // BENEFICIARIES
  getBeneficiaryInfo,
  getBeneficiaryNeeds,
  getAllBeneficiaryInfoAndNeeds
}