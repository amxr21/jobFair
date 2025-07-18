require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");


const { ObjectId } = mongoose.Types;

const requireAuth = require("../middlewares/requireAuth")


const {getAllApplicants, getApplicant, addApplicant, testFunc, updateApplicant, addApplicantPublic, emailRequest, apply, getCompanies, getCompany, confirmAttendant, flagApplicant, getApplicantFlag, shortlistApplicant, rejectApplicant, submitSurvey} = require("../controllers/applicantsControllers")

const router = express.Router();

const uri = process.env.URI;

mongoose.connect(uri);
const connection = mongoose.connection;


let gfs;
connection.once("open", ()=>{
    console.log("DB connected successfully");
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection("applicants_details")
})

const storage = new GridFsStorage({
    url: uri,
    file: (req, file) => {
        return {
            filename: file.originalname,
            bucketName: "applicants_details"
        }
    }
})

const upload = multer({ storage });



const downloadCV = async (req, res) => {
    try {
      const id = await req.params.id;
  
      // ✅ Validate ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid file ID format' });
      }
  
      const fileId = new ObjectId(id);
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'applicants_details',
      });
  
      const file = await db.collection('applicants_details.files').findOne({ _id: fileId });
  
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
  
      res.set('Content-Type', file.contentType);
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
  
      const downloadStream = bucket.openDownloadStream(file._id);
  
      downloadStream.on('error', (err) => {
        console.error('Stream error:', err);
        return res.status(500).json({ message: 'Error streaming file' });
      });
  
      downloadStream.pipe(res);
  
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };





// const downloadCV = async (req, res) => {
//     try {
        
//         gfs.files.findOne(
//             { _id: req.params.id },
//             (err, file) => {
//             if (!file || file.length == 0) {
//                 return res.status(404).json({
//                     err: 'No file exists'
//                 });
//             }
            
//             console.log(req.params.id);
//             const readstream = gfs.createReadStream(file.filename);
//             res.set('Content-Type', file.contentType);
//             res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    
//             readstream.pipe(res);
//             // res.json({message: "CV downloaded:" + req.params.id})
//         })


//     } catch (error) {
//         console.error('Error fetching CV:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }

// }


// route to get the company
router.get("/companies", getCompanies);

// route to get the company details from its id
router.get("/companies/:id", getCompany);



router.get("/cv/:id", downloadCV);

router.patch("/applicant/apply/:id", apply);





router.post("/email", emailRequest);

router.post("/applicants",upload.single("cvfile") , addApplicantPublic);

router.use(requireAuth);

router.get("/", testFunc);

router.get("/applicants/:id", getApplicant);

router.get("/applicants", getAllApplicants);

router.patch("/applicants/:id", updateApplicant);
router.patch("/applicants/flag/:id", flagApplicant);
router.get("/applicants/flag/:id", getApplicantFlag);

router.patch("/applicants/shortlist/:id", shortlistApplicant);
router.patch("/applicants/reject/:id", rejectApplicant);

router.patch("/applicants/confirm/:id", confirmAttendant);

router.patch("/applicants/survey/:id", submitSurvey)


router.post("/applicants",upload.single("cvfile") , addApplicant)

router.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;

    gfs.files.findOne({ filename: filename }, (err, file) => {
        if (err || !file) {
            return res.status(404).json({ error: "File does not exist" });
        }

        res.set("Content-Type", file.contentType);
        res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
        
        const readstream = gfs.createReadStream({ filename: file.filename });
        readstream.on('error', (error) => {
            res.status(500).json({ error: "Error reading file" });
        });

        readstream.pipe(res);
    });
});







// an applicant will open a simple page that ask him for his id
// once he gets in he will have to open a QR code scanner
// + the applicant will be able to see the companies he/she applied for
// the scanner will identify the company by reading the id stored in the Qr code
// once he scanned it, a success message will show up and the applicant will be stored in the company dashboard

// We need a page, a new router
// the success will result in adding the applicant name to the list of companies he applied for

module.exports = router;