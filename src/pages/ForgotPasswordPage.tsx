import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, ArrowLeft, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { forgotPasswordSchema } from "@/lib/auth-schemas";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4">
            <FlaskConical className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LabRecord</h1>
        </div>

        <Card className="shadow-soft-lg">
          {!sent ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    autoComplete="email"
                  />
                  <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                    {submitting ? "Sending..." : (
                      <><Send className="h-4 w-4 mr-2" /> Send Reset Link</>
                    )}
                  </Button>
                  <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </Link>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-10 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10">
                <MailCheck className="h-7 w-7 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-primary hover:underline">
                  try a different email
                </button>
              </p>
              <div className="pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/reset-password?token=demo-token">
                    Continue to Reset Page (demo)
                  </Link>
                </Button>
              </div>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
