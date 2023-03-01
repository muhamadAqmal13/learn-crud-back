const Employee = require('../models/employee');

const createId = async () => {
    const lastId = await Employee.findOne().sort({_id: -1})
    let unix = 1
    if(lastId) {
        const lastMonth = parseInt(lastId.toString().slice(2,4))
        const currentMonth = new Date().getMonth() + 1
        if(lastMonth === currentMonth) {
          unix = parseInt(lastId.toString().slice(4,8)) + 1
        }
    }
  
    const date = new Date();
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    return parseInt(`${year}${month}${unix.toString().padStart(4, "0")}`)
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
        const findEmployee = await Employee.findOne({ _id: id, deleteFlag: false });
        if (!findEmployee) {
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

        const findEmployee = await Employee.findOne({ _id, deleteFlag: false });
        if (!findEmployee) {
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
                deleteFlag: false
            })
                .limit(limit)
                .skip(page * limit)
                .collation({ locale: 'en' })
                .sort({ [sortBy]: orderBy });
        } else if (searchBy == 'id') {
            findEmployee = await Employee.findOne({
                _id: parseInt(search),
                deleteFlah: false
            });
        } else {
            const args = {
                $and: [
                    {$or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]},
                    {deleteFlag: false}
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

        const findEmployee = await Employee.findOne({_id, deleteFlag: false});
        if (!findEmployee) {
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
