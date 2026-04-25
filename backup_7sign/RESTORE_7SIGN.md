# Restore 7-sign model

Run these commands from `swasth-scaler/` to go back to the working 7-sign detection:

```bash
cp backup_7sign/tfjs_model/model.json            frontend/public/tfjs_model/model.json
cp backup_7sign/tfjs_model/group1-shard1of1.bin  frontend/public/tfjs_model/group1-shard1of1.bin
cp backup_7sign/isl_model.h5                     frontend/isl_model.h5
cp backup_7sign/training_data.json               frontend/training_data.json
cp backup_7sign/label_classes.json               frontend/public/label_classes.json
```

Then in `frontend/src/utils/inferenceEngine.js` change LABELS back to:
```js
export const LABELS = [
    'BREATHLESS',
    'COUGH',
    'DIZZINESS',
    'FEVER',
    'PAIN',
    'VOMIT',
    'WEAKNESS',
    'UNKNOWN',
]
```

That's it — 7-sign detection restored.
