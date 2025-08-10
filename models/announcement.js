module.exports = (sequelize, DataTypes) => {
    const Announcement = sequelize.define('Announcement', {
        title: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        description: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        role: { 
            type: DataTypes.ENUM('student', 'mentor'), // Define the roles
            allowNull: false 
        },
        semester: { 
            type: DataTypes.INTEGER, // This can be 1 to 8
            allowNull: false 
        },
        department: { 
            type: DataTypes.ENUM('Cyber-Security', 'AI/ROBOTICS', 'AI/ML', 'BLOCKCHAIN'), // Fixed departments
            allowNull: false 
        }
    });

    return Announcement;
};