# Google Analytics Setup Guide

## Quick Setup

1. **Get Your Google Analytics Measurement ID**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create or select your property
   - Copy your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure Analytics**
   - Open `analytics.config.js`
   - Replace `'GA_MEASUREMENT_ID'` with your actual Measurement ID
   - Save the file

3. **Deploy**
   - Upload all files to your hosting service
   - Analytics will start tracking immediately

## What Gets Tracked

### User Interactions
- **File Upload**: When users add PDF files
- **Merge Started**: When PDF merge operation begins
- **Download**: When users download the merged PDF
- **Milestones**: Key user flow completion points

### Performance Metrics
- **Processing Time**: How long merges take
- **File Count**: Number of files being merged
- **File Sizes**: Size of files being processed (in MB)

### Error Tracking
- **Merge Errors**: When PDF processing fails
- **User Errors**: When validation or user actions fail

## Configuration Options

Edit `analytics.config.js` to customize:

```javascript
window.ANALYTICS_CONFIG = {
    // Your Google Analytics Measurement ID
    measurementId: 'G-XXXXXXXXXX',
    
    // Enable/disable tracking
    enabled: true,
    
    // Custom event categories
    eventCategories: {
        userInteraction: 'User Interaction',
        pdfProcessing: 'PDF Processing',
        applicationError: 'Application Error',
        userFlow: 'User Flow'
    }
};
```

## Privacy Considerations

This implementation:
- ✅ Only tracks user interactions and performance metrics
- ✅ Does NOT track file contents or names (except download filename)
- ✅ Respects the application's privacy-first approach
- ✅ Can be completely disabled by setting `enabled: false`

## Advanced Setup

### Custom Dimensions
Set up custom dimensions in Google Analytics to track:
- Application Type (pdf_merger_app)
- File Count per session
- Average file size

### Goals and Conversions
Recommended goals to set up:
- **Completion Rate**: Users who successfully download merged PDF
- **Error Rate**: Sessions with processing errors
- **Engagement**: Users who merge multiple file sets

### Debug Mode
Analytics events are logged to browser console for debugging when measurement ID is configured.

## Troubleshooting

### Analytics Not Working
1. Check browser console for errors
2. Verify measurement ID format (`G-XXXXXXXXXX`)
3. Confirm `enabled: true` in config
4. Check if ad blockers are interfering

### Testing Analytics
1. Open browser developer tools
2. Go to Console tab
3. Look for "Analytics Event:" messages
4. Check Google Analytics Real-Time reports

## Example Measurement ID Replacement

**Before (template):**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

**After (configured):**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-1234567890"></script>
```

Make sure to replace **both** occurrences in the HTML file.