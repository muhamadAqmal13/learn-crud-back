const Employee = require('../models/employee');

const createId = async () => {
    const dates = new Date();

    // Get 2 digit year
    const year = dates.getFullYear().toString();
    const _2DigitYears = year.slice(year.length - 2, year.length);

    // Get 2 digit month
    let month = (dates.getMonth() + 1).toString();
    if (month < 10) {
        month = `0${month}`;
    }

    // Get unix num
    let unix;
    const date = dates.getDate();
    if (date == 1) {
        return (unix = '0001');
    } else {
        const getLastCreated = await Employee.findOne().sort({ _id: -1 });
        if (getLastCreated == null) {
            unix = '0001';
        } else {
            const id = getLastCreated._id + 1;
            return id;
        }
    }

    const id = `${_2DigitYears}${month}${unix}`;
    return parseInt(id);
};

const addEmployee = async (req, res) => {
    try {
        const generateId = await createId();
        const data = {
            _id: generateId,
            ...req.body
        };

        const newData = new Employee(data);
        await newData.save();
        res.status(201).send({
            success: true,
            msg: 'Berhasil menambah karyawan',
            data: newData
        });
    } catch (err) {
        if (err.name == 'ValidationError') {
            let error = [];
            Object.keys(err.errors).forEach((key) => {
                error.push({ [key]: err.errors[key].message });
            });
            return res.status(400).send({
                success: false,
                msg: 'Data tidak valid',
                error
            });
        }
        console.log(err);
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    }
};

const detailEmployee = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).send({ success: false, msg: 'ID tidak valid' });
    }
    try {
        const findEmployee = await Employee.findOne({ _id: id });
        if (findEmployee == null && findEmployee.deleteFlag) {
            return res
                .status(400)
                .send({ success: false, msg: 'ID tidak valid' });
        }
        res.send({
            success: true,
            msg: 'Berhasil mendapatkan data',
            data: findEmployee
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { _id, ...newData } = req.body;

        const findEmployee = await Employee.findOne({ _id });
        if (findEmployee == null) {
            return res
                .status(400)
                .send({ success: false, msg: 'ID tidak valid' });
        }

        const update = await findEmployee.updateOne(newData, {
            runValidators: true
        });

        res.send({ success: true, msg: 'Berhasil mengubah data' });
    } catch (err) {
        if (err.name == 'ValidationError') {
            let error = [];
            Object.keys(err.errors).forEach((key) => {
                error.push({ [key]: err.errors[key].message });
            });
            return res.status(400).send({
                success: false,
                msg: 'Data tidak valid',
                error
            });
        }
        console.log(err);
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    }
};

const searchEmployee = async (req, res) => {
    try {
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 10;
        let sortBy = req.query.sort_by || 'id';
        let orderBy = req.query.order_by || 'desc';
        orderBy == 'asc' ? (orderBy = 1) : (orderBy = -1);
        sortBy == 'id' && (sortBy = '_id');
        let search = req.query.search || {};
        let total;

        let searchBy;
        if (typeof search == 'object') {
            searchBy == '';
        } else {
            !isNaN(parseInt(search)) ? (searchBy = 'id') : (searchBy = 'text');
        }

        let findEmployee = 1;
        let projection = { createdAt: 0, updatedAt: 0 };
        if (typeof searchBy == 'undefined') {
            total = await Employee.countDocuments();
            findEmployee = await Employee.find({
                $where: function() {
                    return this.deleteFlag != true
                }
            })
                .limit(limit)
                .skip(page * limit)
                .collation({ locale: 'en' })
                .sort({ [sortBy]: orderBy });
        } else if (searchBy == 'id') {
            findEmployee = await Employee.findOne({
                _id: parseInt(search)
            });
        } else {
            const args = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };

            total = await Employee.countDocuments(args);
            findEmployee = await Employee.find(args)
                .limit(limit)
                .skip(page * limit)
                .collation({ locale: 'en' })
                .sort({ [sortBy]: orderBy });
        }

        if (findEmployee.length == 0 && typeof searchBy === 'undefined') {
            return res.send({
                success: true,
                msg: 'Data masih kosong'
            });
        } else if (findEmployee.length == 0) {
            return res.status(400).send({
                success: false,
                msg: 'Data tidak ditemukan'
            });
        }

        res.send({
            success: true,
            msg: 'Berhasil mendapatkan data',
            search_by: searchBy,
            sort_by: sortBy,
            order_by: orderBy == 1 ? 'ascending' : 'descending',
            page: page + 1,
            total,
            limit,
            data: findEmployee
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const _id = parseInt(req.params.id);
        if (isNaN(_id)) {
            return res
                .status(400)
                .send({ succes: false, msg: 'ID karyawan tidak valid' });
        }

        const findEmployee = await Employee.findById(_id);
        if (findEmployee == null && findEmployee.deleteFlag) {
            return res
                .status(400)
                .send({ succes: false, msg: 'ID karyawan tidak ditemukan' });
        }

        const deleteOneEmployee = await findEmployee.updateOne({
            "deleteFlag": true
        });
        return res.send({
            success: true,
            msg: `Berhasil hapus ${deleteOneEmployee.name}`
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, msg: 'Something Went Wrong' });
    }
};

module.exports = {
    addEmployee,
    detailEmployee,
    updateEmployee,
    searchEmployee,
    deleteEmployee
};
