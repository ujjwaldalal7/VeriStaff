import {
  FilePlus2,
  RefreshCw
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import {
  createPayslip,
  generatePayslipDocument,
  getMyPayslips,
  getPayslips
} from "../services/payslipApi";
import { getEmployees } from "../services/employeeApi";
import type { Employee } from "../types/employee";
import { useAppSelector } from "../hooks/redux";
import { getApiErrorMessage } from "../utils/apiError";

interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: string | number;
  netSalary: string | number;
  createdAt: string;
  employee?: Employee;
  generatedDocument?: {
    id: string;
    docNumber: string;
    status: string;
    verificationHash: string;
    createdAt: string;
  } | null;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const formatMoney = (value: string | number) =>
  Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR"
  });

export default function Payslips() {
  const user = useAppSelector(
    (state) => state.auth.user
  );
  const isAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_ADMIN";

  const [payslips, setPayslips] = useState<Payslip[]>(
    []
  );
  const [employees, setEmployees] = useState<Employee[]>(
    []
  );
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [year, setYear] = useState(
    String(new Date().getFullYear())
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`
      })),
    [employees]
  );

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        const [payslipResponse, employeeResponse] =
          await Promise.all([
            getPayslips(),
            getEmployees({ limit: 100 })
          ]);
        setPayslips(payslipResponse.data);
        setEmployees(employeeResponse.data);
      } else {
        const response = await getMyPayslips();
        setPayslips(response.data.payslips);
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load payslips."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayslips();
  }, [isAdmin]);

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!employeeId) {
      setError("Select an employee first.");
      return;
    }

    try {
      setWorking("create");
      setError(null);
      setMessage(null);
      await createPayslip({
        employeeId,
        month: Number(month),
        year: Number(year)
      });
      setMessage("Payslip created.");
      await loadPayslips();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to create payslip."
        )
      );
    } finally {
      setWorking(null);
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      setWorking(id);
      setError(null);
      setMessage(null);
      await generatePayslipDocument(id);
      setMessage("Payslip document generated.");
      await loadPayslips();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to generate payslip document."
        )
      );
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Payslips
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create monthly salary snapshots and generate
              verifiable payslip PDFs.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={loadPayslips}
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

        {isAdmin && (
          <Card className="mb-6 p-5">
            <form
              onSubmit={handleCreate}
              className="grid gap-4 lg:grid-cols-[1fr_160px_160px_auto]"
            >
              <Select
                label="Employee"
                value={employeeId}
                onChange={(event) =>
                  setEmployeeId(event.target.value)
                }
              >
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Month"
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
              >
                {monthNames.map((name, index) => (
                  <option
                    key={name}
                    value={index + 1}
                  >
                    {name}
                  </option>
                ))}
              </Select>

              <Input
                label="Year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) =>
                  setYear(event.target.value)
                }
              />

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={working === "create"}
                >
                  <FilePlus2 size={17} />
                  {working === "create"
                    ? "Creating..."
                    : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Period
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gross
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Net
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Document
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading payslips...
                    </td>
                  </tr>
                )}
                {!loading && payslips.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No payslips available.
                    </td>
                  </tr>
                )}
                {!loading &&
                  payslips.map((payslip) => (
                    <tr key={payslip.id}>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {payslip.employee
                          ? `${payslip.employee.firstName} ${payslip.employee.lastName}`
                          : "My payslip"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {monthNames[payslip.month - 1]}{" "}
                        {payslip.year}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {formatMoney(payslip.grossSalary)}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {formatMoney(payslip.netSalary)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {payslip.generatedDocument ? (
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {payslip.generatedDocument.docNumber}
                          </span>
                        ) : isAdmin ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              void handleGenerate(payslip.id)
                            }
                            disabled={working === payslip.id}
                          >
                            Generate PDF
                          </Button>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Pending
                          </span>
                        )}
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
