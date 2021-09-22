// Custom includes
const Mongoose = require(`mongoose`);

// Role schema
const RoleSchema = Mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

// Role Model
const Role = Mongoose.model(`role`, RoleSchema);

/**
 * Method to create new role.
 * @param newRole
 * @param callback
 */
Role.createRole = (newRole, callback) => {
    Role.create(newRole, callback);
};

/**
 * Method to get user role id.
 * @param callback
 */
Role.getRole = (name, callback) => {
    Role.findOne({ name }, callback);
};

/**
 * Method to get admin role id.
 * @param callback
 */
Role.getAdminRoleId = callback => {
    Role.findOne({ name: `admin` }, callback);
};

// Export Role model
module.exports = Role;