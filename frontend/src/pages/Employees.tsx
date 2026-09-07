import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw
} from "lucide-react";
import { useEffect, useState ,type ChangeEvent} from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

import {
  useAppDispatch,
  useAppSelector
} from "../hooks/redux";

import {
  fetchEmployees,
  setSearch,
  setStatus,
  setDepartment,
  setPage
} from "../store/slices/employeeSlice";

import type {
  EmployeeStatus
} from "../types/employee";

import Modal from "../components/ui/Modal";
import { createEmployee } from "../services/employeeApi";

const statusVariant = (
  status: EmployeeStatus
) => {
  switch (status) {
    case "ACTIVE":
      return "success" as const;

    case "ONBOARDING":
      return "info" as const;

    case "INVITED":
      return "warning" as const;

    case "RESIGNED":
      return "danger" as const;

    case "OFFBOARDED":
      return "neutral" as const;

    default:
      return "neutral" as const;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
};

interface EmployeeForm {
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: string;
  hra: string;
  allowances: string;
  deductions: string;
}

const initialForm: EmployeeForm = {
  employeeCode: "",
  email: "",
  firstName: "",
  lastName: "",
  department: "",
  designation: "",
  joiningDate: "",
  basicSalary: "0",
  hra: "0",
  allowances: "0",
  deductions: "0"
};


export default function Employees() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN";

  const {
    employees,
    page,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    search,
    status,
    department,
    loading,
    error
  } = useAppSelector(
    (state) => state.employees
  );

  useEffect(() => {
    dispatch(
      fetchEmployees({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        department:
          department || undefined
      })
    );
  }, [
    dispatch,
    page,
    search,
    status,
    department
  ]);

  const handleSearchChange = (
    value: string
  ) => {
    dispatch(setSearch(value));
    dispatch(setPage(1));
  };

  const handleStatusChange = (
    value: string
  ) => {
    dispatch(setStatus(value === "" ? "" : value as EmployeeStatus));
    dispatch(setPage(1));
  };

  const handleDepartmentChange = (
    value: string
  ) => {
    dispatch(setDepartment(value));
    dispatch(setPage(1));
  };

  const handleRefresh = () => {
    dispatch(
      fetchEmployees({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        department:
          department || undefined
      })
    );
  };

  const navigate = useNavigate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);


  const handleFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    setCreateModalOpen(false);
    setForm(initialForm);
    setFormError(null);
  };

  const handleCreateEmployee = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormError(null);

    if (
      !form.employeeCode ||
      !form.firstName ||
      !form.lastName ||
      !form.department ||
      !form.designation ||
      !form.joiningDate
    ) {
      setFormError(
        "Please fill in all required fields."
      );

      return;
    }

    try {
      setCreating(true);

      await createEmployee({
        employeeCode: form.employeeCode.trim(),
        email: form.email.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        department: form.department,
        designation: form.designation.trim(),
        joiningDate: form.joiningDate,
        basicSalary: Number(form.basicSalary) || 0,
        hra: Number(form.hra) || 0,
        allowances:
          Number(form.allowances) || 0,
        deductions:
          Number(form.deductions) || 0
      });

      setCreateModalOpen(false);
      setForm(initialForm);

      await dispatch(
        fetchEmployees({
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
          department:
            department || undefined
        })
      ).unwrap();
    } catch (error: any) {
      setFormError(
        error.response?.data?.message ||
        "Unable to create employee."
      );
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Employees
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your organization's employees.
            </p>
          </div>

          {isAdmin && <Button
            onClick={() => {
              setFormError(null);
              setForm(initialForm);
              setCreateModalOpen(true);
            }}
          >
            <UserPlus size={18} />
            Add Employee
          </Button>}
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="grid gap-4 md:grid-cols-4">

            <div className="md:col-span-2">
              <Input
                label="Search"
                placeholder="Search by name, code or department..."
                value={search}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value
                  )
                }
              />
            </div>

            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value
                )
              }
            >
              <option value="">
                All statuses
              </option>

              <option value="INVITED">
                Invited
              </option>

              <option value="ONBOARDING">
                Onboarding
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="RESIGNED">
                Resigned
              </option>

              <option value="OFFBOARDED">
                Offboarded
              </option>
            </Select>

            <Select
              label="Department"
              value={department}
              onChange={(event) =>
                handleDepartmentChange(
                  event.target.value
                )
              }
            >
              <option value="">
                All departments
              </option>

              <option value="IT">
                IT
              </option>

              <option value="HR">
                HR
              </option>

              <option value="FINANCE">
                Finance
              </option>

              <option value="SALES">
                Sales
              </option>

              <option value="MARKETING">
                Marketing
              </option>
            </Select>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
            <p className="font-medium text-red-700 dark:text-red-400">
              Unable to load employees
            </p>

            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
              {error}
            </p>

            <Button
              variant="danger"
              size="sm"
              className="mt-4"
              onClick={handleRefresh}
            >
              <RefreshCw size={15} />
              Try Again
            </Button>
          </Card>
        )}

        {/* Table */}
        <Card className="overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">

              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Department
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Designation
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Joining Date
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading employees...
                    </td>
                  </tr>
                )}

                {!loading &&
                  employees.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <Search
                            size={30}
                            className="text-slate-400"
                          />

                          <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                            No employees found
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                {!loading &&
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {employee.firstName}{" "}
                            {employee.lastName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {employee.employeeCode}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.department}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.designation}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(
                          employee.joiningDate
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={statusVariant(
                            employee.status
                          )}
                        >
                          {employee.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/employees/${employee.id}`)
                          }
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {total === 0
                ? "No employees"
                : `Showing page ${page} of ${totalPages} · ${total} employees`}
            </p>

            <div className="flex items-center gap-2">

              <Button
                variant="secondary"
                size="sm"
                disabled={
                  !hasPreviousPage ||
                  loading
                }
                onClick={() =>
                  dispatch(
                    setPage(page - 1)
                  )
                }
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {page}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={
                  !hasNextPage ||
                  loading
                }
                onClick={() =>
                  dispatch(
                    setPage(page + 1)
                  )
                }
              >
                Next
                <ChevronRight size={16} />
              </Button>

            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title="Add Employee"
        description="Create a new employee record for your organization."
        size="lg"
      >
        <form
          onSubmit={handleCreateEmployee}
          className="space-y-6"
        >
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {formError}
            </div>
          )}

          {/* Personal information */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Personal Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name *"
                name="firstName"
                value={form.firstName}
                onChange={handleFormChange}
                placeholder="John"
                required
              />

              <Input
                label="Last Name *"
                name="lastName"
                value={form.lastName}
                onChange={handleFormChange}
                placeholder="Doe"
                required
              />

              <Input
                label="Employee Code *"
                name="employeeCode"
                value={form.employeeCode}
                onChange={handleFormChange}
                placeholder="VS003"
                required
              />

              <Input
                label="Employee Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="employee@company.com"
              />
            </div>
          </div>

          {/* Employment information */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Employment Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Department *"
                value={form.department}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    department:
                      event.target.value
                  }))
                }
                required
              >
                <option value="">
                  Select department
                </option>

                <option value="IT">
                  IT
                </option>

                <option value="HR">
                  HR
                </option>

                <option value="FINANCE">
                  Finance
                </option>

                <option value="SALES">
                  Sales
                </option>

                <option value="MARKETING">
                  Marketing
                </option>
              </Select>

              <Input
                label="Designation *"
                name="designation"
                value={form.designation}
                onChange={handleFormChange}
                placeholder="Software Engineer"
                required
              />

              <Input
                label="Joining Date *"
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          {/* Compensation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Compensation
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Basic Salary"
                name="basicSalary"
                type="number"
                min="0"
                step="0.01"
                value={form.basicSalary}
                onChange={handleFormChange}
              />

              <Input
                label="HRA"
                name="hra"
                type="number"
                min="0"
                step="0.01"
                value={form.hra}
                onChange={handleFormChange}
              />

              <Input
                label="Allowances"
                name="allowances"
                type="number"
                min="0"
                step="0.01"
                value={form.allowances}
                onChange={handleFormChange}
              />

              <Input
                label="Deductions"
                name="deductions"
                type="number"
                min="0"
                step="0.01"
                value={form.deductions}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={closeCreateModal}
              disabled={creating}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
