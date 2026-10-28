"""
rl_finetune.py — Reinforcement Learning Fine-Tuning for DocuGuard CNN
======================================================================

This script loads the pre-trained DocuGuard PyTorch model and fine-tunes it
using a REINFORCE-style policy gradient approach (Reward-Shaping RL).

WHY RL FINE-TUNING?
────────────────────
The model was previously trained with fixed score targets:
  - real      → 5.0
  - suspicious → 55.0
  - tampered  → 95.0

This caused the score_output head to collapse: it learned to always output
the tampered class score (95%) when uncertain, because:
  1. The dataset may be imbalanced toward tampered samples
  2. The MSE loss on fixed targets gives no gradient signal for
     borderline/uncertain predictions

RL APPROACH:
────────────
We treat the model as a POLICY (π_θ) where:
  - State   : the input document image
  - Action  : the 3-class probability distribution [real, suspicious, tampered]
  - Reward  : +1 for correct high-confidence prediction, -1 for wrong prediction,
              with intermediate shaping based on confidence margin

The REINFORCE update rule:
  ∇J(θ) ≈ Σ R_t · ∇log π_θ(a_t | s_t)

Additional reward shaping:
  - Penalizes overconfident WRONG predictions more heavily
  - Rewards correct predictions proportional to confidence margin
  - Entropy bonus to encourage exploration (avoids mode collapse)

SCORE HEAD FIX:
────────────────
The score head is retrained to output a calibrated confidence:
  - score = P(most-likely class) × 100   (continuous, not fixed labels)
  - This makes output vary naturally with input rather than defaulting to 95%

USAGE:
──────
  # With default args (loads from trained_model/, saves back there)
  python rl_finetune.py

  # Custom args
  python rl_finetune.py --dataset ./dataset --epochs 15 --lr 0.0001 --entropy_coeff 0.01

"""

import os
import sys
import json
import glob
import time
import random
import argparse
import numpy as np
from PIL import Image

# UTF-8 output for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

torch.set_num_threads(min(8, os.cpu_count() or 4))

# ─── 1. Import model architecture from train_torch.py ─────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_torch import DocuGuardPyTorchCNN, ForensicDataset, export_to_tfjs


