def is_report_question(user_message):
    message = user_message.lower()
    return any(term in message for term in [
        "diagnosis report",
        "my diagnosis report",
        "latest report",
        "report summary",
        "what does my report mean",
        "tell me about my diagnosis",
        "tell me about my diagnosis report",
        "explain my report",
        "what is my diagnosis",
    ])


def is_follow_up_question(user_message):
    message = user_message.lower().strip()
    follow_up_terms = [
        "what should i care",
        "what should i do",
        "what now",
        "what about that",
        "what about it",
        "so now",
        "next step",
        "next steps",
        "care about",
        "is it serious",
        "should i worry",
        "what can i do",
    ]
    if any(term in message for term in follow_up_terms):
        return True
    return len(message.split()) <= 8 and any(token in message for token in ["so", "now", "it", "that", "this"])


def is_doctor_consult_question(user_message):
    message = user_message.lower()
    consult_terms = [
        "consult doctor",
        "see a doctor",
        "should i see a doctor",
        "should i consult",
        "do i need a doctor",
        "doctor visit",
        "book appointment",
        "hospital",
        "go to clinic",
        "need medical help",
    ]
    return any(term in message for term in consult_terms)


def is_clearly_unrelated_domain(user_message):
    message = user_message.lower()
    lung_related_terms = [
        "lung", "respiratory", "breath", "asthma", "copd", "pneumonia", "bronch", "cough", "inhaler",
        "diagnosis", "report", "symptom", "phlegm", "mucus", "oxygen", "chest",
    ]
    if any(term in message for term in lung_related_terms):
        return False

    unrelated_terms = [
        "javascript", "python code", "react", "algorithm", "stocks", "crypto", "bitcoin", "forex",
        "sports", "football", "basketball", "betting", "movie", "song", "gaming", "politics",
        "travel", "recipe", "cooking", "homework", "exam answers",
    ]
    return any(term in message for term in unrelated_terms)


def format_report_response(report_summary):
    if not report_summary:
        return "I could not find a recent diagnosis report for you yet. Please complete a new report, and I can explain it."

    symptoms_text = ", ".join(report_summary.get("symptoms", [])) if report_summary.get("symptoms") else "none reported"
    diagnosis = str(report_summary.get("diagnosis", "Unknown")).lower()
    confidence = report_summary.get("confidence", 0)
    severity = report_summary.get("severity", "Unknown")
    age = report_summary.get("age", "not provided")
    sex = report_summary.get("sex", "not provided")

    return (
        f"Your latest diagnosis report shows {diagnosis} with a confidence of {float(confidence):.2%}. "
        f"Recorded symptoms were: {symptoms_text}. Severity was marked as {severity}. "
        f"Patient details used for the report were age {age} and sex {sex}. "
        f"This is not a final medical diagnosis, but it suggests your respiratory symptoms should be followed up with a doctor, especially if breathing gets worse. "
        f"If you want, I can also explain what this means for daily care, inhaler use, or warning signs to watch for."
    )


def format_care_advice_response(report_summary):
    if not report_summary:
        return "Based on lung care best practices, focus on hydration, avoiding smoke and dust exposure, taking prescribed medicines correctly, and monitoring symptom worsening. If breathing gets worse, contact your doctor promptly."

    diagnosis = str(report_summary.get("diagnosis", "lung condition")).lower()
    symptoms = report_summary.get("symptoms", []) or []
    severity = str(report_summary.get("severity", "Unknown"))
    symptoms_text = ", ".join(symptoms) if symptoms else "your reported respiratory symptoms"

    return (
        f"Given your latest report ({diagnosis}, severity {severity}), here is what to care about most: "
        f"1) Watch warning symptoms like increasing breathlessness, persistent fever, chest pain, confusion, or blue lips. "
        f"2) Manage current symptoms ({symptoms_text}) with rest, hydration, and prescribed medicines/inhalers on time. "
        f"3) Avoid triggers such as smoke, dust, strong fumes, and very cold air. "
        f"4) Track symptoms daily and seek doctor review if you are not improving within 24-48 hours or symptoms worsen."
    )


