const mongoose = require("mongoose");
const validator = require("validator");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter Job title"],
      trim: true,
      maxlength: [100, "job title can not exceed 100 characters"],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Please enter Job description"],
      maxlength: [1000, "job description cannot exceed 1000 characters"],
    },
    emaail: {
      type: String,
      validate: [validator.isEmail, "please add a valid email address."],
    },
    address: {
      type: String,
      required: [true, " please add an address"],
    },
    company: {
      type: String,
      required: [true, "Please add company name"],
    },
    industry: {
      type: [String],
      required: true,
      enum: {
        values: [
          "Business",
          "Information Technology",
          "Banking",
          "Education/Training",
          "Telecommunication",
          "others",
        ],
        message: "Please select correct options for industry",
      },
    },
    jobType: {
      type: String,
      required: true,
      enum: {
        values: ["Permanent", "Temporary", "Internship"],
        message: "Please select a correct job type option",
      },
    },
    minEducation: {
      type: String,
      required: true,
      enum: {
        values: ["Bachelors", "Masters", "PhD"],
        message: "Please select correct options for education",
      },
    },
    positions: {
      type: Number,
      default: 1,
    },
    experience: {
      type: String,
      required: true,
      enum: {
        values: [
          "No Experience",
          "1 Year - 2 Years",
          "2 Year - 5 Years",
          "5 Years+",
        ],
        message: "Please select correct options for experience",
      },
    },
    salary: {
      type: Number,
      required: [true, "Please enter expected salary for this Job"],
    },
    postingDate: {
      type: Date,
      default: Date.now,
    },
    lastDate: {
      type: Date,
      default: new Date().setDate(new Date().getDate() + 7),
    },
    applicantsApplied: {
      type: [Object],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);
