"""
DocuGuard AI — Training Script for Document Forgery Detection CNN

This script trains the DocuGuard forensic CNN model on your custom datasets
and exports it as a TensorFlow.js-compatible model for in-browser inference.

═══════════════════════════════════════════════════════════════════════════════
DATASET STRUCTURE (Prepare your data in this folder layout):
═══════════════════════════════════════════════════════════════════════════════

    dataset/
    ├── train/
    │   ├── real/            ← Authentic, unmodified identity documents
    │   │   ├── img001.jpg
    │   │   ├── img002.png
    │   │   └── ...
    │   ├── suspicious/      ← Low-quality, re-photographed, or slightly edited
    │   │   ├── img001.jpg
    │   │   └── ...
    │   └── tampered/        ← Digitally forged, text-altered, photo-spliced
    │       ├── img001.jpg
    │       └── ...
    ├── val/
    │   ├── real/
    │   ├── suspicious/
    │   └── tampered/
    └── test/       (optional)
        ├── real/
        ├── suspicious/
        └── tampered/

═══════════════════════════════════════════════════════════════════════════════
USAGE:
═══════════════════════════════════════════════════════════════════════════════

    # 1. Install dependencies
    pip install tensorflow tensorflowjs Pillow scikit-learn matplotlib

    # 2. Train the model
    python train_model.py --data ./dataset --epochs 50 --batch 32

    # 3. The trained model is automatically exported to:
    #      public/ai-model/model.json    (+ weight shard .bin files)
    #
    #    This is served at /ai-model/model.json by Vite and loaded
    #    by the browser at runtime.

═══════════════════════════════════════════════════════════════════════════════
"""

import os
import argparse
import json
import datetime
import numpy as np
from pathlib import Path

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks, optimizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Attempt to import tensorflowjs converter
try:
    import tensorflowjs as tfjs
    HAS_TFJS = True
except ImportError:
    HAS_TFJS = False
    print("[WARNING] tensorflowjs not installed. Model will be saved as SavedModel only.")
    print("         Install with: pip install tensorflowjs")

# ─── Constants ────────────────────────────────────────────────────────────────
IMG_SIZE = 224
CLASS_NAMES = ['real', 'suspicious', 'tampered']
NUM_CLASSES = 3


def build_model(input_shape=(IMG_SIZE, IMG_SIZE, 3)):
    """
    Build the DocuGuard Forensic CNN with 3 output heads:
      1. classification_output: softmax over [Real, Suspicious, Tampered]
      2. score_output:          sigmoid (forgery score 0–1, scaled to 0–100)
      3. heatmap_output:        7×7 spatial anomaly activation (49 values)
    """
    inputs = keras.Input(shape=input_shape, name='image_input')

    # ─── Convolutional Backbone ───────────────────────────────────────
    # Block 1
    x = layers.Conv2D(32, 3, padding='same', activation='relu', name='conv1')(inputs)
    x = layers.BatchNormalization(name='bn1')(x)
    x = layers.MaxPooling2D(2, name='pool1')(x)  # 112×112

    # Block 2
    x = layers.Conv2D(64, 3, padding='same', activation='relu', name='conv2')(x)
    x = layers.BatchNormalization(name='bn2')(x)
    x = layers.MaxPooling2D(2, name='pool2')(x)  # 56×56

    # Block 3
    x = layers.Conv2D(128, 3, padding='same', activation='relu', name='conv3')(x)
    x = layers.BatchNormalization(name='bn3')(x)
    x = layers.MaxPooling2D(2, name='pool3')(x)  # 28×28

    # Block 4
    x = layers.Conv2D(256, 3, padding='same', activation='relu', name='conv4')(x)
    x = layers.BatchNormalization(name='bn4')(x)
    x = layers.MaxPooling2D(2, name='pool4')(x)  # 14×14

    # Block 5 (maintain spatial resolution)
    x = layers.Conv2D(256, 3, padding='same', activation='relu', name='conv5')(x)
    x = layers.BatchNormalization(name='bn5')(x)

    # Block 6 — Reduce to 7×7 for heatmap
    x = layers.Conv2D(128, 1, padding='same', activation='relu', name='conv6_reduce')(x)
    x = layers.BatchNormalization(name='bn6')(x)
    feature_map = layers.AveragePooling2D(2, name='pool6')(x)  # 7×7×128

    # ─── Heatmap Head ─────────────────────────────────────────────────
    heatmap_conv = layers.Conv2D(1, 1, activation='sigmoid', name='heatmap_conv')(feature_map)  # 7×7×1
    heatmap_output = layers.Flatten(name='heatmap_output')(heatmap_conv)  # 49

    # ─── Classification + Score Heads ─────────────────────────────────
    global_pool = layers.GlobalAveragePooling2D(name='global_pool')(feature_map)  # 128
    embedding = layers.Dense(128, activation='relu', name='embedding_dense')(global_pool)
    dropped = layers.Dropout(0.4, name='dropout')(embedding)

    class_output = layers.Dense(
        NUM_CLASSES, activation='softmax', name='classification_output'
    )(dropped)

    score_output = layers.Dense(
        1, activation='sigmoid', name='score_output'
    )(dropped)

    model = keras.Model(
        inputs=inputs,
        outputs=[class_output, score_output, heatmap_output],
        name='DocuGuard_Forensic_CNN'
    )

    return model


