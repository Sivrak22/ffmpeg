const express = require('express');
const app = express();
const ytdl = require('ytdl-core');
const fs = require('fs');
const {} = require('./ffmpeg-utils.js');
const ffmpegutil = require('./ffmpeg-utils.js');
var router = express.Router();
router.get('/', function (req, res, next) {
    console.log('rputer calld')
    let url = "https://www.youtube.com/watch?v=3g_g7rujYZk";
    ytdl(url).pipe(fs.createWriteStream('./video.webm'));
    res.end();
})
router.get('/frame', async (req, res, next) => {
    console.log('rputer calld')
    let b = await ffmpegutil.getMetadata();
    console.log(JSON.parse(b));
    await ffmpegutil.getImgsPerSeconds('video.webm','1/4');
    res.end();
})
app.use(router);
app.listen(2222, () => {
    console.log('app listingin on 2222')
})

