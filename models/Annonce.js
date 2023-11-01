// annonce.js
const mongoose = require('mongoose');

const annonceSchema = new mongoose.Schema({
    type: String,
    nom: String,
    email: String,
    numero: String,
    description: String,
    budget: String,
    lieu: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Annonce', annonceSchema);