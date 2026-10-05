// datasetController.js — returns MNIST dataset metadata
const fs = require("fs");
const path = require("path");
const { resolveDatasetPath } = require("../services/cppRunner");

const getDatasetInfo = (req, res) => {
  const datasetPath = resolveDatasetPath();
  const exists = fs.existsSync(datasetPath);

  let fileSizeBytes = null;
  if (exists) {
    try {
      fileSizeBytes = fs.statSync(datasetPath).size;
    } catch (_) {}
  }

  res.json({
    name: "MNIST Digit Recognizer",
    source: "https://www.kaggle.com/competitions/digit-recognizer/data",
    file: "dataset/train.csv",
    exists,
    fileSizeMB: fileSizeBytes ? (fileSizeBytes / 1e6).toFixed(2) : null,
    rows: 42000,
    columns: 785,
    pixelsPerImage: 784,
    totalPixels: 32928000,
    bins: 256,
    pixelRange: { min: 0, max: 255 },
    labelColumn: "label",
    pixelColumns: "pixel0 through pixel783",
  });
};

module.exports = { getDatasetInfo };
