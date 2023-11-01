const mongoose = require('mongoose');

const AutomobileBookingSchema = new mongoose.Schema({
    automobile: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Automobile' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nom: String,
    numero: String,
    email: String,
    dateOccupation: Date,
    dateDepot: Date,
    chauffeur: String,
}, {
    timestamps: true,
});

const AutomobileBookingModel = mongoose.model('AutomobileBooking', AutomobileBookingSchema);

module.exports = AutomobileBookingModel;