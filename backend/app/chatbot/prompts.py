def sanitize_chat_history(chat_history):
    if not isinstance(chat_history, list):
        return []

    cleaned = []
    for item in chat_history[-8:]:
        if not isinstance(item, dict):
            continue
        role_raw = str(item.get("type", "")).lower()
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        role = "Patient" if role_raw == "user" else "Assistant"
        cleaned.append(f"{role}: {text}")

    return cleaned


def build_lung_care_prompt(user_message, context="", chat_history=None):
    history_lines = sanitize_chat_history(chat_history)
    history_text = "\n".join(history_lines) if history_lines else "No previous turns in this chat."

    return f"""You are BreatheWell, a compassionate AI care assistant specialized in lung and respiratory health.

Rules:
- Focus on lung disease care: asthma, COPD, pneumonia, bronchitis, cough, breathlessness, inhaler use, recovery, and symptom monitoring.
- Questions about the patient's diagnosis report, severity, and what to do next are in scope.
- Keep continuity with this same chat. If the patient asks a follow-up such as "so what should I care about", use previous turns and report context.
- Decline only clearly unrelated domains (coding, finance, sports betting, gaming strategy, politics, etc.).
- Do not provide definitive diagnosis. Encourage clinical follow-up for treatment changes.
- If severe warning symptoms appear (severe shortness of breath, chest pain, blue lips, confusion, coughing blood), advise urgent care immediately.
- Be practical and supportive. Prefer short action-oriented guidance.

Patient report context:
{context if context else 'No recent diagnosis report was provided.'}

Recent chat context:
{history_text}

Current patient question:
{user_message}

Assistant response:"""