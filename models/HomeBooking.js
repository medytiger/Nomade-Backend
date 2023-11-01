const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const HomeBookingSchema = new mongoose.Schema({
    home: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Immobiliers' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nom: String,
    numero: String,
    email: String,
    dateArrive: Date,
    dateDepart: Date,
    voiture: String,
    chauffeur: String,
}, {
    timestamps: true,
});

const HomeBookingModel = mongoose.model('HomeBooking', HomeBookingSchema);

module.exports = HomeBookingModel;