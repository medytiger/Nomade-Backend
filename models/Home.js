const mongoose = require('mongoose');

const HomeSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secteur: { type: String, required: true, default: 'Immobiliers' },
    typePropiete: [String],
    typePlacement: String,
    standing: String,
    titre: String,
    description: String,
    commodite: [String],
    pays: String,
    ville: String,
    commune: String,
    quartier: String,
    nomRue: String,
    codePostal: String,
    prix: Number,
    duree: String,
    condition: String,
    permis: String,
    problemePermis: String,
    images: [String],
    video: [String],
    homeLink: [String],
    favories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    active: { type: String, default: true }
}, {
    timestamps: true,
});

const ImmobiliersModel = mongoose.model('Immobiliers', HomeSchema);

module.exports = ImmobiliersModel;