const express = require('express');
const router = express.Router();
const AutomobileBooking = require('../models/AutomobileBooking');
const User = require('../models/User');
const Automobile = require('../models/Automobile');
const Jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


const EMAIL = process.env.EMAIL
const PASSWORD = process.env.EMAIL_SECRET

// Déterminez s'il fait actuellement jour ou nuit
const currentHour = new Date().getHours();
let greeting = 'Bonjour';
if (currentHour >= 13) {
    greeting = 'Bonsoir';
}

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

const createBookingAutobileObject = (data) => {
    const {
        automobile,
        owner,
        nom,
        numero,
        email,
        dateOccupation,
        dateDepot,
        chauffeur,
    } = data;

    return new AutomobileBooking({
        automobile,
        owner,
        nom,
        numero,
        email,
        dateOccupation,
        dateDepot,
        chauffeur,
    });
};


router.post('/carBooking', verifyToken, async (req, res) => {
    try {
        // Utilisez ownerId et voitureId pour créer l'objet de réservation
        const newBooking = createBookingAutobileObject(req.body);

        // Enregistrez la réservation dans la base de données
        const savedBooking = await newBooking.save();

        const automobileId = req.body.automobile; // Utilisez l'ID de l'automobile directement

        // Maintenant, récupérez les données de l'automobile à partir de la base de données
        const automobile = await Automobile.findById(automobileId);
        if (!automobile) {
            return res.status(404).json({ error: 'Automobile non trouvée.' });
        }

        // Récupérez l'ID du propriétaire de l'automobile
        const ownerId = automobile.owner;

        // Maintenant, récupérez les données du propriétaire en utilisant l'ID du propriétaire
        const owner = await User.findById(ownerId);
        if (!owner) {
            return res.status(404).json({ error: 'Propriétaire non trouvé.' });
        }

        // Maintenant, vous pouvez accéder aux données du propriétaire, y compris le nom
        const ownerName = owner.nom;
        const ownerEmail = owner.email;

        // Déterminez si c'est le matin (avant 12h) ou le soir
        const currentHour = new Date().getHours();
        let greeting = 'Bonjour'; // Par défaut, la salutation est "Bonjour"
        if (currentHour >= 12) {
            greeting = 'Bonsoir'; // Si l'heure est 12h ou plus tard, la salutation est "Bonsoir"
        }

        // Créer un transporteur SMTP pour envoyer des e-mails
        const transporter = nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            tls: {
                ciphers: 'SSLv3'
            },
            auth: {
                user: EMAIL,
                pass: PASSWORD
            }
        });

        // Envoyer un e-mail de bienvenue au propriétaire
        const mailOptions = {
            from: EMAIL,
            to: ownerEmail,
            subject: 'Nouvelle réservation sur Nomade',
            html: `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #fff;
                            }
                            .header {
                                background-color: #0078d4;
                                color: #fff;
                                padding: 10px 0;
                                text-align: center;
                            }
                            .content {
                                padding: 20px;
                            }
                            p {
                                font-weight: 500;
                            }
                            .signature {
                                margin-top: 20px;
                                text-align: center;
                                color: #313131;
                                padding: 10px
                            }
                        </style>
                    </head>
                    <body>
                        <div class "container">
                            <div class="header">
                                <h1>Nouvelle réservation</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} ${ownerName},</p>
                                <p>Vous avez reçu une nouvelle réservation de voiture sur Nomade.</p>
                                <p>Nous allons contacter l'interessé, discuter des détails de la réservation et vous faire le retour</p>
                            </div>
                            <div class="signature">
                                <p>Cordialement,</p>
                                <p>L'équipe de Nomade</p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
            } else {
                console.log('E-mail envoyé : ' + info.response);
            }
        });

        res.status(201).json(savedBooking); // Renvoyer la réservation enregistrée
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la soumission de la réservation.' });
    }
});


router.get('/mes-voitures-reservee', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;

        const reservations = await AutomobileBooking.find({}).populate('automobile').populate('owner').sort({ createdAt: 'desc' }).exec();
        const filteredReservations = reservations.filter(reservation => reservation.automobile.owner && reservation.automobile.owner._id && reservation.automobile.owner._id.toString() === userId);

        res.status(200).json(filteredReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de vos réservations.' });
    }
});


router.get('/ma-reservation-automobile', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;
        const reservations = await AutomobileBooking.find({}).populate('automobile').populate('owner').sort({ createdAt: 'desc' }).exec();
        const filteredReservations = reservations.filter(reservation => reservation.owner._id.toString() === userId);

        res.status(200).json(filteredReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de vos réservations.' });
    }
});

router.get('/carBookings', async (req, res) => {
    try {
        const bookings = await AutomobileBooking.find();
        res.status(200).json(bookings); // Renvoyer la liste des réservations
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réservations.' });
    }
});

// router.delete('/carBooking/:bookingId', verifyToken, async (req, res) => {
//     try {
//         const userId = req.userData.id;
//         const bookingId = req.params.bookingId;

//         // Vérifiez d'abord si la réservation existe
//         const reservation = await AutomobileBooking.findById(bookingId);

//         if (!reservation) {
//             return res.status(404).json({ message: 'La réservation n\'existe pas.' });
//         }

//         // Vérifiez si l'utilisateur a le droit de supprimer cette réservation
//         if (reservation.owner.toString() !== userId) {
//             return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette réservation.' });
//         }

//         // Supprimez la réservation de la base de données en utilisant deleteOne
//         await AutomobileBooking.deleteOne({ _id: bookingId });

//         // Renvoyez une réponse réussie
//         res.status(200).json({ message: 'La réservation a été supprimée avec succès.' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la réservation.' });
//     }
// });


router.delete('/carBooking/:bookingId', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;
        const bookingId = req.params.bookingId;

        // Vérifiez d'abord si la réservation existe
        const reservation = await AutomobileBooking.findById(bookingId);

        if (!reservation) {
            return res.status(404).json({ message: 'La réservation n\'existe pas.' });
        }

        // Vérifiez si l'utilisateur a le droit de supprimer cette réservation
        if (reservation.owner.toString() !== userId) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette réservation.' });
        }

        // Récupérez l'ID de la voiture réservée
        const carId = reservation.automobile;

        // Maintenant, récupérez les données de la voiture à partir de la base de données
        const car = await Automobile.findById(carId);

        // Vérifiez si la voiture existe
        if (!car) {
            return res.status(404).json({ message: 'Voiture non trouvée.' });
        }

        // Récupérez l'ID du propriétaire de la voiture
        const ownerId = car.owner;

        // Maintenant, récupérez les données du propriétaire en utilisant l'ID du propriétaire
        const owner = await User.findById(ownerId);

        // Vérifiez si le propriétaire existe
        if (!owner) {
            return res.status(404).json({ message: 'Propriétaire non trouvé.' });
        }

        // Maintenant, vous pouvez envoyer un e-mail au propriétaire pour l'informer de l'annulation de la réservation.
        const ownerEmail = owner.email;

        // Utilisez un transporteur SMTP pour envoyer l'e-mail
        const transporter = nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            tls: {
                ciphers: 'SSLv3'
            },
            auth: {
                user: EMAIL, // Remplacez par votre e-mail
                pass: PASSWORD // Remplacez par votre mot de passe
            }
        });

        // Envoyez un e-mail d'annulation au propriétaire
        const mailOptions = {
            from: EMAIL, // Remplacez par votre e-mail
            to: ownerEmail,
            subject: 'Annulation de réservation de voiture',
            html: `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #fff;
                            }
                            .header {
                                background-color: #ff3636;
                                color: #fff;
                                padding: 10px 0;
                                text-align: center;
                            }
                            .content {
                                padding: 20px;
                            }
                            p {
                                font-weight: 500;
                            }
                            .signature {
                                margin-top: 20px;
                                text-align: center;
                                color: #313131;
                                padding: 10px
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Réservation Annullée</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} Cher(e) ${owner.nom},</p>
                                <p>La réservation pour votre véhicule a été annulée par l'interessé.</p>
                                <p>Nous vous prions de nous excuser pour tout inconvénient que cela pourrait causer.</p>
                                <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
                            </div>
                            <div class="signature">
                                <p>Cordialement,</p>
                                <p>L'équipe de Nomade</p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
            } else {
                console.log('E-mail envoyé : ' + info.response);
            }
        });

        // Supprimez la réservation de la base de données en utilisant deleteOne
        await AutomobileBooking.deleteOne({ _id: bookingId });

        // Renvoyez une réponse réussie
        res.status(200).json({ message: 'La réservation de voiture a été supprimée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la réservation.' });
    }
});



module.exports = router;