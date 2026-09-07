import {
  Check,
  RefreshCw,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import {
  getClearanceStatus,
  updateClearance
} from "../services/clearanceApi";
import { getEmployees } from "../services/employeeApi";
import type { Employee } from "../types/employee";
import { getApiErrorMessage } from "../utils/apiError";

interface Clearance {
  id: string;
  department: "IT" | "FINANCE" | "HR";
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  clearedAt: string | null;
}

export default function Clearances() {
  const [employees, setEmployees] = useState<Employee[]>(
    []
  );
  const [employeeId, setEmployeeId] = useState("");
  const [clearances, setClearances] = useState<
    Clearance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployees({
        status: "RESIGNED",
        limit: 100
      });
      setEmployees(response.data);
      setEmployeeId((current) =>
        current || response.data[0]?.id || ""
      );
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load resigned employees."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const loadClearances = async (id: string) => {
    if (!id) {
      setClearances([]);
      return;
    }

    try {
      setError(null);
      const response = await getClearanceStatus(id);
      setClearances(response.data.clearances);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load clearances."
        )
      );
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    void loadClearances(employeeId);
  }, [employeeId]);

  const handleUpdate = async (
    department: Clearance["department"],
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!employeeId) {
      return;
    }

    try {
      setWorking(department);
      setError(null);
      setMessage(null);

      await updateClearance(employeeId, department, {
        status
      });
      setMessage(`Clearance ${status.toLowerCase()}.`);
      await loadClearances(employeeId);
      await loadEmployees();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update clearance."
        )
      );
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Clearances
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Approve IT, Finance and HR offboarding clearances.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={loadEmployees}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        {(error || message) && (
          <Card
            className={[
              "mb-6 p-4 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
            ].join(" ")}
          >
            {error || message}
          </Card>
        )}

        <Card className="mb-6 p-5">
          <Select
            label="Resigned Employee"
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(event.target.value)
            }
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.firstName} {employee.lastName} (
                {employee.employeeCode})
              </option>
            ))}
          </Select>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {clearances.map((clearance) => (
            <Card key={clearance.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {clearance.department}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {clearance.remarks || "No remarks"}
                  </p>
                </div>
                <Badge
                  variant={
                    clearance.status === "APPROVED"
                      ? "success"
                      : clearance.status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {clearance.status}
                </Badge>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    void handleUpdate(
                      clearance.department,
                      "APPROVED"
                    )
                  }
                  disabled={working === clearance.department}
                >
                  <Check size={15} />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    void handleUpdate(
                      clearance.department,
                      "REJECTED"
                    )
                  }
                  disabled={working === clearance.department}
                >
                  <X size={15} />
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {!loading &&
          employeeId &&
          clearances.length === 0 && (
            <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No clearance records found for this employee.
            </Card>
          )}

        {!loading && !employeeId && (
          <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No resigned employees are awaiting clearance.
          </Card>
        )}
      </div>
    </div>
  );
}
