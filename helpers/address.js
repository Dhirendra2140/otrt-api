const request = require(`request`);

module.exports = {

    /**
     * Method get location from latitude and longitude.
     * @param latitude
     * @param longitude
     * @returns {*|Promise}
     */
    getLocationAddress: (latitude, longitude) => new Promise((resolve, reject) => {
        request.get({
            url: `http://dev.virtualearth.net/REST/v1/Locations/${latitude},${longitude}?o=json&key=${config.bingMapsKey}`
        }, (error, response, body) => {
            if (error) {
                reject(error);
            } else if (!error && response.statusCode === 200) {
                const addressData = JSON.parse(body);
                if (addressData.resourceSets && addressData.resourceSets[0].estimatedTotal >= 1) {
                    const address = addressData.resourceSets[0].resources[0].address;
                    resolve(address);
                }
            }
        });
    })

};