const Category = require('../models/Category');
const Service = require('../models/Service');

exports.createCategory = async (req, res) => {
  try {
    const { name, displayName } = req.body;
    if (!name || !displayName) {
      return res.status(400).json({ success: false, message: 'Name and displayName are required' });
    }
    const category = await Category.create({ name, displayName });
    res.status(201).json({ success: true, data: { category } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort('displayName');
  res.status(200).json({ success: true, data: { categories } });
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    // Check if there are services using this category
    const servicesCount = await Service.countDocuments({ category: id });
    if (servicesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category "${category.displayName}". It has ${servicesCount} service(s) associated with it. Please reassign or delete the services first.` 
      });
    }
    
    await Category.findByIdAndDelete(id);
    res.status(200).json({ 
      success: true, 
      message: `Category "${category.displayName}" deleted successfully` 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}; 