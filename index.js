const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const UserModel = require("./models/Userdata");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const mongoose = require("mongoose");
const Instamojo = require("instamojo-nodejs");
const nodemailer = require("nodemailer");
const cors = require("cors");
const  fs = require("fs");
require('dotenv').config();
const path = require('path');

const sdk = require("api")("@instamojo/v2#40d2ktblgmqonaz");

app.use(express.json());
app.use(cors({ credentials: true, origin: process.env.DB_HOST, }));
app.use(cookieparser());

const connectDB = async() => {
await mongoose.connect(`mongodb+srv://divyarora0906:${process.env.DB_PASSWORD}@cluster0.sj3ai7u.mongodb.net/Education`);
console.log("Connected");

}
connectDB();

const secretKEY = process.env.JWT_KEY //JWT
const salt = "$2b$10$ThisIsAFixedSaltForBcryptHashing"; //Salt for HAshing PAssword
const API_KEY = "856fee2f1253d5f03ff2221cc549e3e3";
const AUTH_TOKEN = "9fca79d55f92969a9c46f155ace326fd";
const PRIVATE_SALT = "adb4000f8f51475b8a8c431eba7337aa";
Instamojo.setKeys(API_KEY, AUTH_TOKEN);
Instamojo.isSandboxMode(true);
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.USER_MAIL, pass: process.env.USER_MAIL_PASS },
});

const sendUserPass = (email, user, pass) => {
  var mailOptions = {
    from: "divyarora0906@gmail.com",
    to: email,
    subject: `Welcome! to EduVerse the E-Learning Platform `,
    text: `This is Your Username ${user} and password is ${pass} Fill it in the Login Page to Buy Course`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

//Static

app.use(express.static(path.join(__dirname, '../client/dist')))

app.get("*" , (req,res)=>{
  res.sendFile(path.join(__dirname + "../client/dist/index.html"))
})

const GenerateUsername = (name, lname) => {
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  const slicelname = lname.slice(0, 3);
  const username = name + slicelname + "_" + randomNumber;
  return username;
};
const GeneratPass = (name, date) => {
  const dob = new Date(date);
  const Year = dob.getFullYear();
  const lowercaseName = name.toLowerCase();
  const Password = lowercaseName + Year;
  return Password;
};

app.post("/register", async (req, res) => {
  const { firstname, lastname, phone, email, date } = req.body;
  const username = GenerateUsername(firstname, lastname);
  const pass = GeneratPass(firstname, date);

  const EmailSend = sendUserPass(email, username, pass);
  if (!EmailSend) {
    console.log("NOT");
  }

  bcrypt.hash(pass, salt, async (err, password) => {
    if (err) {
      console.log(err);
    }

    const userDoc = await UserModel.create({
      firstname,
      lastname,
      phone,
      email,
      username,
      password,
    });

    res.json({ userDoc });
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const doc = await UserModel.findOne({ username });
  if (!doc) {
    res.json({ res: "NO user found" });
  } else if (doc) {
    bcrypt.compare(password, doc.password, (err, result) => {
      if (result) {
        jwt.sign(
          { username, id: doc._id, name: doc.firstname },
          secretKEY,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).json({
              username,
              id: doc._id,
              name: doc.firstname,
            });
          }
        );
      } else {
        res.json("password incoorect");
      }
    });
  } else {
    res.json({ err: "Error" });
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - Token not provided" });
  } else {
    jwt.verify(token, secretKEY, {}, (err, info) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized - Invalid token" });
      }

      res.json(info);
    });
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "").json({ res: "OK" });
});
app.post("/get-token", async (req, res) => {
  try {
    const encodedParams = new URLSearchParams();
    encodedParams.set("grant_type", "client_credentials");
    encodedParams.set("client_id", "856fee2f1253d5f03ff2221cc549e3e3");
    encodedParams.set("client_secret", "9fca79d55f92969a9c46f155ace326fd");

    const options = {
      method: "POST",
      url: "https://test.instamojo.com/oauth2/token/",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      data: encodedParams,
    };

    axios
      .request(options)
      .then(function (response) {
        return res.status(200).send(response.data.access_token);
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {}
});

app.post("/update", async(req,res)=>{
  const {id,user,name} = req.body;
  console.log(id,user);
  const firstname = user;
  const doc = await UserModel.findOne({firstname})
  console.log(doc)
  const updated = await UserModel.findOneAndUpdate(
    {
      firstname
    },
   
    {
      $push: {
        courseIds: id,
      },
      $set:{
        courseName: name
      }
    },
    { new: true } 
  )
console.log(updated);
})
app.post("/coursesNow" , async(req,res)=>{
  const {user} = req.body;
  const firstname = user;
  const doc = await UserModel.findOne({firstname});
  courseId = doc.courseIds;
  res.status(200).json({ courseId });
})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log("Started at Port 5000");
});
