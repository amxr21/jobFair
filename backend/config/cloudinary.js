const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'jobfair-cvs',
        allowed_formats: ['pdf', 'doc', 'docx'],
        resource_type: 'raw', // For non-image files like PDFs
        public_id: (req, file) => {
            // Create unique filename: uniId_timestamp_originalname
            // Trim whitespace and remove any special characters that Cloudinary doesn't allow
            const uniId = (req.body.uniId || 'unknown').trim().replace(/\s+/g, '_');
            const timestamp = Date.now();
            const originalName = file.originalname.replace(/\.[^/.]+$/, '').trim().replace(/\s+/g, '_');
            return `${uniId}_${timestamp}_${originalName}`;
        }
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 4 * 1024 * 1024 // 4MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept PDFs, DOC, and DOCX files
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
        }
    }
});

// Separate uploader for banner/branding artwork (Event Settings > Banners &
// Branding) — images/PDFs, its own folder, distinct from the CV uploader
// above (different allowed formats, no uniId in the filename since artwork
// belongs to a booth/company, not an applicant).
const artworkStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'jobfair-banner-artwork',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'ai', 'eps'],
        resource_type: 'auto',
        public_id: (req, file) => {
            const label = (req.body.bannerId || 'banner').toString().trim().replace(/\s+/g, '_');
            const timestamp = Date.now();
            const originalName = file.originalname.replace(/\.[^/.]+$/, '').trim().replace(/\s+/g, '_');
            return `${label}_${timestamp}_${originalName}`;
        }
    }
});

const uploadArtwork = multer({
    storage: artworkStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB — print artwork files run larger than a CV
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/postscript', // .ai/.eps
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, PDF, AI, or EPS files are allowed'), false);
        }
    }
});

module.exports = { cloudinary, upload, uploadArtwork };
