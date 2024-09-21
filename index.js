const express = require('express')
const app = express()
const path = require('path');
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const qs = require('qs')
require('dotenv').config()

app.set('query parser', function (str) {
  return qs.parse(str, { /* custom options */ })
})

//
mongoose.connect(process.env.MONGO_URI);
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});


// Create Schema and Model
const UserSchema = new mongoose.Schema({username:{type: String, required:true}, count: Number,log: Array});
const Username = mongoose.model("username",UserSchema);

//POSTS

// Create new user
app.post("/api/users", async (req,res)=>{
  let username = req.body.username;

  try {
    let user = new Username({username: username, count: 0, log:[]})
    await user.save();  
    res.json({username: username, _id: user._id})

  } catch (err) {
    console.log(err)
  }
})

// Add exercises
app.post("/api/users/:_id/exercises", async (req,res)=>{
  let exDate;
  let _id = req.params._id;
  let {date, description, duration} = req.body
  duration = parseInt(duration)

  if(!date){exDate = new Date().toDateString()}
  else if ( new Date(date) ) { exDate = new Date(date).toDateString() }

  try {
    let exercise = await Username.findByIdAndUpdate(
      _id, 
      {
        $inc: { count: 1 },
        $push: { 
          log: {
            $each: [{ description: description, duration: duration, date: exDate }],
            $position: 0
          }
        }
      }, 
      { new: true }
    );
    
    res.json({"_id": _id, username: exercise.username,  date: exDate, duration: duration, description: description})
  } catch (err) {
    console.log(err)
  }
})

// GET

// Get Users
app.get("/api/users", async (req,res)=>{
  try{
    let user = await Username.find({}).select("username");
    Username.find({}).select("username")
    res.json(user)
  } catch (err) {
     console.log(err)
  }
})


// Get user exercices
app.get("/api/users/:_id/logs", async (req,res)=>{
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = parseInt(req.query.limit);

  try{
    userLogs = await Username.findById(req.params._id).select("-__v")
    let log =  userLogs.log
    if(fromDate){
      log = log.filter(exr => new Date (exr.date) >= new Date(fromDate));
    }
    if(toDate){
      log = log.filter(exr => new Date (exr.date) <= new Date(toDate));
    }
    if(limit){
      log = log.splice(0,limit);
    }
    userLogs.log = log
    res.json(userLogs)
  } catch (err) {
    console.log(err)
  }

})


// listen for requests
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

