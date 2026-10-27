"""
download_aiforge.py — Ingests authentic & forged document datasets from Scam-AI/AIForge-Doc-v1
"""
import os
import io
import json
import random
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageFilter

TOKEN = os.environ.get('HF_TOKEN', 'YOUR_HF_TOKEN')
REPO_ID = 'Scam-AI/AIForge-Doc-v1'
OUTPUT_DIR = 'dataset'

def get_file_list(subfolder):
    url = f'https://huggingface.co/api/datasets/{REPO_ID}/tree/main/{subfolder}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req) as resp:
        items = json.loads(resp.read().decode('utf-8'))
    return [x['path'] for x in items if x['type'] == 'file']

def download_one(path, target_path):
    url = f'https://huggingface.co/datasets/{REPO_ID}/resolve/main/{path}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'wb') as f:
            f.write(data)
        return True, path, len(data)
    except Exception as e:
        return False, path, str(e)

def ingest_aiforge(num_samples_per_class=200, max_workers=6):
    print("=" * 65)
    print("  DocuGuard AI — Ingesting Hugging Face AIForge-Doc-v1 Dataset")
    print("=" * 65)

    print("[*] Fetching file listings from Hugging Face...")
    auth_files = get_file_list('TrainingSet/authentic')
    tamp_files = get_file_list('TrainingSet/images')

    print(f"[*] Found {len(auth_files)} authentic and {len(tamp_files)} forged document records.")

    random.seed(42)
    random.shuffle(auth_files)
    random.shuffle(tamp_files)

    selected_auth = auth_files[:num_samples_per_class]
    selected_tamp = tamp_files[:num_samples_per_class]

    tasks = []
    # 80% train, 20% val
    val_cut = int(num_samples_per_class * 0.2)

    for i, path in enumerate(selected_auth):
        split = 'val' if i < val_cut else 'train'
        fname = f"aiforge_auth_{os.path.basename(path)}"
        target = os.path.join(OUTPUT_DIR, split, 'real', fname)
        tasks.append((path, target))

    for i, path in enumerate(selected_tamp):
        split = 'val' if i < val_cut else 'train'
        fname = f"aiforge_tamp_{os.path.basename(path)}"
        target = os.path.join(OUTPUT_DIR, split, 'tampered', fname)
        tasks.append((path, target))

    print(f"[*] Downloading {len(tasks)} document images with {max_workers} concurrent threads...")
    completed = 0
    total_bytes = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(download_one, path, target): (path, target) for path, target in tasks}
        for future in as_completed(futures):
            ok, path, res = future.result()
            completed += 1
            if ok:
                total_bytes += res
            if completed % 25 == 0 or completed == len(tasks):
                mb = total_bytes / (1024 * 1024)
                print(f"[*] Progress: {completed}/{len(tasks)} images ({mb:.1f} MB downloaded)")

    # Generate synthetic suspicious samples from downloaded authentic images
    print("[*] Synthesizing suspicious class samples from authentic documents...")
    auth_train_dir = os.path.join(OUTPUT_DIR, 'train', 'real')
    susp_train_dir = os.path.join(OUTPUT_DIR, 'train', 'suspicious')
    auth_images = [os.path.join(auth_train_dir, f) for f in os.listdir(auth_train_dir) if f.startswith('aiforge_')]
    
    susp_count = min(60, len(auth_images))
    for i in range(susp_count):
        src_path = auth_images[i]
        try:
            with Image.open(src_path) as img:
                img = img.convert('RGB')
                if random.random() > 0.5:
                    img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.7, 1.4)))
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=random.randint(45, 65))
                out_name = f"aiforge_susp_{i}.jpg"
                with open(os.path.join(susp_train_dir, out_name), 'wb') as sf:
                    sf.write(buf.getvalue())
        except Exception:
            pass

    print("[OK] AIForge-Doc-v1 ingestion complete!")
    print("=" * 65)

if __name__ == '__main__':
    ingest_aiforge()
