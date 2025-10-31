const express = require("express");
const router = express.Router();
const RideRequest = require("../models/RideRequest");

// ✅ CREATE a new ride
router.post("/add", async (req, res) => {
  try {
    // Generate a unique random ID for this creator
    const creatorId = Math.floor(100000 + Math.random() * 900000).toString();

    const ride = new RideRequest({
      ...req.body,
      creatorId, // attach unique id
    });

    await ride.save();
    res.status(201).json({ message: "Ride created successfully!", ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating ride" });
  }
});

// ✅ GET all rides
router.get("/", async (req, res) => {
  try {
    const rides = await RideRequest.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rides" });
  }
});

// ✅ FIND rides (for JoinRide search)
router.post("/find", async (req, res) => {
  try {
    const { pickup, destination } = req.body;
    const rides = await RideRequest.find({
      $and: [
        { destination: { $regex: destination, $options: "i" } },
        { pickup: { $regex: pickup, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error finding rides" });
  }
});

// ✅ SEND JOIN REQUEST
router.post("/:rideId/request", async (req, res) => {
  try {
    const { rideId } = req.params;
    const { name, contact, message } = req.body;

    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.pendingJoinRequests.push({ name, contact, message });
    await ride.save();

    res.json({ message: "Join request sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending join request" });
  }
});

// ✅ ACCEPT JOIN REQUEST
router.patch("/:rideId/accept/:requestIndex", async (req, res) => {
  try {
    const { rideId, requestIndex } = req.params;
    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const request = ride.pendingJoinRequests[requestIndex];
    if (!request)
      return res.status(404).json({ message: "Request not found" });

    ride.joinedUsers.push({
      name: request.name,
      contact: request.contact,
    });

    ride.pendingJoinRequests.splice(requestIndex, 1);

    if (ride.seatsAvailable > 0) ride.seatsAvailable -= 1;
    if (ride.seatsAvailable === 0) ride.isFull = true;

    await ride.save();
    res.json({ message: "Join request accepted!", ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error accepting request" });
  }
});

// ✅ REJECT JOIN REQUEST
router.patch("/:rideId/reject/:requestIndex", async (req, res) => {
  try {
    const { rideId, requestIndex } = req.params;
    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.pendingJoinRequests.splice(requestIndex, 1);
    await ride.save();

    res.json({ message: "Join request rejected!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error rejecting request" });
  }
});

// GET rides created by a specific user
router.get("/my/:creatorId", async (req, res) => {
  try {
    const rides = await RideRequest.find({ creatorId: req.params.creatorId }).sort({
      createdAt: -1,
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your rides" });
  }
});

// DELETE a ride
router.delete("/:rideId", async (req, res) => {
  try {
    await RideRequest.findByIdAndDelete(req.params.rideId);
    res.json({ message: "Ride deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting ride" });
  }
});

module.exports = router;
