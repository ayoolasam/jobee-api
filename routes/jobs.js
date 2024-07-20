const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

//importing jobs controller methods
const {
  getJobs,
  createJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getJob,
  jobStats,
  fileUpload
} = require("../controllers/jobsController");

router.get("/jobs", getJobs);

router.post(
  "/job/new",
  isAuthenticatedUser,
  authorizeRoles("admin", "employer"),
  createJob
);
router.get("/jobs/:zipcode/:distance", getJobsInRadius);
router.put("/job/:id", isAuthenticatedUser,authorizeRoles("admin", "employer"), updateJob);
router.delete("/job/:id", isAuthenticatedUser,authorizeRoles("admin", "employer"), deleteJob);
router.get("/job/:id/:slug", getJob);
router.get("/stats/:topic", jobStats);
router.put("/job/:id/apply", isAuthenticatedUser,authorizeRoles("user"), fileUpload);

module.exports = router;
