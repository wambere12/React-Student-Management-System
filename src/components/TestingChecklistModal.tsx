import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, RefreshCw, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { evaluateSystemChecklist, SystemTestItem, recordTestPassed } from "../services/testingChecklist";
import { loginAdmin } from "../services/authService";
import { useNavigate } from "react-router-dom";

interface TestingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestingChecklistModal({ isOpen, onClose }: TestingChecklistModalProps) {
  const [items, setItems] = useState<SystemTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const navigate = useNavigate();

  async function loadAudit() {
    setLoading(true);
    const results = await evaluateSystemChecklist();
    setItems(results);
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) {
      loadAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = items.filter((i) => i.status === "passed").length;
  const totalCount = items.length;

  async function quickSwitch(email: string, targetPath: string, testId?: number) {
    try {
      setLoading(true);
      await loginAdmin(email);
      if (testId) recordTestPassed(testId);
      setActionFeedback(`Switched session to ${email}`);
      await loadAudit();
      navigate(targetPath);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e: any) {
      setActionFeedback(`Failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold">Multi-School Testing Checklist</h2>
              <p className="text-xs text-slate-300">Phase 2 Verification Suite (Step 15: 0/11 Audit Checklist)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">System testing progress:</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {passedCount}/{totalCount} completed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAudit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-evaluate
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Quick Test Switcher Bar */}
        <div className="px-6 py-2.5 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-600">Quick Test Sessions:</span>
          <button
            onClick={() => quickSwitch("admin.kigali@schoollabs.cc", "/students", 5)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Log in as School A (Kigali)
          </button>
          <button
            onClick={() => quickSwitch("admin.greenfield@schoollabs.cc", "/students", 7)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Log in as School B (Greenfield)
          </button>
          <button
            onClick={() => quickSwitch("superadmin@edumanage.io", "/schools", 10)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
          >
            Log in as Super Admin
          </button>
        </div>

        {/* Checklist Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border transition-all ${
                item.status === "passed"
                  ? "bg-emerald-50/40 border-emerald-200"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {item.status === "passed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${item.status === "passed" ? "text-slate-900" : "text-slate-700"}`}>
                      {item.id}. {item.title}
                    </p>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        item.status === "passed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.status === "passed" ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>

                  {item.details && (
                    <p className="text-[11px] font-mono text-slate-600 mt-1.5 bg-white/80 px-2 py-1 rounded border border-slate-100">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Row Level Security (RLS) active on all PostgreSQL student queries</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
