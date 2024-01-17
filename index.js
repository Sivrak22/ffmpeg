const express = require('express');
const app = express();
const ytdl = require('ytdl-core');
const fs = require('fs');
const {} = require('./ffmpeg-utils.js');
const ffmpegutil = require('./ffmpeg-utils.js');
const s3util = require("./s3-utils.js");
const uuid = require("uuid");
var router = express.Router();
var bodyParser = require('body-parser');
app.use(bodyParser.json())
router.get('/', function (req, res, next) {
    console.log('rputer calld')
    let url = "https://www.youtube.com/watch?v=3g_g7rujYZk";
    let filename = uuid.v4();
    ytdl(url).pipe(fs.createWriteStream('./'+filename+'.webm'));
    res.end();
})
router.get('/ids', async function (req, res, next) {
    console.log('rputer calld')
    let data = await s3util.getDynamoDbData();
    res.json(data);
})
router.get('/frame', async (req, res, next) => {
    console.log('rputer calld')
    let b = await ffmpegutil.getMetadata();
    console.log(JSON.parse(b));
    let id = req.query.id;
    let directoryPath = './tmpData/'+id;
    if (!fs.existsSync(directoryPath)) {
        await fs.mkdirSync(directoryPath);
        console.log('Directory created successfully.');
      } else {
        console.log('Directory already exists.');
      }
      await ffmpegutil.getImgsPerSeconds(id+'.webm','1/14',id);
    let s3paths = await s3util.uploadAllFileToS3(directoryPath,'imagesdestination');
    let analysisData = await s3util.analyseImgFromS3(s3paths,'imagesdestination');
    let val = {"Openlock@1st": id, frames:s3paths,metadata:JSON.parse(b), analysisData};
    s3util.putDataToDoc(val);
    res.json(val);
})
app.use(router);
app.listen(2222, () => {
    console.log('app listingin on 2222')
})


