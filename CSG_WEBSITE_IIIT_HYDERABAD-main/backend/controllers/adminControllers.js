const Image = require('../models/Image');
const FacultyImage = require('../models/FacultyImage');
const Publication = require('../models/Publication');
const FocusSevenPublication = require('../models/FocusSevenPublication');
const Admin = require('../models/Admin');
const Project = require('../models/Project');
const fs = require('fs').promises;
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const csv = require('fast-csv');
const csvParser = require('csv-parser');
const { initializeImageServer, initializePublicationServer, initializeProjectServer, initializeFacultyServer, initializeFocusSevenPublicationServer } = require('../initServer');



// Function to handle image upload
const handleImageUpload = async (req, res) => {
  try {
    // Multer configuration for file upload
    const storage = multer.diskStorage({
      destination: './uploads/students/',
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      },
    });

    const upload = multer({
      storage: storage,
      limits: { fileSize: 10000000 }, // 10MB limit
    }).single('image');

    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading image:', err);
        return res.status(500).json({ error: 'Error uploading image' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, description } = req.body;

      console.log('Image upload details:', {
        imageUrl: req.file.filename,
        title: title,
        description: description,
      });

      const newImage = new Image({
        imageUrl: req.file.filename,
        title: title,
        description: description,
      });

      console.log('New Image Object:', newImage);

      const savedImage = await newImage.save();

      // Append new image data to imageData.csv
      const imageDataCsvPath = './data/imageData.csv';
      const imageDataCsvRow = `${savedImage.imageUrl}#${savedImage.title}#${savedImage.description}\n`;

      await fs.appendFile(imageDataCsvPath, imageDataCsvRow);

      console.log('Image data appended to CSV:', {
        imageUrl: savedImage.imageUrl,
        title: savedImage.title,
        description: savedImage.description,
      });

      res.json({
        message: 'Image uploaded successfully',
        imageUrl: savedImage.imageUrl,
        title: savedImage.title,
        description: savedImage.description,
      });
    });
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const handleFacultyUpload = async (req, res) => {
  try {
    const storage = multer.diskStorage({
      destination: './uploads/faculty/',
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      },
    });

    const upload = multer({
      storage: storage,
      limits: { fileSize: 10000000 }, // 10MB limit
    }).single('file'); // Update with the correct field name

    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading image:', err);
        return res.status(500).json({ error: 'Error uploading image' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, description } = req.body;

      console.log('Image upload details:', {
        imageUrl: req.file.filename,
        title: title,
        description: description,
      });

      const newImage = new FacultyImage({
        imageUrl: req.file.filename,
        title: title,
        description: description,
      });

      console.log('New Image Object:', newImage);

      const savedImage = await newImage.save();

      const imageDataCsvPath = './data/facultyData.csv';
      const imageDataCsvRow = `${savedImage.imageUrl}#${savedImage.title}#${savedImage.description}\n`;

      await fs.appendFile(imageDataCsvPath, imageDataCsvRow);

      console.log('Image data appended to CSV:', {
        imageUrl: savedImage.imageUrl,
        title: savedImage.title,
        description: savedImage.description,
      });

      res.json({
        message: 'Image uploaded successfully',
        imageUrl: savedImage.imageUrl,
        title: savedImage.title,
        description: savedImage.description,
      });
    });
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const handleAddFocusSevenPublication = async (req, res) => {
  try {
    const { title, author, link, index } = req.body;

    console.log('FocusSevenPublication details:', { title, author, link, index });

    if (!title || !author || !link || !index) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the publication with the given index in MongoDB
    let existingPublication = await FocusSevenPublication.findOne({ index });

    if (!existingPublication) {
      return res.status(400).json({ error: 'Publication not found for the given index' });
    }

    // Update the existing publication in MongoDB
    existingPublication.title = title;
    existingPublication.author = author;
    existingPublication.link = link;

    // Save/update the publication in MongoDB
    const savedPublication = await existingPublication.save();

    console.log('FocusSevenPublication updated:', {
      title: savedPublication.title,
      author: savedPublication.author,
      link: savedPublication.link,
    });

    // Update the CSV file
    const publicationCsvPath = './data/focusSevenPublication.csv';
    const csvData = await fs.readFile(publicationCsvPath, 'utf-8');
    const rows = csvData.split('\n');

    // Update the CSV row based on the provided index
    if (index <= rows.length) {
      rows[index] = `${savedPublication.index}#${savedPublication.title}#${savedPublication.author}#${savedPublication.link}`;
      await fs.writeFile(publicationCsvPath, rows.join('\n'));
    } else {
      // Handle the case where the index is greater than the number of rows in CSV
      return res.status(400).json({ error: 'Invalid index for updating CSV' });
    }

    console.log('FocusSevenPublication data updated in CSV:', {
      title: savedPublication.title,
      date: savedPublication.date,
      description: savedPublication.description,
    });

    res.json({ message: 'FocusSevenPublication added/updated successfully', publication: savedPublication });
  } catch (error) {
    console.error('Error updating FocusSevenPublication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};








// Function to handle adding a new project
const handleAddProject = async (req, res) => {
  try {
    const { title, faculty, companyfund, date, summary } = req.body;

    console.log('Project details:', {
      title: title,
      faculty: faculty,
      companyfund: companyfund,
      date: date,
      summary: summary,
    });

    if (!title || !faculty || !companyfund || !date || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProject = new Project({
      title,
      faculty,
      companyfund,
      date,
      summary,
    });

    console.log('New Project Object:', newProject);

    const savedProject = await newProject.save();

    // Append new project data to projects.csv
    const projectsCsvPath = './data/projectData.csv';
    const projectCsvRow = `${savedProject.title}#${savedProject.faculty}#${savedProject.companyfund}#${savedProject.date}#${savedProject.summary}\n`;

    await fs.appendFile(projectsCsvPath, projectCsvRow);

    console.log('Project data appended to CSV:', {
      title: savedProject.title,
      faculty: savedProject.faculty,
      companyfund: savedProject.companyfund,
      date: savedProject.date,
      summary: savedProject.summary,
    });

    res.json({ message: 'Project added successfully', project: savedProject });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('Received login request:', { username, password, hashedPassword });

    // Fetch admin from the database based on the provided username
    const admin = await Admin.findOne({ username });

    console.log('Retrieved admin from the database:', admin);

    if (admin && bcrypt.compareSync(password, admin.password)) {
      console.log('Password is correct. Generating JWT token.');
      const secretKey = process.env.JWT_SECRET
      const token = jwt.sign("admin", secretKey);

      console.log('JWT token generated:', token);

      res.json({ token });
    } else {
      console.log('Authentication failed. Sending 401 status.');
      res.sendStatus(401);
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





const handleAddPublication = async (req, res) => {
  try {
    const { title, date, description } = req.body;

    console.log('Publication details:', {
      title: title,
      date: date,
      description: description,
    });

    if (!title || !date || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPublication = new Publication({
      title,
      date,
      description,
    });

    console.log('New Publication Object:', newPublication);

    const savedPublication = await newPublication.save();

    // Append new publication data to publication.csv
    const publicationCsvPath = path.join(__dirname, '../data', 'publication.csv');
    const publicationCsvRow = `${savedPublication.title}#${savedPublication.date}#${savedPublication.description}\n`;

    await fs.appendFile(publicationCsvPath, publicationCsvRow);

    console.log('Publication data appended to CSV:', {
      title: savedPublication.title,
      date: savedPublication.date,
      description: savedPublication.description,
    });

    await sortCsvByDateDescending();
    await initializePublicationServer();
    res.status(201).json({
      message: 'Publication added successfully',
      publication: savedPublication,
    });

  } catch (error) {
    console.error('Error adding publication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const sortCsvByDateDescending = async () => {
  const publicationCsvPath = path.join(__dirname, '../data', 'publication.csv');

  try {
    // Read the CSV file
    const csvData = await fs.readFile(publicationCsvPath, 'utf-8');

    // Parse the CSV data
    const rows = csvData
      .trim()
      .split('\n')
      .map((row) => row.split('#'));

    // Log parsed rows and dates before sorting
    console.log("Parsed Rows and Dates Before Sorting: ");
    rows.forEach(row => {
      console.log(row[1]); // Log the date column for each row
    });

    // Sort the rows based on the second column (date) in descending order
    const sortedRows = rows.sort((a, b) => new Date(b[1]) - new Date(a[1]));

    // Log sorted dates after sorting
    console.log("Sorted Dates After Sorting: ");
    sortedRows.forEach(row => {
      console.log(row[1]); // Log the date column for each sorted row
    });


    // Join the sorted rows back into a CSV-formatted string
    const sortedCsvData = sortedRows.map((row) => row.join('#')).join('\n') + '\n';
    // console.log("sorted CSV is ////////////////////////////////////////////////  \n" + sortedCsvData);
    // console.log("////////////////////////////////////////////////////////////////////////  \n");
    // Overwrite the existing CSV file with the sorted data
    await fs.writeFile(publicationCsvPath, sortedCsvData, 'utf-8');

    console.log('CSV file sorted by date in descending order.');
  } catch (error) {
    console.error('Error sorting CSV file:', error);
  }
};



module.exports = { handleImageUpload, handleFacultyUpload, handleAddPublication, handleAddProject, handleAddFocusSevenPublication, handleLogin };
