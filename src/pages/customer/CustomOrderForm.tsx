import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Calendar,
  DollarSign,
  FileText,
  Ruler,
  Heart,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
  path?: string;
}

const productTypes = [
  "Kurta",
  "Saree",
  "Shawl",
  "Men's Shirt",
  "T-Shirt",
  "Dress",
  "Blouse",
  "Dupatta",
  "Stole",
  "Other",
];

const fabrics = [
  "Silk",
  "Cotton",
  "Linen",
  "Grape",
  "Georgette",
  "Tussar",
  "Chiffon",
  "Khadi",
  "Handloom",
  "Other",
];

const occasions = [
  "Wedding",
  "Festival",
  "Party",
  "Casual Wear",
  "Formal Event",
  "Traditional Ceremony",
  "Daily Wear",
  "Other",
];

const budgetRanges = [
  { value: "under-5000", label: "Under ₹5,000" },
  { value: "5000-10000", label: "₹5,000 - ₹10,000" },
  { value: "10000-20000", label: "₹10,000 - ₹20,000" },
  { value: "20000-50000", label: "₹20,000 - ₹50,000" },
  { value: "above-50000", label: "Above ₹50,000" },
  { value: "flexible", label: "Flexible" },
];

const deliveryTimelines = [
  { value: "1-2-weeks", label: "1-2 Weeks" },
  { value: "2-4-weeks", label: "2-4 Weeks" },
  { value: "1-2-months", label: "1-2 Months" },
  { value: "2-3-months", label: "2-3 Months" },
  { value: "flexible", label: "Flexible" },
];

const CustomOrderForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Form state
  const [productType, setProductType] = useState("");
  const [preferredFabrics, setPreferredFabrics] = useState<string[]>([]);
  const [intendedOccasion, setIntendedOccasion] = useState("");
  const [colorPreferences, setColorPreferences] = useState("");
  const [sizeRequirements, setSizeRequirements] = useState("");
  const [designInstructions, setDesignInstructions] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [expectedDeliveryTimeline, setExpectedDeliveryTimeline] = useState("");

  // Image upload state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleFabricToggle = (fabric: string) => {
    setPreferredFabrics((prev) =>
      prev.includes(fabric)
        ? prev.filter((f) => f !== fabric)
        : [...prev, fabric]
    );
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} must be less than 10MB`,
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (customOrderId: string): Promise<void> => {
    if (images.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = images.map(async (image, index) => {
        const fileExt = image.file.name.split(".").pop();
        const fileName = `${customOrderId}/${Date.now()}-${index}.${fileExt}`;
        const filePath = `${user?.id || "anonymous"}/custom-orders/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("custom-order-images")
          .upload(filePath, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("custom-order-images").getPublicUrl(filePath);

        // Save image reference to database
        const { error: dbError } = await supabase
          .from("custom_order_images")
          .insert({
            custom_order_id: customOrderId,
            image_url: publicUrl,
            image_path: filePath,
            display_order: index,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const generateOrderNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_custom_order_number");
    if (error) {
      console.error("Error generating order number:", error);
      // Fallback: generate order number client-side if RPC fails
      const fallbackNumber = `CUSTOM-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      return fallbackNumber;
    }
    return data as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to submit a custom order",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }

    // Validation
    if (!productType) {
      toast({
        title: "Required Field",
        description: "Please select a product type",
        variant: "destructive",
      });
      return;
    }

    if (preferredFabrics.length === 0) {
      toast({
        title: "Required Field",
        description: "Please select at least one preferred fabric",
        variant: "destructive",
      });
      return;
    }

    if (!designInstructions.trim()) {
      toast({
        title: "Required Field",
        description: "Please provide design instructions",
        variant: "destructive",
      });
      return;
    }

    if (!budgetRange) {
      toast({
        title: "Required Field",
        description: "Please select a budget range",
        variant: "destructive",
      });
      return;
    }

    if (!expectedDeliveryTimeline) {
      toast({
        title: "Required Field",
        description: "Please select an expected delivery timeline",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNum = await generateOrderNumber();

      // Create custom order
      const { data: customOrder, error: orderError } = await supabase
        .from("custom_orders")
        .insert({
          order_number: orderNum,
          user_id: user.id,
          product_type: productType,
          preferred_fabrics: preferredFabrics,
          intended_occasion: intendedOccasion || null,
          color_preferences: colorPreferences || null,
          size_requirements: sizeRequirements || null,
          design_instructions: designInstructions,
          special_requirements: specialRequirements || null,
          budget_range: budgetRange,
          expected_delivery_timeline: expectedDeliveryTimeline,
          status: "submitted",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload images if any
      if (images.length > 0) {
        await uploadImages(customOrder.id);
      }

      setOrderNumber(orderNum);
      setShowSuccess(true);

      toast({
        title: "Order Submitted",
        description: "Your custom order request has been submitted successfully",
      });
    } catch (error: any) {
      console.error("Error submitting custom order:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit custom order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <CustomerLayout title="Custom Order Submitted">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-script text-gradient mb-4">
                Order Submitted Successfully!
              </h2>

              <div className="bg-primary/5 rounded-xl p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="text-2xl font-bold text-primary font-mono">{orderNumber}</p>
              </div>

              <div className="space-y-4 text-left mb-8">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">What Happens Next?</h3>
                    <p className="text-sm text-muted-foreground">
                      Our artisan team will review your request within 24-48 hours. We'll reach out
                      to discuss your vision and provide a detailed quote.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Handcrafted with Care</h3>
                    <p className="text-sm text-muted-foreground">
                      Each piece is carefully crafted to your specifications. We'll keep you
                      updated throughout the entire process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate("/customer/custom-orders")}
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  View My Custom Orders
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    navigate("/customer/custom-orders/new");
                    window.location.reload();
                  }}
                  variant="outline"
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  Submit Another Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Create Custom Order">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-script text-gradient">
              Create Your Custom Design
            </h1>
          </motion.div>
          <p className="text-muted-foreground">
            Share your vision with us, and we'll bring it to life with handcrafted care
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Product Details
              </CardTitle>
              <CardDescription>Tell us what you'd like to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productType" className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Product Type
                </Label>
                <select
                  id="productType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="">Select product type</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="after:content-['*'] after:ml-0.5 after:text-destructive">Preferred Fabrics</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fabrics.map((fabric) => (
                    <Badge
                      key={fabric}
                      variant={preferredFabrics.includes(fabric) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => handleFabricToggle(fabric)}
                    >
                      {fabric}
                    </Badge>
                  ))}
                </div>
                {preferredFabrics.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {preferredFabrics.join(", ")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="occasion">Intended Occasion</Label>
                <select
                  id="occasion"
                  value={intendedOccasion}
                  onChange={(e) => setIntendedOccasion(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Select occasion (optional)</option>
                  {occasions.map((occasion) => (
                    <option key={occasion} value={occasion}>
                      {occasion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="colorPreferences">Color Preferences</Label>
                <Input
                  id="colorPreferences"
                  value={colorPreferences}
                  onChange={(e) => setColorPreferences(e.target.value)}
                  placeholder="e.g., Earth tones, pastels, vibrant colors..."
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="sizeRequirements" className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Size Requirements
                </Label>
                <Textarea
                  id="sizeRequirements"
                  value={sizeRequirements}
                  onChange={(e) => setSizeRequirements(e.target.value)}
                  placeholder="Please provide your measurements or size preferences..."
                  className="rounded-lg min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Design Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Design Vision
              </CardTitle>
              <CardDescription>
                Describe your vision in detail. The more information, the better we can create your
                perfect piece.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="designInstructions" className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Design Instructions
                </Label>
                <Textarea
                  id="designInstructions"
                  value={designInstructions}
                  onChange={(e) => setDesignInstructions(e.target.value)}
                  placeholder="Describe your design vision, style preferences, patterns, motifs, and any specific details you'd like..."
                  className="rounded-lg min-h-[150px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any additional requirements, allergies, or special considerations..."
                  className="rounded-lg min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Reference Images
              </CardTitle>
              <CardDescription>
                Upload images that inspire your design (up to 10 images, 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium">Click to upload images</span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 10MB each
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Budget & Timeline
              </CardTitle>
              <CardDescription>
                Help us understand your budget and timeline expectations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budgetRange" className="after:content-['*'] after:ml-0.5 after:text-destructive">
                  Budget Range
                </Label>
                <select
                  id="budgetRange"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="deliveryTimeline" className="after:content-['*'] after:ml-0.5 after:text-destructive flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected Delivery Timeline
                </Label>
                <select
                  id="deliveryTimeline"
                  value={expectedDeliveryTimeline}
                  onChange={(e) => setExpectedDeliveryTimeline(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm"
                  required
                >
                  <option value="">Select timeline</option>
                  {deliveryTimelines.map((timeline) => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/customer/custom-orders")}
              className="rounded-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadingImages}
              className="flex-1 rounded-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Custom Order Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
};

export default CustomOrderForm;

