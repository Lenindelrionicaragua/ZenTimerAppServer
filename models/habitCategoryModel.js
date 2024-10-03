import mongoose from "mongoose";

const habitCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalMinutes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);

export default HabitCategory;
