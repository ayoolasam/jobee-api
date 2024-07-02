const Job = require("../models/Job.model");
const geoCoder = require("../utils/geocoder");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFilters = require("../utils/apiFilters");

//getjobs in database /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(Job.find(), req.query).filter().sort().limitFields().searchByQuery();

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
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("Job not Found", 404));
  }

  const deletedJob = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    message: "Job successfully deleted",
  });
});

//get a specific job by id /api/v1/job/:id
exports.getJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  });

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
