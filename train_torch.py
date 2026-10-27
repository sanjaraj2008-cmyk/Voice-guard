"""
train_torch.py — PyTorch Trainer & TensorFlow.js Exporter for DocuGuard AI
"""
import os
import json
import glob
import math
import time
import random
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# ─── 1. Neural Network Architecture ───────────────────────────────────────────
class DocuGuardPyTorchCNN(nn.Module):
    def __init__(self):
        super().__init__()
        # Block 1
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2) # 112x112

        # Block 2
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2) # 56x56

        # Block 3
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(2) # 28x28

        # Block 4
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.pool4 = nn.MaxPool2d(2) # 14x14

        # Block 5
        self.conv5 = nn.Conv2d(256, 256, kernel_size=3, padding=1)
        self.bn5 = nn.BatchNorm2d(256)

        # Block 6
        self.conv6_reduce = nn.Conv2d(256, 128, kernel_size=1, padding=0)
        self.bn6 = nn.BatchNorm2d(128)
        self.pool6 = nn.AvgPool2d(2) # 7x7x128

        # Heatmap Head
        self.heatmap_conv = nn.Conv2d(128, 1, kernel_size=1)

        # Classification & Score Heads
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.embedding_dense = nn.Linear(128, 128)
        self.dropout = nn.Dropout(0.4)
        self.classification_output = nn.Linear(128, 3)
        self.score_output = nn.Linear(128, 1)

    def forward(self, x):
        # Backbone
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool1(x)

        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool2(x)

        x = F.relu(self.bn3(self.conv3(x)))
        x = self.pool3(x)

        x = F.relu(self.bn4(self.conv4(x)))
        x = self.pool4(x)

        x = F.relu(self.bn5(self.conv5(x)))

        feat_map = F.relu(self.bn6(self.conv6_reduce(x)))
        feat_map = self.pool6(feat_map) # 7x7x128

        # Heatmap (7x7 flattened to 49)
        heatmap = torch.sigmoid(self.heatmap_conv(feat_map))
        heatmap = heatmap.view(heatmap.size(0), -1)

        # Embedding & Heads
        pooled = self.global_pool(feat_map).view(feat_map.size(0), -1)
        emb = F.relu(self.embedding_dense(pooled))
        dropped = self.dropout(emb)

        logits = self.classification_output(dropped)
        probs = F.softmax(logits, dim=-1)

        score = torch.sigmoid(self.score_output(dropped)) * 100.0

        return logits, probs, score, heatmap

