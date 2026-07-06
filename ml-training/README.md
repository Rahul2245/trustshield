# ML Training Pipeline

This folder builds the model artifacts consumed by `ai-worker`.

## Pipeline

1. Put raw CSV files in `datasets/raw/`.
2. Each CSV must contain text and label data, or columns that map to them
   through `datasets/dataset_manager.py`.
3. Run the orchestrator from this directory:

```bash
python3 train_models.py
```

The orchestrator performs:

```text
raw CSVs -> processed dataset -> preprocessing -> feature engineering
        -> NLP trainer -> Isolation Forest trainer -> artifacts + reports
```

## Generated Artifacts

`models/`

- `tfidf.joblib`
- `naive_bayes.joblib`
- `isolation_forest.joblib`
- `behavior_scaler.joblib`
- `model_metadata.json`
- `iforest_metadata.json`

`reports/`

- `metrics.json`
- `classification_report.txt`
- `isolation_forest_metrics.json`
- `training_summary.json`

## Export To AI Worker

After training, copy artifacts into the worker:

```bash
python3 -c "from training.export_models import export_artifacts; export_artifacts()"
```

The AI worker expects the files in `../ai-worker/models/` by default.
