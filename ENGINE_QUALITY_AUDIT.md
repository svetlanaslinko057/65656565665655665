# Engine v1 - Quality Audit Report

**Дата:** 2026-01-19
**Версия:** Engine v1 (Sprint 4)
**Статус:** 🟡 Data Collection Phase

---

## 1️⃣ Decision Distribution Audit

### Текущее состояние
```
Total Decisions: 4
BUY:     0 (0%)
SELL:    0 (0%)
NEUTRAL: 4 (100%)
```

### Анализ
- ✅ NEUTRAL 100% при низком coverage - **ПРАВИЛЬНОЕ ПОВЕДЕНИЕ**
- Coverage < 60% → только NEUTRAL (по дизайну)
- Система корректно НЕ делает BUY/SELL при недостаточных данных

### Ожидания v1
- NEUTRAL: 50-70% ожидается после накопления данных
- BUY/SELL: 15-30% суммарно при нормальной работе

---

## 2️⃣ Coverage Analysis

### Текущее состояние
| Компонент | Coverage | Статус |
|-----------|----------|--------|
| Contexts | 0% | 🔴 Нет данных |
| Actors | 20% | 🟡 6 entities seeded |
| Signals | 0% | 🔴 Нет actor_signals |
| **Overall** | **7%** | 🔴 Недостаточно |

### Причины низкого coverage
1. **signal_contexts = 0** - Build Signal Contexts job ещё не сработал
2. **actor_signals = 0** - Нет девиаций от baseline (данные свежие)
3. **actor_baselines = 6** - Baselines созданы для всех entities

### Требуемый coverage для решений
- **BUY/SELL**: coverage ≥ 60%
- **Сейчас**: 7% → только NEUTRAL

---

## 3️⃣ Data Pipeline Status

### ✅ Работающие слои
| Layer | Collection | Count | Status |
|-------|------------|-------|--------|
| L0 | logs_erc20 | 34,315 | ✅ |
| L1 | transfers | 10,000 | ✅ |
| L2 | relations | 24,108 | ✅ |
| L3 | bundles | 18,704 | ✅ |
| L4 | signals | 146 | ✅ |
| L5 | scores | 2,281 | ✅ |
| L6 | entities | 6 | ✅ |
| L6.1 | entity_addresses | 15 | ✅ |
| L7 | actor_baselines | 6 | ✅ |

### 🟡 Ожидающие данных
| Layer | Collection | Count | Expected After |
|-------|------------|-------|----------------|
| L7.1 | actor_signals | 0 | Когда будут девиации |
| L8 | signal_contexts | 0 | 15 минут (job interval) |

---

## 4️⃣ Engine Rules v1 Analysis

### Правила (engine.rules.ts)

**BUY условия:**
```
- Net outflow detected
- ≥1 context с support
- Coverage ≥ 60%
```

**SELL условия:**
```
- Net inflow detected
- Corridor volume spike
- Coverage ≥ 60%
```

**NEUTRAL:**
```
- Всё остальное
- ИЛИ coverage < 60%
```

### Текущая логика
✅ Coverage check первым (60% threshold)
✅ NEUTRAL при недостаточных данных
✅ Explainability в каждом решении

---

## 5️⃣ Risk Awareness Check

### Как Risk влияет на решения
```javascript
// engine.rules.ts
if (!coverageOk) {
  risks.push({
    title: 'Insufficient data coverage',
    evidence: `Only ${input.coverage.percent}% of required data available`
  });
  return { label: 'NEUTRAL', ... }
}
```

✅ Risk notes добавляются к каждому решению
✅ Low coverage = автоматический NEUTRAL

---

## 6️⃣ Explainability Audit

### Пример текущего решения
```json
{
  "decision": "NEUTRAL",
  "confidenceBand": "LOW",
  "reasoning": {
    "supportingFacts": ["Coverage 0% (+0)"],
    "riskNotes": [
      "Low coverage 0%",
      "No contexts available"
    ]
  }
}
```

### Оценка
✅ Присутствует supportingFacts
✅ Присутствует riskNotes
✅ Объясняет ПОЧЕМУ NEUTRAL
❌ Нет 3+ facts (ожидаемо при 0 contexts)

---

## 7️⃣ Stability (Not Applicable Yet)

**Decision Flip Rate:** N/A (недостаточно решений)

Требуется:
- ≥ 50 решений для анализа stability
- ≥ 7 дней данных

---

## 8️⃣ Feedback Loop Status

```json
{
  "feedback": {
    "helpful": 0,
    "notHelpful": 0
  }
}
```

⚠️ Нет feedback пока - ожидаемо для новой системы

---

## 📊 Итоговая оценка

| Критерий | Статус | Комментарий |
|----------|--------|-------------|
| Coverage enforcement | ✅ | Работает корректно |
| NEUTRAL при низком coverage | ✅ | Правильное поведение |
| Risk notes | ✅ | Добавляются |
| Explainability | 🟡 | Базовая (мало данных) |
| Decision stability | ⏳ | Ожидает данных |
| Feedback loop | ⏳ | Ожидает пользователей |

### Общий статус: 🟡 **HEALTHY (Data Collection Phase)**

Engine v1 работает корректно:
- НЕ делает BUY/SELL при низком coverage
- Всегда объясняет решения
- Правильно обрабатывает риски

---

## 🔜 Что нужно для полного аудита

1. **Накопление данных (1-2 недели)**
   - signal_contexts > 0
   - actor_signals > 0
   - ≥ 50 решений

2. **Decision Distribution Review**
   - После достижения coverage ≥ 60%
   - Анализ BUY/SELL/NEUTRAL распределения

3. **Stability Analysis**
   - Decision flip rate за 24h
   - Consistency over time

4. **Feedback Analysis**
   - Корреляция helpful с coverage
   - Корреляция with decision type

---

## ⚠️ Frozen Components (НЕ трогать)

- ❄️ Actors (List, Detail, Graph)
- ❄️ Signals Layer v2
- ❄️ Context Layer
- ❄️ Engine v1 API contracts
- ❄️ Decision semantics (BUY/SELL/NEUTRAL)

---

*Автоматически сгенерировано: 2026-01-19T21:40:00Z*
