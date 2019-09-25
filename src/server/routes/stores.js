import express from "express";
import controller from "./../controller/stores";

const router = express.Router();

router.post("/login", controller.login);

// test route to send a TransferWise payment to a store
// router.post("/testSendBankTransfer", (req, res) => {
//   controller.sendBankTransfer(req, res);
// });

export default router;
