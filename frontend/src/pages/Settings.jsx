import { useEffect, useState } from "react";
import { User, Building2, Lock, Bell, Code2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import api from "@/lib/api";

const tabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "security", label: "Security", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "api", label: "API Access", icon: Code2 },
];

const Settings = () => {
  const { user, login } = useAuth();
  const { country } = useCountry();
  const [tab, setTab] = useState("profile");

  // Profile
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", companyName: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, companyName: user.companyName });
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

  // Password
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) return toast.error("Passwords don't match");
    try {
      await api.put("/auth/password", { currentPassword: pwd.current, newPassword: pwd.next });
      toast.success("Password updated");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  // Notifications
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    api.get("/notifications/preferences").then(r => setPrefs(r.data));
  }, []);
  const toggle = (event, channel) => {
    const next = { ...prefs, [event]: { ...prefs[event], [channel]: !prefs[event][channel] } };
    setPrefs(next);
    api.put("/notifications/preferences", next).catch(() => toast.error("Sync failed"));
  };

  return (
    <div className="max-w-6xl mx-auto" data-testid="settings-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">Settings</h1>
      <p className="text-sm text-dhl-muted mb-7">Manage your account, security, and notifications.</p>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Side nav */}
        <nav className="bg-white border border-dhl-border h-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} data-testid={`settings-tab-${t.key}`} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold uppercase tracking-wider border-l-2 ${active ? "border-dhl-yellow bg-dhl-yellow/10 text-dhl-ink" : "border-transparent text-dhl-muted hover:bg-dhl-panel"}`}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="bg-white border border-dhl-border p-6 lg:p-8">
          {tab === "profile" && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-2">Profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><Input value={profile.firstName} data-testid="settings-firstName" onChange={e => setProfile({ ...profile, firstName: e.target.value })} /></Field>
                <Field label="Last Name"><Input value={profile.lastName} data-testid="settings-lastName" onChange={e => setProfile({ ...profile, lastName: e.target.value })} /></Field>
              </div>
              <Field label="Email"><Input value={user?.email || ""} disabled className="bg-dhl-panel" /></Field>
              <Field label="Phone"><Input value={profile.phone} data-testid="settings-phone" onChange={e => setProfile({ ...profile, phone: e.target.value })} /></Field>
              <Button onClick={saveProfile} disabled={saving} data-testid="settings-save-profile" className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          )}

          {tab === "business" && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-2">Business</h2>
              <Field label="Company Name"><Input value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} /></Field>
              <Field label="Display Currency"><Input value={`${country.currency} — ${country.name}`} disabled className="bg-dhl-panel" /></Field>
              <Field label="Tax / VAT ID"><Input placeholder="—" disabled className="bg-dhl-panel" /></Field>
              <Button onClick={saveProfile} className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11">Save</Button>
            </div>
          )}

          {tab === "security" && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-2">Security</h2>
              <Field label="Current Password"><Input type="password" value={pwd.current} data-testid="pwd-current" onChange={e => setPwd({ ...pwd, current: e.target.value })} /></Field>
              <Field label="New Password"><Input type="password" value={pwd.next} data-testid="pwd-new" onChange={e => setPwd({ ...pwd, next: e.target.value })} /></Field>
              <Field label="Confirm New Password"><Input type="password" value={pwd.confirm} data-testid="pwd-confirm" onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
              <Button onClick={changePwd} data-testid="pwd-submit" className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5 h-11">
                Update Password
              </Button>

              <div className="pt-6 border-t border-dhl-border mt-6">
                <h3 className="font-display text-base font-bold text-dhl-text mb-3">Active Sessions</h3>
                <div className="bg-dhl-panel p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">This device · Current</div>
                    <div className="text-xs text-dhl-muted">Web · Last activity just now</div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="max-w-2xl">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-5">Notification Preferences</h2>
              {!prefs ? (
                <Loader2 className="w-6 h-6 animate-spin text-dhl-yellow" />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-dhl-border">
                    <tr>
                      <th className="text-left py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Event</th>
                      <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Email</th>
                      <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["shipmentCreated", "Shipment Created"],
                      ["outForDelivery", "Out for Delivery"],
                      ["delivered", "Delivered"],
                      ["invoiceIssued", "Invoice Issued"],
                      ["pickupConfirmation", "Pickup Confirmation"],
                    ].map(([k, label]) => (
                      <tr key={k} className="border-b last:border-b-0 border-dhl-border">
                        <td className="py-3">{label}</td>
                        <td className="text-center py-3"><Switch checked={prefs[k]?.email} onCheckedChange={() => toggle(k, "email")} data-testid={`notif-${k}-email`} /></td>
                        <td className="text-center py-3"><Switch checked={prefs[k]?.sms} onCheckedChange={() => toggle(k, "sms")} data-testid={`notif-${k}-sms`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "api" && (
            <div className="max-w-xl">
              <h2 className="font-display text-xl font-bold text-dhl-text mb-2">API Access</h2>
              <div className="bg-dhl-panel border border-dhl-border p-5">
                <div className="inline-block bg-dhl-yellow text-dhl-ink text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mb-3">Coming Q2 2026</div>
                <h3 className="font-display text-lg font-bold text-dhl-text">Programmatic Access</h3>
                <p className="text-sm text-dhl-muted mb-4">Generate API keys to integrate DHL Global Forwarding into your back-office. REST + Webhooks. SDKs for Python, Node and PHP.</p>
                <div className="bg-white border border-dhl-border p-3 font-mono text-xs text-dhl-muted">
                  $ curl -H "Authorization: Bearer dhl_xxxxxxxxxxxx" \<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;https://api.dhlpng.com/v1/shipments
                </div>
                <Button disabled className="mt-4 bg-dhl-ink text-white opacity-50 cursor-not-allowed rounded-none font-bold uppercase tracking-wider text-xs px-5 h-10">
                  Generate Key (Locked)
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
    <Label className="text-xs font-bold uppercase tracking-wider text-dhl-text mb-1.5 block">{label}</Label>
    {children}
  </div>
);

export default Settings;
