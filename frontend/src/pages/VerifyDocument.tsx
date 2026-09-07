import {
  AlertTriangle,
  CheckCircle2,
  ShieldX
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import { verifyDocumentHash } from "../services/verificationApi";
import type { VerificationResponse } from "../services/verificationApi";
import { getApiErrorMessage } from "../utils/apiError";

export default function VerifyDocument() {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<
    VerificationResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!hash) {
        setError("Verification hash is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await verifyDocumentHash(hash);
        setData(response.data);
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Document not found or verification hash is invalid."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [hash]);

  const revoked = data?.status === "REVOKED";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <Card className="p-6 sm:p-8">
          {loading && (
            <p className="text-sm text-slate-500">
              Verifying document...
            </p>
          )}

          {!loading && error && (
            <div className="text-center">
              <AlertTriangle
                size={44}
                className="mx-auto text-red-500"
              />
              <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                Verification Failed
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          )}

          {!loading && data && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                {data.company.logoUrl && (
                  <img
                    src={data.company.logoUrl}
                    alt={data.company.name}
                    className="h-12 max-w-36 object-contain"
                  />
                )}
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Verified by
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data.company.name}
                  </h1>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Document Status
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {revoked ? (
                        <ShieldX
                          size={22}
                          className="text-red-500"
                        />
                      ) : (
                        <CheckCircle2
                          size={22}
                          className="text-emerald-500"
                        />
                      )}
                      <Badge
                        variant={
                          revoked ? "danger" : "success"
                        }
                      >
                        {data.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-right text-sm font-medium text-slate-900 dark:text-white">
                    {data.documentNumber}
                  </p>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-400">
                      Document Type
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {data.documentType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-400">
                      Issued
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(
                        data.issuedAt
                      ).toLocaleDateString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-400">
                      Employee
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {data.employee.firstName}{" "}
                      {data.employee.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-400">
                      Designation
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {data.employee.designation}
                    </dd>
                  </div>
                </dl>

                {revoked && data.revokedAt && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    This document was revoked on{" "}
                    {new Date(
                      data.revokedAt
                    ).toLocaleString("en-IN")}
                    .
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
