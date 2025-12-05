import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Mail, Phone, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Shield,
      title: "1. Introduction",
      content: `Bright Buttons ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.

By using our website, you consent to the data practices described in this policy. If you do not agree with the practices described in this policy, please do not use our services.`,
    },
    {
      icon: Database,
      title: "2. Information We Collect",
      content: `We collect information that you provide directly to us and information that is automatically collected when you use our services.

Personal Information:
- Name and contact information (email address, phone number, shipping address)
- Payment information (processed securely through PCI-DSS compliant gateways)
- Account credentials (if you create an account)
- Order history and preferences
- Communications with us (customer service inquiries, feedback)

Automatically Collected Information:
- Device information (IP address, browser type, operating system)
- Usage data (pages visited, time spent, click patterns)
- Cookies and similar tracking technologies`,
    },
    {
      icon: Eye,
      title: "3. How We Use Your Information",
      content: `We use the information we collect to:
- Process and fulfill your orders
- Communicate with you about your orders, products, and services
- Send you marketing communications (with your consent)
- Improve our website and services
- Detect and prevent fraud and abuse
- Comply with legal obligations
- Respond to your inquiries and provide customer support

We do not sell your personal information to third parties.`,
    },
    {
      icon: Lock,
      title: "4. Payment Information Security",
      content: `All payment transactions are processed through secure, PCI-DSS compliant payment gateways. We do not store your complete credit card or debit card information on our servers.

Payment information is encrypted and transmitted securely using SSL/TLS technology. Our payment processors include:
- Razorpay
- Stripe
- Other authorized payment gateways

Your payment data is handled in accordance with the highest security standards and applicable regulations.`,
    },
    {
      icon: Database,
      title: "5. Information Sharing and Disclosure",
      content: `We may share your information in the following circumstances:

Service Providers: We share information with third-party service providers who perform services on our behalf, such as:
- Payment processing
- Shipping and delivery
- Email marketing
- Website analytics
- Customer support

Legal Requirements: We may disclose information if required by law or in response to valid legal requests.

Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred.

We do not sell, rent, or trade your personal information to third parties for their marketing purposes.`,
    },
    {
      icon: Lock,
      title: "6. Data Security",
      content: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
- SSL/TLS encryption for data transmission
- Secure server infrastructure
- Regular security assessments
- Access controls and authentication
- Employee training on data protection

However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`,
    },
    {
      icon: Globe,
      title: "7. Cookies and Tracking Technologies",
      content: `We use cookies and similar tracking technologies to:
- Remember your preferences and settings
- Analyze website traffic and usage patterns
- Provide personalized content and advertisements
- Improve website functionality

You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our website.

Types of cookies we use:
- Essential cookies (required for website functionality)
- Analytics cookies (help us understand website usage)
- Marketing cookies (used for personalized advertising)`,
    },
    {
      icon: Mail,
      title: "8. Your Rights and Choices",
      content: `You have the following rights regarding your personal information:

Access: Request access to your personal information
Correction: Request correction of inaccurate information
Deletion: Request deletion of your personal information
Objection: Object to processing of your information
Portability: Request transfer of your information
Withdrawal: Withdraw consent for data processing

To exercise these rights, please contact us at hello@brightbuttons.com. We will respond to your request within 30 days.`,
    },
    {
      icon: Database,
      title: "9. Data Retention",
      content: `We retain your personal information for as long as necessary to:
- Fulfill the purposes for which it was collected
- Comply with legal obligations
- Resolve disputes and enforce agreements
- Maintain business records

Order information is typically retained for 7 years for accounting and tax purposes. Account information is retained until you request deletion or close your account.`,
    },
    {
      icon: Globe,
      title: "10. Children's Privacy",
      content: `Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.`,
    },
    {
      icon: Globe,
      title: "11. International Data Transfers",
      content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country.

By using our services, you consent to the transfer of your information to these countries. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.`,
    },
    {
      icon: Shield,
      title: "12. Changes to This Privacy Policy",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by:
- Posting the updated policy on our website
- Sending an email notification (if you have an account)
- Displaying a notice on our website

Your continued use of our services after changes are posted constitutes acceptance of the updated policy.`,
    },
    {
      icon: Phone,
      title: "13. Contact Us",
      content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: hello@brightbuttons.com
Phone: +91 99526 55555
Address: [Your Business Address]

Data Protection Officer: [If applicable]

We are committed to addressing your concerns and will respond to your inquiry within 30 days.

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
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
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
            transition={{ delay: 1.3 }}
            className="mt-12 text-center"
          >
            <div className="glass-card p-6 max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                We are committed to protecting your privacy and ensuring the security of your personal information. If you have any questions or concerns, please don't hesitate to contact us.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;

