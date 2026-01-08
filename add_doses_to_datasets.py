#!/usr/bin/env python3
"""
Add Doses line to dataset files in bmdexpress-web/src/main/resources/data/datasets/
The dose mapping is extracted from P3MP-Parham.bm2:
  A1-A7: 0.0, A8-A12: 0.01, A13-A17: 0.1, A18-A22: 0.3, A23-A27: 1.0,
  A28-A32: 3.0, A33-A37: 10.0, A38-A41: 30.0, A42-A46: 100.0, A47-A51: 300.0
"""

import os
import re

# Dose mapping based on Parham file
# Male animals: A1-A51
# Female animals: A52-A102
def get_dose_for_animal(animal_id):
    """Get dose for an animal ID like 'A1', 'A52', etc."""
    match = re.match(r'A(\d+)', animal_id)
    if not match:
        return None
    num = int(match.group(1))

    # Male cohort (A1-A51)
    if 1 <= num <= 7:
        return 0.0
    elif 8 <= num <= 12:
        return 0.01
    elif 13 <= num <= 17:
        return 0.1
    elif 18 <= num <= 22:
        return 0.3
    elif 23 <= num <= 27:
        return 1.0
    elif 28 <= num <= 32:
        return 3.0
    elif 33 <= num <= 37:
        return 10.0
    elif 38 <= num <= 41:
        return 30.0
    elif 42 <= num <= 46:
        return 100.0
    elif 47 <= num <= 51:
        return 300.0

    # Female cohort (A52-A102)
    elif 52 <= num <= 59:
        return 0.0
    elif 60 <= num <= 64:
        return 0.01
    elif 65 <= num <= 69:
        return 0.1
    elif 70 <= num <= 74:
        return 0.3
    elif 75 <= num <= 79:
        return 1.0
    elif 80 <= num <= 84:
        return 3.0
    elif 85 <= num <= 89:
        return 10.0
    elif 90 <= num <= 94:
        return 30.0
    elif 95 <= num <= 99:
        return 100.0
    elif 100 <= num <= 102:
        return 300.0
    else:
        return None

def process_file(filepath):
    """Add Doses line to a dataset file."""
    print(f"\nProcessing: {os.path.basename(filepath)}")

    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Find the line with animal IDs (starts with tab, followed by A1 or similar)
    animal_id_line_idx = None
    for i, line in enumerate(lines):
        # Animal ID line starts with tab and has A1, A2, etc.
        if line.startswith('\t') and re.match(r'\tA\d+', line):
            # Make sure next line is not already Doses
            if i + 1 < len(lines) and not lines[i + 1].startswith('Doses'):
                animal_id_line_idx = i
                break

    if animal_id_line_idx is None:
        print(f"  Could not find animal ID line or Doses already exists")
        return False

    # Parse animal IDs
    animal_line = lines[animal_id_line_idx].strip()
    animal_ids = animal_line.split('\t')
    # Filter out empty strings
    animal_ids = [a for a in animal_ids if a]

    print(f"  Found {len(animal_ids)} animal IDs: {animal_ids[:5]}...")

    # Generate doses for each animal
    doses = []
    for animal_id in animal_ids:
        dose = get_dose_for_animal(animal_id)
        if dose is None:
            print(f"  ERROR: Unknown animal ID: {animal_id}")
            return False
        doses.append(str(dose))

    # Create doses line
    doses_line = "Doses\t" + "\t".join(doses) + "\n"
    print(f"  Doses line: Doses\\t{doses[0]}\\t{doses[1]}\\t...\\t{doses[-1]}")

    # Insert doses line after animal IDs line
    new_lines = lines[:animal_id_line_idx + 1] + [doses_line] + lines[animal_id_line_idx + 1:]

    # Write back
    with open(filepath, 'w') as f:
        f.writelines(new_lines)

    print(f"  Successfully added Doses line")
    return True

def main():
    datasets_dir = "src/main/resources/data/datasets"

    if not os.path.exists(datasets_dir):
        print(f"Directory not found: {datasets_dir}")
        return

    files = [f for f in os.listdir(datasets_dir) if f.endswith('.txt')]
    print(f"Found {len(files)} dataset files")

    success_count = 0
    for filename in sorted(files):
        filepath = os.path.join(datasets_dir, filename)
        if process_file(filepath):
            success_count += 1

    print(f"\n{'='*60}")
    print(f"Updated {success_count}/{len(files)} files")

if __name__ == "__main__":
    main()
