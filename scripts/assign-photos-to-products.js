// Script to randomly assign photos from D:\Bb to products
// Run with: node scripts/assign-photos-to-products.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

loadEnvFile();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const photosPath = 'D:\\Bb';

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables');
  console.error('You can create a .env file in the root directory with these values');
  console.error('Or set them as environment variables before running the script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get all image files from directory recursively
function getImageFiles(dirPath) {
  const files = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory does not exist: ${dirPath}`);
      return files;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      try {
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
      } catch (err) {
        console.warn(`Error accessing ${fullPath}:`, err.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return files;
}

// Upload image to Supabase storage
async function uploadImage(filePath, userId = 'system') {
  try {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).slice(1);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${userId}/products/${uniqueFileName}`;
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const contentType = contentTypeMap[fileExt.toLowerCase()] || 'image/jpeg';
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (uploadError) {
      console.error(`Error uploading ${fileName}:`, uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

// Main function
async function assignPhotosToProducts() {
  console.log('Starting photo assignment process...');
  console.log(`Photos directory: ${photosPath}\n`);
  
  // Get all image files
  console.log(`Reading photos from ${photosPath}...`);
  const imageFiles = getImageFiles(photosPath);
  console.log(`Found ${imageFiles.length} image files\n`);
  
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
    console.error('Error fetching products:', productsError.message);
    return;
  }
  
  if (!products || products.length === 0) {
    console.error('No products found!');
    return;
  }
  
  console.log(`Found ${products.length} products\n`);
  
  // Shuffle images
  const shuffledImages = [...imageFiles].sort(() => Math.random() - 0.5);
  
  // Assign photos to products randomly
  let imageIndex = 0;
  let successCount = 0;
  let errorCount = 0;
  
  console.log('Assigning photos to products...\n');
  
  for (const product of products) {
    // Each product gets 1-5 random photos
    const numPhotos = Math.floor(Math.random() * 5) + 1;
    const productPhotos = [];
    
    for (let i = 0; i < numPhotos && imageIndex < shuffledImages.length; i++) {
      const imagePath = shuffledImages[imageIndex];
      const fileName = path.basename(imagePath);
      process.stdout.write(`Uploading ${fileName} for "${product.name}"... `);
      
      const imageUrl = await uploadImage(imagePath);
      
      if (imageUrl) {
        productPhotos.push({
          image_url: imageUrl,
          display_order: i,
          is_primary: i === 0, // First photo is primary
        });
        process.stdout.write('✓\n');
      } else {
        process.stdout.write('✗\n');
        errorCount++;
      }
      
      imageIndex++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
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
        console.error(`Error inserting photos for "${product.name}":`, insertError.message);
        errorCount += productPhotos.length;
      } else {
        successCount += productPhotos.length;
        console.log(`  → Added ${productPhotos.length} photo(s) to "${product.name}"`);
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total photos processed: ${imageIndex}`);
  console.log(`Successfully assigned: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('\nPhoto assignment complete!');
}

// Run the script
assignPhotosToProducts().catch(console.error);

