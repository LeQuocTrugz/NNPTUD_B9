var express = require("express");
var router = express.Router();
let messageModel = require("../schemas/messages");
const { checkLogin } = require("../utils/authHandler");
const { uploadImage } = require("../utils/uploadHandler");


// =============================
// 1. GET /:userID
// =============================
router.get("/:userID", checkLogin, async function (req, res) {
  try {
    let currentUser = req.user._id;
    let otherUser = req.params.userID;

    let messages = await messageModel.find({
      $or: [
        { from: currentUser, to: otherUser },
        { from: otherUser, to: currentUser }
      ]
    }).sort({ createdAt: 1 });

    res.send(messages);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});


// =============================
// 2. POST /
// =============================
router.post("/", checkLogin, uploadImage.single("file"), async function (req, res) {
  console.log("USER:", req.user);
  console.log("BODY:", req.body);
  try {
    let from = req.user._id;
    let to = req.body.to;
    let type = req.body.type;
    let text = req.body.text;

    // Validate required fields
    if (!to || !type) {
      return res.status(400).send({ message: "Missing required fields: to, type" });
    }

    let messageContent;

    // nếu type là file
    if (type === "file") {
      if (!req.file) {
        return res.status(400).send({ message: "File is required for type 'file'" });
      }
      messageContent = {
        type: "file",
        text: req.file.path
      };
    } 
    // nếu type là text
    else if (type === "text") {
      if (!text) {
        return res.status(400).send({ message: "Text is required for type 'text'" });
      }
      messageContent = {
        type: "text",
        text: text
      };
    }
    else {
      return res.status(400).send({ message: "Type must be 'file' or 'text'" });
    }

    let newMessage = new messageModel({
      from,
      to,
      messageContent
    });

    await newMessage.save();
    res.send(newMessage);

  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});


// =============================
// 3. GET / (last message mỗi user)
// =============================
router.get("/", checkLogin, async function (req, res) {
  try {
    let currentUser = req.user._id;

    let messages = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { from: currentUser },
            { to: currentUser }
          ]
        }
      },
      {
        $addFields: {
          user: {
            $cond: [
              { $eq: ["$from", currentUser] },
              "$to",
              "$from"
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$user",
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    res.send(messages);

  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;