const mongoose = require('mongoose');

const AutomobileSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secteur: { type: String, required: true, default: 'Automobiles' },

    marque: String,
    modele: String,
    annee: String,
    nombrePlaces: String,
    pays: String,
    ville: String,
    commune: String,
    quartier: String,
    nomRue: String,
    codePostal: String,
    typePlacement: String,
    carrosserie: String,
    couleur: String,
    kilometrage: String,
    carburant: String,
    cylindree: String,
    transmission: String,
    puissance: String,
    prix: Number,
    duree: String,
    etat: String,
    commodite: [String],
    documents: [String],
    description: String,
    images: [String], // Tableau d'URLs d'images
    video: [String], // Tableau d'URLs de vidéos
    links: [String], // Tableau d'URLs
    favories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    active: { type: String, default: true }
}, {
    timestamps: true,
});

const AutomobileModel = mongoose.model('Automobile', AutomobileSchema);

module.exports = AutomobileModel;