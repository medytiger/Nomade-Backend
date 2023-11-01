const express = require('express');
const router = express.Router();
const HomeBookingModel = require('../models/HomeBooking'); // Assurez-vous que le chemin est correct
const Home = require('../models/Home');
const User = require('../models/User');
const Jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


// Déterminez s'il fait actuellement jour ou nuit
const currentHour = new Date().getHours();
let greeting = 'Bonjour';
if (currentHour >= 13) {
    greeting = 'Bonsoir';
}

const EMAIL = process.env.EMAIL
const PASSWORD = process.env.EMAIL_SECRET


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

const createBookingHomeObject = (data) => {
    const {
        owner,
        home,
        nom,
        numero,
        email,
        dateArrive,
        dateDepart,
        voiture,
        chauffeur
    } = data;

    return new HomeBookingModel({
        owner,
        home,
        nom,
        numero,
        email,
        dateArrive,
        dateDepart,
        voiture,
        chauffeur
    });
};

router.post('/homeBooking', async (req, res) => {
    try {
        const newBooking = createBookingHomeObject(req.body);

        // Enregistrez la réservation dans la base de données
        const savedBooking = await newBooking.save();

        const homeId = req.body.home; // Utilisez l'ID de la maison directement

        // Maintenant, récupérez les données de la maison à partir de la base de données
        const home = await Home.findById(homeId);
        if (!home) {
            return res.status(404).json({ error: 'Maison non trouvée.' });
        }

        // Récupérez l'ID du propriétaire de la maison
        const ownerId = home.owner;

        // Maintenant, récupérez les données du propriétaire en utilisant l'ID du propriétaire
        const owner = await User.findById(ownerId);
        if (!owner) {
            return res.status(404).json({ error: 'Propriétaire non trouvé.' });
        }

        // Maintenant, vous pouvez accéder aux données du propriétaire, y compris le nom
        const ownerName = owner.nom;
        const ownerEmail = owner.email;

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

        // Envoyer un e-mail de bienvenue à l'utilisateur
        const mailOptions = {
            from: EMAIL,
            to: ownerEmail,
            subject: 'Nouvelle réservation !',
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
                        <div class="container">
                            <div class="header">
                                <h1>Nouvelle réservation</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} ${ownerName},</p>
                                <p>Vous avez reçu une nouvelle réservation de maison sur Nomade.</p>
                                <p>Nous allons contacter l'interessé, discuter des détails de la réservation et vous faire le retour</p>                            </div>
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


router.get('/mes-maisons-reservee', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;
        const reservations = await HomeBookingModel.find({}).populate('home').populate('owner').exec();
        const filteredReservations = reservations.filter(reservation => reservation.home.owner._id.toString() === userId);

        res.status(200).json(filteredReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de vos réservations.' });
    }
});

// Route GET pour récupérer toutes les réservations de maison

router.get('/ma-reservation-maison', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;

        const reservations = await HomeBookingModel.find({}).populate('home').populate('owner').sort({ createdAt: 'desc' }).exec();
        const filteredReservations = reservations.filter(reservation => reservation.owner && reservation.owner._id && reservation.owner._id.toString() === userId);
        res.status(200).json(filteredReservations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de vos réservations.' });
    }
});


router.get('/homeBookings', async (req, res) => {
    try {
        const bookings = await HomeBookingModel.find();
        res.status(200).json(bookings); // Renvoyer la liste des réservations
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réservations.' });
    }
});

// router.delete('/homeBooking/:bookingId', verifyToken, async (req, res) => {
//     try {
//         const userId = req.userData.id;
//         const bookingId = req.params.bookingId;

//         // Vérifiez d'abord si la réservation existe
//         const reservation = await HomeBookingModel.findById(bookingId);

//         if (!reservation) {
//             return res.status(404).json({ message: 'La réservation n\'existe pas.' });
//         }

//         // Vérifiez si l'utilisateur a le droit de supprimer cette réservation
//         if (reservation.owner.toString() !== userId) {
//             return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette réservation.' });
//         }

//         // Supprimez la réservation de la base de données en utilisant deleteOne
//         await HomeBookingModel.deleteOne({ _id: bookingId });

//         // Renvoyez une réponse réussie
//         res.status(200).json({ message: 'La réservation a été supprimée avec succès.' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la réservation.' });
//     }
// });


router.delete('/homeBooking/:bookingId', verifyToken, async (req, res) => {
    try {
        const userId = req.userData.id;
        const bookingId = req.params.bookingId;

        // Vérifiez d'abord si la réservation existe
        const reservation = await HomeBookingModel.findById(bookingId);

        if (!reservation) {
            return res.status(404).json({ message: 'La réservation n\'existe pas.' });
        }

        // Vérifiez si l'utilisateur a le droit de supprimer cette réservation
        if (reservation.owner.toString() !== userId) {
            return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette réservation.' });
        }

        // Récupérez l'ID de la maison réservée
        const homeId = reservation.home;

        // Maintenant, récupérez les données de la maison à partir de la base de données
        const home = await Home.findById(homeId);

        // Vérifiez si la maison existe
        if (!home) {
            return res.status(404).json({ message: 'Maison non trouvée.' });
        }

        // Récupérez l'ID du propriétaire de la maison
        const ownerId = home.owner;

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
            subject: 'Annulation de réservation',
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
                                <p>La réservation pour votre maison a été annulée par l'interessé.</p>
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
        await HomeBookingModel.deleteOne({ _id: bookingId });

        // Renvoyez une réponse réussie
        res.status(200).json({ message: 'La réservation a été supprimée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la réservation.' });
    }
});



module.exports = router;