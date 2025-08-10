module.exports = (sequelize, DataTypes) => {
    const DocumentFormat = sequelize.define('DocumentFormat', {
        document_type: { 
            type: DataTypes.ENUM('abstract', 'report', 'ppt'), // Define the document types
            allowNull: false 
        },
        department: { 
            type: DataTypes.ENUM('Cyber Security', 'AI/Robotics', 'Blockchain'), // Fixed departments
            allowNull: false 
        },
        semester: { 
            type: DataTypes.INTEGER, // Store semester as an integer (1-8)
            allowNull: false 
        },
        file_format: { 
            type: DataTypes.STRING, 
            allowNull: false // e.g., 'pdf', 'pptx'
        },
        document_url: { // New field for the document URL
            type: DataTypes.STRING,
            allowNull: false // Ensure this is required
        }
    });

    return DocumentFormat;
};