import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PageTitle, Card, Field, inputCls, btnPrimary, btnOutline } from "../../components/UiKit";
import { useAuth, signOut } from "../../hooks/useAuth";
import { useBusiness } from "../../hooks/useBusiness";
import { updateMe } from "../../api/auth";
import { addMember, listMembers, removeMember, updateBusiness, listBusinesses } from "../../api/businesses";
import { listWhatsappNumbers, saveWhatsappNumber } from "../../api/whatsappNumbers";
import { apiErrorMessage, assetUrl } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const profileSchema = yup.object({
  name: yup.string().min(2).required(),
  email: yup.string().email().required(),
});

const teamSchema = yup.object({
  email: yup.string().email("Enter a valid email").required(),
  role: yup.string().oneOf(["agent", "admin", "owner"]).required(),
});

const waSchema = yup.object({
  display_name: yup.string().required("Display name is required"),
  phone_number: yup.string(),
  phone_number_id: yup.string().required("Phone number ID is required"),
  waba_id: yup.string().required("WABA ID is required"),
});

const businessSchema = yup.object({
  name: yup.string().min(2).required(),
  industry: yup.string(),
});

export default function AccountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBusiness, activeBusinessId } = useBusiness();
  const [members, setMembers] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    values: { name: user?.name || "", email: user?.email || "" },
  });
  const businessForm = useForm({
    resolver: yupResolver(businessSchema),
    values: { name: activeBusiness?.name || "", industry: activeBusiness?.industry || "" },
  });
  const teamForm = useForm({
    resolver: yupResolver(teamSchema),
    defaultValues: { email: "", role: "agent" },
  });
  const waForm = useForm({
    resolver: yupResolver(waSchema),
    defaultValues: { display_name: "", phone_number: "", phone_number_id: "", waba_id: "" },
  });

  useEffect(() => {
    if (!activeBusinessId) return;
    listMembers(activeBusinessId).then(setMembers).catch(() => setMembers([]));
    listWhatsappNumbers()
      .then((rows) => {
        setNumbers(rows);
        const first = rows[0];
        if (first) {
          waForm.reset({
            display_name: first.display_name || "",
            phone_number: first.phone_number || "",
            phone_number_id: first.phone_number_id || "",
            waba_id: first.waba_id || "",
          });
        }
      })
      .catch(() => setNumbers([]));
  }, [activeBusinessId]);

  const flash = (msg) => {
    setError("");
    setNotice(msg);
  };

  const onProfile = profileForm.handleSubmit(async (values) => {
    try {
      const { user: next } = await updateMe(values);
      useAuthStore.getState().setUser(next);
      flash("Profile saved");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const [logo, setLogo] = useState(null);
  const onBusiness = businessForm.handleSubmit(async (values) => {
    try {
      const updated = await updateBusiness(activeBusinessId, { ...values, logo });
      const all = await listBusinesses();
      useAuthStore.getState().setBusinesses(all.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
      setLogo(null);
      flash("Business profile saved");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const onAddMember = teamForm.handleSubmit(async (values) => {
    try {
      const member = await addMember(activeBusinessId, values);
      setMembers((prev) => [...prev, member]);
      teamForm.reset({ email: "", role: "agent" });
      flash("Team member added");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const onRemoveMember = async (userId) => {
    try {
      await removeMember(activeBusinessId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      flash("Member removed");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onWhatsapp = waForm.handleSubmit(async (values) => {
    try {
      const number = await saveWhatsappNumber(values);
      setNumbers([number]);
      flash("WhatsApp number saved (pending until first successful send or webhook)");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const currentNumber = numbers[0];

  return (
    <div className="p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1100px]">
        <PageTitle
          title="Account"
          crumb="Settings"
          action={
            <button
              className={btnOutline}
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
            >
              Log out
            </button>
          }
        />
        {notice && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</p>}
        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Your profile</h2>
            <form className="mt-4 space-y-4" onSubmit={onProfile}>
              <Field label="Name"><input className={inputCls} {...profileForm.register("name")} /></Field>
              <Field label="Email"><input className={inputCls} type="email" {...profileForm.register("email")} /></Field>
              <button className={btnPrimary} type="submit" disabled={profileForm.formState.isSubmitting}>Save profile</button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold">Business profile</h2>
            {activeBusiness?.logo_url && (
              <img src={assetUrl(activeBusiness.logo_url)} alt="" className="mt-3 h-14 w-14 rounded-xl object-cover" />
            )}
            <form className="mt-4 space-y-4" onSubmit={onBusiness}>
              <Field label="Name"><input className={inputCls} {...businessForm.register("name")} /></Field>
              <Field label="Industry"><input className={inputCls} {...businessForm.register("industry")} /></Field>
              <Field label="Logo">
                <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </Field>
              <button className={btnPrimary} type="submit" disabled={businessForm.formState.isSubmitting}>Save business</button>
            </form>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <h2 className="text-lg font-bold">Team</h2>
            <p className="mt-1 text-sm text-slate-500">Invite by email — the person must already have an account.</p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onAddMember}>
              <input className={`${inputCls} sm:flex-1`} placeholder="teammate@email.com" {...teamForm.register("email")} />
              <select className={inputCls} {...teamForm.register("role")}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              <button className={btnPrimary} type="submit">Add</button>
            </form>
            {teamForm.formState.errors.email && <p className="mt-1 text-xs text-red-500">{teamForm.formState.errors.email.message}</p>}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0">
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email} · {m.role}</p>
                  </div>
                  <button className="text-sm font-semibold text-red-500" onClick={() => onRemoveMember(m.user_id)}>Remove</button>
                </div>
              ))}
              {!members.length && <p className="px-4 py-6 text-sm text-slate-400">No members loaded.</p>}
            </div>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">WhatsApp number</h2>
              {currentNumber && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentNumber.status === "connected" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {currentNumber.status === "connected" ? "Connected" : "Pending"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Paste Meta Cloud API IDs from your WhatsApp Business account. Status stays pending until a successful send or webhook.
            </p>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onWhatsapp}>
              <Field label="Display name"><input className={inputCls} {...waForm.register("display_name")} /></Field>
              <Field label="Phone number" hint="Optional, shown in the dashboard">
                <input className={inputCls} placeholder="+919177352132" {...waForm.register("phone_number")} />
              </Field>
              <Field label="Phone number ID"><input className={inputCls} {...waForm.register("phone_number_id")} /></Field>
              <Field label="WABA ID"><input className={inputCls} {...waForm.register("waba_id")} /></Field>
              <div className="sm:col-span-2">
                <button className={btnPrimary} type="submit" disabled={waForm.formState.isSubmitting}>Save WhatsApp settings</button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
