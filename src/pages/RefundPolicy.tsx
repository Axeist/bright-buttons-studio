import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { RotateCcw, Clock, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";

const RefundPolicy = () => {
  const sections = [
    {
      icon: RotateCcw,
      title: "1. Refund Policy Overview",
      content: `At Bright Buttons, we stand behind the quality of our handmade, eco-printed products. We want you to be completely satisfied with your purchase. This Refund Policy outlines the terms and conditions for returns, exchanges, and refunds.

Please read this policy carefully before making a purchase. By placing an order, you agree to the terms of this refund policy.`,
    },
    {
      icon: Clock,
      title: "2. Refund Eligibility",
      content: `You may be eligible for a refund if:
- The product received is defective or damaged
- The product does not match the description on our website
- The wrong product was shipped
- The product was not delivered within the promised timeframe (subject to shipping policy)

Refunds are processed in accordance with Indian consumer protection laws and payment gateway regulations.`,
    },
    {
      icon: Clock,
      title: "3. Timeframe for Refund Requests",
      content: `Refund requests must be initiated within:
- 7 days of receiving the product for defective or damaged items
- 3 days of delivery for wrong products or incorrect items
- Within the delivery timeframe for non-delivery cases

Please contact us immediately if you encounter any issues with your order. Late requests may not be eligible for refunds.`,
    },
    {
      icon: Package,
      title: "4. Return Process",
      content: `To initiate a return and refund:

Step 1: Contact Us
- Email: hello@brightbuttons.com
- Phone: +91 99526 55555
- WhatsApp: +91 99526 55555

Step 2: Provide Details
- Order number
- Reason for return
- Photos of the product (if damaged or defective)
- Your contact information

Step 3: Return Authorization
- We will review your request and provide a Return Authorization (RA) number
- Do not return the product without an RA number

Step 4: Return Shipment
- Package the product securely in its original packaging (if available)
- Include the RA number and original invoice
- Ship to the address provided in the return authorization

Step 5: Refund Processing
- Once we receive and inspect the returned product, we will process your refund
- Refunds are processed within 5-7 business days after approval`,
    },
    {
      icon: CheckCircle,
      title: "5. Refund Methods",
      content: `Refunds will be issued to the original payment method used for the purchase:

Credit/Debit Cards: Refunds are processed to your card within 5-7 business days after approval. The amount may take 1-2 billing cycles to appear on your statement.

UPI: Refunds are processed within 3-5 business days to your UPI account.

Net Banking: Refunds are processed within 5-7 business days to your bank account.

Digital Wallets: Refunds are processed within 3-5 business days to your wallet.

Please note: Refund processing times may vary depending on your bank or payment provider.`,
    },
    {
      icon: XCircle,
      title: "6. Non-Refundable Items",
      content: `The following items are not eligible for refunds:
- Custom-made or personalized products (unless defective)
- Products damaged due to misuse or negligence
- Products returned after the specified timeframe
- Products without original packaging and tags
- Sale or clearance items (unless defective)
- Digital products or downloadable content
- Gift cards (unless required by law)

Additionally, shipping charges are non-refundable unless the return is due to our error.`,
    },
    {
      icon: AlertCircle,
      title: "7. Condition of Returned Products",
      content: `Returned products must be:
- In original, unused condition
- With all original tags and labels attached
- In original packaging (if available)
- Free from any damage, stains, or odors
- Accompanied by the original invoice

We reserve the right to refuse refunds for products that do not meet these conditions. In such cases, the product will be returned to you at your expense.`,
    },
    {
      icon: RotateCcw,
      title: "8. Exchange Policy",
      content: `We offer exchanges for:
- Size exchanges (subject to availability)
- Defective products
- Wrong products received

Exchange Process:
1. Contact us within 7 days of delivery
2. Obtain exchange authorization
3. Return the product as per return instructions
4. Once received and verified, we will ship the replacement

Note: Exchanges are subject to product availability. If the requested size or variant is unavailable, we will process a refund instead.`,
    },
    {
      icon: Clock,
      title: "9. Refund Processing Time",
      content: `Refund processing timeline:

1. Return Request Review: 1-2 business days
2. Return Authorization: Within 24 hours of approval
3. Product Return Shipping: 3-7 business days (depending on location)
4. Product Inspection: 1-2 business days after receipt
5. Refund Processing: 5-7 business days after approval

Total time from return request to refund: Approximately 10-18 business days

We will keep you informed at each step of the process via email.`,
    },
    {
      icon: AlertCircle,
      title: "10. Cancellation Policy",
      content: `Order Cancellation:

Before Shipment:
- Orders can be cancelled within 24 hours of placement
- Full refund will be processed within 3-5 business days
- No cancellation charges apply

After Shipment:
- Orders cannot be cancelled once shipped
- You may return the product as per the return policy
- Return shipping charges apply (unless product is defective)

Custom Orders:
- Custom or personalized orders cannot be cancelled once production begins
- Cancellation requests before production starts may be subject to a 20% processing fee`,
    },
    {
      icon: Package,
      title: "11. Return Shipping",
      content: `Return Shipping Charges:

Our Error (defective, wrong product):
- We will provide a prepaid return shipping label
- No charges to the customer

Customer Request (change of mind, size exchange):
- Customer is responsible for return shipping charges
- Original shipping charges are non-refundable

Return Address:
- Return address will be provided in the Return Authorization email
- Do not ship returns to any address without authorization`,
    },
    {
      icon: CheckCircle,
      title: "12. Dispute Resolution",
      content: `If you are not satisfied with our refund decision:

1. Contact our customer service team for review
2. Provide additional documentation if requested
3. We will conduct a thorough investigation
4. Final decision will be communicated within 5 business days

For payment gateway disputes:
- Contact your payment provider
- We will cooperate fully with any investigation
- Refunds will be processed as per payment gateway policies

We are committed to fair resolution of all disputes in accordance with Indian consumer protection laws.`,
    },
    {
      icon: AlertCircle,
      title: "13. Contact for Refunds",
      content: `For refund inquiries and requests, please contact:

Email: hello@brightbuttons.com
Phone: +91 99526 55555
WhatsApp: +91 99526 55555
Business Hours: Monday to Saturday, 10 AM - 6 PM IST

Please include your order number in all communications for faster processing.

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
                <RotateCcw className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
              Refund Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We want you to be completely satisfied with your purchase. Learn about our refund and return process.
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
                We are committed to providing excellent customer service. If you have any questions about our refund policy, please don't hesitate to contact us.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default RefundPolicy;

