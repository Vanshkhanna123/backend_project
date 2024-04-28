const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.static(path.join(__dirname, "Public")));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let collection;

const connection = async () => {
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log("Connected to the MongoDB");
    return client;
  } catch (err) {
    console.error(err);
    throw err; // Propagate the error
  }
};

const connect = async () => {
  try {
    const client = await connection();
    const db = client.db(process.env.DB_NAME);
    collection = db.collection(process.env.COLLECTION_NAME);
    console.log("Connected to the database");
  } catch (error) {
    console.error(error);
    throw error; // Propagate the error
  }
};

app.post("/login", async (req, res) => {
  try {
    if (!collection) {
      await connect(); // Ensure collection is initialized
    }

    const { email, password } = req.body;
    const user = await collection.findOne({ email: email });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User with this email does not exist" });
    }

    if (user.password !== password) {
      console.log("Invalid Password");
      return res.status(400).json({ error: "Invalid Password" });
    }

    return res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    console.error("Error processing form submission:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the login and signup API" });
});

app.post("/signup", async (req, res) => {
  try {
    if (!collection) {
      await connect(); // Ensure collection is initialized
    }

    const { fullname, email, password } = req.body;
    const user = await collection.findOne({ email: email });

    if (user) {
      return res.status(404).json({ error: "User already exists" });
    }

    await collection.insertOne({ fullname, email, password });
    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error processing form submission:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
