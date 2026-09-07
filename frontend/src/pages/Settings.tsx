import { useEffect, useState } from "react";
import type {
  ChangeEvent,
  FormEvent
} from "react";
import {
  ImageUp,
  Save,
  Upload
} from "lucide-react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import {
  useAppDispatch,
  useAppSelector
} from "../hooks/redux";
import {
  updateTenantBranding,
  uploadBrandingAsset
} from "../services/tenantApi";
import { setTenant } from "../store/slices/tenantSlice";
import type { TenantBranding } from "../types/tenant";
import { getApiErrorMessage } from "../utils/apiError";

interface BrandingForm {
  name: string;
  domain: string;
  primaryColor: string;
  secondaryColor: string;
  footerAddress: string;
}

const toForm = (
  tenant: TenantBranding | null
): BrandingForm => ({
  name: tenant?.name || "",
  domain: tenant?.domain || "",
  primaryColor: tenant?.primaryColor || "#1E40AF",
  secondaryColor: tenant?.secondaryColor || "#3B82F6",
  footerAddress: tenant?.footerAddress || ""
});

export default function Settings() {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(
    (state) => state.tenant.current
  );

  const [form, setForm] =
    useState<BrandingForm>(() => toForm(tenant));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setForm(toForm(tenant));
  }, [tenant]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await updateTenantBranding({
        name: form.name.trim(),
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        footerAddress: form.footerAddress.trim()
      });

      dispatch(setTenant(response.data));
      setMessage("Branding updated successfully.");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update tenant branding."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (
    assetType: "logo" | "watermark" | "signature",
    file: File | undefined
  ) => {
    if (!file) {
      return;
    }

    try {
      setUploading(assetType);
      setError(null);
      setMessage(null);

      const response = await uploadBrandingAsset(
        assetType,
        file
      );

      dispatch(setTenant(response.data.tenant));
      setMessage(`${assetType} uploaded successfully.`);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          `Unable to upload ${assetType}.`
        )
      );
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage tenant information and document branding.
          </p>
        </div>

        {(message || error) && (
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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <Input
                name="name"
                label="Company Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <Input
                name="domain"
                label="Domain"
                value={form.domain}
                disabled
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="primaryColor"
                  type="color"
                  label="Primary Color"
                  value={form.primaryColor}
                  onChange={handleChange}
                  required
                />

                <Input
                  name="secondaryColor"
                  type="color"
                  label="Secondary Color"
                  value={form.secondaryColor}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                name="footerAddress"
                label="Footer Address"
                value={form.footerAddress}
                onChange={handleChange}
                placeholder="Registered office address"
              />

              <Button
                type="submit"
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Branding"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Brand Assets
            </h2>

            <div className="mt-5 space-y-5">
              {[
                {
                  label: "Logo",
                  type: "logo" as const,
                  url: tenant?.logoUrl
                },
                {
                  label: "Watermark",
                  type: "watermark" as const,
                  url: tenant?.watermarkUrl
                },
                {
                  label: "Authorized Signature",
                  type: "signature" as const,
                  url: tenant?.authorizedSignUrl
                }
              ].map((item) => (
                <div
                  key={item.type}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG or WEBP up to 5 MB
                      </p>
                    </div>

                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.label}
                        className="h-10 max-w-24 object-contain"
                      />
                    ) : (
                      <ImageUp
                        size={22}
                        className="text-slate-400"
                      />
                    )}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    <Upload size={16} />
                    {uploading === item.type
                      ? "Uploading..."
                      : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={Boolean(uploading)}
                      onChange={(event) =>
                        void handleUpload(
                          item.type,
                          event.target.files?.[0]
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
