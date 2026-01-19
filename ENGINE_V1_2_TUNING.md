# Engine v1.2 — Threshold Tuning Specification

**Версия:** 1.2.0
**Статус:** IN DEVELOPMENT
**Принцип:** Simulation-driven tuning, not guessing

---

## 🎯 Цель v1.2

- **НЕ** увеличить количество BUY/SELL любой ценой
- **А** сделать их редкими, но допустимыми
- Подтвердить через симуляции, что правила:
  - не слишком жёсткие
  - не слишком мягкие

---

## ❌ Что НЕ делаем в v1.2

- ❌ ML
- ❌ Новые сигналы
- ❌ Новые источники данных
- ❌ PnL / price / candles
- ❌ Изменение семантики BUY / SELL / NEUTRAL

---

## ✅ Что делаем в v1.2

### 1. Simulation-driven Threshold Tuning

Используем существующие симуляции:
- Historical Replay
- Stress / Perturbation
- Monte Carlo

### 2. Сценарии тестирования

| Сценарий | Что проверяем |
|----------|---------------|
| Evidence ↑ | Когда BUY начинает появляться |
| Risk ↓ | Где граница между conditional / safe |
| Coverage 55-65% | Не проскакивают ли ложные BUY |
| Conflicts on/off | Корректность блокировки |
| Direction ± | Адекватность sign |

---

## 📊 Таблица тюнинга

### Evidence Thresholds

| Параметр | v1.1 | v1.2 (proposed) | Основание | Status |
|----------|------|-----------------|-----------|--------|
| minForAnyDecision | 50 | 48 | Monte Carlo: expand base | ⏳ |
| softZoneMax | 65 | 62 | Historical replay: earlier BUY | ⏳ |
| strongZone | 80 | 78 | Sensitivity analysis | ⏳ |

### Risk Thresholds

| Параметр | v1.1 | v1.2 (proposed) | Основание | Status |
|----------|------|-----------------|-----------|--------|
| hardCap | 75 | 72 | High-risk tail analysis | ⏳ |
| highRiskZone | 60 | 58 | Perturbation test | ⏳ |
| normalZone | 40 | 38 | Baseline shift | ⏳ |

### Coverage Thresholds

| Параметр | v1.1 | v1.2 (proposed) | Основание | Status |
|----------|------|-----------------|-----------|--------|
| hardMinimum | 40 | 40 | ❄️ FROZEN - safety critical | ✅ |
| softMinimum | 60 | 58 | Historical replay | ⏳ |
| normalZone | 60 | 58 | Consistency | ⏳ |

### Direction Thresholds

| Параметр | v1.1 | v1.2 (proposed) | Основание | Status |
|----------|------|-----------------|-----------|--------|
| weakThreshold | 20 | 18 | Sensitivity test | ⏳ |
| strongThreshold | 40 | 38 | Direction analysis | ⏳ |

### Penalty Weights

| Параметр | v1.1 | v1.2 (proposed) | Основание | Status |
|----------|------|-----------------|-----------|--------|
| lowCoverage | 15 | 15 | ❄️ FROZEN | ✅ |
| highRisk | 20 | 22 | Increase sensitivity | ⏳ |
| signalConflict | 25 | 28 | False positive reduction | ⏳ |
| singleSource | 15 | 15 | ❄️ FROZEN | ✅ |

---

## 🧪 KPI Validation Requirements

### Перед применением любого изменения:

| KPI | Requirement | Hard/Soft |
|-----|-------------|-----------|
| BUY + SELL | ≤ 40% | HARD |
| BUY/SELL at coverage <60% | = 0 | HARD |
| Flip-rate (24h) | < 15% | HARD |
| Agreement v1.1 vs v1.2 | ≥ 85% | SOFT |
| BUY при конфликтах | = 0 | HARD |
| Coverage variance | < v1.1 | SOFT |

### Если любой HARD KPI нарушен → ОТКАТ

---

## 🔄 Feature Flag

```typescript
// engine.routes.ts
const ENGINE_VERSION: 'v1_1' | 'v1_2' = 'v1_2';

// Можно переключать для сравнения
```

---

## 📈 Simulation Results Log

### Historical Replay (baseline)

```
Date: 2026-01-19
Runs: 24
v1.1 Results:
  - BUY: 0 (0%)
  - SELL: 0 (0%)
  - NEUTRAL: 24 (100%)
  - Avg Coverage: 8.5%
```

### v1.2 Proposed Changes Impact

| Change | BUY | SELL | NEUTRAL | Agreement |
|--------|-----|------|---------|-----------|
| Baseline v1.1 | 0% | 0% | 100% | 100% |
| Evidence 65→62 | TBD | TBD | TBD | TBD |
| Risk 75→72 | TBD | TBD | TBD | TBD |
| Coverage 60→58 | TBD | TBD | TBD | TBD |
| Combined | TBD | TBD | TBD | TBD |

---

## ⚠️ Frozen Parameters (НЕ ТРОГАТЬ)

- ❄️ Coverage hardMinimum = 40%
- ❄️ lowCoverage penalty = 15
- ❄️ singleSource penalty = 15
- ❄️ Conflict → NEUTRAL (always)
- ❄️ Decision semantics

---

## 📅 Validation Process

1. **Run v1.1 baseline simulation**
2. **Apply single parameter change**
3. **Run v1.2 simulation with same data**
4. **Compare KPIs**
5. **If PASS → commit change**
6. **If FAIL → revert and try different value**
7. **Repeat until all changes validated**

---

## 🎯 Expected Outcome

После v1.2:
- BUY/SELL появляются **иногда** (5-15%)
- Но:
  - объяснимы
  - редки
  - воспроизводимы
- Dashboard показывает **живые точки** в Decision Gate

---

*Engine v1.2 — Simulation-driven, not guessing*
