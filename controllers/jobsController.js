const Job = require("../models/Job.model");
const geoCoder = require("../utils/geocoder");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFilters = require("../utils/apiFilters");
const path = require("path");
const fs = require("fs");

//getjobs in database /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(Job.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination();

  const jobs = await apiFilters.query;

  res.status(200).json({
    success: true,
    message: "Successful",
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

//create job in database /api/v1/jobs
exports.createJob = catchAsyncErrors(async (req, res, next) => {
  //add user in database
  req.body.user = req.user.id;

  const job = await Job.create(req.body);
  res.status(201).json({
    message: "job Created",
    success: true,
    data: {
      job,
    },
  });
});
//search jobs within radius or distance /ap1/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //getting latitude and longitude from geocoder with zipcode
  const loc = await geoCoder.geocode(zipcode);
  const latitude = loc[0].latitude;
  const longitude = loc[0].longitude;

  //getting the radius from the distance
  const radius = distance / 3963;

  //find the jobs with the location eith the longitude latitude and radius
  const jobs = await Job.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  res.status(200).json({
    message: "Successfull",
    success: true,
    results: "jobs.length",
    data: {
      jobs,
    },
  });
});

//Update a job in the database /ap1/v1/job/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("job not Found", 404));
  }

  //check if the user is owner
  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler("Not Authorized to update this job", 401));
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    message: "Job successfully updated",
    data: {
      updatedJob,
    },
  });
});

//delete job /api/v1/jobs/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("Job not Found", 404));
  }

  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler("Not Authorized to delete this job", 401));
  }

  //deleting files associated with job

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    let filepath =
      `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace(
        "\\controllers",
        ""
      );
    fs.unlink(filepath, (err) => {
      if (err) return;
      console.log(err);
    });
  }

  const deletedJob = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    message: "Job successfully deleted",
  });
});

//get a specific job by id /api/v1/job/:id
exports.getJob = catchAsyncErrors(async (req, res, next) => {
  // const job = await Job.find({
  //   $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  // }).populate({
  //   path: "user",
  //   select: "name",
  // });
  const job = await Job.findById(req.params.id);

  if (!job || job.length === 0) {
    return next(new ErrorHandler("Job not found", 404));
  }

  res.status(200).json({
    message: "Job Found",
    data: {
      job,
    },
  });
});

//get stats about a topic(job) = /api/v1/stats/:topic
exports.jobStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: '"' + req.params.topic + '"' } },
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgSalary: { $avg: "$salary" },
        avgPositions: { $avg: "$positions" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return res.status(200).json({
      success: false,
      message: `No stats found for - ${req.params.topic}`,
    });
  }

  res.status(200).json({
    success: true,
    message: "successfull",
    data: {
      stats,
    },
  });
});

//upload user files apply to job using resume /api/v1/job/:id/apply
exports.fileUpload = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("job not found", 404));
  }

  //check that if job last date has been passed or not
  if (job.lastDate < new Date(Date.now())) {
    return next(
      new ErrorHandler("you can not apply to this job date is over", 404)
    );
  }

  //check if the user has applied before
  for (let i = 0; i < job.applicantsApplied.length; i++) {
    if (job.applicantsApplied[i].id === req.user.id) {
      return next(
        new ErrorHandler("you have already applied to this job", 404)
      );
    }
  }

  //check the files
  if (!req.files) {
    return next(new ErrorHandler("Please upload file. ", 400));
  }

  const file = req.files.file;

  //check file type
  const supportedFiles = /.docx|.pdf/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload document file.", 400));
  }

  //check document size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please uploaad file less than 2MB", 400));
  }

  //renaming document or resume
  file.name = `${req.user.name.replace(" ", "_")}_${job._id}${
    path.parse(file.name).ext
  }`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("Resume Upload failed", 500));
    }
    await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          applicantsApplied: {
            id: req.user.id,
            resume: file.name,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    res.status(200).json({
      success: true,
      message: "Applied to job successfully",
      data: file.name,
    });
  });
});
