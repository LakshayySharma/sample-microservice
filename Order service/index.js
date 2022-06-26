const express = require("express");
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");

let channel, connection;
mongoose.connect("mongodb://localhost:27017/orders", {}, () => {
  console.log(`connected to MongoDB`);
});

const app = express();
app.use(express.json({}));

async function connect() {
  connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue("ORDER");
}

connect().then(() => {
  channel.consume("ORDER", async (data) => {
    const products = JSON.parse(data.content);
    console.log(products);

    let totalPrice = 0;
    products.forEach((item) => {
      totalPrice += item.price;
    });
    const newOrder = new Order({ products, totalPrice });
    await newOrder.save;
    channel.ack(data);
    channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify(newOrder)));
  });
});

app.listen(9000, () => {
  console.log(`server running on port 9000`);
});
