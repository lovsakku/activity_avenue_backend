const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
var path = require("path");
var fs = require("fs");
const app = express();
const port = 3001;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
    credentials: true,
  })
);

const url ="mongodb+srv://sakina:fullstack@cluster0.4m3fb.mongodb.net/";
const dbName = "Webstore";
let db;

app.use(express.json()); // middleware to use json

app.use(function (req, res, next) {
  // logging middleware
  console.log("Request IP: " + req.url);
  console.log("Request Body: " + JSON.stringify(req.body));
  console.log("Request Query Params: " + JSON.stringify(req.query));
  console.log("Request date: " + new Date());
  next();
});

app.use(function (req, res, next) {
  // static image file middleware
  var filePath = path.join(__dirname, "static", req.url);
  fs.stat(filePath, function (err, fileInfo) {
    if (err) {
      next();
      return;
    }
    if (fileInfo.isFile()) res.sendFile(filePath);
    else next();
  });
});

MongoClient.connect(url) 
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db(dbName);

    app.get("/", (req, res) => {
      res.send("Hello, World! MongoDB connected.");
    });

    app.post("/collection/:collectionName/addMany", async (req, res) => {
      try {
        let collection = db.collection(req.params.collectionName);
        const result = await collection.insertMany(req.body);
        return res.send(result);
      } catch (err) {
        console.error("Error adding multi records to db:", err);
        return res.status(500).send("Error adding multi records to db");
      }
    });

    app.post("/collection/:collectionName/addOne", async (req, res) => {
      try {
        let collection = db.collection(req.params.collectionName);
        const result = await collection.insertOne(req.body);
        return res.send(result);
      } catch (err) {
        console.error("Error adding single record to db:", err);
        return res.status(500).send("Error adding single record to db");
      }
    });

    app.get("/collection/products", async (req, res) => {

      try {
        const collection = db.collection(req.params.collectionName);
        const items = await collection.find({}).toArray();
        return res.json(items);
      } catch (err) {
        console.error("Error fetching items:", err);
        return res.status(500).send("Error fetching items");
      }
    });

    app.put("/collection/:collectionName/update/:id", async (req, res) => {
      
        try {  
          let collection = db.collection(req.params.collectionName);
          const filter = { _id: new ObjectId(req.params.id) };
          const updateDocument = { $set: req.body };
          const result = await collection.updateOne(filter, updateDocument);
          return res.send(result);
        } catch (err) {
          console.error("Error while trying to update record:", err);
          return res.status(500).send("Error while trying to update record");
        }
      });

    app.get("/collection/products/search", async (req, res) => {
      
      try {
        const collection = db.collection(req.params.collectionName);
        const query = req.query.value;
        if (!query) {
          return res.status(400).json({ error: "Query parameter is required" });
        }
        const searchQuery = {};
        if (!isNaN(query)) {
          const queryNumber = parseInt(query);
          searchQuery.$or = [
            { price: queryNumber },
            { availableInventory: queryNumber },
            { rating: queryNumber },
          ];
        } else {
          searchQuery.$or = [
            { title: { $regex: query, $options: "i" } }, 
            { location: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ];
        }
        const items = await collection.find(searchQuery).toArray();
        return res.json(items);
      } catch (err) {
        console.error("Error fetching items:", err);
        return res.status(500).send("Error fetching items");
      }
    });


    app.use(function (req, res) {
      res.status(404);
      res.send("Path not found!");
    });
  })
  .catch((err) => {
    console.error("Cannot connecting to MongoDB:", err);
  });

app.listen(port, () => {

    console.log(`Server is running on port: ${port}`);
  });