# ─── 2. Reward Function ────────────────────────────────────────────────────────
def compute_reward(probs: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
    """
    Compute per-sample reward signals for REINFORCE.
    
    Args:
        probs  : (B, 3) softmax probabilities
        labels : (B,)   ground-truth class indices

    Returns:
        rewards : (B,) float tensor of per-sample rewards in [-2, +2]
    
    Reward Design:
        - correct + high confidence   → +2.0   (strong positive signal)
        - correct + low confidence    → +0.5   (mild positive)
        - wrong + low confidence      → -0.5   (mild negative, model was uncertain)
        - wrong + high confidence     → -2.0   (strong penalty for confident error)
        
    The margin (correct_prob - max_wrong_prob) determines confidence:
        margin > 0.5  → "high confidence"
        margin < 0.2  → "uncertain"
    """
    batch_size = probs.shape[0]
    rewards = torch.zeros(batch_size, dtype=torch.float32)

    for i in range(batch_size):
        correct_cls = labels[i].item()
        correct_prob = probs[i, correct_cls].item()

        # Best wrong class probability
        wrong_probs = [probs[i, j].item() for j in range(3) if j != correct_cls]
        max_wrong_prob = max(wrong_probs)

        # Is prediction correct?
        predicted_cls = probs[i].argmax().item()
        is_correct = (predicted_cls == correct_cls)

        # Confidence margin: how much better is the right class?
        margin = correct_prob - max_wrong_prob  # Range: [-1, +1]

        if is_correct:
            # Correct: reward proportional to confidence
            if margin > 0.5:
                rewards[i] = 2.0   # very confident and correct
            elif margin > 0.2:
                rewards[i] = 1.0   # moderately confident and correct
            else:
                rewards[i] = 0.5   # barely correct (uncertain)
        else:
            # Wrong: penalty proportional to how confidently wrong
            confidence_in_wrong = probs[i, predicted_cls].item()
            if confidence_in_wrong > 0.7:
                rewards[i] = -2.0  # very confident wrong = worst case
            elif confidence_in_wrong > 0.4:
                rewards[i] = -1.0  # somewhat confident wrong
            else:
                rewards[i] = -0.5  # barely wrong (uncertain — less bad)

    return rewards


# ─── 3. Calibrated Score Target (fixes the 95% collapse bug) ─────────────────
def calibrated_score_target(probs: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
    """
    Generate calibrated score targets instead of hardcoded 5/55/95.
    
    For REAL documents:
        - Score should be LOW (document is authentic → low "risk" score)
        - target = (1 - P(real)) * 30   [0–30 range for real]
    
    For TAMPERED documents:
        - Score should be HIGH
        - target = 70 + P(tampered) * 30   [70–100 range for tampered]
    
    For SUSPICIOUS:
        - Middle ground
        - target = 30 + P(suspicious) * 40 + P(tampered) * 20   [30–70 range]
    
    This means the score HEAD will learn a *continuous* function that
    varies with the actual softmax confidence — not a fixed number.
    """
    batch_size = probs.shape[0]
    targets = torch.zeros(batch_size, 1, dtype=torch.float32)

    p_real = probs[:, 0]       # (B,)
    p_susp = probs[:, 1]       # (B,)
    p_tamp = probs[:, 2]       # (B,)

    for i in range(batch_size):
        lbl = labels[i].item()
        if lbl == 0:  # real
            # Low risk score, varies with how confident real is
            targets[i, 0] = float((1.0 - p_real[i].item()) * 30.0)
        elif lbl == 1:  # suspicious
            targets[i, 0] = float(30.0 + p_susp[i].item() * 40.0 + p_tamp[i].item() * 20.0)
        else:  # tampered
            targets[i, 0] = float(70.0 + p_tamp[i].item() * 29.0)

    return targets.detach()


# ─── 4. RL Training Loop ───────────────────────────────────────────────────────
def rl_finetune(
    dataset_dir: str = 'dataset',
    model_path: str = 'trained_model/docuguard_best_pytorch.pt',
    epochs: int = 15,
    batch_size: int = 32,
    lr: float = 1e-4,
    entropy_coeff: float = 0.01,
    output_dir: str = 'public/ai-model',
):
    print("=" * 68)
    print("  DocuGuard AI — Reinforcement Learning Fine-Tuning")
    print("=" * 68)
    print(f"\n  Dataset  : {dataset_dir}")
    print(f"  Checkpoint: {model_path}")
    print(f"  Epochs   : {epochs}  |  LR: {lr}  |  Batch: {batch_size}")
    print(f"  Entropy bonus coeff: {entropy_coeff}")
    print()

    # ── Load dataset ──────────────────────────────────────────────────────────
    train_ds = ForensicDataset(dataset_dir, split='train')
    val_ds   = ForensicDataset(dataset_dir, split='val', augment=False)

    if len(train_ds) == 0:
        print("[!] No training data found. Exiting.")
        return

    # Class distribution summary
    class_counts = [0, 0, 0]
    for lbl in train_ds.labels:
        class_counts[lbl] += 1
    class_names = ['Real', 'Suspicious', 'Tampered']
    print("[Class Distribution]")
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        pct = 100.0 * count / max(len(train_ds), 1)
        print(f"  {name:12s}: {count:5d} ({pct:.1f}%)")
    print()

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False) if len(val_ds) > 0 else None

    # ── Load model ────────────────────────────────────────────────────────────
    model = DocuGuardPyTorchCNN()
    if os.path.exists(model_path):
        state = torch.load(model_path, map_location='cpu', weights_only=True)
        model.load_state_dict(state)
        print(f"[OK] Loaded pre-trained weights from: {model_path}", flush=True)
    else:
        print(f"[!] No checkpoint found at {model_path}, training from scratch.", flush=True)

    # ── Freeze backbone, only fine-tune classification + score heads ──────────
    # This prevents catastrophic forgetting of learned visual features
    frozen_layers = [
        model.conv1, model.bn1, model.conv2, model.bn2,
        model.conv3, model.bn3, model.conv4, model.bn4,
    ]
    for layer in frozen_layers:
        for param in layer.parameters():
            param.requires_grad = False
    print("[OK] Frozen early backbone layers (conv1–conv4) to prevent catastrophic forgetting.")
    print("[OK] Fine-tuning: conv5, conv6, heatmap, embedding, classification, score heads.\n")

    # Count trainable params
    total_params    = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Parameters: {total_params:,} total | {trainable_params:,} trainable ({100*trainable_params/total_params:.1f}%)\n")

    # ── Optimizer & Auxiliary losses ──────────────────────────────────────────
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=lr,
        weight_decay=1e-5
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    criterion_score = nn.MSELoss()

    # Balanced cross-entropy for supervised auxiliary loss
    total_samples = len(train_ds)
    cls_weights = torch.tensor(
        [total_samples / (3.0 * max(c, 1)) for c in class_counts],
        dtype=torch.float32
    )
    criterion_cls_supervised = nn.CrossEntropyLoss(weight=cls_weights)

    # ── Training ──────────────────────────────────────────────────────────────
    best_val_acc   = 0.0
    best_model_state = None
    history = []

    print(f"[>] Starting RL fine-tuning for {epochs} epochs...\n")

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()

        rl_loss_total = 0.0
        sup_loss_total = 0.0
        score_loss_total = 0.0
        entropy_total = 0.0
        correct = 0
        total = 0

        for batch_x, batch_y, _, batch_heat in train_loader:
            optimizer.zero_grad()

            logits, probs, score, heatmap = model(batch_x)

            # ── REINFORCE policy gradient ──────────────────────────────────
            # Sample actions from policy (for RL formulation)
            # We use the log-probability of the ground-truth action
            log_probs_all = F.log_softmax(logits, dim=-1)          # (B, 3)
            log_prob_taken = log_probs_all.gather(
                1, batch_y.unsqueeze(1)
            ).squeeze(1)                                            # (B,)

            with torch.no_grad():
                rewards = compute_reward(probs, batch_y)            # (B,) numpy-side

            # Baseline: mean reward (reduces variance)
            baseline = rewards.mean()
            advantages = rewards - baseline                         # (B,)

            # REINFORCE loss: -E[R · log π(a|s)]
            rl_loss = -(advantages * log_prob_taken).mean()

            # ── Entropy bonus (encourages exploration / avoids 95% collapse) ─
            entropy = -(probs * log_probs_all).sum(dim=-1).mean()
            entropy_loss = -entropy_coeff * entropy   # negative because we maximize entropy

            # ── Supervised auxiliary cross-entropy (stabilises training) ────
            sup_loss = criterion_cls_supervised(logits, batch_y)

            # ── Calibrated score regression (fixes the fixed 95% target bug) ─
            score_targets = calibrated_score_target(probs.detach(), batch_y)  # (B,1)
            score_loss = criterion_score(score, score_targets)

            # ── Heatmap auxiliary ────────────────────────────────────────────
            heat_target = batch_heat  # from dataset
            heat_loss   = F.binary_cross_entropy(heatmap, heat_target)

            # Combined loss: RL primary + supervised stabiliser + score fix
            loss = (
                0.5  * rl_loss        # REINFORCE policy gradient
                + 0.3  * sup_loss     # Supervised CE stabiliser
                + 0.15 * score_loss   # Score calibration
                + 0.05 * heat_loss    # Heatmap auxiliary
                + entropy_loss        # Entropy bonus
            )

            loss.backward()
            # Gradient clipping to prevent explosions
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            rl_loss_total    += rl_loss.item() * len(batch_y)
            sup_loss_total   += sup_loss.item() * len(batch_y)
            score_loss_total += score_loss.item() * len(batch_y)
            entropy_total    += entropy.item() * len(batch_y)

            pred = logits.argmax(dim=-1)
            correct += (pred == batch_y).sum().item()
            total   += len(batch_y)

        scheduler.step()

        train_acc = 100.0 * correct / max(total, 1)
        avg_rl    = rl_loss_total    / max(total, 1)
        avg_sup   = sup_loss_total   / max(total, 1)
        avg_score = score_loss_total / max(total, 1)
        avg_entr  = entropy_total    / max(total, 1)

        # ── Validation ────────────────────────────────────────────────────────
        val_acc  = 0.0
        per_class_correct = [0, 0, 0]
        per_class_total   = [0, 0, 0]
        avg_scores_per_class = [[], [], []]

        if val_loader:
            model.eval()
            with torch.no_grad():
                for vx, vy, _, _ in val_loader:
                    vlogits, vprobs, vscore, _ = model(vx)
                    vpred = vlogits.argmax(dim=-1)
                    for p, y, sc in zip(vpred, vy, vscore):
                        per_class_total[y.item()] += 1
                        if p.item() == y.item():
                            per_class_correct[y.item()] += 1
                        avg_scores_per_class[y.item()].append(sc.item())

            val_total_correct = sum(per_class_correct)
            val_total_samples = sum(per_class_total)
            val_acc = 100.0 * val_total_correct / max(val_total_samples, 1)

        epoch_time = time.time() - epoch_start

        print(
            f"Epoch {epoch:02d}/{epochs:02d} [{epoch_time:.1f}s] | "
            f"Train Acc: {train_acc:.1f}% | Val Acc: {val_acc:.1f}% | "
            f"RL: {avg_rl:.4f} | Sup: {avg_sup:.4f} | Score: {avg_score:.4f} | "
            f"Entropy: {avg_entr:.4f}",
            flush=True
        )

        # Per-class validation accuracy
        if val_loader:
            class_acc_str = " | ".join(
                f"{name}: {100*per_class_correct[i]/max(per_class_total[i],1):.1f}%"
                for i, name in enumerate(class_names)
            )
            avg_score_str = " | ".join(
                f"{name} avg_score: {np.mean(avg_scores_per_class[i]):.1f}"
                if avg_scores_per_class[i] else f"{name}: N/A"
                for i, name in enumerate(class_names)
            )
            print(f"         Per-class Acc  : {class_acc_str}", flush=True)
            print(f"         Predicted Scores: {avg_score_str}", flush=True)

        history.append({
            'epoch': epoch,
            'train_acc': round(train_acc, 2),
            'val_acc': round(val_acc, 2),
            'rl_loss': round(avg_rl, 4),
            'sup_loss': round(avg_sup, 4),
            'score_loss': round(avg_score, 4),
            'entropy': round(avg_entr, 4),
        })

        if val_acc > best_val_acc or best_model_state is None:
            best_val_acc = val_acc
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            print(f"  [★] New best: Val Acc = {best_val_acc:.2f}% — checkpoint saved!", flush=True)

        print()

    # ── Save best checkpoint ──────────────────────────────────────────────────
    if best_model_state:
        model.load_state_dict(best_model_state)
        print(f"[OK] Loaded best checkpoint (Val Acc: {best_val_acc:.2f}%)\n", flush=True)

    os.makedirs('trained_model', exist_ok=True)
    rl_pt_path = 'trained_model/docuguard_rl_finetuned.pt'
    torch.save(model.state_dict(), rl_pt_path)
    print(f"[OK] RL fine-tuned PyTorch model saved: {rl_pt_path}", flush=True)

    # Also overwrite the main checkpoint so the website uses the RL model
    torch.save(model.state_dict(), 'trained_model/docuguard_best_pytorch.pt')
    print("[OK] Also updated: trained_model/docuguard_best_pytorch.pt (used by website)", flush=True)

    # ── Export to TF.js ───────────────────────────────────────────────────────
    export_to_tfjs(model, output_dir=output_dir)

    # ── Update metadata ───────────────────────────────────────────────────────
    # Per-class accuracy (final val pass)
    per_class_acc = {
        name: round(100.0 * per_class_correct[i] / max(per_class_total[i], 1), 2)
        for i, name in enumerate(class_names)
    }

    meta_path = os.path.join(output_dir, 'model_metadata.json')
    meta = {
        "model_name": "DocuGuard_Forensic_CNN_RL",
        "version": "2.0.0-rl-finetuned",
        "status": "READY — RL fine-tuned with REINFORCE + calibrated score head",
        "description": (
            "Fine-tuned with Reinforcement Learning (REINFORCE policy gradient). "
            "Fixes the score collapse bug where all inputs produced ~95% credit. "
            "Score now represents calibrated confidence: 0–30 for real, "
            "30–70 for suspicious, 70–100 for tampered documents."
        ),
        "rl_method": "REINFORCE with reward shaping + entropy bonus",
        "score_calibration": "Dynamic: based on softmax confidence, not fixed targets",
        "input_size": 224,
        "classes": ["real", "suspicious", "tampered"],
        "num_classes": 3,
        "epochs_rl_trained": epochs,
        "best_val_accuracy_after_rl": round(best_val_acc, 2),
        "per_class_val_accuracy": per_class_acc,
        "training_history": history,
        "frozen_layers": ["conv1", "bn1", "conv2", "bn2", "conv3", "bn3", "conv4", "bn4"],
        "trainable_layers": ["conv5", "bn5", "conv6_reduce", "bn6", "heatmap_conv",
                              "embedding_dense", "classification_output", "score_output"],
    }

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    print(f"[OK] Metadata updated: {meta_path}", flush=True)

    print("\n" + "=" * 68)
    print("  RL FINE-TUNING COMPLETE")
    print(f"  Best Validation Accuracy : {best_val_acc:.2f}%")
    print(f"  Per-class: {per_class_acc}")
    print("=" * 68, flush=True)


# ─── 5. Entry Point ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='DocuGuard RL Fine-Tuner')
    parser.add_argument('--dataset',        type=str, default='dataset',
                        help='Path to dataset root (with train/ and val/ subdirs)')
    parser.add_argument('--model',          type=str, default='trained_model/docuguard_best_pytorch.pt',
                        help='Path to pre-trained .pt checkpoint')
    parser.add_argument('--epochs',         type=int, default=15,
                        help='Number of RL fine-tuning epochs')
    parser.add_argument('--batch',          type=int, default=32,
                        help='Batch size')
    parser.add_argument('--lr',             type=float, default=1e-4,
                        help='Learning rate (lower than supervised training)')
    parser.add_argument('--entropy_coeff',  type=float, default=0.01,
                        help='Entropy bonus coefficient (higher → more exploration)')
    parser.add_argument('--output',         type=str, default='public/ai-model',
                        help='Output directory for TF.js model export')
    args = parser.parse_args()

    rl_finetune(
        dataset_dir    = args.dataset,
        model_path     = args.model,
        epochs         = args.epochs,
        batch_size     = args.batch,
        lr             = args.lr,
        entropy_coeff  = args.entropy_coeff,
        output_dir     = args.output,
    )
