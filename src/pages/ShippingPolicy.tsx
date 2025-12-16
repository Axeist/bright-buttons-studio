import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Truck, MapPin, Clock, Package, AlertCircle, CheckCircle, Globe } from "lucide-react";

const ShippingPolicy = () => {
  const sections = [
    {
      icon: Truck,
      title: "1. Shipping Policy Overview",
      content: `At Bright Buttons, we are committed to delivering your handmade, eco-printed products safely and on time. This Shipping Policy outlines our delivery process, timelines, and shipping charges.

Please review this policy before placing an order. By placing an order, you agree to the terms of this shipping policy.`,
    },
    {
      icon: Globe,
      title: "2. Shipping Locations",
      content: `We currently ship to:
- All states and union territories in India
- International shipping available on request (contact us for details)

Shipping Address:
- Please ensure your shipping address is complete and accurate
- Include PIN code, landmark, and contact number
- We are not responsible for delays due to incorrect addresses
- Address changes after order confirmation may incur additional charges`,
    },
    {
      icon: Clock,
      title: "3. Processing Time",
      content: `Due to the handmade nature of our products, processing times may vary:

Standard Products:
- Processing time: 3-5 business days
- Products are handcrafted in small batches
- Quality checks are performed before shipping

Custom Orders:
- Processing time: 7-14 business days
- Custom designs require additional time
- We will provide an estimated completion date

Pre-Order Items:
- Processing time: 14-21 business days
- You will be notified when your item is ready to ship

Note: Processing time does not include shipping time. Business days exclude weekends and public holidays.`,
    },
    {
      icon: Truck,
      title: "4. Shipping Methods and Timelines",
      content: `We use reliable courier partners for shipping:

Standard Shipping (India):
- Delivery time: 5-7 business days
- Available for all locations
- Trackable via courier partner's website

Express Shipping (India):
- Delivery time: 2-3 business days
- Available for major cities
- Additional charges apply
- Order before 2 PM for same-day dispatch

International Shipping:
- Delivery time: 10-20 business days
- Customs duties and taxes are customer's responsibility
- Contact us for international shipping rates

Note: Delivery times are estimates and may vary due to:
- Weather conditions
- Courier delays
- Remote locations
- Customs clearance (for international orders)`,
    },
    {
      icon: Package,
      title: "5. Shipping Charges",
      content: `Shipping charges are calculated based on:

Domestic Shipping (India):
- Orders above ₹2,000: FREE standard shipping
- Orders below ₹2,000: ₹150 standard shipping
- Express shipping: ₹300 (additional to standard charges)
- Cash on Delivery (COD): Additional ₹50 charge

International Shipping:
- Calculated based on weight and destination
- Contact us for exact shipping costs
- Customs duties and taxes are customer's responsibility

Shipping charges are displayed at checkout before payment confirmation.`,
    },
    {
      icon: MapPin,
      title: "6. Order Tracking",
      content: `Once your order is shipped, you will receive:
- Shipping confirmation email with tracking number
- SMS notification with tracking link (if phone number provided)
- Updates at each stage of delivery

Track Your Order:
- Use the tracking number on the courier partner's website
- Check your email for tracking links
- Contact us if you need assistance with tracking

Delivery Status Updates:
- Order Confirmed
- Processing
- Shipped (with tracking number)
- In Transit
- Out for Delivery
- Delivered`,
    },
    {
      icon: CheckCircle,
      title: "7. Delivery Process",
      content: `Delivery Process:

Step 1: Order Confirmation
- You receive order confirmation email
- Order is queued for processing

Step 2: Processing
- Product is handcrafted (if not in stock)
- Quality check performed
- Product is packaged securely

Step 3: Shipping
- Product is dispatched
- Tracking information is shared
- Estimated delivery date provided

Step 4: Delivery
- Courier attempts delivery at provided address
- Contact number is used for coordination
- Signature may be required (for high-value orders)

Step 5: Delivery Confirmation
- Delivery confirmation email sent
- Order marked as completed`,
    },
    {
      icon: AlertCircle,
      title: "8. Delivery Attempts and Failed Deliveries",
      content: `Delivery Attempts:
- Courier will make 2-3 delivery attempts
- Contact number must be reachable
- Delivery may be rescheduled if recipient is unavailable

Failed Delivery Scenarios:
- Incorrect address: Contact us immediately to update
- Unreachable contact: Ensure phone is switched on
- Refused delivery: Order will be returned, refund processed minus shipping charges
- Address not found: Contact us to provide correct address

Return to Sender:
- If delivery fails after all attempts, order is returned
- Refund processed minus shipping and return charges
- Customer may request re-shipment (additional charges apply)`,
    },
    {
      icon: Package,
      title: "9. Packaging",
      content: `We take great care in packaging your products:

Packaging Materials:
- Eco-friendly packaging materials
- Protective wrapping for delicate items
- Secure boxes to prevent damage during transit

Package Contents:
- Ordered product(s)
- Invoice copy
- Care instructions (if applicable)
- Brand information

Damage During Transit:
- If product arrives damaged, contact us immediately
- Provide photos of damaged packaging and product
- We will arrange replacement or refund
- No additional charges for damaged items`,
    },
    {
      icon: Clock,
      title: "10. Delivery Delays",
      content: `While we strive for timely delivery, delays may occur due to:

Uncontrollable Factors:
- Natural disasters or extreme weather
- Courier service delays
- Customs clearance delays (international)
- Remote location accessibility
- Public holidays or festivals

What We Do:
- Keep you informed of any delays
- Work with courier partners to expedite delivery
- Provide updated delivery estimates

Compensation:
- If delay exceeds 15 business days, contact us
- We will investigate and provide resolution
- May include partial refund or expedited shipping`,
    },
    {
      icon: AlertCircle,
      title: "11. Cash on Delivery (COD)",
      content: `COD Available For:
- Orders within India
- Orders above ₹500
- Selected locations (subject to courier availability)

COD Process:
- Additional ₹50 COD charge applies
- Payment collected at time of delivery
- Cash payment only (exact change preferred)
- Order is confirmed only after payment

COD Limitations:
- Not available for all locations
- Maximum order value: ₹10,000
- May require additional verification
- Subject to courier partner policies

Note: COD orders may have longer processing times.`,
    },
    {
      icon: CheckCircle,
      title: "12. International Shipping",
      content: `International Shipping Details:

Available Countries:
- Contact us for list of countries we ship to
- Subject to customs and import regulations

Shipping Charges:
- Calculated based on weight and destination
- Contact us for exact shipping costs
- Payment required before shipping

Customs and Duties:
- Customer is responsible for all customs duties and taxes
- Duties vary by country
- Contact local customs office for estimates
- We are not responsible for customs delays or charges

Delivery Time:
- 10-20 business days (varies by destination)
- Subject to customs clearance
- Tracking provided for all international orders`,
    },
    {
      icon: AlertCircle,
      title: "13. Lost or Stolen Packages",
      content: `If your package is lost or stolen:

Immediate Actions:
- Contact us within 7 days of expected delivery
- Provide order number and tracking information
- We will investigate with courier partner

Resolution:
- If package is lost in transit: Full refund or replacement
- If package is stolen after delivery: File police report, we'll assist with claim
- Investigation may take 7-10 business days

Prevention:
- Track your order regularly
- Ensure secure delivery location
- Provide accurate contact information
- Consider signature-required delivery for high-value orders`,
    },
    {
      icon: MapPin,
      title: "14. Contact for Shipping Inquiries",
      content: `For shipping-related questions and support:

Email: support@brightbuttons.in
Phone: +91 99526 55555
WhatsApp: +91 99526 55555
Business Hours: Monday to Saturday, 10 AM - 6 PM IST

Please include your order number in all communications for faster assistance.

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
                <Truck className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
              Shipping Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Learn about our shipping methods, delivery timelines, and shipping charges for your orders.
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
            transition={{ delay: 1.4 }}
            className="mt-12 text-center"
          >
            <div className="glass-card p-6 max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                We are committed to delivering your orders safely and on time. If you have any questions about shipping, please don't hesitate to contact us.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ShippingPolicy;

