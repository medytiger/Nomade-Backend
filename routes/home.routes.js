const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Home = require('../models/Home');

// Middleware de vérification de token
function verifyToken(req, res, next) {
    const { token } = req.cookies;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
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

// Fonction pour créer un objet "Home" à partir des données fournies
const createHomeObject = (data, ownerId) => {
    const {
        typePropiete,
        typePlacement,
        standing,
        titre,
        description,
        commodite,
        pays,
        ville,
        commune,
        quartier,
        nomRue,
        codePostal,
        prix,
        duree,
        condition,
        permis,
        problemePermis,
        images,
        video,
        carLink,
        favories,
        commentaire,
    } = data;

    return new Home({
        owner: ownerId, // Utilisez l'ID de l'utilisateur connecté
        typePropiete,
        typePlacement,
        standing,
        titre,
        description,
        commodite,
        pays,
        ville,
        commune,
        quartier,
        nomRue,
        codePostal,
        prix,
        duree,
        condition,
        permis,
        problemePermis,
        images,
        video,
        carLink,
        favories,
        commentaire,
    });
};


// Route pour créer une nouvelle annonce
router.post('/immobilier', verifyToken, async (req, res) => {
    try {
        const home = createHomeObject(req.body, req.userData.id);

        // Enregistrement de l'objet home dans la base de données
        const savedHome = await home.save();

        res.status(200).json(savedHome); // Retournez l'objet sauvegardé
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'annonce.' });
    }
});

// Route pour récupérer toutes les annonces
router.get('/immobiliers', async (_, res) => {
    try {
        const homes = await Home.find();
        res.status(200).json(homes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des biens immobiliers.' });
    }
});

// Route pour récupérer les annonces d'un utilisateur
router.get('/mes-immobiliers', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;
        const homes = await Home.find({ owner: userId }).populate('owner').exec();

        res.status(200).json(homes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de vos biens immobiliers.' });
    }
});

// Route pour récupérer une annonce par son ID
router.get('/immobilier/:homeId', async (req, res) => {
    try {
        const homeId = req.params.homeId;

        const home = await Home.findById(homeId).populate('owner').exec();

        if (!home) {
            return res.status(404).json({ message: 'Bien immobilier introuvable' });
        }

        res.status(200).json(home);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du bien immobilier.' });
    }
});

// Route pour mettre à jour une annonce existante
router.put('/immobilier/:homeId', verifyToken, async (req, res) => {
    try {
        const homeId = req.params.homeId;

        const home = await Home.findById(homeId);

        if (!home) {
            return res.status(404).json({ message: 'Bien immobilier introuvable' });
        }

        if (home.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à modifier ce bien immobilier' });
        }

        home.typePropiete = req.body.typePropiete;
        home.typePlacement = req.body.typePlacement;
        home.standing = req.body.standing;
        home.titre = req.body.titre;
        home.description = req.body.description;
        home.commodite = req.body.commodite;
        home.pays = req.body.pays;
        home.ville = req.body.ville;
        home.commune = req.body.commune;
        home.quartier = req.body.quartier;
        home.nomRue = req.body.nomRue;
        home.codePostal = req.body.codePostal;
        home.prix = req.body.prix;
        home.duree = req.body.duree;
        home.condition = req.body.condition;
        home.permis = req.body.permis;
        home.problemePermis = req.body.problemePermis;
        home.images = req.body.images;
        home.video = req.body.video;
        home.homeLink = req.body.homeLink;

        // Mettre à jour les données du bien immobilier
        const updatedHome = await home.save();

        res.status(200).json(updatedHome);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du bien immobilier.' });
    }
});

router.put('/immobilier/:immobilierId/active', verifyToken, async (req, res) => {
    try {
        const immobilierId = req.params.immobilierId;

        const immobilier = await Home.findById(immobilierId);

        if (!immobilier) {
            return res.status(404).json({ message: 'Voiture introuvable' });
        }

        if (immobilier.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à modifier ce bien immobilier' });
        }

        // Mettez à jour uniquement la propriété active
        immobilier.active = req.body.active;

        const updatedimmobilier = await immobilier.save();

        res.status(200).json(updatedimmobilier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du bien immobilier.' });
    }
});



router.patch('/add-home-to-favorites/:homeId', async (req, res) => {
    const { homeId } = req.params; // ID du bien
    const { userId } = req.body; // ID de l'utilisateur connecté

    try {
        // Recherchez le bien par son ID
        const home = await Home.findById(homeId);

        if (!home) {
            return res.status(404).json({ message: "Le bien n'existe pas." });
        }

        // Vérifiez si l'ID de l'utilisateur existe déjà dans les favoris
        if (home.favories.includes(userId)) {
            return res.status(400).json({ message: "Le bien est déjà dans les favoris de l'utilisateur." });
        }

        // Ajoutez l'ID de l'utilisateur à la liste des favoris
        home.favories.push(userId);

        // Sauvegardez les modifications
        await home.save();

        res.status(200).json({ message: "Le bien a été ajouté aux favoris de l'utilisateur." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout aux favoris.' });
    }
});

// Route pour supprimer un bien des favoris de l'utilisateur
router.patch('/remove-home-from-favorites/:homeId', async (req, res) => {
    try {
        const { homeId } = req.params;
        const { userId } = req.body;

        // Assurez-vous d'authentifier l'utilisateur et de vérifier les autorisations ici

        // Recherchez le bien par son ID
        const home = await Home.findById(homeId);

        if (!home) {
            return res.status(404).json({ message: "Le bien n'existe pas." });
        }

        // Trouvez l'index de l'ID de l'utilisateur dans la liste des favoris
        const userIndex = home.favories.indexOf(userId);

        if (userIndex !== -1) {
            // Si l'ID de l'utilisateur est trouvé dans les favoris, supprimez-le
            home.favories.splice(userIndex, 1);

            // Enregistrez les modifications dans la base de données
            await home.save();

            return res.status(200).json({ message: 'Le bien a été retiré des favoris de l\'utilisateur.' });
        } else {
            return res.status(400).json({ message: "L'ID de l'utilisateur n'était pas dans les favoris du bien." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du bien des favoris.' });
    }
});

router.delete('/immobilier/:homeId', verifyToken, async (req, res) => {
    try {
        const homeId = req.params.homeId;

        const home = await Home.findById(homeId);

        if (!home) {
            return res.status(404).json({ message: 'Bien immobilier introuvable' });
        }

        if (home.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce bien immobilier' });
        }

        await Home.findByIdAndDelete(homeId);

        res.status(200).json({ message: 'Bien immobilier supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du bien immobilier.' });
    }
});




module.exports = router;