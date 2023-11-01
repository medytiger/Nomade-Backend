const express = require('express');
const path = require('path');
require('dotenv').config({ path: './.env' });
require('./config/mongoos.connect');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

const userRoutes = require('./routes/user.routes')
const homeRoutes = require('./routes/home.routes')
const automobileRoutes = require('./routes/automobile.routes')
const homeBookingRoutes = require('./routes/home.booking.routes')
const carBookingRoutes = require('./routes/automobile.booking.routes')
const homeComment = require('./routes/home.comment.routes')
const carComment = require('./routes/car.comment.routes')
const annonce = require('./routes/annonce.routes')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/medias', express.static(path.join(__dirname, 'medias')));
app.use(cors({
    origin: ['http://localhost:5173', 'http://example.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
}));

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


// Configuration du stockage pour les vidéos
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'medias/');
    },
    filename: function (req, file, cb) {
        const newName = Date.now() + path.extname(file.originalname); // Utilisez l'extension originale du fichier
        cb(null, newName);
    }
});

const uploadVideo = multer({
    storage: videoStorage
}).single('video');

// Fonction de téléchargement d'image à partir d'un lien
async function downloadImageFromLink(link, destinationDir) {
    const options = {
        url: link,
        dest: destinationDir,
    };
    try {
        const { filename } = await imageDownloader.image(options);

        // Renommer le fichier
        const newName = Date.now() + '.jpg';
        const newFilePath = path.resolve(destinationDir, newName);
        fs.renameSync(filename, newFilePath);

        return newName;
    } catch (err) {
        console.error(err);
        return null;
    }
}

app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;

    const destinationDir = path.join(__dirname, 'medias'); // Ajoutez cette ligne ici

    await downloadImageFromLink(link, destinationDir) // Modifiez cet appel en ajoutant destinationDir en tant que deuxième argument
        .then(filename => {
            if (filename) {
                res.json(filename);
            } else {
                res.status(400).json({ error: 'Impossible de télécharger l\'image à partir du lien fourni.' });
            }
        })
        .catch(error => {
            console.error(error);
            res.status(400).json({ error: 'Erreur lors du téléchargement de l\'image à partir du lien fourni.' });
        });
});

app.delete('/medias/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'medias', filename);

    // Vérifier si le fichier existe avant de le supprimer
    if (fs.existsSync(filePath)) {
        // Supprimer le fichier du dossier "medias"
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Une erreur s\'est produite lors de la suppression de l\'image.' });
            } else {
                res.json({ message: 'L\'image a été supprimée avec succès.' });
            }
        });
    } else {
        res.status(404).json({ error: 'Le fichier n\'existe pas.' });
    }
});


// Fonction de téléchargement d'image à partir de l'ordinateur
app.post('/upload-images', upload.array('images', 30), async (req, res) => {
    const filenames = await Promise
        .all(req.files.map(async file => {
            // Obtenir le nom original de l'image
            const originalName = file.originalname;

            // Générer un nouveau nom pour le fichier en utilisant Date.now() et le nom original
            const newName = Date.now() + originalName;

            // Chemin complet pour le nouveau fichier
            const newPath = path.join(__dirname, 'medias', newName);

            // Utiliser sharp pour convertir l'image en WebP et l'enregistrer
            await sharp(file.path)
                .toFormat('webp')
                .toFile(newPath);

            // Retourner le nouveau nom du fichier
            return newName;
        }));

    res.json(filenames);
});


// app.post('/upload-images', upload.array('images', 30), (req, res) => {
//     const filenames = req.files.map(file => {
//         // Obtenir le nom original de l'image
//         const originalName = file.originalname;

//         // Générer un nouveau nom pour le fichier en utilisant Date.now() et le nom original
//         const newName = Date.now() + originalName;

//         // Renommer le fichier et le déplacer vers le dossier "medias" avec le nouveau nom
//         fs.renameSync(file.path, path.join(__dirname, 'medias', newName));

//         // Retourner le nouveau nom du fichier
//         return newName;
//     });

//     res.json(filenames);
// });

app.post('/upload-video', (req, res) => {
    uploadVideo(req, res, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Une erreur s\'est produite lors du téléchargement de la vidéo.' });
        }

        const filename = req.file.filename;
        res.json({ filename });
    });
});

// Endpoint pour la suppression de vidéos
app.delete('/medias/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'medias', filename);

    try {
        // Vérifier si le fichier existe avant de le supprimer
        if (fs.existsSync(filePath)) {
            // Supprimer le fichier vidéo
            fs.unlinkSync(filePath);
            res.json({ message: 'La vidéo a été supprimée avec succès.' });
        } else {
            res.status(404).json({ error: 'Le fichier vidéo n\'existe pas.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la suppression de la vidéo.' });
    }
});

app.use('/', userRoutes);
app.use('/', homeRoutes);
app.use('/', automobileRoutes);
app.use("/", homeBookingRoutes);
app.use('/', carBookingRoutes);
app.use('/', homeComment);
app.use('/', carComment);
app.use('/', annonce);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Serveur démarré sur le port : ${process.env.PORT || 5000}`);
});