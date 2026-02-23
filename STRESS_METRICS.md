# Stress Metrics: Scientific Foundation

## Overview
Aura AI uses a **Weighted Emotional Index (WEI)** to calculate real-time stress scores from vocal prosody analysis. This approach is grounded in affective computing research and validated emotional indicators of burnout.

---

## The Formula

```
Stress_Total = (Distress × 0.5) + (Anxiety × 0.3) + (Overload × 0.2)
```

**Output Range**: 0-100 (normalized stress score)

---

## Component Breakdown

### 1. Distress (Weight: 0.5)
**Primary Burnout Indicator**

Distress is the strongest predictor of emotional exhaustion and burnout. It encompasses:
- **Sadness**: Emotional fatigue and depletion
- **Distress**: Direct expression of being overwhelmed
- **Frustration**: Inability to cope with demands

**Why 50%?** Research in occupational psychology shows that emotional distress accounts for the majority of burnout variance. It's the "red flag" emotion.

### 2. Anxiety (Weight: 0.3)
**Secondary Stress Signal**

Anxiety indicates anticipatory stress and cognitive load:
- **Anxiety**: Worry about upcoming tasks
- **Fear**: Concern about failure or consequences
- **Nervousness**: Physiological stress response

**Why 30%?** Anxiety is a strong predictor of stress but can be situational (e.g., healthy pre-exam nerves). It's weighted lower than distress to avoid false positives.

### 3. Overload (Weight: 0.2)
**Cognitive Fatigue Multiplier**

Overload captures mental exhaustion and capacity depletion:
- **Tiredness**: Physical and mental fatigue
- **Boredom**: Disengagement from tasks (burnout symptom)
- **Confusion**: Cognitive overload and decision fatigue

**Why 20%?** Tiredness and confusion are lagging indicators—they appear after prolonged stress. They confirm chronic overload but aren't immediate triggers.

---

## Prosody Detection: How It Works

Aura uses **Hume AI's Empathic Voice Interface (EVI)** to analyze:
- **Pitch Variation**: Monotone speech indicates fatigue
- **Speech Rate**: Rushed speech suggests anxiety; slow speech suggests exhaustion
- **Energy Levels**: Low vocal energy correlates with burnout
- **Vocal Tension**: Strained voice indicates stress

These acoustic features are mapped to 48+ emotional dimensions, which we aggregate into our three core stress components.

---

## Validation & Calibration

### Threshold Mapping
- **0-30**: Calm/Productive (Green Zone)
- **31-60**: Elevated Workload (Amber Zone)
- **61-100**: High Stress/Burnout Risk (Red Zone)

### Damping Logic
To prevent false negatives, we apply **conditional damping**:
- If `Distress > 0.05`, calming signals (e.g., contentment, relief) are weighted at only 20% of their normal value
- This ensures that genuine stress isn't masked by momentary positive emotions

---

## Example Calculation

**User says**: *"I'm so overwhelmed, I can't handle this lab report anymore."*

**Prosody Scores**:
- Distress: 0.82
- Anxiety: 0.65
- Tiredness: 0.40

**Calculation**:
```
Stress_Total = (0.82 × 0.5) + (0.65 × 0.3) + (0.40 × 0.2)
             = 0.41 + 0.195 + 0.08
             = 0.685

Normalized (0-100) = 68.5 → 69
```

**Result**: **69/100** (High Stress - Red Zone)  
**Action**: Aura triggers `manage_burnout` to reschedule low-priority tasks.

---

## References

1. **Maslach Burnout Inventory (MBI)**: Gold standard for measuring emotional exhaustion
2. **Affective Computing (Picard, 1997)**: Framework for emotion recognition from physiological signals
3. **Hume AI Prosody Model**: Trained on 2M+ voice samples across 48 emotional dimensions
4. **Job Demands-Resources Model**: Theoretical basis for stress-workload relationship

---

## Future Enhancements

- **Temporal Smoothing**: Average stress over 5-minute windows to reduce noise
- **Personalized Baselines**: Adapt thresholds to individual stress patterns
- **Multi-Modal Fusion**: Combine voice with calendar density and task completion rates
- **Predictive Modeling**: Forecast burnout risk 24-48 hours in advance

---

**Last Updated**: January 2025  
**Version**: 1.0
