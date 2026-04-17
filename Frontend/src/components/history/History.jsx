import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000/reports/patient";

function formatPredictionLabel(value) {
    const text = String(value || "Unknown").toLowerCase();
    if (text === "copd") return "COPD";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function History() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                if (!token) {
                    setError("Please login first to view diagnosis history.");
                    setLoading(false);
                    return;
                }

                const response = await fetch(API_URL, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load diagnosis history.");
                }

                setReports(Array.isArray(data.reports) ? data.reports : []);
            } catch (err) {
                setError(err.message || "Unable to load diagnosis history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const summary = useMemo(() => {
        const total = reports.length;
        const severe = reports.filter((r) => String(r.severity || "").toLowerCase() === "severe").length;
        const latest = reports[0]?.created_at ? new Date(reports[0].created_at).toLocaleDateString() : "N/A";
        return { total, severe, latest };
    }, [reports]);

    if (loading) {
        return <div className="max-w-6xl mx-auto p-8 text-lg">Loading diagnosis history...</div>;
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="bg-white border border-red-200 rounded-xl p-6 shadow-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">History Error</h2>
                    <p className="text-gray-700">{error}</p>
                    <div className="mt-4">
                        <Link to="/dashboard" className="bg-[#059AA0] text-white px-4 py-2 rounded">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Diagnosis History</h1>
                <Link to="/Input" className="bg-[#059AA0] text-white px-5 py-2 rounded-lg hover:bg-[#047D80] transition">New Diagnosis</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
                    <p className="text-sm text-gray-500">Total Reports</p>
                    <p className="text-2xl font-bold text-[#059AA0]">{summary.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
                    <p className="text-sm text-gray-500">Severe Cases</p>
                    <p className="text-2xl font-bold text-amber-600">{summary.severe}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow border border-gray-100">
                    <p className="text-sm text-gray-500">Latest Report</p>
                    <p className="text-lg font-semibold text-gray-800">{summary.latest}</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow border border-gray-100 text-center text-gray-600">
                    No diagnosis history found yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report, index) => {
                        const createdAt = report.created_at ? new Date(report.created_at) : null;
                        return (
                            <div key={report.id || index} className="bg-white rounded-xl p-5 shadow border border-gray-300">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{formatPredictionLabel(report.final_prediction)}</h2>
                                        <p className="text-sm text-gray-500">
                                            {createdAt ? createdAt.toLocaleString() : "Unknown Date"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">
                                            Confidence: {(Number(report.final_confidence || 0) * 100).toFixed(1)}%
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                                            Severity: {report.severity || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Patient ID</p>
                                        <p className="font-semibold text-gray-800">{report.patientId || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Symptom Model</p>
                                        <p className="font-semibold text-gray-800">{formatPredictionLabel(report.symptom_prediction?.prediction || "N/A")}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-gray-500">Symptoms</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(report.symptoms || []).map((symptom) => (
                                                <span key={symptom} className="px-2 py-1 rounded bg-gray-100 text-gray-700">{symptom}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default History;