import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";


const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, )
}

//route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ success: false, message: "User doesn't exist" });
        }

        // // Log the plain-text and hashed password for debugging
        // console.log('Plain-text password:', password);
        // console.log('Hashed password from DB:', user.password);

        // Compare the plain-text password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            // Create a JWT token and send it to the user
            const token = createToken(user._id);
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// route for user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Checking if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        
        // Validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating new user with the hashed password
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword // Store hashed password here
        });
        
        const user = await newUser.save();

        // Create a token
        const token = createToken(user._id);

        res.json({
            success: true,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//route for admin login
const adminLogin = async (req,res) => {
    try {
        const { email, password } = req.body;
        
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            res.json({
                success: true,
                token
            });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
        }
            catch (error) {
                console.log(error);
                res.json({
                    success: false,
                    message: error.message
                });
            }
}


export {loginUser, registerUser, adminLogin}