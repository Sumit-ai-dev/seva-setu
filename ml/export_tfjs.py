# -*- coding: utf-8 -*-
"""
export_tfjs.py
Manually export a trained Keras .h5 model to TF.js layers-model format.
Works around the protobuf/tf_keras incompatibility with tensorflowjs_converter.

Usage:
    py -3.11 export_tfjs.py
"""

import json
import os
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import tensorflow as tf

HERE    = os.path.dirname(os.path.abspath(__file__))
H5_IN   = os.path.join(HERE, "frontend", "isl_model.h5")
OUT_DIR = os.path.join(HERE, "frontend", "public", "tfjs_model")

print("Loading " + H5_IN + " ...")
model = tf.keras.models.load_model(H5_IN)
model.summary()

# ── Extract weights in model.weights order ────────────────────────────────────
weight_manifest = []
weight_data     = b""

for w in model.weights:
    name = w.name
    if name.endswith(":0"):
        name = name[:-2]
    arr = w.numpy().astype(np.float32)
    weight_manifest.append({
        "name":  name,
        "shape": list(arr.shape),
        "dtype": "float32",
    })
    weight_data += arr.tobytes()

# ── Build model.json ──────────────────────────────────────────────────────────
topo = json.loads(model.to_json())
topo["keras_version"] = "2.15.0"
topo["backend"]       = "tensorflow"

model_json = {
    "format":        "layers-model",
    "generatedBy":   "keras v2.15.0",
    "convertedBy":   "TensorFlow.js Converter v4.22.0",
    "modelTopology": topo,
    "weightsManifest": [{
        "paths":   ["group1-shard1of1.bin"],
        "weights": weight_manifest,
    }],
}

os.makedirs(OUT_DIR, exist_ok=True)

bin_path  = os.path.join(OUT_DIR, "group1-shard1of1.bin")
json_path = os.path.join(OUT_DIR, "model.json")

with open(bin_path, "wb") as f:
    f.write(weight_data)

with open(json_path, "w") as f:
    json.dump(model_json, f)

total_params = sum(np.prod(w["shape"]) for w in weight_manifest)
print("\nExported:")
print("  " + json_path)
print("  " + bin_path + " (" + str(len(weight_data)) + " bytes, " +
      str(total_params) + " params)")
print("\nDone. Refresh the browser to load the new model.")
