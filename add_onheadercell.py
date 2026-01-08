#!/usr/bin/env python3
import re

with open('src/main/frontend/components/CategoryResultsGrid.tsx', 'r') as f:
    lines = f.readlines()

result = []
i = 0
while i < len(lines):
    line = lines[i]
    result.append(line)
    
    # Check if this line contains a sorter and doesn't have onHeaderCell after it
    if 'sorter:' in line and '=>' in line:
        # Look ahead to see if onHeaderCell already exists
        has_onheadercell = False
        for j in range(i+1, min(i+5, len(lines))):
            if 'onHeaderCell' in lines[j]:
                has_onheadercell = True
                break
            if '},\n' in lines[j] or '},' == lines[j].strip():  # End of this column def
                break
        
        # Also look back to find the key name
        key_name = None
        for j in range(max(0, i-10), i):
            if "key: '" in lines[j]:
                match = re.search(r"key: '([^']+)'", lines[j])
                if match:
                    key_name = match.group(1)
        
        if not has_onheadercell and key_name:
            # Get indentation
            indent_match = re.match(r'(\s*)', line)
            indent = indent_match.group(1) if indent_match else '          '
            
            # Add onHeaderCell after this line
            result.append(indent + "onHeaderCell: () => ({\n")
            result.append(indent + f"  width: columnWidths.{key_name},\n")
            result.append(indent + f"  onResize: handleResize('{key_name}'),\n")
            result.append(indent + "}),\n")
    
    i += 1

with open('src/main/frontend/components/CategoryResultsGrid.tsx', 'w') as f:
    f.writelines(result)

print("Added onHeaderCell to columns")
