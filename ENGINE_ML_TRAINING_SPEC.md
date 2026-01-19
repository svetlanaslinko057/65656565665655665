# ML Training Specification v1 (OFFICIAL)

**Версия:** 1.0.0
**Статус:** LOCKED
**Дата:** 2026-01-19

---

## 1️⃣ Роль ML в системе (ЗАФИКСИРОВАНО)

### ML НЕ:
- ❌ принимает BUY / SELL
- ❌ обходит thresholds
- ❌ заменяет rules
- ❌ работает при low coverage
- ❌ видит price/pnl

### ML МОЖЕТ:
- ✅ корректировать confidence (±10)
- ✅ корректировать risk (±10)
- ✅ оценивать conflict likelihood (0..1)

> **ML = advisor, не decision-maker**

---

## 2️⃣ Training Dataset Schema

### Единица обучения: DecisionSnapshot

```typescript
interface DecisionSnapshot {
  // Identity
  decisionId: string;
  timestamp: Date;
  
  // Features (25 features from EngineFeaturesV1)
  features: {
    coverage: number;              // 0-100
    evidenceRaw: number;           // 0-100
    riskRaw: number;               // 0-100
    direction: number;             // -100..+100
    conflictsCount: number;        // 0+
    distinctSources: number;       // 0-4
    penaltiesCount: number;        // 0+
    actorParticipationScore: number;
    actorCount: number;
    actorTypeDistribution: {
      exchange: number;
      fund: number;
      market_maker: number;
      whale: number;
      other: number;
    };
    contextOverlapScore: number;
    contextCount: number;
    signalDiversity: number;
    signalSeverityAvg: number;
    highSeverityRatio: number;
    corridorConcentration: number;
    totalCorridorVolume: number;
    graphDensity: number;
    volatilityRegime: 'low' | 'normal' | 'high';
    hourOfDay: number;
    dayOfWeek: number;
  };
  
  // Engine output
  engineDecision: 'BUY' | 'SELL' | 'NEUTRAL';
  rawEvidence: number;
  rawRisk: number;
  rawDirection: number;
  penaltiesApplied: string[];
  conflictsDetected: string[];
  coverage: number;
  
  // References
  contextId?: string;
  actorIds: string[];
  
  // Labels (for training)
  userFeedback?: 'helpful' | 'not_helpful' | 'skip';
  outcomeLabel?: OutcomeBucket;  // OPTIONAL, delayed
}

enum OutcomeBucket {
  STABLE = 'stable',           // decision held, no flip
  FLIP_EARLY = 'flip_early',   // changed within 6h
  FLIP_LATE = 'flip_late',     // changed after 6h
  VALIDATED = 'validated',      // user marked helpful
  REJECTED = 'rejected',        // user marked not helpful
}
```

### ⚠️ Critical Rules
- `price` / `pnl` НЕ входят в features
- `outcomeLabel` — только post-factum, не сразу
- Minimum 1000 snapshots before training

---

## 3️⃣ Feature Groups

| Группа | Features | Count |
|--------|----------|-------|
| Coverage | coverage, distinctSources | 2 |
| Evidence | evidenceRaw, penaltiesCount | 2 |
| Risk | riskRaw | 1 |
| Direction | direction | 1 |
| Conflicts | conflictsCount | 1 |
| Actors | actorParticipationScore, actorCount, actorTypeDistribution (5) | 7 |
| Context | contextOverlapScore, contextCount | 2 |
| Signals | signalDiversity, signalSeverityAvg, highSeverityRatio | 3 |
| Graph | corridorConcentration, totalCorridorVolume, graphDensity | 3 |
| Temporal | volatilityRegime, hourOfDay, dayOfWeek | 3 |
| **TOTAL** | | **25** |

> 📌 Ни одного price-based feature

---

## 4️⃣ ML Targets (Labels)

### ML НЕ учит BUY/SELL

### ML учит дельты:

```typescript
interface MLTargets {
  confidenceDelta: number;      // -10..+10
  riskAdjustment: number;       // -10..+10
  conflictLikelihood: number;   // 0..1
}
```

### Target Derivation:

1. **confidenceDelta**: derived from feedback + stability
   - helpful feedback → positive delta
   - early flip → negative delta
   
2. **riskAdjustment**: derived from outcome
   - stable decision → negative adjustment (less risk needed)
   - flip decision → positive adjustment (more risk was correct)
   
3. **conflictLikelihood**: derived from conflicts detected post-decision

---

## 5️⃣ Validation Rules (ЖЁСТКО)

### ML prediction ОТКЛОНЯЕТСЯ, если:

```python
def validate_ml_prediction(input, prediction):
    # Rule 1: Low coverage
    if input.coverage < 60:
        return REJECT("coverage < 60%")
    
    # Rule 2: Insufficient sources
    if input.distinctSources < 2:
        return REJECT("distinctSources < 2")
    
    # Rule 3: NEUTRAL decision
    if input.engineDecision == 'NEUTRAL':
        return REJECT("NEUTRAL decisions don't use ML")
    
    # Rule 4: Sign change attempt
    if would_flip_decision(input, prediction):
        return REJECT("ML cannot flip decision sign")
    
    # Rule 5: Out of bounds
    if abs(prediction.confidenceDelta) > 10:
        return REJECT("confidenceDelta out of bounds")
    
    if abs(prediction.riskAdjustment) > 10:
        return REJECT("riskAdjustment out of bounds")
    
    return ACCEPT()
```

> 📌 ML никогда не может превратить NEUTRAL → BUY

---

## 6️⃣ Training Strategy

### Approach
- **Method**: Offline training
- **Validation**: K-fold cross validation (k=5)
- **Objective**: Reduce false BUY/SELL, not maximize PnL

### Metrics (for model selection)

| Metric | Target |
|--------|--------|
| KPI improvement | > 5% |
| Agreement with v1.1 | > 80% |
| False BUY/SELL reduction | > 10% |
| Flip-rate change | < 0% |

### Training Schedule
1. Initial: 10k snapshots minimum
2. Retrain: Weekly or when KPI degrades
3. Validation: Shadow mode for 7 days minimum

---

## 7️⃣ Data Collection Pipeline

```
Decision Made (v1.1)
       ↓
Snapshot Created
       ↓
[Wait for feedback/outcome]
       ↓
Labels Updated
       ↓
Training Dataset
       ↓
Model Training (offline)
       ↓
Shadow Evaluation
       ↓
Production (if KPI improves)
```

---

## 8️⃣ Safety Mechanisms

| Mechanism | Implementation |
|-----------|----------------|
| Kill switch | `ML_CONFIG.enabled = false` |
| Confidence cap | `max(min(delta, 10), -10)` |
| Coverage gate | Skip ML if coverage < 60% |
| Fallback | Always return v1.1 if ML fails |
| Monitoring | Shadow mode KPIs |

---

## 9️⃣ Model Architecture (Future)

### Recommended: Gradient Boosting (XGBoost/LightGBM)
- Interpretable
- Works with tabular data
- Fast inference
- Feature importance available

### NOT Recommended:
- Deep learning (overkill, black box)
- Reinforcement learning (too complex)
- Price prediction models (wrong objective)

---

*ML Training Spec v1 - LOCKED*