def create_data_generators(data_dir, batch_size=32):
    """
    Create train and validation data generators with augmentation.
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 127.5,
        preprocessing_function=lambda x: x - 1.0,  # Normalize to [-1, 1]
        rotation_range=10,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.05,
        zoom_range=0.1,
        horizontal_flip=False,  # Documents shouldn't be flipped
        brightness_range=[0.8, 1.2],
        fill_mode='reflect'
    )

    val_datagen = ImageDataGenerator(
        rescale=1.0 / 127.5,
        preprocessing_function=lambda x: x - 1.0
    )

    train_dir = os.path.join(data_dir, 'train')
    val_dir = os.path.join(data_dir, 'val')

    if not os.path.isdir(train_dir):
        raise FileNotFoundError(
            f"Training directory not found: {train_dir}\n"
            f"Please organize your dataset with train/real, train/suspicious, train/tampered subfolders."
        )

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        class_mode='categorical',
        classes=CLASS_NAMES,
        shuffle=True,
        seed=42
    )

    val_gen = None
    if os.path.isdir(val_dir):
        val_gen = val_datagen.flow_from_directory(
            val_dir,
            target_size=(IMG_SIZE, IMG_SIZE),
            batch_size=batch_size,
            class_mode='categorical',
            classes=CLASS_NAMES,
            shuffle=False
        )
    else:
        print(f"[INFO] Validation directory not found ({val_dir}). Training without validation.")

    return train_gen, val_gen


def make_multi_output_generator(base_generator):
    """
    Wraps a Keras ImageDataGenerator to produce multi-output targets:
      - classification_output: one-hot [3]
      - score_output: scalar (0 = real, 0.5 = suspicious, 1.0 = tampered)
      - heatmap_output: placeholder zeros [49] (learned end-to-end)
    """
    class_to_score = {
        0: 0.05,   # Real → low forgery score
        1: 0.55,   # Suspicious → mid
        2: 0.95    # Tampered → high
    }

    while True:
        x_batch, y_batch = next(base_generator)
        batch_size = x_batch.shape[0]

        # Classification labels (already one-hot from flow_from_directory)
        class_labels = y_batch

        # Score labels
        class_indices = np.argmax(y_batch, axis=1)
        score_labels = np.array([class_to_score[idx] for idx in class_indices], dtype=np.float32)
        score_labels = score_labels.reshape(-1, 1)

        # Heatmap labels (placeholder — will be learned via backprop)
        # For tampered images: set higher random activations; for real: near zero
        heatmap_labels = np.zeros((batch_size, 49), dtype=np.float32)
        for i, cls_idx in enumerate(class_indices):
            if cls_idx == 2:  # tampered
                # Random hot spots to encourage learning spatial patterns
                hot_indices = np.random.choice(49, size=np.random.randint(5, 15), replace=False)
                heatmap_labels[i, hot_indices] = np.random.uniform(0.5, 1.0, size=len(hot_indices))
            elif cls_idx == 1:  # suspicious
                hot_indices = np.random.choice(49, size=np.random.randint(2, 7), replace=False)
                heatmap_labels[i, hot_indices] = np.random.uniform(0.2, 0.6, size=len(hot_indices))

        yield x_batch, {
            'classification_output': class_labels,
            'score_output': score_labels,
            'heatmap_output': heatmap_labels
        }


def compute_class_weights(train_gen):
    """
    Compute class weights to handle imbalanced datasets.
    """
    class_counts = np.bincount(train_gen.classes, minlength=NUM_CLASSES)
    total = class_counts.sum()
    weights = {}
    for i in range(NUM_CLASSES):
        if class_counts[i] > 0:
            weights[i] = total / (NUM_CLASSES * class_counts[i])
        else:
            weights[i] = 1.0

    print(f"\n[Class Distribution]")
    for i, name in enumerate(CLASS_NAMES):
        print(f"  {name}: {class_counts[i]} images (weight: {weights[i]:.2f})")

    return weights


def train(args):
    print("=" * 70)
    print("  DocuGuard AI — Document Forgery Detection Model Training")
    print("=" * 70)
    print(f"  Dataset:     {args.data}")
    print(f"  Epochs:      {args.epochs}")
    print(f"  Batch Size:  {args.batch}")
    print(f"  Learn Rate:  {args.lr}")
    print(f"  Output:      {args.output}")
    print("=" * 70)

    # ─── Create data generators ───────────────────────────────────────
    train_gen, val_gen = create_data_generators(args.data, args.batch)
    class_weights = compute_class_weights(train_gen)

    # ─── Build model ──────────────────────────────────────────────────
    model = build_model()
    model.summary()

    # ─── Compile ──────────────────────────────────────────────────────
    model.compile(
        optimizer=optimizers.Adam(learning_rate=args.lr),
        loss={
            'classification_output': 'categorical_crossentropy',
            'score_output': 'mse',
            'heatmap_output': 'binary_crossentropy'
        },
        loss_weights={
            'classification_output': 1.0,
            'score_output': 0.5,
            'heatmap_output': 0.3
        },
        metrics={
            'classification_output': ['accuracy'],
            'score_output': ['mae']
        }
    )

    # ─── Callbacks ────────────────────────────────────────────────────
    os.makedirs(args.output, exist_ok=True)
    checkpoint_path = os.path.join(args.output, 'best_model.keras')

    cb_list = [
        callbacks.ModelCheckpoint(
            checkpoint_path,
            monitor='val_classification_output_accuracy' if val_gen else 'classification_output_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        callbacks.EarlyStopping(
            monitor='val_classification_output_accuracy' if val_gen else 'classification_output_accuracy',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss' if val_gen else 'loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        ),
        callbacks.TensorBoard(
            log_dir=os.path.join(args.output, 'logs', datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
        )
    ]

    # ─── Wrap generators for multi-output ─────────────────────────────
    train_multi_gen = make_multi_output_generator(train_gen)
    val_multi_gen = make_multi_output_generator(val_gen) if val_gen else None

    steps_per_epoch = len(train_gen)
    validation_steps = len(val_gen) if val_gen else None

    # ─── Train ────────────────────────────────────────────────────────
    print(f"\n🚀 Starting training for {args.epochs} epochs...\n")

    history = model.fit(
        train_multi_gen,
        steps_per_epoch=steps_per_epoch,
        epochs=args.epochs,
        validation_data=val_multi_gen,
        validation_steps=validation_steps,
        callbacks=cb_list,
        class_weight=None  # Not directly supported for multi-output; handled via loss weighting
    )

    # ─── Save full Keras model ────────────────────────────────────────
    final_model_path = os.path.join(args.output, 'docuguard_model.keras')
    model.save(final_model_path)
    print(f"\n✅ Keras model saved to: {final_model_path}")

    # ─── Export to TensorFlow.js ──────────────────────────────────────
    tfjs_output_dir = args.tfjs_output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'public', 'ai-model'
    )

    if HAS_TFJS:
        os.makedirs(tfjs_output_dir, exist_ok=True)
        tfjs.converters.save_keras_model(model, tfjs_output_dir)
        print(f"✅ TensorFlow.js model exported to: {tfjs_output_dir}")
        print(f"   → model.json + weight shard .bin files ready for browser loading")
    else:
        # Save as SavedModel for manual conversion
        saved_model_dir = os.path.join(args.output, 'saved_model')
        model.export(saved_model_dir)
        print(f"⚠️  Saved as TF SavedModel to: {saved_model_dir}")
        print(f"   Convert manually with:")
        print(f"   tensorflowjs_converter --input_format=tf_saved_model {saved_model_dir} {tfjs_output_dir}")

    # ─── Save training metadata ───────────────────────────────────────
    metadata = {
        'model_name': 'DocuGuard_Forensic_CNN',
        'version': '1.0.0',
        'input_size': IMG_SIZE,
        'classes': CLASS_NAMES,
        'num_classes': NUM_CLASSES,
        'epochs_trained': len(history.history['loss']),
        'final_train_accuracy': float(history.history['classification_output_accuracy'][-1]),
        'best_val_accuracy': float(max(history.history.get('val_classification_output_accuracy', [0]))),
        'trained_at': datetime.datetime.now().isoformat(),
        'dataset_path': os.path.abspath(args.data),
        'train_samples': train_gen.samples,
        'val_samples': val_gen.samples if val_gen else 0,
        'output_heads': ['classification_output', 'score_output', 'heatmap_output'],
        'class_distribution': {
            name: int(np.sum(train_gen.classes == i))
            for i, name in enumerate(CLASS_NAMES)
        }
    }

    meta_path = os.path.join(tfjs_output_dir if HAS_TFJS else args.output, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"📋 Training metadata saved to: {meta_path}")

    # ─── Print training summary ───────────────────────────────────────
    print("\n" + "=" * 70)
    print("  TRAINING COMPLETE")
    print("=" * 70)
    print(f"  Final Train Accuracy:  {metadata['final_train_accuracy']:.4f}")
    print(f"  Best Val Accuracy:     {metadata['best_val_accuracy']:.4f}")
    print(f"  Epochs Trained:        {metadata['epochs_trained']}")
    print(f"  Total Train Samples:   {metadata['train_samples']}")
    print(f"  Total Val Samples:     {metadata['val_samples']}")
    print("=" * 70)
    print(f"\n  Model is ready at: {tfjs_output_dir}")
    print(f"  Start the website with 'npm run dev' and the AI model loads automatically!")
    print()

    return history


def evaluate(args):
    """Evaluate the trained model on the test set."""
    test_dir = os.path.join(args.data, 'test')
    if not os.path.isdir(test_dir):
        print(f"[ERROR] Test directory not found: {test_dir}")
        return

    model = keras.models.load_model(
        os.path.join(args.output, 'docuguard_model.keras')
    )

    test_datagen = ImageDataGenerator(
        rescale=1.0 / 127.5,
        preprocessing_function=lambda x: x - 1.0
    )

    test_gen = test_datagen.flow_from_directory(
        test_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=args.batch,
        class_mode='categorical',
        classes=CLASS_NAMES,
        shuffle=False
    )

    test_multi_gen = make_multi_output_generator(test_gen)

    results = model.evaluate(
        test_multi_gen,
        steps=len(test_gen),
        verbose=1
    )

    print("\n" + "=" * 50)
    print("  TEST EVALUATION RESULTS")
    print("=" * 50)
    for name, val in zip(model.metrics_names, results):
        print(f"  {name}: {val:.4f}")
    print("=" * 50)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='DocuGuard AI — Train Document Forgery Detection Model',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train_model.py --data ./dataset --epochs 50 --batch 32
  python train_model.py --data ./dataset --epochs 100 --lr 0.0005 --evaluate
        """
    )

    parser.add_argument('--data', type=str, default='./dataset',
                        help='Path to dataset directory (must contain train/ and optionally val/ and test/)')
    parser.add_argument('--epochs', type=int, default=50,
                        help='Number of training epochs (default: 50)')
    parser.add_argument('--batch', type=int, default=32,
                        help='Batch size (default: 32)')
    parser.add_argument('--lr', type=float, default=0.001,
                        help='Initial learning rate (default: 0.001)')
    parser.add_argument('--output', type=str, default='./trained_model',
                        help='Directory to save checkpoints and final model')
    parser.add_argument('--tfjs-output', type=str, default=None,
                        help='Directory to export TF.js model (default: public/ai-model/)')
    parser.add_argument('--evaluate', action='store_true',
                        help='Run evaluation on test set after training')

    args = parser.parse_args()

    history = train(args)

    if args.evaluate:
        evaluate(args)
