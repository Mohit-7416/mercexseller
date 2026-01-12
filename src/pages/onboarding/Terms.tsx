import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const terms = [
  {
    icon: Shield,
    title: "Platform Commission",
    description: "The platform charges an 8% commission on every successful sale. This covers payment processing, customer support, and platform maintenance.",
    type: "info"
  },
  {
    icon: AlertTriangle,
    title: "Prohibited Activities",
    description: "Fraud, fake listings, counterfeit products, or any form of misuse is strictly prohibited. Sellers must provide accurate product descriptions and images.",
    type: "warning"
  },
  {
    icon: Shield,
    title: "Account Compliance",
    description: "Sellers must maintain accurate profile information and respond to buyer queries within 24 hours during business days.",
    type: "info"
  },
  {
    icon: AlertTriangle,
    title: "Violation Consequences",
    description: "Violation of platform policies can result in account suspension, withholding of payments, or permanent ban with potential legal action.",
    type: "warning"
  }
];

const Terms = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/onboarding/how-it-works")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Step 2 of 3</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Terms & <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-sea-green-light">Conditions</span>
          </h1>
          <p className="text-muted-foreground">
            Please read and accept our terms before proceeding
          </p>
        </motion.div>

        {/* Terms List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4 mb-10"
        >
          {terms.map((term, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              className={`p-6 rounded-xl border ${
                term.type === 'warning' 
                  ? 'border-secondary/30 bg-secondary/5' 
                  : 'border-border/50 bg-card/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  term.type === 'warning' ? 'bg-secondary/10' : 'bg-primary/10'
                }`}>
                  <term.icon className={`w-5 h-5 ${
                    term.type === 'warning' ? 'text-secondary' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{term.title}</h3>
                  <p className="text-sm text-muted-foreground">{term.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Full Terms Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="p-4 rounded-xl bg-card/20 border border-border/30 mb-8"
        >
          <p className="text-sm text-muted-foreground text-center">
            For complete terms and conditions, please{" "}
            <button className="text-primary hover:underline">read the full document</button>
          </p>
        </motion.div>

        {/* Agreement Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 mb-8"
        >
          <Checkbox 
            id="agree" 
            checked={agreed} 
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="agree" className="text-sm cursor-pointer select-none">
            I have read and agree to the <span className="text-primary">Terms & Conditions</span>
          </label>
          {agreed && (
            <CheckCircle2 className="w-5 h-5 text-primary ml-auto animate-scale-in" />
          )}
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center"
        >
          <Button
            variant="hero"
            size="lg"
            disabled={!agreed}
            onClick={() => navigate("/onboarding/signup")}
            className="gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
          {!agreed && (
            <p className="text-xs text-muted-foreground mt-3">
              Please accept the terms to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
