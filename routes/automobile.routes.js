const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Automobile = require('../models/Automobile');

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

// Fonction pour créer un objet "Automobile" à partir des données fournies
const createAutomobileObject = (data, ownerId) => {
    const {
        marque,
        modele,
        annee,
        nombrePlaces,
        typePlacement,
        pays,
        ville,
        commune,
        quartier,
        nomRue,
        codePostal,
        carrosserie,
        couleur,
        kilometrage,
        carburant,
        cylindree,
        transmission,
        puissance,
        prix,
        duree,
        etat,
        commodite,
        documents,
        description,
        images,
        video,
        links,
        favories,
        commentaire,
    } = data;

    return new Automobile({
        owner: ownerId, // Utilisez l'ID de l'utilisateur connecté
        marque,
        modele,
        annee,
        nombrePlaces,
        pays,
        ville,
        commune,
        quartier,
        nomRue,
        codePostal,
        typePlacement,
        carrosserie,
        couleur,
        kilometrage,
        carburant,
        cylindree,
        transmission,
        puissance,
        prix,
        duree,
        etat,
        commodite,
        documents,
        description,
        images,
        video,
        links,
        favories,
        commentaire,
    });
};

// Route pour créer une nouvelle annonce
router.post('/automobile', verifyToken, async (req, res) => {
    try {
        const automobile = createAutomobileObject(req.body, req.userData.id);

        // Enregistrement de l'objet automobile dans la base de données
        const savedAutomobile = await automobile.save();

        res.status(200).json(savedAutomobile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création d\'une nouvelle annonce automobile.' });
    }
});

// Route pour récupérer toutes les annonces automobiles
router.get('/automobiles', async (_, res) => {
    try {
        const automobiles = await Automobile.find();

        res.status(200).json(automobiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des annonces automobiles.' });
    }
});

// Route pour récupérer toutes les annonces automobiles d'un utilisateur spécifique
router.get('/mes-automobiles', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;

        const automobiles = await Automobile.find({ owner: userId }).populate('owner').exec();

        res.status(200).json(automobiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des annonces automobiles de l\'utilisateur.' });
    }
});

// Route pour récupérer une annonce automobile spécifique
router.get('/automobile/:automobileId', async (req, res) => {

    try {
        const automobileId = req.params.automobileId;

        const automobile = await Automobile.findById(automobileId).populate('owner').exec();

        if (!automobile) {
            return res.status(404).json({ message: 'Annonce automobile introuvable' });
        }

        res.status(200).json(automobile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de l\'annonce automobile.' });
    }
});

