const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        default: null
    }
});

// Ensure we always have a single settings document per key
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

settingsSchema.statics.setSetting = async function(key, value, updatedBy = null) {
    return await this.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date(), updatedBy },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model("Settings", settingsSchema);
