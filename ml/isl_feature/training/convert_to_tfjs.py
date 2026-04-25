"""
convert_to_tfjs.py
Converts isl_model.h5 to TF.js layers-model format without tensorflowjs CLI.
Writes model.json + group1-shard1of1.bin to frontend/public/tfjs_model/.
"""

import json
import struct
from pathlib import Path

import h5py
import numpy as np
import tensorflow as tf

H5_PATH  = Path(__file__).resolve().parents[2] / "frontend" / "isl_model.h5"
OUT_DIR  = Path(__file__).resolve().parents[2] / "frontend" / "public" / "tfjs_model"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Load model ────────────────────────────────────────────────────────────────
print(f"Loading {H5_PATH}")
model = tf.keras.models.load_model(str(H5_PATH))

# ── Collect weights in layer order ───────────────────────────────────────────
weight_entries = []
all_bytes      = bytearray()

for w in model.weights:
    arr   = w.numpy().astype(np.float32)
    name  = w.name.replace(":0", "")
    entry = {
        "name":  name,
        "shape": list(arr.shape),
        "dtype": "float32",
    }
    weight_entries.append(entry)
    all_bytes.extend(arr.tobytes())

# ── Write binary shard ────────────────────────────────────────────────────────
shard_name = "group1-shard1of1.bin"
with open(OUT_DIR / shard_name, "wb") as f:
    f.write(all_bytes)
print(f"Wrote {len(all_bytes)} bytes -> {shard_name}")

# ── Build model.json ──────────────────────────────────────────────────────────
model_config = json.loads(model.to_json())

model_json = {
    "format":       "layers-model",
    "generatedBy":  "keras v" + tf.__version__,
    "convertedBy":  "custom convert_to_tfjs.py",
    "modelTopology": model_config,
    "weightsManifest": [
        {
            "paths":   [shard_name],
            "weights": weight_entries,
        }
    ],
}

with open(OUT_DIR / "model.json", "w") as f:
    json.dump(model_json, f)
print(f"Wrote model.json -> {OUT_DIR}")
print("TF.js conversion complete.")
