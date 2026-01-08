#!/usr/bin/env python3
"""
Split multiselect_results.txt into separate files by dataset name.
Each dataset gets only the columns that contain data, with matching headers.
"""

import os
import re
from collections import defaultdict

# Input and output paths
input_file = 'src/main/resources/data/multiselect_results.txt'
output_dir = 'src/main/resources/data/datasets'

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Read the input file
with open(input_file, 'r') as f:
    lines = f.readlines()

# Find the header line (skip empty lines, look for line starting with "Analysis")
header_line = None
data_start_index = 0
for i, line in enumerate(lines):
    if line.strip().startswith('Analysis'):
        header_line = line
        data_start_index = i + 1
        break

if not header_line:
    raise ValueError("Could not find header line starting with 'Analysis'")

# Process the header line to get all column labels
# Header line is: "Analysis\t\tA1\tA2\t..."
# Extract all column labels after "Analysis\t"
header_processed = re.sub(r'^Analysis\t', '', header_line)
header_processed = header_processed.rstrip('\n')
all_header_fields = header_processed.split('\t')

# Group lines by dataset name and track column ranges
datasets = defaultdict(list)
dataset_col_ranges = {}  # {dataset_name: (min_col, max_col)}

for line in lines[data_start_index:]:  # Start after header line
    if not line.strip():
        continue

    # Split line into all fields
    fields = line.split('\t')
    if len(fields) < 2:
        continue

    dataset_name = fields[0].strip()
    # Skip if the dataset name is "Analysis" (this is the header marker, not a dataset)
    if dataset_name and dataset_name != "Analysis":
        # Keep everything from field 2 onwards (probe ID + data values)
        data_fields = fields[1:]

        # Find the first and last non-empty DATA columns (skipping column 0 which is probe ID)
        first_data_col = None
        last_data_col = None

        # Start from index 1 to skip probe ID at index 0
        for i in range(1, len(data_fields)):
            if data_fields[i].strip():
                if first_data_col is None:
                    first_data_col = i
                last_data_col = i

        # Update the column range for this dataset
        if first_data_col is not None:
            if dataset_name not in dataset_col_ranges:
                dataset_col_ranges[dataset_name] = (first_data_col, last_data_col)
            else:
                curr_min, curr_max = dataset_col_ranges[dataset_name]
                dataset_col_ranges[dataset_name] = (
                    min(curr_min, first_data_col),
                    max(curr_max, last_data_col)
                )

        # Store the full data (we'll extract the range when writing)
        datasets[dataset_name].append(data_fields)

# Write each dataset to a separate file
print(f"Found {len(datasets)} datasets")
for dataset_name, dataset_data in datasets.items():
    output_file = os.path.join(output_dir, f"{dataset_name}.txt")

    # Get the column range for this dataset
    if dataset_name not in dataset_col_ranges:
        print(f"  Warning: No data found for {dataset_name}")
        continue

    first_data_col, last_data_col = dataset_col_ranges[dataset_name]

    # Create a header with: probe ID column + data columns
    # Header: empty string (for probe ID) + labels for data columns
    dataset_header_fields = [all_header_fields[0]] + all_header_fields[first_data_col:last_data_col+1]
    dataset_header = '\t'.join(dataset_header_fields) + '\n'

    with open(output_file, 'w') as f:
        # Write the dataset-specific header
        f.write(dataset_header)
        # Write all lines for this dataset
        for data_fields in dataset_data:
            # Extract: probe ID (col 0) + data columns (first_data_col to last_data_col)
            relevant_cols = [data_fields[0]] + data_fields[first_data_col:last_data_col+1]
            data_line = '\t'.join(relevant_cols).rstrip('\n') + '\n'
            f.write(data_line)

    num_cols = (last_data_col - first_data_col + 1) + 1  # +1 for probe ID column
    print(f"  Written {len(dataset_data)} lines to {output_file} (probe + data cols {first_data_col}-{last_data_col}, {num_cols} total)")

print(f"\nAll datasets split successfully into {output_dir}/")
