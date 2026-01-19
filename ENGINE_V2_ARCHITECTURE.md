# Engine v2 Architecture - ФИНАЛЬНАЯ ФИКСАЦИЯ

**Дата:** 2026-01-19
**Статус:** Production Ready (ML disabled)

---

## 🔒 Принцип №1 (НЕ НАРУШАЕТСЯ)

```
Rules Layer остаётся финальным арбитром.

ML:
❌ не возвращает BUY/SELL
❌ не видит деньги пользователя
❌ не может обходить thresholds
```

---

## 🧱 Архитектура Engine v2

```
Signals / Contexts / Actors
        ↓
   Feature Extractor (deterministic)
        ↓
   ML Scoring Layer (DISABLED by default)
        ↓
Rules Engine v1.1 (с весами)
        ↓
Final Decision (BUY / SELL / NEUTRAL)
```

---

## 📊 Decision Quality KPI (ЗАФИКСИРОВАНО)

### 1. Decision Distribution
| Метрика | Норма |
|---------|-------|
| NEUTRAL | 60–85% |
| BUY | 7–20% |
| SELL | 7–20% |
| BUY+SELL | ≤ 40% |

### 2. Coverage Gating
- BUY/SELL при coverage < 60% → **0%** (жёстко)
- Это баг, не "плохое решение"

### 3. Evidence Integrity
- Avg distinctSources (BUY/SELL) ≥ 2.5
- Avg supportingFacts ≥ 3
- Single-source → всегда NEUTRAL

### 4. Conflict Resolution
- Conflict + BUY/SELL = архитектурная ошибка
- 100% conflicts → NEUTRAL

### 5. Stability
- Flip-rate (24h) < 15%
- Decision lifespan ≥ 4h

### 6. Feedback
- Helpful ratio target: 70%
- Feedback ≠ ground truth, это вес

---

## 🔧 API Endpoints

### KPI
```
GET /api/engine/kpi              # Full KPI summary
GET /api/engine/kpi/distribution # Decision distribution
GET /api/engine/kpi/coverage     # Coverage gating
GET /api/engine/kpi/stability    # Temporal consistency
```

### ML (v2)
```
GET  /api/engine/ml/config       # ML status
POST /api/engine/ml/toggle       # Kill switch
GET  /api/engine/features        # Feature extraction
```

### Engine
```
GET  /api/engine/config          # v1.1 thresholds
POST /api/engine/decide          # Generate decision
```

---

## 🧠 Feature Vector

25 features для Rules и ML:

```typescript
{
  coverage,                  // 0-100
  evidenceRaw,               // 0-100
  riskRaw,                   // 0-100
  direction,                 // -100..+100
  conflictsCount,            // 0+
  distinctSources,           // 0-4
  penaltiesCount,            // 0+
  actorParticipationScore,   // 0-100
  actorCount,                // 0+
  actorTypeDistribution,     // {exchange, fund, market_maker, whale, other}
  contextOverlapScore,       // 0-10
  contextCount,              // 0+
  signalDiversity,           // 0-1
  signalSeverityAvg,         // 0-1
  highSeverityRatio,         // 0-1
  corridorConcentration,     // 0-1 (Herfindahl)
  totalCorridorVolume,       // USD
  graphDensity,              // edges/nodes
  volatilityRegime,          // low/normal/high
  hourOfDay,                 // 0-23
  dayOfWeek,                 // 0-6
}
```

---

## 🤖 ML Scoring Layer

### Что делает ML:
```javascript
{
  confidenceDelta: -10..+10,    // корректировка evidence
  riskAdjustment: -10..+10,     // корректировка risk
  conflictLikelihood: 0..1,     // вероятность конфликта
}
```

### Safety Mechanisms:
- **Kill switch**: `ML_CONFIG.enabled = false`
- **Confidence cap**: ≤ ±10
- **Fallback**: всегда v1.1

### Применение в Rules:
```javascript
effectiveEvidence = evidence - penalties + ml.confidenceDelta
effectiveRisk = risk + ml.riskAdjustment

// НО: thresholds не меняются
// НО: forbidden rules не нарушаются
// НО: coverage gates жёсткие
```

---

## 🧊 Frozen Components (НЕ ТРОГАТЬ)

- ❄️ Decision semantics (BUY/SELL/NEUTRAL)
- ❄️ Coverage philosophy
- ❄️ Conflict handling
- ❄️ Explainability contract
- ❄️ Token registry truth rules
- ❄️ Actors (List, Detail, Graph)
- ❄️ Signals Layer v2
- ❄️ Context Layer

---

## 📅 Roadmap

### Сейчас (v1.1)
- ✅ Engine v1.1 production-safe
- ✅ KPI система
- ✅ Feature extractor
- ✅ ML stub (disabled)

### 7-14 дней
- KPI наблюдение
- Проверка стабильности
- Накопление ≥1k решений

### После накопления данных
- ML training на feedback + stability
- A/B: v1.1 vs v2
- Включение ML scoring (если KPI улучшаются)

---

## 🎯 Критерии включения ML

1. ≥10k решений в логах
2. ≥1k feedback записей
3. KPI v1.1 стабильны
4. A/B показывает улучшение:
   - Decision count не выросло >20%
   - Flip rate не увеличилось
   - Helpful % выросло

---

*Engine v2 - ML помогает, не решает*
