# CV Download Setup

### How to Add Your Actual CV Files

To replace the placeholder PDF files with your actual CVs:

1. **Place your CV files in the `public/cv/` directory:**
   - `cv-en.pdf` - Your English CV
   - `cv-fr.pdf` - Your French CV

2. **File naming convention:**
   - English CV: `public/cv/cv-en.pdf`
   - French CV: `public/cv/cv-fr.pdf`

3. **File size optimization (recommended):**
   - Compress your PDFs to reduce file size
   - Use online tools like SmallPDF or Adobe Acrobat
   - Aim for files under 2MB for better performance

## Performance Featuresg g eaaaa gg               aerae    . aera

✅ **Lazy Loading**: PDFs are only downloaded when users click the download button
✅ **No Impact on Initial Load**: PDFs are not loaded with the page
✅ **Optimized File Serving**: Files are served from the public directory
✅ **Fallback Handling**: If download fails, opens PDF in new tab
✅ **Analytics Ready**: Includes Google Analytics tracking (if configured)

## How It Works

1. PDFs are stored in `public/cv/` directory
2. Download buttons trigger the `usePDFDownload` hook
3.  Files are downloaded   directly without affecting.  page performance
4. Users get properly named files (e.g., "Toumi-Reda-CV-English.pdf")

## Settings Menu Integration  faef
 <!-- foaejfae f -->
The CV download is now integrated into the settings menu (bottom-right corner):

- **Settings Button**: Click to open the settings menu
- **Download Button**: Downloads CV in the current language (EN/FR)
- **Theme Button**: Toggle between dark/light mode
- **Language Button**: Switch between English and French

### Settings Menu Order (from bottom to top):
1. **Download CV** (bottom-16) - Downloads CV in current language
2. **Theme Toggle** (bottom-28) - Dark/Light mode
3. **Language Switch** (bottom-40) - EN/FR toggle

## Testing

To test the functionality:
1. Start your development server
2. Navigate to any page
3. Click the settings button (bottom-right corner)
4. Click the download button (first button from bottom)
5. Verify the PDF downloads correctly in the current language

### Testing Both Languages:
1. Switch language using the language button
2. Click download again to test the other language version

## Customization

You can modify the download behavior in `src/hooks/use-pdf-download.ts`:
- Change file naming convention
- Add additional analytics tracking
- Modify error handling
- Add loading states if needed
