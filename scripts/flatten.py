import os
import re

def flatten(file_path, base_dir, seen=None):
    file_path = os.path.abspath(file_path)
    if seen is None:
        seen = set()
    
    if file_path in seen:
        return ""
    seen.add(file_path)
    
    if not os.path.exists(file_path):
        print(f"Warning: File not found {file_path}")
        return ""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove pragma and SPDX
    content = re.sub(r'pragma solidity[^;]+;', '', content)
    content = re.sub(r'// SPDX-License-Identifier:[^\n]+', '', content)
    
    def replace_import(match):
        # match.group(1) is for { ... } from "path"
        # match.group(2) is for "path"
        import_path = match.group(1) or match.group(2)
        
        # Resolve path
        if import_path.startswith("@openzeppelin/contracts/"):
            rel_path = import_path.replace("@openzeppelin/contracts/", "")
            full_path = os.path.join(base_dir, "node_modules", "@openzeppelin", "contracts", rel_path)
        else:
            full_path = os.path.join(os.path.dirname(file_path), import_path)
        
        full_path = os.path.normpath(full_path)
        return flatten(full_path, base_dir, seen)

    # Comprehensive regex for all import styles
    import_regex = r'import\s+(?:\{[^\}]+\}\s+from\s+)?["\']([^"\']+)["\']\s*;'
    
    content = re.sub(import_regex, replace_import, content)
    return content

if __name__ == "__main__":
    base = os.getcwd()
    
    # 1. Reputation
    print("Flattening TruthLensReputation...")
    flat_rep = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n" + flatten("contracts/TruthLensReputation.sol", base)
    flat_rep = re.sub(r'\n\s*\n', '\n\n', flat_rep)
    with open("contracts/TruthLensReputation.flat.sol", "w", encoding='utf-8') as f:
        f.write(flat_rep)
        
    # 2. DAO
    print("Flattening TruthDAO...")
    flat_dao = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n" + flatten("contracts/TruthDAO.sol", base)
    flat_dao = re.sub(r'\n\s*\n', '\n\n', flat_dao)
    with open("contracts/TruthDAO.flat.sol", "w", encoding='utf-8') as f:
        f.write(flat_dao)

    # 3. Bridge
    print("Flattening DeFactBridge...")
    flat_bridge = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n" + flatten("contracts/DeFactBridge.sol", base)
    flat_bridge = re.sub(r'\n\s*\n', '\n\n', flat_bridge)
    with open("contracts/DeFactBridge.flat.sol", "w", encoding='utf-8') as f:
        f.write(flat_bridge)

    # 4. Integrity
    print("Flattening ContentIntegrity...")
    flat_integ = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n" + flatten("contracts/ContentIntegrity.sol", base)
    flat_integ = re.sub(r'\n\s*\n', '\n\n', flat_integ)
    with open("contracts/ContentIntegrity.flat.sol", "w", encoding='utf-8') as f:
        f.write(flat_integ)

    print("Contracts flattened successfully.")
