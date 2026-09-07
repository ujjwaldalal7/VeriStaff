import {
  Download,
  FilePlus2,
  RefreshCw,
  ShieldX
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import {
  createDocument,
  downloadDocument,
  getDocuments,
  getMyDocuments,
  revokeDocument
} from "../services/documentApi";
import { getEmployees } from "../services/employeeApi";
import type {
  DocumentType,
  GeneratedDocument
} from "../types/document";
import type { Employee } from "../types/employee";
import { useAppSelector } from "../hooks/redux";
import { getApiErrorMessage } from "../utils/apiError";

const documentTypes: DocumentType[] = [
  "OFFER_LETTER",
  "RELIEVING_LETTER",
  "EXPERIENCE_LETTER"
];

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Documents() {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const isAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_ADMIN";

  const [documents, setDocuments] = useState<
    GeneratedDocument[]
  >([]);
  const [employees, setEmployees] = useState<Employee[]>(
    []
  );
  const [employeeId, setEmployeeId] = useState("");
  const [docType, setDocType] =
    useState<DocumentType>("OFFER_LETTER");
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

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        const [documentResponse, employeeResponse] =
          await Promise.all([
            getDocuments(),
            getEmployees({ limit: 100 })
          ]);

        setDocuments(documentResponse.data);
        setEmployees(employeeResponse.data);
      } else {
        const response = await getMyDocuments();
        setDocuments(response.data.documents);
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load documents."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [isAdmin]);

  const handleGenerate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!employeeId) {
      setError("Select an employee first.");
      return;
    }

    try {
      setWorking("generate");
      setError(null);
      setMessage(null);

      await createDocument({
        employeeId,
        docType
      });

      setMessage("Document generated successfully.");
      await loadDocuments();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to generate document."
        )
      );
    } finally {
      setWorking(null);
    }
  };

  const handleDownload = async (
    document: GeneratedDocument
  ) => {
    try {
      setWorking(document.id);
      const blob = await downloadDocument(document.id);
      saveBlob(blob, `${document.docNumber}.pdf`);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to download document."
        )
      );
    } finally {
      setWorking(null);
    }
  };

  const handleRevoke = async (
    documentId: string
  ) => {
    if (
      !window.confirm(
        "Revoke this document? Public verification will show it as revoked."
      )
    ) {
      return;
    }

    try {
      setWorking(documentId);
      setError(null);
      await revokeDocument(documentId);
      setMessage("Document revoked.");
      await loadDocuments();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to revoke document."
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
              Documents
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Generate, download and verify employee documents.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={loadDocuments}
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
              onSubmit={handleGenerate}
              className="grid gap-4 lg:grid-cols-[1fr_240px_auto]"
            >
              <Select
                label="Employee"
                value={employeeId}
                onChange={(event) =>
                  setEmployeeId(event.target.value)
                }
                required
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
                label="Document Type"
                value={docType}
                onChange={(event) =>
                  setDocType(
                    event.target.value as DocumentType
                  )
                }
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </Select>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={working === "generate"}
                >
                  <FilePlus2 size={17} />
                  {working === "generate"
                    ? "Generating..."
                    : "Generate"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Number
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Issued
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
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
                      Loading documents...
                    </td>
                  </tr>
                )}

                {!loading && documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No documents available.
                    </td>
                  </tr>
                )}

                {!loading &&
                  documents.map((document) => (
                    <tr
                      key={document.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {document.docNumber}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatLabel(document.docType)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            document.status === "VALID"
                              ? "success"
                              : "danger"
                          }
                        >
                          {document.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(
                          document.createdAt
                        ).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              void handleDownload(document)
                            }
                            disabled={working === document.id}
                          >
                            <Download size={15} />
                            Download
                          </Button>

                          {isAdmin &&
                            document.status === "VALID" && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  void handleRevoke(
                                    document.id
                                  )
                                }
                                disabled={
                                  working === document.id
                                }
                              >
                                <ShieldX size={15} />
                                Revoke
                              </Button>
                            )}
                        </div>
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
