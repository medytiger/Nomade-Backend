const express = require('express');
const router = express.Router();
const Commentaire = require('../models/HomeComment');
const Jwt = require('jsonwebtoken');

// Middleware de vérification de token
function verifyToken(req, res, next) {
    const { token } = req.cookies;

    if (token) {
        Jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
            if (err) {
                console.error('Erreur de vérification du token :', err);
                return res.status(401).json({ message: 'Token invalide' });
            }

            // Ajoute l'ID de l'utilisateur à la requête
            req.userData = userData;
            next();
        });
    } else {
        res.status(401).json({ message: 'Token manquant' });
    }
}

const createHomeCommentObject = (data) => {
    const {
        owner,
        home,
        content,
        createdAt,
    } = data;

    return new Commentaire({
        owner,
        home,
        content,
        createdAt,
    });
};

router.post('/home-commentaires', async (req, res) => {
    try {
        const newComment = createHomeCommentObject(req.body);

        await newComment.save();

        res.status(201).json({ message: 'Commentaire ajouté avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Une erreur est survenue lors de l\'ajout du commentaire' });
    }
});

// Route GET pour obtenir les commentaires d'une maison spécifique
router.get('/home-commentaires/:homeId', async (req, res) => {
    try {
        const homeId = req.params.homeId;

        const commentaires = await Commentaire.find({ home: homeId });

        // Utilisez populate pour remplir le champ 'owner' avec toutes les données de l'utilisateur
        await Commentaire.populate(commentaires, { path: 'owner' });

        res.status(200).json(commentaires);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Une erreur est survenue lors de la récupération des commentaires', error: error.message });
    }
});

router.delete('/home-commentaires/:commentId', async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const deletedComment = await Commentaire.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({ message: 'Commentaire introuvable' });
        }

        res.status(200).json({ message: 'Commentaire supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Une erreur est survenue lors de la suppression du commentaire' });
    }
});

module.exports = router;