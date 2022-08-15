const express = require('express');
const {
    addEmployee,
    detailEmployee,
    updateEmployee,
    searchEmployee,
    deleteEmployee
} = require('../controllers/employee');
const router = express.Router();

router.post('/add-employee', addEmployee);
router.get('/detail-employee/:id', detailEmployee);
router.patch('/update-employee', updateEmployee);
router.get('/employees', searchEmployee);
router.delete('/delete-employee/:id', deleteEmployee);

module.exports = router;
