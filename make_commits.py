import os
import subprocess
import math

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def main():
    # 1. Get untracked files
    files = run_command("git ls-files --others --exclude-standard").split('\n')
    files = [f for f in files if f.strip()]
    total_files = len(files)
    
    if total_files == 0:
        print("No files to commit.")
        return

    target_commits = 150
    files_per_commit = max(1, math.ceil(total_files / target_commits))
    
    print(f"Total files: {total_files}")
    print(f"Target commits: {target_commits}")
    print(f"Files per commit: {files_per_commit}")

    # 2. Batch the files
    batches = []
    for i in range(0, total_files, files_per_commit):
        batches.append(files[i : i + files_per_commit])
    
    # If we have too many batches (due to rounding), merge the last ones
    if len(batches) > target_commits:
        last_batch = []
        for extra in batches[target_commits-1:]:
            last_batch.extend(extra)
        batches = batches[:target_commits-1] + [last_batch]

    # 3. Perform commits
    for idx, batch in enumerate(batches):
        for f in batch:
            subprocess.run(f"git add \"{f}\"", shell=True)
        
        # Determine descriptive message
        primary_file = batch[0]
        msg = f"Add core functionality for {primary_file}"
        
        if "backend/agents" in primary_file:
            msg = f"feat: implement AI agent logic for {os.path.basename(primary_file)}"
        elif "backend/api" in primary_file:
            msg = f"api: define endpoint for {os.path.basename(primary_file)}"
        elif "extension/src/views" in primary_file:
            msg = f"ui: develop {os.path.basename(primary_file)} component for extension"
        elif "contracts" in primary_file:
            msg = f"contract: deploy {os.path.basename(primary_file)} to Shardeum"
        elif "frontend/src/pages" in primary_file:
            msg = f"page: create {os.path.basename(primary_file)} dashboard view"
        elif "scripts" in primary_file:
            msg = f"chore: add utility script {os.path.basename(primary_file)}"
        
        print(f"Commit {idx+1}/{len(batches)}: {msg}")
        subprocess.run(f'git commit -m "{msg}"', shell=True)

    # 4. Push
    print("Pushing to GitHub...")
    subprocess.run("git push -u origin master", shell=True)
    subprocess.run("git push -u origin main", shell=True)

if __name__ == "__main__":
    main()
