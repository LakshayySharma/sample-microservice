const express = require("express");
const mongoose = require("mongoose");
const Product = require("./Product");
const amqp = require("amqplib");
mongoose.connect("mongodb://localhost:27017/products", {}, () => {
  console.log(`connected to MongoDB`);
});

let channel, connection;
const app = express();
app.use(express.json({}));

async function connect() {
  connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
}

connect();

app.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/", async (req, res) => {
  console.log(req.body);
  let product = new Product(req.body);
  await product.save();
  return res.json(product);
});

app.post("/buy", async (req, res) => {
  let order;
  const { ids } = req.body;
  const products = await Product.find({
    _id: { $in: ids },
  });
  channel.sendToQueue("ORDER", Buffer.from(JSON.stringify(products)));
  channel.consume("PRODUCT", async (data) => {
    order = await JSON.parse(data.content);
    channel.ack(data);
    console.log(order);
    res.json(order);
  });
});

app.listen(8000, () => {
  console.log(`server running on port 8000`);
});
