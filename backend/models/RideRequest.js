const mongoose = require("mongoose");

const RideRequestSchema = new mongoose.Schema({
  name: { type: String, required: true }, // person offering ride
  contact: { type: String, required: true },
  destination: { type: String, required: true },
  datetime: { type: Date, required: true },
  seatsAvailable: { type: Number, default: 1 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },

  pickupCoords: {
    lat: Number,
    lng: Number,
  },
  destinationCoords: {
    lat: Number,
    lng: Number,
  },

  pendingJoinRequests: [
    {
      name: String,
      contact: String,
      message: String,
      status: { type: String, default: "pending" }, // "pending" | "accepted" | "rejected"
    },
  ],

  joinedUsers: [
    {
      name: String,
      contact: String,
    },
  ],

  isFull: { type: Boolean, default: false },

  // 🆕 Unique ID to identify the creator (without login)
  creatorId: { type: String, required: true },
});

module.exports = mongoose.model("RideRequest", RideRequestSchema);
