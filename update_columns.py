#!/usr/bin/env python3

import re

# Read the file
with open('src/main/frontend/components/CategoryResultsGrid.tsx', 'r') as f:
    content = f.read()

# First, replace all width: NUMBER with width: columnWidths.KEY
# Pattern: find key: 'X', ... width: NUMBER,
pattern = r"(key: '([^']+)',\s*)(width: )(\d+)(,)"
def replace_width(match):
    before_width = match.group(1)
    width_keyword = match.group(3)
    width_num = match.group(4)
    comma = match.group(5)
    key = match.group(2)

    return f"{before_width}{width_keyword}columnWidths.{key}{comma}"

content = re.sub(pattern, replace_width, content, flags=re.MULTILINE)

# Second, add onHeaderCell after sorter or render (whichever is last)
# Pattern: find entries that have key but don't have onHeaderCell yet
def add_onheadercell(content):
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Check if this line has 'key: ' (column definition)
        if "key: '" in line:
            # Extract the key name
            key_match = re.search(r"key: '([^']+)'", line)
            if key_match:
                key_name = key_match.group(1)

                # Look ahead for sorter or render, and check if onHeaderCell exists
                j = i + 1
                has_onheadercell = False
                last_prop_line = -1

                while j < len(lines) and j < i + 20:  # Look ahead max 20 lines
                    if 'onHeaderCell' in lines[j]:
                        has_onheadercell = True
                        break
                    if 'sorter:' in lines[j] or 'render:' in lines[j]:
                        # Find where this property ends (next comma at same indent or closing brace)
                        k = j
                        while k < len(lines) and k < j + 10:
                            if re.search(r'},?\s*$', lines[k]):
                                last_prop_line = k
                                break
                            k += 1
                    # Stop if we hit the next column definition or closing of children array
                    if ('{' in lines[j] and 'title:' in lines[j+1] if j+1 < len(lines) else False) or '],}' in lines[j]:
                        break
                    j += 1

                # If no onHeaderCell and we found a sorter/render, add onHeaderCell after it
                if not has_onheadercell and last_prop_line > 0:
                    # Get the indentation from the sorter/render line
                    indent_match = re.match(r'(\s*)', lines[last_prop_line])
                    indent = indent_match.group(1) if indent_match else '          '

                    # Insert onHeaderCell after last_prop_line
                    onheadercell_lines = [
                        f"{indent}onHeaderCell: () => ({{{{",
                        f"{indent}  width: columnWidths.{key_name},",
                        f"{indent}  onResize: handleResize('{key_name}'),",
                        f"{indent}}}}}),"
                    ]

                    # Insert after the last_prop_line
                    for idx, oh_line in enumerate(onheadercell_lines):
                        result.insert(len(result) - (i - last_prop_line) + idx, oh_line)

        i += 1

    return '\n'.join(result)

#content = add_onheadercell(content)

# Write back
with open('src/main/frontend/components/CategoryResultsGrid.tsx', 'w') as f:
    f.write(content)

print("Updated widths to use columnWidths state")
print("NOTE: onHeaderCell additions need manual review - add them to each column definition")
