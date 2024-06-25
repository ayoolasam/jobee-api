
const Job = require("../models/Job.model")
//getjobs in database /api/v1/jobs
exports.getJobs = ((req,res,next)=>{


  res.status(200).json({
    message:"fuck off this endpoint bitch!"
  })
})

//create job in database /api/v1/jobs
exports.createJob = async(req,res,next)=>{



  const job = await Job.create(req.body)
  res.status(201).json({
    message:"job Created",
    success:true,
    data:{
      job
    }
  })
}
