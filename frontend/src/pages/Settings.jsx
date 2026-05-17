import { useEffect, useState } from "react";
import { User, Bell, ShieldCheck, CreditCard, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Settings — slim, B2B forwarder layout.
// Tabs (strictly four):
//   1. Profile             — personal + company / billing currency
//   2. Notifications       — per-event Email / SMS toggle matrix
//   3. Account Security    — change password + active sessions
//   4. Billing             — placeholder card (Coming soon)
// ─────────────────────────────────────────────────────────────────────────────

const tabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Account Security", icon: ShieldCheck },
  { key: "billing", label: "Billing", icon: CreditCard },
];

const Settings = () => {
  const { user } = useAuth();
  const { country } = useCountry();
  const [tab, setTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user)
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        companyName: user.companyName,
      });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/auth/me", profile);
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  // Password change
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) return toast.error("Passwords don't match");
    try {
      await api.put("/auth/password", {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      toast.success("Password updated");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  // Notification preferences
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    api.get("/notifications/preferences").then((r) => setPrefs(r.data));
  }, []);
  const toggle = (event, channel) => {
    const next = {
      ...prefs,
      [event]: { ...prefs[event], [channel]: !prefs[event][channel] },
    };
    setPrefs(next);
    api.put("/notifications/preferences", next).catch(() => toast.error("Sync failed"));
  };

  return (
    <div className="max-w-6xl mx-auto" data-testid="settings-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">
        Settings
      </h1>
      <p className="text-sm text-dhl-muted mb-7">
        Manage your profile, notifications, security and billing.
      </p>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Side nav */}
        <nav className="bg-white border border-dhl-border h-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                data-testid={`settings-tab-${t.key}`}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold uppercase tracking-wider border-l-2 ${
                  active
                    ? "border-dhl-yellow bg-dhl-yellow/10 text-dhl-ink"
                    : "border-transparent text-dhl-muted hover:bg-dhl-panel"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="bg-white border border-dhl-border p-6 lg:p-8">
          {/* ── Profile ────────────────────────────────────────────────── */}
          {tab === "profile" && (
            <div className="max-w-xl space-y-4" data-testid="settings-pane-profile">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-1">
                Profile
              </h2>
              <p className="text-xs text-dhl-muted mb-4">
                Your personal and company details — used on every booking we generate.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">
                  <Input
                    value={profile.firstName}
                    data-testid="settings-firstName"
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={profile.lastName}
                    data-testid="settings-lastName"
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Email">
                <Input value={user?.email || ""} disabled className="bg-dhl-panel" />
              </Field>
              <Field label="Phone">
                <Input
                  value={profile.phone}
                  data-testid="settings-phone"
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </Field>
              <div className="pt-4 border-t border-dhl-border space-y-3">
                <h3 className="font-display text-base font-bold text-dhl-text">
                  Company
                </h3>
                <Field label="Company Name">
                  <Input
                    value={profile.companyName}
                    data-testid="settings-company"
                    onChange={(e) =>
                      setProfile({ ...profile, companyName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Display Currency">
                  <Input
                    value={`${country.currency} — ${country.name}`}
                    disabled
                    className="bg-dhl-panel"
                  />
                </Field>
              </div>
              <Button
                onClick={saveProfile}
                disabled={saving}
                data-testid="settings-save-profile"
                className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────────────────── */}
          {tab === "notifications" && (
            <div className="max-w-2xl" data-testid="settings-pane-notifications">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-1">
                Notifications
              </h2>
              <p className="text-xs text-dhl-muted mb-5">
                Choose how you want to be alerted on key shipment milestones.
              </p>
              {!prefs ? (
                <Loader2 className="w-6 h-6 animate-spin text-dhl-yellow" />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-dhl-border">
                    <tr>
                      <th className="text-left py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                        Event
                      </th>
                      <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                        Email
                      </th>
                      <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">
                        SMS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["shipmentCreated", "Booking Confirmed"],
                      ["outForDelivery", "Vessel / Flight Departed"],
                      ["delivered", "Arrived at Destination"],
                      ["invoiceIssued", "Invoice Issued"],
                      ["pickupConfirmation", "Pickup Confirmation"],
                    ].map(([k, label]) => (
                      <tr
                        key={k}
                        className="border-b last:border-b-0 border-dhl-border"
                      >
                        <td className="py-3 text-dhl-text">{label}</td>
                        <td className="text-center py-3">
                          <Switch
                            checked={prefs[k]?.email}
                            onCheckedChange={() => toggle(k, "email")}
                            data-testid={`notif-${k}-email`}
                          />
                        </td>
                        <td className="text-center py-3">
                          <Switch
                            checked={prefs[k]?.sms}
                            onCheckedChange={() => toggle(k, "sms")}
                            data-testid={`notif-${k}-sms`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Account Security ─────────────────────────────────────── */}
          {tab === "security" && (
            <div className="max-w-xl space-y-4" data-testid="settings-pane-security">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-1">
                Account Security
              </h2>
              <p className="text-xs text-dhl-muted mb-4">
                Update your password and review the sessions currently signed into your account.
              </p>
              <Field label="Current Password">
                <Input
                  type="password"
                  value={pwd.current}
                  data-testid="pwd-current"
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                />
              </Field>
              <Field label="New Password">
                <Input
                  type="password"
                  value={pwd.next}
                  data-testid="pwd-new"
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                />
              </Field>
              <Field label="Confirm New Password">
                <Input
                  type="password"
                  value={pwd.confirm}
                  data-testid="pwd-confirm"
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                />
              </Field>
              <Button
                onClick={changePwd}
                data-testid="pwd-submit"
                className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11"
              >
                Update Password
              </Button>

              <div className="pt-6 border-t border-dhl-border mt-6">
                <h3 className="font-display text-base font-bold text-dhl-text mb-3">
                  Active Sessions
                </h3>
                <div className="bg-dhl-panel p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-dhl-text">
                      This device · Current
                    </div>
                    <div className="text-xs text-dhl-muted">
                      Web · Last activity just now
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {/* ── Billing (placeholder) ────────────────────────────────── */}
          {tab === "billing" && (
            <div className="max-w-xl" data-testid="settings-pane-billing">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-1">
                Billing
              </h2>
              <p className="text-xs text-dhl-muted mb-5">
                Manage payment methods, billing contacts and statement preferences.
              </p>
              <div className="bg-dhl-panel border border-dhl-border p-5">
                <div className="inline-block bg-dhl-yellow text-dhl-ink text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mb-3">
                  Coming Q2 2026
                </div>
                <h3 className="font-display text-lg font-bold text-dhl-text">
                  Self-service Billing Portal
                </h3>
                <p className="text-sm text-dhl-muted mb-4">
                  Soon you'll be able to add credit cards, manage direct-debit
                  mandates, set statement frequency and assign billing contacts
                  per business unit — all from this screen.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-dhl-muted">
                  <div className="bg-white border border-dhl-border p-3">
                    <div className="font-bold text-dhl-text">Payment methods</div>
                    <div>Card, bank transfer, account terms</div>
                  </div>
                  <div className="bg-white border border-dhl-border p-3">
                    <div className="font-bold text-dhl-text">Statements</div>
                    <div>Weekly · Monthly · Per-shipment</div>
                  </div>
                </div>
                <Button
                  disabled
                  className="mt-4 bg-dhl-ink text-white opacity-50 cursor-not-allowed rounded-none font-bold uppercase tracking-wider text-xs px-5 h-10"
                >
                  Configure (Locked)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">
      {label}
    </Label>
    {children}
  </div>
);

export default Settings;
