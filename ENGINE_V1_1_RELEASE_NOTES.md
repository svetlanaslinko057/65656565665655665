# Engine v1.1 - Release Notes

**Версия:** 1.1.0
**Дата:** 2026-01-19
**Принцип:** v1.1 = stricter, not smarter

---

## Что изменилось

### ❌ НЕ меняем
- Архитектуру
- API контракты
- Семантику BUY/SELL/NEUTRAL
- Frozen components

### ✅ Усиливаем
- Пороги (thresholds)
- Веса (weights)
- Конфликтные правила
- Penalty rules
- Explainability

---

## 1. Evidence Thresholds

### Зоны Evidence
| Evidence | Зона | Решение |
|----------|------|---------|
| < 50 | Hard NEUTRAL | NEUTRAL (жёстко) |
| 50-65 | Soft Zone | NEUTRAL (soft) |
| 65-80 | Conditional | BUY/SELL (conditional) |
| ≥ 80 | Strong | BUY/SELL (strong) |

### Source Weights
```javascript
actorSignals:           30% max
corridorDeviations:     25% max
contextParticipation:   25% max
tokenLevelSignals:      20% max
```

### Hard Rules
- Single source cap: 40% (ни один источник не может дать >40% Evidence)
- Minimum sources for BUY/SELL: 2

---

## 2. Coverage Thresholds

| Coverage | Зона | Требования |
|----------|------|------------|
| < 40 | Hard NEUTRAL | NEUTRAL без исключений |
| 40-60 | Conditional | Evidence ≥ 75 AND Risk ≤ 35 |
| ≥ 60 | Normal | Нормальный режим |

---

## 3. Direction Thresholds

| |direction| | Интерпретация |
|-------------|----------------|
| < 20 | Weak direction → NEUTRAL |
| 20-40 | Moderate |
| ≥ 40 | Strong |

### Forbidden Combinations
- ❌ BUY при direction < -20
- ❌ SELL при direction > +20

---

## 4. Risk Thresholds

| Risk | Зона | Решение |
|------|------|---------|
| ≥ 75 | Hard Cap | NEUTRAL (lock) |
| 60-75 | High Risk | BUY/SELL только если Evidence ≥ 80 |
| < 40 | Normal | Нормальный режим |

---

## 5. Penalty Weights

| Условие | Penalty |
|---------|---------|
| Coverage < 50% | -15 Evidence |
| Risk > 65 | -20 Evidence |
| Signal conflict | -25 Evidence |
| Recent flip (< 6h) | -10 Evidence |
| Single source | -15 Evidence |

---

## 6. Conflict Detection

### Конфликтующие сигналы
- `inflow_deviation` + `outflow_deviation`
- `behavior_regime_shift` + `flow_deviation`
- Simultaneous inflow and outflow

### При конфликте
- Decision = NEUTRAL
- Risk += 15

---

## 7. Stability Rules

| Правило | Значение |
|---------|----------|
| Cooldown | 2 часа между BUY/SELL |
| Flip Prevention | 6 часов BUY↔SELL |
| Flip Evidence Penalty | -10 |
| Flip Risk Penalty | +10 |

---

## 8. Explainability Requirements

BUY/SELL требует:
- ≥ 3 supportingFacts
- ≥ 1 riskNote
- ≥ 2 distinct data sources

Иначе → NEUTRAL с reason "Insufficient explainability"

---

## API Endpoints

### GET /api/engine/config
Возвращает текущую конфигурацию v1.1

### POST /api/engine/decide
Генерирует решение с v1.1 logic

### Новые поля в response
```json
{
  "neutralReason": "Coverage 7% below hard minimum (40%)",
  "scores": {
    "rawEvidence": 15,
    "rawRisk": 60
  },
  "explainability": {
    "distinctSources": 2,
    "conflictsDetected": [],
    "penaltiesApplied": ["Low coverage (<50%): -15"]
  }
}
```

---

## Ожидаемые результаты

После v1.1:
- 📉 Меньше BUY/SELL
- 📈 Выше доверие к каждому решению
- 🧠 Engine чаще честно говорит "NEUTRAL"
- 📊 Decisions стабильнее
- 🤖 ML будет обучаться на чистых данных

---

## Следующие шаги

### ЭТАП 1: A/B Audit
- v1 vs v1.1 на тех же данных
- Сравнить decision count, flip rate, feedback helpful %

### ЭТАП 2: Зафиксировать v1.1 как ML baseline
- Когда ≥10k решений
- Когда ≥1k feedback

---

## Feature Flag

```typescript
// В engine.routes.ts
const USE_ENGINE_V1_1 = true;  // Переключение v1 ↔ v1.1
```

---

*Engine v1.1 - Stricter, not smarter*
