const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    type: { type: String, required: true },
    nom: String,
    nomEntreprise: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    facebook: String,
    tiktok: String,
    linkedin: String,
    prefixe: String,
    numero: String,
    genre: String,
    date: String,
    domaineActivite: String,
    lieu: String,
    descriptionActivite: String,
    photo: String,
    verifie: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }
}, {
    timestamps: true,
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;