#!/usr/bin/env python3
"""
h5_to_tfjs.py
──────────────────────────────────────────────────────────────────────────────
Minimal converter: Keras .h5 -> TF.js layers-model format.
Works WITHOUT the tensorflowjs package.

Supports: Dense, BatchNormalization, Dropout (inference layers only).
Exactly what isl_gesture_mlp uses.

Usage:
  python h5_to_tfjs.py --h5 isl_model.h5 --output ../public/tfjs_model
──────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
import os
import struct
import numpy as np
import h5py


def read_model_config(h5file):
    """Extract model JSON config from .h5 file."""
    config_str = h5file.attrs.get('model_config', None)
    if config_str is None:
        raise ValueError('No model_config found in .h5 file')
    if isinstance(config_str, bytes):
        config_str = config_str.decode('utf-8')
    return json.loads(config_str)


def collect_weights(h5file, model_config):
    """
    Walk the model layers and collect weight arrays in TF.js order.
    H5 structure: model_weights/<layer>/<layer>/<weight>:0
    Returns list of (tfjs_name, np.ndarray) tuples.
    """
    weights = []
    layers = model_config['config']['layers']
    weight_group = h5file['model_weights']

    LAYER_WEIGHTS = {
        'Dense':               ['kernel', 'bias'],
        'BatchNormalization':  ['gamma', 'beta', 'moving_mean', 'moving_variance'],
    }

    for layer in layers:
        cls  = layer['class_name']
        name = layer['config']['name']

        if cls not in LAYER_WEIGHTS:
            continue   # InputLayer, Dropout — no weights

        outer = weight_group.get(name)
        if outer is None:
            continue

        # Inner group has the same name as the layer
        inner = outer.get(name) or outer

        for wname in LAYER_WEIGHTS[cls]:
            # Keras saves with ':0' suffix
            ds = inner.get(f'{wname}:0') or inner.get(wname)
            if ds is not None:
                weights.append((f'{name}/{wname}', ds[:]))

    return weights


def weights_to_bin(weight_list):
    """Pack all weights into one flat binary blob (float32, little-endian)."""
    arrays = [w.astype('<f4').tobytes() for _, w in weight_list]
    return b''.join(arrays)


def build_manifest(weight_list):
    """Build the weightsManifest entry for model.json."""
    entries = []
    offset  = 0
    for name, arr in weight_list:
        size_bytes = arr.size * 4
        entries.append({
            'name':  name,
            'shape': list(arr.shape),
            'dtype': 'float32',
        })
        offset += size_bytes
    return entries


def build_model_json(h5file, weight_entries, shard_filename):
    """Reconstruct model.json in TF.js layers-model format."""
    model_config = read_model_config(h5file)

    # Keras version info
    keras_version = h5file.attrs.get('keras_version', b'unknown')
    if isinstance(keras_version, bytes):
        keras_version = keras_version.decode()

    return {
        'format':      'layers-model',
        'generatedBy': f'keras v{keras_version}',
        'convertedBy': 'h5_to_tfjs.py (custom)',
        'modelTopology': model_config,
        'weightsManifest': [{
            'paths':   [shard_filename],
            'weights': weight_entries,
        }],
    }


def convert(h5_path: str, output_dir: str):
    shard_filename = 'group1-shard1of1.bin'
    os.makedirs(output_dir, exist_ok=True)

    with h5py.File(h5_path, 'r') as f:
        model_config = read_model_config(f)
        weight_list  = collect_weights(f, model_config)

    print(f'Collected {len(weight_list)} weight tensors:')
    for name, arr in weight_list:
        print(f'  {name:45s} {str(arr.shape):15s} {arr.dtype}')

    bin_data      = weights_to_bin(weight_list)
    weight_entries = build_manifest(weight_list)

    bin_path = os.path.join(output_dir, shard_filename)
    with open(bin_path, 'wb') as f:
        f.write(bin_data)
    print(f'\nWrote {len(bin_data):,} bytes -> {bin_path}')

    with h5py.File(h5_path, 'r') as f:
        model_json = build_model_json(f, weight_entries, shard_filename)

    json_path = os.path.join(output_dir, 'model.json')
    with open(json_path, 'w') as f:
        json.dump(model_json, f)
    print(f'Wrote model.json -> {json_path}')
    print('\nDone! Copy the output folder into /public/tfjs_model/')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--h5',     default='isl_model.h5')
    parser.add_argument('--output', default='../public/tfjs_model')
    args = parser.parse_args()
    convert(args.h5, args.output)


if __name__ == '__main__':
    main()
