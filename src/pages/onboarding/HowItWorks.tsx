import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Video, Gavel, Image, MessageCircle, HelpCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const features = [
  {
    icon: Video,
    title: "Live Sales",
    description: "Go live and sell products in real-time. Engage with buyers directly and close sales faster."
  },
  {
    icon: Gavel,
    title: "Live Auctions",
    description: "Create exciting auction events. Watch bids rise as buyers compete for your products."
  },
  {
    icon: Image,
    title: "Gallery Listings",
    description: "List products in your gallery. Sell without going live, 24/7 availability."
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description: "Chat with buyers instantly. Answer questions and close deals faster."
  }
];

const faqs = [
  {
    question: "When will I receive payments?",
    answer: "Payments are processed within 3-5 business days after successful delivery confirmation from the buyer."
  },
  {
    question: "Is GST registration required?",
    answer: "GST registration is optional but recommended for sellers with turnover above ₹40 lakhs. You can still sell without GST."
  },
  {
    question: "What is the cancellation policy?",
    answer: "Sellers can cancel orders within 24 hours. Repeated cancellations may affect your seller rating."
  },
  {
    question: "Is live selling mandatory?",
    answer: "No, live selling is optional. You can sell through gallery listings without ever going live."
  },
  {
    question: "What commission does the platform charge?",
    answer: "The platform charges an 8% commission on each successful sale. No hidden fees."
  }
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">Step 1 of 3</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-sea-green-light">Works</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the multiple ways you can earn money on our platform
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-card/50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ 
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-4 text-muted-foreground">{faq.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/onboarding/terms")}
            className="gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;
