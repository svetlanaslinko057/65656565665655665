# Engine v2 - Shadow Mode Specification

**Версия:** 1.0.0
**Статус:** ACTIVE
**Дата:** 2026-01-19

---

## 1️⃣ Что такое Shadow Mode

```
DecisionRequest
   ├── Engine v1.1 → FINAL decision (production)
   └── Engine v2 (ML-assisted) → shadowDecision (logged only)
```

### Ключевые принципы:
- ✅ v1.1 = production decision
- ✅ v2 = parallel calculation (НЕ влияет на UI/alerts/Telegram)
- ✅ Результат v2 сохраняется в БД для анализа

---

## 2️⃣ Архитектура

### Хранение
```javascript
engine_shadow_decisions {
  shadowId: string,
  originalDecisionId: string,
  
  v1Decision: {
    decision: BUY|SELL|NEUTRAL,
    evidence: number,
    risk: number,
    direction: number,
    coverage: number,
  },
  
  v2Decision: {
    decision: BUY|SELL|NEUTRAL,
    evidence: number,  // после ML adjustments
    risk: number,      // после ML adjustments
    direction: number,
    coverage: number,
  },
  
  mlAdjustments: {
    confidenceDelta: number,
    riskAdjustment: number,
    conflictLikelihood: number,
  },
  
  comparison: {
    agreement: boolean,
    v2MoreAggressive: boolean,
    v2LessAggressive: boolean,
    evidenceDiff: number,
    riskDiff: number,
  },
  
  timestamp: Date,
}
```

---

## 3️⃣ Shadow KPIs

| KPI | Что сравниваем | Цель |
|-----|----------------|------|
| Agreement Rate | v1 == v2 | ≥ 70% |
| Extra BUY/SELL | v2 пытается чаще | ≤ +10% |
| Risk Reduction | v2 снижает risk? | Анализ |
| Conflict Sensitivity | v2 ловит конфликты | Анализ |
| Stability | flip-rate v2 | < 15% |

> 📌 v2 не должен быть "агрессивнее" v1.1

---

## 4️⃣ Kill Conditions (обязательные)

Shadow v2 **НЕ допускается к продакшну**, если:

| Условие | Порог |
|---------|-------|
| BUY/SELL increase | > v1.1 + 10% |
| Flip-rate | > 15% |
| BUY при coverage < 60% | > 0 |
| Agreement rate | < 70% |

```javascript
SHADOW_CONFIG.killConditions = {
  maxBuySellIncrease: 0.10,     // +10% max
  maxFlipRate: 0.15,            // 15%
  minCoverageForBuySell: 60,    // No BUY/SELL below 60%
  minAgreementRate: 0.70,       // 70% min
}
```

---

## 5️⃣ API Endpoints

### Shadow Config
```
GET /api/engine/shadow/config
```
Response:
```json
{
  "enabled": true,
  "v2Active": false,
  "killConditions": {...},
  "status": "active"
}
```

### Shadow KPIs
```
GET /api/engine/shadow/kpi?days=7
```
Response:
```json
{
  "totalComparisons": 100,
  "agreementRate": 85.0,
  "v2MoreAggressiveRate": 5.0,
  "v2LessAggressiveRate": 10.0,
  "avgEvidenceDiff": 2.3,
  "avgRiskDiff": -1.5,
  "v2BuySellAtLowCoverage": 0,
  "killConditionsPassed": true
}
```

### Toggle Shadow Mode
```
POST /api/engine/shadow/toggle
Body: { "enabled": true/false }
```

---

## 6️⃣ Feature Flags

```typescript
// engine_shadow.service.ts
SHADOW_CONFIG = {
  enabled: true,      // Shadow mode ON
  v2Active: false,    // v2 NOT in production
}

// engine_ml_scoring.ts
ML_CONFIG = {
  enabled: false,     // ML scoring OFF
}
```

---

## 7️⃣ Включение v2 в Production

### Требования (ВСЕ должны быть выполнены):

1. **Данные**
   - ≥ 1000 shadow comparisons
   - ≥ 7 дней наблюдения

2. **KPI**
   - Agreement rate ≥ 70%
   - BUY/SELL increase ≤ 10%
   - v2BuySellAtLowCoverage = 0
   - killConditionsPassed = true

3. **Процесс**
   - Review shadow KPIs
   - Manual approval
   - Set `SHADOW_CONFIG.v2Active = true`

---

## 8️⃣ Текущий статус

```
Shadow Mode:     ACTIVE ✅
v2 Production:   DISABLED ❌
ML Scoring:      DISABLED ❌
Comparisons:     1
Agreement Rate:  100%
Kill Passed:     true ✅
```

---

*Shadow Mode v1 - Observe before activate*
