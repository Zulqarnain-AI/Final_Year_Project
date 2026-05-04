def build_report_summary(report_doc):
    if not report_doc:
        return None

    symptoms_list = report_doc.get("symptoms", []) or []
    diagnosis = report_doc.get("final_prediction", "Unknown")
    confidence = report_doc.get("final_confidence", 0)
    severity = report_doc.get("severity", "Unknown")
    age = report_doc.get("age")
    sex = report_doc.get("sex")

    return {
        "age": age,
        "sex": sex,
        "symptoms": symptoms_list,
        "diagnosis": diagnosis,
        "confidence": confidence,
        "severity": severity,
    }