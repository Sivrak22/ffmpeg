const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const docClient = new AWS.DynamoDB.DocumentClient();

async function uploadFile(filePath, bucketName) {
    const fileContent = fs.readFileSync(filePath);
  
    const params = {
      Bucket: bucketName,
      Key: path.basename(filePath),
      Body: fileContent,
      ACL:'public-read'
    };
  
    let resp = await s3.upload(params).promise();
    console.log(`File uploaded successfully: ${filePath}`);
    return(resp);
  }

  async function uploadFolder(folderPath, bucketName) {
    const files = fs.readdirSync(folderPath);
    let resp = [];
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        await uploadFolder(filePath, bucketName); 
      } else {
        let d = await uploadFile(filePath, bucketName);
        resp.push(d);
      }
    }
    return resp;
  }
  
  async function analyzeImage(imageFileName,bucketName) {
    const params = {
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: imageFileName,
        },
      },
    };
  
    try {
      const result = {};
      result.label = await rekognition.detectLabels(params).promise();
      result.celebrityData = await rekognition.recognizeCelebrities(params).promise();
      console.log(`Analysis result for ${imageFileName}:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`Error analyzing ${imageFileName}:`, error.message);
      return {};
    }
  }
  
async function analyseImgFromS3(imgList,bucketName){
    let respList = [];
    for (const imageFileName of imgList) {
        let tmp = await analyzeImage(imageFileName.Key,bucketName);
        respList.push(tmp);
      }
    return respList;
}

async function putDataToDoc(data){
  const params = {
    TableName: 'myDb',
    Item: data,
  };
  return new Promise((res,rej)=>{
    docClient.put(params, (err, data) => {
      if (err) {
        console.error('Error saving data to DynamoDB', err);
        rej({});
      } else {
        console.log('Data saved successfully', data);
        res(data);
      }
    });
  })
}

async function getDynamoDbData(){
  return new Promise((res,rej)=>{
    const params = {
      TableName: "myDb"
  };
  docClient.scan(params, (err, data) => {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
          rej();
      } else {
          console.log("Scan succeeded.");
          res(data);
      }
  });
  })
}
  
exports.getDynamoDbData = getDynamoDbData;
exports.uploadFileToS3 = uploadFile;
exports.uploadAllFileToS3 = uploadFolder;
exports.analyseImgFromS3 = analyseImgFromS3;
exports.putDataToDoc = putDataToDoc;