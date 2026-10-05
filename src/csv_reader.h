/**
 * csv_reader.h
 *
 * Declares the CsvReader class responsible for reading the MNIST
 * Kaggle train.csv dataset into memory.
 *
 * File format expected:
 *   label,pixel0,pixel1,...,pixel783
 *   <int>,<int>,...,<int>
 *
 * Each pixel value is in [0, 255].
 * The label column is preserved but not used for histogram computation.
 */

#pragma once

#include <string>
#include <vector>
#include <array>
#include <cstdint>
#include <stdexcept>

// ── Constants ─────────────────────────────────────────────────────────────────

/// Number of pixel columns in each MNIST row (28x28 = 784)
constexpr int NUM_PIXELS = 784;

/// Number of fields per CSV row (label + 784 pixels)
constexpr int NUM_FIELDS = NUM_PIXELS + 1;

/// Number of intensity bins in the histogram (0-255 inclusive)
constexpr int HIST_BINS  = 256;

// ── Data structures ───────────────────────────────────────────────────────────

/// One MNIST image row: a label and 784 pixel values.
struct MnistRow {
    int label;                               ///< Digit class 0-9
    std::array<uint8_t, NUM_PIXELS> pixels;  ///< Grayscale pixel values [0,255]
};

// ── CsvReader ─────────────────────────────────────────────────────────────────

class CsvReader {
public:
    /**
     * @brief  Load the MNIST CSV file at the given path.
     * @param  filepath     Path to train.csv
     * @param  skip_header  If true (default), the first line is treated as header.
     * @throws std::runtime_error if the file cannot be opened or is malformed.
     */
    explicit CsvReader(const std::string& filepath, bool skip_header = true);

    /// Return a const reference to the loaded rows.
    [[nodiscard]] const std::vector<MnistRow>& rows() const noexcept;

    /// Return the number of data rows loaded.
    [[nodiscard]] std::size_t row_count() const noexcept;

    /// Return the number of pixel columns (always NUM_PIXELS = 784).
    [[nodiscard]] int pixel_count() const noexcept;

private:
    std::vector<MnistRow> rows_;

    /// Parse a single CSV line into a MnistRow.
    /// Returns true on success, false on any parse error.
    static bool parse_line(const std::string& line, MnistRow& out);
};
