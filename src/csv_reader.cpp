/**
 * csv_reader.cpp
 *
 * Efficient implementation of CsvReader for the MNIST Kaggle train.csv.
 *
 * Parsing strategy:
 *   - Read the file line by line with std::getline (buffered I/O via ifstream).
 *   - Parse each line by scanning characters manually (no string splits/copies)
 *     to avoid excessive heap allocations on 42,000 rows x 785 fields.
 *   - Each integer field is parsed with a simple inline accumulator.
 *   - Pixel values are validated to be in [0, 255].
 *
 * Memory layout:
 *   Each MnistRow holds: int (4 bytes) + 784 x uint8_t (784 bytes) = 788 bytes.
 *   Total for 42,000 rows: 42,000 * 788 = ~32.6 MB.
 */

#include "csv_reader.h"

#include <fstream>
#include <iostream>
#include <charconv>   // std::from_chars (C++17, fast integer parsing)
#include <cstring>

// ── Constructor ───────────────────────────────────────────────────────────────

CsvReader::CsvReader(const std::string& filepath, bool skip_header)
{
    std::ifstream file(filepath);
    if (!file.is_open()) {
        throw std::runtime_error("CsvReader: cannot open file '" + filepath + "'");
    }

    std::string line;

    // Skip header row
    if (skip_header) {
        if (!std::getline(file, line)) {
            throw std::runtime_error("CsvReader: file is empty or has no header: " + filepath);
        }
    }

    // Pre-allocate: MNIST train.csv has exactly 42,000 rows
    rows_.reserve(42000);

    std::size_t line_number = 1; // 1-indexed counting (header = line 1)
    MnistRow row;

    while (std::getline(file, line)) {
        ++line_number;

        // Skip blank lines (e.g., trailing newline at EOF)
        if (line.empty() || (line.size() == 1 && line[0] == '\r')) {
            continue;
        }

        // Strip Windows-style \r if present
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }

        if (!parse_line(line, row)) {
            throw std::runtime_error(
                "CsvReader: malformed data at line " + std::to_string(line_number) +
                ". Expected " + std::to_string(NUM_FIELDS) + " comma-separated integers.");
        }

        rows_.push_back(row);
    }

    if (rows_.empty()) {
        throw std::runtime_error("CsvReader: no data rows found in '" + filepath + "'");
    }

    // Print summary
    std::cout << "\nDataset loaded successfully.\n"
              << "Rows             : " << rows_.size()           << "\n"
              << "Pixels per image : " << NUM_PIXELS             << "\n"
              << "Total pixels     : " << rows_.size() * NUM_PIXELS << "\n\n";
}

// ── parse_line ────────────────────────────────────────────────────────────────

bool CsvReader::parse_line(const std::string& line, MnistRow& out)
{
    const char* p   = line.data();
    const char* end = p + line.size();

    // ── Field 0: label ────────────────────────────────────────────────────────
    int label_val = 0;
    auto [ptr0, ec0] = std::from_chars(p, end, label_val);
    if (ec0 != std::errc{}) return false;
    if (ptr0 == end || *ptr0 != ',') return false;  // must be followed by ','
    out.label = label_val;
    p = ptr0 + 1; // skip comma

    // ── Fields 1..784: pixel values ──────────────────────────────────────────
    for (int i = 0; i < NUM_PIXELS; ++i) {
        int pixel_val = 0;
        auto [ptr_i, ec_i] = std::from_chars(p, end, pixel_val);
        if (ec_i != std::errc{}) return false;
        if (pixel_val < 0 || pixel_val > 255) return false; // validate range

        out.pixels[i] = static_cast<uint8_t>(pixel_val);
        p = ptr_i;

        if (i < NUM_PIXELS - 1) {
            if (p == end || *p != ',') return false; // expect comma between fields
            ++p; // skip comma
        }
    }

    // After the last pixel there should be nothing left (or only whitespace)
    if (p != end) return false;

    return true;
}

// ── Accessors ─────────────────────────────────────────────────────────────────

const std::vector<MnistRow>& CsvReader::rows() const noexcept { return rows_; }

std::size_t CsvReader::row_count() const noexcept { return rows_.size(); }

int CsvReader::pixel_count() const noexcept { return NUM_PIXELS; }
