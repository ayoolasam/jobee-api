const express = require("express");
const router = express.Router();

//importing jobs controller methods
const {
  getJobs,
  createJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getJob,
  jobStats,
} = require("../controllers/jobsController");

router.get("/jobs", getJobs);

router.post("/job/new", createJob);
router.get("/jobs/:zipcode/:distance", getJobsInRadius);
router.put("/job/:id", updateJob);
router.delete("/job/:id", deleteJob);
router.get("/job/:id/:slug", getJob);
router.get("/stats/:topic", jobStats);

module.exports = router;
