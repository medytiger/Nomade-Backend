const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const nodemailer = require('nodemailer');


const router = express.Router();

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'medias/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

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

router.post('/register', async (req, res) => {
    try {
        const {
            type,
            nom,
            nomEntreprise,
            email,
            password,
            prefixe,
            numero,
            genre,
            date,
            organisation,
            domaineActivite,
            lieu,
            descriptionActivite,
            photo,
        } = req.body;

        // Vérifier que le mot de passe est fourni
        if (!password) {
            return res.status(400).json({ error: 'Veuillez fournir un mot de passe.' });
        }

        // Vérifier si l'utilisateur avec cet e-mail existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Cet e-mail est déjà utilisé par un autre utilisateur.' });
        }

        //Cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer un nouvel utilisateur à partir des données
        const newUser = new User({
            type,
            nom,
            nomEntreprise,
            email,
            password: hashedPassword,
            prefixe,
            numero,
            genre,
            date,
            organisation,
            domaineActivite,
            lieu,
            descriptionActivite,
            photo,
        });

        // Sauvegarder le nouvel utilisateur dans la base de données
        const userDoc = await newUser.save();

        // Envoyer une réponse 201 Created
        res.status(201).json(userDoc);

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
            to: email,
            subject: 'Bienvenue sur Nomade !',
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
                            p{
                                font-weight: 500
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
                                <h1>Bienvenue sur Nomade !</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} ${req.body.nom},</p>
                                <p>Nous sommes ravis de vous accueillir sur Nomade ! En tant que membre de notre communauté, vous aurez accès à des fonctionnalités exclusives et à des ressources qui vous aideront à atteindre vos objectifs.</p>
                                <p>N'hésitez pas à nous contacter si vous avez des questions ou des préoccupations. Nous sommes là pour vous aider.</p>
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'utilisateur.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { loginEmail, loginPassword } = req.body;

        // Vérifier que l'adresse e-mail est fournie
        if (!loginEmail) {
            return res.status(400).json({ error: 'Veuillez fournir une adresse e-mail.' });
        }

        // Vérifier que le mot de passe est fourni
        if (!loginPassword) {
            return res.status(400).json({ error: 'Veuillez fournir un mot de passe.' });
        }

        // Récupérer l'utilisateur correspondant à l'email fourni
        const userDoc = await User.findOne({ email: loginEmail });

        // Vérifier que l'utilisateur existe
        if (!userDoc) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(loginPassword, userDoc.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Mot de passe incorrect.' });
        }

        // Créer un jeton JWT pour l'utilisateur connecté
        const token = jwt.sign({
            id: userDoc._id,
            loginEmail: userDoc.email
        }, process.env.JWT_SECRET);

        // Ajouter le jeton JWT à un cookie et renvoyer une réponse 200 OK
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json(userDoc);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la connexion.' });
    }
});

router.get('/profile', (req, res) => {
    const { token } = req.cookies;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
            if (err) {
                console.error("Erreur de vérification du token :", err);
                return res.status(401).json({ message: "Token invalide" });
            }

            try {
                const userDoc = await User.findOne({ _id: userData.id });
                if (!userDoc) {
                    return res.status(404).json({ message: "Utilisateur introuvable" });
                }
                res.json(userDoc);
            } catch (error) {
                console.error("Erreur lors de la recherche de l'utilisateur :", error);
                res.status(500).json({ message: "Erreur interne du serveur" });
            }
        });
    } else {
        res.json(null);
    }
});

router.post('/logout', (_, res) => {
    res.clearCookie('token').status(200).json({ message: 'Déconnexion réussie.' });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const userDoc = await User.findOne({ email: email });

        if (!userDoc) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        const password = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.updateOne({ email }, { password: hashedPassword });

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
            to: email,
            subject: 'Réinitialisation de votre mot de passe !',
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
                                <h1>Réinitialisation de mot de passe</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} ${userDoc.nom},</p>
                                <p>Nous vous envoyons ce mail contenant votre nouveau mot de passe pour vous permettre d'acceder à votre compte</p>
                                <p><strong>Nouveau mot de passe :</strong> ${password}</p>
                                <p>N'hésitez pas à nous contacter si vous avez des questions ou des préoccupations. Nous sommes là pour vous aider.</p>
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

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.json({ message: 'Email sent successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/users', async (_, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des utilisateurs.' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID utilisateur non valide.' });
        }

        const user = await User.findById(req.params.id);
        console.log('Utilisateur récupéré:', user); // Ajout de la log pour afficher l'utilisateur
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de l\'utilisateur.' });
    }
});

router.put('/profile/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = req.body;

        // Vérifiez si l'utilisateur a le droit de mettre à jour le profil
        if (userId !== req.userData.id) { // Utilisez req.userData.id ici
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce profil.' });
        }

        // Récupérez l'utilisateur actuel de la base de données
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        // Fusionnez les champs mis à jour dans l'objet de l'utilisateur actuel
        Object.assign(user, userData);

        // Enregistrez les modifications dans la base de données
        const updatedUser = await user.save();

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
    }
});

router.put('/profile/image/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const userId = req.params.id;
        const imagePath = req.file.path.replace(/\\/g, '/');
        const updatedUser = await User.findByIdAndUpdate(userId, { photo: imagePath }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'image de profil.' });
    }
});


router.delete('/user/:userId', verifyToken, async (req, res) => {
    try {
        const requestingUserId = req.userData.id // Récupère l'ID de l'utilisateur authentifié
        const userIdToDelete = req.params.userId; // Récupère l'ID de l'utilisateur à supprimer
        const loginEmail = req.userData.loginEmail;
        const userDoc = await User.findOne({ email: loginEmail });
        if (requestingUserId !== userIdToDelete) {
            // Vérifie que l'utilisateur authentifié a le droit de supprimer ce compte
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à effectuer cette action.' });
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

        // Envoyer un e-mail de bienvenue à l'utilisateur
        const mailOptions = {
            from: EMAIL,
            to: loginEmail,
            subject: 'Bienvenue sur Nomade !',
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
                            p{
                                font-weight: 500
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
                                <h1>Désolé de vous voir partir !</h1>
                            </div>
                            <div class="content">
                                <p>${greeting} ${userDoc.nom},</p>
                                <p>Nous sommes désolés de voir que vous avez choisi de supprimer votre compte Nomade. Pourriez-vous nous fournir les raisons de cette décision ? Vos commentaires sont importants pour nous et nous aident à améliorer nos services.</p>
                                <p>N'hésitez pas à nous contacter si vous avez des questions ou des préoccupations. Nous sommes là pour vous aider.</p>
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

        await User.findByIdAndDelete(userIdToDelete);
        res.status(200).json({ message: 'L\'utilisateur a été supprimé avec succès.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de l\'utilisateur.' });
    }
});


module.exports = router;