import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const photosPath = 'D:\\Bb';

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get all image files from directory
function getImageFiles(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        files.push(...getImageFiles(fullPath));
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

// Upload image to Supabase storage
async function uploadImage(filePath: string, userId: string = 'system'): Promise<string | null> {
  try {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const storagePath = `${userId}/products/${uniqueFileName}`;
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer]);
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, fileBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${fileExt.slice(1)}`
      });

    if (uploadError) {
      console.error(`Error uploading ${fileName}:`, uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// Main function
async function assignPhotosToProducts() {
  console.log('Starting photo assignment process...');
  
  // Get all image files
  console.log(`Reading photos from ${photosPath}...`);
  const imageFiles = getImageFiles(photosPath);
  console.log(`Found ${imageFiles.length} image files`);
  
  if (imageFiles.length === 0) {
    console.error('No image files found!');
    return;
  }
  
  // Get all products
  console.log('Fetching products from database...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .eq('status', 'active');
  
  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }
  
  if (!products || products.length === 0) {
    console.error('No products found!');
    return;
  }
  
  console.log(`Found ${products.length} products`);
  
  // Shuffle images
  const shuffledImages = [...imageFiles].sort(() => Math.random() - 0.5);
  
  // Assign photos to products randomly
  let imageIndex = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    // Each product gets 1-5 random photos
    const numPhotos = Math.floor(Math.random() * 5) + 1;
    const productPhotos: Array<{ image_url: string; display_order: number; is_primary: boolean }> = [];
    
    for (let i = 0; i < numPhotos && imageIndex < shuffledImages.length; i++) {
      const imagePath = shuffledImages[imageIndex];
      console.log(`Uploading ${path.basename(imagePath)} for product ${product.name}...`);
      
      const imageUrl = await uploadImage(imagePath);
      
      if (imageUrl) {
        productPhotos.push({
          image_url: imageUrl,
          display_order: i,
          is_primary: i === 0, // First photo is primary
        });
      } else {
        errorCount++;
      }
      
      imageIndex++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Insert photos into database
    if (productPhotos.length > 0) {
      const { error: insertError } = await supabase
        .from('product_photos')
        .insert(
          productPhotos.map(photo => ({
            product_id: product.id,
            ...photo
          }))
        );
      
      if (insertError) {
        console.error(`Error inserting photos for product ${product.name}:`, insertError);
        errorCount += productPhotos.length;
      } else {
        successCount += productPhotos.length;
        console.log(`✓ Added ${productPhotos.length} photo(s) to ${product.name}`);
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total photos processed: ${imageIndex}`);
  console.log(`Successfully assigned: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('Photo assignment complete!');
}

// Run the script
assignPhotosToProducts().catch(console.error);

