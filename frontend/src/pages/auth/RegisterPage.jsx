import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AuthLayout from "../../components/AuthLayout";
import { inputCls, btnPrimary } from "../../components/UiKit";
import { register as registerAccount } from "../../api/auth";
import { applyAuthPayload } from "../../hooks/useAuth";
import { apiErrorMessage } from "../../api/client";

const schema = yup.object({
  name: yup.string().min(2, "Name is too short").required("Name is required"),
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(8, "Use at least 8 characters").required("Password is required"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const data = await registerAccount(values);
      await applyAuthPayload(data);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, "Could not create account"));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with a free workspace, then connect WhatsApp."
      footer={<>Already registered? <Link className="font-semibold text-blue-600" to="/login">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {serverError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Name</span>
          <input className={inputCls} autoComplete="name" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input className={inputCls} type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input className={inputCls} type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </label>
        <button className={`${btnPrimary} w-full`} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
