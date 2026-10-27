"""
organize_dataset.py — Extracts IMD2020.zip and populates dataset/train and dataset/val
"""
import os
import zipfile
import shutil
import random
from pathlib import Path

def setup_directories(base_dir='dataset'):
    for split in ['train', 'val', 'test']:
        for cls in ['real', 'suspicious', 'tampered']:
            os.makedirs(os.path.join(base_dir, split, cls), exist_ok=True)

def process_imd2020(zip_path='IMD2020.zip', output_base='dataset', max_samples_per_class=1200):
    print(f"[*] Opening {zip_path}...")
    setup_directories(output_base)
    
    real_files = []
    tampered_files = []
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        all_names = z.namelist()
        print(f"[*] Total files in archive: {len(all_names)}")
        
        for name in all_names:
            lower = name.lower()
            if not (lower.endswith('.jpg') or lower.endswith('.png') or lower.endswith('.jpeg')):
                continue
            if 'mask' in lower or '__macosx' in lower or lower.endswith('/'):
                continue
            
            if 'orig' in lower or '_c.' in lower or 'authentic' in lower:
                real_files.append(name)
            else:
                tampered_files.append(name)
                
        print(f"[*] Found {len(real_files)} authentic files and {len(tampered_files)} tampered files.")
        
        if len(real_files) == 0:
            for name in all_names:
                lower = name.lower()
                if not (lower.endswith('.jpg') or lower.endswith('.png')):
                    continue
                if 'mask' in lower or '__macosx' in lower:
                    continue
                if any(x in lower for x in ['real', 'clean', 'orig']):
                    real_files.append(name)
                else:
                    tampered_files.append(name)
            print(f"[*] Fallback search: {len(real_files)} real, {len(tampered_files)} tampered.")

        random.seed(42)
        random.shuffle(real_files)
        random.shuffle(tampered_files)
        
        selected_real = real_files[:max_samples_per_class]
        selected_tampered = tampered_files[:max_samples_per_class]
        
        def extract_split(file_list, cls_name):
            n_val = max(10, int(len(file_list) * 0.2))
            val_items = file_list[:n_val]
            train_items = file_list[n_val:]
            
            for item in train_items:
                fname = os.path.basename(item)
                target = os.path.join(output_base, 'train', cls_name, fname)
                with open(target, 'wb') as f:
                    f.write(z.read(item))
                    
            for item in val_items:
                fname = os.path.basename(item)
                target = os.path.join(output_base, 'val', cls_name, fname)
                with open(target, 'wb') as f:
                    f.write(z.read(item))
                    
            print(f"[*] {cls_name}: extracted {len(train_items)} train, {len(val_items)} val.")

        if selected_real:
            extract_split(selected_real, 'real')
        if selected_tampered:
            extract_split(selected_tampered, 'tampered')
            
        print("[*] Generating suspicious samples (recompression & mild noise)...")
        from PIL import Image, ImageFilter
        import io
        
        suspicious_count = min(300, len(selected_real))
        for i in range(suspicious_count):
            item = selected_real[i]
            data = z.read(item)
            try:
                img = Image.open(io.BytesIO(data)).convert('RGB')
                if random.random() > 0.5:
                    img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.8, 1.5)))
                
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=random.randint(40, 65))
                
                target_split = 'val' if i < int(suspicious_count * 0.2) else 'train'
                fname = f"suspicious_{i}_{os.path.basename(item)}"
                target_path = os.path.join(output_base, target_split, 'suspicious', fname)
                with open(target_path, 'wb') as f:
                    f.write(buf.getvalue())
            except Exception:
                pass
                
    print("[OK] Dataset organization complete!")

if __name__ == '__main__':
    process_imd2020()
