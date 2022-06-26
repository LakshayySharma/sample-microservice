const mongoose = require("mongoose");
const orderSchema = mongoose.Schema({
  products: [
    {
      productId: String,
    },
  ],
  totalPrice: Number,
});

module.exports = Order = mongoose.model("order", orderSchema);