router.put('/automobile/:automobileId', verifyToken, async (req, res) => {
    try {
        const automobileId = req.params.automobileId;

        const automobile = await Automobile.findById(automobileId);

        if (!automobile) {
            return res.status(404).json({ message: 'Voiture introuvable' });
        }

        if (automobile.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à modifier cette voiture' });
        }

        automobile.marque = req.body.marque;
        automobile.modele = req.body.modele;
        automobile.annee = req.body.annee;
        automobile.typePlacement = req.body.typePlacement;
        automobile.nombrePlaces = req.body.nombrePlaces;
        automobile.pays = req.body.pays;
        automobile.ville = req.body.ville;
        automobile.commune = req.body.commune;
        automobile.quartier = req.body.quartier;
        automobile.nomRue = req.body.nomRue;
        automobile.codePostal = req.body.codePostal;
        automobile.carrosserie = req.body.carrosserie;
        automobile.couleur = req.body.couleur;
        automobile.kilometrage = req.body.kilometrage;
        automobile.carburant = req.body.carburant;
        automobile.cylindree = req.body.cylindree;
        automobile.vitesse = req.body.vitesse;
        automobile.transmission = req.body.transmission;
        automobile.puissance = req.body.puissance;
        automobile.prix = req.body.prix;
        automobile.duree = req.body.duree;
        automobile.etat = req.body.etat;
        automobile.commodite = req.body.commodite;
        automobile.documents = req.body.documents;
        automobile.description = req.body.description;
        automobile.images = req.body.images;
        automobile.video = req.body.video;
        automobile.carLink = req.body.carLink;
        automobile.active = req.body.active
        const updatedAutomobile = await automobile.save();

        res.status(200).json(updatedAutomobile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la voiture.' });
    }
});

router.put('/automobile/:automobileId/active', verifyToken, async (req, res) => {
    try {
        const automobileId = req.params.automobileId;

        const automobile = await Automobile.findById(automobileId);

        if (!automobile) {
            return res.status(404).json({ message: 'Voiture introuvable' });
        }

        if (automobile.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à modifier cette voiture' });
        }

        // Mettez à jour uniquement la propriété active
        automobile.active = req.body.active;

        const updatedAutomobile = await automobile.save();

        res.status(200).json(updatedAutomobile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la voiture.' });
    }
});

// Route pour mettre à jour partiellement une annonce existante
// router.patch('automobile/:automobileId', verifyToken, async (req, res) => {
//     try {
//         const automobileId = req.params.automobileId;

//         const automobile = await Automobile.findById(automobileId);

//         if (!automobile) {
//             return res.status(404).json({ message: 'Voiture introuvable' });
//         }

//         if (automobile.owner.toString() !== req.userData.id) {
//             return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à modifier cette voiture' });
//         }

//         const updatedAutomobile = await Automobile.findByIdAndUpdate(automobileId, req.body, { new: true });

//         res.status(200).json(updatedAutomobile);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour partielle de la voiture.' });
//     }
// });


router.patch('/add-car-to-favorites/:automobileId', async (req, res) => {
    const { automobileId } = req.params; // ID du bien
    const { userId } = req.body; // ID de l'utilisateur connecté

    try {
        // Recherchez le bien par son ID
        const automobile = await Automobile.findById(automobileId);

        if (!automobile) {
            return res.status(404).json({ message: "Le bien n'existe pas." });
        }

        // Vérifiez si l'ID de l'utilisateur existe déjà dans les favoris
        if (automobile.favories.includes(userId)) {
            return res.status(400).json({ message: "Le bien est déjà dans les favoris de l'utilisateur." });
        }

        // Ajoutez l'ID de l'utilisateur à la liste des favoris
        automobile.favories.push(userId);

        // Sauvegardez les modifications
        await automobile.save();

        res.status(200).json({ message: "Le bien a été ajouté aux favoris de l'utilisateur." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout aux favoris.' });
    }
});

// Route pour supprimer un bien des favoris de l'utilisateur
router.patch('/remove-car-from-favorites/:automobileId', async (req, res) => {
    try {
        const { automobileId } = req.params;
        const { userId } = req.body;

        // Assurez-vous d'authentifier l'utilisateur et de vérifier les autorisations ici

        // Recherchez le bien par son ID
        const automobile = await Automobile.findById(automobileId);

        if (!automobile) {
            return res.status(404).json({ message: "Le bien n'existe pas." });
        }

        // Trouvez l'index de l'ID de l'utilisateur dans la liste des favoris
        const userIndex = automobile.favories.indexOf(userId);

        if (userIndex !== -1) {
            // Si l'ID de l'utilisateur est trouvé dans les favoris, supprimez-le
            automobile.favories.splice(userIndex, 1);

            // Enregistrez les modifications dans la base de données
            await automobile.save();

            return res.status(200).json({ message: 'Le bien a été retiré des favoris de l\'utilisateur.' });
        } else {
            return res.status(400).json({ message: "L'ID de l'utilisateur n'était pas dans les favoris du bien." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du bien des favoris.' });
    }
});

// Route pour supprimer une annonce existante
router.delete('/automobile/:automobileId', verifyToken, async (req, res) => {
    try {
        const automobileId = req.params.automobileId;

        const automobile = await Automobile.findById(automobileId);

        if (!automobile) {
            return res.status(404).json({ message: 'Voiture introuvable' });
        }

        if (automobile.owner.toString() !== req.userData.id) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette voiture' });
        }

        await Automobile.findByIdAndDelete(automobileId);

        res.status(200).json({ message: 'La voiture a été supprimée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la voiture.' });
    }
});


module.exports = router;