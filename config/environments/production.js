// All the app configuration values should be added here.
// All the app configuration values should be added here.
const dbHost = `localhost`,
  dbPort = `27017`,
  dbName = `getoutside`,
  dbUsername = `getoutside`,
  dbPassword = `g3t0ut5!de`;

module.exports = {
  apiVersion: `v1`,
  server: `dev`,
  host: `http://localhost:3005`, //Add the domain name or domain ip once this code will be on server.
  dev: {
    host: `http://localhost`,
    port: 3005
  },
  uploads: {
    profileImageURL: `/public/images/profiles/` // Profile upload destination path
  },
  database: {
    host: `localhost`,
    port: `27017`,
    dbName: `getoutside`,
    username: `getoutside`,
    password: `g3t0ut5!de`
  },

  // dbURL: `mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
  dbURL: `mongodb://${dbHost}:${dbPort}/${dbName}`,


  mailServer: {
    user_id: `radheyradhey98765@gmail.com`,
    password: `tudip123456`
  },

  gMailServer: {
    user_id: `radheyradhey98765@gmail.com`,
    password: `tudip123456`
  },

  excludedRoutes: [
    `/users/login`,
    `/users/signup`,
    `/users/verifyToken`,
    `/users/forgotPassword`,
    `/users/generateCode`
  ],

  appLinks: {
    iPhone: `YOUR_iOS_APP_APPSTORE_LINK`,
    android: `YOUR_ANDROID_APP_PLAYSTORE_LINK`
  },

  fcmKey: `YOUR_FCM_KEY_FOR_SENDING_PUSH_NOTIFICATION_ON_ANDROID_DEVICE`,

  apiKey: {
    iOS: `3c4afb4fd46352977647e980f67b7456`,
    android: `1b0b3ff9876a5bf1d33f9767a7489a6f`,
    web: `d71a0600eb536f75c2d6de65f18628b5`
  },

  winstonConfig: {
    "statusCode": ":statusCode",
    "method": ":method",
    "url": ":url[pathname]",
    "responseTime": ":responseTime",
    "ip": "ip",
    "userAgent": "userAgent"
  },

  //Bing constants
  bingMapsKey: `YOUR_BING_MAPS_KEY`,

  //Twilio Credentials
  twilioAccountSid: `YOUR_TWILIO_ACCOUNT_SID`,
  twilioAuthToken: `YOUR_TWILIO_AUTH_TOKEN`,

  pageNumber: 1,
  pageSize: 15,

  // Winston config
  logDir: 'log',
  winstonErrorFile: 'log/error.log',
  winstonDatePattern: "yyyy-MM-dd",
  winstonLevel: {
    info: "info",
    error: "error",
    debug: "debug",
    warn: "warn"
  }
};