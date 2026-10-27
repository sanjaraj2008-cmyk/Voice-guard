"""
sync_desktop.py — Synchronizes all project files, model weights, and scripts to the Desktop 'forensic ai' folder
"""
import os
import shutil

def sync_to_desktop():
    src = os.path.dirname(os.path.abspath(__file__))
    user_profile = os.environ.get('USERPROFILE', os.path.expanduser('~'))
    
    # Check OneDrive Desktop and local Desktop
    target_dirs = []
    onedrive_desktop = os.path.join(user_profile, 'OneDrive', 'Desktop')
    standard_desktop = os.path.join(user_profile, 'Desktop')
    
    if os.path.exists(onedrive_desktop):
        target_dirs.append(os.path.join(onedrive_desktop, 'forensic ai'))
    if os.path.exists(standard_desktop):
        target_dirs.append(os.path.join(standard_desktop, 'forensic ai'))
    if not target_dirs:
        target_dirs.append(os.path.join(user_profile, 'Desktop', 'forensic ai'))

    ignore_patterns = shutil.ignore_patterns(
        'node_modules', '.git', '__pycache__', '*.pyc',
        'IMD2020.zip', '*.log', '.system_generated', 'dist'
    )

    for target in target_dirs:
        os.makedirs(target, exist_ok=True)
        print(f"[*] Syncing to Desktop: {target}")
        
        for item in os.listdir(src):
            if item in ['node_modules', '.git', '__pycache__', 'IMD2020.zip', '.system_generated', 'dist']:
                continue
            s_item = os.path.join(src, item)
            d_item = os.path.join(target, item)
            if os.path.isdir(s_item):
                if os.path.exists(d_item):
                    shutil.rmtree(d_item)
                shutil.copytree(s_item, d_item, ignore=ignore_patterns)
            else:
                shutil.copy2(s_item, d_item)

        file_count = sum(len(files) for _, _, files in os.walk(target))
        print(f"[OK] Synced {file_count} files to {target}")

if __name__ == '__main__':
    sync_to_desktop()
