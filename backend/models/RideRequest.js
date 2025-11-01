const mongoose = require("mongoose");

const RideRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    pickup: { type: String, required: true }, // added
    destination: { type: String, required: true },
    datetime: { type: Date, required: true },
    seatsAvailable: { type: Number, default: 1 },
    notes: { type: String },

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
        status: { type: String, default: "pending" },
      },
    ],

    joinedUsers: [
      {
        name: String,
        contact: String,
      },
    ],

    isFull: { type: Boolean, default: false },
    creatorId: { type: String, required: true },
  },
  { timestamps: true } // ✅ auto adds createdAt + updatedAt
);

module.exports = mongoose.model("RideRequest", RideRequestSchema);
