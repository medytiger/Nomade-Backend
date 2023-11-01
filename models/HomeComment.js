const mongoose = require('mongoose');

const commentaireSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Commentaire = mongoose.model('HomeCommentaire', commentaireSchema);

module.exports = Commentaire;