def format_doctor_consult_response(report_summary):
    if not report_summary:
        return (
            "If you are having ongoing breathing symptoms, yes, consulting a doctor is a good idea. "
            "Seek urgent care immediately if you have severe shortness of breath, chest pain, blue lips, confusion, or cough blood."
        )

    diagnosis = str(report_summary.get("diagnosis", "lung condition")).lower()
    severity = str(report_summary.get("severity", "Unknown")).lower()
    symptoms = [str(item).lower() for item in (report_summary.get("symptoms", []) or [])]

    emergency_terms = ["shortness of breath", "chest pain", "blue lips", "cough blood", "coughing blood", "confusion"]
    has_emergency_signal = any(term in " ".join(symptoms) for term in emergency_terms)

    if has_emergency_signal or severity in ["high", "severe", "critical"]:
        return (
            f"Yes, you should consult a doctor immediately. Your report suggests {diagnosis} with {severity} severity, "
            "and these symptoms can worsen quickly. If breathing becomes difficult right now, go to emergency care."
        )

    if severity in ["moderate", "medium"]:
        return (
            f"Yes, based on your report ({diagnosis}, {severity} severity), you should consult a doctor soon (preferably within 24 hours) "
            "to confirm treatment and prevent worsening. Seek urgent care sooner if symptoms intensify."
        )

    return (
        f"A doctor consultation is still recommended for your {diagnosis} report, even if severity appears {severity}. "
        "You can book a routine appointment and monitor symptoms closely in the meantime."
    )


def chat_history_has_report_context(chat_history):
    if not isinstance(chat_history, list):
        return False

    for item in reversed(chat_history[-8:]):
        if not isinstance(item, dict):
            continue
        role_raw = str(item.get("type", "")).lower()
        text = str(item.get("text", "")).lower()
        if role_raw == "ai" and any(term in text for term in ["diagnosis report", "latest diagnosis", "severity", "confidence"]):
            return True

    return False


def fallback_lung_response(user_message, report_summary=None, chat_history=None):
    message = user_message.lower()

    if is_report_question(user_message):
        return format_report_response(report_summary)

    if is_doctor_consult_question(user_message):
        return format_doctor_consult_response(report_summary)

    if is_follow_up_question(user_message) and (report_summary or chat_history_has_report_context(chat_history)):
        return format_care_advice_response(report_summary)

    if is_clearly_unrelated_domain(user_message):
        return "I am your lung care assistant, so I can only help with respiratory health, diagnosis reports, symptom care, and breathing-related guidance. Ask me anything in that area and I’ll help."

    report_hint = ""
    if report_summary:
        report_hint = (
            f" Based on your latest report: diagnosis {str(report_summary.get('diagnosis', 'Unknown')).lower()}, "
            f"symptoms {', '.join(report_summary.get('symptoms', [])) if report_summary.get('symptoms') else 'none reported'}, "
            f"severity {report_summary.get('severity', 'Unknown')}."
        )

    if any(term in message for term in ["breathless", "short of breath", "can't breathe", "chest pain", "coughing blood", "blue lips", "wheezing badly"]):
        return "Your symptoms may need urgent medical review. Please seek immediate medical attention or contact emergency services now." + report_hint

    if any(term in message for term in ["inhaler", "asthma", "copd", "pneumonia", "bronch", "cough", "mucus", "phlegm", "breathing", "symptom", "care"]):
        return "I can help with lung disease care guidance, inhaler reminders, breathing exercises, symptom monitoring, and when to seek medical help." + report_hint + " Please share your specific lung symptom or concern, and I’ll respond within that scope."

    return "I can support you with lung health and care planning. If your question is about your diagnosis, symptoms, medicines, breathing, or recovery, I can guide you." + report_hint