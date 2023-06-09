const Bootcamp = require("./modelbootcamp");
const asyncHandler = require('../middleware/async');
const ErrorResponse = require("../utils/errorResponse")
const path = require('path'); 
const slugify = require("slugify");



exports.getBootcamps = asyncHandler(async(req,res,next)=>{  
res.status(200).json(res.advancedResults);
}) 


exports.getBootcamp = asyncHandler(async(req,res,next)=>{
   const bootcamp = await Bootcamp.findById(req.params.id);

   if(!bootcamp){
      return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
    }
   res.status(200).json({ success:true, data: bootcamp });
}); 


exports.createBootcamp = asyncHandler(async (req, res, next) => {
   // Add user to req,body
   req.body.user = req.user.id;
 
   // Check for published bootcamp
   const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
 
   // If the user is not an admin, they can only add one bootcamp
   if (publishedBootcamp && req.user.role !== 'admin') {
     return next(
       new ErrorResponse(
         `The user with ID ${req.user.id} has already published a bootcamp`,
         400
       )
     );
   }
 
   const bootcamp = await Bootcamp.create(req.body);
 
   res.status(201).json({
     success: true,
     data: bootcamp
   });
 });


 exports.updateBootcamp = asyncHandler(async (req, res, next) => {
   let bootcamp = await Bootcamp.findById(req.params.id);
 
   if (!bootcamp) {
     return next(
       new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
     );
   }
 
   // Make sure user is bootcamp owner
   if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
     return next(
       new ErrorResponse(
         `User ${req.user.id} is not authorized to update this bootcamp`,
         401
       )
     );
   }
   
   // update slug while updating name
   if (Object.keys(req.body).includes("name")) {
     req.body.slug = slugify(req.body.name, { lower: true });
   }
 
   bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
     new: true,
     runValidators: true
   });
 
   res.status(200).json({ success: true, data: bootcamp });
 }); 


 exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
   const bootcamp = await Bootcamp.findById(req.params.id);
 
   if (!bootcamp) {
     return next(
       new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
     );
   }
 
   // Make sure user is bootcamp owner
   if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
     return next(
       new ErrorResponse(
         `User ${req.user.id} is not authorized to delete this bootcamp`,
         401
       )
     );
   }
 
   await bootcamp.remove();
 
   res.status(200).json({ success: true, data: {} });
 });


 exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
   const bootcamp = await Bootcamp.findById(req.params.id);
 
   if (!bootcamp) {
     return next(
       new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
     );
   }
 
 // Make sure user is bootcamp owner
 if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
  return next(
    new ErrorResponse(
      `User ${req.user.id} is not authorized to update this bootcamp`,
      401
    )
  );
}
 
   if (!req.files) {
     return next(new ErrorResponse(`Please upload a file`, 400));
   }
 
   const file = req.files.file;
 
   // Make sure the image is a photo
   if (!file.mimetype.startsWith('image')) {
     return next(new ErrorResponse(`Please upload an image file`, 400));
   }
 
   // Check filesize
   if (file.size > process.env.MAX_FILE_UPLOAD) {
     return next(
       new ErrorResponse(
         `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
         400
       )
     );
   }
 
   // Create custom filename
   file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
 
   file.mv(`backend/public/uploads/${file.name}`, async err => {
     if (err) {
       console.error(err);
       return next(new ErrorResponse(`Problem with file upload`, 500));
     }
 
     await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
 
     res.status(200).json({
       success: true,
       data: file.name
     });
   });
 });