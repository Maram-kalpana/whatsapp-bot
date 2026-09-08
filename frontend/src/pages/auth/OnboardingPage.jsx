import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AuthLayout from "../../components/AuthLayout";
import { inputCls, btnPrimary } from "../../components/UiKit";
import { createBusiness, listBusinesses } from "../../api/businesses";
import { useAuthStore } from "../../store/authStore";
import { syncActiveBusiness, useAuth } from "../../hooks/useAuth";
import { apiErrorMessage } from "../../api/client";

const schema = yup.object({
  name: yup.string().min(2, "Business name is too short").required("Business name is required"),
  industry: yup.string(),
});

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { businesses } = useAuth();
  const [params] = useSearchParams();
  const allowAnother = params.get("new") === "1";
  const [serverError, setServerError] = useState("");
  const [logo, setLogo] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const business = await createBusiness({ ...values, logo });
      const next = await listBusinesses();
      useAuthStore.getState().setBusinesses(next.length ? next : [business]);
      syncActiveBusiness(next.length ? next : [business]);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, "Could not create business"));
    }
  };

  if (businesses.length && !allowAnother) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      title={allowAnother ? "Create another business" : "Create your first business"}
      subtitle="This workspace holds your WhatsApp number, wallet, and team."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Business name</span>
          <input className={inputCls} placeholder="Queens Collection" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Industry <span className="font-normal text-slate-400">(optional)</span></span>
          <input className={inputCls} placeholder="Retail, Education…" {...register("industry")} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Logo <span className="font-normal text-slate-400">(optional)</span></span>
          <input
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
          />
        </label>
        <button className={`${btnPrimary} w-full`} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving…" : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
