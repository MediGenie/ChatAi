const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const s3 = new S3Client({ apiVersion: "2006-03-01", region: "ap-northeast-2" });
const NAME_OF_BUCKET = "influencer-medigenie-ai"; // <-- Use your bucket name here

const singleFileUpload = async ({ file, public = false }) => {
  const { originalname, buffer } = file;
  const path = require("path");

  const Key = new Date().getTime().toString() + path.extname(originalname);
  const uploadParams = {
    Bucket: NAME_OF_BUCKET,
    Key: public ? `public/${Key}` : Key,
    Body: buffer
  };

  const command = new PutObjectCommand(uploadParams);
  const result = await s3.send(command);

  return public ? `https://${NAME_OF_BUCKET}.s3.amazonaws.com/${uploadParams.Key}` : uploadParams.Key;
};

const multipleFilesUpload = async ({files, public = false}) => {
  return await Promise.all(
    files.map((file) => {
      return singleFileUpload({file, public});
    })
  );
};

const retrievePrivateFile = async (key) => {
  if (key) {
    const command = new GetObjectCommand({
      Bucket: NAME_OF_BUCKET,
      Key: key
    });

    try {
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // Expires in 1 hour
      return url;
    } catch (error) {
      console.error("Error generating signed URL", error);
      return null;
    }
  }
  return null;
};

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const singleMulterUpload = (nameOfKey) =>
  multer({ storage: storage }).single(nameOfKey);
const multipleMulterUpload = (nameOfKey) =>
  multer({ storage: storage }).array(nameOfKey);

module.exports = {
  s3,
  singleFileUpload,
  multipleFilesUpload,
  retrievePrivateFile,
  singleMulterUpload,
  multipleMulterUpload
};
