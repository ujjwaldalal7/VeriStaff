import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { getAuditLogs } from "../services/auditApi";
import type { AuditLog } from "../services/auditApi";
import { getApiErrorMessage } from "../utils/apiError";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAuditLogs({
        action: action || undefined,
        entityType: entityType || undefined,
        limit: 50
      });
      setLogs(response.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load audit logs."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Audit Logs
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tenant-scoped administrative activity.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        <Card className="mb-6 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Action"
              value={action}
              onChange={(event) =>
                setAction(event.target.value)
              }
              placeholder="DOCUMENT_REVOKE"
            />
            <Input
              label="Entity Type"
              value={entityType}
              onChange={(event) =>
                setEntityType(event.target.value)
              }
              placeholder="Employee"
            />
            <div className="flex items-end">
              <Button
                type="button"
                onClick={loadLogs}
                disabled={loading}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actor
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Entity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading audit logs...
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No audit logs found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(
                          log.createdAt
                        ).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {log.actor?.email || "System"}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {log.entityType}
                        {log.entityId
                          ? `:${log.entityId.slice(0, 8)}`
                          : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
