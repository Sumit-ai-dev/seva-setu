# Keras MLP training + TF.js conversion
#!/usr/bin/env python3
"""
train_model.py
──────────────────────────────────────────────────────────────────────────────
Trains a lightweight MLP gesture classifier on hand-landmark data exported
from the DataCollector tool, then converts it to TensorFlow.js format.

Architecture:
  Input(126) → Dense(128, relu) → Dropout(0.3) → Dense(64, relu)
             → Dropout(0.2) → Dense(NUM_CLASSES, softmax)

Usage:
  python train_model.py \
      --data   training_data.json \
      --output ./public/tfjs_model \
      --epochs 80

Requirements:
  pip install tensorflow scikit-learn numpy tensorflowjs
──────────────────────────────────────────────────────────────────────────────
"""

import argparse, json, os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing   import LabelEncoder
from sklearn.metrics         import classification_report
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from h5_to_tfjs import convert as h5_to_tfjs_convert


# ─── CLI args ─────────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data',   default='training_data.json', help='Path to JSON dataset')
    p.add_argument('--output', default='./public/tfjs_model', help='Output folder for TF.js model')
    p.add_argument('--epochs', type=int, default=80)
    p.add_argument('--batch',  type=int, default=32)
    p.add_argument('--test_split', type=float, default=0.2)
    return p.parse_args()


# ─── Load dataset ─────────────────────────────────────────────────────────────
def load_dataset(path: str):
    """
    Expects JSON of shape:
        { "FEVER": [[f0,…,fN], …], "COUGH": [[…], …], … }
    Samples may have 63 or 126 features. 63-feature samples are zero-padded
    to 126 (right-hand only → left-hand zeros) for two-hand model compatibility.
    Returns X: np.ndarray[N, 126], y: np.ndarray[N] (string labels)
    """
    with open(path) as f:
        raw = json.load(f)

    X_list, y_list = [], []
    for class_name, samples in raw.items():
        for sample in samples:
            if len(sample) == 63:
                # Pad to 126: right-hand features + zeros for left hand
                sample = sample + [0.0] * 63
            X_list.append(sample)
            y_list.append(class_name.upper())

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)

    print(f'[Data] Loaded {len(X)} samples across {len(raw)} classes')
    for cls in sorted(raw):
        print(f'  {cls}: {len(raw[cls])} samples')

    return X, y


# ─── Build model ──────────────────────────────────────────────────────────────
def build_model(num_classes: int) -> keras.Model:
    """
    Lightweight MLP — fast enough for browser inference via TF.js.
    Input: 126 normalised landmark features (right[63] + left[63])
    Output: softmax over num_classes
    """
    model = keras.Sequential([
        layers.Input(shape=(126,)),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax'),
    ], name='isl_gesture_mlp')

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.summary()
    return model


# ─── Train ────────────────────────────────────────────────────────────────────
def train(args):
    # 1. Load data
    X, y_raw = load_dataset(args.data)

    # 2. Encode labels → integers
    le = LabelEncoder()
    le.fit(sorted(set(y_raw)))          # sorted → deterministic order
    y  = le.transform(y_raw)

    # Save label order so the JS side can be kept in sync
    labels_path = os.path.join(os.path.dirname(args.output) or '.', 'label_classes.json')
    with open(labels_path, 'w') as f:
        json.dump(list(le.classes_), f, indent=2)
    print(f'\n[Labels] Order saved to {labels_path}')
    print(f'[Labels] {list(le.classes_)}')

    # 3. Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_split, random_state=42, stratify=y
    )
    print(f'\n[Split] Train: {len(X_train)}  Test: {len(X_test)}')

    # 4. Build and train
    model = build_model(num_classes=len(le.classes_))

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=12,
            restore_best_weights=True, verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=6, verbose=1,
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=args.epochs,
        batch_size=args.batch,
        callbacks=callbacks,
        verbose=1,
    )

    # 5. Evaluate
    y_pred     = np.argmax(model.predict(X_test), axis=1)
    class_names = le.classes_
    print('\n[Eval] Classification report:')
    print(classification_report(y_test, y_pred, target_names=class_names))

    # 6. Save .h5 (optional backup)
    h5_path = 'isl_model.h5'
    model.save(h5_path)
    print(f'[Save] Keras model -> {h5_path}')

    # 7. Convert to TF.js format
    os.makedirs(args.output, exist_ok=True)
    h5_to_tfjs_convert(h5_path, args.output)
    print(f'[Convert] TF.js model -> {args.output}/')

    # 8. Print final accuracy
    _, train_acc = model.evaluate(X_train, y_train, verbose=0)
    _, test_acc  = model.evaluate(X_test,  y_test,  verbose=0)
    print(f'\n[Result] Train accuracy: {train_acc:.4f}  Test accuracy: {test_acc:.4f}')

    print('\nDone! Copy the tfjs_model/ folder into /public/ before running the React app.')


if __name__ == '__main__':
    train(parse_args())