# ─── 2. Dataset Loader ────────────────────────────────────────────────────────
class ForensicDataset(Dataset):
    def __init__(self, root_dir, split='train', img_size=224, max_per_class=1000):
        self.img_size = img_size
        self.samples = []
        classes = ['real', 'suspicious', 'tampered']
        
        split_dir = os.path.join(root_dir, split)
        for class_idx, class_name in enumerate(classes):
            c_dir = os.path.join(split_dir, class_name)
            if not os.path.exists(c_dir):
                continue
            exts = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.bmp']
            files = []
            for ext in exts:
                files.extend(glob.glob(os.path.join(c_dir, ext)))
                files.extend(glob.glob(os.path.join(c_dir, ext.upper())))
                
            files = list(set(files))[:max_per_class]
            for f in files:
                self.samples.append((f, class_idx))

        random.seed(42)
        random.shuffle(self.samples)
        print(f"[{split.upper()}] Loaded {len(self.samples)} samples from {split_dir}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        fpath, label = self.samples[idx]
        try:
            with Image.open(fpath) as img:
                img = img.convert('RGB').resize((self.img_size, self.img_size), Image.BILINEAR)
                arr = np.array(img, dtype=np.float32)
                # Normalize to [-1, 1] matching MobileNet TF.js format
                arr = (arr / 127.5) - 1.0
                # HWC -> CHW
                tensor = torch.from_numpy(arr).permute(2, 0, 1)
        except Exception:
            tensor = torch.zeros(3, self.img_size, self.img_size, dtype=torch.float32)

        # Labels
        score_target = 5.0 if label == 0 else (55.0 if label == 1 else 95.0)
        return tensor, torch.tensor(label, dtype=torch.long), torch.tensor([score_target], dtype=torch.float32)

# ─── 3. Exporter to TensorFlow.js ──────────────────────────────────────────────
def export_to_tfjs(model, output_dir='public/ai-model'):
    os.makedirs(output_dir, exist_ok=True)
    model.eval()

    weights_list = []
    binary_bytes = bytearray()

    def add_weight(name, arr, shape):
        nonlocal binary_bytes
        arr_f32 = arr.astype(np.float32)
        raw = arr_f32.tobytes()
        binary_bytes.extend(raw)
        weights_list.append({
            'name': name,
            'shape': shape,
            'dtype': 'float32'
        })

    # Conv2d weights: PyTorch (out, in, H, W) -> TF.js (H, W, in, out)
    def add_conv(layer, name):
        w = layer.weight.detach().cpu().numpy().transpose(2, 3, 1, 0)
        b = layer.bias.detach().cpu().numpy()
        add_weight(f"{name}/kernel", w, list(w.shape))
        add_weight(f"{name}/bias", b, list(b.shape))

    # BatchNorm: gamma, beta, moving_mean, moving_variance
    def add_bn(layer, name):
        gamma = layer.weight.detach().cpu().numpy()
        beta = layer.bias.detach().cpu().numpy()
        mean = layer.running_mean.detach().cpu().numpy()
        var = layer.running_var.detach().cpu().numpy()
        add_weight(f"{name}/gamma", gamma, list(gamma.shape))
        add_weight(f"{name}/beta", beta, list(beta.shape))
        add_weight(f"{name}/moving_mean", mean, list(mean.shape))
        add_weight(f"{name}/moving_variance", var, list(var.shape))

    # Linear weights: PyTorch (out, in) -> TF.js (in, out)
    def add_dense(layer, name):
        w = layer.weight.detach().cpu().numpy().transpose(1, 0)
        b = layer.bias.detach().cpu().numpy()
        add_weight(f"{name}/kernel", w, list(w.shape))
        add_weight(f"{name}/bias", b, list(b.shape))

    # Add all layers in exact order
    add_conv(model.conv1, 'conv1')
    add_bn(model.bn1, 'bn1')
    add_conv(model.conv2, 'conv2')
    add_bn(model.bn2, 'bn2')
    add_conv(model.conv3, 'conv3')
    add_bn(model.bn3, 'bn3')
    add_conv(model.conv4, 'conv4')
    add_bn(model.bn4, 'bn4')
    add_conv(model.conv5, 'conv5')
    add_bn(model.bn5, 'bn5')
    add_conv(model.conv6_reduce, 'conv6_reduce')
    add_bn(model.bn6, 'bn6')
    add_conv(model.heatmap_conv, 'heatmap_conv')
    add_dense(model.embedding_dense, 'embedding_dense')
    add_dense(model.classification_output, 'classification_output')
    add_dense(model.score_output, 'score_output')

    # Save shard
    shard_filename = 'group1-shard1of1.bin'
    shard_path = os.path.join(output_dir, shard_filename)
    with open(shard_path, 'wb') as f:
        f.write(binary_bytes)

    # Save model.json
    model_json = {
        "format": "layers-model",
        "generatedBy": "PyTorch-DocuGuard-Exporter",
        "convertedBy": "DocuGuard-AI-Pipeline",
        "modelTopology": {
            "class_name": "Functional",
            "config": {
                "name": "DocuGuard_Forensic_CNN",
                "layers": [
                    {"name": "image_input", "class_name": "InputLayer", "config": {"batch_input_shape": [None, 224, 224, 3], "dtype": "float32"}},
                    {"name": "conv1", "class_name": "Conv2D", "config": {"filters": 32, "kernel_size": [3, 3], "padding": "same", "activation": "relu"}},
                    {"name": "bn1", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "pool1", "class_name": "MaxPooling2D", "config": {"pool_size": [2, 2]}},
                    {"name": "conv2", "class_name": "Conv2D", "config": {"filters": 64, "kernel_size": [3, 3], "padding": "same", "activation": "relu"}},
                    {"name": "bn2", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "pool2", "class_name": "MaxPooling2D", "config": {"pool_size": [2, 2]}},
                    {"name": "conv3", "class_name": "Conv2D", "config": {"filters": 128, "kernel_size": [3, 3], "padding": "same", "activation": "relu"}},
                    {"name": "bn3", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "pool3", "class_name": "MaxPooling2D", "config": {"pool_size": [2, 2]}},
                    {"name": "conv4", "class_name": "Conv2D", "config": {"filters": 256, "kernel_size": [3, 3], "padding": "same", "activation": "relu"}},
                    {"name": "bn4", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "pool4", "class_name": "MaxPooling2D", "config": {"pool_size": [2, 2]}},
                    {"name": "conv5", "class_name": "Conv2D", "config": {"filters": 256, "kernel_size": [3, 3], "padding": "same", "activation": "relu"}},
                    {"name": "bn5", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "conv6_reduce", "class_name": "Conv2D", "config": {"filters": 128, "kernel_size": [1, 1], "padding": "same", "activation": "relu"}},
                    {"name": "bn6", "class_name": "BatchNormalization", "config": {"axis": 3}},
                    {"name": "pool6", "class_name": "AveragePooling2D", "config": {"pool_size": [2, 2]}},
                    {"name": "heatmap_conv", "class_name": "Conv2D", "config": {"filters": 1, "kernel_size": [1, 1], "activation": "sigmoid"}},
                    {"name": "heatmap_output", "class_name": "Flatten", "config": {}},
                    {"name": "global_pool", "class_name": "GlobalAveragePooling2D", "config": {}},
                    {"name": "embedding_dense", "class_name": "Dense", "config": {"units": 128, "activation": "relu"}},
                    {"name": "dropout", "class_name": "Dropout", "config": {"rate": 0.4}},
                    {"name": "classification_output", "class_name": "Dense", "config": {"units": 3, "activation": "softmax"}},
                    {"name": "score_output", "class_name": "Dense", "config": {"units": 1, "activation": "sigmoid"}}
                ]
            }
        },
        "weightsManifest": [{
            "paths": [shard_filename],
            "weights": weights_list
        }]
    }

    with open(os.path.join(output_dir, 'model.json'), 'w') as f:
        json.dump(model_json, f, indent=2)

    print(f"[OK] TF.js model exported: {output_dir}/model.json ({len(weights_list)} weights, {len(binary_bytes)} bytes)")

# ─── 4. Training Loop ──────────────────────────────────────────────────────────
def train(dataset_dir='dataset', epochs=15, batch_size=32, lr=0.001):
    print("=" * 65)
    print("  DocuGuard AI — Training Forensic CNN with PyTorch")
    print("=" * 65)

    train_ds = ForensicDataset(dataset_dir, split='train')
    val_ds = ForensicDataset(dataset_dir, split='val')

    if len(train_ds) == 0:
        print("[!] No training samples found. Run organize_dataset.py first.")
        return

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False) if len(val_ds) > 0 else None

    model = DocuGuardPyTorchCNN()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion_cls = nn.CrossEntropyLoss()
    criterion_score = nn.MSELoss()

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch_x, batch_y, batch_score in train_loader:
            optimizer.zero_grad()
            logits, probs, score, heatmap = model(batch_x)

            loss_cls = criterion_cls(logits, batch_y)
            loss_score = criterion_score(score, batch_score)
            loss = loss_cls + 0.01 * loss_score

            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_y)
            pred = logits.argmax(dim=-1)
            correct += (pred == batch_y).sum().item()
            total += len(batch_y)

        train_acc = (correct / total) * 100.0 if total > 0 else 0
        train_loss = total_loss / total if total > 0 else 0

        val_acc = 0.0
        if val_loader:
            model.eval()
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for vx, vy, vscore in val_loader:
                    vlogits, _, _, _ = model(vx)
                    vpred = vlogits.argmax(dim=-1)
                    val_correct += (vpred == vy).sum().item()
                    val_total += len(vy)
            val_acc = (val_correct / val_total) * 100.0 if val_total > 0 else 0

        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.1f}% | Val Acc: {val_acc:.1f}%")
        best_val_acc = max(best_val_acc, val_acc)

    # Export model to public/ai-model/
    export_to_tfjs(model, output_dir='public/ai-model')

    # Update metadata
    meta = {
        "model_name": "DocuGuard_Forensic_CNN",
        "version": "1.0.0-trained",
        "status": "READY — Fully trained on forensic document forgery dataset",
        "input_size": 224,
        "classes": ["real", "suspicious", "tampered"],
        "num_classes": 3,
        "epochs_trained": epochs,
        "final_train_accuracy": round(train_acc, 2),
        "best_val_accuracy": round(best_val_acc, 2),
        "trained_samples": len(train_ds),
        "output_heads": ["classification_output", "score_output", "heatmap_output"]
    }
    with open('public/ai-model/model_metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)

    print("[OK] Model metadata updated!")
    print("=" * 65)

if __name__ == '__main__':
    train()
