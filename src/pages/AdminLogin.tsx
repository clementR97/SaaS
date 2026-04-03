import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type View = "login" | "forgot" | "recovery";

const MIN_PASSWORD_LEN = 6;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("recovery");
        setError(null);
        setInfo(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    setLoading(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signError) {
      setError(signError.message ?? "Erreur de connexion.");
      return;
    }
    navigate("/admin/dashboard", { replace: true });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setError("Indiquez votre adresse e-mail.");
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/admin`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message ?? "Impossible d'envoyer l'e-mail.");
      return;
    }
    setInfo(
      "Si un compte correspond à cette adresse, vous recevrez un lien pour réinitialiser le mot de passe.",
    );
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message ?? "Impossible de mettre à jour le mot de passe.");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Seo
        title="Connexion administrateur"
        description="Espace réservé aux administrateurs KaruZen Guadeloupe."
        path="/admin"
        noindex
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Espace administrateur</CardTitle>
          <CardDescription>
            {view === "login" && "Connectez-vous pour accéder au tableau de bord."}
            {view === "forgot" && "Indiquez l’e-mail du compte : vous recevrez un lien pour choisir un nouveau mot de passe."}
            {view === "recovery" && "Choisissez un nouveau mot de passe pour votre compte."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "login" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemple.fr"
                  required
                  autoComplete="email"
                  className="font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="font-body"
                />
              </div>
              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              <Button type="submit" className="w-full font-body" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
              <p className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary font-body underline underline-offset-2 hover:text-primary/90"
                  onClick={() => {
                    setView("forgot");
                    setForgotEmail(email);
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </p>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email du compte</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="font-body"
                />
              </div>
              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              {info && <p className="text-sm text-muted-foreground font-body">{info}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="font-body"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Retour
                </Button>
                <Button type="submit" className="font-body sm:min-w-[140px]" disabled={loading}>
                  {loading ? "Envoi…" : "Envoyer le lien"}
                </Button>
              </div>
            </form>
          )}

          {view === "recovery" && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">Nouveau mot de passe</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LEN}
                  autoComplete="new-password"
                  className="font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LEN}
                  autoComplete="new-password"
                  className="font-body"
                />
              </div>
              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              <Button type="submit" className="w-full font-body" disabled={loading}>
                {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
