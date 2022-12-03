const express = require('express');
const router = express.Router();
const https = require('https');
const { promisify } = require('util');
const s3 = require('@auth0/s3');
const multer = require('multer');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');
const Media = require('../models/Media');

const upload = multer({ dest: '../uploads/' });
const s3Client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        endpoint: process.env.S3_ENDPOINT,
    },
});

router.post('/upload', upload.single('file'), async (req, res) => {
    if (req.file.mimetype != 'image/jpeg' && req.file.mimetype != 'image/png' && req.file.mimetype != 'image/gif') {
        await unlinkAsync(req.file.path);
        return res.send({
            error: true,
            message: 'uploaded media must be jpeg or png image or gif',
        });
    } else {
        const newMedia = new Media({ mimetype: req.file.mimetype });
        await newMedia.save();
        const newfilename =
            newMedia._id.toString() + path.extname(req.file.originalname);
        const params = {
            localFile: req.file.path,
            s3Params: {
                Bucket: 'media',
                Key: newfilename,
            },
        };
        const uploader = s3Client.uploadFile(params);
        uploader.on('error', async function (err) {
            console.error('unable to upload:', err.stack);
            await unlinkAsync(req.file.path);
            return res.send({ error: true, message: 'unable to upload media' });
        });
        uploader.on('end', async function () {
            await unlinkAsync(req.file.path);
            newMedia.url =
                'https://media.bkmj-storage.us-nyc1.upcloudobjects.com/' +
                newfilename;
            await newMedia.save();
            return res.send({ mediaid: newMedia._id.toString() });
        });
    }
});

router.get('/access/:mediaid', async (req, res) => {
    const media = await Media.findById(req.params.mediaid);
    if (!media) {
        return res.send({
            error: true,
            message: 'no media found with provided mediaid',
        });
    } else {
        https.get(media.url, (httpres) => {
            res.type(media.mimetype);
            httpres.pipe(res);
        });
    }
});

module.exports = router;