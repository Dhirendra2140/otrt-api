
// This file will contain secrets related to various third-party services.

module.exports = {
    jwtSecret: 'tudip-token',
    // Access control configuration for client
    // https://www.w3.org/TR/2008/WD-access-control-20080912
    allowedOrigins: '*',
    allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Cache-Control, Content-Type, Accept, token',
    exposedHeaders: 'Cache-Control, Content-Type, Accept, token',
    preFlightRequestMaxAge: '1728000'
};
