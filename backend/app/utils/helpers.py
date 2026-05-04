def normalize_label(label, aliases=None):
    aliases = aliases or {}
    cleaned = str(label).strip().lower()
    return aliases.get(cleaned, cleaned)


def normalize_probability_map(probabilities, class_names, aliases=None):
    normalized = {name: 0.0 for name in class_names}
    for label, value in probabilities.items():
        mapped = normalize_label(label, aliases)
        if mapped in normalized:
            normalized[mapped] = float(value)
    return normalized


def compute_severity(prediction, confidence, symptom_count):
    if prediction == "healthy":
        return "Low"
    if confidence >= 0.8 or symptom_count >= 5:
        return "Severe"
    if confidence >= 0.55 or symptom_count >= 3:
        return "Moderate"
    return "Mild"