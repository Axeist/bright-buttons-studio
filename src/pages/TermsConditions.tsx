import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { FileText, Scale, Shield, AlertCircle } from "lucide-react";

const TermsConditions = () => {
  const sections = [
    {
      icon: Scale,
      title: "1. Acceptance of Terms",
      content: `By accessing and using the Bright Buttons website (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      icon: Shield,
      title: "2. Use License",
      content: `Permission is granted to temporarily download one copy of the materials on Bright Buttons' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display
- Attempt to decompile or reverse engineer any software contained on Bright Buttons' website
- Remove any copyright or other proprietary notations from the materials`,
    },
    {
      icon: FileText,
      title: "3. Products and Services",
      content: `Bright Buttons offers eco-printed, handmade clothing and accessories. All products are:
- Handcrafted using natural dyes and sustainable techniques
- Unique - no two pieces are exactly the same
- Made in small batches with care and attention to detail
- Subject to availability

We reserve the right to modify, suspend, or discontinue any product or service at any time without prior notice.`,
    },
    {
      icon: AlertCircle,
      title: "4. Pricing and Payment",
      content: `All prices are displayed in Indian Rupees (₹) and are subject to change without notice. Payment must be made in full at the time of order placement through our secure payment gateway. We accept:
- Credit/Debit Cards (Visa, Mastercard, RuPay)
- UPI (Unified Payments Interface)
- Net Banking
- Digital Wallets

All transactions are processed securely through PCI-DSS compliant payment gateways. By making a purchase, you agree to provide current, complete, and accurate purchase and account information.`,
    },
    {
      icon: Shield,
      title: "5. Order Processing",
      content: `Once you place an order, you will receive an order confirmation email. We will begin processing your order immediately. Due to the handmade nature of our products, processing times may vary. You will receive an estimated delivery date at the time of order confirmation.

We reserve the right to refuse or cancel any order for any reason, including but not limited to:
- Product availability
- Errors in pricing or product information
- Suspected fraudulent activity
- Incomplete or inaccurate order information`,
    },
    {
      icon: FileText,
      title: "6. Intellectual Property",
      content: `All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and software, is the property of Bright Buttons or its content suppliers and is protected by Indian and international copyright laws.

You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without prior written consent.`,
    },
    {
      icon: AlertCircle,
      title: "7. User Accounts",
      content: `If you create an account on our website, you are responsible for:
- Maintaining the confidentiality of your account and password
- All activities that occur under your account
- Notifying us immediately of any unauthorized use of your account

We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.`,
    },
    {
      icon: Shield,
      title: "8. Limitation of Liability",
      content: `Bright Buttons shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, even if we have been advised of the possibility of such damages.

Our total liability to you for all claims arising from or related to the use of our service shall not exceed the amount you paid to us in the 12 months prior to the action giving rise to liability.`,
    },
    {
      icon: FileText,
      title: "9. Indemnification",
      content: `You agree to indemnify, defend, and hold harmless Bright Buttons, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the service, violation of these terms, or infringement of any rights of another.`,
    },
    {
      icon: AlertCircle,
      title: "10. Governing Law",
      content: `These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of the service shall be subject to the exclusive jurisdiction of the courts in India.`,
    },
    {
      icon: FileText,
      title: "11. Changes to Terms",
      content: `We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the service after changes are posted constitutes your acceptance of the modified terms.

We encourage you to review these terms periodically to stay informed of any updates.`,
    },
    {
      icon: Shield,
      title: "12. Contact Information",
      content: `If you have any questions about these Terms and Conditions, please contact us at:

Email: hello@brightbuttons.com
Phone: +91 99526 55555
Address: [Your Business Address]

Last Updated: January 2025`,
    },
  ];

  return (
    <PublicLayout>
      <div className="gradient-hero min-h-screen">
        <div className="container-custom py-12 md:py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using our services. By using our website, you agree to be bound by these terms.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last Updated: January 2025
            </p>
          </motion.div>

          {/* Content Sections */}
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="glass-card p-6 md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h2>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 text-center"
          >
            <div className="glass-card p-6 max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                By using our website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsConditions;

