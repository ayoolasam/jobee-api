const express = require("express");
const router = express.Router();

//importing jobs controller methods
const { getJobs, createJob } = require("../controllers/jobsController");

router.get("/jobs", getJobs);

router.post("/job/new", createJob);

module.exports = router;
