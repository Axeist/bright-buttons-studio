import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo.jpg";
import { format } from "date-fns";

interface InvoiceProps {
  order: any;
  onClose?: () => void;
}

export const Invoice = ({ order, onClose }: InvoiceProps) => {
  const [shopSettings, setShopSettings] = useState({
    shop_name: "Bright Buttons",
    shop_phone: "",
    shop_email: "",
    shop_address: "",
    business_hours: "",
  });

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach((item) => {
        if (typeof item.value === "string") {
          try {
            settingsMap[item.key] = JSON.parse(item.value);
          } catch {
            settingsMap[item.key] = item.value;
          }
        } else {
          settingsMap[item.key] = item.value;
        }
      });

      setShopSettings({
        shop_name: settingsMap.shop_name || "Bright Buttons",
        shop_phone: settingsMap.shop_phone || "",
        shop_email: settingsMap.shop_email || "",
        shop_address: settingsMap.shop_address || "",
        business_hours: settingsMap.business_hours || "",
      });
    } catch (error) {
      console.error("Error fetching shop settings:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, use print to PDF functionality
    // In production, you might want to use a library like jsPDF or html2pdf
    window.print();
  };

  if (!order) return null;

  return (
    <div className="bg-white text-black print:bg-white print:text-black">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>

      {/* Action Buttons - Hidden when printing */}
      <div className="no-print mb-6 flex gap-3 justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        )}
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice Container */}
      <div className="invoice-container max-w-4xl mx-auto bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-4">
                <img 
                  src={logoImage} 
                  alt="Bright Buttons" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {shopSettings.shop_address && (
                  <p>{shopSettings.shop_address}</p>
                )}
                {shopSettings.shop_phone && (
                  <p>Phone: {shopSettings.shop_phone}</p>
                )}
                {shopSettings.shop_email && (
                  <p>Email: {shopSettings.shop_email}</p>
                )}
                {shopSettings.business_hours && (
                  <p>Business Hours: {shopSettings.business_hours}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-black">Invoice #</p>
                <p className="text-lg font-bold text-black">{order.order_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Bill To */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-black">{order.customer_name}</p>
              {order.customer_email && (
                <p className="text-gray-600">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-gray-600">Phone: {order.customer_phone}</p>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Invoice Details</h3>
            <div className="text-sm space-y-1 text-gray-600">
              <p>
                <span className="font-semibold text-black">Date:</span>{" "}
                {format(new Date(order.created_at), "MMMM dd, yyyy")}
              </p>
              <p>
                <span className="font-semibold text-black">Order Date:</span>{" "}
                {format(new Date(order.created_at), "MMMM dd, yyyy")}
              </p>
              <p>
                <span className="font-semibold text-black">Payment Status:</span>{" "}
                <span className={`font-semibold ${
                  order.payment_status === "paid" ? "text-green-600" : "text-orange-600"
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </p>
              <p>
                <span className="font-semibold text-black">Payment Method:</span>{" "}
                {order.payment_method === "cash" ? "Cash on Delivery" : 
                 order.payment_method === "online" ? "Online Payment" : 
                 order.payment_method || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ship To</h3>
            <div className="text-sm text-gray-600">
              <p>{order.shipping_address}</p>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-black">Item</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-black">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-black">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">
                    <p className="font-medium text-black">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    ₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-black">
                    ₹{item.total_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-black">₹{order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-₹{order.discount_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-black">₹{order.shipping_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {order.shipping_amount === 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (GST)</span>
                <span className="text-black">₹{parseFloat(order.tax_amount).toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-800 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-black">Total</span>
                  <span className="text-lg font-bold text-black">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-6 mt-8">
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-black">Thank you for your business!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            {shopSettings.shop_email && (
              <p>For any queries, please contact us at {shopSettings.shop_email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

