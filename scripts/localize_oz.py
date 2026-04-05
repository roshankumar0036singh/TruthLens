import os
import shutil

def localize_oz():
    src = 'node_modules/@openzeppelin/contracts'
    dst = 'contracts/openzeppelin'
    
    if not os.path.exists(src):
        print(f"Error: {src} not found. Please run 'npm install'.")
        return

    # Categories we strictly need
    subdirs = ['access', 'token/ERC721', 'utils', 'interfaces']
    
    print(f"Localizing OpenZeppelin 5.0.0 from {src} to {dst}...")
    
    for subdir in subdirs:
        s_dir = os.path.join(src, subdir)
        d_dir = os.path.join(dst, subdir)
        
        if os.path.exists(s_dir):
            if os.path.exists(d_dir):
                shutil.rmtree(d_dir)
            shutil.copytree(s_dir, d_dir, dirs_exist_ok=True)
            print(f"  [OK] {subdir}")
        else:
            print(f"  [MISSING] {subdir}")

    print("\nLocalization complete. You can now use local relative imports in your contracts.")

if __name__ == "__main__":
    localize_oz()
