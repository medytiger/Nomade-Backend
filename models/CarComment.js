const mongoose = require('mongoose');

const commentaireSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Automobile', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Commentaire = mongoose.model('CarCommentaire', commentaireSchema);

module.exports = Commentaire;