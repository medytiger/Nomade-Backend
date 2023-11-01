const express = require('express');
const router = express.Router();
const Annonce = require('../models/Annonce');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const Home = require('../models/Home');
const Automobile = require('../models/Automobile');



const createAnnonceObject = (data) => {
    const {
        type,
        nom,
        email,
        numero,
        description,
        budget,
        lieu,
    } = data;

    return new Annonce({
        type,
        nom,
        email,
        numero,
        description,
        budget,
        lieu,
    });
};

const EMAIL = process.env.EMAIL
const PASSWORD = process.env.EMAIL_SECRET

// Déterminez s'il fait actuellement jour ou nuit
const currentHour = new Date().getHours();
let greeting = 'Bonjour';
if (currentHour >= 13) {
    greeting = 'Bonsoir';
}

router.post('/annonce', async (req, res) => {
    try {
        const nouvelleAnnonce = createAnnonceObject(req.body);

        await nouvelleAnnonce.save();

        res.status(201).json({ message: 'Annonce ajoutée avec succès' });

        try {
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
            const mailOptions = {
                from: EMAIL,
                to: req.body.email,
                subject: 'Votre annonce sur Nomade !',
                html: `
                    <html>
                        <head>
                            <style>
                                /* Styles CSS ici */
                                body {
                                    font-family: Arial, sans-serif;
                                    background-color: #f4f4f4;
                                    margin: 0;
                                    padding: 0;
                                    font-weight: 600;
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
                                .signature {
                                    margin-top: 20px;
                                    text-align: center;
                                    color: #313131;
                                    padding: 10px;
                                }
                                p{
                                    font-weight: 500
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Excellente decision !</h1>
                                </div>
                                <div class="content">
                                    <p>${greeting} ${req.body.nom},</p>
                                    <p>Vous avez pris une excellente décision en rejoignant notre communauté Nomade. Nous sommes là pour vous aider à trouver les biens que vous recherchez.</p>
                                    <p>Votre annonce a été enregistrée et notre équipe se mettra au travail pour vous trouver des biens correspondant à vos critères.</p>
                                    <p>N'hésitez pas à nous contacter si vous avez des questions, des préoccupations ou si vous avez besoin d'assistance pour toute autre demande.</p>
                                    <p>Nous vous remercions de faire partie de la communauté Nomade et nous avons hâte de vous fournir un excellent service.</p>
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
                    console.log('E-mail envoyé');
                }
            });

        } catch (error) {
            console.error(error);
        }

        try {
            // Récupérez la liste des utilisateurs
            const utilisateurs = await User.find({});

            // Créez une tableau de Promises pour l'envoi asynchrone des e-mails
            const emailPromises = utilisateurs.map(async (utilisateur) => {
                // Vérifiez si l'utilisateur possède des biens immobiliers
                const biensImmobilier = await Home.find({ owner: utilisateur._id });

                // Vérifiez si l'utilisateur possède des biens automobiles
                const biensAutomobile = await Automobile.find({ owner: utilisateur._id });

                // Si l'utilisateur a au moins un bien immobilier ou automobile, envoyez-lui un e-mail
                if (biensImmobilier.length > 0 || biensAutomobile.length > 0) {
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

                    const mailOptions = {
                        from: EMAIL,
                        to: utilisateur.email,
                        subject: 'Nouvelle recherche sur Nomade !',
                        html: `
                            <html>
                                <head>
                                    <style>
                                        /* Styles CSS ici */
                                        body {
                                            font-family: Arial, sans-serif;
                                            background-color: #e6e6e6;
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
                                        .content p{
                                            font-weight: 500
                                        }
                                        .content li{
                                            font-weight: 500
                                        }
                                        .signature {
                                            margin-top: 20px;
                                            text-align: center;
                                            color: #313131;
                                            padding: 10px;
                                        }
                                        p{
                                            font-weight: 500
                                        }
                                        li{
                                            font-weight: 500
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="header">
                                            <h1>Recherche sur Nomade !</h1>
                                        </div>
                                        <div class="content">
                                            <p>${greeting} ${utilisateur.nom},</p>
                                            <p>L'un de nos utilisateurs recherche :</p>
                                            <ul>
                                                <li>Desrciption: ${nouvelleAnnonce.description}</li>
                                                <li>Avec un budget de : ${nouvelleAnnonce.budget} XOF</li>
                                                <li>Zone de recherche : ${nouvelleAnnonce.lieu}</li>
                                            </ul>
                                            <p>Veillez nous contacter si vous avez le bien recherché au +2250706223380 ou au konateahmed14@outlook.com</p>
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

                    return new Promise((resolve, reject) => {
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            });

            // Attendre l'achèvement de toutes les Promises
            await Promise.all(emailPromises);
        } catch (error) {
            console.error(error);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Une erreur est survenue lors de l\'ajout de annonce' });
    }
});


router.get('/annonces', async (req, res) => {
    try {
        const annonces = await Annonce.find();
        res.status(200).json(annonces);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Une erreur est survenue lors de la récupération des annonces' });
    }
});


module.exports = router;