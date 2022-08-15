const { Schema, model } = require('mongoose');
const { isEmail } = require('validator');

const employeeSchema = new Schema(
    {
        _id: {
            type: Number
        },
        email: {
            type: String,
            required: [true, 'Email harus diisi'],
            lowercase: true,
            validate: [isEmail, 'Email tidak valid']
        },
        name: {
            type: String,
            required: [true, 'Nama harus diisi']
        },
        mobile: {
            type: String,
            required: [true, 'Mobile harus diisi']
        },
        birthday: {
            type: String,
            required: [true, 'Birthday harus diisi']
        },
        address: {
            type: String,
            required: [true, 'Address harus diisi']
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = model('Employee', employeeSchema);
