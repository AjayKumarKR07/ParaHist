const express = require("express");
const router = express.Router();
const { getDatasetInfo } = require("../controllers/datasetController");

router.get("/", getDatasetInfo);

module.exports = router;
