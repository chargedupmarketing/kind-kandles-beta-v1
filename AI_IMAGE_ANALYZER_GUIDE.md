# AI Product Image Analyzer - User Guide

## Overview

The AI Product Image Analyzer is a powerful tool that uses Claude's vision AI to automatically identify products from uploaded images and match them to your existing catalog. It reads text on labels, analyzes visual features, and provides intelligent product matching with confidence scores.

## Setup Instructions

### 1. Add Anthropic API Key

Before using the tool, you need to add your Anthropic API key to the environment variables:

1. Go to [console.anthropic.com](https://console.anthropic.com/) and sign up/login
2. Navigate to API Keys and create a new key
3. Open your `.env.local` file in the project root
4. Add the following line:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
5. Restart your development server for the changes to take effect

### 2. Access the Tool

1. Log into the admin panel at `/restricted`
2. Navigate to **Developer Tools** in the sidebar
3. Click on **AI Image Analyzer** (marked with an "AI" badge)

## How to Use

### Step 1: Upload Images

1. **Drag and Drop**: Drag product images directly onto the upload zone
2. **Browse Files**: Click "Select Images" to browse your computer
3. **Supported Formats**: PNG, JPG, JPEG, WebP
4. **Limits**: 
   - Maximum 10 images per batch
   - Maximum 10MB per image

### Step 2: Analyze with AI

1. Once images are selected, click **"Analyze with AI"**
2. The system will:
   - Upload images to Claude's vision API
   - Extract product information (name, scent, type, colors, container)
   - Match against your product database
   - Calculate confidence scores for each match

### Step 3: Review Results

For each analyzed image, you'll see:

#### Extracted Information
- Product name (as it appears on the label)
- Scent name (e.g., "Calm Down Girl", "Lavender")
- Product type (Candle, Body Butter, Body Oil, etc.)
- Visual features (colors, container type, size)

#### Match Results

**High Confidence (>90%)**
- Shows a green card with the matched product
- Displays "Confirm & Add to Product" button
- Recommended for auto-assignment

**Medium Confidence (50-90%)**
- Shows up to 3 potential matches
- Each with confidence percentage and match reasons
- Choose the correct product manually

**Low Confidence (<50%)**
- No strong matches found
- Options to:
  - Create a new product (coming soon)
  - Search all products manually

### Step 4: Assign Images

**Single Image Assignment**
1. Review the match and confidence score
2. Click "Confirm & Add to Product" or "Add to This Product"
3. Image is added to the product's gallery

**Bulk Assignment**
1. Click "Confirm All High Confidence" at the top
2. All images with >90% confidence are automatically assigned
3. Review remaining images individually

### Step 5: Navigate Results

- Use **Previous/Next** buttons to review each image
- See progress: "Image X of Y"
- Assigned images show a green checkmark

## Matching Algorithm

The AI uses a sophisticated scoring system (0-100 points):

| Match Type | Points | Description |
|------------|--------|-------------|
| Exact product name | 50 | Perfect match of product title |
| Fuzzy name match (>80%) | 35 | Very similar product name |
| Scent in tags | 20 | Scent name found in product tags |
| Product type match | 15 | Same product category |
| Visual features | 10 | Colors and container match |
| Description keywords | 5 | Keywords found in description |

**Auto-Assignment Threshold**: 90+ points

## Best Practices

### For Best Results

1. **Clear Images**: Use high-quality, well-lit photos
2. **Visible Labels**: Ensure product names and scents are readable
3. **Single Product**: One product per image works best
4. **Front View**: Capture the label/text clearly

### Common Use Cases

**Bulk Product Photo Import**
- Upload 10 images at a time
- Use "Confirm All High Confidence" for quick processing
- Manually review any uncertain matches

**New Product Photography**
- Take photos of new products
- Let AI identify and assign them
- Verify matches before confirming

**Product Catalog Organization**
- Upload existing product photos
- AI matches them to database entries
- Quickly populate product galleries

## Troubleshooting

### "Anthropic API Key Required" Error
- Add `ANTHROPIC_API_KEY` to `.env.local`
- Restart your development server
- Refresh the admin panel

### "No Products in Database" Error
- Import products first using Product Management
- Ensure products have titles and descriptions
- Try again after products are added

### Low Confidence Matches
- Check if product exists in database
- Verify product name matches label text
- Ensure product tags include scent names
- Consider adding more product metadata

### Image Upload Fails
- Check file size (must be under 10MB)
- Verify file format (PNG, JPG, WebP only)
- Try compressing large images
- Ensure stable internet connection

## Technical Details

### API Endpoints

- **Analysis**: `POST /api/admin/ai/analyze-product-image`
- **Assignment**: `POST /api/admin/products/[id]/images`

### Database Tables

- `products`: Product catalog
- `product_images`: Product image gallery
- Images are linked via `product_id` foreign key

### Rate Limiting

- Processes 3 images concurrently
- Prevents API rate limit issues
- Larger batches are queued automatically

## Future Enhancements

Planned features for future releases:

- [ ] Background processing for large batches
- [ ] Image quality assessment
- [ ] Duplicate image detection
- [ ] Bulk product creation from unmatched images
- [ ] Learning system that improves over time
- [ ] Integration with product creation workflow

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in the UI
3. Check browser console for detailed errors
4. Contact development team with screenshots

## Security Notes

- API key is stored server-side only
- Never exposed to client browser
- Admin authentication required
- All uploads are validated for type and size
- Images are processed in memory (not stored permanently unless assigned)

---

**Version**: 1.0.0  
**Last Updated**: January 26, 2026  
**Powered by**: Claude Sonnet 4 Vision API
