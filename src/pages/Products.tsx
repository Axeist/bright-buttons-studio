import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Edit, Trash2, Leaf, Sparkles, Package, Scan, Loader2, AlertCircle, Upload, Download, FileText, X, Image as ImageIcon, Printer, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/hooks/useAuth";
import { generateBarcode, generateBarcodeImage } from "@/lib/barcode";
import { parseCSV, validateCSVData, generateSampleCSV, CSVProductRow, CSVValidationError } from "@/lib/csvImport";
import { getProductImageUrl } from "@/lib/utils";
import logoImage from "@/assets/logo.jpg";

interface ProductPhoto {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  fabric: string | null;
  technique: string | null;
  price: number;
  cost_price?: number | null;
  barcode: string | null;
  sku: string | null;
  image_url: string | null;
  low_stock_threshold?: number;
  tagline?: string | null;
  status: 'active' | 'inactive' | 'archived';
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  };
  product_photos?: ProductPhoto[];
}

const Products = () => {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<CSVValidationError[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeImageUrl, setBarcodeImageUrl] = useState<string | null>(null);
  const [currentBarcodeValue, setCurrentBarcodeValue] = useState<string>("");
  const [barcodeProductName, setBarcodeProductName] = useState<string>("");
  const [barcodeSku, setBarcodeSku] = useState<string>("");
  type StickerSize = "50x30" | "60x40" | "100x50";
  const [stickerSize, setStickerSize] = useState<StickerSize>("50x30");
  const [showProductNameOnLabel, setShowProductNameOnLabel] = useState(true);
  const [showSkuOnLabel, setShowSkuOnLabel] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProductId, setExportProductId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputEditRef = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [productPhotos, setProductPhotos] = useState<Array<{ file?: File; url: string; isPrimary?: boolean; fromGallery?: boolean }>>([]);
  const [editingProductPhotos, setEditingProductPhotos] = useState<Array<{ id?: string; file?: File; url: string; isPrimary?: boolean; fromGallery?: boolean }>>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ id: string; image_url: string; title: string | null }>>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [photoSelectionMode, setPhotoSelectionMode] = useState<"gallery" | "upload">("upload");
  const [isForEdit, setIsForEdit] = useState(false);
  const [fabricOptions, setFabricOptions] = useState<{ id: string; name: string }[]>([]);
  const [techniqueOptions, setTechniqueOptions] = useState<{ id: string; name: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    fabric: "",
    technique: "",
    price: "",
    cost_price: "",
    barcode: "",
    sku: "",
    stock: "",
    low_stock_threshold: "5",
    image_url: "",
    tagline: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      const [fabRes, techRes, catRes] = await Promise.all([
        supabase.from("fabric_options").select("id, name").order("display_order", { ascending: true }),
        supabase.from("technique_options").select("id, name").order("display_order", { ascending: true }),
        supabase.from("category_options").select("id, name").order("display_order", { ascending: true }),
      ]);
      if (!fabRes.error) setFabricOptions(fabRes.data || []);
      if (!techRes.error) setTechniqueOptions(techRes.data || []);
      if (!catRes.error) {
        const cats = catRes.data || [];
        setCategoryOptions(cats);
        setFormData((prev) => ({ ...prev, category: prev.category || (cats[0]?.name ?? "") }));
      }
    };
    loadOptions();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          inventory (
            quantity,
            reserved_quantity
          ),
          product_photos (
            id,
            product_id,
            image_url,
            display_order,
            is_primary
          )
        `)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBarcode = (barcodeValue: string, productName?: string, sku?: string) => {
    if (!barcodeValue) {
      toast({
        title: "No Barcode",
        description: "Please enter or generate a barcode first",
        variant: "destructive",
      });
      return;
    }
    const imageUrl = generateBarcodeImage(barcodeValue);
    setBarcodeImageUrl(imageUrl);
    setCurrentBarcodeValue(barcodeValue);
    setBarcodeProductName(productName || "");
    setBarcodeSku(sku || "");
    setIsBarcodeModalOpen(true);
  };

  const THERMAL_SIZES: Record<StickerSize, { w: string; h: string }> = {
    "50x30": { w: "50mm", h: "30mm" },
    "60x40": { w: "60mm", h: "40mm" },
    "100x50": { w: "100mm", h: "50mm" },
  };

  const printBarcodeLabel = (args: {
    barcodeImage: string;
    barcodeValue: string;
    productName?: string;
    sku?: string;
    size: StickerSize;
    showProductName: boolean;
    showSku: boolean;
  }) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const { w, h } = THERMAL_SIZES[args.size];
    const safeName = (args.productName || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const safeValue = (args.barcodeValue || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const safeSku = (args.sku || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Barcode - ${safeValue}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #fff;
              font-family: Arial, sans-serif;
            }
            @media print {
              @page {
                size: ${w} ${h};
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .sticker-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 2mm !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .sticker-print-area .sticker-barcode-image {
                max-width: 100% !important;
                height: auto !important;
                object-fit: contain !important;
              }
            }
            .sticker-print-area {
              position: absolute;
              left: 0; top: 0;
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .sticker-print-area .brand {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              margin-bottom: 2px;
            }
            .sticker-print-area .brand img {
              width: 20px;
              height: 20px;
              object-fit: contain;
            }
            .sticker-print-area .brand-name {
              font-size: 9px;
              font-weight: 700;
            }
            .sticker-print-area .sticker-barcode-image {
              max-width: 100%;
              height: auto;
            }
            .sticker-print-area .sticker-value {
              font-size: 8px;
              font-weight: bold;
              margin-top: 1px;
            }
            .sticker-print-area .sticker-name {
              font-size: 7px;
              margin-top: 1px;
            }
            .sticker-print-area .sticker-sku {
              font-size: 6px;
              color: #333;
              margin-top: 0;
            }
          </style>
        </head>
        <body>
          <div class="sticker-print-area">
            <div class="brand">
              <img src="${logoImage}" alt="Bright Buttons" />
              <span class="brand-name">Bright Buttons</span>
            </div>
            <img src="${args.barcodeImage}" alt="Barcode ${safeValue}" class="sticker-barcode-image" />
            <div class="sticker-value">${safeValue}</div>
            ${args.showProductName && safeName ? `<div class="sticker-name">${safeName}</div>` : ""}
            ${args.showSku && safeSku ? `<div class="sticker-sku">${safeSku}</div>` : ""}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintBarcode = () => {
    if (!barcodeImageUrl) return;
    printBarcodeLabel({
      barcodeImage: barcodeImageUrl,
      barcodeValue: currentBarcodeValue,
      productName: barcodeProductName,
      sku: barcodeSku,
      size: stickerSize,
      showProductName: showProductNameOnLabel,
      showSku: showSkuOnLabel,
    });
  };

  const handleOpenExport = () => {
    const first = filteredProducts?.[0];
    setExportProductId(first?.id || "");
    if (first) {
      const value = first.barcode || generateBarcode(first.id);
      setBarcodeImageUrl(generateBarcodeImage(value));
      setCurrentBarcodeValue(value);
      setBarcodeProductName(first.name);
      setBarcodeSku(first.sku || "");
    } else {
      setBarcodeImageUrl(null);
      setCurrentBarcodeValue("");
      setBarcodeProductName("");
      setBarcodeSku("");
    }
    setIsExportModalOpen(true);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (data) {
      setEditingProduct(data as Product);
      setFormData({
        name: data.name,
        description: data.description || "",
        category: data.category,
        fabric: data.fabric || "",
        technique: data.technique || "",
        price: data.price.toString(),
        cost_price: data.cost_price?.toString() || "",
        barcode: data.barcode || "",
        sku: data.sku || "",
        stock: "",
        low_stock_threshold: data.low_stock_threshold.toString(),
        image_url: data.image_url || "",
        tagline: data.tagline || "",
      });
      setIsEditModalOpen(true);
    } else {
      // New product with barcode
      setFormData({
        ...formData,
        barcode,
      });
      setIsAddModalOpen(true);
    }
  };

  const handleAddProduct = async () => {
    try {
      const price = parseFloat(formData.price);
      if (!price || price <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      // Upload image if provided
      let imageUrl = formData.image_url || null;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // If upload failed, don't proceed
          return;
        }
      }

      // Generate barcode if not provided
      let barcodeValue = formData.barcode || null;
      
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          fabric: formData.fabric || null,
          technique: formData.technique || null,
          price,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          barcode: barcodeValue,
          sku: formData.sku || null,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          image_url: imageUrl,
          tagline: formData.tagline || null,
          status: "active",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Auto-generate barcode if not provided
      if (!barcodeValue) {
        barcodeValue = generateBarcode(product.id);
        await supabase
          .from("products")
          .update({ barcode: barcodeValue })
          .eq("id", product.id);
      }

      // Add inventory if stock is provided
      if (formData.stock) {
        const stockQty = parseInt(formData.stock);
        if (stockQty > 0) {
          await supabase.from("inventory").insert({
            product_id: product.id,
            quantity: stockQty,
          });

          // Record stock movement
          await supabase.from("stock_movements").insert({
            product_id: product.id,
            quantity_change: stockQty,
            movement_type: "purchase",
            reference_type: "purchase",
            notes: "Initial stock",
            created_by: user?.id || null,
          });
        }
      }

      // Upload product photos if any
      if (productPhotos.length > 0) {
        await uploadProductPhotos(product.id, productPhotos, product.name, product.category);
      }

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      setIsAddModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const price = parseFloat(formData.price);
      if (!price || price <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      // Upload new image if provided
      let imageUrl = formData.image_url || editingProduct.image_url || null;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // If upload failed, don't proceed
          return;
        }
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          fabric: formData.fabric || null,
          technique: formData.technique || null,
          price,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          barcode: formData.barcode || null,
          sku: formData.sku || null,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          image_url: imageUrl,
          tagline: formData.tagline || null,
        })
        .eq("id", editingProduct.id);

      if (productError) throw productError;

      // Update inventory if stock is provided
      if (formData.stock) {
        const stockQty = parseInt(formData.stock);
        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", editingProduct.id)
          .single();

        if (inventory) {
          const quantityChange = stockQty - inventory.quantity;
          if (quantityChange !== 0) {
            await supabase.from("stock_movements").insert({
              product_id: editingProduct.id,
              quantity_change: quantityChange,
              movement_type: quantityChange > 0 ? "purchase" : "adjustment",
              reference_type: "adjustment",
              notes: "Stock update",
              created_by: user?.id || null,
            });
          }
          await supabase
            .from("inventory")
            .update({ quantity: stockQty })
            .eq("product_id", editingProduct.id);
        } else if (stockQty > 0) {
          await supabase.from("inventory").insert({
            product_id: editingProduct.id,
            quantity: stockQty,
          });
        }
      }

      // Handle product photos updates
      // Delete existing photos that were removed
      const existingPhotoIds = editingProductPhotos
        .filter(p => p.id)
        .map(p => p.id as string);
      
      const { data: existingPhotos } = await supabase
        .from("product_photos")
        .select("id")
        .eq("product_id", editingProduct.id);

      if (existingPhotos) {
        const photosToDelete = existingPhotos
          .filter(p => !existingPhotoIds.includes(p.id))
          .map(p => p.id);
        
        if (photosToDelete.length > 0) {
          await supabase
            .from("product_photos")
            .delete()
            .in("id", photosToDelete);
        }
      }

      // Upload new photos and update existing ones
      for (let i = 0; i < editingProductPhotos.length; i++) {
        const photo = editingProductPhotos[i];
        let imageUrl = photo.url;
        let isNewUpload = false;

        if (photo.file) {
          // Upload new file
          const uploadedUrl = await uploadImageFromFile(photo.file);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            isNewUpload = true; // Mark as newly uploaded (not from gallery)
          }
        }

        if (photo.id) {
          // Update existing photo
          await supabase
            .from("product_photos")
            .update({
              image_url: imageUrl,
              display_order: i,
              is_primary: photo.isPrimary || false,
            })
            .eq("id", photo.id);
        } else {
          // Insert new photo
          await supabase
            .from("product_photos")
            .insert({
              product_id: editingProduct.id,
              image_url: imageUrl,
              display_order: i,
              is_primary: photo.isPrimary || false,
            });

          // If this is a newly uploaded photo (not from gallery), add it to gallery
          if (isNewUpload && !photo.fromGallery) {
            await addPhotoToGallery(imageUrl, editingProduct.name, editingProduct.category);
          }
        }
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      setIsEditModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: "archived" })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product archived successfully",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const fetchGalleryPhotos = async () => {
    setGalleryLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, image_url, title")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setGalleryPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch gallery photos",
        variant: "destructive",
      });
    } finally {
      setGalleryLoading(false);
    }
  };

  const openGalleryModal = (forEdit: boolean = false) => {
    setIsForEdit(forEdit);
    setIsGalleryModalOpen(true);
    fetchGalleryPhotos();
  };

  const handleSelectGalleryPhoto = (photo: { id: string; image_url: string; title: string | null }) => {
    if (isForEdit) {
      setEditingProductPhotos([...editingProductPhotos, { 
        id: photo.id, 
        url: photo.image_url, 
        isPrimary: editingProductPhotos.length === 0,
        fromGallery: true 
      }]);
    } else {
      setProductPhotos([...productPhotos, { 
        url: photo.image_url, 
        isPrimary: productPhotos.length === 0,
        fromGallery: true 
      }]);
    }
    // Don't close modal automatically - let user select multiple photos
  };

  const handleAddPhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    setProductPhotos([...productPhotos, { file, url, isPrimary: productPhotos.length === 0, fromGallery: false }]);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = productPhotos.filter((_, i) => i !== index);
    if (newPhotos.length > 0 && productPhotos[index].isPrimary) {
      newPhotos[0].isPrimary = true;
    }
    setProductPhotos(newPhotos);
  };

  const handleSetPrimaryPhoto = (index: number) => {
    setProductPhotos(productPhotos.map((photo, i) => ({
      ...photo,
      isPrimary: i === index
    })));
  };

  const handleAddEditPhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    setEditingProductPhotos([...editingProductPhotos, { file, url, isPrimary: editingProductPhotos.length === 0, fromGallery: false }]);
  };

  const handleRemoveEditPhoto = (index: number) => {
    const newPhotos = editingProductPhotos.filter((_, i) => i !== index);
    if (newPhotos.length > 0 && editingProductPhotos[index].isPrimary) {
      newPhotos[0].isPrimary = true;
    }
    setEditingProductPhotos(newPhotos);
  };

  const handleSetPrimaryEditPhoto = (index: number) => {
    setEditingProductPhotos(editingProductPhotos.map((photo, i) => ({
      ...photo,
      isPrimary: i === index
    })));
  };

  const addPhotoToGallery = async (imageUrl: string, productName?: string, productCategory?: string) => {
    try {
      // Get max display order from gallery
      const { data: existingPhotos } = await supabase
        .from("gallery_photos")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1);

      const maxOrder = existingPhotos && existingPhotos.length > 0 
        ? existingPhotos[0].display_order 
        : 0;

      // Add to gallery_photos table
      const { error } = await supabase
        .from("gallery_photos")
        .insert({
          image_url: imageUrl,
          title: productName || null,
          description: null,
          category: productCategory || null,
          tags: null,
          display_order: maxOrder + 1,
          is_featured: false,
          created_by: user?.id || null,
        });

      if (error) {
        console.error("Failed to add photo to gallery:", error);
        // Don't throw - gallery addition is optional
      }
    } catch (error) {
      console.error("Error adding photo to gallery:", error);
      // Don't throw - gallery addition is optional
    }
  };

  const uploadProductPhotos = async (productId: string, photos: Array<{ file?: File; url: string; isPrimary?: boolean; fromGallery?: boolean }>, productName?: string, productCategory?: string): Promise<void> => {
    const uploadPromises = photos.map(async (photo, index) => {
      let imageUrl = photo.url;
      let isNewUpload = false;
      
      // If it's a file, upload it
      if (photo.file) {
        const uploadedUrl = await uploadImageFromFile(photo.file);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          isNewUpload = true; // Mark as newly uploaded (not from gallery)
        } else {
          return null;
        }
      }

      // Save to product_photos table
      const { error } = await supabase
        .from("product_photos")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          display_order: index,
          is_primary: photo.isPrimary || false,
        });

      if (error) throw error;

      // If this is a newly uploaded photo (not from gallery), add it to gallery
      if (isNewUpload && !photo.fromGallery) {
        await addPhotoToGallery(imageUrl, productName, productCategory);
      }

      return imageUrl;
    });

    await Promise.all(uploadPromises);
  };

  const uploadImageFromFile = async (file: File): Promise<string | null> => {
    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id || 'anonymous'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: categoryOptions[0]?.name ?? "",
      fabric: "",
      technique: "",
      price: "",
      cost_price: "",
      barcode: "",
      sku: "",
      stock: "",
      low_stock_threshold: "5",
      image_url: "",
      tagline: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setProductPhotos([]);
    setEditingProductPhotos([]);
    setPhotoSelectionMode("upload");
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (imageInputEditRef.current) {
      imageInputEditRef.current.value = '';
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setImageUploading(true);
    try {
      // Generate unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id || 'anonymous'}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Sample CSV Downloaded",
      description: "Fill in the sample CSV and import it to add products",
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setImportErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const validation = validateCSVData(rows);
      
      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Validation Errors Found",
          description: `Found ${validation.errors.length} error(s). Please fix them before importing.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Validated",
          description: `Found ${validation.valid.length} valid product(s) ready to import`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Reading File",
        description: error.message || "Failed to read CSV file",
        variant: "destructive",
      });
      setCsvFile(null);
    }
  };

  const handleImportProducts = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      const validation = validateCSVData(rows);

      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Cannot Import",
          description: "Please fix validation errors before importing",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      if (validation.valid.length === 0) {
        toast({
          title: "No Valid Products",
          description: "No valid products found in the CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Import products one by one
      let successCount = 0;
      let errorCount = 0;

      for (const productData of validation.valid) {
        try {
          const price = parseFloat(productData.price.replace(/[₹,]/g, ''));
          
          // Insert product
          const { data: product, error: productError } = await supabase
            .from("products")
            .insert({
              name: productData.name,
              description: productData.description || null,
              category: productData.category,
              fabric: productData.fabric || null,
              technique: productData.technique || null,
              price,
              cost_price: productData.cost_price ? parseFloat(productData.cost_price.replace(/[₹,]/g, '')) : null,
              sku: productData.sku || null,
              low_stock_threshold: productData.low_stock_threshold ? parseInt(productData.low_stock_threshold) : 5,
              image_url: productData.image_url || null,
              tagline: productData.tagline || null,
              status: "active",
            })
            .select()
            .single();

          if (productError) throw productError;

          // Auto-generate barcode
          const barcodeValue = generateBarcode(product.id);
          await supabase
            .from("products")
            .update({ barcode: barcodeValue })
            .eq("id", product.id);

          // Add inventory if stock is provided
          if (productData.stock) {
            const stockQty = parseInt(productData.stock);
            if (stockQty > 0) {
              await supabase.from("inventory").insert({
                product_id: product.id,
                quantity: stockQty,
              });

              await supabase.from("stock_movements").insert({
                product_id: product.id,
                quantity_change: stockQty,
                movement_type: "purchase",
                reference_type: "purchase",
                notes: "Initial stock from CSV import",
                created_by: user?.id || null,
              });
            }
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error importing product ${productData.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} product(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
      });

      setIsImportModalOpen(false);
      setCsvFile(null);
      setImportErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      fabric: product.fabric || "",
      technique: product.technique || "",
      price: product.price.toString(),
      cost_price: product.cost_price != null ? product.cost_price.toString() : "",
      barcode: product.barcode || "",
      sku: product.sku || "",
      stock: product.inventory?.quantity.toString() || "",
      low_stock_threshold: (product.low_stock_threshold ?? 5).toString(),
      image_url: product.image_url || "",
      tagline: product.tagline || "",
    });
    setImageFile(null);
    setImagePreview(product.image_url || null);
    
    // Load existing product photos
    if (product.product_photos && product.product_photos.length > 0) {
      const sortedPhotos = [...product.product_photos].sort((a, b) => a.display_order - b.display_order);
      setEditingProductPhotos(sortedPhotos.map(photo => ({
        id: photo.id,
        url: photo.image_url,
        isPrimary: photo.is_primary,
      })));
    } else {
      setEditingProductPhotos([]);
    }
    
    setIsEditModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.status !== "archived";
  });

  if (loading) {
    return (
      <AdminLayout title="Products">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Products">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, barcode, or SKU..."
            className="pl-12 h-12 rounded-xl border-primary-200/50 dark:border-primary-800/30 focus-visible:ring-primary"
          />
        </div>
        <motion.select
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
        >
          <option value="All">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </motion.select>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleOpenExport}
            variant="outline"
            className="rounded-full h-12"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            className="rounded-full h-12"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }} 
            className="rounded-full h-12 bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </motion.div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-200/50 dark:border-primary-800/30 bg-gradient-to-r from-primary-50/50 via-transparent to-earth-50/50 dark:from-primary-900/20 dark:to-transparent">
                <th className="text-left text-sm font-semibold text-foreground p-4">Product</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden md:table-cell">Category</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden lg:table-cell">Stock</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Price</th>
                {isAdmin && (
                  <th className="text-left text-sm font-semibold text-foreground p-4 hidden xl:table-cell">
                    Cost Price
                  </th>
                )}
                <th className="text-left text-sm font-semibold text-foreground p-4">Status</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((product, index) => {
                  const stock = product.inventory?.quantity || 0;
                  const isLowStock = stock <= (product.low_stock_threshold || 5);
                  
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ x: 4, backgroundColor: "rgba(var(--primary), 0.05)" }}
                      className="border-b border-primary-200/30 dark:border-primary-800/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-earth-100 dark:from-primary-900/40 dark:to-earth-900/40 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden"
                          >
                            {getProductImageUrl(product) ? (
                              <img
                                src={getProductImageUrl(product)!}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <Leaf className="w-6 h-6 text-primary fallback-icon" style={{ display: getProductImageUrl(product) ? 'none' : 'flex' }} />
                          </motion.div>
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.technique && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {product.technique}
                                </p>
                              )}
                              {product.barcode && (
                                <p className="text-xs text-muted-foreground">• {product.barcode}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 rounded-full text-xs font-semibold text-primary border border-primary/20 dark:border-primary-800/40">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isLowStock ? "text-destructive" : "text-foreground"
                          }`}>
                            {stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">₹{product.price.toLocaleString()}</span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 hidden xl:table-cell">
                          {product.cost_price != null ? (
                            <span className="text-sm font-medium text-foreground">
                              ₹{product.cost_price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            product.status === "active"
                              ? "bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 text-primary border-primary/20 dark:border-primary-800/40"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {product.status}
                        </motion.span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setDetailsProduct(product);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                            title="View details"
                          >
                            <Info className="w-4 h-4" />
                          </motion.button>
                          {product.barcode && (
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingProduct(product);
                                handleViewBarcode(product.barcode || generateBarcode(product.id), product.name, product.sku ?? undefined);
                              }}
                              className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                              title="View/Print barcode"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(product)}
                            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No products found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) {
          resetForm();
        } else {
          setPhotoSelectionMode("upload");
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Add New Product
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Create a new product for your store
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fabric</Label>
                <select
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select fabric</option>
                  {fabricOptions.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Technique</Label>
                <select
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select technique</option>
                  {techniqueOptions.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short tagline"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Auto-generated if left empty"
                    className="rounded-xl h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="rounded-xl h-12"
                    title="Scan barcode"
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                  {formData.barcode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleViewBarcode(formData.barcode, formData.name, formData.sku)}
                      className="rounded-xl h-12"
                      title="View/Print barcode"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate a scannable barcode
                </p>
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Stock keeping unit"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  placeholder="5"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label>Product Photos</Label>
              <div className="space-y-3">
                {productPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {productPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary-200 dark:border-primary-800">
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {photo.isPrimary && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                          {photo.fromGallery && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              Gallery
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetPrimaryPhoto(index)}
                              disabled={photo.isPrimary}
                            >
                              Set Primary
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemovePhoto(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={photoSelectionMode === "gallery" ? "default" : "outline"}
                    onClick={() => setPhotoSelectionMode("gallery")}
                    className="flex-1"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select from Gallery
                  </Button>
                  <Button
                    type="button"
                    variant={photoSelectionMode === "upload" ? "default" : "outline"}
                    onClick={() => setPhotoSelectionMode("upload")}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New
                  </Button>
                </div>
                {photoSelectionMode === "gallery" && (
                  <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openGalleryModal(false)}
                        className="w-full"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse Gallery Photos
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Select photos from your gallery to add to this product
                      </p>
                    </div>
                  </div>
                )}
                {photoSelectionMode === "upload" && (
                  <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <Label htmlFor="product-photos" className="cursor-pointer">
                        <span className="text-primary font-semibold hover:underline">
                          Click to add photos
                        </span>
                        <input
                          ref={imageInputRef}
                          id="product-photos"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              Array.from(files).forEach((file) => {
                                handleAddPhoto(file);
                              });
                              if (imageInputRef.current) {
                                imageInputRef.current.value = '';
                              }
                            }
                          }}
                          className="hidden"
                          multiple
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP up to 50MB each. You can add multiple photos.
                      </p>
                    </div>
                  </div>
                )}
                {imageUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading photos...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleAddProduct}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setEditingProduct(null);
          resetForm();
        } else {
          setPhotoSelectionMode("upload");
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fabric</Label>
                <select
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select fabric</option>
                  {fabricOptions.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Technique</Label>
                <select
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select technique</option>
                  {techniqueOptions.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short tagline"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Update Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Current stock"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Auto-generated if left empty"
                    className="rounded-xl h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="rounded-xl h-12"
                    title="Scan barcode"
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                  {formData.barcode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleViewBarcode(formData.barcode, formData.name, formData.sku)}
                      className="rounded-xl h-12"
                      title="View/Print barcode"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate a scannable barcode
                </p>
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Stock keeping unit"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  placeholder="5"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label>Product Photos</Label>
              <div className="space-y-3">
                {editingProductPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {editingProductPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary-200 dark:border-primary-800">
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {photo.isPrimary && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                          {photo.fromGallery && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              Gallery
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetPrimaryEditPhoto(index)}
                              disabled={photo.isPrimary}
                            >
                              Set Primary
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveEditPhoto(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={photoSelectionMode === "gallery" ? "default" : "outline"}
                    onClick={() => setPhotoSelectionMode("gallery")}
                    className="flex-1"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select from Gallery
                  </Button>
                  <Button
                    type="button"
                    variant={photoSelectionMode === "upload" ? "default" : "outline"}
                    onClick={() => setPhotoSelectionMode("upload")}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New
                  </Button>
                </div>
                {photoSelectionMode === "gallery" && (
                  <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openGalleryModal(true)}
                        className="w-full"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Browse Gallery Photos
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Select photos from your gallery to add to this product
                      </p>
                    </div>
                  </div>
                )}
                {photoSelectionMode === "upload" && (
                  <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <Label htmlFor="product-photos-edit" className="cursor-pointer">
                        <span className="text-primary font-semibold hover:underline">
                          Click to add photos
                        </span>
                        <input
                          ref={imageInputEditRef}
                          id="product-photos-edit"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              Array.from(files).forEach((file) => {
                                handleAddEditPhoto(file);
                              });
                              if (imageInputEditRef.current) {
                                imageInputEditRef.current.value = '';
                              }
                            }
                          }}
                          className="hidden"
                          multiple
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP up to 50MB each. You can add multiple photos.
                      </p>
                    </div>
                  </div>
                )}
                {imageUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading photos...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
              setIsEditModalOpen(false);
              setEditingProduct(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleUpdateProduct}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Export Barcode Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              Export Barcode
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Print a branded barcode label (Bright Buttons + product name)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <select
                value={exportProductId}
                onChange={(e) => {
                  const id = e.target.value;
                  setExportProductId(id);
                  const p = filteredProducts.find((fp) => fp.id === id) || products.find((pp) => pp.id === id);
                  if (!p) {
                    setBarcodeImageUrl(null);
                    setCurrentBarcodeValue("");
                    setBarcodeProductName("");
                    setBarcodeSku("");
                    return;
                  }
                  const value = p.barcode || generateBarcode(p.id);
                  setBarcodeImageUrl(generateBarcodeImage(value));
                  setCurrentBarcodeValue(value);
                  setBarcodeProductName(p.name);
                  setBarcodeSku(p.sku || "");
                }}
                className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="" disabled>
                  {filteredProducts.length ? "Choose a product..." : "No products available"}
                </option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {filteredProducts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tip: use the search box / category filter first, then export from the filtered list.
                </p>
              )}
            </div>

            {barcodeImageUrl && (
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl border border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-3 mb-4">
                  <img src={logoImage} alt="Bright Buttons" className="h-10 w-10 rounded-lg object-contain" />
                  <div className="font-semibold text-foreground">Bright Buttons</div>
                </div>
                <img src={barcodeImageUrl} alt={`Barcode ${currentBarcodeValue}`} className="max-w-full h-auto" />
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">{currentBarcodeValue}</p>
                  {barcodeProductName && (
                    <p className="text-sm text-muted-foreground mt-1">{barcodeProductName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border/50 p-3 bg-muted/30">
              <Label className="text-xs font-medium text-muted-foreground">Thermal label size</Label>
              <select
                value={stickerSize}
                onChange={(e) => setStickerSize(e.target.value as StickerSize)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="50x30">50mm × 30mm</option>
                <option value="60x40">60mm × 40mm</option>
                <option value="100x50">100mm × 50mm</option>
              </select>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={showProductNameOnLabel}
                    onCheckedChange={(v) => setShowProductNameOnLabel(!!v)}
                  />
                  Include product name
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={showSkuOnLabel}
                    onCheckedChange={(v) => setShowSkuOnLabel(!!v)}
                  />
                  Include SKU
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setIsExportModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
                onClick={handlePrintBarcode}
                disabled={!barcodeImageUrl || !currentBarcodeValue}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Preview/Print Modal */}
      <Dialog open={isBarcodeModalOpen} onOpenChange={setIsBarcodeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Barcode
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              {barcodeProductName ? `Barcode for ${barcodeProductName}` : "Product barcode"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {barcodeImageUrl && (
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl border border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-3 mb-4">
                  <img src={logoImage} alt="Bright Buttons" className="h-10 w-10 rounded-lg object-contain" />
                  <div className="font-semibold text-foreground">Bright Buttons</div>
                </div>
                <img
                  src={barcodeImageUrl}
                  alt={`Barcode ${currentBarcodeValue}`}
                  className="max-w-full h-auto"
                />
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">{currentBarcodeValue}</p>
                  {barcodeProductName && (
                    <p className="text-sm text-muted-foreground mt-1">{barcodeProductName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border/50 p-3 bg-muted/30">
              <Label className="text-xs font-medium text-muted-foreground">Thermal label size</Label>
              <select
                value={stickerSize}
                onChange={(e) => setStickerSize(e.target.value as StickerSize)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="50x30">50mm × 30mm</option>
                <option value="60x40">60mm × 40mm</option>
                <option value="100x50">100mm × 50mm</option>
              </select>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={showProductNameOnLabel}
                    onCheckedChange={(v) => setShowProductNameOnLabel(!!v)}
                  />
                  Include product name
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={showSkuOnLabel}
                    onCheckedChange={(v) => setShowSkuOnLabel(!!v)}
                  />
                  Include SKU
                </label>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setIsBarcodeModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
                onClick={handlePrintBarcode}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Products Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              Import Products from CSV
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Upload a CSV file to import multiple products at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadSampleCSV}
                variant="outline"
                className="rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
              <p className="text-sm text-muted-foreground">
                Download the sample file to see the required format
              </p>
            </div>

            <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
                <div className="text-center">
                  <Label htmlFor="csv-file" className="cursor-pointer">
                    <span className="text-primary font-semibold hover:underline">
                      Click to select CSV file
                    </span>
                    <input
                      ref={fileInputRef}
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    or drag and drop
                  </p>
                </div>
                {csvFile && (
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{csvFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                        setImportErrors([]);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="border border-destructive/50 rounded-xl p-4 bg-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <h4 className="font-semibold text-destructive">
                    Validation Errors ({importErrors.length})
                  </h4>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {importErrors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      <span className="font-medium">Row {error.row}</span>: {error.field} - {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="font-semibold mb-2">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>name</strong> - Product name (required)</li>
                <li><strong>category</strong> - Product category (required)</li>
                <li><strong>price</strong> - Product price in ₹ (required)</li>
                <li><strong>description</strong> - Product description (optional)</li>
                <li><strong>fabric</strong> - Fabric type (optional)</li>
                <li><strong>technique</strong> - Printing technique (optional)</li>
                <li><strong>tagline</strong> - Product tagline (optional)</li>
                <li><strong>cost_price</strong> - Cost price in ₹ (optional)</li>
                <li><strong>stock</strong> - Initial stock quantity (optional)</li>
                <li><strong>sku</strong> - Stock keeping unit (optional)</li>
                <li><strong>low_stock_threshold</strong> - Low stock alert threshold (optional, default: 5)</li>
                <li><strong>image_url</strong> - Product image URL (optional)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Barcodes will be automatically generated for all imported products.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl" 
              onClick={() => {
                setIsImportModalOpen(false);
                setCsvFile(null);
                setImportErrors([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleImportProducts}
              disabled={!csvFile || isImporting || importErrors.length > 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Photo Selection Modal */}
      <Dialog open={isGalleryModalOpen} onOpenChange={setIsGalleryModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-primary" />
              Select Photos from Gallery
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Choose photos from your gallery to add to this product
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {galleryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : galleryPhotos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No photos in gallery</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {galleryPhotos.map((photo) => {
                  const isSelected = isForEdit
                    ? editingProductPhotos.some(p => p.url === photo.image_url)
                    : productPhotos.some(p => p.url === photo.image_url);
                  
                  return (
                    <div
                      key={photo.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary"
                      }`}
                      onClick={() => {
                        if (!isSelected) {
                          handleSelectGalleryPhoto(photo);
                        }
                      }}
                    >
                      <div className="aspect-square">
                        <img
                          src={photo.image_url}
                          alt={photo.title || "Gallery photo"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <X className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      {photo.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                          {photo.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsGalleryModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog
        open={isDetailsModalOpen}
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) {
            setDetailsProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" />
              Product Details
            </DialogTitle>
            {detailsProduct && (
              <DialogDescription className="text-muted-foreground pt-2">
                Full details for <span className="font-semibold text-foreground">{detailsProduct.name}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {detailsProduct && (
            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-earth-100 dark:from-primary-900/40 dark:to-earth-900/40 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                  {getProductImageUrl(detailsProduct) ? (
                    <img
                      src={getProductImageUrl(detailsProduct)!}
                      alt={detailsProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Leaf className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-lg text-foreground">{detailsProduct.name}</p>
                  {detailsProduct.tagline && (
                    <p className="text-sm text-muted-foreground">{detailsProduct.tagline}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 rounded-full text-xs font-semibold text-primary border border-primary/20 dark:border-primary-800/40">
                      {detailsProduct.category}
                    </span>
                    {detailsProduct.fabric && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {detailsProduct.fabric}
                      </span>
                    )}
                    {detailsProduct.technique && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {detailsProduct.technique}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {detailsProduct.description?.trim() || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Price (MRP)</p>
                  <p className="font-semibold text-foreground">
                    ₹{detailsProduct.price.toLocaleString()}
                  </p>
                </div>
                {isAdmin && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Cost Price</p>
                    <p className="font-semibold text-foreground">
                      {detailsProduct.cost_price != null ? `₹${detailsProduct.cost_price.toLocaleString()}` : "—"}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.category}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Fabric</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.fabric || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Technique</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.technique || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Tagline</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.tagline || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Stock</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.inventory?.quantity ?? 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Low Stock Threshold</p>
                  <p className="font-medium text-foreground">
                    {detailsProduct.low_stock_threshold ?? 5}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Barcode</p>
                  <p className="font-mono text-xs text-foreground break-all">
                    {detailsProduct.barcode || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">SKU</p>
                  <p className="font-mono text-xs text-foreground break-all">
                    {detailsProduct.sku || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                    detailsProduct.status === "active"
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 text-primary border-primary/20 dark:border-primary-800/40"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {detailsProduct.status}
                  </span>
                </div>
              </div>

              {detailsProduct.product_photos && detailsProduct.product_photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Photos</p>
                  <div className="flex flex-wrap gap-2">
                    {detailsProduct.product_photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-primary-200 dark:border-primary-800"
                      >
                        <img
                          src={photo.image_url}
                          alt={detailsProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                setIsDetailsModalOpen(false);
                setDetailsProduct(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Products;
